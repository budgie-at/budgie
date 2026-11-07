import CloudKit
import Foundation

final class ICloudSyncEngineHost: CKSyncEngineDelegate, @unchecked Sendable {
  private static let maxRecordsPerSendBatch = 100
  private static let maxBytesPerSendBatch = 1_500_000
  private static let maxRecordsPerEvent = 200
  private static let maxDeletionsPerEvent = 1000

  private let scope: ICloudSyncScope
  private let emit: @Sendable (String, [String: Any]) -> Void
  private let lock = NSLock()
  private var engine: CKSyncEngine?
  private var pendingSaves: [String: ICloudPendingSave] = [:]
  private var inFlightRevisions: [String: Int] = [:]
  private var nextRevision = 0
  private var unconfirmedBatches = Set<String>()
  private var heldSerialization: String?

  init(scope: ICloudSyncScope, emit: @escaping @Sendable (String, [String: Any]) -> Void) {
    self.scope = scope
    self.emit = emit
  }

  func start(stateSerialization: String?) throws {
    let serialization: CKSyncEngine.State.Serialization?
    if let stateSerialization {
      do {
        serialization = try JSONDecoder().decode(CKSyncEngine.State.Serialization.self, from: Data(stateSerialization.utf8))
      } catch {
        throw ICloudDatabase.error("INVALID_STATE", "Sync engine state is not decodable")
      }
    } else {
      serialization = nil
    }
    var configuration = CKSyncEngine.Configuration(database: ICloudDatabase.database(for: scope), stateSerialization: serialization, delegate: self)
    configuration.automaticallySync = true
    let created = CKSyncEngine(configuration)
    created.state.remove(pendingRecordZoneChanges: created.state.pendingRecordZoneChanges)
    created.state.remove(pendingDatabaseChanges: created.state.pendingDatabaseChanges)
    lock.withLock { engine = created }
  }

  func stop() {
    lock.withLock {
      engine = nil
      pendingSaves = [:]
      inFlightRevisions = [:]
      unconfirmedBatches = []
      heldSerialization = nil
    }
  }

  func syncNow() async throws {
    let current = try requireEngine()
    do {
      try await current.fetchChanges()
      try await current.sendChanges()
    } catch let error as CKError where error.code == .partialFailure {
      return
    }
  }

  func addPendingSaves(_ payloads: [ICloudRecordPayload]) throws {
    let current = try requireEngine()
    var changes: [CKSyncEngine.PendingRecordZoneChange] = []
    lock.withLock {
      for payload in payloads {
        nextRevision += 1
        let recordID = CKRecord.ID(recordName: payload.recordName, zoneID: ICloudDatabase.zoneID(zoneName: payload.zoneName, ownerName: payload.ownerName))
        pendingSaves[ICloudRecordCodec.key(recordID)] = ICloudPendingSave(payload: payload, revision: nextRevision, estimatedBytes: ICloudRecordCodec.estimatedBytes(payload))
        changes.append(.saveRecord(recordID))
      }
    }
    current.state.add(pendingRecordZoneChanges: changes)
  }

  func addPendingDeletes(_ recordIDs: [CKRecord.ID]) throws {
    let current = try requireEngine()
    lock.withLock {
      recordIDs.forEach { pendingSaves[ICloudRecordCodec.key($0)] = nil }
    }
    current.state.remove(pendingRecordZoneChanges: recordIDs.map { .saveRecord($0) })
    current.state.add(pendingRecordZoneChanges: recordIDs.map { .deleteRecord($0) })
  }

  func confirm(batchId: String) {
    let released: String? = lock.withLock {
      unconfirmedBatches.remove(batchId)
      guard unconfirmedBatches.isEmpty, let held = heldSerialization else { return nil }
      heldSerialization = nil
      return held
    }
    if let released {
      emit("onStateSerialization", ["scope": scope.rawValue, "stateSerialization": released])
    }
  }

