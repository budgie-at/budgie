import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

export const mockServer = setupServer(
    http.get('https://api.monobank.ua/personal/client-info', () =>
        HttpResponse.json({ clientId: 'c1', name: 'Test', webHookUrl: '', permissions: 'sp', accounts: [], jars: [] })
    ),
    http.get('https://api.binance.com/api/v3/account', () => HttpResponse.json({ uid: 100001 })),
    http.get('https://api.exchangerate-api.com/v4/latest/:base', () => HttpResponse.json({ base: 'USD', date: '2026-01-01', rates: {} })),
    http.get('https://api.coingecko.com/api/v3/simple/price', () => HttpResponse.json({}))
);
