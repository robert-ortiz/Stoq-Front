const REMOTE_API_BASE_URL = 'https://stoq-backend-2.onrender.com';
const LOCAL_API_BASE_URL = 'http://localhost:8080';

function resolveApiBaseUrl(): string {
	if (typeof window === 'undefined') {
		return REMOTE_API_BASE_URL;
	}

	const host = window.location.hostname;
	if (host === 'localhost' || host === '127.0.0.1') {
		return LOCAL_API_BASE_URL;
	}

	return REMOTE_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();