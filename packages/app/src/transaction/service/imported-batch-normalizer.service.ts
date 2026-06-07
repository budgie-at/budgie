import { isDefined } from '@rnw-community/shared';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

class ImportedBatchNormalizerService {
    private static readonly EXTERNAL_ID_COLLISION_SEPARATOR = ':';

    normalize(inputs: readonly TransactionCreateInputInterface[]): TransactionCreateInputInterface[] {
        const fingerprintOrdinalMapsByExternalId = new Map<string, Map<string, number>>();

        return inputs.map(input => this.normalizeInput(input, fingerprintOrdinalMapsByExternalId)).filter(isDefined);
    }

    private normalizeInput(
        input: TransactionCreateInputInterface,
        fingerprintOrdinalMapsByExternalId: Map<string, Map<string, number>>
    ): TransactionCreateInputInterface | null {
        const { externalId } = input;

        if (!isDefined(externalId)) {
            return input;
        }

        const fingerprint = this.buildImportedInputFingerprint(input);
        const fingerprintOrdinalMap = this.getFingerprintOrdinalMap(fingerprintOrdinalMapsByExternalId, externalId);
        const existingOrdinal = fingerprintOrdinalMap.get(fingerprint);

        if (isDefined(existingOrdinal)) {
            return null;
        }

        const ordinal = fingerprintOrdinalMap.size + 1;
        const normalizedExternalId = this.buildNormalizedExternalId(externalId, ordinal);
        fingerprintOrdinalMap.set(fingerprint, ordinal);

        return this.withExternalId(input, normalizedExternalId);
    }

    private getFingerprintOrdinalMap(
        fingerprintOrdinalMapsByExternalId: Map<string, Map<string, number>>,
        externalId: string
    ): Map<string, number> {
        const existingMap = fingerprintOrdinalMapsByExternalId.get(externalId);

        if (isDefined(existingMap)) {
            return existingMap;
        }

        const nextMap = new Map<string, number>();
        fingerprintOrdinalMapsByExternalId.set(externalId, nextMap);

        return nextMap;
    }

    private buildImportedInputFingerprint(input: TransactionCreateInputInterface): string {
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
    }

    private buildNormalizedExternalId(externalId: string, ordinal: number): string {
        if (ordinal === 1) {
            return externalId;
        }

        return `${externalId}${ImportedBatchNormalizerService.EXTERNAL_ID_COLLISION_SEPARATOR}${ordinal}`;
    }

    private withExternalId(input: TransactionCreateInputInterface, externalId: string): TransactionCreateInputInterface {
        const previousExternalId = input.externalId;

        if (!isDefined(previousExternalId) || previousExternalId === externalId) {
            return input;
        }

        return {
            ...input,
            externalId,
            entries: input.entries.map(entry => ({
                ...entry,
                externalId: this.replaceEntryExternalId(entry.externalId, previousExternalId, externalId)
            }))
        };
    }

    private replaceEntryExternalId(
        entryExternalId: TransactionCreateInputInterface['entries'][number]['externalId'],
        previousExternalId: string,
        externalId: string
    ): TransactionCreateInputInterface['entries'][number]['externalId'] {
        if (!isDefined(entryExternalId)) {
            return entryExternalId;
        }

        if (entryExternalId === previousExternalId) {
            return externalId;
        }

        const prefixedExternalId = `${previousExternalId}${ImportedBatchNormalizerService.EXTERNAL_ID_COLLISION_SEPARATOR}`;

        if (entryExternalId.startsWith(prefixedExternalId)) {
            return `${externalId}${entryExternalId.slice(previousExternalId.length)}`;
        }

        return entryExternalId;
    }
}

export const importedBatchNormalizerService = new ImportedBatchNormalizerService();
