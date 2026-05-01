export interface UseExportActionOptionsInterface {
    readonly exportAction: () => Promise<void>;
    readonly successTitle: string;
    readonly successMessage: string;
    readonly errorTitle: string;
}
