import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { isAiEnabled as isAiBuildEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { useAiModelStorage } from '../../hook/use-ai-model-storage.hook';
import { AiFeatureToggleRow } from '../ai-feature-toggle-row/ai-feature-toggle-row';
import { AiModelStorageStatus } from '../ai-model-storage-status/ai-model-storage-status';
import { AiUnusedDownloadsCleanup } from '../ai-unused-downloads-cleanup/ai-unused-downloads-cleanup';

import { AiModelStorageCardSelector } from './ai-model-storage-card.selector';

export const AiModelStorageCard = () => {
    const isAiAvailable = isAiBuildEnabled();
    const {
        snapshot,
        isLoading,
        updatingFeatureId,
        isFreeingUnused,
        isMutating,
        errorMessage,
        handleFeatureChange,
        handleFreeUnusedDownloads
    } = useAiModelStorage(isAiAvailable);
    const hasStorageError = isDefined(errorMessage);

    return (
        <View className="gap-y-3xl" testID={AiModelStorageCardSelector.Container}>
            <AiModelStorageStatus
                totalBytes={snapshot.totalBytes}
                isLoading={isLoading}
                isAiAvailable={isAiAvailable}
                errorMessage={errorMessage}
            />

            {snapshot.features.map(feature => (
                <AiFeatureToggleRow
                    key={feature.id}
                    feature={feature}
                    isAiAvailable={isAiAvailable}
                    updatingFeatureId={updatingFeatureId}
                    isMutating={isMutating}
                    onValueChange={handleFeatureChange}
                />
            ))}

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
