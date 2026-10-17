import AppIntents
import Foundation

/// The green check: logs the next set from the Island or the lock screen. Runs in the app's process (launched if need be).
@available(iOS 17.0, *)
public struct CompleteSetIntent: LiveActivityIntent {
  public static let title: LocalizedStringResource = "Complete set"
  public static let isDiscoverable = false

  @Parameter(title: "Set")
  public var setId: String

  public init() {
    setId = ""
  }

  public init(setId: String) {
    self.setId = setId
  }

  public func perform() async throws -> some IntentResult {
    WorkoutActivityCommand.enqueue(kind: "completeSet", id: setId)
    await WorkoutActivityController.shared.applyLocally(.completeSet)
    return .result()
  }
}

/// Skip: ends the rest early.
@available(iOS 17.0, *)
public struct SkipRestIntent: LiveActivityIntent {
  public static let title: LocalizedStringResource = "Skip rest"
  public static let isDiscoverable = false

  public init() {}

  public func perform() async throws -> some IntentResult {
    WorkoutActivityCommand.enqueue(kind: "skipRest", id: nil)
    await WorkoutActivityController.shared.applyLocally(.skipRest)
    return .result()
  }
}

/// Stop: ends a timed exercise's clock.
@available(iOS 17.0, *)
public struct StopCardioIntent: LiveActivityIntent {
  public static let title: LocalizedStringResource = "Stop timer"
  public static let isDiscoverable = false

  public init() {}

  public func perform() async throws -> some IntentResult {
    WorkoutActivityCommand.enqueue(kind: "stopCardio", id: nil)
    await WorkoutActivityController.shared.applyLocally(.stopCardio)
    return .result()
  }
}
