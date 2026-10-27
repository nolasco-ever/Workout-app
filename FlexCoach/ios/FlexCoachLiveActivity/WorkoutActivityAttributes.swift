import Foundation
#if canImport(ActivityKit) && os(iOS)
import ActivityKit

/// The running workout as the Live Activity sees it. Fixed for the activity's life.
@available(iOS 16.2, *)
public struct WorkoutActivityAttributes: ActivityAttributes {
  public typealias ContentState = WorkoutActivityState

  public var workoutName: String
  public var sessionId: String

  public init(workoutName: String, sessionId: String) {
    self.workoutName = workoutName
    self.sessionId = sessionId
  }
}
#endif

/// What the activity shows right now, and what the Watch app mirrors (it compiles this file too). The clocks are dates, so the system ticks them without an update from the app.
public struct WorkoutActivityState: Codable, Hashable {
  public enum Phase: String, Codable {
    /// Between sets: the next set's target, with a check to log it.
    case working
    /// Resting: the countdown, with Skip.
    case rest
    /// The rest has just run out: announced for a few seconds, then `working`.
    case restOver
    /// A timed exercise running: the clock, with Stop.
    case cardio
    /// Finished: the summary lingers on the lock screen.
    case done
  }

  public var phase: Phase
  public var exerciseName: String
  /// "Set 2 of 3"
  public var setLabel: String
  /// "185 lb × 8", the set the check logs.
  public var nextTarget: String?
  public var nextSetId: String?
  public var restEndsAt: Date?
  /// The exercise's rest length, so a set logged from the Island can start its rest without the app.
  public var restSeconds: Int
  public var cardioStartedAt: Date?
  public var cardioTargetSeconds: Int?
  /// When the workout began: the elapsed clock on the lock screen.
  public var startedAt: Date
  /// The done state's line: "18 sets · 12,400 lb · 1 record".
  public var summary: String?
  /// `working` right after a rest ran out while the app slept: the opened Island and the lock screen say "Rest over"
  /// on the next set until the next update (the set logged), while the compact Island already shows the elapsed clock.
  /// Nothing has to redraw on its own for the next set to show (build 19: iOS took a minute or more to do that).
  public var restEndedAt: Date?
  /// The next set is timed (a hold, cardio): the Watch offers Play and End for it. Absent from older apps.
  public var timed: Bool?
  /// A timed set's seconds so far, while it is paused.
  public var elapsedSec: Int?
  /// The next entry is cardio, not a set (owner, 2026-10-25): what the Watch records it as ("running", "elliptical"),
  /// outdoors or not, and whether the Watch measures its distance (v1 #6, step 3). Absent for lifting.
  public var cardioActivity: String?
  public var cardioOutdoor: Bool?
  public var cardioDistance: Bool?
  /// "mi" or "km", for the Watch's distance and pace.
  public var distanceUnit: String?
  public init(phase: Phase, exerciseName: String, setLabel: String, nextTarget: String?, nextSetId: String?, restEndsAt: Date?, restSeconds: Int, cardioStartedAt: Date?, cardioTargetSeconds: Int?, startedAt: Date, summary: String?, restEndedAt: Date? = nil) {
    self.phase = phase
    self.exerciseName = exerciseName
    self.setLabel = setLabel
    self.nextTarget = nextTarget
    self.nextSetId = nextSetId
    self.restEndsAt = restEndsAt
    self.restSeconds = restSeconds
    self.cardioStartedAt = cardioStartedAt
    self.cardioTargetSeconds = cardioTargetSeconds
    self.startedAt = startedAt
    self.summary = summary
    self.restEndedAt = restEndedAt
  }

  /// When the shown state stops being true on its own: the end of a rest. The system re-renders the views then with
  /// `isStale`, and they show the next set instead, whether or not the app is awake to say so.
  public var staleDate: Date? {
    phase == .rest ? restEndsAt : nil
  }

  /// "Rest over" announced at `since` has run its course after this.
  public static func restOverStale(since: Date) -> Date {
    since.addingTimeInterval(restOverSeconds)
  }

  /// How long "Rest over" stays before the next set: as long as the Island's own alert expansion, so the next set
  /// is never seen expanded.
  public static let restOverSeconds: TimeInterval = 6

  /// What to draw: a rest that has run out reads as the next set, marked as just after a rest.
  public func displayed(stale: Bool) -> WorkoutActivityState {
    guard stale else { return self }
    var next = self
    switch phase {
    case .rest:
      next.phase = .working
      next.restEndedAt = restEndsAt
      next.restEndsAt = nil
    case .restOver:
      next.phase = .working
    default:
      return self
    }
    return next
  }

  /// From the record JavaScript sends (dates as milliseconds since 1970).
  public init?(dictionary d: [String: Any]) {
    guard let phaseRaw = d["phase"] as? String, let phase = Phase(rawValue: phaseRaw), let startedMs = d["startedAt"] as? Double else { return nil }
    let date: (Any?) -> Date? = { v in (v as? Double).map { Date(timeIntervalSince1970: $0 / 1000) } }
    self.init(
      phase: phase,
      exerciseName: d["exerciseName"] as? String ?? "",
      setLabel: d["setLabel"] as? String ?? "",
      nextTarget: d["nextTarget"] as? String,
      nextSetId: d["nextSetId"] as? String,
      restEndsAt: date(d["restEndsAt"]),
      restSeconds: Int(d["restSeconds"] as? Double ?? 90),
      cardioStartedAt: date(d["cardioStartedAt"]),
      cardioTargetSeconds: (d["cardioTargetSeconds"] as? Double).map { Int($0) },
      startedAt: Date(timeIntervalSince1970: startedMs / 1000),
      summary: d["summary"] as? String
    )
    timed = d["timed"] as? Bool
    elapsedSec = (d["elapsedSec"] as? Double).map { Int($0) }
    cardioActivity = d["cardioActivity"] as? String
    cardioOutdoor = d["cardioOutdoor"] as? Bool
    cardioDistance = d["cardioDistance"] as? Bool
    distanceUnit = d["distanceUnit"] as? String
  }
}

/// The Iron palette, for the activity's views (always the dark card).
public enum WorkoutActivityPalette {
  public static let ground = (r: 0x14, g: 0x15, b: 0x17)
  public static let surface = (r: 0x1E, g: 0x1F, b: 0x22)
  public static let ink = (r: 0xF2, g: 0xF1, b: 0xEF)
  public static let inkMuted = (r: 0x9A, g: 0x98, b: 0x95)
  public static let accent = (r: 0xE2, g: 0x60, b: 0x2A)
  public static let success = (r: 0x2E, g: 0x9E, b: 0x6B)
}
