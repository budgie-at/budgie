import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ImportProgressInterface } from '../../interface/import-progress.interface';

interface Props {
    readonly progress: ImportProgressInterface;
}

export const ImportProgressView = ({ progress }: Props) => {
    const { t } = useLingui();

    const percentage = useMemo(
        () => (progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0),
        [progress.processed, progress.total]
    );

    const widthStyle = useMemo(() => ({ width: `${percentage}%` as const }), [percentage]);

    return (
        <View className="flex-1 justify-center px-4xl">
            <View className="items-center gap-y-7xl">
                <CircleIcon icon={ICONS.Database} variant="default" size="3xl" />

                <View className="items-center gap-y-xl w-full">
                    <Text className="text-primary text-xl font-semibold">{t`Importing Transactions`}</Text>

                    <View className="w-full h-3 bg-secondary-background rounded-full overflow-hidden">
                        <View className="h-full bg-positive-foreground rounded-full" style={widthStyle} />
                    </View>

                    <Text className="text-secondary-foreground text-md">{`${progress.processed} / ${progress.total} (${percentage}%)`}</Text>
                </View>

                <View className="flex-row gap-x-5xl">
                    <View className="items-center gap-y-xs">
                        <Text className="text-positive-foreground text-2xl font-bold">{progress.successful}</Text>
                        <Text className="text-secondary-foreground text-sm">{t`Successful`}</Text>
                    </View>

                    <View className="items-center gap-y-xs">
                        <Text className="text-destructive-foreground text-2xl font-bold">{progress.errors}</Text>
                        <Text className="text-secondary-foreground text-sm">{t`Errors`}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};
