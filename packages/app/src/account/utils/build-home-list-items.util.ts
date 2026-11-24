import { AccountTypeEnum } from '@budgie/contracts';

import { HomeListItemKindEnum } from '../enum/home-list-item-kind.enum';
import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { isCashSection } from '../type-guard/is-cash-section.type-guard';
import { isDebtSection } from '../type-guard/is-debt-section.type-guard';
import { isHomeHolding } from '../type-guard/is-home-holding.type-guard';
import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';

import type { HomeSectionInterface } from '../interface/home-section.interface';
import type { HomeListItemType } from '../type/home-list-item.type';

const getSectionKey = (section: HomeSectionInterface): string => {
    if (section.kind === HomeSectionKindEnum.FAMILY) {
        return 'family';
    }

    return isDebtSection(section) ? section.kind : section.type;
};

const getItemId = (item: HomeSectionInterface['data'][number]): string => {
    if (isInstitutionGroup(item)) {
        return `institution-${item.integrationId}`;
    }

    return isHomeHolding(item) ? `holding-${item.instrument.id}` : String(item.id);
};

const getItemKind = (
    item: HomeSectionInterface['data'][number],
    section: HomeSectionInterface
): HomeListItemKindEnum.INSTITUTION | HomeListItemKindEnum.HOLDING | HomeListItemKindEnum.DEBT | HomeListItemKindEnum.ACCOUNT => {
    if (isInstitutionGroup(item)) {
        return item.accounts.length === 1 && item.accounts[0].type !== AccountTypeEnum.STOCKS
            ? HomeListItemKindEnum.ACCOUNT
            : HomeListItemKindEnum.INSTITUTION;
    }

    if (isHomeHolding(item)) {
        return HomeListItemKindEnum.HOLDING;
    }

    return isDebtSection(section) ? HomeListItemKindEnum.DEBT : HomeListItemKindEnum.ACCOUNT;
};

export const buildHomeListItems = (sections: HomeSectionInterface[]) => {
    const items: HomeListItemType[] = sections.flatMap(section => {
        const sectionKey = getSectionKey(section);

        return [
            { id: `header-${sectionKey}`, type: HomeListItemKindEnum.HEADER, section },
            ...section.data.map((item, index) => ({
                id: getItemId(item),
                type: getItemKind(item, section),
                item,
                index,
                section
            })),
            ...(isCashSection(section) ? [{ id: `footer-${sectionKey}`, type: HomeListItemKindEnum.FOOTER as const, section }] : [])
        ];
    });

    return {
        items,
        headerIndices: items.flatMap((item, index) => (item.type === HomeListItemKindEnum.HEADER ? [index] : []))
    };
};
