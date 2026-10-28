import ExpoModulesCore
import ImageIO
import UIKit
import Vision
import VisionKit

public final class ReceiptScannerModule: Module {
  private var session: ReceiptScanSession?

  public func definition() -> ModuleDefinition {
    Name("ReceiptScanner")

    AsyncFunction("scan") { (promise: Promise) in
      guard VNDocumentCameraViewController.isSupported,
            self.session == nil,
            let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.resolve([String]())
        return
      }

      let session = ReceiptScanSession { [weak self] uris in
        self?.session = nil
        promise.resolve(uris)
      }
      let camera = VNDocumentCameraViewController()
      camera.delegate = session
      self.session = session
      presenter.present(camera, animated: true)
    }.runOnQueue(.main)

    AsyncFunction("recognize") { (uri: URL) -> [[String: Any]] in
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true
      request.automaticallyDetectsLanguage = true
      try VNImageRequestHandler(url: uri, orientation: ReceiptScannerModule.orientation(of: uri)).perform([request])

      return (request.results ?? []).compactMap { observation in
        guard let candidate = observation.topCandidates(1).first else {
          return nil
        }
        let box = observation.boundingBox

        return [
          "text": candidate.string,
          "x": Double(box.minX),
          "y": Double(1 - box.maxY),
          "height": Double(box.height)
        ]
      }
    }
  }

  private static func orientation(of uri: URL) -> CGImagePropertyOrientation {
    guard let source = CGImageSourceCreateWithURL(uri as CFURL, nil),
          let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
          let rawValue = properties[kCGImagePropertyOrientation] as? UInt32,
          let orientation = CGImagePropertyOrientation(rawValue: rawValue) else {
      return .up
    }

    return orientation
  }
}

private final class ReceiptScanSession: NSObject, VNDocumentCameraViewControllerDelegate {
  private let completion: ([String]) -> Void

  init(completion: @escaping ([String]) -> Void) {
    self.completion = completion
  }

  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
    controller.dismiss(animated: true)
    DispatchQueue.global(qos: .userInitiated).async {
      let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("ReceiptScans", isDirectory: true)
      try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      let uris = (0..<scan.pageCount).compactMap { index -> String? in
        autoreleasepool {
          let file = directory.appendingPathComponent("\(UUID().uuidString).jpg")
          guard let data = scan.imageOfPage(at: index).jpegData(compressionQuality: 0.8),
                (try? data.write(to: file)) != nil else {
            return nil
          }

          return file.absoluteString
        }
      }
      DispatchQueue.main.async {
        self.completion(uris)
      }
    }
  }

  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    controller.dismiss(animated: true)
    completion([])
  }

  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
    controller.dismiss(animated: true)
    completion([])
  }
}
