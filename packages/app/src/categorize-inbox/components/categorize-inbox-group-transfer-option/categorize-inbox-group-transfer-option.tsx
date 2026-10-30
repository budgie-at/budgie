import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';
import { CategorizeInboxTonalCapsule } from '../categorize-inbox-tonal-capsule/categorize-inbox-tonal-capsule';

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
    const account = matchedAccount?.title ?? '';
    const jar = getCategorizeInboxJarName(cluster.displayTitle) ?? '';
    const topUpHint = isDefined(matchedAccount) ? t`Looks like a top-up of ${account}` : t`Looks like a jar top-up`;
    const returnHint = isDefined(matchedAccount) ? t`Money coming back from ${account}` : t`Money coming back from your «${jar}» jar`;
    const leadSubtitle = isIncome ? returnHint : topUpHint;

    const handlePress = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });

    if (isLead) {
        return (
            <CategorizeInboxLeadOption
                icon={UserIconNameEnum.ArrowLeftRight}
                title={t`Transfer`}
                subtitle={leadSubtitle}
                variant="neutral"
                accessory={<CategorizeInboxTonalCapsule label={t`Choose`} variant={CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL} />}
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
