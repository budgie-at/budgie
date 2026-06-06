import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { DEBT_SECTION_KIND_LABEL } from '../../constant/debt-section-kind-label.constant';
import { HomeSectionKindEnum } from '../../enum/home-section-kind.enum';

interface Props {
    readonly sectionKind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly total: number;
}

export const DebtSectionHeader = ({ sectionKind, total }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();

    const formattedTotal = formatDigits(total, defaultInstrument.symbol);

    return (
        <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
            <Text className="text-xs uppercase text-secondary-foreground">{t(DEBT_SECTION_KIND_LABEL[sectionKind])}</Text>
            <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
        </View>
    );
};
