package com.miaomiao.kaiheiwu.ui.video

import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.miaomiao.kaiheiwu.R

@UnstableApi
class VideoPlayerActivity : AppCompatActivity() {

    private var player: ExoPlayer? = null
    private lateinit var playerView: PlayerView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var tvTitle: TextView
    private lateinit var tvError: TextView

    private var videoUrl: String = ""
    private var videoTitle: String = ""

    companion object {
        private const val TAG = "VideoPlayerActivity"
        // 允许的URL协议
        private val ALLOWED_SCHEMES = setOf("http", "https", "file")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 全屏设置
        setupFullscreen()

        setContentView(R.layout.activity_video_player)

        // 获取传入参数
        videoUrl = intent.getStringExtra("video_url") ?: ""
        videoTitle = intent.getStringExtra("video_title") ?: ""

        // 初始化视图
        initViews()

        // 验证URL并初始化播放器
        if (validateAndInitPlayer()) {
            android.util.Log.i(TAG, "视频播放器初始化成功: $videoTitle")
        }
    }

    private fun setupFullscreen() {
        try {
            WindowCompat.setDecorFitsSystemWindows(window, false)

            val controller = WindowInsetsControllerCompat(window, window.decorView)
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "全屏设置失败", e)
        }
    }

    private fun initViews() {
        playerView = findViewById(R.id.player_view)
        progressBar = findViewById(R.id.progress_bar)
        btnBack = findViewById(R.id.btn_back)
        tvTitle = findViewById(R.id.tv_title)

        // 错误提示文本（如果布局中没有，则创建一个）
        tvError = findViewById(R.id.tv_error) ?: TextView(this).apply {
            visibility = View.GONE
        }

        tvTitle.text = videoTitle.ifEmpty { "视频播放" }

        btnBack.setOnClickListener {
            finish()
        }

        // 点击切换控制器显示
        playerView.setControllerVisibilityListener(PlayerView.ControllerVisibilityListener { visibility ->
            if (visibility == View.VISIBLE) {
                btnBack.visibility = View.VISIBLE
                tvTitle.visibility = View.VISIBLE
            } else {
                btnBack.visibility = View.GONE
                tvTitle.visibility = View.GONE
            }
        })
    }

    /**
     * 验证URL格式和协议
     */
    private fun isValidVideoUrl(url: String): Boolean {
        if (url.isBlank()) {
            return false
        }

        return try {
            val uri = Uri.parse(url)
            val scheme = uri.scheme?.lowercase()

            // 验证协议
            if (scheme == null || scheme !in ALLOWED_SCHEMES) {
                android.util.Log.w(TAG, "不允许的URL协议: $scheme")
                return false
            }

            // 对于http/https，验证host
            if (scheme in listOf("http", "https")) {
                val host = uri.host
                if (host.isNullOrBlank()) {
                    android.util.Log.w(TAG, "URL缺少host: $url")
                    return false
                }
            }

            true
        } catch (e: Exception) {
            android.util.Log.e(TAG, "URL解析失败: $url", e)
            false
        }
    }

    /**
     * 验证URL并初始化播放器
     */
    private fun validateAndInitPlayer(): Boolean {
        // 验证URL
        if (!isValidVideoUrl(videoUrl)) {
            showError("无效的视频地址")
            return false
        }

        return try {
            initPlayer()
            true
        } catch (e: Exception) {
            android.util.Log.e(TAG, "播放器初始化失败", e)
            showError("播放器初始化失败")
            false
        }
    }

    private fun initPlayer() {
        player = ExoPlayer.Builder(this)
            .build()
            .apply {
                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(state: Int) {
                        when (state) {
                            Player.STATE_BUFFERING -> {
                                progressBar.visibility = View.VISIBLE
                                hideError()
                            }
                            Player.STATE_READY -> {
                                progressBar.visibility = View.GONE
                                hideError()
                            }
                            Player.STATE_ENDED -> {
                                // 播放结束
                                android.util.Log.i(TAG, "视频播放结束")
                            }
                            Player.STATE_IDLE -> {
                                // 空闲状态
                            }
                        }
                    }

                    override fun onPlayerError(error: PlaybackException) {
                        android.util.Log.e(TAG, "播放错误: ${error.message}", error)
                        progressBar.visibility = View.GONE

                        val errorMessage = when (error.errorCode) {
                            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED,
                            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT -> "网络连接失败，请检查网络"
                            PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS -> "视频加载失败 (${error.errorCode})"
                            PlaybackException.ERROR_CODE_IO_FILE_NOT_FOUND -> "视频文件不存在"
                            PlaybackException.ERROR_CODE_DECODER_INIT_FAILED,
                            PlaybackException.ERROR_CODE_DECODING_FAILED -> "视频格式不支持"
                            else -> "播放失败，请重试"
                        }
                        showError(errorMessage)
                    }
                })
            }

        playerView.player = player

        try {
            val mediaItem = MediaItem.fromUri(videoUrl)
            player?.setMediaItem(mediaItem)
            player?.prepare()
            player?.playWhenReady = true
        } catch (e: Exception) {
            android.util.Log.e(TAG, "设置媒体项失败", e)
            showError("无法加载视频")
        }
    }

    private fun showError(message: String) {
        runOnUiThread {
            progressBar.visibility = View.GONE
            Toast.makeText(this, message, Toast.LENGTH_LONG).show()

            // 如果有错误文本视图，也显示
            if (::tvError.isInitialized) {
                tvError.text = message
                tvError.visibility = View.VISIBLE
            }
        }
    }

    private fun hideError() {
        if (::tvError.isInitialized) {
            tvError.visibility = View.GONE
        }
    }

    override fun onResume() {
        super.onResume()
        player?.play()
    }

    override fun onPause() {
        super.onPause()
        player?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            player?.release()
            player = null
        } catch (e: Exception) {
            android.util.Log.e(TAG, "释放播放器失败", e)
        }
    }
}
