package com.flexcoach.route

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.flexcoach.specs.NativeRouteTrackerSpec

/**
 * The phone's GPS for an outdoor cardio entry (see specs/NativeRouteTracker.ts).
 * JavaScript asks for the location permission first (PermissionsAndroid);
 * without it, start resolves "denied" and nothing records.
 */
class NativeRouteTrackerModule(reactContext: ReactApplicationContext) : NativeRouteTrackerSpec(reactContext) {
  override fun getName(): String = NAME

  private fun granted(): Boolean =
    ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED

  override fun start(promise: Promise) {
    if (!granted()) {
      promise.resolve("denied")
      return
    }
    try {
      ContextCompat.startForegroundService(reactApplicationContext, Intent(reactApplicationContext, RouteTrackerService::class.java))
      promise.resolve("granted")
    } catch (e: Exception) {
      promise.reject("start_failed", e.message ?: "Location recording could not start.", e)
    }
  }

  override fun stop() {
    reactApplicationContext.stopService(Intent(reactApplicationContext, RouteTrackerService::class.java))
  }

  override fun takePoints(): WritableArray {
    val out = Arguments.createArray()
    synchronized(RouteTrackerService.buffer) {
      for (p in RouteTrackerService.buffer) {
        out.pushMap(Arguments.createMap().apply {
          putDouble("lat", p[0])
          putDouble("lon", p[1])
          putDouble("t", p[2])
          putDouble("acc", p[3])
        })
      }
      RouteTrackerService.buffer.clear()
    }
    return out
  }

  companion object {
    const val NAME = "NativeRouteTracker"
  }
}
