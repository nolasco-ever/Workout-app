import ActivityKit
import SwiftUI
import WidgetKit

private extension Color {
  init(_ rgb: (r: Int, g: Int, b: Int)) {
    self.init(red: Double(rgb.r) / 255, green: Double(rgb.g) / 255, blue: Double(rgb.b) / 255)
  }
}

private enum Tone {
  static let ground = Color(WorkoutActivityPalette.ground)
  static let surface = Color(WorkoutActivityPalette.surface)
  static let ink = Color(WorkoutActivityPalette.ink)
  static let muted = Color(WorkoutActivityPalette.inkMuted)
  static let accent = Color(WorkoutActivityPalette.accent)
  static let success = Color(WorkoutActivityPalette.success)
}

/// Eight hours: longer than any workout, the far end of the elapsed clock's range.
private let longestWorkout: TimeInterval = 8 * 60 * 60

/// The workout's activity: the lock-screen card carries the whole picture with the elapsed clock; the Island speaks
/// only for the rest countdown, the cardio clock and the next set's target, and otherwise shows just the mark.
@available(iOS 16.2, *)
struct WorkoutLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
      LockScreenCard(workoutName: context.attributes.workoutName, state: context.state.displayed(stale: context.isStale))
        .activityBackgroundTint(Tone.ground)
        .activitySystemActionForegroundColor(Tone.ink)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          ExpandedLeading(state: context.state.displayed(stale: context.isStale))
        }
        DynamicIslandExpandedRegion(.trailing) {
          ExpandedTrailing(state: context.state.displayed(stale: context.isStale))
        }
        DynamicIslandExpandedRegion(.bottom) {
          ExpandedBottom(workoutName: context.attributes.workoutName, state: context.state.displayed(stale: context.isStale))
        }
      } compactLeading: {
        CompactLeading(state: context.state.displayed(stale: context.isStale))
      } compactTrailing: {
        CompactTrailing(state: context.state.displayed(stale: context.isStale))
      } minimal: {
        Minimal(state: context.state.displayed(stale: context.isStale))
      }
      .keylineTint(Tone.accent)
    }
  }
}

// MARK: - Pieces

/// The rest's remaining interval, or nil once it has run out: an empty interval must never reach a timer bar.
private func restInterval(_ endsAt: Date) -> ClosedRange<Date>? {
  let now = Date.now
  return endsAt.timeIntervalSince(now) > 1 ? now...endsAt : nil
}

/// The rest countdown, ticking on the device; "0:00" once it is over.
@available(iOS 16.2, *)
private struct RestClock: View {
  let endsAt: Date
  var alignment: TextAlignment = .trailing
  var body: some View {
    Group {
      if let interval = restInterval(endsAt) {
        Text(timerInterval: interval, countsDown: true)
      } else {
        Text("0:00")
      }
    }
    .monospacedDigit()
    .multilineTextAlignment(alignment)
  }
}

/// The rest draining as a bar; a bar that is simply empty once it is over.
@available(iOS 16.2, *)
private struct RestBar: View {
  let endsAt: Date
  var body: some View {
    Group {
      if let interval = restInterval(endsAt) {
        ProgressView(timerInterval: interval, countsDown: true, label: { EmptyView() }, currentValueLabel: { EmptyView() })
      } else {
        ProgressView(value: 0)
      }
    }
    .progressViewStyle(.linear)
    .tint(Tone.accent)
    .frame(maxWidth: .infinity)
    .frame(height: 6)
  }
}

/// A clock counting up from `startedAt`. A running timer text asks for the width of the longest time it could reach
/// (eight hours), so it always gets a fixed width and shrinks to fit rather than widening the Island to the whole
/// screen (build 19, cardio).
@available(iOS 16.2, *)
private struct ElapsedClock: View {
  let startedAt: Date
  let width: CGFloat
  var alignment: TextAlignment = .trailing
  var body: some View {
    Text(timerInterval: startedAt...startedAt.addingTimeInterval(longestWorkout), countsDown: false)
      .monospacedDigit()
      .multilineTextAlignment(alignment)
      .lineLimit(1)
      .minimumScaleFactor(0.6)
      .frame(width: width, alignment: alignment == .leading ? .leading : .trailing)
  }
}

