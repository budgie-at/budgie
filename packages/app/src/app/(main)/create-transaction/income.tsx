import { IncomeTransactionCreateInputSchema, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionFormAccountSelector } from '../../../transaction/components/transaction-form-account-selector/transaction-form-account-selector';
import { TransactionFormAmount } from '../../../transaction/components/transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../../../transaction/components/transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../../../transaction/components/transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../../../transaction/components/transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../../../transaction/components/transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../../../transaction/components/transaction-form-tags-field/transaction-form-tags-field';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';

export default function CreateIncomeTransactionPage() {
    const { t } = useLingui();
    const { defaultAccount, defaultInstrument } = useSettingsContext();
    const { accountId } = useLocalSearchParams<{ accountId?: string }>();

    const parsedAccountId = isDefined(accountId) && isPositiveNumber(Number(accountId)) ? Number(accountId) : null;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: IncomeTransactionCreateInputSchema,
        toAccountId: parsedAccountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.INCOME,
        fromAccountId: null
    });

    const toAccountId = useWatch({ control: form.control, name: 'toAccountId' });
    const { account } = useGetAccountByIdQuery(toAccountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    const handleGoBack = () => void goBackOrReplace('/');

    /* jscpd:ignore-start */
    return (
        <FormProvider {...form}>
            <Page
                header={
                    <PageHeader
                        title={t`New Income`}
                        description={t`Select Category`}
                        icon={UserIconNameEnum.TrendingUp}
                        iconVariant="positive"
                        onGoBack={handleGoBack}
                    />
                }
                footer={<TransactionFormFooter variant="positive" buttonText={t`Add Income`} onSubmit={handleSubmit} />}
            >
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-7xl" showsVerticalScrollIndicator={false}>
                    <TransactionFormAmount instrumentSymbol={instrumentSymbol} variant="positive" />

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
                </KeyboardAwareScrollView>
            </Page>
        </FormProvider>
    );
    /* jscpd:ignore-end */
}
