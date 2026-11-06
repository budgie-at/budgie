import CloudKit
import ExpoModulesCore
import Foundation
import UIKit

public final class ICloudModule: Module {
  private let hostsLock = NSLock()
  private var hosts: [ICloudSyncScope: ICloudSyncEngineHost] = [:]

  private func host(_ rawScope: String) throws -> ICloudSyncEngineHost {
    let scope = try ICloudDatabase.scope(rawScope)
    guard let host = hostsLock.withLock({ hosts[scope] }) else {
      throw ICloudDatabase.error("SYNC_NOT_STARTED", "Sync engine for \(rawScope) is not started")
    }
    return host
  }

  public func definition() -> ModuleDefinition {
    Name("ICloud")

    Events(
      "onStateSerialization",
      "onFetchedChanges",
      "onSentChanges",
      "onAccountChange",
      "onZoneChange",
      "onWillFetchChanges",
      "onDidFetchChanges",
      "onShareAccepted",
      "onShareChanged"
    )

    OnStartObserving("onShareAccepted") { [weak self] in
      ICloudShareInbox.shared.attach { body in self?.sendEvent("onShareAccepted", body) }
    }

    OnStopObserving("onShareAccepted") {
      ICloudShareInbox.shared.detach()
    }

    AsyncFunction("startSync") { [weak self] (rawScope: String, stateSerialization: String?) throws in
      guard let self else { return }
      let scope = try ICloudDatabase.scope(rawScope)
      let host = ICloudSyncEngineHost(scope: scope) { [weak self] name, body in self?.sendEvent(name, body) }
      try host.start(stateSerialization: stateSerialization)
      let previous = hostsLock.withLock { () -> ICloudSyncEngineHost? in
        let existing = hosts[scope]
        hosts[scope] = host
        return existing
      }
      previous?.stop()
      DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
    }

    AsyncFunction("stopSync") { [weak self] (rawScope: String) throws in
      guard let self else { return }
      let scope = try ICloudDatabase.scope(rawScope)
      hostsLock.withLock { hosts.removeValue(forKey: scope) }?.stop()
    }

    AsyncFunction("syncNow") { [weak self] (rawScope: String) async throws in
      guard let self else { return }
      do {
        try await host(rawScope).syncNow()
      } catch {
        throw ICloudDatabase.syncError(error)
      }
    }

    AsyncFunction("addPendingSaves") { [weak self] (rawScope: String, records: [ICloudRecordPayload]) throws in
      try self?.host(rawScope).addPendingSaves(records)
    }

    AsyncFunction("addPendingDeletes") { [weak self] (rawScope: String, recordIds: [ICloudRecordId]) throws in
      try self?.host(rawScope).addPendingDeletes(recordIds.map(\.recordID))
    }

    AsyncFunction("confirmFetchedBatch") { [weak self] (rawScope: String, batchId: String) throws in
      try self?.host(rawScope).confirm(batchId: batchId)
    }

    AsyncFunction("fetchRecord") { (rawScope: String, zoneName: String, recordName: String) async throws -> [String: Any]? in
      let scope = try ICloudDatabase.scope(rawScope)
      let database = ICloudDatabase.database(for: scope)
      do {
        let zoneID = try await ICloudInventory.resolveZoneID(database: database, scope: scope, zoneName: zoneName)
        return ICloudRecordCodec.dictionary(from: try await database.record(for: CKRecord.ID(recordName: recordName, zoneID: zoneID)))
      } catch {
        let code = ICloudDatabase.syncErrorCode(error)
        if code == "UNKNOWN_ITEM" || code == "ZONE_NOT_FOUND" {
          return nil
        }
        throw ICloudDatabase.syncError(error)
      }
    }

    AsyncFunction("fetchZoneInventory") { (rawScope: String, zoneName: String) async throws -> [[String: String]] in
      do {
        return try await ICloudInventory.fetch(scope: try ICloudDatabase.scope(rawScope), zoneName: zoneName)
      } catch {
        throw ICloudDatabase.syncError(error)
      }
    }

    AsyncFunction("ensureZone") { (rawScope: String, zoneName: String) async throws in
      let scope = try ICloudDatabase.scope(rawScope)
      guard scope == .privateScope else {
        throw ICloudDatabase.error("PERMISSION_FAILURE", "Zones can only be created in the private database")
      }
      do {
        _ = try await ICloudDatabase.database.save(CKRecordZone(zoneName: zoneName))
      } catch {
        throw ICloudDatabase.syncError(error)
      }
    }

    AsyncFunction("deleteZone") { (rawScope: String, zoneName: String) async throws in
      let scope = try ICloudDatabase.scope(rawScope)
      guard scope == .privateScope else {
        throw ICloudDatabase.error("PERMISSION_FAILURE", "Zones can only be deleted from the private database; use leaveShare for shared zones")
      }
      do {
        _ = try await ICloudDatabase.database.deleteRecordZone(withID: ICloudDatabase.zoneID(zoneName: zoneName, ownerName: ICloudDatabase.defaultOwnerName))
      } catch {
        throw ICloudDatabase.syncError(error)
      }
    }

    AsyncFunction("createHouseholdShare") { [weak self] (zoneName: String) async throws in
      try await ICloudSharing.present(zoneName: zoneName) { body in self?.sendEvent("onShareChanged", body) }
    }

    AsyncFunction("getShareParticipants") { (zoneName: String) async throws -> [[String: Any]] in
      try await ICloudSharing.participants(zoneName: zoneName)
    }

    AsyncFunction("stopSharing") { (zoneName: String) async throws in
      try await ICloudSharing.stopSharing(zoneName: zoneName)
    }

    AsyncFunction("leaveShare") { (zoneName: String) async throws in
      try await ICloudSharing.leave(zoneName: zoneName)
    }

    AsyncFunction("removeParticipant") { (zoneName: String, participantId: String) async throws in
      try await ICloudSharing.removeParticipant(zoneName: zoneName, participantId: participantId)
    }

    AsyncFunction("getAccountStatus") { () async -> [String: Any] in
      let status = await ICloudDatabase.container.accountStatus()
      let name = try? await ICloudDatabase.container.userRecordID().recordName
      return ["status": ICloudDatabase.accountStatusName(status), "userRecordName": name as Any? ?? NSNull()]
    }

    AsyncFunction("saveBackup") { (fileUri: String, fields: [String: Any], encryptedFields: [String: Any]) async throws -> String in
      let url = URL(string: fileUri) ?? URL(fileURLWithPath: fileUri)
      let record = CKRecord(recordType: "Backup")
      for (key, value) in fields {
        if key == "createdAt" {
          guard let createdAt = ICloudDatabase.date(from: value) else {
            throw ICloudDatabase.error("UNKNOWN", "Backup createdAt is not a valid date")
          }
          record[key] = createdAt as NSDate
        } else {
          record[key] = value as? CKRecordValue
        }
      }
      encryptedFields.forEach { record.encryptedValues[$0.key] = $0.value as? CKRecordValue }
      record["archive"] = CKAsset(fileURL: url)
      let operation = CKModifyRecordsOperation(recordsToSave: [record])
      operation.configuration.isLongLived = true
      return try await ICloudDatabase.modify(operation, record: record)
    }

    AsyncFunction("listBackups") { () async throws -> [[String: Any]] in
      let query = CKQuery(recordType: "Backup", predicate: NSPredicate(value: true))
      query.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
      let (records, _) = try await ICloudDatabase.database.records(matching: query)
      return records.compactMap { _, result in
        guard case let .success(record) = result else { return nil }
        return ["recordName": record.recordID.recordName, "createdAt": (record["createdAt"] as? Date)?.ISO8601Format() ?? "", "installId": record["installId"] as? String ?? "", "deviceName": record["deviceName"] as? String ?? "", "deviceModel": record["deviceModel"] as? String ?? "", "appVersion": record["appVersion"] as? String ?? "", "schemaVersion": record["schemaVersion"] as? Int ?? 0]
      }
    }

    AsyncFunction("downloadBackup") { (recordName: String) async throws -> [String: String] in
      let record = try await ICloudDatabase.database.record(for: CKRecord.ID(recordName: recordName))
      guard let asset = record["archive"] as? CKAsset, let source = asset.fileURL else {
        throw ICloudDatabase.error("UNKNOWN", "Backup archive is missing")
      }
      let destination = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
      try FileManager.default.copyItem(at: source, to: destination)
      guard let key = record.encryptedValues["backupKey"] as? String else {
        throw ICloudDatabase.error("BACKUP_KEY_UNAVAILABLE", "Backup key is unavailable")
      }
      return ["fileUri": destination.absoluteString, "backupKey": key]
    }

    AsyncFunction("deleteBackups") { (recordNames: [String]) async throws in
      let ids = recordNames.map { CKRecord.ID(recordName: $0) }
      try await ICloudDatabase.database.modifyRecords(saving: [], deleting: ids)
    }
  }
}
