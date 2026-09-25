export interface CategorizeInboxEnrichmentRequestInterface {
    readonly clusterKey: string;
    readonly title: string;
    readonly comment: string;
    readonly mccDescription: string | null;
    readonly rowCount: number;
    readonly typicalAmountLabel: string;
    readonly candidateCategoryIds: number[];
    readonly needsRerank: boolean;
}
