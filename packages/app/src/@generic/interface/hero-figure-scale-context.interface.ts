import type { HeroFigureScaleInterface } from './hero-figure-scale.interface';

export interface HeroFigureScaleContextInterface {
    readonly locked: HeroFigureScaleInterface | null;
    readonly onMeasured: (measured: HeroFigureScaleInterface) => void;
}
