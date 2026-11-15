package com.flexcoach.tabavatar

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Shader
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.flexcoach.specs.NativeTabAvatarSpec
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Draws the profile photo as a round tab bar icon (see specs/NativeTabAvatar.ts):
 * the middle square of the photo in a circle, with a ring in the given colour or
 * none, saved as a PNG in the cache and returned as a file:// address.
 */
class NativeTabAvatarModule(reactContext: ReactApplicationContext) : NativeTabAvatarSpec(reactContext) {
  override fun getName(): String = NAME

  override fun roundIcon(url: String, sizePx: Double, ringColor: String, promise: Promise) {
    thread(name = "tab-avatar") {
      try {
        val size = sizePx.roundToInt().coerceAtLeast(1)
        val tag = if (ringColor.isEmpty()) "plain" else ringColor.removePrefix("#")
        val file = File(reactApplicationContext.cacheDir, "tab-avatar2-${url.hashCode()}-$size-$tag.png")
        if (file.exists()) {
          promise.resolve("file://${file.absolutePath}")
          return@thread
        }
        val photo = load(url) ?: run {
          promise.reject("no_image", "The profile photo could not be loaded.")
          return@thread
        }
        val icon = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(icon)
        val side = size.toFloat()
        val ringWidth = side * RING_SHARE
        // Inside a ring the photo steps in to make room, as on Instagram; without one it nearly fills the icon.
        val inset = if (ringColor.isNotEmpty()) ringWidth + side * GAP_SHARE else side * PLAIN_INSET_SHARE
        val diameter = side - inset * 2
        val edge = min(photo.width, photo.height).toFloat()
        val scale = diameter / edge
        val shader = BitmapShader(photo, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        shader.setLocalMatrix(Matrix().apply {
          setScale(scale, scale)
          postTranslate(side / 2 - photo.width * scale / 2, side / 2 - photo.height * scale / 2)
        })
        canvas.drawCircle(side / 2, side / 2, diameter / 2, Paint(Paint.ANTI_ALIAS_FLAG).apply { this.shader = shader })
        if (ringColor.isNotEmpty()) {
          val ring = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = ringWidth
            color = Color.parseColor(if (ringColor.startsWith("#")) ringColor else "#$ringColor")
          }
          canvas.drawCircle(side / 2, side / 2, side / 2 - ringWidth / 2, ring)
        }
        FileOutputStream(file).use { icon.compress(Bitmap.CompressFormat.PNG, 100, it) }
        promise.resolve("file://${file.absolutePath}")
      } catch (e: Exception) {
        promise.reject("failed", "The tab icon could not be made.", e)
      }
    }
  }

  private fun load(url: String): Bitmap? {
    val connection = URL(url).openConnection() as HttpURLConnection
    return try {
      connection.connectTimeout = 15000
      connection.readTimeout = 15000
      connection.inputStream.use { BitmapFactory.decodeStream(it) }
    } finally {
      connection.disconnect()
    }
  }

  companion object {
    const val NAME = "NativeTabAvatar"
    /** The ring and the gap inside it, each as a share of the icon's width (as on iOS). */
    private const val RING_SHARE = 0.06f
    private const val GAP_SHARE = 0.06f
    /** Without a ring the photo nearly fills the icon (owner: the plain one looked too small). */
    private const val PLAIN_INSET_SHARE = 0.02f
  }
}
