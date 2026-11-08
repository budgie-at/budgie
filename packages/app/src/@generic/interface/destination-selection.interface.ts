export interface DestinationSelectionInterface {
    readonly selectedId: number | null;
    readonly onSelect: (id: number) => void;
}
