import SwiftUI

/// The Watch with no workout running (v1 #6, step 4, designed on the FlexCoach canvas 2026-10-25): the phone's
/// Workout tab in small, as data/liveActivity/watchHome.ts builds it. The cycle's headline, today's card (the workout
/// with Start and Preview exercises, or the rest day), Quick workout, and the cycle's days. Starting anything asks the
/// phone, which starts it as its own buttons do; the workout then shows up here as usual.
struct WatchHome: Equatable {
  struct Headline: Equatable {
    let overline: String
    let title: String
    let progress: String
  }

  struct Today: Equatable {
    /// "workout", "rest" or "notStarted".
    let kind: String
    let title: String
    let name: String
    let detail: String
    let status: String
    let occurrenceId: String?
    let workoutId: String?
  }

  struct Day: Identifiable, Hashable {
    var id: String { occurrenceId ?? date }
    let date: String
    let weekday: String
    let day: Int
    let name: String
    let status: String
    let today: Bool
    let occurrenceId: String?
    let workoutId: String?
    let startLabel: String?
  }

  struct Exercise: Hashable {
    let name: String
    let sets: Int
  }

  struct Recent: Identifiable, Equatable {
    let id: String
    let name: String
    let last: String?
  }

  let headline: Headline?
  let today: Today?
  let inProgress: (sessionId: String, name: String)?
  let empty: (title: String, text: String)?
  let days: [Day]
  let workouts: [String: (name: String, exercises: [Exercise])]
  let recent: [Recent]

  init(_ raw: [String: Any]) {
    if let h = raw["headline"] as? [String: Any] {
      headline = Headline(overline: h["overline"] as? String ?? "", title: h["title"] as? String ?? "", progress: h["progress"] as? String ?? "")
    } else {
      headline = nil
    }
    if let t = raw["today"] as? [String: Any], let kind = t["kind"] as? String {
      // A rest day's heading and line take the workout's name and detail places.
      today = Today(
        kind: kind,
        title: t["title"] as? String ?? "",
        name: t["name"] as? String ?? t["heading"] as? String ?? "",
        detail: t["detail"] as? String ?? t["text"] as? String ?? "",
        status: t["status"] as? String ?? "",
        occurrenceId: t["occurrenceId"] as? String,
        workoutId: t["workoutId"] as? String
      )
    } else {
      today = nil
    }
    if let p = raw["inProgress"] as? [String: Any], let id = p["sessionId"] as? String {
      inProgress = (id, p["name"] as? String ?? "Workout")
    } else {
      inProgress = nil
    }
    if let e = raw["empty"] as? [String: Any] {
      empty = (e["title"] as? String ?? "", e["text"] as? String ?? "")
    } else {
      empty = nil
    }
    days = (raw["days"] as? [[String: Any]] ?? []).compactMap { d in
      guard let date = d["date"] as? String else { return nil }
      return Day(
        date: date,
        weekday: d["weekday"] as? String ?? "",
        day: d["day"] as? Int ?? 0,
        name: d["name"] as? String ?? "",
        status: d["status"] as? String ?? "rest",
        today: d["today"] as? Bool ?? false,
        occurrenceId: d["occurrenceId"] as? String,
        workoutId: d["workoutId"] as? String,
        startLabel: d["startLabel"] as? String
      )
    }
    var workouts: [String: (name: String, exercises: [Exercise])] = [:]
    for (id, value) in raw["workouts"] as? [String: [String: Any]] ?? [:] {
      let exercises = (value["exercises"] as? [[String: Any]] ?? []).map { Exercise(name: $0["name"] as? String ?? "", sets: $0["sets"] as? Int ?? 0) }
      workouts[id] = (value["name"] as? String ?? "", exercises)
    }
    self.workouts = workouts
    recent = (raw["recent"] as? [[String: Any]] ?? []).compactMap { r in
      guard let id = r["id"] as? String, let name = r["name"] as? String else { return nil }
      return Recent(id: id, name: name, last: r["last"] as? String)
    }
  }

  static func == (a: WatchHome, b: WatchHome) -> Bool {
    a.headline == b.headline && a.today == b.today && a.inProgress?.sessionId == b.inProgress?.sessionId && a.inProgress?.name == b.inProgress?.name
      && a.empty?.title == b.empty?.title && a.empty?.text == b.empty?.text && a.days == b.days && a.recent == b.recent
      && a.workouts.mapValues { $0.name } == b.workouts.mapValues { $0.name } && a.workouts.mapValues { $0.exercises } == b.workouts.mapValues { $0.exercises }
  }
}

