import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { isAdminIdentity } from './admin-policy';
export async function getAdmin() {
    const user = await getChatGPTUser();
    return isAdminIdentity(user?.email, env.ADMIN_EMAIL) ? user : null;
}
