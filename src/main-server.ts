import {
  ProxyServer,
  TransportPolicy,
  DEFAULT_DATA_SIZE,
  GeoIP,
  ContextPath,
  Logger,
  MessageSource,
} from "./context";

import WSServer from "./ws-server";
import PPClient from "./pp-client-node";
import SignalServer from "./signal-server";
import { Jrpc } from "./types";
import {
  createJrpcResponseString,
  isJrpcGeneralMessage,
  isJrpcSignalMessage,
} from "./util";

const txEncoder = new TextEncoder();
const txDecoder = new TextDecoder("utf-8");

interface CoreOption {
  port: number[];
  geoip?: GeoIP;
  signal?: {
    enable: 1 | 0;
  };
  pptp?: {
    enable: 1 | 0;
    peer_id: string;
    max_payload?: number;
    signal_server: string;
    ice_servers: string[];
    proxy_server?: ProxyServer;
    enable_ice_tcp?: boolean;
    port_range_begin?: number;
    port_range_end?: number;
    max_message_size?: number;
    ice_transport_policy?: TransportPolicy;
    mtu?: number;
  };
}

class FromHereBackHandler {
  //
  private _ws: any | null = null;
  private _send: (buffer: any) => void;

  constructor(ws: any | null, send: any) {
    this._ws = ws;
    this._send = send;
  }

  public send(data: any): void {
    if (!this._send) throw new Error(`send callback not exist`);
    this._send(data);
  }

  public socket(): any | null {
    return this._ws;
  }
}

class FlexNet {
  //
  private _logger: any;
  private _wsserver: WSServer[] = []; // 本身作為多個 websocket server
  private _ppclient: PPClient | null = null; // 本身作為 edge 端的 peer

  private _signalServer: SignalServer | null = null; // 本身作為 SignalServer
  private _maxChunkSize: number = DEFAULT_DATA_SIZE.MAX;

  constructor(
    /* @param */ logger: Logger,
    /* @param */ coreOption: CoreOption,
    /* @param */ path: ContextPath,
    /* @param */ overSSL: boolean = true
  ) {
    if (!logger) throw new Error("invalid logger instance");
    else this._logger = logger;

    // [Initialize]
    //  1. Signal Server : 本身可以份演是 Signal 服務器
    // ——————————————————————————————————————————————————————
    if (this.hasSignal(coreOption)) {
      this._signalServer = new SignalServer(this._logger);
    }

    // [Initialize]
    //  2. Websocket Server : 本身可以扮演是多個並同埠號的服務號
    // ——————————————————————————————————————————————————————
    for (const port of coreOption.port || []) {
      const wsServer: WSServer = new WSServer(
        +port,
        this._logger,
        path,
        overSSL
      );
      wsServer.datareceive(port, this.onWebsocketMessage.bind(this));
      wsServer.closebyebye(port, this.onWebsocketDestory.bind(this));
      this._wsserver.push(wsServer);
    }

    // [Initialize]
    //  3. Peer Client : 本身可以扮演是 P2P 端的 peer
    // ——————————————————————————————————————————————————————
    if (this.hasP2pOption(coreOption)) {
      if (coreOption.pptp.max_payload !== undefined) {
        if (coreOption.pptp.max_payload >= DEFAULT_DATA_SIZE.MIN) {
          this._maxChunkSize = coreOption.pptp.max_payload;
          logger.info(
            `[flexnet] set max payload=${this._maxChunkSize}`
          );
        }
      }

      const pptpOption = {
        username: "37012eaa-4ef2-46d0-a079-855fceb13a29",
        password: "49aa53b8-f965-4312-b3fc-12d21bf66103",
        peer_id: coreOption.pptp.peer_id,
        signal_server: coreOption.pptp.signal_server,
        ice_servers: coreOption.pptp.ice_servers,
        proxy_server: coreOption.pptp.proxy_server,
        enable_ice_tcp: coreOption.pptp.enable_ice_tcp,
        port_range_begin: coreOption.pptp.port_range_begin,
        port_range_end: coreOption.pptp.port_range_end,
        max_message_size: coreOption.pptp.max_message_size,
        ice_transport_policy: coreOption.pptp.ice_transport_policy,
        mtu: coreOption.pptp.mtu,
      };

      this._ppclient = new PPClient(pptpOption, coreOption.geoip, this._logger);
      this._ppclient.datareceive(this.onRemotePeerMessage.bind(this));
      if (!this._ppclient.connect()) this._logger.error("pptp connect fail");
    }
  }