/// Clock widths: the compact Island's corner, the opened Island's top corner, the lock screen's large clock.
private enum ClockWidth {
  static let compact: CGFloat = 44
  static let expanded: CGFloat = 64
  static let large: CGFloat = 96
  static let inline: CGFloat = 60
}

/// The buttons the state calls for; iOS 17 runs them without opening the app, iOS 16 shows none. Grey, with the
/// mark: green means logged in the app, and the set is not logged yet.
@available(iOS 16.2, *)
private struct Actions: View {
  let state: WorkoutActivityState
  var body: some View {
    if #available(iOS 17.0, *) {
      switch state.phase {
      case .rest:
        Button(intent: SkipRestIntent()) {
          Label("Skip", systemImage: "forward.fill")
            .font(.subheadline.weight(.semibold))
        }
        .buttonStyle(.bordered)
        .tint(Tone.muted)
        .foregroundStyle(Tone.ink)
      case .cardio:
        // Pause, as on the phone and the Watch (owner, 2026-10-24): the time so far stays on the set.
        Button(intent: StopCardioIntent()) {
          Label("Pause", systemImage: "pause.fill")
            .font(.subheadline.weight(.semibold))
        }
        .buttonStyle(.bordered)
        .tint(Tone.muted)
        .foregroundStyle(Tone.ink)
      case .working:
        if let setId = state.nextSetId {
          Button(intent: CompleteSetIntent(setId: setId)) {
            // Cardio is one entry, not a set.
            Label(state.cardioActivity == nil ? "Log set" : "Log", systemImage: "checkmark")
              .font(.subheadline.weight(.semibold))
          }
          .buttonStyle(.bordered)
          .tint(Tone.muted)
          .foregroundStyle(Tone.ink)
        }
      case .restOver, .done:
        EmptyView()
      }
    }
  }
}

/// The workout's name with the elapsed clock, the exercise, then the set line: the same three lines on the lock
/// screen and in the opened Island.
@available(iOS 16.2, *)
private struct Headline: View {
  let workoutName: String
  let state: WorkoutActivityState
  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(alignment: .firstTextBaseline, spacing: 8) {
        Text(workoutName)
          .font(.subheadline.weight(.semibold))
          .foregroundStyle(Tone.ink)
          .lineLimit(1)
        if state.phase == .done {
          Text("Done")
            .font(.caption.weight(.semibold))
            .foregroundStyle(Tone.success)
        } else if state.phase != .rest && state.phase != .restOver {
          // The rest's countdown is the one clock on show while resting.
          ElapsedClock(startedAt: state.startedAt, width: ClockWidth.inline, alignment: .leading)
            .font(.caption)
            .foregroundStyle(Tone.muted)
        }
      }
      if state.phase == .done {
        Text(state.summary ?? "Workout logged")
          .font(.subheadline)
          .foregroundStyle(Tone.ink)
      } else {
        Text(state.exerciseName)
          .font(.title3.weight(.semibold))
          .foregroundStyle(Tone.ink)
          .lineLimit(1)
        Text(setLine)
          .font(.subheadline)
          .foregroundStyle(state.phase == .rest ? Tone.accent : Tone.muted)
          .lineLimit(1)
      }
    }
  }

  private var setLine: String {
    switch state.phase {
    case .rest: return "Resting · next \(state.nextTarget ?? state.setLabel)"
    case .cardio: return "Running · \(state.setLabel)"
    case .working:
      let line = state.nextTarget.map { "\(state.setLabel) · \($0)" } ?? state.setLabel
      return state.restEndedAt == nil ? line : "Rest over · \(line)"
    case .restOver:
      return "Rest over · next \(state.nextTarget ?? state.setLabel)"
    case .done: return state.summary ?? ""
    }
  }
}

