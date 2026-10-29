import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export interface CategorizeInboxClusterPositionInterface {
    readonly cluster: CategorizeInboxClusterInterface | null;
    readonly position: number | null;
    readonly total: number;
    readonly nextKey: string | null;
}
