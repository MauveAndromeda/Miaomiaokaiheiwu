package com.miaomiao.kaiheiwu.ui.video

import android.content.pm.ActivityInfo
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.miaomiao.kaiheiwu.R

@UnstableApi
class VideoPlayerActivity : AppCompatActivity() {

    private lateinit var player: ExoPlayer
    private lateinit var playerView: PlayerView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var tvTitle: TextView

    private var videoUrl: String = ""
    private var videoTitle: String = ""

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

        // 初始化播放器
        initPlayer()
    }

    private fun setupFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun initViews() {
        playerView = findViewById(R.id.player_view)
        progressBar = findViewById(R.id.progress_bar)
        btnBack = findViewById(R.id.btn_back)
        tvTitle = findViewById(R.id.tv_title)

        tvTitle.text = videoTitle

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

    private fun initPlayer() {
        player = ExoPlayer.Builder(this)
            .build()
            .apply {
                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(state: Int) {
                        when (state) {
                            Player.STATE_BUFFERING -> {
                                progressBar.visibility = View.VISIBLE
                            }
                            Player.STATE_READY -> {
                                progressBar.visibility = View.GONE
                            }
                            Player.STATE_ENDED -> {
                                // 播放结束
                            }
                            Player.STATE_IDLE -> {
                                // 空闲状态
                            }
                        }
                    }
                })
            }

        playerView.player = player

        if (videoUrl.isNotEmpty()) {
            val mediaItem = MediaItem.fromUri(videoUrl)
            player.setMediaItem(mediaItem)
            player.prepare()
            player.playWhenReady = true
        }
    }

    override fun onResume() {
        super.onResume()
        player.play()
    }

    override fun onPause() {
        super.onPause()
        player.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player.release()
    }
}
