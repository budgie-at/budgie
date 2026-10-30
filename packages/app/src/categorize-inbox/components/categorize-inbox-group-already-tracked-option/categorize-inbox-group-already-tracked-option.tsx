import { CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import { CASH_WITHDRAWAL_TRACKED_CATEGORY_ID, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxActionCapsule } from '../categorize-inbox-action-capsule/categorize-inbox-action-capsule';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupAlreadyTrackedOption = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { strategy, assignCluster } = useCategorizeInboxContext();

    const handlePress = (): void => {
        assignCluster(cluster, CASH_WITHDRAWAL_TRACKED_CATEGORY_ID);
        router.dismissTo('/categorize');
    };

    if (strategy?.labelKind !== CategorizeInboxLabelKindEnum.CATEGORY) {
        return null;
    }

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.CheckCheck}
            title={t`Already tracked`}
            accessory={
                <CategorizeInboxActionCapsule label={t({ context: 'Apply a category action', message: 'File' })} variant="outline" />
            }
            onPress={handlePress}
        />
    );
};
