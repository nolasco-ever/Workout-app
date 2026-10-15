package com.flexcoach.badges

import android.content.Context
import android.util.Log
import android.view.Choreographer
import android.view.MotionEvent
import android.view.Surface
import android.view.TextureView
import android.view.VelocityTracker
import android.widget.FrameLayout
import com.google.android.filament.Camera
import com.google.android.filament.Engine
import com.google.android.filament.EntityManager
import com.google.android.filament.LightManager
import com.google.android.filament.Renderer
import com.google.android.filament.Scene
import com.google.android.filament.SwapChain
import com.google.android.filament.View
import com.google.android.filament.Viewport
import com.google.android.filament.android.DisplayHelper
import com.google.android.filament.android.UiHelper
import com.google.android.filament.gltfio.AssetLoader
import com.google.android.filament.gltfio.FilamentAsset
import com.google.android.filament.gltfio.ResourceLoader
import com.google.android.filament.gltfio.UbershaderProvider
import com.google.android.filament.utils.KTX1Loader
import com.google.android.filament.utils.Utils
import org.json.JSONObject
import java.nio.ByteBuffer
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin

/**
 * The 3D badge, rendered by Filament: the tier's body and the family's mark,
 * loaded from the bundled glTF models, lit by the studio image-based light and
 * one key light. A horizontal drag turns it, a flick keeps it spinning and it
 * coasts to a stop wherever that lands. [spinIn] winds it a few turns ahead
 * and eases it back to its resting angle; [yawOffset] adds a live turn for
 * tying it to a swipe. Owns the whole Filament lifecycle so teardown happens
 * exactly once, from [destroy]. Driven by [BadgeViewManager].
 */
class BadgeSceneView(context: Context) : FrameLayout(context) {
  companion object {
    init { Utils.init() }
    private const val TAG = "BadgeSceneView"
    private const val REST = 0.00002 // radians per ms: below this a coasting badge has stopped
    /** Cap height of the stamped text in badge units (the badge is one unit wide), and where its baseline sits. */
    private const val TEXT_CAP = 0.045f
    private const val TEXT_BASELINE_Y = -0.15f - 0.045f / 2
    /** Asset bytes by path, shared by every badge view: reading and parsing once is what makes the second badge instant. */
    private val assetCache = HashMap<String, ByteBuffer>()
    private var glyphMeta: JSONObject? = null
    @Synchronized fun cachedAsset(context: Context, path: String): ByteBuffer {
      assetCache[path]?.let { return it.duplicate().apply { rewind() } }
      context.assets.open(path).use { input ->
        val bytes = input.readBytes()
        val buffer = ByteBuffer.allocateDirect(bytes.size).apply { put(bytes); rewind() }
        assetCache[path] = buffer
        return buffer.duplicate().apply { rewind() }
      }
    }
    /** The renderer, material set and loaders live for the whole app: creating them is what made every open cost a second. */
    private object Shared {
      val engine: Engine = Engine.create()
      val materials = UbershaderProvider(engine)
      val assetLoader = AssetLoader(engine, materials, EntityManager.get())
      val resourceLoader = ResourceLoader(engine)
      var studio: com.google.android.filament.IndirectLight? = null
    }
    /** Warm the cache for "family:tier" badges on a background thread. */
    fun preload(context: Context, keys: String, done: (() -> Unit)? = null) {
      val app = context.applicationContext
      Thread {
        for (key in keys.split(',')) {
          val parts = key.split(':'); if (parts.size != 2) continue
          try { cachedAsset(app, "badges/body_t${parts[1]}.glb"); cachedAsset(app, "badges/${parts[0]}_t${parts[1]}.glb") } catch (e: Exception) { Log.w(TAG, "preload ${key}: ${e.message}") }
        }
        done?.invoke()
      }.start()
    }
  }

  private val textureView = TextureView(context).apply { isOpaque = false }
  private val engine: Engine = Shared.engine
  private val renderer: Renderer = engine.createRenderer()
  private val scene: Scene = engine.createScene()
  private val view: View = engine.createView()
  private val cameraEntity = EntityManager.get().create()
  private val camera: Camera = engine.createCamera(cameraEntity)
  private val uiHelper = UiHelper(UiHelper.ContextErrorPolicy.DONT_CHECK).apply { isOpaque = false }
  private val displayHelper = DisplayHelper(context)
  private var swapChain: SwapChain? = null
  private val assetLoader: AssetLoader get() = Shared.assetLoader
  private val resourceLoader: ResourceLoader get() = Shared.resourceLoader
  private val sunEntity = EntityManager.get().create()
  private var body: FilamentAsset? = null
  private var mark: FilamentAsset? = null
  /** Stamped glyphs with their x slot on the back; placed from scratch every frame under the badge's turn. */
  private val textAssets = ArrayList<Pair<FilamentAsset, Float>>()
  private var textScale = 1f
  private var loadedKey = ""
  private var destroyed = false

