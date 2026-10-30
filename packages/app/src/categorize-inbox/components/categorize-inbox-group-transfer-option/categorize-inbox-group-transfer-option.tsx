import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

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
    const defaultSubtitle = isIncome ? t`Leaves your income` : t`Not counted as spending`;
    const subtitle = isLead ? t`Suggested` : defaultSubtitle;

    const handlePress = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.ArrowLeftRight}
            title={t`Transfer to an account`}
            subtitle={subtitle}
            isLead={isLead}
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
