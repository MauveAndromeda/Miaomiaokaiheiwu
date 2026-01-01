package com.miaomiao.kaiheiwu.bridge

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.miaomiao.kaiheiwu.BuildConfig
import com.miaomiao.kaiheiwu.ui.camera.CameraActivity
import com.miaomiao.kaiheiwu.ui.video.VideoPlayerActivity
import com.miaomiao.kaiheiwu.utils.PreferenceUtils
import com.permissionx.guolindev.PermissionX
import org.json.JSONObject

/**
 * JavaScript原生桥接类
 * 提供Web页面调用原生功能的能力
 */
class NativeBridge(
    private val activity: AppCompatActivity,
    private val webView: WebView
) {

    /**
     * 获取应用版本信息
     */
    @JavascriptInterface
    fun getAppInfo(): String {
        return JSONObject().apply {
            put("versionName", BuildConfig.VERSION_NAME)
            put("versionCode", BuildConfig.VERSION_CODE)
            put("packageName", activity.packageName)
            put("platform", "android")
            put("sdkVersion", Build.VERSION.SDK_INT)
            put("device", "${Build.MANUFACTURER} ${Build.MODEL}")
        }.toString()
    }

    /**
     * 显示Toast消息
     */
    @JavascriptInterface
    fun showToast(message: String, duration: Int = 0) {
        activity.runOnUiThread {
            Toast.makeText(
                activity,
                message,
                if (duration > 0) Toast.LENGTH_LONG else Toast.LENGTH_SHORT
            ).show()
        }
    }

    /**
     * 振动反馈
     */
    @JavascriptInterface
    fun vibrate(milliseconds: Long = 50) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            activity.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(milliseconds)
        }
    }

    /**
     * 复制文本到剪贴板
     */
    @JavascriptInterface
    fun copyToClipboard(text: String) {
        val clipboard = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("text", text)
        clipboard.setPrimaryClip(clip)
        showToast("已复制到剪贴板")
    }

    /**
     * 打开系统浏览器
     */
    @JavascriptInterface
    fun openBrowser(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            activity.startActivity(intent)
        } catch (e: Exception) {
            showToast("无法打开链接")
        }
    }

    /**
     * 打开系统设置
     */
    @JavascriptInterface
    fun openSettings() {
        try {
            val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${activity.packageName}")
            }
            activity.startActivity(intent)
        } catch (e: Exception) {
            showToast("无法打开设置")
        }
    }

    /**
     * 分享内容
     */
    @JavascriptInterface
    fun share(title: String, text: String, url: String = "") {
        val shareText = if (url.isNotEmpty()) "$text\n$url" else text
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, title)
            putExtra(Intent.EXTRA_TEXT, shareText)
        }
        activity.startActivity(Intent.createChooser(intent, "分享到"))
    }

    /**
     * 拨打电话
     */
    @JavascriptInterface
    fun call(phoneNumber: String) {
        try {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phoneNumber"))
            activity.startActivity(intent)
        } catch (e: Exception) {
            showToast("无法拨打电话")
        }
    }

    /**
     * 保存数据到本地存储
     */
    @JavascriptInterface
    fun saveData(key: String, value: String) {
        PreferenceUtils.saveString(activity, key, value)
    }

    /**
     * 从本地存储读取数据
     */
    @JavascriptInterface
    fun getData(key: String): String {
        return PreferenceUtils.getString(activity, key, "")
    }

    /**
     * 删除本地存储数据
     */
    @JavascriptInterface
    fun removeData(key: String) {
        PreferenceUtils.remove(activity, key)
    }

    /**
     * 清空本地存储
     */
    @JavascriptInterface
    fun clearData() {
        PreferenceUtils.clear(activity)
    }

    /**
     * 请求权限
     */
    @JavascriptInterface
    fun requestPermission(permissionType: String, callback: String) {
        val permissions = when (permissionType) {
            "camera" -> listOf(Manifest.permission.CAMERA)
            "microphone" -> listOf(Manifest.permission.RECORD_AUDIO)
            "storage" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                listOf(
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VIDEO
                )
            } else {
                listOf(
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                )
            }
            "notification" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                listOf(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                emptyList()
            }
            else -> emptyList()
        }

        if (permissions.isEmpty()) {
            callJsCallback(callback, true)
            return
        }

        activity.runOnUiThread {
            PermissionX.init(activity)
                .permissions(permissions)
                .request { allGranted, _, _ ->
                    callJsCallback(callback, allGranted)
                }
        }
    }

    /**
     * 检查权限
     */
    @JavascriptInterface
    fun checkPermission(permissionType: String): Boolean {
        val permission = when (permissionType) {
            "camera" -> Manifest.permission.CAMERA
            "microphone" -> Manifest.permission.RECORD_AUDIO
            "storage" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                Manifest.permission.READ_MEDIA_IMAGES
            } else {
                Manifest.permission.READ_EXTERNAL_STORAGE
            }
            else -> return true
        }

        return activity.checkSelfPermission(permission) == android.content.pm.PackageManager.PERMISSION_GRANTED
    }

    /**
     * 打开相机
     */
    @JavascriptInterface
    fun openCamera(callback: String) {
        activity.runOnUiThread {
            PermissionX.init(activity)
                .permissions(Manifest.permission.CAMERA)
                .request { allGranted, _, _ ->
                    if (allGranted) {
                        val intent = Intent(activity, CameraActivity::class.java)
                        activity.startActivity(intent)
                        callJsCallback(callback, true)
                    } else {
                        callJsCallback(callback, false)
                    }
                }
        }
    }

    /**
     * 播放视频
     */
    @JavascriptInterface
    fun playVideo(url: String, title: String = "") {
        activity.runOnUiThread {
            val intent = Intent(activity, VideoPlayerActivity::class.java).apply {
                putExtra("video_url", url)
                putExtra("video_title", title)
            }
            activity.startActivity(intent)
        }
    }

    /**
     * 获取网络状态
     */
    @JavascriptInterface
    fun getNetworkStatus(): String {
        return JSONObject().apply {
            put("isConnected", com.miaomiao.kaiheiwu.utils.NetworkUtils.isNetworkAvailable(activity))
            put("isWifi", com.miaomiao.kaiheiwu.utils.NetworkUtils.isWifiConnected(activity))
            put("isMobile", com.miaomiao.kaiheiwu.utils.NetworkUtils.isMobileConnected(activity))
        }.toString()
    }

    /**
     * 退出应用
     */
    @JavascriptInterface
    fun exitApp() {
        activity.runOnUiThread {
            activity.finishAffinity()
        }
    }

    /**
     * 调用JavaScript回调
     */
    private fun callJsCallback(callback: String, result: Any) {
        val resultStr = when (result) {
            is Boolean -> result.toString()
            is String -> "\"$result\""
            else -> result.toString()
        }
        activity.runOnUiThread {
            webView.evaluateJavascript("$callback($resultStr)", null)
        }
    }
}
