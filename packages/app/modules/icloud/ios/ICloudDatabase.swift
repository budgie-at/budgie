import CloudKit
import Foundation

enum ICloudDatabase {
  static var container: CKContainer {
    CKContainer(identifier: "iCloud.\(Bundle.main.bundleIdentifier ?? "")")
  }

  static var database: CKDatabase {
    container.privateCloudDatabase
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
}
