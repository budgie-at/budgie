import { Stop } from 'react-native-svg';
import { withUniwind } from 'uniwind';

export const StyledStop = withUniwind(Stop, {
    stopColor: { fromClassName: 'stopClassName', styleProperty: 'accentColor' }
});
