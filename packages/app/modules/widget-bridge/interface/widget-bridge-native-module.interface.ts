export interface WidgetBridgeNativeModuleInterface {
    readonly isAvailable: () => boolean;
    readonly publish: (json: string) => Promise<boolean>;
    readonly clear: () => Promise<boolean>;
}
