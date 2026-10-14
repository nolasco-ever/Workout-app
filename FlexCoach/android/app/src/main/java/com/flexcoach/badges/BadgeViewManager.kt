package com.flexcoach.badges

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.viewmanagers.BadgeViewManagerDelegate
import com.facebook.react.viewmanagers.BadgeViewManagerInterface

/** The badge's model is loaded and drawn. */
class ReadyEvent(surfaceId: Int, viewId: Int) : Event<ReadyEvent>(surfaceId, viewId) {
  override fun getEventName(): String = "topReady"
  override fun getEventData(): WritableMap = Arguments.createMap()
}

/** Fabric manager for the native 3D badge (see specs/BadgeViewNativeComponent.ts). */
@ReactModule(name = BadgeViewManager.REACT_CLASS)
class BadgeViewManager(@Suppress("UNUSED_PARAMETER") context: ReactApplicationContext) :
  SimpleViewManager<BadgeSceneView>(), BadgeViewManagerInterface<BadgeSceneView> {
  private val delegate: BadgeViewManagerDelegate<BadgeSceneView, BadgeViewManager> = BadgeViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<BadgeSceneView> = delegate

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): BadgeSceneView = BadgeSceneView(context).also { view ->
    view.onReady = {
      val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
      dispatcher?.dispatchEvent(ReadyEvent(UIManagerHelper.getSurfaceId(view), view.id))
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> = mapOf("topReady" to mapOf("registrationName" to "onReady"))

  override fun onDropViewInstance(view: BadgeSceneView) {
    super.onDropViewInstance(view)
    view.destroy()
  }

  @ReactProp(name = "family")
  override fun setFamily(view: BadgeSceneView, value: String?) {
    view.family = value ?: ""
  }

  @ReactProp(name = "tier")
  override fun setTier(view: BadgeSceneView, value: Int) {
    view.tier = value
  }

  @ReactProp(name = "environmentIntensity")
  override fun setEnvironmentIntensity(view: BadgeSceneView, value: Double) {
    view.environmentIntensity = value
  }

  @ReactProp(name = "sunIntensity")
  override fun setSunIntensity(view: BadgeSceneView, value: Double) {
    view.sunIntensity = value
  }

  @ReactProp(name = "spinSensitivity")
  override fun setSpinSensitivity(view: BadgeSceneView, value: Double) {
    view.spinSensitivity = value
  }

  @ReactProp(name = "deceleration")
  override fun setDeceleration(view: BadgeSceneView, value: Double) {
    view.deceleration = value
  }

  @ReactProp(name = "spinImpulse")
  override fun setSpinImpulse(view: BadgeSceneView, value: Double) {
    if (value != 0.0) view.push(value)
  }

  @ReactProp(name = "restYaw")
  override fun setRestYaw(view: BadgeSceneView, value: Double) {
    view.restYaw = value
  }

  @ReactProp(name = "spinIn")
  override fun setSpinIn(view: BadgeSceneView, value: Double) {
    if (value != 0.0) view.spinIn(value)
  }

  @ReactProp(name = "yawOffset")
  override fun setYawOffset(view: BadgeSceneView, value: Double) {
    view.yawOffset = value
  }

  @ReactProp(name = "backText")
  override fun setBackText(view: BadgeSceneView, value: String?) {
    view.backText = value ?: ""
  }

  @ReactProp(name = "backTextColor")
  override fun setBackTextColor(view: BadgeSceneView, value: String?) {
    view.backTextColor = value ?: ""
  }

  @ReactProp(name = "preload")
  override fun setPreload(view: BadgeSceneView, value: String?) {
    view.preload(value ?: "")
  }

  companion object {
    const val REACT_CLASS = "BadgeView"
  }
}
