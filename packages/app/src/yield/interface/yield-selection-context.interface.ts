export interface YieldSelectionContextInterface {
    readonly selectedIndex: number | null;
    readonly selectIndex: (index: number | null) => void;
    readonly cancelScrub: () => void;
}
