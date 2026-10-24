import SwiftUI

/// The Iron palette's dark tokens (theme/palette.ts), on watchOS's black.
enum Iron {
  static let ink = Color(red: 0xF2 / 255, green: 0xF1 / 255, blue: 0xEF / 255)
  static let muted = Color(red: 0x9A / 255, green: 0x98 / 255, blue: 0x95 / 255)
  static let raised = Color(red: 0x2A / 255, green: 0x2B / 255, blue: 0x2F / 255)
  static let accent = Color(red: 0xFF / 255, green: 0x7A / 255, blue: 0x3D / 255)
  static let accentTint = Color(red: 0x3A / 255, green: 0x24 / 255, blue: 0x18 / 255)
  static let success = Color(red: 0x4F / 255, green: 0xC7 / 255, blue: 0x8F / 255)
  static let onSuccess = Color(red: 0x14 / 255, green: 0x15 / 255, blue: 0x17 / 255)
  static let error = Color(red: 0xEF / 255, green: 0x6B / 255, blue: 0x6B / 255)
  static let errorTint = Color(red: 0x3B / 255, green: 0x20 / 255, blue: 0x20 / 255)

  /// Sora for numbers and titles, Manrope for the rest, as on the phone.
  static func display(_ size: CGFloat) -> Font { .custom("Sora-Bold", size: size) }
  static func body(_ size: CGFloat, _ weight: Font.Weight = .semibold) -> Font {
    .custom(weight == .bold ? "Manrope-Bold" : "Manrope-SemiBold", size: size)
  }
}

/// A full-width button's label, centred: an icon and its title, or the title alone.
struct ButtonLabel: View {
  let title: String
  var systemImage: String? = nil
  var body: some View {
    HStack(spacing: 6) {
      if let systemImage { Image(systemName: systemImage) }
      Text(title)
    }
    .font(Iron.body(16, .bold))
    .frame(maxWidth: .infinity, alignment: .center)
  }
}

/// Eight hours: the far end of an elapsed clock's range.
private let longestWorkout: TimeInterval = 8 * 60 * 60

/// The workout's elapsed time, ticking on the Watch. A running timer text asks for the width of the longest time it
/// could show (eight hours), which pushed the screen past its edges and the buttons off centre: it gets a fixed width
/// and shrinks to fit.
struct ElapsedClock: View {
  let since: Date
  var width: CGFloat = 64
  var body: some View {
    Text(timerInterval: since...since.addingTimeInterval(longestWorkout), countsDown: false)
      .monospacedDigit()
      .lineLimit(1)
      .minimumScaleFactor(0.5)
      .frame(width: width, alignment: .leading)
  }
}

/// The screen for whatever the phone says is happening (designed on the FlexCoach canvas, 2026-10-24).
struct RootView: View {
  @ObservedObject var session: WatchSession

  var body: some View {
    Group {
      if let state = session.state {
        switch state.phase {
        case .rest: RestView(state: state, onSkip: session.skipRest)
        case .cardio: CardioView(state: state, onPause: session.pauseCardio)
        case .done: DoneView(name: session.workoutName ?? "Workout", state: state, onClose: session.dismissDone)
        case .working, .restOver:
          if state.timed == true {
            PausedView(state: state, onPlay: session.resumeCardio, onEnd: session.logSet)
          } else {
            SetView(state: state, onLog: session.logSet)
          }
        }
      } else {
        IdleView()
      }
    }
    .foregroundStyle(Iron.ink)
  }
}

/// No workout running. Starting one from the Watch comes in a later step of v1 #6.
struct IdleView: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("FlexCoach").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent)
      Spacer(minLength: 0)
      Text("No workout running").font(Iron.display(18))
      Text("Start one on your phone and it shows up here.").font(Iron.body(13)).foregroundStyle(Iron.muted)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// "Set 2 of 3" as a strip: done in green, the next in the accent, the rest grey. Nothing for a warm-up set.
struct SetStrip: View {
  let label: String
  var body: some View {
    let parts = label.split(separator: " ")
    if parts.count == 4, let current = Int(parts[1]), let total = Int(parts[3]), total > 0, total <= 12 {
      HStack(spacing: 3) {
        ForEach(1...total, id: \.self) { n in
          Capsule().fill(n < current ? Iron.success : n == current ? Iron.accent : Iron.raised).frame(height: 4)
        }
      }
    }
  }
}

