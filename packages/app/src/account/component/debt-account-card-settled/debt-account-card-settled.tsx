import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
}

export const DebtAccountCardSettled = ({ debtType }: Props) => {
    const { t } = useLingui();

    return (
        <View className="shrink-0 flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Check} className="text-positive-foreground" size={12} />
            <Text className="text-xs font-medium text-positive-foreground" numberOfLines={1}>
                {t(DEBT_SETTLED_LABEL[debtType])}
            </Text>
        </View>
    );
};
