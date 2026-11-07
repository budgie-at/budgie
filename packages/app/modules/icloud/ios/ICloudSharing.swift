import CloudKit
import Foundation
import UIKit

private struct ICloudLocatedShare {
  let database: CKDatabase
  let share: CKShare
  let isShared: Bool
}

enum ICloudSharing {
  private static let shareTitle = "Budgie family"
  @MainActor private static var activeDelegate: ICloudSharingDelegate?

  static func present(zoneName: String, notify: @escaping @Sendable ([String: Any]) -> Void) async throws {
    let zoneID = ICloudDatabase.zoneID(zoneName: zoneName, ownerName: ICloudDatabase.defaultOwnerName)
    let database = ICloudDatabase.database
    let container = ICloudDatabase.container
    do {
      _ = try await database.save(CKRecordZone(zoneID: zoneID))
      let existing = try await fetchShare(database: database, zoneID: zoneID)
      try await MainActor.run {
        let controller: UICloudSharingController
        if let existing {
          controller = UICloudSharingController(share: existing, container: container)
        } else {
          controller = UICloudSharingController { _, completion in
            Task {
              do {
                let share = CKShare(recordZoneID: zoneID)
                share.publicPermission = .none
                share[CKShare.SystemFieldKey.title] = shareTitle
                let (saveResults, _) = try await database.modifyRecords(saving: [share], deleting: [])
                guard let result = saveResults[share.recordID], case let .success(saved) = result, let savedShare = saved as? CKShare else {
                  completion(nil, nil, ICloudDatabase.error("UNKNOWN", "Share was not saved"))
                  return
                }
                completion(savedShare, container, nil)
              } catch {
                completion(nil, nil, error)
              }
            }
          }
        }
        let delegate = ICloudSharingDelegate(zoneName: zoneName, notify: notify)
        activeDelegate = delegate
        controller.delegate = delegate
        controller.availablePermissions = [.allowReadWrite, .allowPrivate]
        guard let presenter = topViewController() else {
          throw ICloudDatabase.error("UNKNOWN", "No view controller to present the sharing sheet")
        }
        if let popover = controller.popoverPresentationController {
          popover.sourceView = presenter.view
          popover.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 0, height: 0)
          popover.permittedArrowDirections = []
        }
        presenter.present(controller, animated: true)
      }
    } catch {
      throw ICloudDatabase.syncError(error)
    }
  }

  static func participants(zoneName: String) async throws -> [[String: Any]] {
    guard let located = try await locateShare(zoneName: zoneName) else { return [] }
    return located.share.participants.map { describe($0, in: located.share) }
  }

  static func findOwnedHousehold(zoneName: String) async throws -> [String: Any]? {
    do {
      let zones = try await ICloudDatabase.database.allRecordZones()
      guard let zone = zones.first(where: { $0.zoneID.zoneName == zoneName }),
            let share = try await fetchShare(database: ICloudDatabase.database, zoneID: zone.zoneID) else { return nil }
      return ["zoneName": zone.zoneID.zoneName, "shareRecordName": share.recordID.recordName]
    } catch {
      throw ICloudDatabase.syncError(error)
    }
  }

  static func findJoinedHousehold(zoneName: String) async throws -> [String: Any]? {
    do {
      let zones = try await ICloudDatabase.sharedDatabase.allRecordZones()
      guard let zone = zones.first(where: { $0.zoneID.zoneName == zoneName }) else { return nil }
      var body: [String: Any] = ["zoneName": zone.zoneID.zoneName, "ownerName": zone.zoneID.ownerName]
      if let share = try await fetchShare(database: ICloudDatabase.sharedDatabase, zoneID: zone.zoneID),
         let nameComponents = share.owner.userIdentity.nameComponents {
        body["ownerDisplayName"] = PersonNameComponentsFormatter().string(from: nameComponents)
      }
      return body
    } catch {
      throw ICloudDatabase.syncError(error)
    }
  }

  static func stopSharing(zoneName: String) async throws {
    let zoneID = ICloudDatabase.zoneID(zoneName: zoneName, ownerName: ICloudDatabase.defaultOwnerName)
    do {
      guard let share = try await fetchShare(database: ICloudDatabase.database, zoneID: zoneID) else { return }
      _ = try await ICloudDatabase.database.modifyRecords(saving: [], deleting: [share.recordID])
    } catch {
      throw ICloudDatabase.syncError(error)
    }
  }

  static func leave(zoneName: String) async throws {
    do {
      guard let located = try await locateShare(zoneName: zoneName), located.isShared else {
        throw ICloudDatabase.error("ZONE_NOT_FOUND", "Shared zone \(zoneName) was not found")
      }
      _ = try await located.database.modifyRecords(saving: [], deleting: [located.share.recordID])
    } catch {
      throw ICloudDatabase.syncError(error)
    }
  }

  static func removeParticipant(zoneName: String, participantId: String) async throws {
    let zoneID = ICloudDatabase.zoneID(zoneName: zoneName, ownerName: ICloudDatabase.defaultOwnerName)
    do {
      guard let share = try await fetchShare(database: ICloudDatabase.database, zoneID: zoneID) else {
        throw ICloudDatabase.error("ZONE_NOT_FOUND", "Share for zone \(zoneName) was not found")
      }
      guard let participant = share.participants.first(where: { self.participantId($0) == participantId && $0.role != .owner }) else {
        throw ICloudDatabase.error("UNKNOWN", "Participant was not found")
      }
      share.removeParticipant(participant)
      _ = try await ICloudDatabase.database.modifyRecords(saving: [share], deleting: [])
    } catch {
      throw ICloudDatabase.syncError(error)
    }
  }

  private static func fetchShare(database: CKDatabase, zoneID: CKRecordZone.ID) async throws -> CKShare? {
    do {
      return try await database.record(for: CKRecord.ID(recordName: CKRecordNameZoneWideShare, zoneID: zoneID)) as? CKShare
    } catch let error as CKError where error.code == .unknownItem || error.code == .zoneNotFound {
      return nil
    }
  }

  private static func locateShare(zoneName: String) async throws -> ICloudLocatedShare? {
    do {
      let privateZoneID = ICloudDatabase.zoneID(zoneName: zoneName, ownerName: ICloudDatabase.defaultOwnerName)
      if let share = try await fetchShare(database: ICloudDatabase.database, zoneID: privateZoneID) {
        return ICloudLocatedShare(database: ICloudDatabase.database, share: share, isShared: false)
      }
      let sharedZones = try await ICloudDatabase.sharedDatabase.allRecordZones()
      guard let zone = sharedZones.first(where: { $0.zoneID.zoneName == zoneName }),
            let share = try await fetchShare(database: ICloudDatabase.sharedDatabase, zoneID: zone.zoneID) else { return nil }
      return ICloudLocatedShare(database: ICloudDatabase.sharedDatabase, share: share, isShared: true)
    } catch {
      throw ICloudDatabase.syncError(error)
    }
  }

  private static func participantId(_ participant: CKShare.Participant) -> String {
    participant.userIdentity.userRecordID?.recordName
      ?? participant.userIdentity.lookupInfo?.emailAddress
      ?? participant.userIdentity.lookupInfo?.phoneNumber
      ?? ""
  }

  private static func describe(_ participant: CKShare.Participant, in share: CKShare) -> [String: Any] {
    let id = participantId(participant)
    let displayName = participant.userIdentity.nameComponents.map { PersonNameComponentsFormatter().string(from: $0) }
    return [
      "participantId": id,
      "displayName": displayName as Any? ?? NSNull(),
      "role": roleName(participant.role),
      "acceptanceStatus": acceptanceName(participant.acceptanceStatus),
      "permission": permissionName(participant.permission),
      "isCurrentUser": !id.isEmpty && id == share.currentUserParticipant.map(participantId)
    ]
  }

  private static func roleName(_ role: CKShare.ParticipantRole) -> String {
    switch role {
    case .owner: return "OWNER"
    case .privateUser: return "PRIVATE_USER"
    case .publicUser: return "PUBLIC_USER"
    case .unknown: return "UNKNOWN"
    @unknown default: return "UNKNOWN"
    }
  }

  private static func acceptanceName(_ status: CKShare.ParticipantAcceptanceStatus) -> String {
    switch status {
    case .pending: return "PENDING"
    case .accepted: return "ACCEPTED"
    case .removed: return "REMOVED"
    case .unknown: return "UNKNOWN"
    @unknown default: return "UNKNOWN"
    }
  }

  private static func permissionName(_ permission: CKShare.ParticipantPermission) -> String {
    switch permission {
    case .none: return "NONE"
    case .readOnly: return "READ_ONLY"
    case .readWrite: return "READ_WRITE"
    case .unknown: return "UNKNOWN"
    @unknown default: return "UNKNOWN"
    }
  }

  @MainActor private static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    var top = scene?.windows.first(where: \.isKeyWindow)?.rootViewController
    while let presented = top?.presentedViewController {
      top = presented
    }
    return top
  }
}

