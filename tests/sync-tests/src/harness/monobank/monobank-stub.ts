import { HttpResponse, http } from 'msw';

import { mockServer } from '../scenario/mock-server';

import type { MonobankClientInfoApiInterface, MonobankTransactionApiInterface } from '@budgie/sync';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

export const monobankStub = {
    clientInfo: (info: MonobankClientInfoApiInterface): void => {
        mockServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(info)));
    },
    statement: (txs: MonobankTransactionApiInterface[]): void => {
        mockServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(txs)));
    },
    statementBatches: (batches: MonobankTransactionApiInterface[][]): void => {
        mockServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json([])));
        for (const batch of [...batches].reverse()) {
            mockServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(batch), { once: true }));
        }
    }
};
