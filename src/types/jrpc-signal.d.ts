import { Jrpc } from "./jrpc-basic";

export namespace JrpcSignal {
  //
  export interface SessionAuthParams {
    version: string;
    username: string;
    password: string;
  }

  export interface SessionAuthRequest extends Jrpc.Request {
    method: "signal.session.auth";
    params: SessionAuthParams;
  }

  export interface SessionAliveRequest extends Jrpc.Request {
    method: "signal.session.alive";
    params: {};
  }
}
