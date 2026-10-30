import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { CategorizeInboxActionCapsule } from '../categorize-inbox-action-capsule/categorize-inbox-action-capsule';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly isLead: boolean;
}

export const CategorizeInboxGroupTransferOption = ({ cluster, isLead }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const isIncome = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME;
    const subtitle = isIncome ? t`Leaves your income` : t`Not counted as spending`;

    const handlePress = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });

    if (isLead) {
        return (
            <CategorizeInboxLeadOption
                icon={UserIconNameEnum.ArrowLeftRight}
                title={t`Transfer`}
                subtitle={subtitle}
                variant="neutral"
                accessory={<CategorizeInboxActionCapsule label={t`Choose account`} variant="neutral" />}
                onPress={handlePress}
            />
        );
    }

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.ArrowLeftRight}
            title={t`Transfer to an account`}
            subtitle={subtitle}
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
