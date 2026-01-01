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
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.miaomiao.kaiheiwu.MainActivity
import com.miaomiao.kaiheiwu.R

/**
 * 媒体播放前台服务
 * 用于后台音频播放
 */
class MediaPlaybackService : Service() {

    private var player: ExoPlayer? = null

    companion object {
        private const val CHANNEL_ID = "media_playback_channel"
        private const val NOTIFICATION_ID = 1001

        const val ACTION_PLAY = "com.miaomiao.kaiheiwu.action.PLAY"
        const val ACTION_PAUSE = "com.miaomiao.kaiheiwu.action.PAUSE"
        const val ACTION_STOP = "com.miaomiao.kaiheiwu.action.STOP"
        const val EXTRA_MEDIA_URL = "media_url"
        const val EXTRA_MEDIA_TITLE = "media_title"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initPlayer()
    }

    private fun initPlayer() {
        player = ExoPlayer.Builder(this).build().apply {
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    when (playbackState) {
                        Player.STATE_ENDED -> {
                            stopForeground(STOP_FOREGROUND_REMOVE)
                            stopSelf()
                        }
                        Player.STATE_READY -> {
                            updateNotification()
                        }
                    }
                }

                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    updateNotification()
                }
            })
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PLAY -> {
                val url = intent.getStringExtra(EXTRA_MEDIA_URL)
                val title = intent.getStringExtra(EXTRA_MEDIA_TITLE) ?: "正在播放"
                if (url != null) {
                    playMedia(url, title)
                }
            }
            ACTION_PAUSE -> {
                player?.pause()
            }
            ACTION_STOP -> {
                stopPlayback()
            }
        }
        return START_NOT_STICKY
    }

    private fun playMedia(url: String, title: String) {
        player?.apply {
            setMediaItem(MediaItem.fromUri(url))
            prepare()
            play()
        }
        startForeground(NOTIFICATION_ID, createNotification(title, true))
    }

    private fun stopPlayback() {
        player?.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "媒体播放",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "媒体播放通知"
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(title: String, isPlaying: Boolean): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val pauseIntent = Intent(this, MediaPlaybackService::class.java).apply {
            action = if (isPlaying) ACTION_PAUSE else ACTION_PLAY
        }
        val pausePendingIntent = PendingIntent.getService(
            this, 0, pauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, MediaPlaybackService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(if (isPlaying) "正在播放" else "已暂停")
            .setSmallIcon(R.drawable.ic_music)
            .setContentIntent(pendingIntent)
            .addAction(
                if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play,
                if (isPlaying) "暂停" else "播放",
                pausePendingIntent
            )
            .addAction(R.drawable.ic_stop, "停止", stopPendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification() {
        val isPlaying = player?.isPlaying ?: false
        val notification = createNotification("喵喵开黑屋", isPlaying)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        player?.release()
        player = null
        super.onDestroy()
    }
}
