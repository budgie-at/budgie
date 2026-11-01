import { useAtomValue } from '@effect/atom-react/Hooks';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { toTrueMinus } from '../../../@generic/utils/to-true-minus.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly title: string;
    readonly total: number | null;
    readonly leading?: ReactNode;
    readonly trailing?: ReactNode;
    readonly footer?: ReactNode;
}

export const AccountSectionHeaderFrame = ({ title, total, leading, trailing, footer }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const formattedTotal = isDefined(total) ? toTrueMinus(formatDigits(total, defaultInstrument.symbol)) : null;

    return (
        <View className="-mx-3xl gap-y-md pt-md pb-md pr-[28px] pl-[32px]">
            <StickySectionHeaderBackdrop />
            <View className="flex-row flex-wrap items-center justify-between gap-x-md">
                <View className="min-w-0 shrink flex-row items-center gap-x-sm">
                    {leading}
                    <Text
                        accessibilityRole="header"
                        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                        className="shrink text-lg font-semibold text-primary"
                    >
                        {title}
                    </Text>
                    {trailing}
                </View>
                {isDefined(formattedTotal) ? (
                    <ProtectedText
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        className="text-[15px] font-medium text-secondary-foreground tabular-nums"
                    >
                        {formattedTotal}
                    </ProtectedText>
                ) : null}
            </View>
            {footer}
        </View>
    );
};
