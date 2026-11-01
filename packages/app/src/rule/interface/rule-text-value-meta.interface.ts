export interface RuleTextValueMetaInterface {
    readonly isPattern: boolean;
    readonly placeholder: string;
    readonly hint: string | null;
    readonly isHintWarning: boolean;
    readonly accessibilityLabel: string;
}
