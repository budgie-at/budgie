import { DividendPayoutEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { InzhurDividendPayoutOption } from '../inzhur-dividend-payout-option/inzhur-dividend-payout-option';

interface Props {
    readonly value: DividendPayoutEnum | null | undefined;
    readonly onChange: (payout: DividendPayoutEnum) => void;
}

export const InzhurDividendPayoutField = ({ value, onChange }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListSection
            title={t`Dividends go to`}
            footer={t`Dividends kept on the Inzhur balance are reinvested in more certificates of this fund.`}
        >
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
    );
};
