import { describe, expect, it } from '@jest/globals';

import { parseErsteText } from './parse-erste-pdf.util';

describe('parseErsteText', () => {
    it('parses inline continuation rows without turning statement notes into transactions', () => {
        const parsedData = parseErsteText(`Kontoauszug
IBAN: AT802011184943859800
Alter Kontostand 13.370,08
Neuer Kontostand 12.892,35
AT802011184943859800   04.04.2026 08:32
Buchungstext/Booking Text
070000586699                                             29.03.2026                              72,00-
 Stadt Wien
*** Abschlussbuchung per 31.03.2026 ****                 31.03.2026
 Reklamationen bitte binnen 2 Monaten
Habenzinsen                                              31.03.2026                               0,33
000000059911                                             02.04.2026                              66,36-
 Josef Summerauer
Neuer Kontostand/New Balance 12.892,35`);

        expect(parsedData.transactions).toHaveLength(3);
        expect(parsedData.transactions[0]).toMatchObject({
            reference: '070000586699',
            description: 'Stadt Wien',
            details: '',
            amount: -72,
            isCredit: false
        });
        expect(parsedData.transactions[1]).toMatchObject({
            reference: 'Habenzinsen',
            description: 'Habenzinsen',
            details: '',
            amount: 0.33,
            isCredit: true
        });
        expect(parsedData.transactions[2]).toMatchObject({
            reference: '000000059911',
            description: 'Josef Summerauer',
            details: '',
            amount: -66.36,
            isCredit: false
        });
    });

    it('keeps the first continuation line as description and the rest as details', () => {
        const parsedData = parseErsteText(`Kontoauszug
IBAN: AT802011184943859800
Alter Kontostand 13.370,08
Neuer Kontostand 12.892,35
AT802011184943859800   04.04.2026 08:32
Buchungstext/Booking Text
Polizze Nr. 1118802680: Fleischmark                      01.04.2026                              39,33-
 Wiener Staedtische Versicherung AG
 MDID:11188026802023103001
 Polizze Nr. 1118802680: Fleischmark
 t 28 / 1010 Wien
Neuer Kontostand/New Balance 12.892,35`);

        expect(parsedData.transactions).toHaveLength(1);
        expect(parsedData.transactions[0]).toMatchObject({
            reference: 'Polizze Nr. 1118802680: Fleischmark',
            description: 'Wiener Staedtische Versicherung AG',
            details: 'MDID:11188026802023103001 Polizze Nr. 1118802680: Fleischmark t 28 / 1010 Wien',
            amount: -39.33,
            isCredit: false
        });
    });

    it('parses the PDFKit extractor layout used by the app on iOS', () => {
        const parsedData = parseErsteText(`Kontoauszug
IBAN: AT802011184943859800
Alter Kontostand
13.370,08
Neuer Kontostand 12.892,35
AT802011184943859800 04.04.2026 08:32
Buchungstext/Booking Text Valuta/Value Beträge/Amounts in EUR
E-COMM 8,00 DE K1 26.03. 10:30
27.03.2026 8,00-
T-MOBILE HOTSPOT GMBH BONN 53113 280
070000586699
29.03.2026 72,00-
Stadt Wien
*** Abschlussbuchung per 31.03.2026 ****
31.03.2026
Reklamationen bitte binnen 2 Monaten
Habenzinsen 31.03.2026 0,33
Kest 31.03.2026 0,08-
Kontoführung 31.03.2026 20,50-
Bonus Kontoführung 31.03.2026 4,10
000000059911
02.04.2026 66,36-
Josef Summerauer
Neuer Kontostand/New Balance 12.892,35`);

        expect(parsedData.transactions.map(transaction => transaction.description)).toEqual([
            'T-MOBILE HOTSPOT GMBH BONN 53113 280',
            'Stadt Wien',
            'Habenzinsen',
            'Kest',
            'Kontoführung',
            'Bonus Kontoführung',
            'Josef Summerauer'
        ]);
    });
});
