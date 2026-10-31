import { useLingui } from '@lingui/react/macro';
import { Alert } from 'react-native';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';

interface Props {
    readonly mergeLabel: string;
    readonly onMerge: () => void;
    readonly mergeTestID: string;
    readonly deleteLabel: string;
    readonly deleteConfirmTitle: string;
    readonly onDelete: () => void;
}

export const MergeDeleteSection = ({ mergeLabel, onMerge, mergeTestID, deleteLabel, deleteConfirmTitle, onDelete }: Props) => {
    const { t } = useLingui();

    const handleDeletePress = () =>
        void Alert.alert(deleteConfirmTitle, t`This action cannot be undone.`, [
            { text: t`Delete`, onPress: onDelete, style: 'destructive' },
            { text: t`Cancel`, style: 'cancel' }
        ]);

    return (
        <GroupedListSection>
            <GroupedListRow title={mergeLabel} onPress={onMerge} testID={mergeTestID} />
            <GroupedListRow title={deleteLabel} titleClassName="text-destructive-foreground" onPress={handleDeletePress} />
        </GroupedListSection>
    );
};
