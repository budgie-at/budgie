import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { test } from 'node:test';

import { exec } from './exec.ts';

import type { AddressInfo } from 'node:net';

const EXIT_ZERO = 'event: output\ndata: {"stream":"stdout","chunk":"ok"}\n\nevent: exit\ndata: {"exitCode":0}\n\n';

type Reply = (request: IncomingMessage, response: ServerResponse) => void;

/** A stand-in gateway answering each request with the next reply, and the number of requests it saw. */
async function gateway(replies: readonly Reply[]): Promise<{ url: string; requests: () => number; close: () => void }> {
    let seen = 0;
    const server = createServer((request, response) => {
        const reply = replies[Math.min(seen, replies.length - 1)];
        seen++;
        request.resume();
        request.on('end', () => reply?.(request, response));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${port}`, requests: () => seen, close: () => server.close() };
}

const reset: Reply = request => request.socket.destroy();
const cutMidStream: Reply = (_request, response) => {
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    response.write('event: output\n');
    setImmediate(() => response.socket?.destroy());
};
const exitZero: Reply = (_request, response) => {
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    response.end(EXIT_ZERO);
};
const forbidden: Reply = (_request, response) => {
    response.writeHead(403);
    response.end('{"error":"FORBIDDEN"}');
};

test('a connection the tunnel resets before the answer is asked again', async () => {
    const farm = await gateway([reset, exitZero]);
    try {
        const result = await exec({ url: farm.url, token: 't' }, 'lease', ['spawn', 'true']);
        assert.deepEqual(result, { exitCode: 0, stdout: 'ok', stderr: '' });
        assert.equal(farm.requests(), 2);
    } finally {
        farm.close();
    }
});

test('an answer cut off mid-stream is asked again', async () => {
    const farm = await gateway([cutMidStream, exitZero]);
    try {
        const result = await exec({ url: farm.url, token: 't' }, 'lease', ['spawn', 'true']);
        assert.equal(result.exitCode, 0);
        assert.equal(farm.requests(), 2);
    } finally {
        farm.close();
    }
});

test('a transport that keeps failing fails the command after three attempts', async () => {
    const farm = await gateway([reset]);
    try {
        await assert.rejects(exec({ url: farm.url, token: 't' }, 'lease', ['spawn', 'true']), /fetch failed/);
        assert.equal(farm.requests(), 3);
    } finally {
        farm.close();
    }
});

test('an error the gateway answers is never asked again', async () => {
    const farm = await gateway([forbidden, exitZero]);
    try {
        await assert.rejects(exec({ url: farm.url, token: 't' }, 'lease', ['spawn', 'true']), /answered 403/);
        assert.equal(farm.requests(), 1);
    } finally {
        farm.close();
    }
});
