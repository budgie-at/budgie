import type { InzhurGainRangeEnum } from '../enum/inzhur-gain-range.enum';
import type { InzhurGainInterface } from './inzhur-gain.interface';

export interface InzhurRangedGainInterface extends InzhurGainInterface {
    readonly range: InzhurGainRangeEnum;
}
