import {FlexNet} from "../types";

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
  proxyServer?: FlexNet.ProxyServer;
  enableIceTcp?: boolean;
  portRangeBegin?: number;
  portRangeEnd?: number;
  maxMessageSize?: number;
  iceTransportPolicy?: FlexNet.TransportPolicy;
}

interface RtcConfig {
  iceServers: string[];
  proxyServer?: FlexNet.ProxyServer;
  enableIceTcp?: boolean;
  portRangeBegin?: number;
  portRangeEnd?: number;
  maxMessageSize?: number;
  iceTransportPolicy?: FlexNet.TransportPolicy;
}

class PeerDataChannel {
  private _logger: any = console;

  private _option: PeerOption;
  private _remote: string;
  private _signal: any;
  private _datach: any; // data channel
  private _mypeer: any; // peer connection
  private _mywish = {};

  private _statechange: any; // state change callback function
  private _datareceive: any; // data receive callback function

  constructor(option: PeerOption, logger: any = console) {
    this._logger = logger;
    this._option = option;
    this._remote = option.remote_id;
    this._signal = option.signalsrv;
    const nodeDataChannel = require("./node_datachannel.node");
    nodeDataChannel.initLogger("Warning");

    // stringify then parse for clean undefined json key
    const rtcConfig: RtcConfig = JSON.parse(
      JSON.stringify({
        iceServers: this._option.iceServers,
        proxyServer: this._option.proxyServer,
        enableIceTcp: this._option.enableIceTcp,
        portRangeBegin: this._option.portRangeBegin,
        portRangeEnd: this._option.portRangeEnd,
        maxMessageSize: this._option.maxMessageSize,
        iceTransportPolicy: this._option.iceTransportPolicy,
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
    this._mypeer = peerConnection;
  }

  public statechange(callback) {
    this._statechange = callback;
  }

  public datareceive(callback) {
    this._datareceive = callback;
  }

  public peer() {
    return (
      this._mypeer || {
        send: (data: string | Buffer): boolean => false,
      }
    );
  }

  public addWishList(list: string[]) {
    if (Array.isArray(list)) {
      for (const event of list) {
        this._mywish[event] = {
          /* for extend */
        };
      }
    }
  }

  public delWishList(list: string[]) {
    if (Array.isArray(list)) {
      for (const event of list) {
        delete this._mywish[event];
      }
    }
  }

  public isYourWish(event: string): boolean {
    return this._mywish.hasOwnProperty(event);
  }

  public send(data: string | Buffer): boolean {
    try {
      if (!this._datach) return false;
      else if (data instanceof Buffer) this._datach.sendMessageBinary(data);
      else if (typeof data === "string") this._datach.sendMessage(data);
      else return false;
      return true;
    } catch (e) {
      this._logger.debug(`[core.pptp.peerdc] ex@send(), ${e.message}`);
      return false;
    }
  }

  private onStateChange(state: PeerState) {
    if (this._statechange) {
      this._statechange(state, this._remote);
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
    this._logger.debug(`[core.pptp.peerdc] onGatheringStateChange => ${state}`);
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
        this._signal.send(
          JSON.stringify({ id: this._remote, type, description })
        );
        break;
      default:
        break;
    }
  }

  private onLocalCandidate(candidate, mid) {
    this._signal.send(
      JSON.stringify({
        id: this._remote,
        type: "candidate",
        candidate,
        mid,
      })
    );
  }

  private onDataChannel(dc) {
    this._datach = dc;
    dc.onMessage(this.onMessage.bind(this));
  }

  private onMessage(msg) {
    try {
      if (this._datareceive) {
        this._datareceive(msg, this._remote);
      }
    } catch (e) {
      this._logger.debug(`[core.pptp.peerdc] ex@onMessage(), ${e.message}`);
    }
  }
}

export default PeerDataChannel;
