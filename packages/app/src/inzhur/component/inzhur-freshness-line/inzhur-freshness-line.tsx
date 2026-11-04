import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useInzhurFreshnessQuery } from '../../query/use-inzhur-freshness.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurFreshnessLine = () => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const freshness = useInzhurFreshnessQuery();

    const priceDate = isDefined(freshness?.priceDate) ? formatMonthAndDayAndOptionalYear(freshness.priceDate) : null;
    const statementDate = isDefined(freshness?.statementDate) ? formatMonthAndDayAndOptionalYear(freshness.statementDate) : null;
    const parts = [
        isDefined(priceDate) ? t`Prices · ${priceDate}` : null,
        isDefined(statementDate) ? t`Statement · ${statementDate}` : null
    ].filter(isDefined);

    if (!isNotEmptyArray(parts)) {
        return null;
    }

    return (
        <Text className="text-center text-[13px] leading-[18px] text-secondary-foreground tabular-nums" testID={InzhurSelector.Freshness}>
            {parts.join('   ')}
        </Text>
    );
};