/// The phase's clock, where one is running.
@available(iOS 16.2, *)
private struct PhaseClock: View {
  let state: WorkoutActivityState
  var body: some View {
    switch state.phase {
    case .rest:
      if let endsAt = state.restEndsAt {
        RestClock(endsAt: endsAt)
          .font(.title2.weight(.bold).monospacedDigit())
          .foregroundStyle(Tone.accent)
      }
    case .cardio:
      if let startedAt = state.cardioStartedAt {
        ElapsedClock(startedAt: startedAt, width: ClockWidth.large)
          .font(.title2.weight(.bold).monospacedDigit())
          .foregroundStyle(Tone.ink)
      }
    case .working, .restOver, .done:
      EmptyView()
    }
  }
}

// MARK: - Lock screen

@available(iOS 16.2, *)
private struct LockScreenCard: View {
  let workoutName: String
  let state: WorkoutActivityState
  var body: some View {
    Group {
      if state.phase == .rest {
        // The rest, as the opened Island draws it: "Rest" and Skip on the top row, the countdown beside its bar, then what comes next.
        RestPanel(state: state)
      } else {
        HStack(alignment: .center, spacing: 12) {
          Headline(workoutName: workoutName, state: state)
          Spacer(minLength: 8)
          VStack(alignment: .trailing, spacing: 6) {
            PhaseClock(state: state)
            Actions(state: state)
          }
        }
      }
    }
    .padding(16)
  }
}

// MARK: - Island, expanded
//
// The leading and trailing regions sit beside the sensor and are narrow, so they carry only a glyph and a clock; the
// bottom region runs the full width under it and carries the exercise, the target, the set strip and the button.

/// One segment per set of the exercise on show: logged in green, the next in accent, the rest grey.
@available(iOS 16.2, *)
private struct SetStrip: View {
  let state: WorkoutActivityState
  var body: some View {
    // "Set 2 of 3" is all the activity knows of the exercise's sets; a warm-up set has no count and shows no strip.
    let parts = state.setLabel.split(separator: " ")
    if parts.count == 4, let current = Int(parts[1]), let total = Int(parts[3]), total > 0, total <= 12 {
      HStack(spacing: 4) {
        ForEach(1...total, id: \.self) { n in
          Capsule()
            .fill(n < current ? Tone.success : n == current ? Tone.accent : Tone.muted.opacity(0.35))
            .frame(height: 4)
        }
      }
    }
  }
}

@available(iOS 16.2, *)
private struct ExpandedLeading: View {
  let state: WorkoutActivityState
  var body: some View {
    HStack(spacing: 6) {
      switch state.phase {
      case .rest:
        Image(systemName: "timer").foregroundStyle(Tone.accent)
        Text("Rest").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.accent)
      case .cardio:
        Image(systemName: "figure.run").foregroundStyle(Tone.ink)
        Text("Running").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.ink)
      case .restOver:
        Image(systemName: "checkmark.circle.fill").foregroundStyle(Tone.success)
        Text("Rest over").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.success)
      case .working:
        if state.restEndedAt != nil {
          Image(systemName: "checkmark.circle.fill").foregroundStyle(Tone.success)
          Text("Rest over").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.success).lineLimit(1)
        } else {
          Image(systemName: "dumbbell.fill").foregroundStyle(Tone.ink)
          Text(state.setLabel).font(.subheadline.weight(.semibold)).foregroundStyle(Tone.ink).lineLimit(1)
        }
      case .done:
        Image(systemName: "checkmark.circle.fill").foregroundStyle(Tone.success)
        Text("Done").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.success)
      }
    }
    // As tall as the small button across from it, so the row sits level with it.
    .frame(minHeight: 28, alignment: .center)
    .padding(.leading, 4)
  }
}

