import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { formatModelStorageSize } from '../../utils/format-model-storage-size.util';
import { AiModelStorageCardSelector } from '../ai-model-storage-card/ai-model-storage-card.selector';

interface Props {
    readonly unusedBytes: number;
    readonly isLoading: boolean;
    readonly isMutating: boolean;
    readonly isFreeingUnused: boolean;
    readonly hasError: boolean;
    readonly onPress: () => void;
}

export const AiUnusedDownloadsCleanup = ({ unusedBytes, isLoading, isMutating, isFreeingUnused, hasError, onPress }: Props) => {
    const { t } = useLingui();
    const unusedSize = formatModelStorageSize(unusedBytes);
    const hasUnusedDownloads = isPositiveNumber(unusedBytes);
    const title = t`Unused downloads`;
    const loadingDescription = t`Budgie is checking which AI downloads are no longer needed.`;
    const errorDescription = t`Try again after Budgie finishes checking storage.`;
    const emptyDescription = t`There are no unused AI downloads to remove.`;
    const reclaimableDescription = t`These downloads are not needed by your enabled features. Downloads still in use will be kept.`;
    const content = [
        isLoading ? { storageText: t`Checking unused downloads...`, description: loadingDescription } : null,
        hasError ? { storageText: t`Could not check unused downloads`, description: errorDescription } : null,
        hasUnusedDownloads ? { storageText: t`${unusedSize} can be removed`, description: reclaimableDescription } : null
    ].find(isDefined) ?? { storageText: t`No unused downloads`, description: emptyDescription };
    const shouldShowAction = hasUnusedDownloads || isLoading || hasError;
    const isActionDisabled = !hasUnusedDownloads || isLoading || isMutating || hasError;

    return (
        <View className="gap-y-lg">
            <View className="gap-y-xs">
                <Text className="text-primary text-sm font-semibold">{title}</Text>
                <Text className="text-primary text-md font-semibold">{content.storageText}</Text>
                <Text className="text-secondary-foreground text-xs">{content.description}</Text>
            </View>

            {shouldShowAction ? (
                <Button
                    content={t`Remove unused downloads`}
                    leftIcon={UserIconNameEnum.Trash2}
                    variant="destructive"
                    disabled={isActionDisabled}
                    isLoading={isFreeingUnused}
                    onPress={onPress}
                    testID={AiModelStorageCardSelector.FreeUnusedButton}
                />
            ) : null}
        </View>
    );
};
