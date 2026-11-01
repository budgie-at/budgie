export interface RuleOptionSheetRequestInterface<T extends string> {
    readonly values: readonly T[];
    readonly selectedValue: T;
    readonly disabledValues?: ReadonlySet<string>;
    readonly onSelect: (value: T) => void;
}
