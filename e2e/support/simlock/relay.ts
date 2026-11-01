import { createServer, request as httpRequest, type IncomingMessage, type Server } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { AddressInfo } from 'node:net';

/**
 * A loopback relay in front of simlock's agent-device proxy. simlock's daemon
 * policy denies `boot` (it grants devices already booted), while the e2e
 * mobile engine boots its device in `prepare`. The relay answers `boot` for
 * the UDID the engine names, the leased and already booted simulator; every
 * other request, uploads included, passes through untouched.
 */
export interface BootRelay {
  readonly baseUrl: string;
  close(): Promise<void>;
}

const DEBUG = process.env.SIMLOCK_RELAY_DEBUG === '1';

export async function startBootRelay(upstreamBaseUrl: string): Promise<BootRelay> {
  const upstream = new URL(upstreamBaseUrl.endsWith('/') ? upstreamBaseUrl : `${upstreamBaseUrl}/`);
  const send = upstream.protocol === 'https:' ? httpsRequest : httpRequest;

  const forward = (incoming: IncomingMessage, path: string, body?: Buffer) =>
    new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body?: Buffer; stream?: IncomingMessage }>((resolve, reject) => {
      const target = new URL(path.replace(/^\//, ''), upstream);
      const headers = { ...incoming.headers, host: target.host };
      if (body !== undefined) headers['content-length'] = String(body.length);
      const out = send(target, { method: incoming.method, headers }, (response) => {
        if (body === undefined) return resolve({ status: response.statusCode ?? 502, headers: response.headers, stream: response });
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => resolve({ status: response.statusCode ?? 502, headers: response.headers, body: Buffer.concat(chunks) }));
        response.on('error', reject);
      });
      out.on('error', reject);
      if (body !== undefined) out.end(body);
      else incoming.pipe(out);
    });

  const server: Server = createServer(async (incoming, outgoing) => {
    try {
      const path = incoming.url ?? '/';
      if (incoming.method !== 'POST' || !path.startsWith('/rpc')) {
        const reply = await forward(incoming, path);
        outgoing.writeHead(reply.status, reply.headers);
        reply.stream!.pipe(outgoing);
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of incoming) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks);
      const rpc = JSON.parse(raw.toString('utf8')) as { params?: { command?: string } } & Record<string, unknown>;
      const command = rpc.params?.command;
      if (command !== 'boot') {
        const reply = await forward(incoming, path, raw);
        if (DEBUG) console.error(`[relay] ${command} -> ${reply.status}`);
        outgoing.writeHead(reply.status, reply.headers);
        outgoing.end(reply.body);
        return;
      }
      // Answered here, not upstream: simlock's `devices` for a token holding several leases
      // collides with itself ("Request ID is already in flight"), and the leased device is
      // already booted. The engine names it by UDID; that is all a boot answer needs.
      const flags = ((rpc.params as Record<string, unknown> | undefined)?.flags ?? {}) as Record<string, unknown>;
      const udid = typeof flags.udid === 'string' ? flags.udid : undefined;
      if (udid === undefined) {
        outgoing.writeHead(200, { 'content-type': 'application/json' });
        outgoing.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, error: { code: -32000, message: 'simlock relay: boot names no udid', data: { code: 'INVALID_ARGS', message: 'simlock relay: boot names no udid' } } }));
        return;
      }
      const data = { platform: 'ios', target: 'mobile', device: udid, id: udid, kind: 'simulator', booted: true };
      if (DEBUG) console.error(`[relay] boot ${udid} answered locally`);
      const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result: { ok: true, data } }));
      outgoing.writeHead(200, { 'content-type': 'application/json', 'content-length': String(body.length) });
      outgoing.end(body);
    } catch (cause) {
      outgoing.writeHead(502, { 'content-type': 'text/plain' });
      outgoing.end(`simlock relay: ${String(cause)}`);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
