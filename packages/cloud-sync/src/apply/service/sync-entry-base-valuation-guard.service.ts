import { TransactionEntryBaseValuationRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray, isNumber } from '@rnw-community/shared';

import type { SyncLocalRowInterface } from '../interface/sync-local-row.interface';
import type { SyncBaseValuationGuardType } from '../type/sync-base-valuation-guard.type';

export class SyncEntryBaseValuationGuard extends Context.Service<SyncEntryBaseValuationGuard>()(
    '@budgie/cloud-sync/SyncEntryBaseValuationGuard',
    {
        make: Effect.gen(function* () {
            const transactionEntryBaseValuationRepository = yield* TransactionEntryBaseValuationRepository;
            const entriesTable = 'transaction_entries';
            const baseValuationProperties = ['baseInstrumentId', 'baseExchangeRate', 'baseAmount'];
            const passThrough: SyncBaseValuationGuardType = (_, server) => server;

            return {
                forRows: Effect.fn('SyncEntryBaseValuationGuard.forRows')(function* (
                    tableName: string,
                    localRows: readonly SyncLocalRowInterface[],
                    isParentTimingUnchanged: boolean
                ) {
                    const accountIds = localRows.map(row => row['account_id']).filter(isNumber);

                    if (tableName !== entriesTable || !isParentTimingUnchanged || !isNotEmptyArray(accountIds)) {
                        return passThrough;
                    }

                    const marketPricedAccountIdList = yield* transactionEntryBaseValuationRepository.findMarketPricedAccountIds(accountIds);
                    const marketPricedAccountIds = new Set(marketPricedAccountIdList);
                    const guard: SyncBaseValuationGuardType = (local, server) => {
                        const { accountId } = local;
                        const isLedgerUnchanged =
                            isNumber(accountId) &&
                            marketPricedAccountIds.has(accountId) &&
                            server['accountId'] === accountId &&
                            server['amount'] === local['amount'];

                        return isLedgerUnchanged
                            ? {
                                  ...server,
                                  ...Object.fromEntries(baseValuationProperties.map(property => [property, local[property] ?? null]))
                              }
                            : server;
                    };

                    return guard;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncEntryBaseValuationGuard, SyncEntryBaseValuationGuard.make).pipe(
        Layer.provide(TransactionEntryBaseValuationRepository.layer)
    );
}
