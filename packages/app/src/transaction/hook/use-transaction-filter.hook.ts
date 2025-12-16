import { Href, router } from 'expo-router';
import { useRef, useState } from 'react';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';

export const useTransactionFilter = (createPath: Href, value: number[] | null) => {
    const ref = useRef<BottomSheetInterface<number[] | null> | null>(null);
    const [search, setSearch] = useState('');

    const handleOpen = () => void ref.current?.open(value);

    const handleNavigateToCreate = () => {
        ref.current?.close();
        void router.push(createPath);
    };

    return { ref, search, setSearch, handleOpen, handleNavigateToCreate };
};
