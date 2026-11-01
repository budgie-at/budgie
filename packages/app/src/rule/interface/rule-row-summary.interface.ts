export interface RuleRowSummaryInterface {
    readonly primaryOutcome: string;
    readonly secondaryOutcome: string;
    readonly trigger: string;
    readonly triggerPrefix: string;
    readonly triggerValue: string;
    readonly triggerOverflow: string | null;
    readonly extraConditionsLabel: string | null;
    readonly accessibilityLabel: string;
}
