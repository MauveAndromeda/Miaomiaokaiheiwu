package com.miaomiao.kaiheiwu.ui.live

import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.miaomiao.kaiheiwu.R

/**
 * 直播间Activity
 * 支持观看直播、发送弹幕、送礼物等功能
 */
class LiveRoomActivity : AppCompatActivity() {

    private lateinit var videoContainer: FrameLayout
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var btnShare: ImageButton
    private lateinit var tvViewerCount: TextView
    private lateinit var tvHostName: TextView

    private var roomId: String = ""
    private var hostName: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupFullscreen()
        setContentView(R.layout.activity_live_room)

        // 获取传入参数
        roomId = intent.getStringExtra("room_id") ?: ""
        hostName = intent.getStringExtra("host_name") ?: ""

        initViews()
        loadLiveRoom()
    }

    private fun setupFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = false

        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun initViews() {
        videoContainer = findViewById(R.id.video_container)
        webView = findViewById(R.id.web_view)
        progressBar = findViewById(R.id.progress_bar)
        btnBack = findViewById(R.id.btn_back)
        btnShare = findViewById(R.id.btn_share)
        tvViewerCount = findViewById(R.id.tv_viewer_count)
        tvHostName = findViewById(R.id.tv_host_name)

        tvHostName.text = hostName

        btnBack.setOnClickListener { finish() }

        btnShare.setOnClickListener { shareLiveRoom() }

        setupWebView()
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun loadLiveRoom() {
        progressBar.visibility = View.VISIBLE
        // 加载直播间页面
        webView.loadUrl("file:///android_asset/web/index.html#/live-room?id=$roomId")
    }

    private fun shareLiveRoom() {
        val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(android.content.Intent.EXTRA_SUBJECT, "来看直播啦")
            putExtra(android.content.Intent.EXTRA_TEXT, "快来看${hostName}的直播！")
        }
        startActivity(android.content.Intent.createChooser(shareIntent, "分享到"))
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
