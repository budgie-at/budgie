/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { IncomeTransactionCreateInputSchema, TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { BlurScrollView } from '../../../../@generic/component/blur-scroll-view/blur-scroll-view';
import { FormLayoutGroup } from '../../../../@generic/component/form-layout-group/form-layout-group';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../../settings/context/settings.context';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { TransactionFormAccountSelector } from '../../../../transaction/components/transaction-form-account-selector/transaction-form-account-selector';
import { TransactionFormAmount } from '../../../../transaction/components/transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../../../../transaction/components/transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../../../../transaction/components/transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../../../../transaction/components/transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../../../../transaction/components/transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../../../../transaction/components/transaction-form-tags-field/transaction-form-tags-field';
import { TransactionMccInfoField } from '../../../../transaction/components/transaction-mcc-info-field/transaction-mcc-info-field';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

interface UpdateIncomeFormProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const UpdateIncomeForm = ({ transaction, transactionId }: UpdateIncomeFormProps) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: IncomeTransactionCreateInputSchema,
        id: transactionId
    });

    const toAccountId = useWatch({ control: form.control, name: 'toAccountId' });
    const { account } = useGetAccountByIdQuery(toAccountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <Page
                header={
                    <PageHeader title={t`Edit Income`} onGoBack={handleGoBack} right={<TransactionActionsMenu onDelete={handleDelete} />} />
                }
                footer={<TransactionFormFooter variant="positive" buttonText={t`Update Income`} onSubmit={handleSubmit} />}
                withBlur
            >
                <BlurScrollView>
                    <TransactionFormAmount instrumentSymbol={instrumentSymbol} variant="positive" />

                    {isDefined(transaction.entries[0]?.mccCategory) ? (
                        <TransactionMccInfoField mccCategory={transaction.entries[0].mccCategory} />
                    ) : null}

                    <FormLayoutGroup>
                        <TransactionFormAccountSelector variant="positive" fieldName="toAccountId" />

                        <TransactionFormCategory
                            transactionType={TransactionTypeEnum.INCOME}
                            accountId={toAccountId ?? 0}
                            variant="positive"
                        />

                        <FormLayoutGroup variant="horizontal">
                            <TransactionFormDateField variant="positive" />
                            <TransactionFormTagsField variant="positive" />
                        </FormLayoutGroup>

                        <TransactionFormComment />
                    </FormLayoutGroup>
                </BlurScrollView>
            </Page>
        </FormProvider>
    );
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function UpdateIncomeTransactionPage() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateIncomeForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
