import { FormProvider } from 'react-hook-form';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FullPage } from '../../../@generic/component/page/full-page';

import type { UpdateSimpleTransactionPagePropsInterface } from '../../interface/update-simple-transaction-page-props.interface';

export const UpdateSimpleTransactionPage = ({ form, title, children, onGoBack, right }: UpdateSimpleTransactionPagePropsInterface) => (
    <FormProvider {...form}>
        <FullPage header={<PageHeader title={title} onGoBack={onGoBack} right={right} />}>{children}</FullPage>
    </FormProvider>
);
