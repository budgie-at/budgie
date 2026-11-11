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

        const buildBankAccount = (id: string, currencyCode: string): SyncAccountInterface => ({
            id,
            provider: SyncProviderEnum.WISE,
            currencyCode,
            currencyCodeNumeric: 0,
            balance: 0,
            balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
            creditLimit: 0,
            type: SyncAccountTypeEnum.CHECKING
        });

        const parseFile = Effect.fn('WiseStatementImportService.parseFile')(function* (uri: string) {
            const text = yield* syncFileReader.readText(uri);
            const transactionsByCurrency = yield* Effect.fromResult(parseWiseCsv(text)).pipe(
                Effect.mapError(message => SyncInvalidResponseError.make({ provider: SyncProviderEnum.WISE, message }))
            );
            const bankAccounts = [...transactionsByCurrency.keys()].map(currencyCode => buildBankAccount(currencyCode, currencyCode));

            return {
                client: {
                    getAccounts: () => bankAccounts,
                    getTransactions: (currencyCode: string) => transactionsByCurrency.get(currencyCode) ?? []
                },
                bankAccounts
            };
        });

        const fileSyncService = yield* makeFileSyncService({
            provider: ExternalSourceEnum.WISE,
            accountType: AccountTypeEnum.BANK_SYNC,
            generateAccountTitle: account => generateDefaultSyncAccountTitle('Wise', account),
            accountIcon: () => UserIconNameEnum.Landmark,
            parseFile,
            resolveMccCategoryIdMap: () => Effect.succeed(new Map())
        });

        return {
            importForIntegration: Effect.fn('WiseStatementImportService.importForIntegration')(function* (
                uri: string,
                integrationId: number
            ) {
                const { client, bankAccounts: fileBankAccounts } = yield* parseFile(uri);
                const accounts = yield* accountRepository.findByIntegrationId(integrationId);
                const matches = fileBankAccounts.flatMap(({ currencyCode }) => {
                    const candidates = accounts.filter(account => account.instrument.code === currencyCode);
                    const [account] = candidates;

                    return candidates.length === 1 && isDefined(account.externalId)
                        ? [{ externalId: account.externalId, currencyCode, transactions: client.getTransactions(currencyCode) }]
                        : [];
                });
                const transactionsByExternalId = new Map(matches.map(({ externalId, transactions }) => [externalId, transactions]));
                const bankAccounts = matches.map(({ externalId, currencyCode }) => buildBankAccount(externalId, currencyCode));
                const countTransactions = (groups: Iterable<readonly unknown[]>) =>
                    [...groups].reduce((total, group) => total + group.length, 0);
                const skippedTransactionCount =
                    countTransactions(fileBankAccounts.map(({ currencyCode }) => client.getTransactions(currencyCode))) -
                    countTransactions(transactionsByExternalId.values());

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
