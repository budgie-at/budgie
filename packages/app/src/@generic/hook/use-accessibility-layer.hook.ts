import { use, useEffect, useId } from 'react';

import { HostAccessibilityContext } from '../context/host-accessibility.context';

export const useAccessibilityLayer = () => {
    const { layers, setLayers } = use(HostAccessibilityContext);
    const id = useId();

    useEffect(() => {
        setLayers(current => [...current, id]);

        return () => {
            setLayers(current => current.filter(layer => layer !== id));
        };
    }, [id, setLayers]);

    return layers.includes(id) && layers.at(-1) !== id;
};
