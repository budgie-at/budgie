/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import {
    ExpenseTransactionCreateInputSchema,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../../@generic/component/form-layout-group/form-layout-group';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../../settings/context/settings.context';
import { TransactionFormAccountSelector } from '../../../../transaction/components/transaction-form-account-selector/transaction-form-account-selector';
import { TransactionFormAmount } from '../../../../transaction/components/transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../../../../transaction/components/transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../../../../transaction/components/transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../../../../transaction/components/transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../../../../transaction/components/transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../../../../transaction/components/transaction-form-tags-field/transaction-form-tags-field';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

interface UpdateExpenseFormProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const UpdateExpenseForm = ({ transaction, transactionId }: UpdateExpenseFormProps) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <Page
                header={
                    <PageHeader
                        title={t`Edit Expense`}
                        description={t`Select Category`}
                        icon={UserIconNameEnum.TrendingDown}
                        iconVariant="destructive"
                        onGoBack={handleGoBack}
                    />
                }
                footer={
                    <TransactionFormFooter
                        variant="destructive"
                        buttonText={t`Update Expense`}
                        onSubmit={handleSubmit}
                        onDelete={handleDelete}
                    />
                }
            >
                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerClassName="pb-7xl"
                    showsVerticalScrollIndicator={false}
                >
                    <TransactionFormAmount instrumentSymbol={instrumentSymbol} variant="destructive" />

                    <FormLayoutGroup>
                        <TransactionFormAccountSelector variant="destructive" fieldName="fromAccountId" />

                        <TransactionFormCategory
                            transactionType={TransactionTypeEnum.EXPENSE}
                            accountId={fromAccountId ?? 0}
                            variant="destructive"
                        />

                        <FormLayoutGroup variant="horizontal">
                            <TransactionFormDateField variant="destructive" />
                            <TransactionFormTagsField variant="destructive" />
                        </FormLayoutGroup>

                        <TransactionFormComment />
                    </FormLayoutGroup>
                </KeyboardAwareScrollView>
            </Page>
        </FormProvider>
    );
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function UpdateExpenseTransactionPage() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateExpenseForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
