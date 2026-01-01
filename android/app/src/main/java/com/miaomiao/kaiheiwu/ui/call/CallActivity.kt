package com.miaomiao.kaiheiwu.ui.call

import android.Manifest
import android.media.AudioManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.miaomiao.kaiheiwu.R
import com.miaomiao.kaiheiwu.service.CallService
import com.permissionx.guolindev.PermissionX

/**
 * 语音/视频通话Activity
 */
class CallActivity : AppCompatActivity() {

    private lateinit var tvCallerName: TextView
    private lateinit var tvCallStatus: TextView
    private lateinit var tvCallDuration: TextView
    private lateinit var btnMute: ImageButton
    private lateinit var btnSpeaker: ImageButton
    private lateinit var btnVideo: ImageButton
    private lateinit var btnHangup: ImageButton
    private lateinit var btnAccept: ImageButton

    private var callId: String = ""
    private var callerName: String = ""
    private var callerAvatar: String = ""
    private var isVideoCall: Boolean = false
    private var isIncoming: Boolean = false
    private var isCallActive: Boolean = false
    private var isMuted: Boolean = false
    private var isSpeakerOn: Boolean = false

    private var callDuration: Long = 0
    private val handler = Handler(Looper.getMainLooper())
    private val durationRunnable = object : Runnable {
        override fun run() {
            if (isCallActive) {
                callDuration++
                updateDurationDisplay()
                handler.postDelayed(this, 1000)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupFullscreen()
        setContentView(R.layout.activity_call)

        // 获取传入参数
        callId = intent.getStringExtra("call_id") ?: ""
        callerName = intent.getStringExtra("caller_name") ?: "未知用户"
        callerAvatar = intent.getStringExtra("caller_avatar") ?: ""
        isVideoCall = intent.getBooleanExtra("is_video", false)
        isIncoming = intent.getBooleanExtra("is_incoming", false)

        initViews()
        checkPermissions()
    }

    private fun setupFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        // 保持屏幕常亮并显示在锁屏上
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )
    }

    private fun initViews() {
        tvCallerName = findViewById(R.id.tv_caller_name)
        tvCallStatus = findViewById(R.id.tv_call_status)
        tvCallDuration = findViewById(R.id.tv_call_duration)
        btnMute = findViewById(R.id.btn_mute)
        btnSpeaker = findViewById(R.id.btn_speaker)
        btnVideo = findViewById(R.id.btn_video)
        btnHangup = findViewById(R.id.btn_hangup)
        btnAccept = findViewById(R.id.btn_accept)

        tvCallerName.text = callerName

        // 设置来电/去电状态
        if (isIncoming) {
            tvCallStatus.text = if (isVideoCall) "视频来电..." else "语音来电..."
            btnAccept.visibility = View.VISIBLE
        } else {
            tvCallStatus.text = "正在呼叫..."
            btnAccept.visibility = View.GONE
            // 模拟接通
            handler.postDelayed({
                onCallConnected()
            }, 2000)
        }

        // 视频通话按钮
        btnVideo.visibility = if (isVideoCall) View.VISIBLE else View.GONE

        setupClickListeners()
    }

    private fun setupClickListeners() {
        btnMute.setOnClickListener {
            toggleMute()
        }

        btnSpeaker.setOnClickListener {
            toggleSpeaker()
        }

        btnVideo.setOnClickListener {
            toggleVideo()
        }

        btnHangup.setOnClickListener {
            endCall()
        }

        btnAccept.setOnClickListener {
            acceptCall()
        }
    }

    private fun checkPermissions() {
        val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (isVideoCall) {
            permissions.add(Manifest.permission.CAMERA)
        }

        PermissionX.init(this)
            .permissions(permissions)
            .request { allGranted, _, _ ->
                if (!allGranted) {
                    endCall()
                }
            }
    }

    private fun acceptCall() {
        btnAccept.visibility = View.GONE
        onCallConnected()
    }

    private fun onCallConnected() {
        isCallActive = true
        tvCallStatus.visibility = View.GONE
        tvCallDuration.visibility = View.VISIBLE
        handler.post(durationRunnable)
    }

    private fun toggleMute() {
        isMuted = !isMuted
        btnMute.setImageResource(
            if (isMuted) R.drawable.ic_mic_off else R.drawable.ic_mic
        )
        btnMute.alpha = if (isMuted) 0.5f else 1f
    }

    private fun toggleSpeaker() {
        isSpeakerOn = !isSpeakerOn
        btnSpeaker.setImageResource(
            if (isSpeakerOn) R.drawable.ic_speaker_on else R.drawable.ic_speaker_off
        )

        val audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        audioManager.isSpeakerphoneOn = isSpeakerOn
    }

    private fun toggleVideo() {
        // 切换视频开关
    }

    private fun endCall() {
        isCallActive = false
        handler.removeCallbacks(durationRunnable)
        finish()
    }

    private fun updateDurationDisplay() {
        val minutes = callDuration / 60
        val seconds = callDuration % 60
        tvCallDuration.text = String.format("%02d:%02d", minutes, seconds)
    }

    override fun onDestroy() {
        handler.removeCallbacks(durationRunnable)
        super.onDestroy()
    }
}
