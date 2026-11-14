import type { YieldBucketUnitEnum } from '../enum/yield-bucket-unit.enum';
import type { YieldBucketSpanInterface } from './yield-bucket-span.interface';

export interface YieldWindowInterface {
    readonly unit: YieldBucketUnitEnum;
    readonly spans: readonly YieldBucketSpanInterface[];
    readonly origin: Date;
    readonly startDay: string;
}
