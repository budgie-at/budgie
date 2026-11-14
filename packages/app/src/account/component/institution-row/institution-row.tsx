import { ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-primary-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { InzhurInstitutionRowDetail } from '../../../inzhur/component/inzhur-institution-row-detail/inzhur-institution-row-detail';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getInstitutionTitle } from '../../utils/get-institution-title.util';
import { HoldingProviderCaption } from '../holding-provider-caption/holding-provider-caption';
import { InstitutionRowDetail } from '../institution-row-detail/institution-row-detail';
import { InstitutionRowTrailing } from '../institution-row-trailing/institution-row-trailing';

import { InstitutionRowSelector } from './institution-row.selector';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: InstitutionGroupInterface;
    readonly providerReturnPercent: number | undefined;
}

const rowVariants = cva('min-h-[64px] gap-x-xl pr-lg pl-3xl active:bg-surface-fill', {
    variants: { isStacked: { true: 'gap-y-xs py-sm', false: 'flex-row items-center py-lg' } }
});

export const InstitutionRow = ({ institution, providerReturnPercent }: Props) => {
    const { integrationId, provider, label, groupNumber, accounts, total, cash, isHoldingProvider } = institution;

    const { t } = useLingui();
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();

    const handlePress = () => void router.push({ pathname: '/institution/[id]', params: { id: String(integrationId) } });

    const title = getInstitutionTitle(t, provider, label, groupNumber);
    const investedLabel = protectAmount(total - cash, defaultInstrument.symbol);
    const accountsCountLabel = t({ message: plural(accounts.length, { one: '# account', other: '# accounts' }) });
    const bankName = label ?? title;
    const rowTestID = testID(InstitutionRowSelector.Row(provider === ExternalSourceEnum.MANUAL ? bankName : integrationId));

    return (
        <HapticPressable
            pressedScale={1}
            accessibilityRole="button"
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
                        {isHoldingProvider ? (
                            <HoldingProviderCaption institution={institution} investedLabel={investedLabel} />
                        ) : (
                            accountsCountLabel
                        )}
                        {isDefined(providerReturnPercent) ? (
                            <Text>
                                {' · '}
                                <BrokerageReturnText
                                    gain={null}
                                    percent={providerReturnPercent}
                                    instrumentSymbol={defaultInstrument.symbol}
                                    maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                                />
                            </Text>
                        ) : null}
                    </InstitutionRowDetail>
                )}
            </View>

            {isStacked ? null : <InstitutionRowTrailing institution={institution} />}
        </HapticPressable>
    );
};
