import { describe, expect, it } from 'vitest';

import { ersteMapper } from '@budgie/bank-sync';

import type { ErsteRowInterface } from '@budgie/bank-sync';

const buildErsteRow = (date: Date, description = 'ERSTE CARD PAYMENT WIEN 1010 040'): ErsteRowInterface => ({
    date,
    reference: 'ERSTE CARD PAYMENT',
    description,
    details: '',
    amount: -42.5,
    isCredit: false,
    city: 'WIEN',
    countryAlpha2: 'AT'
});

describe('erste/external-id', () => {
    it('uses stable statement-day identity instead of parsed instant identity', () => {
        const first = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'));
        const shifted = buildErsteRow(new Date('2026-01-13T11:00:00.000Z'));

        expect(ersteMapper.mapTransaction(first, 'AT123').id).toBe(ersteMapper.mapTransaction(shifted, 'AT123').id);
    });

    it('ignores parsed location identity and keeps legacy identity', () => {
        const first = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'));
        const changedLocation = {
            ...first,
            details: 'Parsed card location',
            city: 'GRAZ',
            countryAlpha2: 'AT'
        };
        const firstTransaction = ersteMapper.mapTransaction(first, 'AT123');
        const changedLocationTransaction = ersteMapper.mapTransaction(changedLocation, 'AT123');

        expect(firstTransaction.id).toBe(changedLocationTransaction.id);
        expect(firstTransaction.legacyExternalIds?.[0]).not.toBe(changedLocationTransaction.legacyExternalIds?.[0]);
        expect(firstTransaction.id).not.toBe(firstTransaction.legacyExternalIds?.[0]);
    });

    it('changes when row description changes on the same statement day', () => {
        const first = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'), 'ERSTE CARD PAYMENT WIEN 1010 040');
        const changedDescription = buildErsteRow(new Date('2026-01-13T10:00:00.000Z'), 'ERSTE CARD PAYMENT GRAZ 8010 040');

        expect(ersteMapper.mapTransaction(first, 'AT123').id).not.toBe(ersteMapper.mapTransaction(changedDescription, 'AT123').id);
    });
});
