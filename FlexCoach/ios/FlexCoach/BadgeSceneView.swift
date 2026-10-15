import RealityKit
import UIKit

/// A RealityKit stage: the view, lights, the badge and its motion. Each host
/// view owns one; the loaded models are cached app-wide and cloned in, so a
/// badge seen once switches in instantly.
@MainActor
final class BadgeStage {

  let arView = ARView(frame: .zero, cameraMode: .nonAR, automaticallyConfigureSession: false)
  private let anchor = AnchorEntity(world: .zero)
  private let turntable = Entity()
  private let badge = Entity()
  private let text = Entity()
  private let sun = DirectionalLight()
  private let studioLight = Entity()

  private(set) weak var activeHost: BadgeSceneView?

  private var loadedKey = ""
  private var loadToken = 0
  private var textKey = ""
  private var textToken = 0

  private var yaw: Float = 0
  private var velocity: Float = 0
  private var displayLink: CADisplayLink?
  private var lastTick: CFTimeInterval = 0
  private enum Motion { case still, coasting, easing(from: Float, to: Float, start: CFTimeInterval, duration: CFTimeInterval) }
  private var motion: Motion = .still
  private var restYaw: Float = 0
  private var yawOffset: Float = 0
  private var deceleration: Float = 0.998

  init() {
    arView.backgroundColor = .clear
    arView.environment.background = .color(.clear)
    arView.renderOptions = [.disableMotionBlur, .disableDepthOfField, .disableCameraGrain, .disableHDR, .disableFaceMesh, .disablePersonOcclusion, .disableGroundingShadows, .disableAREnvironmentLighting]
    arView.isUserInteractionEnabled = false
    arView.translatesAutoresizingMaskIntoConstraints = false
    #if targetEnvironment(simulator)
    arView.contentScaleFactor = 1   // the simulator draws RealityKit in software; a third of the pixels keeps it fluid
    #else
    arView.contentScaleFactor = UIScreen.main.scale   // every pixel of the screen: capped at 2 the rim and the mark's edges came out soft and stepped on 3x phones
    #endif

    // The model is one unit wide with its front toward +Z; the camera sits on that axis.
    let camera = PerspectiveCamera()
    camera.camera.fieldOfViewInDegrees = 22
    camera.position = [0, 0, 3.1]
    camera.look(at: .zero, from: camera.position, relativeTo: nil)
    anchor.addChild(camera)

    sun.light.intensity = 3000
    sun.light.isRealWorldProxy = false
    sun.orientation = simd_quatf(from: [0, 0, -1], to: simd_normalize([-0.4, -0.7, -0.6]))
    anchor.addChild(sun)

    turntable.addChild(badge)
    turntable.addChild(text)
    anchor.addChild(turntable)
    arView.scene.addAnchor(anchor)

    // The studio light. iOS 18 and later: a skybox-free environment from the equirectangular image, attached as an
    // image-based light that the badge receives. Earlier systems: the cube map set through the view's lighting.
    if #available(iOS 18.0, *) {
      let studio: EnvironmentResource?
      if let image = UIImage(named: "studio_equirect")?.cgImage {
        if #available(iOS 27.0, *) {
          studio = try? EnvironmentResource(equirectangular: image, options: .init(samplingQuality: .normal))
        } else {
          studio = try? EnvironmentResource(equirectangular: image, withName: "studio")
        }
      } else {
        studio = nil
      }
      if let studio {
        studioLight.components.set(ImageBasedLightComponent(source: .single(studio)))
        anchor.addChild(studioLight)
        turntable.components.set(ImageBasedLightReceiverComponent(imageBasedLight: studioLight))
      } else {
        NSLog("[BadgeStage] studio environment image missing")
      }
    } else if let studio = try? EnvironmentResource.load(named: "studio") {
      arView.environment.lighting.resource = studio
    } else {
      NSLog("[BadgeStage] studio environment unavailable")
    }
  }

  // MARK: Host

  func attach(_ host: BadgeSceneView) {
    host.addSubview(arView)
    NSLayoutConstraint.activate([
      arView.leadingAnchor.constraint(equalTo: host.leadingAnchor),
      arView.trailingAnchor.constraint(equalTo: host.trailingAnchor),
      arView.topAnchor.constraint(equalTo: host.topAnchor),
      arView.bottomAnchor.constraint(equalTo: host.bottomAnchor),
    ])
    activeHost = host
    yaw = Float(host.restYaw)
    apply(host)
  }

  func detach() {
    stopMotion()
  }

  /// Push every setting of the host onto the stage.
  func apply(_ host: BadgeSceneView) {
    restYaw = Float(host.restYaw)
    yawOffset = Float(host.yawOffset)
    deceleration = Float(host.deceleration)
    if case .still = motion { yaw = restYaw }
    applyLighting(environment: host.environmentIntensity, sun: host.sunIntensity)
    load(family: host.family, tier: host.tier, host: host)
    stamp(host.backText, color: host.backTextColor)
    applyYaw()
  }

  // MARK: Models

  private static var cache: [String: Entity] = [:]
  private static var loading: Set<String> = []

  private static func loadEntity(named name: String, subdirectory: String) async -> Entity? {
    let key = subdirectory + "/" + name
    if let cached = cache[key] { return cached.clone(recursive: true) }
    guard let url = Bundle.main.url(forResource: name, withExtension: "usdz", subdirectory: subdirectory) else { return nil }
    let entity: Entity?
    if #available(iOS 18.0, *) {
      entity = try? await Entity(contentsOf: url)
    } else {
      entity = try? Entity.load(contentsOf: url)
    }
    guard let entity else { return nil }
    cache[key] = entity
    return entity.clone(recursive: true)
  }

  /// Load "family:tier" badges into the cache ahead of time.
  func preload(_ keys: String) { Self.preload(keys) }

  static func preload(_ keys: String, completion: (() -> Void)? = nil) {
    var names: [String] = []
    for key in keys.split(separator: ",") {
      let parts = key.split(separator: ":")
      guard parts.count == 2, let tier = Int(parts[1]) else { continue }
      names += ["body_t\(tier)", "\(parts[0])_t\(tier)"]
    }
    Task(priority: .userInitiated) { @MainActor in
      for name in names where Self.cache["BadgeModels/" + name] == nil {
        while Self.loading.contains(name) { try? await Task.sleep(nanoseconds: 20_000_000) }   // another preload has it in flight
        if Self.cache["BadgeModels/" + name] != nil { continue }
        Self.loading.insert(name)
        _ = await Self.loadEntity(named: name, subdirectory: "BadgeModels")
        Self.loading.remove(name)
      }
      completion?()
    }
  }

  private func load(family: String, tier: Int, host: BadgeSceneView) {
    let key = "\(family):\(tier)"
    guard !family.isEmpty, tier > 0, key != loadedKey else { return }
    loadedKey = key
    loadToken += 1
    let token = loadToken
    Task { @MainActor in
      let body = await Self.loadEntity(named: "body_t\(tier)", subdirectory: "BadgeModels")
      let mark = await Self.loadEntity(named: "\(family)_t\(tier)", subdirectory: "BadgeModels")
      guard token == self.loadToken else { return }
      if body == nil { NSLog("[BadgeStage] no body model for tier %d", tier) }
      if mark == nil { NSLog("[BadgeStage] no mark model for %@", key) }
      self.badge.children.removeAll()
      for entity in [body, mark].compactMap({ $0 }) { self.badge.addChild(entity) }
      self.badge.orientation = Self.facingCorrection(body: body, mark: mark, in: self.badge)
      self.applyYaw()
      if body != nil { host.onReady?() }
    }
  }

  /// RealityKit lays the USDZ out by its own reading of the file's axes, which has differed between
  /// builds: sometimes the plate lies flat (thin along Y). Measured in the badge's own space, before any
  /// turn: tip a flat plate upright, then make sure the mark (the front) faces +Z, toward the camera.
  private static func facingCorrection(body: Entity?, mark: Entity?, in space: Entity) -> simd_quatf {
    let identity = simd_quatf(angle: 0, axis: [0, 1, 0])
    guard let body, let mark else { return identity }
    let b = body.visualBounds(relativeTo: space)
    let m = mark.visualBounds(relativeTo: space)
    var q = identity
    if b.extents.y < b.extents.z && b.extents.y < b.extents.x {
      q = simd_quatf(angle: -.pi / 2, axis: [1, 0, 0])   // thin along Y: stand it up
    }
    let offset = q.act(m.center - b.center)                // where the mark sits once upright
    if offset.z < 0 { q = simd_quatf(angle: .pi, axis: [0, 1, 0]) * q }
    return q
  }

  // MARK: Back text

  private struct Glyphs: Decodable {
    let capHeight: Float
    let advances: [String: Float]
    let space: Float
  }
  private static let glyphs: Glyphs? = {
    guard let url = Bundle.main.url(forResource: "glyphs", withExtension: "json", subdirectory: "BadgeModels/glyphs"), let data = try? Data(contentsOf: url) else { return nil }
    return try? JSONDecoder().decode(Glyphs.self, from: data)
  }()
  /// Cap height of the stamped text in badge units (the badge is one unit wide), and its baseline.
  private static let textCap: Float = 0.045
  private static let textBaselineY: Float = -0.15 - 0.045 / 2

  private func stamp(_ string: String, color hex: String) {
    let key = string + "|" + hex
    guard key != textKey else { return }
    textKey = key
    textToken += 1
    let token = textToken
    text.children.removeAll()
    guard !string.isEmpty, let glyphs = Self.glyphs else { return }
    let material = SimpleMaterial(color: Self.color(hex: hex), roughness: 0.55, isMetallic: true)
    Task { @MainActor in
      var entities: [(Entity, Float)] = []
      var width: Float = 0
      for ch in string.uppercased() {
        if ch == " " { entities.append((Entity(), glyphs.space)); width += glyphs.space; continue }
        guard let advance = glyphs.advances[String(ch)], let glyph = await Self.loadEntity(named: String(ch), subdirectory: "BadgeModels/glyphs") else { continue }
        entities.append((glyph, advance)); width += advance
      }
      guard token == self.textToken else { return }
      let s = Self.textCap / glyphs.capHeight
      // Glyph meshes are pre-mirrored so they read correctly from the back; lay them out right to left in model x.
      var cursor: Float = -width / 2
      for (glyph, advance) in entities {
        glyph.scale = [s, s, s]
        glyph.position = [-(cursor + advance) * s, Self.textBaselineY, 0]
        for model in Self.models(in: glyph) { model.model?.materials = [material] }
        self.text.addChild(glyph)
        cursor += advance
      }
    }
  }

  private static func models(in entity: Entity) -> [ModelEntity] {
    var out: [ModelEntity] = []
    if let m = entity as? ModelEntity { out.append(m) }
    for child in entity.children { out += models(in: child) }
    return out
  }

  private static func color(hex: String) -> UIColor {
    var value: UInt64 = 0
    let scanner = Scanner(string: hex.replacingOccurrences(of: "#", with: ""))
    guard scanner.scanHexInt64(&value), hex.count >= 7 else { return UIColor(white: 0.27, alpha: 1) }
    return UIColor(red: CGFloat((value >> 16) & 0xFF) / 255, green: CGFloat((value >> 8) & 0xFF) / 255, blue: CGFloat(value & 0xFF) / 255, alpha: 1)
  }

  private func applyLighting(environment: Double, sun sunIntensity: Double) {
    let exponent = Float(log2(max(environment, 0.001)))
    if #available(iOS 18.0, *), var light = studioLight.components[ImageBasedLightComponent.self] {
      light.intensityExponent = exponent
      studioLight.components.set(light)
    } else {
      arView.environment.lighting.intensityExponent = exponent
    }
    sun.light.intensity = Float(3000 * max(sunIntensity, 0))
    sun.isEnabled = sunIntensity > 0
  }

  // MARK: Motion

  private func applyYaw() {
    turntable.orientation = simd_quatf(angle: yaw + yawOffset, axis: [0, 1, 0])
  }

  func dragBegan() { stopMotion() }

  func drag(by dx: Float) {
    yaw += dx
    applyYaw()
  }

  private let restThreshold: Float = 0.00002

  /// A one-off push: the badge spins at `impulse` radians per millisecond and coasts to a stop.
  func push(_ impulse: Float) {
    velocity = impulse
    guard abs(velocity) > restThreshold else { return }
    motion = .coasting
    startTicking()
  }

  /// Wind the badge `turns` ahead of its resting angle and ease it back, fast at first, slowing to a stop.
  func spinIn(_ turns: Float) {
    let from = restYaw - turns * 2 * .pi   // wound back, so the spin runs clockwise into the rest angle
    yaw = from
    applyYaw()
    motion = .easing(from: from, to: restYaw, start: CACurrentMediaTime(), duration: 0.9 + 0.35 * Double(abs(turns)))
    startTicking()
  }

  private func startTicking() {
    displayLink?.invalidate()
    lastTick = CACurrentMediaTime()
    let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
    link.add(to: .main, forMode: .common)
    displayLink = link
  }

  private func stopMotion() {
    displayLink?.invalidate()
    displayLink = nil
    velocity = 0
    motion = .still
  }

  @objc private func tick(_ link: CADisplayLink) {
    let now = link.timestamp
    switch motion {
    case .coasting:
      let dt = Float(min(0.048, max(0, now - lastTick))) * 1000
      lastTick = now
      velocity *= powf(deceleration, dt)
      yaw += velocity * dt
      applyYaw()
      if abs(velocity) < restThreshold { stopMotion() }
    case let .easing(from, to, start, duration):
      let t = Float(min(1, max(0, (now - start) / duration)))
      let eased = 1 - powf(1 - t, 3)
      yaw = from + (to - from) * eased
      applyYaw()
      if t >= 1 { stopMotion() }
    case .still:
      stopMotion()
    }
  }
}

