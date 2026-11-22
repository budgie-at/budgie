import type { RefundMatchLedger } from '../matcher/refund-match-ledger';
import type { RefundEdgeRowInterface } from './refund-edge-row.interface';
import type { RefundMatchWindowInterface } from './refund-match-window.interface';

export interface RefundMatchContextInterface {
    readonly refundEdgeLists: readonly (readonly RefundEdgeRowInterface[])[];
    readonly autoRefundEdgeLists: readonly (readonly RefundEdgeRowInterface[])[];
    readonly refundEdgeListById: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>;
    readonly expenseEdgeLists: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>;
    readonly expenseRanks: ReadonlyMap<RefundEdgeRowInterface, number>;
    readonly ledger: RefundMatchLedger;
    readonly window: RefundMatchWindowInterface | null;
}
