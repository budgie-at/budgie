import { utf8ToBytes } from '@noble/hashes/utils.js';
import * as Result from 'effect/Result';

import { isDefined, isNotEmptyArray, isNotEmptyString, isNumber } from '@rnw-community/shared';

import { SYNC_ID_PROPERTY } from '../constant/sync-identity-properties.constant';
import { SYNC_RECORD_MAX_BYTES } from '../constant/sync-record-max-bytes.constant';
import { SYNC_RECORD_SCHEMA_VERSION } from '../constant/sync-record-schema-version.constant';
import { SYNC_SCALAR_VALUE_NARROWERS } from '../constant/sync-scalar-value-narrowers.constant';
import { SyncColumnKindEnum } from '../enum/sync-column-kind.enum';
import { SyncReferenceKindEnum } from '../enum/sync-reference-kind.enum';
import { SyncIdentityUnresolvedError } from '../error/sync-identity-unresolved.error';
import { SyncRecordTooLargeError } from '../error/sync-record-too-large.error';

import { deriveTransactionLinkId } from './derive-transaction-link-id.util';
import { planSyncRecordParts } from './plan-sync-record-parts.util';

import type { SyncAggregateInterface } from '../interface/sync-aggregate.interface';
import type { SyncColumnDescriptorInterface } from '../interface/sync-column-descriptor.interface';
import type { SyncRecordPartInterface } from '../interface/sync-record-part.interface';
import type { SyncRecordInterface } from '../interface/sync-record.interface';
import type { SyncReferenceResolverInterface } from '../interface/sync-reference-resolver.interface';
import type { SyncTableDescriptorInterface } from '../interface/sync-table-descriptor.interface';
import type { EncodedSyncFieldsType } from '../type/encoded-sync-fields.type';
import type { SyncRowInputType } from '../type/sync-row-input.type';
import type { SyncWireValueType } from '../type/sync-wire-value.type';

const SEQUENCE_FIELD = 'sequence';
const CONSOLIDATION_PARENT_PROPERTY = 'consolidationParentTransactionId';

const PLAIN_VALUE_ENCODERS: Readonly<Record<SyncColumnKindEnum, (value: unknown) => SyncWireValueType | null>> = {
    [SyncColumnKindEnum.TIMESTAMP]: value => (value instanceof Date ? value.getTime() : null),
    ...SYNC_SCALAR_VALUE_NARROWERS
};

const resolveReferenceKey = (
    column: SyncColumnDescriptorInterface,
    localId: number,
    resolver: SyncReferenceResolverInterface,
    zone: string
): string | null | undefined => {
    const { reference } = column;

    if (reference?.kind === SyncReferenceKindEnum.NATURAL_KEY) {
        return resolver.findNaturalKey(reference.tableName, localId);
    }

    const identity = resolver.findSyncIdentity(reference?.tableName ?? '', localId);
    const isCrossZoneParent = column.property === CONSOLIDATION_PARENT_PROPERTY && isDefined(identity) && identity.syncZone !== zone;

    return isCrossZoneParent ? deriveTransactionLinkId(identity.syncId) : identity?.syncId;
};

const encodeColumn = (
    column: SyncColumnDescriptorInterface,
    row: SyncRowInputType,
    resolver: SyncReferenceResolverInterface,
    zone: string
): Result.Result<SyncWireValueType | null, number> => {
    const value = row[column.property];

    if (!isDefined(column.reference)) {
        return Result.succeed(PLAIN_VALUE_ENCODERS[column.kind](value));
    }

    if (!isNumber(value)) {
        return Result.succeed(null);
    }

    const key = resolveReferenceKey(column, value, resolver, zone);

    return isNotEmptyString(key) ? Result.succeed(key) : Result.fail(value);
};

const encodeRow = (
    descriptor: SyncTableDescriptorInterface,
    row: SyncRowInputType,
    resolver: SyncReferenceResolverInterface,
    zone: string
): Result.Result<EncodedSyncFieldsType, SyncIdentityUnresolvedError> =>
    Result.gen(function* () {
        const fields: Record<string, SyncWireValueType> = {};

        for (const column of descriptor.columns) {
            const encoded = yield* encodeColumn(column, row, resolver, zone).pipe(
                Result.mapError(localId =>
                    SyncIdentityUnresolvedError.make({ tableName: descriptor.tableName, column: column.property, localKey: `${localId}` })
                )
            );

            if (isDefined(encoded)) {
                fields[column.field] = encoded;
            }
        }

        if (isDefined(descriptor.parentLink) && !isNotEmptyString(fields[SYNC_ID_PROPERTY])) {
            return yield* Result.fail(
                SyncIdentityUnresolvedError.make({
                    tableName: descriptor.tableName,
                    column: SYNC_ID_PROPERTY,
                    localKey: isNumber(row['id']) ? `${row['id']}` : ''
                })
            );
        }

        return fields;
    });

