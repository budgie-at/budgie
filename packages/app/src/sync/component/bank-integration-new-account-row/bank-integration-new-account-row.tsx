import { UserIconNameEnum } from '@budgie/contracts';
import { MonobankSyncService, SyncAccountTypeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { DEFAULT_SYNC_HISTORY_DEPTH } from '../../constant/sync-history-depth-options.constant';
import { useBankIntegration } from '../../context/bank-integration.context';
import { getAccountIdentityLabel } from '../../utils/get-account-identity-label.util';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props {
    readonly preview: Pick<SyncAccountPreviewInterface, 'externalId' | 'title' | 'currencyCode' | 'iban' | 'type'>;
}

export const BankIntegrationNewAccountRow = ({ preview }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const { isLoading: isStarting, run } = useSingleFlight();

    const rowTestID = BankIntegrationSelector.NewAccountRow(preview.externalId);
    const description = getAccountIdentityLabel(preview.currencyCode, preview.iban);
    const icon = preview.type === SyncAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Wallet;
    const handleToggle = () =>
        void run(
            Effect.flatMap(MonobankSyncService, monobankSyncService =>
                monobankSyncService.setupAccountSyncBatch(integration.token, [preview.externalId], DEFAULT_SYNC_HISTORY_DEPTH)
            ).pipe(toastOnFailure(t`Could not start syncing`))
        );

    return (
        <SimpleHorizontalCell
            testID={rowTestID}
            singleLine
            left={<CircleIcon icon={icon} variant="ghost" size={46} iconSize={20} border={false} />}
            title={preview.title}
            description={description}
            right={
                <ThemedSwitch
                    value={isStarting}
                    disabled={isStarting}
                    onValueChange={handleToggle}
                    accessibilityLabel={t`Sync`}
                    {...testID(rowTestID, TestIDPartEnum.TOGGLE)}
                />
            }
        />
    );
};
