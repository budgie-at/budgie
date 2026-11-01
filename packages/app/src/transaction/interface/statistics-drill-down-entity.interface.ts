import type { CategorizeInboxKindEnum } from '../../categorize-inbox/enum/categorize-inbox-kind.enum';

export interface StatisticsDrillDownEntityInterface {
    readonly kind: CategorizeInboxKindEnum;
    readonly entityId: number;
}
