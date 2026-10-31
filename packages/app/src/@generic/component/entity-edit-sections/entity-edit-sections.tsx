import { EntityOperationEnum } from '../../enum/entity-operation.enum';
import { GroupedListActionRow } from '../grouped-list-action-row/grouped-list-action-row';

import type { ReactNode } from 'react';

interface Props {
    readonly deleteLabel: string;
    readonly onDelete: () => void;
    readonly isDisabled: boolean;
    readonly mutatingOperation: EntityOperationEnum | null;
    readonly deleteTestID?: string;
    readonly children?: ReactNode;
}

export const EntityEditSections = ({ deleteLabel, onDelete, isDisabled, mutatingOperation, deleteTestID, children }: Props) => (
    <>
        {children}
        <GroupedListActionRow
            label={deleteLabel}
            onPress={onDelete}
            isDisabled={isDisabled}
            isLoading={mutatingOperation === EntityOperationEnum.DELETE}
            labelClassName="text-destructive-foreground"
            testID={deleteTestID}
        />
    </>
);
