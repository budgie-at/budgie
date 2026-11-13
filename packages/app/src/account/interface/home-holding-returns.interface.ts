import type { HoldingReturnInterface } from './holding-return.interface';
import type { AccountTypeEnum } from '@budgie/contracts';

export interface HomeHoldingReturnsInterface {
    readonly byInstrumentId: ReadonlyMap<number, HoldingReturnInterface>;
    readonly bySectionType: ReadonlyMap<AccountTypeEnum, HoldingReturnInterface>;
    readonly isLoading: boolean;
}
