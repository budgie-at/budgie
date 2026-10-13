import { RuleActionTypeEnum } from '@budgie/contracts';
import { RuleService, RuleSuggestionDuplicateError, buildCategoryTagActions, detectRuleChanges } from '@budgie/rules';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer, testSeedService } from './context';

import type { SuggestRuleDataInterface } from '@budgie/rules';

const suggestion: SuggestRuleDataInterface = { title: 'SPAR MARKET', comment: '', mccCode: null, categoryId: null, tagIds: [] };

layer(TestLayer)('rule suggestion', it => {
    it.effect('builds a category action followed by tag actions and skips non-positive ids', () =>
        Effect.sync(() => {
            const actions = buildCategoryTagActions(3, [0, 5, 7]);

            expect(actions.map(action => [action.type, action.categoryId, action.tagId])).toEqual([
                [RuleActionTypeEnum.SET_CATEGORY, 3, null],
                [RuleActionTypeEnum.ADD_TAG, null, 5],
                [RuleActionTypeEnum.ADD_TAG, null, 7]
            ]);
            expect(buildCategoryTagActions(null, [])).toEqual([]);
        })
    );

    it.effect('detects category and tag changes regardless of tag order', () =>
        Effect.sync(() => {
            expect(detectRuleChanges(2, 2, [3, 1], [1, 3])).toEqual({ categoryChanged: false, tagsChanged: false });
            expect(detectRuleChanges(4, 2, [1], [1, 3])).toEqual({ categoryChanged: true, tagsChanged: true });
            expect(detectRuleChanges(null, 2, [], [])).toEqual({ categoryChanged: false, tagsChanged: false });
        })
    );

    it.effect('rejects a duplicate suggestion unless duplicates are allowed, and updates actions preserving others', () =>
        Effect.gen(function* () {
            const ruleService = yield* RuleService;
            const tag = yield* testSeedService.tag('suggested');

            const created = yield* ruleService.createFromSuggestion({ ...suggestion, tagIds: [tag.id] });
            const duplicateRuleId = yield* ruleService.createFromSuggestion(suggestion).pipe(
                Effect.flip,
                Effect.map(error => (error instanceof RuleSuggestionDuplicateError ? error.ruleId : null))
            );

            expect(duplicateRuleId).toBe(created.id);

            const second = yield* ruleService.createFromSuggestionAllowingDuplicate(suggestion);
            const updated = yield* ruleService.applySuggestedActions(second.id, null, [tag.id]);

            expect(updated.id).toBe(second.id);
        })
    );
});
