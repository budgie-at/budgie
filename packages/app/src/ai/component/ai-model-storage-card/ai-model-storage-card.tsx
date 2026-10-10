import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { useAiModelStorage } from '../../hook/use-ai-model-storage.hook';
import { formatModelStorageSize } from '../../utils/format-model-storage-size.util';
import { AiModelStorageCardHeader } from '../ai-model-storage-card-header/ai-model-storage-card-header';
import { AiModelStorageEntryList } from '../ai-model-storage-entry-list/ai-model-storage-entry-list';
import { AiModelStorageRemoveAllButton } from '../ai-model-storage-remove-all-button/ai-model-storage-remove-all-button';

import { AiModelStorageCardSelector } from './ai-model-storage-card.selector';

import type { AiModelStorageIdEnum } from '../../enum/ai-model-storage-id.enum';

export const AiModelStorageCard = () => {
    const { t } = useLingui();
    const { snapshot, isLoading, removingId, isRemovingAll, errorMessage, remove, removeAll } = useAiModelStorage();
    const hasDownloads = isPositiveNumber(snapshot.entries.length);
    const totalSize = formatModelStorageSize(snapshot.totalBytes);
    const description = hasDownloads ? t`${totalSize} stored on this device` : t`No downloaded AI models found on this device`;
    const hasCurrentDownloads = snapshot.entries.some(entry => entry.isCurrent);
    const showRemoveAll = hasDownloads && snapshot.entries.length > 1;
    const removeAllMessage = hasCurrentDownloads
        ? t`Budgie will turn AI off and remove downloaded AI models from this device. Turning AI on again will download them again.`
        : t`Budgie will remove obsolete downloaded AI model files from this device.`;

    const removeModel = (id: AiModelStorageIdEnum): void => {
        void remove(id).then(
            () => {
                Toast.show({ type: 'success', text1: t`AI model removed` });

                return null;
            },
            (error: unknown) => {
                Toast.show({ type: 'error', text1: t`Could not remove AI model`, text2: getErrorMessage(error) });

                return null;
            }
        );
    };

    const removeAllModels = (): void => {
        void removeAll().then(
            () => {
                Toast.show({ type: 'success', text1: t`AI models removed` });

                return null;
            },
            (error: unknown) => {
                Toast.show({ type: 'error', text1: t`Could not remove AI models`, text2: getErrorMessage(error) });

                return null;
            }
        );
    };

    const handleRemove = (id: AiModelStorageIdEnum) =>
        void confirmAlert({
            title: t`Remove downloaded model?`,
            message: t`If this model is currently used by AI, Budgie will turn AI off. Turning AI on again will download the model again.`,
            confirmText: t`Remove`,
            cancelText: t`Cancel`,
            isDestructive: true
        }).then(confirmed => {
            if (confirmed) {
                removeModel(id);
            }

            return null;
        });

    const handleRemoveAll = () =>
        void confirmAlert({
            title: t`Remove all downloaded AI models?`,
            message: removeAllMessage,
            confirmText: t`Remove All`,
            cancelText: t`Cancel`,
            isDestructive: true
        }).then(confirmed => {
            if (confirmed) {
                removeAllModels();
            }

            return null;
        });

    return (
        <Card className="gap-y-3xl" variant="ghost" testID={AiModelStorageCardSelector.Container}>
            <AiModelStorageCardHeader isLoading={isLoading} description={description} />

            {isPositiveNumber(errorMessage?.length ?? 0) ? (
                <Text className="text-destructive-foreground text-sm">{errorMessage}</Text>
            ) : null}

            {hasDownloads ? (
                <AiModelStorageEntryList
                    entries={snapshot.entries}
                    removingId={removingId}
                    isRemovingAll={isRemovingAll}
                    onRemove={handleRemove}
                />
            ) : null}

            {showRemoveAll ? (
                <AiModelStorageRemoveAllButton
                    disabled={isPositiveNumber(removingId?.length ?? 0)}
                    isLoading={isRemovingAll}
                    onPress={handleRemoveAll}
                />
            ) : null}
        </Card>
    );
};
