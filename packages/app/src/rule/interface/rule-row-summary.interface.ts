export interface RuleRowSummaryInterface {
    readonly primaryOutcome: string;
    readonly secondaryOutcome: string;
    readonly triggerPrefix: string;
    readonly triggerValue: string;
    readonly isTriggerQuoted: boolean;
    readonly extraConditionsLabel: string | null;
    readonly accessibilityLabel: string;
}
