import { useLingui } from '@lingui/react/macro';

import { Page } from '../../@generic/component/page/page';
import { PageHeader } from '../../@generic/component/page-header/page-header';
import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';
import { TransactionList } from '../../transaction/components/transaction-list/transaction-list';

export default function TransactionsPage() {
    const { t } = useLingui();
    const focusKey = useFocusKey();

    return (
        <Page header={<PageHeader className="border-b-0" size="md" title={t`Transactions`} />}>
            <TransactionList focusKey={focusKey} accountId={null} />
        </Page>
    );
}
