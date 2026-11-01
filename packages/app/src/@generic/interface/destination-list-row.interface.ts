export interface DestinationListRowInterface<T> {
    readonly item: T;
    readonly sectionTitle: string | null;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}
