import {
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { buildPrimaryEntry } from '../../core/utils/build-primary-entry.util';
import { INZHUR_BANK_DESCRIPTION_PATTERNS } from '../constant/inzhur-bank-description-patterns.constant';
import { INZHUR_BANK_FLOW_TITLES } from '../constant/inzhur-bank-flow-titles.constant';
import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { INZHUR_PAIRING_WINDOW_MILLISECONDS } from '../constant/inzhur-pairing-window.constant';
import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';
import { isInzhurPeriod } from '../utils/is-inzhur-period.util';

import { InzhurBankFlowService } from './inzhur-bank-flow.service';
import { InzhurCashPairingService } from './inzhur-cash-pairing.service';

import type { InzhurBankPairingInterface } from '../interface/inzhur-bank-pairing.interface';
import type { InzhurPairingPeriodInterface } from '../interface/inzhur-pairing-period.interface';
import type { InzhurPlannedActionInterface } from '../interface/inzhur-planned-action.interface';
import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class InzhurOperationsBankPairingService extends Context.Service<InzhurOperationsBankPairingService>()(
    '@budgie/sync/InzhurOperationsBankPairingService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const inzhurBankFlowService = yield* InzhurBankFlowService;
            const inzhurCashPairingService = yield* InzhurCashPairingService;

            const pickNearest = (
                candidates: readonly TransactionWithEntriesEntityInterface[],
                action: InzhurPlannedActionInterface,
                claimedIds: ReadonlySet<number>,
                matchesEntry: (entry: TransactionWithEntriesEntityInterface['entries'][number]) => boolean
            ) => {
                const distanceOf = (transaction: TransactionWithEntriesEntityInterface) =>
                    Math.abs(transaction.operatedAt.getTime() - action.occurredAt.getTime());

                return (
                    candidates
                        .filter(
                            transaction =>
                                !claimedIds.has(transaction.id) &&
                                distanceOf(transaction) <= INZHUR_PAIRING_WINDOW_MILLISECONDS &&
                                transaction.entries.some(matchesEntry)
                        )
                        .sort((left, right) => distanceOf(left) - distanceOf(right))
                        .at(0) ?? null
                );
            };

            const findBankTransfer = (
                bankTransfers: readonly TransactionWithEntriesEntityInterface[],
                action: InzhurPlannedActionInterface,
                cashAccountId: number,
                claimedIds: ReadonlySet<number>
            ) => {
                const entryType =
                    action.kind === InzhurOperationKindEnum.TOP_UP ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
                const amountMicroUnits = convertToMicroUnits(action.cashAmount);

                return pickNearest(
                    bankTransfers,
                    action,
                    claimedIds,
                    entry => entry.accountId === cashAccountId && entry.type === entryType && entry.amount === amountMicroUnits
                );
            };

            const findBankIncome = (
                bankIncome: readonly TransactionWithEntriesEntityInterface[],
                action: InzhurPlannedActionInterface,
                claimedIds: ReadonlySet<number>
            ) => {
                const amountMicroUnits = convertToMicroUnits(action.cashAmount);

                return pickNearest(
                    bankIncome,
                    action,
                    claimedIds,
                    entry =>
                        entry.kind === TransactionEntryKindEnum.PRIMARY &&
                        entry.type !== TransactionEntryTypeEnum.FEE &&
                        entry.amount === amountMicroUnits
                );
            };

            const buildFlowInput = (action: InzhurPlannedActionInterface, cashAccountId: number) => {
                const isTopUp = action.kind === InzhurOperationKindEnum.TOP_UP;
                const entry = buildPrimaryEntry(
                    cashAccountId,
                    isTopUp ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                    action.cashAmount,
                    action.externalId
                );

                return {
                    ...buildInzhurTransactionInput(
                        isTopUp ? INZHUR_BANK_FLOW_TITLES.topUp : INZHUR_BANK_FLOW_TITLES.withdrawal,
                        action.externalId,
                        action.occurredAt,
                        [entry]
                    ),
                    type: TransactionTypeEnum.TRANSFER
                };
            };

            const plan = Effect.fn('InzhurOperationsBankPairingService.plan')(function* (
                setup: InzhurSetupInterface,
                actions: readonly InzhurPlannedActionInterface[],
                ledger: readonly TransactionWithEntriesEntityInterface[],
                period: InzhurPairingPeriodInterface
            ) {
                const existingIds = new Set(
                    ledger.flatMap(transaction => (isDefined(transaction.externalId) ? [transaction.externalId] : []))
                );
                const bankIncome = (yield* transactionRepository.findIncomeAndExpenseByExternalSources(
                    INZHUR_BANK_DESCRIPTION_PATTERNS.externalSources,
                    null
                )).filter(
                    transaction => transaction.type === TransactionTypeEnum.INCOME && inzhurBankFlowService.isInzhurPayment(transaction)
                );
                const isBankTransfer = (transaction: TransactionWithEntriesEntityInterface) =>
                    transaction.type === TransactionTypeEnum.TRANSFER &&
                    INZHUR_BANK_DESCRIPTION_PATTERNS.externalSources.some(source => source === transaction.externalSource);
                const bankTransfers = ledger.filter(isBankTransfer);
                const stampedBankByOperationId = new Map<string, TransactionWithEntriesEntityInterface>(
                    bankTransfers.flatMap(transaction =>
                        transaction.entries
                            .filter(
                                entry =>
                                    entry.accountId === setup.cashAccount.id &&
                                    entry.externalId?.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX)
                            )
                            .flatMap(entry => (isDefined(entry.externalId) ? [[entry.externalId, transaction] as const] : []))
                    )
                );
                const claimedBankIds = new Set([...stampedBankByOperationId.values()].map(transaction => transaction.id));
                const stampInputs: { readonly transactionId: number; readonly externalId: string }[] = [];
                const incomeClaims: InzhurBankPairingInterface['incomeClaims'][number][] = [];
                let paired = 0;
                let unpaired = 0;
                const placeholderInputs = [];

                for (const action of actions.filter(
                    item => item.kind === InzhurOperationKindEnum.TOP_UP || item.kind === InzhurOperationKindEnum.WITHDRAWAL
                )) {
                    const isKnown = stampedBankByOperationId.has(action.externalId) || existingIds.has(action.externalId);
                    const bankTransfer = isKnown ? null : findBankTransfer(bankTransfers, action, setup.cashAccount.id, claimedBankIds);
                    const bankDividend =
                        isKnown || isDefined(bankTransfer) || action.kind !== InzhurOperationKindEnum.WITHDRAWAL
                            ? null
                            : findBankIncome(bankIncome, action, claimedBankIds);

                    if (stampedBankByOperationId.has(action.externalId)) {
                        paired += 1;
                    } else if (isDefined(bankTransfer)) {
                        claimedBankIds.add(bankTransfer.id);
                        stampInputs.push({ transactionId: bankTransfer.id, externalId: action.externalId });
                        paired += 1;
                    } else if (isDefined(bankDividend)) {
                        claimedBankIds.add(bankDividend.id);
                        incomeClaims.push({
                            transaction: bankDividend,
                            externalId: action.externalId,
                            fallback: buildFlowInput(action, setup.cashAccount.id)
                        });
                        paired += 1;
                    } else {
                        unpaired += 1;

                        if (!existingIds.has(action.externalId)) {
                            placeholderInputs.push(buildFlowInput(action, setup.cashAccount.id));
                        }
                    }
                }

                const unmatchedBankCount = ledger.filter(
                    transaction =>
                        isBankTransfer(transaction) &&
                        !claimedBankIds.has(transaction.id) &&
                        isInzhurPeriod(transaction, period) &&
                        transaction.entries.some(entry => entry.accountId === setup.cashAccount.id)
                ).length;

                return {
                    stampInputs,
                    incomeClaims,
                    placeholderInputs,
                    paired,
                    unpaired,
                    unmatchedBankCount
                } satisfies InzhurBankPairingInterface;
            });

            return {
                plan,
                apply: Effect.fn('InzhurOperationsBankPairingService.apply')(function* (
                    setup: InzhurSetupInterface,
                    pairing: InzhurBankPairingInterface
                ) {
                    for (const { transactionId, externalId } of pairing.stampInputs) {
                        yield* inzhurCashPairingService.stamp(transactionId, setup.cashAccount.id, externalId);
                    }

                    const failedClaimFallbacks: InzhurBankPairingInterface['placeholderInputs'][number][] = [];

                    for (const { transaction, externalId, fallback } of pairing.incomeClaims) {
                        if (yield* inzhurBankFlowService.claimAsWithdrawal(transaction, setup)) {
                            yield* inzhurCashPairingService.stamp(transaction.id, setup.cashAccount.id, externalId);
                        } else {
                            failedClaimFallbacks.push(fallback);
                        }
                    }

                    return failedClaimFallbacks;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurOperationsBankPairingService, InzhurOperationsBankPairingService.make).pipe(
        Layer.provide([TransactionRepository.layer, InzhurBankFlowService.layer, InzhurCashPairingService.layer])
    );
}
