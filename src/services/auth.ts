import { type User, UserManager, type UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';

import { api, ui } from '@/configuration';
import { useAuthStore } from '@/stores/auth';

declare module 'oidc-client-ts' {
  interface UserState {
    returnUrl?: string;
  }
}

export type OniUser = {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  accessToken: string;
};

const {
  rocrate: { endpoint, clientId },
} = api;

const { urlPrefix } = ui;

let userManager: UserManager | undefined;
let isRedirecting = false;

let authReadyResolve: () => void;
export const authReady: Promise<void> = new Promise((resolve) => {
  authReadyResolve = resolve;
});

const getUserManager = async () => {
  const store = useAuthStore();

  if (userManager) {
    return userManager;
  }

  const prefix = urlPrefix || '';

  const config: UserManagerSettings = {
    authority: endpoint,
    client_id: clientId || 'TODO',
    redirect_uri: `${window.location.origin}${prefix}/auth/callback`,
    scope: 'public openid profile email',
    response_type: 'code',
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    automaticSilentRenew: true,
  };

  userManager = new UserManager(config);

  userManager.events.addUserLoaded((user) => {
    store.user = transformUser(user);
    store.isLoggedIn = true;
  });

  userManager.events.addUserUnloaded(() => {
    store.reset();
  });

  userManager.events.addAccessTokenExpired(async () => {
    try {
      await userManager?.signinSilent();
    } catch {
      store.reset();
      await login();
    }
  });

  userManager.events.addSilentRenewError(async () => {
    store.reset();
    await login();
  });

  return userManager;
};

const transformUser = (user: User): OniUser => ({
  email: user.profile.email || 'No email supplied',
  firstName: user.profile.given_name,
  lastName: user.profile.family_name,
  name: user.profile.name,
  accessToken: user.access_token,
});

export const initAuth = async () => {
  // Skip auth hydration on the OAuth callback page — OauthCallbackView handles that flow
  if (!clientId || window.location.pathname.endsWith('/auth/callback')) {
    authReadyResolve();
    return;
  }

  // Clean up stale Pinia auth data from localStorage (previously persisted by pinia-plugin-persistedstate)
  localStorage.removeItem('auth');

  try {
    const manager = await getUserManager();
    const store = useAuthStore();
    const user = await manager.getUser();

    if (user && !user.expired) {
      store.user = transformUser(user);
      store.isLoggedIn = true;
    } else if (user?.expired) {
      try {
        await manager.signinSilent();
        // addUserLoaded event handler updates the store
      } catch {
        await manager.removeUser();
        await login();
      }
    }
  } finally {
    authReadyResolve();
  }
};

export const getValidAccessToken = async (): Promise<string | undefined> => {
  if (!clientId) {
    return undefined;
  }

  const store = useAuthStore();
  const manager = await getUserManager();
  const user = await manager.getUser();

  if (!user) {
    return undefined;
  }

  if (!user.expired) {
    return user.access_token;
  }

  try {
    const renewedUser = await manager.signinSilent();
    return renewedUser?.access_token;
  } catch {
    store.reset();
    await login();
    return undefined;
  }
};

// Force a token renewal via signinSilent, bypassing client-side expiry checks.
// Used by the 401 retry path where the server rejects a token the client considers valid.
export const forceRenewToken = async (): Promise<string | undefined> => {
  if (!clientId) {
    return undefined;
  }

  const store = useAuthStore();
  const manager = await getUserManager();

  try {
    const renewedUser = await manager.signinSilent();
    return renewedUser?.access_token;
  } catch {
    store.reset();
    await login();
    return undefined;
  }
};

export const login = async () => {
  if (isRedirecting) {
    return;
  }
  isRedirecting = true;

  try {
    const userManager = await getUserManager();

    const returnUrl = window.location.pathname.replace(new RegExp(`^${urlPrefix}`), '') + window.location.search;

    await userManager.signinRedirect({ state: { returnUrl } });
  } catch {
    isRedirecting = false;
  }
};

export const handleCallback = async () => {
  const userManager = await getUserManager();

  const user = await userManager.signinRedirectCallback();
  const state = user.state as { returnUrl?: string } | undefined;
  const returnUrl = state?.returnUrl || '/';

  if (user) {
    return { user: transformUser(user), returnUrl };
  }
};

export const getUser = async () => {
  const userManager = await getUserManager();
  const user = await userManager.getUser();
  if (user && !user.expired) {
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
