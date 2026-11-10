import { exec, type SimlockApi } from '@mobile-ci/e2e-simlock/exec';
import { expect } from 'e2e';

import { createEntityFromTransaction } from '../budgie/categories.ts';
import { byId, expectId, openLink, scrollTo, sleep, tapId, type Ctx } from '../budgie/core.ts';

/**
 * Steps only the media scenes and fixture builders take, each the port of the
 * subflow named in its doc comment (the PR suite no longer walks them).
 */

/** subflows/transactions/open-convert-to-refund-picker */
export async function openConvertToRefundPicker(ctx: Ctx, transactionId: number, candidateRowId: string): Promise<void> {
    await openLink(ctx, `budgie://transactions/${transactionId}/income`);
    await expectId(ctx, 'TransactionInfo.Page', 15_000);
    await scrollTo(ctx, 'TransactionInfo.ConvertButton');
    await sleep(400);
    await tapId(ctx, 'TransactionInfo.ConvertButton');
    await expectId(ctx, 'TransactionActionsMenu.ConvertToRefundButton', 5_000);
    await tapId(ctx, 'TransactionActionsMenu.ConvertToRefundButton');
    await expectId(ctx, candidateRowId, 15_000);
}

/** subflows/transactions/open-split-entries */
export async function openSplitEntries(ctx: Ctx, transactionId: number, lastRowId: string): Promise<void> {
    await openLink(ctx, `budgie://transactions/${transactionId}/expense/edit`);
    await expectId(ctx, 'TransactionFieldIcon.Split', 15_000);
    await tapId(ctx, 'TransactionFieldIcon.Split');
    await expectId(ctx, lastRowId, 10_000);
}

/** subflows/installment/open-convert-to-installment */
export async function openConvertToInstallment(ctx: Ctx, transactionId: number): Promise<void> {
    await openLink(ctx, `budgie://transactions/${transactionId}/expense`);
    await expectId(ctx, 'TransactionInfo.Page', 15_000);
    await scrollTo(ctx, 'TransactionInfo.ConvertButton');
    await sleep(400);
    await tapId(ctx, 'TransactionInfo.ConvertButton');
    await tapId(ctx, 'TransactionActionsMenu.ConvertToInstallmentButton');
    await expectId(ctx, 'ConvertToInstallment.Page', 10_000);
}

/** subflows/installment/create-installment-plan */
export async function createInstallmentPlan(ctx: Ctx, transactionId: number, progressId: string): Promise<void> {
    await openConvertToInstallment(ctx, transactionId);
    await tapId(ctx, 'ConvertToInstallment.CreateButton');
    await expectId(ctx, progressId, 15_000);
}

/** subflows/tags/create-tag-from-transaction */
export async function createTagFromTransaction(ctx: Ctx, name: string): Promise<void> {
    await createEntityFromTransaction(
        ctx,
        {
            selector: 'TransactionForm.TagsSelector',
            pickerInput: 'TagPickerBottomSheet.Input',
            createButton: 'TagPickerBottomSheet.CreateButton',
            formInput: 'TagForm.Input',
            submit: 'TagForm.Submit'
        },
        name
    );
    await expect(byId(ctx.screen, 'TagForm.Input')).toBeHidden();
}

export const shellQuote = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

/**
 * A POSIX shell script on the farm worker, for what E2EDrop cannot do (read
 * a file back, the Mac's time zone). Works only on hosts whose CoreSimulator
 * still spawns the Mac's own /bin/sh (macOS 15).
 */
export async function workerShell(api: SimlockApi, leaseId: string, script: string): Promise<string> {
    const result = await exec(api, leaseId, ['spawn', '/bin/sh', '-c', script]);
    if (result.exitCode !== 0) throw new Error(`worker shell exited ${result.exitCode}: ${result.stderr.trim()}`);
    return result.stdout;
}
