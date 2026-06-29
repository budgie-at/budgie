import { FormProvider } from 'react-hook-form';

import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateSimpleTransactionPagePropsInterface } from '../../interface/update-simple-transaction-page-props.interface';

export const UpdateSimpleTransactionPage = ({
    form,
    title,
    isConsolidated,
    children,
    onGoBack,
    onDelete,
    onRevert,
    onConvertToRefund,
    onConvertToTransfer
}: UpdateSimpleTransactionPagePropsInterface) => (
    <FormProvider {...form}>
        <FullPage
            header={
                <PageHeader
                    title={title}
                    onGoBack={onGoBack}
                    right={
                        <UpdateTransactionActionsMenu
                            onDelete={onDelete}
                            isConsolidated={isConsolidated}
                            onRevert={onRevert}
                            onConvertToRefund={onConvertToRefund}
                            onConvertToTransfer={onConvertToTransfer}
                        />
                    }
                />
            }
        >
            {children}
        </FullPage>
    </FormProvider>
);
