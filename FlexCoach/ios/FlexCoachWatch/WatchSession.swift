import Foundation
import WatchConnectivity
import WatchKit

/// The Watch's side of the running workout (v1 #6): the phone sends the same state the Live Activity shows
/// (ios/FlexCoach/WatchBridge.swift); the buttons send back the Island's commands. A button flips the screen at once,
/// as the Island's do, and the phone's next update settles it. When a rest runs out on the wrist, the Watch taps
/// and says "Rest over" on the next set.
/// The finished workout's numbers from the phone, for the done screen.
struct WatchDone: Equatable {
  let durationSec: Int
  let sets: Int
  let volume: String?
  let records: Int
}

/// One of the workout's exercises, as a page to swipe to.
struct WatchExercise: Identifiable, Equatable {
  let id: String
  let name: String
  let done: Bool
}

@MainActor
final class WatchSession: NSObject, ObservableObject {
  static let shared = WatchSession()

  @Published private(set) var workoutName: String?
  @Published private(set) var state: WorkoutActivityState?
  /// The workout's exercises in order, and which one the set shown belongs to (owner, 2026-10-24: swipe between them).
  @Published private(set) var exercises: [WatchExercise] = []
  @Published private(set) var exerciseIndex: Int?
  @Published private(set) var done: WatchDone?
  /// Finish was tapped: waiting for the phone's summary.
  @Published private(set) var finishing = false
  /// What shows with no workout running: the phone's Workout tab in small (v1 #6, step 4). Nil until the phone sends it.
  @Published private(set) var home: WatchHome?
  /// A start tapped here, waiting for the phone to start it; `failed` when the phone could not be reached.
  @Published private(set) var starting: WatchStarting?
  /// The phone's answer to the last search.
  @Published private(set) var search: WatchSearch?

  private var homeAppliedAt: Double = 0
  private var startTimeout: Task<Void, Never>?

  private var appliedAt: Double = 0
  private var restTimer: Timer?

  func activate() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  /// Asks the phone what is running now, as the app opens or comes back to the front: what the Watch last heard
  /// can be from a workout that has since ended.
  func sync() {
    let session = WCSession.default
    guard session.activationState == .activated, session.isReachable else { return }
    session.sendMessage(["command": "sync"], replyHandler: { reply in
      Task { @MainActor in self.apply(reply) }
    }, errorHandler: nil)
  }

  // MARK: Buttons

  func logSet() {
    guard let current = state, let setId = current.nextSetId else { return }
    send("completeSet", id: setId)
    var next = current
    next.phase = .rest
    next.restEndedAt = nil
    next.restEndsAt = Date(timeIntervalSinceNow: TimeInterval(max(5, current.restSeconds)))
    show(next)
  }

  func skipRest() {
    guard var next = state else { return }
    send("skipRest", id: nil)
    next.phase = .working
    next.restEndsAt = nil
    next.restEndedAt = nil
    show(next)
  }

  /// Pause: the phone stops the clock and keeps the time on the set (its Stop), so Play can carry on.
  func pauseCardio() {
    guard var next = state else { return }
    send("stopCardio", id: nil)
    if let started = next.cardioStartedAt { next.elapsedSec = max(0, Int(Date().timeIntervalSince(started))) }
    next.phase = .working
    next.timed = true
    next.cardioStartedAt = nil
    show(next)
  }

  /// Start: the paused set's clock carries on from its time so far (or begins).
  func resumeCardio() {
    guard var next = state, let setId = next.nextSetId else { return }
    send("resumeCardio", id: setId)
    next.phase = .cardio
    next.cardioStartedAt = Date().addingTimeInterval(-TimeInterval(next.elapsedSec ?? 0))
    show(next)
  }

  /// Swiped to another exercise: the phone moves to it and sends its next set. A finished one has nothing to log, so
  /// the phone stays where it is.
  func showExercise(at index: Int) {
    guard exercises.indices.contains(index), index != exerciseIndex, !exercises[index].done else { return }
    send("showExercise", id: exercises[index].id)
  }

  /// Finish workout, confirmed on the Watch: the phone finishes it as its own button does, and sends the summary.
  func finishWorkout() {
    guard state != nil else { return }
    send("finishWorkout", id: nil)
    finishing = true
  }

  /// The done summary was read: back to the idle screen.
  func dismissDone() {
    // The phone's summary closes with it.
    send("closeSummary", id: nil)
    workoutName = nil
    show(nil)
  }

  // MARK: Starting from the Watch

  /// Start (a day's workout), Quick workout or Resume: the phone starts it, as its own buttons do, and the workout
  /// shows up here as usual. The phone must be near: with no answer the screen says so, with Try again.
  func start(_ kind: WatchStarting.Kind, id: String, name: String) {
    let request = WatchStarting(kind: kind, id: id, name: name, failed: false)
    starting = request
    startTimeout?.cancel()
    let session = WCSession.default
    guard session.activationState == .activated, session.isReachable else {
      starting?.failed = true
      return
    }
    // Straight to the phone or not at all: a start queued for later would begin a workout nobody is doing.
    session.sendMessage(["command": kind.rawValue, "id": id], replyHandler: nil) { _ in
      Task { @MainActor in if self.starting == request { self.starting?.failed = true } }
    }
    startTimeout = Task { [weak self] in
      try? await Task.sleep(for: .seconds(20))
      guard !Task.isCancelled, let self, self.starting == request else { return }
      self.starting?.failed = true
    }
  }

