import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

import { parseErsteText } from './parse-erste-pdf.util';

const readFixture = (fileName: string): string => readFileSync(path.join(process.cwd(), '..', '..', fileName), 'utf8');

describe('parseErsteText real fixtures', () => {
    it('parses the real 2026008 modern Erste statement with human-readable titles', () => {
        const parsedData = parseErsteText(readFixture('AT802011184943859800_2026008.txt'));
        const descriptions = parsedData.transactions.map(transaction => transaction.description);

        expect(descriptions).toEqual([
            'T-MOBILE HOTSPOT GMBH BONN 53113 280',
            'Stadt Wien',
            'Habenzinsen',
            'Kest',
            'Kontoführung',
            'Bonus Kontoführung',
            'Wiener Staedtische Versicherung AG',
            'Wiener Staedtische Versicherung AG',
            'Best in Parking Garagen GmbH & Co K',
            'FITINN FEBU SCHWEDENPLATZ',
            'Josef Summerauer'
        ]);
    });
});
