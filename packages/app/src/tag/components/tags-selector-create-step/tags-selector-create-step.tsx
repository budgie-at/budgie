import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { TagForm } from '../tag-form/tag-form';

import type { TagFormResultInterface } from '../../interface/tag-form-result.interface';

interface Props {
    readonly defaultTitle: string;
    readonly singleSelect: boolean;
    readonly onCommit: (tagIds: number[]) => void;
    readonly onAdded: (tagId: number) => void;
    readonly onCancel: () => void;
}

export const TagsSelectorCreateStep = ({ defaultTitle, singleSelect, onCommit, onAdded, onCancel }: Props) => {
    const handleCommit = useMorphingSheetCommit(onCommit);

    const handleSuccess = ({ tag }: TagFormResultInterface) => {
        if (singleSelect) {
            handleCommit([tag.id]);
        } else {
            onAdded(tag.id);
        }
    };

    return <TagForm defaultTitle={defaultTitle} onSuccess={handleSuccess} onCancel={onCancel} />;
};
