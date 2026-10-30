import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxActionCapsule } from '../categorize-inbox-action-capsule/categorize-inbox-action-capsule';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
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
    const fileLabel = t({ context: 'Apply a category action', message: 'File' });

    const handlePress = (): void => {
        assignCluster(cluster, label.id);
        router.dismissTo('/categorize');
    };

    if (isBestMatch) {
        return (
            <CategorizeInboxLeadOption
                icon={label.icon}
                title={label.title}
                subtitle={t({ message: plural(count, { one: 'Best match · # payment', other: 'Best match · # payments' }) })}
                variant="positive"
                accessory={<CategorizeInboxActionCapsule label={fileLabel} variant="positive" />}
                onPress={handlePress}
            />
        );
    }

    return (
        <CategorizeInboxOptionRow
            icon={label.icon}
            title={label.title}
            accessory={<CategorizeInboxActionCapsule label={fileLabel} variant="outline" />}
            onPress={handlePress}
        />
    );
};
