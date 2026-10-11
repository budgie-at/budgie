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

const showEnableFeatureAlert = (title: string, onTurnOn: () => void): void => {
    Alert.alert(title, t`Budgie will use on-device AI for this feature. Downloads may be needed again, so Wi-Fi is recommended.`, [
        { text: t`Cancel`, style: 'cancel' },
        { text: t`Turn on`, onPress: onTurnOn }
    ]);
};

const showFreeFeatureDownloadsAlert = (
    title: string,
    reclaimableSize: string,
    onFreeDownloads: () => void,
    onKeepDownloads: () => void
): void => {
    Alert.alert(title, t`Budgie can also free ${reclaimableSize} by removing downloads this feature no longer needs.`, [
        { text: t`Turn off and free ${reclaimableSize}`, style: 'destructive', onPress: onFreeDownloads },
        { text: t`Turn off, keep downloads`, onPress: onKeepDownloads },
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

    useEffect(() => {
        if (isFocused) {
            refresh();
        }
    }, [chatModelStatus, embeddingModelStatus, isFocused, refresh, sttStatus]);

    return {
        snapshot: AsyncResult.getOrElse(result, () => EMPTY_AI_MODEL_STORAGE_SNAPSHOT),
        isLoading: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
        errorMessage: AsyncResult.isFailure(result) ? getErrorMessage(Cause.squash(result.cause)) : null,
        refresh
    };
};

const useAiFeatureChanges = (refresh: () => void, isAiAvailable: boolean, isFreeingUnused: boolean) => {
    const [updatingFeatureId, setUpdatingFeatureId] = useState<AiFeatureIdEnum | null>(null);
    const isMutating = isFreeingUnused || isDefined(updatingFeatureId);

    const updateFeature = (
        featureId: AiFeatureIdEnum,
        isEnabled: boolean,
        removeUnusedDownloads: boolean,
        keepsSharedDownloads = false
    ): void => {
        setUpdatingFeatureId(featureId);
        void appRuntime
            .runPromise(
                AiModelStorageService.pipe(
                    Effect.flatMap(aiModelStorageService =>
                        aiModelStorageService.setFeatureEnabled(featureId, isEnabled, removeUnusedDownloads)
                    ),
                    Effect.tapCause(Effect.logError)
                )
            )
            .finally(() => {
                refresh();
                setUpdatingFeatureId(null);
            })
            .then(() => {
                Toast.show({
                    type: 'success',
                    text1: isEnabled ? t`AI feature turned on` : t`AI feature turned off`,
                    ...(!isEnabled && keepsSharedDownloads && { text2: t`Shared downloads are still needed by other features` })
                });

                return null;
            }, showFeatureError);
    };

    const handleDisablePreview = (
        feature: AiFeatureStorageInterface,
        title: string,
        preview: AiModelStorageDisablePreviewInterface
    ): void => {
        setUpdatingFeatureId(null);
        if (!isPositiveNumber(preview.reclaimableBytes)) {
            updateFeature(feature.id, false, false, preview.keepsSharedDownloads);

            return;
        }

        showFreeFeatureDownloadsAlert(
            title,
            formatModelStorageSize(preview.reclaimableBytes),
            () => void updateFeature(feature.id, false, true),
            () => void updateFeature(feature.id, false, false)
        );
    };

    const handleFeatureChange = (feature: AiFeatureStorageInterface, title: string): void => {
        if (isMutating) {
            return;
        }
        if (!feature.isEnabled) {
            if (isAiAvailable) {
                showEnableFeatureAlert(title, () => {
                    updateFeature(feature.id, true, false);
                });
            }

            return;
        }

        setUpdatingFeatureId(feature.id);
        void appRuntime
            .runPromise(
                AiModelStorageService.pipe(
                    Effect.flatMap(aiModelStorageService => aiModelStorageService.previewDisableFeature(feature.id)),
                    Effect.tapCause(Effect.logError)
                )
            )
            .then(
                preview => {
                    handleDisablePreview(feature, title, preview);

                    return null;
                },
                (error: unknown) => {
                    setUpdatingFeatureId(null);

                    return showFeatureError(error);
                }
            );
    };

    return { updatingFeatureId, isMutating, handleFeatureChange };
};

export const useAiModelStorage = (isAiAvailable: boolean): UseAiModelStorageReturnInterface => {
    const storage = useAiModelStorageSnapshot();
    const [isFreeingUnused, setIsFreeingUnused] = useState(false);
    const featureChanges = useAiFeatureChanges(storage.refresh, isAiAvailable, isFreeingUnused);

    const handleFreeUnusedDownloads = (): void => {
        if (featureChanges.isMutating) {
            return;
        }

        setIsFreeingUnused(true);
        void appRuntime
            .runPromise(
                AiModelStorageService.pipe(
                    Effect.flatMap(aiModelStorageService => aiModelStorageService.freeUnusedDownloads()),
                    Effect.tapCause(Effect.logError)
                )
            )
            .finally(() => {
                storage.refresh();
                setIsFreeingUnused(false);
            })
            .then(
                () => {
                    Toast.show({ type: 'success', text1: t`Space freed` });

                    return null;
                },
                (error: unknown) => {
                    Toast.show({ type: 'error', text1: t`Could not free up space`, text2: getErrorMessage(error) });

                    return null;
                }
            );
    };

    return {
        snapshot: storage.snapshot,
        isLoading: storage.isLoading,
        errorMessage: storage.errorMessage,
        updatingFeatureId: featureChanges.updatingFeatureId,
        isFreeingUnused,
        isMutating: featureChanges.isMutating,
        handleFeatureChange: featureChanges.handleFeatureChange,
        handleFreeUnusedDownloads
    };
};
