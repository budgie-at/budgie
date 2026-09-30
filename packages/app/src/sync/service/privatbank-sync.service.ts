import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { PrivatbankFileClient, parsePrivatbankXlsx } from '@budgie/sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { fileSyncDependenciesLayer } from '../layer/file-sync-dependencies.layer';
import { generateDefaultSyncAccountTitle } from '../util/generate-default-sync-account-title.util';
import { makeFileSyncService } from '../util/make-file-sync-service.util';
import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

import { PrivatbankCategoryMatcherService } from './privatbank-category-matcher.service';

import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { SyncAccountInterface } from '@budgie/sync';

export class PrivatbankSyncService extends Context.Service<PrivatbankSyncService>()('@budgie/app/PrivatbankSyncService', {
    make: Effect.gen(function* () {
        const privatbankCategoryMatcherService = yield* PrivatbankCategoryMatcherService;

        const collectUniqueCategories = (client: FileBasedSyncClientInterface, accountIds: string[]): string[] => {
            const categorySet = new Set<string>();

            for (const accountId of accountIds) {
                const transactions = client.getTransactions(accountId);
                for (const transaction of transactions) {
                    if (isDefined(transaction.category) && isNotEmptyString(transaction.category)) {
                        categorySet.add(transaction.category);
                    }
                }
            }

            return [...categorySet];
        };

        return yield* makeFileSyncService({
            provider: ExternalSourceEnum.PRIVATBANK,
            accountType: AccountTypeEnum.BANK_SYNC,
            // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
            generateAccountTitle: account => generateDefaultSyncAccountTitle('Privatbank', account),
            accountIcon: () => UserIconNameEnum.Landmark,
            resolveMccCategoryIdMap: Effect.fn('PrivatbankSyncService.resolveMccCategoryIdMap')(function* (
                client: FileBasedSyncClientInterface,
                bankAccounts: SyncAccountInterface[]
            ) {
                const uniqueCategories = collectUniqueCategories(
                    client,
                    bankAccounts.map(account => account.id)
                );

                return yield* privatbankCategoryMatcherService.match(uniqueCategories);
            }),
            parseFile: Effect.fn('PrivatbankSyncService.parseFile')(function* (uri: string) {
                const buffer = yield* Effect.promise(() => readFileAsUint8Array(uri));
                const rows = yield* parsePrivatbankXlsx(buffer);
                const client = new PrivatbankFileClient(rows);

                return { client, bankAccounts: client.getAccounts() };
            })
        });
    })
}) {
    static readonly layer = Layer.effect(PrivatbankSyncService, PrivatbankSyncService.make).pipe(
        Layer.provide([fileSyncDependenciesLayer, PrivatbankCategoryMatcherService.layer])
    );
}
