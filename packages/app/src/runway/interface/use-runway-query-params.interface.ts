import { RunwayDriverDimensionEnum, TransactionFilterInterface } from '@budgie/contracts';

export interface UseRunwayQueryParams {
    readonly filters: TransactionFilterInterface;
    readonly dimension: RunwayDriverDimensionEnum;
    readonly liquid: number;
}
