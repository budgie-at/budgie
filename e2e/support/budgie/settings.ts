import { expect } from 'e2e';

import { alertButton, byText, expectId, openLink, scrollTo, tapId, type Ctx } from './core.ts';

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
    await expectId(ctx, 'DataPage.Container', 15_000);
    await scrollTo(ctx, 'SettingsPage.MoneyDataUpgradeCard');
    await expectId(ctx, 'SettingsPage.MoneyDataUpgradeCard', 10_000);
    await tapId(ctx, 'SettingsPage.MoneyDataUpgradeCard');
    await expect(byText(ctx.screen, 'Convert past amounts?')).toBeVisible();
    await alertButton(ctx.screen, 'Convert').tap();
    await expectId(ctx, 'SettingsPage.MoneyDataUpgradeCard.Status.COMPLETE', 30_000);
}
