import { DividendPayoutEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { InzhurSelector } from '../../selector/inzhur.selector';

interface Props {
    readonly payout: DividendPayoutEnum;
    readonly isSelected: boolean;
    readonly onSelect: (payout: DividendPayoutEnum) => void;
}

const OPTION = {
    [DividendPayoutEnum.BANK]: {
        icon: UserIconNameEnum.Landmark,
        title: msg`Paid to my bank`,
        subtitle: msg`Inzhur sends dividends to your bank card`
    },
    [DividendPayoutEnum.REINVEST]: {
        icon: UserIconNameEnum.RefreshCw,
        title: msg`Reinvested`,
        subtitle: msg`Inzhur buys more certificates`
    }
} as const;

export const InzhurDividendPayoutOption = ({ payout, isSelected, onSelect }: Props) => {
    const { t } = useLingui();
    const { icon, title, subtitle } = OPTION[payout];

    const handlePress = () => {
        onSelect(payout);
    };
    const pressableProps = { accessibilityState: { selected: isSelected } };

    return (
        <GroupedListRow
            left={
                <View className="size-[40px] items-center justify-center">
                    <Icon icon={icon} size={20} className="text-primary" />
                </View>
            }
            title={t(title)}
            subtitle={t(subtitle)}
            right={
                <View className="size-5 items-center justify-center">
                    {isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}
                </View>
            }
            onPress={handlePress}
            pressableProps={pressableProps}
            testID={InzhurSelector.PayoutOption(payout)}
        />
    );
};
