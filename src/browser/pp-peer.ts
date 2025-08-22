import FSM from "../utils/fsm";
import { JrpcSignal } from "../types";
import { createJrpcRequestString } from "../utils/util";
import PeerDataChannel, { PeerState } from "./pp-datachannel-web";

interface PeerOption {
  version: string;
  username: string;
  password: string;
  peer_id: string;
  offer_id?: string;
  signal_server: string;
  ice_servers: RTCIceServer[];
  ice_transport_policy?: RTCIceTransportPolicy;
}

const PeerFSM = {
  id: "PPTP",
  initial: "idle",
  states: {
    idle: {
      on: { CONNECT: "connecting" },
    },
    connecting: {
      on: {
        SUCCESS: "connected",
        CLOSE: "disconnect",
        ERROR: "disconnect",
      },
    },
    connected: {
      on: {
        CLOSE: "closing",
        ERROR: "disconnect",
      },
    },
    closing: {
      on: {
        NEXT: "idle",
      },
    },
    disconnect: {
      on: {
        ERROR: "connecting",
      },
      after: {
        1000: "connecting",
      },
    },
  },
};

class PPPeer extends FSM {
  private onopen_!: any | null; // like WebSocket interface
  private onclose_!: any | null; // like WebSocket interface
  private onerror_!: any | null; // like WebSocket interface
  private onmessage_!: any | null; // like WebSocket interface
  private readyState_!: number; // like WebSocket interface
  private offerId_!: string; // remote peerid

  private remote_: PeerDataChannel | null = null; // remote data channel
  private option_: PeerOption | null = null;
  private signal_: WebSocket | null = null;
  private server_: string = "";

  constructor(option: PeerOption) {
    super(PeerFSM);
    this.option_ = option;
    this.offerId_ = this.option_.offer_id ?? "";
    this.server_ = `${this.option_.signal_server}/${this.option_.peer_id}`;
    this.startFsm();
  }

  public connect() {
    const result = this.fsm().send("CONNECT");
    return result.changed;
  }

  public sendByWish(event: string, buffer: string | ArrayBuffer) {
    if (!this.remote_) return;
    else if (this.remote_.isYourWish(event)) {
      this.remote_.send(buffer);
    }
  }

  public send(buffer: string | ArrayBuffer) {
    if (this.remote_) this.remote_.send(buffer);
  }

  public close() {
    this.fsm().send("CLOSE");
  }

  set onopen(callback: any) {
    this.onopen_ = callback;
  }

  set onclose(callback: any) {
    this.onclose_ = callback;
  }

  set onerror(callback: any) {
    this.onerror_ = callback;
  }

  set onmessage(callback: any) {
    this.onmessage_ = callback;
  }

  get readyState(): number {
    return this.readyState_;
  }

  protected async stateChange(state) {
    switch (state.value) {
      case "idle":
        // console.log(`[pp.peer] state=${state.value}`);
        this.readyState_ = WebSocket.CLOSED;
        break;
      case "connecting":
        this.signal_ = new WebSocket(this.server_);
        this.signal_.binaryType = "arraybuffer";
        this.signal_.onopen = this.onSignalOpen.bind(this);
        this.signal_.onclose = this.onSignalClose.bind(this);
        this.signal_.onerror = this.onSignalError.bind(this);
        this.signal_.onmessage = this.onSignalMessage.bind(this);
        this.readyState_ = WebSocket.CONNECTING;
        break;
      case "connected":
        // console.log(`[pp.peer] state=${state.value}`);
        this.readyState_ = WebSocket.OPEN;
        if (this.offerId_ !== "") {
          this.remote_ = new PeerDataChannel({
            remote_id: this.offerId_,
            signalsrv: this.signal_,
            iceServers: this.option_.ice_servers,
            iceTransportPolicy: this.option_.ice_transport_policy,
          });
          await this.remote_.offerPeerConnection();
          this.remote_.statechange(this.peerStateChange.bind(this));
          this.remote_.datareceive(this.peerDataReceive.bind(this));
          this.remote_.dcopen(this.peerDCOpen.bind(this));
          this.remote_.dcclose(this.peerDCClose.bind(this));
          this.remote_.dcerror(this.peerDCError.bind(this));
        }
        break;
      case "closing":
        this.onopen_ = null;
        this.onclose_ = null;
        this.onerror_ = null;
        this.onmessage_ = null;
        this.closing();
        this.fsm().send("NEXT");
        break;
      case "disconnect":
        // console.log(`[pp.peer] state=${state.value}`);
        this.closing();
        this.readyState_ = WebSocket.CLOSING;
        break;
      default:
        break;
    }
  }

  private closing() {
    if (this.signal_) {
      this.signal_.close();
      this.signal_ = null;
    }
    if (this.remote_) {
      this.remote_.close();
      this.remote_ = null;
    }
  }

  private onSignalOpen() {
    //
    const params: JrpcSignal.SessionAuthParams = {
      username: this.option_.username,
      password: this.option_.password,
      version: this.option_.version,
    };

    const request: string =
      createJrpcRequestString(
        "signal.session.auth",
        params
      );

    this.signal_.send(request);
    this.fsm().send("SUCCESS");
  }

  private onSignalClose() {
    this.fsm().send("ERROR");
  }

  private onSignalError(err: any) {
    this.fsm().send("ERROR");
  }

  private async onSignalMessage(data: any) {
    try {
      const msg = JSON.parse(data.data);
      switch (msg.type) {
        case "offer":
          this.remote_ = new PeerDataChannel({
            remote_id: msg.id,
            signalsrv: this.signal_,
            iceServers: this.option_.ice_servers,
          });
          this.remote_.statechange(this.peerStateChange.bind(this));
          this.remote_.datareceive(this.peerDataReceive.bind(this));
          await this.remote_.peer().setRemoteDescription({
            sdp: msg.description,
            type: msg.type,
          });
          break;
        case "answer":
          await this.remote_.peer().setRemoteDescription({
            sdp: msg.description,
            type: msg.type,
          });
          break;
        case "candidate":
          await this.remote_.peer().addIceCandidate({
            candidate: msg.candidate,
            sdpMid: msg.mid,
          });
          break;
        default:
          break;
      }
    } catch (ex) {
      console.error(ex.stack);
    }
  }

  private peerStateChange(state: PeerState) {
    switch (state) {
      case PeerState.failed:
        /*
         not handle disconnected state instead of handle failed state here beacause
         when disconnected happened peer connection need to restart ICE not re-new a PeerDataChannel
         so failed state is our termination state
        */
        this.remote_ = null;
        break;
      default:
        break;
    }
  }

  private async peerDataReceive(buffer: ArrayBuffer) {
    try {
      if (this.onmessage_) {
        await this.onmessage_({ data: buffer });
      }
    } catch (e) {
      console.error(e.stack);
    }
  }
  private async peerDCOpen() {
    try {
      if (this.onopen_) {
        await this.onopen_();
      }
    } catch (e) {
      console.error(e.stack);
    }
  }

  private async peerDCClose() {
    try {
      if (this.onclose_) {
        await this.onclose_();
      }
    } catch (e) {
      console.error(e.stack);
    }
  }

  private async peerDCError(err) {
    try {
      if (this.onerror_) {
        await this.onerror_(err);
      }
    } catch (e) {
      console.error(e.stack);
    }
  }
}

export default PPPeer;
