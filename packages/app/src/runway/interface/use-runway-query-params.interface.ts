import { RunwayDriverDimensionEnum } from '@budgie/contracts';

export interface UseRunwayQueryParams {
    readonly dimension: RunwayDriverDimensionEnum;
    readonly liquid: number;
}