  func nextRecordZoneChangeBatch(_ context: CKSyncEngine.SendChangesContext, syncEngine: CKSyncEngine) async -> CKSyncEngine.RecordZoneChangeBatch? {
    var selected: [CKSyncEngine.PendingRecordZoneChange] = []
    var orphaned: [CKSyncEngine.PendingRecordZoneChange] = []
    var bytes = 0
    lock.withLock {
      collect: for change in syncEngine.state.pendingRecordZoneChanges where context.options.scope.contains(change) {
        if selected.count >= Self.maxRecordsPerSendBatch { break collect }
        switch change {
        case let .saveRecord(recordID):
          guard let pending = pendingSaves[ICloudRecordCodec.key(recordID)] else {
            orphaned.append(change)
            continue
          }
          if !selected.isEmpty && bytes + pending.estimatedBytes > Self.maxBytesPerSendBatch { break collect }
          bytes += pending.estimatedBytes
          selected.append(change)
        case .deleteRecord:
          selected.append(change)
        @unknown default:
          continue
        }
      }
    }
    if !orphaned.isEmpty {
      syncEngine.state.remove(pendingRecordZoneChanges: orphaned)
    }
    return await CKSyncEngine.RecordZoneChangeBatch(pendingChanges: selected) { [self] recordID in
      let key = ICloudRecordCodec.key(recordID)
      let pending: ICloudPendingSave? = lock.withLock {
        guard let pending = pendingSaves[key] else { return nil }
        inFlightRevisions[key] = pending.revision
        return pending
      }
      guard let pending, let record = try? ICloudRecordCodec.makeRecord(from: pending.payload) else {
        syncEngine.state.remove(pendingRecordZoneChanges: [.saveRecord(recordID)])
        return nil
      }
      return record
    }
  }

  func handleEvent(_ event: CKSyncEngine.Event, syncEngine: CKSyncEngine) async {
    switch event {
    case let .stateUpdate(update):
      handleStateUpdate(update)
    case let .accountChange(change):
      handleAccountChange(change)
    case let .fetchedDatabaseChanges(changes):
      handleFetchedDatabaseChanges(changes, syncEngine: syncEngine)
    case let .fetchedRecordZoneChanges(changes):
      handleFetchedRecordZoneChanges(changes)
    case let .sentDatabaseChanges(sent):
      handleSentDatabaseChanges(sent)
    case let .sentRecordZoneChanges(sent):
      handleSentRecordZoneChanges(sent, syncEngine: syncEngine)
    case .willFetchChanges:
      emit("onWillFetchChanges", ["scope": scope.rawValue])
    case .didFetchChanges:
      emit("onDidFetchChanges", ["scope": scope.rawValue])
    default:
      break
    }
  }

  private func requireEngine() throws -> CKSyncEngine {
    guard let current = lock.withLock({ engine }) else {
      throw ICloudDatabase.error("SYNC_NOT_STARTED", "Sync engine for \(scope.rawValue) is not started")
    }
    return current
  }

  private func handleStateUpdate(_ update: CKSyncEngine.Event.StateUpdate) {
    guard let data = try? JSONEncoder().encode(update.stateSerialization) else { return }
    let text = String(decoding: data, as: UTF8.self)
    let isHeld: Bool = lock.withLock {
      if unconfirmedBatches.isEmpty { return false }
      heldSerialization = text
      return true
    }
    if !isHeld {
      emit("onStateSerialization", ["scope": scope.rawValue, "stateSerialization": text])
    }
  }

  private func emitBatches(_ eventName: String, bodies: [[String: Any]]) {
    let identified = bodies.map { body -> (String, [String: Any]) in
      let batchId = UUID().uuidString
      var tagged = body
      tagged["scope"] = scope.rawValue
      tagged["batchId"] = batchId
      return (batchId, tagged)
    }
    lock.withLock { identified.forEach { unconfirmedBatches.insert($0.0) } }
    identified.forEach { emit(eventName, $0.1) }
  }

  private func handleAccountChange(_ change: CKSyncEngine.Event.AccountChange) {
    var changeType = "SIGN_IN"
    var current: String?
    var previous: String?
    switch change.changeType {
    case let .signIn(currentUser):
      changeType = "SIGN_IN"
      current = currentUser.recordName
    case let .signOut(previousUser):
      changeType = "SIGN_OUT"
      previous = previousUser.recordName
    case let .switchAccounts(previousUser, currentUser):
      changeType = "SWITCH_ACCOUNTS"
      current = currentUser.recordName
      previous = previousUser.recordName
    @unknown default:
      break
    }
    if changeType != "SIGN_IN" {
      lock.withLock {
        pendingSaves = [:]
        inFlightRevisions = [:]
      }
    }
    emitBatches("onAccountChange", bodies: [["changeType": changeType, "currentUserRecordName": current as Any? ?? NSNull(), "previousUserRecordName": previous as Any? ?? NSNull()]])
  }

