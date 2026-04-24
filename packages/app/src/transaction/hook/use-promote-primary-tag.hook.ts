import { transactionAsync } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { db, transactionTagsRepository } from '../../@generic/drizzle/db/db';

export const usePromotePrimaryTag = (transactionId: number) => {
    const { t } = useLingui();
    const inFlightRef = useRef(false);

    const promote = async (tagId: number): Promise<void> => {
        if (inFlightRef.current) {
            return;
        }

        inFlightRef.current = true;
        try {
            await Haptics.selectionAsync();
            await transactionAsync(db, async tx => {
                await transactionTagsRepository.setPrimary(transactionId, tagId, tx);
            });
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Toast.show({
                type: 'error',
                text1: t`Couldn't update primary tag`,
                text2: getErrorMessage(error)
            });
        } finally {
            // eslint-disable-next-line require-atomic-updates
            inFlightRef.current = false;
        }
    };

    return { promote };
};
