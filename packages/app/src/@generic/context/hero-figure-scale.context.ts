import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { HeroFigureScaleContextInterface } from '../interface/hero-figure-scale-context.interface';

export const HeroFigureScaleContext = createContext<HeroFigureScaleContextInterface>({ locked: null, onMeasured: emptyFn });
