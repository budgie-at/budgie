import { HttpResponse, http } from 'msw';

import { mockServer } from '../scenario/mock-server';

import type { ClientInfo, StatementItem } from '@liaugust/monobank-sdk';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

export const monobankStub = {
    clientInfo: (info: ClientInfo, onRequest?: () => void): void => {
        mockServer.use(
            http.get('https://api.monobank.ua/personal/client-info', () => {
                onRequest?.();

                return HttpResponse.json(info);
            })
        );
    },
    clientInfoFailure: (): void => {
        mockServer.use(
            http.get('https://api.monobank.ua/personal/client-info', () =>
                HttpResponse.json({ errorDescription: 'provider unavailable' }, { status: 500 })
            )
        );
    },
    statement: (txs: StatementItem[]): void => {
        mockServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(txs)));
    },
    statementBatches: (batches: StatementItem[][]): void => {
        mockServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json([])));
        for (const batch of [...batches].reverse()) {
            mockServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(batch), { once: true }));
        }
    },
    recordStatementAccountIds: (requestedAccountIds: string[], onRequest?: () => void): void => {
        mockServer.use(
            http.get(STATEMENT_ENDPOINT, ({ params }) => {
                requestedAccountIds.push(String(params['account']));
                onRequest?.();

                return HttpResponse.json([]);
            })
        );
    }
};
