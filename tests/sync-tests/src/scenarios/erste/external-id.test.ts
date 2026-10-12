import { mapErsteTransaction } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';

import type { ErsteRowInterface } from '@budgie/sync';

const buildErsteRow = (date: Date, description = 'ERSTE CARD PAYMENT WIEN 1010 040'): ErsteRowInterface => ({
    date,
    reference: 'ERSTE CARD PAYMENT',
    description,
    amount: -42.5,
    isCredit: false,
    city: 'WIEN',
    countryAlpha2: 'AT'
});

describe('erste/external-id', () => {
    it('uses stable statement-day identity instead of parsed instant identity', () => {
        const first = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'));
        const shifted = buildErsteRow(new Date('2026-01-13T11:00:00.000Z'));

        expect(mapErsteTransaction(first, 'AT123').id).toBe(mapErsteTransaction(shifted, 'AT123').id);
    });

    it('ignores parsed location identity and keeps legacy identity', () => {
        const first = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'));
        const changedLocation = { ...first, city: 'GRAZ', countryAlpha2: 'AT' };
        const firstTransaction = mapErsteTransaction(first, 'AT123');
        const changedLocationTransaction = mapErsteTransaction(changedLocation, 'AT123');

        expect(firstTransaction.id).toBe(changedLocationTransaction.id);
        expect(firstTransaction.legacyExternalIds?.[0]).not.toBe(changedLocationTransaction.legacyExternalIds?.[0]);
        expect(firstTransaction.id).not.toBe(firstTransaction.legacyExternalIds?.[0]);
    });

    it('changes when row description changes on the same statement day', () => {
        const first = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'), 'ERSTE CARD PAYMENT WIEN 1010 040');
        const changedDescription = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'), 'ERSTE CARD PAYMENT GRAZ 8010 040');

        expect(mapErsteTransaction(first, 'AT123').id).not.toBe(mapErsteTransaction(changedDescription, 'AT123').id);
    });

    it('keeps byte-identical external ids and historical Erste PDF aliases', () => {
        const row = buildErsteRow(new Date('2026-01-13T11:00:00.000Z'), 'ERSTE CARD PAYMENT');
        const rowWithoutLocation = {
            date: row.date,
            reference: row.reference,
            description: row.description,
            amount: row.amount,
            isCredit: false
        };

        expect(mapErsteTransaction(row, 'AT123')).toMatchObject({
            id: '66702f92a41041c5191f000fed92707b',
            legacyExternalIds: ['d17ddf97b0a9674b68648aa7c487ce5b', '7ba14f0e2729c85a23bdc66e1b0ce31a', 'c6329506885c3635bda45c2992f8686b']
        });
        expect(mapErsteTransaction(rowWithoutLocation, 'AT123')).toMatchObject({
            id: '66702f92a41041c5191f000fed92707b',
            legacyExternalIds: ['0ad47543f0e94f184ed6432c2561efd6', '7ba14f0e2729c85a23bdc66e1b0ce31a', 'c6329506885c3635bda45c2992f8686b']
        });
        expect(mapErsteTransaction({ ...row, city: 'GRAZ', description: 'ERSTE CARD PAYMENT WIEN 1010 040' }, 'AT123')).toMatchObject({
            id: 'c98fafbb48bfd217c21e452d939515ab',
            legacyExternalIds: ['caab22ef95d1602464750ada7a7985c2', '7ba14f0e2729c85a23bdc66e1b0ce31a', 'a56e022f7780b5ab91d531f1df4d351b']
        });
    });
});
