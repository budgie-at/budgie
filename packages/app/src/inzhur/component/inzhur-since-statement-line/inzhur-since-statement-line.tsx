import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useInzhurGainSinceQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurGainLine } from '../inzhur-gain-line/inzhur-gain-line';

interface Props {
    readonly previousStatementDate: string;
}

export const InzhurSinceStatementLine = ({ previousStatementDate }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const gain = useInzhurGainSinceQuery(previousStatementDate);

    if (!isDefined(gain) || !isDefined(gain.gain)) {
        return null;
    }

    const statementLabel = formatMonthAndDayAndOptionalYear(previousStatementDate);

    return (
        <InzhurGainLine
            gain={gain.gain}
            percent={null}
            suffix={t`since the ${statementLabel} statement`}
            testID={InzhurSelector.SinceStatement}
        />
    );
};
