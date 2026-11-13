import type { UnknownOutputParams } from 'expo-router';

export interface YieldScreenParamsInterface extends UnknownOutputParams {
    readonly range?: string;
    readonly position?: string;
    readonly instrument?: string;
    readonly group?: string;
    readonly focus?: string;
    readonly from?: string;
    readonly periodFrom?: string;
    readonly periodTo?: string;
}
