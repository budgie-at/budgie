import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CategorizeInboxFindingKindEnum } from '../../enum/categorize-inbox-finding-kind.enum';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxFinding } from '../../utils/get-categorize-inbox-finding.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupFinding = ({ cluster }: Props) => {
    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    const { kind, rate, isPerDay } = getCategorizeInboxFinding(cluster, matchedAccount?.title ?? null);

    const rateBody = isPerDay ? <Trans>about {rate} a day</Trans> : <Trans>about {rate} a week</Trans>;

    const bodies: Record<CategorizeInboxFindingKindEnum, ReactNode> = {
        [CategorizeInboxFindingKindEnum.CASH]: <Trans>cash from an ATM</Trans>,
        [CategorizeInboxFindingKindEnum.JAR_TOP_UP]: rateBody,
        [CategorizeInboxFindingKindEnum.JAR_RETURN]: rateBody,
        [CategorizeInboxFindingKindEnum.MONTHLY]: <Trans>once a month</Trans>,
        [CategorizeInboxFindingKindEnum.GENERIC]: <Trans>same title every time</Trans>
    };

    return <Text>{bodies[kind]}</Text>;
};