  private func handleFetchedDatabaseChanges(_ changes: CKSyncEngine.Event.FetchedDatabaseChanges, syncEngine: CKSyncEngine) {
    let deleted = changes.deletions.map { deletion -> [String: Any] in
      var body = ICloudRecordCodec.zoneDictionary(deletion.zoneID)
      body["reason"] = reasonName(deletion)
      return body
    }
    let modified = changes.modifications.map { ICloudRecordCodec.zoneDictionary($0.zoneID) }
    guard !deleted.isEmpty || !modified.isEmpty else { return }
    let deletedZoneIDs = Set(changes.deletions.map(\.zoneID))
    if !deletedZoneIDs.isEmpty {
      lock.withLock {
        pendingSaves = pendingSaves.filter { _, pending in
          !deletedZoneIDs.contains(ICloudDatabase.zoneID(zoneName: pending.payload.zoneName, ownerName: pending.payload.ownerName))
        }
      }
      let stale = syncEngine.state.pendingRecordZoneChanges.filter { change in
        switch change {
        case let .saveRecord(recordID), let .deleteRecord(recordID): return deletedZoneIDs.contains(recordID.zoneID)
        @unknown default: return false
        }
      }
      syncEngine.state.remove(pendingRecordZoneChanges: stale)
    }
    emitBatches("onZoneChange", bodies: [["deleted": deleted, "modified": modified]])
  }

  private func reasonName(_ deletion: CKDatabase.DatabaseChange.Deletion) -> String {
    switch deletion.reason {
    case .deleted: return scope == .shared ? "ACCESS_LOST" : "DELETED"
    case .purged: return scope == .shared ? "ACCESS_LOST" : "PURGED"
    case .encryptedDataReset: return "ENCRYPTED_DATA_RESET"
    @unknown default: return "DELETED"
    }
  }

  private func handleFetchedRecordZoneChanges(_ changes: CKSyncEngine.Event.FetchedRecordZoneChanges) {
    var records: [[String: Any]] = []
    var changedShares: [[String: Any]] = []
    for modification in changes.modifications {
      if modification.record is CKShare {
        changedShares.append(ICloudRecordCodec.zoneDictionary(modification.record.recordID.zoneID))
      } else {
        records.append(ICloudRecordCodec.dictionary(from: modification.record))
      }
    }
    let deletions = changes.deletions.compactMap { deletion -> [String: Any]? in
      guard deletion.recordType != "cloudkit.share" else {
        return nil
      }
      var body = ICloudRecordCodec.recordIDDictionary(deletion.recordID)
      body["recordType"] = deletion.recordType
      return body
    }
    let shareDeletions = changes.deletions.filter { $0.recordType == "cloudkit.share" }.map { ICloudRecordCodec.zoneDictionary($0.recordID.zoneID) }
    changedShares.append(contentsOf: shareDeletions)
    var bodies: [[String: Any]] = stride(from: 0, to: records.count, by: Self.maxRecordsPerEvent).map { start in
      ["records": Array(records[start ..< min(start + Self.maxRecordsPerEvent, records.count)]), "deletions": [[String: Any]](), "changedShares": [[String: Any]]()]
    }
    bodies.append(contentsOf: stride(from: 0, to: deletions.count, by: Self.maxDeletionsPerEvent).map { start in
      ["records": [[String: Any]](), "deletions": Array(deletions[start ..< min(start + Self.maxDeletionsPerEvent, deletions.count)]), "changedShares": [[String: Any]]()]
    })
    if !changedShares.isEmpty {
      bodies.append(["records": [[String: Any]](), "deletions": [[String: Any]](), "changedShares": changedShares])
    }
    guard !bodies.isEmpty else { return }
    emitBatches("onFetchedChanges", bodies: bodies)
  }

