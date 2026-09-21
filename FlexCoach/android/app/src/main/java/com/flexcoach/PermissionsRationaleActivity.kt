package com.flexcoach

import android.app.Activity
import android.os.Bundle
import android.webkit.WebView

/**
 * Shown by Health Connect when the user asks why FlexCoach wants health
 * permissions. Loads the privacy explanation page.
 */
class PermissionsRationaleActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val webView = WebView(this)
    webView.loadData(
      """
      <html><body style="font-family:sans-serif;padding:24px;line-height:1.5">
      <h2>Why FlexCoach asks for health data</h2>
      <p><b>Steps</b> are read to show today's count and your weekly average on the Home tab.</p>
      <p><b>Body weight</b> is read to import weigh-ins you record elsewhere, and written when you log a weigh-in in FlexCoach, so your records stay in one place.</p>
      <p>Nothing is shared with other people. You can revoke access at any time in Health Connect.</p>
      </body></html>
      """.trimIndent(),
      "text/html",
      "utf-8",
    )
    setContentView(webView)
  }
}