@available(iOS 16.2, *)
private struct ExpandedTrailing: View {
  let state: WorkoutActivityState
  var body: some View {
    Group {
      switch state.phase {
      case .rest:
        // Skip beside the sensor, where the clock sits in the other states; the countdown is in the band below.
        Actions(state: state).controlSize(.small)
      case .cardio:
        if let startedAt = state.cardioStartedAt { ElapsedClock(startedAt: startedAt, width: ClockWidth.expanded).foregroundStyle(Tone.ink) }
      case .working:
        // The workout's elapsed time, as in the compact slot.
        ElapsedClock(startedAt: state.startedAt, width: ClockWidth.expanded).foregroundStyle(Tone.muted)
      case .restOver, .done:
        EmptyView()
      }
    }
    .font(.subheadline.weight(.semibold).monospacedDigit())
    .frame(maxWidth: .infinity, minHeight: 28, alignment: .trailing)
    .padding(.trailing, 4)
  }
}

/// The resting layout: "Rest" with Skip across the top, the countdown at the left of its draining bar, and the next set
/// underneath. The opened Island draws it tight (three short rows, a small button); the lock-screen card with room.
@available(iOS 16.2, *)
private struct RestPanel: View {
  let state: WorkoutActivityState
  var compact = false
  var body: some View {
    VStack(alignment: .leading, spacing: compact ? 6 : 10) {
      if !compact {
        HStack(alignment: .center, spacing: 8) {
          Image(systemName: "timer").foregroundStyle(Tone.accent)
          Text("Rest").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.accent)
          Spacer(minLength: 8)
          Actions(state: state)
        }
      }
      if let endsAt = state.restEndsAt {
        HStack(alignment: .center, spacing: 10) {
          RestClock(endsAt: endsAt, alignment: .leading)
            .font((compact ? Font.title3 : Font.title2).weight(.bold).monospacedDigit())
            .foregroundStyle(Tone.accent)
            .frame(width: compact ? 60 : 72, alignment: .leading)
          RestBar(endsAt: endsAt)
        }
      }
      if compact {
        Text("Next · \(nextLine)").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.ink).lineLimit(1)
      } else {
        VStack(alignment: .leading, spacing: 2) {
          Text("Next").font(.caption).foregroundStyle(Tone.muted)
          Text(nextLine).font(.subheadline.weight(.semibold)).foregroundStyle(Tone.ink).lineLimit(1)
        }
      }
    }
  }

  private var nextLine: String {
    let target = state.nextTarget.map { " · \($0)" } ?? ""
    return "\(state.exerciseName)\(target)"
  }
}

@available(iOS 16.2, *)
private struct ExpandedBottom: View {
  let workoutName: String
  let state: WorkoutActivityState
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      switch state.phase {
      case .rest:
        RestPanel(state: state, compact: true)
      case .cardio:
        HStack(alignment: .center, spacing: 12) {
          VStack(alignment: .leading, spacing: 2) {
            Text(state.exerciseName).font(.headline).foregroundStyle(Tone.ink).lineLimit(1)
            if let target = state.cardioTargetSeconds {
              Text("Target \(target / 60):\(String(format: "%02d", target % 60))").font(.subheadline).foregroundStyle(Tone.muted)
            }
          }
          Spacer(minLength: 8)
          Actions(state: state)
        }
      case .restOver:
        // The rest Island with the countdown gone: a full green bar, then what comes next.
        Capsule().fill(Tone.success).frame(height: 6)
        Text("Next · \(nextLine)").font(.subheadline.weight(.semibold)).foregroundStyle(Tone.ink).lineLimit(1)
      case .working:
        SetStrip(state: state)
        HStack(alignment: .center, spacing: 12) {
          VStack(alignment: .leading, spacing: 2) {
            Text(state.exerciseName).font(.headline).foregroundStyle(Tone.ink).lineLimit(1)
            if let target = state.nextTarget {
              Text(target).font(.title3.weight(.bold).monospacedDigit()).foregroundStyle(Tone.accent).lineLimit(1)
            } else {
              Text(workoutName).font(.subheadline).foregroundStyle(Tone.muted).lineLimit(1)
            }
          }
          Spacer(minLength: 8)
          Actions(state: state)
        }
      case .done:
        Text(state.summary ?? "Workout logged").font(.subheadline).foregroundStyle(Tone.ink)
      }
    }
    .padding(.horizontal, 8)
    .padding(.top, state.phase == .rest ? 0 : 4)
  }

  private var nextLine: String {
    let target = state.nextTarget.map { " · \($0)" } ?? ""
    return "\(state.exerciseName)\(target)"
  }
}

