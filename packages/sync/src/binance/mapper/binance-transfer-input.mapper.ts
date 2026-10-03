import {
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { AccountEntityInterface, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

export class BinanceTransferInputMapper<E, R> {
    private static readonly FEE_ENTRY_EXTERNAL_ID_SUFFIX = ':fee';
    private static readonly MILLISECONDS_PER_SECOND = 1000;

    readonly map = Effect.fn('BinanceTransferInputMapper.map')(function* (
        this: BinanceTransferInputMapper<E, R>,
        transfers: BinanceTransferInterface[]
    ) {
        return (yield* Effect.forEach(transfers, transfer => this.mapTransfer(transfer))).filter(isDefined);
    });

    private readonly mapTransfer = Effect.fnUntraced(function* (
        this: BinanceTransferInputMapper<E, R>,
        transfer: BinanceTransferInterface
    ) {
        const fromAccount = yield* this.resolveAccount(transfer.fromAssetAccountId);
        const toAccount = yield* this.resolveAccount(transfer.toAssetAccountId);
        if (!isDefined(fromAccount) || !isDefined(toAccount)) {
            return null;
        }

        const feeAccount = isDefined(transfer.feeAssetAccountId) ? yield* this.resolveAccount(transfer.feeAssetAccountId) : null;
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
        const input: TransactionCreateInputInterface = {
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

        return input;
    });

    constructor(private readonly resolveAccount: (codecAccountId: string) => Effect.Effect<AccountEntityInterface | null, E, R>) {}

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