const compareEncodedRows = (left: EncodedSyncFieldsType, right: EncodedSyncFieldsType): number => {
    const leftSequence = left[SEQUENCE_FIELD];
    const rightSequence = right[SEQUENCE_FIELD];

    if (isNumber(leftSequence) && isNumber(rightSequence) && leftSequence !== rightSequence) {
        return leftSequence - rightSequence;
    }

    const leftKey = `${left[SYNC_ID_PROPERTY]}`;
    const rightKey = `${right[SYNC_ID_PROPERTY]}`;

    if (leftKey === rightKey) {
        return 0;
    }

    return leftKey < rightKey ? -1 : 1;
};

const encodeRows = (
    descriptor: SyncTableDescriptorInterface,
    rows: readonly SyncRowInputType[],
    resolver: SyncReferenceResolverInterface,
    zone: string
): Result.Result<readonly EncodedSyncFieldsType[], SyncIdentityUnresolvedError> =>
    Result.gen(function* () {
        const encodedRows: EncodedSyncFieldsType[] = [];

        for (const row of rows) {
            encodedRows.push(yield* encodeRow(descriptor, row, resolver, zone));
        }

        return encodedRows.sort(compareEncodedRows);
    });

const encodeChildren = (
    part: SyncRecordPartInterface,
    resolver: SyncReferenceResolverInterface
): Result.Result<EncodedSyncFieldsType, SyncIdentityUnresolvedError> =>
    Result.gen(function* () {
        const fields: Record<string, string> = {};

        for (const child of part.definition.children) {
            const encodedRows = yield* encodeRows(child.descriptor, part.children[child.descriptor.tableName] ?? [], resolver, part.zone);

            if (isNotEmptyArray(encodedRows)) {
                fields[child.field] = JSON.stringify(encodedRows);
            }
        }

        const { legPrivateEntries } = part.definition;

        if (isDefined(legPrivateEntries) && isNotEmptyArray(part.legPrivateRows)) {
            const privateRows = yield* encodeRows(legPrivateEntries.descriptor, part.legPrivateRows, resolver, part.zone);

            fields[legPrivateEntries.field] = JSON.stringify(privateRows);
        }

        return fields;
    });

const encodePart = (
    part: SyncRecordPartInterface,
    resolver: SyncReferenceResolverInterface
): Result.Result<SyncRecordInterface, SyncIdentityUnresolvedError | SyncRecordTooLargeError> =>
    Result.gen(function* () {
        const parentFields = yield* encodeRow(part.definition.parent, part.parent, resolver, part.zone);
        const childFields = yield* encodeChildren(part, resolver);
        const encryptedFields = { ...parentFields, ...childFields, ...part.extraFields };
        const bytes = utf8ToBytes(JSON.stringify(encryptedFields)).length;

        if (bytes > SYNC_RECORD_MAX_BYTES) {
            return yield* Result.fail(
                SyncRecordTooLargeError.make({ recordName: part.recordName, bytes, maxBytes: SYNC_RECORD_MAX_BYTES })
            );
        }

        return {
            recordType: part.definition.recordType,
            recordName: part.recordName,
            zone: part.zone,
            schemaVersion: SYNC_RECORD_SCHEMA_VERSION,
            encryptedFields
        };
    });

export const encodeSyncAggregate = (
    aggregate: SyncAggregateInterface,
    resolver: SyncReferenceResolverInterface
): Result.Result<readonly SyncRecordInterface[], SyncIdentityUnresolvedError | SyncRecordTooLargeError> =>
    Result.gen(function* () {
        const records: SyncRecordInterface[] = [];

        for (const part of yield* planSyncRecordParts(aggregate, resolver)) {
            records.push(yield* encodePart(part, resolver));
        }

        return records;
    });
