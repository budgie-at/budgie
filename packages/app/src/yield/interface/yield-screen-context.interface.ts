import type { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';
import type { YieldScreenKeyInterface } from './yield-screen-key.interface';

export interface YieldScreenContextInterface {
    readonly screenKey: YieldScreenKeyInterface;
    readonly mode: YieldChartModeEnum;
    readonly isPeriodCaption: boolean;
    readonly setMode: (mode: YieldChartModeEnum) => void;
}
