import { DividendPayoutEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { InzhurSelector } from '../../selector/inzhur.selector';

interface Props {
    readonly payout: DividendPayoutEnum;
    readonly isSelected: boolean;
    readonly onSelect: (payout: DividendPayoutEnum) => void;
}

const OPTION = {
    [DividendPayoutEnum.BANK]: { icon: UserIconNameEnum.Landmark, title: msg`Bank`, subtitle: msg`Paid to your bank card` },
    [DividendPayoutEnum.REINVEST]: {
        icon: UserIconNameEnum.TrendingUp,
        title: msg`Inzhur balance`,
        subtitle: msg`Kept on Inzhur and reinvested`
    }
} as const;

export const InzhurDividendPayoutOption = ({ payout, isSelected, onSelect }: Props) => {
    const { t } = useLingui();
    const { icon, title, subtitle } = OPTION[payout];

    const handlePress = () => {
        onSelect(payout);
    };
    const check = (
        <View className="size-5 items-center justify-center">
            {isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}
        </View>
    );

    return (
        <SettingsRow
            icon={icon}
            variant="primary"
            title={t(title)}
            subtitle={t(subtitle)}
            right={check}
            onPress={handlePress}
            testID={InzhurSelector.PayoutOption(payout)}
        />
    );
};
