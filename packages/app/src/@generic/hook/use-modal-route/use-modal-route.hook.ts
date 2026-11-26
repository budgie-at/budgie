import { use, useEffect, useEffectEvent, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { ModalContext } from '../../context/modal.context';
import { useModalParams } from '../use-modal-params/use-modal-params.hook';

import type { ModalResult } from '../../type/modal-result.type';
import type { ModalRoute } from '../../type/modal-route.type';

const UNTRACKED_RESOLVED_ID = -1;

export const useModalRoute = <TRoute extends ModalRoute>(route: TRoute) => {
    const modalStore = use(ModalContext);
    const [entryId] = useState(() => modalStore?.getEntryId(route) ?? null);
    const resolvedEntryIdRef = useRef<number | null>(null);
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
        const activeEntryId = modalStore?.getEntryId(route) ?? null;

        if (!isDefined(activeEntryId)) {
            if (isDefined(resolvedEntryIdRef.current) || isDefined(entryId)) {
                return;
            }

            resolvedEntryIdRef.current = UNTRACKED_RESOLVED_ID;
            modalStore?.resolve(route, result, skipBack);

            return;
        }

        if (resolvedEntryIdRef.current === activeEntryId) {
            return;
        }

        resolvedEntryIdRef.current = activeEntryId;
        modalStore?.resolve(route, result, skipBack, activeEntryId);
    };

    return { params: useModalParams(route), resolve };
};
