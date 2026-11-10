import { useLingui } from '@lingui/react/macro';
import { use, useState } from 'react';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { EntityFormStatusContext } from '../../context/entity-form-status.context';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { AiTranslationFields } from '../ai-translation-fields/ai-translation-fields';
import { EntityFormFooter } from '../entity-form-footer/entity-form-footer';
import { EntityFormSubmitButton } from '../entity-form-submit-button/entity-form-submit-button';
import { FixedChromeScroll } from '../fixed-chrome-scroll/fixed-chrome-scroll';
import { GoBackButton } from '../go-back-button/go-back-button';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';
import { LoadingContent } from '../loading-content/loading-content';
import { UsageFailureRow } from '../usage-failure-row/usage-failure-row';

import type { TranslatedTitleInterface } from '../../interface/translated-title.interface';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly entity: TranslatedTitleInterface | undefined;
    readonly hero: ReactNode;
    readonly titleField: ReactNode;
    readonly submitLabel: string;
    readonly submitTestID: string;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
    readonly children: ReactNode;
}

export const EntityHeroFormPage = (props: Props) => {
    const { entity, hero, titleField, submitLabel, submitTestID, onSubmit, onCancel, children } = props;
    const { t } = useLingui();
    const status = use(EntityFormStatusContext);
    const headerStyle = useResolveClassNames('bg-sheet-surface');
    const [footerHeight, setFooterHeight] = useState(0);
    const handleFooterLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
    };

    const keywordsFooter = isDefined(entity) ? (
        <AiTranslationFields title={entity.title} titleEn={entity.titleEn} titleTags={entity.titleTags} />
    ) : null;
    const usageContent = status.isUsageFailure ? (
        <UsageFailureRow onRetry={status.onRetryUsage} />
    ) : (
        <LoadingContent isLoading={status.isUsagePending} className="gap-7xl">
            {children}
        </LoadingContent>
    );

    return (
        <View className="bg-sheet-surface flex-1">
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <FixedChromeScroll footerHeight={footerHeight}>
                        {hero}
                        <GroupedListSection title={t`Details`} footer={keywordsFooter}>
                            {titleField}
                        </GroupedListSection>
                        {isDefined(entity) ? usageContent : null}
                    </FixedChromeScroll>
                    <ScreenChromeHeader style={headerStyle}>
                        <GoBackButton onPress={onCancel} />
                    </ScreenChromeHeader>
                    <EntityFormFooter onLayout={handleFooterLayout}>
                        <EntityFormSubmitButton
                            label={submitLabel}
                            isReady={status.isReady}
                            isLoading={status.isLoading}
                            isDisabled={status.isDisabled}
                            onPress={onSubmit}
                            testID={submitTestID}
                        />
                    </EntityFormFooter>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </View>
    );
};
