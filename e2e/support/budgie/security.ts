import { expect } from 'e2e';

import { byId, byText, expectId, sleep, tapId, type Ctx } from './core.ts';
import { BUNDLE_ID } from './fixtures.ts';
import { openE2EFixturesFullPath } from './imports.ts';

/** The backup's system share sheet ("Save to Files"): swipe it down from that row, retried like the flow's `retry: maxRetries: 2`. */
export async function dismissSaveToFilesSheet(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    const row = byText(screen, 'Save to Files');
    await expect(row).toBeVisible({ timeout: 15_000 });
    for (let attempt = 1; ; attempt++) {
        const box = await row.boundingBox();
        if (box === null) {
            throw new Error('"Save to Files" has no bounds');
        }
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await screen.swipe({ from: { x, y }, to: { x, y: Math.min(y + 400, 860) }, duration: 300 });
        try {
            await expect(row).toBeHidden({ timeout: 3_000 });
            return;
        } catch (cause) {
            if (attempt === 3) {
                throw cause;
            }
            await sleep(300);
        }
    }
}

/** Taps the PIN pad digits in order (`'1234'`). */
export async function enterPin(ctx: Ctx, pin: string): Promise<void> {
    for (const digit of pin) {
        await tapId(ctx, `PinPage.Digit.${digit}`);
    }
}

/** Four wrong PINs (each answered "Incorrect PIN"), the fifth locks the pad; a tap while locked does nothing; the lockout clears within 45 s. */
export async function exhaustPinAttempts(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    for (let i = 0; i < 4; i++) {
        await enterPin(ctx, '1111');
        await expect(byText(screen, 'Incorrect PIN')).toBeVisible();
    }
    await enterPin(ctx, '1111');
    const locked = byText(screen, /^Too many attempts/);
    await expect(locked).toBeVisible();
    await expect(byId(screen, 'PinPage.Digit.1')).toBeDisabled();
    await tapId(ctx, 'PinPage.Digit.1');
    await expect(locked).toBeVisible();
    await expect(locked).toBeHidden({ timeout: 45_000 });
}

/** subflows/security/resume-after-pin-unlock: background, relaunch, try the forgot-PIN sheet, unlock, back on `resumedScreenId`. */
export async function resumeAfterPinUnlock(ctx: Ctx, resumedScreenId: string): Promise<void> {
    const { screen } = ctx;
    await ctx.device.home();
    // launchApp stopApp: false: bring the running app forward; app.open() would relaunch it fresh.
    await ctx.device.openApp(BUNDLE_ID);
    await expect(byText(screen, 'Enter your PIN')).toBeVisible();
    await tapId(ctx, 'PinScreen.ForgotPinButton');
    await expectId(ctx, 'ForgotPinSheet.TryAgainButton', 3_000);
    await tapId(ctx, 'ForgotPinSheet.TryAgainButton');
    await expect(byText(screen, 'Enter your PIN')).toBeVisible({ timeout: 3_000 });
    await enterPin(ctx, '1234');
    await expectId(ctx, resumedScreenId, 10_000);
}

const openFolderPickerBrowseTab = async (ctx: Ctx): Promise<void> => {
    const tabBar = byId(ctx.screen, 'DOC.browsingModeTabBar');
    await expect(tabBar).toBeVisible({ timeout: 15_000 });
    await tabBar
        .getByRole('button', { name: 'Browse' })
        .or(tabBar.getByRole('tab', { name: 'Browse' }))
        .first()
        .tap();
    await sleep(800);
};

/**
 * Cancels the folder picker with its own Cancel button, which only some of its screens show: a folder's
 * navigation bar has Back instead, and a slimmed simulator's Recents tab fails with "Content Unavailable"
 * and has neither. The Browse root always has it.
 */
export async function cancelBackupFolderPicker(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    const cancel = screen.getByRole('button', { name: 'Cancel', exact: true }).first();
    await openFolderPickerBrowseTab(ctx);
    for (let step = 0; step < 4 && !(await cancel.isVisible()); step++) {
        await byId(screen, 'BackButton').tap();
        await sleep(800);
    }
    await cancel.tap();
    await expect(byId(screen, 'DOC.browsingModeTabBar')).toBeHidden({ timeout: 15_000 });
}

export async function saveBackupToFixtureDirectory(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    await openFolderPickerBrowseTab(ctx);
    await openE2EFixturesFullPath(ctx, screen.getByTestId(/Title: E2EFixtures$/).first());
    await screen.getByRole('button', { name: 'Open', exact: true }).last().tap();
}
