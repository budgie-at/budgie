import { BudgetRepository } from '@budgie/budget';
import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    CategoryRepository,
    DEFAULT_TRANSACTION_FILTER,
    InstrumentRepository,
    InstrumentTypeEnum,
    LanguageEnum,
    SettingsRepository,
    StatisticsRepository,
    convertFromMicroUnits
} from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { setupI18n } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { addDays } from 'date-fns/addDays';
import { endOfMonth } from 'date-fns/endOfMonth';
import { format } from 'date-fns/format';
import { isSameMonth } from 'date-fns/isSameMonth';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';
import * as AppIntents from 'expo-app-intents';
import { Platform } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { BUDGET_PACE_STATUS_LABEL } from '../../budget/constant/budget-pace-status-label.constant';
import { BudgetProjectionService } from '../../budget/service/budget-projection.service';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { formatSymbolAmount } from '../../i18n/utils/format-symbol-amount.util';
import { i18nLoadLanguageMessages } from '../../i18n/utils/i18n.util';
import { languageToLocale } from '../../i18n/utils/language-to-locale.util';
import { DEFAULT_INSTRUMENT } from '../../settings/constants/default-instrument.constant';
import { SiriCatalogKindEnum } from '../enum/siri-catalog-kind.enum';
import { SiriMetadataKeyEnum } from '../enum/siri-metadata-key.enum';

import type { SiriAnswerContextInterface } from '../interface/siri-answer-context.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';
import type { AccountEntityInterface, TransactionFilterInterface } from '@budgie/contracts';
import type { AppIntentEntity } from 'expo-app-intents';

