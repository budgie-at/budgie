import { AccountTypeEnum, ExternalSourceEnum, loadMccCategoryLookupMap, MccCategoryRepository, SettingsRepository, UserIconNameEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { fileSyncDependenciesLayer } from '../../core/layer/file-sync-dependencies.layer';
import { SyncFileReader } from '../../core/port/sync-file-reader.port';
import { generateDefaultSyncAccountTitle } from '../../core/util/generate-default-sync-account-title.util';
import { makeFileSyncService } from '../../core/util/make-file-sync-service.util';
import { ErsteFileClient } from '../client/erste-file.client';

export class ErsteSyncService extends Context.Service<ErsteSyncService>()('@budgie/sync/ErsteSyncService', {
    make: Effect.gen(function* () {
        const mccCategoryRepository = yield* MccCategoryRepository;
        const settingsRepository = yield* SettingsRepository;
        const syncFileReader = yield* SyncFileReader;

        return yield* makeFileSyncService({
            provider: ExternalSourceEnum.ERSTE,
            accountType: AccountTypeEnum.BANK_SYNC,
            generateAccountTitle: account => generateDefaultSyncAccountTitle('Erste', account),
            accountIcon: () => UserIconNameEnum.Landmark,
            parseFile: Effect.fn('ErsteSyncService.parseFile')(function* (uri: string) {
                const items = yield* syncFileReader.readPdfTextItems(uri);
                const ersteClient = new ErsteFileClient();
                yield* ersteClient.parse(items);

                return {
                    client: {
                        getAccounts: () => ersteClient.getAccounts(),
                        getTransactions: () => ersteClient.getTransactions()
                    },
                    bankAccounts: ersteClient.getAccounts()
                };
            }),
            resolveMccCategoryIdMap: () => loadMccCategoryLookupMap(mccCategoryRepository, settingsRepository),
            resolveMccCategoryLookupKey: transaction => String(transaction.mcc)
        });
    })
}) {
    static readonly layer = Layer.effect(ErsteSyncService, ErsteSyncService.make).pipe(
        Layer.provide([fileSyncDependenciesLayer, MccCategoryRepository.layer, SettingsRepository.layer])
    );
}
