export interface RuleApplyStatusInterface {
    readonly available: boolean;
    readonly isLoading: boolean;
    readonly matched: number;
    readonly applied: number;
    readonly pending: number;
}
