import PPPeer from "./pp-peer";

interface PeerOption {
  version: string;
  username: string;
  password: string;
  peer_id: string;
  offer_id: string;
  signal_server: string;
  ice_servers: RTCIceServer[];
  ice_transport_policy?: RTCIceTransportPolicy;
}

// reference from WebSocket so the event type won't change here
const EventType = {
  WSOCKET_DATA: "WSOCKET_DATA",
  WSOCKET_OPEN: "WSOCKET_OPEN",
  WSOCKET_CLOSE: "WSOCKET_CLOSE",
  WSOCKET_ERROR: "WSOCKET_ERROR",
};

class PeerWrapper {
  //
  private peer_: PPPeer;
  private report_: any;
  private option_!: PeerOption;

  constructor(option: PeerOption, report: any) {
    this.option_ = option;
    this.report_ = report;
  }

  public send(data) {
    if (this.peer_) this.peer_.send(data);
  }

  public open() {
    try {
      if (!this.peer_) {
        this.peer_ = new PPPeer(this.option_);
        this.peer_.onopen = this.onOpen.bind(this);
        this.peer_.onclose = this.onClose.bind(this);
        this.peer_.onerror = this.onError.bind(this);
        this.peer_.onmessage = this.onData.bind(this);
        this.peer_.connect();
      }
    } catch (err) {
      console.error(err);
    }
  }

  public close() {
    if (this.peer_) {
      if (this.peer_.readyState === WebSocket.OPEN) {
        this.peer_.close();
        this.peer_ = null;
      } else if (this.peer_.readyState === WebSocket.CLOSED) {
        this.peer_ = null;
      } else if (this.peer_.readyState === WebSocket.CLOSING) {
        this.peer_ = null;
      }
    }
  }

  private onOpen() {
    this.report_(this, { type: EventType.WSOCKET_OPEN });
  }

  private onClose() {
    this.report_(this, { type: EventType.WSOCKET_CLOSE });
  }

  private onError(err: any) {
    this.report_(this, { type: EventType.WSOCKET_ERROR, error: err });
  }

  private onData(recvEvent: any) {
    this.report_(this, { type: EventType.WSOCKET_DATA, data: recvEvent.data });
  }
}

class PPClient {
  //
  private PC_: PeerWrapper | null = null; // PC: peer connection
  private openCallback_: () => void;
  private dataCallback_: (data: any) => void;
  private lossCallback_: () => void;
  private isConnected_: boolean = false;

  constructor(
    option: PeerOption,
    openCallback: () => void,
    dataCallback: (data: any) => void,
    lossCallback?: () => void
  ) {
    this.openCallback_ = openCallback;
    this.dataCallback_ = dataCallback;
    this.lossCallback_ = lossCallback;
    this.PC_ = new PeerWrapper(option, this.handleEvent.bind(this));
    this.PC_.open();
  }

  //  for forcing close the peer connection
  public terminate() {
    this.PC_.close();
  }

  public send(data) {
    if (!this.PC_) throw new Error(`peer connection not exist`);
    this.PC_.send(data);
  }

  private forwardMsg(event: any) {
    try {
      if (this.dataCallback_) this.dataCallback_(event?.data);
    } catch (err) {
      // pass
    }
  }

  private handleEvent(client: PeerWrapper, event: any) {
    switch (event.type) {
      case EventType.WSOCKET_DATA: {
        this.forwardMsg(event);
        break;
      }
      case EventType.WSOCKET_OPEN: {
        if (this.isConnected_ === false && this.openCallback_) {
          console.info("[PC] peer data channel client open");
          this.isConnected_ = true;
          this.openCallback_();
        }
        break;
      }
      case EventType.WSOCKET_ERROR:
      case EventType.WSOCKET_CLOSE: {
        if (this.isConnected_ === true && this.lossCallback_) {
          console.error("[PC] peer data channel client close");
          this.isConnected_ = false;
          this.lossCallback_();
        }
        setTimeout(() => {
          this.PC_.close();
          this.PC_.open();
        }, 1000);
        break;
      }
      default: {
        break;
      }
    }
  }
}

export default PPClient;