  var family: String = ""
    set(value) { field = value; reloadIfNeeded() }
  var tier: Int = 1
    set(value) { field = value; reloadIfNeeded() }
  var environmentIntensity: Double = 1.0
    set(value) { field = value; applyLighting() }
  var sunIntensity: Double = 1.0
    set(value) { field = value; applyLighting() }
  /** Radians of turn per point of drag (scaled by density so it matches iOS points). */
  var spinSensitivity: Double = 0.012
  /** Per-millisecond velocity multiplier while coasting. */
  var deceleration: Double = 0.998
  /** The angle the badge rests at; 0 faces the viewer. */
  var restYaw: Double = 0.0
    set(value) { field = value; if (motion == Motion.STILL) yaw = value }
  /** A live extra turn, for a swipe. */
  var yawOffset: Double = 0.0
  /** Digits and capital letters stamped on the back; empty for none. */
  var backText: String = ""
    set(value) { if (field != value) { field = value; rebuildText() } }
  /** "#RRGGBB" for that text. */
  var backTextColor: String = "#444444"
    set(value) { if (field != value) { field = value; rebuildText() } }

  fun preload(keys: String) = Companion.preload(context, keys, null)
  /** Called on the main thread once the current badge's model is in the scene. */
  var onReady: (() -> Unit)? = null

  private enum class Motion { STILL, COASTING, EASING }
  private var motion = Motion.STILL
  private var yaw = 0.0
  private var velocity = 0.0 // radians per ms
  private var easeFrom = 0.0
  private var easeTo = 0.0
  private var easeStartNanos = 0L
  private var easeDurationMs = 0.0
  private var lastFrameNanos = 0L
  private var velocityTracker: VelocityTracker? = null
  private var lastX = 0f

  private val frameCallback = object : Choreographer.FrameCallback {
    override fun doFrame(frameTimeNanos: Long) {
      if (destroyed) return
      Choreographer.getInstance().postFrameCallback(this)
      step(frameTimeNanos)
      applyYaw()
      val sc = swapChain ?: return
      if (uiHelper.isReadyToRender && renderer.beginFrame(sc, frameTimeNanos)) {
        renderer.render(view)
        renderer.endFrame()
      }
    }
  }

