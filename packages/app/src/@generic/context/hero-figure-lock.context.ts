import { createContext } from 'react';

import type { HeroFigureLockInterface } from '../interface/hero-figure-lock.interface';

export const HeroFigureLockContext = createContext<HeroFigureLockInterface | null>(null);
