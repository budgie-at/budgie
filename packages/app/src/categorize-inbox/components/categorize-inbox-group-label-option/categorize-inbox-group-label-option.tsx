import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';
import { CategorizeInboxTonalCapsule } from '../categorize-inbox-tonal-capsule/categorize-inbox-tonal-capsule';

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
                subtitle={t`Best match`}
                variant="positive"
                accessory={<CategorizeInboxTonalCapsule label={fileLabel} variant={CategorizeInboxTonalCapsuleVariantEnum.POSITIVE} />}
                onPress={handlePress}
            />
        );
    }

    return (
        <CategorizeInboxOptionRow
            icon={label.icon}
            title={label.title}
            accessory={<CategorizeInboxTonalCapsule label={fileLabel} variant={CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL} />}
            onPress={handlePress}
        />
    );
};
