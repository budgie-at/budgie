import type { InzhurBankMatchesInterface } from './inzhur-bank-matches.interface';
import type { InzhurFlowSummaryInterface } from './inzhur-flow-summary.interface';
import type { InzhurOperationsFundSummaryInterface } from './inzhur-operations-fund-summary.interface';
import type { InzhurUnrecognisedOperationInterface } from './inzhur-unrecognised-operation.interface';

export interface InzhurOperationsImportSummaryInterface {
    readonly periodFrom: string;
    readonly periodTo: string;
    readonly isFullHistory: boolean;
    readonly recordedCount: number;
    readonly alreadyImportedCount: number;
    readonly topUps: InzhurFlowSummaryInterface;
    readonly withdrawals: InzhurFlowSummaryInterface;
    readonly funds: readonly InzhurOperationsFundSummaryInterface[];
    readonly conversionCount: number;
    readonly surchargeAmount: number;
    readonly unrecognised: readonly InzhurUnrecognisedOperationInterface[];
    readonly bankMatches: InzhurBankMatchesInterface;
    readonly replacedPurchaseCount: number;
    readonly unmatchedBankCount: number;
    readonly cashBalance: number;
}
