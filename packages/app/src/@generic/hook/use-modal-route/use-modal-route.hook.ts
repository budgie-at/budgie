import { use, useEffect, useEffectEvent, useState } from 'react';

import { ModalContext } from '../../context/modal.context';
import { useModalParams } from '../use-modal-params/use-modal-params.hook';

import type { ModalResult } from '../../type/modal-result.type';
import type { ModalRoute } from '../../type/modal-route.type';

export const useModalRoute = <TRoute extends ModalRoute>(route: TRoute) => {
    const modalStore = use(ModalContext);
    const [entryId] = useState(() => modalStore?.getEntryId(route) ?? null);
    const handleUnmount = useEffectEvent(() => {
        modalStore?.dismiss(route, entryId ?? void 0);
    });

    useEffect(
        () => () => {
            handleUnmount();
        },
        []
    );

    const resolve = (result: ModalResult<TRoute> | null, skipBack?: boolean) => {
        modalStore?.resolve(route, result, skipBack, entryId ?? void 0);
    };

    return { params: useModalParams(route), resolve };
};