  private func handleSentDatabaseChanges(_ sent: CKSyncEngine.Event.SentDatabaseChanges) {
    let body: [String: Any] = [
      "savedRecords": [[String: Any]](),
      "failedSaves": [[String: Any]](),
      "deletedRecords": [[String: Any]](),
      "failedDeletes": [[String: Any]](),
      "savedZones": sent.savedZones.map { ICloudRecordCodec.zoneDictionary($0.zoneID) },
      "failedZoneSaves": sent.failedZoneSaves.map { failure -> [String: Any] in
        ICloudRecordCodec.zoneDictionary(failure.zone.zoneID).merging(ICloudDatabase.failure(failure.error)) { first, _ in first }
      },
      "deletedZones": sent.deletedZoneIDs.map { ICloudRecordCodec.zoneDictionary($0) },
      "failedZoneDeletes": sent.failedZoneDeletes.map { zoneID, error -> [String: Any] in
        ICloudRecordCodec.zoneDictionary(zoneID).merging(ICloudDatabase.failure(error)) { first, _ in first }
      }
    ]
    let hasContent = ["savedZones", "failedZoneSaves", "deletedZones", "failedZoneDeletes"].contains { (body[$0] as? [Any])?.isEmpty == false }
    if hasContent {
      emitBatches("onSentChanges", bodies: [body])
    }
  }

  private func handleSentRecordZoneChanges(_ sent: CKSyncEngine.Event.SentRecordZoneChanges, syncEngine: CKSyncEngine) {
    var resend: [CKSyncEngine.PendingRecordZoneChange] = []
    let saved = sent.savedRecords.map { record -> [String: Any] in
      let key = ICloudRecordCodec.key(record.recordID)
      let encoded = ICloudRecordCodec.encodeSystemFields(record)
      lock.withLock {
        let sentRevision = inFlightRevisions.removeValue(forKey: key)
        guard let pending = pendingSaves[key] else { return }
        if pending.revision == sentRevision {
          pendingSaves[key] = nil
        } else {
          var payload = pending.payload
          payload.systemFields = encoded
          pendingSaves[key] = ICloudPendingSave(payload: payload, revision: pending.revision, estimatedBytes: pending.estimatedBytes)
          resend.append(.saveRecord(record.recordID))
        }
      }
      var body = ICloudRecordCodec.recordIDDictionary(record.recordID)
      body["recordType"] = record.recordType
      body["systemFields"] = encoded
      return body
    }
    let failedSaves = sent.failedRecordSaves.map { failure -> [String: Any] in
      let key = ICloudRecordCodec.key(failure.record.recordID)
      if !ICloudDatabase.isRetriedByEngine(failure.error) {
        lock.withLock {
          pendingSaves[key] = nil
          inFlightRevisions[key] = nil
        }
      }
      var body = ICloudRecordCodec.recordIDDictionary(failure.record.recordID)
      body["recordType"] = failure.record.recordType
      body.merge(ICloudDatabase.failure(failure.error)) { first, _ in first }
      body["serverRecord"] = failure.error.serverRecord.map { ICloudRecordCodec.dictionary(from: $0) } as Any? ?? NSNull()
      return body
    }
    let deleted = sent.deletedRecordIDs.map { ICloudRecordCodec.recordIDDictionary($0) }
    let failedDeletes = sent.failedRecordDeletes.map { recordID, error -> [String: Any] in
      ICloudRecordCodec.recordIDDictionary(recordID).merging(ICloudDatabase.failure(error)) { first, _ in first }
    }
    if !resend.isEmpty {
      syncEngine.state.add(pendingRecordZoneChanges: resend)
    }
    guard !saved.isEmpty || !failedSaves.isEmpty || !deleted.isEmpty || !failedDeletes.isEmpty else { return }
    emitBatches("onSentChanges", bodies: [[
      "savedRecords": saved,
      "failedSaves": failedSaves,
      "deletedRecords": deleted,
      "failedDeletes": failedDeletes,
      "savedZones": [[String: Any]](),
      "failedZoneSaves": [[String: Any]](),
      "deletedZones": [[String: Any]](),
      "failedZoneDeletes": [[String: Any]]()
    ]])
  }
}
