import { Jrpc } from "./jrpc-basic";

export namespace Dispatcher {
  //
  export interface registerRequest {
    method: string;
    handle: (request: Jrpc.Request) => void;
  }
}
