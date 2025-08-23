import RpcHelper from "../rpc-helper";
import { FlexNet } from "../types";
import SessionManager from "./session-manager";
import WebSocketServer from "../server/ws-server";

class SignalFlexNet {
  //
  private _logger: any;
  private _wsServer: WebSocketServer;
  private _sessionMgr: SessionManager;

  constructor(
    /* @param */ logger: FlexNet.Logger,
    /* @param */ baseConfig: FlexNet.BaseConfig,
    /* @param */ path: FlexNet.ContextPath,
    /* @param */ overSSL: boolean = true
  ) {
    if (!logger) throw new Error("invalid logger instance");
    else this._logger = logger;

    // ——————————————————————————————————————————————————————

    const wsServer: WebSocketServer = new WebSocketServer(
      +baseConfig.service.port,
      this._logger,
      path,
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

    this._sessionMgr = new SessionManager(this._logger);
  }

  public close() {
    this._wsServer.close();
  }

  /**
   *  當 client 連線斷線時，需要清理正在管理的 Session 狀態
   */
  private async onWebsocketDestory(
    /* @param */ ws: any,
    /* @param */ port: number // this is wss port number
    /* RETURN */
  ): Promise<void> {
    //
    try {
      if (!this._sessionMgr) return;
      this._sessionMgr.onClientClose(ws);
    } catch (ex: any) {
      // 視情況得確認此處是否在意錯誤
    }
  }

  /**
   * 收到來自 Broser Peer 或是 Edge Peer 的資料
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
    try {
      const message = RpcHelper.decodeRpcMessage(Buffer.from(buffer));
      this._sessionMgr.onMessage(message, ws);
    } catch (ex: any) {
      this._sessionMgr.onMessage(buffer.toString(), ws);
    }
  }
} // -- SignalFlexNet

export default SignalFlexNet;
