import { expect } from 'e2e';

import { byId, byText, expectId, openLink, scrollTo, sleep, tapId, type Ctx } from './core.ts';

/** `openLink: budgie://settings?anchor=<anchor>` followed by the settings container wait the flows repeat. */
export async function openSettingsAnchor(ctx: Ctx, anchor: string): Promise<void> {
    await openLink(ctx, `budgie://settings?anchor=${anchor}`);
    await expectId(ctx, 'SettingsPage.Container', 15_000);
}

/** `tapOn: TabBar.Home` + the home balance wait. */
export async function goHome(ctx: Ctx): Promise<void> {
    await tapId(ctx, 'TabBar.Home');
    await expectId(ctx, 'HomePage.TotalBalance', 10_000);
}

/** subflows/settings/run-money-data-upgrade */
export async function runMoneyDataUpgrade(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie://settings/data');
    await sleep(400);
    await scrollTo(ctx, 'SettingsPage.MoneyDataUpgradeCard');
    await expectId(ctx, 'SettingsPage.MoneyDataUpgradeCard', 10_000);
    await tapId(ctx, 'SettingsPage.MoneyDataUpgradeCard');
    await expect(byText(ctx.screen, 'Convert past amounts?')).toBeVisible();
    await ctx.screen.getByText('Convert').last().tap();
    await expectId(ctx, 'SettingsPage.MoneyDataUpgradeCard.Status.COMPLETE', 30_000);
}

/**
 * Maestro's `centerElement`: scroll `testId` in, then drag it out of the
 * bottom band where the floating action button covers it (a tap there
 * opens the action menu instead).
 */
export async function scrollToCentered(ctx: Ctx, testId: string): Promise<void> {
    await scrollTo(ctx, testId);
    const box = await byId(ctx.screen, testId).boundingBox();
    if (box === null || box.y + box.height / 2 < 560) {
        return;
    }
    const x = 200;
    await ctx.screen.swipe({ from: { x, y: 600 }, to: { x, y: 600 - (box.y + box.height / 2 - 437) }, duration: 600 });
    await sleep(600);
}
