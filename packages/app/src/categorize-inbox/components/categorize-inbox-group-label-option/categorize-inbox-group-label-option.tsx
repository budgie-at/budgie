import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxActionCapsule } from '../categorize-inbox-action-capsule/categorize-inbox-action-capsule';
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
        <CategorizeInboxActionCapsule label={t({ context: 'Apply a category action', message: 'File' })} variant="positive" />
    ) : (
        <Text className="text-secondary-foreground text-sm font-medium">{t({ context: 'Apply a category action', message: 'File' })}</Text>
    );

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
