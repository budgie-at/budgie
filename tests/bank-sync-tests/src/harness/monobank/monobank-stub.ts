import { HttpResponse, http } from 'msw';

import { monobankServer } from './monobank-server';

import type { ClientInfo, StatementItem } from '@liaugust/monobank-sdk';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

export const monobankStub = {
    clientInfo: (info: ClientInfo): void => {
        monobankServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(info)));
    },
    statement: (txs: StatementItem[]): void => {
        monobankServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(txs)));
    },
    statementBatches: (batches: StatementItem[][]): void => {
        monobankServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json([])));
        for (const batch of [...batches].reverse()) {
            monobankServer.use(http.get(STATEMENT_ENDPOINT, () => HttpResponse.json(batch), { once: true }));
        }
    }
};
