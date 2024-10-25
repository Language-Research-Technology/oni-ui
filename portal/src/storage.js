export const loginSessionKey = 'oni-login-session-data';
export const tokenSessionKey = 'oni-user-token';
export const apiTokenAccessKey = 'oni-api-token';

// local storage handlers
export function putLocalStorage({ key, data }) {
  window.localStorage.setItem(key, JSON.stringify(data));
}
export function getLocalStorage({ key }) {
  return JSON.parse(window.localStorage.getItem(key));
}
export function removeLocalStorage({ key }) {
  window.localStorage.removeItem(key);
}
