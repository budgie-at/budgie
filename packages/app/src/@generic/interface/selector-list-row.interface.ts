export interface SelectorListRowInterface<T> {
    readonly key: string;
    readonly title: string | null;
    readonly item: T | null;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}
