import Foundation
import WatchConnectivity
import WatchKit

/// The Watch's side of the running workout (v1 #6): the phone sends the same state the Live Activity shows
/// (ios/FlexCoach/WatchBridge.swift); the buttons send back the Island's commands. A button flips the screen at once,
/// as the Island's do, and the phone's next update settles it. When a rest runs out on the wrist, the Watch taps
/// and says "Rest over" on the next set.
@MainActor
final class WatchSession: NSObject, ObservableObject {
  static let shared = WatchSession()

  @Published private(set) var workoutName: String?
  @Published private(set) var state: WorkoutActivityState?

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

  /// The done summary was read: back to the idle screen.
  func dismissDone() {
    workoutName = nil
    show(nil)
  }

  private func send(_ command: String, id: String?) {
    var message: [String: Any] = ["command": command]
    if let id { message["id"] = id }
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
    let sentAt = payload["sentAt"] as? Double ?? 0
    // The context and the message can both carry the same update; take each once, newest only.
    guard sentAt >= appliedAt else { return }
    appliedAt = sentAt
    guard let raw = payload["state"] as? [String: Any], let next = WorkoutActivityState(dictionary: raw) else {
      // The workout was left: nothing to show, unless the summary is still up.
      if state?.phase != .done { workoutName = nil; show(nil) }
      return
    }
    workoutName = payload["workoutName"] as? String ?? workoutName
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
