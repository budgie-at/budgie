import { Href, router } from 'expo-router';
import { useRef, useState } from 'react';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';

export const useTransactionFilter = (createPath: Href) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');

    const handleOpen = () => void ref.current?.open();

    const handleNavigateToCreate = () => {
        ref.current?.close();
        void router.push(createPath);
    };

    return { ref, search, setSearch, handleOpen, handleNavigateToCreate };
};
