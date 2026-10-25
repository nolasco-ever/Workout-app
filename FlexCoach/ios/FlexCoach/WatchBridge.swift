import Foundation
import HealthKit
import WatchConnectivity

/// The phone's side of the Watch app (v1 #6): the running workout's state goes to the Watch every time the Live
/// Activity's does, and the Watch's buttons come back as the same commands the Island's buttons send, so the app
/// applies each once and the Island follows at once.
///
/// The state travels as the application context (the latest one always reaches the Watch, even if it was asleep),
/// and as a message too when the Watch is reachable, so it shows straight away.
///
/// The WatchConnectivity delegate is a private class: anything WCSession-typed on WatchBridge itself would land in
/// the generated FlexCoach-Swift.h, which Objective-C files without the framework include.
@objc public final class WatchBridge: NSObject {
  @objc public static let shared = WatchBridge()
  private let delegate = Delegate()

  /// Keys of the payload the Watch reads; see FlexCoachWatch/WatchSession.swift.
  enum Key {
    static let workoutName = "workoutName"
    static let state = "state"
    static let sentAt = "sentAt"
    static let command = "command"
    static let id = "id"
    static let sessionId = "sessionId"
    static let home = "home"
    static let homeAt = "homeAt"
    static let search = "search"
  }

  /// What the Watch asks with no workout running (v1 #6, step 4); the rest of its commands are the Island's.
  private static let requestKinds: Set<String> = ["startWorkout", "startQuick", "resumeWorkout", "search"]
  /// Posted with one request from the Watch; NativeLiveActivity passes it on to JavaScript.
  @objc public static let requestNotification = Notification.Name("FlexCoachWatchRequest")
  /// Requests JavaScript has not taken yet (a start can wake the app before JavaScript is listening).
  private static let requestsKey = "watch.pendingRequests"
  /// The Watch's home, kept beside the workout's state and sent with it.
  private var home: [String: Any]?
  private var homeAt: Double = 0

  /// Posted with one workout's metrics from the Watch; NativeLiveActivity passes it on to JavaScript.
  @objc public static let metricsNotification = Notification.Name("FlexCoachWatchMetrics")
  /// Metrics JavaScript has not taken yet (it may have been asleep), kept until it does.
  private static let pendingKey = "watch.pendingMetrics"
  private let health = HKHealthStore()

  private var latest: [String: Any] = [:]

  /// Called once at launch. Until a workout screen says otherwise, nothing is running: the Watch keeps the last
  /// context it heard, even from an earlier run of the app, so a workout left behind there is cleared.
  @objc public func activate() {
    guard WCSession.isSupported() else { return }
    if latest.isEmpty { latest = [Key.sentAt: Date().timeIntervalSince1970 * 1000] }
    delegate.bridge = self
    WCSession.default.delegate = delegate
    WCSession.default.activate()
  }

  /// The workout's state for the Watch, as JavaScript sent it to the Live Activity (dates as milliseconds since
  /// 1970). Nil when no workout is running. `sessionId` comes with the first state of a workout.
  @objc public func send(workoutName: String?, sessionId: String?, state: [String: Any]?) {
    var payload: [String: Any] = [Key.sentAt: Date().timeIntervalSince1970 * 1000]
    if let state {
      payload[Key.state] = Self.withoutNulls(state)
      if let name = workoutName ?? latest[Key.workoutName] as? String { payload[Key.workoutName] = name }
      if let id = sessionId ?? latest[Key.sessionId] as? String { payload[Key.sessionId] = id }
    }
    latest = payload
    push()
  }

