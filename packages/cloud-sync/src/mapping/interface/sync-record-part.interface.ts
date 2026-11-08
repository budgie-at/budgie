import type { SyncRowInputType } from '../type/sync-row-input.type';
import type { SyncWireValueType } from '../type/sync-wire-value.type';
import type { SyncRecordDefinitionInterface } from './sync-record-definition.interface';

export interface SyncRecordPartInterface {
    readonly definition: SyncRecordDefinitionInterface;
    readonly recordName: string;
    readonly zone: string;
    readonly parent: SyncRowInputType;
    readonly children: Readonly<Record<string, readonly SyncRowInputType[]>>;
    readonly legPrivateRows: readonly SyncRowInputType[];
    readonly extraFields: Readonly<Record<string, SyncWireValueType>>;
}
