export const WISE_CODE = 'e2e-wise-code';
export const WISE_SESSION = 'e2e-wise-session';

export const WISE_ACCOUNTS = [
    {
        uid: 'e2e-uid-wise-eur',
        hash: 'e2e-hash-wise-eur',
        currency: 'EUR',
        balance: '1000.00',
        iban: { iban: 'BE71096123456769' },
        transactions: [
            {
                entry_reference: 'e2e-wise-conversion',
                transaction_amount: { amount: '100.00', currency: 'EUR' },
                creditor: { name: 'E2E Wise Conversion' },
                credit_debit_indicator: 'DBIT',
                status: 'BOOK',
                daysAgo: 1
            },
            {
                entry_reference: 'e2e-wise-top-up',
                transaction_amount: { amount: '1100.00', currency: 'EUR' },
                debtor: { name: 'E2E Other Bank' },
                credit_debit_indicator: 'CRDT',
                status: 'BOOK',
                daysAgo: 3
            }
        ]
    },
    {
        uid: 'e2e-uid-wise-usd',
        hash: 'e2e-hash-wise-usd',
        currency: 'USD',
        balance: '108.20',
        iban: null,
        transactions: [
            {
                entry_reference: 'e2e-wise-conversion',
                transaction_amount: { amount: '108.20', currency: 'USD' },
                debtor: { name: 'E2E Wise Conversion' },
                credit_debit_indicator: 'CRDT',
                status: 'BOOK',
                daysAgo: 1
            }
        ]
    }
];
