import { Text, View } from 'react-native';

import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
import { ListRow } from '../../../@generic/component/list-row/list-row';

interface Props {
    readonly label: string;
    readonly detail: string;
}

export const InzhurOperationsNoteRow = ({ label, detail }: Props) => {
    const detailSegments = [detail];

    return (
        <View accessible className="min-h-[64px] justify-center px-3xl py-[12px]">
            <ListRow
                title={<Text className="text-[17px] font-semibold text-primary">{label}</Text>}
                detail={<ListRowDetail segments={detailSegments} />}
            />
        </View>
    );
};
