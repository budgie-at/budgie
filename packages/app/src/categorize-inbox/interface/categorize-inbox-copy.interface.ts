export interface CategorizeInboxCopyInterface {
    readonly pageTitle: string;
    readonly emptyDescription: string;
    readonly selectLabel: string;
    readonly moreLabels: string;
    readonly pickRowLabel: string;
    readonly writeFailed: string;
    readonly assignAs: (labelTitle: string) => string;
    readonly assignedTo: (displayTitle: string, labelTitle: string) => string;
    readonly assignedCount: (count: number) => string;
    readonly doneThisSession: (count: number) => string;
}
