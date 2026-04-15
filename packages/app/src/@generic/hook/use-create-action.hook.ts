import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useCreateActionContext } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action-interface.type';

export const useCreateAction = (action: CreateActionInterface): void => {
    const { setCreateAction } = useCreateActionContext();

    useFocusEffect(
        useCallback(() => {
            setCreateAction(action);

            return () => void setCreateAction(null);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    );
};
