import {
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { getLogger } from '@budgie/logger';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { AccountEntityInterface, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';
import type { BinanceTransferInterface } from '@budgie/sync';

export class BinanceTransferInputMapper {
    private static readonly FEE_ENTRY_EXTERNAL_ID_SUFFIX = ':fee';
    private static readonly MILLISECONDS_PER_SECOND = 1000;
    private static readonly logger = getLogger('BinanceTransferInputMapper');

    constructor(private readonly resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>) {}

    async map(transfers: BinanceTransferInterface[]): Promise<TransactionCreateInputInterface[]> {
        return (await Promise.all(transfers.map(transfer => this.mapTransfer(transfer)))).filter(isDefined);
    }

    private async mapTransfer(transfer: BinanceTransferInterface): Promise<TransactionCreateInputInterface | null> {
        const fromAccount = await this.resolveAccount(transfer.fromAssetAccountId);
        const toAccount = await this.resolveAccount(transfer.toAssetAccountId);
        if (!isDefined(fromAccount) || !isDefined(toAccount)) {
            return null;
        }

        const feeAccount = isDefined(transfer.feeAssetAccountId) ? await this.resolveAccount(transfer.feeAssetAccountId) : null;
        const entries = [
            this.buildEntry(fromAccount.id, TransactionEntryTypeEnum.CREDIT, transfer.fromAmount, transfer.externalId),
            this.buildEntry(toAccount.id, TransactionEntryTypeEnum.DEBIT, transfer.toAmount, transfer.externalId)
        ];
        if (isPositiveNumber(transfer.feeAmount) && isDefined(feeAccount)) {
            entries.push({
                ...this.buildEntry(
                    feeAccount.id,
                    TransactionEntryTypeEnum.FEE,
                    transfer.feeAmount,
                    `${transfer.externalId}${BinanceTransferInputMapper.FEE_ENTRY_EXTERNAL_ID_SUFFIX}`
                ),
                categoryId: BANK_FEE_CATEGORY_ID,
                categorySource: CategorySourceEnum.FEE
            });
        }
        if (isPositiveNumber(transfer.feeAmount) && !isDefined(feeAccount)) {
            BinanceTransferInputMapper.logger.log('mapTransfer:skip-unresolved-fee-asset', {
                externalId: transfer.externalId,
                feeAssetAccountId: transfer.feeAssetAccountId ?? null
            });
        }

        return {
            amount: transfer.fromAmount,
            title: transfer.description,
            comment: '',
            type: TransactionTypeEnum.TRANSFER,
            exchangeRate: 1,
            operatedAt: new Date(transfer.time * BinanceTransferInputMapper.MILLISECONDS_PER_SECOND),
            externalId: transfer.externalId,
            updatedBy: null,
            externalSource: ExternalSourceEnum.BINANCE,
            fromAccountId: fromAccount.id,
            toAccountId: toAccount.id,
            tagIds: [],
            entries
        };
    }

    private buildEntry(
        accountId: number,
        type: TransactionEntryTypeEnum,
        amount: number,
        externalId: string
    ): TransactionEntryCreateInputInterface {
        return {
            accountId,
            type,
            amount,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            kind: TransactionEntryKindEnum.PRIMARY,
            externalId,
            exchangeRate: 1,
            toIban: null
        };
    }
}
