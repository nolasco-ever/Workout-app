package com.flexcoach.badges

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.flexcoach.specs.NativeBadgeModelsSpec

/** Warms the badge model cache from JavaScript (see specs/NativeBadgeModels.ts). */
class NativeBadgeModelsModule(reactContext: ReactApplicationContext) : NativeBadgeModelsSpec(reactContext) {
  override fun getName(): String = NAME

  override fun preload(keys: String, promise: Promise) {
    BadgeSceneView.preload(reactApplicationContext, keys) { promise.resolve(null) }
  }

  companion object {
    const val NAME = "NativeBadgeModels"
  }
}
