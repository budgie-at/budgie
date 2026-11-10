import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export type ScopedSqlType = (scope: ConsolidationScanScopeInterface | null) => string;
