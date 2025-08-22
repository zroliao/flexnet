import FSM from "../utils/fsm";
import * as ping from "ping";
import * as WebSocket from "ws";
import PeerFSM from "./edge-fsm";
import { FlexNet, Jrpc } from "../types";
import { getPublicIpAddress } from "../collect-info";
import { createJrpcRequestString } from "../utils/util";
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
  private tag_: string = "[core.pptp.server]";
  private geoip_: FlexNet.GeoIP = {};
  private peers_ = {};
  private logger_: any = console;
  private option_: FlexNet.EdgeConfig | null = null;
  private signal_: WebSocket | null = null;
  private server_: string = "";
  private aliveTimer_: NodeJS.Timeout | null = null;
  private signalAliveTime_: number = Date.now();
  private aliveInterval_: number = 60 * 1000; // 60 sec

  private myPublicIp_: string | null = null;
  private pubipTimer_: NodeJS.Timeout | null = null; // interval updater
  private pubipInterval_: number = 15 * 60 * 1000; // 15 min

  private datareceive_: any;

  private lastRecvSvrPing_: number = Date.now();

  private supericeValue_: number = 5;
  private supericeCount_: number = 0;

  constructor(
    /* @param */ option: FlexNet.EdgeConfig,
    /* @param */ logger: any = console
    /* RETURN */
  ) {
    /* ****** */
    super(PeerFSM);
    this.logger_ = logger;
    this.option_ = option;
    this.server_ = `${this.option_.signal_server}/${this.option_.peer_id}`;
    this.startFsm();
  }

  public datareceive(callback) {
    this.datareceive_ = callback;
  }

  public connect(): boolean {
    const result = this.fsm().send("CONNECT");
    return result.changed;
  }

  public sendByWish(event: string, buffer: string | Buffer) {
    const keys = Object.keys(this.peers_);
    keys.forEach((key: string) => {
      const peer: PeerDataChannel = this.peers_[key];
      if (peer.isYourWish(event)) peer.send(buffer);
    });
  }

  protected stateChange(state) {
    switch (state.value) {
      case "idle": {
        this.logger_.info(`${this.tag_} state=${state.value}`);
        if (this.signal_) this.signal_.terminate();
        break;
      }
      case "connecting": {
        this.signal_ = new WebSocket(this.server_, {
          rejectUnauthorized: false,
        });
        this.signal_.binaryType = "arraybuffer";
        this.signal_.onopen = this.onSignalOpen.bind(this);
        this.signal_.onclose = this.onSignalClose.bind(this);
        this.signal_.onerror = this.onSignalError.bind(this);
        this.signal_.onmessage = this.onSignalMessage.bind(this);
        this.signal_.on("ping", this.pong.bind(this));
        break;
      }
      case "connected": {
        this.logger_.info(`${this.tag_} state=${state.value}`);
        this.signalAliveTime_ = Date.now();

        this.aliveTimer_ = setInterval(() => {
          //
          // 送出 session alive
          this.logger_.info(`>>>送出時間: ${Date.now()}`);
          this.signal_.send(
            createJrpcRequestString("signal.session.alive"),
            (err?: Error) => {
              if (!err) return;
              this.logger_.warn(
                `${this.tag_} send @alive fail. ${err.message}`
              );
              this.fsm().send("ERROR");
              return;
            }
          );
          //
          // 確認 timeout
          const isTimeout: boolean =
            Date.now() - this.signalAliveTime_ > this.aliveInterval_ + 5000;
          if (isTimeout) {
            this.logger_.info(`>>>現在時間:${Date.now()}`);
            this.logger_.info(`>>>最後時間:${this.signalAliveTime_}`);
            this.logger_.info(
              `>>>相差時間:${Date.now() - this.signalAliveTime_}`
            );
            this.logger_.info(`>>>`);
            this.logger_.warn(`${this.tag_} signal server timeout happened.`);
            this.fsm().send("ERROR");
            return;
          }
          //
          // 確認長期沒有收到 ping
          if (Date.now() - this.lastRecvSvrPing_ > 700 * 1000 * 1000) {
            this.logger_.error(
              `${this.tag_} long time not receive server ping.`
            );
            this.exitProcess(1);
            return;
          }
          //
        }, this.aliveInterval_);

        this.pubipTimer_ = setInterval(async () => {
          if (!(await pingGoogleIsConnected())) return;
          const ip: string | null = await getPublicIpAddress();
          if (ip === null || ip === this.myPublicIp_) return;
          this.logger_.info(`${this.tag_} detect external ip changed`);
          this.fsm().send("ERROR");
        }, this.pubipInterval_);

        break;
      }
      case "disconnect": {
        clearInterval(this.aliveTimer_);
        clearInterval(this.pubipTimer_);
        if (this.signal_) this.signal_.terminate();
        break;
      }
      default: {
        break;
      }
    }
  }

  private async exitProcess(errcode: number) {
    this.logger_.warn(`${this.tag_} prepare for exit process(err:${errcode})`);
    if (!(await pingGoogleIsConnected())) {
      this.logger_.warn(
        `${this.tag_} ignore process exit, you lost internet(err:${errcode})`
      );
    } else {
      this.logger_.warn(
        `${this.tag_} detect pptp error, force exit process.(err:${errcode})`
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
        this.supericeCount_ < this.supericeValue_
      ) {
        this.supericeCount_++;
        this.logger_.warn(
          `${this.tag_} detect state machine error, count(${this.supericeCount_})`
        );
        return;
      } else if (this.state() !== "connected") {
        this.exitProcess(1);
      } else {
        this.logger_.info(`${this.tag_} receive ping callback`);
        this.lastRecvSvrPing_ = Date.now();
        if (this.signal_) this.signal_.pong();
      }
    } catch (ex: any) {
      // nothing to do
    }
  }

  private async onSignalOpen() {
    let ip: string = DEFAULT_WAN_IP;
    if (await pingGoogleIsConnected()) {
      ip = await getPublicIpAddress();
      if (ip !== null) this.geoip_.wanIp = ip;
      else this.logger_.warn(`${this.tag_} get public ip fail(${ip})`);
    } else if (!this.geoip_?.wanIp) {
      this.geoip_.wanIp = DEFAULT_WAN_IP;
    }

    this.myPublicIp_ = this.geoip_.wanIp || ip;

    const request: string = createJrpcRequestString("signal.session.auth", {
      version: "x.x.x",
      username: this.option_.username,
      password: this.option_.password,
    });

    const onerror = (err?: Error) => {
      if (!err) return;
      this.logger_.warn(`${this.tag_} auth fail, ${err.message}`);
      this.fsm().send("ERROR");
    };

    this.signal_.send(request, onerror);
    this.fsm().send("SUCCESS");
  }

  private onSignalClose() {
    this.logger_.warn(`${this.tag_} detect signal server connection close`);
    this.fsm().send("ERROR");
  }

  private onSignalError(err: any) {
    this.logger_.warn(`${this.tag_} signal server error(${err?.message})`);
    this.fsm().send("ERROR");
  }

  private handleJsonrpc(message: Jrpc.Message) {
    switch (message.method) {
      case "signal.session.alive":
        this.signalAliveTime_ = Date.now();
        break;
      default:
        break;
    }
  }

  private handleWebrtc(message: any) {
    switch (message.type) {
      case "offer":
        this.peers_[message.id] = new PeerDataChannel(
          {
            remote_id: message.id,
            signalsrv: this.signal_,
            iceServers: this.option_.ice_servers,
            proxyServer: this.option_.proxy_server,
            enableIceTcp: this.option_.enable_ice_tcp,
            portRangeBegin: this.option_.port_range_begin || 1024,
            portRangeEnd: this.option_.port_range_end || 65535,
            maxMessageSize: this.option_.max_message_size || 256 * 1024,
            iceTransportPolicy: this.option_.ice_transport_policy,
            mtu: this.option_.mtu || 1200,
          } as any,
          this.logger_
        );
        this.peers_[message.id].statechange(this.peerStateChange.bind(this));
        this.peers_[message.id].datareceive(this.peerDataReceive.bind(this));
        this.peers_[message.id]
          .peer()
          .setRemoteDescription(message.description, message.type);
        break;
      case "answer":
        this.peers_[message.id]
          .peer()
          .setRemoteDescription(message.description, message.type);
        break;
      case "candidate":
        this.peers_[message.id]
          .peer()
          .addRemoteCandidate(message.candidate, message.mid);
        break;
      default:
        break;
    }
  }

  private onSignalMessage(input: MessageEvent) {
    try {
      const message = JSON.parse(input.data);
      if (message.jsonrpc === "2.0") {
        this.handleJsonrpc(message);
      } else {
        this.handleWebrtc(message);
      }
    } catch (ex) {
      console.error(ex.stack);
    }
  }

  private peerStateChange(state: PeerState, remoteId: string) {
    switch (state) {
      case PeerState.disconnected:
        delete this.peers_[remoteId];
        break;
      default:
        break;
    }
  }

  private async peerDataReceive(buffer: Buffer, remoteId: string) {
    try {
      if (this.datareceive_) {
        await this.datareceive_(buffer, this.peers_[remoteId]);
      }
    } catch (e) {
      console.error(e.stack);
    }
  }
}

export default PPClient;
