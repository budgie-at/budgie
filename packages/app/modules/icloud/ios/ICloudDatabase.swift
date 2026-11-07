import CloudKit
import Foundation

enum ICloudSyncScope: String {
  case privateScope = "PRIVATE"
  case shared = "SHARED"
}

enum ICloudDatabase {
  static let defaultOwnerName = CKCurrentUserDefaultName

  static var container: CKContainer {
    CKContainer(identifier: "iCloud.\(Bundle.main.bundleIdentifier ?? "")")
  }

  static var database: CKDatabase {
    container.privateCloudDatabase
  }

  static var sharedDatabase: CKDatabase {
    container.sharedCloudDatabase
  }

  static func database(for scope: ICloudSyncScope) -> CKDatabase {
    switch scope {
    case .privateScope: return database
    case .shared: return sharedDatabase
    }
  }

  static func scope(_ rawValue: String) throws -> ICloudSyncScope {
    guard let scope = ICloudSyncScope(rawValue: rawValue) else {
      throw error("UNKNOWN", "Unknown sync scope \(rawValue)")
    }
    return scope
  }

  static func zoneID(zoneName: String, ownerName: String) -> CKRecordZone.ID {
    CKRecordZone.ID(zoneName: zoneName, ownerName: ownerName.isEmpty ? defaultOwnerName : ownerName)
  }

  static func accountStatusName(_ status: CKAccountStatus) -> String {
    switch status {
    case .available: return "available"
    case .noAccount: return "noAccount"
    case .restricted: return "restricted"
    case .temporarilyUnavailable: return "temporarilyUnavailable"
    case .couldNotDetermine: return "couldNotDetermine"
    @unknown default: return "couldNotDetermine"
    }
  }

  static func date(from value: Any) -> Date? {
    if let milliseconds = value as? Double {
      return Date(timeIntervalSince1970: milliseconds / 1000)
    }
    guard let text = value as? String else { return nil }
    let fractional = ISO8601DateFormatter()
    fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return fractional.date(from: text) ?? ISO8601DateFormatter().date(from: text)
  }

  static func error(_ code: String, _ message: String) -> NSError {
    NSError(domain: "ICloud", code: 1, userInfo: ["code": code, NSLocalizedDescriptionKey: message])
  }

  static func modify(_ operation: CKModifyRecordsOperation, record: CKRecord) async throws -> String {
    try await withCheckedThrowingContinuation { continuation in
      operation.modifyRecordsResultBlock = { result in
        switch result {
        case .success: continuation.resume(returning: record.recordID.recordName)
        case let .failure(error): continuation.resume(throwing: Self.map(error))
        }
      }
      database.add(operation)
    }
  }

  static func map(_ error: Error) -> NSError {
    let cloudError = error as NSError
    let code: String
    switch CKError.Code(rawValue: cloudError.code) {
    case .some(.notAuthenticated), .some(.accountTemporarilyUnavailable), .some(.permissionFailure): code = "ACCOUNT_UNAVAILABLE"
    case .some(.quotaExceeded): code = "QUOTA_EXCEEDED"
    case .some(.networkUnavailable), .some(.networkFailure): code = "NETWORK_UNAVAILABLE"
    case .some(.zoneNotFound): code = "ENCRYPTED_DATA_RESET"
    default: code = "UNKNOWN"
    }
    return NSError(domain: "ICloud", code: cloudError.code, userInfo: ["code": code, NSLocalizedDescriptionKey: cloudError.localizedDescription])
  }

  static func itemError(_ error: Error) -> Error {
    guard let cloudError = error as? CKError, cloudError.code == .partialFailure, let first = cloudError.partialErrorsByItemID?.values.first else {
      return error
    }
    return first
  }

  static func syncErrorCode(_ error: Error) -> String {
    let cloudError = itemError(error) as NSError
    if let code = cloudError.userInfo["code"] as? String, cloudError.domain == "ICloud" { return code }
    switch CKError.Code(rawValue: cloudError.code) {
    case .some(.serverRecordChanged): return "SERVER_RECORD_CHANGED"
    case .some(.zoneNotFound): return "ZONE_NOT_FOUND"
    case .some(.userDeletedZone): return "USER_DELETED_ZONE"
    case .some(.participantMayNeedVerification): return "PARTICIPANT_NEEDS_VERIFICATION"
    case .some(.permissionFailure): return "PERMISSION_FAILURE"
    case .some(.unknownItem): return "UNKNOWN_ITEM"
    case .some(.limitExceeded): return "LIMIT_EXCEEDED"
    case .some(.constraintViolation): return "CONSTRAINT_VIOLATION"
    case .some(.zoneBusy), .some(.requestRateLimited), .some(.serviceUnavailable): return "SERVICE_BUSY"
    case .some(.notAuthenticated), .some(.accountTemporarilyUnavailable), .some(.managedAccountRestricted): return "ACCOUNT_UNAVAILABLE"
    case .some(.quotaExceeded): return "QUOTA_EXCEEDED"
    case .some(.networkUnavailable), .some(.networkFailure): return "NETWORK_UNAVAILABLE"
    default: return "UNKNOWN"
    }
  }

  static func isRetriedByEngine(_ error: Error) -> Bool {
    switch CKError.Code(rawValue: (error as NSError).code) {
    case .some(.networkFailure), .some(.networkUnavailable), .some(.zoneBusy), .some(.serviceUnavailable), .some(.notAuthenticated), .some(.operationCancelled), .some(.requestRateLimited): return true
    default: return false
    }
  }

  static func failure(_ error: Error) -> [String: Any] {
    ["code": syncErrorCode(error), "message": (itemError(error) as NSError).localizedDescription]
  }

  static func syncError(_ error: Error) -> NSError {
    let cloudError = itemError(error) as NSError
    return NSError(domain: "ICloud", code: cloudError.code, userInfo: ["code": syncErrorCode(error), NSLocalizedDescriptionKey: cloudError.localizedDescription])
  }
}