// MARK: - Island, compact and minimal

@available(iOS 16.2, *)
private struct CompactLeading: View {
  let state: WorkoutActivityState
  var body: some View {
    glyph
      .padding(.leading, 2)
  }

  @ViewBuilder private var glyph: some View {
    switch state.phase {
    case .rest:
      Image(systemName: "timer").foregroundStyle(Tone.accent)
    case .cardio:
      Image(systemName: "figure.run").foregroundStyle(Tone.ink)
    case .restOver:
      Image(systemName: "checkmark.circle.fill").foregroundStyle(Tone.success)
    case .working:
      Image(systemName: "dumbbell.fill").foregroundStyle(Tone.ink)
    case .done:
      Image(systemName: "dumbbell.fill").foregroundStyle(Tone.muted)
    }
  }
}

@available(iOS 16.2, *)
private struct CompactTrailing: View {
  let state: WorkoutActivityState
  var body: some View {
    Group {
      switch state.phase {
      case .rest:
        if let endsAt = state.restEndsAt {
          HStack(spacing: 3) {
            Text("Rest")
            RestClock(endsAt: endsAt)
              .frame(width: 34, alignment: .trailing)
          }
          .foregroundStyle(Tone.accent)
        }
      case .cardio:
        if let startedAt = state.cardioStartedAt { ElapsedClock(startedAt: startedAt, width: ClockWidth.compact).foregroundStyle(Tone.ink) }
      case .restOver:
        Text("Rest over").minimumScaleFactor(0.7).foregroundStyle(Tone.success)
      case .working:
        // The workout's elapsed time, from the moment a rest runs out (no "Rest over" step in the compact Island).
        ElapsedClock(startedAt: state.startedAt, width: ClockWidth.compact).foregroundStyle(Tone.muted)
      case .done:
        EmptyView()
      }
    }
    .font(.caption.weight(.semibold).monospacedDigit())
    .multilineTextAlignment(.trailing)
    .padding(.trailing, 2)
    .lineLimit(1)
  }
}

/// The circle beside another activity: a ring for the rest, a clock for cardio, the barbell otherwise.
@available(iOS 16.2, *)
private struct Minimal: View {
  let state: WorkoutActivityState
  var body: some View {
    switch state.phase {
    case .rest:
      if let endsAt = state.restEndsAt, let interval = restInterval(endsAt) {
        ProgressView(timerInterval: interval, countsDown: true, label: { EmptyView() }, currentValueLabel: { EmptyView() })
          .progressViewStyle(.circular)
          .tint(Tone.accent)
      } else {
        Image(systemName: "timer").foregroundStyle(Tone.accent)
      }
    case .cardio:
      Image(systemName: "figure.run").foregroundStyle(Tone.ink)
    case .restOver:
      Image(systemName: "checkmark.circle.fill").foregroundStyle(Tone.success)
    case .working, .done:
      Image(systemName: "dumbbell.fill").foregroundStyle(state.phase == .done ? Tone.muted : Tone.ink)
    }
  }
}
