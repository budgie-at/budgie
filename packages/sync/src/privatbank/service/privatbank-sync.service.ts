import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { fileSyncDependenciesLayer } from '../../core/layer/file-sync-dependencies.layer';
import { SyncFileReader } from '../../core/port/sync-file-reader.port';
import { generateDefaultSyncAccountTitle } from '../../core/util/generate-default-sync-account-title.util';
import { makeFileSyncService } from '../../core/util/make-file-sync-service.util';
import { PrivatbankFileClient } from '../client/privatbank-file.client';
import { parsePrivatbankXlsx } from '../util/parse-privatbank-xlsx.util';

import { PrivatbankCategoryMatcherService } from './privatbank-category-matcher.service';

import type { FileBasedSyncClientInterface } from '../../core/interface/file-based-sync-client.interface';
import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';

export class PrivatbankSyncService extends Context.Service<PrivatbankSyncService>()('@budgie/sync/PrivatbankSyncService', {
    make: Effect.gen(function* () {
        const privatbankCategoryMatcherService = yield* PrivatbankCategoryMatcherService;
        const syncFileReader = yield* SyncFileReader;

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
                const buffer = yield* syncFileReader.readBytes(uri);
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
