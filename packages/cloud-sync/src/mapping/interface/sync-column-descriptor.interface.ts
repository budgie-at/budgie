import type { SyncColumnKindEnum } from '../enum/sync-column-kind.enum';
import type { SyncColumnReferenceInterface } from './sync-column-reference.interface';

export interface SyncColumnDescriptorInterface {
    readonly property: string;
    readonly field: string;
    readonly kind: SyncColumnKindEnum;
    readonly isRequired: boolean;
    readonly isNullable: boolean;
    readonly enumValues: readonly string[] | null;
    readonly reference: SyncColumnReferenceInterface | null;
}
