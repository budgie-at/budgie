import { Text, View, useWindowDimensions } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { OnboardingBalanceField } from '../onboarding-balance-field/onboarding-balance-field';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title' | 'icon'>;
    readonly value: number;
    readonly onChangeValue: (accountId: number, value: number) => void;
}

export const OnboardingBalanceRow = ({ account, value, onChangeValue }: Props) => {
    const { fontScale } = useWindowDimensions();
    const isStacked = fontScale > MAX_FONT_SIZE_MULTIPLIER;
    const title = <Text className="text-primary text-[17px]">{account.title}</Text>;
    const amountField = <OnboardingBalanceField account={account} value={value} onChangeValue={onChangeValue} />;
    const titleContent = isStacked ? (
        <View className="gap-y-md self-stretch">
            {title}
            {amountField}
        </View>
    ) : (
        title
    );
    const accessory = isStacked ? null : amountField;

    return <GroupedListRow left={<GroupedListIcon icon={account.icon} />} title={titleContent} right={accessory} />;
};
