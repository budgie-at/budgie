export const WISE_BANK = 'Wise';
export const WISE_CODE = 'e2e-wise-code';

const WISE_SESSION = 'e2e-wise-session';
const EUR_UID = 'e2e-uid-wise-eur';
const USD_UID = 'e2e-uid-wise-usd';

type DayAgoType = (days: number) => string;
type WiseRouteType = readonly [string, RegExp, (body: string) => unknown];

export const buildWiseAuthorizedSession = (validUntil: string) => ({
    session_id: WISE_SESSION,
    accounts: [
        { account_id: { iban: 'BE71096123456769' }, cash_account_type: 'CACC', currency: 'EUR', identification_hash: 'e2e-hash-wise-eur' },
        { cash_account_type: 'CACC', currency: 'USD', identification_hash: 'e2e-hash-wise-usd' }
    ],
    aspsp: { name: WISE_BANK, country: 'GB' },
    access: { valid_until: validUntil }
});

const balanceRoute = (uid: string, amount: string, currency: string): WiseRouteType => [
    'GET',
    new RegExp(`^/accounts/${uid}/balances$`, 'u'),
    () => ({ balances: [{ balance_amount: { amount, currency }, balance_type: 'CLBD' }] })
];

const transactionsRoute = (uid: string, transactions: readonly unknown[]): WiseRouteType => [
    'GET',
    new RegExp(`^/accounts/${uid}/transactions$`, 'u'),
    () => ({ transactions, continuation_key: null })
];

export const buildWiseRoutes = (dayAgo: DayAgoType): readonly WiseRouteType[] => [
    [
        'GET',
        new RegExp(`^/sessions/${WISE_SESSION}$`, 'u'),
        () => ({
            status: 'AUTHORIZED',
            accounts_data: [
                { uid: EUR_UID, identification_hash: 'e2e-hash-wise-eur' },
                { uid: USD_UID, identification_hash: 'e2e-hash-wise-usd' }
            ]
        })
    ],
    balanceRoute(EUR_UID, '1000.00', 'EUR'),
    balanceRoute(USD_UID, '108.20', 'USD'),
    transactionsRoute(EUR_UID, [
        {
            entry_reference: 'e2e-wise-conversion',
            transaction_amount: { amount: '100.00', currency: 'EUR' },
            creditor: { name: 'E2E Wise Conversion' },
            credit_debit_indicator: 'DBIT',
            status: 'BOOK',
            booking_date: dayAgo(1)
        },
        {
            entry_reference: 'e2e-wise-top-up',
            transaction_amount: { amount: '1100.00', currency: 'EUR' },
            debtor: { name: 'E2E Other Bank' },
            credit_debit_indicator: 'CRDT',
            status: 'BOOK',
            booking_date: dayAgo(3)
        }
    ]),
    transactionsRoute(USD_UID, [
        {
            entry_reference: 'e2e-wise-conversion',
            transaction_amount: { amount: '108.20', currency: 'USD' },
            debtor: { name: 'E2E Wise Conversion' },
            credit_debit_indicator: 'CRDT',
            status: 'BOOK',
            booking_date: dayAgo(1)
        }
    ])
];
