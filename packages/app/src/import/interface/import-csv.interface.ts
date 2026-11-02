export interface ImportCsvInterface {
    readonly csvText: string;
    readonly headers: string[];
    readonly samples: Record<string, string>;
    readonly rowCount: number;
}
