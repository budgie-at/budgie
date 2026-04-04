import { computeDetectionMode } from './compute-detection-mode.util';

describe('computeDetectionMode', () => {
    it('should return "suggest" when has changes, no rule created, not dismissed, no matching rules', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 0,
                hasConflictWithMatchingRules: false
            })
        ).toBe('suggest');
    });

    it('should return "match" when matching rules exist without conflict', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 2,
                hasConflictWithMatchingRules: false
            })
        ).toBe('match');
    });

    it('should return "match" even without changes when matching rules exist', () => {
        expect(
            computeDetectionMode({
                hasChanges: false,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 1,
                hasConflictWithMatchingRules: false
            })
        ).toBe('match');
    });

    it('should return "none" when no changes', () => {
        expect(
            computeDetectionMode({
                hasChanges: false,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 0,
                hasConflictWithMatchingRules: false
            })
        ).toBe('none');
    });

    it('should return "none" when rule already created', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: true,
                isDismissed: false,
                matchingRulesCount: 0,
                hasConflictWithMatchingRules: false
            })
        ).toBe('none');
    });

    it('should return "none" when dismissed', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: false,
                isDismissed: true,
                matchingRulesCount: 0,
                hasConflictWithMatchingRules: false
            })
        ).toBe('none');
    });

    it('should return "none" when both dismissed and rule created', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: true,
                isDismissed: true,
                matchingRulesCount: 0,
                hasConflictWithMatchingRules: false
            })
        ).toBe('none');
    });

    it('should return "match" over "suggest" when matching rules exist with changes but no conflict', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 3,
                hasConflictWithMatchingRules: false
            })
        ).toBe('match');
    });

    it('should return "match" even when dismissed if matching rules exist', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: false,
                isDismissed: true,
                matchingRulesCount: 1,
                hasConflictWithMatchingRules: false
            })
        ).toBe('match');
    });

    it('should return "none" for all false flags and zero matches', () => {
        expect(
            computeDetectionMode({
                hasChanges: false,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 0,
                hasConflictWithMatchingRules: false
            })
        ).toBe('none');
    });

    it('should return "suggest" when matching rules exist but user has conflicting changes', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 2,
                hasConflictWithMatchingRules: true
            })
        ).toBe('suggest');
    });

    it('should return "match" when conflict exists but suggestion was dismissed', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: false,
                isDismissed: true,
                matchingRulesCount: 1,
                hasConflictWithMatchingRules: true
            })
        ).toBe('match');
    });

    it('should return "match" when conflict exists but rule was already created', () => {
        expect(
            computeDetectionMode({
                hasChanges: true,
                ruleCreated: true,
                isDismissed: false,
                matchingRulesCount: 1,
                hasConflictWithMatchingRules: true
            })
        ).toBe('match');
    });

    it('should return "none" when conflict flag is true but no matching rules', () => {
        expect(
            computeDetectionMode({
                hasChanges: false,
                ruleCreated: false,
                isDismissed: false,
                matchingRulesCount: 0,
                hasConflictWithMatchingRules: true
            })
        ).toBe('none');
    });
});
