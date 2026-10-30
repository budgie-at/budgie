import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
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

    const labelTitle = label.title;
    const count = includedRows(cluster).length;
    const title = isBestMatch
        ? t({ message: plural(count, { one: `File # payment as ${labelTitle}`, other: `File # payments as ${labelTitle}` }) })
        : labelTitle;
    const subtitleProps = { ...(isBestMatch && { subtitle: t`Best match` }) };
    const accessory = isBestMatch ? (
        <View className="bg-positive-fill size-7 items-center justify-center rounded-full">
            <Icon icon={UserIconNameEnum.Check} size={16} className="text-white" />
        </View>
    ) : null;

    const handlePress = (): void => {
        assignCluster(cluster, label.id);
        router.dismissTo('/categorize');
    };

    return (
        <CategorizeInboxOptionRow
            icon={label.icon}
            title={title}
            testKey={labelTitle}
            isLead={isBestMatch}
            accessory={accessory}
            {...subtitleProps}
            onPress={handlePress}
        />
    );
};
