import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { isAiEnabled as isAiBuildEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { AiFeatureIdEnum } from '../../enum/ai-feature-id.enum';
import { useAiModelStorageActions } from '../../hook/use-ai-model-storage-actions.hook/use-ai-model-storage-actions.hook';
import { useAiModelStorage } from '../../hook/use-ai-model-storage.hook';
import { AiFeatureToggleRow } from '../ai-feature-toggle-row/ai-feature-toggle-row';
import { AiModelStorageStatus } from '../ai-model-storage-status/ai-model-storage-status';
import { AiUnusedDownloadsCleanup } from '../ai-unused-downloads-cleanup/ai-unused-downloads-cleanup';

import { AiModelStorageCardSelector } from './ai-model-storage-card.selector';

import type { AiFeatureContentInterface } from '../../interface/ai-feature-content.interface';

export const AiModelStorageCard = () => {
    const { t } = useLingui();
    const isAiAvailable = isAiBuildEnabled();
    const {
        snapshot,
        isLoading,
        updatingFeatureId,
        isFreeingUnused,
        errorMessage,
        setFeatureEnabled,
        previewDisableFeature,
        freeUnusedDownloads
    } = useAiModelStorage();
    const featureContent: Record<AiFeatureIdEnum, AiFeatureContentInterface> = {
        [AiFeatureIdEnum.VOICE_INPUT]: {
            title: t`Add transactions by voice`,
            description: t`Speak an expense and Budgie fills in the transaction.`,
            icon: UserIconNameEnum.Mic
        },
        [AiFeatureIdEnum.TRANSACTION_SUGGESTIONS]: {
            title: t`Suggest transaction details`,
            description: t`Get category, tag, and note suggestions from your history.`,
            icon: UserIconNameEnum.Sparkles
        },
        [AiFeatureIdEnum.CATEGORY_TAG_TRANSLATIONS]: {
            title: t`Translate categories and tags`,
            description: t`Generate English names and search keywords automatically.`,
            icon: UserIconNameEnum.Languages
        }
    };
    const isMutating = isFreeingUnused || isDefined(updatingFeatureId);
    const { handleFeatureChange, handleFreeUnusedDownloads } = useAiModelStorageActions({
        featureContent,
        isAiAvailable,
        isMutating,
        setFeatureEnabled,
        previewDisableFeature,
        freeUnusedDownloads
    });
    const hasStorageError = isDefined(errorMessage);

    return (
        <View className="gap-y-3xl" testID={AiModelStorageCardSelector.Container}>
            <AiModelStorageStatus
                totalBytes={snapshot.totalBytes}
                isLoading={isLoading}
                isAiAvailable={isAiAvailable}
                errorMessage={errorMessage}
            />

            {snapshot.features.map(feature => {
                const content = featureContent[feature.id];
                const displayedFeature = isAiAvailable ? feature : { ...feature, isEnabled: false };
                const isRowUpdating = updatingFeatureId === feature.id;
                const isRowDisabled = !isAiAvailable || isMutating;

                return (
                    <AiFeatureToggleRow
                        key={feature.id}
                        feature={displayedFeature}
                        title={content.title}
                        description={content.description}
                        icon={content.icon}
                        isUpdating={isRowUpdating}
                        disabled={isRowDisabled}
                        onValueChange={handleFeatureChange}
                    />
                );
            })}

            <AiUnusedDownloadsCleanup
                unusedBytes={snapshot.unusedBytes}
                isLoading={isLoading}
                isMutating={isMutating}
                isFreeingUnused={isFreeingUnused}
                hasError={hasStorageError}
                onPress={handleFreeUnusedDownloads}
            />
        </View>
    );
};
