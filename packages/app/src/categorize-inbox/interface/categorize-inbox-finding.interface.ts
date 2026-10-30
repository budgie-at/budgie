import type { CategorizeInboxFindingKindEnum } from '../enum/categorize-inbox-finding-kind.enum';

export interface CategorizeInboxFindingInterface {
    readonly kind: CategorizeInboxFindingKindEnum;
    readonly jarName: string | null;
    readonly accountTitle: string | null;
    readonly rate: number;
    readonly isPerDay: boolean;
    readonly maxAmount: number;
}
