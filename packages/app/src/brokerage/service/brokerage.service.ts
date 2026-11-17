import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    BankIntegrationRepository,
    CategorySourceEnum,
    Db,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTagsRepository,
    TransactionTypeEnum,
    UserIconNameEnum,
    convertToMicroUnits,
    generateSyncId
} from '@budgie/contracts';
import {
    AccountArchiveService,
    AccountBalanceIncrementalService,
    AccountService,
    BalanceAdjustmentService,
    TransactionService,
    TransferCreationService
} from '@budgie/ledger';
import { EntryBaseValuationService, YahooMarketDataService } from '@budgie/market';
import { min } from 'date-fns/min';
import { subSeconds } from 'date-fns/subSeconds';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { isSecurityInstrumentType } from '../../instrument/utils/is-security-instrument-type.util';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { roundHalfExpand } from '../../market-data/utils/round-half-expand.util';
import { InsufficientSecurityHoldingError } from '../error/insufficient-security-holding.error';
import { findBrokerageCashAccount } from '../utils/find-brokerage-cash-account.util';

import type { SecurityTradeFormValues } from '../constant/security-trade-form-schema.constant';
import type { BrokerageFundingDepositInterface } from '../interface/brokerage-funding-deposit.interface';
import type {
    AccountWithInstrumentEntityInterface,
    LiabilityAccountCreateInputInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';
import type { YahooListingInterface } from '@budgie/market';

export class BrokerageService extends Context.Service<BrokerageService>()('@budgie/app/BrokerageService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountService = yield* AccountService;
        const accountArchiveService = yield* AccountArchiveService;
        const balanceAdjustmentService = yield* BalanceAdjustmentService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const transferCreationService = yield* TransferCreationService;
        const transactionService = yield* TransactionService;
        const transactionRepository = yield* TransactionRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const yahooMarketDataService = yield* YahooMarketDataService;
        const historicalMarketDataDrainerService = yield* HistoricalMarketDataDrainerService;

        const buildEntry = (accountId: number, type: TransactionEntryTypeEnum, amount: number): TransactionEntryCreateInputInterface => ({
            accountId,
            type,
            amount,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            kind: TransactionEntryKindEnum.PRIMARY,
            exchangeRate: 1,
            toIban: null
        });

        const findIntegrationAccounts = (integrationId: number | null) =>
            isDefined(integrationId) ? accountRepository.findByIntegrationId(integrationId) : Effect.succeed([]);

        const findCashAccount = Effect.fnUntraced(function* ({ integrationId, instrument }: AccountWithInstrumentEntityInterface) {
            const accounts = yield* findIntegrationAccounts(integrationId);
            const cashAccount = findBrokerageCashAccount(accounts, instrument.quoteInstrumentId);

            return cashAccount ?? (yield* Effect.die(new Error('Brokerage cash account not found')));
        });

        const findOrRestoreAccount = Effect.fnUntraced(function* (accountId: number) {
            const active = yield* accountRepository.findById(accountId);

            if (isDefined(active)) {
                return active;
            }

            yield* accountArchiveService.restoreById(accountId);

            return yield* accountRepository.findById(accountId);
        });

        const findTradeCashAccount = Effect.fnUntraced(function* (
            security: AccountWithInstrumentEntityInterface,
            storedCashId: number,
            cashInstrumentId: number | null
        ) {
            const stored = yield* findOrRestoreAccount(storedCashId);
            const replacement = (yield* findIntegrationAccounts(security.integrationId)).find(
                account => account.instrumentId === cashInstrumentId && account.instrument.type === InstrumentTypeEnum.FIAT
            );

            return stored ?? replacement ?? (yield* Effect.die(new Error('Brokerage cash account not found')));
        });

        const buildTradeInput = Effect.fnUntraced(function* (
            security: AccountWithInstrumentEntityInterface,
            cash: AccountWithInstrumentEntityInterface,
            trade: SecurityTradeFormValues,
            isSell: boolean
        ) {
            const fee = roundHalfExpand(trade.fee, DEFAULT_DECIMAL_PLACES);
            const cashTotal = isPositiveNumber(trade.total) ? trade.total + (isSell ? fee : -fee) : trade.quantity * trade.price;
            const cashAmount = roundHalfExpand(cashTotal, DEFAULT_DECIMAL_PLACES);
            const quantityMicroUnits = convertToMicroUnits(trade.quantity);
            const { baseInstrumentId, baseAmount } = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: cash.id,
                amount: convertToMicroUnits(cashAmount),
                operatedAt: trade.operatedAt
            });
            const cashEntry = buildEntry(cash.id, isSell ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT, cashAmount);
            const securityEntry = {
                ...buildEntry(security.id, isSell ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT, trade.quantity),
                ...(isPositiveNumber(baseAmount) && { baseInstrumentId, baseAmount, baseExchangeRate: baseAmount / quantityMicroUnits }),
                quotedInstrumentId: cash.instrumentId,
                quotedUnitPrice: convertToMicroUnits(trade.price)
            };
            const feeEntries = isPositiveNumber(fee)
                ? [
                      {
                          ...buildEntry(cash.id, TransactionEntryTypeEnum.FEE, fee),
                          categoryId: BANK_FEE_CATEGORY_ID,
                          categorySource: CategorySourceEnum.FEE
                      }
                  ]
                : [];
            const [fromEntry, toEntry] = isSell ? [securityEntry, cashEntry] : [cashEntry, securityEntry];
            const input: TransactionCreateInputInterface = {
                amount: fromEntry.amount,
                title: security.instrument.symbol,
                comment: '',
                type: TransactionTypeEnum.TRANSFER,
                exchangeRate: 1,
                operatedAt: trade.operatedAt,
                externalId: null,
                updatedBy: null,
                externalSource: ExternalSourceEnum.MANUAL,
                fromAccountId: fromEntry.accountId,
                toAccountId: toEntry.accountId,
                tagIds: [],
                entries: [fromEntry, toEntry, ...feeEntries]
            };

            return input;
        });

        const planFunding = (movements: readonly BrokerageFundingDepositInterface[]) => {
            const deposits: BrokerageFundingDepositInterface[] = [];
            let balance = 0;

            for (const movement of movements) {
                balance += movement.amount;

                if (balance < 0) {
                    deposits.push({ operatedAt: subSeconds(movement.operatedAt, 1), amount: -balance });
                    balance = 0;
                }
            }

            return deposits;
        };

        const reconcileCash = Effect.fnUntraced(function* (cashAccountId: number, fundingTitle: string) {
            const movements = yield* accountBalanceRepository.getLedgerMovements(cashAccountId);
            const fundings = movements.filter(movement => movement.externalSource === ExternalSourceEnum.BROKERAGE_FUNDING);
            const deposits = planFunding(movements.filter(movement => movement.externalSource !== ExternalSourceEnum.BROKERAGE_FUNDING));
            const staleFundings = [...fundings];
            const missingDeposits = deposits.filter(deposit => {
                const index = staleFundings.findIndex(
                    funding => funding.amount === deposit.amount && funding.operatedAt.getTime() === deposit.operatedAt.getTime()
                );

                if (index < 0) {
                    return true;
                }

                staleFundings.splice(index, 1);

                return false;
            });

            if (isEmptyArray(staleFundings) && isEmptyArray(missingDeposits)) {
                return;
            }

            yield* Effect.forEach(staleFundings, funding => transactionRepository.deleteById(funding.transactionId), { discard: true });
            yield* Effect.forEach(
                missingDeposits,
                deposit =>
                    balanceAdjustmentService.createFromSource(cashAccountId, deposit.amount, deposit.operatedAt, {
                        title: fundingTitle,
                        externalSource: ExternalSourceEnum.BROKERAGE_FUNDING
                    }),
                { discard: true }
            );
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([cashAccountId]);
        });

        const reconcileFunding = Effect.fn('BrokerageService.reconcileFunding')(
            function* (fundingTitle: string) {
                const integrations = (yield* bankIntegrationRepository.findActive).filter(
                    integration => integration.provider === ExternalSourceEnum.MANUAL
                );
                const accounts = yield* Effect.forEach(integrations, integration => accountRepository.findByIntegrationId(integration.id));
                const cashAccounts = accounts
                    .flat()
                    .filter(account => account.type === AccountTypeEnum.STOCKS && account.instrument.type === InstrumentTypeEnum.FIAT);

                yield* Effect.forEach(cashAccounts, account => reconcileCash(account.id, fundingTitle), { discard: true });
            },
            effect => Db.transaction(effect)
        );

        const findSecurityAccount = Effect.fnUntraced(function* (accountId: number) {
            const account = yield* accountRepository.findById(accountId);

            return account ?? (yield* Effect.die(new Error('Security account not found')));
        });

        return {
            create: Effect.fn('BrokerageService.create')(
                function* (input: LiabilityAccountCreateInputInterface) {
                    const integration = yield* bankIntegrationRepository.create({
                        provider: ExternalSourceEnum.MANUAL,
                        token: generateSyncId(),
                        label: input.title
                    });

                    return yield* accountService.create({
                        ...input,
                        externalSource: ExternalSourceEnum.MANUAL,
                        integrationId: integration.id
                    });
                },
                effect => Db.transaction(effect)
            ),
            buy: Effect.fn('BrokerageService.buy')(function* (
                integrationId: number,
                listing: YahooListingInterface,
                trade: SecurityTradeFormValues,
                fundingTitle: string
            ) {
                const instrument = yield* yahooMarketDataService.resolveOrCreate(listing);
                const accountId = yield* Db.transaction(
                    Effect.gen(function* () {
                        const existing = (yield* accountRepository.findByIntegrationId(integrationId)).find(
                            account => account.instrumentId === instrument.id
                        );
                        const account =
                            existing ??
                            (yield* accountService.create({
                                title: instrument.name,
                                type: AccountTypeEnum.STOCKS,
                                icon: UserIconNameEnum.ChartLine,
                                instrumentId: instrument.id,
                                currentBalance: 0,
                                includeInNetWorth: true,
                                isActive: true,
                                externalSource: ExternalSourceEnum.MANUAL,
                                integrationId
                            }));

                        const security = yield* findSecurityAccount(account.id);
                        const cash = yield* findCashAccount(security);
                        const input = yield* buildTradeInput(security, cash, trade, false);

                        yield* transferCreationService.createSyncedTransfers([input]);
                        yield* reconcileCash(cash.id, fundingTitle);

                        return account.id;
                    })
                );

                yield* Effect.forkDetach(
                    findSecurityAccount(accountId).pipe(
                        Effect.flatMap(account => historicalMarketDataDrainerService.enqueueAccounts([account])),
                        Effect.tapCause(Effect.logError)
                    )
                );

                return accountId;
            }),
            sell: Effect.fn('BrokerageService.sell')(
                function* (accountId: number, trade: SecurityTradeFormValues, fundingTitle: string) {
                    const security = yield* findSecurityAccount(accountId);
                    const holding = yield* accountBalanceRepository.getMinimumLedgerBalanceFrom(accountId, trade.operatedAt);

                    if (convertToMicroUnits(trade.quantity) > holding) {
                        return yield* InsufficientSecurityHoldingError.make();
                    }

                    const cash = yield* findCashAccount(security);
                    const input = yield* buildTradeInput(security, cash, trade, true);

                    yield* transferCreationService.createSyncedTransfers([input]);
                    yield* reconcileCash(cash.id, fundingTitle);
                },
                effect => Db.transaction(effect)
            ),
            reconcileFunding,
            adoptFunding: Effect.fn('BrokerageService.adoptFunding')(
                function* (transactionId: number, fundingTitle: string) {
                    const transaction = yield* transactionRepository.getByIdRaw(transactionId);

                    if (transaction?.externalSource === ExternalSourceEnum.BROKERAGE_FUNDING) {
                        yield* transactionRepository.updateById(transactionId, { externalSource: null });
                    }

                    yield* reconcileFunding(fundingTitle);
                },
                effect => Db.transaction(effect)
            ),
            update: Effect.fn('BrokerageService.update')(
                function* (transactionId: number, trade: SecurityTradeFormValues, fundingTitle: string) {
                    const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

                    if (!isDefined(transaction)) {
                        return yield* Effect.die(new Error('Trade transaction not found'));
                    }

                    const from = yield* accountRepository.findByIdIncludingArchived(transaction.fromAccountId ?? 0);
                    const isSell = isDefined(from) && isSecurityInstrumentType(from.instrument.type);
                    const [storedSecurityId, storedCashId] = isSell
                        ? [transaction.fromAccountId, transaction.toAccountId]
                        : [transaction.toAccountId, transaction.fromAccountId];
                    const security = yield* findOrRestoreAccount(storedSecurityId ?? 0);

                    if (!isDefined(security) || !isSecurityInstrumentType(security.instrument.type)) {
                        return yield* Effect.die(new Error('Security account not found'));
                    }

                    const cashInstrumentId = transaction.entries.find(entry => entry.accountId === security.id)?.quotedInstrumentId ?? null;
                    const cash = yield* findTradeCashAccount(security, storedCashId ?? 0, cashInstrumentId);
                    const input = yield* buildTradeInput(security, cash, trade, isSell);
                    const tags = yield* transactionTagsRepository.findByTransactionId(transactionId);
                    const operatedFrom = min([transaction.operatedAt, trade.operatedAt]);
                    const securityBefore = yield* accountBalanceRepository.getMinimumLedgerBalanceFrom(security.id, operatedFrom);

                    yield* transactionService.updateById(transactionId, {
                        ...input,
                        title: transaction.title,
                        comment: transaction.comment,
                        tagIds: tags.map(tag => tag.tagId)
                    });

                    const securityAfter = yield* accountBalanceRepository.getMinimumLedgerBalanceFrom(security.id, operatedFrom);

                    if (securityAfter < Math.min(securityBefore, 0)) {
                        return yield* InsufficientSecurityHoldingError.make();
                    }

                    if (isDefined(security.integrationId) && cash.integrationId === security.integrationId) {
                        yield* reconcileCash(cash.id, fundingTitle);
                    }
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(BrokerageService, BrokerageService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            AccountRepository.layer,
            AccountService.layer,
            AccountArchiveService.layer,
            BalanceAdjustmentService.layer,
            AccountBalanceIncrementalService.layer,
            BankIntegrationRepository.layer,
            TransferCreationService.layer,
            TransactionService.layer,
            TransactionRepository.layer,
            TransactionTagsRepository.layer,
            EntryBaseValuationService.layer,
            YahooMarketDataService.layer,
            HistoricalMarketDataDrainerService.layer
        ])
    );
}