/// A screen's window onto the shared badge stage. Holds the props React sets
/// and hands them to the stage while it is the host on screen; the drag
/// gesture lives here. Driven by the `BadgeView` Fabric component.
@objc(BadgeSceneView)
public class BadgeSceneView: UIView, UIGestureRecognizerDelegate {
  @objc public var family: String = "" { didSet { sync() } }
  @objc public var tier: Int = 1 { didSet { sync() } }
  @objc public var environmentIntensity: Double = 1 { didSet { sync() } }
  @objc public var sunIntensity: Double = 1 { didSet { sync() } }
  /// Radians of turn per point of drag.
  @objc public var spinSensitivity: Double = 0.012
  /// Per-millisecond velocity multiplier while coasting.
  @objc public var deceleration: Double = 0.998 { didSet { sync() } }
  /// The angle the badge rests at; 0 faces the viewer.
  @objc public var restYaw: Double = 0 { didSet { sync() } }
  /// A live extra turn, for a swipe.
  @objc public var yawOffset: Double = 0 { didSet { sync() } }
  /// Digits and capital letters stamped on the back; empty for none.
  @objc public var backText: String = "" { didSet { sync() } }
  /// "#RRGGBB" for that text.
  @objc public var backTextColor: String = "#444444" { didSet { sync() } }
  /// Called on the main thread once this host's badge is in the scene.
  @objc public var onReady: (() -> Void)?

