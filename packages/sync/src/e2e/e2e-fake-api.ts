import { isDefined } from '@rnw-community/shared';

import { HTTP_STATUS_UNAUTHORIZED } from '../core/constant/http-status.constant';
import { WISE_ASPSP_NAME } from '../enable-banking/constant/wise-aspsp-name.constant';

import { MONOBANK_CLIENT_INFO, monobankStatement } from './e2e-fake-monobank';
import { WISE_ACCOUNTS, WISE_CODE, WISE_SESSION } from './e2e-fake-wise';

type FakeHandlerType = (body: string, url: string) => unknown;

const REQUEST_PATTERN = /^https:\/\/([^/?#]+)([^?#]*)/u;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;
const NINETY_DAYS = 90;
const SECONDS_PER_DAY = 86_400;
const REJECTED_TOKEN_PATTERN = /^e2e-rejected/u;

const SYNTHETIC_BANK = 'E2E Synthetic Bank';
const CONNECT_BANK = 'E2E Connect Bank';
const CONNECT_CODE = 'e2e-connect-code';
const CONNECT_SESSION = 'e2e-connect-session';
const CONSENT_VALIDITY_SECONDS = NINETY_DAYS * 24 * 60 * 60;
const AUTH_CODE_BY_BANK = new Map([
    [CONNECT_BANK, CONNECT_CODE],
    [WISE_ASPSP_NAME, WISE_CODE]
]);

const consentValidUntil = (): string => new Date(Date.now() + (NINETY_DAYS - 1) * MILLISECONDS_PER_DAY).toISOString();

const dayAgo = (days: number): string => new Date(Date.now() - days * MILLISECONDS_PER_DAY).toISOString().slice(0, ISO_DATE_LENGTH);

const wiseAccountOf = (url: string) => WISE_ACCOUNTS.find(({ uid }) => REQUEST_PATTERN.exec(url)?.[2].split('/')[2] === uid);

const fakeAspsps = () => ({
    aspsps: [
        ...[SYNTHETIC_BANK, CONNECT_BANK].map(name => ({
            name,
            country: 'DE',
            maximum_consent_validity: CONSENT_VALIDITY_SECONDS,
            beta: false,
            psu_types: ['personal']
        })),
        { name: WISE_ASPSP_NAME, country: 'GB', maximum_consent_validity: CONSENT_VALIDITY_SECONDS, beta: false, psu_types: ['personal'] },
        {
            name: WISE_ASPSP_NAME,
            country: 'DE',
            maximum_consent_validity: CONSENT_VALIDITY_SECONDS,
            beta: false,
            psu_types: ['personal'],
            required_psu_headers: ['psu-ip-address']
        }
    ]
});

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
    ['GET', /^\/aspsps$/u, fakeAspsps],
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
                return {
                    session_id: WISE_SESSION,
                    accounts: WISE_ACCOUNTS.map(({ currency, hash, iban }) => ({
                        ...(isDefined(iban) && { account_id: iban }),
                        cash_account_type: 'CACC',
                        currency,
                        identification_hash: hash
                    })),
                    aspsp: { name: WISE_ASPSP_NAME, country: 'GB' },
                    access: { valid_until: consentValidUntil() }
                };
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
    [
        'GET',
        new RegExp(`^/sessions/${WISE_SESSION}$`, 'u'),
        () => ({
            status: 'AUTHORIZED',
            accounts_data: WISE_ACCOUNTS.map(({ uid, hash }) => ({ uid, identification_hash: hash }))
        })
    ],
    [
        'GET',
        /^\/sessions\/[^/]+$/u,
        () => ({ status: 'AUTHORIZED', accounts_data: [{ uid: 'e2e-uid-1', identification_hash: 'e2e-hash-1' }] })
    ],
    ['DELETE', /^\/sessions\/[^/]+$/u, () => ({})],
    [
        'GET',
        /^\/accounts\/[^/]+\/balances$/u,
        (_body, url) => {
            const account = wiseAccountOf(url);

            return {
                balances: [
                    {
                        balance_amount: { amount: account?.balance ?? '1234.56', currency: account?.currency ?? 'EUR' },
                        balance_type: 'CLBD'
                    }
                ]
            };
        }
    ],
    [
        'GET',
        /^\/accounts\/[^/]+\/transactions$/u,
        (_body, url) => ({
            transactions: wiseAccountOf(url)?.transactions.map(({ daysAgo, ...transaction }) => ({
                ...transaction,
                booking_date: dayAgo(daysAgo)
            })) ?? [
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

const MONOBANK_ROUTES: ReadonlyArray<readonly [string, RegExp, FakeHandlerType]> = [
    ['GET', /^\/personal\/client-info$/u, () => MONOBANK_CLIENT_INFO],
    ['GET', /^\/personal\/statement\/[^/]+\/\d+(\/\d+)?$/u, monobankStatement]
];

const ENABLE_BANKING_PUBLIC_ROUTES: ReadonlyArray<readonly [string, RegExp, FakeHandlerType]> = [['GET', /^\/api\/aspsps$/u, fakeAspsps]];

const E2E_SECURITIES = [
    { symbol: 'BGTX', currency: 'USD', shortname: 'Budgie Example', longname: 'Budgie Example Holdings', exchDisp: 'E2E Exchange' },
    { symbol: 'BGEU', currency: 'EUR', shortname: 'Budgie Euro', longname: 'Budgie Euro Fund', exchDisp: 'E2E Euronext' },
    { symbol: 'BGNP', currency: 'USD', shortname: 'Budgie Unpriced', longname: 'Budgie Unpriced Trust', exchDisp: 'E2E OTC' }
] as const;
const E2E_UNPRICED_SECURITY = 'BGNP';
const SEARCH_QUERY_PATTERN = /[?&]q=([^&#]*)/u;
const E2E_SECURITY_LATEST_CLOSE = 120;
const E2E_SECURITY_DAILY_RISE = 0.4;
const E2E_SECURITY_SWING = 4;
const E2E_SECURITY_SWING_FREQUENCY = 0.7;
const E2E_SECURITY_HISTORY_DAYS = 60;
const e2eSecurityClose = (days: number) =>
    Math.round(
        (E2E_SECURITY_LATEST_CLOSE - days * E2E_SECURITY_DAILY_RISE - E2E_SECURITY_SWING * Math.sin(days * E2E_SECURITY_SWING_FREQUENCY)) *
            100
    ) / 100;

const yahooChart = (currency: string, isPriced: boolean) => () => {
    const todayNoonSeconds = Math.floor(Date.now() / MILLISECONDS_PER_DAY) * SECONDS_PER_DAY + SECONDS_PER_DAY / 2;
    const daysAgo = Array.from({ length: E2E_SECURITY_HISTORY_DAYS }, (_day, index) => E2E_SECURITY_HISTORY_DAYS - 1 - index);

    return {
        chart: {
            result: [
                {
                    meta: { currency, ...(isPriced && { regularMarketPrice: E2E_SECURITY_LATEST_CLOSE }) },
                    timestamp: daysAgo.map(days => todayNoonSeconds - days * SECONDS_PER_DAY),
                    indicators: {
                        quote: [{ close: daysAgo.map(days => (isPriced ? e2eSecurityClose(days) : null)) }]
                    }
                }
            ]
        }
    };
};

const YAHOO_ROUTES: ReadonlyArray<readonly [string, RegExp, FakeHandlerType]> = [
    [
        'GET',
        /^\/v1\/finance\/search$/u,
        (_body, url) => {
            const query = decodeURIComponent((SEARCH_QUERY_PATTERN.exec(url)?.[1] ?? '').replaceAll('+', ' ')).toLowerCase();

            return {
                quotes: E2E_SECURITIES.filter(security =>
                    [security.symbol, security.shortname, security.longname].some(value => value.toLowerCase().includes(query))
                ).map(({ currency: _currency, ...quote }) => ({ ...quote, quoteType: 'EQUITY' }))
            };
        }
    ],
    ...E2E_SECURITIES.map(
        ({ symbol, currency }) =>
            ['GET', new RegExp(`^/v8/finance/chart/${symbol}$`, 'u'), yahooChart(currency, symbol !== E2E_UNPRICED_SECURITY)] as const
    )
];

const ROUTES_BY_HOST = new Map([
    ['enablebanking.com', ENABLE_BANKING_PUBLIC_ROUTES],
    ['api.enablebanking.com', ENABLE_BANKING_ROUTES],
    ['api.monobank.ua', MONOBANK_ROUTES],
    ['query1.finance.yahoo.com', YAHOO_ROUTES]
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
            isDefined(route) ? respond(200, route[2](readBody(init?.body), toUrl(input))) : respond(404, { error: 'E2E_UNKNOWN_ROUTE' })
        );
    };
};
