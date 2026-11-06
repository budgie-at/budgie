import {
    AccountTypeEnum,
    BankIntegrationRepository,
    CurrencyEnum,
    Db,
    ExternalSourceEnum,
    InstrumentRepository,
    InvestmentReturnRepository,
    SyncModeEnum,
    SyncRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isPositiveNumber, isDefined } from '@rnw-community/shared';

import { INZHUR_CASH_EXTERNAL_ID } from '../constant/inzhur-cash-external-id.constant';
import { toKyivDay } from '../utils/to-kyiv-day.util';

import { InzhurSetupLookupService } from './inzhur-setup-lookup.service';

import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { InzhurStatementReminderInterface } from '../interface/inzhur-statement-reminder.interface';

export class InzhurSetupService extends Context.Service<InzhurSetupService>()('@budgie/sync/InzhurSetupService', {
    make: Effect.gen(function* () {
        const accountService = yield* AccountService;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const investmentReturnRepository = yield* InvestmentReturnRepository;
        const syncRepository = yield* SyncRepository;
        const inzhurSetupLookupService = yield* InzhurSetupLookupService;
        const provider = ExternalSourceEnum.INZHUR;
        const staleStatementDays = 30;

        const setup = Effect.fn('InzhurSetupService.setup')(
            function* () {
                const existingSetup = yield* inzhurSetupLookupService.findSetup();

                if (isDefined(existingSetup)) {
                    return existingSetup;
                }

                const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);

                if (!isDefined(hryvnia)) {
                    return yield* Effect.die(new Error('Hryvnia instrument not found'));
                }

                const integration =
                    (yield* bankIntegrationRepository.findFileImportIntegration(provider)) ??
                    (yield* bankIntegrationRepository.create({ provider, token: '' }));
                const cashAccounts = yield* accountService.bulkCreate([
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
                ]);
                const cashAccount = Object.values(cashAccounts).at(0);

                if (!isDefined(cashAccount)) {
                    return yield* Effect.die(new Error('Failed to create Inzhur cash account'));
                }

                const cashSync = yield* syncRepository.create({
                    accountId: cashAccount.id,
                    provider,
                    enabled: true,
                    mode: SyncModeEnum.FORWARD
                });

                return {
                    integration,
                    cashAccount,
                    cashSync,
                    fundAccounts: [],
                    lastStatementDate: null
                } satisfies InzhurSetupInterface;
            },
            effect => Db.transaction(effect)
        );

        const findStatementReminder = Effect.fn('InzhurSetupService.findStatementReminder')(function* (now: Date) {
            const setup = yield* inzhurSetupLookupService.findSetup();

            if (!isDefined(setup)) {
                return null;
            }

            const { cashSync, cashAccount } = setup;
            const lastImportAt = cashSync.forwardSyncedAt;

            if (!isDefined(lastImportAt)) {
                return null;
            }

            const daysOld = differenceInCalendarDays(now, lastImportAt);

            if (daysOld <= staleStatementDays) {
                return null;
            }

            const activityCount = yield* investmentReturnRepository.countTransfersSince(cashAccount.id, lastImportAt);

            return isPositiveNumber(activityCount)
                ? ({ daysOld, lastStatementDate: toKyivDay(lastImportAt) } satisfies InzhurStatementReminderInterface)
                : null;
        });

        return { findSetup: inzhurSetupLookupService.findSetup, setup, findStatementReminder };
    })
}) {
    static readonly layer = Layer.effect(InzhurSetupService, InzhurSetupService.make).pipe(
        Layer.provide([
            AccountService.layer,
            BankIntegrationRepository.layer,
            InzhurSetupLookupService.layer,
            InstrumentRepository.layer,
            InvestmentReturnRepository.layer,
            SyncRepository.layer
        ])
    );
}
