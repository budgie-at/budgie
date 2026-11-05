import {
    AccountBalanceRepository,
    AccountTypeEnum,
    BankIntegrationRepository,
    CurrencyEnum,
    Db,
    ExternalSourceEnum,
    InstrumentRepository,
    INVESTMENTS_CATEGORY_ID,
    InvestmentReturnRepository,
    SyncModeEnum,
    SyncRepository,
    TransactionEntryTypeEnum,
    UserIconNameEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { AccountService, TransactionService } from '@budgie/ledger';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { buildPrimaryEntry } from '../../core/utils/build-primary-entry.util';
import { INZHUR_CASH_EXTERNAL_ID } from '../constant/inzhur-cash-external-id.constant';
import { INZHUR_BALANCE_CORRECTION_TITLE } from '../constant/inzhur-estimate-titles.constant';
import { InzhurNotSetUpError } from '../error/inzhur-not-set-up.error';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';

import { InzhurBankFlowService } from './inzhur-bank-flow.service';
import { InzhurBeforeTrackingService } from './inzhur-before-tracking.service';
import { InzhurSetupLookupService } from './inzhur-setup-lookup.service';

import type { InzhurSetupResultInterface } from '../interface/inzhur-setup-result.interface';
import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { InzhurStatementReminderInterface } from '../interface/inzhur-statement-reminder.interface';

export class InzhurSetupService extends Context.Service<InzhurSetupService>()('@budgie/sync/InzhurSetupService', {
    make: Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountService = yield* AccountService;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const investmentReturnRepository = yield* InvestmentReturnRepository;
        const syncRepository = yield* SyncRepository;
        const inzhurBankFlowService = yield* InzhurBankFlowService;
        const inzhurBeforeTrackingService = yield* InzhurBeforeTrackingService;
        const inzhurSetupLookupService = yield* InzhurSetupLookupService;
        const transactionService = yield* TransactionService;
        const provider = ExternalSourceEnum.INZHUR;
        const staleStatementDays = 30;
        const estimatedDividendTitle = 'Inzhur dividends (estimated)';

        const setup = Effect.fn('InzhurSetupService.setup')(
            function* (enteredCashBalance: number) {
                const existingSetup = yield* inzhurSetupLookupService.findSetup();

                if (isDefined(existingSetup)) {
                    return { ...existingSetup, linked: { topUps: 0, withdrawals: 0, dividends: 0 } } satisfies InzhurSetupResultInterface;
                }

                const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);

                if (!isDefined(hryvnia)) {
                    return yield* Effect.die(new Error('Hryvnia instrument not found'));
                }

                const integration =
                    (yield* bankIntegrationRepository.findFileImportIntegration(provider)) ??
                    (yield* bankIntegrationRepository.create({ provider, token: '' }));
                const cashAccount = Object.values(
                    yield* accountService.bulkCreate([
                        {
                            title: 'Inzhur cash',
                            type: AccountTypeEnum.BANK_SYNC,
                            icon: UserIconNameEnum.Banknote,
                            instrumentId: hryvnia.id,
                            currentBalance: 0,
                            externalId: INZHUR_CASH_EXTERNAL_ID,
                            externalSource: provider,
                            integrationId: integration.id
                        }
                    ])
                ).at(0);

                if (!isDefined(cashAccount)) {
                    return yield* Effect.die(new Error('Failed to create Inzhur cash account'));
                }

                const cashSync = yield* syncRepository.create({
                    accountId: cashAccount.id,
                    provider,
                    enabled: true,
                    mode: SyncModeEnum.FORWARD
                });

                const created = {
                    integration,
                    cashAccount,
                    cashSync,
                    fundAccounts: [],
                    lastStatementDate: null
                } satisfies InzhurSetupInterface;
                const { topUps, withdrawals, dividends } = yield* inzhurBankFlowService.convert(created, null);
                const cashMicroUnits = (yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0)?.balance ?? 0;

                yield* inzhurBeforeTrackingService.replace(cashAccount.id, convertToMicroUnits(enteredCashBalance) - cashMicroUnits);

                return { ...created, linked: { topUps, withdrawals, dividends } } satisfies InzhurSetupResultInterface;
            },
            effect => Db.transaction(effect)
        );

        const setActualBalance = Effect.fn('InzhurSetupService.setActualBalance')(
            function* (actualBalance: number) {
                const setup = yield* inzhurSetupLookupService.findSetup();

                if (!isDefined(setup)) {
                    return yield* new InzhurNotSetUpError();
                }

                const { cashAccount } = setup;
                const currentMicroUnits = (yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0)?.balance ?? 0;
                const differenceMicroUnits = convertToMicroUnits(actualBalance) - currentMicroUnits;

                const operatedAt = new Date();

                if (differenceMicroUnits < 0) {
                    yield* accountService.adjustBalanceTo(cashAccount.id, actualBalance, operatedAt, INZHUR_BALANCE_CORRECTION_TITLE);
                }

                if (differenceMicroUnits > 0) {
                    const externalId = `inzhur:actual-balance:${cashAccount.id}:${actualBalance}`;
                    const entry = {
                        ...buildPrimaryEntry(
                            cashAccount.id,
                            TransactionEntryTypeEnum.DEBIT,
                            convertFromMicroUnits(differenceMicroUnits),
                            externalId
                        ),
                        categoryId: INVESTMENTS_CATEGORY_ID
                    };

                    yield* transactionService.bulkCreate([
                        buildInzhurTransactionInput(estimatedDividendTitle, externalId, operatedAt, [entry])
                    ]);
                }

                return convertFromMicroUnits(differenceMicroUnits);
            },
            effect => Db.transaction(effect)
        );

        const updateCashAccount = Effect.fn('InzhurSetupService.updateCashAccount')(
            function* (update: Parameters<typeof accountService.updateById>[1], actualBalance: number) {
                const existingSetup = yield* inzhurSetupLookupService.findSetup();

                if (!isDefined(existingSetup)) {
                    return yield* new InzhurNotSetUpError();
                }

                const updatedAccount = yield* accountService.updateById(existingSetup.cashAccount.id, update);

                yield* setActualBalance(actualBalance);

                return updatedAccount;
            },
            effect => Db.transaction(effect)
        );

        const findStatementReminder = Effect.fn('InzhurSetupService.findStatementReminder')(function* (now: Date) {
            const setup = yield* inzhurSetupLookupService.findSetup();

            if (!isDefined(setup)) {
                return null;
            }

            const { cashSync, cashAccount } = setup;
            const importDates = [cashSync.forwardSyncedAt, cashSync.backwardSyncedAt].filter(isDefined);

            if (!isNotEmptyArray(importDates)) {
                return null;
            }

            const lastImportAt = new Date(Math.max(...importDates.map(date => date.getTime())));
            const daysOld = differenceInCalendarDays(now, lastImportAt);

            if (daysOld <= staleStatementDays) {
                return null;
            }

            const activityCount = yield* investmentReturnRepository.countTransfersSince(cashAccount.id, lastImportAt);

            return activityCount > 0
                ? ({ daysOld, lastStatementDate: lastImportAt.toISOString().slice(0, 10) } satisfies InzhurStatementReminderInterface)
                : null;
        });

        return { findSetup: () => inzhurSetupLookupService.findSetup(), setup, setActualBalance, updateCashAccount, findStatementReminder };
    })
}) {
    static readonly layer = Layer.effect(InzhurSetupService, InzhurSetupService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            AccountService.layer,
            BankIntegrationRepository.layer,
            InzhurBankFlowService.layer,
            InzhurBeforeTrackingService.layer,
            InzhurSetupLookupService.layer,
            InstrumentRepository.layer,
            InvestmentReturnRepository.layer,
            SyncRepository.layer,
            TransactionService.layer
        ])
    );
}
