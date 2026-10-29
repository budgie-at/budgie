import type { CategorizeInboxRowInterface, CategorizeInboxSessionInterface } from '@budgie/categorization';

export interface CategorizeInboxStateInterface {
    readonly session: CategorizeInboxSessionInterface;
    readonly expandedClusterKey: string | null;
    readonly rows: CategorizeInboxRowInterface[];
    readonly hidden: Set<number>;
    readonly excluded: Set<number>;
}
