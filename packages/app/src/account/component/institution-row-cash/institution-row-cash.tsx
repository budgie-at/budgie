import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { toTrueMinus } from '../../../@generic/utils/to-true-minus.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { InstitutionRowSelector } from '../institution-row/institution-row.selector';

interface Props {
    readonly integrationId: number;
    readonly cash: number;
}

export const InstitutionRowCash = ({ integrationId, cash }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const formattedCash = toTrueMinus(formatDigits(cash, defaultInstrument.symbol));
    const hasCash = formattedCash.replace(/^−/u, '') !== formatDigits(0, defaultInstrument.symbol);

    return (
        <View className="flex-row items-center gap-x-xs">
            {hasCash ? (
                <View className="shrink items-end">
                    <ProtectedText
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                        className="text-[15px] font-medium tracking-tight tabular-nums text-secondary-foreground"
                        testID={InstitutionRowSelector.Total(integrationId)}
                    >
                        {formattedCash}
                    </ProtectedText>
                    <Text className="text-[12px] text-secondary-foreground" maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                        <Trans context="Brokerage cash account">Cash</Trans>
                    </Text>
                </View>
            ) : null}
            <ScaledIcon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </View>
    );
};
