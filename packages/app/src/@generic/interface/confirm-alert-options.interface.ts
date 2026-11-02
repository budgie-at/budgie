export interface ConfirmAlertOptionsInterface {
    readonly title: string;
    readonly message?: string;
    readonly confirmText: string;
    readonly cancelText: string;
    readonly isDestructive?: boolean;
}
