import { isDefined } from '@rnw-community/shared';

type FakeHandlerType = (body: string) => unknown;

const REQUEST_PATTERN = /^https:\/\/([^/?#]+)([^?#]*)/u;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;
const NINETY_DAYS = 90;

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
            aspsps: [{ name: 'E2E Synthetic Bank', country: 'DE', maximum_consent_validity: NINETY_DAYS * 24 * 60 * 60, beta: false }]
        })
    ],
    [
        'POST',
        /^\/auth$/u,
        body => ({ url: `budgie://enable-banking/callback?code=e2e-code&state=${/"state":"([^"]+)"/u.exec(body)?.[1] ?? ''}` })
    ],
    [
        'POST',
        /^\/sessions$/u,
        () => ({
            session_id: 'e2e-session',
            accounts: [
                {
                    account_id: { iban: 'DE89370400440532013000' },
                    name: 'E2E Current',
                    cash_account_type: 'CACC',
                    currency: 'EUR',
                    identification_hash: 'e2e-hash-1'
                }
            ],
            aspsp: { name: 'E2E Synthetic Bank', country: 'DE' },
            access: { valid_until: new Date(Date.now() + (NINETY_DAYS - 1) * MILLISECONDS_PER_DAY).toISOString() }
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

const ROUTES_BY_HOST = new Map([['api.enablebanking.com', ENABLE_BANKING_ROUTES]]);

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
            return realFetch(input, init);
        }

        const method = init?.method ?? 'GET';
        const [, , path] = match;
        const route = routes.find(([routeMethod, pattern]) => routeMethod === method && pattern.test(path));

        return Promise.resolve(
            isDefined(route) ? respond(200, route[2](readBody(init?.body))) : respond(404, { error: 'E2E_UNKNOWN_ROUTE' })
        );
    };
};
