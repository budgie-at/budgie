import type { UserIconType } from '../../@generic/type/user-icon.type';
import type { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import type { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import type { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface ConsolidationSourceRowInterface {
    readonly canonicalTransactionId: number;
    readonly sourceTransactionId: number;
    readonly sourceType: TransactionTypeEnum;
    readonly sourceTitle: string;
    readonly sourceComment: string;
    readonly sourceExternalId: string | null;
    readonly sourceExternalSource: ExternalSourceEnum | null;
    readonly sourceOperatedAtMs: number;
    readonly entryId: number;
    readonly entryType: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly exchangeRate: number;
    readonly accountId: number;
    readonly accountTitle: string;
    readonly accountIcon: UserIconType;
    readonly sourceFromAccountTitle: string | null;
    readonly sourceFromAccountIcon: UserIconType | null;
    readonly sourceToAccountTitle: string | null;
    readonly sourceToAccountIcon: UserIconType | null;
    readonly canonicalFromAccountTitle: string | null;
    readonly canonicalFromAccountIcon: UserIconType | null;
    readonly canonicalToAccountTitle: string | null;
    readonly canonicalToAccountIcon: UserIconType | null;
    readonly instrumentId: number;
    readonly currencyCode: string;
    readonly currencySymbol: string;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
    readonly mcc: string | null;
    readonly mccDescription: string | null;
    readonly toIban: string | null;
}
