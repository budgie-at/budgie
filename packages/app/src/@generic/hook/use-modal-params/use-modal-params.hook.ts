import { use, useSyncExternalStore } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { ModalContext } from '../../context/modal.context';

import type { ModalParams } from '../../type/modal-params.type';
import type { ModalRoute } from '../../type/modal-route.type';

export const useModalParams = <TRoute extends ModalRoute>(route: TRoute): ModalParams<TRoute> | null => {
    const modalStore = use(ModalContext);

    return useSyncExternalStore(
        listener => modalStore?.subscribe(route, listener) ?? emptyFn,
        () => modalStore?.getParams(route) ?? null
    );
};