  /// A workout starting on the phone starts the Watch's Health workout too, opening the Watch app if it is closed,
  /// so heart rate and calories are tracked and the Watch stays awake on the wrist (v1 #6, step 2).
  @objc public func startWatchWorkout() {
    guard HKHealthStore.isHealthDataAvailable(), WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }
    let configuration = HKWorkoutConfiguration()
    configuration.activityType = .traditionalStrengthTraining
    configuration.locationType = .indoor
    health.startWatchApp(with: configuration) { _, _ in }
  }

  /// What the Watch shows with no workout running, as JavaScript builds it (data/liveActivity/watchHome.ts). It goes
  /// in the context with the workout's state, and on its own as a message, so it never replays a workout's state.
  @objc(setHomeJSON:) public func setHome(json: String) {
    guard let data = json.data(using: .utf8), let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
    home = Self.withoutNulls(parsed)
    homeAt = Date().timeIntervalSince1970 * 1000
    let session = WCSession.default
    guard WCSession.isSupported(), session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }
    try? session.updateApplicationContext(context)
    if session.isReachable, let home { session.sendMessage([Key.home: home, Key.homeAt: homeAt], replyHandler: nil, errorHandler: nil) }
  }

  /// The phone's answer to the Watch's search, `{query, results}`.
  @objc(setSearchJSON:) public func setSearch(json: String) {
    guard let data = json.data(using: .utf8), let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
    let session = WCSession.default
    guard WCSession.isSupported(), session.activationState == .activated, session.isReachable else { return }
    session.sendMessage([Key.search: Self.withoutNulls(parsed)], replyHandler: nil, errorHandler: nil)
  }

  /// The Watch's requests JavaScript has not taken yet, as {kind, id, at} records; cleared.
  @objc public func takeRequests() -> [[String: Any]] {
    let defaults = UserDefaults.standard
    let pending = defaults.array(forKey: Self.requestsKey) as? [[String: Any]] ?? []
    defaults.removeObject(forKey: Self.requestsKey)
    return pending
  }

  /// One request from the Watch: kept for JavaScript, and announced in case it is listening. Only the latest search
  /// is worth keeping.
  fileprivate func received(request kind: String, id: String?) {
    let record: [String: Any] = ["kind": kind, "id": id ?? "", "at": Date().timeIntervalSince1970 * 1000]
    DispatchQueue.main.async {
      let defaults = UserDefaults.standard
      var pending = (defaults.array(forKey: Self.requestsKey) as? [[String: Any]] ?? []).filter { kind != "search" || $0["kind"] as? String != "search" }
      pending.append(record)
      defaults.set(Array(pending.suffix(20)), forKey: Self.requestsKey)
      NotificationCenter.default.post(name: Self.requestNotification, object: nil, userInfo: record)
    }
  }

  /// The Watch's metrics JavaScript has not taken yet, as [sessionId, kcal, avgBpm, maxBpm] records; cleared.
  @objc public func takeMetrics() -> [[String: Any]] {
    let defaults = UserDefaults.standard
    let pending = defaults.array(forKey: Self.pendingKey) as? [[String: Any]] ?? []
    defaults.removeObject(forKey: Self.pendingKey)
    return pending
  }

  /// One workout's metrics from the Watch: kept for JavaScript, and announced in case it is listening.
  fileprivate func received(metrics: [String: Any]) {
    guard let sessionId = metrics[Key.sessionId] as? String else { return }
    let record: [String: Any] = [
      "sessionId": sessionId,
      "kcal": metrics["kcal"] as? Double ?? 0,
      "avgBpm": metrics["avgBpm"] as? Double ?? 0,
      "maxBpm": metrics["maxBpm"] as? Double ?? 0,
    ]
    DispatchQueue.main.async {
      let defaults = UserDefaults.standard
      var pending = (defaults.array(forKey: Self.pendingKey) as? [[String: Any]] ?? []).filter { $0["sessionId"] as? String != sessionId }
      pending.append(record)
      defaults.set(pending, forKey: Self.pendingKey)
      NotificationCenter.default.post(name: Self.metricsNotification, object: nil, userInfo: record)
    }
  }

  /// WatchConnectivity takes property-list values only: a JSON null (a done workout without volume) made the whole
  /// update fail quietly, so the Watch never heard the workout was finished. Nulls are dropped, as missing keys.
  static func withoutNulls(_ value: [String: Any]) -> [String: Any] {
    value.compactMapValues { v -> Any? in
      if v is NSNull { return nil }
      if let dict = v as? [String: Any] { return withoutNulls(dict) }
      if let list = v as? [Any] { return list.compactMap { $0 is NSNull ? nil : ($0 as? [String: Any]).map(withoutNulls) ?? $0 } }
      return v
    }
  }

  fileprivate func push() {
    let session = WCSession.default
    guard WCSession.isSupported(), session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }
    try? session.updateApplicationContext(context)
    if session.isReachable { session.sendMessage(latest, replyHandler: nil, errorHandler: nil) }
  }

  /// The workout's state with the home beside it, as the Watch reads the context.
  private var context: [String: Any] {
    var context = latest
    if let home {
      context[Key.home] = home
      context[Key.homeAt] = homeAt
    }
    return context
  }

  fileprivate var hasState: Bool { !latest.isEmpty || home != nil }

  /// What is running now and the home, for the Watch asking as it opens.
  fileprivate var current: [String: Any] {
    var current = context
    if current[Key.sentAt] == nil { current[Key.sentAt] = Date().timeIntervalSince1970 * 1000 }
    return current
  }

  /// A button on the Watch: queued for the app exactly like one on the Island, and the Island flipped at once.
  fileprivate func handle(_ message: [String: Any]) {
    guard let kind = message[Key.command] as? String else { return }
    if kind == "metrics" {
      received(metrics: message)
      return
    }
    let id = message[Key.id] as? String
    if Self.requestKinds.contains(kind) {
      received(request: kind, id: id)
      return
    }
    DispatchQueue.main.async {
      WorkoutActivityCommand.enqueue(kind: kind, id: id)
      guard #available(iOS 16.2, *) else { return }
      let change: WorkoutActivityController.LocalChange?
      switch kind {
      case "completeSet": change = .completeSet
      case "skipRest": change = .skipRest
      case "stopCardio": change = .stopCardio
      default: change = nil
      }
      if let change { Task { await WorkoutActivityController.shared.applyLocally(change) } }
    }
  }
}

/// WatchConnectivity's callbacks, passed on to the bridge.
private final class Delegate: NSObject, WCSessionDelegate {
  weak var bridge: WatchBridge?

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if activationState == .activated, bridge?.hasState == true { bridge?.push() }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    // A new Watch was paired: talk to it.
    WCSession.default.activate()
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    if session.isReachable, bridge?.hasState == true { bridge?.push() }
  }

  /// The Watch app was installed (or the Watch changed): bring it up to date.
  func sessionWatchStateDidChange(_ session: WCSession) {
    if bridge?.hasState == true { bridge?.push() }
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    bridge?.handle(message)
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    // The Watch opening asks what is running; anything else is a button.
    if message["command"] as? String == "sync" {
      DispatchQueue.main.async { replyHandler(self.bridge?.current ?? [:]) }
      return
    }
    bridge?.handle(message)
    replyHandler([:])
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    bridge?.handle(userInfo)
  }
}
