import { UserIconNameEnum } from '@budgie/contracts';

import { Button } from '../../../@generic/component/button/button';
import { BudgetSelector } from '../../budget.selector';

interface Props {
    readonly isEditing: boolean;
    readonly onDelete: () => Promise<void>;
}

export const BudgetSetupDeleteButton = ({ isEditing, onDelete }: Props) => {
    const handleDeletePress = () => void onDelete();

    if (!isEditing) {
        return null;
    }

    return (
        <Button
            testID={BudgetSelector.SetupDeleteButton}
            variant="destructive"
            leftIcon={UserIconNameEnum.Trash2}
            onPress={handleDeletePress}
        />
    );
};
