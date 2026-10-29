import { UserIconNameEnum } from '@budgie/contracts';

import { Button } from '../../../@generic/component/button/button';

interface Props {
    readonly testID: string;
    readonly onDelete: () => Promise<void>;
}

export const BudgetDeleteButton = ({ testID, onDelete }: Props) => {
    const handleDeletePress = () => void onDelete();

    return <Button testID={testID} variant="destructive" leftIcon={UserIconNameEnum.Trash2} onPress={handleDeletePress} />;
};
