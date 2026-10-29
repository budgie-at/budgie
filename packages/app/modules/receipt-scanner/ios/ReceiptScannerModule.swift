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
      guard VNDocumentCameraViewController.isSupported, self.session == nil else {
        promise.resolve([String]())
        return
      }

      let session = ReceiptScanSession { [weak self] uris in
        self?.session = nil
        promise.resolve(uris)
      }
      self.session = session
      self.present(session, remainingAttempts: ReceiptScannerModule.presentAttempts)
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

  private static let presentAttempts = 40

  private func present(_ session: ReceiptScanSession, remainingAttempts: Int) {
    guard let presenter = appContext?.utilities?.currentViewController() else {
      session.finish([])
      return
    }

    guard presenter.presentedViewController == nil,
          !presenter.isBeingPresented,
          !presenter.isBeingDismissed,
          presenter.transitionCoordinator == nil,
          presenter.viewIfLoaded?.window != nil else {
      guard remainingAttempts > 0 else {
        session.finish([])
        return
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(50)) { [weak self] in
        self?.present(session, remainingAttempts: remainingAttempts - 1)
      }
      return
    }

    presenter.present(session.camera, animated: true)
    if session.camera.presentingViewController == nil {
      session.finish([])
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

private final class ReceiptScanCameraViewController: VNDocumentCameraViewController {
  var onDismiss: (() -> Void)?

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    if isBeingDismissed || presentingViewController == nil {
      onDismiss?()
    }
  }
}

private final class ReceiptScanSession: NSObject, VNDocumentCameraViewControllerDelegate {
  let camera = ReceiptScanCameraViewController()
  private let saving = DispatchGroup()
  private var uris: [String] = []
  private var completion: (([String]) -> Void)?

  init(completion: @escaping ([String]) -> Void) {
    self.completion = completion
    super.init()
    camera.delegate = self
    camera.onDismiss = { [weak self] in
      guard let self else {
        return
      }
      self.saving.notify(queue: .main) {
        self.finish(self.uris)
      }
    }
  }

  func finish(_ uris: [String]) {
    guard let completion else {
      return
    }
    self.completion = nil
    completion(uris)
  }

  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
    saving.enter()
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
        self.uris = uris
        self.saving.leave()
      }
    }
    controller.dismiss(animated: true)
  }

  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    controller.dismiss(animated: true)
  }

  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
    controller.dismiss(animated: true)
  }
}
