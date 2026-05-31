import { TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { addDays, startOfDay } from 'date-fns';
import { and, eq, gte, isNull, lt } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

import type { DB, TransactionCreateInputInterface } from '@budgie/contracts';

class ImportedTransactionSemanticMatchService {
    async addMatches(batch: TransactionCreateInputInterface[], existingTransactionIdMap: Map<string, number>, tx: DB): Promise<void> {
        const semanticMatchKeyCountMap = this.buildSemanticMatchKeyCountMap(batch);
        const semanticMatchIds = await Promise.all(
            batch.map(input => this.findUniqueSemanticMatchId(input, existingTransactionIdMap, semanticMatchKeyCountMap, tx))
        );

        semanticMatchIds.forEach((semanticMatchId, index) => {
            const input = batch[index];

            if (isDefined(semanticMatchId) && isDefined(input.externalId)) {
                existingTransactionIdMap.set(input.externalId, semanticMatchId);
            }
        });
    }

    private findUniqueSemanticMatchId(
        input: TransactionCreateInputInterface,
        existingTransactionIdMap: Map<string, number>,
        semanticMatchKeyCountMap: Map<string, number>,
        tx: DB
    ): Promise<number | null> {
        const semanticMatchKey = this.buildSemanticMatchKey(input);

        if (!isDefined(semanticMatchKey) || semanticMatchKeyCountMap.get(semanticMatchKey) !== 1) {
            return Promise.resolve(null);
        }

        return this.findSemanticMatchId(input, existingTransactionIdMap, tx);
    }

    private buildSemanticMatchKeyCountMap(batch: TransactionCreateInputInterface[]): Map<string, number> {
        const semanticMatchKeyCountMap = new Map<string, number>();

        batch.forEach(input => {
            const semanticMatchKey = this.buildSemanticMatchKey(input);

            if (isDefined(semanticMatchKey)) {
                semanticMatchKeyCountMap.set(semanticMatchKey, (semanticMatchKeyCountMap.get(semanticMatchKey) ?? 0) + 1);
            }
        });

        return semanticMatchKeyCountMap;
    }

    private buildSemanticMatchKey(input: TransactionCreateInputInterface): string | null {
        if (!isDefined(input.externalId) || !isDefined(input.externalSource)) {
            return null;
        }

        const [entry] = input.entries;

        if (!isDefined(entry)) {
            return null;
        }

        return [
            input.externalSource,
            input.type,
            input.title,
            input.comment,
            startOfDay(input.operatedAt).getTime(),
            entry.accountId,
            entry.type,
            convertToMicroUnits(entry.amount)
        ].join('|');
    }

    private async findSemanticMatchId(
        input: TransactionCreateInputInterface,
        existingTransactionIdMap: Map<string, number>,
        tx: DB
    ): Promise<number | null> {
        if (!isDefined(input.externalId) || existingTransactionIdMap.has(input.externalId) || !isDefined(input.externalSource)) {
            return null;
        }

        const [entry] = input.entries;

        if (!isDefined(entry)) {
            return null;
        }

        const operatedAtStart = startOfDay(input.operatedAt);
        const operatedAtEnd = addDays(operatedAtStart, 1);
        const matches = await tx
            .selectDistinct({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(
                and(
                    eq(TransactionEntityTable.externalSource, input.externalSource),
                    eq(TransactionEntityTable.type, input.type),
                    eq(TransactionEntityTable.title, input.title),
                    eq(TransactionEntityTable.comment, input.comment),
                    gte(TransactionEntityTable.operatedAt, operatedAtStart),
                    lt(TransactionEntityTable.operatedAt, operatedAtEnd),
                    isNull(TransactionEntityTable.deletedAt),
                    eq(TransactionEntryEntityTable.accountId, entry.accountId),
                    eq(TransactionEntryEntityTable.type, entry.type),
                    eq(TransactionEntryEntityTable.amount, convertToMicroUnits(entry.amount)),
                    isNull(TransactionEntryEntityTable.deletedAt),
                    isNull(TransactionEntryEntityTable.originalTransactionId)
                )
            )
            .limit(2);

        if (matches.length !== 1) {
            return null;
        }

        return matches[0].id;
    }
}

export const importedTransactionSemanticMatchService = new ImportedTransactionSemanticMatchService();
