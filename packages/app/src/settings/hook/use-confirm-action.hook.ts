import { useCallback, useRef, useState } from 'react';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';

export const useConfirmAction = (action: () => Promise<void>) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = useCallback(() => {
        ref.current?.open();
    }, []);

    const handleConfirm = useCallback(async () => {
        setIsLoading(true);
        try {
            await action();
        } finally {
            setIsLoading(false);
            ref.current?.close();
        }
    }, [action]);

    return { ref, isLoading, handleOpen, handleConfirm };
};
