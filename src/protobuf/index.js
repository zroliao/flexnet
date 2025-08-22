/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.rpc = (function() {

    /**
     * Namespace rpc.
     * @exports rpc
     * @namespace
     */
    var rpc = {};

    /**
     * ParamType enum.
     * @name rpc.ParamType
     * @enum {number}
     * @property {number} JSON=0 JSON value
     * @property {number} BYTES=1 BYTES value
     */
    rpc.ParamType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "JSON"] = 0;
        values[valuesById[1] = "BYTES"] = 1;
        return values;
    })();

    /**
     * MessageType enum.
     * @name rpc.MessageType
     * @enum {number}
     * @property {number} REQUEST=0 REQUEST value
     * @property {number} RESPONSE=1 RESPONSE value
     * @property {number} NOTIFY=2 NOTIFY value
     * @property {number} SUBSCRIBE=3 SUBSCRIBE value
     * @property {number} UNSUBSCRIBE=4 UNSUBSCRIBE value
     */
    rpc.MessageType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "REQUEST"] = 0;
        values[valuesById[1] = "RESPONSE"] = 1;
        values[valuesById[2] = "NOTIFY"] = 2;
        values[valuesById[3] = "SUBSCRIBE"] = 3;
        values[valuesById[4] = "UNSUBSCRIBE"] = 4;
        return values;
    })();

    rpc.ParamWrapper = (function() {

        /**
         * Properties of a ParamWrapper.
         * @memberof rpc
         * @interface IParamWrapper
         * @property {rpc.ParamType|null} [type] ParamWrapper type
         * @property {Uint8Array|null} [data] ParamWrapper data
         * @property {boolean|null} [isChunked] ParamWrapper isChunked
         * @property {number|null} [chunkIndex] ParamWrapper chunkIndex
         * @property {number|null} [totalChunks] ParamWrapper totalChunks
         * @property {string|null} [chunkId] ParamWrapper chunkId
         */

        /**
         * Constructs a new ParamWrapper.
         * @memberof rpc
         * @classdesc Represents a ParamWrapper.
         * @implements IParamWrapper
         * @constructor
         * @param {rpc.IParamWrapper=} [properties] Properties to set
         */
        function ParamWrapper(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ParamWrapper type.
         * @member {rpc.ParamType} type
         * @memberof rpc.ParamWrapper
         * @instance
         */
        ParamWrapper.prototype.type = 0;

        /**
         * ParamWrapper data.
         * @member {Uint8Array} data
         * @memberof rpc.ParamWrapper
         * @instance
         */
        ParamWrapper.prototype.data = $util.newBuffer([]);

        /**
         * ParamWrapper isChunked.
         * @member {boolean} isChunked
         * @memberof rpc.ParamWrapper
         * @instance
         */
        ParamWrapper.prototype.isChunked = false;

        /**
         * ParamWrapper chunkIndex.
         * @member {number} chunkIndex
         * @memberof rpc.ParamWrapper
         * @instance
         */
        ParamWrapper.prototype.chunkIndex = 0;

        /**
         * ParamWrapper totalChunks.
         * @member {number} totalChunks
         * @memberof rpc.ParamWrapper
         * @instance
         */
        ParamWrapper.prototype.totalChunks = 0;

        /**
         * ParamWrapper chunkId.
         * @member {string} chunkId
         * @memberof rpc.ParamWrapper
         * @instance
         */
        ParamWrapper.prototype.chunkId = "";

        /**
         * Creates a new ParamWrapper instance using the specified properties.
         * @function create
         * @memberof rpc.ParamWrapper
         * @static
         * @param {rpc.IParamWrapper=} [properties] Properties to set
         * @returns {rpc.ParamWrapper} ParamWrapper instance
         */
        ParamWrapper.create = function create(properties) {
            return new ParamWrapper(properties);
        };

        /**
         * Encodes the specified ParamWrapper message. Does not implicitly {@link rpc.ParamWrapper.verify|verify} messages.
         * @function encode
         * @memberof rpc.ParamWrapper
         * @static
         * @param {rpc.IParamWrapper} message ParamWrapper message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ParamWrapper.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.data);
            if (message.isChunked != null && Object.hasOwnProperty.call(message, "isChunked"))
                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.isChunked);
            if (message.chunkIndex != null && Object.hasOwnProperty.call(message, "chunkIndex"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.chunkIndex);
            if (message.totalChunks != null && Object.hasOwnProperty.call(message, "totalChunks"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.totalChunks);
            if (message.chunkId != null && Object.hasOwnProperty.call(message, "chunkId"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.chunkId);
            return writer;
        };

        /**
         * Encodes the specified ParamWrapper message, length delimited. Does not implicitly {@link rpc.ParamWrapper.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rpc.ParamWrapper
         * @static
         * @param {rpc.IParamWrapper} message ParamWrapper message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ParamWrapper.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ParamWrapper message from the specified reader or buffer.
         * @function decode
         * @memberof rpc.ParamWrapper
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rpc.ParamWrapper} ParamWrapper
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ParamWrapper.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rpc.ParamWrapper();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.type = reader.int32();
                    break;
                case 2:
                    message.data = reader.bytes();
                    break;
                case 3:
                    message.isChunked = reader.bool();
                    break;
                case 4:
                    message.chunkIndex = reader.uint32();
                    break;
                case 5:
                    message.totalChunks = reader.uint32();
                    break;
                case 6:
                    message.chunkId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ParamWrapper message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rpc.ParamWrapper
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rpc.ParamWrapper} ParamWrapper
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ParamWrapper.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ParamWrapper message.
         * @function verify
         * @memberof rpc.ParamWrapper
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ParamWrapper.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                    break;
                }
            if (message.data != null && message.hasOwnProperty("data"))
                if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                    return "data: buffer expected";
            if (message.isChunked != null && message.hasOwnProperty("isChunked"))
                if (typeof message.isChunked !== "boolean")
                    return "isChunked: boolean expected";
            if (message.chunkIndex != null && message.hasOwnProperty("chunkIndex"))
                if (!$util.isInteger(message.chunkIndex))
                    return "chunkIndex: integer expected";
            if (message.totalChunks != null && message.hasOwnProperty("totalChunks"))
                if (!$util.isInteger(message.totalChunks))
                    return "totalChunks: integer expected";
            if (message.chunkId != null && message.hasOwnProperty("chunkId"))
                if (!$util.isString(message.chunkId))
                    return "chunkId: string expected";
            return null;
        };

        /**
         * Creates a ParamWrapper message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rpc.ParamWrapper
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rpc.ParamWrapper} ParamWrapper
         */
        ParamWrapper.fromObject = function fromObject(object) {
            if (object instanceof $root.rpc.ParamWrapper)
                return object;
            var message = new $root.rpc.ParamWrapper();
            switch (object.type) {
            case "JSON":
            case 0:
                message.type = 0;
                break;
            case "BYTES":
            case 1:
                message.type = 1;
                break;
            }
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length)
                    message.data = object.data;
            if (object.isChunked != null)
                message.isChunked = Boolean(object.isChunked);
            if (object.chunkIndex != null)
                message.chunkIndex = object.chunkIndex >>> 0;
            if (object.totalChunks != null)
                message.totalChunks = object.totalChunks >>> 0;
            if (object.chunkId != null)
                message.chunkId = String(object.chunkId);
            return message;
        };

        /**
         * Creates a plain object from a ParamWrapper message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rpc.ParamWrapper
         * @static
         * @param {rpc.ParamWrapper} message ParamWrapper
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ParamWrapper.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.type = options.enums === String ? "JSON" : 0;
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
                object.isChunked = false;
                object.chunkIndex = 0;
                object.totalChunks = 0;
                object.chunkId = "";
            }
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.rpc.ParamType[message.type] : message.type;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            if (message.isChunked != null && message.hasOwnProperty("isChunked"))
                object.isChunked = message.isChunked;
            if (message.chunkIndex != null && message.hasOwnProperty("chunkIndex"))
                object.chunkIndex = message.chunkIndex;
            if (message.totalChunks != null && message.hasOwnProperty("totalChunks"))
                object.totalChunks = message.totalChunks;
            if (message.chunkId != null && message.hasOwnProperty("chunkId"))
                object.chunkId = message.chunkId;
            return object;
        };

        /**
         * Converts this ParamWrapper to JSON.
         * @function toJSON
         * @memberof rpc.ParamWrapper
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ParamWrapper.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ParamWrapper;
    })();

    rpc.RpcMessage = (function() {

        /**
         * Properties of a RpcMessage.
         * @memberof rpc
         * @interface IRpcMessage
         * @property {string|null} [jsonrpc] RpcMessage jsonrpc
         * @property {rpc.MessageType|null} [msgType] RpcMessage msgType
         * @property {string|null} [method] RpcMessage method
         * @property {string|null} [id] RpcMessage id
         * @property {rpc.IParamWrapper|null} [params] RpcMessage params
         * @property {rpc.IParamWrapper|null} [result] RpcMessage result
         * @property {string|null} [error] RpcMessage error
         */

        /**
         * Constructs a new RpcMessage.
         * @memberof rpc
         * @classdesc Represents a RpcMessage.
         * @implements IRpcMessage
         * @constructor
         * @param {rpc.IRpcMessage=} [properties] Properties to set
         */
        function RpcMessage(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RpcMessage jsonrpc.
         * @member {string} jsonrpc
         * @memberof rpc.RpcMessage
         * @instance
         */
        RpcMessage.prototype.jsonrpc = "";

        /**
         * RpcMessage msgType.
         * @member {rpc.MessageType} msgType
         * @memberof rpc.RpcMessage
         * @instance
         */
        RpcMessage.prototype.msgType = 0;

        /**
         * RpcMessage method.
         * @member {string} method
         * @memberof rpc.RpcMessage
         * @instance
         */
        RpcMessage.prototype.method = "";

        /**
         * RpcMessage id.
         * @member {string} id
         * @memberof rpc.RpcMessage
         * @instance
         */
        RpcMessage.prototype.id = "";

        /**
         * RpcMessage params.
         * @member {rpc.IParamWrapper|null|undefined} params
         * @memberof rpc.RpcMessage
         * @instance
         */
        RpcMessage.prototype.params = null;

        /**
         * RpcMessage result.
         * @member {rpc.IParamWrapper|null|undefined} result
         * @memberof rpc.RpcMessage
         * @instance
         */
        RpcMessage.prototype.result = null;

        /**
         * RpcMessage error.
         * @member {string} error
         * @memberof rpc.RpcMessage
         * @instance
         */
        RpcMessage.prototype.error = "";

        /**
         * Creates a new RpcMessage instance using the specified properties.
         * @function create
         * @memberof rpc.RpcMessage
         * @static
         * @param {rpc.IRpcMessage=} [properties] Properties to set
         * @returns {rpc.RpcMessage} RpcMessage instance
         */
        RpcMessage.create = function create(properties) {
            return new RpcMessage(properties);
        };

        /**
         * Encodes the specified RpcMessage message. Does not implicitly {@link rpc.RpcMessage.verify|verify} messages.
         * @function encode
         * @memberof rpc.RpcMessage
         * @static
         * @param {rpc.IRpcMessage} message RpcMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RpcMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.jsonrpc != null && Object.hasOwnProperty.call(message, "jsonrpc"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.jsonrpc);
            if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.msgType);
            if (message.method != null && Object.hasOwnProperty.call(message, "method"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.method);
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.id);
            if (message.params != null && Object.hasOwnProperty.call(message, "params"))
                $root.rpc.ParamWrapper.encode(message.params, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.result != null && Object.hasOwnProperty.call(message, "result"))
                $root.rpc.ParamWrapper.encode(message.result, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.error);
            return writer;
        };

        /**
         * Encodes the specified RpcMessage message, length delimited. Does not implicitly {@link rpc.RpcMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rpc.RpcMessage
         * @static
         * @param {rpc.IRpcMessage} message RpcMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RpcMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RpcMessage message from the specified reader or buffer.
         * @function decode
         * @memberof rpc.RpcMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rpc.RpcMessage} RpcMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RpcMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rpc.RpcMessage();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.jsonrpc = reader.string();
                    break;
                case 2:
                    message.msgType = reader.int32();
                    break;
                case 3:
                    message.method = reader.string();
                    break;
                case 4:
                    message.id = reader.string();
                    break;
                case 5:
                    message.params = $root.rpc.ParamWrapper.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.result = $root.rpc.ParamWrapper.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.error = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RpcMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rpc.RpcMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rpc.RpcMessage} RpcMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RpcMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RpcMessage message.
         * @function verify
         * @memberof rpc.RpcMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RpcMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.jsonrpc != null && message.hasOwnProperty("jsonrpc"))
                if (!$util.isString(message.jsonrpc))
                    return "jsonrpc: string expected";
            if (message.msgType != null && message.hasOwnProperty("msgType"))
                switch (message.msgType) {
                default:
                    return "msgType: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                    break;
                }
            if (message.method != null && message.hasOwnProperty("method"))
                if (!$util.isString(message.method))
                    return "method: string expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.params != null && message.hasOwnProperty("params")) {
                var error = $root.rpc.ParamWrapper.verify(message.params);
                if (error)
                    return "params." + error;
            }
            if (message.result != null && message.hasOwnProperty("result")) {
                var error = $root.rpc.ParamWrapper.verify(message.result);
                if (error)
                    return "result." + error;
            }
            if (message.error != null && message.hasOwnProperty("error"))
                if (!$util.isString(message.error))
                    return "error: string expected";
            return null;
        };

        /**
         * Creates a RpcMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rpc.RpcMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rpc.RpcMessage} RpcMessage
         */
        RpcMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.rpc.RpcMessage)
                return object;
            var message = new $root.rpc.RpcMessage();
            if (object.jsonrpc != null)
                message.jsonrpc = String(object.jsonrpc);
            switch (object.msgType) {
            case "REQUEST":
            case 0:
                message.msgType = 0;
                break;
            case "RESPONSE":
            case 1:
                message.msgType = 1;
                break;
            case "NOTIFY":
            case 2:
                message.msgType = 2;
                break;
            case "SUBSCRIBE":
            case 3:
                message.msgType = 3;
                break;
            case "UNSUBSCRIBE":
            case 4:
                message.msgType = 4;
                break;
            }
            if (object.method != null)
                message.method = String(object.method);
            if (object.id != null)
                message.id = String(object.id);
            if (object.params != null) {
                if (typeof object.params !== "object")
                    throw TypeError(".rpc.RpcMessage.params: object expected");
                message.params = $root.rpc.ParamWrapper.fromObject(object.params);
            }
            if (object.result != null) {
                if (typeof object.result !== "object")
                    throw TypeError(".rpc.RpcMessage.result: object expected");
                message.result = $root.rpc.ParamWrapper.fromObject(object.result);
            }
            if (object.error != null)
                message.error = String(object.error);
            return message;
        };

        /**
         * Creates a plain object from a RpcMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rpc.RpcMessage
         * @static
         * @param {rpc.RpcMessage} message RpcMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RpcMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.jsonrpc = "";
                object.msgType = options.enums === String ? "REQUEST" : 0;
                object.method = "";
                object.id = "";
                object.params = null;
                object.result = null;
                object.error = "";
            }
            if (message.jsonrpc != null && message.hasOwnProperty("jsonrpc"))
                object.jsonrpc = message.jsonrpc;
            if (message.msgType != null && message.hasOwnProperty("msgType"))
                object.msgType = options.enums === String ? $root.rpc.MessageType[message.msgType] : message.msgType;
            if (message.method != null && message.hasOwnProperty("method"))
                object.method = message.method;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.params != null && message.hasOwnProperty("params"))
                object.params = $root.rpc.ParamWrapper.toObject(message.params, options);
            if (message.result != null && message.hasOwnProperty("result"))
                object.result = $root.rpc.ParamWrapper.toObject(message.result, options);
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = message.error;
            return object;
        };

        /**
         * Converts this RpcMessage to JSON.
         * @function toJSON
         * @memberof rpc.RpcMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RpcMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RpcMessage;
    })();

    return rpc;
})();

module.exports = $root;
