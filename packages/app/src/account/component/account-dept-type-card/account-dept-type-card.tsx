import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Icon } from '../../../@generic/component/icon/icon';
import { ACCOUNT_DEBT_TYPE_DESCRIPTION } from '../../constant/account-debt-type-description.constant';
import { ACCOUNT_DEBT_TYPE_ICON } from '../../constant/account-debt-type-icon.constant';
import { ACCOUNT_DEBT_TYPE } from '../../constant/account-debt-type.constant';

interface Props {
    readonly isSelected: boolean;
    readonly type: AccountDebtTypeEnum;
    readonly testID?: string;
    readonly onSelect: (type: AccountDebtTypeEnum) => void;
}

const cardVariants = cva('flex-1 items-center gap-y-lg border-2', {
    variants: {
        isSelected: {
            true: 'border-primary bg-secondary-background/30',
            false: 'border-secondary-corner/50'
        }
    }
});

export const AccountDeptTypeCard = ({ type, onSelect, isSelected, testID }: Props) => {
    const { t } = useLingui();

    const handleSelect = () => void onSelect(type);

    const selectedIndicator = isSelected ? (
        <View className="bg-primary rounded-full p-xs">
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Check} size={16} />
        </View>
    ) : (
        <View className="h-6 w-6" />
    );

    return (
        <Card testID={testID} onPress={handleSelect} className={cardVariants({ isSelected })} size="md">
            <CircleIcon icon={ACCOUNT_DEBT_TYPE_ICON[type]} variant="ghost" border={false} size={40} iconSize={20} />

            <View className="flex-1 items-center justify-center gap-y-xs self-stretch px-sm">
                <Text className="text-sm font-semibold text-primary text-center">{t(ACCOUNT_DEBT_TYPE[type])}</Text>
                <Text className="text-sm text-secondary-foreground text-center">{t(ACCOUNT_DEBT_TYPE_DESCRIPTION[type])}</Text>
            </View>

            {selectedIndicator}
        </Card>
    );
};
