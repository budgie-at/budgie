import { AccountRepository, BankIntegrationRepository, ExternalSourceEnum, SyncRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { INZHUR_CASH_EXTERNAL_ID } from '../constant/inzhur-cash-external-id.constant';
import { toKyivDay } from '../utils/to-kyiv-day.util';

import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';

export class InzhurSetupLookupService extends Context.Service<InzhurSetupLookupService>()('@budgie/sync/InzhurSetupLookupService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const syncRepository = yield* SyncRepository;
        const provider = ExternalSourceEnum.INZHUR;

        return {
            findSetup: Effect.fn('InzhurSetupLookupService.findSetup')(function* () {
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
                    lastStatementDate: isDefined(cashSync.forwardSyncedAt) ? toKyivDay(cashSync.forwardSyncedAt) : null
                } satisfies InzhurSetupInterface;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurSetupLookupService, InzhurSetupLookupService.make).pipe(
        Layer.provide([AccountRepository.layer, BankIntegrationRepository.layer, SyncRepository.layer])
    );
}
