import { Href } from 'expo-router';
import { useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';


export const useConfirmAction = (onConfirm: () => Promise<void> | void, redirectUrl?: Href) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = () => void ref.current?.open();

    const handleConfirm = async () => {
        try {
            setIsLoading(true);

            await onConfirm();
        } finally {
            InteractionManager.runAfterInteractions(() => {
                ref.current?.close();

                setIsLoading(false);

                if (isNotEmptyString(redirectUrl)) {
                    dismissAllOrReplace(redirectUrl);
                }
            });
        }
    };

    return { ref, isLoading, handleOpen, handleConfirm };
};
