import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { SyncColumnKindEnum } from '../enum/sync-column-kind.enum';
import { SyncLinkRoleEnum } from '../enum/sync-link-role.enum';

import { SYNC_RECORD_DEFINITIONS } from './sync-record-definitions.constant';

import type { SyncColumnDescriptorInterface } from '../interface/sync-column-descriptor.interface';
import type { SyncRecordDecoderInterface } from '../interface/sync-record-decoder.interface';
import type { SyncRecordDefinitionInterface } from '../interface/sync-record-definition.interface';

const buildValueSchema = (column: SyncColumnDescriptorInterface): Schema.ConstraintDecoder<unknown> => {
    if (isDefined(column.reference)) {
        return Schema.String;
    }

    switch (column.kind) {
        case SyncColumnKindEnum.TEXT:
            return isDefined(column.enumValues) ? Schema.Literals(column.enumValues) : Schema.String;
        case SyncColumnKindEnum.BOOLEAN:
            return Schema.Boolean;
        case SyncColumnKindEnum.INTEGER:
        case SyncColumnKindEnum.REAL:
        case SyncColumnKindEnum.TIMESTAMP:
            return Schema.Finite;
    }
};

const buildFields = (columns: readonly SyncColumnDescriptorInterface[]): Record<string, Schema.ConstraintDecoder<unknown>> =>
    Object.fromEntries(
        columns.map(column => [column.field, column.isRequired ? buildValueSchema(column) : Schema.optionalKey(buildValueSchema(column))])
    );

const buildLinkFields = (linkRole: SyncLinkRoleEnum | null): Record<string, Schema.ConstraintDecoder<unknown>> => {
    switch (linkRole) {
        case SyncLinkRoleEnum.HOME:
            return { linkId: Schema.optionalKey(Schema.String), legCount: Schema.optionalKey(Schema.Finite) };
        case SyncLinkRoleEnum.LEG:
            return { linkId: Schema.String };
        default:
            return {};
    }
};

const buildDecoder = (definition: SyncRecordDefinitionInterface): SyncRecordDecoderInterface => ({
    definition,
    schema: Schema.Struct({
        ...buildFields(definition.parent.columns),
        ...Object.fromEntries(
            definition.children.map(child => [
                child.field,
                Schema.optionalKey(Schema.fromJsonString(Schema.Array(Schema.Struct(buildFields(child.descriptor.columns)))))
            ])
        ),
        ...(isDefined(definition.legPrivateEntries)
            ? {
                  [definition.legPrivateEntries.field]: Schema.optionalKey(
                      Schema.fromJsonString(Schema.Array(Schema.Struct(buildFields(definition.legPrivateEntries.descriptor.columns))))
                  )
              }
            : {}),
        ...buildLinkFields(definition.linkRole)
    })
});

export const SYNC_RECORD_DECODERS: ReadonlyMap<string, SyncRecordDecoderInterface> = new Map(
    Object.values(SYNC_RECORD_DEFINITIONS).map((definition): [string, SyncRecordDecoderInterface] => [
        definition.recordType,
        buildDecoder(definition)
    ])
);
