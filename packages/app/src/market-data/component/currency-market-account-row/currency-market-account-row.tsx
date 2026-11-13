import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { CurrencyMarketAccountAmount } from '../currency-market-account-amount/currency-market-account-amount';

import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title'>;
    readonly leading: ReactNode;
    readonly instrumentCode: string;
    readonly sync: Pick<SyncEntityInterface, 'provider'> | null;
    readonly amount: number;
    readonly valueLabel: string | null;
    readonly testID: string;
}

export const CurrencyMarketAccountRow = ({ account, leading, instrumentCode, sync, amount, valueLabel, testID }: Props) => {
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const isStacked = useIsAccessibilityTextSize();
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const providerTitle = isDefined(sync) ? BANK_PROVIDER_TITLE[sync.provider] : null;
    const providerName = isDefined(providerTitle) ? t(providerTitle) : null;
    const subtitle = isDefined(providerName) ? t`${providerName} · No cost basis` : null;
    const fullAmountLabel = formatInstrumentAmount(amount, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const amountParts = isAmountProtected ? [] : [fullAmountLabel, valueLabel];
    const pressableProps = { accessibilityLabel: [account.title, subtitle, ...amountParts].filter(isNotEmptyString).join(', ') };

    const amountBlock = (
        <CurrencyMarketAccountAmount amount={amount} instrumentCode={instrumentCode} valueLabel={valueLabel} isStacked={isStacked} />
    );
    const trailing = isStacked ? (
        <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
    ) : (
        <View className="ml-3 shrink-0 flex-row items-center gap-x-xs">
            {amountBlock}
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </View>
    );
    const title = (
        <View className="my-px min-h-[34px] min-w-0 flex-1 justify-center gap-y-xxs">
            <Text
                className="text-primary text-[17px] leading-[22px]"
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            >
                {account.title}
            </Text>
            {isNotEmptyString(subtitle) ? (
                <Text
                    className="text-secondary-foreground text-[13px] leading-[18px]"
                    numberOfLines={2}
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {subtitle}
                </Text>
            ) : null}
            {isStacked ? amountBlock : null}
        </View>
    );

    const handlePress = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(account.id) } });

    return (
        <GroupedListRow
            left={leading}
            testID={testID}
            pressableProps={pressableProps}
            title={title}
            right={trailing}
            onPress={handlePress}
        />
    );
};