  public override init(frame: CGRect) {
    super.init(frame: frame)
    setUp()
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
    setUp()
  }

  private func setUp() {
    backgroundColor = .clear
    stage.attach(self)
    // The drag lives on this view, alongside React Native's own touch handling rather than fighting it.
    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    pan.maximumNumberOfTouches = 1
    pan.delegate = self
    addGestureRecognizer(pan)
  }

  /// Only a mostly horizontal drag turns the badge; a vertical one is left to whatever scrolls behind it.
  public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let pan = gestureRecognizer as? UIPanGestureRecognizer else { return true }
    let v = pan.velocity(in: self)
    return abs(v.x) > abs(v.y)
  }

  /// React Native's own touch handler may run alongside; other pans (a pager, the navigation back-swipe) must wait for ours.
  public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    !(otherGestureRecognizer is UIPanGestureRecognizer)
  }

  public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldBeRequiredToFailBy otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    otherGestureRecognizer is UIPanGestureRecognizer
  }

  private let stage = BadgeStage()

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      if stage.arView.superview !== self { stage.attach(self) }
    } else {
      stage.detach()
    }
  }

  private func sync() {
    stage.apply(self)
  }

  @objc public func preload(_ keys: String) { stage.preload(keys) }

  /// Warm the cache without a view on screen; used by the NativeBadgeModels module.
  @objc public static func preloadModels(_ keys: String, completion: @escaping () -> Void) { BadgeStage.preload(keys, completion: completion) }

  @objc public func push(_ impulse: Double) { stage.push(Float(impulse)) }

  @objc public func spinIn(_ turns: Double) { stage.spinIn(Float(turns)) }

  @objc private func handlePan(_ pan: UIPanGestureRecognizer) {
    switch pan.state {
    case .began:
      stage.dragBegan()
    case .changed:
      let dx = Float(pan.translation(in: self).x)
      pan.setTranslation(.zero, in: self)
      stage.drag(by: dx * Float(spinSensitivity))
    case .ended, .cancelled:
      stage.push(Float(pan.velocity(in: self).x) * Float(spinSensitivity) / 1000)
    default:
      break
    }
  }
}
