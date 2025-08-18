export interface Logger {
  error(...params: any[]): void;
  warn(...params: any[]): void;
  info(...params: any[]): void;
  debug(...params: any[]): void;
  log(...params: any[]): void;
}

export enum MessageSource {
  WS = "WS",
  PP = "PP",
}

export interface ContextPath {
  root: string;
  temp: string;
  logger: string;
  config: string;
  extension: string;
}

interface Context {
  path: ContextPath;
  log: Logger;
  utils: any;
  getConfig: () => any;
  setConfig: (cfg: any) => any;
}

export interface GeoIP {
  wanIp?: string;
  country?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export interface PptpOption {
  enable: 1 | 0;
  peer_id: string;
  signal_server: string;
  ice_servers: string[];
  proxy_server?: ProxyServer;
  enable_ice_tcp?: boolean;
  port_range_begin?: number;
  port_range_end?: number;
  max_message_size?: number;
  ice_transport_policy?: TransportPolicy;
  mtu?: number;
}

export interface SignalOption {
  enable: 1 | 0;
}

type ProxyServerType = "None" | "Socks5" | "Http";

export interface ProxyServer {
  type: ProxyServerType;
  ip: string;
  port: number;
  username?: string;
  password?: string;
}

export type TransportPolicy = "all" | "relay";

export const enum DEFAULT_DATA_SIZE {
  MIN = 16384, //  16KB =  16 * 1024
  MAX = 262144, // 256KB = 256 * 1024
}
export default Context;
