import {
    AccountBalanceRepository,
    AccountTypeEnum,
    Db,
    DividendPayoutEnum,
    ExternalSourceEnum,
    InstrumentPriceProviderEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    INVESTMENTS_CATEGORY_ID,
    SyncModeEnum,
    SyncRepository,
    TransactionEntryTypeEnum,
    UserIconNameEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { AccountService, TransactionService, TransferCreationService } from '@budgie/ledger';
import { InzhurPriceService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { SyncFileReader } from '../../core/port/sync-file-reader.port';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { buildPrimaryEntry } from '../../core/utils/build-primary-entry.util';
import { InzhurImportOutcomeEnum } from '../enum/inzhur-import-outcome.enum';
import { InzhurNotSetUpError } from '../error/inzhur-not-set-up.error';
import { InzhurPriceMissingError } from '../error/inzhur-price-missing.error';
import { InzhurStatementInvalidError } from '../error/inzhur-statement-invalid.error';
import { inzhurStatementParser } from '../parser/inzhur-statement.parser';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';

import { InzhurSetupService } from './inzhur-setup.service';

import type { InzhurFundChangeInterface } from '../interface/inzhur-fund-change.interface';
import type { InzhurFundPlanInterface } from '../interface/inzhur-fund-plan.interface';
import type { InzhurHoldingInterface } from '../interface/inzhur-holding.interface';
import type { InzhurImportSummaryInterface } from '../interface/inzhur-import-summary.interface';
import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { InzhurStatementInterface } from '../interface/inzhur-statement.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

export class InzhurImportService extends Context.Service<InzhurImportService>()('@budgie/sync/InzhurImportService', {
    make: Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountService = yield* AccountService;
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
        const openingHoldingsTitle = 'Opening holdings';
        const canonicalFundNameByKeyword = {
            REIT: 'Inzhur REIT',
            ЕНЕРДЖІ: 'Inzhur Energy',
            МІЛТЕХ: 'Inzhur MilTech'
        };

        const buildOperatedAt = (statementDate: string) => new Date(`${statementDate}${statementNoonSuffix}`);

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

        const sumValues = (plans: readonly InzhurFundPlanInterface[]) => plans.reduce((sum, plan) => sum + plan.valueMicroUnits, 0);

        const estimateDividends = (buys: readonly InzhurFundPlanInterface[], cashAvailableMicroUnits: number) => {
            const reinvestedBuys = buys.filter(buy => buy.account.dividendPayout === DividendPayoutEnum.REINVEST);
            const otherBuys = buys.filter(buy => !reinvestedBuys.includes(buy));
            const cashPool = Math.max(cashAvailableMicroUnits, 0);
            const otherCovered = Math.min(cashPool, sumValues(otherBuys));
            const reinvestedValues = reinvestedBuys.map(buy => buy.valueMicroUnits);
            const reinvestedCoverage = allocateProRata(Math.min(cashPool - otherCovered, sumValues(reinvestedBuys)), reinvestedValues);

            return {
                dividendByAccountId: new Map(
                    reinvestedBuys.map((buy, index) => [buy.account.id, buy.valueMicroUnits - reinvestedCoverage[index]])
                ),
                uncoveredMicroUnits: sumValues(otherBuys) - otherCovered
            };
        };

        const resolveInstrument = Effect.fnUntraced(function* (holding: InzhurHoldingInterface) {
            const existingInstrument = yield* instrumentRepository.findByCode(holding.isin);

            if (isDefined(existingInstrument)) {
                return existingInstrument;
            }

            const upperCaseName = holding.name.toUpperCase();
            const canonicalName = Object.entries(canonicalFundNameByKeyword).find(([keyword]) => upperCaseName.includes(keyword))?.[1];
            const name = canonicalName ?? holding.name;

            return yield* instrumentRepository.create({
                type: InstrumentTypeEnum.FUND,
                code: holding.isin,
                name,
                symbol: name.split(' ').at(-1)?.toUpperCase() ?? holding.isin,
                priceProvider: InstrumentPriceProviderEnum.INZHUR,
                providerInstrumentId: holding.isin
            });
        });

        const findFundAccountByIsin = Effect.fnUntraced(function* (setup: InzhurSetupInterface) {
            const instruments = yield* instrumentRepository.getAll();
            const codeByInstrumentId = new Map(instruments.map(instrument => [instrument.id, instrument.code]));
            const accountByIsin = new Map<string, AccountEntityInterface>();

            for (const account of setup.fundAccounts) {
                const code = codeByInstrumentId.get(account.instrumentId);

                if (isDefined(code)) {
                    accountByIsin.set(code, account);
                }
            }

            return accountByIsin;
        });

        const createFundAccount = Effect.fnUntraced(function* (holding: InzhurHoldingInterface, integrationId: number) {
            const instrument = yield* resolveInstrument(holding);
            const createdAccount = Object.values(
                yield* accountService.bulkCreate([
                    {
                        title: instrument.name,
                        type: AccountTypeEnum.STOCKS,
                        icon: UserIconNameEnum.ChartLine,
                        instrumentId: instrument.id,
                        currentBalance: 0,
                        externalId: `inzhur:${holding.isin}`,
                        externalSource: provider,
                        dividendPayout: DividendPayoutEnum.REINVEST,
                        integrationId
                    }
                ])
            ).at(0);

            if (!isDefined(createdAccount)) {
                return yield* Effect.die(new Error('Failed to create Inzhur fund account'));
            }

            yield* syncRepository.create({ accountId: createdAccount.id, provider, enabled: true, mode: SyncModeEnum.FORWARD });

            return createdAccount;
        });

        const ensureFundAccounts = Effect.fnUntraced(function* (statement: InzhurStatementInterface, setup: InzhurSetupInterface) {
            const accountByIsin = yield* findFundAccountByIsin(setup);

            for (const holding of statement.holdings) {
                if (!accountByIsin.has(holding.isin)) {
                    accountByIsin.set(holding.isin, yield* createFundAccount(holding, setup.integration.id));
                }
            }

            return accountByIsin;
        });

        const applyBaseline = Effect.fnUntraced(function* (statement: InzhurStatementInterface, setup: InzhurSetupInterface) {
            const operatedAt = buildOperatedAt(statement.statementDate);
            const accountByIsin = yield* ensureFundAccounts(statement, setup);
            const instruments = yield* instrumentRepository.getAll();
            const funds: InzhurFundChangeInterface[] = [];

            for (const holding of statement.holdings) {
                const account = accountByIsin.get(holding.isin);

                if (isDefined(account)) {
                    const deltaMicroUnits = convertToMicroUnits(holding.quantity) - (yield* readBalance(account.id));

                    if (deltaMicroUnits !== 0) {
                        yield* accountService.adjustBalanceTo(account.id, holding.quantity, operatedAt, openingHoldingsTitle);
                        funds.push({
                            isin: holding.isin,
                            name: instruments.find(instrument => instrument.id === account.instrumentId)?.name ?? account.title,
                            accountId: account.id,
                            deltaQuantity: convertFromMicroUnits(deltaMicroUnits),
                            exchangedAmount: 0,
                            dividendAmount: 0
                        });
                    }
                }
            }

            yield* syncRepository.update(setup.cashSync.id, { forwardSyncedAt: operatedAt });

            return {
                outcome: InzhurImportOutcomeEnum.BASELINE,
                cashMoved: 0,
                estimatedDividendAmount: 0,
                uncoveredCashAmount: 0,
                funds
            };
        });

        const buildPlans = Effect.fnUntraced(function* (
            statement: InzhurStatementInterface,
            accountByIsin: ReadonlyMap<string, AccountEntityInterface>
        ) {
            const instruments = yield* instrumentRepository.getAll();
            const nameByInstrumentId = new Map(instruments.map(instrument => [instrument.id, instrument.name]));
            const quantityByIsin = new Map(statement.holdings.map(holding => [holding.isin, holding.quantity]));
            const plans: InzhurFundPlanInterface[] = [];
            const unpricedFundNames: string[] = [];

            for (const [isin, account] of accountByIsin) {
                const deltaMicroUnits = convertToMicroUnits(quantityByIsin.get(isin) ?? 0) - (yield* readBalance(account.id));

                if (deltaMicroUnits !== 0) {
                    const name = nameByInstrumentId.get(account.instrumentId) ?? account.title;
                    const price = yield* inzhurPriceService.findNearestPrice(account.instrumentId, statement.statementDate);

                    if (isPositiveNumber(price)) {
                        plans.push({
                            isin,
                            name,
                            account,
                            deltaMicroUnits,
                            price,
                            valueMicroUnits: Math.round(Math.abs(deltaMicroUnits) * price)
                        });
                    } else {
                        unpricedFundNames.push(name);
                    }
                }
            }

            if (isNotEmptyArray(unpricedFundNames)) {
                return yield* new InzhurPriceMissingError({ fundNames: unpricedFundNames });
            }

            return plans;
        });

        const applyChanges = Effect.fnUntraced(function* (
            statement: InzhurStatementInterface,
            setup: InzhurSetupInterface,
            accountByIsin: ReadonlyMap<string, AccountEntityInterface>
        ) {
            const operatedAt = buildOperatedAt(statement.statementDate);
            const cashAccountId = setup.cashAccount.id;
            const plans = yield* buildPlans(statement, accountByIsin);
            const sells = plans.filter(plan => plan.deltaMicroUnits < 0);
            const buys = plans.filter(plan => plan.deltaMicroUnits > 0);
            const cashBefore = yield* readBalance(cashAccountId);
            const { dividendByAccountId, uncoveredMicroUnits } = estimateDividends(buys, cashBefore + sumValues(sells));
            const dividendInputs = buys
                .filter(plan => (dividendByAccountId.get(plan.account.id) ?? 0) > 0)
                .map(plan => {
                    const externalId = `inzhur:${statement.statementDate}:${plan.isin}:dividend`;
                    const entry = {
                        ...buildPrimaryEntry(
                            cashAccountId,
                            TransactionEntryTypeEnum.DEBIT,
                            convertFromMicroUnits(dividendByAccountId.get(plan.account.id) ?? 0),
                            externalId
                        ),
                        categoryId: INVESTMENTS_CATEGORY_ID
                    };

                    return { ...buildInzhurTransactionInput(plan.name, externalId, operatedAt, [entry]), fundAccountId: plan.account.id };
                });
            const transferInputs = plans.map(plan => {
                const isSell = plan.deltaMicroUnits < 0;
                const externalId = `inzhur:${statement.statementDate}:${plan.isin}:${isSell ? 'sell' : 'buy'}`;
                const quantity = convertFromMicroUnits(Math.abs(plan.deltaMicroUnits));
                const value = convertFromMicroUnits(plan.valueMicroUnits);

                return buildInzhurTransactionInput(
                    plan.name,
                    externalId,
                    operatedAt,
                    isSell
                        ? [
                              buildPrimaryEntry(plan.account.id, TransactionEntryTypeEnum.CREDIT, quantity, externalId),
                              buildPrimaryEntry(cashAccountId, TransactionEntryTypeEnum.DEBIT, value, externalId)
                          ]
                        : [
                              buildPrimaryEntry(cashAccountId, TransactionEntryTypeEnum.CREDIT, value, externalId),
                              buildPrimaryEntry(plan.account.id, TransactionEntryTypeEnum.DEBIT, quantity, externalId)
                          ]
                );
            });

            yield* transactionService.bulkCreate(dividendInputs);

            if (isNotEmptyArray(transferInputs)) {
                yield* transferCreationService.createSyncedTransfers(transferInputs);
            }

            yield* syncRepository.update(setup.cashSync.id, { forwardSyncedAt: operatedAt });

            const funds = plans.map((plan): InzhurFundChangeInterface => ({
                isin: plan.isin,
                name: plan.name,
                accountId: plan.account.id,
                deltaQuantity: convertFromMicroUnits(plan.deltaMicroUnits),
                exchangedAmount: convertFromMicroUnits(plan.valueMicroUnits),
                dividendAmount: convertFromMicroUnits(dividendByAccountId.get(plan.account.id) ?? 0)
            }));

            return {
                outcome: InzhurImportOutcomeEnum.APPLIED,
                cashMoved: convertFromMicroUnits((yield* readBalance(cashAccountId)) - cashBefore),
                estimatedDividendAmount: funds.reduce((sum, fund) => sum + fund.dividendAmount, 0),
                uncoveredCashAmount: convertFromMicroUnits(uncoveredMicroUnits),
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
                    uncoveredCashAmount: 0,
                    funds: []
                } satisfies InzhurImportSummaryInterface;
            }

            const result = isDefined(lastStatementDate)
                ? yield* Db.transaction(ensureFundAccounts(statement, setup)).pipe(
                      Effect.flatMap(accountByIsin => Db.transaction(applyChanges(statement, setup, accountByIsin)))
                  )
                : yield* Db.transaction(applyBaseline(statement, setup));

            return { ...result, statementDate } satisfies InzhurImportSummaryInterface;
        });

        return {
            importStatement: Effect.fn('InzhurImportService.importStatement')(function* (uri: string) {
                const items = yield* syncFileReader.readPdfTextItems(uri);
                const statement = yield* Effect.fromResult(inzhurStatementParser.parse(items)).pipe(
                    Effect.mapError(reason => new InzhurStatementInvalidError({ reason }))
                );

                return yield* syncWorkload.runUser(apply(statement));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurImportService, InzhurImportService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            AccountService.layer,
            InstrumentRepository.layer,
            InzhurPriceService.layer,
            InzhurSetupService.layer,
            SyncRepository.layer,
            TransactionService.layer,
            TransferCreationService.layer
        ])
    );
}
