import { ersteMapper } from '@budgie/sync';
import { describe, expect, it } from 'vitest';


import type { ErsteRowInterface } from '@budgie/sync';

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

const ERSTE_DAY_LOCATION_EXTERNAL_ID = '8098dcd34cea947bf4155607d10ace73';
const ERSTE_INSTANT_DESCRIPTION_EXTERNAL_ID = 'c6329506885c3635bda45c2992f8686b';
const ERSTE_INSTANT_REFERENCE_DETAILS_EXTERNAL_ID = 'd7bc0c964d4e918ed257dacef404ce32';

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

    it('keeps historical Erste PDF external IDs as aliases', () => {
        const row = {
            ...buildErsteRow(new Date('2026-01-13T11:00:00.000Z'), 'ERSTE CARD PAYMENT'),
            details: 'Parsed card location'
        };
        const transaction = ersteMapper.mapTransaction(row, 'AT123');

        expect(transaction.legacyExternalIds).toEqual(
            expect.arrayContaining([
                ERSTE_DAY_LOCATION_EXTERNAL_ID,
                ERSTE_INSTANT_DESCRIPTION_EXTERNAL_ID,
                ERSTE_INSTANT_REFERENCE_DETAILS_EXTERNAL_ID
            ])
        );
    });
});
