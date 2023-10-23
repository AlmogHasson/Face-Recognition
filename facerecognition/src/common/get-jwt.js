import { JWT_STORAGE_KEY } from './consts';

export const getJWT = () => {
    const stringifiedJWT = window.localStorage.getItem(JWT_STORAGE_KEY);
    return JSON.parse(stringifiedJWT);
}
