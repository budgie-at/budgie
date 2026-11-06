import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { getErrorMessage, isArray, isBoolean, isDefined, isNotEmptyString, isNumber, isRecord, isString } from '@rnw-community/shared';

import { SYNC_ID_PROPERTY } from '../constant/sync-identity-properties.constant';
import { SYNC_RECORD_DECODERS } from '../constant/sync-record-decoders.constant';
import { SYNC_RECORD_SCHEMA_VERSION } from '../constant/sync-record-schema-version.constant';
import { SyncColumnKindEnum } from '../enum/sync-column-kind.enum';
import { SyncReferenceKindEnum } from '../enum/sync-reference-kind.enum';
import { SyncRecordInvalidError } from '../error/sync-record-invalid.error';
import { SyncSchemaVersionUnsupportedError } from '../error/sync-schema-version-unsupported.error';

import type { DecodedSyncColumnInterface } from '../interface/decoded-sync-column.interface';
import type { DecodedSyncRecordInterface } from '../interface/decoded-sync-record.interface';
import type { SyncChildDefinitionInterface } from '../interface/sync-child-definition.interface';
import type { SyncColumnDescriptorInterface } from '../interface/sync-column-descriptor.interface';
import type { SyncIdentityInterface } from '../interface/sync-identity.interface';
import type { SyncParentLinkInterface } from '../interface/sync-parent-link.interface';
import type { SyncRowReferenceInterface } from '../interface/sync-row-reference.interface';
import type { SyncRowInterface } from '../interface/sync-row.interface';
import type { SyncTableDescriptorInterface } from '../interface/sync-table-descriptor.interface';
import type { SyncRowValueType } from '../type/sync-row-value.type';

const EnvelopeSchema = Schema.Struct({
    recordType: Schema.String,
    recordName: Schema.String,
    zone: Schema.String,
    schemaVersion: Schema.Number,
    encryptedFields: Schema.Record(Schema.String, Schema.Unknown)
});

const decodeRowValue = (kind: SyncColumnKindEnum, value: unknown): SyncRowValueType | null => {
    switch (kind) {
        case SyncColumnKindEnum.TIMESTAMP:
            return isNumber(value) ? new Date(value) : null;
        case SyncColumnKindEnum.BOOLEAN:
            return isBoolean(value) ? value : null;
        case SyncColumnKindEnum.TEXT:
            return isString(value) ? value : null;
        case SyncColumnKindEnum.INTEGER:
        case SyncColumnKindEnum.REAL:
            return isNumber(value) ? value : null;
    }
};

const decodeColumn = (column: SyncColumnDescriptorInterface, source: Readonly<Record<string, unknown>>): DecodedSyncColumnInterface => {
    const wire = source[column.field];

    if (isDefined(column.reference)) {
        return {
            value: null,
            reference: isNotEmptyString(wire)
                ? { column: column.property, tableName: column.reference.tableName, kind: column.reference.kind, key: wire }
                : null
        };
    }

    return { value: decodeRowValue(column.kind, wire), reference: null };
};

const decodeRow = (
    descriptor: SyncTableDescriptorInterface,
    source: Readonly<Record<string, unknown>>,
    identity: SyncIdentityInterface,
    parentReference: SyncRowReferenceInterface | null,
    defaults: Readonly<Record<string, SyncRowValueType>>
): SyncRowInterface => {
    const values: Record<string, SyncRowValueType> = { ...defaults };
    const references: SyncRowReferenceInterface[] = isDefined(parentReference) ? [parentReference] : [];

    for (const column of descriptor.columns) {
        if (column.property !== SYNC_ID_PROPERTY) {
            const { value, reference } = decodeColumn(column, source);

            if (isDefined(reference)) {
                references.push(reference);
            } else if (isDefined(value)) {
                values[column.property] = value;
            } else if (column.isNullable) {
                values[column.property] = null;
            }
        }
    }

    return { tableName: descriptor.tableName, ...identity, values, references };
};

const buildParentReference = (parentLink: SyncParentLinkInterface | null, parentSyncId: string): SyncRowReferenceInterface | null =>
    isDefined(parentLink)
        ? { column: parentLink.property, tableName: parentLink.tableName, kind: SyncReferenceKindEnum.SYNC_ID, key: parentSyncId }
        : null;

const decodeChildRows = (
    child: SyncChildDefinitionInterface,
    payload: Readonly<Record<string, unknown>>,
    zone: string,
    parentSyncId: string
): readonly SyncRowInterface[] => {
    const childPayloads = payload[child.field];

    return (isArray(childPayloads) ? childPayloads : []).flatMap(childPayload => {
        const childSyncId = isRecord(childPayload) ? childPayload[SYNC_ID_PROPERTY] : null;

        return isRecord(childPayload) && isNotEmptyString(childSyncId)
            ? [
                  decodeRow(
                      child.descriptor,
                      childPayload,
                      { syncId: childSyncId, syncZone: zone },
                      buildParentReference(child.descriptor.parentLink, parentSyncId),
                      {}
                  )
              ]
            : [];
    });
};

export const decodeSyncRecord = Effect.fnUntraced(function* (input: unknown) {
    const envelope = yield* Schema.decodeUnknownEffect(EnvelopeSchema)(input).pipe(
        Effect.mapError(error => new SyncRecordInvalidError({ recordType: '', recordName: '', reason: getErrorMessage(error) }))
    );
    const { recordType, recordName, zone, schemaVersion, encryptedFields } = envelope;

    if (!Number.isInteger(schemaVersion) || schemaVersion < 1 || schemaVersion > SYNC_RECORD_SCHEMA_VERSION) {
        return yield* new SyncSchemaVersionUnsupportedError({
            recordType,
            recordName,
            schemaVersion,
            supportedVersion: SYNC_RECORD_SCHEMA_VERSION
        });
    }

    const decoder = SYNC_RECORD_DECODERS.get(recordType);

    if (!isDefined(decoder)) {
        return yield* new SyncRecordInvalidError({ recordType, recordName, reason: 'Unknown record type' });
    }

    const payload = yield* Schema.decodeUnknownEffect(decoder.schema)(encryptedFields).pipe(
        Effect.mapError(error => new SyncRecordInvalidError({ recordType, recordName, reason: getErrorMessage(error) }))
    );

    if (!isRecord(payload) || !isNotEmptyString(recordName)) {
        return yield* new SyncRecordInvalidError({ recordType, recordName, reason: 'Payload is not an object' });
    }

    const { definition } = decoder;
    const parentRow = decodeRow(definition.parent, payload, { syncId: recordName, syncZone: zone }, null, definition.parentDefaults);
    const childRows = definition.children.flatMap(child => decodeChildRows(child, payload, zone, recordName));
    const legPrivateRows = isDefined(definition.legPrivateEntries)
        ? decodeChildRows(definition.legPrivateEntries, payload, zone, recordName)
        : [];

    const decoded: DecodedSyncRecordInterface = {
        recordType: definition.recordType,
        recordName,
        zone,
        linkId: isNotEmptyString(payload['linkId']) ? payload['linkId'] : null,
        legCount: isNumber(payload['legCount']) ? payload['legCount'] : 0,
        rows: [parentRow, ...childRows],
        legPrivateRows
    };

    return decoded;
});
