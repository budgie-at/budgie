import { AccountBalanceRepository, AccountRepository, AccountTypeEnum, InstrumentRepository, convertToMicroUnits } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTokenClientMismatchError } from '../../core/error/sync-token-client-mismatch.error';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { mapSyncAccountToCreateInput } from '../../core/utils/map-sync-account-to-create-input.util';
import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';
import { mapBinanceBalanceToAccount } from '../mapper/binance.mapper';
import { decodeBinanceAccountId, encodeBinanceAccountId } from '../utils/binance-account-id.util';

import { BinanceAssetCodeService } from './binance-asset-code.service';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { BinanceResolvableAccountInterface } from '../interface/binance-resolvable-account.interface';
import type { InstrumentEntityInterface } from '@budgie/contracts';

export class BinanceAccountService extends Context.Service<BinanceAccountService>()('@budgie/sync/BinanceAccountService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const accountService = yield* AccountService;
        const binanceAssetCodeService = yield* BinanceAssetCodeService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const { provider } = BINANCE_ACCOUNT_DEFINITION;

        const resolveInstrument = (exchangeAccount: SyncAccountInterface, instruments: InstrumentEntityInterface[]) => {
            const instrumentCode = binanceAssetCodeService.resolveInstrumentCode(exchangeAccount.currencyCode);

            return instruments.find(instrument => instrument.code === instrumentCode) ?? null;
        };

        const toResolvableAccount = (
            exchangeAccount: SyncAccountInterface,
            instruments: InstrumentEntityInterface[]
        ): BinanceResolvableAccountInterface | null => {
            const instrument = resolveInstrument(exchangeAccount, instruments);

            return isDefined(instrument) ? { exchangeAccount, instrumentId: instrument.id } : null;
        };

        const decodeExchangeAccount = (codecAccountId: string): SyncAccountInterface | null => {
            const decoded = decodeBinanceAccountId(codecAccountId);

            return isDefined(decoded) ? mapBinanceBalanceToAccount(decoded.asset, decoded.wallet, 0) : null;
        };

        const anchorAccountBalance = Effect.fnUntraced(function* (accountId: number, balance: number) {
            yield* accountBalanceRepository.upsert({ accountId, amount: convertToMicroUnits(balance) });
        });

        const canonicalizeAccountId = (codecAccountId: string): string => {
            const decoded = decodeBinanceAccountId(codecAccountId);

            return isDefined(decoded)
                ? encodeBinanceAccountId({ wallet: decoded.wallet, asset: binanceAssetCodeService.resolveInstrumentCode(decoded.asset) })
                : codecAccountId;
        };

        const findIntegrationAccounts = Effect.fnUntraced(function* (externalId: string, integrationId: number) {
            return (yield* accountRepository.findIncludingArchivedByExternalKeys([externalId])).filter(
                account =>
                    account.externalId === externalId && (account.integrationId === integrationId || !isDefined(account.integrationId))
            );
        });

        const findAnchorableBalances = Effect.fn('BinanceAccountService.findAnchorableBalances')(function* (
            exchangeAccounts: SyncAccountInterface[],
            integrationId: number
        ) {
            const accounts = (yield* accountRepository.findByExternalSource(BINANCE_ACCOUNT_DEFINITION.provider)).filter(
                account => account.integrationId === integrationId
            );
            const exchangeAccountByExternalId = new Map(exchangeAccounts.map(exchangeAccount => [exchangeAccount.id, exchangeAccount]));

            return accounts.flatMap(account => {
                const exchangeAccount = isNotEmptyString(account.externalId) ? exchangeAccountByExternalId.get(account.externalId) : null;
                const isAliasedAccount =
                    isNotEmptyString(account.externalId) && canonicalizeAccountId(account.externalId) !== account.externalId;

                return !isAliasedAccount &&
                    (!isDefined(exchangeAccount) || exchangeAccount.balanceState === SyncAccountBalanceStateEnum.REPRESENTABLE)
                    ? [{ account, balance: exchangeAccount?.balance ?? 0 }]
                    : [];
            });
        });

        const createAccount = Effect.fnUntraced(function* (resolvableAccount: BinanceResolvableAccountInterface, integrationId: number) {
            const createdAccount = Object.values(
                yield* accountService.bulkCreate([
                    {
                        ...mapSyncAccountToCreateInput(
                            BINANCE_ACCOUNT_DEFINITION,
                            resolvableAccount.exchangeAccount,
                            resolvableAccount.instrumentId
                        ),
                        integrationId
                    }
                ])
            ).at(0);
            if (!isDefined(createdAccount)) {
                return yield* Effect.die(new Error('Failed to create Binance account'));
            }

            return createdAccount;
        });

        const resolveTransferAccount = Effect.fnUntraced(function* (
            canonicalAccountId: string,
            resolvableAccount: BinanceResolvableAccountInterface | null,
            integrationId: number
        ) {
            const knownAccounts = yield* findIntegrationAccounts(canonicalAccountId, integrationId);
            const activeAccount = knownAccounts.find(account => !isDefined(account.deletedAt));
            if (isDefined(activeAccount)) {
                return activeAccount;
            }

            return isNotEmptyArray(knownAccounts) || !isDefined(resolvableAccount)
                ? null
                : yield* createAccount(resolvableAccount, integrationId);
        });

        return {
            findResolvableAccounts: Effect.fn('BinanceAccountService.findResolvableAccounts')(function* (
                exchangeAccounts: SyncAccountInterface[]
            ) {
                const instruments = yield* instrumentRepository.getAll();

                return exchangeAccounts.map(exchangeAccount => toResolvableAccount(exchangeAccount, instruments)).filter(isDefined);
            }),
            buildAccountResolver: Effect.fn('BinanceAccountService.buildAccountResolver')(function* (
                exchangeAccounts: SyncAccountInterface[],
                integrationId: number
            ) {
                const exchangeAccountById = new Map(exchangeAccounts.map(account => [account.id, account]));
                const instruments = yield* instrumentRepository.getAll();

                return (codecAccountId: string) => {
                    const canonicalAccountId = canonicalizeAccountId(codecAccountId);
                    const exchangeAccount = exchangeAccountById.get(canonicalAccountId) ?? decodeExchangeAccount(canonicalAccountId);
                    const resolvableAccount = isDefined(exchangeAccount) ? toResolvableAccount(exchangeAccount, instruments) : null;

                    return resolveTransferAccount(canonicalAccountId, resolvableAccount, integrationId);
                };
            }),
            attachOrphanAccounts: Effect.fn('BinanceAccountService.attachOrphanAccounts')(function* (integrationId: number) {
                const accounts = yield* accountRepository.findByExternalSource(BINANCE_ACCOUNT_DEFINITION.provider);
                yield* Effect.forEach(
                    accounts.filter(account => account.type === AccountTypeEnum.CRYPTO_SYNC && !isDefined(account.integrationId)),
                    account => accountRepository.updateById(account.id, { integrationId }),
                    { concurrency: 'unbounded', discard: true }
                );
            }),
            findAnchorableBalances,
            assertSameClient: Effect.fn('BinanceAccountService.assertSameClient')(function* (integrationId: number, clientId: string) {
                const storedClientId = yield* syncIntegrationTokenService.findIntegrationClientId(integrationId);
                if (isNotEmptyString(storedClientId) && storedClientId !== clientId) {
                    return yield* new SyncTokenClientMismatchError({
                        provider: SyncProviderEnum.BINANCE,
                        integrationId,
                        message: 'This Binance API key belongs to a different account'
                    });
                }
            }),
            resolveSetupIntegration: Effect.fn('BinanceAccountService.resolveSetupIntegration')(function* (
                token: string,
                clientId: string
            ) {
                const sameClientIntegration = yield* syncIntegrationTokenService.findIntegrationByClientId(provider, clientId);
                if (isDefined(sameClientIntegration) && sameClientIntegration.token !== token) {
                    yield* syncIntegrationTokenService.updateIntegrationToken(sameClientIntegration.id, token);

                    return sameClientIntegration;
                }

                const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
                yield* syncIntegrationTokenService.fillIntegrationClientId(integration.id, clientId);

                return integration;
            }),
            anchorAllBalances: Effect.fn('BinanceAccountService.anchorAllBalances')(function* (
                exchangeAccounts: SyncAccountInterface[],
                integrationId: number
            ) {
                for (const { account, balance } of yield* findAnchorableBalances(exchangeAccounts, integrationId)) {
                    yield* anchorAccountBalance(account.id, balance);
                }
            }),
            setupAccount: Effect.fn('BinanceAccountService.setupAccount')(function* (
                resolvableAccount: BinanceResolvableAccountInterface,
                integrationId: number
            ) {
                const account =
                    (yield* findIntegrationAccounts(resolvableAccount.exchangeAccount.id, integrationId)).find(
                        knownAccount => !isDefined(knownAccount.deletedAt)
                    ) ?? (yield* createAccount(resolvableAccount, integrationId));
                if (resolvableAccount.exchangeAccount.balanceState === SyncAccountBalanceStateEnum.REPRESENTABLE) {
                    yield* anchorAccountBalance(account.id, resolvableAccount.exchangeAccount.balance);
                }

                return account;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BinanceAccountService, BinanceAccountService.make).pipe(
        Layer.provide([
            pollingSyncDependenciesLayer,
            AccountRepository.layer,
            AccountBalanceRepository.layer,
            InstrumentRepository.layer,
            AccountService.layer,
            BinanceAssetCodeService.layer
        ])
    );
}
