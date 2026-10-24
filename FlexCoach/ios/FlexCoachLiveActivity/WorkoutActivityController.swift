import ActivityKit
import Foundation
import os

private let log = Logger(subsystem: "com.flexcoach", category: "LiveActivity")

/// A command tapped on the activity (Island or lock screen), for the app to apply to the session.
public struct WorkoutActivityCommand {
  public static let notificationName = Notification.Name("FlexCoachLiveActivityCommand")
  public static let kindKey = "kind"
  public static let idKey = "id"
  /// When it was tapped, milliseconds since 1970: the same value in the live event and the queue, so the app can
  /// tell that a queued command is one it already applied.
  public static let atKey = "at"
  /// The App Group store keeps commands the app has not consumed yet (it may have been in the background or killed).
  public static let appGroup = "group.com.flexcoach"
  public static let queueKey = "liveActivity.pendingCommands"

  public static func enqueue(kind: String, id: String?) {
    let defaults = UserDefaults(suiteName: appGroup)
    var queue = defaults?.array(forKey: queueKey) as? [[String: Any]] ?? []
    let at = Date().timeIntervalSince1970 * 1000
    queue.append(["kind": kind, "id": id ?? "", "at": at])
    defaults?.set(queue, forKey: queueKey)
    NotificationCenter.default.post(name: notificationName, object: nil, userInfo: ["kind": kind, "id": id ?? "", "at": at])
  }

  /// The commands waiting, oldest first; cleared once taken.
  public static func drain() -> [[String: Any]] {
    let defaults = UserDefaults(suiteName: appGroup)
    let queue = defaults?.array(forKey: queueKey) as? [[String: Any]] ?? []
    defaults?.removeObject(forKey: queueKey)
    return queue
  }
}

/// Starts, updates and ends the workout's Live Activity. One activity per workout; the app's native module drives it
/// from the running session, and the Island's buttons flip it locally through `applyLocally`.
@objc public final class WorkoutActivityController: NSObject {
  @objc public static let shared = WorkoutActivityController()

  /// Posted with the activity's push token (hex) whenever Apple issues or rotates it.
  @objc public static let pushTokenNotification = Notification.Name("FlexCoachLiveActivityPushToken")
  /// The current activity's push token, hex, once Apple has issued it.
  @objc public private(set) var pushToken: String?
  /// Fires at the running rest's end while this process is alive (the foreground, or the simulator's background).
  private var restEnd: DispatchWorkItem?
  /// Fires a few seconds into "Rest over" and moves on to the next set.
  private var restOverSeen: DispatchWorkItem?

  /// Arms (or disarms) the rest's end for the state just shown. Only the rest's end: "Rest over" keeps its own clock.
  @available(iOS 16.2, *)
  private func armRestEnd(for state: WorkoutActivityState) {
    restEnd?.cancel()
    restEnd = nil
    guard state.phase == .rest, let endsAt = state.restEndsAt else { return }
    let delay = max(0.1, endsAt.timeIntervalSinceNow + 0.2)
    log.info("rest end armed in \(delay, privacy: .public) s")
    let work = DispatchWorkItem { [weak self] in
      log.info("rest end fired")
      guard let self else { return }
      Task { await self.applyLocally(.restOver) }
    }
    restEnd = work
    DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
  }

  /// Keeps "Rest over" for its few seconds whoever announced it (this process or the app's update), then moves on.
  @available(iOS 16.2, *)
  private func keepRestOver(for state: WorkoutActivityState) {
    guard state.phase == .restOver else {
      restOverSeen?.cancel()
      restOverSeen = nil
      return
    }
    guard restOverSeen == nil else { return }
    let work = DispatchWorkItem { [weak self] in
      guard let self else { return }
      self.restOverSeen = nil
      Task { await self.applyLocally(.restOverSeen) }
    }
    restOverSeen = work
    DispatchQueue.main.asyncAfter(deadline: .now() + WorkoutActivityState.restOverSeconds, execute: work)
  }

  @objc public var isSupported: Bool {
    if #available(iOS 16.2, *) { return ActivityAuthorizationInfo().areActivitiesEnabled }
    return false
  }

  /// Starts the activity for a workout, replacing any left from an earlier one.
  @objc public func start(workoutName: String, sessionId: String, state: [String: Any]) -> Bool {
    guard #available(iOS 16.2, *), let content = WorkoutActivityState(dictionary: state) else { return false }
    endAllNow()
    let attributes = WorkoutActivityAttributes(workoutName: workoutName, sessionId: sessionId)
    do {
      pushToken = nil
      armRestEnd(for: content)
      let activity = try Activity<WorkoutActivityAttributes>.request(attributes: attributes, content: ActivityContent(state: content, staleDate: content.staleDate), pushType: .token)
      // The token lets a server update the activity while the app sleeps: the rest running out, exactly on time.
      Task {
        for await data in activity.pushTokenUpdates {
          let hex = data.map { String(format: "%02x", $0) }.joined()
          await MainActor.run {
            self.pushToken = hex
            NotificationCenter.default.post(name: WorkoutActivityController.pushTokenNotification, object: nil, userInfo: ["token": hex])
          }
        }
      }
      return true
    } catch {
      return false
    }
  }

