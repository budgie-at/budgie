export interface SelectorListRowInterface<T> {
    readonly key: string;
    readonly indexLetter?: string;
    readonly title: string | null;
    readonly item: T | null;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}
