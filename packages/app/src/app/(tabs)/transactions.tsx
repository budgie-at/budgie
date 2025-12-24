import { useLingui } from '@lingui/react/macro';

import { Page } from '../../@generic/component/page/page';
import { PageHeader } from '../../@generic/component/page-header/page-header';
import { TransactionList } from '../../transaction/components/transaction-list/transaction-list';

export default function TransactionsPage() {
    const { t } = useLingui();

    return (
        <Page header={<PageHeader className="border-b-0" size="md" title={t`Transactions`} />}>
            <TransactionList accountId={null} />
        </Page>
    );
}
