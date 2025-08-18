export namespace Jrpc {
  //

  export type Message = Request | Response | Error | Notification;

  export interface Request {
    jsonrpc: "2.0";
    typerpc: 0x01;
    method: string; // format use <domain>.<resource>.<action>
    params: any; // array or object
    id: string; // unique transaction
  }

  interface ResponseErrorBase {
    jsonrpc: "2.0";
    typerpc: 0x02;
    method: string; // 格式 <domain>.<resource>.<action>
    id?: string;
  }

  export interface Response extends ResponseErrorBase {
    result: {
      index: number; // 分片
      count: number; // 分片總數
      type: string; // data 型態
      data: any; // data 內容
    };
  }

  export interface Error extends ResponseErrorBase {
    error: {
      code: number; //錯誤代碼
      message?: string; //錯誤訊息
      data?: any; //額外附加資料
    };
  }

  export interface Notification {
    jsonrpc: "2.0";
    typerpc: 0x03;
    method: string; // format use <domain>.<resource>.<action>
    params: any; // array or object
  }

  export interface EchoRequest extends Request {
    method: "basic.server.echo"
  }
}
