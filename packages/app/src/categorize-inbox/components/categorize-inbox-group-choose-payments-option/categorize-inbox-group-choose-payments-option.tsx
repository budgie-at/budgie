import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupChoosePaymentsOption = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { includedRows } = useCategorizeInboxContext();

    const total = cluster.rows.length;
    const included = includedRows(cluster).length;
    const summary = included === total ? t`All ${total}` : t`${included} of ${total}`;

    const handlePress = (): void => void router.push({ pathname: '/categorize/payments/[key]', params: { key: cluster.key } });

    const accessory = (
        <View className="flex-row items-center gap-x-xs">
            <Text className="text-secondary-foreground text-sm tabular-nums">{summary}</Text>
            <CategorizeInboxOptionChevron />
        </View>
    );

    return <CategorizeInboxOptionRow icon={UserIconNameEnum.List} title={t`Choose payments`} accessory={accessory} onPress={handlePress} />;
};
