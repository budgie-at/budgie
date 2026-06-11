import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export interface ConsolidationFamilyRunContextInterface {
    readonly blockedSourceTransactionIds: ReadonlySet<number>;
    readonly onProgress?: (processedCandidateGroupCount: number) => void;
    readonly scope: ConsolidationScanScopeInterface | null;
}
