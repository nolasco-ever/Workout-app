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

/// A full-width button's label, centred: an icon and its title, or the title alone. Manrope's line is taller above
/// the letters than below, so its words sit low on the line: they are lifted by the difference. The icon takes no
/// height of its own (a symbol beside the words made the label taller on one side, which is why Log set sat off
/// centre while the plain Skip rest did not), so it is drawn on the button's middle.
struct ButtonLabel: View {
  let title: String
  var systemImage: String? = nil
  private let size: CGFloat = 16
  var body: some View {
    HStack(spacing: 6) {
      if let systemImage { Image(systemName: systemImage).frame(height: 0) }
      Text(title).offset(y: -size * 0.09)
    }
    .font(Iron.body(size, .bold))
    .frame(maxWidth: .infinity, alignment: .center)
  }
}

/// Finish workout, once every set is in, asked first as on the phone: a stray tap would end the workout for good.
struct FinishButton: View {
  @ObservedObject var session: WatchSession
  @State private var confirming = false
  var body: some View {
    Button { confirming = true } label: {
      if session.finishing { ProgressView().frame(maxWidth: .infinity) } else { ButtonLabel(title: "Finish workout") }
    }
    .buttonStyle(.borderedProminent)
    .tint(Iron.success)
    .foregroundStyle(Iron.onSuccess)
    .disabled(session.finishing)
    .confirmationDialog("Finish workout?", isPresented: $confirming) {
      Button("Finish") { session.finishWorkout() }
      Button("Keep going", role: .cancel) {}
    }
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
  @ObservedObject var workout: WorkoutManager

  var body: some View {
    Group {
      if let state = session.state {
        switch state.phase {
        case .rest: RestView(state: state, workout: workout, onSkip: session.skipRest)
        case .cardio: CardioView(state: state, workout: workout, onPause: session.pauseCardio)
        case .done: DoneView(name: session.workoutName ?? "Workout", state: state, done: session.done, workout: workout, onClose: session.dismissDone)
        case .working, .restOver:
          if session.exercises.isEmpty {
            NextSetView(session: session, workout: workout, state: state)
          } else {
            ExercisePager(session: session, workout: workout, state: state)
          }
        }
      } else if let starting = session.starting {
        StartingView(session: session, starting: starting)
      } else {
        HomeView(session: session)
      }
    }
    .foregroundStyle(Iron.ink)
  }
}

/// The next set, logged with Log set, or a timed one with Start and End, or Finish once every set is in.
struct NextSetView: View {
  @ObservedObject var session: WatchSession
  let workout: WorkoutManager
  let state: WorkoutActivityState
  var body: some View {
    VStack(spacing: 4) {
      NextSetContent(workout: workout, state: state, position: nil)
      SetActions(session: session, state: state)
    }
  }
}

/// What the next set is: a set to log, or a timed one waiting or paused.
struct NextSetContent: View {
  let workout: WorkoutManager
  let state: WorkoutActivityState
  let position: String?
  var body: some View {
    if state.timed == true {
      PausedView(state: state, position: position)
    } else {
      SetView(state: state, workout: workout, position: position)
    }
  }
}

/// The buttons for the next set, under the content rather than in it, so they sit on the screen's width as Skip rest
/// does, and stay put while the exercises swipe past above them.
struct SetActions: View {
  @ObservedObject var session: WatchSession
  let state: WorkoutActivityState
  private var seconds: Int { state.elapsedSec ?? 0 }

  var body: some View {
    if state.nextSetId == nil {
      FinishButton(session: session)
    } else if state.timed == true {
      HStack(spacing: 8) {
        Button(action: session.resumeCardio) { ButtonLabel(title: "Start", systemImage: "play.fill") }
          .buttonStyle(.borderedProminent)
          .tint(Iron.accentTint)
          .foregroundStyle(Iron.accent)
        // Ending logs the time so far; with nothing on the clock there is nothing to end.
        if seconds > 0 {
          Button(action: session.logSet) { ButtonLabel(title: "End") }
            .buttonStyle(.borderedProminent)
            .tint(Iron.raised)
            .foregroundStyle(Iron.ink)
        }
      }
    } else {
      // Grey, as the set's check is on the phone: green means logged.
      Button(action: session.logSet) { ButtonLabel(title: "Log set", systemImage: "checkmark") }
        .buttonStyle(.borderedProminent)
        .tint(Iron.raised)
        .foregroundStyle(Iron.ink)
    }
  }
}

/// Between sets, the workout's exercises a swipe apart, left and right (owner, 2026-10-24). A swipe moves the phone to
/// that exercise, whose next set comes back to log here; a finished exercise just says so. The buttons stay below
/// the pages. Rests, a running clock and the summary stay on one screen.
struct ExercisePager: View {
  @ObservedObject var session: WatchSession
  let workout: WorkoutManager
  let state: WorkoutActivityState
  @State private var selection = 0

