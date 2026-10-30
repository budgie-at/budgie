import { CategorizeInboxSectionEnum } from '@budgie/categorization';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER } from '../constant/categorize-inbox-transfer-account-filter.constant';
import { useCategorizeInboxContext } from '../context/categorize-inbox.context';
import { CategorizeInboxGroupChoiceEnum } from '../enum/categorize-inbox-group-choice.enum';
import { getCategorizeInboxJarName } from '../utils/get-categorize-inbox-jar-name.util';
import { getCategorizeInboxTransferKey } from '../utils/get-categorize-inbox-transfer-key.util';

import { useCategorizeInboxMatchedAccount } from './use-categorize-inbox-matched-account.hook';

import type { CategorizeInboxGroupChoiceType } from '../interface/categorize-inbox-group-choice.type';
import type { CategorizeInboxGroupOptionsInterface } from '../interface/categorize-inbox-group-options.interface';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

const getLeadChoice = (
    options: Omit<CategorizeInboxGroupOptionsInterface, 'leadChoice' | 'otherLabelOptions'>
): CategorizeInboxGroupChoiceType | null => {
    if (isDefined(options.learnedAccount)) {
        return CategorizeInboxGroupChoiceEnum.LEARNED_TRANSFER;
    }

    if (options.isLeadTransfer) {
        return CategorizeInboxGroupChoiceEnum.TRANSFER;
    }

    if (isNotEmptyArray(options.cashTransactionIds)) {
        return CategorizeInboxGroupChoiceEnum.MOVE_TO_CASH;
    }

    return options.leadLabelOptions.at(0)?.label.id ?? null;
};

export const useCategorizeInboxGroupOptions = (cluster: CategorizeInboxClusterInterface): CategorizeInboxGroupOptionsInterface => {
    const { strategy, learnedTransferAccountIds, cashWithdrawalTransactionIds, includedRows } = useCategorizeInboxContext();
    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);
    const { accounts } = useSearchAccountsSortedQuery('', CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER);

    const jarName = getCategorizeInboxJarName(cluster.displayTitle);
    const learnedAccountId = learnedTransferAccountIds.get(getCategorizeInboxTransferKey(cluster.displayTitle));
    const learnedAccount = accounts.find(account => account.id === learnedAccountId) ?? null;
    const isLearnedMatch = isDefined(matchedAccount) && learnedTransferAccountIds.get(jarName ?? '') === matchedAccount.id;
    const isLeadTransfer = !isLearnedMatch && (isDefined(jarName) || isDefined(matchedAccount));
    const isCash = cluster.section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const isConfident = cluster.section === CategorizeInboxSectionEnum.CONFIDENT;
    const labelOptions = cluster.candidateLabelIds
        .map(labelId => strategy?.labelsById.get(labelId))
        .filter(isDefined)
        .map((label, index) => ({ label, isBestMatch: isConfident && index === 0 }));
    const cashTransactionIds = isCash
        ? includedRows(cluster)
              .map(row => row.transactionId)
              .filter(transactionId => cashWithdrawalTransactionIds.has(transactionId))
        : [];
    const options = {
        learnedAccount,
        isLeadTransfer,
        isCash,
        leadLabelOptions: labelOptions.filter(option => option.isBestMatch),
        cashTransactionIds
    };

    return {
        ...options,
        otherLabelOptions: labelOptions.filter(option => !option.isBestMatch),
        leadChoice: getLeadChoice(options)
    };
};
