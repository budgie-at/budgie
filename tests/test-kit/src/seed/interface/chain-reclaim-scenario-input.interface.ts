export interface ChainReclaimScenarioInputInterface {
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly bridgeExchangeRate: number;
    readonly operatedAt: Date;
    readonly transferExchangeRate?: number;
    readonly transferFromEntryExchangeRate?: number;
    readonly transferToEntryExchangeRate?: number;
    readonly transferFromEntryToIban?: string;
    readonly bridgeInstrumentId?: number;
    readonly bridgeIncomeAmount?: number;
    readonly bridgeExpenseAmount?: number;
    readonly bridgeIncomeToIban?: string;
    readonly bridgeExpenseToIban?: string;
    readonly bridgeOperatedAtOffsetMs?: number;
}
