import SwiftUI

/// FlexCoach on Apple Watch (v1 #6, owner 2026-10-24). This first step mirrors the workout running on the phone:
/// the next set with Log set, the rest with Skip rest and a tap when it runs out, the cardio clock with Stop, and
/// the summary. Health workout tracking, cardio distance and pace, and starting from the Watch follow.
@main
struct FlexCoachWatchApp: App {
  @StateObject private var session = WatchSession.shared
  @Environment(\.scenePhase) private var scenePhase

  init() {
    WatchSession.shared.activate()
  }

  var body: some Scene {
    WindowGroup {
      RootView(session: session)
    }
    // Back on the wrist: check with the phone, which knows whether the workout is still on.
    .onChange(of: scenePhase) { _, phase in
      if phase == .active { session.sync() }
    }
  }
}
