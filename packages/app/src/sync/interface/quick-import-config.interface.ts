export interface QuickImportConfigInterface {
    readonly mimeType: string;
    readonly importHandler: (uri: string) => Promise<void>;
}