  var body: some View {
    VStack(spacing: 4) {
      TabView(selection: $selection) {
        ForEach(Array(session.exercises.enumerated()), id: \.element.id) { index, exercise in
          page(index, exercise).tag(index)
        }
      }
      .tabViewStyle(.page(indexDisplayMode: .never))
      if selection == session.exerciseIndex {
        SetActions(session: session, state: state)
      } else if session.exercises.allSatisfy(\.done) {
        FinishButton(session: session)
      }
    }
    .onAppear { selection = session.exerciseIndex ?? 0 }
    // The phone moved on (the last set of an exercise logged, or a tap there): the Watch follows.
    .onChange(of: session.exerciseIndex) { _, index in
      if let index { selection = index }
    }
    .onChange(of: selection) { _, index in session.showExercise(at: index) }
  }

  @ViewBuilder
  private func page(_ index: Int, _ exercise: WatchExercise) -> some View {
    let position = "\(index + 1)/\(session.exercises.count)"
    if index == session.exerciseIndex {
      NextSetContent(workout: workout, state: state, position: position)
    } else {
      VStack(alignment: .leading, spacing: 4) {
        TopLine(workout: workout) {
          ElapsedClock(since: state.startedAt).font(Iron.body(13, .bold)).foregroundStyle(Iron.accent)
        }
        ExerciseTitle(name: exercise.name, position: position)
        if exercise.done {
          Label("All sets logged", systemImage: "checkmark.circle.fill").font(Iron.body(15, .bold)).foregroundStyle(Iron.success)
        } else {
          // Waiting for the phone to send this exercise's next set.
          ProgressView().frame(maxWidth: .infinity).padding(.top, 8)
        }
        Spacer(minLength: 0)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

/// The exercise's name, with its place in the workout ("2/5") when there are pages to swipe through.
struct ExerciseTitle: View {
  let name: String
  let position: String?
  var body: some View {
    HStack(spacing: 4) {
      Text(name).font(Iron.body(13)).lineLimit(1)
      Spacer(minLength: 2)
      if let position { Text(position).font(Iron.body(12)).monospacedDigit().foregroundStyle(Iron.muted) }
    }
  }
}

/// Heart rate and calories from the Watch's Health workout, once it measures them; only on the Watch (owner, 2026-10-24).
struct LiveMetrics: View {
  @ObservedObject var workout: WorkoutManager
  var body: some View {
    if workout.running {
      HStack(spacing: 6) {
        if let bpm = workout.heartRate {
          HStack(spacing: 2) {
            Image(systemName: "heart.fill")
            Text("\(Int(bpm.rounded()))").monospacedDigit()
          }
          .foregroundStyle(Iron.error)
        }
        Text("\(Int(workout.kcal.rounded())) cal").monospacedDigit().foregroundStyle(Iron.muted)
      }
      .font(Iron.body(12, .bold))
      .lineLimit(1)
      .minimumScaleFactor(0.8)
    }
  }
}

/// The top line: one thing on the left (the elapsed clock, "Rest"), the live metrics on the right.
struct TopLine<Leading: View>: View {
  let workout: WorkoutManager
  @ViewBuilder let leading: Leading
  var body: some View {
    HStack(spacing: 0) {
      leading
      Spacer(minLength: 4)
      LiveMetrics(workout: workout).layoutPriority(1)
    }
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

/// The next set: its exercise and target (Log set is below it, SetActions); after a rest that ran out, "Rest over" by the clock.
struct SetView: View {
  let state: WorkoutActivityState
  let workout: WorkoutManager
  let position: String?
  private var restOver: Bool { state.phase == .restOver || state.restEndedAt != nil }

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      // "Rest over" rides beside the clock for its few seconds, so the set below never moves. The three share one
      // line: the clock narrows to its time, and "Rest over" shrinks before the metrics do.
      TopLine(workout: workout) {
        HStack(spacing: 4) {
          ElapsedClock(since: state.startedAt, width: restOver ? 40 : 64).font(Iron.body(13, .bold)).foregroundStyle(Iron.accent)
          if restOver {
            Text("Rest over").font(Iron.body(11, .bold)).foregroundStyle(Iron.success).lineLimit(1).minimumScaleFactor(0.7)
          }
        }
      }
      ExerciseTitle(name: state.exerciseName, position: position)
      SetStrip(label: state.setLabel)
      Text(state.setLabel).font(Iron.body(12)).foregroundStyle(Iron.muted)
      if let target = state.nextTarget {
        Text(target).font(Iron.display(26)).foregroundStyle(Iron.accent).minimumScaleFactor(0.6).lineLimit(1)
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// Resting: the countdown in a ring with "Rest" in it, what comes next, the live metrics, and Skip rest. Everything is
/// centred under the ring: a line along the top ran under the clock and into the screen's rounded corners.
struct RestView: View {
  let state: WorkoutActivityState
  let workout: WorkoutManager
  let onSkip: () -> Void

  var body: some View {
    VStack(spacing: 2) {
      if let endsAt = state.restEndsAt, endsAt > Date() {
        let interval = Date()...endsAt
        ZStack {
          ProgressView(timerInterval: interval, countsDown: true, label: { EmptyView() }, currentValueLabel: { EmptyView() })
            .progressViewStyle(.circular)
            .tint(Iron.accent)
            .scaleEffect(2.0)
          VStack(spacing: 0) {
            Text("Rest").font(Iron.body(11, .bold)).foregroundStyle(Iron.accent)
            Text(timerInterval: interval, countsDown: true).font(Iron.display(24)).monospacedDigit()
              .lineLimit(1).minimumScaleFactor(0.5).multilineTextAlignment(.center).frame(width: 66)
          }
        }
        .frame(height: 84)
        .padding(.bottom, 8)
      } else {
        Text("Rest").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent)
      }
      Text("Next · \(state.nextTarget ?? state.exerciseName)").font(Iron.body(12)).foregroundStyle(Iron.muted).lineLimit(1)
      LiveMetrics(workout: workout)
      Spacer(minLength: 4)
      Button(action: onSkip) { ButtonLabel(title: "Skip rest") }
      .buttonStyle(.borderedProminent)
      .tint(Iron.accentTint)
      .foregroundStyle(Iron.accent)
    }
    .frame(maxWidth: .infinity)
  }
}

/// A timed exercise running: its clock large, then Pause (owner, 2026-10-24: pause, then play or end). Distance,
/// pace, heart rate and calories join it with the Watch's own workout tracking (a later step of v1 #6).
struct CardioView: View {
  let state: WorkoutActivityState
  let workout: WorkoutManager
  let onPause: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      TopLine(workout: workout) {
        Label(state.exerciseName, systemImage: "figure.run").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent).lineLimit(1)
      }
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

/// A timed set waiting or paused: its time so far, with Start to carry on (or begin) and End to log it below (SetActions).
struct PausedView: View {
  let state: WorkoutActivityState
  let position: String?
  private var seconds: Int { state.elapsedSec ?? 0 }

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack(spacing: 4) {
        Label(state.exerciseName, systemImage: "figure.run").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent).lineLimit(1)
        Spacer(minLength: 2)
        if let position { Text(position).font(Iron.body(12)).monospacedDigit().foregroundStyle(Iron.muted) }
      }
      Text(seconds > 0 ? "Paused" : "Ready").font(Iron.body(12)).foregroundStyle(Iron.muted)
      Text(seconds >= 3600 ? String(format: "%d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60) : String(format: "%d:%02d", seconds / 60, seconds % 60))
        .font(Iron.display(38)).monospacedDigit().minimumScaleFactor(0.6).lineLimit(1)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// Finished: the workout's numbers in a list to scroll, the phone's (time, sets, volume, records) then the Watch's
/// (calories, heart rate), each only when there is one (owner, 2026-10-24), until it is closed.
struct DoneView: View {
  let name: String
  let state: WorkoutActivityState
  let done: WatchDone?
  @ObservedObject var workout: WorkoutManager
  let onClose: () -> Void

  private var rows: [(String, String)] {
    var rows: [(String, String)] = []
    if let done {
      let s = done.durationSec
      rows.append(("Time", s >= 3600 ? String(format: "%d:%02d:%02d", s / 3600, s / 60 % 60, s % 60) : String(format: "%d:%02d", s / 60, s % 60)))
      rows.append(("Sets", "\(done.sets)"))
      if let volume = done.volume { rows.append(("Volume", volume)) }
      if done.records > 0 { rows.append(("Records", "\(done.records)")) }
    }
    if let totals = workout.totals {
      if totals.kcal >= 1 { rows.append(("Calories", "\(Int(totals.kcal.rounded()))")) }
      if totals.avgBpm > 0 { rows.append(("Avg heart rate", "\(Int(totals.avgBpm.rounded())) bpm")) }
      if totals.maxBpm > 0 { rows.append(("Max heart rate", "\(Int(totals.maxBpm.rounded())) bpm")) }
    }
    return rows
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Label("Workout done", systemImage: "checkmark.circle.fill").font(Iron.body(13, .bold)).foregroundStyle(Iron.success)
        Text(name).font(Iron.display(22)).lineLimit(2)
        if rows.isEmpty {
          Text(state.summary ?? "Workout logged").font(Iron.body(13)).foregroundStyle(Iron.muted)
        }
        ForEach(rows, id: \.0) { label, value in
          VStack(alignment: .leading, spacing: 0) {
            Text(label).font(Iron.body(12)).foregroundStyle(Iron.muted)
            Text(value).font(Iron.display(20)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.6)
          }
        }
        Button(action: onClose) { ButtonLabel(title: "Done") }
          .buttonStyle(.bordered)
          .padding(.top, 4)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}
