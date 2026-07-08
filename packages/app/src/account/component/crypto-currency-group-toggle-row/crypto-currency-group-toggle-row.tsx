import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { CryptoCurrencyGroupCardSelector } from '../crypto-currency-group-card/crypto-currency-group-card.selector';

interface Props {
    readonly accountsCount: number;
    readonly defaultInstrumentSymbol: string;
    readonly formattedRate: string | null;
    readonly instrumentCode: string;
    readonly isOpen: boolean;
}

export const CryptoCurrencyGroupToggleRow = ({ accountsCount, defaultInstrumentSymbol, formattedRate, instrumentCode, isOpen }: Props) => {
    const { t } = useLingui();
    const chevronIcon = isOpen ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronRight;
    const accountsCountLabel = t({
        message: plural(accountsCount, {
            one: '# account',
            other: '# accounts'
        })
    });

    return (
        <View
            className="min-h-10 flex-row items-center justify-between gap-x-md"
            collapsable={false}
            testID={CryptoCurrencyGroupCardSelector.Toggle(instrumentCode)}
        >
            <View className="min-h-10 flex-row items-center gap-x-xs pr-lg">
                <Text className="text-secondary-foreground text-xs" testID={CryptoCurrencyGroupCardSelector.AccountCount(instrumentCode)}>
                    {accountsCountLabel}
                </Text>
                <Icon icon={chevronIcon} size={16} className="text-secondary-foreground" />
            </View>

            <Text
                className="shrink-0 text-right text-secondary-foreground text-xs"
                testID={CryptoCurrencyGroupCardSelector.Rate(instrumentCode)}
            >
                {isDefined(formattedRate) ? (
                    <Trans>
                        1 {instrumentCode} ≈ {defaultInstrumentSymbol}
                        {formattedRate}
                    </Trans>
                ) : (
                    <Trans>Missing rate</Trans>
                )}
            </Text>
        </View>
    );
};
