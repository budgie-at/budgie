import { AccountRepository, AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { fileSyncDependenciesLayer } from '../../core/layer/file-sync-dependencies.layer';
import { SyncFileReader } from '../../core/port/sync-file-reader.port';
import { generateDefaultSyncAccountTitle } from '../../core/utils/generate-default-sync-account-title.util';
import { makeFileSyncService } from '../../core/utils/make-file-sync-service.util';
import { parseWiseCsv } from '../parser/wise-csv.parser';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';

export class WiseStatementImportService extends Context.Service<WiseStatementImportService>()('@budgie/sync/WiseStatementImportService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const syncFileReader = yield* SyncFileReader;

        const fileSyncService = yield* makeFileSyncService({
            provider: ExternalSourceEnum.WISE,
            accountType: AccountTypeEnum.BANK_SYNC,
            generateAccountTitle: account => generateDefaultSyncAccountTitle('Wise', account),
            accountIcon: () => UserIconNameEnum.Landmark,
            resolveMccCategoryIdMap: () => Effect.succeed(new Map())
        });

        return {
            importForIntegration: Effect.fn('WiseStatementImportService.importForIntegration')(function* (
                uri: string,
                integrationId: number
            ) {
                const text = yield* syncFileReader.readText(uri);
                const transactionsByCurrency = yield* Effect.fromResult(parseWiseCsv(text)).pipe(
                    Effect.mapError(message => SyncInvalidResponseError.make({ provider: SyncProviderEnum.WISE, message }))
                );
                const accounts = yield* accountRepository.findByIntegrationId(integrationId);
                const importable = [...transactionsByCurrency].flatMap(([currencyCode, transactions]) => {
                    const matches = accounts.filter(account => account.instrument.code === currencyCode);
                    const [account] = matches;

                    return matches.length === 1 && isDefined(account.externalId)
                        ? [{ externalId: account.externalId, currencyCode, transactions }]
                        : [];
                });
                const importedCount = importable.reduce((total, { transactions }) => total + transactions.length, 0);
                const parsedCount = [...transactionsByCurrency.values()].reduce((total, transactions) => total + transactions.length, 0);
                const bankAccounts = importable.map(({ externalId, currencyCode }): SyncAccountInterface => ({
                    id: externalId,
                    provider: SyncProviderEnum.WISE,
                    currencyCode,
                    currencyCodeNumeric: 0,
                    balance: 0,
                    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
                    creditLimit: 0,
                    type: SyncAccountTypeEnum.CHECKING
                }));
                const transactionsByExternalId = new Map(importable.map(({ externalId, transactions }) => [externalId, transactions]));
                const skippedTransactionCount = parsedCount - importedCount;

                const result = yield* fileSyncService.importParsed(
                    {
                        getAccounts: () => bankAccounts,
                        getTransactions: externalId => transactionsByExternalId.get(externalId) ?? []
                    },
                    bankAccounts
                );

                return { ...result, accountCount: accounts.length, skippedTransactionCount };
            })
        };
    })
}) {
    static readonly layer = Layer.effect(WiseStatementImportService, WiseStatementImportService.make).pipe(
        Layer.provide([fileSyncDependenciesLayer, AccountRepository.layer])
    );
}
