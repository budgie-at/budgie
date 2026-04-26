// Codes observed in real Erste card transactions across the /ERSTE corpus.
// Note: 280 is the legacy ISO 3166-1 numeric for West Germany (modern is 276).
// Erste/SEPA networks still emit 280, so we keep both forms semantically as DE.
export const ERSTE_ISO_NUMERIC_TO_ALPHA2: Readonly<Record<string, string>> = Object.freeze({
    '040': 'AT',
    '203': 'CZ',
    '208': 'DK',
    '233': 'EE',
    '276': 'DE',
    '280': 'DE',
    '442': 'LU',
    '470': 'MT',
    '528': 'NL',
    '616': 'PL',
    '674': 'SM',
    '703': 'SK',
    '705': 'SI',
    '724': 'ES',
    '752': 'SE',
    '784': 'AE',
    '792': 'TR',
    '804': 'UA',
    '826': 'GB',
    '840': 'US'
});
