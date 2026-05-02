import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import type { MonobankClientInfoApiInterface, MonobankTransactionApiInterface } from '@budgie/bank-sync';

let currentClientInfo: MonobankClientInfoApiInterface = {
    clientId: 'test-client',
    name: 'Test Client',
    webHookUrl: '',
    permissions: 'sp',
    accounts: [],
    jars: []
};

export const monobankServer = setupServer(
    http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(currentClientInfo))
);

export const stubClientInfo = (info: MonobankClientInfoApiInterface): void => {
    currentClientInfo = info;
};

export const stubStatement = (txs: MonobankTransactionApiInterface[]): void => {
    monobankServer.use(http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => HttpResponse.json(txs)));
};