final class ICloudSharingDelegate: NSObject, UICloudSharingControllerDelegate {
  private let zoneName: String
  private let notify: @Sendable ([String: Any]) -> Void

  init(zoneName: String, notify: @escaping @Sendable ([String: Any]) -> Void) {
    self.zoneName = zoneName
    self.notify = notify
  }

  func itemTitle(for csc: UICloudSharingController) -> String? {
    "Budgie family"
  }

  func cloudSharingControllerDidSaveShare(_ csc: UICloudSharingController) {
    notify(["zoneName": zoneName, "change": "SAVED"])
  }

  func cloudSharingControllerDidStopSharing(_ csc: UICloudSharingController) {
    notify(["zoneName": zoneName, "change": "STOPPED"])
  }

  func cloudSharingController(_ csc: UICloudSharingController, failedToSaveShareWithError error: Error) {
    notify(["zoneName": zoneName, "change": "FAILED"].merging(ICloudDatabase.failure(error)) { first, _ in first })
  }
}

public final class ICloudShareInbox: @unchecked Sendable {
  public static let shared = ICloudShareInbox()

  private let lock = NSLock()
  private var handler: (@Sendable ([String: Any]) -> Void)?
  private var buffered: [[String: Any]] = []

  public func receive(_ metadata: CKShare.Metadata) {
    Task {
      deliver(describe(metadata).merging(["outcome": "JOINING"]) { first, _ in first })
      deliver(await accept(metadata))
    }
  }

