/* jscpd:ignore-start */
import { AccountTypeEnum, TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { TransferQuickForm } from '../../../transaction/components/transfer-quick-form/transfer-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';

import type { Edge } from 'react-native-safe-area-context';
/* jscpd:ignore-end */

const SAFE_EDGES: Edge[] = ['top', 'bottom'];

/* jscpd:ignore-start */
export default function CreateTransferTransactionPage() {
    const { t } = useLingui();
    const { generateForTransaction } = useEmbeddingGenerator();
    const { accountId } = useLocalSearchParams<{ accountId?: string }>();

    const parsedAccountId = isDefined(accountId) && isPositiveNumber(Number(accountId)) ? Number(accountId) : null;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: async data => {
            const result = await transactionService.createInternalTransfer(data);
            generateForTransaction({
                title: data.title,
                comment: data.comment,
                mccCategoryId: data.entries[0]?.mccCategoryId ?? null,
                categoryId: data.entries[0]?.categoryId ?? null,
                tagIds: data.tagIds
            });

            return result;
        },
        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
        schema: TransferTransactionCreateInputSchema,
        type: TransactionTypeEnum.TRANSFER,
        fromAccountId: parsedAccountId ?? 0,
        toAccountId: 0
    });

    const [fromAccountId, amount] = useWatch({
        control: form.control,
        name: ['fromAccountId', 'amount']
    });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { balance } = useAccountBalanceQuery(fromAccountId ?? 0);

    const isDebtAccount = account?.type === AccountTypeEnum.DEBT;
    const exceedsDebtBalance = isDebtAccount && amount > balance;

    useEffect(() => {
        if (exceedsDebtBalance) {
            form.setError('amount', { type: 'custom', message: t`Amount exceeds debt account balance` });
        } else {
            form.clearErrors('amount');
        }
    }, [exceedsDebtBalance, form, t]);

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <FullPage header={<PageHeader title={t`New Transfer`} onGoBack={handleGoBack} />} safeEdges={SAFE_EDGES}>
                <TransferQuickForm variant="default" onSubmit={handleSubmit} onCancel={handleGoBack} />
            </FullPage>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
