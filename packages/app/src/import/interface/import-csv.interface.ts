export interface ImportCsvInterface {
    readonly csvText: string;
    readonly headers: string[];
    readonly samples: Record<string, readonly string[]>;
    readonly rowCount: number;
}