/// The next set: its exercise and target with Log set; after a rest that ran out, "Rest over" above it.
struct SetView: View {
  let state: WorkoutActivityState
  let onLog: () -> Void
  private var restOver: Bool { state.phase == .restOver || state.restEndedAt != nil }

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      ElapsedClock(since: state.startedAt).font(Iron.body(13, .bold)).foregroundStyle(Iron.accent)
      if restOver {
        Label("Rest over", systemImage: "checkmark.circle.fill").font(Iron.body(15, .bold)).foregroundStyle(Iron.success)
      }
      Text(state.exerciseName).font(Iron.body(13)).lineLimit(1)
      SetStrip(label: state.setLabel)
      Text(state.setLabel).font(Iron.body(12)).foregroundStyle(Iron.muted)
      if let target = state.nextTarget {
        Text(target).font(Iron.display(26)).foregroundStyle(Iron.accent).minimumScaleFactor(0.6).lineLimit(1)
      }
      Spacer(minLength: 4)
      if state.nextSetId != nil {
        // Grey, as the set's check is on the phone: green means logged.
        Button(action: onLog) { ButtonLabel(title: "Log set", systemImage: "checkmark") }
          .buttonStyle(.borderedProminent)
          .tint(Iron.raised)
          .foregroundStyle(Iron.ink)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// Resting: the countdown in a ring, what comes next, and Skip rest.
struct RestView: View {
  let state: WorkoutActivityState
  let onSkip: () -> Void

  var body: some View {
    VStack(spacing: 4) {
      HStack {
        Text("Rest").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent)
        Spacer()
      }
      if let endsAt = state.restEndsAt, endsAt > Date() {
        let interval = Date()...endsAt
        ZStack {
          ProgressView(timerInterval: interval, countsDown: true, label: { EmptyView() }, currentValueLabel: { EmptyView() })
            .progressViewStyle(.circular)
            .tint(Iron.accent)
            .scaleEffect(2.2)
          VStack(spacing: 0) {
            Text(timerInterval: interval, countsDown: true).font(Iron.display(26)).monospacedDigit()
              .lineLimit(1).minimumScaleFactor(0.5).multilineTextAlignment(.center).frame(width: 76)
            Text("of \(state.restSeconds / 60):\(String(format: "%02d", state.restSeconds % 60))").font(Iron.body(11)).foregroundStyle(Iron.muted)
          }
        }
        .frame(height: 100)
      }
      Text("Next · \(state.nextTarget ?? state.exerciseName)").font(Iron.body(12)).foregroundStyle(Iron.muted).lineLimit(1)
      Spacer(minLength: 4)
      Button(action: onSkip) { ButtonLabel(title: "Skip rest") }
      .buttonStyle(.borderedProminent)
      .tint(Iron.accentTint)
      .foregroundStyle(Iron.accent)
    }
  }
}

/// A timed exercise running: its clock large, then Pause (owner, 2026-10-24: pause, then play or end). Distance,
/// pace, heart rate and calories join it with the Watch's own workout tracking (a later step of v1 #6).
struct CardioView: View {
  let state: WorkoutActivityState
  let onPause: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label(state.exerciseName, systemImage: "figure.run").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent).lineLimit(1)
      if let started = state.cardioStartedAt {
        ElapsedClock(since: started, width: 150).font(Iron.display(38)).foregroundStyle(Iron.accent)
      }
      if let target = state.cardioTargetSeconds {
        Text("Target \(target / 60):\(String(format: "%02d", target % 60))").font(Iron.body(12)).foregroundStyle(Iron.muted)
      }
      Spacer(minLength: 4)
      Button(action: onPause) { ButtonLabel(title: "Pause", systemImage: "pause.fill") }
        .buttonStyle(.borderedProminent)
        .tint(Iron.raised)
        .foregroundStyle(Iron.ink)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// A timed set waiting or paused: its time so far, Start to carry on (or begin), End to log it.
struct PausedView: View {
  let state: WorkoutActivityState
  let onPlay: () -> Void
  let onEnd: () -> Void
  private var seconds: Int { state.elapsedSec ?? 0 }

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label(state.exerciseName, systemImage: "figure.run").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent).lineLimit(1)
      Text(seconds > 0 ? "Paused" : "Ready").font(Iron.body(12)).foregroundStyle(Iron.muted)
      Text(seconds >= 3600 ? String(format: "%d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60) : String(format: "%d:%02d", seconds / 60, seconds % 60))
        .font(Iron.display(38)).monospacedDigit().minimumScaleFactor(0.6).lineLimit(1)
      Spacer(minLength: 4)
      HStack(spacing: 8) {
        Button(action: onPlay) { ButtonLabel(title: "Start", systemImage: "play.fill") }
          .buttonStyle(.borderedProminent)
          .tint(Iron.accentTint)
          .foregroundStyle(Iron.accent)
        // Ending logs the time so far; with nothing on the clock there is nothing to end.
        if seconds > 0 {
          Button(action: onEnd) { ButtonLabel(title: "End") }
            .buttonStyle(.borderedProminent)
            .tint(Iron.raised)
            .foregroundStyle(Iron.ink)
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// Finished: the summary the phone sends ("18 sets · 12,400 lb · 1 record"), until it is closed.
struct DoneView: View {
  let name: String
  let state: WorkoutActivityState
  let onClose: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label("Workout done", systemImage: "checkmark.circle.fill").font(Iron.body(13, .bold)).foregroundStyle(Iron.success)
      Text(name).font(Iron.display(22)).lineLimit(1)
      Text(state.summary ?? "Workout logged").font(Iron.body(13)).foregroundStyle(Iron.muted)
      Spacer(minLength: 4)
      Text("Records and badges are on your phone.").font(Iron.body(12)).foregroundStyle(Iron.muted)
      Button(action: onClose) { ButtonLabel(title: "Done") }
      .buttonStyle(.bordered)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}
