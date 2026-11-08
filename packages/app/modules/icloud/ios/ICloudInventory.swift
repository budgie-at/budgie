import CloudKit
import Foundation

enum ICloudInventory {
  private final class Page: @unchecked Sendable {
    var records: [String: String] = [:]
    var deletedNames: [String] = []
    var token: CKServerChangeToken?
    var isMoreComing = false
    var failure: Error?
  }

  static func fetch(scope: ICloudSyncScope, zoneName: String) async throws -> [[String: String]] {
    let database = ICloudDatabase.database(for: scope)
    let zoneID = try await resolveZoneID(database: database, scope: scope, zoneName: zoneName)
    var entries: [String: String] = [:]
    var token: CKServerChangeToken?
    var isMoreComing = true
    while isMoreComing {
      let page = try await fetchPage(database: database, zoneID: zoneID, token: token)
      entries.merge(page.records) { _, new in new }
      page.deletedNames.forEach { entries.removeValue(forKey: $0) }
      guard !page.isMoreComing || page.token != nil else {
        throw ICloudDatabase.error("UNKNOWN", "Zone inventory page is missing its continuation token")
      }
      token = page.token
      isMoreComing = page.isMoreComing
    }
    return entries.map { ["recordName": $0.key, "recordType": $0.value] }
  }

  static func resolveZoneID(database: CKDatabase, scope: ICloudSyncScope, zoneName: String) async throws -> CKRecordZone.ID {
    switch scope {
    case .privateScope:
      return ICloudDatabase.zoneID(zoneName: zoneName, ownerName: ICloudDatabase.defaultOwnerName)
    case .shared:
      let zones = try await database.allRecordZones()
      guard let zone = zones.first(where: { $0.zoneID.zoneName == zoneName }) else {
        throw ICloudDatabase.error("ZONE_NOT_FOUND", "Shared zone \(zoneName) is not available")
      }
      return zone.zoneID
    }
  }

  private static func fetchPage(database: CKDatabase, zoneID: CKRecordZone.ID, token: CKServerChangeToken?) async throws -> Page {
    let page = Page()
    let configuration = CKFetchRecordZoneChangesOperation.ZoneConfiguration()
    configuration.previousServerChangeToken = token
    configuration.desiredKeys = []
    let operation = CKFetchRecordZoneChangesOperation(recordZoneIDs: [zoneID], configurationsByRecordZoneID: [zoneID: configuration])
    operation.recordWasChangedBlock = { recordID, result in
      switch result {
      case let .success(record): page.records[recordID.recordName] = record.recordType
      case let .failure(error): page.failure = error
      }
    }
    operation.recordWithIDWasDeletedBlock = { recordID, _ in
      page.deletedNames.append(recordID.recordName)
    }
    operation.recordZoneFetchResultBlock = { _, result in
      switch result {
      case let .success(zoneResult):
        page.token = zoneResult.serverChangeToken
        page.isMoreComing = zoneResult.moreComing
      case let .failure(error): page.failure = error
      }
    }
    return try await withCheckedThrowingContinuation { continuation in
      operation.fetchRecordZoneChangesResultBlock = { result in
        switch result {
        case let .failure(error): continuation.resume(throwing: error)
        case .success:
          if let failure = page.failure {
            continuation.resume(throwing: failure)
          } else {
            continuation.resume(returning: page)
          }
        }
      }
      database.add(operation)
    }
  }
}
