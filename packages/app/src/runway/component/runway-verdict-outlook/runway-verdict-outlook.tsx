import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { RUNWAY_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/runway-max-font-size-multiplier.constant';
import { RunwaySelector } from '../../runway.selector';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

export const RunwayVerdictOutlook = ({ computation }: Props) => {
    const { t } = useLingui();
    const isRunwayCryptoIncluded = useSetting('isRunwayCryptoIncluded');
    const { formatMonthAndYear } = useFormatDate();

    const { burn, isPositive, liquid, runsOutAt, runwayMonths } = computation;
    const coverMonths = isPositiveNumber(burn) && isPositiveNumber(liquid) ? Math.round(liquid / burn) : null;
    const runOutDate = isDefined(runsOutAt) ? formatMonthAndYear(runsOutAt) : '';
    const coverLine = isDefined(coverMonths)
        ? t`Your balance covers ${coverMonths} months of spending.`
        : t`Covered by your liquid balance.`;
    const runOutLine = isNotEmptyString(runOutDate) ? t`Runs out around ${runOutDate}.` : '';
    const burningLine = isPositiveNumber(runwayMonths) ? runOutLine : t`Your balance is already below zero.`;
    const outlookLine = isPositive ? coverLine : burningLine;

    return (
        <View className="gap-y-xs">
            {isNotEmptyString(outlookLine) ? (
                <Text maxFontSizeMultiplier={RUNWAY_MAX_FONT_SIZE_MULTIPLIER} className="text-[15px] text-primary">
                    {outlookLine}
                </Text>
            ) : null}

            {isRunwayCryptoIncluded ? (
                <Text testID={RunwaySelector.VerdictCryptoNote} className="text-xs text-secondary-foreground">
                    <Trans>Includes crypto</Trans>
                </Text>
            ) : null}
        </View>
    );
};
