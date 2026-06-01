export interface ConsolidationProgressSnapshotInterface {
    readonly autoCandidateCount: number;
    readonly isRunning: boolean;
    readonly manualReviewCandidateCount: number;
    readonly remainingCandidateGroupCount: number;
}
