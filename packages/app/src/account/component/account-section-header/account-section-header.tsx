import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountTypeTotalQuery } from '../../query/use-account-type-total.query';

interface Props {
    readonly type: AccountTypeEnum;
}

export const AccountSectionHeader = ({ type }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const total = useAccountTypeTotalQuery(type);

    const formattedTotal = formatDigits(total, defaultInstrument.symbol);

    return (
        <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
            <Text className="text-xs uppercase text-secondary-foreground">{t(ACCOUNT_TYPE[type])}</Text>
            <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
        </View>
    );
};
