import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';

interface Props {
    readonly description: string;
    readonly onDone: () => void;
}

export const CategorizeInboxEmptyState = ({ description, onDone }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-1 justify-center gap-y-xl px-5xl pt-safe">
            <EmptyState circleIcon={UserIconNameEnum.PartyPopper} title={t`All caught up`} description={description} />
            <Button variant="ghost" size="sm" content={t`Done`} onPress={onDone} className="self-center px-7xl" />
        </View>
    );
};
