import { randomBytes } from 'node:crypto';
import { createAgentDeviceClient } from 'agent-device';
import type { DeviceLease, DeviceProvider, DeviceRequest } from '@e2e-dev/mobile';
import { startBootRelay, type BootRelay } from './boot-relay.ts';

/** Where a simlock worker (or gateway) answers, and the agent token the run leases with. */
export interface SimlockOptions {
  /** `http://10.10.1.28:4701`: the worker's HTTP address, without `/v1`. */
  readonly url: string;
  readonly token: string;
  /** A model simlock's catalog lists: `iPhone 17 Pro`. */
  readonly device: string;
  /** Lease TTL; renewed every third of it while the run holds the lease. */
  readonly ttlMs?: number;
}

interface Held extends DeviceLease {
  readonly stop: () => void;
  readonly scope: { tenant: string; runId: string; leaseId: string; leaseBackend: 'ios-instance'; leaseProvider: 'proxy'; clientId: string; deviceKey?: string };
}

const TENANT = 'budgie-e2e';

/**
 * Leases one simulator per worker slot from a simlock worker through its
 * agent-device proxy (`/v1/agent-device`): the run drives the device from
 * this machine, Linux included, and the app is uploaded, not copied to the
 * worker. Every slot holds its own lease; release hands it back and simlock
 * wipes the device for the next one.
 */
export function simlockDevices(options: SimlockOptions): DeviceProvider {
  const baseUrl = `${options.url.replace(/\/$/, '')}/v1/agent-device`;
  const ttlMs = options.ttlMs ?? 30 * 60_000;
  const held = new Map<string, Held>();
  let relay: Promise<BootRelay> | undefined;

  const client = (session: string) => createAgentDeviceClient({ daemonBaseUrl: baseUrl, daemonAuthToken: options.token, session });

  return {
    name: 'simlock',
    async acquire(request: DeviceRequest): Promise<DeviceLease> {
      if (request.platform !== 'ios') throw new Error(`simlockDevices leases iOS simulators, not ${request.platform}`);
      const session = `e2e-${request.runId.slice(0, 12)}-${request.slot}`;
      const started = Date.now();
      const scopeBase = { tenant: TENANT, runId: request.runId, leaseBackend: 'ios-instance' as const, leaseProvider: 'proxy' as const };
      const c = client(session);
      const clientId = randomBytes(8).toString('hex');
      const lease = await c.leases.allocate({
        ...scopeBase,
        clientId,
        leaseId: randomBytes(16).toString('hex'),
        ttlMs,
        platform: 'ios',
        target: 'mobile',
        device: options.device,
      });
      const scope = { ...scopeBase, leaseId: lease.leaseId, clientId: lease.clientId ?? clientId, ...(lease.deviceKey === undefined ? {} : { deviceKey: lease.deviceKey }) };
      request.log(`simlock lease scope ${JSON.stringify({ ...lease, tenantId: undefined })}`);
      request.log(`simlock lease ${lease.leaseId} granted in ${Date.now() - started} ms (${options.device})`);
      const timer = setInterval(() => {
        c.leases.heartbeat({ ...scope, ttlMs }).catch((cause: unknown) => request.log(`simlock heartbeat failed: ${String(cause)}`));
      }, Math.max(10_000, Math.floor(ttlMs / 3)));
      timer.unref();
      let installedApp: string | undefined;
      if (request.appPath !== undefined) {
        const installStarted = Date.now();
        const scoped = createAgentDeviceClient({ daemonBaseUrl: baseUrl, daemonAuthToken: options.token, session, ...scope });
        await scoped.apps.install({ platform: 'ios', appPath: request.appPath, ...(request.app === undefined ? {} : { app: request.app }) });
        installedApp = request.app;
        request.log(`simlock uploaded and installed ${installedApp} in ${Date.now() - installStarted} ms`);
      }
      const entry: Held = {
        id: lease.leaseId,
        daemon: { baseUrl: (await (relay ??= startBootRelay(baseUrl))).baseUrl, authToken: options.token },
        client: scope,
        ...(installedApp === undefined ? {} : { installedApp }),
        stop: () => clearInterval(timer),
        scope,
      };
      held.set(entry.id, entry);
      return entry;
    },
    async release(lease: DeviceLease): Promise<void> {
      const entry = held.get(lease.id);
      if (entry === undefined) return;
      entry.stop();
      await client(`release-${lease.id.slice(0, 8)}`).leases.release(entry.scope);
      held.delete(lease.id);
      if (held.size === 0 && relay !== undefined) {
        await (await relay).close();
        relay = undefined;
      }
    },
  };
}
