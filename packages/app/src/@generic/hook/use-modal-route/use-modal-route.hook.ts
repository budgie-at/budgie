import { use, useEffect, useEffectEvent } from 'react';

import { ModalContext } from '../../context/modal.context';
import { useModalParams } from '../use-modal-params/use-modal-params.hook';

import type { ModalResult } from '../../type/modal-result.type';
import type { ModalRoute } from '../../type/modal-route.type';

export const useModalRoute = <TRoute extends ModalRoute>(route: TRoute) => {
    const modalStore = use(ModalContext);
    const handleUnmount = useEffectEvent(() => {
        modalStore?.dismiss(route);
    });

    useEffect(
        () => () => {
            handleUnmount();
        },
        []
    );

    const resolve = (result: ModalResult<TRoute> | null, skipBack?: boolean) => {
        modalStore?.resolve(route, result, skipBack);
    };

    return { params: useModalParams(route), resolve };
};
