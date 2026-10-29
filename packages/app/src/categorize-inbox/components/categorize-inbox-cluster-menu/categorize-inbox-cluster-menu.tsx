import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxOverflowMenu } from '../categorize-inbox-overflow-menu/categorize-inbox-overflow-menu';
import { CategorizeInboxSuggestionChipsSelector } from '../categorize-inbox-suggestion-chips/categorize-inbox-suggestion-chips.selector';

import { CategorizeInboxClusterMenuSelector } from './categorize-inbox-cluster-menu.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterMenu = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy, pickClusterLabels, convertClusterToTransfer } = useCategorizeInboxContext();

    const handlePickPress = (): void => void pickClusterLabels(cluster);
    const handleConvertPress = (): void => void convertClusterToTransfer(cluster);

    const hasSuggestions = isNotEmptyArray(cluster.candidateLabelIds);
    const moreLabels = strategy?.moreLabels ?? '';
    const triggerTestID = testID(CategorizeInboxSuggestionChipsSelector.More, cluster.key).testID;

    return (
        <CategorizeInboxOverflowMenu accessibilityLabel={moreLabels} triggerTestID={triggerTestID}>
            {hasSuggestions ? (
                <ActionsMenuItem
                    icon={UserIconNameEnum.Tag}
                    label={moreLabels}
                    onPress={handlePickPress}
                    testID={testID(CategorizeInboxClusterMenuSelector.PickCategory, cluster.key).testID}
                />
            ) : null}
            <ActionsMenuItem
                icon={UserIconNameEnum.ArrowLeftRight}
                label={t`Convert to Transfer`}
                onPress={handleConvertPress}
                testID={testID(CategorizeInboxClusterMenuSelector.ConvertToTransfer, cluster.key).testID}
            />
        </CategorizeInboxOverflowMenu>
    );
};
