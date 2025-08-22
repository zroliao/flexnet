import { Snowflake } from "@theinternetfolks/snowflake";
// import { Jrpc } from "../types";

export function uuid() {
  return Snowflake.generate();
}

// export function createJrpcNotify(
//   /* @param */ method: string,
//   /* @param */ params: any = {}
// ): Jrpc.Notification {
//   //
//   return {
//     jsonrpc: "2.0",
//     typerpc: 0x03,
//     method,
//     params,
//   };
// }

// export function createJrpcRequest(
//   /* @param */ method: string,
//   /* @param */ params: any = {}
// ): Jrpc.Request {
//   //
//   return {
//     jsonrpc: "2.0",
//     typerpc: 0x01,
//     method,
//     params,
//     id: Snowflake.generate(),
//   };
// }

// export function createJrpcResponse(
//   /* @param */ method: string,
//   /* @param */ id: string,
//   /* @param */ data: any = {},
//   /* @param */ type: string = "json",
//   /* @param */ index: number = 1,
//   /* @param */ count: number = 1
// ): Jrpc.Response {
//   //
//   return {
//     jsonrpc: "2.0",
//     typerpc: 0x02,
//     method,
//     result: {
//       index,
//       count,
//       type,
//       data,
//     },
//     id,
//   };
// }

// export function createJrpcError(
//   /* @param */ method: string,
//   /* @param */ id: string,
//   /* @param */ code: number,
//   /* @param */ message?: string,
//   /* @param */ data?: any
// ): Jrpc.Error {
//   //
//   return {
//     jsonrpc: "2.0",
//     typerpc: 0x02,
//     method,
//     error: {
//       code,
//       message,
//       data,
//     },
//     id,
//   };
// }

// export function createJrpcNotifyString(
//   /* @param */ method: string,
//   /* @param */ params: any = {}
// ): string {
//   //
//   return JSON.stringify(createJrpcNotify(method, params));
// }

// export function createJrpcRequestString(
//   /* @param */ method: string,
//   /* @param */ params: any = {}
// ): string {
//   //
//   return JSON.stringify(createJrpcRequest(method, params));
// }

// export function createJrpcResponseString(
//   /* @param */ method: string,
//   /* @param */ id: string,
//   /* @param */ data: any = {},
//   /* @param */ type: string = "json",
//   /* @param */ index: number = 1,
//   /* @param */ count: number = 1
// ): string {
//   //
//   return JSON.stringify(
//     createJrpcResponse(method, id, data, type, index, count)
//   );
// }
