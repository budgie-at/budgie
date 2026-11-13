export interface SeedValuedIncomeInputInterface {
    readonly accountId: number;
    readonly amount: number;
    readonly operatedAt: Date;
    readonly title: string;
    readonly baseInstrumentId: number | null;
    readonly baseExchangeRate: number | null;
    readonly baseAmount: number | null;
}
