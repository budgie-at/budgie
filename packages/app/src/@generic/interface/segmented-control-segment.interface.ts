export interface SegmentedControlSegmentInterface<T extends string> {
    readonly value: T;
    readonly label: string;
    readonly testID?: string;
}
