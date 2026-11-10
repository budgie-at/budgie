import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { ModalContext } from '../../context/modal.context';

import type { ModalParams } from '../../type/modal-params.type';
import type { ModalResult } from '../../type/modal-result.type';
import type { ModalRoute } from '../../type/modal-route.type';

export const useOpenModal = <TRoute extends ModalRoute>(route: TRoute) => {
    const modalStore = use(ModalContext);

    return (params?: ModalParams<TRoute>, onResult?: (result: ModalResult<TRoute> | null) => void) => {
        if (!isDefined(modalStore)) {
            onResult?.(null);

            return;
        }

        modalStore.open(route, params, onResult);
    };
};
