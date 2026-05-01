import { useState } from 'react';

import { EmptyFn } from '@rnw-community/shared';

import { useStateRef } from '../use-state-ref/use-state-ref.hook';

interface UseSearchableFilterStateReturn {
    readonly localValue: number[] | null;
    readonly setLocalValue: (updater: (prev: number[] | null) => number[] | null) => void;
    readonly localValueRef: { readonly current: number[] | null };
    readonly search: string;
    readonly setSearch: (value: string) => void;
    readonly selectedCount: number;
    readonly handleDeselectAll: EmptyFn;
    readonly handleClear: EmptyFn;
}

export const useSearchableFilterState = (initialValue: number[] | null): UseSearchableFilterStateReturn => {
    const [localValue, setLocalValue, localValueRef] = useStateRef<number[] | null>(() => initialValue);
    const [search, setSearch] = useState('');

    const selectedCount = localValue?.length ?? 0;

    const handleDeselectAll = () => void setLocalValue(null);
    const handleClear = () => void setLocalValue(null);

    return {
        localValue,
        setLocalValue,
        localValueRef,
        search,
        setSearch,
        selectedCount,
        handleDeselectAll,
        handleClear
    };
};
