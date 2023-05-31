import { StyleSheet } from 'react-native';

import { Colors } from '../../../@generic';
import { CellSizeConstant } from '../constants/dimensions.contant';

export const CellStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        borderColor: Colors.black,
        borderLeftWidth: 1,
        borderStyle: 'solid',
        borderTopWidth: 1,
        fontFamily: 'Inter_500Medium',
        height: CellSizeConstant,
        justifyContent: 'center',
        width: CellSizeConstant
    },
    groupXEnd: {
        borderRightWidth: 1,
        marginRight: 5
    },
    groupYEnd: {
        borderBottomWidth: 1,
        marginBottom: 5
    },
    lastCol: {
        borderRightWidth: 1
    },
    lastRow: {
        borderBottomWidth: 1
    }
});
