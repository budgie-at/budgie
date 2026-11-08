import { View } from 'react-native';

import { CollapsibleChromePage } from '../collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../form-layout-group/form-layout-group';
import { GoBackButton } from '../go-back-button/go-back-button';
import { PillButton } from '../pill-button/pill-button';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly onCancel: () => void;
    readonly saveLabel: string;
    readonly onSave: () => void;
    readonly isSaving: boolean;
    readonly isSaveDisabled: boolean;
    readonly saveTestID: string;
    readonly children: ReactNode;
}

export const EntityFormPage = ({ title, onCancel, saveLabel, onSave, isSaving, isSaveDisabled, saveTestID, children }: Props) => (
    <CollapsibleChromePage
        title={title}
        leading={<GoBackButton onPress={onCancel} />}
        footer={
            <View className="border-t-hairline border-surface-separator bg-surface px-5xl pt-lg">
                <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
                <PillButton label={saveLabel} onPress={onSave} isLoading={isSaving} isDisabled={isSaveDisabled} testID={saveTestID} />
            </View>
        }
    >
        <FormLayoutGroup>{children}</FormLayoutGroup>
    </CollapsibleChromePage>
);
