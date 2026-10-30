import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { CategorizeInboxFindingKindEnum } from '../../enum/categorize-inbox-finding-kind.enum';
import { getCategorizeInboxFinding } from '../../utils/get-categorize-inbox-finding.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupFinding = ({ cluster }: Props) => {
    const { formatShortMonth, formatFullMonth } = useFormatDate();

    const { kind, rate, firstAt, lastAt } = getCategorizeInboxFinding(cluster);
    const firstMonth = formatShortMonth(firstAt);
    const lastMonth = formatShortMonth(lastAt);
    const month = formatFullMonth(lastAt);

    const bodies: Record<CategorizeInboxFindingKindEnum, ReactNode> = {
        [CategorizeInboxFindingKindEnum.CASH]: <Trans>cash from an ATM</Trans>,
        [CategorizeInboxFindingKindEnum.ONCE_A_MONTH]: <Trans>once a month</Trans>,
        [CategorizeInboxFindingKindEnum.PER_DAY]: <Trans>about {rate} a day</Trans>,
        [CategorizeInboxFindingKindEnum.PER_WEEK]: <Trans>about {rate} a week</Trans>,
        [CategorizeInboxFindingKindEnum.MONTH_RANGE]: (
            <Trans>
                {firstMonth}–{lastMonth}
            </Trans>
        ),
        [CategorizeInboxFindingKindEnum.SINGLE_MONTH]: <Trans>in {month}</Trans>
    };

    return <Text>{bodies[kind]}</Text>;
};
