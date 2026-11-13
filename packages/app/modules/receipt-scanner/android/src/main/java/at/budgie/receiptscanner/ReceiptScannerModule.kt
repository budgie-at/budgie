package at.budgie.receiptscanner

import android.app.Activity
import android.content.Context
import android.net.Uri
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.UUID

class ReceiptScannerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var pendingScan: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ReceiptScanner")

    AsyncFunction("scan") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null || pendingScan != null) {
        promise.resolve(emptyList<String>())
        return@AsyncFunction
      }

      pendingScan = promise
      GmsDocumentScanning.getClient(scannerOptions)
        .getStartScanIntent(activity)
        .addOnSuccessListener { intentSender ->
          activity.startIntentSenderForResult(intentSender, SCAN_REQUEST_CODE, null, 0, 0, 0)
        }
        .addOnFailureListener {
          finishScan(emptyList())
        }
    }

    AsyncFunction("recognize") { uri: String ->
      val image = InputImage.fromFilePath(context, Uri.parse(uri))
      val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

      try {
        val text = Tasks.await(recognizer.process(image))
        val isRotated = image.rotationDegrees % 180 != 0
        val width = (if (isRotated) image.height else image.width).toDouble()
        val height = (if (isRotated) image.width else image.height).toDouble()

        text.textBlocks.flatMap { block -> block.lines }.mapNotNull { line ->
          val box = line.boundingBox ?: return@mapNotNull null

          mapOf(
            "text" to line.text,
            "x" to box.left / width,
            "y" to box.top / height,
            "height" to box.height() / height
          )
        }
      } finally {
        recognizer.close()
      }
    }

    OnActivityResult { _, (requestCode, resultCode, data) ->
      if (requestCode != SCAN_REQUEST_CODE || pendingScan == null) {
        return@OnActivityResult
      }

      val pages = if (resultCode == Activity.RESULT_OK) {
        GmsDocumentScanningResult.fromActivityResultIntent(data)?.pages.orEmpty()
      } else {
        emptyList()
      }

      finishScan(pages.mapNotNull { page -> copyToCache(page.imageUri) })
    }
  }

  private fun finishScan(uris: List<String>) {
    val promise = pendingScan ?: return
    pendingScan = null
    promise.resolve(uris)
  }

  private fun copyToCache(source: Uri): String? =
    runCatching {
      val directory = File(context.cacheDir, SCANS_DIRECTORY).apply { mkdirs() }
      val target = File(directory, "${UUID.randomUUID()}.jpg")
      context.contentResolver.openInputStream(source).use { input ->
        requireNotNull(input)
        target.outputStream().use { output -> input.copyTo(output) }
      }

      Uri.fromFile(target).toString()
    }.getOrNull()

  companion object {
    private const val SCAN_REQUEST_CODE = 7341
    private const val SCANS_DIRECTORY = "ReceiptScans"

    private val scannerOptions = GmsDocumentScannerOptions.Builder()
      .setGalleryImportAllowed(false)
      .setPageLimit(1)
      .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
      .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
      .build()
  }
}
