import { AccountTypeEnum, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
import { CategorizeInboxLeadRow } from '../categorize-inbox-lead-row/categorize-inbox-lead-row';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupTransferLead = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    const isIncome = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME;
    const jarName = getCategorizeInboxJarName(cluster.displayTitle);
    const counterparty = matchedAccount?.title ?? `«${jarName}»`;
    const subtitle = isIncome ? t`From ${counterparty}` : t`To ${counterparty}`;
    const jarTitle = isIncome ? t`Transfer from savings jar` : t`Transfer to savings jar`;
    const title = isDefined(jarName) || matchedAccount?.type === AccountTypeEnum.SAVINGS ? jarTitle : t`Transfer`;

    const handlePress = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });

    if (isDefined(matchedAccount)) {
        return (
            <CategorizeInboxLeadOption
                choice={CategorizeInboxGroupChoiceEnum.TRANSFER}
                icon={UserIconNameEnum.ArrowLeftRight}
                title={title}
                subtitle={subtitle}
                variant="neutral"
            />
        );
    }

    return (
        <CategorizeInboxLeadRow
            icon={UserIconNameEnum.ArrowLeftRight}
            title={title}
            subtitle={subtitle}
            variant="neutral"
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
