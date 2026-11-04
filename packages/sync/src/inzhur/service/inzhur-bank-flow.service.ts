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
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { TransactionRuleRepository } from '@budgie/rules';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { INZHUR_BANK_DESCRIPTION_PATTERNS } from '../constant/inzhur-bank-description-patterns.constant';

import { InzhurSetupService } from './inzhur-setup.service';

import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { ConsolidationScanScopeInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class InzhurBankFlowService extends Context.Service<InzhurBankFlowService>()('@budgie/sync/InzhurBankFlowService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionRuleRepository = yield* TransactionRuleRepository;
        const transactionTransferService = yield* TransactionTransferService;
        const inzhurSetupService = yield* InzhurSetupService;
        const { counterparties, dividendKeywords, externalSources } = INZHUR_BANK_DESCRIPTION_PATTERNS;

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
        });

        const processTransaction = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            setup: InzhurSetupInterface
        ) {
            const description = `${transaction.title} ${transaction.comment}`
                .toLowerCase()
                .replaceAll(/[«»"'”“]/gu, '')
                .replaceAll(/\s+/gu, ' ');

            if (transaction.operatedAt < setup.cashAccount.createdAt || !includesAny(description, counterparties)) {
                return false;
            }

            if (transaction.type !== TransactionTypeEnum.INCOME || !includesAny(description, dividendKeywords)) {
                return yield* transactionTransferService.convertToTransferAccount(transaction.id, setup.cashAccount.id);
            }

            if (isUnprocessedDividend(transaction)) {
                yield* recordDividend(transaction, description, setup);
            }

            return false;
        });

        const applyInTransaction = Effect.fnUntraced(function* (
            scope: ConsolidationScanScopeInterface | null,
            setup: InzhurSetupInterface
        ) {
            const transactions = yield* transactionRepository.findIncomeAndExpenseByExternalSources(
                externalSources,
                scope?.transactionIds ?? null
            );
            let moved = 0;

            for (const transaction of transactions) {
                if (yield* processTransaction(transaction, setup)) {
                    moved += 1;
                }
            }

            return moved;
        });

        return {
            apply: Effect.fn('InzhurBankFlowService.apply')(function* (scope: ConsolidationScanScopeInterface | null) {
                const setup = yield* inzhurSetupService.findSetup();

                if (!isDefined(setup)) {
                    return 0;
                }

                return yield* Db.transaction(applyInTransaction(scope, setup));
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
            InzhurSetupService.layer
        ])
    );
}
