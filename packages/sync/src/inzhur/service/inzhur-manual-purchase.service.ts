import { Db, TransactionEntryTypeEnum, TransactionRepository, TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { TransferCreationService } from '@budgie/ledger';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Random from 'effect/Random';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { INZHUR_BANK_DESCRIPTION_PATTERNS } from '../constant/inzhur-bank-description-patterns.constant';
import { INZHUR_MANUAL_EXTERNAL_ID_PREFIX } from '../constant/inzhur-manual-external-id-prefix.constant';
import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { buildInzhurTradeEntries } from '../utils/build-inzhur-trade-entries.util';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';
import { getKyivDayStart } from '../utils/get-kyiv-day-start.util';

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

            const toShortName = (name: string) => name.replace(/^Inzhur\s+/iu, '');

            const findTopUps = Effect.fnUntraced(function* () {
                const setup = yield* inzhurSetupLookupService.findSetup();

                if (!isDefined(setup) || !isDefined(setup.lastStatementDate)) {
                    return [];
                }

                const cashAccountId = setup.cashAccount.id;
                const coverageEnd = getKyivDayStart(setup.lastStatementDate, 1);
                const ledger = yield* transactionRepository.findByAccountIdsWithEntries([cashAccountId]);
                const purchases = ledger.filter(transaction => transaction.externalId?.startsWith(INZHUR_MANUAL_EXTERNAL_ID_PREFIX));

                return ledger.flatMap((transaction): InzhurPendingTopUpInterface[] => {
                    const cashEntry = transaction.entries.find(entry => entry.accountId === cashAccountId);
                    const isBankTopUp =
                        transaction.type === TransactionTypeEnum.TRANSFER &&
                        INZHUR_BANK_DESCRIPTION_PATTERNS.externalSources.some(source => source === transaction.externalSource) &&
                        cashEntry?.type === TransactionEntryTypeEnum.DEBIT &&
                        !cashEntry.externalId?.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX);

                    if (!isBankTopUp || transaction.operatedAt < coverageEnd) {
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
                            operatedAt: transaction.operatedAt,
                            amount: convertFromMicroUnits(cashEntry.amount),
                            spentAmount: convertFromMicroUnits(spent),
                            remainingAmount: convertFromMicroUnits(Math.max(cashEntry.amount - spent, 0))
                        }
                    ];
                });
            });

            return {
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
                            return yield* Effect.die(new Error('Inzhur is not set up'));
                        }

                        if (
                            !Number.isInteger(input.certificates) ||
                            !isPositiveNumber(input.certificates) ||
                            !isPositiveNumber(input.amount)
                        ) {
                            return yield* Effect.die(new Error('A purchase needs a whole number of certificates and a positive amount'));
                        }

                        const account = yield* inzhurFundAccountService.ensureByName(setup, input.fundName);
                        const createdAt = yield* Clock.currentTimeMillis;
                        const nonce = (yield* Random.nextInt).toString(36);
                        const externalId = `${INZHUR_MANUAL_EXTERNAL_ID_PREFIX}${input.topUpTransactionId}:${createdAt}-${nonce}`;

                        yield* transferCreationService.createSyncedTransfers([
                            buildInzhurTransactionInput(
                                `Bought ${toShortName(account.title)}`,
                                externalId,
                                input.operatedAt,
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