/// A start tapped on the Watch, waiting for the phone.
struct WatchStarting: Equatable {
  enum Kind: String {
    case startWorkout, startQuick, resumeWorkout
  }

  let kind: Kind
  /// The occurrence, the exercise ids joined by commas, or the session.
  let id: String
  let name: String
  var failed: Bool
}

/// A search on the Watch and the phone's answer: nil results while it looks.
struct WatchSearch: Equatable {
  struct Result: Identifiable, Equatable {
    let id: String
    let name: String
    let detail: String?

    init?(_ raw: [String: Any]) {
      guard let id = raw["id"] as? String, let name = raw["name"] as? String else { return nil }
      self.id = id
      self.name = name
      detail = raw["detail"] as? String
    }
  }

  let query: String
  var results: [Result]?
  var failed = false
}

extension Iron {
  static let surface = Color(red: 0x1E / 255, green: 0x1F / 255, blue: 0x22 / 255)
  static let line = Color(red: 0x2B / 255, green: 0x2C / 255, blue: 0x30 / 255)
  static let outline = Color(red: 0x3A / 255, green: 0x3B / 255, blue: 0x40 / 255)
  static let faint = Color(red: 0x6E / 255, green: 0x6C / 255, blue: 0x69 / 255)
  static let onAccent = Color(red: 0x1A / 255, green: 0x1A / 255, blue: 0x1C / 255)

  static func overline(_ text: String, _ color: Color = Iron.muted) -> some View {
    Text(text.uppercased()).font(Iron.body(11, .bold)).tracking(0.6).foregroundStyle(color).lineLimit(2)
  }
}

/// A pill button as on the canvas: filled, outlined, or quiet (the label alone).
struct PillStyle: ButtonStyle {
  enum Kind { case filled, raised, outline, quiet }
  var kind: Kind = .filled
  var height: CGFloat = 40

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .foregroundStyle(kind == .filled ? Iron.onAccent : kind == .quiet ? Iron.accent : Iron.ink)
      .frame(maxWidth: .infinity, minHeight: height)
      .background(Capsule().fill(kind == .filled ? Iron.accent : kind == .raised ? Iron.raised : .clear))
      .overlay(Capsule().strokeBorder(kind == .outline ? Iron.outline : .clear, lineWidth: 1.5))
      .opacity(configuration.isPressed ? 0.7 : 1)
      .contentShape(Capsule())
  }
}

private enum HomeRoute: Hashable {
  case day(WatchHome.Day)
  case quick
}

