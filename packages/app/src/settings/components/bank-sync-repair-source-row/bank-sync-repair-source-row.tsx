import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';
import { BankSyncRepairsPageSelector } from '../../../app/(tabs)/settings/bank-sync-repairs-page.selector';
import { getBankSyncRepairText } from '../../utils/get-bank-sync-repair-text.util';

import type { BankSyncDuplicateRepairSourcePreviewInterface } from '../../../sync/interface/bank-sync-duplicate-repair-source-preview.interface';

export const BankSyncRepairSourceRow = ({ duplicateTransactionCount, externalSource }: BankSyncDuplicateRepairSourcePreviewInterface) => {
    const { t } = useLingui();
    const sourceDescription = getBankSyncRepairText(duplicateTransactionCount, t);
    const titleDescriptor = BANK_PROVIDER_TITLE[externalSource];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : externalSource;

    return (
        <SimpleHorizontalCell
            size="lg"
            testID={BankSyncRepairsPageSelector.SourceRow(externalSource)}
            left={<BankLogo bankProvider={externalSource} />}
            title={title}
            description={sourceDescription}
        />
    );
};
