import { resolve } from 'node:path';

import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { plan } from '../support/media/plan.ts';
import { test } from '../support/media/test.ts';

for (const cell of plan().filter(cell => cell.test === 'ai-transaction-suggestions-1' || cell.test === 'ai-tag-suggestions-1')) {
    test(`${cell.scene} applies the selected suggestion`, async ({ media }) => {
        await media.capture({ ...cell, path: resolve('.e2e/suggestion-actions', `${cell.scene}.png`) });
        const isTag = cell.test === 'ai-tag-suggestions-1';
        const suggestionId = isTag ? 'SuggestionPill.PatternTag.0' : 'SuggestionPill.PatternCategory.0';
        const fieldId = isTag ? 'TransactionForm.TagsSelector.Title' : 'TransactionForm.CategorySelector.Title';
        const suggestion = b.byId(media.ctx.screen, suggestionId);
        await expect(suggestion).toHaveText(/\S/);
        const title = (await suggestion.textContent())?.trim() ?? '';
        await suggestion.tap();
        await expect(b.byId(media.ctx.screen, fieldId)).toContainText(title);
        await b.expectNoId(media.ctx, suggestionId);
    });
}
