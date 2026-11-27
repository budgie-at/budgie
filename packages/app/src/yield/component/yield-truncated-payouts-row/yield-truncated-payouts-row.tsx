import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

interface Props {
    readonly count: number;
}

export const YieldTruncatedPayoutsRow = ({ count }: Props) => {
    const { t } = useLingui();

    return (
        <Text className="px-3xl pt-lg text-center text-[13px] text-secondary-foreground" testID={PassiveIncomeSelector.TruncatedPayouts}>
            {t({ message: plural(count, { one: 'Showing the latest # payout', other: 'Showing the latest # payouts' }) })}
        </Text>
    );
};
