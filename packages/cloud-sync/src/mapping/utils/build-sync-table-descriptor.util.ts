import { getTableColumns, getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

import { isDefined } from '@rnw-community/shared';

import { SYNC_ID_PROPERTY, SYNC_ZONE_PROPERTY } from '../constant/sync-identity-properties.constant';
import { SYNC_LOCAL_ONLY_PROPERTIES } from '../constant/sync-local-only-properties.constant';
import { SYNC_NATURAL_KEY_PROPERTIES } from '../constant/sync-natural-key-properties.constant';
import { SYNC_UNDECLARED_REFERENCES } from '../constant/sync-undeclared-references.constant';
import { SyncColumnKindEnum } from '../enum/sync-column-kind.enum';
import { SyncReferenceKindEnum } from '../enum/sync-reference-kind.enum';

import type { SyncColumnDescriptorInterface } from '../interface/sync-column-descriptor.interface';
import type { SyncColumnReferenceInterface } from '../interface/sync-column-reference.interface';
import type { SyncTableDescriptorOptionsInterface } from '../interface/sync-table-descriptor-options.interface';
import type { SyncTableDescriptorInterface } from '../interface/sync-table-descriptor.interface';
import type { Column } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

const LOCAL_ID_PROPERTY = 'id';

const resolveColumnKind = (column: Column): SyncColumnKindEnum | null => {
    switch (column.columnType) {
        case 'SQLiteInteger':
            return SyncColumnKindEnum.INTEGER;
        case 'SQLiteReal':
            return SyncColumnKindEnum.REAL;
        case 'SQLiteText':
            return SyncColumnKindEnum.TEXT;
        case 'SQLiteBoolean':
            return SyncColumnKindEnum.BOOLEAN;
        case 'SQLiteTimestamp':
            return SyncColumnKindEnum.TIMESTAMP;
        default:
            return null;
    }
};

const collectForeignTables = (table: SQLiteTable): ReadonlyMap<string, string> => {
    const foreignTables = new Map<string, string>();

    for (const foreignKey of getTableConfig(table).foreignKeys) {
        const reference = foreignKey.reference();

        if (reference.columns.length === 1) {
            foreignTables.set(reference.columns[0].name, getTableName(reference.foreignTable));
        }
    }

    return foreignTables;
};

const resolveReference = (foreignTableName: string | undefined): SyncColumnReferenceInterface | null => {
    if (!isDefined(foreignTableName)) {
        return null;
    }

    return {
        tableName: foreignTableName,
        kind: isDefined(SYNC_NATURAL_KEY_PROPERTIES[foreignTableName]) ? SyncReferenceKindEnum.NATURAL_KEY : SyncReferenceKindEnum.SYNC_ID
    };
};

export const buildSyncTableDescriptor = (
    table: SQLiteTable,
    { parentProperty = null, includeOnly = null, omit = [] }: Partial<SyncTableDescriptorOptionsInterface> = {}
): SyncTableDescriptorInterface => {
    const tableName = getTableName(table);
    const foreignTables = collectForeignTables(table);
    const entries = Object.entries<Column>(getTableColumns(table));
    const excludedProperties = new Set<string>([
        LOCAL_ID_PROPERTY,
        SYNC_ZONE_PROPERTY,
        ...(isDefined(parentProperty) ? [parentProperty] : [SYNC_ID_PROPERTY]),
        ...(SYNC_LOCAL_ONLY_PROPERTIES[tableName] ?? []),
        ...omit
    ]);
    const parentColumn = entries.find(([property]) => property === parentProperty)?.[1];
    const parentTableName = isDefined(parentColumn) ? (foreignTables.get(parentColumn.name) ?? null) : null;
    const columns = entries.flatMap(([property, column]): SyncColumnDescriptorInterface[] => {
        const kind = resolveColumnKind(column);

        if (
            !isDefined(kind) ||
            excludedProperties.has(property) ||
            isDefined(column.generated) ||
            (isDefined(includeOnly) && !includeOnly.includes(property))
        ) {
            return [];
        }

        const reference = resolveReference(foreignTables.get(column.name) ?? SYNC_UNDECLARED_REFERENCES[tableName]?.[property]);

        return [
            {
                property,
                field: isDefined(reference)
                    ? `${property.replace(/Id$/u, '')}${reference.kind === SyncReferenceKindEnum.SYNC_ID ? 'SyncId' : 'Code'}`
                    : property,
                kind,
                isRequired: property === SYNC_ID_PROPERTY || (column.notNull && !column.hasDefault),
                isNullable: !column.notNull && property !== SYNC_ID_PROPERTY,
                enumValues: column.enumValues ?? null,
                reference
            }
        ];
    });

    return {
        table,
        tableName,
        columns,
        parentLink:
            isDefined(parentProperty) && isDefined(parentTableName) ? { property: parentProperty, tableName: parentTableName } : null
    };
};
