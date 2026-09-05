import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import ChartNoAxesColumn from 'lucide-react-native/icons/chart-no-axes-column';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import House from 'lucide-react-native/icons/house';
import Receipt from 'lucide-react-native/icons/receipt';
import Settings from 'lucide-react-native/icons/settings';
import { styled } from 'nativewind';
import { useEffect, useState } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { ICON_IMPORTS } from '../../constant/icons.constant';

import type { AsyncResolvedIconInterface } from '../../interface/async-resolved-icon.interface';
import type { StyledLucideIconType } from '../../type/styled-lucide-icon.type';
import type { LucideIcon, LucideProps } from 'lucide-react-native';

interface IconProps extends LucideProps {
    readonly icon: UserIconNameEnum;
}

const createStyledIcon = (baseIcon: LucideIcon): StyledLucideIconType => styled(baseIcon, { className: { target: 'style' } });

const STYLED_FALLBACK_ICON = createStyledIcon(CircleQuestionMark);

const STYLED_ICON_CACHE = new Map<UserIconNameEnum, StyledLucideIconType>();

const STYLED_ICON_PROMISES = new Map<UserIconNameEnum, Promise<StyledLucideIconType>>();

STYLED_ICON_CACHE.set(UserIconNameEnum.Home, createStyledIcon(House));
STYLED_ICON_CACHE.set(UserIconNameEnum.Receipt, createStyledIcon(Receipt));
STYLED_ICON_CACHE.set(UserIconNameEnum.ChartNoAxesColumn, createStyledIcon(ChartNoAxesColumn));
STYLED_ICON_CACHE.set(UserIconNameEnum.Settings, createStyledIcon(Settings));

const loadStyledIcon = (icon: UserIconNameEnum): Promise<StyledLucideIconType> => {
    const pendingIcon = STYLED_ICON_PROMISES.get(icon);
    if (isDefined(pendingIcon)) {
        return pendingIcon;
    }

    const iconImport = ICON_IMPORTS[icon];
    if (!isDefined(iconImport)) {
        return Promise.reject(new Error(t`Icon importer not found: ${icon}`));
    }

    const loadedIcon = iconImport().then(module => {
        const styledIcon = createStyledIcon(module.default);
        STYLED_ICON_CACHE.set(icon, styledIcon);

        return styledIcon;
    });

    STYLED_ICON_PROMISES.set(icon, loadedIcon);

    return loadedIcon;
};

export const Icon = ({ icon, ...rest }: IconProps) => {
    const [asyncResolvedIcon, setAsyncResolvedIcon] = useState<AsyncResolvedIconInterface | undefined>();

    useEffect(() => {
        let isSubscribed = true;
        const resolveIcon = async (): Promise<void> => {
            const styledIcon = await loadStyledIcon(icon);
            if (isSubscribed) {
                setAsyncResolvedIcon({ icon, styledIcon });
            }
        };

        if (!isDefined(STYLED_ICON_CACHE.get(icon)) && isDefined(ICON_IMPORTS[icon])) {
            void resolveIcon().catch(emptyFn);
        }

        return () => {
            isSubscribed = false;
        };
    }, [icon]);

    const cachedIcon = STYLED_ICON_CACHE.get(icon);
    const asyncIcon = asyncResolvedIcon?.icon === icon ? asyncResolvedIcon.styledIcon : STYLED_FALLBACK_ICON;
    const IconToRender = cachedIcon ?? asyncIcon;

    // oxlint-disable-next-line react-hooks-js/static-components
    return <IconToRender {...rest} />;
};
