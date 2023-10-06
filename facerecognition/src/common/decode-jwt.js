import jwt from 'jwt-decode';
import { JWT_STORAGE_KEY } from './consts';

export const decodeAndStoreJWT = (str) => {
    const decoded = jwt(str);
    window.localStorage.setItem(JWT_STORAGE_KEY, JSON.stringify(decoded));
    return decoded;
}
