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
import com.miaomiao.kaiheiwu.MainActivity
import com.miaomiao.kaiheiwu.R
import kotlinx.coroutines.*
import java.io.File
import java.io.FileOutputStream
import java.net.URL

/**
 * 下载服务
 * 用于后台下载文件
 */
class DownloadService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val downloadJobs = mutableMapOf<String, Job>()

    companion object {
        private const val CHANNEL_ID = "download_channel"
        private const val NOTIFICATION_ID_BASE = 2000

        const val ACTION_DOWNLOAD = "com.miaomiao.kaiheiwu.action.DOWNLOAD"
        const val ACTION_CANCEL = "com.miaomiao.kaiheiwu.action.CANCEL_DOWNLOAD"
        const val EXTRA_URL = "download_url"
        const val EXTRA_FILENAME = "download_filename"
        const val EXTRA_DOWNLOAD_ID = "download_id"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_DOWNLOAD -> {
                val url = intent.getStringExtra(EXTRA_URL) ?: return START_NOT_STICKY
                val filename = intent.getStringExtra(EXTRA_FILENAME) ?: "download"
                val downloadId = intent.getStringExtra(EXTRA_DOWNLOAD_ID) ?: url.hashCode().toString()

                startDownload(downloadId, url, filename)
            }
            ACTION_CANCEL -> {
                val downloadId = intent.getStringExtra(EXTRA_DOWNLOAD_ID)
                downloadId?.let { cancelDownload(it) }
            }
        }
        return START_NOT_STICKY
    }

    private fun startDownload(downloadId: String, url: String, filename: String) {
        val notificationId = NOTIFICATION_ID_BASE + downloadId.hashCode()

        val job = serviceScope.launch {
            try {
                // 显示下载开始通知
                showProgressNotification(notificationId, filename, 0)

                val outputFile = File(getExternalFilesDir(null), filename)
                downloadFile(url, outputFile) { progress ->
                    showProgressNotification(notificationId, filename, progress)
                }

                // 下载完成
                showCompletedNotification(notificationId, filename)
                downloadJobs.remove(downloadId)

                // 检查是否所有下载都完成
                if (downloadJobs.isEmpty()) {
                    stopSelf()
                }
            } catch (e: Exception) {
                if (e !is CancellationException) {
                    showErrorNotification(notificationId, filename)
                }
                downloadJobs.remove(downloadId)
            }
        }

        downloadJobs[downloadId] = job
    }

    private suspend fun downloadFile(
        url: String,
        outputFile: File,
        onProgress: (Int) -> Unit
    ) {
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection()
            val totalSize = connection.contentLength
            var downloadedSize = 0

            connection.getInputStream().use { input ->
                FileOutputStream(outputFile).use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int

                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        downloadedSize += bytesRead

                        if (totalSize > 0) {
                            val progress = (downloadedSize * 100 / totalSize)
                            withContext(Dispatchers.Main) {
                                onProgress(progress)
                            }
                        }
                    }
                }
            }
        }
    }

    private fun cancelDownload(downloadId: String) {
        downloadJobs[downloadId]?.cancel()
        downloadJobs.remove(downloadId)

        val notificationId = NOTIFICATION_ID_BASE + downloadId.hashCode()
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.cancel(notificationId)

        if (downloadJobs.isEmpty()) {
            stopSelf()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "下载",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "下载通知"
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showProgressNotification(notificationId: Int, filename: String, progress: Int) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("正在下载")
            .setContentText(filename)
            .setSmallIcon(R.drawable.ic_download)
            .setProgress(100, progress, false)
            .setOngoing(true)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(notificationId, notification)

        // 确保服务在前台
        if (downloadJobs.size == 1) {
            startForeground(notificationId, notification)
        }
    }

    private fun showCompletedNotification(notificationId: Int, filename: String) {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("下载完成")
            .setContentText(filename)
            .setSmallIcon(R.drawable.ic_download_done)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        stopForeground(STOP_FOREGROUND_DETACH)

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(notificationId, notification)
    }

    private fun showErrorNotification(notificationId: Int, filename: String) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("下载失败")
            .setContentText(filename)
            .setSmallIcon(R.drawable.ic_download_error)
            .setAutoCancel(true)
            .build()

        stopForeground(STOP_FOREGROUND_DETACH)

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(notificationId, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }
}
