import { csvAmountCandidates } from './csv-amount-candidates.util';

export const inferCsvDecimalSeparator = (values: readonly string[]): '.' | ',' | null => {
    const separators = new Set(
        values.flatMap(value => {
            const candidates = csvAmountCandidates(value);

            return candidates.length === 1 ? candidates.flatMap(candidate => candidate.decimalSeparator ?? []) : [];
        })
    );

    return separators.size === 1 ? (separators.values().next().value ?? null) : null;
};
