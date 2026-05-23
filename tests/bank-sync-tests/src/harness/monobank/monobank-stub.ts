import { HttpResponse, http } from 'msw';

import { monobankServer } from './monobank-server';

import type { MonobankClientInfoApiInterface, MonobankTransactionApiInterface } from '@budgie/bank-sync';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

export const monobankStub = {
    clientInfo: (info: MonobankClientInfoApiInterface): void => {
        monobankServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(info)));
    },
    statement: (txs: MonobankTransactionApiInterface[]): void => {
        monobankServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(txs)));
    },
    statementBatches: (batches: MonobankTransactionApiInterface[][]): void => {
        monobankServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json([])));
        for (const batch of [...batches].reverse()) {
            monobankServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(batch), { once: true }));
        }
    }
};
