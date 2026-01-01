package com.miaomiao.kaiheiwu

import android.app.Application
import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import com.blankj.utilcode.util.Utils
import timber.log.Timber

class MiaomiaoApplication : Application() {

    companion object {
        lateinit var instance: MiaomiaoApplication
            private set

        fun getContext(): Context = instance.applicationContext
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        initTimber()
        initUtils()
        initNightMode()
    }

    private fun initTimber() {
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
    }

    private fun initUtils() {
        Utils.init(this)
    }

    private fun initNightMode() {
        // 跟随系统设置
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
    }
}
