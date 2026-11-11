import { isDefined } from '@rnw-community/shared';

import { HTTP_STATUS_UNAUTHORIZED } from '../core/constant/http-status.constant';

import { buildWiseAuthorizedSession, buildWiseRoutes, WISE_BANK, WISE_CODE } from './e2e-fake-wise';

import type { ClientInfo, StatementItem } from '@liaugust/monobank-sdk';

type FakeHandlerType = (body: string) => unknown;

const REQUEST_PATTERN = /^https:\/\/([^/?#]+)([^?#]*)/u;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;
const NINETY_DAYS = 90;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_HOUR = 3600;
const UAH_NUMERIC_CODE = 980;
const REJECTED_TOKEN_PATTERN = /^e2e-rejected/u;

const SYNTHETIC_BANK = 'E2E Synthetic Bank';
const CONNECT_BANK = 'E2E Connect Bank';
const CONNECT_CODE = 'e2e-connect-code';
const CONNECT_SESSION = 'e2e-connect-session';
const CONSENT_VALIDITY_SECONDS = NINETY_DAYS * 24 * 60 * 60;
const AUTH_CODE_BY_BANK = new Map([
    [CONNECT_BANK, CONNECT_CODE],
    [WISE_BANK, WISE_CODE]
]);

const consentValidUntil = (): string => new Date(Date.now() + (NINETY_DAYS - 1) * MILLISECONDS_PER_DAY).toISOString();

const dayAgo = (days: number): string => new Date(Date.now() - days * MILLISECONDS_PER_DAY).toISOString().slice(0, ISO_DATE_LENGTH);

const ENABLE_BANKING_ROUTES: ReadonlyArray<readonly [string, RegExp, FakeHandlerType]> = [
    [
        'GET',
        /^\/application$/u,
        () => ({
            name: 'E2E Application',
            active: true,
            environment: 'PRODUCTION',
            redirect_urls: ['https://budgie.at/enable-banking/callback']
        })
    ],
    [
        'GET',
        /^\/aspsps$/u,
        () => ({
            aspsps: [
                ...[SYNTHETIC_BANK, CONNECT_BANK].map(name => ({
                    name,
                    country: 'DE',
                    maximum_consent_validity: CONSENT_VALIDITY_SECONDS,
                    beta: false
                })),
                { name: WISE_BANK, country: 'GB', maximum_consent_validity: CONSENT_VALIDITY_SECONDS, beta: false },
                {
                    name: WISE_BANK,
                    country: 'DE',
                    maximum_consent_validity: CONSENT_VALIDITY_SECONDS,
                    beta: false,
                    required_psu_headers: ['psu-ip-address']
                }
            ]
        })
    ],
    [
        'POST',
        /^\/auth$/u,
        body => ({
            url: `budgie://enable-banking/callback?code=${[...AUTH_CODE_BY_BANK].find(([bank]) => body.includes(`"${bank}"`))?.[1] ?? 'e2e-code'}&state=${/"state":"([^"]+)"/u.exec(body)?.[1] ?? ''}`
        })
    ],
    [
        'POST',
        /^\/sessions$/u,
        body => {
            if (body.includes(WISE_CODE)) {
                return buildWiseAuthorizedSession(consentValidUntil());
            }

            const isConnectBank = body.includes(CONNECT_CODE);

            return {
                session_id: isConnectBank ? CONNECT_SESSION : 'e2e-session',
                accounts: [
                    {
                        ...(!isConnectBank && { account_id: { iban: 'DE89370400440532013000' } }),
                        name: isConnectBank ? 'E2E Savings' : 'E2E Current',
                        cash_account_type: 'CACC',
                        currency: 'EUR',
                        identification_hash: isConnectBank ? 'e2e-hash-connect' : 'e2e-hash-1'
                    }
                ],
                aspsp: { name: isConnectBank ? CONNECT_BANK : SYNTHETIC_BANK, country: 'DE' },
                access: { valid_until: consentValidUntil() }
            };
        }
    ],
    [
        'GET',
        new RegExp(`^/sessions/${CONNECT_SESSION}$`, 'u'),
        () => ({ status: 'AUTHORIZED', accounts_data: [{ uid: 'e2e-uid-connect', identification_hash: 'e2e-hash-connect' }] })
    ],
    ...buildWiseRoutes(dayAgo),
    [
        'GET',
        /^\/sessions\/[^/]+$/u,
        () => ({ status: 'AUTHORIZED', accounts_data: [{ uid: 'e2e-uid-1', identification_hash: 'e2e-hash-1' }] })
    ],
    ['DELETE', /^\/sessions\/[^/]+$/u, () => ({})],
    [
        'GET',
        /^\/accounts\/[^/]+\/balances$/u,
        () => ({ balances: [{ balance_amount: { amount: '1234.56', currency: 'EUR' }, balance_type: 'CLBD' }] })
    ],
    [
        'GET',
        /^\/accounts\/[^/]+\/transactions$/u,
        () => ({
            transactions: [
                {
                    entry_reference: 'e2e-tx-1',
                    transaction_amount: { amount: '12.50', currency: 'EUR' },
                    creditor: { name: 'E2E Coffee' },
                    credit_debit_indicator: 'DBIT',
                    status: 'BOOK',
                    booking_date: dayAgo(1)
                },
                {
                    entry_reference: 'e2e-tx-2',
                    transaction_amount: { amount: '500.00', currency: 'EUR' },
                    debtor: { name: 'E2E Employer' },
                    credit_debit_indicator: 'CRDT',
                    status: 'BOOK',
                    booking_date: dayAgo(2)
                }
            ],
            continuation_key: null
        })
    ]
];

const MONOBANK_CLIENT_INFO = {
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

const monobankStatement = (): StatementItem[] => {
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

const MONOBANK_ROUTES: ReadonlyArray<readonly [string, RegExp, FakeHandlerType]> = [
    ['GET', /^\/personal\/client-info$/u, () => MONOBANK_CLIENT_INFO],
    ['GET', /^\/personal\/statement\/[^/]+\/\d+(\/\d+)?$/u, monobankStatement]
];

const ROUTES_BY_HOST = new Map([
    ['api.enablebanking.com', ENABLE_BANKING_ROUTES],
    ['api.monobank.ua', MONOBANK_ROUTES]
]);

const readBody = (body: unknown): string => {
    if (body instanceof Uint8Array) {
        return String.fromCharCode(...body);
    }

    return typeof body === 'string' ? body : '';
};

const toUrl = (input: Parameters<typeof fetch>[0]): string => (typeof input === 'object' && 'url' in input ? input.url : String(input));

const respond = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const installE2eFakeApi = (): void => {
    const realFetch = globalThis.fetch;

    globalThis.fetch = (input, init) => {
        const match = REQUEST_PATTERN.exec(toUrl(input));
        const routes = isDefined(match) ? ROUTES_BY_HOST.get(match[1]) : null;
        if (!isDefined(match) || !isDefined(routes)) {
            return Reflect.apply(realFetch, globalThis, [input, init]);
        }

        if (REJECTED_TOKEN_PATTERN.test(new Headers(init?.headers).get('X-Token') ?? '')) {
            return Promise.resolve(respond(HTTP_STATUS_UNAUTHORIZED, { errorDescription: 'Unknown X-Token' }));
        }

        const method = init?.method ?? 'GET';
        const [, , path] = match;
        const route = routes.find(([routeMethod, pattern]) => routeMethod === method && pattern.test(path));

        return Promise.resolve(
            isDefined(route) ? respond(200, route[2](readBody(init?.body))) : respond(404, { error: 'E2E_UNKNOWN_ROUTE' })
        );
    };
};
