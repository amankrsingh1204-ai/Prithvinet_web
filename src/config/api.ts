const ENV_API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();

const runtimeHost = typeof window !== "undefined" && window.location?.hostname
	? window.location.hostname
	: "127.0.0.1";

const API_BASE = ENV_API_BASE || `http://${runtimeHost}:8000`;

export default API_BASE;
