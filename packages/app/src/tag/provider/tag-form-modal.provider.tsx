import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { TagFormResult } from '../components/tag-form/tag-form';
import { TagFormModalContext, TagFormModalParams } from '../context/tag-form-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TagFormModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<TagFormModalParams | null>(null);
    const resolverRef = useRef<((result: TagFormResult | null) => void) | null>(null);

    const openTagForm = (params?: TagFormModalParams): Promise<TagFormResult | null> =>
        new Promise(resolve => {
            setCurrentParams(params ?? {});
            resolverRef.current = resolve;
            router.push('/tag-form');
        });

    const resolveTagForm = (result: TagFormResult | null) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openTagForm, resolveTagForm, currentParams };

    return <TagFormModalContext value={value}>{children}</TagFormModalContext>;
};
