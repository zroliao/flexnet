import moment = require("moment");
import { Logger } from "../context";
import { Jrpc, JrpcSignal } from "../types";
import { createJrpcResponseString } from "../util";

interface WscOption {
  version: string;
  role: "AIS-Master" | "AIS-Slave" | "AIS-follower" | "Unknown";
  privateIp: string;
  authenticated: boolean;
  firstTime: string;
  lastTime: string;
  connected: boolean;
  retryTimes: number;
  pingTimes: number;
  pongTimes: number;
  geoip?: {
    wanIp: string;
    country: string;
    city: string;
    timezone: string;
    latitude: number;
    longitude: number;
  };
}

type PeerId = string; // pptp://a9999/s101/b1/2/0
type WscMap = Map<PeerId, any>; // webSocket connections
type OptMap = Map<PeerId, WscOption>; // more options for connections

class SignalServer {
  //
  private _logger: any = console;
  private _clientConn: WscMap = new Map(); // all of the client connection
  private _clientOpts: OptMap = new Map(); // all of the client options

  constructor(logger: Logger) {
    this._logger = logger ? logger : console;
  }

  public onJrpcMessage(
    /* @param */ message:
      | Jrpc.Notification
      | Jrpc.Request
      | Jrpc.Response
      | Jrpc.Error
      | string,
    /* @param */ ws: any | null
    /* RETURN */
  ): void {
    //
    switch ((message as any)?.method) {
      case "signal.session.auth":
        this.closeOldConnection(ws);
        this.doSessionAuth(message as JrpcSignal.SessionAuthRequest, ws);
        break;
      case "signal.session.alive":
        if (!this.isAuthorizedSession(ws)) return;
        this.doSessionAlive(message as JrpcSignal.SessionAliveRequest, ws);
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
      const opts: WscOption = this._clientOpts.get(peerId);
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
    /* @param */ message: JrpcSignal.SessionAliveRequest,
    /* @param */ ws: any
    /* RETURN */
  ): void {
    //
    if (ws.isClosed !== true) {
      const { method, id } = message;
      ws.send(createJrpcResponseString(method, id));
    }
  }

  private doSessionAuth(
    /* @param */ message: JrpcSignal.SessionAuthRequest,
    /* @param */ ws: any
    /* RETURN */
  ): void {
    //
    if (!this.matchUsernamePassword(message)) {
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
        version: message.params.version ?? "0.0.0",
        role: "Unknown",
        privateIp: "",
        authenticated: true,
        firstTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        lastTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        connected: true,
        retryTimes: 1,
        pingTimes: 0,
        pongTimes: 0,
      });
    } else {
      const option: WscOption = this._clientOpts.get(peerId);
      option.authenticated = true;
      option.connected = true;
      option.version = message.params.version ?? "0.0.0";
      // this.logger_.info(`debug> signal server, auth success, ${ws.url}`);
    }
  }

  private matchUsernamePassword(message: Jrpc.Request): boolean {
    return (
      message.params.username === "37012eaa-4ef2-46d0-a079-855fceb13a29" &&
      message.params.password === "49aa53b8-f965-4312-b3fc-12d21bf66103"
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

export default SignalServer;
