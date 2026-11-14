import type { ClientInfo, StatementItem } from '@liaugust/monobank-sdk';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_HOUR = 3600;
const UAH_NUMERIC_CODE = 980;

export const MONOBANK_CLIENT_INFO = {
    clientId: 'e2e-client',
    name: 'E2E Client',
    accounts: [
        {
            id: 'e2e-mono-card',
            sendId: 'e2e-send',
            balance: 150_000,
            creditLimit: 0,
            currencyCode: UAH_NUMERIC_CODE,
            cashbackType: 'UAH',
            iban: 'UA213223130000026007233566001',
            maskedPan: ['537541******1234'],
            type: 'black'
        }
    ],
    jars: [
        {
            id: 'e2e-mono-jar',
            sendId: 'e2e-jar-send',
            title: 'E2E Jar',
            description: 'E2E Jar',
            balance: 50_000,
            goal: null,
            currencyCode: UAH_NUMERIC_CODE
        }
    ]
} satisfies ClientInfo;

export const monobankStatement = (): StatementItem[] => {
    const nowSeconds = Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
    const item = { currencyCode: UAH_NUMERIC_CODE, commissionRate: 0, cashbackAmount: 0, hold: false };

    return [
        {
            ...item,
            id: 'e2e-mono-tx-1',
            time: nowSeconds - SECONDS_PER_HOUR,
            description: 'E2E Grocery',
            mcc: 5411,
            originalMcc: 5411,
            amount: -25_000,
            operationAmount: -25_000,
            balance: 150_000
        },
        {
            ...item,
            id: 'e2e-mono-tx-2',
            time: nowSeconds - 2 * SECONDS_PER_HOUR,
            description: 'E2E Salary',
            mcc: 4829,
            originalMcc: 4829,
            amount: 100_000,
            operationAmount: 100_000,
            balance: 175_000
        }
    ];
};
