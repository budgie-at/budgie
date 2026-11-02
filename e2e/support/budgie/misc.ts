import type { Screen } from 'e2e';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, mustExec, writeFile } from '../simlock/exec.ts';
import { byId, openLink, type Budgie, type Ctx } from './core.ts';
import { BUNDLE_ID } from './fixtures.ts';

/** A device engine keeps native types it does not map verbatim; the chip row is a `scroll-view`. */
const SCROLL_VIEW = 'scroll-view' as Parameters<Screen['getByRole']>[0];

/**
 * Maestro's `swipe: from: <chip>, direction: LEFT|RIGHT` on the transaction
 * filter chips, verified by the chip the flow asserts next: pages the chip
 * row (the scroll view holding `anchorId`) until `targetId` shows.
 * `direction` is the content's: `right` reveals the chips on the right
 * (Maestro `LEFT`), `left` the ones on the left (Maestro `RIGHT`).
 */
export async function revealChip(ctx: Ctx, anchorId: string, targetId: string, direction: 'left' | 'right'): Promise<void> {
  const row = ctx.screen.getByRole(SCROLL_VIEW).filter({ has: byId(ctx.screen, anchorId) }).last();
  await row.scrollUntilVisible(byId(ctx.screen, targetId), { direction, timeout: 15_000 });
}

const APP_GROUP = `group.${BUNDLE_ID}`;
const SHARE_KEY = 'budgieShareKey';
const FIXTURES = fileURLToPath(new URL('../../../tests/app-tests/fixtures/', import.meta.url));

/**
 * The share sheet's hand-off to budgie's share extension (expo-share-intent),
 * done host-side: the extension copies the shared file into the app group
 * container, stores its description under `budgieShareKey` in the group's
 * defaults and opens `budgie://dataUrl=budgieShareKey#file`. This does the
 * same with a fixture from tests/app-tests/fixtures (`receipt/receipt-e2e.pdf`).
 * Files and the share sheet themselves are not driven: on simlock's
 * simulators Files cannot open the folder (see the porting report).
 */
export async function shareFixtureWithApp(budgie: Budgie, fixture: string, mimeType: string): Promise<void> {
  const { api } = budgie;
  const lease = await budgie.lease();
  const bytes = readFileSync(join(FIXTURES, fixture));
  const fileName = basename(fixture);
  const group = (await mustExec(api, lease, ['get_app_container', BUNDLE_ID, APP_GROUP])).trim();
  if (!group.startsWith('/')) throw new Error(`unexpected app group container for ${APP_GROUP}: ${group}`);
  const target = `${group}/${randomUUID().toUpperCase()}.${fileName.split('.').pop()}`;
  const payload = Buffer.from(JSON.stringify([{ path: `file://${target}`, fileName, fileSize: bytes.length, mimeType, type: 2 }])).toString('base64');
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>${SHARE_KEY}</key><data>${payload}</data></dict></plist>
`;
  // The group's defaults are cached by the running app and the simulator's cfprefsd: stop the app,
  // write the plist the extension's synchronize() would leave (the app rewrites its widget keys on
  // launch), restart cfprefsd so it reads the file again. The extension's link then launches the app.
  await exec(api, lease, ['terminate', BUNDLE_ID]);
  await writeFile(api, lease, target, bytes);
  await writeFile(api, lease, `${group}/Library/Preferences/${APP_GROUP}.plist`, Buffer.from(plist));
  await exec(api, lease, ['spawn', 'launchctl', 'kill', 'SIGKILL', 'system/com.apple.cfprefsd.xpc.daemon']);
  await openLink(budgie.ctx, `budgie://dataUrl=${SHARE_KEY}?nonce=${randomUUID()}#file`);
}
