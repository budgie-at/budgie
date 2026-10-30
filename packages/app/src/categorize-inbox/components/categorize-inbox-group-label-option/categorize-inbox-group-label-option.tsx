import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxLabelInterface } from '../../interface/categorize-inbox-label.interface';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly label: CategorizeInboxLabelInterface;
    readonly isBestMatch: boolean;
}

export const CategorizeInboxGroupLabelOption = ({ cluster, label, isBestMatch }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { assignCluster, includedRows } = useCategorizeInboxContext();

    const count = includedRows(cluster).length;
    const variant = isBestMatch ? 'best' : 'regular';
    const subtitleProps = {
        ...(isBestMatch && { subtitle: t({ message: plural(count, { one: 'Best match · # payment', other: 'Best match · # payments' }) }) })
    };
    const accessory = isBestMatch ? (
        <View className="bg-positive-fill h-[32px] items-center justify-center rounded-full px-xl">
            <Text className="text-sm font-semibold text-white">
                <Trans context="Apply a category action">File</Trans>
            </Text>
        </View>
    ) : null;

    const handlePress = (): void => {
        assignCluster(cluster, label.id);
        router.dismissTo('/categorize');
    };

    return (
        <CategorizeInboxOptionRow
            icon={label.icon}
            title={label.title}
            variant={variant}
            accessory={accessory}
            {...subtitleProps}
            onPress={handlePress}
        />
    );
};
