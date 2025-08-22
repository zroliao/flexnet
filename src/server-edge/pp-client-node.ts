import * as ping from "ping";
import FSM from "../utils/fsm";
import * as WebSocket from "ws";
import PeerFSM from "./edge-fsm";
import * as $pb from "../protobuf";
import { uuid } from "../utils/util";
import RpcHelper from "../rpc-helper";
import { FlexNet, Jrpc } from "../types";
import { getPublicIpAddress } from "../collect-info";
import PeerDataChannel, { PeerState } from "./pp-datachannel-node";

const DEFAULT_WAN_IP: string = "0.0.0.0";

async function pingGoogleIsConnected(): Promise<boolean> {
  return new Promise<boolean>((done) => {
    const pingCfg = { timeout: 3, extra: ["-i", "1"] };
    ping.sys.probe(
      "google.com",
      (isAlive: boolean) => {
        done(isAlive);
      },
      pingCfg
    );
  });
}

class PPClient extends FSM {
  //
  private _tag: string = "[core.pptp.server]";
  private _geoip: FlexNet.GeoIP = {};
  private _peers = {};
  private _logger: any = console;
  private _option: FlexNet.EdgeConfig | null = null;
  private _signal: WebSocket | null = null;
  private _server: string = "";
  private _aliveTimer: NodeJS.Timeout | null = null;
  private _signalAliveTime: number = Date.now();
  private _aliveInterval: number = 60 * 1000; // 60 sec

  private _myPublicIp: string | null = null;
  private _pubipTimer: NodeJS.Timeout | null = null; // interval updater
  private _pubipInterval: number = 15 * 60 * 1000; // 15 min

  private _datareceive: any;

  private _lastRecvSvrPing: number = Date.now();

  private _supericeValue: number = 5;
  private _supericeCount: number = 0;

  constructor(
    /* @param */ option: FlexNet.EdgeConfig,
    /* @param */ logger: any = console
    /* RETURN */
  ) {
    /* ****** */
    super(PeerFSM);
    this._logger = logger;
    this._option = option;
    this._server = `${this._option.signal_server}/${this._option.peer_id}`;
    this.startFsm();
  }

  public datareceive(callback) {
    this._datareceive = callback;
  }

  public connect(): boolean {
    const result = this.fsm().send("CONNECT");
    return result.changed;
  }

  public sendByWish(event: string, buffer: string | Buffer) {
    const keys = Object.keys(this._peers);
    keys.forEach((key: string) => {
      const peer: PeerDataChannel = this._peers[key];
      if (peer.isYourWish(event)) peer.send(buffer);
    });
  }

  protected stateChange(state) {
    switch (state.value) {
      case "idle": {
        this._logger.info(`${this._tag} state=${state.value}`);
        if (this._signal) this._signal.terminate();
        break;
      }
      case "connecting": {
        this._signal = new WebSocket(this._server, {
          rejectUnauthorized: false,
        });
        this._signal.binaryType = "arraybuffer";
        this._signal.onopen = this.onSignalOpen.bind(this);
        this._signal.onclose = this.onSignalClose.bind(this);
        this._signal.onerror = this.onSignalError.bind(this);
        this._signal.onmessage = this.onSignalMessage.bind(this);
        this._signal.on("ping", this.pong.bind(this));
        break;
      }
      case "connected": {
        this._logger.info(`${this._tag} state=${state.value}`);
        this._signalAliveTime = Date.now();

        this._aliveTimer = setInterval(
          this.tryKeepAlive.bind(this),
          this._aliveInterval
        );

        this._pubipTimer = setInterval(async () => {
          if (!(await pingGoogleIsConnected())) return;
          const ip: string | null = await getPublicIpAddress();
          if (ip === null || ip === this._myPublicIp) return;
          this._logger.info(`${this._tag} detect external ip changed`);
          this.fsm().send("ERROR");
        }, this._pubipInterval);

        break;
      }
      case "disconnect": {
        clearInterval(this._aliveTimer);
        clearInterval(this._pubipTimer);
        if (this._signal) this._signal.terminate();
        break;
      }
      default: {
        break;
      }
    }
  }

  private async exitProcess(errcode: number) {
    this._logger.warn(`${this._tag} prepare for exit process(err:${errcode})`);
    if (!(await pingGoogleIsConnected())) {
      this._logger.warn(
        `${this._tag} ignore process exit, you lost internet(err:${errcode})`
      );
    } else {
      this._logger.warn(
        `${this._tag} detect pptp error, force exit process.(err:${errcode})`
      );
      setTimeout(() => {
        process.exit(errcode);
      }, 1000);
    }
  }

  private pong(ws: WebSocket, data: Buffer) {
    try {
      if (
        this.state() !== "connected" &&
        this._supericeCount < this._supericeValue
      ) {
        this._supericeCount++;
        this._logger.warn(
          `${this._tag} detect state machine error, count(${this._supericeCount})`
        );
        return;
      } else if (this.state() !== "connected") {
        this.exitProcess(1);
      } else {
        this._logger.info(`${this._tag} receive ping callback`);
        this._lastRecvSvrPing = Date.now();
        if (this._signal) this._signal.pong();
      }
    } catch (ex: any) {
      // nothing to do
    }
  }

