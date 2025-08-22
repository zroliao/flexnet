import { Jrpc } from "./jrpc-basic";

export namespace RpcSignal {
  //
  // method = signal.session.auth
  // ───────────────────────────────────
  export interface SessionAuthParams {
    version: string;
    username: string;
    password: string;
  }

  // method = "signal.session.alive"
  // ───────────────────────────────────
  export interface SessionAliveParams {}
}
