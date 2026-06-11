import { Linking } from 'react-native';

const GITHUB_ISSUE_CREATION_URL = 'https://github.com/budgie-at/budgie/issues/new/choose';

export const openGithubIssueCreation = async (): Promise<void> => {
    await Linking.openURL(GITHUB_ISSUE_CREATION_URL);
};
