import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';
import { SyncRepairsPageSelector } from '../../../app/(tabs)/settings/sync-repairs-page.selector';
import { getSyncRepairText } from '../../utils/get-sync-repair-text.util';

import type { SyncDuplicateRepairSourcePreviewInterface } from '../../../sync/interface/sync-duplicate-repair-source-preview.interface';

export const SyncRepairSourceRow = ({ duplicateTransactionCount, externalSource }: SyncDuplicateRepairSourcePreviewInterface) => {
    const { t } = useLingui();
    const sourceDescription = getSyncRepairText(duplicateTransactionCount, t);
    const titleDescriptor = BANK_PROVIDER_TITLE[externalSource];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : externalSource;

    return (
        <SimpleHorizontalCell
            size="lg"
            testID={SyncRepairsPageSelector.SourceRow(externalSource)}
            left={<BankLogo bankProvider={externalSource} />}
            title={title}
            description={sourceDescription}
        />
    );
};
