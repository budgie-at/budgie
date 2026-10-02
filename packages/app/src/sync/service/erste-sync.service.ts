import { AccountTypeEnum, ExternalSourceEnum, MccCategoryRepository, SettingsRepository, UserIconNameEnum } from '@budgie/contracts';
import { ErsteFileClient } from '@budgie/sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { fileSyncDependenciesLayer } from '../layer/file-sync-dependencies.layer';
import { extractPdfTextItems } from '../util/extract-pdf-text-items.util';
import { generateDefaultSyncAccountTitle } from '../util/generate-default-sync-account-title.util';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';
import { makeFileSyncService } from '../util/make-file-sync-service.util';

export class ErsteSyncService extends Context.Service<ErsteSyncService>()('@budgie/app/ErsteSyncService', {
    make: Effect.gen(function* () {
        const mccCategoryRepository = yield* MccCategoryRepository;
        const settingsRepository = yield* SettingsRepository;

        return yield* makeFileSyncService({
            provider: ExternalSourceEnum.ERSTE,
            accountType: AccountTypeEnum.BANK_SYNC,
            // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
            generateAccountTitle: account => generateDefaultSyncAccountTitle('Erste', account),
            accountIcon: () => UserIconNameEnum.Landmark,
            parseFile: Effect.fn('ErsteSyncService.parseFile')(function* (uri: string) {
                const items = yield* Effect.promise(() => extractPdfTextItems(uri));
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
