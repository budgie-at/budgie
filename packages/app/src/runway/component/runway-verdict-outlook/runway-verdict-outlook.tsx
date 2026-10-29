import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
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
    const coverMonths = isPositiveNumber(burn) ? Math.round(liquid / burn) : null;
    const runOutDate = isDefined(runsOutAt) ? formatMonthAndYear(runsOutAt) : '';
    const coverLine = isDefined(coverMonths) ? t`Covered by ${coverMonths} months of expenses.` : t`Covered by your liquid balance.`;
    const isRunOutCharted = isDefined(runwayMonths) && runwayMonths <= RUNWAY_MAX_MONTHS;
    const burningLine = isRunOutCharted ? '' : t`Runs out around ${runOutDate}.`;
    const outlookLine = isPositive ? coverLine : burningLine;

    return (
        <View className="gap-y-xs">
            {isNotEmptyString(outlookLine) ? <Text className="text-sm text-secondary-foreground">{outlookLine}</Text> : null}

            {isRunwayCryptoIncluded ? (
                <Text testID={RunwaySelector.VerdictCryptoNote} className="text-xs text-secondary-foreground">
                    <Trans>Includes crypto</Trans>
                </Text>
            ) : null}
        </View>
    );
};
