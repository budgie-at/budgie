import { gameResetAction } from '../../../game/store/game.actions';
import { useAppDispatch } from '../../hooks/use-app-dispatch.hook';
import { BlackButton } from '../black-button/black-button';

export const PlayAgainButton = () => {
    const dispatch = useAppDispatch();

    const handlePlayAgain = () => {
        dispatch(gameResetAction());
    };

    return <BlackButton href="/" onPress={handlePlayAgain} text="Play again" />;
};
