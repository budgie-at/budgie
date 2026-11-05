import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsHeroBalanceValue } from '../../../account/component/account-details-hero-balance-value/account-details-hero-balance-value';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurValueQuery } from '../../query/use-inzhur-value.query';
import { InzhurFreshnessLine } from '../inzhur-freshness-line/inzhur-freshness-line';

interface Props {
    readonly statementDate: string;
}

export const InzhurImportSummaryHero = ({ statementDate }: Props) => {
    const { t } = useLingui();
    const hryvnia = useHryvniaInstrumentQuery();
    const inzhurValue = useInzhurValueQuery();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();

    const statementLabel = formatMonthAndDayAndOptionalYear(statementDate);
    const heroAccount = isDefined(hryvnia) ? { type: AccountTypeEnum.BANK, instrument: hryvnia } : null;
    const isHeroShown = isDefined(inzhurValue) && isDefined(heroAccount);

    return (
        <View accessible className="items-stretch gap-y-lg">
            <Text className="text-center text-[15px] leading-[20px] text-secondary-foreground">{t`Statement of ${statementLabel}`}</Text>
            <View className="gap-y-xs">
                {isHeroShown ? <AccountDetailsHeroBalanceValue balance={inzhurValue.total} account={heroAccount} /> : null}
                <InzhurFreshnessLine />
            </View>
        </View>
    );
};
