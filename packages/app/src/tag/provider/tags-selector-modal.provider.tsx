import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { TagsSelectorModalContext, TagsSelectorModalParams } from '../context/tags-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TagsSelectorModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<TagsSelectorModalParams | null>(null);
    const resolverRef = useRef<((tagIds: number[] | null) => void) | null>(null);

    const openTagsSelector = (params?: TagsSelectorModalParams): Promise<number[] | null> =>
        new Promise(resolve => {
            setCurrentParams(params ?? {});
            resolverRef.current = resolve;
            router.push('/tags-selector');
        });

    const resolveTagsSelector = (tagIds: number[] | null) => {
        resolverRef.current?.(tagIds);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openTagsSelector, resolveTagsSelector, currentParams };

    return <TagsSelectorModalContext value={value}>{children}</TagsSelectorModalContext>;
};
