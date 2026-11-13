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
    TransactionTypeEnum,
    UserIconNameEnum,
    convertToMicroUnits,
    generateSyncId
} from '@budgie/contracts';
import { AccountService, BalanceAdjustmentService, TransferCreationService } from '@budgie/ledger';
import { EntryBaseValuationService, YahooMarketDataService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { roundHalfExpand } from '../../market-data/utils/round-half-expand.util';
import { InsufficientSecurityHoldingError } from '../error/insufficient-security-holding.error';

import type { SecurityTradeFormValues } from '../constant/security-trade-form-schema.constant';
import type {
    AccountWithInstrumentEntityInterface,
    LiabilityAccountCreateInputInterface,
    TransactionEntryCreateInputInterface
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
            const cashAccounts = accounts.filter(account => account.instrument.type === InstrumentTypeEnum.FIAT);
            const cashAccount = cashAccounts.find(account => account.instrumentId === instrument.quoteInstrumentId) ?? cashAccounts.at(0);

            return cashAccount ?? (yield* Effect.die(new Error('Brokerage cash account not found')));
        });

        const recordTrade = Effect.fnUntraced(function* (
            security: AccountWithInstrumentEntityInterface,
            trade: SecurityTradeFormValues,
            fundingTitle: string | null
        ) {
            const isSell = !isDefined(fundingTitle);
            const cash = yield* findCashAccount(security);
            const cashAmount = roundHalfExpand(trade.quantity * trade.price, DEFAULT_DECIMAL_PLACES);
            const fee = roundHalfExpand(trade.fee, DEFAULT_DECIMAL_PLACES);
            const shortfall = isSell
                ? 0
                : convertToMicroUnits(cashAmount + fee) -
                  (yield* accountBalanceRepository.getMinimumLedgerBalanceFrom(cash.id, trade.operatedAt));

            if (isPositiveNumber(shortfall)) {
                yield* balanceAdjustmentService.create(cash.id, shortfall, trade.operatedAt, fundingTitle ?? '');
            }

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

            yield* transferCreationService.createSyncedTransfers([
                {
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
                }
            ]);
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

                    const holding = yield* accountBalanceRepository.getMinimumLedgerBalanceFrom(accountId, trade.operatedAt);

                    if (convertToMicroUnits(trade.quantity) > holding) {
                        return yield* InsufficientSecurityHoldingError.make();
                    }

                    yield* recordTrade(security, trade, null);
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
            EntryBaseValuationService.layer,
            YahooMarketDataService.layer,
            HistoricalMarketDataDrainerService.layer
        ])
    );
}
