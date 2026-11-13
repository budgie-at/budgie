import type { YieldBarLayerInterface } from './yield-bar-layer.interface';

export interface YieldBarLayersInterface {
    readonly solid: readonly YieldBarLayerInterface[];
    readonly estimated: readonly YieldBarLayerInterface[];
}
