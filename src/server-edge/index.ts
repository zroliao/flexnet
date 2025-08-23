import { FlexNet } from "../types";
import RpcHelper from "../rpc-helper";
import PPClient from "./pp-client-node";
import EdgeTransport from "./edge-transport";
import WebSocketSerrver from "../server/ws-server";

class EdgeFlexNet {
  //
  private _logger: any;
  private _ppclient: PPClient;
  private _transport: EdgeTransport;
  private _wsServer: WebSocketSerrver;
  private _maxChunkSize: number = FlexNet.DEFAULT_DATA_SIZE.MAX;

  constructor(
    /* @param */ context: FlexNet.Context,
    /* @param */ transport: EdgeTransport,
    /* @param */ baseConfig: FlexNet.BaseConfig,
    /* @param */ edgeConfig: FlexNet.EdgeConfig,
    /* @param */ overSSL: boolean = true
  ) {
    //
    this._logger = context.log;
    this._transport = transport;

    // ——————————————————————————————————————————————————————

    const wsServer: WebSocketSerrver = new WebSocketSerrver(
      +baseConfig.service.port,
      this._logger,
      context.path,
      overSSL
    );

    wsServer.datareceive(
      baseConfig.service.port,
      this.onWebsocketMessage.bind(this)
    );

    wsServer.closebyebye(
      baseConfig.service.port,
      this.onWebsocketDestory.bind(this)
    );

    this._wsServer = wsServer;

    // ——————————————————————————————————————————————————————

    if (edgeConfig.max_payload !== undefined) {
      if (edgeConfig.max_payload >= FlexNet.DEFAULT_DATA_SIZE.MIN) {
        this._maxChunkSize = edgeConfig.max_payload;
        this._logger.info(
          `[edge.flexnet] set max payload=${this._maxChunkSize}`
        );
      }
    }

    this._ppclient = new PPClient(edgeConfig, this._logger);
    this._ppclient.datareceive(this.onRemotePeerMessage.bind(this));
    if (!this._ppclient.connect()) this._logger.error("pptp connect fail");
  }

  public close() {
    this._wsServer.close();
  }

  /**
   *
   */
  private async onWebsocketDestory(
    /* @param */ ws: any,
    /* @param */ port: number // this is wss port number
    /* RETURN */
  ): Promise<void> {
    //
  }

  /**
   *
   */
  private async onWebsocketMessage(
    /* @param */ buffer: Buffer,
    /* @param */ ws: any,
    /* @param */ port: number // this is wss port number
    /* RETURN */
  ): Promise<void> {
    //
    try {
      const reply = (response: Uint8Array) => {
        if (response === undefined) return;
        if (ws && ws.isClosed !== true) ws.enqueue(response);
      };

      await this.recvMessage(buffer, reply);
    } catch (ex: any) {
      // 再確認是否要做錯誤回應
    }
  }

  /**
   *
   */
  private async onRemotePeerMessage(
    /* @param */ buffer: any,
    /* @param */ peer
    /* RETURN */
  ): Promise<void> {
    //
    try {
      const reply = (response: Uint8Array) => {
        if (response === undefined) return;
        peer.send(Buffer.from(response));
      };

      await this.recvMessage(buffer, reply);
    } catch (ex: any) {
      // 再確認是否要做錯誤回應
    }
  }

  /**
   *
   */
  private async recvMessage(
    /* @param */ buffer: any,
    /* @param */ reply: (data: Uint8Array) => void
  ): Promise<void> {
    //
    // FIXME: 這裡應該要實現轉拋 json-rpc 訊息到有需求的人身上
    const message = RpcHelper.decodeRpcMessage(buffer);
    if ((message as any).msgType === "NOTIFY") {
      this._transport.notify(message);
    } else {
      await this._transport.dispatch(message, reply);
    }
  }
} // -- FlexNet

export default EdgeFlexNet;
