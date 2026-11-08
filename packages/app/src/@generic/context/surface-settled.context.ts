import { createContext, use } from 'react';

export const SurfaceSettledContext = createContext(true);

export const useSurfaceSettled = () => use(SurfaceSettledContext);
