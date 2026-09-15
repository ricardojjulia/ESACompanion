import type { ClientInfo } from '../types/client';

export type ClientRegistry = Record<string, ClientInfo>;

export const normalizeClientName = (name: string) => name.trim().toLocaleLowerCase();

export const getClientRegistryKey = (name: string, appId?: string) =>
  appId ? `app:${appId}:${normalizeClientName(name)}` : `legacy:${normalizeClientName(name)}`;

export const parseClientRegistry = (stored: string | null): ClientRegistry => {
  if (!stored) return {};

  const parsed: unknown = JSON.parse(stored);
  if (Array.isArray(parsed)) {
    return parsed.reduce<ClientRegistry>((registry, client) => {
      if (isClientInfo(client)) registry[getClientRegistryKey(client.name, client.appId)] = client;
      return registry;
    }, {});
  }

  return typeof parsed === 'object' && parsed !== null ? parsed as ClientRegistry : {};
};

export const isClientVisibleToUser = (client: ClientInfo, userAppId: string | null, isManager: boolean) =>
  isManager || (userAppId !== null && client.appId === userAppId);

export const isClientMutableByUser = (client: ClientInfo, userAppId: string | null, isManager: boolean) =>
  isManager || (userAppId !== null && client.appId === userAppId);

export const getVisibleClients = (registry: ClientRegistry, userAppId: string | null, isManager: boolean) =>
  Object.values(registry).filter((client) => isClientVisibleToUser(client, userAppId, isManager));

export const findVisibleClient = (
  registry: ClientRegistry,
  name: string,
  userAppId: string | null,
  isManager: boolean,
) => {
  const normalizedName = normalizeClientName(name);
  return getVisibleClients(registry, userAppId, isManager)
    .sort((left, right) => Number(right.appId === userAppId) - Number(left.appId === userAppId))
    .find((client) => normalizeClientName(client.name) === normalizedName);
};

const isClientInfo = (value: unknown): value is ClientInfo =>
  typeof value === 'object' && value !== null && 'id' in value && 'name' in value;