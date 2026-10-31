import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../button/button';

interface Props {
    readonly createLabel: string;
    readonly onCreate: EmptyFn;
    readonly onClearSearch?: EmptyFn;
}

export const SearchablePageEmptyStateActions = ({ createLabel, onCreate, onClearSearch }: Props) => {
    const { t } = useLingui();

    return (
        <View className="items-center gap-y-xs">
            <Button
                variant="cta"
                size="sm"
                leftIcon={UserIconNameEnum.Plus}
                content={createLabel}
                onPress={onCreate}
                className="rounded-full px-5xl"
            />
            {isDefined(onClearSearch) ? (
                <Button variant="ghost" size="sm" content={t`Clear search`} onPress={onClearSearch} className="border-0 bg-transparent" />
            ) : null}
        </View>
    );
};
