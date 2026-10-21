import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

export const mockServer = setupServer(
    http.get('https://api.monobank.ua/personal/client-info', () =>
        HttpResponse.json({ clientId: 'c1', name: 'Test', webHookUrl: '', permissions: 'sp', accounts: [], jars: [] })
    )
);
