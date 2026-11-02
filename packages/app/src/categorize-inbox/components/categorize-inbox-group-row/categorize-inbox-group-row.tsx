import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxCardRow } from '../categorize-inbox-card-row/categorize-inbox-card-row';
import { CategorizeInboxGroupRowActionPill } from '../categorize-inbox-group-row-action-pill/categorize-inbox-group-row-action-pill';
import { CategorizeInboxGroupRowBody } from '../categorize-inbox-group-row-body/categorize-inbox-group-row-body';
import { CategorizeInboxGroupRowCashButton } from '../categorize-inbox-group-row-cash-button/categorize-inbox-group-row-cash-button';
import { CategorizeInboxGroupRowColumnsOverlay } from '../categorize-inbox-group-row-columns-overlay/categorize-inbox-group-row-columns-overlay';
import { CategorizeInboxGroupRowFileButton } from '../categorize-inbox-group-row-file-button/categorize-inbox-group-row-file-button';
import { CategorizeInboxGroupRowGhost } from '../categorize-inbox-group-row-ghost/categorize-inbox-group-row-ghost';
import { CategorizeInboxMerchantBadge } from '../categorize-inbox-merchant-badge/categorize-inbox-merchant-badge';

import { CategorizeInboxGroupRowSelector } from './categorize-inbox-group-row.selector';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly position: TransactionListRowPositionEnum;
}

export const CategorizeInboxGroupRow = ({ cluster, position }: Props) => {
    const { t } = useLingui();

    const { key, section } = cluster;
    const isCash = section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const hasAction = isCash || section === CategorizeInboxSectionEnum.CONFIDENT;

    const href = { pathname: '/categorize/group/[key]', params: { key } } as const;
    const actionTitle = isCash ? t`To cash` : t({ message: 'File', context: 'Categorize action' });
    const actionButton = isCash ? (
        <CategorizeInboxGroupRowCashButton cluster={cluster} />
    ) : (
        <CategorizeInboxGroupRowFileButton cluster={cluster} />
    );
    const actionPlaceholder = hasAction ? (
        <CategorizeInboxGroupRowGhost>
            <CategorizeInboxGroupRowActionPill title={actionTitle} />
        </CategorizeInboxGroupRowGhost>
    ) : null;
    const overlay = hasAction ? (
        <CategorizeInboxGroupRowColumnsOverlay cluster={cluster}>{actionButton}</CategorizeInboxGroupRowColumnsOverlay>
    ) : null;

    return (
        <CategorizeInboxCardRow position={position}>
            <View>
                <Link href={href} asChild>
                    <HapticPressable
                        className="min-h-[64px] flex-row items-center gap-x-lg px-3xl py-xl active:opacity-70"
                        accessibilityRole="link"
                        {...testID(CategorizeInboxGroupRowSelector.Row, key)}
                    >
                        <CategorizeInboxMerchantBadge cluster={cluster} />
                        <CategorizeInboxGroupRowBody cluster={cluster}>{actionPlaceholder}</CategorizeInboxGroupRowBody>
                    </HapticPressable>
                </Link>
                {overlay}
            </View>
        </CategorizeInboxCardRow>
    );
};
