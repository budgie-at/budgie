import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';
import { SyncRepairsPageSelector } from '../../../app/(tabs)/settings/sync-repairs-page.selector';
import { getSyncRepairText } from '../../utils/get-sync-repair-text.util';

import type { SyncDuplicateRepairSourcePreviewInterface } from '@budgie/sync';

export const SyncRepairSourceRow = ({ duplicateTransactionCount, externalSource }: SyncDuplicateRepairSourcePreviewInterface) => {
    const { t } = useLingui();
    const sourceDescription = getSyncRepairText(duplicateTransactionCount, t);
    const titleDescriptor = BANK_PROVIDER_TITLE[externalSource];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : externalSource;

    return (
        <GroupedListRow
            testID={SyncRepairsPageSelector.SourceRow(externalSource)}
            left={<BankLogo bankProvider={externalSource} />}
            title={title}
            right={<Text className="text-secondary-foreground text-[17px]">{sourceDescription}</Text>}
        />
    );
};
