import { HttpResponse, http } from 'msw';

import { isDefined } from '@rnw-community/shared';

import { mockServer } from '../scenario/mock-server';

import { testSigner } from './test-sync-request-signer';

import type { JsonBodyType } from 'msw';

const BASE_URL = 'https://api.enablebanking.com';

export const ENABLE_BANKING_APPLICATION_ID = 'synthetic-application-id';

interface StubError {
    readonly status: number;
    readonly error: string;
}

interface TransactionsRequest {
    readonly uid: string;
    readonly query: URLSearchParams;
}

const requests: string[] = [];
const authorizationHeaders: string[] = [];

const respondError = ({ status, error }: StubError) =>
    HttpResponse.json({ code: status, error, message: 'Synthetic failure', detail: 'SYNTHETIC-SECRET-DETAIL' }, { status });

const record = (request: Request): void => {
    const url = new URL(request.url);
    requests.push(`${request.method} ${url.pathname}${url.search}`);
    authorizationHeaders.push(request.headers.get('authorization') ?? '');
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;

export const enableBankingDaysAgo = (days: number): string =>
    new Date(Date.now() - days * MILLISECONDS_PER_DAY).toISOString().slice(0, ISO_DATE_LENGTH);

export const buildEnableBankingTransaction = (overrides: Record<string, JsonBodyType> = {}): Record<string, JsonBodyType> => ({
    entry_reference: 'reference-1',
    transaction_amount: { amount: '12.34', currency: 'EUR' },
    credit_debit_indicator: 'DBIT',
    status: 'BOOK',
    booking_date: enableBankingDaysAgo(1),
    creditor: { name: 'Synthetic Shop' },
    remittance_information: ['Synthetic purchase'],
    ...overrides
});

export const enableBankingStub = {
    requests,
    authorizationHeaders,
    reset: (): void => {
        requests.length = 0;
        authorizationHeaders.length = 0;
    },
    session: (sessionId: string, accounts: ReadonlyArray<{ readonly uid: string; readonly hash: string }>, status = 'AUTHORIZED'): void => {
        mockServer.use(
            http.get(`${BASE_URL}/sessions/${sessionId}`, ({ request }) => {
                record(request);

                return HttpResponse.json({
                    status,
                    accounts: accounts.map(account => account.uid),
                    accounts_data: accounts.map(account => ({ uid: account.uid, identification_hash: account.hash }))
                });
            })
        );
    },
    sessionError: (sessionId: string, error: StubError): void => {
        mockServer.use(
            http.get(`${BASE_URL}/sessions/${sessionId}`, ({ request }) => {
                record(request);

                return respondError(error);
            })
        );
    },
    balances: (uid: string, amount = '100.00', balanceType = 'ITBD', lastChangeDateTime?: string, currency = 'EUR'): void => {
        mockServer.use(
            http.get(`${BASE_URL}/accounts/${uid}/balances`, ({ request }) => {
                record(request);

                return HttpResponse.json({
                    balances: [
                        {
                            name: 'Booked',
                            balance_amount: { amount, currency },
                            balance_type: balanceType,
                            ...(lastChangeDateTime === undefined ? {} : { last_change_date_time: lastChangeDateTime })
                        }
                    ]
                });
            })
        );
    },
    balancesError: (uid: string, error: StubError): void => {
        mockServer.use(
            http.get(`${BASE_URL}/accounts/${uid}/balances`, ({ request }) => {
                record(request);

                return respondError(error);
            })
        );
    },
    transactions: (
        uid: string,
        respond: (request: TransactionsRequest) => { readonly transactions: JsonBodyType[]; readonly nextKey?: string } | StubError
    ): void => {
        mockServer.use(
            http.get(`${BASE_URL}/accounts/${uid}/transactions`, ({ request }) => {
                record(request);
                const result = respond({ uid, query: new URL(request.url).searchParams });

                return 'status' in result
                    ? respondError(result)
                    : HttpResponse.json({ transactions: result.transactions, continuation_key: result.nextKey ?? null });
            })
        );
    },
    startAuthorization: (url: string): void => {
        mockServer.use(
            http.post(`${BASE_URL}/auth`, ({ request }) => {
                record(request);

                return HttpResponse.json({ url, authorization_id: 'synthetic-authorization', psu_id_hash: 'synthetic-psu' });
            })
        );
    },
    authorizeSession: (sessionId: string, aspspName: string, accounts: JsonBodyType[], validUntil: string): void => {
        mockServer.use(
            http.post(`${BASE_URL}/sessions`, ({ request }) => {
                record(request);

                return HttpResponse.json({
                    session_id: sessionId,
                    accounts,
                    aspsp: { name: aspspName, country: 'DE' },
                    psu_type: 'personal',
                    access: { valid_until: validUntil }
                });
            })
        );
    },
    deleteSession: (sessionId: string, error: StubError | null = null): void => {
        mockServer.use(
            http.delete(`${BASE_URL}/sessions/${sessionId}`, ({ request }) => {
                record(request);

                return isDefined(error) ? respondError(error) : HttpResponse.json({ message: 'OK' });
            })
        );
    },
    expectSignedJwts: (): boolean =>
        authorizationHeaders.every(header => {
            const [header64, claims64, signature] = header.replace('Bearer ', '').split('.');

            return testSigner.verify(`${header64}.${claims64}`, signature);
        })
};
