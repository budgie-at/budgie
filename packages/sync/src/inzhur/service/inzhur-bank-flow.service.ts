import {
    AccountRepository,
    CategorySourceEnum,
    Db,
    DividendPayoutEnum,
    INVESTMENTS_CATEGORY_ID,
    InstrumentRepository,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { TransactionRuleRepository } from '@budgie/rules';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { INZHUR_BANK_DESCRIPTION_PATTERNS } from '../constant/inzhur-bank-description-patterns.constant';
import { INZHUR_UNATTRIBUTED_DIVIDEND_TITLE } from '../constant/inzhur-unattributed-dividend-title.constant';
import { InzhurBankFlowKindEnum } from '../enum/inzhur-bank-flow-kind.enum';
import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';
import { sumSignedAccountEntries } from '../utils/sum-signed-account-entries.util';

import { InzhurBeforeTrackingService } from './inzhur-before-tracking.service';
import { InzhurCashPairingService } from './inzhur-cash-pairing.service';
import { InzhurSetupLookupService } from './inzhur-setup-lookup.service';

import type { InzhurBankFlowSummaryInterface } from '../interface/inzhur-bank-flow-summary.interface';
import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { ConsolidationScanScopeInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class InzhurBankFlowService extends Context.Service<InzhurBankFlowService>()('@budgie/sync/InzhurBankFlowService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionRuleRepository = yield* TransactionRuleRepository;
        const transactionTransferService = yield* TransactionTransferService;
        const inzhurSetupLookupService = yield* InzhurSetupLookupService;
        const inzhurBeforeTrackingService = yield* InzhurBeforeTrackingService;
        const inzhurCashPairingService = yield* InzhurCashPairingService;
        const { counterparties, companyIbans, dividendKeywords, externalSources, withdrawalPhrases } = INZHUR_BANK_DESCRIPTION_PATTERNS;
        const topUpTitle = 'Top-up to Inzhur';
        const withdrawalTitle = 'Withdrawal from Inzhur';

        const normalizeIban = (iban: string) => iban.replaceAll(/\s+/gu, '').toUpperCase();

        const includesAny = (text: string, keywords: readonly string[]) => keywords.some(keyword => text.includes(keyword));

        const isUnprocessedDividend = (transaction: TransactionWithEntriesEntityInterface) => {
            const entry = transaction.entries.find(
                item => item.kind === TransactionEntryKindEnum.PRIMARY && item.type !== TransactionEntryTypeEnum.FEE
            );

            return (
                isDefined(entry) &&
                entry.categoryId !== INVESTMENTS_CATEGORY_ID &&
                (!isDefined(entry.categoryId) || entry.categorySource !== CategorySourceEnum.USER)
            );
        };

        const findFunds = Effect.fnUntraced(function* (setup: InzhurSetupInterface) {
            const instruments = yield* instrumentRepository.getAll();
            const refreshedAccounts = yield* Effect.forEach(setup.fundAccounts, account => accountRepository.findById(account.id));

            return refreshedAccounts.filter(isDefined).map(account => ({
                account,
                isin: instruments.find(instrument => instrument.id === account.instrumentId)?.code.toLowerCase() ?? ''
            }));
        });

        const attributeDividend = Effect.fnUntraced(function* (description: string, setup: InzhurSetupInterface) {
            const funds = yield* findFunds(setup);
            const named = funds.filter(
                ({ account, isin }) =>
                    description.includes(account.title.toLowerCase()) || (isNotEmptyString(isin) && description.includes(isin))
            );
            const namedFund = named.length === 1 ? named.at(0) : null;

            if (isDefined(namedFund)) {
                if (namedFund.account.dividendPayout !== DividendPayoutEnum.BANK) {
                    yield* accountRepository.updateById(namedFund.account.id, { dividendPayout: DividendPayoutEnum.BANK });
                }

                return namedFund.account;
            }

            const bankFunds = funds.filter(({ account }) => account.dividendPayout === DividendPayoutEnum.BANK);

            return bankFunds.length === 1 ? (bankFunds.at(0)?.account ?? null) : null;
        });

        const recordDividend = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            description: string,
            setup: InzhurSetupInterface
        ) {
            const fund = yield* attributeDividend(description, setup);

            if (isDefined(fund)) {
                yield* transactionRepository.updateById(transaction.id, { fundAccountId: fund.id });
            }

            yield* transactionRuleRepository.setCategoryByTransactionIds([transaction.id], INVESTMENTS_CATEGORY_ID);
            yield* transactionRepository.touchUpdatedAt(transaction.id);

            return fund?.id ?? null;
        });

        const retitleDividend = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            fundAccountId: number | null,
            setup: InzhurSetupInterface
        ) {
            const fund = setup.fundAccounts.find(account => account.id === fundAccountId);
            const title = isDefined(fund) ? `${fund.title.replace(/^Inzhur\s+/u, '')} dividends` : INZHUR_UNATTRIBUTED_DIVIDEND_TITLE;

            if (transaction.title === title || transaction.updatedBy === TransactionUpdatedByEnum.USER) {
                return;
            }

            const comment = transaction.comment.includes(transaction.title)
                ? transaction.comment
                : [transaction.title, transaction.comment].filter(isNotEmptyString).join(' · ');

            yield* transactionRepository.updateById(transaction.id, { title, comment });
        });

        const convertToCash = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            setup: InzhurSetupInterface
        ) {
            const isConverted = yield* transactionTransferService.convertToTransferAccount(transaction.id, setup.cashAccount.id);

            if (!isConverted) {
                return null;
            }

            const converted = yield* transactionRepository.getByIdWithEntries(transaction.id);
            const isPreSetup = transaction.operatedAt < setup.cashAccount.createdAt;

            return {
                kind: transaction.type === TransactionTypeEnum.EXPENSE ? InzhurBankFlowKindEnum.TOP_UP : InzhurBankFlowKindEnum.WITHDRAWAL,
                preSetupCashDelta: isPreSetup && isDefined(converted) ? sumSignedAccountEntries(converted.entries, setup.cashAccount.id) : 0
            };
        });

        const convertAndPair = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            setup: InzhurSetupInterface
        ) {
            const amountMicroUnits = transaction.entries.find(
                entry => entry.kind === TransactionEntryKindEnum.PRIMARY && entry.type !== TransactionEntryTypeEnum.FEE
            )?.amount;
            const placeholderId = isDefined(amountMicroUnits)
                ? yield* inzhurCashPairingService.findPlaceholderId(
                      setup.cashAccount.id,
                      transaction.type === TransactionTypeEnum.EXPENSE
                          ? InzhurOperationKindEnum.TOP_UP
                          : InzhurOperationKindEnum.WITHDRAWAL,
                      amountMicroUnits,
                      transaction.operatedAt
                  )
                : null;
            const outcome = yield* convertToCash(transaction, setup);

            if (!isDefined(outcome) || !isDefined(placeholderId)) {
                return outcome;
            }

            yield* inzhurCashPairingService.release(placeholderId);

            return { ...outcome, preSetupCashDelta: 0 };
        });

        const processTransaction = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            setup: InzhurSetupInterface
        ) {
            const description = `${transaction.title} ${transaction.comment}`
                .toLowerCase()
                .replaceAll(/[«»"'”“]/gu, '')
                .replaceAll(/\s+/gu, ' ');
            const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;
            const entryIbans = new Set(
                transaction.entries
                    .map(entry => entry.toIban)
                    .filter(isNotEmptyString)
                    .map(normalizeIban)
            );
            const isCompanyIban = isExpense && companyIbans.some(iban => entryIbans.has(iban));

            if (!includesAny(description, counterparties) && !isCompanyIban) {
                return null;
            }

            const isWithdrawalPhrase = !isExpense && includesAny(description, withdrawalPhrases);

            if (transaction.type !== TransactionTypeEnum.INCOME || isWithdrawalPhrase || !includesAny(description, dividendKeywords)) {
                return yield* convertAndPair(transaction, setup);
            }

            const isUnprocessed = isUnprocessedDividend(transaction);
            const fundAccountId = isUnprocessed ? yield* recordDividend(transaction, description, setup) : transaction.fundAccountId;

            yield* retitleDividend(transaction, fundAccountId, setup);

            return isUnprocessed ? { kind: InzhurBankFlowKindEnum.DIVIDEND, preSetupCashDelta: 0 } : null;
        });

        const convert = Effect.fn('InzhurBankFlowService.convert')(function* (
            setup: InzhurSetupInterface,
            scope: ConsolidationScanScopeInterface | null
        ) {
            const transactions = yield* transactionRepository.findIncomeAndExpenseByExternalSources(
                externalSources,
                scope?.transactionIds ?? null
            );
            const outcomes = (yield* Effect.forEach(transactions, transaction => processTransaction(transaction, setup))).filter(isDefined);

            yield* transactionRepository.retitleExternalTransfers(externalSources, setup.cashAccount.id, topUpTitle, withdrawalTitle);

            return {
                topUps: outcomes.filter(outcome => outcome.kind === InzhurBankFlowKindEnum.TOP_UP).length,
                withdrawals: outcomes.filter(outcome => outcome.kind === InzhurBankFlowKindEnum.WITHDRAWAL).length,
                dividends: outcomes.filter(outcome => outcome.kind === InzhurBankFlowKindEnum.DIVIDEND).length,
                preSetupCashDelta: outcomes.reduce((sum, outcome) => sum + outcome.preSetupCashDelta, 0)
            } satisfies InzhurBankFlowSummaryInterface;
        });

        return {
            convert,
            apply: Effect.fn('InzhurBankFlowService.apply')(function* (scope: ConsolidationScanScopeInterface | null) {
                const setup = yield* inzhurSetupLookupService.findSetup();

                if (!isDefined(setup)) {
                    return 0;
                }

                return yield* Db.transaction(
                    Effect.gen(function* () {
                        const summary = yield* convert(setup, scope);

                        if (summary.preSetupCashDelta !== 0) {
                            yield* inzhurBeforeTrackingService.shift(
                                setup.cashAccount.id,
                                -summary.preSetupCashDelta,
                                setup.fundAccounts.map(account => account.id)
                            );
                        }

                        return summary.topUps + summary.withdrawals;
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurBankFlowService, InzhurBankFlowService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            InstrumentRepository.layer,
            TransactionRepository.layer,
            TransactionRuleRepository.layer,
            TransactionTransferService.layer,
            InzhurSetupLookupService.layer,
            InzhurBeforeTrackingService.layer,
            InzhurCashPairingService.layer
        ])
    );
}
