import { hasConflictWithRuleOutcomes } from './has-conflict-with-rule-outcomes.util';

describe('hasConflictWithRuleOutcomes', () => {
    it('should return false when no changes', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: 5,
            userTagIds: [10],
            ruleOutcomes: { categoryId: 3, tagIds: [10] },
            categoryChanged: false,
            tagsChanged: false
        });

        expect(result).toBe(false);
    });

    it('should return true when category changed and differs from rule', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: 7,
            userTagIds: [],
            ruleOutcomes: { categoryId: 3, tagIds: [] },
            categoryChanged: true,
            tagsChanged: false
        });

        expect(result).toBe(true);
    });

    it('should return false when category changed to what rule sets', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: 3,
            userTagIds: [],
            ruleOutcomes: { categoryId: 3, tagIds: [] },
            categoryChanged: true,
            tagsChanged: false
        });

        expect(result).toBe(false);
    });

    it('should return false when category changed but rule has no SET_CATEGORY', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: 7,
            userTagIds: [],
            ruleOutcomes: { categoryId: null, tagIds: [] },
            categoryChanged: true,
            tagsChanged: false
        });

        expect(result).toBe(false);
    });

    it('should return true when tags changed and differ from rule tags', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: null,
            userTagIds: [20],
            ruleOutcomes: { categoryId: null, tagIds: [10] },
            categoryChanged: false,
            tagsChanged: true
        });

        expect(result).toBe(true);
    });

    it('should return false when tags changed to match rule tags', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: null,
            userTagIds: [10, 20],
            ruleOutcomes: { categoryId: null, tagIds: [10, 20] },
            categoryChanged: false,
            tagsChanged: true
        });

        expect(result).toBe(false);
    });

    it('should return false when tags changed but rule has no ADD_TAG actions', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: null,
            userTagIds: [10],
            ruleOutcomes: { categoryId: null, tagIds: [] },
            categoryChanged: false,
            tagsChanged: true
        });

        expect(result).toBe(false);
    });

    it('should return true when both category and tags conflict', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: 7,
            userTagIds: [20],
            ruleOutcomes: { categoryId: 3, tagIds: [10] },
            categoryChanged: true,
            tagsChanged: true
        });

        expect(result).toBe(true);
    });

    it('should return false when user only adds tags beyond rule tags (extension, not conflict)', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: null,
            userTagIds: [10, 20, 30],
            ruleOutcomes: { categoryId: null, tagIds: [10] },
            categoryChanged: false,
            tagsChanged: true
        });

        expect(result).toBe(false);
    });

    it('should return true when user removed a rule tag', () => {
        const result = hasConflictWithRuleOutcomes({
            userCategoryId: null,
            userTagIds: [10],
            ruleOutcomes: { categoryId: null, tagIds: [10, 20] },
            categoryChanged: false,
            tagsChanged: true
        });

        expect(result).toBe(true);
    });
});