/// The home: what the Workout tab shows, top to bottom.
struct HomeView: View {
  @ObservedObject var session: WatchSession

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 6) {
          // The app's name as the first line rather than the navigation title, which sat inset from the content's
          // edge and made the screen look lop-sided.
          Text("FlexCoach").font(Iron.body(13, .bold)).foregroundStyle(Iron.accent)
          if let home = session.home {
            content(home)
          } else {
            // Nothing from the phone yet (it has not opened FlexCoach since the Watch app was installed).
            Text("Open FlexCoach on your phone and your plan shows up here.").font(Iron.body(13)).foregroundStyle(Iron.muted)
            quickButton
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .navigationDestination(for: HomeRoute.self) { route in
        switch route {
        case .day(let day): PreviewView(session: session, day: day)
        case .quick: QuickPickView(session: session)
        }
      }
    }
    .tint(Iron.accent)
  }

  private var quickButton: some View {
    NavigationLink(value: HomeRoute.quick) {
      Label("Quick workout", systemImage: "bolt").font(Iron.body(14, .bold))
    }
    .buttonStyle(PillStyle(kind: .outline))
  }

  @ViewBuilder
  private func content(_ home: WatchHome) -> some View {
    if let resume = home.inProgress {
      Card {
        Iron.overline("In progress", Iron.accent)
        Text(resume.name).font(Iron.display(20)).lineLimit(2)
        Button { session.start(.resumeWorkout, id: resume.sessionId, name: resume.name) } label: {
          Label("Resume workout", systemImage: "play.fill").font(Iron.body(15, .bold))
        }
        .buttonStyle(PillStyle())
        .padding(.top, 4)
      }
    }
    if let headline = home.headline {
      Iron.overline(headline.overline).padding(.top, 4)
      HStack(alignment: .firstTextBaseline) {
        Text(headline.title).font(Iron.display(18)).lineLimit(1).minimumScaleFactor(0.7)
        Spacer(minLength: 4)
        Text(headline.progress).font(Iron.body(11)).foregroundStyle(Iron.muted).lineLimit(1)
      }
    }
    if let empty = home.empty {
      Text(empty.title).font(Iron.display(18)).padding(.top, 4)
      Text(empty.text).font(Iron.body(13)).foregroundStyle(Iron.muted)
    }
    if let today = home.today { todayCard(today, home) }
    if home.inProgress == nil { quickButton }
    if !home.days.isEmpty {
      Text("This cycle").font(Iron.display(15)).padding(.top, 6)
      VStack(spacing: 0) {
        ForEach(Array(home.days.enumerated()), id: \.element.id) { index, day in
          if index > 0 { Iron.line.frame(height: 1) }
          if day.workoutId != nil {
            NavigationLink(value: HomeRoute.day(day)) { DayRow(day: day) }.buttonStyle(.plain)
          } else {
            DayRow(day: day)
          }
        }
      }
      .background(RoundedRectangle(cornerRadius: 16).fill(Iron.surface))
      .clipShape(RoundedRectangle(cornerRadius: 16))
    }
  }

  @ViewBuilder
  private func todayCard(_ today: WatchHome.Today, _ home: WatchHome) -> some View {
    Card {
      Iron.overline(today.title)
      Text(today.name).font(Iron.display(20)).lineLimit(2)
      Text(today.detail).font(Iron.body(12)).foregroundStyle(Iron.muted)
      if today.kind == "workout", let occurrenceId = today.occurrenceId {
        switch today.status {
        case "scheduled":
          Button { session.start(.startWorkout, id: occurrenceId, name: today.name) } label: {
            Label("Start workout", systemImage: "play.fill").font(Iron.body(15, .bold))
          }
          .buttonStyle(PillStyle())
          .padding(.top, 4)
          if let day = home.days.first(where: { $0.occurrenceId == occurrenceId }) {
            NavigationLink(value: HomeRoute.day(day)) { Text("Preview exercises").font(Iron.body(14, .bold)) }
              .buttonStyle(PillStyle(kind: .quiet, height: 36))
          }
        case "completed":
          Label("Completed", systemImage: "checkmark.circle.fill").font(Iron.body(14, .bold)).foregroundStyle(Iron.success).padding(.top, 4)
        case "skipped":
          Text("Skipped").font(Iron.body(14, .bold)).foregroundStyle(Iron.muted).padding(.top, 4)
        default:
          EmptyView()
        }
      }
    }
  }
}

/// A rounded card on the black, as the phone's.
struct Card<Content: View>: View {
  @ViewBuilder let content: Content
  var body: some View {
    VStack(alignment: .leading, spacing: 4) { content }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(10)
      .background(RoundedRectangle(cornerRadius: 16).fill(Iron.surface))
  }
}

/// One day of the cycle: its weekday and date, the workout (or Rest), and how it went.
private struct DayRow: View {
  let day: WatchHome.Day
  var body: some View {
    HStack(spacing: 8) {
      VStack(alignment: .leading, spacing: 0) {
        Text(day.weekday).font(Iron.body(11, .bold)).tracking(0.4).foregroundStyle(day.today ? Iron.accent : Iron.muted)
        Text("\(day.day)").font(Iron.body(13, .bold)).foregroundStyle(day.today ? Iron.accent : Iron.ink)
      }
      .frame(width: 34, alignment: .leading)
      Text(day.name).font(Iron.body(14, .bold)).foregroundStyle(day.status == "rest" ? Iron.faint : Iron.ink).lineLimit(1)
      Spacer(minLength: 2)
      mark
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 6)
    .frame(minHeight: 44)
    .contentShape(Rectangle())
  }

  @ViewBuilder
  private var mark: some View {
    switch day.status {
    case "completed":
      Image(systemName: "checkmark").font(.system(size: 11, weight: .heavy)).foregroundStyle(Iron.onSuccess).frame(width: 22, height: 22).background(Circle().fill(Iron.success))
    case "skipped":
      Image(systemName: "xmark").font(.system(size: 10, weight: .heavy)).foregroundStyle(Iron.error).frame(width: 22, height: 22).background(Circle().fill(Iron.errorTint))
    case "in_progress":
      Circle().fill(Iron.accent).frame(width: 22, height: 22)
    case "scheduled":
      if day.today {
        Circle().fill(Iron.accent).frame(width: 22, height: 22)
      } else {
        Circle().strokeBorder(Iron.outline, lineWidth: 2).frame(width: 22, height: 22)
      }
    default:
      EmptyView()
    }
  }
}

