import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxClusterRowSelector } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row.selector';
import { CategorizeInboxOverflowMenu } from '../categorize-inbox-overflow-menu/categorize-inbox-overflow-menu';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

interface Props {
    readonly row: CategorizeInboxRowInterface;
}

export const CategorizeInboxRowMenu = ({ row }: Props) => {
    const { t } = useLingui();
    const { strategy, pickRowLabels, convertRowToTransfer } = useCategorizeInboxContext();

    const handlePickPress = (): void => void pickRowLabels(row);
    const handleConvertPress = (): void => void convertRowToTransfer(row);

    const pickRowLabel = strategy?.pickRowLabel ?? '';
    const triggerTestID = testID(CategorizeInboxClusterRowSelector.PickCategory, row.transactionId).testID;

    return (
        <CategorizeInboxOverflowMenu accessibilityLabel={pickRowLabel} triggerTestID={triggerTestID}>
            <ActionsMenuItem
                icon={UserIconNameEnum.Tag}
                label={pickRowLabel}
                onPress={handlePickPress}
                testID={testID(CategorizeInboxClusterRowSelector.MenuPickCategory, row.transactionId).testID}
            />
            <ActionsMenuItem
                icon={UserIconNameEnum.ArrowLeftRight}
                label={t`Convert to Transfer`}
                onPress={handleConvertPress}
                testID={testID(CategorizeInboxClusterRowSelector.ConvertToTransfer, row.transactionId).testID}
            />
        </CategorizeInboxOverflowMenu>
    );
};
