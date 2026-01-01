package com.miaomiao.kaiheiwu.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.miaomiao.kaiheiwu.R
import com.miaomiao.kaiheiwu.ui.call.CallActivity

/**
 * 通话前台服务
 * 用于保持通话过程中的前台状态
 */
class CallService : Service() {

    companion object {
        private const val CHANNEL_ID = "call_channel"
        private const val NOTIFICATION_ID = 1002

        const val ACTION_START_CALL = "com.miaomiao.kaiheiwu.action.START_CALL"
        const val ACTION_END_CALL = "com.miaomiao.kaiheiwu.action.END_CALL"
        const val EXTRA_CALL_ID = "call_id"
        const val EXTRA_CALLER_NAME = "caller_name"
        const val EXTRA_IS_VIDEO = "is_video"
        const val EXTRA_IS_INCOMING = "is_incoming"
    }

    private var callId: String = ""
    private var callerName: String = ""
    private var isVideoCall: Boolean = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CALL -> {
                callId = intent.getStringExtra(EXTRA_CALL_ID) ?: ""
                callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "未知用户"
                isVideoCall = intent.getBooleanExtra(EXTRA_IS_VIDEO, false)

                startForeground(NOTIFICATION_ID, createNotification())

                // 启动通话Activity
                val callIntent = Intent(this, CallActivity::class.java).apply {
                    putExtra("call_id", callId)
                    putExtra("caller_name", callerName)
                    putExtra("is_video", isVideoCall)
                    putExtra("is_incoming", intent.getBooleanExtra(EXTRA_IS_INCOMING, false))
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(callIntent)
            }
            ACTION_END_CALL -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "通话",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "通话通知"
                setShowBadge(true)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, CallActivity::class.java).apply {
            putExtra("call_id", callId)
            putExtra("caller_name", callerName)
            putExtra("is_video", isVideoCall)
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val endCallIntent = Intent(this, CallService::class.java).apply {
            action = ACTION_END_CALL
        }
        val endCallPendingIntent = PendingIntent.getService(
            this, 0, endCallIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callType = if (isVideoCall) "视频通话" else "语音通话"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(callerName)
            .setContentText("$callType 进行中...")
            .setSmallIcon(R.drawable.ic_call)
            .setContentIntent(pendingIntent)
            .addAction(R.drawable.ic_hangup, "挂断", endCallPendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
    }
}
