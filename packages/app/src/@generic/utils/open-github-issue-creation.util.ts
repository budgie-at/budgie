import * as Effect from 'effect/Effect';
import { Linking } from 'react-native';

const GITHUB_ISSUE_CREATION_URL = 'https://github.com/budgie-at/budgie/issues/new/choose';

export const openGithubIssueCreation = Effect.promise(() => Linking.openURL(GITHUB_ISSUE_CREATION_URL));
