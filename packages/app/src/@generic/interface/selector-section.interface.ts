export interface SelectorSectionInterface<T> {
    readonly indexLetter?: string;
    readonly title: string | null;
    readonly data: readonly T[];
}
