import { useCanGoBack } from 'expo-router';
import { use, useEffect, useId } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { HostAccessibilityContext } from '../context/host-accessibility.context';

export const useAccessibilityLayer = () => {
    const { layers, setLayers } = use(HostAccessibilityContext);
    const id = useId();
    const hasScreenBeneath = useCanGoBack();

    useEffect(() => {
        if (!hasScreenBeneath) {
            return emptyFn;
        }

        setLayers(current => [...current, id]);

        return () => {
            setLayers(current => current.filter(layer => layer !== id));
        };
    }, [hasScreenBeneath, id, setLayers]);

    return layers.includes(id) && layers.at(-1) !== id;
};
