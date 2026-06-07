import { BinanceTransferInterface } from '@budgie/bank-sync';
import {
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { AccountEntityInterface, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

const FEE_ENTRY_EXTERNAL_ID_SUFFIX = ':fee';
const MILLISECONDS_PER_SECOND = 1000;

export const mapBinanceTransferToCreateInput = async (
    transfer: BinanceTransferInterface,
    resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
): Promise<TransactionCreateInputInterface | null> => {
    const fromAccount = await resolveAccount(transfer.fromAssetAccountId);
    const toAccount = await resolveAccount(transfer.toAssetAccountId);

    if (!isDefined(fromAccount) || !isDefined(toAccount)) {
        return null;
    }

    const feeAccount = isDefined(transfer.feeAssetAccountId) ? await resolveAccount(transfer.feeAssetAccountId) : null;
    const hasFee = isPositiveNumber(transfer.feeAmount) && isDefined(feeAccount);

    const fromEntry: TransactionEntryCreateInputInterface = {
        accountId: fromAccount.id,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: transfer.fromAmount,
        categoryId: null,
        categorySource: CategorySourceEnum.USER,
        mccCategoryId: null,
        externalId: transfer.externalId,
        exchangeRate: 1,
        toIban: null
    };

    const toEntry: TransactionEntryCreateInputInterface = {
        accountId: toAccount.id,
        type: TransactionEntryTypeEnum.DEBIT,
        amount: transfer.toAmount,
        categoryId: null,
        categorySource: CategorySourceEnum.USER,
        mccCategoryId: null,
        externalId: transfer.externalId,
        exchangeRate: 1,
        toIban: null
    };

    const feeEntry: TransactionEntryCreateInputInterface = {
        accountId: feeAccount?.id ?? fromAccount.id,
        type: TransactionEntryTypeEnum.FEE,
        amount: transfer.feeAmount,
        categoryId: BANK_FEE_CATEGORY_ID,
        categorySource: CategorySourceEnum.FEE,
        mccCategoryId: null,
        externalId: `${transfer.externalId}${FEE_ENTRY_EXTERNAL_ID_SUFFIX}`,
        exchangeRate: 1,
        toIban: null
    };

    return {
        amount: transfer.fromAmount,
        title: transfer.description,
        comment: '',
        type: TransactionTypeEnum.TRANSFER,
        exchangeRate: 1,
        operatedAt: new Date(transfer.time * MILLISECONDS_PER_SECOND),
        externalId: transfer.externalId,
        updatedBy: null,
        externalSource: ExternalSourceEnum.BINANCE,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        tagIds: [],
        entries: hasFee ? [fromEntry, toEntry, feeEntry] : [fromEntry, toEntry]
    };
};
