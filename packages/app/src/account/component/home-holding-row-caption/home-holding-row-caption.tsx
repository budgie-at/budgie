import { AccountTypeEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { HomeHoldingRowSelector } from '../home-holding-row/home-holding-row.selector';

import type { HomeHoldingInterface } from '../../interface/home-holding.interface';

interface Props {
    readonly holding: Pick<HomeHoldingInterface, 'instrument' | 'accounts' | 'balance' | 'weight'>;
    readonly sectionType: AccountTypeEnum;
}

export const HomeHoldingRowCaption = ({ holding, sectionType }: Props) => {
    const { instrument, accounts, balance, weight } = holding;

    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const formatPercent = useFormatPercent();

    const placesLabel =
        sectionType === AccountTypeEnum.STOCKS
            ? t({ message: plural(accounts.length, { one: '# broker', other: '# brokers' }) })
            : t({ message: plural(accounts.length, { one: '# wallet', other: '# wallets' }) });
    const unitLabel = isListedSecurityType(instrument.type) ? instrument.symbol : instrument.code;
    const quantityLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatInstrumentAmount(balance, unitLabel, instrument.type);
    const weightLabel = isDefined(weight) && !isAmountProtected ? formatPercent(weight) : null;
    const caption = [quantityLabel, weightLabel, accounts.length > 1 ? placesLabel : null].filter(isDefined).join(' · ');

    return (
        <Text
            className="text-[13px] text-secondary-foreground tabular-nums"
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            numberOfLines={2}
            testID={HomeHoldingRowSelector.Caption(instrument.code)}
        >
            {caption}
        </Text>
    );
};
