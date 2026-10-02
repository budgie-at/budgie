import { HttpResponse, http } from 'msw';

import { mockServer } from '../scenario/mock-server';

export const stubEmptyStatements = (onRequest: (fromUnixSeconds: number) => void): void => {
    mockServer.use(
        http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', ({ params }) => {
            onRequest(Number(params['from']));

            return HttpResponse.json([]);
        })
    );
};
