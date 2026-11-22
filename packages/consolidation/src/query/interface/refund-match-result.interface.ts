import type { RefundEdgeRowInterface } from './refund-edge-row.interface';

export interface RefundMatchResultInterface {
    readonly assignments: readonly RefundEdgeRowInterface[];
    readonly reviewEdges: readonly RefundEdgeRowInterface[];
}