  /// `alert`: the update is worth a look, so the Island opens on it for a moment and the lock screen lights up (the rest running out).
  @objc public func update(state: [String: Any], alert: Bool) {
    guard #available(iOS 16.2, *), let content = WorkoutActivityState(dictionary: state) else { return }
    // Called on the main thread by the module.
    armRestEnd(for: content)
    keepRestOver(for: content)
    Task {
      let staleDate = content.phase == .restOver ? WorkoutActivityState.restOverStale(since: Date()) : content.staleDate
      for activity in Activity<WorkoutActivityAttributes>.activities {
        if alert {
          let body = content.nextTarget.map { "\(content.exerciseName) · \($0)" } ?? content.exerciseName
          await activity.update(ActivityContent(state: content, staleDate: staleDate), alertConfiguration: AlertConfiguration(title: "Rest over", body: LocalizedStringResource(stringLiteral: body), sound: .default))
        } else {
          await activity.update(ActivityContent(state: content, staleDate: staleDate))
        }
      }
    }
  }

  /// Ends the activity. With a final state (the done summary) it lingers on the lock screen for `lingerSeconds`; without one it goes at once.
  @objc public func end(state: [String: Any]?, lingerSeconds: Double) {
    guard #available(iOS 16.2, *) else { return }
    let content = state.flatMap { WorkoutActivityState(dictionary: $0) }
    Task {
      for activity in Activity<WorkoutActivityAttributes>.activities {
        if let content, lingerSeconds > 0 {
          await activity.end(ActivityContent(state: content, staleDate: nil), dismissalPolicy: .after(Date(timeIntervalSinceNow: lingerSeconds)))
        } else {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
      }
    }
  }

  @objc public func endAllNow() {
    guard #available(iOS 16.2, *) else { return }
    Task {
      for activity in Activity<WorkoutActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }

  /// The commands tapped while the app was not running, for JavaScript; cleared once taken.
  @objc public func drainCommands() -> [[String: Any]] {
    WorkoutActivityCommand.drain()
  }

  @objc public var isActive: Bool {
    guard #available(iOS 16.2, *) else { return false }
    return !Activity<WorkoutActivityAttributes>.activities.isEmpty
  }

  public enum LocalChange {
    case completeSet
    case skipRest
    case stopCardio
    /// The rest ran out: "Rest over" for a few seconds, then the plain next set.
    case restOver
    case restOverSeen
  }

  /// A button on the activity flips it at once, whether or not the app gets to react: a logged set starts its rest,
  /// a skipped rest goes back to the target, a stopped clock too. The app's own update follows when it is running.
  @available(iOS 16.2, *)
  public func applyLocally(_ change: LocalChange) async {
    for activity in Activity<WorkoutActivityAttributes>.activities {
      var state = activity.content.state
      // Any change moves on from a rest that ran out while the app slept.
      if change != .restOverSeen { state.restEndedAt = nil }
      switch change {
      case .completeSet:
        state.phase = .rest
        state.restEndsAt = Date(timeIntervalSinceNow: TimeInterval(max(5, state.restSeconds)))
        await MainActor.run { self.armRestEnd(for: state) }
      case .skipRest:
        state.phase = .working
        state.restEndsAt = nil
        await MainActor.run { self.armRestEnd(for: state) }
      case .stopCardio:
        state.phase = .working
        state.cardioStartedAt = nil
      case .restOver:
        guard state.phase == .rest else {
          log.info("rest over: activity is \(state.phase.rawValue, privacy: .public), nothing to do")
          continue
        }
        log.info("rest over: announcing")
        state.phase = .restOver
        state.restEndsAt = nil
        await MainActor.run { self.keepRestOver(for: state) }
      case .restOverSeen:
        guard state.phase == .restOver else { continue }
        log.info("rest over: done, next set")
        state.phase = .working
      }
      if change == .restOver {
        let body = state.nextTarget.map { "\(state.exerciseName) · \($0)" } ?? state.exerciseName
        await activity.update(ActivityContent(state: state, staleDate: WorkoutActivityState.restOverStale(since: Date())), alertConfiguration: AlertConfiguration(title: "Rest over", body: LocalizedStringResource(stringLiteral: body), sound: .default))
        continue
      }
      await activity.update(ActivityContent(state: state, staleDate: state.staleDate))
    }
  }
}
