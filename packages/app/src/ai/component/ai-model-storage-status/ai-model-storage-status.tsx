import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { formatModelStorageSize } from '../../utils/format-model-storage-size.util';

interface Props {
    readonly totalBytes: number;
    readonly isLoading: boolean;
    readonly isAiAvailable: boolean;
    readonly errorMessage: string | null;
}

export const AiModelStorageStatus = ({ totalBytes, isLoading, isAiAvailable, errorMessage }: Props) => {
    const { t } = useLingui();
    const totalSize = formatModelStorageSize(totalBytes);
    const hasDownloads = isPositiveNumber(totalBytes);
    const storageStatusText = hasDownloads ? t`${totalSize} stored on this device` : t`No AI downloads stored on this device`;
    const statusText = isLoading ? t`Checking storage...` : storageStatusText;
    const availabilityText = isAiAvailable ? null : t`On-device AI is not available in this build. You can still clear unused downloads.`;

    return (
        <View className="gap-y-3xl">
            <Text className="text-secondary-foreground text-sm">{statusText}</Text>

            {isDefined(errorMessage) ? <Text className="text-destructive-foreground text-sm">{errorMessage}</Text> : null}

            {isDefined(availabilityText) ? <Text className="text-secondary-foreground text-sm">{availabilityText}</Text> : null}
        </View>
    );
};
