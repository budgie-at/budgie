import CloudKit
import ExpoModulesCore
import Foundation

struct ICloudRecordId: Record {
  @Field var zoneName: String = ""
  @Field var ownerName: String = ""
  @Field var recordName: String = ""

  var recordID: CKRecord.ID {
    CKRecord.ID(recordName: recordName, zoneID: ICloudDatabase.zoneID(zoneName: zoneName, ownerName: ownerName))
  }
}

struct ICloudRecordPayload: Record {
  @Field var zoneName: String = ""
  @Field var ownerName: String = ""
  @Field var recordName: String = ""
  @Field var recordType: String = ""
  @Field var systemFields: String?
  @Field var schemaVersion: Int = 0
  @Field var encryptedFields: [String: Any] = [:]
}

struct ICloudPendingSave {
  let payload: ICloudRecordPayload
  let revision: Int
  let estimatedBytes: Int
}

enum ICloudRecordCodec {
  static let booleanFieldsKey = "booleanFields"
  static let schemaVersionKey = "schemaVersion"

  static func key(_ recordID: CKRecord.ID) -> String {
    "\(recordID.zoneID.ownerName)|\(recordID.zoneID.zoneName)|\(recordID.recordName)"
  }

  static func estimatedBytes(_ payload: ICloudRecordPayload) -> Int {
    payload.encryptedFields.values.reduce(0) { total, value in
      total + 32 + ((value as? String)?.utf8.count ?? 8)
    }
  }

  static func encodeSystemFields(_ record: CKRecord) -> String {
    let coder = NSKeyedArchiver(requiringSecureCoding: true)
    record.encodeSystemFields(with: coder)
    coder.finishEncoding()
    return coder.encodedData.base64EncodedString()
  }

  static func decodeSystemFields(_ encoded: String) -> CKRecord? {
    guard let data = Data(base64Encoded: encoded), let coder = try? NSKeyedUnarchiver(forReadingFrom: data) else { return nil }
    coder.requiresSecureCoding = true
    defer { coder.finishDecoding() }
    return CKRecord(coder: coder)
  }

  static func makeRecord(from payload: ICloudRecordPayload) throws -> CKRecord {
    let recordID = CKRecord.ID(recordName: payload.recordName, zoneID: ICloudDatabase.zoneID(zoneName: payload.zoneName, ownerName: payload.ownerName))
    let record = payload.systemFields.flatMap(decodeSystemFields) ?? CKRecord(recordType: payload.recordType, recordID: recordID)
    record[schemaVersionKey] = Int64(payload.schemaVersion)
    var booleanKeys: [String] = []
    for (key, value) in payload.encryptedFields {
      if value is NSNull {
        record.encryptedValues[key] = nil
      } else if let text = value as? String {
        record.encryptedValues[key] = text
      } else if isBoolean(value), let flag = value as? Bool {
        record.encryptedValues[key] = Int64(flag ? 1 : 0)
        booleanKeys.append(key)
      } else if let number = value as? NSNumber {
        record.encryptedValues[key] = number.doubleValue
      } else {
        throw ICloudDatabase.error("UNKNOWN", "Unsupported value for field \(key)")
      }
    }
    let booleanData = try JSONSerialization.data(withJSONObject: booleanKeys.sorted())
    record.encryptedValues[booleanFieldsKey] = String(decoding: booleanData, as: UTF8.self)
    return record
  }

  static func dictionary(from record: CKRecord) -> [String: Any] {
    let booleanKeys = Set(
      (record.encryptedValues[booleanFieldsKey] as? String)
        .flatMap { $0.data(using: .utf8) }
        .flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String] } ?? []
    )
    var fields: [String: Any] = [:]
    for key in record.encryptedValues.allKeys() where key != booleanFieldsKey {
      let value = record.encryptedValues[key]
      if let text = value as? String {
        fields[key] = text
      } else if let number = value as? NSNumber {
        fields[key] = booleanKeys.contains(key) ? number.boolValue : number.doubleValue
      }
    }
    let schemaVersion = (record[schemaVersionKey] as? NSNumber)?.intValue ?? 0
    return [
      "zoneName": record.recordID.zoneID.zoneName,
      "ownerName": record.recordID.zoneID.ownerName,
      "recordName": record.recordID.recordName,
      "recordType": record.recordType,
      "systemFields": encodeSystemFields(record),
      "schemaVersion": schemaVersion,
      "encryptedFields": fields
    ]
  }

  static func recordIDDictionary(_ recordID: CKRecord.ID) -> [String: Any] {
    ["zoneName": recordID.zoneID.zoneName, "ownerName": recordID.zoneID.ownerName, "recordName": recordID.recordName]
  }

  static func zoneDictionary(_ zoneID: CKRecordZone.ID) -> [String: Any] {
    ["zoneName": zoneID.zoneName, "ownerName": zoneID.ownerName]
  }

  private static func isBoolean(_ value: Any) -> Bool {
    CFGetTypeID(value as AnyObject) == CFBooleanGetTypeID()
  }
}
