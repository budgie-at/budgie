import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-primary-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { InstitutionRowSelector } from '../institution-row/institution-row.selector';

interface Props {
    readonly integrationId: number;
    readonly total: number;
    readonly returnPercent: number | undefined;
    readonly isReturnLoading: boolean;
}

const PLACEHOLDER_PERCENT = 0.9999;

const trailingVariants = cva('flex-row items-center gap-x-xl', {
    variants: { isStacked: { true: '', false: 'max-w-[48%] shrink-0' } }
});

const amountVariants = cva('shrink gap-y-xxs', {
    variants: { isStacked: { true: 'items-start', false: 'items-end' } }
});

export const InstitutionRowHoldingTotal = ({ integrationId, total, returnPercent, isReturnLoading }: Props) => {
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const isReturnPending = isReturnLoading && !isDefined(returnPercent);
    const isReturnEmpty = !isReturnPending && !isDefined(returnPercent);
    const importantForAccessibility = isReturnEmpty ? 'no-hide-descendants' : 'auto';

    return (
        <View className={trailingVariants({ isStacked })}>
            <View className={amountVariants({ isStacked })}>
                <ProtectedText
                    className="text-[17px] font-semibold tracking-tight tabular-nums text-primary"
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    numberOfLines={1}
                    maxFontSizeMultiplier={ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER}
                    testID={InstitutionRowSelector.Total(integrationId)}
                >
                    {formatDigits(total, defaultInstrument.symbol)}
                </ProtectedText>
                <View
                    className={cn(isReturnEmpty && 'opacity-0')}
                    accessibilityElementsHidden={isReturnEmpty}
                    importantForAccessibility={importantForAccessibility}
                >
                    <LoadingContent isLoading={isReturnPending} loadingIndicator={null}>
                        <BrokerageReturnText
                            gain={null}
                            percent={returnPercent ?? PLACEHOLDER_PERCENT}
                            instrumentSymbol={defaultInstrument.symbol}
                            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        />
                    </LoadingContent>
                </View>
            </View>
            {isStacked ? null : <ScaledIcon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />}
        </View>
    );
};
