import type { CurrencyEnum } from '../../@generic/enum/currency.enum';

export interface ReceiptMatchCandidateQueryInterface {
    readonly total: number;
    readonly currency: CurrencyEnum;
    readonly from: Date;
    readonly to: Date;
    readonly cardExternalId: string | null;
}
