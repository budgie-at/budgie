export interface DestinationSelectionInterface {
    readonly selectedId: number | null;
    readonly onSelect: (id: number) => void;
    readonly search: string;
    readonly onSearchChange: (search: string) => void;
}
