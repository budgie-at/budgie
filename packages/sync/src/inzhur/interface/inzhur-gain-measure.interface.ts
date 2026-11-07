import type { InzhurDatedMovementInterface } from './inzhur-dated-movement.interface';

export interface InzhurGainMeasureInterface {
    readonly valueOn: (day: string) => number | null;
    readonly flowOf: (item: InzhurDatedMovementInterface) => number;
}