  private tryKeepAlive() {
    //
    const onerror = (err?: Error) => {
      if (!err) return;
      this._logger.warn(`${this._tag} send @alive fail. ${err.message}`);
      this.fsm().send("ERROR");
      return;
    };

    this._logger.info(`>>>送出時間: ${Date.now()}`);

    const method = "signal.session.alive";
    const request = RpcHelper.createRpcJsonNotify({}, method);
    this._signal.send(request, onerror);
    //
    // 確認 timeout
    const isTimeout: boolean =
      Date.now() - this._signalAliveTime > this._aliveInterval + 5000;
    if (isTimeout) {
      this._logger.info(`>>>現在時間:${Date.now()}`);
      this._logger.info(`>>>最後時間:${this._signalAliveTime}`);
      this._logger.info(`>>>相差時間:${Date.now() - this._signalAliveTime}`);
      this._logger.info(`>>>`);
      this._logger.warn(`${this._tag} signal server timeout happened.`);
      this.fsm().send("ERROR");
      return;
    }
    //
    // 確認長期沒有收到 ping
    if (Date.now() - this._lastRecvSvrPing > 700 * 1000 * 1000) {
      this._logger.error(`${this._tag} long time not receive server ping.`);
      this.exitProcess(1);
      return;
    }
    //
  }

  private async tryUpdateGeo() {
    let ip: string = DEFAULT_WAN_IP;
    if (await pingGoogleIsConnected()) {
      ip = await getPublicIpAddress();
      if (ip !== null) this._geoip.wanIp = ip;
      else this._logger.warn(`${this._tag} get public ip fail(${ip})`);
    } else if (!this._geoip?.wanIp) {
      this._geoip.wanIp = DEFAULT_WAN_IP;
    }
    this._myPublicIp = this._geoip.wanIp || ip;
  }

  private async onSignalOpen() {
    await this.tryUpdateGeo();
    const method = "signal.session.auth";
    const payload = {
      version: "x.x.x",
      username: this._option.username,
      password: this._option.password,
    };
    const request = RpcHelper.createRpcJsonRequest(payload, method, uuid());

    const onerror = (err?: Error) => {
      if (!err) return;
      this._logger.warn(`${this._tag} auth fail, ${err.message}`);
      this.fsm().send("ERROR");
    };

    this._signal.send(request, onerror);
    this.fsm().send("SUCCESS");
  }

  private onSignalClose() {
    this._logger.warn(`${this._tag} detect signal server connection close`);
    this.fsm().send("ERROR");
  }

  private onSignalError(err: any) {
    this._logger.warn(`${this._tag} signal server error(${err?.message})`);
    this.fsm().send("ERROR");
  }

  private handleWebrtc(message: any) {
    switch (message.type) {
      case "offer":
        this._peers[message.id] = new PeerDataChannel(
          {
            remote_id: message.id,
            signalsrv: this._signal,
            iceServers: this._option.ice_servers,
            proxyServer: this._option.proxy_server,
            enableIceTcp: this._option.enable_ice_tcp,
            portRangeBegin: this._option.port_range_begin || 1024,
            portRangeEnd: this._option.port_range_end || 65535,
            maxMessageSize: this._option.max_message_size || 256 * 1024,
            iceTransportPolicy: this._option.ice_transport_policy,
            mtu: this._option.mtu || 1200,
          } as any,
          this._logger
        );
        this._peers[message.id].statechange(this.peerStateChange.bind(this));
        this._peers[message.id].datareceive(this.peerDataReceive.bind(this));
        this._peers[message.id]
          .peer()
          .setRemoteDescription(message.description, message.type);
        break;
      case "answer":
        this._peers[message.id]
          .peer()
          .setRemoteDescription(message.description, message.type);
        break;
      case "candidate":
        this._peers[message.id]
          .peer()
          .addRemoteCandidate(message.candidate, message.mid);
        break;
      default:
        break;
    }
  }

  private onSignalMessage(input: MessageEvent) {
    try {
      const decRpcM = RpcHelper.decodeRpcMessage(Buffer.from(input.data));

      switch (decRpcM.msgType) {
        case $pb.rpc.MessageType.REQUEST:
        case $pb.rpc.MessageType.RESPONSE:
        case $pb.rpc.MessageType.NOTIFY:
          if (decRpcM.method === "signal.session.alive") {
            this._signalAliveTime = Date.now();
          }
          break;
        case $pb.rpc.MessageType.SUBSCRIBE:
        case $pb.rpc.MessageType.UNSUBSCRIBE:
        default:
          break;
      }
    } catch (ex) {
      this.handleWebrtc(JSON.parse(input.data));
    }
  }

  private peerStateChange(state: PeerState, remoteId: string) {
    switch (state) {
      case PeerState.disconnected:
        delete this._peers[remoteId];
        break;
      default:
        break;
    }
  }

  private async peerDataReceive(buffer: Buffer, remoteId: string) {
    try {
      if (this._datareceive) {
        await this._datareceive(buffer, this._peers[remoteId]);
      }
    } catch (e) {
      console.error(e.stack);
    }
  }
}

export default PPClient;
