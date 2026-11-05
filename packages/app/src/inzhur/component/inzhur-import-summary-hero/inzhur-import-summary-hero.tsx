import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsHeroBalanceValue } from '../../../account/component/account-details-hero-balance-value/account-details-hero-balance-value';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFreshnessQuery } from '../../query/use-inzhur-freshness.query';
import { useInzhurValueQuery } from '../../query/use-inzhur-value.query';

interface Props {
    readonly statementDate: string;
}

export const InzhurImportSummaryHero = ({ statementDate }: Props) => {
    const { t } = useLingui();
    const hryvnia = useHryvniaInstrumentQuery();
    const inzhurValue = useInzhurValueQuery();
    const freshness = useInzhurFreshnessQuery();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();

    const statementLabel = formatMonthAndDayAndOptionalYear(statementDate);
    const priceDate = isDefined(freshness?.priceDate) ? formatMonthAndDayAndOptionalYear(freshness.priceDate) : null;
    const sourceLabel = isDefined(priceDate) ? t`${statementLabel} statement · prices as of ${priceDate}` : t`${statementLabel} statement`;
    const heroAccount = isDefined(hryvnia) ? { type: AccountTypeEnum.BANK, instrument: hryvnia } : null;
    const isHeroShown = isDefined(inzhurValue) && isDefined(heroAccount);

    return (
        <View accessible className="items-stretch gap-y-xs">
            <Text className="text-center text-[15px] leading-[20px] text-secondary-foreground">{t`Inzhur value now`}</Text>
            {isHeroShown ? <AccountDetailsHeroBalanceValue balance={inzhurValue.total} account={heroAccount} /> : null}
            <Text className="text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums">{sourceLabel}</Text>
        </View>
    );
};
