package com.flexcoach.fold

import android.app.Activity
import android.content.Context
import android.graphics.Rect
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import androidx.window.layout.WindowMetricsCalculator
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.flexcoach.specs.NativeFoldSpec
import kotlin.math.roundToInt

/**
 * Hinge and fold state of a folding phone (see specs/NativeFold.ts): where
 * the fold is from Jetpack WindowManager, the angle from the hinge sensor.
 * Reports whenever either changes while the app is in front.
 */
class NativeFoldModule(reactContext: ReactApplicationContext) : NativeFoldSpec(reactContext), LifecycleEventListener, SensorEventListener {
  /** One record of what is known; a fresh map is built for every read, since a map sent to JavaScript cannot be reused. */
  private data class Snapshot(
    val foldable: Boolean = false,
    val posture: String = "unknown",
    val hingeStatus: String = "none",
    val hingeAngleDeg: Double = -1.0,
    val foldAxis: String = "none",
    val fold: Rect? = null,
    val foldActive: Boolean = false,
    val windowWidth: Double = 0.0,
    val windowHeight: Double = 0.0,
  )

  @Volatile private var snapshot = Snapshot()
  private var fold: FoldingFeature? = null
  private var hingeAngle: Double? = null
  private var hingeSensor: Sensor? = null
  private var tracker: WindowInfoTrackerCallbackAdapter? = null
  private var trackedActivity: Activity? = null
  private val layoutListener = Consumer<WindowLayoutInfo> { info ->
    fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
    refresh()
  }

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  override fun getState(): WritableMap = snapshot.toMap()

  // MARK: Lifecycle

  override fun onHostResume() {
    val activity = reactApplicationContext.currentActivity ?: return
    if (trackedActivity !== activity) {
      stopTracking()
      tracker = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(activity)).also {
        it.addWindowLayoutInfoListener(activity, ContextCompat.getMainExecutor(activity), layoutListener)
      }
      trackedActivity = activity
    }
    val sensors = activity.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    hingeSensor = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) sensors?.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE) else null
    hingeSensor?.let { sensors?.registerListener(this, it, SensorManager.SENSOR_DELAY_UI) }
    refresh()
  }

  override fun onHostPause() {
    (reactApplicationContext.currentActivity?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager)?.unregisterListener(this)
  }

  override fun onHostDestroy() {
    onHostPause()
    stopTracking()
  }

  private fun stopTracking() {
    tracker?.removeWindowLayoutInfoListener(layoutListener)
    tracker = null
    trackedActivity = null
  }

  override fun invalidate() {
    onHostDestroy()
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  // MARK: Sensor

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type != Sensor.TYPE_HINGE_ANGLE) return
    val next = event.values.firstOrNull()?.toDouble()?.roundToInt()?.toDouble() ?: return
    if (next == hingeAngle) return
    hingeAngle = next
    refresh()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  // MARK: State

  /** Works out the pose from the fold and the hinge, and tells JavaScript if anything changed. Main thread. */
  private fun refresh() {
    val activity = reactApplicationContext.currentActivity
    val density = reactApplicationContext.resources.displayMetrics.density
    val window = activity?.let { WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(it).bounds }
    val feature = fold
    val angle = hingeAngle
    val hingeStatus = when {
      hingeSensor == null -> "none"
      angle == null -> "unknown"
      angle < CLOSED_DEG -> "closed"
      angle > FLAT_DEG -> "fullyOpen"
      else -> "partiallyOpen"
    }
    val axis = when (feature?.orientation) {
      FoldingFeature.Orientation.VERTICAL -> "vertical"
      FoldingFeature.Orientation.HORIZONTAL -> "horizontal"
      else -> "none"
    }
    val active = feature?.state == FoldingFeature.State.HALF_OPENED
    val posture = when {
      active -> if (axis == "vertical") "book" else "tabletop"
      feature != null -> "open"
      hingeStatus == "closed" -> "closed"
      // Partly open with no fold through the window: the app is on the cover display, the phone standing on its edges.
      hingeStatus == "partiallyOpen" -> "tent"
      hingeStatus == "fullyOpen" -> "open"
      hingeSensor != null -> "closed"
      else -> "unknown"
    }
    val next = Snapshot(
      foldable = feature != null || hingeSensor != null,
      posture = posture,
      hingeStatus = hingeStatus,
      hingeAngleDeg = angle ?: -1.0,
      foldAxis = axis,
      fold = feature?.bounds?.let { Rect((it.left / density).roundToInt(), (it.top / density).roundToInt(), (it.right / density).roundToInt(), (it.bottom / density).roundToInt()) },
      foldActive = active,
      windowWidth = window?.let { it.width() / density.toDouble() } ?: 0.0,
      windowHeight = window?.let { it.height() / density.toDouble() } ?: 0.0,
    )
    if (next == snapshot) return
    snapshot = next
    emitOnChange(next.toMap())
  }

  private fun Snapshot.toMap(): WritableMap = Arguments.createMap().apply {
    putBoolean("foldable", foldable)
    putString("posture", posture)
    putString("hingeStatus", hingeStatus)
    putDouble("hingeAngleDeg", hingeAngleDeg)
    putString("foldAxis", foldAxis)
    putDouble("foldX", fold?.left?.toDouble() ?: 0.0)
    putDouble("foldY", fold?.top?.toDouble() ?: 0.0)
    putDouble("foldWidth", fold?.width()?.toDouble() ?: 0.0)
    putDouble("foldHeight", fold?.height()?.toDouble() ?: 0.0)
    putBoolean("foldActive", foldActive)
    putDouble("windowWidth", windowWidth)
    putDouble("windowHeight", windowHeight)
  }

  companion object {
    const val NAME = "NativeFold"
    /** Hinge angles this side of closed and flat; the sensor rarely reads exactly 0 or 180. */
    private const val CLOSED_DEG = 10.0
    private const val FLAT_DEG = 170.0
  }
}
