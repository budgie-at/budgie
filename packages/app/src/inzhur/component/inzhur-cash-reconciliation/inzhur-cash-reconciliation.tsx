import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { Icon } from '../../../@generic/component/icon/icon';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly value: number;
    readonly onChange: (value: number) => void;
    readonly instrumentSymbol: string;
}

export const InzhurCashReconciliation = ({ value, onChange, instrumentSymbol }: Props) => {
    const { t } = useLingui();

    return (
        <View>
            <GroupedListSectionTitle title={t`Set actual balance`} />
            <FormAmountInput testID={CreateAccountSelector.Amount} value={value} instrumentSymbol={instrumentSymbol} onChange={onChange}>
                <View className="flex-1">
                    <MoneyText amount={value} instrumentSymbol={instrumentSymbol} variant={MoneyTextVariantEnum.FIELD} tone="primary" />
                </View>
                <Icon icon={UserIconNameEnum.Pencil} size={20} className="text-secondary-foreground" />
            </FormAmountInput>
            <Text className="px-3xl pt-md text-[13px] leading-[18px] text-secondary-foreground">
                {t`An increase is recorded as estimated dividends. A decrease is recorded as a correction.`}
            </Text>
        </View>
    );
};
