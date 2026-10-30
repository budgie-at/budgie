import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

export const mockServer = setupServer(
    http.get('https://api.monobank.ua/personal/client-info', () =>
        HttpResponse.json({ clientId: 'c1', name: 'Test', webHookUrl: '', permissions: 'sp', accounts: [], jars: [] })
    ),
    http.get('https://api.binance.com/api/v3/account', () => HttpResponse.json({ uid: 100001 }))
);
