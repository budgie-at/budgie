import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useCreateActionContext } from '../context/create-action.context';

export const useAccountContext = (accountId: number): void => {
    const { setAccountId } = useCreateActionContext();

    useFocusEffect(
        useCallback(() => {
            setAccountId(accountId);

            return () => void setAccountId(null);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [accountId])
    );
};
