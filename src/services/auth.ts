import { type User, UserManager, type UserManagerSettings } from 'oidc-client-ts';

import { configuration } from '@/configuration';

export type OniUser = {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  accessToken: string;
};

const {
  api: {
    rocrate: { endpoint, clientId, callbackPrefix },
  },
} = configuration;

let userManager: UserManager | undefined;

const getUserManager = async () => {
  if (userManager) {
    return userManager;
  }

  const prefix = callbackPrefix || '';

  const config: UserManagerSettings = {
    authority: endpoint,
    client_id: clientId || 'TODO',
    redirect_uri: `${window.location.origin}${prefix}/auth/callback`,
    scope: 'public openid profile email',
    response_type: 'code',
  };

  userManager = new UserManager(config);

  return userManager;
};

const transformUser = (user: User): OniUser => ({
  email: user.profile.email || 'No email supplied',
  firstName: user.profile.given_name,
  lastName: user.profile.family_name,
  name: user.profile.name,
  accessToken: user.access_token,
});

export const login = async () => {
  const userManager = await getUserManager();

  await userManager.signinRedirect();
};

export const handleCallback = async () => {
  const userManager = await getUserManager();

  const user = await userManager.signinRedirectCallback();
  if (user) {
    return transformUser(user);
  }
};

export const getUser = async () => {
  const userManager = await getUserManager();
  const user = await userManager.getUser();
  if (user) {
    return transformUser(user);
  }
};

export const logout = async () => {
  // TODO: Should we just log out of everything?
  const user = await getUser();
  if (user) {
    const userManager = await getUserManager();
    // We don't call signoutCallback as we don't want to necessarily sign the user out of Nabu for example just Oni
    await userManager.removeUser();
  }
};
