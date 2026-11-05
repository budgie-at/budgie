import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';

interface Props {
    readonly balance: number;
}

export const InzhurFundHoldingsSection = ({ balance }: Props) => {
    const { t } = useLingui();
    const formatFundQuantity = useFormatFundQuantity();

    return (
        <View accessible className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-lg" testID={InzhurSelector.Holdings}>
            <GroupedListIcon icon={UserIconNameEnum.Layers} />
            <View className="flex-1 gap-y-xxs">
                <Text className="text-[17px] text-primary">{t`Holdings`}</Text>
                <Text className="text-[13px] leading-[18px] text-secondary-foreground">{t`From statements`}</Text>
            </View>
            <ProtectedText className="text-[17px] text-secondary-foreground tabular-nums">{formatFundQuantity(balance)}</ProtectedText>
        </View>
    );
};
