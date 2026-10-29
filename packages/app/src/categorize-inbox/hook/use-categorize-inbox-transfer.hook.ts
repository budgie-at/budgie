import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { getCategorizeInboxJarName } from '../utils/get-categorize-inbox-jar-name.util';

import { useCategorizeInboxCommitTransfer } from './use-categorize-inbox-commit-transfer.hook';

import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxPendingTransferInterface } from '../interface/categorize-inbox-pending-transfer.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxEnqueueWriteType } from '../type/categorize-inbox-enqueue-write.type';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const useCategorizeInboxTransfer = (
    visibility: Pick<CategorizeInboxVisibilityInterface, 'hideTransactions' | 'showTransactions' | 'includedRows'>,
    enqueueWrite: CategorizeInboxEnqueueWriteType,
    setLastWrite: (lastWrite: CategorizeInboxLastWriteInterface | null) => void,
    resetMovedToCash: () => void
) => {
    const commitTransfer = useCategorizeInboxCommitTransfer(visibility, enqueueWrite);
    const pendingTransferRef = useRef<CategorizeInboxPendingTransferInterface | null>(null);
    const [pendingTransfer, setPendingTransfer] = useState<CategorizeInboxPendingTransferInterface | null>(null);
    const [learnedTransferAccountIds, setLearnedTransferAccountIds] = useState<ReadonlyMap<string, number>>(new Map());

    const storePendingTransfer = (value: CategorizeInboxPendingTransferInterface | null): void => {
        pendingTransferRef.current = value;
        setPendingTransfer(value);
    };

    const commitPendingTransfer = (): void => {
        const pending = pendingTransferRef.current;

        if (isDefined(pending)) {
            storePendingTransfer(null);
            commitTransfer(pending);
        }
    };

    const transferCluster = (
        cluster: CategorizeInboxClusterInterface,
        accountId: number,
        accountTitle: string,
        isRuleEnabled: boolean
    ): void => {
        const transactionIds = visibility.includedRows(cluster).map(row => row.transactionId);

        if (isNotEmptyArray(transactionIds)) {
            const jarName = getCategorizeInboxJarName(cluster.displayTitle);

            commitPendingTransfer();
            visibility.hideTransactions(transactionIds);

            if (isDefined(jarName)) {
                setLearnedTransferAccountIds(previous => new Map(previous).set(jarName, accountId));
            }

            setLastWrite(null);
            resetMovedToCash();
            storePendingTransfer({
                clusterKey: cluster.key,
                clusterTitle: cluster.displayTitle,
                ruleConditionValue: cluster.ruleConditionValue,
                accountId,
                accountTitle,
                transactionIds,
                isRuleEnabled
            });
        }
    };

    const undoTransfer = (): void => {
        const pending = pendingTransferRef.current;

        if (isDefined(pending)) {
            const jarName = getCategorizeInboxJarName(pending.clusterTitle);

            storePendingTransfer(null);
            visibility.showTransactions(pending.transactionIds);

            if (isDefined(jarName)) {
                setLearnedTransferAccountIds(previous => new Map([...previous].filter(([name]) => name !== jarName)));
            }
        }
    };

    const handleUnmount = useEffectEvent(commitPendingTransfer);

    useEffect(() => () => void handleUnmount(), []);

    return { pendingTransfer, learnedTransferAccountIds, transferCluster, undoTransfer, commitPendingTransfer };
};
