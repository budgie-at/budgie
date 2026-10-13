import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { isPositiveNumber } from '@rnw-community/shared';

import { useEffectAction } from '../../@generic/hook/use-effect-action.hook';
import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';
import { AiModelStorageService } from '../service/ai-model-storage.service';
import { formatModelStorageSize } from '../utils/format-model-storage-size.util';

import type { AiFeatureStorageInterface } from '../interface/ai-feature-storage.interface';

export const useAiModelStorageActions = (isAiAvailable: boolean) => {
    const { t } = useLingui();
    const [runFeatureAction, isUpdatingFeature] = useEffectAction(t`Could not update AI feature`);
    const [runFreeUnusedAction, isFreeingUnused] = useEffectAction(t`Could not free up space`);
    const [pendingFeatureId, setPendingFeatureId] = useState<AiFeatureIdEnum | null>(null);
    const isMutating = isUpdatingFeature || isFreeingUnused;

    const showFeatureUpdatedToast = (isEnabled: boolean, keepsSharedDownloads: boolean): void => {
        Toast.show({
            type: 'success',
            text1: isEnabled ? t`AI feature turned on` : t`AI feature turned off`,
            ...(!isEnabled && keepsSharedDownloads && { text2: t`Shared downloads are still needed by other features` })
        });
    };

    const setFeatureEnabled = (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean) =>
        Effect.flatMap(AiModelStorageService, aiModelStorageService =>
            aiModelStorageService.setFeatureEnabled(featureId, isEnabled, removeUnusedDownloads)
        );

    const updateFeature = (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean): void => {
        setPendingFeatureId(featureId);
        runFeatureAction(setFeatureEnabled(featureId, isEnabled, removeUnusedDownloads), () => {
            showFeatureUpdatedToast(isEnabled, false);
        });
    };

    const handleFeatureChange = (feature: AiFeatureStorageInterface, title: string): void => {
        if (isMutating) {
            return;
        }
        if (!feature.isEnabled) {
            if (isAiAvailable) {
                Alert.alert(
                    title,
                    t`Budgie will use on-device AI for this feature. Downloads may be needed again, so Wi-Fi is recommended.`,
                    [
                        { text: t`Cancel`, style: 'cancel' },
                        { text: t`Turn on`, onPress: () => void updateFeature(feature.id, true, false) }
                    ]
                );
            }

            return;
        }

        setPendingFeatureId(feature.id);
        runFeatureAction(
            Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.previewDisableFeature(feature.id)).pipe(
                Effect.tap(preview =>
                    isPositiveNumber(preview.reclaimableBytes) ? Effect.void : setFeatureEnabled(feature.id, false, false)
                )
            ),
            preview => {
                if (!isPositiveNumber(preview.reclaimableBytes)) {
                    showFeatureUpdatedToast(false, preview.keepsSharedDownloads);

                    return;
                }
                const reclaimableSize = formatModelStorageSize(preview.reclaimableBytes);

                Alert.alert(title, t`Budgie can also free ${reclaimableSize} by removing downloads this feature no longer needs.`, [
                    {
                        text: t`Turn off and free ${reclaimableSize}`,
                        style: 'destructive',
                        onPress: () => void updateFeature(feature.id, false, true)
                    },
                    { text: t`Turn off, keep downloads`, onPress: () => void updateFeature(feature.id, false, false) },
                    { text: t`Cancel`, style: 'cancel' }
                ]);
            }
        );
    };

    const handleFreeUnusedDownloads = (): void => {
        if (isMutating) {
            return;
        }

        runFreeUnusedAction(
            Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.freeUnusedDownloads()),
            () => void Toast.show({ type: 'success', text1: t`Space freed` })
        );
    };

    return {
        updatingFeatureId: isUpdatingFeature ? pendingFeatureId : null,
        isFreeingUnused,
        isMutating,
        handleFeatureChange,
        handleFreeUnusedDownloads
    };
};
