import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('44 voice review empty sheet', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '08.db' });
    await b.openLink(ctx, 'budgie://voice-review');
    await b.expectId(ctx, 'VoiceReview.Page');
    await expect(ctx.screen.getByText('No items to save', { exact: true }).first()).toBeVisible();
    await expect(ctx.screen.getByText('Tap re-record to try again', { exact: true }).first()).toBeVisible();
    await b.expectNoId(ctx, 'VoiceReview.SaveButton');
    await b.tapId(ctx, 'VoiceReview.CancelButton');
    await b.expectNoId(ctx, 'VoiceReview.Page');

    await b.openLink(ctx, 'budgie://voice-review');
    await b.expectId(ctx, 'VoiceReview.Page');
    await b.tapId(ctx, 'VoiceReview.ReRecordButton');
    await b.expectNoId(ctx, 'VoiceReview.Page');
});
