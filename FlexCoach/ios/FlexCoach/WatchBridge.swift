import Foundation
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
  }

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
  /// 1970). Nil when no workout is running.
  @objc public func send(workoutName: String?, state: [String: Any]?) {
    var payload: [String: Any] = [Key.sentAt: Date().timeIntervalSince1970 * 1000]
    if let state, let workoutName {
      payload[Key.workoutName] = workoutName
      payload[Key.state] = state
    } else if let state, let previous = latest[Key.workoutName] as? String {
      payload[Key.workoutName] = previous
      payload[Key.state] = state
    }
    latest = payload
    push()
  }

  fileprivate func push() {
    let session = WCSession.default
    guard WCSession.isSupported(), session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }
    try? session.updateApplicationContext(latest)
    if session.isReachable { session.sendMessage(latest, replyHandler: nil, errorHandler: nil) }
  }

  fileprivate var hasState: Bool { !latest.isEmpty }

  /// What is running now, for the Watch asking as it opens.
  fileprivate var current: [String: Any] { latest.isEmpty ? [Key.sentAt: Date().timeIntervalSince1970 * 1000] : latest }

  /// A button on the Watch: queued for the app exactly like one on the Island, and the Island flipped at once.
  fileprivate func handle(_ message: [String: Any]) {
    guard let kind = message[Key.command] as? String else { return }
    let id = message[Key.id] as? String
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
