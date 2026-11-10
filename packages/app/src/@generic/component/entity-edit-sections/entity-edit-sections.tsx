import { UserIconNameEnum } from '@budgie/contracts';
import { use } from 'react';

import { EntityFormStatusContext } from '../../context/entity-form-status.context';
import { EntityOperationEnum } from '../../enum/entity-operation.enum';
import { GroupedListActionRow } from '../grouped-list-action-row/grouped-list-action-row';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';

import type { ReactNode } from 'react';

interface Props {
    readonly deleteLabel: string;
    readonly deleteFooter: string | null;
    readonly onDelete: () => void;
    readonly deleteTestID?: string;
    readonly deleteTrailing?: ReactNode;
    readonly children?: ReactNode;
}

export const EntityEditSections = ({ deleteLabel, deleteFooter, onDelete, deleteTestID, deleteTrailing, children }: Props) => {
    const { isBusy, mutatingOperation } = use(EntityFormStatusContext);

    return (
        <>
            {children}
            <GroupedListSection footer={deleteFooter}>
                <GroupedListActionRow
                    label={deleteLabel}
                    icon={UserIconNameEnum.Trash2}
                    onPress={onDelete}
                    isDisabled={isBusy}
                    isLoading={mutatingOperation === EntityOperationEnum.DELETE}
                    labelClassName="text-destructive-foreground"
                    trailing={deleteTrailing}
                    testID={deleteTestID}
                />
            </GroupedListSection>
        </>
    );
};
