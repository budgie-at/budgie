import { ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-primary-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { BrokerageCaptionReturn } from '../../../brokerage/component/brokerage-caption-return/brokerage-caption-return';
import { InzhurInstitutionRowDetail } from '../../../inzhur/component/inzhur-institution-row-detail/inzhur-institution-row-detail';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getInstitutionRowCaption } from '../../utils/get-institution-row-caption.util';
import { getInstitutionTitle } from '../../utils/get-institution-title.util';
import { HoldingProviderCaption } from '../holding-provider-caption/holding-provider-caption';
import { InstitutionRowDetail } from '../institution-row-detail/institution-row-detail';
import { InstitutionRowTrailing } from '../institution-row-trailing/institution-row-trailing';

import { InstitutionRowSelector } from './institution-row.selector';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: InstitutionGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

const rowVariants = cva('min-h-[64px] gap-x-xl pr-lg pl-3xl active:bg-surface-fill', {
    variants: { isStacked: { true: 'gap-y-xxs py-sm', false: 'flex-row items-center py-lg' } }
});

export const InstitutionRow = ({ institution, balancesByAccountId }: Props) => {
    const { integrationId, provider, label, groupNumber, accounts, total, cash, isHoldingProvider } = institution;

    const { t } = useLingui();
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();

    const handlePress = () => void router.push({ pathname: '/institution/[id]', params: { id: String(integrationId) } });

    const title = getInstitutionTitle(t, provider, label, groupNumber);
    const investedLabel = protectAmount(total - cash, defaultInstrument.symbol);
    const caption = getInstitutionRowCaption(t, institution, investedLabel);
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
                <View className="flex-row items-center justify-between gap-x-md">
                    <Text
                        className="shrink text-[17px] font-semibold text-primary"
                        maxFontSizeMultiplier={ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                    {isStacked ? <InstitutionRowTrailing institution={institution} /> : null}
                </View>
                {provider === ExternalSourceEnum.INZHUR ? (
                    <InzhurInstitutionRowDetail />
                ) : (
                    <InstitutionRowDetail accounts={accounts}>
                        {isHoldingProvider ? <HoldingProviderCaption institution={institution} investedLabel={investedLabel} /> : caption}
                        {provider === ExternalSourceEnum.MANUAL ? (
                            <BrokerageCaptionReturn accounts={accounts} balancesByAccountId={balancesByAccountId} />
                        ) : null}
                    </InstitutionRowDetail>
                )}
            </View>

            {isStacked ? null : <InstitutionRowTrailing institution={institution} />}
        </HapticPressable>
    );
};
