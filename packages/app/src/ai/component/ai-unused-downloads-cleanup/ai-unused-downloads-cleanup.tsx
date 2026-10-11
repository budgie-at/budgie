import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

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

    if (!isLoading && !hasError && !isPositiveNumber(unusedBytes)) {
        return null;
    }

    let storageText: string;
    let description: string;

    if (isLoading) {
        storageText = t`Checking unused downloads...`;
        description = t`Budgie is checking which AI downloads are no longer needed.`;
    } else if (hasError) {
        storageText = t`Could not check unused downloads`;
        description = t`Try again after Budgie finishes checking storage.`;
    } else {
        storageText = t`${unusedSize} can be removed`;
        description = t`These downloads are not needed by your enabled features. Downloads still in use will be kept.`;
    }
    const isActionDisabled = !isPositiveNumber(unusedBytes) || isLoading || isMutating || hasError;

    return (
        <View className="gap-y-lg">
            <View className="gap-y-xs">
                <Text className="text-primary text-sm font-semibold">{t`Unused downloads`}</Text>
                <Text className="text-primary text-md font-semibold">{storageText}</Text>
                <Text className="text-secondary-foreground text-xs">{description}</Text>
            </View>

            <Button
                content={t`Remove unused downloads`}
                leftIcon={UserIconNameEnum.Trash2}
                variant="destructive"
                disabled={isActionDisabled}
                isLoading={isFreeingUnused}
                onPress={onPress}
                testID={AiModelStorageCardSelector.FreeUnusedButton}
            />
        </View>
    );
};
