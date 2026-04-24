import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { DEBT_SECTION_KIND_LABEL } from '../../constant/debt-section-kind-label.constant';
import { HomeSectionKindEnum } from '../../enum/home-section-kind.enum';
import { useDebtTypeTotalQuery } from '../../query/use-debt-type-total.query';

interface Props {
    readonly sectionKind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
}

const SECTION_KIND_TO_DEBT_TYPE: Record<HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU, AccountDebtTypeEnum> = {
    [HomeSectionKindEnum.DEBT_YOU_OWE]: AccountDebtTypeEnum.BORROW,
    [HomeSectionKindEnum.DEBT_OWED_TO_YOU]: AccountDebtTypeEnum.LENT
};

export const DebtSectionHeader = ({ sectionKind }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();

    const debtType = SECTION_KIND_TO_DEBT_TYPE[sectionKind];
    const total = useDebtTypeTotalQuery(debtType);
    const formattedTotal = formatDigits(total, defaultInstrument.symbol);

    return (
        <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
            <Text className="text-xs uppercase text-secondary-foreground">{t(DEBT_SECTION_KIND_LABEL[sectionKind])}</Text>
            <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
        </View>
    );
};
