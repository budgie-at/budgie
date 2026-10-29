import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxGroupRowPill } from '../categorize-inbox-group-row-pill/categorize-inbox-group-row-pill';
import { CategorizeInboxGroupRowSelector } from '../categorize-inbox-group-row/categorize-inbox-group-row.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'key' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowFileButton = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy, acceptableAssignments, assign } = useCategorizeInboxContext();

    const candidateId = cluster.candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const assignments = acceptableAssignments.filter(assignment => assignment.key === cluster.key);

    const handlePress = (): void => {
        assign(assignments);
    };

    if (!isNotEmptyString(candidateTitle)) {
        return null;
    }

    return (
        <CategorizeInboxGroupRowPill
            className="bg-positive-background"
            label={t`File as ${candidateTitle}`}
            isDisabled={!isNotEmptyArray(assignments)}
            onPress={handlePress}
            {...testID(CategorizeInboxGroupRowSelector.FileButton, cluster.key)}
        >
            <Icon icon={UserIconNameEnum.Check} size={12} className="text-positive-foreground" />
            <Text className="shrink text-xs font-medium text-positive-foreground" numberOfLines={1}>
                {candidateTitle}
            </Text>
        </CategorizeInboxGroupRowPill>
    );
};
