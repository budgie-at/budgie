import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '../../@generic/hook/use-reduced-motion.hook';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../enum/yield-list-section.enum';

import type { YieldListItemType } from '../type/yield-list-item.type';
import type { LegendListRef } from '@legendapp/list/react-native';

export const useYieldPayoutsScroll = (items: readonly YieldListItemType[]) => {
    const [request, setRequest] = useState(0);
    const listRef = useRef<LegendListRef>(null);
    const handledRequestRef = useRef(0);
    const reducedMotion = useReducedMotion();

    const payoutsIndex = items.findIndex(
        item => item.kind === YieldListItemKindEnum.SECTION && item.section === YieldListSectionEnum.PAYOUTS
    );

    useEffect(() => {
        if (handledRequestRef.current === request) {
            return;
        }

        handledRequestRef.current = request;

        if (payoutsIndex >= 0) {
            void listRef.current?.scrollToIndex({ index: payoutsIndex, animated: !reducedMotion });
        }
    }, [request, payoutsIndex, reducedMotion]);

    const requestPayoutsScroll = () => {
        setRequest(current => current + 1);
    };

    return { listRef, requestPayoutsScroll };
};
