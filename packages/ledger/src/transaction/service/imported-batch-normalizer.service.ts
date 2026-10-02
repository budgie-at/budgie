import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export class ImportedBatchNormalizerService extends Context.Service<ImportedBatchNormalizerService>()(
    '@budgie/ledger/ImportedBatchNormalizerService',
    {
        make: Effect.sync(() => {
            const externalIdCollisionSeparator = ':';

            const getFingerprintOrdinalMap = (
                fingerprintOrdinalMapsByExternalId: Map<string, Map<string, number>>,
                externalId: string
            ): Map<string, number> => {
                const existingMap = fingerprintOrdinalMapsByExternalId.get(externalId);

                if (isDefined(existingMap)) {
                    return existingMap;
                }

                const nextMap = new Map<string, number>();
                fingerprintOrdinalMapsByExternalId.set(externalId, nextMap);

                return nextMap;
            };

            const buildImportedInputFingerprint = (input: TransactionCreateInputInterface): string => {
                const entriesFingerprint = input.entries.map(entry => [
                    entry.accountId,
                    entry.type,
                    entry.amount,
                    entry.categoryId,
                    entry.categorySource,
                    entry.mccCategoryId,
                    entry.exchangeRate,
                    entry.toIban
                ]);

                return JSON.stringify([
                    input.externalSource,
                    input.title,
                    input.comment,
                    input.type,
                    input.operatedAt.getTime(),
                    input.fromAccountId,
                    input.toAccountId,
                    input.exchangeRate,
                    input.amount,
                    input.tagIds,
                    entriesFingerprint
                ]);
            };

            const buildNormalizedExternalId = (externalId: string, ordinal: number): string => {
                if (ordinal === 1) {
                    return externalId;
                }

                return `${externalId}${externalIdCollisionSeparator}${ordinal}`;
            };

            const replaceEntryExternalId = (
                entryExternalId: TransactionCreateInputInterface['entries'][number]['externalId'],
                previousExternalId: string,
                externalId: string
            ): TransactionCreateInputInterface['entries'][number]['externalId'] => {
                if (!isDefined(entryExternalId)) {
                    return entryExternalId;
                }

                if (entryExternalId === previousExternalId) {
                    return externalId;
                }

                const prefixedExternalId = `${previousExternalId}${externalIdCollisionSeparator}`;

                if (entryExternalId.startsWith(prefixedExternalId)) {
                    return `${externalId}${entryExternalId.slice(previousExternalId.length)}`;
                }

                return entryExternalId;
            };

            const withExternalId = (input: TransactionCreateInputInterface, externalId: string): TransactionCreateInputInterface => {
                const previousExternalId = input.externalId;

                if (!isDefined(previousExternalId) || previousExternalId === externalId) {
                    return input;
                }

                return {
                    ...input,
                    externalId,
                    entries: input.entries.map(entry => ({
                        ...entry,
                        externalId: replaceEntryExternalId(entry.externalId, previousExternalId, externalId)
                    }))
                };
            };

            const normalizeInput = (
                input: TransactionCreateInputInterface,
                fingerprintOrdinalMapsByExternalId: Map<string, Map<string, number>>
            ): TransactionCreateInputInterface | null => {
                const { externalId } = input;

                if (!isDefined(externalId)) {
                    return input;
                }

                const fingerprint = buildImportedInputFingerprint(input);
                const fingerprintOrdinalMap = getFingerprintOrdinalMap(fingerprintOrdinalMapsByExternalId, externalId);
                const existingOrdinal = fingerprintOrdinalMap.get(fingerprint);

                if (isDefined(existingOrdinal)) {
                    return null;
                }

                const ordinal = fingerprintOrdinalMap.size + 1;
                const normalizedExternalId = buildNormalizedExternalId(externalId, ordinal);
                fingerprintOrdinalMap.set(fingerprint, ordinal);

                return withExternalId(input, normalizedExternalId);
            };

            return {
                normalize: (inputs: readonly TransactionCreateInputInterface[]): TransactionCreateInputInterface[] => {
                    const fingerprintOrdinalMapsByExternalId = new Map<string, Map<string, number>>();

                    return inputs.map(input => normalizeInput(input, fingerprintOrdinalMapsByExternalId)).filter(isDefined);
                }
            };
        })
    }
) {
    static readonly layer = Layer.effect(ImportedBatchNormalizerService, ImportedBatchNormalizerService.make);
}
