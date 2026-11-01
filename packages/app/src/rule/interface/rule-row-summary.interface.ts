export interface RuleRowSummaryInterface {
    readonly primaryOutcome: string;
    readonly secondaryOutcome: string;
    readonly triggerPrefix: string;
    readonly triggerValue: string;
    readonly extraConditionsLabel: string | null;
    readonly accessibilityLabel: string;
}
