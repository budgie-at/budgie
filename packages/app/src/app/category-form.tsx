import { CategoryForm, CategoryFormResult } from '../category/components/category-form/category-form';
import { useCategoryFormModal } from '../category/context/category-form-modal.context';

export default function CategoryFormModal() {
    const [, resolveCategoryForm, currentParams] = useCategoryFormModal();

    const handleSuccess = (result: CategoryFormResult) => {
        resolveCategoryForm(result);
    };

    const handleCancel = () => {
        resolveCategoryForm(null);
    };

    return (
        <CategoryForm
            category={currentParams?.category}
            defaultTitle={currentParams?.defaultTitle}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}
