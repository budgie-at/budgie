import { AccountDebtTypeEnum } from '@budgie/contracts';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { Text, View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { Card } from '../../../@generic/component/card/card';
import { cva } from 'class-variance-authority';
import { ACCOUNT_DEBT_TYPE } from '../../constant/account-debt-type.constant';
import { ACCOUNT_DEBT_TYPE_DESCRIPTION } from '../../constant/account-debt-type-description.constant';
import { ACCOUNT_DEBT_TYPE_ICON } from '../../constant/account-debt-type-icon.constant';

interface Props {
    readonly isSelected: boolean;
    readonly type: AccountDebtTypeEnum;
    readonly onSelect: (type: AccountDebtTypeEnum) => void;
}

const cardVariants = cva('flex-1 gap-y-md items-center', {
    variants: {
        isSelected: {
            true: 'border-primary'
        }
    }
});

export const AccountDeptTypeCard = ({ type, onSelect, isSelected }: Props) => {
    const { i18n } = useLingui();

    const handleSelect = () => void onSelect(type);

    return (
        <Card onPress={handleSelect} className={cardVariants({ isSelected })}>
            <CircleIcon border={false} size="xl" icon={ICONS[ACCOUNT_DEBT_TYPE_ICON[type]]} variant="ghost" />

            <View className="gap-y-xxs items-center">
                <Text className="text-primary text-sm font-medium">{i18n.t(ACCOUNT_DEBT_TYPE[type])}</Text>
                <Text className="text-xs text-secondary-foreground">{i18n.t(ACCOUNT_DEBT_TYPE_DESCRIPTION[type])}</Text>
            </View>

            {isSelected ? <CircleIcon variant="ghost" size="xxxs" icon={ICONS.Check} /> : null}
        </Card>
    );
};
