export interface WidgetBridgeNativeModuleInterface {
    readonly isAvailable: () => boolean;
    readonly publish: (json: string) => Promise<boolean>;
    readonly read: () => Promise<string | null>;
    readonly clear: () => Promise<boolean>;
}
