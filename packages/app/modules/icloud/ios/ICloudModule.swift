import CloudKit
import ExpoModulesCore
import Foundation

public final class ICloudModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloud")

    AsyncFunction("getAccountStatus") { () async -> [String: Any] in
      let status = await ICloudDatabase.container.accountStatus()
      let name = try? await ICloudDatabase.container.userRecordID().recordName
      return ["status": ICloudDatabase.accountStatusName(status), "userRecordName": name as Any? ?? NSNull()]
    }

    AsyncFunction("saveBackup") { (fileUri: String, fields: [String: Any], encryptedFields: [String: Any]) async throws -> String in
      let url = URL(string: fileUri) ?? URL(fileURLWithPath: fileUri)
      let record = CKRecord(recordType: "Backup")
      fields.forEach { record[$0.key] = $0.value as? CKRecordValue }
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