  func attach(_ newHandler: @escaping @Sendable ([String: Any]) -> Void) {
    let backlog: [[String: Any]] = lock.withLock {
      handler = newHandler
      let pending = buffered
      buffered = []
      return pending
    }
    backlog.forEach(newHandler)
  }

  func detach() {
    lock.withLock { handler = nil }
  }

  private func deliver(_ body: [String: Any]) {
    let current: (@Sendable ([String: Any]) -> Void)? = lock.withLock {
      if handler == nil {
        buffered.append(body)
      }
      return handler
    }
    current?(body)
  }

  private func describe(_ metadata: CKShare.Metadata) -> [String: Any] {
    let zoneID = metadata.share.recordID.zoneID
    var body: [String: Any] = ["zoneName": zoneID.zoneName, "ownerName": zoneID.ownerName]
    if let nameComponents = metadata.ownerIdentity.nameComponents {
      body["ownerDisplayName"] = PersonNameComponentsFormatter().string(from: nameComponents)
    }
    return body
  }

  private func accept(_ metadata: CKShare.Metadata) async -> [String: Any] {
    var body = describe(metadata)
    let container = CKContainer(identifier: metadata.containerIdentifier)
    do {
      try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
        let operation = CKAcceptSharesOperation(shareMetadatas: [metadata])
        operation.qualityOfService = .userInitiated
        operation.acceptSharesResultBlock = { result in
          switch result {
          case .success: continuation.resume()
          case let .failure(error): continuation.resume(throwing: error)
          }
        }
        container.add(operation)
      }
      body["outcome"] = "ACCEPTED"
    } catch {
      body["outcome"] = "FAILED"
      body.merge(ICloudDatabase.failure(error)) { first, _ in first }
    }
    return body
  }
}
