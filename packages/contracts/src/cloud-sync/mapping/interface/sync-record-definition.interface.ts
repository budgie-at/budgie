import type { SyncLinkRoleEnum } from '../enum/sync-link-role.enum';
import type { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';
import type { SyncWireValueType } from '../type/sync-wire-value.type';
import type { SyncChildDefinitionInterface } from './sync-child-definition.interface';
import type { SyncTableDescriptorInterface } from './sync-table-descriptor.interface';

export interface SyncRecordDefinitionInterface {
    readonly recordType: SyncRecordTypeEnum;
    readonly parent: SyncTableDescriptorInterface;
    readonly children: readonly SyncChildDefinitionInterface[];
    readonly linkRole: SyncLinkRoleEnum | null;
    readonly legPrivateEntries: SyncChildDefinitionInterface | null;
    readonly parentDefaults: Readonly<Record<string, SyncWireValueType>>;
}
