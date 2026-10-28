import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly icon: UserIconType | null;
    readonly carriedAmount: number;
    readonly currencySymbol: string;
}

export const BudgetDetailsLimitHeading = ({ title, icon, carriedAmount, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const formattedAmount = formatDigits(convertFromMicroUnits(Math.abs(carriedAmount)), currencySymbol);
    const isSurplus = isPositiveNumber(carriedAmount);
    const pillLabel = isSurplus ? t`+${formattedAmount} rolled over` : t`−${formattedAmount} carried`;
    const pill = carriedAmount === 0 ? null : <MetaPill variant={isSurplus ? 'positive' : 'destructive'} label={pillLabel} />;

    return (
        <>
            {isDefined(icon) ? <CircleIcon icon={icon} variant="ghost" size={40} iconSize={18} /> : null}

            <Text className="text-primary text-md font-semibold flex-1" numberOfLines={1}>
                {title}
            </Text>
            {pill}
        </>
    );
};
