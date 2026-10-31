import type { TransactionFilterPageHeaderModeEnum } from '../enum/transaction-filter-page-header-mode.enum';
import type { CategoryEntityInterface, DateRangeInterface, TagEntityInterface, TransactionTypeEnum } from '@budgie/contracts';

export interface TransactionFilterPageHeaderPropsInterface {
    readonly mode: TransactionFilterPageHeaderModeEnum | null;
    readonly type?: TransactionTypeEnum;
    readonly types?: readonly TransactionTypeEnum[] | null;
    readonly date: DateRangeInterface | null;
    readonly category?: CategoryEntityInterface | null;
    readonly tag?: TagEntityInterface | null;
}
