import { createContext, use } from 'react';

import { EmptyFn, emptyFn } from '@rnw-community/shared';

export const ActionsMenuContext = createContext<(afterClose?: EmptyFn) => void>(emptyFn);

export const useActionsMenuClose = () => use(ActionsMenuContext);
