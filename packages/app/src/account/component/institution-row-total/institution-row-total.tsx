import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { toTrueMinus } from '../../../@generic/utils/to-true-minus.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { InstitutionRowSelector } from '../institution-row/institution-row.selector';

interface Props {
    readonly integrationId: number;
    readonly total: number;
}

export const InstitutionRowTotal = ({ integrationId, total }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const formattedTotal = toTrueMinus(formatDigits(total, defaultInstrument.symbol));
    const isZeroTotal = formattedTotal === formatDigits(0, defaultInstrument.symbol);
    const toneClassName = cn(
        isZeroTotal && 'text-secondary-foreground',
        !isZeroTotal && total < 0 && 'text-destructive-foreground',
        !isZeroTotal && total > 0 && 'text-primary'
    );

    return (
        <View className="flex-row items-center gap-x-xs">
            <ProtectedText
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                className={cn('text-[17px] font-semibold tracking-tight tabular-nums', toneClassName)}
                testID={InstitutionRowSelector.Total(integrationId)}
            >
                {formattedTotal}
            </ProtectedText>
            <ScaledIcon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </View>
    );
};
