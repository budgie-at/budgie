export interface RuleRowSummaryInterface {
    readonly primaryOutcome: string;
    readonly secondaryOutcome: string;
    readonly trigger: string;
    readonly extraConditionsLabel: string | null;
    readonly accessibilityLabel: string;
}
