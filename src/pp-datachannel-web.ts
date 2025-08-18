export enum PeerState {
  closed = 'closed',
  connected = 'connected',
  disconnected = 'disconnected',
  failed = 'failed'
}

interface PeerOption {
  remote_id: string;
  signalsrv: any;
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
}

class PeerDataChannel {

  private option_: PeerOption;
  private remote_: string;
  private signal_: any;
  private datach_: RTCDataChannel | null;    // data channel
  private mypeer_: RTCPeerConnection | null; // peer connection
  private mywish_ = {};

  private statechange_: any;        // state change callback function
  private datareceive_: any;        // data receive callback function
  private dcopen_: any;             // data chaneel onopen callback function
  private dcclose_: any;            // data chaneel onclose callback function
  private dcerror_: any;            // data chaneel onerror callback function


  constructor(option: PeerOption) {
    this.option_ = option;
    this.remote_ = option.remote_id;
    this.signal_ = option.signalsrv;

    const config: RTCConfiguration = JSON.parse(JSON.stringify({
      iceServers: this.option_.iceServers,
      iceTransportPolicy: this.option_.iceTransportPolicy
    }));

    const peerConnection = new RTCPeerConnection(config);
    peerConnection.onconnectionstatechange = this.onStateChange.bind(this);
    peerConnection.onicegatheringstatechange = this.onGatheringStateChange.bind(this);
    peerConnection.onicecandidate = this.onLocalCandidate.bind(this);
    peerConnection.ondatachannel = this.onDataChannel.bind(this);
    peerConnection.oniceconnectionstatechange = this.onIceStateChange.bind(this);
    this.mypeer_ = peerConnection;
  }

  public statechange(callback) {
    this.statechange_ = callback;
  }

  public datareceive(callback) {
    this.datareceive_ = callback;
  }

  public dcopen(callback) {
    this.dcopen_ = callback;
  }

  public dcclose(callback) {
    this.dcclose_ = callback;
  }

  public dcerror(callback) {
    this.dcerror_ = callback;
  }

  public close() {
    this.datach_.close();
    this.mypeer_.close();
    this.datach_ = null;
    this.mypeer_ = null;
  }

  public peer(): RTCPeerConnection {
    return this.mypeer_;
  }

  public addWishList(list: string[]) {
    if (Array.isArray(list)) {
      for (const event of list) {
        this.mywish_[event] = {/* for extend */};
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

  public send(data: any): boolean {
    try {
      if (!this.datach_) return false;
      else if (ArrayBuffer.isView(data as ArrayBufferView)) this.datach_.send(data);
      else if (typeof data === 'string') this.datach_.send(data);
      else return false;
      return true;
    } catch (e) {
      console.error(e.stack);
      return false;
    }
  }


  private onStateChange() {
    const state: RTCPeerConnectionState = this.mypeer_.connectionState;
    // console.log(`onstateChange => ${state}`);
    if (this.statechange_) this.statechange_(state);
    switch (state) {
      case PeerState.connected:
        // The connection has become fully connected
        break;
      case PeerState.disconnected:
      case PeerState.failed:
        // One or more transports has terminated unexpectedly or in an error
        this.onError(new Error('One or more transports has terminated unexpectedly or in an error'));
        break;
      case PeerState.closed:
        // The connection has been closed
        this.onClose();
        break;
      default:
        break;
    }
  }

  private onGatheringStateChange() {
    const state: string = this.mypeer_.iceGatheringState;
    // console.log(`onGatheringStateChange => ${state}`);
    switch (state) {
      case 'new':
      case 'complete':
      case 'gathering':
        break;
      default:
        break;
    }
  }

  private async onLocalDescription(type: string) {
    const description = type === 'offer'
      ? await this.mypeer_.createOffer({iceRestart: true})
      : await this.mypeer_.createAnswer();
    await this.mypeer_.setLocalDescription(description);
    const {sdp} = this.mypeer_.localDescription;
    this.signal_.send(JSON.stringify({
      id: this.remote_, type, description: sdp,
    }));
  }

  private onLocalCandidate(e) {
    if (!e.candidate) return;
    const {candidate, sdpMid} = e.candidate;
    this.signal_.send(JSON.stringify({
      id: this.remote_,
      type: 'candidate',
      candidate,
      mid: sdpMid
    }));
  }

  private onDataChannel(dc: RTCDataChannel) {
    this.datach_ = dc;
    dc.onopen = this.onOpen.bind(this);
    dc.onclose = this.onClose.bind(this);
    dc.onerror = this.onError.bind(this);
    dc.onmessage = this.onMessage.bind(this);
  }

  private onMessage(msg) {
    try {
      if (this.datareceive_) {
        this.datareceive_(msg.data);
      }
    } catch (e) {
      console.error(e.stack);
    }
  }

  private onOpen() {
    try {
      if (this.dcopen_) {
        this.dcopen_();
      }
    } catch (e) {
      console.error(e.stack);
    }
  }

  private onClose() {
    try {
      if (this.dcclose_) {
        this.dcclose_();
      }
    } catch (e) {
      console.error(e.stack);
    }
  }

  private onError(err) {
    try {
      if (this.dcerror_) {
        this.dcerror_(err);
      }
    } catch (e) {
      console.error(e.stack);
    }
  }

  private async onIceStateChange() {
    switch (this.mypeer_.iceConnectionState) {
      case 'failed':
        break;
      case 'disconnected':
        break;
      case 'closed':
        this.onClose();
        break;
      default:
        break;
    }
  }

  /**
   * Create datachannel
   * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel
   */
  public async offerPeerConnection() {
    try {
      const dc = await this.mypeer_.createDataChannel('dc.data');
      this.onDataChannel(dc);
      await this.onLocalDescription('offer');
    } catch (err) {
      this.onError(err);
    }
  }
}

export default PeerDataChannel;
