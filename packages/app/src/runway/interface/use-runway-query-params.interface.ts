import { RunwayDriverDimensionEnum, RunwayWindowEnum, TransactionFilterInterface } from '@budgie/contracts';

export interface UseRunwayQueryParams {
    readonly filters: TransactionFilterInterface;
    readonly window: RunwayWindowEnum;
    readonly dimension: RunwayDriverDimensionEnum;
    readonly liquid: number;
}
