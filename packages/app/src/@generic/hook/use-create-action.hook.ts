import { useFocusEffect } from 'expo-router';

import { useCreateActionContext } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action.interface';

export const useCreateAction = (action: CreateActionInterface): void => {
    const { setCreateAction } = useCreateActionContext();

    useFocusEffect(() => {
        setCreateAction(action);

        return () => void setCreateAction(null);
    });
};
