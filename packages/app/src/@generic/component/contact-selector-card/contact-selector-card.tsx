import { UserIconNameEnum } from '@budgie/contracts';
import { Image } from 'expo-image';
import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { withUniwind } from 'uniwind';

import { EmptyFn, emptyFn, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../constant/max-chrome-font-size-multiplier.constant';
import { CircleIcon } from '../circle-icon/circle-icon';
import { ContactSelectorDetail } from '../contact-selector-detail/contact-selector-detail';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';

interface Props {
    readonly onSelect: EmptyFn;
    readonly isSelected: boolean;
    readonly title: string;
    readonly image: string | null;
    readonly emails: string[];
    readonly phoneNumbers: string[];
}

const LARGE_TEXT_FONT_SCALE = 1.3;
const CHECK_SIZE = 22;

const StyledImage = withUniwind(Image);

const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';
const placeholder = { blurhash };

export const ContactSelectorCard = (props: Props) => {
    const { isSelected, onSelect, title, image, emails, phoneNumbers } = props;
    const { fontScale } = useWindowDimensions();
    const isLargeText = fontScale >= LARGE_TEXT_FONT_SCALE;
    const checkSize = CHECK_SIZE * Math.min(fontScale, MAX_CHROME_FONT_SIZE_MULTIPLIER);
    const checkStyle = { width: checkSize };
    const pressableProps = { accessibilityState: { selected: isSelected } };

    const handleSelect = isSelected ? emptyFn : onSelect;
    const icon = isNotEmptyString(image) ? (
        <StyledImage
            className="h-[36px] w-[36px] rounded-full"
            source={image}
            placeholder={placeholder}
            contentFit="cover"
            transition={1000}
        />
    ) : (
        <CircleIcon
            icon={UserIconNameEnum.User}
            variant="secondary"
            size={36}
            iconSize={18}
            radius={18}
            border={false}
            className="bg-surface-disc"
        />
    );

    const titleClassName = isSelected ? 'text-primary text-[17px] font-semibold' : 'text-primary text-[17px]';
    const titleContent = (
        <Text className={titleClassName} maxFontSizeMultiplier={2} numberOfLines={2} accessibilityLabel={title}>
            {title}
        </Text>
    );
    const leading = isLargeText ? null : <View className="h-[42px] justify-center">{icon}</View>;
    const check = isSelected ? (
        <Icon icon={UserIconNameEnum.Check} size={checkSize} className="text-positive-action" />
    ) : (
        <View style={checkStyle} />
    );
    const accessory = <View className="self-start pt-xxs">{check}</View>;

    const subtitle =
        isNotEmptyArray(emails) || isNotEmptyArray(phoneNumbers) ? (
            <View className="gap-y-xxs">
                {emails.map(email => (
                    <ContactSelectorDetail
                        key={email}
                        icon={UserIconNameEnum.Mail}
                        value={email}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                    />
                ))}
                {phoneNumbers.map(phoneNumber => (
                    <ContactSelectorDetail key={phoneNumber} icon={UserIconNameEnum.Phone} value={phoneNumber} />
                ))}
            </View>
        ) : null;

    return (
        <GroupedListRow
            onPress={handleSelect}
            testID={CreateAccountScreenSelector.ContactOption(title)}
            left={leading}
            right={accessory}
            pressableProps={pressableProps}
            title={titleContent}
            subtitle={subtitle}
        />
    );
};
