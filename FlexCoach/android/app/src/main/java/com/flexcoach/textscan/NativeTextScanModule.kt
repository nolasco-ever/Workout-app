package com.flexcoach.textscan

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.flexcoach.specs.NativeTextScanSpec
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

/**
 * Reads the text in a photo on the device (see specs/NativeTextScan.ts) with
 * ML Kit's bundled Latin model, so it works offline at the gym. Each line
 * comes back with its box from 0 to 1 across and down the upright photo.
 */
class NativeTextScanModule(reactContext: ReactApplicationContext) : NativeTextScanSpec(reactContext) {
  override fun getName(): String = NAME

  override fun readText(uri: String, promise: Promise) {
    val image = try {
      InputImage.fromFilePath(reactApplicationContext, Uri.parse(uri))
    } catch (e: Exception) {
      promise.reject("no_image", "The photo could not be opened.", e)
      return
    }
    // The boxes are in the upright photo's pixels; a quarter turn swaps its sides.
    val turned = image.rotationDegrees == 90 || image.rotationDegrees == 270
    val width = (if (turned) image.height else image.width).toDouble().coerceAtLeast(1.0)
    val height = (if (turned) image.width else image.height).toDouble().coerceAtLeast(1.0)
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    recognizer.process(image)
      .addOnSuccessListener { result ->
        val pieces = Arguments.createArray()
        for (block in result.textBlocks) {
          for (line in block.lines) {
            val box = line.boundingBox ?: continue
            if (line.text.isBlank()) continue
            pieces.pushMap(Arguments.createMap().apply {
              putString("text", line.text)
              putDouble("x", box.left / width)
              putDouble("y", box.top / height)
              putDouble("w", box.width() / width)
              putDouble("h", box.height() / height)
            })
          }
        }
        promise.resolve(pieces)
      }
      .addOnFailureListener { e -> promise.reject("read_failed", e.message ?: "The photo could not be read.", e) }
      .addOnCompleteListener { recognizer.close() }
  }

  companion object {
    const val NAME = "NativeTextScan"
  }
}
