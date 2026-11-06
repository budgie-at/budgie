import { Db, TransactionEntryTypeEnum, TransactionRepository, convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { TransferCreationService } from '@budgie/ledger';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Random from 'effect/Random';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { INZHUR_BANK_DESCRIPTION_PATTERNS } from '../constant/inzhur-bank-description-patterns.constant';
import { INZHUR_MANUAL_EXTERNAL_ID_PREFIX } from '../constant/inzhur-manual-external-id-prefix.constant';
import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { InzhurNotSetUpError } from '../error/inzhur-not-set-up.error';
import { InzhurPurchaseBeforeTopUpError } from '../error/inzhur-purchase-before-top-up.error';
import { InzhurPurchaseExceedsTopUpError } from '../error/inzhur-purchase-exceeds-top-up.error';
import { InzhurPurchaseInvalidError } from '../error/inzhur-purchase-invalid.error';
import { InzhurTopUpNotFoundError } from '../error/inzhur-top-up-not-found.error';
import { buildInzhurTradeEntries } from '../utils/build-inzhur-trade-entries.util';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';
import { getKyivDayStart } from '../utils/get-kyiv-day-start.util';
import { toInzhurShortName } from '../utils/to-inzhur-short-name.util';
import { toKyivDay } from '../utils/to-kyiv-day.util';

import { InzhurFundAccountService } from './inzhur-fund-account.service';
import { InzhurSetupLookupService } from './inzhur-setup-lookup.service';

import type { InzhurManualPurchaseInputInterface } from '../interface/inzhur-manual-purchase-input.interface';
import type { InzhurPendingTopUpInterface } from '../interface/inzhur-pending-top-up.interface';

export class InzhurManualPurchaseService extends Context.Service<InzhurManualPurchaseService>()(
    '@budgie/sync/InzhurManualPurchaseService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const transferCreationService = yield* TransferCreationService;
            const inzhurFundAccountService = yield* InzhurFundAccountService;
            const inzhurSetupLookupService = yield* InzhurSetupLookupService;

            const noonOffsetMilliseconds = 12 * 60 * 60 * 1000;

            const findTopUps = Effect.fnUntraced(function* () {
                const setup = yield* inzhurSetupLookupService.findSetup();
                const lastOperationAt = setup?.cashSync.forwardSyncedAt;

                if (!isDefined(setup) || !isDefined(lastOperationAt)) {
                    return [];
                }

                const cashAccountId = setup.cashAccount.id;
                const bankTransfers = yield* transactionRepository.findTransfersIntoAccountSince(
                    cashAccountId,
                    lastOperationAt,
                    INZHUR_BANK_DESCRIPTION_PATTERNS.externalSources
                );
                const purchases = yield* transactionRepository.findTransfersFromAccountByExternalIdPrefix(
                    cashAccountId,
                    INZHUR_MANUAL_EXTERNAL_ID_PREFIX
                );

                return bankTransfers.flatMap((transaction): InzhurPendingTopUpInterface[] => {
                    const cashEntry = transaction.entries.find(entry => entry.accountId === cashAccountId);

                    if (
                        !isDefined(transaction.externalId) ||
                        cashEntry?.type !== TransactionEntryTypeEnum.DEBIT ||
                        cashEntry.externalId?.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX) === true
                    ) {
                        return [];
                    }

                    const spent = purchases
                        .filter(purchase => purchase.externalId?.startsWith(`${INZHUR_MANUAL_EXTERNAL_ID_PREFIX}${transaction.id}:`))
                        .reduce(
                            (sum, purchase) =>
                                sum +
                                (purchase.entries.find(
                                    entry => entry.accountId === cashAccountId && entry.type === TransactionEntryTypeEnum.CREDIT
                                )?.amount ?? 0),
                            0
                        );

                    return [
                        {
                            transactionId: transaction.id,
                            externalId: transaction.externalId,
                            operatedAt: transaction.operatedAt,
                            amount: convertFromMicroUnits(cashEntry.amount),
                            spentAmount: convertFromMicroUnits(spent),
                            remainingAmount: convertFromMicroUnits(Math.max(cashEntry.amount - spent, 0))
                        }
                    ];
                });
            });

            return {
                findFundTitlesByRecentPurchase: Effect.fn('InzhurManualPurchaseService.findFundTitlesByRecentPurchase')(function* () {
                    const setup = yield* inzhurSetupLookupService.findSetup();

                    if (!isDefined(setup)) {
                        return [];
                    }

                    const transfers = yield* transactionRepository.findTransfersFromAccountByExternalIdPrefix(
                        setup.cashAccount.id,
                        'inzhur:'
                    );
                    const titleByFundAccountId = new Map(setup.fundAccounts.map(account => [account.id, account.title]));
                    const titles = [...transfers]
                        .sort((first, second) => second.operatedAt.getTime() - first.operatedAt.getTime() || second.id - first.id)
                        .map(transfer => (isDefined(transfer.toAccountId) ? titleByFundAccountId.get(transfer.toAccountId) : null))
                        .filter(isDefined);

                    return [...new Set(titles)];
                }),
                findTopUp: Effect.fn('InzhurManualPurchaseService.findTopUp')(function* (topUpTransactionId: number) {
                    return (yield* findTopUps()).find(topUp => topUp.transactionId === topUpTransactionId) ?? null;
                }),
                findPendingTopUps: Effect.fn('InzhurManualPurchaseService.findPendingTopUps')(function* () {
                    return (yield* findTopUps()).filter(topUp => !isPositiveNumber(topUp.spentAmount));
                }),
                recordPurchase: Effect.fn('InzhurManualPurchaseService.recordPurchase')(
                    function* (input: InzhurManualPurchaseInputInterface) {
                        const setup = yield* inzhurSetupLookupService.findSetup();

                        if (!isDefined(setup)) {
                            return yield* InzhurNotSetUpError.make();
                        }

                        if (
                            !Number.isInteger(input.certificates) ||
                            !isPositiveNumber(input.certificates) ||
                            !isPositiveNumber(input.amount)
                        ) {
                            return yield* InzhurPurchaseInvalidError.make();
                        }

                        const topUp = (yield* findTopUps()).find(item => item.transactionId === input.topUpTransactionId);

                        if (!isDefined(topUp)) {
                            return yield* InzhurTopUpNotFoundError.make({ topUpTransactionId: input.topUpTransactionId });
                        }

                        const purchaseDay = toKyivDay(input.operatedAt);

                        if (purchaseDay < toKyivDay(topUp.operatedAt)) {
                            return yield* InzhurPurchaseBeforeTopUpError.make();
                        }

                        if (convertToMicroUnits(input.amount) > convertToMicroUnits(topUp.remainingAmount)) {
                            return yield* InzhurPurchaseExceedsTopUpError.make({ remainingAmount: topUp.remainingAmount });
                        }

                        const operatedAt = DateTime.toDateUtc(
                            DateTime.makeUnsafe(getKyivDayStart(purchaseDay).getTime() + noonOffsetMilliseconds)
                        );
                        const account = yield* inzhurFundAccountService.ensureByName(setup, input.fundName);
                        const createdAt = yield* Clock.currentTimeMillis;
                        const nonce = (yield* Random.nextInt).toString(36);
                        const externalId = `${INZHUR_MANUAL_EXTERNAL_ID_PREFIX}${input.topUpTransactionId}:${createdAt}-${nonce}`;

                        yield* transferCreationService.createSyncedTransfers([
                            buildInzhurTransactionInput(
                                `Bought ${toInzhurShortName(account.title)}`,
                                externalId,
                                operatedAt,
                                buildInzhurTradeEntries({
                                    isSell: false,
                                    externalId,
                                    cashAccountId: setup.cashAccount.id,
                                    fundAccountId: account.id,
                                    cashAmount: input.amount,
                                    quantity: input.certificates
                                })
                            )
                        ]);

                        return account.id;
                    },
                    effect => Db.transaction(effect)
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurManualPurchaseService, InzhurManualPurchaseService.make).pipe(
        Layer.provide([
            TransactionRepository.layer,
            TransferCreationService.layer,
            InzhurFundAccountService.layer,
            InzhurSetupLookupService.layer
        ])
    );
}
