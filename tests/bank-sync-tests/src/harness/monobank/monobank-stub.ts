import { http, HttpResponse } from 'msw';

import type { MonobankClientInfoApiInterface, MonobankTransactionApiInterface } from '@budgie/bank-sync';

import { monobankServer } from './monobank-server';

export const monobankStub = {
    clientInfo: (info: MonobankClientInfoApiInterface): void => {
        monobankServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(info)));
    },
    statement: (txs: MonobankTransactionApiInterface[]): void => {
        monobankServer.use(
            http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => HttpResponse.json(txs))
        );
    }
};
