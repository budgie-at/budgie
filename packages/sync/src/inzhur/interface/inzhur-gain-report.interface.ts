import type { InzhurRangedGainInterface } from './inzhur-ranged-gain.interface';
import type { InzhurValuePointInterface } from './inzhur-value-point.interface';

export interface InzhurGainReportInterface {
    readonly series: readonly InzhurValuePointInterface[];
    readonly prices: readonly InzhurValuePointInterface[];
    readonly gains: readonly InzhurRangedGainInterface[];
}
