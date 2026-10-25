import HealthKit
import SwiftUI
import WatchKit

/// The phone starting a workout opens the app with a workout configuration: the Health workout starts at once.
final class WatchAppDelegate: NSObject, WKApplicationDelegate {
  func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
    Task { @MainActor in await WorkoutManager.shared.start(sessionId: nil, configuration: workoutConfiguration) }
  }
}

/// FlexCoach on Apple Watch (v1 #6, owner 2026-10-24). Step 1 mirrors the workout running on the phone: the next
/// set with Log set, the rest with Skip rest and a tap when it runs out, the cardio clock with Pause, then Start or
/// End, and the summary. Step 2 runs a Health workout alongside, with live heart rate and calories on the Watch;
/// step 4 is the home with no workout running: today's workout, the cycle, and starting a workout or a quick one
/// from the wrist (WatchHome.swift). Cardio distance and pace follow.
@main
struct FlexCoachWatchApp: App {
  @WKApplicationDelegateAdaptor(WatchAppDelegate.self) private var appDelegate
  @StateObject private var session = WatchSession.shared
  @StateObject private var workout = WorkoutManager.shared
  @Environment(\.scenePhase) private var scenePhase

  init() {
    WatchSession.shared.activate()
  }

  var body: some Scene {
    WindowGroup {
      RootView(session: session, workout: workout)
    }
    // Back on the wrist: check with the phone, which knows whether the workout is still on.
    .onChange(of: scenePhase) { _, phase in
      if phase == .active { session.sync() }
    }
  }
}
