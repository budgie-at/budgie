import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { CategoryForm } from '../category/components/category-form/category-form';
import { useCategoryFormModal, useCategoryFormModalParams } from '../category/context/category-form-modal.context';

export default function CategoryFormModal() {
    const [, resolveCategoryForm, dismissCategoryForm] = useCategoryFormModal();
    useModalDismiss(dismissCategoryForm);
    const currentParams = useCategoryFormModalParams();

    const handleCancel = () => {
        resolveCategoryForm(null);
    };

    return (
        <CategoryForm
            category={currentParams?.category}
            defaultTitle={currentParams?.defaultTitle}
            onSuccess={resolveCategoryForm}
            onCancel={handleCancel}
        />
    );
}
