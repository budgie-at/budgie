import { EntityOperationEnum } from '../../enum/entity-operation.enum';
import { AiTranslationFields } from '../ai-translation-fields/ai-translation-fields';
import { GroupedListActionRow } from '../grouped-list-action-row/grouped-list-action-row';

import type { TagEntityInterface } from '@budgie/contracts';

interface Props {
    readonly entity: Pick<TagEntityInterface, 'title' | 'titleEn' | 'titleTags'>;
    readonly mergeLabel: string;
    readonly onMerge: () => void;
    readonly mergeTestID: string;
    readonly deleteLabel: string;
    readonly onDelete: () => void;
    readonly isDisabled: boolean;
    readonly mutatingOperation: EntityOperationEnum | null;
}

export const EntityEditSections = (props: Props) => {
    const { entity, mergeLabel, onMerge, mergeTestID, deleteLabel, onDelete, isDisabled, mutatingOperation } = props;

    return (
        <>
            <AiTranslationFields title={entity.title} titleEn={entity.titleEn} titleTags={entity.titleTags} />
            <GroupedListActionRow
                label={mergeLabel}
                onPress={onMerge}
                isDisabled={isDisabled}
                isLoading={mutatingOperation === EntityOperationEnum.MERGE}
                labelClassName="text-primary"
                testID={mergeTestID}
            />
            <GroupedListActionRow
                label={deleteLabel}
                onPress={onDelete}
                isDisabled={isDisabled}
                isLoading={mutatingOperation === EntityOperationEnum.DELETE}
                labelClassName="text-destructive-foreground"
            />
        </>
    );
};
