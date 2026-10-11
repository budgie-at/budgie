import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import { t } from '@lingui/core/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { appAtomRuntime, appRuntime } from '../../@generic/runtime/app.runtime';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';
import { AiModelStorageService } from '../service/ai-model-storage.service';
import { formatModelStorageSize } from '../utils/format-model-storage-size.util';

import type { AiFeatureContentInterface } from '../interface/ai-feature-content.interface';
import type { AiFeatureStorageInterface } from '../interface/ai-feature-storage.interface';
import type { AiModelStorageDisablePreviewInterface } from '../interface/ai-model-storage-disable-preview.interface';
import type { AiModelStorageSnapshotInterface } from '../interface/ai-model-storage-snapshot.interface';
import type { UseAiModelStorageReturnInterface } from '../interface/use-ai-model-storage-return.interface';

const EMPTY_AI_MODEL_STORAGE_SNAPSHOT: AiModelStorageSnapshotInterface = {
    entries: [],
    features: [],
    unusedBytes: 0,
    totalBytes: 0
};

const aiModelStorageAtom = appAtomRuntime
    .atom(Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.list()))
    .pipe(Atom.keepAlive);

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

const showEnableFeatureAlert = (featureTitle: string, onTurnOn: () => void): void => {
    Alert.alert(featureTitle, t`Budgie will use on-device AI for this feature. Downloads may be needed again, so Wi-Fi is recommended.`, [
        { text: t`Cancel`, style: 'cancel' },
        {
            text: t`Turn on`,
            onPress: onTurnOn
        }
    ]);
};

const showFreeFeatureDownloadsAlert = (
    featureTitle: string,
    reclaimableSize: string,
    onFreeDownloads: () => void,
    onKeepDownloads: () => void
): void => {
    Alert.alert(featureTitle, t`Budgie can also free ${reclaimableSize} by removing downloads this feature no longer needs.`, [
        {
            text: t`Turn off and free ${reclaimableSize}`,
            style: 'destructive',
            onPress: onFreeDownloads
        },
        {
            text: t`Turn off, keep downloads`,
            onPress: onKeepDownloads
        },
        { text: t`Cancel`, style: 'cancel' }
    ]);
};

const useAiModelStorageSnapshot = () => {
    const result = useAtomValue(aiModelStorageAtom);
    const refresh = useAtomRefresh(aiModelStorageAtom);
    const isFocused = useIsFocused();
    const chatModelStatus = useAtomValue(chatModelSnapshotAtom, snapshot => snapshot.status);
    const embeddingModelStatus = useAtomValue(embeddingModelSnapshotAtom, snapshot => snapshot.status);
    const sttStatus = useAtomValue(sttSnapshotAtom, snapshot => snapshot.status);
    const snapshot = AsyncResult.getOrElse(result, () => EMPTY_AI_MODEL_STORAGE_SNAPSHOT);
    const errorMessage = AsyncResult.isFailure(result) ? getErrorMessage(Cause.squash(result.cause)) : null;

    useEffect(() => {
        if (isFocused) {
            refresh();
        }
    }, [chatModelStatus, embeddingModelStatus, isFocused, refresh, sttStatus]);

    return {
        snapshot,
        isLoading: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
        errorMessage,
        refresh
    };
};

const setAiFeatureEnabled = (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean) =>
    appRuntime.runPromise(
        AiModelStorageService.pipe(
            Effect.flatMap(aiModelStorageService => aiModelStorageService.setFeatureEnabled(featureId, isEnabled, removeUnusedDownloads)),
            Effect.tapCause(Effect.logError)
        )
    );

const previewDisabledAiFeature = (featureId: AiFeatureIdEnum) =>
    appRuntime.runPromise(
        AiModelStorageService.pipe(
            Effect.flatMap(aiModelStorageService => aiModelStorageService.previewDisableFeature(featureId)),
            Effect.tapCause(Effect.logError)
        )
    );

