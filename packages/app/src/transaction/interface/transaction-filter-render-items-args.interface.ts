export interface TransactionFilterRenderItemsArgsInterface<T extends { id: number }> {
    items: T[];
    selectedIds: number[];
    onSelect: (...ids: number[]) => void;
}
