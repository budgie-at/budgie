import { LockstepIconSelectorProvider } from '../../../@generic/component/lockstep-icon-selector-provider/lockstep-icon-selector-provider';
import { LockstepStack } from '../../../@generic/component/lockstep-stack/lockstep-stack';
import { CategoryForm } from '../category-form/category-form';

import type { CategoryFormResultInterface } from '../../interface/category-form-result.interface';

interface Props {
    readonly defaultTitle: string;
    readonly syncZone?: string;
    readonly onSelect: (categoryId: number) => void;
    readonly onCancel: () => void;
}

export const CategoryCreatePage = ({ defaultTitle, syncZone, onSelect, onCancel }: Props) => {
    const handleSuccess = (result: CategoryFormResultInterface) => {
        onSelect(result.category.id);
    };

    return (
        <LockstepStack
            root={
                <LockstepIconSelectorProvider>
                    <CategoryForm defaultTitle={defaultTitle} syncZone={syncZone} onSuccess={handleSuccess} onCancel={onCancel} />
                </LockstepIconSelectorProvider>
            }
        />
    );
};
