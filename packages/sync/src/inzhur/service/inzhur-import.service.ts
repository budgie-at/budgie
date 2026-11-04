import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    CategorySourceEnum,
    CurrencyEnum,
    Db,
    DividendPayoutEnum,
    ExternalSourceEnum,
    InstrumentPriceProviderEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    INVESTMENTS_CATEGORY_ID,
    SyncModeEnum,
    SyncRepository,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import {
    AccountBalanceIncrementalService,
    AccountService,
    BalanceAdjustmentService,
    TransactionService,
    TransferCreationService
} from '@budgie/ledger';
import { InstrumentDailyMarketPriceRepository, InzhurPriceService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SyncFileReader } from '../../core/port/sync-file-reader.port';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { InzhurImportOutcomeEnum } from '../enum/inzhur-import-outcome.enum';
import { InzhurNotSetUpError } from '../error/inzhur-not-set-up.error';
import { InzhurStatementInvalidError } from '../error/inzhur-statement-invalid.error';
import { parseInzhurStatement } from '../parser/inzhur-statement.parser';
import { buildInzhurFundExternalId } from '../utils/build-inzhur-fund-external-id.util';

import { InzhurSetupService } from './inzhur-setup.service';

import type { InzhurFundChangeInterface } from '../interface/inzhur-fund-change.interface';
import type { InzhurFundPlanInterface } from '../interface/inzhur-fund-plan.interface';
import type { InzhurHoldingInterface } from '../interface/inzhur-holding.interface';
import type { InzhurImportSummaryInterface } from '../interface/inzhur-import-summary.interface';
import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { InzhurStatementInterface } from '../interface/inzhur-statement.interface';
import type {
    AccountEntityInterface,
    InstrumentEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';

export class InzhurImportService extends Context.Service<InzhurImportService>()('@budgie/sync/InzhurImportService', {
    make: Effect.gen(function* () {
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountRepository = yield* AccountRepository;
        const accountService = yield* AccountService;
        const balanceAdjustmentService = yield* BalanceAdjustmentService;
        const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const inzhurPriceService = yield* InzhurPriceService;
        const inzhurSetupService = yield* InzhurSetupService;
        const syncFileReader = yield* SyncFileReader;
        const syncRepository = yield* SyncRepository;
        const syncWorkload = yield* SyncWorkload;
        const transactionService = yield* TransactionService;
        const transferCreationService = yield* TransferCreationService;
        const provider = ExternalSourceEnum.INZHUR;
        const statementNoonSuffix = 'T12:00:00.000Z';

        const readBalance = Effect.fnUntraced(function* (accountId: number) {
            return (yield* accountBalanceRepository.getByAccountId(accountId)).at(0)?.balance ?? 0;
        });

        const allocateProRata = (total: number, weights: readonly number[]): number[] => {
            let remainingTotal = total;
            let remainingWeight = weights.reduce((sum, weight) => sum + weight, 0);

            return weights.map(weight => {
                const share =
                    remainingWeight > 0 ? Math.min(weight, Math.max(0, Math.round((remainingTotal * weight) / remainingWeight))) : 0;

                remainingTotal -= share;
                remainingWeight -= weight;

                return share;
            });
        };

        const estimateDividends = (buys: readonly InzhurFundPlanInterface[], cashAvailableMicroUnits: number): Map<number, number> => {
            const dividendByAccountId = new Map<number, number>();
            const isReinvested = (buy: InzhurFundPlanInterface) => buy.account.dividendPayout === DividendPayoutEnum.REINVEST;
            let cashPool = Math.max(cashAvailableMicroUnits, 0);

            for (const group of [buys.filter(buy => !isReinvested(buy)), buys.filter(isReinvested)]) {
                const values = group.map(buy => buy.valueMicroUnits);
                const covered = Math.min(
                    cashPool,
                    values.reduce((sum, value) => sum + value, 0)
                );
                const coverage = allocateProRata(covered, values);

                group.forEach((buy, index) => {
                    dividendByAccountId.set(buy.account.id, buy.valueMicroUnits - coverage[index]);
                });
                cashPool -= covered;
            }

            return dividendByAccountId;
        };

        const resolvePrice = Effect.fnUntraced(function* (instrumentId: number, statementDate: string) {
            const price = yield* inzhurPriceService.findPriceOnOrBefore(instrumentId, statementDate);

            if (isPositiveNumber(price)) {
                return price;
            }

            const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);
            const latestPrice = isDefined(hryvnia)
                ? yield* instrumentDailyMarketPriceRepository.findLatest(instrumentId, hryvnia.id)
                : null;

            return isPositiveNumber(latestPrice?.price) ? latestPrice.price : null;
        });

        const resolveInstrument = Effect.fnUntraced(function* (holding: InzhurHoldingInterface) {
            const existingInstrument = yield* instrumentRepository.findByCode(holding.isin);

            if (isDefined(existingInstrument)) {
                return existingInstrument;
            }

            const name = isNotEmptyString(holding.name) ? holding.name : holding.isin;

            return yield* instrumentRepository.create({
                type: InstrumentTypeEnum.FUND,
                code: holding.isin,
                name,
                symbol: name.split(' ').at(-1)?.toUpperCase() ?? holding.isin,
                priceProvider: InstrumentPriceProviderEnum.INZHUR,
                providerInstrumentId: holding.isin
            });
        });

        const createFundAccount = Effect.fnUntraced(function* (
            holding: InzhurHoldingInterface,
            instrument: InstrumentEntityInterface,
            integrationId: number,
            openingQuantity: number
        ) {
            const createdAccount = Object.values(
                yield* accountService.bulkCreate([
                    {
                        title: instrument.name,
                        type: AccountTypeEnum.STOCKS,
                        icon: UserIconNameEnum.TrendingUp,
                        instrumentId: instrument.id,
                        currentBalance: openingQuantity,
                        externalId: buildInzhurFundExternalId(holding.isin),
                        externalSource: provider,
                        integrationId
                    }
                ])
            ).at(0);

            if (!isDefined(createdAccount)) {
                return yield* Effect.die(new Error('Failed to create Inzhur fund account'));
            }

            yield* syncRepository.create({ accountId: createdAccount.id, provider, enabled: true, mode: SyncModeEnum.FORWARD });

            return yield* accountRepository.updateById(createdAccount.id, { dividendPayout: DividendPayoutEnum.REINVEST });
        });

        const buildEntry = (
            accountId: number,
            type: TransactionEntryTypeEnum,
            amountMicroUnits: number,
            externalId: string
        ): TransactionEntryCreateInputInterface => ({
            accountId,
            type,
            amount: convertFromMicroUnits(amountMicroUnits),
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            kind: TransactionEntryKindEnum.PRIMARY,
            externalId,
            exchangeRate: 1,
            toIban: null
        });

        const buildInput = (
            title: string,
            externalId: string,
            operatedAt: Date,
            entries: readonly TransactionEntryCreateInputInterface[]
        ): TransactionCreateInputInterface => {
            const creditEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
            const debitEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

            return {
                amount: (creditEntry ?? debitEntry)?.amount ?? 0,
                title,
                comment: '',
                type: isDefined(creditEntry) ? TransactionTypeEnum.TRANSFER : TransactionTypeEnum.INCOME,
                exchangeRate: 1,
                operatedAt,
                externalId,
                updatedBy: null,
                externalSource: provider,
                fromAccountId: creditEntry?.accountId ?? null,
                toAccountId: debitEntry?.accountId ?? null,
                tagIds: [],
                entries: [...entries]
            };
        };

        const applyBaseline = Effect.fnUntraced(function* (statement: InzhurStatementInterface, setup: InzhurSetupInterface) {
            const instruments = yield* instrumentRepository.getAll();
            const existingExternalIds = new Set(setup.fundAccounts.map(account => account.externalId));
            const funds: InzhurFundChangeInterface[] = [];

            for (const holding of statement.holdings) {
                if (!existingExternalIds.has(buildInzhurFundExternalId(holding.isin))) {
                    const instrument = instruments.find(item => item.code === holding.isin) ?? (yield* resolveInstrument(holding));
                    const account = yield* createFundAccount(holding, instrument, setup.integration.id, holding.quantity);

                    funds.push({
                        isin: holding.isin,
                        name: instrument.name,
                        accountId: account.id,
                        deltaQuantity: holding.quantity,
                        exchangedAmount: 0,
                        dividendAmount: 0,
                        isPriceMissing: false,
                        isPayoutSettingStale: false
                    });
                }
            }

            return { outcome: InzhurImportOutcomeEnum.BASELINE, cashMoved: 0, estimatedDividendAmount: 0, funds };
        });

        const buildPlans = Effect.fnUntraced(function* (statement: InzhurStatementInterface, setup: InzhurSetupInterface) {
            const instruments = yield* instrumentRepository.getAll();
            const instrumentById = new Map(instruments.map(instrument => [instrument.id, instrument]));
            const holdingByIsin = new Map(statement.holdings.map(holding => [holding.isin, holding]));
            const accountByIsin = new Map<string, AccountEntityInterface>();

            for (const account of setup.fundAccounts) {
                const instrument = instrumentById.get(account.instrumentId);

                if (isDefined(instrument)) {
                    accountByIsin.set(instrument.code, account);
                }
            }

            const plans: InzhurFundPlanInterface[] = [];

            for (const isin of new Set([...holdingByIsin.keys(), ...accountByIsin.keys()])) {
                const holding = holdingByIsin.get(isin);
                const existingAccount = accountByIsin.get(isin);
                const instrument = isDefined(holding)
                    ? (instruments.find(item => item.code === isin) ?? (yield* resolveInstrument(holding)))
                    : null;
                const account =
                    existingAccount ??
                    (isDefined(holding) && isDefined(instrument)
                        ? yield* createFundAccount(holding, instrument, setup.integration.id, 0)
                        : null);

                if (isDefined(account)) {
                    const currentMicroUnits = isDefined(existingAccount) ? yield* readBalance(account.id) : 0;
                    const deltaMicroUnits = convertToMicroUnits(holding?.quantity ?? 0) - currentMicroUnits;
                    const price = deltaMicroUnits === 0 ? null : yield* resolvePrice(account.instrumentId, statement.statementDate);

                    plans.push({
                        isin,
                        name: instrument?.name ?? account.title,
                        account,
                        deltaMicroUnits,
                        price,
                        valueMicroUnits: isDefined(price) ? Math.round(Math.abs(deltaMicroUnits) * price) : 0
                    });
                }
            }

            return plans.filter(plan => plan.deltaMicroUnits !== 0);
        });

        const applyChanges = Effect.fnUntraced(function* (statement: InzhurStatementInterface, setup: InzhurSetupInterface) {
            const operatedAt = new Date(`${statement.statementDate}${statementNoonSuffix}`);
            const cashAccountId = setup.cashAccount.id;
            const plans = yield* buildPlans(statement, setup);
            const pricedPlans = plans.filter(plan => isDefined(plan.price) && plan.valueMicroUnits > 0);
            const unpricedPlans = plans.filter(plan => !pricedPlans.includes(plan));
            const sells = pricedPlans.filter(plan => plan.deltaMicroUnits < 0);
            const buys = pricedPlans.filter(plan => plan.deltaMicroUnits > 0);
            const cashBefore = yield* readBalance(cashAccountId);
            const sellProceeds = sells.reduce((sum, plan) => sum + plan.valueMicroUnits, 0);
            const dividendByAccountId = estimateDividends(buys, cashBefore + sellProceeds);
            const dividendInputs = buys
                .filter(plan => (dividendByAccountId.get(plan.account.id) ?? 0) > 0)
                .map(plan => {
                    const externalId = `inzhur:${statement.statementDate}:${plan.isin}:dividend`;

                    return buildInput(plan.name, externalId, operatedAt, [
                        {
                            ...buildEntry(
                                cashAccountId,
                                TransactionEntryTypeEnum.DEBIT,
                                dividendByAccountId.get(plan.account.id) ?? 0,
                                externalId
                            ),
                            categoryId: INVESTMENTS_CATEGORY_ID
                        }
                    ]);
                });
            const transferInputs = pricedPlans.map(plan => {
                const isSell = plan.deltaMicroUnits < 0;
                const externalId = `inzhur:${statement.statementDate}:${plan.isin}:${isSell ? 'sell' : 'buy'}`;
                const quantityMicroUnits = Math.abs(plan.deltaMicroUnits);

                return buildInput(
                    plan.name,
                    externalId,
                    operatedAt,
                    isSell
                        ? [
                              buildEntry(plan.account.id, TransactionEntryTypeEnum.CREDIT, quantityMicroUnits, externalId),
                              buildEntry(cashAccountId, TransactionEntryTypeEnum.DEBIT, plan.valueMicroUnits, externalId)
                          ]
                        : [
                              buildEntry(cashAccountId, TransactionEntryTypeEnum.CREDIT, plan.valueMicroUnits, externalId),
                              buildEntry(plan.account.id, TransactionEntryTypeEnum.DEBIT, quantityMicroUnits, externalId)
                          ]
                );
            });

            yield* transactionService.bulkCreate(dividendInputs);

            if (isNotEmptyArray(transferInputs)) {
                yield* transferCreationService.createSyncedTransfers(transferInputs);
            }

            for (const plan of unpricedPlans) {
                yield* balanceAdjustmentService.create(plan.account.id, plan.deltaMicroUnits, operatedAt);
            }

            if (isNotEmptyArray(unpricedPlans)) {
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds(unpricedPlans.map(plan => plan.account.id));
            }

            const funds = plans.map((plan): InzhurFundChangeInterface => {
                const dividend = dividendByAccountId.get(plan.account.id) ?? 0;

                return {
                    isin: plan.isin,
                    name: plan.name,
                    accountId: plan.account.id,
                    deltaQuantity: convertFromMicroUnits(plan.deltaMicroUnits),
                    exchangedAmount: convertFromMicroUnits(plan.valueMicroUnits),
                    dividendAmount: convertFromMicroUnits(dividend),
                    isPriceMissing: unpricedPlans.includes(plan),
                    isPayoutSettingStale: dividend > 0 && plan.account.dividendPayout !== DividendPayoutEnum.REINVEST
                };
            });

            return {
                outcome: InzhurImportOutcomeEnum.APPLIED,
                cashMoved: convertFromMicroUnits((yield* readBalance(cashAccountId)) - cashBefore),
                estimatedDividendAmount: funds.reduce((sum, fund) => sum + fund.dividendAmount, 0),
                funds
            };
        });

        const apply = Effect.fn('InzhurImportService.apply')(function* (statement: InzhurStatementInterface) {
            const setup = yield* inzhurSetupService.findSetup();

            if (!isDefined(setup)) {
                return yield* new InzhurNotSetUpError();
            }

            const { lastStatementDate } = setup;
            const { statementDate } = statement;

            if (isDefined(lastStatementDate) && statementDate <= lastStatementDate) {
                return {
                    outcome: InzhurImportOutcomeEnum.UNCHANGED,
                    statementDate,
                    cashMoved: 0,
                    estimatedDividendAmount: 0,
                    funds: []
                } satisfies InzhurImportSummaryInterface;
            }

            const result = isDefined(lastStatementDate) ? yield* applyChanges(statement, setup) : yield* applyBaseline(statement, setup);

            yield* syncRepository.update(setup.cashSync.id, { forwardSyncedAt: new Date(`${statementDate}${statementNoonSuffix}`) });

            return { ...result, statementDate } satisfies InzhurImportSummaryInterface;
        });

        return {
            importStatement: Effect.fn('InzhurImportService.importStatement')(function* (uri: string) {
                const items = yield* syncFileReader.readPdfTextItems(uri);
                const statement = yield* Effect.fromResult(parseInzhurStatement(items)).pipe(
                    Effect.mapError(reason => new InzhurStatementInvalidError({ reason }))
                );

                return yield* syncWorkload.runUser(Db.transaction(apply(statement)));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurImportService, InzhurImportService.make).pipe(
        Layer.provide([
            AccountBalanceIncrementalService.layer,
            AccountBalanceRepository.layer,
            AccountRepository.layer,
            AccountService.layer,
            BalanceAdjustmentService.layer,
            InstrumentDailyMarketPriceRepository.layer,
            InstrumentRepository.layer,
            InzhurPriceService.layer,
            InzhurSetupService.layer,
            SyncRepository.layer,
            TransactionService.layer,
            TransferCreationService.layer
        ])
    );
}
