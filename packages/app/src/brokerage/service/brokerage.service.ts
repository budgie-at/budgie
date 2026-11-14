import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    BankIntegrationRepository,
    CategorySourceEnum,
    Db,
    ExternalSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTagsRepository,
    TransactionTypeEnum,
    UserIconNameEnum,
    convertToMicroUnits,
    generateSyncId
} from '@budgie/contracts';
import { AccountService, BalanceAdjustmentService, TransactionService, TransferCreationService } from '@budgie/ledger';
import { EntryBaseValuationService, YahooMarketDataService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { isSecurityInstrumentType } from '../../instrument/utils/is-security-instrument-type.util';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { roundHalfExpand } from '../../market-data/utils/round-half-expand.util';
import { InsufficientSecurityHoldingError } from '../error/insufficient-security-holding.error';
import { findBrokerageCashAccount } from '../utils/find-brokerage-cash-account.util';

import type { SecurityTradeFormValues } from '../constant/security-trade-form-schema.constant';
import type {
    AccountWithInstrumentEntityInterface,
    LiabilityAccountCreateInputInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';
import type { YahooListingInterface } from '@budgie/market';

export class BrokerageService extends Context.Service<BrokerageService>()('@budgie/app/BrokerageService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountService = yield* AccountService;
        const balanceAdjustmentService = yield* BalanceAdjustmentService;
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

        const findCashAccount = Effect.fnUntraced(function* ({ integrationId, instrument }: AccountWithInstrumentEntityInterface) {
            const accounts = isDefined(integrationId) ? yield* accountRepository.findByIntegrationId(integrationId) : [];
            const cashAccount = findBrokerageCashAccount(accounts, instrument.quoteInstrumentId);

            return cashAccount ?? (yield* Effect.die(new Error('Brokerage cash account not found')));
        });

        const netAccountChange = (
            entries: readonly Pick<TransactionEntryEntityInterface, 'accountId' | 'amount' | 'type'>[],
            accountId: number
        ) =>
            entries
                .filter(entry => entry.accountId === accountId)
                .reduce((total, entry) => total + (entry.type === TransactionEntryTypeEnum.DEBIT ? entry.amount : -entry.amount), 0);

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

        const settleTrade = Effect.fnUntraced(function* (
            input: TransactionCreateInputInterface,
            previousEntries: readonly Pick<TransactionEntryEntityInterface, 'accountId' | 'amount' | 'type'>[],
            fundingTitle: string | null
        ) {
            const isSell = !isDefined(fundingTitle);
            const [securityId, cashId] = isSell ? [input.fromAccountId, input.toAccountId] : [input.toAccountId, input.fromAccountId];
            const entries = input.entries.map(entry => ({ ...entry, amount: convertToMicroUnits(entry.amount) }));
            const holdingChange = netAccountChange(entries, securityId ?? 0) - netAccountChange(previousEntries, securityId ?? 0);

            if (holdingChange < 0) {
                const holding = yield* accountBalanceRepository.getMinimumLedgerBalanceFrom(securityId ?? 0, input.operatedAt);

                if (holding + holdingChange < 0) {
                    return yield* InsufficientSecurityHoldingError.make();
                }
            }

            if (isSell) {
                return;
            }

            const cashChange = netAccountChange(entries, cashId ?? 0) - netAccountChange(previousEntries, cashId ?? 0);
            const minimumCashBalance = yield* accountBalanceRepository.getMinimumLedgerBalanceFrom(cashId ?? 0, input.operatedAt);
            const shortfall = -cashChange - Math.max(minimumCashBalance, 0);

            if (isPositiveNumber(shortfall)) {
                yield* balanceAdjustmentService.create(cashId ?? 0, shortfall, input.operatedAt, fundingTitle);
            }
        });

        const recordTrade = Effect.fnUntraced(function* (
            security: AccountWithInstrumentEntityInterface,
            trade: SecurityTradeFormValues,
            fundingTitle: string | null
        ) {
            const cash = yield* findCashAccount(security);
            const input = yield* buildTradeInput(security, cash, trade, !isDefined(fundingTitle));

            yield* settleTrade(input, [], fundingTitle);
            yield* transferCreationService.createSyncedTransfers([input]);
        });

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

                        yield* recordTrade(security, trade, fundingTitle);

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
                function* (accountId: number, trade: SecurityTradeFormValues) {
                    const security = yield* findSecurityAccount(accountId);

                    yield* recordTrade(security, trade, null);
                },
                effect => Db.transaction(effect)
            ),
            update: Effect.fn('BrokerageService.update')(
                function* (transactionId: number, trade: SecurityTradeFormValues, fundingTitle: string) {
                    const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

                    if (!isDefined(transaction)) {
                        return yield* Effect.die(new Error('Trade transaction not found'));
                    }

                    const from = yield* findSecurityAccount(transaction.fromAccountId ?? 0);
                    const to = yield* findSecurityAccount(transaction.toAccountId ?? 0);
                    const isSell = isSecurityInstrumentType(from.instrument.type);
                    const [security, cash] = isSell ? [from, to] : [to, from];
                    const input = yield* buildTradeInput(security, cash, trade, isSell);
                    const tags = yield* transactionTagsRepository.findByTransactionId(transactionId);

                    yield* settleTrade(input, transaction.entries, isSell ? null : fundingTitle);
                    yield* transactionService.updateById(transactionId, {
                        ...input,
                        title: transaction.title,
                        comment: transaction.comment,
                        tagIds: tags.map(tag => tag.tagId)
                    });
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
            BalanceAdjustmentService.layer,
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
