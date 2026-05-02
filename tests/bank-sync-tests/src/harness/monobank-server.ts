import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

interface MonobankClientInfoStub {
    readonly clientId: string;
    readonly name: string;
    readonly webHookUrl: string;
    readonly permissions: string;
    readonly accounts: unknown[];
    readonly jars: unknown[];
}

const defaultClientInfo: MonobankClientInfoStub = {
    clientId: 'test-client',
    name: 'Test Client',
    webHookUrl: '',
    permissions: 'sp',
    accounts: [],
    jars: []
};

let currentClientInfo: MonobankClientInfoStub = defaultClientInfo;

export const monobankServer = setupServer(
    http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(currentClientInfo))
);

export const stubClientInfo = (info: MonobankClientInfoStub): void => {
    currentClientInfo = info;
};

export const stubStatement = (txs: unknown[]): void => {
    monobankServer.use(http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => HttpResponse.json(txs)));
};
