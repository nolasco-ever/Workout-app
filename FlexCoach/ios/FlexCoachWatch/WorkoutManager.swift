import CoreLocation
import Foundation
import HealthKit

/// The Watch's Health workout (v1 #6, step 2): it runs alongside the workout on the phone, measuring heart rate and
/// active calories, keeps the app awake on the wrist (so the rest's tap comes with the wrist down), and is saved to
/// Health when the workout is finished. Its totals go to the phone for the done screen and History; a discarded
/// workout is thrown away, not saved.
@MainActor
final class WorkoutManager: NSObject, ObservableObject {
  static let shared = WorkoutManager()

  @Published private(set) var heartRate: Double?
  @Published private(set) var kcal: Double = 0
  @Published private(set) var running = false
  /// The finished workout's totals, for the done screen; nil until it is saved, or with no workout measured.
  @Published private(set) var totals: Totals?
  /// The cardio entry running now: its distance so far in meters, when the Watch measures one (step 3).
  @Published private(set) var cardioMeters: Double?

  struct Totals {
    let kcal: Double
    let avgBpm: Double
    let maxBpm: Double
  }

  private let health = HKHealthStore()
  private var session: HKWorkoutSession?
  private var builder: HKLiveWorkoutBuilder?
  /// The phone's session the workout belongs to, for the totals sent back.
  private var sessionId: String?

  /// Every heart rate the workout showed, for the totals when Health's own average or maximum is missing.
  private var beats: (sum: Double, count: Int, max: Double) = (0, 0, 0)

  private let heartRateType = HKQuantityType(.heartRate)
  private let energyType = HKQuantityType(.activeEnergyBurned)
  private let walkRunType = HKQuantityType(.distanceWalkingRunning)
  private let cyclingType = HKQuantityType(.distanceCycling)

  /// A cardio entry's clock running (v1 #6, step 3): the workout is that activity meanwhile (running, the elliptical),
  /// and its distance is the workout's total less the total when the clock started.
  private struct Segment {
    let setId: String
    let distanceType: HKQuantityType?
    let startMeters: Double
  }
  private var segment: Segment?
  /// Distance from the entry's earlier stretches (before a Pause), by set id.
  private var carried: [String: Double] = [:]
  /// When the running entry's numbers last went to the phone (v1 #10.6); a few seconds apart is plenty.
  private var liveSentAt = Date.distantPast
  private static let liveEvery: TimeInterval = 3
  private let location = CLLocationManager()
  /// The outdoor route (v1 #10.8): saved with the workout in Health, and sent to the phone, which uses it over its
  /// own GPS. Readings by set id, across Pauses; the ones the phone hasn't had live yet wait in `routeUnsent`.
  private var routeBuilder: HKWorkoutRouteBuilder?
  private var route: [String: [CLLocation]] = [:]
  private var routeUnsent: [CLLocation] = []

  /// Asked once: read heart rate and energy, save workouts.
  func requestAuthorization() async -> Bool {
    guard HKHealthStore.isHealthDataAvailable() else { return false }
    do {
      try await health.requestAuthorization(toShare: [HKObjectType.workoutType(), HKSeriesType.workoutRoute(), energyType, walkRunType, cyclingType], read: [heartRateType, energyType, walkRunType, cyclingType])
      return true
    } catch {
      return false
    }
  }

  /// Starts measuring, unless a workout already is. `configuration` comes from the phone when it opened the app.
  func start(sessionId: String?, configuration: HKWorkoutConfiguration? = nil) async {
    if let sessionId { self.sessionId = sessionId }
    guard session == nil else { return }
    guard await requestAuthorization() else { return }
    let config = configuration ?? {
      let c = HKWorkoutConfiguration()
      c.activityType = .traditionalStrengthTraining
      c.locationType = .indoor
      return c
    }()
    do {
      let session = try HKWorkoutSession(healthStore: health, configuration: config)
      let builder = session.associatedWorkoutBuilder()
      builder.dataSource = HKLiveWorkoutDataSource(healthStore: health, workoutConfiguration: config)
      session.delegate = self
      builder.delegate = self
      self.session = session
      self.builder = builder
      heartRate = nil
      kcal = 0
      totals = nil
      beats = (0, 0, 0)
      segment = nil
      carried = [:]
      cardioMeters = nil
      route = [:]
      routeUnsent = []
      routeBuilder = nil
      let start = Date()
      session.startActivity(with: start)
      try await builder.beginCollection(at: start)
      running = true
    } catch {
      session = nil
      builder = nil
    }
  }

