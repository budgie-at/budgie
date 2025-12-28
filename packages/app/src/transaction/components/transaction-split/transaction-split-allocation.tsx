import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly entriesAmount: number;
    readonly totalAmount: number;
}

const summaryVariants = cva('px-xl py-lg rounded-3xl flex-row items-center gap-x-md', {
    variants: {
        valid: {
            true: 'bg-positive-background',
            false: 'bg-destructive-background'
        }
    }
});

const summaryTextVariants = cva('text-xs', {
    variants: {
        valid: {
            true: 'text-positive-foreground',
            false: 'text-destructive-foreground'
        }
    }
});

export const TransactionSplitAllocation = ({ entriesAmount, totalAmount }: Props) => {
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);

    const isAllAllocated = entriesAmount === totalAmount;
    const isOverAllocated = entriesAmount > totalAmount;
    const isUnderAllocated = entriesAmount < totalAmount;

    const amountToAllocate = convertToMicroUnits(Math.abs(totalAmount - entriesAmount));

    return (
        <View className={summaryVariants({ valid: isAllAllocated })}>
            {isAllAllocated ? <Icon icon="Check" size={14} className="text-positive-foreground" /> : null}

            <Text className={cn(summaryTextVariants({ valid: isAllAllocated }), 'flex-1')}>
                {isAllAllocated ? <Trans>Allocated</Trans> : null}
                {isOverAllocated ? <Trans>Over:</Trans> : null}
                {isUnderAllocated ? <Trans>Remaining:</Trans> : null}
            </Text>

            {isPositiveNumber(amountToAllocate) ? (
                <Text className={summaryTextVariants({ valid: isAllAllocated })}>{formatMoney(amountToAllocate)}</Text>
            ) : null}
        </View>
    );
};
