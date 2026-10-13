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

const FEE_ENTRY_EXTERNAL_ID_SUFFIX = ':fee';
const MILLISECONDS_PER_SECOND = 1000;

const buildEntry = (
    accountId: number,
    type: TransactionEntryTypeEnum,
    amount: number,
    externalId: string
): TransactionEntryCreateInputInterface => ({
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
});

export const mapBinanceTransfersToInputs = <E, R>(
    transfers: BinanceTransferInterface[],
    resolveAccount: (codecAccountId: string) => Effect.Effect<AccountEntityInterface | null, E, R>
) =>
    Effect.gen(function* () {
        const inputs: TransactionCreateInputInterface[] = [];

        for (const transfer of transfers) {
            const fromAccount = yield* resolveAccount(transfer.fromAssetAccountId);
            const toAccount = yield* resolveAccount(transfer.toAssetAccountId);
            if (isDefined(fromAccount) && isDefined(toAccount)) {
                const feeAccount = isDefined(transfer.feeAssetAccountId) ? yield* resolveAccount(transfer.feeAssetAccountId) : null;
                const feeEntries =
                    isPositiveNumber(transfer.feeAmount) && isDefined(feeAccount)
                        ? [
                              {
                                  ...buildEntry(
                                      feeAccount.id,
                                      TransactionEntryTypeEnum.FEE,
                                      transfer.feeAmount,
                                      `${transfer.externalId}${FEE_ENTRY_EXTERNAL_ID_SUFFIX}`
                                  ),
                                  categoryId: BANK_FEE_CATEGORY_ID,
                                  categorySource: CategorySourceEnum.FEE
                              }
                          ]
                        : [];

                inputs.push({
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
                    entries: [
                        buildEntry(fromAccount.id, TransactionEntryTypeEnum.CREDIT, transfer.fromAmount, transfer.externalId),
                        buildEntry(toAccount.id, TransactionEntryTypeEnum.DEBIT, transfer.toAmount, transfer.externalId),
                        ...feeEntries
                    ]
                });
            }
        }

        return inputs;
    });