  /// The workout was finished on the phone: saved to Health, and its totals sent back.
  func finish() async {
    guard let session, let builder else { return }
    endSegment()
    // Taken at once: the done state can arrive twice (the context and the message), and the second must find nothing.
    let sessionId = self.sessionId
    reset()
    session.end()
    let end = Date()
    do {
      try await builder.endCollection(at: end)
    } catch {}
    let saved = try? await builder.finishWorkout()
    // The route goes with the workout into Health.
    if let routeBuilder, let saved { _ = try? await routeBuilder.finishRoute(with: saved, metadata: nil) }
    routeBuilder = nil
    // The saved workout's statistics first, then the builder's, then the heart rates seen along the way: the live
    // builder can hold a heart rate without its average or maximum, which left the phone with none.
    let stats = saved?.statistics(for: heartRateType) ?? builder.statistics(for: heartRateType)
    let bpm = HKUnit.count().unitDivided(by: .minute())
    let measured = Totals(
      kcal: saved?.statistics(for: energyType)?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? builder.statistics(for: energyType)?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? kcal,
      avgBpm: stats?.averageQuantity()?.doubleValue(for: bpm) ?? (beats.count > 0 ? beats.sum / Double(beats.count) : 0),
      maxBpm: stats?.maximumQuantity()?.doubleValue(for: bpm) ?? beats.max
    )
    let message: [String: Any] = ["command": "metrics", "sessionId": sessionId ?? "", "kcal": measured.kcal, "avgBpm": measured.avgBpm, "maxBpm": measured.maxBpm]
    if sessionId != nil { WatchSession.shared.sendToPhone(message) }
    totals = measured
  }

  /// The workout was left or discarded on the phone: nothing is saved.
  func discard() {
    guard let session, let builder else { return }
    session.end()
    builder.discardWorkout()
    routeBuilder?.discard()
    routeBuilder = nil
    reset()
  }

  private func reset() {
    session = nil
    builder = nil
    sessionId = nil
    running = false
    segment = nil
    carried = [:]
    cardioMeters = nil
  }

  // MARK: Cardio (step 3)

  /// Follows the workout's state: a cardio clock starting begins its activity, and stopping it (Pause, End, or
  /// moving on) ends it and sends the entry's distance to the phone, which fills the entry with it.
  func follow(_ state: WorkoutActivityState?) {
    guard session != nil else { return }
    if let state, state.phase == .cardio, let activity = state.cardioActivity, let setId = state.nextSetId {
      if segment?.setId == setId { return }
      endSegment()
      beginSegment(setId: setId, activity: activity, outdoor: state.cardioOutdoor == true, measures: state.cardioDistance == true)
    } else {
      endSegment()
    }
  }

  private func meters(_ type: HKQuantityType?) -> Double {
    guard let type else { return 0 }
    return builder?.statistics(for: type)?.sumQuantity()?.doubleValue(for: .meter()) ?? 0
  }

  private func beginSegment(setId: String, activity: String, outdoor: Bool, measures: Bool) {
    guard let session, let builder else { return }
    let config = HKWorkoutConfiguration()
    config.activityType = Self.activityType(activity)
    config.locationType = outdoor ? .outdoor : .indoor
    // Outdoors the distance comes from GPS, which needs the location; asked once, the first time.
    if outdoor, location.authorizationStatus == .notDetermined { location.requestWhenInUseAuthorization() }
    if outdoor {
      location.delegate = self
      location.desiredAccuracy = kCLLocationAccuracyBest
      location.activityType = .fitness
      location.distanceFilter = 5
      location.startUpdatingLocation()
    }
    let type: HKQuantityType? = measures ? (config.activityType == .cycling ? cyclingType : walkRunType) : nil
    if let type { builder.dataSource?.enableCollection(for: type, predicate: nil) }
    session.beginNewActivity(configuration: config, date: Date(), metadata: nil)
    segment = Segment(setId: setId, distanceType: type, startMeters: meters(type))
    cardioMeters = type == nil ? nil : carried[setId] ?? 0
  }

