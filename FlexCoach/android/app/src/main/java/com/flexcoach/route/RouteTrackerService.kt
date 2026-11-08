package com.flexcoach.route

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.flexcoach.R
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

/**
 * Records the phone's GPS while an outdoor cardio clock runs (v1 #10.8). A
 * foreground service of the location type, so it keeps recording with the
 * screen off; its notification says so. Readings wait in [buffer] until the
 * app takes them.
 */
class RouteTrackerService : Service() {
  private val client by lazy { LocationServices.getFusedLocationProviderClient(this) }
  private val callback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
      synchronized(buffer) {
        for (l in result.locations) {
          buffer.add(doubleArrayOf(l.latitude, l.longitude, l.time.toDouble(), if (l.hasAccuracy()) l.accuracy.toDouble() else 0.0))
        }
        // About 3 hours at one reading a second.
        while (buffer.size > 12000) buffer.removeAt(0)
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = notification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000L).setMinUpdateDistanceMeters(3f).build()
    try {
      client.requestLocationUpdates(request, callback, Looper.getMainLooper())
    } catch (e: SecurityException) {
      stopSelf()
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    client.removeLocationUpdates(callback)
    super.onDestroy()
  }

  private fun notification(): Notification {
    val manager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager.getNotificationChannel(CHANNEL) == null) {
      manager.createNotificationChannel(NotificationChannel(CHANNEL, "Outdoor route", NotificationManager.IMPORTANCE_LOW).apply {
        description = "Shown while FlexCoach records the route of an outdoor run, walk or ride."
      })
    }
    val open = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }
    return NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle("Recording your route")
      .setContentText("FlexCoach is recording your outdoor workout.")
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(open)
      .build()
  }

  companion object {
    const val CHANNEL = "route"
    const val NOTIFICATION_ID = 4210
    val buffer = mutableListOf<DoubleArray>()
  }
}
