import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

import { parseErsteText } from './parse-erste-pdf.util';

const getFixturePath = (fileName: string): string =>
    path.join(process.cwd(), '..', '..', 'tests', 'app-tests', 'fixtures', 'erste', fileName);

const extractPdfText = (fileName: string): string =>
    execFileSync('pdftotext', ['-layout', getFixturePath(fileName), '-'], { encoding: 'utf8' });

describe('parseErsteText real fixtures', () => {
    it('parses the sanitized 2026008 modern Erste statement with human-readable titles', () => {
        const parsedData = parseErsteText(extractPdfText('erste-statement-008.pdf'));
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
            'Sample Counterparty'
        ]);
    });
});
