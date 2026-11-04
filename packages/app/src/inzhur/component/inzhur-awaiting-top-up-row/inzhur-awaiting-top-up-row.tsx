import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { InzhurSelector } from '../../selector/inzhur.selector';

interface Props {
    readonly amount: number;
    readonly instrumentSymbol: string;
}

export const InzhurAwaitingTopUpRow = ({ amount, instrumentSymbol }: Props) => (
    <View accessible className="min-h-[44px] flex-row items-start gap-x-xl" testID={InzhurSelector.SummaryUncoveredCash}>
        <View className="flex-1 gap-y-xxs">
            <View className="flex-row items-center gap-x-xs">
                <Icon icon={UserIconNameEnum.Clock} size={17} className="text-warning-strong" />
                <Text className="text-[17px] text-warning-strong">
                    <Trans>Awaiting top-up</Trans>
                </Text>
            </View>
            <Text className="text-[13px] leading-[18px] text-secondary-foreground" lineBreakStrategyIOS="standard">
                <Trans>Budgie will match it when the bank transaction appears.</Trans>
            </Text>
        </View>
        <MoneyText amount={amount} instrumentSymbol={instrumentSymbol} variant={MoneyTextVariantEnum.ROW} />
    </View>
);
