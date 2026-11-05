import type { InzhurImportOutcomeEnum } from '../enum/inzhur-import-outcome.enum';
import type { InzhurFundChangeInterface } from './inzhur-fund-change.interface';

export interface InzhurImportSummaryInterface {
    readonly outcome: InzhurImportOutcomeEnum;
    readonly statementDate: string;
    readonly previousStatementDate: string | null;
    readonly cashMoved: number;
    readonly estimatedDividendAmount: number;
    readonly uncoveredCashAmount: number;
    readonly funds: readonly InzhurFundChangeInterface[];
}
