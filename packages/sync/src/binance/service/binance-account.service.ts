import { AccountBalanceRepository, AccountRepository, AccountTypeEnum, InstrumentRepository } from '@budgie/contracts';
import { AccountService, convertToMicroUnits } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { mapSyncAccountToCreateInput } from '../../core/util/map-sync-account-to-create-input.util';
import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';
import { binanceMapper } from '../mapper/binance.mapper';
import { decodeBinanceAccountId } from '../util/binance-account-id.util';

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

            return isDefined(decoded) ? binanceMapper.mapBalanceToAccount(decoded.asset, decoded.wallet, 0) : null;
        };

        const anchorAccountBalance = Effect.fnUntraced(function* (accountId: number, balance: number) {
            yield* accountBalanceRepository.upsert({ accountId, amount: convertToMicroUnits(balance) });
        });

        const getOrCreateAccount = Effect.fnUntraced(function* (
            resolvableAccount: BinanceResolvableAccountInterface,
            integrationId: number
        ) {
            const existingAccount = (yield* accountRepository.findByExternalIds([resolvableAccount.exchangeAccount.id])).at(0);
            if (isDefined(existingAccount)) {
                return existingAccount;
            }

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
            codecAccountId: string,
            resolvableAccount: BinanceResolvableAccountInterface | null,
            integrationId: number
        ) {
            const existingAccount = (yield* accountRepository.findByExternalIds([codecAccountId])).at(0);
            if (isDefined(existingAccount)) {
                return existingAccount;
            }

            return isDefined(resolvableAccount) ? yield* getOrCreateAccount(resolvableAccount, integrationId) : null;
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
                    const exchangeAccount = exchangeAccountById.get(codecAccountId) ?? decodeExchangeAccount(codecAccountId);
                    const resolvableAccount = isDefined(exchangeAccount) ? toResolvableAccount(exchangeAccount, instruments) : null;

                    return resolveTransferAccount(codecAccountId, resolvableAccount, integrationId);
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
            anchorAllBalances: Effect.fn('BinanceAccountService.anchorAllBalances')(function* (exchangeAccounts: SyncAccountInterface[]) {
                const accounts = yield* accountRepository.findByExternalSource(BINANCE_ACCOUNT_DEFINITION.provider);
                const exchangeAccountByExternalId = new Map(exchangeAccounts.map(exchangeAccount => [exchangeAccount.id, exchangeAccount]));
                for (const account of accounts) {
                    const exchangeAccount = isNotEmptyString(account.externalId)
                        ? exchangeAccountByExternalId.get(account.externalId)
                        : null;
                    if (!isDefined(exchangeAccount) || exchangeAccount.balanceState === SyncAccountBalanceStateEnum.REPRESENTABLE) {
                        yield* anchorAccountBalance(account.id, exchangeAccount?.balance ?? 0);
                    }
                }
            }),
            setupAccount: Effect.fn('BinanceAccountService.setupAccount')(function* (
                resolvableAccount: BinanceResolvableAccountInterface,
                integrationId: number
            ) {
                const account = yield* getOrCreateAccount(resolvableAccount, integrationId);
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
            AccountRepository.layer,
            AccountBalanceRepository.layer,
            InstrumentRepository.layer,
            AccountService.layer,
            BinanceAssetCodeService.layer
        ])
    );
}
