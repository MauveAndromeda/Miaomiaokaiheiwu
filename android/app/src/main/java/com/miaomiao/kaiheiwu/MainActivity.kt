package com.miaomiao.kaiheiwu

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.miaomiao.kaiheiwu.bridge.NativeBridge
import com.miaomiao.kaiheiwu.utils.NetworkUtils
import com.permissionx.guolindev.PermissionX

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var rootLayout: FrameLayout
    private lateinit var nativeBridge: NativeBridge

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var lastBackPressTime: Long = 0

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        filePathCallback?.onReceiveValue(uris.toTypedArray())
        filePathCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 设置全屏沉浸式
        setupImmersiveMode()

        // 创建布局
        createLayout()

        // 初始化WebView
        setupWebView()

        // 初始化原生桥接
        nativeBridge = NativeBridge(this, webView)

        // 检查网络并加载
        checkNetworkAndLoad()
    }

    private fun setupImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false

        // 设置状态栏透明
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        // 保持屏幕常亮
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun createLayout() {
        rootLayout = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(android.graphics.Color.parseColor("#0a0a0f"))
        }

        // 创建WebView
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        rootLayout.addView(webView)

        // 创建进度条
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                8
            ).apply {
                gravity = android.view.Gravity.TOP
            }
            max = 100
            progressDrawable = ContextCompat.getDrawable(context, R.drawable.progress_bar)
            visibility = View.GONE
        }
        rootLayout.addView(progressBar)

        setContentView(rootLayout)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            // JavaScript设置
            javaScriptEnabled = true
            javaScriptCanOpenWindowsAutomatically = true

            // DOM存储
            domStorageEnabled = true
            databaseEnabled = true

            // 缓存设置
            cacheMode = WebSettings.LOAD_DEFAULT

            // 媒体设置
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true

            // 缩放设置
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            // 视口设置
            useWideViewPort = true
            loadWithOverviewMode = true

            // 混合内容
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // 用户代理
            userAgentString = "$userAgentString MiaomiaoApp/${BuildConfig.VERSION_NAME}"

            // 文本缩放
            textZoom = 100
        }

        // 添加JavaScript接口
        webView.addJavascriptInterface(nativeBridge, "NativeBridge")

        // 设置WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()

                // 处理外部链接
                if (url.startsWith("tel:") || url.startsWith("mailto:") ||
                    url.startsWith("weixin:") || url.startsWith("alipays:")) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "无法打开该链接", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }

                return false
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE

                // 注入安全区域信息
                injectSafeAreaInsets()
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                super.onReceivedError(view, request, error)
                if (request.isForMainFrame) {
                    showErrorPage()
                }
            }
        }

        // 设置WebChromeClient
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val mimeTypes = fileChooserParams.acceptTypes.joinToString(",")
                fileChooserLauncher.launch(if (mimeTypes.isEmpty()) "*/*" else mimeTypes)
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                val resources = request.resources
                val permissions = mutableListOf<String>()

                resources.forEach { resource ->
                    when (resource) {
                        PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                            permissions.add(Manifest.permission.CAMERA)
                        }
                        PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                            permissions.add(Manifest.permission.RECORD_AUDIO)
                        }
                    }
                }

                if (permissions.isNotEmpty()) {
                    requestPermissionsForWeb(permissions, request)
                } else {
                    request.grant(resources)
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                android.util.Log.d("WebView", "${consoleMessage.message()} -- From line ${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()}")
                return true
            }
        }
    }

    private fun requestPermissionsForWeb(permissions: List<String>, request: PermissionRequest) {
        PermissionX.init(this)
            .permissions(permissions)
            .onExplainRequestReason { scope, deniedList ->
                scope.showRequestReasonDialog(
                    deniedList,
                    "需要以下权限才能正常使用该功能",
                    "确定",
                    "取消"
                )
            }
            .onForwardToSettings { scope, deniedList ->
                scope.showForwardToSettingsDialog(
                    deniedList,
                    "您需要在设置中手动开启权限",
                    "去设置",
                    "取消"
                )
            }
            .request { allGranted, _, _ ->
                if (allGranted) {
                    request.grant(request.resources)
                } else {
                    request.deny()
                }
            }
    }

    private fun checkNetworkAndLoad() {
        if (NetworkUtils.isNetworkAvailable(this)) {
            loadWebApp()
        } else {
            showErrorPage()
        }
    }

    private fun loadWebApp() {
        // 加载本地或远程页面
        webView.loadUrl("file:///android_asset/web/index.html")
    }

    private fun showErrorPage() {
        val errorHtml = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                    }
                    .container {
                        text-align: center;
                        padding: 40px 20px;
                    }
                    .icon { font-size: 80px; margin-bottom: 24px; }
                    h1 { font-size: 24px; margin-bottom: 12px; }
                    p { color: rgba(255,255,255,0.6); margin-bottom: 32px; }
                    button {
                        background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
                        border: none;
                        color: white;
                        padding: 14px 48px;
                        border-radius: 25px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">📡</div>
                    <h1>网络连接失败</h1>
                    <p>请检查您的网络设置后重试</p>
                    <button onclick="location.reload()">重新加载</button>
                </div>
            </body>
            </html>
        """.trimIndent()

        webView.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null)
    }

    private fun injectSafeAreaInsets() {
        val statusBarHeight = getStatusBarHeight()
        val navigationBarHeight = getNavigationBarHeight()

        val js = """
            (function() {
                document.documentElement.style.setProperty('--safe-area-inset-top', '${statusBarHeight}px');
                document.documentElement.style.setProperty('--safe-area-inset-bottom', '${navigationBarHeight}px');
            })();
        """.trimIndent()

        webView.evaluateJavascript(js, null)
    }

    private fun getStatusBarHeight(): Int {
        val resourceId = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (resourceId > 0) {
            resources.getDimensionPixelSize(resourceId)
        } else {
            (24 * resources.displayMetrics.density).toInt()
        }
    }

    private fun getNavigationBarHeight(): Int {
        val resourceId = resources.getIdentifier("navigation_bar_height", "dimen", "android")
        return if (resourceId > 0) {
            resources.getDimensionPixelSize(resourceId)
        } else {
            0
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView.canGoBack()) {
                webView.goBack()
                return true
            } else {
                val currentTime = System.currentTimeMillis()
                if (currentTime - lastBackPressTime < 2000) {
                    finish()
                } else {
                    lastBackPressTime = currentTime
                    Toast.makeText(this, "再按一次退出应用", Toast.LENGTH_SHORT).show()
                }
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.resumeTimers()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        webView.pauseTimers()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    fun callJavaScript(method: String, vararg args: Any) {
        val argsString = args.joinToString(",") {
            when (it) {
                is String -> "\"$it\""
                else -> it.toString()
            }
        }
        val js = "window.$method($argsString)"
        webView.evaluateJavascript(js, null)
    }
}
