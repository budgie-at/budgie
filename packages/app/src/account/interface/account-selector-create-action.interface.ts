export interface AccountSelectorCreateActionInterface {
    readonly title: string;
    readonly subtitle: string;
    readonly errorMessage: string;
    readonly onCreate: () => Promise<void>;
}
