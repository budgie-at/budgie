import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { CloudRestoreContextInterface } from '../interface/cloud-restore-context.interface';

export const CloudRestoreContext = createContext<CloudRestoreContextInterface>({ restore: emptyFn, isLoading: false });

export const useCloudRestoreContext = () => use(CloudRestoreContext);
