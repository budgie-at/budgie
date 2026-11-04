import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { InzhurInstitutionRowDetail } from '../../../inzhur/component/inzhur-institution-row-detail/inzhur-institution-row-detail';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { getBankIntegrationTitle } from '../../utils/get-bank-integration-title.util';
import { AccountCardBalance } from '../account-card-balance/account-card-balance';
import { InstitutionMark } from '../institution-mark/institution-mark';
import { InstitutionRowDetail } from '../institution-row-detail/institution-row-detail';

import { InstitutionRowSelector } from './institution-row.selector';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: InstitutionGroupInterface;
}

const rowVariants = cva('min-h-[64px] gap-x-xl py-lg pr-xl pl-3xl active:scale-100 active:bg-surface-fill', {
    variants: { isStacked: { true: 'gap-y-sm', false: 'flex-row items-center' } }
});

export const InstitutionRow = ({ institution }: Props) => {
    const { integrationId, provider, label, groupNumber, accounts, total } = institution;

    const { t } = useLingui();
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();

    const handlePress = () => void router.push({ pathname: '/institution/[id]', params: { id: String(integrationId) } });

    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const title = getBankIntegrationTitle(isDefined(titleDescriptor) ? t(titleDescriptor) : provider, label, groupNumber);
    const accountsCount = accounts.length;
    const accountsCountLabel = accounts.every(account => account.type === AccountTypeEnum.CRYPTO_SYNC)
        ? t({ message: plural(accountsCount, { one: '# asset', other: '# assets' }) })
        : t({ message: plural(accountsCount, { one: '# account', other: '# accounts' }) });
    const accessibilityLabel = [title, protectAmount(total, defaultInstrument.symbol), accountsCountLabel].join(', ');

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
            className={rowVariants({ isStacked })}
            testID={InstitutionRowSelector.Row(integrationId)}
        >
            <InstitutionMark provider={provider} title={title} />

            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text
                    className="text-[17px] font-semibold text-primary"
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={2}
                >
                    {title}
                </Text>
                {provider === ExternalSourceEnum.INZHUR ? (
                    <InzhurInstitutionRowDetail />
                ) : (
                    <InstitutionRowDetail accounts={accounts} accountsCountLabel={accountsCountLabel} />
                )}
            </View>

            <AccountCardBalance
                title={title}
                balance={total}
                instrumentSymbol={defaultInstrument.symbol}
                testID={InstitutionRowSelector.Total(integrationId)}
            />
        </HapticPressable>
    );
};