  init {
    addView(textureView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    view.scene = scene
    view.camera = camera
    view.blendMode = View.BlendMode.TRANSLUCENT
    // Multisampling smooths the rim and the mark's edges; without it they come out stepped, as the iOS view's did at a capped scale.
    view.multiSampleAntiAliasingOptions = View.MultiSampleAntiAliasingOptions().apply {
      enabled = true
      sampleCount = 4
    }
    renderer.clearOptions = Renderer.ClearOptions().apply {
      clear = true
      clearColor = doubleArrayOf(0.0, 0.0, 0.0, 0.0)
    }
    // The model is one unit wide, front toward +Z; the camera sits on that axis with a long lens.
    camera.lookAt(0.0, 0.0, 3.1, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0)
    camera.setExposure(16f, 1f / 125f, 100f)
    try {
      if (Shared.studio == null) Shared.studio = KTX1Loader.createIndirectLight(engine, readAsset("badges/studio_ibl.ktx")).indirectLight
      scene.indirectLight = Shared.studio
    } catch (e: Exception) {
      Log.w(TAG, "studio light missing: ${e.message}")
    }
    LightManager.Builder(LightManager.Type.DIRECTIONAL)
      .color(1.0f, 0.98f, 0.95f)
      .intensity(10_000f)
      .direction(-0.4f, -0.7f, -0.6f)
      .castShadows(false)
      .build(engine, sunEntity)
    scene.addEntity(sunEntity)
    applyLighting()

    uiHelper.renderCallback = object : UiHelper.RendererCallback {
      override fun onNativeWindowChanged(surface: Surface) {
        swapChain?.let { engine.destroySwapChain(it) }
        swapChain = engine.createSwapChain(surface, uiHelper.swapChainFlags)
        displayHelper.attach(renderer, textureView.display)
      }
      override fun onDetachedFromSurface() {
        displayHelper.detach()
        swapChain?.let { engine.destroySwapChain(it); engine.flushAndWait() }
        swapChain = null
      }
      override fun onResized(width: Int, height: Int) {
        view.viewport = Viewport(0, 0, width, height)
        camera.setLensProjection(60.0, width.toDouble() / height.toDouble().coerceAtLeast(1.0), 0.05, 100.0)
      }
    }
    uiHelper.attachTo(textureView)
  }

  private fun readAsset(path: String): ByteBuffer = cachedAsset(context, path)

  // MARK: back text

  private fun rebuildText() {
    if (destroyed) return
    textAssets.forEach { release(it.first) }; textAssets.clear()
    if (backText.isEmpty()) return
    val meta = glyphMeta ?: try {
      JSONObject(context.assets.open("badges/glyphs/glyphs.json").bufferedReader().readText()).also { glyphMeta = it }
    } catch (e: Exception) { Log.w(TAG, "glyph metrics missing: ${e.message}"); return }
    val advances = meta.getJSONObject("advances")
    val space = meta.getDouble("space").toFloat()
    val cap = meta.getDouble("capHeight").toFloat()
    val chars = backText.uppercase()
    var width = 0f
    for (ch in chars) width += if (ch == ' ') space else advances.optDouble(ch.toString(), 0.0).toFloat()
    val rgb = parseColor(backTextColor)
    val s = TEXT_CAP / cap
    textScale = s
    // Glyph meshes are pre-mirrored so they read correctly from the back; lay them out right to left in model x.
    var cursor = -width / 2
    for (ch in chars) {
      if (ch == ' ') { cursor += space; continue }
      val advance = advances.optDouble(ch.toString(), -1.0).toFloat()
      if (advance < 0) continue
      val asset = load("badges/glyphs/$ch.glb") ?: continue
      asset.instance.materialInstances.forEach { it.setParameter("baseColorFactor", rgb[0], rgb[1], rgb[2], 1f) }
      textAssets.add(Pair(asset, -(cursor + advance) * s))
      cursor += advance
    }
    applyYaw()
  }

  private fun parseColor(hex: String): FloatArray {
    val h = hex.removePrefix("#")
    if (h.length < 6) return floatArrayOf(0.27f, 0.27f, 0.27f)
    fun srgbToLinear(c: Float) = if (c <= 0.04045f) c / 12.92f else Math.pow(((c + 0.055f) / 1.055f).toDouble(), 2.4).toFloat()
    return floatArrayOf(srgbToLinear(h.substring(0, 2).toInt(16) / 255f), srgbToLinear(h.substring(2, 4).toInt(16) / 255f), srgbToLinear(h.substring(4, 6).toInt(16) / 255f))
  }

  // MARK: models

  private fun reloadIfNeeded() {
    val key = "$family:$tier"
    if (destroyed || family.isEmpty() || tier <= 0 || key == loadedKey) return
    loadedKey = key
    body?.let { release(it) }; body = null
    mark?.let { release(it) }; mark = null
    body = load("badges/body_t$tier.glb")
    mark = load("badges/${family}_t$tier.glb")
    applyYaw()
    if (body != null) post { if (!destroyed) onReady?.invoke() }
  }

  private fun load(path: String): FilamentAsset? {
    return try {
      val asset = assetLoader.createAsset(readAsset(path)) ?: return null
      resourceLoader.loadResources(asset)
      asset.releaseSourceData()
      scene.addEntities(asset.entities)
      asset
    } catch (e: Exception) {
      Log.w(TAG, "could not load $path: ${e.message}")
      null
    }
  }

  private fun release(asset: FilamentAsset) {
    scene.removeEntities(asset.entities)
    assetLoader.destroyAsset(asset)
  }

  private fun applyLighting() {
    scene.indirectLight?.intensity = (30_000.0 * environmentIntensity.coerceAtLeast(0.0)).toFloat()
    val lm = engine.lightManager
    if (lm.hasComponent(sunEntity)) {
      lm.setIntensity(lm.getInstance(sunEntity), (10_000.0 * sunIntensity.coerceAtLeast(0.0)).toFloat())
    }
  }

  // MARK: spin

  /** A one-off push: the badge spins at `impulse` radians per millisecond and coasts to a stop. */
  fun push(impulse: Double) {
    velocity = impulse
    if (abs(velocity) < REST) { velocity = 0.0; return }
    motion = Motion.COASTING
    lastFrameNanos = 0L
  }

  /** Wind the badge `turns` ahead of its resting angle and ease it back, fast at first, slowing to a stop. */
  fun spinIn(turns: Double) {
    easeTo = restYaw
    easeFrom = restYaw - turns * 2 * Math.PI   // wound back, so the spin runs clockwise into the rest angle
    yaw = easeFrom
    easeStartNanos = 0L
    easeDurationMs = (0.9 + 0.35 * abs(turns)) * 1000
    motion = Motion.EASING
  }

  private fun step(frameTimeNanos: Long) {
    when (motion) {
      Motion.COASTING -> {
        val dt = if (lastFrameNanos == 0L) 16.0 else ((frameTimeNanos - lastFrameNanos) / 1_000_000.0).coerceIn(0.0, 48.0)
        velocity *= deceleration.pow(dt)
        yaw += velocity * dt
        if (abs(velocity) < REST) { velocity = 0.0; motion = Motion.STILL }
      }
      Motion.EASING -> {
        if (easeStartNanos == 0L) easeStartNanos = frameTimeNanos
        val t = ((frameTimeNanos - easeStartNanos) / 1_000_000.0 / easeDurationMs).coerceIn(0.0, 1.0)
        val eased = 1 - (1 - t).pow(3)
        yaw = easeFrom + (easeTo - easeFrom) * eased
        if (t >= 1.0) motion = Motion.STILL
      }
      Motion.STILL -> {}
    }
    lastFrameNanos = frameTimeNanos
  }

  private fun applyYaw() {
    val tm = engine.transformManager
    val a = yaw + yawOffset
    val c = cos(a).toFloat()
    val s = sin(a).toFloat()
    // Column-major rotation about Y.
    val m = floatArrayOf(c, 0f, -s, 0f, 0f, 1f, 0f, 0f, s, 0f, c, 0f, 0f, 0f, 0f, 1f)
    listOfNotNull(body, mark).forEach { asset -> tm.setTransform(tm.getInstance(asset.root), m) }
    // Glyphs: R_y(turn) * T(slot, baseline, 0) * S(scale), column-major.
    val k = textScale
    for ((asset, x) in textAssets) {
      tm.setTransform(tm.getInstance(asset.root), floatArrayOf(c * k, 0f, -s * k, 0f, 0f, k, 0f, 0f, s * k, 0f, c * k, 0f, c * x, TEXT_BASELINE_Y, -s * x, 1f))
    }
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    val sensitivity = spinSensitivity / resources.displayMetrics.density
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        parent?.requestDisallowInterceptTouchEvent(true)
        velocity = 0.0
        motion = Motion.STILL
        lastX = event.x
        velocityTracker?.recycle()
        velocityTracker = VelocityTracker.obtain().also { it.addMovement(event) }
        return true
      }
      MotionEvent.ACTION_MOVE -> {
        velocityTracker?.addMovement(event)
        yaw += (event.x - lastX) * sensitivity
        lastX = event.x
        return true
      }
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        velocityTracker?.let {
          it.addMovement(event)
          it.computeCurrentVelocity(1) // pixels per ms
          push(it.xVelocity * sensitivity)
          it.recycle()
        }
        velocityTracker = null
        parent?.requestDisallowInterceptTouchEvent(false)
        return true
      }
    }
    return super.onTouchEvent(event)
  }

  // MARK: lifecycle

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (destroyed) return
    lastFrameNanos = 0L
    Choreographer.getInstance().postFrameCallback(frameCallback)
  }

  override fun onDetachedFromWindow() {
    Choreographer.getInstance().removeFrameCallback(frameCallback)
    super.onDetachedFromWindow()
  }

  /** Tear down Filament, once. Called by the view manager when React drops the view. */
  fun destroy() {
    if (destroyed) return
    destroyed = true
    Choreographer.getInstance().removeFrameCallback(frameCallback)
    uiHelper.detach()
    body?.let { release(it) }; body = null
    mark?.let { release(it) }; mark = null
    textAssets.forEach { release(it.first) }; textAssets.clear()
    scene.removeEntity(sunEntity)
    engine.destroyEntity(sunEntity)
    swapChain?.let { engine.destroySwapChain(it) }
    engine.destroyRenderer(renderer)
    engine.destroyView(view)
    engine.destroyScene(scene)
    engine.destroyCameraComponent(cameraEntity)
    EntityManager.get().destroy(cameraEntity)
    // The engine, materials, loaders and studio light are shared for the life of the app.
  }
}
