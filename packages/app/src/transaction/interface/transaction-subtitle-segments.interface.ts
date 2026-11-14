export interface TransactionSubtitleSegmentsInterface {
    readonly segments: string[];
    readonly feeLabel: string | null;
    readonly accountTitle: string | null;
    readonly categoryLabel: string | null;
    readonly relationLabel: string | null;
    readonly categoryTitles: string;
    readonly counterpartySource: string | null;
    readonly counterpartyDestination: string | null;
}
