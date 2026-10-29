import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

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
    const { assignCluster } = useCategorizeInboxContext();

    const subtitleProps = { ...(isBestMatch && { subtitle: t`Best match` }) };

    const handlePress = (): void => {
        assignCluster(cluster, label.id);
        router.dismissTo('/categorize');
    };

    return <CategorizeInboxOptionRow icon={label.icon} title={label.title} {...subtitleProps} onPress={handlePress} />;
};
