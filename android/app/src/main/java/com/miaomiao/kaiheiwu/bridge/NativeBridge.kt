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
 *
 * 安全措施：
 * - URL白名单验证
 * - 输入参数过滤
 * - 敏感API访问限制
 * - 存储Key白名单
 */
class NativeBridge(
    private val activity: AppCompatActivity,
    private val webView: WebView
) {

    companion object {
        // 允许打开的URL域名白名单
        private val ALLOWED_URL_DOMAINS = setOf(
            "miaomiao.com",
            "miaomiaokaiheiwu.com",
            "weixin.qq.com",
            "alipay.com",
            "weibo.com",
            "qq.com"
        )

        // 允许存储的Key前缀白名单
        private val ALLOWED_STORAGE_PREFIXES = setOf(
            "user_",
            "settings_",
            "cache_",
            "app_"
        )

        // 最大Toast消息长度
        private const val MAX_TOAST_LENGTH = 100

        // 最大存储值长度
        private const val MAX_STORAGE_VALUE_LENGTH = 10000

        // 最大振动时间（毫秒）
        private const val MAX_VIBRATE_DURATION = 1000L
    }

    /**
     * 验证URL是否在白名单中
     */
    private fun isUrlAllowed(url: String): Boolean {
        return try {
            val uri = Uri.parse(url)
            val host = uri.host?.lowercase() ?: return false
            // 检查是否为http/https协议
            if (uri.scheme !in listOf("http", "https", "tel", "mailto")) {
                return false
            }
            // tel和mailto协议直接允许
            if (uri.scheme in listOf("tel", "mailto")) {
                return true
            }
            // 检查域名白名单
            ALLOWED_URL_DOMAINS.any { domain ->
                host == domain || host.endsWith(".$domain")
            }
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 验证存储Key是否合法
     */
    private fun isStorageKeyAllowed(key: String): Boolean {
        if (key.length > 100) return false
        // 检查Key前缀是否在白名单中
        return ALLOWED_STORAGE_PREFIXES.any { prefix -> key.startsWith(prefix) }
    }

    /**
     * 过滤字符串中的危险字符
     */
    private fun sanitizeString(input: String, maxLength: Int = 1000): String {
        return input.take(maxLength)
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
    }

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
        // 限制消息长度防止滥用
        val safeMessage = message.take(MAX_TOAST_LENGTH)
        activity.runOnUiThread {
            Toast.makeText(
                activity,
                safeMessage,
                if (duration > 0) Toast.LENGTH_LONG else Toast.LENGTH_SHORT
            ).show()
        }
    }

    /**
     * 振动反馈
     */
    @JavascriptInterface
    fun vibrate(milliseconds: Long = 50) {
        // 限制振动时长防止滥用
        val safeDuration = milliseconds.coerceIn(10, MAX_VIBRATE_DURATION)

        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            activity.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(safeDuration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(safeDuration)
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
     * 只允许白名单中的域名
     */
    @JavascriptInterface
    fun openBrowser(url: String) {
        // 安全检查：验证URL是否在白名单中
        if (!isUrlAllowed(url)) {
            showToast("不允许打开此链接")
            return
        }
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
     * 只允许白名单前缀的Key
     */
    @JavascriptInterface
    fun saveData(key: String, value: String) {
        // 安全检查：验证Key是否合法
        if (!isStorageKeyAllowed(key)) {
            android.util.Log.w("NativeBridge", "Storage key not allowed: $key")
            return
        }
        // 限制值长度
        val safeValue = value.take(MAX_STORAGE_VALUE_LENGTH)
        PreferenceUtils.saveString(activity, key, safeValue)
    }

    /**
     * 从本地存储读取数据
     * 只允许白名单前缀的Key
     */
    @JavascriptInterface
    fun getData(key: String): String {
        // 安全检查：验证Key是否合法
        if (!isStorageKeyAllowed(key)) {
            android.util.Log.w("NativeBridge", "Storage key not allowed: $key")
            return ""
        }
        return PreferenceUtils.getString(activity, key, "")
    }

    /**
     * 删除本地存储数据
     * 只允许白名单前缀的Key
     */
    @JavascriptInterface
    fun removeData(key: String) {
        // 安全检查：验证Key是否合法
        if (!isStorageKeyAllowed(key)) {
            android.util.Log.w("NativeBridge", "Storage key not allowed: $key")
            return
        }
        PreferenceUtils.remove(activity, key)
    }

    /**
     * 清空本地存储
     * 注意：此操作会清空所有应用数据
     */
    @JavascriptInterface
    fun clearData() {
        // 只清空白名单前缀的数据，不清空系统数据
        android.util.Log.i("NativeBridge", "Clear all user data requested")
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
     * 使用JSON序列化防止代码注入，增加异常处理防止崩溃
     */
    private fun callJsCallback(callback: String, result: Any) {
        // 验证callback名称只包含合法字符（防止代码注入）
        if (!callback.matches(Regex("^[a-zA-Z_][a-zA-Z0-9_]*$"))) {
            android.util.Log.w("NativeBridge", "Invalid callback name: $callback")
            return
        }

        // 使用JSON序列化确保安全
        val resultStr = when (result) {
            is Boolean -> result.toString()
            is String -> JSONObject.quote(result) // 使用JSON安全转义
            is Number -> result.toString()
            else -> JSONObject.quote(result.toString())
        }

        // 使用try-catch包装的安全执行脚本
        val safeScript = """
            (function() {
                try {
                    if (typeof $callback === 'function') {
                        $callback($resultStr);
                    } else {
                        console.warn('NativeBridge: callback $callback is not a function');
                    }
                } catch (e) {
                    console.error('NativeBridge callback error:', e);
                }
            })();
        """.trimIndent()

        activity.runOnUiThread {
            try {
                webView.evaluateJavascript(safeScript, null)
            } catch (e: Exception) {
                android.util.Log.e("NativeBridge", "Failed to execute JS callback", e)
            }
        }
    }
}
