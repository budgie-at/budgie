import { useLingui } from '@lingui/react/macro';

import { TransactionsPageSelectors } from '../../@e2e/selectors/transactions-page.selector';
import { Page } from '../../@generic/component/page/page';
import { PageHeader } from '../../@generic/component/page-header/page-header';
import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';
import { TransactionList } from '../../transaction/components/transaction-list/transaction-list';

export default function TransactionsPage() {
    const { t } = useLingui();
    const focusKey = useFocusKey();

    return (
        <Page testID={TransactionsPageSelectors.Container} header={<PageHeader className="border-b-0" size="md" title={t`Transactions`} />}>
            <TransactionList focusKey={focusKey} accountId={null} />
        </Page>
    );
}
