import { useRef, useState } from 'react';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';

export const useConfirmAction = (onConfirm: () => Promise<void> | void) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = () => void ref.current?.open();

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await onConfirm();
            ref.current?.close();
        } finally {
            setIsLoading(false);
        }
    };

    return { ref, isLoading, handleOpen, handleConfirm };
};
