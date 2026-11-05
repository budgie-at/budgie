import { mustExec } from '@mobile-ci/e2e-simlock/exec';
import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as core from '../support/budgie/core.ts';
import { BUNDLE_ID, seedDatabase } from '../support/budgie/fixtures.ts';
import { test } from '../support/budgie/test.ts';

test('contact selector denied access provides recovery and disables search', { tags: ['accounts'] }, async ({ budgie }) => {
    const context = budgie.ctx;
    const lease = await budgie.lease();
    await seedDatabase(budgie.api, lease, await budgie.container(), '03.db');
    await context.device.openApp(BUNDLE_ID, { permissions: { contacts: 'deny' } });
    await core.expectId(context, 'TabBar.Home', 30_000);

    try {
        await accounts.openNewAccount(context);
        await core.tapId(context, 'CreateAccount.DEBT');
        await core.scrollTo(context, 'AccountForm.ContactSelector');
        await core.tapId(context, 'AccountForm.ContactSelector');
        await core.expectText(context, 'Contacts access is off');
        await core.expectId(context, 'ContactSelector.Settings');
        await expect(context.screen.getByText('Create one to get started.').first()).toBeHidden();
        await expect(context.screen.getByText('No contacts on this device').first()).toBeHidden();
        await expect(core.byId(context.screen, 'ContactSelector.Search')).toBeDisabled();
        await expect(core.byId(context.screen, 'ContactSelector.Settings')).toBeEnabled();
    } finally {
        await mustExec(budgie.api, lease, ['privacy', 'grant', 'contacts', BUNDLE_ID]);
    }
});
