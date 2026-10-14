package com.flexcoach.badges

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

/** Registers the native 3D badge view. Added by hand in MainApplication. */
class BadgePackage : BaseReactPackage() {
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = listOf(BadgeViewManager(reactContext))

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeBadgeModelsModule.NAME) NativeBadgeModelsModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeBadgeModelsModule.NAME to ReactModuleInfo(
        name = NativeBadgeModelsModule.NAME,
        className = NativeBadgeModelsModule.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true,
      ),
    )
  }
}
