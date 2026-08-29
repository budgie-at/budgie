import type { P2pFiatDirectionEnum } from '../enum/p2p-fiat-direction.enum';

export interface P2pFiatTransferCandidateInterface {
    readonly sourceTransactionIds: readonly number[];
    readonly bankTransactionIds: readonly number[];
    readonly p2pTransactionId: number;
    readonly direction: P2pFiatDirectionEnum;
    readonly assetCode: string;
    readonly operatedAt: number;
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly fromAmount: number;
    readonly toAmount: number;
    readonly fromEntryExchangeRate: number;
    readonly toEntryExchangeRate: number;
    readonly fromEntryToIban: string | null;
    readonly rateDifference: number;
    readonly maximumTimeDifference: number;
}
