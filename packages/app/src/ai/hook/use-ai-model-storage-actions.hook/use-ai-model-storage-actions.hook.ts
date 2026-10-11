import { t } from '@lingui/core/macro';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isPositiveNumber } from '@rnw-community/shared';

import { AiFeatureIdEnum } from '../../enum/ai-feature-id.enum';
import { formatModelStorageSize } from '../../utils/format-model-storage-size.util';

import type { AiFeatureStorageInterface } from '../../interface/ai-feature-storage.interface';
import type { UseAiModelStorageActionsParamsInterface } from '../../interface/use-ai-model-storage-actions-params.interface';

const showFeatureError = (error: unknown): null => {
    Toast.show({ type: 'error', text1: t`Could not update AI feature`, text2: getErrorMessage(error) });

    return null;
};

const showCleanupError = (error: unknown): null => {
    Toast.show({ type: 'error', text1: t`Could not free up space`, text2: getErrorMessage(error) });

    return null;
};

const showFeatureOffToast = (keepsSharedDownloads: boolean): void => {
    Toast.show({
        type: 'success',
        text1: t`AI feature turned off`,
        ...(keepsSharedDownloads && { text2: t`Shared downloads are still needed by other features` })
    });
};

const createFeatureOffHandler =
    (
        params: UseAiModelStorageActionsParamsInterface,
        updateFeature: (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean) => void
    ) =>
    (feature: AiFeatureStorageInterface): void => {
        void params.previewDisableFeature(feature.id).then(preview => {
            const reclaimableSize = formatModelStorageSize(preview.reclaimableBytes);

            if (!isPositiveNumber(preview.reclaimableBytes)) {
                void params.setFeatureEnabled(feature.id, false, false).then(() => {
                    showFeatureOffToast(preview.keepsSharedDownloads);

                    return null;
                }, showFeatureError);

                return null;
            }

            Alert.alert(
                params.featureContent[feature.id].title,
                t`Budgie can also free ${reclaimableSize} by removing downloads this feature no longer needs.`,
                [
                    {
                        text: t`Turn off and free ${reclaimableSize}`,
                        style: 'destructive',
                        onPress: () => {
                            updateFeature(feature.id, false, true);
                        }
                    },
                    {
                        text: t`Turn off, keep downloads`,
                        onPress: () => {
                            updateFeature(feature.id, false, false);
                        }
                    },
                    { text: t`Cancel`, style: 'cancel' }
                ]
            );

            return null;
        }, showFeatureError);
    };

const createFeatureOnHandler =
    (
        params: UseAiModelStorageActionsParamsInterface,
        updateFeature: (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean) => void
    ) =>
    (feature: AiFeatureStorageInterface): void => {
        if (!params.isAiAvailable) {
            return;
        }

        Alert.alert(
            params.featureContent[feature.id].title,
            t`Budgie will use on-device AI for this feature. Downloads may be needed again, so Wi-Fi is recommended.`,
            [
                { text: t`Cancel`, style: 'cancel' },
                {
                    text: t`Turn on`,
                    onPress: () => {
                        updateFeature(feature.id, true, false);
                    }
                }
            ]
        );
    };

export const useAiModelStorageActions = (params: UseAiModelStorageActionsParamsInterface) => {
    const updateFeature = (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean): void => {
        void params.setFeatureEnabled(featureId, isEnabled, removeUnusedDownloads).then(() => {
            Toast.show({ type: 'success', text1: isEnabled ? t`AI feature turned on` : t`AI feature turned off` });

            return null;
        }, showFeatureError);
    };
    const turnFeatureOff = createFeatureOffHandler(params, updateFeature);
    const turnFeatureOn = createFeatureOnHandler(params, updateFeature);

    const handleFeatureChange = (feature: AiFeatureStorageInterface): void => {
        if (params.isMutating) {
            return;
        }
        if (!feature.isEnabled) {
            turnFeatureOn(feature);

            return;
        }
        turnFeatureOff(feature);
    };

    const handleFreeUnusedDownloads = (): void => {
        if (params.isMutating) {
            return;
        }

        void params.freeUnusedDownloads().then(() => {
            Toast.show({ type: 'success', text1: t`Space freed` });

            return null;
        }, showCleanupError);
    };

    return { handleFeatureChange, handleFreeUnusedDownloads };
};
