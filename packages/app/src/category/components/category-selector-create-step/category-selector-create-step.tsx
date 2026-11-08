import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { CategoryCreatePage } from '../category-create-page/category-create-page';

interface Props {
    readonly defaultTitle: string;
    readonly syncZone?: string;
    readonly onCommit: (categoryId: number) => void;
    readonly onCancel: () => void;
}

export const CategorySelectorCreateStep = ({ defaultTitle, syncZone, onCommit, onCancel }: Props) => {
    const handleSelect = useMorphingSheetCommit(onCommit);

    return <CategoryCreatePage defaultTitle={defaultTitle} syncZone={syncZone} onSelect={handleSelect} onCancel={onCancel} />;
};
