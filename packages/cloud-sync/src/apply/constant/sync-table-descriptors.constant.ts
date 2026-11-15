import { SyncRecordTypeEnum } from '@budgie/contracts';

import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';

import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';

export const SYNC_TABLE_DESCRIPTORS: Record<string, SyncTableDescriptorInterface> = Object.fromEntries(
    Object.values(SYNC_RECORD_DEFINITIONS)
        .filter(({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG)
        .flatMap(definition => [definition.parent, ...definition.children.map(child => child.descriptor)])
        .map(descriptor => [descriptor.tableName, descriptor])
);

export const SYNC_SEARCH_TITLE_TABLES: ReadonlySet<string> = new Set(['accounts', 'categories', 'tags']);
