import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateSoftDeleteResultInterface } from '../interface/sync-duplicate-soft-delete-result.interface';

export class SyncDuplicateSoftDeleteService extends Context.Service<SyncDuplicateSoftDeleteService>()(
    '@budgie/sync/SyncDuplicateSoftDeleteService',
    {
        make: Effect.sync(() => {
            const sqliteBatchSize = 500;

            const buildPlaceholders = (duplicateTransactionIds: readonly number[]): string =>
                duplicateTransactionIds.map(() => '?').join(',');

            const softDeleteChunk = Effect.fnUntraced(function* (chunk: readonly number[]) {
                const rows = yield* Db.query(db =>
                    db.$client.unsafe<Pick<SyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
                        String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND id IN (${buildPlaceholders(chunk)}) RETURNING id AS duplicateTransactionId`,
                        [...chunk]
                    )
                );
                const updatedIds = rows.map(row => row.duplicateTransactionId);

                if (isNotEmptyArray(updatedIds)) {
                    yield* Db.query(
                        db =>
                            db.$client.unsafe(
                                String.raw`UPDATE transaction_entries SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND transaction_id IN (${buildPlaceholders(updatedIds)})`,
                                updatedIds
                            ).raw
                    );
                    yield* Db.query(
                        db =>
                            db.$client.unsafe(
                                String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IN (${buildPlaceholders(updatedIds)})`,
                                updatedIds
                            ).raw
                    );
                }

                return updatedIds;
            });

            return {
                remove: Effect.fn('SyncDuplicateSoftDeleteService.remove')(function* (duplicateTransactionIds: readonly number[]) {
                    const updatedTransactionIds: number[] = [];

                    for (let index = 0; index < duplicateTransactionIds.length; index += sqliteBatchSize) {
                        updatedTransactionIds.push(
                            ...(yield* Db.mutation(
                                { type: 'update', tables: ['transactions', 'transaction_entries'] },
                                softDeleteChunk(duplicateTransactionIds.slice(index, index + sqliteBatchSize))
                            ))
                        );
                    }

                    return { updatedTransactionIds } satisfies SyncDuplicateSoftDeleteResultInterface;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncDuplicateSoftDeleteService, SyncDuplicateSoftDeleteService.make);
}
