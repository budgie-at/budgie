import * as Effect from 'effect/Effect';

import { AuthService } from '../service/auth.service';

export const authenticateWithBiometricsEffect = Effect.flatMap(AuthService, authService => authService.authenticateWithBiometrics());
