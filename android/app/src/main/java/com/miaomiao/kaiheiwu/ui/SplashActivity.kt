package com.miaomiao.kaiheiwu.ui

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.miaomiao.kaiheiwu.MainActivity
import com.miaomiao.kaiheiwu.R

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    private var keepSplash = true
    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        // 保持启动画面
        splashScreen.setKeepOnScreenCondition { keepSplash }

        setContentView(R.layout.activity_splash)

        // 设置全屏
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )

        initViews()
        startAnimation()
    }

    private fun initViews() {
        // 版本号
        findViewById<TextView>(R.id.tv_version)?.text = "v${packageManager.getPackageInfo(packageName, 0).versionName}"
    }

    private fun startAnimation() {
        // 渐入动画
        val fadeIn = AlphaAnimation(0f, 1f).apply {
            duration = 500
            fillAfter = true
        }

        findViewById<ImageView>(R.id.iv_logo)?.startAnimation(fadeIn)
        findViewById<TextView>(R.id.tv_slogan)?.startAnimation(fadeIn)

        fadeIn.setAnimationListener(object : Animation.AnimationListener {
            override fun onAnimationStart(animation: Animation?) {}
            override fun onAnimationRepeat(animation: Animation?) {}
            override fun onAnimationEnd(animation: Animation?) {
                handler.postDelayed({
                    keepSplash = false
                    navigateToMain()
                }, 1500)
            }
        })
    }

    private fun navigateToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
    }
}
