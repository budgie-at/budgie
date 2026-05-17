import type { CategoryEntityInterface, TagEntityInterface, TransactionTypeEnum } from '@budgie/contracts';

export interface TransactionFilterPageHeaderPropsInterface {
    readonly isMissingCategories?: boolean;
    readonly isUncategorized?: boolean;
    readonly isUntagged?: boolean;
    readonly type?: TransactionTypeEnum;
    readonly types?: readonly TransactionTypeEnum[];
    readonly startDate?: string;
    readonly endDate?: string;
    readonly category?: CategoryEntityInterface | null;
    readonly tag?: TagEntityInterface | null;
    readonly onGoBack: () => void;
}