  private func endSegment() {
    guard let segment else { return }
    self.segment = nil
    session?.endCurrentActivity(on: Date())
    location.stopUpdatingLocation()
    // The entry's whole route so far, queued so the phone gets it even if it isn't listening now.
    if let points = route[segment.setId], points.count >= 2 {
      WatchSession.shared.sendToPhone(["command": "cardioRoute", "id": "\(segment.setId)|\(Self.encode(points))"])
    }
    routeUnsent = []
    cardioMeters = nil
    guard segment.distanceType != nil else { return }
    let total = (carried[segment.setId] ?? 0) + max(0, meters(segment.distanceType) - segment.startMeters)
    carried[segment.setId] = total
    if total > 0 { WatchSession.shared.sendToPhone(["command": "cardioDistance", "id": "\(segment.setId):\(total)"]) }
  }

  /// The running cardio entry's numbers for the phone's cardio screen: "setId:meters:bpm:kcal", meters -1 when
  /// the Watch doesn't measure the distance and bpm 0 before a reading.
  private func sendLive() {
    guard let segment, Date().timeIntervalSince(liveSentAt) >= Self.liveEvery else { return }
    liveSentAt = Date()
    let meters = segment.distanceType == nil ? -1 : (cardioMeters ?? 0)
    WatchSession.shared.sendLiveToPhone(["command": "cardioLive", "id": "\(segment.setId):\(meters):\(heartRate ?? 0):\(kcal)"])
    if !routeUnsent.isEmpty {
      WatchSession.shared.sendLiveToPhone(["command": "cardioRoutePoints", "id": "\(segment.setId)|\(Self.encode(routeUnsent))"])
      routeUnsent = []
    }
  }

  /// "lat,lon,t,acc;…", what the phone reads (data/engine/route.ts, parseWatchPoints).
  private static func encode(_ points: [CLLocation]) -> String {
    points.map { String(format: "%.6f,%.6f,%.0f,%.0f", $0.coordinate.latitude, $0.coordinate.longitude, $0.timestamp.timeIntervalSince1970 * 1000, $0.horizontalAccuracy) }.joined(separator: ";")
  }

  fileprivate func received(_ locations: [CLLocation]) {
    guard let segment else { return }
    let good = locations.filter { $0.horizontalAccuracy >= 0 && $0.horizontalAccuracy <= 30 }
    guard !good.isEmpty else { return }
    if routeBuilder == nil { routeBuilder = HKWorkoutRouteBuilder(healthStore: health, device: nil) }
    routeBuilder?.insertRouteData(good) { _, _ in }
    route[segment.setId, default: []].append(contentsOf: good)
    routeUnsent.append(contentsOf: good)
  }

  private static func activityType(_ name: String) -> HKWorkoutActivityType {
    switch name {
    case "running": return .running
    case "walking": return .walking
    case "cycling": return .cycling
    case "elliptical": return .elliptical
    case "stairClimbing": return .stairClimbing
    case "rowing": return .rowing
    case "crossCountrySkiing": return .crossCountrySkiing
    case "handCycling": return .handCycling
    case "jumpRope": return .jumpRope
    default: return .mixedCardio
    }
  }
}

extension WorkoutManager: HKWorkoutSessionDelegate {
  nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {}

  nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
    Task { @MainActor in self.reset() }
  }
}

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
  nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

  nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
    let bpm = HKUnit.count().unitDivided(by: .minute())
    let heart = workoutBuilder.statistics(for: HKQuantityType(.heartRate))?.mostRecentQuantity()?.doubleValue(for: bpm)
    let energy = workoutBuilder.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie())
    let walkRun = workoutBuilder.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: .meter())
    let cycling = workoutBuilder.statistics(for: HKQuantityType(.distanceCycling))?.sumQuantity()?.doubleValue(for: .meter())
    Task { @MainActor in
      if let segment = self.segment, let type = segment.distanceType {
        let now = (type == self.cyclingType ? cycling : walkRun) ?? segment.startMeters
        self.cardioMeters = (self.carried[segment.setId] ?? 0) + max(0, now - segment.startMeters)
      }
      if let heart {
        self.heartRate = heart
        self.beats = (self.beats.sum + heart, self.beats.count + 1, max(self.beats.max, heart))
      }
      if let energy { self.kcal = energy }
      self.sendLive()
    }
  }
}

extension WorkoutManager: CLLocationManagerDelegate {
  nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    Task { @MainActor in self.received(locations) }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}
}