  private hasP2pOption(option: CoreOption): true | undefined {
    if (!option.pptp) {
      this._logger.info("[flexnet] pptp disabled(code=0)");
    } else if (option.pptp.enable !== 1) {
      this._logger.info("[flexnet] pptp disabled(code=1)");
    } else if (
      !option.pptp.ice_servers ||
      option.pptp.ice_servers.length === 0
    ) {
      this._logger.info("[flexnet] pptp disabled(code=2)");
    } else if (!option.pptp.signal_server) {
      this._logger.info("[flexnet] pptp disabled(code=3)");
    } else if (!option.pptp.peer_id) {
      this._logger.info("[flexnet] pptp disabled(code=4)");
    } else {
      this._logger.info("[flexnet] pptp peer enabled");
      return true;
    }
  }

  private hasSignal(coreOption: CoreOption): true | undefined {
    if (!coreOption.signal) {
      this._logger.info("[flexnet] signal disabled(code=0)");
    } else if (coreOption.signal.enable !== 1) {
      this._logger.info("[flexnet] signal disabled(code=1)");
    } else {
      this._logger.info("[flexnet] signal server enabled");
      return true;
    }
  }

  public close() {
    for (const server of this._wsserver) server.close();
  }

  private async onWebsocketDestory(
    /* @param */ ws: any,
    /* @param */ port: number // this is wss port number
    /* RETURN */
  ): Promise<void> {
    /* ****** */
    if (!this._signalServer) return;
    this._signalServer.onClientClose(ws);
  }

  /**
   * 因為本身扮演 Edge 端的 Websocket Server, 收到來自另一方 client 的資料時
   * 會被 callback 這裡處理
   *
   * @param buffer  收到的資料 buffer
   * @param ws      Websocket Instance
   * @param port    用來判斷是從哪一個 server port 收到資料
   */
  private async onWebsocketMessage(
    /* @param */ buffer: Buffer,
    /* @param */ ws: any,
    /* @param */ port: number // this is wss port number
    /* RETURN */
  ): Promise<void> {
    //
    const sendHereBack = (sendBackData: Uint8Array): void => {
      // ws.enqueue 是自行擴充的一個以佇列形式發送資料的方法
      if (ws && ws.isClosed !== true) ws.enqueue(sendBackData);
    };

    await this.recvMessage(
      /* @param1 */ buffer,
      /* @param2 */ new FromHereBackHandler(ws, sendHereBack),
      /* @param3 */ MessageSource.WS
    );
  }

  /**
   * 因為本身扮演 Edge 端的 Peer, 收到來自另一方 Peer 的資料時
   * 會被 callback 這裡處理
   *
   * @param buffer
   * @param peer
   */
  private async onRemotePeerMessage(
    /* @param */ buffer,
    /* @param */ peer
    /* RETURN */
  ): Promise<void> {
    //
    const sendHereBack = (sendBackBuffer) => {
      peer.send(Buffer.from(sendBackBuffer));
    };

    await this.recvMessage(
      /* @param1 */ buffer,
      /* @param2 */ new FromHereBackHandler(null, sendHereBack),
      /* @param3 */ MessageSource.PP
    );
  }

  private async recvMessage(
    /* @param */ buffer: any,
    /* @param */ fromHereBack: FromHereBackHandler,
    /* @param */ messageSource: MessageSource
    /* RETURN */
  ): Promise<void> {
    //
    try {
      const message: Jrpc.Request = JSON.parse(txDecoder.decode(buffer));

      switch (messageSource) {
        case MessageSource.PP:
          this._logger.info(`receive peer data: ${message}`);
          break;
        case MessageSource.WS:
          if (isJrpcSignalMessage(message) || !isJrpcGeneralMessage(message)) {
            //
            if (!fromHereBack?.socket()) {
              throw new Error(
                `[flexnet] miss socket, method(${message.method})`
              );
            }
            // 這裡應該思考一下是否要把 fromHereBack.socket() 傳進去操作?
            this._signalServer.onJrpcMessage(message, fromHereBack.socket());
          } else {
            // FIXME: 這裡應該要實現轉拋 json-rpc 訊息到有需求的人身上
            const response = createJrpcResponseString(
              message.method,
              message.id,
              { ...message.params, echo: true }
            );
            fromHereBack.send(response);
          }
        default:
          // return buffer?.toString();
          break;
      }
    } catch (err) {
      console.error(err.stack);
    }
  }
} // -- FlexNet

export default FlexNet;
