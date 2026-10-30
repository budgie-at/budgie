import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { TRANSACTION_INFO_ROW_MAX_FONT_SCALE } from '../../constant/transaction-info-row-max-font-scale.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly footnote?: string;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const TransactionInfoGroup = ({ children, footnote }: Props) => (
    <View className="gap-y-sm">
        <View className="overflow-hidden rounded-3xl bg-transaction-detail-row" style={continuousCorners}>
            <View className="-mt-px">{children}</View>
        </View>
        {isNotEmptyString(footnote) ? (
            <Text
                maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
                className="px-3xl text-[13px] leading-[18px] text-transaction-detail-secondary"
            >
                {footnote}
            </Text>
        ) : null}
    </View>
);
