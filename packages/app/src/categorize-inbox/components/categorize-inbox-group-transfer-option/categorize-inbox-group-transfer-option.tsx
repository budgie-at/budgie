import { AccountTypeEnum, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
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
    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    const isIncome = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME;
    const subtitle = isIncome ? t`Leaves your income` : t`Not counted as spending`;
    const jarName = getCategorizeInboxJarName(cluster.displayTitle);
    const counterparty = matchedAccount?.title ?? (isDefined(jarName) ? `«${jarName}»` : null);
    const directedCounterparty = isIncome ? t`From ${counterparty}` : t`To ${counterparty}`;
    const leadSubtitle = isDefined(counterparty) ? directedCounterparty : subtitle;
    const jarTitle = isIncome ? t`Transfer from savings jar` : t`Transfer to savings jar`;
    const leadTitle = isDefined(jarName) || matchedAccount?.type === AccountTypeEnum.SAVINGS ? jarTitle : t`Transfer`;

    const handlePress = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });

    if (isLead) {
        return (
            <CategorizeInboxLeadOption
                choice={CategorizeInboxGroupChoiceEnum.TRANSFER}
                icon={UserIconNameEnum.ArrowLeftRight}
                title={leadTitle}
                subtitle={leadSubtitle}
                variant="neutral"
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
