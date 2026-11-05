export interface CloudRestoreContextInterface {
    readonly restore: (recordName: string) => void;
    readonly isLoading: boolean;
}
