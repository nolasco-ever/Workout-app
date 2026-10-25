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

  /// Asked once: read heart rate and energy, save workouts.
  func requestAuthorization() async -> Bool {
    guard HKHealthStore.isHealthDataAvailable() else { return false }
    do {
      try await health.requestAuthorization(toShare: [HKObjectType.workoutType(), energyType], read: [heartRateType, energyType])
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
    // Taken at once: the done state can arrive twice (the context and the message), and the second must find nothing.
    let sessionId = self.sessionId
    reset()
    session.end()
    let end = Date()
    do {
      try await builder.endCollection(at: end)
    } catch {}
    let saved = try? await builder.finishWorkout()
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
    reset()
  }

  private func reset() {
    session = nil
    builder = nil
    sessionId = nil
    running = false
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
    Task { @MainActor in
      if let heart {
        self.heartRate = heart
        self.beats = (self.beats.sum + heart, self.beats.count + 1, max(self.beats.max, heart))
      }
      if let energy { self.kcal = energy }
    }
  }
}
