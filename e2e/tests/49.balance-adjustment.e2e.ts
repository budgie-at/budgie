import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { mustExec } from '@mobile-ci/e2e-simlock/exec';
import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { PENDING_ANDROID_PORT, test } from '../support/budgie/test.ts';
import { clearAmount, enterComment, typeDigits } from '../support/budgie/transactions.ts';
import { Media } from '../support/media/session.ts';

const ACCOUNT = 'E2E Adjustment Account';

test(
    '49 balance adjustment saves increase and decrease',
    { tags: ['accounts', 'transactions'], platforms: PENDING_ANDROID_PORT },
    async ({ budgie }) => {
        const ctx = budgie.ctx;

        await budgie.start({ fixture: '02.db' });
        await accounts.createLiabilityAccount(ctx, { typeId: 'CreateAccount.CASH', name: ACCOUNT, currency: 'CAD', amount: '250' });

        for (const adjustment of [
            { direction: 'Increase', balance: '300', amount: '300', previous: '250' },
            { direction: 'Decrease', balance: '50', amount: '50', previous: '300' }
        ]) {
            await accounts.openAccountDetails(ctx, ACCOUNT);
            await b.tapId(ctx, `TransactionCard.AdjustmentAmount.${adjustment.previous}`);
            await b.expectId(ctx, 'TransactionForm.AmountInput');
            await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
            await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveAccessibleName('Balance unchanged');
            await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveText(`Balance after saving, C$${adjustment.previous}.00`);
            await b.tapId(ctx, `Adjustment.${adjustment.direction}`);
            await clearAmount(ctx);
            await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
            await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveAccessibleName('Balance after saving');
            await expect(b.byId(ctx.screen, 'Adjustment.Current')).toHaveText(`Current balance, C$${adjustment.previous}.00`);
            await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveAccessibleName('Balance after saving');
            await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveValue('Not set');
            await expect(b.byId(ctx.screen, 'TransactionForm.AmountInput')).toHaveText('C$0');
            await typeDigits(ctx, '0');
            await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
            await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveAccessibleName('Balance after saving');
            await typeDigits(ctx, adjustment.amount);
            const expectedBalance = adjustment.direction === 'Decrease' ? '−C$50.00' : 'C$300.00';
            await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveAccessibleName(`Balance after saving ${expectedBalance}`);
            await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveText(`Balance after saving, ${expectedBalance}`);
            await b.tapId(ctx, 'TransactionForm.SubmitButton');
            await b.expectNoId(ctx, 'TransactionForm.SubmitButton');
            await b.openLink(ctx, 'budgie://');
            await accounts.openAccountSettings(ctx, ACCOUNT);
            await expect(b.byId(ctx.screen, 'CreateAccount.Amount')).toHaveValue(new RegExp(`^${adjustment.balance}(\\.00)?$`));
            await expect(ctx.screen.getByRole('switch', { name: 'Balance sign' }).first()).toHaveValue(
                adjustment.direction === 'Decrease' ? '1' : '0'
            );
            await b.tapId(ctx, 'PageHeader.BackButton');
            await accounts.exitAccountDetailsToHome(ctx);
        }

        await accounts.openAccountDetails(ctx, ACCOUNT);
        await b.tapId(ctx, 'TransactionCard.AdjustmentAmount.50');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
        await enterComment(ctx, 'E2E adjustment note');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeEnabled();
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'TransactionForm.SubmitButton');
        await b.openLink(ctx, 'budgie://');
        await accounts.openAccountDetails(ctx, ACCOUNT);
        await b.tapId(ctx, 'TransactionCard.AdjustmentAmount.50');
        await expect(b.byId(ctx.screen, 'TransactionForm.CommentInput')).toHaveText(/E2E adjustment note/);
        await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveText('Balance after saving, −C$50.00');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
    }
);

for (const fixture of [
    { accountType: 'BANK_SYNC', original: '100', balance: '100', note: 'Reconciliation note persists' },
    { accountType: 'CRYPTO_SYNC', original: '1', balance: '10', note: 'Authoritative note persists' }
]) {
    test(
        `49 synced adjustment ${fixture.accountType} preserves its balance contract`,
        { tags: ['accounts', 'transactions'], platforms: ['ios'] },
        async ({ budgie }) => {
            const ctx = budgie.ctx;
            const media = new Media(ctx);
            const directory = mkdtempSync(join(tmpdir(), 'budgie-synced-adjustment-'));
            const database = join(directory, 'fixture.db');

            try {
                execFileSync('bash', ['../tests/app-tests/scripts/seed-screenshot-scene.sh', '--dry-run', '--output', database], {
                    env: { ...process.env, SCENE: '01-home', LOCALE: 'en', APPEARANCE: 'dark' },
                    stdio: 'ignore'
                });
                execFileSync('python3', ['../tests/app-tests/scripts/seed-synced-adjustment.py', database, fixture.accountType]);
                await media.installDatabase(readFileSync(database));
                await media.writeAppDefaults('AppleLanguages', '-array', 'en');
                await media.writeAppDefaults('AppleLocale', '-string', 'en');
                await mustExec(media.api, await media.lease(), ['ui', 'content_size', 'large']);
                await ctx.app.open();
                await b.openLink(ctx, 'budgie://transactions');
                await b.openLink(ctx, 'budgie://transactions/9901/adjustment');
                await b.expectId(ctx, 'TransactionForm.AmountInput');
                await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
                await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveAccessibleName('Balance unchanged');
                await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveText(new RegExp(`${fixture.balance}\\.00`));

                await expect(b.byId(ctx.screen, 'TransactionForm.AmountInput')).toBeDisabled();
                await b.expectNoId(ctx, 'Adjustment.Decrease');
                await b.expectNoId(ctx, 'Adjustment.Increase');
                await b.expectText(ctx, 'Sync controls this adjustment. Only the note can be edited.');

                await enterComment(ctx, fixture.note);
                await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeEnabled();
                await b.tapId(ctx, 'TransactionForm.SubmitButton');
                await b.expectNoId(ctx, 'TransactionForm.SubmitButton');
                await b.openLink(ctx, 'budgie://transactions/9901/adjustment');
                await b.expectId(ctx, 'Adjustment.Preview');
                await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveAccessibleName('Balance unchanged');
                await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveText(new RegExp(`${fixture.balance}\\.00`));
                await expect(b.byId(ctx.screen, 'TransactionForm.CommentInput')).toHaveText(new RegExp(fixture.note));
                await expect(b.byId(ctx.screen, 'TransactionForm.AmountInput')).toHaveText(new RegExp(`${fixture.original}\\.00`));
                await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
            } finally {
                rmSync(directory, { recursive: true, force: true });
            }
        }
    );
}
