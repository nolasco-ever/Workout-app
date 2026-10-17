import SwiftUI
import WidgetKit

@main
struct FlexCoachLiveActivityBundle: WidgetBundle {
  var body: some Widget {
    if #available(iOS 16.2, *) {
      WorkoutLiveActivity()
    }
  }
}
