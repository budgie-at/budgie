import { AccountTypeEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AccountDetailsHeroBalanceValue } from '../../../account/component/account-details-hero-balance-value/account-details-hero-balance-value';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurValueQuery } from '../../query/use-inzhur-value.query';

import type { InzhurFundChangeInterface } from '@budgie/sync';

interface Props {
    readonly funds: readonly InzhurFundChangeInterface[];
}

export const InzhurImportSummaryHero = ({ funds }: Props) => {
    const { t } = useLingui();
    const formatFundQuantity = useFormatFundQuantity();
    const hryvnia = useHryvniaInstrumentQuery();
    const inzhurValue = useInzhurValueQuery();

    const totalDelta = funds.reduce((total, fund) => total + fund.deltaQuantity, 0);
    const certificatesLabel = formatFundQuantity(Math.abs(totalDelta));
    const fundsLabel = t({ message: plural(funds.length, { one: '# fund', other: '# funds' }) });
    const changeLabel =
        totalDelta < 0 ? t`${certificatesLabel} sold across ${fundsLabel}` : t`${certificatesLabel} added across ${fundsLabel}`;
    const heroAccount = isDefined(hryvnia) ? { type: AccountTypeEnum.BANK, instrument: hryvnia } : null;
    const isHeroShown = isDefined(inzhurValue) && isDefined(heroAccount);

    return (
        <View accessible className="items-start gap-y-xs px-3xl pt-md">
            <Text className="text-[13px] font-medium text-secondary-foreground">{t`Inzhur total`}</Text>
            {isHeroShown ? <AccountDetailsHeroBalanceValue balance={inzhurValue.total} account={heroAccount} /> : null}
            {isNotEmptyArray(funds) ? (
                <Text className="text-[15px] leading-[20px] text-secondary-foreground tabular-nums">{changeLabel}</Text>
            ) : null}
        </View>
    );
};
