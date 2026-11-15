import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-primary-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { InzhurInstitutionRowDetail } from '../../../inzhur/component/inzhur-institution-row-detail/inzhur-institution-row-detail';
import { getInstitutionTitle } from '../../utils/get-institution-title.util';
import { HoldingProviderCaption } from '../holding-provider-caption/holding-provider-caption';
import { InstitutionRowDetail } from '../institution-row-detail/institution-row-detail';
import { InstitutionRowTrailing } from '../institution-row-trailing/institution-row-trailing';

import { InstitutionRowSelector } from './institution-row.selector';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: InstitutionGroupInterface;
    readonly providerReturnPercent: number | undefined;
    readonly isReturnLoading: boolean;
}

const rowVariants = cva('min-h-[64px] flex-row gap-x-xl pr-xl pl-3xl active:bg-surface-fill', {
    variants: { isStacked: { true: 'items-start py-sm', false: 'items-center py-lg' } }
});

export const InstitutionRow = ({ institution, providerReturnPercent, isReturnLoading }: Props) => {
    const { integrationId, provider, label, groupNumber, accounts, isHoldingProvider } = institution;

    const { t } = useLingui();
    const isStacked = useIsAccessibilityTextSize();

    const handlePress = () => void router.push({ pathname: '/institution/[id]', params: { id: String(integrationId) } });

    const title = getInstitutionTitle(t, provider, label, groupNumber);
    const accountsCountLabel = t({ message: plural(accounts.length, { one: '# account', other: '# accounts' }) });
    const bankName = label ?? title;
    const rowTestID = testID(InstitutionRowSelector.Row(provider === ExternalSourceEnum.MANUAL ? bankName : integrationId));
    const isReturnPending = isHoldingProvider && isReturnLoading && !isDefined(providerReturnPercent);
    const accessibilityState = { busy: isReturnPending };
    const trailing = (
        <InstitutionRowTrailing institution={institution} returnPercent={providerReturnPercent} isReturnPending={isReturnPending} />
    );

    return (
        <HapticPressable
            pressedScale={1}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
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
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    {isStacked ? <ScaledIcon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" /> : null}
                </View>
                {provider === ExternalSourceEnum.INZHUR ? (
                    <InzhurInstitutionRowDetail />
                ) : (
                    <InstitutionRowDetail accounts={accounts}>
                        {isHoldingProvider ? <HoldingProviderCaption institution={institution} /> : accountsCountLabel}
                    </InstitutionRowDetail>
                )}
                {isStacked ? trailing : null}
            </View>

            {isStacked ? null : trailing}
        </HapticPressable>
    );
};