const freeUnusedAiDownloads = () =>
    appRuntime.runPromise(
        AiModelStorageService.pipe(
            Effect.flatMap(aiModelStorageService => aiModelStorageService.freeUnusedDownloads()),
            Effect.tapCause(Effect.logError)
        )
    );

const useAiModelStorageCommands = (
    refresh: () => void,
    featureContent: Record<AiFeatureIdEnum, AiFeatureContentInterface>,
    isAiAvailable: boolean
) => {
    const [updatingFeatureId, setUpdatingFeatureId] = useState<AiFeatureIdEnum | null>(null);
    const [isFreeingUnused, setIsFreeingUnused] = useState(false);
    const isMutating = isFreeingUnused || isDefined(updatingFeatureId);

    const setFeatureEnabled = (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean) => {
        setUpdatingFeatureId(featureId);

        return setAiFeatureEnabled(featureId, isEnabled, removeUnusedDownloads).finally(() => {
            refresh();
            setUpdatingFeatureId(null);
        });
    };

    const updateFeature = (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean): void => {
        void setFeatureEnabled(featureId, isEnabled, removeUnusedDownloads).then(() => {
            Toast.show({ type: 'success', text1: isEnabled ? t`AI feature turned on` : t`AI feature turned off` });

            return null;
        }, showFeatureError);
    };

    const finishFeatureDisablePreview = (feature: AiFeatureStorageInterface, preview: AiModelStorageDisablePreviewInterface): null => {
        const reclaimableSize = formatModelStorageSize(preview.reclaimableBytes);

        if (!isPositiveNumber(preview.reclaimableBytes)) {
            void setFeatureEnabled(feature.id, false, false).then(() => {
                showFeatureOffToast(preview.keepsSharedDownloads);

                return null;
            }, showFeatureError);

            return null;
        }
        showFreeFeatureDownloadsAlert(
            featureContent[feature.id].title,
            reclaimableSize,
            () => {
                updateFeature(feature.id, false, true);
            },
            () => {
                updateFeature(feature.id, false, false);
            }
        );

        return null;
    };

    const handleFeatureChange = (feature: AiFeatureStorageInterface): void => {
        if (isMutating) {
            return;
        }
        if (!feature.isEnabled) {
            if (isAiAvailable) {
                showEnableFeatureAlert(featureContent[feature.id].title, () => {
                    updateFeature(feature.id, true, false);
                });
            }

            return;
        }
        setUpdatingFeatureId(feature.id);
        void previewDisabledAiFeature(feature.id)
            .finally(() => {
                setUpdatingFeatureId(null);
            })
            .then(preview => finishFeatureDisablePreview(feature, preview), showFeatureError);
    };

    const handleFreeUnusedDownloads = (): void => {
        if (isMutating) {
            return;
        }

        setIsFreeingUnused(true);
        void freeUnusedAiDownloads()
            .finally(() => {
                refresh();
                setIsFreeingUnused(false);
            })
            .then(() => {
                Toast.show({ type: 'success', text1: t`Space freed` });

                return null;
            }, showCleanupError);
    };

    return {
        updatingFeatureId,
        isFreeingUnused,
        isMutating,
        handleFeatureChange,
        handleFreeUnusedDownloads
    };
};

export const useAiModelStorage = (
    featureContent: Record<AiFeatureIdEnum, AiFeatureContentInterface>,
    isAiAvailable: boolean
): UseAiModelStorageReturnInterface => {
    const storage = useAiModelStorageSnapshot();
    const commands = useAiModelStorageCommands(storage.refresh, featureContent, isAiAvailable);

    return {
        snapshot: storage.snapshot,
        isLoading: storage.isLoading,
        errorMessage: storage.errorMessage,
        updatingFeatureId: commands.updatingFeatureId,
        isFreeingUnused: commands.isFreeingUnused,
        isMutating: commands.isMutating,
        handleFeatureChange: commands.handleFeatureChange,
        handleFreeUnusedDownloads: commands.handleFreeUnusedDownloads
    };
};
