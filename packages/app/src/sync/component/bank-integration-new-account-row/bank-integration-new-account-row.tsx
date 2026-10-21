import { MonobankSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isNotEmptyString } from '@rnw-community/shared';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { DEFAULT_SYNC_HISTORY_DEPTH } from '../../constant/sync-history-depth-options.constant';
import { useBankIntegration } from '../../context/bank-integration.context';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props {
    readonly preview: Pick<SyncAccountPreviewInterface, 'externalId' | 'title' | 'currencyCode' | 'iban'>;
}

export const BankIntegrationNewAccountRow = ({ preview }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [runEffect, isStarting] = useEffectAction(t`Could not start syncing`);

    const rowTestID = BankIntegrationSelector.NewAccountRow(preview.externalId);
    const description = isNotEmptyString(preview.iban) ? `${preview.currencyCode} • ${preview.iban}` : preview.currencyCode;
    const handleToggle = () =>
        void runEffect(
            Effect.flatMap(MonobankSyncService, monobankSyncService =>
                monobankSyncService.setupAccountSyncBatch(integration.token, [preview.externalId], DEFAULT_SYNC_HISTORY_DEPTH)
            )
        );

    return (
        <SimpleHorizontalCell
            testID={rowTestID}
            singleLine
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
