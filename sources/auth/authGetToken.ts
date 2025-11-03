import { authChallenge } from "./authChallenge";
import axios from 'axios';
import { encodeBase64 } from "../encryption/base64";
import { getServerUrl } from "@/sync/serverConfig";

export async function authGetToken(secret: Uint8Array) {
    const API_ENDPOINT = getServerUrl();
    console.log('[authGetToken] Using server URL:', API_ENDPOINT);

    const { challenge, signature, publicKey } = authChallenge(secret);
    console.log('[authGetToken] Generated challenge and signature');
    console.log('[authGetToken] Public key (first 20 chars):', encodeBase64(publicKey).substring(0, 20) + '...');

    try {
        console.log('[authGetToken] Sending POST request to:', `${API_ENDPOINT}/v1/auth`);
        const response = await axios.post(`${API_ENDPOINT}/v1/auth`, {
            challenge: encodeBase64(challenge),
            signature: encodeBase64(signature),
            publicKey: encodeBase64(publicKey)
        });
        const data = response.data;
        console.log('[authGetToken] ✓ Success! Received token');
        return data.token;
    } catch (error) {
        console.error('[authGetToken] ✗ Request failed:', error);
        if (axios.isAxiosError(error)) {
            console.error('[authGetToken] Response status:', error.response?.status);
            console.error('[authGetToken] Response data:', error.response?.data);
        }
        throw error;
    }
}