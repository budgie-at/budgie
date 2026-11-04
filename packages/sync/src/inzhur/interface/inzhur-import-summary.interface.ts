import type { InzhurImportOutcomeEnum } from '../enum/inzhur-import-outcome.enum';
import type { InzhurFundChangeInterface } from './inzhur-fund-change.interface';

export interface InzhurImportSummaryInterface {
    readonly outcome: InzhurImportOutcomeEnum;
    readonly statementDate: string;
    readonly cashMoved: number;
    readonly estimatedDividendAmount: number;
    readonly funds: readonly InzhurFundChangeInterface[];
}
