export interface IbanBridgeChainCanonicalInputInterface {
    readonly title: string;
    readonly operatedAt: number;
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly fromAmount: number;
    readonly toAmount: number;
    readonly exchangeRate: number;
    readonly fromEntryToIban: string | null;
}
