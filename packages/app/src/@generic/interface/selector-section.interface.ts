export interface SelectorSectionInterface<T> {
    readonly title: string | null;
    readonly data: readonly T[];
}
