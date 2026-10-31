import { createContext, use } from 'react';

import { EmptyFn } from '@rnw-community/shared';

export const DeletableRowContext = createContext<EmptyFn | null>(null);

export const useDeletableRowDelete = () => use(DeletableRowContext);
