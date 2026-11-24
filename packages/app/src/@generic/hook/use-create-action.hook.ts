import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useCreateActionActions } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action.interface';

export const useCreateAction = (action: CreateActionInterface): void => {
    const { setCreateAction } = useCreateActionActions();
    const { icon, label, variant, testID, onPress } = action;
    const onPressRef = useRef(onPress);

    useEffect(() => {
        onPressRef.current = onPress;
    }, [onPress]);

    useFocusEffect(
        useCallback(() => {
            setCreateAction({
                icon,
                label,
                variant,
                ...(isDefined(testID) && { testID }),
                onPress: () => void onPressRef.current()
            });

            return () => void setCreateAction(null);
        }, [icon, label, setCreateAction, testID, variant])
    );
};
