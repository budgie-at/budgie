import { gzipSync } from 'node:zlib';

/**
 * Host-side device work over simlock's HTTP API. `POST /v1/leases/<id>/exec`
 * runs one `simctl` command on the worker for the leased simulator only
 * (simlock inserts the UDID). `simctl spawn … /bin/sh -c` runs the simulator
 * runtime's shell, which reaches the Mac's own `/bin` and `/usr/bin` by
 * absolute path, so files travel as base64 on stdin and are unpacked by the
 * worker's own tools: the runner needs no SSH key and no shared disk.
 */
export interface SimlockApi {
  readonly url: string;
  readonly token: string;
}

export interface ExecResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export function simlockApiFromEnv(env: NodeJS.ProcessEnv = process.env): SimlockApi {
  const url = env.SIMLOCK_URL;
  const token = env.SIMLOCK_TOKEN;
  if (!url || !token) throw new Error('SIMLOCK_URL and SIMLOCK_TOKEN are required');
  return { url, token };
}

async function call(api: SimlockApi, path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${api.url.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${api.token}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`simlock ${init.method ?? 'GET'} ${path} answered ${response.status}: ${await response.text()}`);
  return response;
}

/** The simlock lease of this token that holds the simulator with this UDID. */
export async function leaseIdForUdid(api: SimlockApi, udid: string): Promise<string> {
  const body = (await (await call(api, '/v1/leases')).json()) as { leases: Record<string, unknown>[] };
  for (const lease of body.leases) {
    if (JSON.stringify(lease).includes(udid)) return String(lease.id);
    const detail = await (await call(api, `/v1/leases/${String(lease.id)}`)).text();
    if (detail.includes(udid)) return String(lease.id);
  }
  throw new Error(`no simlock lease of this token holds ${udid} (${body.leases.length} leases)`);
}

/** Runs one `simctl` command on the leased simulator. */
export async function exec(api: SimlockApi, leaseId: string, args: readonly string[], stdin?: string): Promise<ExecResult> {
  const response = await call(api, `/v1/leases/${leaseId}/exec`, {
    method: 'POST',
    body: JSON.stringify({ tool: 'simctl', args, ...(stdin === undefined ? {} : { stdin }) }),
  });
  const text = await response.text();
  let stdout = '';
  let stderr = '';
  let exitCode = -1;
  let event = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('event: ')) event = line.slice(7).trim();
    else if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6)) as { stream?: string; chunk?: string; exitCode?: number; code?: string; message?: string };
      if (event === 'output') {
        if (data.stream === 'stderr') stderr += data.chunk ?? '';
        else stdout += data.chunk ?? '';
      } else if (event === 'exit') exitCode = data.exitCode ?? -1;
      else if (event === 'error') throw new Error(`simlock exec ${args.slice(0, 2).join(' ')} failed: ${data.code} ${data.message}`);
    }
  }
  return { exitCode, stdout, stderr };
}

export async function mustExec(api: SimlockApi, leaseId: string, args: readonly string[], stdin?: string): Promise<string> {
  const result = await exec(api, leaseId, args, stdin);
  if (result.exitCode !== 0) throw new Error(`simctl ${args.slice(0, 3).join(' ')} exited ${result.exitCode}: ${result.stderr.trim()}`);
  return result.stdout;
}

export const shellQuote = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

/** Runs a POSIX shell script on the worker, inside the simulator's environment. */
export function sh(api: SimlockApi, leaseId: string, script: string, stdin?: string): Promise<string> {
  return mustExec(api, leaseId, ['spawn', '/bin/sh', '-c', script], stdin);
}

/** Writes `bytes` to `path` on the worker. */
export async function writeFile(api: SimlockApi, leaseId: string, path: string, bytes: Buffer): Promise<void> {
  const dir = path.slice(0, path.lastIndexOf('/'));
  await sh(api, leaseId, `/bin/mkdir -p ${shellQuote(dir)} && /usr/bin/base64 -d | /usr/bin/gunzip > ${shellQuote(path)}`, gzipSync(bytes).toString('base64'));
}

/** Unpacks a `.tar.gz` into `dir` on the worker. */
export async function extractTarGz(api: SimlockApi, leaseId: string, dir: string, tarGz: Buffer): Promise<void> {
  await sh(api, leaseId, `/bin/mkdir -p ${shellQuote(dir)} && /usr/bin/base64 -d | /usr/bin/tar -xzf - -C ${shellQuote(dir)}`, tarGz.toString('base64'));
}
