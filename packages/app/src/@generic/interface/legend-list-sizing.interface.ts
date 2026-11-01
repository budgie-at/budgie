export interface LegendListSizingInterface<TItem, TItemType extends string = string> {
    readonly estimatedItemSize?: number;
    readonly gap?: number;
    readonly getItemType?: (item: TItem, index: number) => TItemType;
}
