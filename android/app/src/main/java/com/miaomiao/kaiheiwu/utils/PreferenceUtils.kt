package com.miaomiao.kaiheiwu.utils

import android.content.Context
import android.content.SharedPreferences

/**
 * SharedPreferences 工具类
 */
object PreferenceUtils {

    private const val PREF_NAME = "miaomiao_prefs"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun saveString(context: Context, key: String, value: String) {
        getPrefs(context).edit().putString(key, value).apply()
    }

    fun getString(context: Context, key: String, defaultValue: String = ""): String {
        return getPrefs(context).getString(key, defaultValue) ?: defaultValue
    }

    fun saveInt(context: Context, key: String, value: Int) {
        getPrefs(context).edit().putInt(key, value).apply()
    }

    fun getInt(context: Context, key: String, defaultValue: Int = 0): Int {
        return getPrefs(context).getInt(key, defaultValue)
    }

    fun saveLong(context: Context, key: String, value: Long) {
        getPrefs(context).edit().putLong(key, value).apply()
    }

    fun getLong(context: Context, key: String, defaultValue: Long = 0L): Long {
        return getPrefs(context).getLong(key, defaultValue)
    }

    fun saveBoolean(context: Context, key: String, value: Boolean) {
        getPrefs(context).edit().putBoolean(key, value).apply()
    }

    fun getBoolean(context: Context, key: String, defaultValue: Boolean = false): Boolean {
        return getPrefs(context).getBoolean(key, defaultValue)
    }

    fun saveFloat(context: Context, key: String, value: Float) {
        getPrefs(context).edit().putFloat(key, value).apply()
    }

    fun getFloat(context: Context, key: String, defaultValue: Float = 0f): Float {
        return getPrefs(context).getFloat(key, defaultValue)
    }

    fun remove(context: Context, key: String) {
        getPrefs(context).edit().remove(key).apply()
    }

    fun clear(context: Context) {
        getPrefs(context).edit().clear().apply()
    }

    fun contains(context: Context, key: String): Boolean {
        return getPrefs(context).contains(key)
    }
}
