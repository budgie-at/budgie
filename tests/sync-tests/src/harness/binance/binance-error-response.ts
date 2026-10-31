import { HttpResponse } from 'msw';

import type { JsonBodyType } from 'msw';

const respondWithStatus = (status: number, body: JsonBodyType, headers: Record<string, string> = {}) =>
    HttpResponse.json(body, { status, headers });

const errorBody = (code: number, msg: string) => ({ code, msg });

export const binanceErrorResponse = {
    wafBlock: () => new HttpResponse('<html>Forbidden</html>', { status: 403 }),
    ipBan: (retryAfterSeconds: number) =>
        respondWithStatus(418, errorBody(-1003, 'Way too many requests; IP banned.'), { 'retry-after': String(retryAfterSeconds) }),
    regionBlocked: () => new HttpResponse(null, { status: 451 }),
    rateLimited: (retryAfterSeconds: number) =>
        respondWithStatus(429, errorBody(-1003, 'Too many requests'), { 'retry-after': String(retryAfterSeconds) }),
    apiError: (code: number, msg: string, status = 400) => respondWithStatus(status, errorBody(code, msg)),
    unauthorized: (code: number, msg: string) => respondWithStatus(401, errorBody(code, msg))
};
