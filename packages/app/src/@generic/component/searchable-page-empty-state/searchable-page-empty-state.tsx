import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { EmptyState } from '../empty-state/empty-state';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly icon: UserIconNameEnum;
    readonly description: string;
    readonly testID?: string;
    readonly children?: ReactNode;
}

export const SearchablePageEmptyState = ({ title, icon, description, testID, children }: Props) => (
    <View testID={testID} collapsable={false} className="items-center gap-y-xl px-6xl pt-[72px]">
        <EmptyState
            circleIcon={icon}
            title={title}
            description={description}
            className="py-0"
            titleClassName="text-primary text-center text-md font-medium"
            descriptionClassName="text-secondary-foreground text-center text-sm max-w-70"
        />
        {children}
    </View>
);
