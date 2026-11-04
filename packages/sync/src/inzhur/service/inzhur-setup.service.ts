import {
    AccountRepository,
    AccountTypeEnum,
    BankIntegrationRepository,
    CurrencyEnum,
    Db,
    ExternalSourceEnum,
    InstrumentRepository,
    SyncModeEnum,
    SyncRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { INZHUR_CASH_EXTERNAL_ID } from '../constant/inzhur-cash-external-id.constant';

import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';

export class InzhurSetupService extends Context.Service<InzhurSetupService>()('@budgie/sync/InzhurSetupService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountService = yield* AccountService;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const syncRepository = yield* SyncRepository;
        const provider = ExternalSourceEnum.INZHUR;

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

        return { findSetup, setup };
    })
}) {
    static readonly layer = Layer.effect(InzhurSetupService, InzhurSetupService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            AccountService.layer,
            BankIntegrationRepository.layer,
            InstrumentRepository.layer,
            SyncRepository.layer
        ])
    );
}