/// A day's workout: its exercises and sets, and Start when it can start (Preview exercises, or a day tapped).
struct PreviewView: View {
  @ObservedObject var session: WatchSession
  let day: WatchHome.Day

  var body: some View {
    let workout = day.workoutId.flatMap { session.home?.workouts[$0] }
    let exercises = workout?.exercises ?? []
    ScrollView {
      VStack(alignment: .leading, spacing: 4) {
        Text(workout?.name ?? day.name).font(Iron.display(22)).lineLimit(2)
        // Cardio is one entry, not sets: it counts as an exercise only.
        let sets = exercises.reduce(0) { $0 + $1.sets }
        Text("\(exercises.count) exercise\(exercises.count == 1 ? "" : "s")\(sets > 0 ? " · \(sets) set\(sets == 1 ? "" : "s")" : "")").font(Iron.body(12)).foregroundStyle(Iron.muted)
        Iron.line.frame(height: 1).padding(.vertical, 4)
        ForEach(Array(exercises.enumerated()), id: \.offset) { _, exercise in
          HStack(alignment: .firstTextBaseline) {
            Text(exercise.name).font(Iron.body(13)).lineLimit(2)
            Spacer(minLength: 4)
            if exercise.sets > 0 { Text("\(exercise.sets)×").font(Iron.body(13)).foregroundStyle(Iron.muted) }
          }
        }
        if let label = day.startLabel, let occurrenceId = day.occurrenceId, session.home?.inProgress == nil {
          Button { session.start(.startWorkout, id: occurrenceId, name: workout?.name ?? day.name) } label: {
            Label(label, systemImage: "play.fill").font(Iron.body(15, .bold)).lineLimit(1).minimumScaleFactor(0.8)
          }
          .buttonStyle(PillStyle(height: 44))
          .padding(.top, 8)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .navigationTitle(day.today ? "Today" : "\(day.weekday.capitalized) \(day.day)")
  }
}

/// One exercise to pick or unpick: its name, a line under it, and a check once picked.
private struct PickRow: View {
  let name: String
  let detail: String?
  let picked: Bool
  let toggle: () -> Void

  var body: some View {
    Button(action: toggle) {
      HStack(spacing: 8) {
        VStack(alignment: .leading, spacing: 0) {
          Text(name).font(Iron.body(14, .bold)).foregroundStyle(Iron.ink).lineLimit(2)
          if let detail { Text(detail).font(Iron.body(11)).foregroundStyle(Iron.muted).lineLimit(1) }
        }
        Spacer(minLength: 4)
        Image(systemName: picked ? "checkmark" : "plus")
          .font(.system(size: 11, weight: .heavy))
          .foregroundStyle(picked ? Iron.onAccent : Iron.ink)
          .frame(width: 24, height: 24)
          .background(Circle().fill(picked ? Iron.accent : Iron.raised))
      }
      .padding(.horizontal, 10)
      .padding(.vertical, 6)
      .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
      .background(RoundedRectangle(cornerRadius: 14).fill(picked ? Iron.accentTint : Iron.surface))
      .contentShape(RoundedRectangle(cornerRadius: 14))
    }
    .buttonStyle(.plain)
    .accessibilityAddTraits(picked ? .isSelected : [])
  }
}

struct PickedExercise: Identifiable, Hashable {
  let id: String
  let name: String
  let detail: String?
}

/// Quick workout: search by voice, or pick from what was done before, then Start. None picked starts it empty, to
/// fill on the phone as it goes.
struct QuickPickView: View {
  @ObservedObject var session: WatchSession
  @State private var picked: [PickedExercise] = []

  private func toggle(_ exercise: PickedExercise) {
    if let at = picked.firstIndex(where: { $0.id == exercise.id }) { picked.remove(at: at) } else { picked.append(exercise) }
  }

  var body: some View {
    let recent = session.home?.recent ?? []
    // Picked in a search and not among the previous ones: listed first, so they can be unpicked.
    let found = picked.filter { p in !recent.contains { $0.id == p.id } }
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        NavigationLink {
          SearchView(session: session, picked: $picked)
        } label: {
          Label("Search exercises", systemImage: "mic").font(Iron.body(14)).foregroundStyle(Iron.muted)
            .frame(maxWidth: .infinity, minHeight: 40, alignment: .leading)
            .padding(.horizontal, 12)
            .background(Capsule().fill(Iron.surface))
        }
        .buttonStyle(.plain)
        if !found.isEmpty {
          Iron.overline("Added").padding(.top, 8)
          ForEach(found) { exercise in
            PickRow(name: exercise.name, detail: exercise.detail, picked: true) { toggle(exercise) }
          }
        }
        if !recent.isEmpty {
          Iron.overline("Previously done").padding(.top, 8)
          ForEach(recent) { r in
            let exercise = PickedExercise(id: r.id, name: r.name, detail: r.last.map { "Last: \($0)" })
            PickRow(name: r.name, detail: exercise.detail, picked: picked.contains { $0.id == r.id }) { toggle(exercise) }
          }
        }
        Button {
          session.start(.startQuick, id: picked.map(\.id).joined(separator: ","), name: "Quick workout")
        } label: {
          Text(picked.isEmpty ? "Start" : "Start · \(picked.count) exercise\(picked.count == 1 ? "" : "s")").font(Iron.body(15, .bold))
        }
        .buttonStyle(PillStyle(height: 44))
        .padding(.top, 8)
        if picked.isEmpty {
          Text("Or start with none and add them as you go.").font(Iron.body(11)).foregroundStyle(Iron.muted)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .navigationTitle("Quick workout")
  }
}

/// Search by voice (or Scribble): the phone's library answers, and results are picked as on the list before.
struct SearchView: View {
  @ObservedObject var session: WatchSession
  @Binding var picked: [PickedExercise]
  @State private var query = ""

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        TextField("Exercise name", text: $query)
          .font(Iron.body(14))
          .onSubmit { session.searchExercises(query) }
        if let search = session.search, search.query == query.trimmingCharacters(in: .whitespacesAndNewlines), !search.query.isEmpty {
          if search.failed {
            Text("Can't reach your phone. Keep it nearby, or open FlexCoach on it.").font(Iron.body(12)).foregroundStyle(Iron.muted)
          } else if let results = search.results {
            if results.isEmpty {
              Text("Nothing found for \"\(search.query)\".").font(Iron.body(12)).foregroundStyle(Iron.muted)
            }
            ForEach(results) { result in
              let exercise = PickedExercise(id: result.id, name: result.name, detail: result.detail)
              PickRow(name: result.name, detail: result.detail, picked: picked.contains { $0.id == result.id }) {
                if let at = picked.firstIndex(where: { $0.id == result.id }) { picked.remove(at: at) } else { picked.append(exercise) }
              }
            }
          } else {
            ProgressView().frame(maxWidth: .infinity).padding(.top, 8)
          }
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .navigationTitle("Search")
  }
}

/// A start tapped here, while the phone starts it; or, when the phone could not be reached, why, with Try again.
struct StartingView: View {
  @ObservedObject var session: WatchSession
  let starting: WatchStarting

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(spacing: 10) {
          Text(starting.name).font(Iron.body(13, .bold)).foregroundStyle(Iron.accent).lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
          if starting.failed {
            Image(systemName: "iphone.slash").font(.system(size: 26)).foregroundStyle(Iron.error).padding(.top, 4)
            Text("Can't reach your phone. Keep it nearby, or open FlexCoach on it.").font(Iron.body(13)).foregroundStyle(Iron.muted).multilineTextAlignment(.center)
            Button(action: session.retryStart) { Text("Try again").font(Iron.body(14, .bold)) }
              .buttonStyle(PillStyle(kind: .raised))
            Button(action: session.cancelStart) { Text("Cancel").font(Iron.body(14, .bold)) }
              .buttonStyle(PillStyle(kind: .quiet, height: 36))
          } else {
            ProgressView().tint(Iron.accent).padding(.top, 16)
            Text("Starting on your phone").font(Iron.body(15, .bold)).multilineTextAlignment(.center)
            Button(action: session.cancelStart) { Text("Cancel").font(Iron.body(14, .bold)) }
              .buttonStyle(PillStyle(kind: .quiet, height: 36))
              .padding(.top, 8)
          }
        }
        .frame(maxWidth: .infinity)
      }
    }
  }
}