export class SiriCatalogService extends Context.Service<SiriCatalogService>()('@budgie/app/SiriCatalogService', {
    make: Effect.gen(function* () {
        const settingsRepository = yield* SettingsRepository;
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const statisticsRepository = yield* StatisticsRepository;
        const categoryRepository = yield* CategoryRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const budgetRepository = yield* BudgetRepository;
        const budgetProjectionService = yield* BudgetProjectionService;
        const recurringService = yield* RecurringService;
        const upcomingDays = 7;
        const summaryId = 'summary';
        const answerKinds = [SiriCatalogKindEnum.ACCOUNT_ANSWER, SiriCatalogKindEnum.CATEGORY_ANSWER, SiriCatalogKindEnum.SUMMARY];
        const lockedMetadataKeys = new Set<string>([
            SiriMetadataKeyEnum.MONTH_KEY,
            SiriMetadataKeyEnum.AS_OF,
            SiriMetadataKeyEnum.REFRESH,
            SiriMetadataKeyEnum.LOCKED,
            SiriMetadataKeyEnum.UNAVAILABLE
        ]);
        const publishSemaphore = yield* Semaphore.make(1);
        const isLockForced = yield* Ref.make(false);

        const formatAmount = (microAmount: number, symbol: string, context: SiriAnswerContextInterface): string =>
            formatSymbolAmount(convertFromMicroUnits(microAmount), symbol, absolute => context.numberFormat.format(absolute));

        const buildMetadata = (
            answers: Partial<Record<SiriMetadataKeyEnum, string>>,
            context: SiriAnswerContextInterface
        ): Partial<Record<SiriMetadataKeyEnum, string>> => ({ ...context.metadata, ...(!context.isLocked && answers) });

        const sumByCategory = (rows: Effect.Success<ReturnType<typeof statisticsRepository.getExpenseByCategoryQuery>>) =>
            new Map(rows.flatMap(row => (isDefined(row.category) ? [[row.category.id, row.amount] as const] : [])));

        const buildBudgetAnswer = (
            label: string,
            { spent, limit }: Pick<BudgetProjectionScopeInterface, 'spent' | 'limit'>,
            symbol: string,
            context: SiriAnswerContextInterface
        ) => {
            const formattedSpent = formatAmount(spent, symbol, context);
            const formattedLimit = formatAmount(limit, symbol, context);

            if (spent > limit) {
                const formattedOver = formatAmount(spent - limit, symbol, context);

                return context.i18n._(msg`${label}: ${formattedSpent} spent, ${formattedOver} over the ${formattedLimit} limit.`);
            }

            const formattedLeft = formatAmount(limit - spent, symbol, context);

            return context.i18n._(msg`${label}: ${formattedSpent} of ${formattedLimit} spent, ${formattedLeft} left.`);
        };

        const loadBudget = Effect.fn('SiriCatalogService.loadBudget')(function* (context: SiriAnswerContextInterface) {
            const budget = yield* budgetRepository.findMain;

            if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId)) {
                return null;
            }

            const [instrument, projection] = yield* Effect.all(
                [instrumentRepository.findById(budget.instrumentId), budgetProjectionService.project(budget, context.now)],
                { concurrency: 'unbounded' }
            );

            return { symbol: instrument?.symbol ?? DEFAULT_INSTRUMENT.symbol, projection };
        });

        const loadUpcomingAnswer = Effect.fn('SiriCatalogService.loadUpcomingAnswer')(function* (context: SiriAnswerContextInterface) {
            const today = startOfDay(context.now);
            const until = addDays(today, upcomingDays);
            const calendars = yield* Effect.forEach(isSameMonth(today, until) ? [today] : [today, until], month =>
                Effect.map(recurringService.calendar(month.getFullYear(), month.getMonth(), context.now), calendar => ({
                    month,
                    calendar
                }))
            );
            const charges = calendars
                .flatMap(({ month, calendar }) =>
                    [...calendar.forecastedEntriesByDay.values()].flat().map(entry => ({
                        date: new Date(month.getFullYear(), month.getMonth(), entry.dayOfMonth),
                        title: entry.title,
                        amount: entry.latestAmount
                    }))
                )
                .filter(charge => charge.date >= today && charge.date < until)
                .sort((first, second) => first.date.getTime() - second.date.getTime());

            if (!isNotEmptyArray(charges)) {
                return context.i18n._(msg`No recurring charges are due in the next 7 days.`);
            }

            const formattedTotal = formatAmount(
                charges.reduce((total, charge) => total + charge.amount, 0),
                context.instrument.symbol,
                context
            );
            const chargeList = charges
                .map(({ title, amount, date }) => {
                    const formattedAmount = formatAmount(amount, context.instrument.symbol, context);
                    const formattedDate = context.dateFormat.format(date);

                    return context.i18n._(msg`${title} ${formattedAmount} on ${formattedDate}`);
                })
                .join(', ');

            return context.i18n._(
                msg({
                    message: plural(charges.length, {
                        one: `# charge is due in the next 7 days, ${formattedTotal} in total: ${chargeList}.`,
                        other: `# charges are due in the next 7 days, ${formattedTotal} in total: ${chargeList}.`
                    })
                })
            );
        });

        const buildContext = Effect.fn('SiriCatalogService.buildContext')(function* () {
            const settings = yield* settingsRepository.findSettings;
            const language = settings?.language ?? LanguageEnum.EN;
            const messages = yield* Effect.orDie(i18nLoadLanguageMessages(language));
            const locale = languageToLocale(language);
            const decimalPlaces = (settings?.showCents ?? true) ? DEFAULT_DECIMAL_PLACES : 0;
            const now = yield* DateTime.nowAsDate;
            const isLocked = (settings?.isPinEnabled ?? false) || (yield* Ref.get(isLockForced));
            const context: SiriAnswerContextInterface = {
                i18n: setupI18n({ locale: language, messages: { [language]: messages } }),
                language,
                instrument: settings?.defaultInstrument ?? DEFAULT_INSTRUMENT,
                numberFormat: new Intl.NumberFormat(locale, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }),
                dateFormat: new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
                now,
                isLocked,
                metadata: {
                    [SiriMetadataKeyEnum.MONTH_KEY]: format(now, 'yyyy-MM'),
                    [SiriMetadataKeyEnum.AS_OF]: format(now, 'yyyy-MM-dd'),
                    ...(isLocked && { [SiriMetadataKeyEnum.IS_LOCKED]: 'true' })
                }
            };

            return context;
        });

        const callNative = <A>(call: () => Promise<A>) => Effect.tryPromise({ try: call, catch: cause => NativeCallError.make({ cause }) });

        const publishCatalog = (kind: SiriCatalogKindEnum, records: readonly AppIntentEntity[]) =>
            callNative(() => AppIntents.setEntityCatalogAsync(kind, [...records]));

        const toTitleRecord = ({ id, title }: Pick<AccountEntityInterface, 'id' | 'title'>) => ({ id: String(id), title });

        const publishWalletAccounts = Effect.fn('SiriCatalogService.publishWalletAccounts')(function* () {
            const accounts = yield* accountRepository.getAllActiveAccounts;

            yield* publishCatalog(SiriCatalogKindEnum.WALLET_ACCOUNT, accounts.filter(account => account.isActive).map(toTitleRecord));
        });

        const publishAccountAnswers = Effect.fn('SiriCatalogService.publishAccountAnswers')(function* (
            context: SiriAnswerContextInterface
        ) {
            const rows = yield* accountBalanceRepository.getHomeAccountRows(context.instrument.id);

            yield* publishCatalog(
                SiriCatalogKindEnum.ACCOUNT_ANSWER,
                rows
                    .filter(({ account }) => account.isActive)
                    .map(({ account, balance, instrument }) => {
                        const accountTitle = account.title;
                        const formattedBalance = formatAmount(balance, instrument.symbol, context);
                        const hasBalanceAnswer = account.type !== AccountTypeEnum.DEBT && instrument.type !== InstrumentTypeEnum.CRYPTO;

                        return {
                            ...toTitleRecord(account),
                            metadata: buildMetadata(
                                {
                                    ...(hasBalanceAnswer && {
                                        [SiriMetadataKeyEnum.BALANCE]: context.i18n._(
                                            msg`Your ${accountTitle} balance is ${formattedBalance}.`
                                        )
                                    })
                                },
                                context
                            )
                        };
                    })
            );
        });

        const publishCategories = Effect.fn('SiriCatalogService.publishCategories')(function* (context: SiriAnswerContextInterface) {
            const monthStart = startOfMonth(context.now);
            const lastMonthStart = subMonths(monthStart, 1);
            const expenseByCategory = (date: TransactionFilterInterface['date']) =>
                statisticsRepository.getExpenseByCategoryQuery(
                    { ...DEFAULT_TRANSACTION_FILTER, date },
                    context.instrument.id,
                    context.language
                );
            const [allCategories, thisMonthRows, lastMonthRows] = yield* Effect.all(
                [
                    categoryRepository.findAllNonSystemLocalized(context.language),
                    expenseByCategory({ from: monthStart, to: null }),
                    expenseByCategory({ from: lastMonthStart, to: endOfMonth(lastMonthStart) })
                ],
                { concurrency: 'unbounded' }
            );
            const categories = allCategories.filter(category => isNotEmptyString(category.title.trim()));
            const thisMonthSpent = sumByCategory(thisMonthRows);
            const lastMonthSpent = sumByCategory(lastMonthRows);

            yield* publishCatalog(SiriCatalogKindEnum.CATEGORY, categories.map(toTitleRecord));
            yield* publishCatalog(
                SiriCatalogKindEnum.CATEGORY_ANSWER,
                categories.map(category => {
                    const { id, title } = category;
                    const formattedThisMonth = formatAmount(thisMonthSpent.get(id) ?? 0, context.instrument.symbol, context);
                    const formattedLastMonth = formatAmount(lastMonthSpent.get(id) ?? 0, context.instrument.symbol, context);

                    return {
                        ...toTitleRecord(category),
                        metadata: buildMetadata(
                            {
                                [SiriMetadataKeyEnum.THIS_MONTH]: context.i18n._(
                                    msg`You spent ${formattedThisMonth} on ${title} this month.`
                                ),
                                [SiriMetadataKeyEnum.LAST_MONTH]: context.i18n._(
                                    msg`You spent ${formattedLastMonth} on ${title} last month.`
                                )
                            },
                            context
                        )
                    };
                })
            );
        });

        const publishSummary = Effect.fn('SiriCatalogService.publishSummary')(function* (context: SiriAnswerContextInterface) {
            const [accounts, netWorthRows] = yield* Effect.all(
                [accountRepository.getAllActiveAccounts, accountBalanceRepository.getNetWorth(context.instrument.id)],
                { concurrency: 'unbounded' }
            );
            const budget = (yield* logAndContinue(loadBudget(context))) ?? null;
            const upcomingAnswer = (yield* logAndContinue(loadUpcomingAnswer(context))) ?? null;
            const formattedNetWorth = formatAmount(netWorthRows.at(0)?.netWorth ?? 0, context.instrument.symbol, context);

            yield* publishCatalog(SiriCatalogKindEnum.SUMMARY, [
                {
                    id: summaryId,
                    title: context.i18n._(msg`Budgie`),
                    metadata: {
                        ...buildMetadata(
                            {
                                ...(isNotEmptyArray(accounts) && {
                                    [SiriMetadataKeyEnum.NET_WORTH]: context.i18n._(msg`Your net worth is ${formattedNetWorth}.`)
                                }),
                                ...(isDefined(budget) &&
                                    isPositiveNumber(budget.projection.overall.limit) && {
                                        [SiriMetadataKeyEnum.BUDGET]: buildBudgetAnswer(
                                            context.i18n._(BUDGET_PACE_STATUS_LABEL[budget.projection.overall.status]),
                                            budget.projection.overall,
                                            budget.symbol,
                                            context
                                        )
                                    }),
                                ...(isNotEmptyString(upcomingAnswer) && { [SiriMetadataKeyEnum.UPCOMING]: upcomingAnswer })
                            },
                            context
                        ),
                        [SiriMetadataKeyEnum.REFRESH]: context.i18n._(msg`Open Budgie to refresh.`),
                        [SiriMetadataKeyEnum.LOCKED]: context.i18n._(msg`Unlock Budgie to see this.`),
                        [SiriMetadataKeyEnum.UNAVAILABLE]: context.i18n._(msg`This isn’t available in Budgie yet.`)
                    }
                }
            ]);
        });

        const sanitizeCatalog = Effect.fn('SiriCatalogService.sanitizeCatalog')(function* (kind: SiriCatalogKindEnum) {
            const records = yield* callNative(() => AppIntents.getEntityCatalogAsync(kind));

            yield* publishCatalog(
                kind,
                records.map(record => ({
                    ...record,
                    metadata: {
                        ...Object.fromEntries(Object.entries(record.metadata ?? {}).filter(([key]) => lockedMetadataKeys.has(key))),
                        [SiriMetadataKeyEnum.IS_LOCKED]: 'true'
                    }
                }))
            );
        });

        const publishCatalogs = Effect.fn('SiriCatalogService.publishCatalogs')(function* () {
            if (Platform.OS !== 'ios') {
                return;
            }

            yield* logAndContinue(publishWalletAccounts());

            const context = yield* buildContext();

            yield* logAndContinue(publishAccountAnswers(context));
            yield* logAndContinue(publishCategories(context));
            yield* logAndContinue(publishSummary(context));
        });

        return {
            publish: Effect.fn('SiriCatalogService.publish')(function* () {
                yield* publishSemaphore.withPermits(1)(publishCatalogs());
            }),
            refreshWalletAccounts: Effect.fn('SiriCatalogService.refreshWalletAccounts')(function* () {
                yield* publishSemaphore.withPermits(1)(publishWalletAccounts());
            }),
            mask: Effect.fn('SiriCatalogService.mask')(function* () {
                yield* Ref.set(isLockForced, true);
                yield* publishSemaphore.withPermits(1)(
                    Effect.forEach(answerKinds, kind => logAndContinue(sanitizeCatalog(kind)), { discard: true })
                );
            }),
            unlock: Effect.fn('SiriCatalogService.unlock')(function* () {
                yield* publishSemaphore.withPermits(1)(Effect.andThen(Ref.set(isLockForced, false), publishCatalogs()));
            }),
            clear: Effect.fn('SiriCatalogService.clear')(function* () {
                yield* publishSemaphore.withPermits(1)(
                    Effect.forEach(Object.values(SiriCatalogKindEnum), kind => logAndContinue(publishCatalog(kind, [])), { discard: true })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SiriCatalogService, SiriCatalogService.make).pipe(
        Layer.provide([
            SettingsRepository.layer,
            AccountRepository.layer,
            AccountBalanceRepository.layer,
            StatisticsRepository.layer,
            CategoryRepository.layer,
            InstrumentRepository.layer,
            BudgetRepository.layer,
            BudgetProjectionService.layer,
            RecurringService.layer
        ])
    );
}
