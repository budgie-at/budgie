import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ListRow } from '../../../@generic/component/list-row/list-row';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { InzhurInstitutionRowDetail } from '../../../inzhur/component/inzhur-institution-row-detail/inzhur-institution-row-detail';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { getBankIntegrationTitle } from '../../utils/get-bank-integration-title.util';
import { AccountCardBalance } from '../account-card-balance/account-card-balance';
import { InstitutionRowDetail } from '../institution-row-detail/institution-row-detail';

import { InstitutionRowSelector } from './institution-row.selector';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: InstitutionGroupInterface;
}

export const InstitutionRow = ({ institution }: Props) => {
    const { integrationId, provider, label, groupNumber, accounts, total } = institution;

    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();

    const handlePress = () => void router.push({ pathname: '/institution/[id]', params: { id: String(integrationId) } });

    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const title = getBankIntegrationTitle(isDefined(titleDescriptor) ? t(titleDescriptor) : provider, label, groupNumber);
    const accountsCount = accounts.length;
    const accountsCountLabel = accounts.every(account => account.type === AccountTypeEnum.CRYPTO_SYNC)
        ? t({ message: plural(accountsCount, { one: '# asset', other: '# assets' }) })
        : t({ message: plural(accountsCount, { one: '# account', other: '# accounts' }) });
    const bankName = label ?? title;
    const accessibilityLabel = [title, protectAmount(total, defaultInstrument.symbol), accountsCountLabel].join(', ');

    const detail =
        provider === ExternalSourceEnum.INZHUR ? (
            <InzhurInstitutionRowDetail />
        ) : (
            <InstitutionRowDetail accounts={accounts} accountsCountLabel={accountsCountLabel} />
        );

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
            className="min-h-[64px] px-3xl py-lg active:scale-100 active:bg-surface-fill"
            testID={InstitutionRowSelector.Row(integrationId)}
        >
            <ListRow
                leading={<BankLogo bankProvider={provider} bankName={bankName} size={44} />}
                title={
                    <Text
                        className="text-[17px] font-semibold text-primary"
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                }
                trailing={
                    <AccountCardBalance
                        title={title}
                        balance={total}
                        instrumentSymbol={defaultInstrument.symbol}
                        testID={InstitutionRowSelector.Total(integrationId)}
                    />
                }
                detail={detail}
            />
        </HapticPressable>
    );
};
