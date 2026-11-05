import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE } from '../../constant/voice-review-accessibility-font-scale.constant';

import { VoiceReviewFooterSelector } from './voice-review-footer.selector';

const TABULAR_NUMS_STYLE = { fontVariant: ['tabular-nums' as const] };

interface Props {
    readonly count: number;
    readonly isSaving: boolean;
    readonly totalAmount: number;
    readonly currencySymbol: string;
    readonly onCancel: () => void;
    readonly onReRecord: () => void;
    readonly children: ReactNode;
}

export const VoiceReviewFooter = (props: Props) => {
    const { count, isSaving, totalAmount, currencySymbol, onCancel, onReRecord, children } = props;
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const formatDigits = useDisplayFormatDigits();
    const reRecordIconProps = fontScale < VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE ? { leftIcon: UserIconNameEnum.RefreshCw } : {};
    const reRecordVariant = isPositiveNumber(count) ? 'secondary' : 'cta';
    const actionLayoutClassName = fontScale >= VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE ? 'flex-col gap-y-md' : 'flex-row gap-x-md';
    const actionClassName = fontScale >= VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE ? 'min-h-[44px] px-md' : 'flex-1 min-h-[44px] px-md';
    const totalLabel = formatDigits(totalAmount, `${currencySymbol} `);

    return (
        <View className="border-t border-surface-separator bg-surface px-lg pt-lg pb-safe-or-[16px]">
            {isPositiveNumber(count) ? (
                <View className="mb-lg flex-row flex-wrap gap-x-lg gap-y-xs items-baseline justify-between">
                    <Text className="text-md text-secondary-foreground">{t`Total`}</Text>
                    <Text className="text-2xl font-semibold text-primary" style={TABULAR_NUMS_STYLE}>
                        {totalLabel}
                    </Text>
                </View>
            ) : null}

            <View className={actionLayoutClassName}>
                <Button
                    variant="ghost"
                    content={t`Cancel`}
                    onPress={onCancel}
                    disabled={isSaving}
                    className={cn(actionClassName, 'border-transparent bg-transparent')}
                    testID={VoiceReviewFooterSelector.CancelButton}
                />
                <Button
                    variant={reRecordVariant}
                    {...reRecordIconProps}
                    content={t`Re-record`}
                    onPress={onReRecord}
                    disabled={isSaving}
                    className={actionClassName}
                    testID={VoiceReviewFooterSelector.ReRecordButton}
                />
            </View>

            {isPositiveNumber(count) ? <View className="mt-md">{children}</View> : null}
        </View>
    );
};
