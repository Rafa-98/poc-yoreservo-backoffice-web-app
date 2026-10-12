// Server-only entry point: also exposes the server environment.
// Never import from Client Components.
export * from "./index";
export { getServerEnv, type ServerEnv } from "./server-env";
