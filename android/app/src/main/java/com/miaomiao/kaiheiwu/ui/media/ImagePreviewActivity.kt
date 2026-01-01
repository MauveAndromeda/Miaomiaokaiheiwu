package com.miaomiao.kaiheiwu.ui.media

import android.Manifest
import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import com.miaomiao.kaiheiwu.R
import com.permissionx.guolindev.PermissionX
import java.io.OutputStream

/**
 * 图片预览Activity
 * 支持缩放、保存等功能
 */
class ImagePreviewActivity : AppCompatActivity() {

    private lateinit var imageView: ImageView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var btnSave: ImageButton
    private lateinit var btnShare: ImageButton

    private var imageUrl: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupFullscreen()
        setContentView(R.layout.activity_image_preview)

        imageUrl = intent.getStringExtra("image_url") ?: ""

        initViews()
        loadImage()
    }

    private fun setupFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        window.setBackgroundDrawableResource(android.R.color.black)
    }

    private fun initViews() {
        imageView = findViewById(R.id.image_view)
        progressBar = findViewById(R.id.progress_bar)
        btnBack = findViewById(R.id.btn_back)
        btnSave = findViewById(R.id.btn_save)
        btnShare = findViewById(R.id.btn_share)

        btnBack.setOnClickListener { finish() }

        btnSave.setOnClickListener { saveImage() }

        btnShare.setOnClickListener { shareImage() }

        // 点击图片切换控件显示
        imageView.setOnClickListener {
            toggleControls()
        }
    }

    private fun loadImage() {
        if (imageUrl.isEmpty()) {
            Toast.makeText(this, "图片地址无效", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        progressBar.visibility = View.VISIBLE

        Glide.with(this)
            .load(imageUrl)
            .into(object : CustomTarget<Drawable>() {
                override fun onResourceReady(
                    resource: Drawable,
                    transition: Transition<in Drawable>?
                ) {
                    progressBar.visibility = View.GONE
                    imageView.setImageDrawable(resource)
                }

                override fun onLoadCleared(placeholder: Drawable?) {
                    // 清理时的处理
                }

                override fun onLoadFailed(errorDrawable: Drawable?) {
                    progressBar.visibility = View.GONE
                    Toast.makeText(this@ImagePreviewActivity, "图片加载失败", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun toggleControls() {
        val isVisible = btnBack.visibility == View.VISIBLE
        val newVisibility = if (isVisible) View.GONE else View.VISIBLE

        btnBack.visibility = newVisibility
        btnSave.visibility = newVisibility
        btnShare.visibility = newVisibility
    }

    private fun saveImage() {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            listOf(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            listOf(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }

        PermissionX.init(this)
            .permissions(permissions)
            .request { allGranted, _, _ ->
                if (allGranted) {
                    doSaveImage()
                } else {
                    Toast.makeText(this, "需要存储权限才能保存图片", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun doSaveImage() {
        progressBar.visibility = View.VISIBLE

        Glide.with(this)
            .asBitmap()
            .load(imageUrl)
            .into(object : CustomTarget<Bitmap>() {
                override fun onResourceReady(
                    resource: Bitmap,
                    transition: Transition<in Bitmap>?
                ) {
                    saveBitmapToGallery(resource)
                    progressBar.visibility = View.GONE
                }

                override fun onLoadCleared(placeholder: Drawable?) {}

                override fun onLoadFailed(errorDrawable: Drawable?) {
                    progressBar.visibility = View.GONE
                    Toast.makeText(this@ImagePreviewActivity, "保存失败", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun saveBitmapToGallery(bitmap: Bitmap) {
        val filename = "IMG_${System.currentTimeMillis()}.jpg"

        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
            put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Miaomiao")
            }
        }

        val uri = contentResolver.insert(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            contentValues
        )

        uri?.let {
            val outputStream: OutputStream? = contentResolver.openOutputStream(it)
            outputStream?.use { stream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, stream)
                Toast.makeText(this, "图片已保存到相册", Toast.LENGTH_SHORT).show()
            }
        } ?: run {
            Toast.makeText(this, "保存失败", Toast.LENGTH_SHORT).show()
        }
    }

    private fun shareImage() {
        // 分享图片逻辑
        Toast.makeText(this, "分享功能开发中", Toast.LENGTH_SHORT).show()
    }
}
