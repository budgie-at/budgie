import { EntityOperationEnum } from '../../enum/entity-operation.enum';
import { GroupedListActionRow } from '../grouped-list-action-row/grouped-list-action-row';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';

import type { ReactNode } from 'react';

interface Props {
    readonly deleteLabel: string;
    readonly deleteFooter: string | null;
    readonly onDelete: () => void;
    readonly isDisabled: boolean;
    readonly mutatingOperation: EntityOperationEnum | null;
    readonly deleteTestID?: string;
    readonly deleteTrailing?: ReactNode;
    readonly children?: ReactNode;
}

export const EntityEditSections = ({
    deleteLabel,
    deleteFooter,
    onDelete,
    isDisabled,
    mutatingOperation,
    deleteTestID,
    deleteTrailing,
    children
}: Props) => (
    <>
        {children}
        <GroupedListSection footer={deleteFooter}>
            <GroupedListActionRow
                label={deleteLabel}
                onPress={onDelete}
                isDisabled={isDisabled}
                isLoading={mutatingOperation === EntityOperationEnum.DELETE}
                labelClassName="text-destructive-foreground"
                trailing={deleteTrailing}
                testID={deleteTestID}
            />
        </GroupedListSection>
    </>
);