  func retryStart() {
    guard let starting else { return }
    start(starting.kind, id: starting.id, name: starting.name)
  }

  func cancelStart() {
    startTimeout?.cancel()
    starting = nil
  }

  /// Asks the phone's library, so the Watch finds what the phone's search finds.
  func searchExercises(_ query: String) {
    let query = query.trimmingCharacters(in: .whitespacesAndNewlines)
    search = WatchSearch(query: query, results: nil)
    guard !query.isEmpty else { return }
    let session = WCSession.default
    guard session.activationState == .activated, session.isReachable else {
      search = WatchSearch(query: query, results: nil, failed: true)
      return
    }
    session.sendMessage(["command": "search", "id": query], replyHandler: nil) { _ in
      Task { @MainActor in if self.search?.query == query, self.search?.results == nil { self.search?.failed = true } }
    }
  }

  private func send(_ command: String, id: String?) {
    var message: [String: Any] = ["command": command]
    if let id { message["id"] = id }
    sendToPhone(message)
  }

  /// A message for the phone: straight there when it is listening, else queued until it is.
  func sendToPhone(_ message: [String: Any]) {
    let session = WCSession.default
    guard session.activationState == .activated else { return }
    // Straight to the phone when it is listening, else queued until it is.
    if session.isReachable {
      session.sendMessage(message, replyHandler: nil) { _ in session.transferUserInfo(message) }
    } else {
      session.transferUserInfo(message)
    }
  }

  // MARK: State from the phone

  fileprivate func apply(_ payload: [String: Any]) {
    // The home comes with the context, and on its own as a message; newest only.
    if let raw = payload["home"] as? [String: Any], let at = payload["homeAt"] as? Double, at > homeAppliedAt {
      homeAppliedAt = at
      home = WatchHome(raw)
    }
    if let raw = payload["search"] as? [String: Any], let query = raw["query"] as? String, query == search?.query {
      search = WatchSearch(query: query, results: (raw["results"] as? [[String: Any]] ?? []).compactMap(WatchSearch.Result.init))
    }
    // The context and the message can both carry the same update, and the context comes again with each new home:
    // the workout's state is taken once, newest only, so it never undoes a button tapped since.
    guard let sentAt = payload["sentAt"] as? Double, sentAt > appliedAt else { return }
    appliedAt = sentAt
    guard let raw = payload["state"] as? [String: Any], let next = WorkoutActivityState(dictionary: raw) else {
      // The workout was left or discarded: nothing to show, unless the summary is still up, and nothing to save.
      finishing = false
      if state?.phase != .done { workoutName = nil; exercises = []; exerciseIndex = nil; show(nil) }
      WorkoutManager.shared.discard()
      return
    }
    workoutName = payload["workoutName"] as? String ?? workoutName
    exercises = (raw["exercises"] as? [[String: Any]] ?? []).compactMap { e in
      guard let id = e["id"] as? String, let name = e["name"] as? String else { return nil }
      return WatchExercise(id: id, name: name, done: e["done"] as? Bool ?? false)
    }
    exerciseIndex = raw["exerciseIndex"] as? Int
    if let d = raw["done"] as? [String: Any] {
      done = WatchDone(durationSec: d["durationSec"] as? Int ?? 0, sets: d["sets"] as? Int ?? 0, volume: d["volume"] as? String, records: d["records"] as? Int ?? 0)
    } else if next.phase != .done {
      done = nil
    }
    if next.phase == .done { finishing = false }
    // The workout tapped here has started on the phone.
    if next.phase != .done {
      startTimeout?.cancel()
      starting = nil
    }
    // The Health workout follows the phone's: measuring while it runs, saved once it is finished.
    if next.phase == .done {
      Task { await WorkoutManager.shared.finish() }
    } else {
      Task { await WorkoutManager.shared.start(sessionId: payload["sessionId"] as? String) }
    }
    show(next)
  }

  /// Shows a state, and arms the rest's end: a tap on the wrist and "Rest over" on the next set.
  private func show(_ next: WorkoutActivityState?) {
    state = next
    restTimer?.invalidate()
    restTimer = nil
    guard let next, next.phase == .rest, let endsAt = next.restEndsAt else { return }
    let fire = { [weak self] in
      guard let self, var over = self.state, over.phase == .rest else { return }
      WKInterfaceDevice.current().play(.notification)
      over.phase = .working
      over.restEndedAt = over.restEndsAt
      over.restEndsAt = nil
      self.state = over
    }
    if endsAt.timeIntervalSinceNow <= 0 {
      fire()
      return
    }
    restTimer = Timer.scheduledTimer(withTimeInterval: endsAt.timeIntervalSinceNow, repeats: false) { _ in
      Task { @MainActor in fire() }
    }
  }
}

extension WatchSession: WCSessionDelegate {
  nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    let context = session.receivedApplicationContext
    Task { @MainActor in
      if !context.isEmpty { self.apply(context) }
      self.sync()
    }
  }

  nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
    guard session.isReachable else { return }
    Task { @MainActor in self.sync() }
  }

  nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    Task { @MainActor in self.apply(applicationContext) }
  }

  nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    Task { @MainActor in self.apply(message) }
  }
}
