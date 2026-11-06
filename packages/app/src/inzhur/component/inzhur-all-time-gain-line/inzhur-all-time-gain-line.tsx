import { InzhurGainRangeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurGainLine } from '../inzhur-gain-line/inzhur-gain-line';

import type { InzhurRangedGainInterface } from '@budgie/sync';

interface Props {
    readonly gains: readonly InzhurRangedGainInterface[];
}

export const InzhurAllTimeGainLine = ({ gains }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const allTime = gains.find(gain => gain.range === InzhurGainRangeEnum.ALL);

    if (!isDefined(allTime) || !isDefined(allTime.gain)) {
        return null;
    }

    const startLabel = formatMonthAndDayAndOptionalYear(parseISO(allTime.startDate));

    return (
        <InzhurGainLine gain={allTime.gain} percent={allTime.percent} suffix={t`since ${startLabel}`} testID={InzhurSelector.GainLine} />
    );
};
