import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Host-side device setup over simlock's HTTP API: the commands budgie's
 * Maestro shard ran with `xcrun simctl` on the Mac, run instead through
 * `POST /v1/leases/<id>/exec`, which runs `simctl` on the worker for the
 * leased simulator only. Files travel as gzip+base64 on the command's stdin
 * and are written by the worker's own `/usr/bin/base64` under `simctl spawn`,
 * so the runner needs no SSH key and no shared disk.
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

async function call(api: SimlockApi, path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${api.url.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${api.token}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`simlock ${init.method ?? 'GET'} ${path} answered ${response.status}: ${await response.text()}`);
  return response;
}

/** The simlock lease that holds the simulator with this UDID, among the token's own leases. */
export async function leaseIdForUdid(api: SimlockApi, udid: string): Promise<string> {
  const body = (await (await call(api, '/v1/leases')).json()) as { leases: Record<string, unknown>[] };
  for (const lease of body.leases) {
    if (JSON.stringify(lease).includes(udid)) return String(lease.id);
    const detail = await (await call(api, `/v1/leases/${String(lease.id)}`)).text();
    if (detail.includes(udid)) return String(lease.id);
  }
  console.log(`[simlock] leases of this token: ${JSON.stringify(body.leases).slice(0, 800)}`);
  if (body.leases.length === 1) return String(body.leases[0]!.id);
  throw new Error(`no simlock lease of this token holds ${udid}`);
}

/** Runs one `simctl` command on the leased simulator; simlock inserts the UDID. */
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
      else if (event === 'error') throw new Error(`simlock exec ${args.join(' ')} failed: ${data.code} ${data.message}`);
    }
  }
  return { exitCode, stdout, stderr };
}

async function mustExec(api: SimlockApi, leaseId: string, args: readonly string[], stdin?: string): Promise<string> {
  const result = await exec(api, leaseId, args, stdin);
  if (result.exitCode !== 0) throw new Error(`simctl ${args.slice(0, 3).join(' ')} exited ${result.exitCode}: ${result.stderr.trim()}`);
  return result.stdout;
}

const quote = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

/** Writes `bytes` to `path` on the worker, through the simulator's shell running the Mac's own tools. */
async function writeFile(api: SimlockApi, leaseId: string, path: string, bytes: Buffer): Promise<void> {
  const dir = path.slice(0, path.lastIndexOf('/'));
  const script = `/bin/mkdir -p ${quote(dir)} && /usr/bin/base64 -d | /usr/bin/gunzip > ${quote(path)}`;
  await mustExec(api, leaseId, ['spawn', '/bin/sh', '-c', script], gzipSync(bytes).toString('base64'));
}

/**
 * The once-per-device preparation the Maestro shard does: keyboard and
 * language, reduced motion, and the contacts/microphone grants budgie asks
 * for at launch.
 */
export async function prepareSimulator(api: SimlockApi, leaseId: string, bundleId: string): Promise<void> {
  await mustExec(api, leaseId, ['spawn', 'defaults', 'write', '.GlobalPreferences', 'AppleKeyboards', '-array', 'en_US@sw=QWERTY;hw=Automatic', 'emoji@sw=Emoji']);
  await mustExec(api, leaseId, ['spawn', 'defaults', 'write', '.GlobalPreferences', 'AppleLanguages', '-array', 'en-US']);
  await mustExec(api, leaseId, ['spawn', 'defaults', 'write', 'com.apple.Accessibility', 'ReduceMotionEnabled', '-bool', 'true']);
  for (const service of ['contacts', 'microphone']) await exec(api, leaseId, ['privacy', 'grant', service, bundleId]);
}

/** The SQL `setup-ios-e2e-fixtures.sh` runs on every database fixture before it is installed. */
function normalizeFixture(source: string): Buffer {
  const dir = mkdtempSync(join(tmpdir(), 'budgie-fixture-'));
  const db = join(dir, 'fixture.db');
  try {
    copyFileSync(source, db);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const sql = `
UPDATE settings SET is_screenshot_protection_enabled = 0;
WITH RECURSIVE latest AS (
    SELECT rates.source_instrument_id, rates.target_instrument_id, MAX(rates.rate_date) AS rate_date
    FROM historical_exchange_rates AS rates
    JOIN instruments AS source ON source.id = rates.source_instrument_id AND source.type = 'FIAT'
    JOIN instruments AS target ON target.id = rates.target_instrument_id AND target.type = 'FIAT'
    WHERE rates.deleted_at IS NULL
    GROUP BY rates.source_instrument_id, rates.target_instrument_id
),
days(source_instrument_id, target_instrument_id, rate_date, rate) AS (
    SELECT latest.source_instrument_id, latest.target_instrument_id, date(latest.rate_date, '+1 day'), rates.rate
    FROM latest
    JOIN historical_exchange_rates AS rates
        ON rates.source_instrument_id = latest.source_instrument_id
        AND rates.target_instrument_id = latest.target_instrument_id
        AND rates.rate_date = latest.rate_date
        AND rates.deleted_at IS NULL
    WHERE latest.rate_date < '${tomorrow}'
    UNION ALL
    SELECT source_instrument_id, target_instrument_id, date(rate_date, '+1 day'), rate FROM days WHERE rate_date < '${tomorrow}'
)
INSERT INTO historical_exchange_rates (source_instrument_id, target_instrument_id, rate_date, rate)
SELECT source_instrument_id, target_instrument_id, rate_date, rate FROM days;
INSERT OR IGNORE INTO instrument_market_data_jobs (created_at, updated_at, instrument_id, quote_instrument_id, from_date, to_date, status)
SELECT unixepoch(), unixepoch(), held.id, euro.id, '${today}', '${today}', 'UNSUPPORTED'
FROM instruments AS held
JOIN instruments AS euro ON euro.code = 'EUR' AND euro.type = 'FIAT'
WHERE held.type = 'FIAT'
    AND held.id <> euro.id
    AND held.id IN (
        SELECT instrument_id FROM accounts WHERE deleted_at IS NULL
        UNION
        SELECT default_instrument_id FROM settings
    )
    AND NOT EXISTS (
        SELECT 1 FROM historical_exchange_rates AS rates
        WHERE rates.source_instrument_id = held.id
            AND rates.target_instrument_id = euro.id
            AND rates.deleted_at IS NULL
    );
`;
    execFileSync('sqlite3', ['-bail', db], { input: sql, stdio: ['pipe', 'ignore', 'inherit'] });
    return readFileSync(db);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * `seed-flow-fixture.sh` + `install_database_fixture`: stops the app, resets
 * the keychain, and replaces its live database with the normalized fixture.
 * The app must be installed; the caller launches it afterwards.
 */
export async function seedDatabase(api: SimlockApi, leaseId: string, bundleId: string, fixturePath: string): Promise<void> {
  const bytes = normalizeFixture(fixturePath);
  const container = (await mustExec(api, leaseId, ['get_app_container', bundleId, 'data'])).trim();
  if (!container.startsWith('/')) throw new Error(`unexpected app data container for ${bundleId}: ${container}`);
  await exec(api, leaseId, ['terminate', bundleId]);
  await exec(api, leaseId, ['keychain', 'reset']);
  const sqliteDir = `${container}/Documents/SQLite`;
  await mustExec(api, leaseId, ['spawn', '/bin/sh', '-c', `/bin/mkdir -p ${quote(sqliteDir)} && /bin/rm -f ${quote(sqliteDir)}/budgie.db*`]);
  await writeFile(api, leaseId, `${sqliteDir}/budgie.db`, bytes);
}
