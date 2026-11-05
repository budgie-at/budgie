import { TransactionInfoPage } from '../../../transaction/components/transaction-info-page/transaction-info-page';
import { RecurringDetailContent } from '../recurring-detail-content/recurring-detail-content';
import { RecurringDetailGuard } from '../recurring-detail-guard/recurring-detail-guard';

export const RecurringDetailRoute = () => (
    <RecurringDetailGuard>
        {detail => (
            <TransactionInfoPage>
                <RecurringDetailContent detail={detail} />
            </TransactionInfoPage>
        )}
    </RecurringDetailGuard>
);
