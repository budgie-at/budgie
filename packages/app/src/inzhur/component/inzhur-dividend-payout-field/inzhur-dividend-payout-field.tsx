import { DividendPayoutEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { InzhurDividendPayoutOption } from '../inzhur-dividend-payout-option/inzhur-dividend-payout-option';

interface Props {
    readonly value: DividendPayoutEnum | null | undefined;
    readonly onChange: (payout: DividendPayoutEnum) => void;
}

export const InzhurDividendPayoutField = ({ value, onChange }: Props) => {
    const { t } = useLingui();

    return (
        <View>
            <GroupedListSectionTitle title={t`Dividends go to`} />
            <Text className="px-3xl pb-md text-[13px] leading-[18px] text-secondary-foreground">
                {t`Match your choice in the Inzhur app. This only changes how Budgie records dividends.`}
            </Text>
            <GroupedListSection>
                <InzhurDividendPayoutOption
                    payout={DividendPayoutEnum.BANK}
                    isSelected={value === DividendPayoutEnum.BANK}
                    onSelect={onChange}
                />
                <InzhurDividendPayoutOption
                    payout={DividendPayoutEnum.REINVEST}
                    isSelected={value === DividendPayoutEnum.REINVEST}
                    onSelect={onChange}
                />
            </GroupedListSection>
        </View>
    );
};
