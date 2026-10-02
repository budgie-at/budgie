import { ExternalSourceEnum, SyncRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { BinanceSyncService } from './binance-sync.service';
import { ErsteSyncService } from './erste-sync.service';
import { MonobankSyncService } from './monobank-sync.service';
import { PrivatbankSyncService } from './privatbank-sync.service';

export class SyncProviderRegistryService extends Context.Service<SyncProviderRegistryService>()('@budgie/app/SyncProviderRegistryService', {
    make: Effect.gen(function* () {
        const syncRepository = yield* SyncRepository;
        const monobankSyncService = yield* MonobankSyncService;
        const binanceSyncService = yield* BinanceSyncService;
        const ersteSyncService = yield* ErsteSyncService;
        const privatbankSyncService = yield* PrivatbankSyncService;
        const serviceByProvider = new Map<
            ExternalSourceEnum,
            typeof monobankSyncService | typeof binanceSyncService | typeof ersteSyncService
        >([
            [ExternalSourceEnum.MONOBANK, monobankSyncService],
            [ExternalSourceEnum.BINANCE, binanceSyncService],
            [ExternalSourceEnum.ERSTE, ersteSyncService],
            [ExternalSourceEnum.PRIVATBANK, privatbankSyncService]
        ]);

        return {
            getServiceForAccount: Effect.fn('SyncProviderRegistryService.getServiceForAccount')(function* (accountId: number) {
                const sync = yield* syncRepository.getByAccountId(accountId);
                if (!isDefined(sync)) {
                    return null;
                }

                return serviceByProvider.get(sync.provider) ?? null;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncProviderRegistryService, SyncProviderRegistryService.make).pipe(
        Layer.provide([
            SyncRepository.layer,
            MonobankSyncService.layer,
            BinanceSyncService.layer,
            ErsteSyncService.layer,
            PrivatbankSyncService.layer
        ])
    );
}
