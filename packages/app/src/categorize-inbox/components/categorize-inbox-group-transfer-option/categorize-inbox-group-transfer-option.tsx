import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { CategorizeInboxActionCapsule } from '../categorize-inbox-action-capsule/categorize-inbox-action-capsule';
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
    const subtitle = isLead ? t`Looks like a transfer` : defaultSubtitle;

    const accessory = isLead ? <CategorizeInboxActionCapsule label={t`Choose`} variant="neutral" /> : <CategorizeInboxOptionChevron />;
    const variant = isLead ? 'suggested' : 'regular';
    const title = isLead ? t`Transfer` : t`Transfer to an account`;

    const handlePress = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.ArrowLeftRight}
            title={title}
            subtitle={subtitle}
            variant={variant}
            accessory={accessory}
            onPress={handlePress}
        />
    );
};
