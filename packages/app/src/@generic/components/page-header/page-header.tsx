import { useLingui } from '@lingui/react/macro';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { use } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { ThemeContext } from '../../../theme/context/theme.context';
import { ColorSchemaEnum } from '../../../theme/enum/color-schema.enum';

interface Props {
    readonly title?: string;
}

export const PageHeader = ({ title = '' }: Props) => {
    const { colorScheme } = use(ThemeContext);
    const { t } = useLingui();

    const pageTitle = t`Budgie`;
    const fullTitle = isNotEmptyString(title) ? `${pageTitle} - ${title}` : pageTitle;
    const statusBarStyle = colorScheme === ColorSchemaEnum.Dark ? 'light' : 'dark';

    return (
        <>
            {/* eslint-disable-next-line react/style-prop-object */}
            <StatusBar style={statusBarStyle} />

            <Stack.Screen options={{ title: fullTitle }} />
        </>
    );
};
