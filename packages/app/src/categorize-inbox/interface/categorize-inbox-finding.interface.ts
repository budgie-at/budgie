import type { CategorizeInboxFindingKindEnum } from '../enum/categorize-inbox-finding-kind.enum';

export interface CategorizeInboxFindingInterface {
    readonly kind: CategorizeInboxFindingKindEnum;
    readonly jarName: string | null;
    readonly count: number;
    readonly rate: number;
    readonly isPerDay: boolean;
    readonly maxAmount: number;
}
