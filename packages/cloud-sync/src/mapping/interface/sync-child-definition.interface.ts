import type { SyncTableDescriptorInterface } from './sync-table-descriptor.interface';

export interface SyncChildDefinitionInterface {
    readonly field: string;
    readonly descriptor: SyncTableDescriptorInterface;
}
