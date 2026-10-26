import { BankIntegrationRepository, ExternalSourceEnum, SyncRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { BinanceSyncService } from '../../binance/service/binance-sync.service';
import { ErsteSyncService } from '../../erste/service/erste-sync.service';
import { MonobankSyncService } from '../../monobank/service/monobank-sync.service';
import { PrivatbankSyncService } from '../../privatbank/service/privatbank-sync.service';

import { SyncIntegrationTokenService } from './sync-integration-token.service';

export class SyncProviderRegistryService extends Context.Service<SyncProviderRegistryService>()(
    '@budgie/sync/SyncProviderRegistryService',
    {
        make: Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const bankIntegrationRepository = yield* BankIntegrationRepository;
            const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
            const monobankSyncService = yield* MonobankSyncService;
            const binanceSyncService = yield* BinanceSyncService;
            const ersteSyncService = yield* ErsteSyncService;
            const privatbankSyncService = yield* PrivatbankSyncService;
            const pollingServiceByProvider = new Map<ExternalSourceEnum, typeof monobankSyncService | typeof binanceSyncService>([
                [ExternalSourceEnum.MONOBANK, monobankSyncService],
                [ExternalSourceEnum.BINANCE, binanceSyncService]
            ]);
            const serviceByProvider = new Map<
                ExternalSourceEnum,
                typeof monobankSyncService | typeof binanceSyncService | typeof ersteSyncService
            >([
                ...pollingServiceByProvider,
                [ExternalSourceEnum.ERSTE, ersteSyncService],
                [ExternalSourceEnum.PRIVATBANK, privatbankSyncService]
            ]);

            const getServiceForAccount = Effect.fn('SyncProviderRegistryService.getServiceForAccount')(function* (accountId: number) {
                const sync = yield* syncRepository.getByAccountId(accountId);
                if (!isDefined(sync)) {
                    return null;
                }

                return serviceByProvider.get(sync.provider) ?? null;
            });

            return {
                getServiceForAccount,
                renameIntegration: (integrationId: number, label: string) =>
                    syncIntegrationTokenService.renameIntegration(integrationId, label),
                setAccountSyncEnabled: Effect.fn('SyncProviderRegistryService.setAccountSyncEnabled')(function* (
                    accountId: number,
                    enabled: boolean
                ) {
                    const service = yield* getServiceForAccount(accountId);
                    if (isDefined(service)) {
                        yield* service.setAccountSyncEnabled(accountId, enabled);
                    }
                }),
                updateAccountToken: Effect.fn('SyncProviderRegistryService.updateAccountToken')(function* (
                    accountId: number,
                    token: string
                ) {
                    const sync = yield* syncRepository.getByAccountId(accountId);
                    const service = isDefined(sync) ? pollingServiceByProvider.get(sync.provider) : null;
                    if (isDefined(service)) {
                        yield* service.updateAccountToken(accountId, token);
                    }
                }),
                updateIntegrationToken: Effect.fn('SyncProviderRegistryService.updateIntegrationToken')(function* (
                    integrationId: number,
                    token: string
                ) {
                    const integration = yield* bankIntegrationRepository.findById(integrationId);
                    if (integration?.provider === ExternalSourceEnum.MONOBANK) {
                        yield* monobankSyncService.updateIntegrationToken(integrationId, token);
                    }
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncProviderRegistryService, SyncProviderRegistryService.make).pipe(
        Layer.provide([
            SyncRepository.layer,
            BankIntegrationRepository.layer,
            SyncIntegrationTokenService.layer,
            MonobankSyncService.layer,
            BinanceSyncService.layer,
            ErsteSyncService.layer,
            PrivatbankSyncService.layer
        ])
    );
}
