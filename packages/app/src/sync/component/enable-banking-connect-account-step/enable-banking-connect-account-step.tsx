import { EnableBankingSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { EnableBankingConnectAccountRow } from '../enable-banking-connect-account-row/enable-banking-connect-account-row';
import { SyncSetupPage } from '../sync-setup-page/sync-setup-page';

import { EnableBankingConnectAccountStepSelector } from './enable-banking-connect-account-step.selector';

import type { EnableBankingAuthorizationInterface } from '../../interface/enable-banking-authorization.interface';
import type { SyncAccountContinuationChoicesInterface } from '@budgie/sync';

interface Props {
    readonly authorization: Pick<EnableBankingAuthorizationInterface, 'token' | 'accounts' | 'previews'>;
    readonly choices: SyncAccountContinuationChoicesInterface;
}

export const EnableBankingConnectAccountStep = ({ authorization, choices }: Props) => {
    const { t } = useLingui();
    const { token, accounts, previews } = authorization;
    const { formatMonthAndDay } = useFormatDate();
    const { isLoading, run } = useSingleFlight();
    const [selectedExternalId, setSelectedExternalId] = useState(choices.suggestedExternalId);

    const accountHref = { pathname: '/account/[id]/update', params: { id: String(choices.accountId) } } as const;

    const handleGoBack = () => void goBackOrReplace(accountHref);

    const handleConnect = () => {
        const bankAccount = accounts.find(account => account.id === selectedExternalId);
        if (!isDefined(bankAccount)) {
            return;
        }

        void run(
            Effect.flatMap(EnableBankingSyncService, service => service.connectAccount(choices.accountId, token, bankAccount)).pipe(
                Effect.tap(startAt => {
                    const startDay = isDefined(startAt)
                        ? formatMonthAndDay(new Date(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate()))
                        : null;

                    return Effect.sync(() => {
                        Toast.show({
                            type: 'success',
                            text1: isDefined(startDay) ? t`Syncing from ${startDay}` : t`Importing your bank history`
                        });
                        router.dismissTo(accountHref);
                    });
                }),
                toastOnFailure(t`Could not connect the bank`)
            )
        );
    };

    return (
        <SyncSetupPage
            title={t`Choose bank account`}
            onGoBack={handleGoBack}
            footerButton={
                <PillButton
                    label={t`Connect`}
                    onPress={handleConnect}
                    isDisabled={!isDefined(selectedExternalId)}
                    isLoading={isLoading}
                    testID={EnableBankingConnectAccountStepSelector.ConnectButton}
                />
            }
        >
            <GroupedListSection footer={t`The account keeps its history and syncs forward from the day after its last transaction.`}>
                {previews.map(preview => (
                    <EnableBankingConnectAccountRow
                        key={preview.externalId}
                        preview={preview}
                        refusal={choices.refusals.get(preview.externalId) ?? null}
                        isSelected={preview.externalId === selectedExternalId}
                        onSelect={setSelectedExternalId}
                    />
                ))}
            </GroupedListSection>
        </SyncSetupPage>
    );
};
