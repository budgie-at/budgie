import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { SyncProviderRegistryService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { toTrueMinus } from '../../../@generic/utils/to-true-minus.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { AccountCardBaseSelector } from '../../../account/component/account-card-base/account-card-base.selector';
import { AccountSyncBadge } from '../../../account/component/account-sync-badge/account-sync-badge';
import { AccountSyncStateEnum } from '../../../account/enum/account-sync-state.enum';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountRowState } from '../../hook/use-bank-integration-account-row-state.hook';
import { BankIntegrationAccountMenu } from '../bank-integration-account-menu/bank-integration-account-menu';

interface Props {
    readonly account: Pick<
        AccountWithInstrumentEntityInterface,
        'id' | 'title' | 'icon' | 'isActive' | 'iban' | AccountAssociationEnum.INSTRUMENT
    >;
}

export const BankIntegrationAccountRow = ({ account }: Props) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(account.id);
    const formatDigits = useDisplayFormatDigits();
    const formatAmount = useFormatInstrumentAmount();
    const { integration, capabilities } = useBankIntegration();
    const { sync, isFailed, leadLabel, switchLabel, isToggleVisible } = useBankIntegrationAccountRowState(account);

    const rowTestID = BankIntegrationSelector.AccountRow(account.id);
    const accountIcon =
        capabilities.supportsFileImport || integration.provider === ExternalSourceEnum.ENABLE_BANKING ? (
            <BankLogo bankProvider={integration.provider} size={36} bankName={integration.label} />
        ) : (
            <CircleIcon
                icon={account.icon}
                variant="primary"
                size={36}
                iconSize={18}
                radius={18}
                border={false}
                className={TONAL_DISC_BACKGROUND.primary}
            />
        );
    const handleToggle = (enabled: boolean) =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(SyncProviderRegistryService, registry => registry.setAccountSyncEnabled(account.id, enabled)).pipe(
                    toastOnFailure(t`Could not update setting`)
                )
            )
        );
    const leadText = isNotEmptyString(leadLabel) ? `${leadLabel} · ` : '';

    const toggle = isToggleVisible ? (
        <ThemedSwitch
            value={sync?.enabled ?? false}
            onValueChange={handleToggle}
            accessibilityLabel={switchLabel}
            {...testID(rowTestID, TestIDPartEnum.TOGGLE)}
        />
    ) : null;

    return (
        <View testID={rowTestID} className="min-h-[60px] flex-row items-center gap-x-xl px-3xl">
            <View className="absolute top-0 left-[64px] right-0 h-hairline bg-surface-separator" pointerEvents="none" />
            <View className="relative">
                {accountIcon}
                {isFailed ? <AccountSyncBadge state={AccountSyncStateEnum.FAILED} /> : null}
            </View>
            <View className="min-w-0 flex-1 gap-y-xxs py-lg">
                <Text className="text-[17px] text-primary" numberOfLines={2}>
                    {account.title}
                </Text>
                {isFailed ? <Text className="text-destructive-strong text-[13px] leading-[18px]">{t`Sync failed`}</Text> : null}
                <View className="flex-row">
                    <Text
                        className="shrink text-[13px] leading-[18px] text-secondary-foreground"
                        numberOfLines={1}
                        accessibilityLabel={leadLabel}
                    >
                        {leadText}
                    </Text>
                    <ProtectedText
                        className="shrink-0 text-[13px] leading-[18px] text-secondary-foreground"
                        testID={AccountCardBaseSelector.Balance(account.title, formatDigits(balance))}
                    >
                        {toTrueMinus(formatAmount(balance, account.instrument.symbol, account.instrument.type))}
                    </ProtectedText>
                </View>
            </View>
            <View className="-ml-[8px] flex-row items-center gap-x-xs">
                <BankIntegrationAccountMenu accountId={account.id} title={account.title} rowTestID={rowTestID}>
                    <CircleIcon
                        icon={UserIconNameEnum.Ellipsis}
                        variant="ghost"
                        size={28}
                        iconSize={18}
                        radius={14}
                        border={false}
                        className={TONAL_DISC_BACKGROUND.ghost}
                        iconClassName="text-secondary-foreground"
                    />
                </BankIntegrationAccountMenu>
                {toggle}
            </View>
        </View>
    );
};
