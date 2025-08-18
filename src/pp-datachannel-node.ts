import { ProxyServer, TransportPolicy } from "./context";

export enum PeerState {
  connecting = "connecting",
  connected = "connected",
  disconnected = "disconnected",
}

// refer to https://github.com/murat-dogan/node-datachannel/blob/v0.1.8/lib/index.d.ts
interface PeerOption {
  remote_id: string;
  signalsrv: any;
  iceServers: string[];
  proxyServer?: ProxyServer;
  enableIceTcp?: boolean;
  portRangeBegin?: number;
  portRangeEnd?: number;
  maxMessageSize?: number;
  iceTransportPolicy?: TransportPolicy;
}

interface RtcConfig {
  iceServers: string[];
  proxyServer?: ProxyServer;
  enableIceTcp?: boolean;
  portRangeBegin?: number;
  portRangeEnd?: number;
  maxMessageSize?: number;
  iceTransportPolicy?: TransportPolicy;
}

class PeerDataChannel {
  private logger_: any = console;

  private option_: PeerOption;
  private remote_: string;
  private signal_: any;
  private datach_: any; // data channel
  private mypeer_: any; // peer connection
  private mywish_ = {};

  private statechange_: any; // state change callback function
  private datareceive_: any; // data receive callback function

  constructor(option: PeerOption, logger: any = console) {
    this.logger_ = logger;
    this.option_ = option;
    this.remote_ = option.remote_id;
    this.signal_ = option.signalsrv;
    const nodeDataChannel = require("./node_datachannel.node");
    nodeDataChannel.initLogger("Warning");

    // stringify then parse for clean undefined json key
    const rtcConfig: RtcConfig = JSON.parse(
      JSON.stringify({
        iceServers: this.option_.iceServers,
        proxyServer: this.option_.proxyServer,
        enableIceTcp: this.option_.enableIceTcp,
        portRangeBegin: this.option_.portRangeBegin,
        portRangeEnd: this.option_.portRangeEnd,
        maxMessageSize: this.option_.maxMessageSize,
        iceTransportPolicy: this.option_.iceTransportPolicy,
      })
    );

    const peerConnection = new nodeDataChannel.PeerConnection(
      "pc",
      JSON.parse(JSON.stringify(rtcConfig))
    );
    peerConnection.onStateChange(this.onStateChange.bind(this));
    peerConnection.onGatheringStateChange(
      this.onGatheringStateChange.bind(this)
    );
    peerConnection.onLocalDescription(this.onLocalDescription.bind(this));
    peerConnection.onLocalCandidate(this.onLocalCandidate.bind(this));
    peerConnection.onDataChannel(this.onDataChannel.bind(this));
    this.mypeer_ = peerConnection;
  }

  public statechange(callback) {
    this.statechange_ = callback;
  }

  public datareceive(callback) {
    this.datareceive_ = callback;
  }

  public peer() {
    return (
      this.mypeer_ || {
        send: (data: string | Buffer): boolean => false,
      }
    );
  }

  public addWishList(list: string[]) {
    if (Array.isArray(list)) {
      for (const event of list) {
        this.mywish_[event] = {
          /* for extend */
        };
      }
    }
  }

  public delWishList(list: string[]) {
    if (Array.isArray(list)) {
      for (const event of list) {
        delete this.mywish_[event];
      }
    }
  }

  public isYourWish(event: string): boolean {
    return this.mywish_.hasOwnProperty(event);
  }

  public send(data: string | Buffer): boolean {
    try {
      if (!this.datach_) return false;
      else if (data instanceof Buffer) this.datach_.sendMessageBinary(data);
      else if (typeof data === "string") this.datach_.sendMessage(data);
      else return false;
      return true;
    } catch (e) {
      this.logger_.debug(`[core.pptp.peerdc] ex@send(), ${e.message}`);
      return false;
    }
  }

  private onStateChange(state: PeerState) {
    if (this.statechange_) {
      this.statechange_(state, this.remote_);
    }
    switch (state) {
      case PeerState.connecting:
      case PeerState.connected:
      case PeerState.disconnected:
        break;
      default:
        break;
    }
  }

  private onGatheringStateChange(state) {
    this.logger_.debug(`[core.pptp.peerdc] onGatheringStateChange => ${state}`);
    switch (state) {
      case "in-progress":
      case "complete":
        break;
      default:
        break;
    }
  }

  private onLocalDescription(description, type) {
    switch (type) {
      case "answer":
        this.signal_.send(
          JSON.stringify({ id: this.remote_, type, description })
        );
        break;
      default:
        break;
    }
  }

  private onLocalCandidate(candidate, mid) {
    this.signal_.send(
      JSON.stringify({
        id: this.remote_,
        type: "candidate",
        candidate,
        mid,
      })
    );
  }

  private onDataChannel(dc) {
    this.datach_ = dc;
    dc.onMessage(this.onMessage.bind(this));
  }

  private onMessage(msg) {
    try {
      if (this.datareceive_) {
        this.datareceive_(msg, this.remote_);
      }
    } catch (e) {
      this.logger_.debug(`[core.pptp.peerdc] ex@onMessage(), ${e.message}`);
    }
  }
}

export default PeerDataChannel;
