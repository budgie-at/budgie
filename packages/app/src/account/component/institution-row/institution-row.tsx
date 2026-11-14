import { ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { InzhurInstitutionRowDetail } from '../../../inzhur/component/inzhur-institution-row-detail/inzhur-institution-row-detail';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getInstitutionRowCaption } from '../../utils/get-institution-row-caption.util';
import { getInstitutionTitle } from '../../utils/get-institution-title.util';
import { InstitutionRowCash } from '../institution-row-cash/institution-row-cash';
import { InstitutionRowDetail } from '../institution-row-detail/institution-row-detail';
import { InstitutionRowTotal } from '../institution-row-total/institution-row-total';

import { InstitutionRowSelector } from './institution-row.selector';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: InstitutionGroupInterface;
}

const rowVariants = cva('min-h-[64px] gap-x-xl pr-lg pl-3xl active:bg-surface-fill', {
    variants: { isStacked: { true: 'gap-y-xxs py-sm', false: 'flex-row items-center py-lg' } }
});
const trailingVariants = cva('', {
    variants: { isStacked: { true: 'absolute top-[6px] right-[10px] h-[44px] justify-center', false: '' } }
});

export const InstitutionRow = ({ institution }: Props) => {
    const { integrationId, provider, label, groupNumber, accounts, total, cash, isHoldingProvider } = institution;

    const { t } = useLingui();
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();

    const handlePress = () => void router.push({ pathname: '/institution/[id]', params: { id: String(integrationId) } });

    const title = getInstitutionTitle(t, provider, label, groupNumber);
    const caption = getInstitutionRowCaption(t, institution, protectAmount(total - cash, defaultInstrument.symbol));
    const bankName = label ?? title;
    const cashLabel = protectAmount(cash, defaultInstrument.symbol);
    const amountLabel = isHoldingProvider ? t`${cashLabel} cash` : protectAmount(total, defaultInstrument.symbol);
    const rowTestID = testID(InstitutionRowSelector.Row(provider === ExternalSourceEnum.MANUAL ? bankName : integrationId));
    const accessibilityLabel = [title, caption, amountLabel].join(', ');

    return (
        <HapticPressable
            pressedScale={1}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
            className={rowVariants({ isStacked })}
            {...rowTestID}
        >
            <BankLogo bankProvider={provider} bankName={bankName} size={44} />

            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text
                    className="text-[17px] font-semibold text-primary"
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={2}
                >
                    {title}
                </Text>
                {provider === ExternalSourceEnum.INZHUR ? (
                    <InzhurInstitutionRowDetail />
                ) : (
                    <InstitutionRowDetail accounts={accounts} accountsCountLabel={caption} />
                )}
            </View>

            <View className={trailingVariants({ isStacked })}>
                {isHoldingProvider ? (
                    <InstitutionRowCash integrationId={integrationId} cash={cash} />
                ) : (
                    <InstitutionRowTotal integrationId={integrationId} total={total} />
                )}
            </View>
        </HapticPressable>
    );
};
