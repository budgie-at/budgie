import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
import { CategorizeInboxLeadRow } from '../categorize-inbox-lead-row/categorize-inbox-lead-row';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';

import type { CategorizeInboxGroupOptionsInterface } from '../../interface/categorize-inbox-group-options.interface';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'key'>;
    readonly cashAccount: CategorizeInboxGroupOptionsInterface['matchedAccount'];
}

export const CategorizeInboxGroupCashDepositLead = ({ cluster, cashAccount }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const title = t`From cash`;

    const handlePress = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });

    if (isDefined(cashAccount)) {
        return (
            <CategorizeInboxLeadOption
                choice={CategorizeInboxGroupChoiceEnum.TRANSFER}
                icon={UserIconNameEnum.Banknote}
                title={title}
                subtitle={cashAccount.title}
            />
        );
    }

    return (
        <CategorizeInboxLeadRow
            icon={UserIconNameEnum.Banknote}
            title={title}
            subtitle={t`Pick the cash account`}
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
