import * as $pb from "../protobuf";
import { uuid } from "../utils/util";
import RpcHelper from "../rpc-helper";
import { FlexNet, Jrpc, RpcSignal } from "../types";

interface Options {
  version: string;
  authenticated: boolean;
  connected: boolean;
}

type PeerId = string; // pptp://a9999/s101/b1/2/0
type SessionMap = Map<PeerId, any>; // webSocket connections
type OptionsMap = Map<PeerId, Options>; // more options for connections

class SignalSessionManager {
  //
  private _logger: any = console;
  private _clientConn: SessionMap = new Map(); // all of the client connection
  private _clientOpts: OptionsMap = new Map(); // all of the client options

  constructor(logger: FlexNet.Logger) {
    this._logger = logger ? logger : console;
  }

  public onMessage(
    /* @param */ message: $pb.rpc.RpcMessage | string,
    /* @param */ ws: any | null
    /* RETURN */
  ): void {
    //
    if (typeof message === "string") {
      this.doGeneralMessage(JSON.parse(message), ws);
      return;
    }

    switch (message.method) {
      case "signal.session.auth":
        this.closeOldConnection(ws);
        this.doSessionAuth(message, ws);
        break;
      case "signal.session.alive":
        if (!this.isAuthorizedSession(ws)) return;
        this.doSessionAlive(message, ws);
        break;
      default:
        this.doGeneralMessage(message, ws);
        // this.logger_.info(`debug> signal server, unknown message, ${ws.url}`);
        // ws.close();
        break;
    }
  }

  public onClientClose(ws: any) {
    const peerId: PeerId = this.toPeerId(ws);
    if (this._clientConn.get(peerId) !== ws) return;

    // this.logger_.info(`debug> signal server, session close, ${ws.url}`);
    if (this._clientConn.has(peerId)) {
      // this.logger_.info(`debug> signal server, session close.delete, ${ws.url}`);
      this._clientConn.delete(peerId);
    }
    if (this._clientOpts.has(peerId)) {
      const opts: Options = this._clientOpts.get(peerId);
      opts.authenticated = false;
      opts.connected = false;
    }
  }

  private closeOldConnection(ws: any) {
    // this.logger_.info(`debug> signal server, recv auth message, ${ws.url}`);
    if (this.isDuplicateSession(ws)) {
      const peerId: PeerId = this.toPeerId(ws);
      const oldConnection: any = this._clientConn.get(peerId);
      this.onClientClose(oldConnection);
      oldConnection.close();
      // this.logger_.info(`debug> signal server, duplicate session, ${ws.url}`);
    }
  }

  private toPeerId(ws: any): PeerId {
    return ws.url.slice(1);
  }

  private doGeneralMessage(message: any, ws: any) {
    const destId: PeerId = message.id;
    if (!this._clientConn.has(destId)) return;

    const destWs = this._clientConn.get(destId);
    const copy: any = JSON.parse(JSON.stringify(message));
    copy.id = this.toPeerId(ws);
    if (destWs.isClosed !== true) destWs.send(JSON.stringify(copy));
  }

  private doSessionAlive(
    /* @param */ message: $pb.rpc.RpcMessage,
    /* @param */ ws: any
    /* RETURN */
  ): void {
    //
    if (ws.isClosed !== true) {
      const { method, id } = message;
      ws.send(RpcHelper.createRpcJsonResponse({}, method, id));
    }
  }

  private doSessionAuth(
    /* @param */ message: $pb.rpc.RpcMessage,
    /* @param */ ws: any
    /* RETURN */
  ): void {
    //
    if (!message.params) throw new Error("auth fail, params is empty");
    const params = RpcHelper.fetchRpcJsonData(message);
    if (!this.matchUsernamePassword(params)) {
      // 核實帳號密碼
      ws.close();
      throw new Error(`signal-server, username or password not match`);
    } else if (this.isDuplicateSession(ws)) {
      // 確認不重覆連結 (FIXME:為什麼不close連結?)
      throw new Error(`signal-server, detect duplicate session(${ws.url})`);
    }

    const peerId: PeerId = this.toPeerId(ws);
    this._clientConn.set(peerId, ws);

    if (!this._clientOpts.has(peerId)) {
      // this.logger_.info(`debug> signal server, first time incoming session, ${ws.url}`);
      this._clientOpts.set(peerId, {
        version: params.version ?? "0.0.0",
        authenticated: true,
        connected: true,
      });
    } else {
      const option: Options = this._clientOpts.get(peerId);
      option.authenticated = true;
      option.connected = true;
      option.version = params.version ?? "0.0.0";
      // this.logger_.info(`debug> signal server, auth success, ${ws.url}`);
    }
  }

  private matchUsernamePassword(params: RpcSignal.SessionAuthParams): boolean {
    return (
      params.username === "specific-your-username" &&
      params.password === "specific-your-password"
    );
  }

  private isAuthorizedSession(ws: any): boolean {
    const id: PeerId = this.toPeerId(ws);
    if (this._clientConn.get(id) !== ws) return false;
    else if (!this._clientOpts.has(id)) return false;
    else return this._clientOpts.get(id).authenticated === true;
  }

  private isDuplicateSession(ws: any): boolean {
    const id: PeerId = this.toPeerId(ws);
    return this._clientConn.has(id);
  }
}

export default SignalSessionManager;
