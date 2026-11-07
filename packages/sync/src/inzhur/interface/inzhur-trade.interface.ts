export interface InzhurTradeInterface {
    readonly isSell: boolean;
    readonly externalId: string;
    readonly cashAccountId: number;
    readonly fundAccountId: number;
    readonly cashAmount: number;
    readonly quantity: number;
}
