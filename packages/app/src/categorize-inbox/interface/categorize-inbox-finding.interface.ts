import type { CategorizeInboxFindingKindEnum } from '../enum/categorize-inbox-finding-kind.enum';

export interface CategorizeInboxFindingInterface {
    readonly kind: CategorizeInboxFindingKindEnum;
    readonly rate: number;
    readonly isPerDay: boolean;
}
