import {
    AccountBalanceRepository,
    AccountRepository,
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

import { isDefined } from '@rnw-community/shared';

import { INZHUR_CASH_EXTERNAL_ID } from '../constant/inzhur-cash-external-id.constant';
import { InzhurNotSetUpError } from '../error/inzhur-not-set-up.error';
import { buildInzhurEntry } from '../utils/build-inzhur-entry.util';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';

import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { InzhurStatementReminderInterface } from '../interface/inzhur-statement-reminder.interface';

export class InzhurSetupService extends Context.Service<InzhurSetupService>()('@budgie/sync/InzhurSetupService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountService = yield* AccountService;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const investmentReturnRepository = yield* InvestmentReturnRepository;
        const syncRepository = yield* SyncRepository;
        const transactionService = yield* TransactionService;
        const provider = ExternalSourceEnum.INZHUR;
        const staleStatementDays = 30;
        const estimatedDividendTitle = 'Inzhur dividends (estimated)';
        const balanceCorrectionTitle = 'Inzhur balance correction';

        const findSetup = Effect.fn('InzhurSetupService.findSetup')(function* () {
            const integration = yield* bankIntegrationRepository.findFileImportIntegration(provider);

            if (!isDefined(integration)) {
                return null;
            }

            const accounts = (yield* accountRepository.findByExternalSource(provider)).filter(
                account => account.integrationId === integration.id
            );
            const cashAccount = accounts.find(account => account.externalId === INZHUR_CASH_EXTERNAL_ID);
            const cashSync = isDefined(cashAccount) ? yield* syncRepository.getByAccountId(cashAccount.id) : null;

            if (!isDefined(cashAccount) || !isDefined(cashSync)) {
                return null;
            }

            return {
                integration,
                cashAccount,
                cashSync,
                fundAccounts: accounts.filter(account => account.id !== cashAccount.id),
                lastStatementDate: cashSync.forwardSyncedAt?.toISOString().slice(0, 10) ?? null
            } satisfies InzhurSetupInterface;
        });

        const setup = Effect.fn('InzhurSetupService.setup')(
            function* (openingCashBalance: number) {
                const existingSetup = yield* findSetup();

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
                const cashAccount = Object.values(
                    yield* accountService.bulkCreate([
                        {
                            title: 'Inzhur',
                            type: AccountTypeEnum.BANK_SYNC,
                            icon: UserIconNameEnum.Landmark,
                            instrumentId: hryvnia.id,
                            currentBalance: openingCashBalance,
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

                return { integration, cashAccount, cashSync, fundAccounts: [], lastStatementDate: null } satisfies InzhurSetupInterface;
            },
            effect => Db.transaction(effect)
        );

        const setActualBalance = Effect.fn('InzhurSetupService.setActualBalance')(
            function* (actualBalance: number) {
                const setup = yield* findSetup();

                if (!isDefined(setup)) {
                    return yield* new InzhurNotSetUpError();
                }

                const { cashAccount } = setup;
                const currentMicroUnits = (yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0)?.balance ?? 0;
                const differenceMicroUnits = convertToMicroUnits(actualBalance) - currentMicroUnits;

                const operatedAt = new Date();

                if (differenceMicroUnits < 0) {
                    yield* accountService.adjustBalanceTo(cashAccount.id, actualBalance, operatedAt, balanceCorrectionTitle);
                }

                if (differenceMicroUnits > 0) {
                    const externalId = `inzhur:actual-balance:${cashAccount.id}:${actualBalance}`;
                    const entry = {
                        ...buildInzhurEntry(
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

        const findStatementReminder = Effect.fn('InzhurSetupService.findStatementReminder')(function* (now: Date) {
            const setup = yield* findSetup();
            const { lastStatementDate, cashSync, cashAccount } = setup ?? {};

            if (!isDefined(lastStatementDate) || !isDefined(cashSync?.forwardSyncedAt) || !isDefined(cashAccount)) {
                return null;
            }

            const daysOld = differenceInCalendarDays(now, cashSync.forwardSyncedAt);

            if (daysOld <= staleStatementDays) {
                return null;
            }

            const activityCount = yield* investmentReturnRepository.countTransfersSince(cashAccount.id, cashSync.forwardSyncedAt);

            return activityCount > 0 ? ({ daysOld, lastStatementDate } satisfies InzhurStatementReminderInterface) : null;
        });

        return { findSetup, setup, setActualBalance, findStatementReminder };
    })
}) {
    static readonly layer = Layer.effect(InzhurSetupService, InzhurSetupService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            AccountRepository.layer,
            AccountService.layer,
            BankIntegrationRepository.layer,
            InstrumentRepository.layer,
            InvestmentReturnRepository.layer,
            SyncRepository.layer,
            TransactionService.layer
        ])
    );
}
