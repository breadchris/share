var entry = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all2) => {
    for (var name in all2)
      __defProp(target, name, { get: all2[name], enumerable: true });
  };
  var __copyProps = (to, from2, except, desc) => {
    if (from2 && typeof from2 === "object" || typeof from2 === "function") {
      for (let key of __getOwnPropNames(from2))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // entry.js
  var entry_exports = {};
  __export(entry_exports, {
    applyUpdate: () => applyUpdate2,
    encodeStateAsUpdate: () => encodeStateAsUpdate2,
    initialize: () => initialize,
    insert: () => insert,
    stateVector: () => stateVector,
    toString: () => toString
  });

  // ../../node_modules/lib0/map.js
  var create = () => /* @__PURE__ */ new Map();
  var copy = (m) => {
    const r = create();
    m.forEach((v, k) => {
      r.set(k, v);
    });
    return r;
  };
  var setIfUndefined = (map2, key, createT) => {
    let set = map2.get(key);
    if (set === void 0) {
      map2.set(key, set = createT());
    }
    return set;
  };
  var map = (m, f) => {
    const res = [];
    for (const [key, value] of m) {
      res.push(f(value, key));
    }
    return res;
  };
  var any = (m, f) => {
    for (const [key, value] of m) {
      if (f(value, key)) {
        return true;
      }
    }
    return false;
  };

  // ../../node_modules/lib0/set.js
  var create2 = () => /* @__PURE__ */ new Set();

  // ../../node_modules/lib0/array.js
  var last = (arr) => arr[arr.length - 1];
  var appendTo = (dest, src) => {
    for (let i = 0; i < src.length; i++) {
      dest.push(src[i]);
    }
  };
  var from = Array.from;
  var isArray = Array.isArray;

  // ../../node_modules/lib0/observable.js
  var ObservableV2 = class {
    constructor() {
      this._observers = create();
    }
    /**
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name
     * @param {EVENTS[NAME]} f
     */
    on(name, f) {
      setIfUndefined(
        this._observers,
        /** @type {string} */
        name,
        create2
      ).add(f);
      return f;
    }
    /**
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name
     * @param {EVENTS[NAME]} f
     */
    once(name, f) {
      const _f = (...args2) => {
        this.off(
          name,
          /** @type {any} */
          _f
        );
        f(...args2);
      };
      this.on(
        name,
        /** @type {any} */
        _f
      );
    }
    /**
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name
     * @param {EVENTS[NAME]} f
     */
    off(name, f) {
      const observers = this._observers.get(name);
      if (observers !== void 0) {
        observers.delete(f);
        if (observers.size === 0) {
          this._observers.delete(name);
        }
      }
    }
    /**
     * Emit a named event. All registered event listeners that listen to the
     * specified name will receive the event.
     *
     * @todo This should catch exceptions
     *
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name The event name.
     * @param {Parameters<EVENTS[NAME]>} args The arguments that are applied to the event listener.
     */
    emit(name, args2) {
      return from((this._observers.get(name) || create()).values()).forEach((f) => f(...args2));
    }
    destroy() {
      this._observers = create();
    }
  };

  // ../../node_modules/lib0/math.js
  var floor = Math.floor;
  var abs = Math.abs;
  var min = (a, b) => a < b ? a : b;
  var max = (a, b) => a > b ? a : b;
  var isNaN = Number.isNaN;
  var isNegativeZero = (n) => n !== 0 ? n < 0 : 1 / n < 0;

  // ../../node_modules/lib0/binary.js
  var BIT1 = 1;
  var BIT2 = 2;
  var BIT3 = 4;
  var BIT4 = 8;
  var BIT6 = 32;
  var BIT7 = 64;
  var BIT8 = 128;
  var BIT18 = 1 << 17;
  var BIT19 = 1 << 18;
  var BIT20 = 1 << 19;
  var BIT21 = 1 << 20;
  var BIT22 = 1 << 21;
  var BIT23 = 1 << 22;
  var BIT24 = 1 << 23;
  var BIT25 = 1 << 24;
  var BIT26 = 1 << 25;
  var BIT27 = 1 << 26;
  var BIT28 = 1 << 27;
  var BIT29 = 1 << 28;
  var BIT30 = 1 << 29;
  var BIT31 = 1 << 30;
  var BIT32 = 1 << 31;
  var BITS5 = 31;
  var BITS6 = 63;
  var BITS7 = 127;
  var BITS17 = BIT18 - 1;
  var BITS18 = BIT19 - 1;
  var BITS19 = BIT20 - 1;
  var BITS20 = BIT21 - 1;
  var BITS21 = BIT22 - 1;
  var BITS22 = BIT23 - 1;
  var BITS23 = BIT24 - 1;
  var BITS24 = BIT25 - 1;
  var BITS25 = BIT26 - 1;
  var BITS26 = BIT27 - 1;
  var BITS27 = BIT28 - 1;
  var BITS28 = BIT29 - 1;
  var BITS29 = BIT30 - 1;
  var BITS30 = BIT31 - 1;
  var BITS31 = 2147483647;

  // ../../node_modules/lib0/number.js
  var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
  var LOWEST_INT32 = 1 << 31;
  var isInteger = Number.isInteger || ((num) => typeof num === "number" && isFinite(num) && floor(num) === num);
  var isNaN2 = Number.isNaN;
  var parseInt = Number.parseInt;

  // ../../node_modules/lib0/string.js
  var fromCharCode = String.fromCharCode;
  var fromCodePoint = String.fromCodePoint;
  var MAX_UTF16_CHARACTER = fromCharCode(65535);
  var toLowerCase = (s) => s.toLowerCase();
  var trimLeftRegex = /^\s*/g;
  var trimLeft = (s) => s.replace(trimLeftRegex, "");
  var fromCamelCaseRegex = /([A-Z])/g;
  var fromCamelCase = (s, separator) => trimLeft(s.replace(fromCamelCaseRegex, (match) => `${separator}${toLowerCase(match)}`));
  var _encodeUtf8Polyfill = (str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buf[i] = /** @type {number} */
      encodedString.codePointAt(i);
    }
    return buf;
  };
  var utf8TextEncoder = (
    /** @type {TextEncoder} */
    typeof TextEncoder !== "undefined" ? new TextEncoder() : null
  );
  var _encodeUtf8Native = (str) => utf8TextEncoder.encode(str);
  var encodeUtf8 = utf8TextEncoder ? _encodeUtf8Native : _encodeUtf8Polyfill;
  var utf8TextDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  if (utf8TextDecoder && utf8TextDecoder.decode(new Uint8Array()).length === 1) {
    utf8TextDecoder = null;
  }

  // ../../node_modules/lib0/encoding.js
  var Encoder = class {
    constructor() {
      this.cpos = 0;
      this.cbuf = new Uint8Array(100);
      this.bufs = [];
    }
  };
  var createEncoder = () => new Encoder();
  var length = (encoder) => {
    let len = encoder.cpos;
    for (let i = 0; i < encoder.bufs.length; i++) {
      len += encoder.bufs[i].length;
    }
    return len;
  };
  var toUint8Array = (encoder) => {
    const uint8arr = new Uint8Array(length(encoder));
    let curPos = 0;
    for (let i = 0; i < encoder.bufs.length; i++) {
      const d = encoder.bufs[i];
      uint8arr.set(d, curPos);
      curPos += d.length;
    }
    uint8arr.set(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos), curPos);
    return uint8arr;
  };
  var verifyLen = (encoder, len) => {
    const bufferLen = encoder.cbuf.length;
    if (bufferLen - encoder.cpos < len) {
      encoder.bufs.push(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos));
      encoder.cbuf = new Uint8Array(max(bufferLen, len) * 2);
      encoder.cpos = 0;
    }
  };
  var write = (encoder, num) => {
    const bufferLen = encoder.cbuf.length;
    if (encoder.cpos === bufferLen) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(bufferLen * 2);
      encoder.cpos = 0;
    }
    encoder.cbuf[encoder.cpos++] = num;
  };
  var writeUint8 = write;
  var writeVarUint = (encoder, num) => {
    while (num > BITS7) {
      write(encoder, BIT8 | BITS7 & num);
      num = floor(num / 128);
    }
    write(encoder, BITS7 & num);
  };
  var writeVarInt = (encoder, num) => {
    const isNegative = isNegativeZero(num);
    if (isNegative) {
      num = -num;
    }
    write(encoder, (num > BITS6 ? BIT8 : 0) | (isNegative ? BIT7 : 0) | BITS6 & num);
    num = floor(num / 64);
    while (num > 0) {
      write(encoder, (num > BITS7 ? BIT8 : 0) | BITS7 & num);
      num = floor(num / 128);
    }
  };
  var _strBuffer = new Uint8Array(3e4);
  var _maxStrBSize = _strBuffer.length / 3;
  var _writeVarStringNative = (encoder, str) => {
    if (str.length < _maxStrBSize) {
      const written = utf8TextEncoder.encodeInto(str, _strBuffer).written || 0;
      writeVarUint(encoder, written);
      for (let i = 0; i < written; i++) {
        write(encoder, _strBuffer[i]);
      }
    } else {
      writeVarUint8Array(encoder, encodeUtf8(str));
    }
  };
  var _writeVarStringPolyfill = (encoder, str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    writeVarUint(encoder, len);
    for (let i = 0; i < len; i++) {
      write(
        encoder,
        /** @type {number} */
        encodedString.codePointAt(i)
      );
    }
  };
  var writeVarString = utf8TextEncoder && /** @type {any} */
  utf8TextEncoder.encodeInto ? _writeVarStringNative : _writeVarStringPolyfill;
  var writeUint8Array = (encoder, uint8Array) => {
    const bufferLen = encoder.cbuf.length;
    const cpos = encoder.cpos;
    const leftCopyLen = min(bufferLen - cpos, uint8Array.length);
    const rightCopyLen = uint8Array.length - leftCopyLen;
    encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
    encoder.cpos += leftCopyLen;
    if (rightCopyLen > 0) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(max(bufferLen * 2, rightCopyLen));
      encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
      encoder.cpos = rightCopyLen;
    }
  };
  var writeVarUint8Array = (encoder, uint8Array) => {
    writeVarUint(encoder, uint8Array.byteLength);
    writeUint8Array(encoder, uint8Array);
  };
  var writeOnDataView = (encoder, len) => {
    verifyLen(encoder, len);
    const dview = new DataView(encoder.cbuf.buffer, encoder.cpos, len);
    encoder.cpos += len;
    return dview;
  };
  var writeFloat32 = (encoder, num) => writeOnDataView(encoder, 4).setFloat32(0, num, false);
  var writeFloat64 = (encoder, num) => writeOnDataView(encoder, 8).setFloat64(0, num, false);
  var writeBigInt64 = (encoder, num) => (
    /** @type {any} */
    writeOnDataView(encoder, 8).setBigInt64(0, num, false)
  );
  var floatTestBed = new DataView(new ArrayBuffer(4));
  var isFloat32 = (num) => {
    floatTestBed.setFloat32(0, num);
    return floatTestBed.getFloat32(0) === num;
  };
  var writeAny = (encoder, data) => {
    switch (typeof data) {
      case "string":
        write(encoder, 119);
        writeVarString(encoder, data);
        break;
      case "number":
        if (isInteger(data) && abs(data) <= BITS31) {
          write(encoder, 125);
          writeVarInt(encoder, data);
        } else if (isFloat32(data)) {
          write(encoder, 124);
          writeFloat32(encoder, data);
        } else {
          write(encoder, 123);
          writeFloat64(encoder, data);
        }
        break;
      case "bigint":
        write(encoder, 122);
        writeBigInt64(encoder, data);
        break;
      case "object":
        if (data === null) {
          write(encoder, 126);
        } else if (isArray(data)) {
          write(encoder, 117);
          writeVarUint(encoder, data.length);
          for (let i = 0; i < data.length; i++) {
            writeAny(encoder, data[i]);
          }
        } else if (data instanceof Uint8Array) {
          write(encoder, 116);
          writeVarUint8Array(encoder, data);
        } else {
          write(encoder, 118);
          const keys2 = Object.keys(data);
          writeVarUint(encoder, keys2.length);
          for (let i = 0; i < keys2.length; i++) {
            const key = keys2[i];
            writeVarString(encoder, key);
            writeAny(encoder, data[key]);
          }
        }
        break;
      case "boolean":
        write(encoder, data ? 120 : 121);
        break;
      default:
        write(encoder, 127);
    }
  };
  var RleEncoder = class extends Encoder {
    /**
     * @param {function(Encoder, T):void} writer
     */
    constructor(writer) {
      super();
      this.w = writer;
      this.s = null;
      this.count = 0;
    }
    /**
     * @param {T} v
     */
    write(v) {
      if (this.s === v) {
        this.count++;
      } else {
        if (this.count > 0) {
          writeVarUint(this, this.count - 1);
        }
        this.count = 1;
        this.w(this, v);
        this.s = v;
      }
    }
  };
  var flushUintOptRleEncoder = (encoder) => {
    if (encoder.count > 0) {
      writeVarInt(encoder.encoder, encoder.count === 1 ? encoder.s : -encoder.s);
      if (encoder.count > 1) {
        writeVarUint(encoder.encoder, encoder.count - 2);
      }
    }
  };
  var UintOptRleEncoder = class {
    constructor() {
      this.encoder = new Encoder();
      this.s = 0;
      this.count = 0;
    }
    /**
     * @param {number} v
     */
    write(v) {
      if (this.s === v) {
        this.count++;
      } else {
        flushUintOptRleEncoder(this);
        this.count = 1;
        this.s = v;
      }
    }
    /**
     * Flush the encoded state and transform this to a Uint8Array.
     *
     * Note that this should only be called once.
     */
    toUint8Array() {
      flushUintOptRleEncoder(this);
      return toUint8Array(this.encoder);
    }
  };
  var flushIntDiffOptRleEncoder = (encoder) => {
    if (encoder.count > 0) {
      const encodedDiff = encoder.diff * 2 + (encoder.count === 1 ? 0 : 1);
      writeVarInt(encoder.encoder, encodedDiff);
      if (encoder.count > 1) {
        writeVarUint(encoder.encoder, encoder.count - 2);
      }
    }
  };
  var IntDiffOptRleEncoder = class {
    constructor() {
      this.encoder = new Encoder();
      this.s = 0;
      this.count = 0;
      this.diff = 0;
    }
    /**
     * @param {number} v
     */
    write(v) {
      if (this.diff === v - this.s) {
        this.s = v;
        this.count++;
      } else {
        flushIntDiffOptRleEncoder(this);
        this.count = 1;
        this.diff = v - this.s;
        this.s = v;
      }
    }
    /**
     * Flush the encoded state and transform this to a Uint8Array.
     *
     * Note that this should only be called once.
     */
    toUint8Array() {
      flushIntDiffOptRleEncoder(this);
      return toUint8Array(this.encoder);
    }
  };
  var StringEncoder = class {
    constructor() {
      this.sarr = [];
      this.s = "";
      this.lensE = new UintOptRleEncoder();
    }
    /**
     * @param {string} string
     */
    write(string) {
      this.s += string;
      if (this.s.length > 19) {
        this.sarr.push(this.s);
        this.s = "";
      }
      this.lensE.write(string.length);
    }
    toUint8Array() {
      const encoder = new Encoder();
      this.sarr.push(this.s);
      this.s = "";
      writeVarString(encoder, this.sarr.join(""));
      writeUint8Array(encoder, this.lensE.toUint8Array());
      return toUint8Array(encoder);
    }
  };

  // ../../node_modules/lib0/error.js
  var create3 = (s) => new Error(s);
  var methodUnimplemented = () => {
    throw create3("Method unimplemented");
  };
  var unexpectedCase = () => {
    throw create3("Unexpected case");
  };

  // ../../node_modules/lib0/decoding.js
  var errorUnexpectedEndOfArray = create3("Unexpected end of array");
  var errorIntegerOutOfRange = create3("Integer out of Range");
  var Decoder = class {
    /**
     * @param {Uint8Array} uint8Array Binary data to decode
     */
    constructor(uint8Array) {
      this.arr = uint8Array;
      this.pos = 0;
    }
  };
  var createDecoder = (uint8Array) => new Decoder(uint8Array);
  var hasContent = (decoder) => decoder.pos !== decoder.arr.length;
  var readUint8Array = (decoder, len) => {
    const view = new Uint8Array(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
    decoder.pos += len;
    return view;
  };
  var readVarUint8Array = (decoder) => readUint8Array(decoder, readVarUint(decoder));
  var readUint8 = (decoder) => decoder.arr[decoder.pos++];
  var readVarUint = (decoder) => {
    let num = 0;
    let mult = 1;
    const len = decoder.arr.length;
    while (decoder.pos < len) {
      const r = decoder.arr[decoder.pos++];
      num = num + (r & BITS7) * mult;
      mult *= 128;
      if (r < BIT8) {
        return num;
      }
      if (num > MAX_SAFE_INTEGER) {
        throw errorIntegerOutOfRange;
      }
    }
    throw errorUnexpectedEndOfArray;
  };
  var readVarInt = (decoder) => {
    let r = decoder.arr[decoder.pos++];
    let num = r & BITS6;
    let mult = 64;
    const sign = (r & BIT7) > 0 ? -1 : 1;
    if ((r & BIT8) === 0) {
      return sign * num;
    }
    const len = decoder.arr.length;
    while (decoder.pos < len) {
      r = decoder.arr[decoder.pos++];
      num = num + (r & BITS7) * mult;
      mult *= 128;
      if (r < BIT8) {
        return sign * num;
      }
      if (num > MAX_SAFE_INTEGER) {
        throw errorIntegerOutOfRange;
      }
    }
    throw errorUnexpectedEndOfArray;
  };
  var _readVarStringPolyfill = (decoder) => {
    let remainingLen = readVarUint(decoder);
    if (remainingLen === 0) {
      return "";
    } else {
      let encodedString = String.fromCodePoint(readUint8(decoder));
      if (--remainingLen < 100) {
        while (remainingLen--) {
          encodedString += String.fromCodePoint(readUint8(decoder));
        }
      } else {
        while (remainingLen > 0) {
          const nextLen = remainingLen < 1e4 ? remainingLen : 1e4;
          const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
          decoder.pos += nextLen;
          encodedString += String.fromCodePoint.apply(
            null,
            /** @type {any} */
            bytes
          );
          remainingLen -= nextLen;
        }
      }
      return decodeURIComponent(escape(encodedString));
    }
  };
  var _readVarStringNative = (decoder) => (
    /** @type any */
    utf8TextDecoder.decode(readVarUint8Array(decoder))
  );
  var readVarString = utf8TextDecoder ? _readVarStringNative : _readVarStringPolyfill;
  var readFromDataView = (decoder, len) => {
    const dv = new DataView(decoder.arr.buffer, decoder.arr.byteOffset + decoder.pos, len);
    decoder.pos += len;
    return dv;
  };
  var readFloat32 = (decoder) => readFromDataView(decoder, 4).getFloat32(0, false);
  var readFloat64 = (decoder) => readFromDataView(decoder, 8).getFloat64(0, false);
  var readBigInt64 = (decoder) => (
    /** @type {any} */
    readFromDataView(decoder, 8).getBigInt64(0, false)
  );
  var readAnyLookupTable = [
    (decoder) => void 0,
    // CASE 127: undefined
    (decoder) => null,
    // CASE 126: null
    readVarInt,
    // CASE 125: integer
    readFloat32,
    // CASE 124: float32
    readFloat64,
    // CASE 123: float64
    readBigInt64,
    // CASE 122: bigint
    (decoder) => false,
    // CASE 121: boolean (false)
    (decoder) => true,
    // CASE 120: boolean (true)
    readVarString,
    // CASE 119: string
    (decoder) => {
      const len = readVarUint(decoder);
      const obj = {};
      for (let i = 0; i < len; i++) {
        const key = readVarString(decoder);
        obj[key] = readAny(decoder);
      }
      return obj;
    },
    (decoder) => {
      const len = readVarUint(decoder);
      const arr = [];
      for (let i = 0; i < len; i++) {
        arr.push(readAny(decoder));
      }
      return arr;
    },
    readVarUint8Array
    // CASE 116: Uint8Array
  ];
  var readAny = (decoder) => readAnyLookupTable[127 - readUint8(decoder)](decoder);
  var RleDecoder = class extends Decoder {
    /**
     * @param {Uint8Array} uint8Array
     * @param {function(Decoder):T} reader
     */
    constructor(uint8Array, reader) {
      super(uint8Array);
      this.reader = reader;
      this.s = null;
      this.count = 0;
    }
    read() {
      if (this.count === 0) {
        this.s = this.reader(this);
        if (hasContent(this)) {
          this.count = readVarUint(this) + 1;
        } else {
          this.count = -1;
        }
      }
      this.count--;
      return (
        /** @type {T} */
        this.s
      );
    }
  };
  var UintOptRleDecoder = class extends Decoder {
    /**
     * @param {Uint8Array} uint8Array
     */
    constructor(uint8Array) {
      super(uint8Array);
      this.s = 0;
      this.count = 0;
    }
    read() {
      if (this.count === 0) {
        this.s = readVarInt(this);
        const isNegative = isNegativeZero(this.s);
        this.count = 1;
        if (isNegative) {
          this.s = -this.s;
          this.count = readVarUint(this) + 2;
        }
      }
      this.count--;
      return (
        /** @type {number} */
        this.s
      );
    }
  };
  var IntDiffOptRleDecoder = class extends Decoder {
    /**
     * @param {Uint8Array} uint8Array
     */
    constructor(uint8Array) {
      super(uint8Array);
      this.s = 0;
      this.count = 0;
      this.diff = 0;
    }
    /**
     * @return {number}
     */
    read() {
      if (this.count === 0) {
        const diff = readVarInt(this);
        const hasCount = diff & 1;
        this.diff = floor(diff / 2);
        this.count = 1;
        if (hasCount) {
          this.count = readVarUint(this) + 2;
        }
      }
      this.s += this.diff;
      this.count--;
      return this.s;
    }
  };
  var StringDecoder = class {
    /**
     * @param {Uint8Array} uint8Array
     */
    constructor(uint8Array) {
      this.decoder = new UintOptRleDecoder(uint8Array);
      this.str = readVarString(this.decoder);
      this.spos = 0;
    }
    /**
     * @return {string}
     */
    read() {
      const end = this.spos + this.decoder.read();
      const res = this.str.slice(this.spos, end);
      this.spos = end;
      return res;
    }
  };

  // src/utils/DeleteSet.js
  var DeleteItem = class {
    /**
     * @param {number} clock
     * @param {number} len
     */
    constructor(clock, len) {
      this.clock = clock;
      this.len = len;
    }
  };
  var DeleteSet = class {
    constructor() {
      this.clients = /* @__PURE__ */ new Map();
    }
  };
  var iterateDeletedStructs = (transaction, ds, f) => ds.clients.forEach((deletes, clientid) => {
    const structs = (
      /** @type {Array<GC|Item>} */
      transaction.doc.store.clients.get(clientid)
    );
    for (let i = 0; i < deletes.length; i++) {
      const del = deletes[i];
      iterateStructs(transaction, structs, del.clock, del.len, f);
    }
  });
  var findIndexDS = (dis, clock) => {
    let left = 0;
    let right = dis.length - 1;
    while (left <= right) {
      const midindex = floor((left + right) / 2);
      const mid = dis[midindex];
      const midclock = mid.clock;
      if (midclock <= clock) {
        if (clock < midclock + mid.len) {
          return midindex;
        }
        left = midindex + 1;
      } else {
        right = midindex - 1;
      }
    }
    return null;
  };
  var isDeleted = (ds, id2) => {
    const dis = ds.clients.get(id2.client);
    return dis !== void 0 && findIndexDS(dis, id2.clock) !== null;
  };
  var sortAndMergeDeleteSet = (ds) => {
    ds.clients.forEach((dels) => {
      dels.sort((a, b) => a.clock - b.clock);
      let i, j;
      for (i = 1, j = 1; i < dels.length; i++) {
        const left = dels[j - 1];
        const right = dels[i];
        if (left.clock + left.len >= right.clock) {
          left.len = max(left.len, right.clock + right.len - left.clock);
        } else {
          if (j < i) {
            dels[j] = right;
          }
          j++;
        }
      }
      dels.length = j;
    });
  };
  var mergeDeleteSets = (dss) => {
    const merged = new DeleteSet();
    for (let dssI = 0; dssI < dss.length; dssI++) {
      dss[dssI].clients.forEach((delsLeft, client) => {
        if (!merged.clients.has(client)) {
          const dels = delsLeft.slice();
          for (let i = dssI + 1; i < dss.length; i++) {
            appendTo(dels, dss[i].clients.get(client) || []);
          }
          merged.clients.set(client, dels);
        }
      });
    }
    sortAndMergeDeleteSet(merged);
    return merged;
  };
  var addToDeleteSet = (ds, client, clock, length2) => {
    setIfUndefined(ds.clients, client, () => (
      /** @type {Array<DeleteItem>} */
      []
    )).push(new DeleteItem(clock, length2));
  };
  var createDeleteSet = () => new DeleteSet();
  var createDeleteSetFromStructStore = (ss) => {
    const ds = createDeleteSet();
    ss.clients.forEach((structs, client) => {
      const dsitems = [];
      for (let i = 0; i < structs.length; i++) {
        const struct = structs[i];
        if (struct.deleted) {
          const clock = struct.id.clock;
          let len = struct.length;
          if (i + 1 < structs.length) {
            for (let next = structs[i + 1]; i + 1 < structs.length && next.deleted; next = structs[++i + 1]) {
              len += next.length;
            }
          }
          dsitems.push(new DeleteItem(clock, len));
        }
      }
      if (dsitems.length > 0) {
        ds.clients.set(client, dsitems);
      }
    });
    return ds;
  };
  var writeDeleteSet = (encoder, ds) => {
    writeVarUint(encoder.restEncoder, ds.clients.size);
    from(ds.clients.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, dsitems]) => {
      encoder.resetDsCurVal();
      writeVarUint(encoder.restEncoder, client);
      const len = dsitems.length;
      writeVarUint(encoder.restEncoder, len);
      for (let i = 0; i < len; i++) {
        const item = dsitems[i];
        encoder.writeDsClock(item.clock);
        encoder.writeDsLen(item.len);
      }
    });
  };
  var readDeleteSet = (decoder) => {
    const ds = new DeleteSet();
    const numClients = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numClients; i++) {
      decoder.resetDsCurVal();
      const client = readVarUint(decoder.restDecoder);
      const numberOfDeletes = readVarUint(decoder.restDecoder);
      if (numberOfDeletes > 0) {
        const dsField = setIfUndefined(ds.clients, client, () => (
          /** @type {Array<DeleteItem>} */
          []
        ));
        for (let i2 = 0; i2 < numberOfDeletes; i2++) {
          dsField.push(new DeleteItem(decoder.readDsClock(), decoder.readDsLen()));
        }
      }
    }
    return ds;
  };
  var readAndApplyDeleteSet = (decoder, transaction, store) => {
    const unappliedDS = new DeleteSet();
    const numClients = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numClients; i++) {
      decoder.resetDsCurVal();
      const client = readVarUint(decoder.restDecoder);
      const numberOfDeletes = readVarUint(decoder.restDecoder);
      const structs = store.clients.get(client) || [];
      const state = getState(store, client);
      for (let i2 = 0; i2 < numberOfDeletes; i2++) {
        const clock = decoder.readDsClock();
        const clockEnd = clock + decoder.readDsLen();
        if (clock < state) {
          if (state < clockEnd) {
            addToDeleteSet(unappliedDS, client, state, clockEnd - state);
          }
          let index = findIndexSS(structs, clock);
          let struct = structs[index];
          if (!struct.deleted && struct.id.clock < clock) {
            structs.splice(index + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
            index++;
          }
          while (index < structs.length) {
            struct = structs[index++];
            if (struct.id.clock < clockEnd) {
              if (!struct.deleted) {
                if (clockEnd < struct.id.clock + struct.length) {
                  structs.splice(index, 0, splitItem(transaction, struct, clockEnd - struct.id.clock));
                }
                struct.delete(transaction);
              }
            } else {
              break;
            }
          }
        } else {
          addToDeleteSet(unappliedDS, client, clock, clockEnd - clock);
        }
      }
    }
    if (unappliedDS.clients.size > 0) {
      const ds = new UpdateEncoderV2();
      writeVarUint(ds.restEncoder, 0);
      writeDeleteSet(ds, unappliedDS);
      return ds.toUint8Array();
    }
    return null;
  };

  // ../../node_modules/lib0/time.js
  var getUnixTime = Date.now;

  // ../../node_modules/lib0/promise.js
  var create4 = (f) => (
    /** @type {Promise<T>} */
    new Promise(f)
  );
  var all = Promise.all.bind(Promise);

  // src/utils/Doc.js
  function uint32() {
    return Math.floor(Math.random() * 2 ** 32);
  }
  var generateNewClientId = uint32;
  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  var Doc = class _Doc extends ObservableV2 {
    /**
     * @param {DocOpts} opts configuration
     */
    constructor({ guid = uuidv4(), collectionid = null, gc = true, gcFilter = () => true, meta = null, autoLoad = false, shouldLoad = true } = {}) {
      super();
      this.gc = gc;
      this.gcFilter = gcFilter;
      this.clientID = generateNewClientId();
      this.guid = guid;
      this.collectionid = collectionid;
      this.share = /* @__PURE__ */ new Map();
      this.store = new StructStore();
      this._transaction = null;
      this._transactionCleanups = [];
      this.subdocs = /* @__PURE__ */ new Set();
      this._item = null;
      this.shouldLoad = shouldLoad;
      this.autoLoad = autoLoad;
      this.meta = meta;
      this.isLoaded = false;
      this.isSynced = false;
      this.isDestroyed = false;
      this.whenLoaded = create4((resolve) => {
        this.on("load", () => {
          this.isLoaded = true;
          resolve(this);
        });
      });
      const provideSyncedPromise = () => create4((resolve) => {
        const eventHandler = (isSynced) => {
          if (isSynced === void 0 || isSynced === true) {
            this.off("sync", eventHandler);
            resolve();
          }
        };
        this.on("sync", eventHandler);
      });
      this.on("sync", (isSynced) => {
        if (isSynced === false && this.isSynced) {
          this.whenSynced = provideSyncedPromise();
        }
        this.isSynced = isSynced === void 0 || isSynced === true;
        if (this.isSynced && !this.isLoaded) {
          this.emit("load", [this]);
        }
      });
      this.whenSynced = provideSyncedPromise();
    }
    /**
     * Notify the parent document that you request to load data into this subdocument (if it is a subdocument).
     *
     * `load()` might be used in the future to request any provider to load the most current data.
     *
     * It is safe to call `load()` multiple times.
     */
    load() {
      const item = this._item;
      if (item !== null && !this.shouldLoad) {
        transact(
          /** @type {any} */
          item.parent.doc,
          (transaction) => {
            transaction.subdocsLoaded.add(this);
          },
          null,
          true
        );
      }
      this.shouldLoad = true;
    }
    getSubdocs() {
      return this.subdocs;
    }
    getSubdocGuids() {
      return new Set(from(this.subdocs).map((doc3) => doc3.guid));
    }
    /**
     * Changes that happen inside of a transaction are bundled. This means that
     * the observer fires _after_ the transaction is finished and that all changes
     * that happened inside of the transaction are sent as one message to the
     * other peers.
     *
     * @template T
     * @param {function(Transaction):T} f The function that should be executed as a transaction
     * @param {any} [origin] Origin of who started the transaction. Will be stored on transaction.origin
     * @return T
     *
     * @public
     */
    transact(f, origin = null) {
      return transact(this, f, origin);
    }
    /**
     * Define a shared data type.
     *
     * Multiple calls of `ydoc.get(name, TypeConstructor)` yield the same result
     * and do not overwrite each other. I.e.
     * `ydoc.get(name, Y.Array) === ydoc.get(name, Y.Array)`
     *
     * After this method is called, the type is also available on `ydoc.share.get(name)`.
     *
     * *Best Practices:*
     * Define all types right after the Y.Doc instance is created and store them in a separate object.
     * Also use the typed methods `getText(name)`, `getArray(name)`, ..
     *
     * @template {typeof AbstractType<any>} Type
     * @example
     *   const ydoc = new Y.Doc(..)
     *   const appState = {
     *     document: ydoc.getText('document')
     *     comments: ydoc.getArray('comments')
     *   }
     *
     * @param {string} name
     * @param {Type} TypeConstructor The constructor of the type definition. E.g. Y.Text, Y.Array, Y.Map, ...
     * @return {InstanceType<Type>} The created type. Constructed with TypeConstructor
     *
     * @public
     */
    get(name, TypeConstructor = (
      /** @type {any} */
      AbstractType
    )) {
      const type = setIfUndefined(this.share, name, () => {
        const t = new TypeConstructor();
        t._integrate(this, null);
        return t;
      });
      const Constr = type.constructor;
      if (TypeConstructor !== AbstractType && Constr !== TypeConstructor) {
        if (Constr === AbstractType) {
          const t = new TypeConstructor();
          t._map = type._map;
          type._map.forEach(
            /** @param {Item?} n */
            (n) => {
              for (; n !== null; n = n.left) {
                n.parent = t;
              }
            }
          );
          t._start = type._start;
          for (let n = t._start; n !== null; n = n.right) {
            n.parent = t;
          }
          t._length = type._length;
          this.share.set(name, t);
          t._integrate(this, null);
          return (
            /** @type {InstanceType<Type>} */
            t
          );
        } else {
          throw new Error(`Type with the name ${name} has already been defined with a different constructor`);
        }
      }
      return (
        /** @type {InstanceType<Type>} */
        type
      );
    }
    /**
     * @template T
     * @param {string} [name]
     * @return {YArray<T>}
     *
     * @public
     */
    getArray(name = "") {
      return (
        /** @type {YArray<T>} */
        this.get(name, YArray)
      );
    }
    /**
     * @param {string} [name]
     * @return {YText}
     *
     * @public
     */
    getText(name = "") {
      return this.get(name, YText);
    }
    /**
     * @template T
     * @param {string} [name]
     * @return {YMap<T>}
     *
     * @public
     */
    getMap(name = "") {
      return (
        /** @type {YMap<T>} */
        this.get(name, YMap)
      );
    }
    /**
     * @param {string} [name]
     * @return {YXmlElement}
     *
     * @public
     */
    getXmlElement(name = "") {
      return (
        /** @type {YXmlElement<{[key:string]:string}>} */
        this.get(name, YXmlElement)
      );
    }
    /**
     * @param {string} [name]
     * @return {YXmlFragment}
     *
     * @public
     */
    getXmlFragment(name = "") {
      return this.get(name, YXmlFragment);
    }
    /**
     * Converts the entire document into a js object, recursively traversing each yjs type
     * Doesn't log types that have not been defined (using ydoc.getType(..)).
     *
     * @deprecated Do not use this method and rather call toJSON directly on the shared types.
     *
     * @return {Object<string, any>}
     */
    toJSON() {
      const doc3 = {};
      this.share.forEach((value, key) => {
        doc3[key] = value.toJSON();
      });
      return doc3;
    }
    /**
     * Emit `destroy` event and unregister all event handlers.
     */
    destroy() {
      this.isDestroyed = true;
      from(this.subdocs).forEach((subdoc) => subdoc.destroy());
      const item = this._item;
      if (item !== null) {
        this._item = null;
        const content = (
          /** @type {ContentDoc} */
          item.content
        );
        content.doc = new _Doc({ guid: this.guid, ...content.opts, shouldLoad: false });
        content.doc._item = item;
        transact(
          /** @type {any} */
          item.parent.doc,
          (transaction) => {
            const doc3 = content.doc;
            if (!item.deleted) {
              transaction.subdocsAdded.add(doc3);
            }
            transaction.subdocsRemoved.add(this);
          },
          null,
          true
        );
      }
      this.emit("destroyed", [true]);
      this.emit("destroy", [this]);
      super.destroy();
    }
  };

  // ../../node_modules/lib0/conditions.js
  var undefinedToNull = (v) => v === void 0 ? null : v;

  // ../../node_modules/lib0/storage.js
  var VarStoragePolyfill = class {
    constructor() {
      this.map = /* @__PURE__ */ new Map();
    }
    /**
     * @param {string} key
     * @param {any} newValue
     */
    setItem(key, newValue) {
      this.map.set(key, newValue);
    }
    /**
     * @param {string} key
     */
    getItem(key) {
      return this.map.get(key);
    }
  };
  var _localStorage = new VarStoragePolyfill();
  var usePolyfill = true;
  try {
    if (typeof localStorage !== "undefined" && localStorage) {
      _localStorage = localStorage;
      usePolyfill = false;
    }
  } catch (e) {
  }
  var varStorage = _localStorage;

  // ../../node_modules/lib0/object.js
  var assign = Object.assign;
  var keys = Object.keys;
  var forEach = (obj, f) => {
    for (const key in obj) {
      f(obj[key], key);
    }
  };
  var size = (obj) => keys(obj).length;
  var isEmpty = (obj) => {
    for (const _k in obj) {
      return false;
    }
    return true;
  };
  var every = (obj, f) => {
    for (const key in obj) {
      if (!f(obj[key], key)) {
        return false;
      }
    }
    return true;
  };
  var hasProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  var equalFlat = (a, b) => a === b || size(a) === size(b) && every(a, (val, key) => (val !== void 0 || hasProperty(b, key)) && b[key] === val);
  var freeze = Object.freeze;
  var deepFreeze = (o) => {
    for (const key in o) {
      const c = o[key];
      if (typeof c === "object" || typeof c === "function") {
        deepFreeze(o[key]);
      }
    }
    return freeze(o);
  };

  // ../../node_modules/lib0/function.js
  var callAll = (fs, args2, i = 0) => {
    try {
      for (; i < fs.length; i++) {
        fs[i](...args2);
      }
    } finally {
      if (i < fs.length) {
        callAll(fs, args2, i + 1);
      }
    }
  };
  var id = (a) => a;
  var isOneOf = (value, options) => options.includes(value);

  // ../../node_modules/lib0/environment.js
  var isNode = typeof process !== "undefined" && process.release && /node|io\.js/.test(process.release.name) && Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
  var isMac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
  var params;
  var args = [];
  var computeParams = () => {
    if (params === void 0) {
      if (isNode) {
        params = create();
        const pargs = process.argv;
        let currParamName = null;
        for (let i = 0; i < pargs.length; i++) {
          const parg = pargs[i];
          if (parg[0] === "-") {
            if (currParamName !== null) {
              params.set(currParamName, "");
            }
            currParamName = parg;
          } else {
            if (currParamName !== null) {
              params.set(currParamName, parg);
              currParamName = null;
            } else {
              args.push(parg);
            }
          }
        }
        if (currParamName !== null) {
          params.set(currParamName, "");
        }
      } else if (typeof location === "object") {
        params = create();
        (location.search || "?").slice(1).split("&").forEach((kv) => {
          if (kv.length !== 0) {
            const [key, value] = kv.split("=");
            params.set(`--${fromCamelCase(key, "-")}`, value);
            params.set(`-${fromCamelCase(key, "-")}`, value);
          }
        });
      } else {
        params = create();
      }
    }
    return params;
  };
  var hasParam = (name) => computeParams().has(name);
  var getVariable = (name) => isNode ? undefinedToNull(process.env[name.toUpperCase().replaceAll("-", "_")]) : undefinedToNull(varStorage.getItem(name));
  var hasConf = (name) => hasParam("--" + name) || getVariable(name) !== null;
  var production = hasConf("production");
  var forceColor = isNode && isOneOf(process.env.FORCE_COLOR, ["true", "1", "2"]);
  var supportsColor = forceColor || !hasParam("--no-colors") && // @todo deprecate --no-colors
  !hasConf("no-color") && (!isNode || process.stdout.isTTY) && (!isNode || hasParam("--color") || getVariable("COLORTERM") !== null || (getVariable("TERM") || "").includes("color"));

  // ../../node_modules/lib0/buffer.js
  var createUint8ArrayFromLen = (len) => new Uint8Array(len);
  var copyUint8Array = (uint8Array) => {
    const newBuf = createUint8ArrayFromLen(uint8Array.byteLength);
    newBuf.set(uint8Array);
    return newBuf;
  };

  // src/utils/UpdateDecoder.js
  var DSDecoderV1 = class {
    /**
     * @param {decoding.Decoder} decoder
     */
    constructor(decoder) {
      this.restDecoder = decoder;
    }
    resetDsCurVal() {
    }
    /**
     * @return {number}
     */
    readDsClock() {
      return readVarUint(this.restDecoder);
    }
    /**
     * @return {number}
     */
    readDsLen() {
      return readVarUint(this.restDecoder);
    }
  };
  var UpdateDecoderV1 = class extends DSDecoderV1 {
    /**
     * @return {ID}
     */
    readLeftID() {
      return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder));
    }
    /**
     * @return {ID}
     */
    readRightID() {
      return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder));
    }
    /**
     * Read the next client id.
     * Use this in favor of readID whenever possible to reduce the number of objects created.
     */
    readClient() {
      return readVarUint(this.restDecoder);
    }
    /**
     * @return {number} info An unsigned 8-bit integer
     */
    readInfo() {
      return readUint8(this.restDecoder);
    }
    /**
     * @return {string}
     */
    readString() {
      return readVarString(this.restDecoder);
    }
    /**
     * @return {boolean} isKey
     */
    readParentInfo() {
      return readVarUint(this.restDecoder) === 1;
    }
    /**
     * @return {number} info An unsigned 8-bit integer
     */
    readTypeRef() {
      return readVarUint(this.restDecoder);
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @return {number} len
     */
    readLen() {
      return readVarUint(this.restDecoder);
    }
    /**
     * @return {any}
     */
    readAny() {
      return readAny(this.restDecoder);
    }
    /**
     * @return {Uint8Array}
     */
    readBuf() {
      return copyUint8Array(readVarUint8Array(this.restDecoder));
    }
    /**
     * Legacy implementation uses JSON parse. We use any-decoding in v2.
     *
     * @return {any}
     */
    readJSON() {
      return JSON.parse(readVarString(this.restDecoder));
    }
    /**
     * @return {string}
     */
    readKey() {
      return readVarString(this.restDecoder);
    }
  };
  var DSDecoderV2 = class {
    /**
     * @param {decoding.Decoder} decoder
     */
    constructor(decoder) {
      this.dsCurrVal = 0;
      this.restDecoder = decoder;
    }
    resetDsCurVal() {
      this.dsCurrVal = 0;
    }
    /**
     * @return {number}
     */
    readDsClock() {
      this.dsCurrVal += readVarUint(this.restDecoder);
      return this.dsCurrVal;
    }
    /**
     * @return {number}
     */
    readDsLen() {
      const diff = readVarUint(this.restDecoder) + 1;
      this.dsCurrVal += diff;
      return diff;
    }
  };
  var UpdateDecoderV2 = class extends DSDecoderV2 {
    /**
     * @param {decoding.Decoder} decoder
     */
    constructor(decoder) {
      super(decoder);
      this.keys = [];
      readVarUint(decoder);
      this.keyClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
      this.clientDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
      this.leftClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
      this.rightClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
      this.infoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
      this.stringDecoder = new StringDecoder(readVarUint8Array(decoder));
      this.parentInfoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
      this.typeRefDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
      this.lenDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
    }
    /**
     * @return {ID}
     */
    readLeftID() {
      return new ID(this.clientDecoder.read(), this.leftClockDecoder.read());
    }
    /**
     * @return {ID}
     */
    readRightID() {
      return new ID(this.clientDecoder.read(), this.rightClockDecoder.read());
    }
    /**
     * Read the next client id.
     * Use this in favor of readID whenever possible to reduce the number of objects created.
     */
    readClient() {
      return this.clientDecoder.read();
    }
    /**
     * @return {number} info An unsigned 8-bit integer
     */
    readInfo() {
      return (
        /** @type {number} */
        this.infoDecoder.read()
      );
    }
    /**
     * @return {string}
     */
    readString() {
      return this.stringDecoder.read();
    }
    /**
     * @return {boolean}
     */
    readParentInfo() {
      return this.parentInfoDecoder.read() === 1;
    }
    /**
     * @return {number} An unsigned 8-bit integer
     */
    readTypeRef() {
      return this.typeRefDecoder.read();
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @return {number}
     */
    readLen() {
      return this.lenDecoder.read();
    }
    /**
     * @return {any}
     */
    readAny() {
      return readAny(this.restDecoder);
    }
    /**
     * @return {Uint8Array}
     */
    readBuf() {
      return readVarUint8Array(this.restDecoder);
    }
    /**
     * This is mainly here for legacy purposes.
     *
     * Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.
     *
     * @return {any}
     */
    readJSON() {
      return readAny(this.restDecoder);
    }
    /**
     * @return {string}
     */
    readKey() {
      const keyClock = this.keyClockDecoder.read();
      if (keyClock < this.keys.length) {
        return this.keys[keyClock];
      } else {
        const key = this.stringDecoder.read();
        this.keys.push(key);
        return key;
      }
    }
  };

  // src/utils/UpdateEncoder.js
  var DSEncoderV1 = class {
    constructor() {
      this.restEncoder = createEncoder();
    }
    toUint8Array() {
      return toUint8Array(this.restEncoder);
    }
    resetDsCurVal() {
    }
    /**
     * @param {number} clock
     */
    writeDsClock(clock) {
      writeVarUint(this.restEncoder, clock);
    }
    /**
     * @param {number} len
     */
    writeDsLen(len) {
      writeVarUint(this.restEncoder, len);
    }
  };
  var UpdateEncoderV1 = class extends DSEncoderV1 {
    /**
     * @param {ID} id
     */
    writeLeftID(id2) {
      writeVarUint(this.restEncoder, id2.client);
      writeVarUint(this.restEncoder, id2.clock);
    }
    /**
     * @param {ID} id
     */
    writeRightID(id2) {
      writeVarUint(this.restEncoder, id2.client);
      writeVarUint(this.restEncoder, id2.clock);
    }
    /**
     * Use writeClient and writeClock instead of writeID if possible.
     * @param {number} client
     */
    writeClient(client) {
      writeVarUint(this.restEncoder, client);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeInfo(info) {
      writeUint8(this.restEncoder, info);
    }
    /**
     * @param {string} s
     */
    writeString(s) {
      writeVarString(this.restEncoder, s);
    }
    /**
     * @param {boolean} isYKey
     */
    writeParentInfo(isYKey) {
      writeVarUint(this.restEncoder, isYKey ? 1 : 0);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeTypeRef(info) {
      writeVarUint(this.restEncoder, info);
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @param {number} len
     */
    writeLen(len) {
      writeVarUint(this.restEncoder, len);
    }
    /**
     * @param {any} any
     */
    writeAny(any2) {
      writeAny(this.restEncoder, any2);
    }
    /**
     * @param {Uint8Array} buf
     */
    writeBuf(buf) {
      writeVarUint8Array(this.restEncoder, buf);
    }
    /**
     * @param {any} embed
     */
    writeJSON(embed) {
      writeVarString(this.restEncoder, JSON.stringify(embed));
    }
    /**
     * @param {string} key
     */
    writeKey(key) {
      writeVarString(this.restEncoder, key);
    }
  };
  var DSEncoderV2 = class {
    constructor() {
      this.restEncoder = createEncoder();
      this.dsCurrVal = 0;
    }
    toUint8Array() {
      return toUint8Array(this.restEncoder);
    }
    resetDsCurVal() {
      this.dsCurrVal = 0;
    }
    /**
     * @param {number} clock
     */
    writeDsClock(clock) {
      const diff = clock - this.dsCurrVal;
      this.dsCurrVal = clock;
      writeVarUint(this.restEncoder, diff);
    }
    /**
     * @param {number} len
     */
    writeDsLen(len) {
      if (len === 0) {
        unexpectedCase();
      }
      writeVarUint(this.restEncoder, len - 1);
      this.dsCurrVal += len;
    }
  };
  var UpdateEncoderV2 = class extends DSEncoderV2 {
    constructor() {
      super();
      this.keyMap = /* @__PURE__ */ new Map();
      this.keyClock = 0;
      this.keyClockEncoder = new IntDiffOptRleEncoder();
      this.clientEncoder = new UintOptRleEncoder();
      this.leftClockEncoder = new IntDiffOptRleEncoder();
      this.rightClockEncoder = new IntDiffOptRleEncoder();
      this.infoEncoder = new RleEncoder(writeUint8);
      this.stringEncoder = new StringEncoder();
      this.parentInfoEncoder = new RleEncoder(writeUint8);
      this.typeRefEncoder = new UintOptRleEncoder();
      this.lenEncoder = new UintOptRleEncoder();
    }
    toUint8Array() {
      const encoder = createEncoder();
      writeVarUint(encoder, 0);
      writeVarUint8Array(encoder, this.keyClockEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.clientEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.leftClockEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.rightClockEncoder.toUint8Array());
      writeVarUint8Array(encoder, toUint8Array(this.infoEncoder));
      writeVarUint8Array(encoder, this.stringEncoder.toUint8Array());
      writeVarUint8Array(encoder, toUint8Array(this.parentInfoEncoder));
      writeVarUint8Array(encoder, this.typeRefEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.lenEncoder.toUint8Array());
      writeUint8Array(encoder, toUint8Array(this.restEncoder));
      return toUint8Array(encoder);
    }
    /**
     * @param {ID} id
     */
    writeLeftID(id2) {
      this.clientEncoder.write(id2.client);
      this.leftClockEncoder.write(id2.clock);
    }
    /**
     * @param {ID} id
     */
    writeRightID(id2) {
      this.clientEncoder.write(id2.client);
      this.rightClockEncoder.write(id2.clock);
    }
    /**
     * @param {number} client
     */
    writeClient(client) {
      this.clientEncoder.write(client);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeInfo(info) {
      this.infoEncoder.write(info);
    }
    /**
     * @param {string} s
     */
    writeString(s) {
      this.stringEncoder.write(s);
    }
    /**
     * @param {boolean} isYKey
     */
    writeParentInfo(isYKey) {
      this.parentInfoEncoder.write(isYKey ? 1 : 0);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeTypeRef(info) {
      this.typeRefEncoder.write(info);
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @param {number} len
     */
    writeLen(len) {
      this.lenEncoder.write(len);
    }
    /**
     * @param {any} any
     */
    writeAny(any2) {
      writeAny(this.restEncoder, any2);
    }
    /**
     * @param {Uint8Array} buf
     */
    writeBuf(buf) {
      writeVarUint8Array(this.restEncoder, buf);
    }
    /**
     * This is mainly here for legacy purposes.
     *
     * Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.
     *
     * @param {any} embed
     */
    writeJSON(embed) {
      writeAny(this.restEncoder, embed);
    }
    /**
     * Property keys are often reused. For example, in y-prosemirror the key `bold` might
     * occur very often. For a 3d application, the key `position` might occur very often.
     *
     * We cache these keys in a Map and refer to them via a unique number.
     *
     * @param {string} key
     */
    writeKey(key) {
      const clock = this.keyMap.get(key);
      if (clock === void 0) {
        this.keyClockEncoder.write(this.keyClock++);
        this.stringEncoder.write(key);
      } else {
        this.keyClockEncoder.write(clock);
      }
    }
  };

  // src/utils/encoding.js
  var writeStructs = (encoder, structs, client, clock) => {
    clock = max(clock, structs[0].id.clock);
    const startNewStructs = findIndexSS(structs, clock);
    writeVarUint(encoder.restEncoder, structs.length - startNewStructs);
    encoder.writeClient(client);
    writeVarUint(encoder.restEncoder, clock);
    const firstStruct = structs[startNewStructs];
    firstStruct.write(encoder, clock - firstStruct.id.clock);
    for (let i = startNewStructs + 1; i < structs.length; i++) {
      structs[i].write(encoder, 0);
    }
  };
  var writeClientsStructs = (encoder, store, _sm) => {
    const sm = /* @__PURE__ */ new Map();
    _sm.forEach((clock, client) => {
      if (getState(store, client) > clock) {
        sm.set(client, clock);
      }
    });
    getStateVector(store).forEach((_clock, client) => {
      if (!_sm.has(client)) {
        sm.set(client, 0);
      }
    });
    writeVarUint(encoder.restEncoder, sm.size);
    from(sm.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, clock]) => {
      writeStructs(
        encoder,
        /** @type {Array<GC|Item>} */
        store.clients.get(client),
        client,
        clock
      );
    });
  };
  var readClientsStructRefs = (decoder, doc3) => {
    const clientRefs = create();
    const numOfStateUpdates = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numOfStateUpdates; i++) {
      const numberOfStructs = readVarUint(decoder.restDecoder);
      const refs = new Array(numberOfStructs);
      const client = decoder.readClient();
      let clock = readVarUint(decoder.restDecoder);
      clientRefs.set(client, { i: 0, refs });
      for (let i2 = 0; i2 < numberOfStructs; i2++) {
        const info = decoder.readInfo();
        switch (BITS5 & info) {
          case 0: {
            const len = decoder.readLen();
            refs[i2] = new GC(createID(client, clock), len);
            clock += len;
            break;
          }
          case 10: {
            const len = readVarUint(decoder.restDecoder);
            refs[i2] = new Skip(createID(client, clock), len);
            clock += len;
            break;
          }
          default: {
            const cantCopyParentInfo = (info & (BIT7 | BIT8)) === 0;
            const struct = new Item(
              createID(client, clock),
              null,
              // left
              (info & BIT8) === BIT8 ? decoder.readLeftID() : null,
              // origin
              null,
              // right
              (info & BIT7) === BIT7 ? decoder.readRightID() : null,
              // right origin
              cantCopyParentInfo ? decoder.readParentInfo() ? doc3.get(decoder.readString()) : decoder.readLeftID() : null,
              // parent
              cantCopyParentInfo && (info & BIT6) === BIT6 ? decoder.readString() : null,
              // parentSub
              readItemContent(decoder, info)
              // item content
            );
            refs[i2] = struct;
            clock += struct.length;
          }
        }
      }
    }
    return clientRefs;
  };
  var integrateStructs = (transaction, store, clientsStructRefs) => {
    const stack = [];
    let clientsStructRefsIds = from(clientsStructRefs.keys()).sort((a, b) => a - b);
    if (clientsStructRefsIds.length === 0) {
      return null;
    }
    const getNextStructTarget = () => {
      if (clientsStructRefsIds.length === 0) {
        return null;
      }
      let nextStructsTarget = (
        /** @type {{i:number,refs:Array<GC|Item>}} */
        clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1])
      );
      while (nextStructsTarget.refs.length === nextStructsTarget.i) {
        clientsStructRefsIds.pop();
        if (clientsStructRefsIds.length > 0) {
          nextStructsTarget = /** @type {{i:number,refs:Array<GC|Item>}} */
          clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1]);
        } else {
          return null;
        }
      }
      return nextStructsTarget;
    };
    let curStructsTarget = getNextStructTarget();
    if (curStructsTarget === null) {
      return null;
    }
    const restStructs = new StructStore();
    const missingSV = /* @__PURE__ */ new Map();
    const updateMissingSv = (client, clock) => {
      const mclock = missingSV.get(client);
      if (mclock == null || mclock > clock) {
        missingSV.set(client, clock);
      }
    };
    let stackHead = (
      /** @type {any} */
      curStructsTarget.refs[
        /** @type {any} */
        curStructsTarget.i++
      ]
    );
    const state = /* @__PURE__ */ new Map();
    const addStackToRestSS = () => {
      for (const item of stack) {
        const client = item.id.client;
        const unapplicableItems = clientsStructRefs.get(client);
        if (unapplicableItems) {
          unapplicableItems.i--;
          restStructs.clients.set(client, unapplicableItems.refs.slice(unapplicableItems.i));
          clientsStructRefs.delete(client);
          unapplicableItems.i = 0;
          unapplicableItems.refs = [];
        } else {
          restStructs.clients.set(client, [item]);
        }
        clientsStructRefsIds = clientsStructRefsIds.filter((c) => c !== client);
      }
      stack.length = 0;
    };
    while (true) {
      if (stackHead.constructor !== Skip) {
        const localClock = setIfUndefined(state, stackHead.id.client, () => getState(store, stackHead.id.client));
        const offset = localClock - stackHead.id.clock;
        if (offset < 0) {
          stack.push(stackHead);
          updateMissingSv(stackHead.id.client, stackHead.id.clock - 1);
          addStackToRestSS();
        } else {
          const missing = stackHead.getMissing(transaction, store);
          if (missing !== null) {
            stack.push(stackHead);
            const structRefs = clientsStructRefs.get(
              /** @type {number} */
              missing
            ) || { refs: [], i: 0 };
            if (structRefs.refs.length === structRefs.i) {
              updateMissingSv(
                /** @type {number} */
                missing,
                getState(store, missing)
              );
              addStackToRestSS();
            } else {
              stackHead = structRefs.refs[structRefs.i++];
              continue;
            }
          } else if (offset === 0 || offset < stackHead.length) {
            stackHead.integrate(transaction, offset);
            state.set(stackHead.id.client, stackHead.id.clock + stackHead.length);
          }
        }
      }
      if (stack.length > 0) {
        stackHead = /** @type {GC|Item} */
        stack.pop();
      } else if (curStructsTarget !== null && curStructsTarget.i < curStructsTarget.refs.length) {
        stackHead = /** @type {GC|Item} */
        curStructsTarget.refs[curStructsTarget.i++];
      } else {
        curStructsTarget = getNextStructTarget();
        if (curStructsTarget === null) {
          break;
        } else {
          stackHead = /** @type {GC|Item} */
          curStructsTarget.refs[curStructsTarget.i++];
        }
      }
    }
    if (restStructs.clients.size > 0) {
      const encoder = new UpdateEncoderV2();
      writeClientsStructs(encoder, restStructs, /* @__PURE__ */ new Map());
      writeVarUint(encoder.restEncoder, 0);
      return { missing: missingSV, update: encoder.toUint8Array() };
    }
    return null;
  };
  var writeStructsFromTransaction = (encoder, transaction) => writeClientsStructs(encoder, transaction.doc.store, transaction.beforeState);
  var readUpdateV2 = (decoder, ydoc, transactionOrigin, structDecoder = new UpdateDecoderV2(decoder)) => transact(ydoc, (transaction) => {
    transaction.local = false;
    let retry = false;
    const doc3 = transaction.doc;
    const store = doc3.store;
    const ss = readClientsStructRefs(structDecoder, doc3);
    const restStructs = integrateStructs(transaction, store, ss);
    const pending = store.pendingStructs;
    if (pending) {
      for (const [client, clock] of pending.missing) {
        if (clock < getState(store, client)) {
          retry = true;
          break;
        }
      }
      if (restStructs) {
        for (const [client, clock] of restStructs.missing) {
          const mclock = pending.missing.get(client);
          if (mclock == null || mclock > clock) {
            pending.missing.set(client, clock);
          }
        }
        pending.update = mergeUpdatesV2([pending.update, restStructs.update]);
      }
    } else {
      store.pendingStructs = restStructs;
    }
    const dsRest = readAndApplyDeleteSet(structDecoder, transaction, store);
    if (store.pendingDs) {
      const pendingDSUpdate = new UpdateDecoderV2(createDecoder(store.pendingDs));
      readVarUint(pendingDSUpdate.restDecoder);
      const dsRest2 = readAndApplyDeleteSet(pendingDSUpdate, transaction, store);
      if (dsRest && dsRest2) {
        store.pendingDs = mergeUpdatesV2([dsRest, dsRest2]);
      } else {
        store.pendingDs = dsRest || dsRest2;
      }
    } else {
      store.pendingDs = dsRest;
    }
    if (retry) {
      const update = (
        /** @type {{update: Uint8Array}} */
        store.pendingStructs.update
      );
      store.pendingStructs = null;
      applyUpdateV2(transaction.doc, update);
    }
  }, transactionOrigin, false);
  var applyUpdateV2 = (ydoc, update, transactionOrigin, YDecoder = UpdateDecoderV2) => {
    const decoder = createDecoder(update);
    readUpdateV2(decoder, ydoc, transactionOrigin, new YDecoder(decoder));
  };
  var writeStateAsUpdate = (encoder, doc3, targetStateVector = /* @__PURE__ */ new Map()) => {
    writeClientsStructs(encoder, doc3.store, targetStateVector);
    writeDeleteSet(encoder, createDeleteSetFromStructStore(doc3.store));
  };
  var encodeStateAsUpdateV2 = (doc3, encodedTargetStateVector = new Uint8Array([0]), encoder = new UpdateEncoderV2()) => {
    const targetStateVector = decodeStateVector(encodedTargetStateVector);
    writeStateAsUpdate(encoder, doc3, targetStateVector);
    const updates = [encoder.toUint8Array()];
    if (doc3.store.pendingDs) {
      updates.push(doc3.store.pendingDs);
    }
    if (doc3.store.pendingStructs) {
      updates.push(diffUpdateV2(doc3.store.pendingStructs.update, encodedTargetStateVector));
    }
    if (updates.length > 1) {
      if (encoder.constructor === UpdateEncoderV1) {
        return mergeUpdates(updates.map((update, i) => i === 0 ? update : convertUpdateFormatV2ToV1(update)));
      } else if (encoder.constructor === UpdateEncoderV2) {
        return mergeUpdatesV2(updates);
      }
    }
    return updates[0];
  };
  var readStateVector = (decoder) => {
    const ss = /* @__PURE__ */ new Map();
    const ssLength = readVarUint(decoder.restDecoder);
    for (let i = 0; i < ssLength; i++) {
      const client = readVarUint(decoder.restDecoder);
      const clock = readVarUint(decoder.restDecoder);
      ss.set(client, clock);
    }
    return ss;
  };
  var decodeStateVector = (decodedState) => readStateVector(new DSDecoderV1(createDecoder(decodedState)));
  var writeStateVector = (encoder, sv) => {
    writeVarUint(encoder.restEncoder, sv.size);
    from(sv.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, clock]) => {
      writeVarUint(encoder.restEncoder, client);
      writeVarUint(encoder.restEncoder, clock);
    });
    return encoder;
  };
  var writeDocumentStateVector = (encoder, doc3) => writeStateVector(encoder, getStateVector(doc3.store));
  var encodeStateVectorV2 = (doc3, encoder = new DSEncoderV2()) => {
    if (doc3 instanceof Map) {
      writeStateVector(encoder, doc3);
    } else {
      writeDocumentStateVector(encoder, doc3);
    }
    return encoder.toUint8Array();
  };
  var encodeStateVector = (doc3) => encodeStateVectorV2(doc3, new DSEncoderV1());

  // src/utils/EventHandler.js
  var EventHandler = class {
    constructor() {
      this.l = [];
    }
  };
  var createEventHandler = () => new EventHandler();
  var addEventHandlerListener = (eventHandler, f) => eventHandler.l.push(f);
  var removeEventHandlerListener = (eventHandler, f) => {
    const l = eventHandler.l;
    const len = l.length;
    eventHandler.l = l.filter((g) => f !== g);
    if (len === eventHandler.l.length) {
      console.error("[yjs] Tried to remove event handler that doesn't exist.");
    }
  };
  var callEventHandlerListeners = (eventHandler, arg0, arg1) => callAll(eventHandler.l, [arg0, arg1]);

  // src/utils/ID.js
  var ID = class {
    /**
     * @param {number} client client id
     * @param {number} clock unique per client id, continuous number
     */
    constructor(client, clock) {
      this.client = client;
      this.clock = clock;
    }
  };
  var compareIDs = (a, b) => a === b || a !== null && b !== null && a.client === b.client && a.clock === b.clock;
  var createID = (client, clock) => new ID(client, clock);
  var findRootTypeKey = (type) => {
    for (const [key, value] of type.doc.share.entries()) {
      if (value === type) {
        return key;
      }
    }
    throw unexpectedCase();
  };

  // src/utils/Snapshot.js
  var Snapshot = class {
    /**
     * @param {DeleteSet} ds
     * @param {Map<number,number>} sv state map
     */
    constructor(ds, sv) {
      this.ds = ds;
      this.sv = sv;
    }
  };
  var createSnapshot = (ds, sm) => new Snapshot(ds, sm);
  var emptySnapshot = createSnapshot(createDeleteSet(), /* @__PURE__ */ new Map());
  var isVisible = (item, snapshot2) => snapshot2 === void 0 ? !item.deleted : snapshot2.sv.has(item.id.client) && (snapshot2.sv.get(item.id.client) || 0) > item.id.clock && !isDeleted(snapshot2.ds, item.id);
  var splitSnapshotAffectedStructs = (transaction, snapshot2) => {
    const meta = setIfUndefined(transaction.meta, splitSnapshotAffectedStructs, create2);
    const store = transaction.doc.store;
    if (!meta.has(snapshot2)) {
      snapshot2.sv.forEach((clock, client) => {
        if (clock < getState(store, client)) {
          getItemCleanStart(transaction, createID(client, clock));
        }
      });
      iterateDeletedStructs(transaction, snapshot2.ds, (_item) => {
      });
      meta.add(snapshot2);
    }
  };

  // src/utils/StructStore.js
  var StructStore = class {
    constructor() {
      this.clients = /* @__PURE__ */ new Map();
      this.pendingStructs = null;
      this.pendingDs = null;
    }
  };
  var getStateVector = (store) => {
    const sm = /* @__PURE__ */ new Map();
    store.clients.forEach((structs, client) => {
      const struct = structs[structs.length - 1];
      sm.set(client, struct.id.clock + struct.length);
    });
    return sm;
  };
  var getState = (store, client) => {
    const structs = store.clients.get(client);
    if (structs === void 0) {
      return 0;
    }
    const lastStruct = structs[structs.length - 1];
    return lastStruct.id.clock + lastStruct.length;
  };
  var addStruct = (store, struct) => {
    let structs = store.clients.get(struct.id.client);
    if (structs === void 0) {
      structs = [];
      store.clients.set(struct.id.client, structs);
    } else {
      const lastStruct = structs[structs.length - 1];
      if (lastStruct.id.clock + lastStruct.length !== struct.id.clock) {
        throw unexpectedCase();
      }
    }
    structs.push(struct);
  };
  var findIndexSS = (structs, clock) => {
    let left = 0;
    let right = structs.length - 1;
    let mid = structs[right];
    let midclock = mid.id.clock;
    if (midclock === clock) {
      return right;
    }
    let midindex = floor(clock / (midclock + mid.length - 1) * right);
    while (left <= right) {
      mid = structs[midindex];
      midclock = mid.id.clock;
      if (midclock <= clock) {
        if (clock < midclock + mid.length) {
          return midindex;
        }
        left = midindex + 1;
      } else {
        right = midindex - 1;
      }
      midindex = floor((left + right) / 2);
    }
    throw unexpectedCase();
  };
  var find = (store, id2) => {
    const structs = store.clients.get(id2.client);
    return structs[findIndexSS(structs, id2.clock)];
  };
  var getItem = (
    /** @type {function(StructStore,ID):Item} */
    find
  );
  var findIndexCleanStart = (transaction, structs, clock) => {
    const index = findIndexSS(structs, clock);
    const struct = structs[index];
    if (struct.id.clock < clock && struct instanceof Item) {
      structs.splice(index + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
      return index + 1;
    }
    return index;
  };
  var getItemCleanStart = (transaction, id2) => {
    const structs = (
      /** @type {Array<Item>} */
      transaction.doc.store.clients.get(id2.client)
    );
    return structs[findIndexCleanStart(transaction, structs, id2.clock)];
  };
  var getItemCleanEnd = (transaction, store, id2) => {
    const structs = store.clients.get(id2.client);
    const index = findIndexSS(structs, id2.clock);
    const struct = structs[index];
    if (id2.clock !== struct.id.clock + struct.length - 1 && struct.constructor !== GC) {
      structs.splice(index + 1, 0, splitItem(transaction, struct, id2.clock - struct.id.clock + 1));
    }
    return struct;
  };
  var replaceStruct = (store, struct, newStruct) => {
    const structs = (
      /** @type {Array<GC|Item>} */
      store.clients.get(struct.id.client)
    );
    structs[findIndexSS(structs, struct.id.clock)] = newStruct;
  };
  var iterateStructs = (transaction, structs, clockStart, len, f) => {
    if (len === 0) {
      return;
    }
    const clockEnd = clockStart + len;
    let index = findIndexCleanStart(transaction, structs, clockStart);
    let struct;
    do {
      struct = structs[index++];
      if (clockEnd < struct.id.clock + struct.length) {
        findIndexCleanStart(transaction, structs, clockEnd);
      }
      f(struct);
    } while (index < structs.length && structs[index].id.clock < clockEnd);
  };

  // ../../node_modules/lib0/pair.js
  var Pair = class {
    /**
     * @param {L} left
     * @param {R} right
     */
    constructor(left, right) {
      this.left = left;
      this.right = right;
    }
  };
  var create5 = (left, right) => new Pair(left, right);

  // ../../node_modules/lib0/dom.js
  var doc = (
    /** @type {Document} */
    typeof document !== "undefined" ? document : {}
  );
  var domParser = (
    /** @type {DOMParser} */
    typeof DOMParser !== "undefined" ? new DOMParser() : null
  );
  var mapToStyleString = (m) => map(m, (value, key) => `${key}:${value};`).join("");
  var ELEMENT_NODE = doc.ELEMENT_NODE;
  var TEXT_NODE = doc.TEXT_NODE;
  var CDATA_SECTION_NODE = doc.CDATA_SECTION_NODE;
  var COMMENT_NODE = doc.COMMENT_NODE;
  var DOCUMENT_NODE = doc.DOCUMENT_NODE;
  var DOCUMENT_TYPE_NODE = doc.DOCUMENT_TYPE_NODE;
  var DOCUMENT_FRAGMENT_NODE = doc.DOCUMENT_FRAGMENT_NODE;

  // ../../node_modules/lib0/symbol.js
  var create6 = Symbol;

  // ../../node_modules/lib0/logging.common.js
  var BOLD = create6();
  var UNBOLD = create6();
  var BLUE = create6();
  var GREY = create6();
  var GREEN = create6();
  var RED = create6();
  var PURPLE = create6();
  var ORANGE = create6();
  var UNCOLOR = create6();
  var computeNoColorLoggingArgs = (args2) => {
    if (args2.length === 1 && args2[0]?.constructor === Function) {
      args2 = /** @type {Array<string|Symbol|Object|number>} */
      /** @type {[function]} */
      args2[0]();
    }
    const strBuilder = [];
    const logArgs = [];
    let i = 0;
    for (; i < args2.length; i++) {
      const arg = args2[i];
      if (arg === void 0) {
        break;
      } else if (arg.constructor === String || arg.constructor === Number) {
        strBuilder.push(arg);
      } else if (arg.constructor === Object) {
        break;
      }
    }
    if (i > 0) {
      logArgs.push(strBuilder.join(""));
    }
    for (; i < args2.length; i++) {
      const arg = args2[i];
      if (!(arg instanceof Symbol)) {
        logArgs.push(arg);
      }
    }
    return logArgs;
  };
  var lastLoggingTime = getUnixTime();

  // ../../node_modules/lib0/logging.js
  var _browserStyleMap = {
    [BOLD]: create5("font-weight", "bold"),
    [UNBOLD]: create5("font-weight", "normal"),
    [BLUE]: create5("color", "blue"),
    [GREEN]: create5("color", "green"),
    [GREY]: create5("color", "grey"),
    [RED]: create5("color", "red"),
    [PURPLE]: create5("color", "purple"),
    [ORANGE]: create5("color", "orange"),
    // not well supported in chrome when debugging node with inspector - TODO: deprecate
    [UNCOLOR]: create5("color", "black")
  };
  var computeBrowserLoggingArgs = (args2) => {
    if (args2.length === 1 && args2[0]?.constructor === Function) {
      args2 = /** @type {Array<string|Symbol|Object|number>} */
      /** @type {[function]} */
      args2[0]();
    }
    const strBuilder = [];
    const styles = [];
    const currentStyle = create();
    let logArgs = [];
    let i = 0;
    for (; i < args2.length; i++) {
      const arg = args2[i];
      const style = _browserStyleMap[arg];
      if (style !== void 0) {
        currentStyle.set(style.left, style.right);
      } else {
        if (arg === void 0) {
          break;
        }
        if (arg.constructor === String || arg.constructor === Number) {
          const style2 = mapToStyleString(currentStyle);
          if (i > 0 || style2.length > 0) {
            strBuilder.push("%c" + arg);
            styles.push(style2);
          } else {
            strBuilder.push(arg);
          }
        } else {
          break;
        }
      }
    }
    if (i > 0) {
      logArgs = styles;
      logArgs.unshift(strBuilder.join(""));
    }
    for (; i < args2.length; i++) {
      const arg = args2[i];
      if (!(arg instanceof Symbol)) {
        logArgs.push(arg);
      }
    }
    return logArgs;
  };
  var computeLoggingArgs = supportsColor ? computeBrowserLoggingArgs : computeNoColorLoggingArgs;
  var print = (...args2) => {
    console.log(...computeLoggingArgs(args2));
    vconsoles.forEach((vc) => vc.print(args2));
  };
  var warn = (...args2) => {
    console.warn(...computeLoggingArgs(args2));
    args2.unshift(ORANGE);
    vconsoles.forEach((vc) => vc.print(args2));
  };
  var vconsoles = create2();

  // src/utils/Transaction.js
  var Transaction = class {
    /**
     * @param {Doc} doc
     * @param {any} origin
     * @param {boolean} local
     */
    constructor(doc3, origin, local) {
      this.doc = doc3;
      this.deleteSet = new DeleteSet();
      this.beforeState = getStateVector(doc3.store);
      this.afterState = /* @__PURE__ */ new Map();
      this.changed = /* @__PURE__ */ new Map();
      this.changedParentTypes = /* @__PURE__ */ new Map();
      this._mergeStructs = [];
      this.origin = origin;
      this.meta = /* @__PURE__ */ new Map();
      this.local = local;
      this.subdocsAdded = /* @__PURE__ */ new Set();
      this.subdocsRemoved = /* @__PURE__ */ new Set();
      this.subdocsLoaded = /* @__PURE__ */ new Set();
      this._needFormattingCleanup = false;
    }
  };
  var writeUpdateMessageFromTransaction = (encoder, transaction) => {
    if (transaction.deleteSet.clients.size === 0 && !any(transaction.afterState, (clock, client) => transaction.beforeState.get(client) !== clock)) {
      return false;
    }
    sortAndMergeDeleteSet(transaction.deleteSet);
    writeStructsFromTransaction(encoder, transaction);
    writeDeleteSet(encoder, transaction.deleteSet);
    return true;
  };
  var addChangedTypeToTransaction = (transaction, type, parentSub) => {
    const item = type._item;
    if (item === null || item.id.clock < (transaction.beforeState.get(item.id.client) || 0) && !item.deleted) {
      setIfUndefined(transaction.changed, type, create2).add(parentSub);
    }
  };
  var tryToMergeWithLefts = (structs, pos) => {
    let right = structs[pos];
    let left = structs[pos - 1];
    let i = pos;
    for (; i > 0; right = left, left = structs[--i - 1]) {
      if (left.deleted === right.deleted && left.constructor === right.constructor) {
        if (left.mergeWith(right)) {
          if (right instanceof Item && right.parentSub !== null && /** @type {AbstractType<any>} */
          right.parent._map.get(right.parentSub) === right) {
            right.parent._map.set(
              right.parentSub,
              /** @type {Item} */
              left
            );
          }
          continue;
        }
      }
      break;
    }
    const merged = pos - i;
    if (merged) {
      structs.splice(pos + 1 - merged, merged);
    }
    return merged;
  };
  var tryGcDeleteSet = (ds, store, gcFilter) => {
    for (const [client, deleteItems] of ds.clients.entries()) {
      const structs = (
        /** @type {Array<GC|Item>} */
        store.clients.get(client)
      );
      for (let di = deleteItems.length - 1; di >= 0; di--) {
        const deleteItem = deleteItems[di];
        const endDeleteItemClock = deleteItem.clock + deleteItem.len;
        for (let si = findIndexSS(structs, deleteItem.clock), struct = structs[si]; si < structs.length && struct.id.clock < endDeleteItemClock; struct = structs[++si]) {
          const struct2 = structs[si];
          if (deleteItem.clock + deleteItem.len <= struct2.id.clock) {
            break;
          }
          if (struct2 instanceof Item && struct2.deleted && !struct2.keep && gcFilter(struct2)) {
            struct2.gc(store, false);
          }
        }
      }
    }
  };
  var tryMergeDeleteSet = (ds, store) => {
    ds.clients.forEach((deleteItems, client) => {
      const structs = (
        /** @type {Array<GC|Item>} */
        store.clients.get(client)
      );
      for (let di = deleteItems.length - 1; di >= 0; di--) {
        const deleteItem = deleteItems[di];
        const mostRightIndexToCheck = min(structs.length - 1, 1 + findIndexSS(structs, deleteItem.clock + deleteItem.len - 1));
        for (let si = mostRightIndexToCheck, struct = structs[si]; si > 0 && struct.id.clock >= deleteItem.clock; struct = structs[si]) {
          si -= 1 + tryToMergeWithLefts(structs, si);
        }
      }
    });
  };
  var cleanupTransactions = (transactionCleanups, i) => {
    if (i < transactionCleanups.length) {
      const transaction = transactionCleanups[i];
      const doc3 = transaction.doc;
      const store = doc3.store;
      const ds = transaction.deleteSet;
      const mergeStructs = transaction._mergeStructs;
      try {
        sortAndMergeDeleteSet(ds);
        transaction.afterState = getStateVector(transaction.doc.store);
        doc3.emit("beforeObserverCalls", [transaction, doc3]);
        const fs = [];
        transaction.changed.forEach(
          (subs, itemtype) => fs.push(() => {
            if (itemtype._item === null || !itemtype._item.deleted) {
              itemtype._callObserver(transaction, subs);
            }
          })
        );
        fs.push(() => {
          transaction.changedParentTypes.forEach((events, type) => {
            if (type._dEH.l.length > 0 && (type._item === null || !type._item.deleted)) {
              events = events.filter(
                (event) => event.target._item === null || !event.target._item.deleted
              );
              events.forEach((event) => {
                event.currentTarget = type;
                event._path = null;
              });
              events.sort((event1, event2) => event1.path.length - event2.path.length);
              callEventHandlerListeners(type._dEH, events, transaction);
            }
          });
        });
        fs.push(() => doc3.emit("afterTransaction", [transaction, doc3]));
        callAll(fs, []);
        if (transaction._needFormattingCleanup) {
          cleanupYTextAfterTransaction(transaction);
        }
      } finally {
        if (doc3.gc) {
          tryGcDeleteSet(ds, store, doc3.gcFilter);
        }
        tryMergeDeleteSet(ds, store);
        transaction.afterState.forEach((clock, client) => {
          const beforeClock = transaction.beforeState.get(client) || 0;
          if (beforeClock !== clock) {
            const structs = (
              /** @type {Array<GC|Item>} */
              store.clients.get(client)
            );
            const firstChangePos = max(findIndexSS(structs, beforeClock), 1);
            for (let i2 = structs.length - 1; i2 >= firstChangePos; ) {
              i2 -= 1 + tryToMergeWithLefts(structs, i2);
            }
          }
        });
        for (let i2 = mergeStructs.length - 1; i2 >= 0; i2--) {
          const { client, clock } = mergeStructs[i2].id;
          const structs = (
            /** @type {Array<GC|Item>} */
            store.clients.get(client)
          );
          const replacedStructPos = findIndexSS(structs, clock);
          if (replacedStructPos + 1 < structs.length) {
            if (tryToMergeWithLefts(structs, replacedStructPos + 1) > 1) {
              continue;
            }
          }
          if (replacedStructPos > 0) {
            tryToMergeWithLefts(structs, replacedStructPos);
          }
        }
        if (!transaction.local && transaction.afterState.get(doc3.clientID) !== transaction.beforeState.get(doc3.clientID)) {
          print(ORANGE, BOLD, "[yjs] ", UNBOLD, RED, "Changed the client-id because another client seems to be using it.");
          doc3.clientID = generateNewClientId();
        }
        doc3.emit("afterTransactionCleanup", [transaction, doc3]);
        if (doc3._observers.has("update")) {
          const encoder = new UpdateEncoderV1();
          const hasContent2 = writeUpdateMessageFromTransaction(encoder, transaction);
          if (hasContent2) {
            doc3.emit("update", [encoder.toUint8Array(), transaction.origin, doc3, transaction]);
          }
        }
        if (doc3._observers.has("updateV2")) {
          const encoder = new UpdateEncoderV2();
          const hasContent2 = writeUpdateMessageFromTransaction(encoder, transaction);
          if (hasContent2) {
            doc3.emit("updateV2", [encoder.toUint8Array(), transaction.origin, doc3, transaction]);
          }
        }
        const { subdocsAdded, subdocsLoaded, subdocsRemoved } = transaction;
        if (subdocsAdded.size > 0 || subdocsRemoved.size > 0 || subdocsLoaded.size > 0) {
          subdocsAdded.forEach((subdoc) => {
            subdoc.clientID = doc3.clientID;
            if (subdoc.collectionid == null) {
              subdoc.collectionid = doc3.collectionid;
            }
            doc3.subdocs.add(subdoc);
          });
          subdocsRemoved.forEach((subdoc) => doc3.subdocs.delete(subdoc));
          doc3.emit("subdocs", [{ loaded: subdocsLoaded, added: subdocsAdded, removed: subdocsRemoved }, doc3, transaction]);
          subdocsRemoved.forEach((subdoc) => subdoc.destroy());
        }
        if (transactionCleanups.length <= i + 1) {
          doc3._transactionCleanups = [];
          doc3.emit("afterAllTransactions", [doc3, transactionCleanups]);
        } else {
          cleanupTransactions(transactionCleanups, i + 1);
        }
      }
    }
  };
  var transact = (doc3, f, origin = null, local = true) => {
    const transactionCleanups = doc3._transactionCleanups;
    let initialCall = false;
    let result = null;
    if (doc3._transaction === null) {
      initialCall = true;
      doc3._transaction = new Transaction(doc3, origin, local);
      transactionCleanups.push(doc3._transaction);
      if (transactionCleanups.length === 1) {
        doc3.emit("beforeAllTransactions", [doc3]);
      }
      doc3.emit("beforeTransaction", [doc3._transaction, doc3]);
    }
    try {
      result = f(doc3._transaction);
    } finally {
      if (initialCall) {
        const finishCleanup = doc3._transaction === transactionCleanups[0];
        doc3._transaction = null;
        if (finishCleanup) {
          cleanupTransactions(transactionCleanups, 0);
        }
      }
    }
    return result;
  };

  // src/utils/updates.js
  function* lazyStructReaderGenerator(decoder) {
    const numOfStateUpdates = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numOfStateUpdates; i++) {
      const numberOfStructs = readVarUint(decoder.restDecoder);
      const client = decoder.readClient();
      let clock = readVarUint(decoder.restDecoder);
      for (let i2 = 0; i2 < numberOfStructs; i2++) {
        const info = decoder.readInfo();
        if (info === 10) {
          const len = readVarUint(decoder.restDecoder);
          yield new Skip(createID(client, clock), len);
          clock += len;
        } else if ((BITS5 & info) !== 0) {
          const cantCopyParentInfo = (info & (BIT7 | BIT8)) === 0;
          const struct = new Item(
            createID(client, clock),
            null,
            // left
            (info & BIT8) === BIT8 ? decoder.readLeftID() : null,
            // origin
            null,
            // right
            (info & BIT7) === BIT7 ? decoder.readRightID() : null,
            // right origin
            // @ts-ignore Force writing a string here.
            cantCopyParentInfo ? decoder.readParentInfo() ? decoder.readString() : decoder.readLeftID() : null,
            // parent
            cantCopyParentInfo && (info & BIT6) === BIT6 ? decoder.readString() : null,
            // parentSub
            readItemContent(decoder, info)
            // item content
          );
          yield struct;
          clock += struct.length;
        } else {
          const len = decoder.readLen();
          yield new GC(createID(client, clock), len);
          clock += len;
        }
      }
    }
  }
  var LazyStructReader = class {
    /**
     * @param {UpdateDecoderV1 | UpdateDecoderV2} decoder
     * @param {boolean} filterSkips
     */
    constructor(decoder, filterSkips) {
      this.gen = lazyStructReaderGenerator(decoder);
      this.curr = null;
      this.done = false;
      this.filterSkips = filterSkips;
      this.next();
    }
    /**
     * @return {Item | GC | Skip |null}
     */
    next() {
      do {
        this.curr = this.gen.next().value || null;
      } while (this.filterSkips && this.curr !== null && this.curr.constructor === Skip);
      return this.curr;
    }
  };
  var LazyStructWriter = class {
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    constructor(encoder) {
      this.currClient = 0;
      this.startClock = 0;
      this.written = 0;
      this.encoder = encoder;
      this.clientStructs = [];
    }
  };
  var mergeUpdates = (updates) => mergeUpdatesV2(updates, UpdateDecoderV1, UpdateEncoderV1);
  var sliceStruct = (left, diff) => {
    if (left.constructor === GC) {
      const { client, clock } = left.id;
      return new GC(createID(client, clock + diff), left.length - diff);
    } else if (left.constructor === Skip) {
      const { client, clock } = left.id;
      return new Skip(createID(client, clock + diff), left.length - diff);
    } else {
      const leftItem = (
        /** @type {Item} */
        left
      );
      const { client, clock } = leftItem.id;
      return new Item(
        createID(client, clock + diff),
        null,
        createID(client, clock + diff - 1),
        null,
        leftItem.rightOrigin,
        leftItem.parent,
        leftItem.parentSub,
        leftItem.content.splice(diff)
      );
    }
  };
  var mergeUpdatesV2 = (updates, YDecoder = UpdateDecoderV2, YEncoder = UpdateEncoderV2) => {
    if (updates.length === 1) {
      return updates[0];
    }
    const updateDecoders = updates.map((update) => new YDecoder(createDecoder(update)));
    let lazyStructDecoders = updateDecoders.map((decoder) => new LazyStructReader(decoder, true));
    let currWrite = null;
    const updateEncoder = new YEncoder();
    const lazyStructEncoder = new LazyStructWriter(updateEncoder);
    while (true) {
      lazyStructDecoders = lazyStructDecoders.filter((dec) => dec.curr !== null);
      lazyStructDecoders.sort(
        /** @type {function(any,any):number} */
        (dec1, dec2) => {
          if (dec1.curr.id.client === dec2.curr.id.client) {
            const clockDiff = dec1.curr.id.clock - dec2.curr.id.clock;
            if (clockDiff === 0) {
              return dec1.curr.constructor === dec2.curr.constructor ? 0 : dec1.curr.constructor === Skip ? 1 : -1;
            } else {
              return clockDiff;
            }
          } else {
            return dec2.curr.id.client - dec1.curr.id.client;
          }
        }
      );
      if (lazyStructDecoders.length === 0) {
        break;
      }
      const currDecoder = lazyStructDecoders[0];
      const firstClient = (
        /** @type {Item | GC} */
        currDecoder.curr.id.client
      );
      if (currWrite !== null) {
        let curr = (
          /** @type {Item | GC | null} */
          currDecoder.curr
        );
        let iterated = false;
        while (curr !== null && curr.id.clock + curr.length <= currWrite.struct.id.clock + currWrite.struct.length && curr.id.client >= currWrite.struct.id.client) {
          curr = currDecoder.next();
          iterated = true;
        }
        if (curr === null || // current decoder is empty
        curr.id.client !== firstClient || // check whether there is another decoder that has has updates from `firstClient`
        iterated && curr.id.clock > currWrite.struct.id.clock + currWrite.struct.length) {
          continue;
        }
        if (firstClient !== currWrite.struct.id.client) {
          writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
          currWrite = { struct: curr, offset: 0 };
          currDecoder.next();
        } else {
          if (currWrite.struct.id.clock + currWrite.struct.length < curr.id.clock) {
            if (currWrite.struct.constructor === Skip) {
              currWrite.struct.length = curr.id.clock + curr.length - currWrite.struct.id.clock;
            } else {
              writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
              const diff = curr.id.clock - currWrite.struct.id.clock - currWrite.struct.length;
              const struct = new Skip(createID(firstClient, currWrite.struct.id.clock + currWrite.struct.length), diff);
              currWrite = { struct, offset: 0 };
            }
          } else {
            const diff = currWrite.struct.id.clock + currWrite.struct.length - curr.id.clock;
            if (diff > 0) {
              if (currWrite.struct.constructor === Skip) {
                currWrite.struct.length -= diff;
              } else {
                curr = sliceStruct(curr, diff);
              }
            }
            if (!currWrite.struct.mergeWith(
              /** @type {any} */
              curr
            )) {
              writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
              currWrite = { struct: curr, offset: 0 };
              currDecoder.next();
            }
          }
        }
      } else {
        currWrite = { struct: (
          /** @type {Item | GC} */
          currDecoder.curr
        ), offset: 0 };
        currDecoder.next();
      }
      for (let next = currDecoder.curr; next !== null && next.id.client === firstClient && next.id.clock === currWrite.struct.id.clock + currWrite.struct.length && next.constructor !== Skip; next = currDecoder.next()) {
        writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
        currWrite = { struct: next, offset: 0 };
      }
    }
    if (currWrite !== null) {
      writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
      currWrite = null;
    }
    finishLazyStructWriting(lazyStructEncoder);
    const dss = updateDecoders.map((decoder) => readDeleteSet(decoder));
    const ds = mergeDeleteSets(dss);
    writeDeleteSet(updateEncoder, ds);
    return updateEncoder.toUint8Array();
  };
  var diffUpdateV2 = (update, sv, YDecoder = UpdateDecoderV2, YEncoder = UpdateEncoderV2) => {
    const state = decodeStateVector(sv);
    const encoder = new YEncoder();
    const lazyStructWriter = new LazyStructWriter(encoder);
    const decoder = new YDecoder(createDecoder(update));
    const reader = new LazyStructReader(decoder, false);
    while (reader.curr) {
      const curr = reader.curr;
      const currClient = curr.id.client;
      const svClock = state.get(currClient) || 0;
      if (reader.curr.constructor === Skip) {
        reader.next();
        continue;
      }
      if (curr.id.clock + curr.length > svClock) {
        writeStructToLazyStructWriter(lazyStructWriter, curr, max(svClock - curr.id.clock, 0));
        reader.next();
        while (reader.curr && reader.curr.id.client === currClient) {
          writeStructToLazyStructWriter(lazyStructWriter, reader.curr, 0);
          reader.next();
        }
      } else {
        while (reader.curr && reader.curr.id.client === currClient && reader.curr.id.clock + reader.curr.length <= svClock) {
          reader.next();
        }
      }
    }
    finishLazyStructWriting(lazyStructWriter);
    const ds = readDeleteSet(decoder);
    writeDeleteSet(encoder, ds);
    return encoder.toUint8Array();
  };
  var flushLazyStructWriter = (lazyWriter) => {
    if (lazyWriter.written > 0) {
      lazyWriter.clientStructs.push({ written: lazyWriter.written, restEncoder: toUint8Array(lazyWriter.encoder.restEncoder) });
      lazyWriter.encoder.restEncoder = createEncoder();
      lazyWriter.written = 0;
    }
  };
  var writeStructToLazyStructWriter = (lazyWriter, struct, offset) => {
    if (lazyWriter.written > 0 && lazyWriter.currClient !== struct.id.client) {
      flushLazyStructWriter(lazyWriter);
    }
    if (lazyWriter.written === 0) {
      lazyWriter.currClient = struct.id.client;
      lazyWriter.encoder.writeClient(struct.id.client);
      writeVarUint(lazyWriter.encoder.restEncoder, struct.id.clock + offset);
    }
    struct.write(lazyWriter.encoder, offset);
    lazyWriter.written++;
  };
  var finishLazyStructWriting = (lazyWriter) => {
    flushLazyStructWriter(lazyWriter);
    const restEncoder = lazyWriter.encoder.restEncoder;
    writeVarUint(restEncoder, lazyWriter.clientStructs.length);
    for (let i = 0; i < lazyWriter.clientStructs.length; i++) {
      const partStructs = lazyWriter.clientStructs[i];
      writeVarUint(restEncoder, partStructs.written);
      writeUint8Array(restEncoder, partStructs.restEncoder);
    }
  };
  var convertUpdateFormat = (update, blockTransformer, YDecoder, YEncoder) => {
    const updateDecoder = new YDecoder(createDecoder(update));
    const lazyDecoder = new LazyStructReader(updateDecoder, false);
    const updateEncoder = new YEncoder();
    const lazyWriter = new LazyStructWriter(updateEncoder);
    for (let curr = lazyDecoder.curr; curr !== null; curr = lazyDecoder.next()) {
      writeStructToLazyStructWriter(lazyWriter, blockTransformer(curr), 0);
    }
    finishLazyStructWriting(lazyWriter);
    const ds = readDeleteSet(updateDecoder);
    writeDeleteSet(updateEncoder, ds);
    return updateEncoder.toUint8Array();
  };
  var convertUpdateFormatV2ToV1 = (update) => convertUpdateFormat(update, id, UpdateDecoderV2, UpdateEncoderV1);

  // src/utils/YEvent.js
  var errorComputeChanges = "You must not compute changes after the event-handler fired.";
  var YEvent = class {
    /**
     * @param {T} target The changed type.
     * @param {Transaction} transaction
     */
    constructor(target, transaction) {
      this.target = target;
      this.currentTarget = target;
      this.transaction = transaction;
      this._changes = null;
      this._keys = null;
      this._delta = null;
      this._path = null;
    }
    /**
     * Computes the path from `y` to the changed type.
     *
     * @todo v14 should standardize on path: Array<{parent, index}> because that is easier to work with.
     *
     * The following property holds:
     * @example
     *   let type = y
     *   event.path.forEach(dir => {
     *     type = type.get(dir)
     *   })
     *   type === event.target // => true
     */
    get path() {
      return this._path || (this._path = getPathTo(this.currentTarget, this.target));
    }
    /**
     * Check if a struct is deleted by this event.
     *
     * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
     *
     * @param {AbstractStruct} struct
     * @return {boolean}
     */
    deletes(struct) {
      return isDeleted(this.transaction.deleteSet, struct.id);
    }
    /**
     * @type {Map<string, { action: 'add' | 'update' | 'delete', oldValue: any, newValue: any }>}
     */
    get keys() {
      if (this._keys === null) {
        if (this.transaction.doc._transactionCleanups.length === 0) {
          throw create3(errorComputeChanges);
        }
        const keys2 = /* @__PURE__ */ new Map();
        const target = this.target;
        const changed = (
          /** @type Set<string|null> */
          this.transaction.changed.get(target)
        );
        changed.forEach((key) => {
          if (key !== null) {
            const item = (
              /** @type {Item} */
              target._map.get(key)
            );
            let action;
            let oldValue;
            if (this.adds(item)) {
              let prev = item.left;
              while (prev !== null && this.adds(prev)) {
                prev = prev.left;
              }
              if (this.deletes(item)) {
                if (prev !== null && this.deletes(prev)) {
                  action = "delete";
                  oldValue = last(prev.content.getContent());
                } else {
                  return;
                }
              } else {
                if (prev !== null && this.deletes(prev)) {
                  action = "update";
                  oldValue = last(prev.content.getContent());
                } else {
                  action = "add";
                  oldValue = void 0;
                }
              }
            } else {
              if (this.deletes(item)) {
                action = "delete";
                oldValue = last(
                  /** @type {Item} */
                  item.content.getContent()
                );
              } else {
                return;
              }
            }
            keys2.set(key, { action, oldValue });
          }
        });
        this._keys = keys2;
      }
      return this._keys;
    }
    /**
     * This is a computed property. Note that this can only be safely computed during the
     * event call. Computing this property after other changes happened might result in
     * unexpected behavior (incorrect computation of deltas). A safe way to collect changes
     * is to store the `changes` or the `delta` object. Avoid storing the `transaction` object.
     *
     * @type {Array<{insert?: string | Array<any> | object | AbstractType<any>, retain?: number, delete?: number, attributes?: Object<string, any>}>}
     */
    get delta() {
      return this.changes.delta;
    }
    /**
     * Check if a struct is added by this event.
     *
     * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
     *
     * @param {AbstractStruct} struct
     * @return {boolean}
     */
    adds(struct) {
      return struct.id.clock >= (this.transaction.beforeState.get(struct.id.client) || 0);
    }
    /**
     * This is a computed property. Note that this can only be safely computed during the
     * event call. Computing this property after other changes happened might result in
     * unexpected behavior (incorrect computation of deltas). A safe way to collect changes
     * is to store the `changes` or the `delta` object. Avoid storing the `transaction` object.
     *
     * @type {{added:Set<Item>,deleted:Set<Item>,keys:Map<string,{action:'add'|'update'|'delete',oldValue:any}>,delta:Array<{insert?:Array<any>|string, delete?:number, retain?:number}>}}
     */
    get changes() {
      let changes = this._changes;
      if (changes === null) {
        if (this.transaction.doc._transactionCleanups.length === 0) {
          throw create3(errorComputeChanges);
        }
        const target = this.target;
        const added = create2();
        const deleted = create2();
        const delta = [];
        changes = {
          added,
          deleted,
          delta,
          keys: this.keys
        };
        const changed = (
          /** @type Set<string|null> */
          this.transaction.changed.get(target)
        );
        if (changed.has(null)) {
          let lastOp = null;
          const packOp = () => {
            if (lastOp) {
              delta.push(lastOp);
            }
          };
          for (let item = target._start; item !== null; item = item.right) {
            if (item.deleted) {
              if (this.deletes(item) && !this.adds(item)) {
                if (lastOp === null || lastOp.delete === void 0) {
                  packOp();
                  lastOp = { delete: 0 };
                }
                lastOp.delete += item.length;
                deleted.add(item);
              }
            } else {
              if (this.adds(item)) {
                if (lastOp === null || lastOp.insert === void 0) {
                  packOp();
                  lastOp = { insert: [] };
                }
                lastOp.insert = lastOp.insert.concat(item.content.getContent());
                added.add(item);
              } else {
                if (lastOp === null || lastOp.retain === void 0) {
                  packOp();
                  lastOp = { retain: 0 };
                }
                lastOp.retain += item.length;
              }
            }
          }
          if (lastOp !== null && lastOp.retain === void 0) {
            packOp();
          }
        }
        this._changes = changes;
      }
      return (
        /** @type {any} */
        changes
      );
    }
  };
  var getPathTo = (parent, child) => {
    const path = [];
    while (child._item !== null && child !== parent) {
      if (child._item.parentSub !== null) {
        path.unshift(child._item.parentSub);
      } else {
        let i = 0;
        let c = (
          /** @type {AbstractType<any>} */
          child._item.parent._start
        );
        while (c !== child._item && c !== null) {
          if (!c.deleted && c.countable) {
            i += c.length;
          }
          c = c.right;
        }
        path.unshift(i);
      }
      child = /** @type {AbstractType<any>} */
      child._item.parent;
    }
    return path;
  };

  // ../../node_modules/lib0/iterator.js
  var createIterator = (next) => ({
    /**
     * @return {IterableIterator<T>}
     */
    [Symbol.iterator]() {
      return this;
    },
    // @ts-ignore
    next
  });
  var iteratorFilter = (iterator, filter) => createIterator(() => {
    let res;
    do {
      res = iterator.next();
    } while (!res.done && !filter(res.value));
    return res;
  });
  var iteratorMap = (iterator, fmap) => createIterator(() => {
    const { done, value } = iterator.next();
    return { done, value: done ? void 0 : fmap(value) };
  });

  // src/types/AbstractType.js
  var warnPrematureAccess = () => {
    warn("Invalid access: Add Yjs type to a document before reading data.");
  };
  var maxSearchMarker = 80;
  var globalSearchMarkerTimestamp = 0;
  var ArraySearchMarker = class {
    /**
     * @param {Item} p
     * @param {number} index
     */
    constructor(p, index) {
      p.marker = true;
      this.p = p;
      this.index = index;
      this.timestamp = globalSearchMarkerTimestamp++;
    }
  };
  var refreshMarkerTimestamp = (marker) => {
    marker.timestamp = globalSearchMarkerTimestamp++;
  };
  var overwriteMarker = (marker, p, index) => {
    marker.p.marker = false;
    marker.p = p;
    p.marker = true;
    marker.index = index;
    marker.timestamp = globalSearchMarkerTimestamp++;
  };
  var markPosition = (searchMarker, p, index) => {
    if (searchMarker.length >= maxSearchMarker) {
      const marker = searchMarker.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
      overwriteMarker(marker, p, index);
      return marker;
    } else {
      const pm = new ArraySearchMarker(p, index);
      searchMarker.push(pm);
      return pm;
    }
  };
  var findMarker = (yarray, index) => {
    if (yarray._start === null || index === 0 || yarray._searchMarker === null) {
      return null;
    }
    const marker = yarray._searchMarker.length === 0 ? null : yarray._searchMarker.reduce((a, b) => abs(index - a.index) < abs(index - b.index) ? a : b);
    let p = yarray._start;
    let pindex = 0;
    if (marker !== null) {
      p = marker.p;
      pindex = marker.index;
      refreshMarkerTimestamp(marker);
    }
    while (p.right !== null && pindex < index) {
      if (!p.deleted && p.countable) {
        if (index < pindex + p.length) {
          break;
        }
        pindex += p.length;
      }
      p = p.right;
    }
    while (p.left !== null && pindex > index) {
      p = p.left;
      if (!p.deleted && p.countable) {
        pindex -= p.length;
      }
    }
    while (p.left !== null && p.left.id.client === p.id.client && p.left.id.clock + p.left.length === p.id.clock) {
      p = p.left;
      if (!p.deleted && p.countable) {
        pindex -= p.length;
      }
    }
    if (marker !== null && abs(marker.index - pindex) < /** @type {YText|YArray<any>} */
    p.parent.length / maxSearchMarker) {
      overwriteMarker(marker, p, pindex);
      return marker;
    } else {
      return markPosition(yarray._searchMarker, p, pindex);
    }
  };
  var updateMarkerChanges = (searchMarker, index, len) => {
    for (let i = searchMarker.length - 1; i >= 0; i--) {
      const m = searchMarker[i];
      if (len > 0) {
        let p = m.p;
        p.marker = false;
        while (p && (p.deleted || !p.countable)) {
          p = p.left;
          if (p && !p.deleted && p.countable) {
            m.index -= p.length;
          }
        }
        if (p === null || p.marker === true) {
          searchMarker.splice(i, 1);
          continue;
        }
        m.p = p;
        p.marker = true;
      }
      if (index < m.index || len > 0 && index === m.index) {
        m.index = max(index, m.index + len);
      }
    }
  };
  var callTypeObservers = (type, transaction, event) => {
    const changedType = type;
    const changedParentTypes = transaction.changedParentTypes;
    while (true) {
      setIfUndefined(changedParentTypes, type, () => []).push(event);
      if (type._item === null) {
        break;
      }
      type = /** @type {AbstractType<any>} */
      type._item.parent;
    }
    callEventHandlerListeners(changedType._eH, event, transaction);
  };
  var AbstractType = class {
    constructor() {
      this._item = null;
      this._map = /* @__PURE__ */ new Map();
      this._start = null;
      this.doc = null;
      this._length = 0;
      this._eH = createEventHandler();
      this._dEH = createEventHandler();
      this._searchMarker = null;
    }
    /**
     * @return {AbstractType<any>|null}
     */
    get parent() {
      return this._item ? (
        /** @type {AbstractType<any>} */
        this._item.parent
      ) : null;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item|null} item
     */
    _integrate(y, item) {
      this.doc = y;
      this._item = item;
    }
    /**
     * @return {AbstractType<EventType>}
     */
    _copy() {
      throw methodUnimplemented();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {AbstractType<EventType>}
     */
    clone() {
      throw methodUnimplemented();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} _encoder
     */
    _write(_encoder) {
    }
    /**
     * The first non-deleted item
     */
    get _first() {
      let n = this._start;
      while (n !== null && n.deleted) {
        n = n.right;
      }
      return n;
    }
    /**
     * Creates YEvent and calls all type observers.
     * Must be implemented by each type.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} _parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, _parentSubs) {
      if (!transaction.local && this._searchMarker) {
        this._searchMarker.length = 0;
      }
    }
    /**
     * Observe all events that are created on this type.
     *
     * @param {function(EventType, Transaction):void} f Observer function
     */
    observe(f) {
      addEventHandlerListener(this._eH, f);
    }
    /**
     * Observe all events that are created by this type and its children.
     *
     * @param {function(Array<YEvent<any>>,Transaction):void} f Observer function
     */
    observeDeep(f) {
      addEventHandlerListener(this._dEH, f);
    }
    /**
     * Unregister an observer function.
     *
     * @param {function(EventType,Transaction):void} f Observer function
     */
    unobserve(f) {
      removeEventHandlerListener(this._eH, f);
    }
    /**
     * Unregister an observer function.
     *
     * @param {function(Array<YEvent<any>>,Transaction):void} f Observer function
     */
    unobserveDeep(f) {
      removeEventHandlerListener(this._dEH, f);
    }
    /**
     * @abstract
     * @return {any}
     */
    toJSON() {
    }
  };
  var typeListSlice = (type, start, end) => {
    type.doc ?? warnPrematureAccess();
    if (start < 0) {
      start = type._length + start;
    }
    if (end < 0) {
      end = type._length + end;
    }
    let len = end - start;
    const cs = [];
    let n = type._start;
    while (n !== null && len > 0) {
      if (n.countable && !n.deleted) {
        const c = n.content.getContent();
        if (c.length <= start) {
          start -= c.length;
        } else {
          for (let i = start; i < c.length && len > 0; i++) {
            cs.push(c[i]);
            len--;
          }
          start = 0;
        }
      }
      n = n.right;
    }
    return cs;
  };
  var typeListToArray = (type) => {
    type.doc ?? warnPrematureAccess();
    const cs = [];
    let n = type._start;
    while (n !== null) {
      if (n.countable && !n.deleted) {
        const c = n.content.getContent();
        for (let i = 0; i < c.length; i++) {
          cs.push(c[i]);
        }
      }
      n = n.right;
    }
    return cs;
  };
  var typeListForEach = (type, f) => {
    let index = 0;
    let n = type._start;
    type.doc ?? warnPrematureAccess();
    while (n !== null) {
      if (n.countable && !n.deleted) {
        const c = n.content.getContent();
        for (let i = 0; i < c.length; i++) {
          f(c[i], index++, type);
        }
      }
      n = n.right;
    }
  };
  var typeListMap = (type, f) => {
    const result = [];
    typeListForEach(type, (c, i) => {
      result.push(f(c, i, type));
    });
    return result;
  };
  var typeListCreateIterator = (type) => {
    let n = type._start;
    let currentContent = null;
    let currentContentIndex = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: () => {
        if (currentContent === null) {
          while (n !== null && n.deleted) {
            n = n.right;
          }
          if (n === null) {
            return {
              done: true,
              value: void 0
            };
          }
          currentContent = n.content.getContent();
          currentContentIndex = 0;
          n = n.right;
        }
        const value = currentContent[currentContentIndex++];
        if (currentContent.length <= currentContentIndex) {
          currentContent = null;
        }
        return {
          done: false,
          value
        };
      }
    };
  };
  var typeListGet = (type, index) => {
    type.doc ?? warnPrematureAccess();
    const marker = findMarker(type, index);
    let n = type._start;
    if (marker !== null) {
      n = marker.p;
      index -= marker.index;
    }
    for (; n !== null; n = n.right) {
      if (!n.deleted && n.countable) {
        if (index < n.length) {
          return n.content.getContent()[index];
        }
        index -= n.length;
      }
    }
  };
  var typeListInsertGenericsAfter = (transaction, parent, referenceItem, content) => {
    let left = referenceItem;
    const doc3 = transaction.doc;
    const ownClientId = doc3.clientID;
    const store = doc3.store;
    const right = referenceItem === null ? parent._start : referenceItem.right;
    let jsonContent = [];
    const packJsonContent = () => {
      if (jsonContent.length > 0) {
        left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentAny(jsonContent));
        left.integrate(transaction, 0);
        jsonContent = [];
      }
    };
    content.forEach((c) => {
      if (c === null) {
        jsonContent.push(c);
      } else {
        switch (c.constructor) {
          case Number:
          case Object:
          case Boolean:
          case Array:
          case String:
            jsonContent.push(c);
            break;
          default:
            packJsonContent();
            switch (c.constructor) {
              case Uint8Array:
              case ArrayBuffer:
                left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentBinary(new Uint8Array(
                  /** @type {Uint8Array} */
                  c
                )));
                left.integrate(transaction, 0);
                break;
              case Doc:
                left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentDoc(
                  /** @type {Doc} */
                  c
                ));
                left.integrate(transaction, 0);
                break;
              default:
                if (c instanceof AbstractType) {
                  left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentType(c));
                  left.integrate(transaction, 0);
                } else {
                  throw new Error("Unexpected content type in insert operation");
                }
            }
        }
      }
    });
    packJsonContent();
  };
  var lengthExceeded = () => create3("Length exceeded!");
  var typeListInsertGenerics = (transaction, parent, index, content) => {
    if (index > parent._length) {
      throw lengthExceeded();
    }
    if (index === 0) {
      if (parent._searchMarker) {
        updateMarkerChanges(parent._searchMarker, index, content.length);
      }
      return typeListInsertGenericsAfter(transaction, parent, null, content);
    }
    const startIndex = index;
    const marker = findMarker(parent, index);
    let n = parent._start;
    if (marker !== null) {
      n = marker.p;
      index -= marker.index;
      if (index === 0) {
        n = n.prev;
        index += n && n.countable && !n.deleted ? n.length : 0;
      }
    }
    for (; n !== null; n = n.right) {
      if (!n.deleted && n.countable) {
        if (index <= n.length) {
          if (index < n.length) {
            getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index));
          }
          break;
        }
        index -= n.length;
      }
    }
    if (parent._searchMarker) {
      updateMarkerChanges(parent._searchMarker, startIndex, content.length);
    }
    return typeListInsertGenericsAfter(transaction, parent, n, content);
  };
  var typeListPushGenerics = (transaction, parent, content) => {
    const marker = (parent._searchMarker || []).reduce((maxMarker, currMarker) => currMarker.index > maxMarker.index ? currMarker : maxMarker, { index: 0, p: parent._start });
    let n = marker.p;
    if (n) {
      while (n.right) {
        n = n.right;
      }
    }
    return typeListInsertGenericsAfter(transaction, parent, n, content);
  };
  var typeListDelete = (transaction, parent, index, length2) => {
    if (length2 === 0) {
      return;
    }
    const startIndex = index;
    const startLength = length2;
    const marker = findMarker(parent, index);
    let n = parent._start;
    if (marker !== null) {
      n = marker.p;
      index -= marker.index;
    }
    for (; n !== null && index > 0; n = n.right) {
      if (!n.deleted && n.countable) {
        if (index < n.length) {
          getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index));
        }
        index -= n.length;
      }
    }
    while (length2 > 0 && n !== null) {
      if (!n.deleted) {
        if (length2 < n.length) {
          getItemCleanStart(transaction, createID(n.id.client, n.id.clock + length2));
        }
        n.delete(transaction);
        length2 -= n.length;
      }
      n = n.right;
    }
    if (length2 > 0) {
      throw lengthExceeded();
    }
    if (parent._searchMarker) {
      updateMarkerChanges(
        parent._searchMarker,
        startIndex,
        -startLength + length2
        /* in case we remove the above exception */
      );
    }
  };
  var typeMapDelete = (transaction, parent, key) => {
    const c = parent._map.get(key);
    if (c !== void 0) {
      c.delete(transaction);
    }
  };
  var typeMapSet = (transaction, parent, key, value) => {
    const left = parent._map.get(key) || null;
    const doc3 = transaction.doc;
    const ownClientId = doc3.clientID;
    let content;
    if (value == null) {
      content = new ContentAny([value]);
    } else {
      switch (value.constructor) {
        case Number:
        case Object:
        case Boolean:
        case Array:
        case String:
          content = new ContentAny([value]);
          break;
        case Uint8Array:
          content = new ContentBinary(
            /** @type {Uint8Array} */
            value
          );
          break;
        case Doc:
          content = new ContentDoc(
            /** @type {Doc} */
            value
          );
          break;
        default:
          if (value instanceof AbstractType) {
            content = new ContentType(value);
          } else {
            throw new Error("Unexpected content type");
          }
      }
    }
    new Item(createID(ownClientId, getState(doc3.store, ownClientId)), left, left && left.lastId, null, null, parent, key, content).integrate(transaction, 0);
  };
  var typeMapGet = (parent, key) => {
    parent.doc ?? warnPrematureAccess();
    const val = parent._map.get(key);
    return val !== void 0 && !val.deleted ? val.content.getContent()[val.length - 1] : void 0;
  };
  var typeMapGetAll = (parent) => {
    const res = {};
    parent.doc ?? warnPrematureAccess();
    parent._map.forEach((value, key) => {
      if (!value.deleted) {
        res[key] = value.content.getContent()[value.length - 1];
      }
    });
    return res;
  };
  var typeMapHas = (parent, key) => {
    parent.doc ?? warnPrematureAccess();
    const val = parent._map.get(key);
    return val !== void 0 && !val.deleted;
  };
  var typeMapGetAllSnapshot = (parent, snapshot2) => {
    const res = {};
    parent._map.forEach((value, key) => {
      let v = value;
      while (v !== null && (!snapshot2.sv.has(v.id.client) || v.id.clock >= (snapshot2.sv.get(v.id.client) || 0))) {
        v = v.left;
      }
      if (v !== null && isVisible(v, snapshot2)) {
        res[key] = v.content.getContent()[v.length - 1];
      }
    });
    return res;
  };
  var createMapIterator = (type) => {
    type.doc ?? warnPrematureAccess();
    return iteratorFilter(
      type._map.entries(),
      /** @param {any} entry */
      (entry) => !entry[1].deleted
    );
  };

  // src/types/YArray.js
  var YArrayEvent = class extends YEvent {
  };
  var YArray = class _YArray extends AbstractType {
    constructor() {
      super();
      this._prelimContent = [];
      this._searchMarker = [];
    }
    /**
     * Construct a new YArray containing the specified items.
     * @template {Object<string,any>|Array<any>|number|null|string|Uint8Array} T
     * @param {Array<T>} items
     * @return {YArray<T>}
     */
    static from(items) {
      const a = new _YArray();
      a.push(items);
      return a;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      this.insert(
        0,
        /** @type {Array<any>} */
        this._prelimContent
      );
      this._prelimContent = null;
    }
    /**
     * @return {YArray<T>}
     */
    _copy() {
      return new _YArray();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YArray<T>}
     */
    clone() {
      const arr = new _YArray();
      arr.insert(0, this.toArray().map(
        (el) => el instanceof AbstractType ? (
          /** @type {typeof el} */
          el.clone()
        ) : el
      ));
      return arr;
    }
    get length() {
      this.doc ?? warnPrematureAccess();
      return this._length;
    }
    /**
     * Creates YArrayEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      super._callObserver(transaction, parentSubs);
      callTypeObservers(this, transaction, new YArrayEvent(this, transaction));
    }
    /**
     * Inserts new content at an index.
     *
     * Important: This function expects an array of content. Not just a content
     * object. The reason for this "weirdness" is that inserting several elements
     * is very efficient when it is done as a single operation.
     *
     * @example
     *  // Insert character 'a' at position 0
     *  yarray.insert(0, ['a'])
     *  // Insert numbers 1, 2 at position 1
     *  yarray.insert(1, [1, 2])
     *
     * @param {number} index The index to insert content at.
     * @param {Array<T>} content The array of content
     */
    insert(index, content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListInsertGenerics(
            transaction,
            this,
            index,
            /** @type {any} */
            content
          );
        });
      } else {
        this._prelimContent.splice(index, 0, ...content);
      }
    }
    /**
     * Appends content to this YArray.
     *
     * @param {Array<T>} content Array of content to append.
     *
     * @todo Use the following implementation in all types.
     */
    push(content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListPushGenerics(
            transaction,
            this,
            /** @type {any} */
            content
          );
        });
      } else {
        this._prelimContent.push(...content);
      }
    }
    /**
     * Prepends content to this YArray.
     *
     * @param {Array<T>} content Array of content to prepend.
     */
    unshift(content) {
      this.insert(0, content);
    }
    /**
     * Deletes elements starting from an index.
     *
     * @param {number} index Index at which to start deleting elements
     * @param {number} length The number of elements to remove. Defaults to 1.
     */
    delete(index, length2 = 1) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListDelete(transaction, this, index, length2);
        });
      } else {
        this._prelimContent.splice(index, length2);
      }
    }
    /**
     * Returns the i-th element from a YArray.
     *
     * @param {number} index The index of the element to return from the YArray
     * @return {T}
     */
    get(index) {
      return typeListGet(this, index);
    }
    /**
     * Transforms this YArray to a JavaScript Array.
     *
     * @return {Array<T>}
     */
    toArray() {
      return typeListToArray(this);
    }
    /**
     * Returns a portion of this YArray into a JavaScript Array selected
     * from start to end (end not included).
     *
     * @param {number} [start]
     * @param {number} [end]
     * @return {Array<T>}
     */
    slice(start = 0, end = this.length) {
      return typeListSlice(this, start, end);
    }
    /**
     * Transforms this Shared Type to a JSON object.
     *
     * @return {Array<any>}
     */
    toJSON() {
      return this.map((c) => c instanceof AbstractType ? c.toJSON() : c);
    }
    /**
     * Returns an Array with the result of calling a provided function on every
     * element of this YArray.
     *
     * @template M
     * @param {function(T,number,YArray<T>):M} f Function that produces an element of the new Array
     * @return {Array<M>} A new array with each element being the result of the
     *                 callback function
     */
    map(f) {
      return typeListMap(
        this,
        /** @type {any} */
        f
      );
    }
    /**
     * Executes a provided function once on every element of this YArray.
     *
     * @param {function(T,number,YArray<T>):void} f A function to execute on every element of this YArray.
     */
    forEach(f) {
      typeListForEach(this, f);
    }
    /**
     * @return {IterableIterator<T>}
     */
    [Symbol.iterator]() {
      return typeListCreateIterator(this);
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YArrayRefID);
    }
  };
  var readYArray = (_decoder) => new YArray();

  // src/types/YMap.js
  var YMapEvent = class extends YEvent {
    /**
     * @param {YMap<T>} ymap The YArray that changed.
     * @param {Transaction} transaction
     * @param {Set<any>} subs The keys that changed.
     */
    constructor(ymap, transaction, subs) {
      super(ymap, transaction);
      this.keysChanged = subs;
    }
  };
  var YMap = class _YMap extends AbstractType {
    /**
     *
     * @param {Iterable<readonly [string, any]>=} entries - an optional iterable to initialize the YMap
     */
    constructor(entries) {
      super();
      this._prelimContent = null;
      if (entries === void 0) {
        this._prelimContent = /* @__PURE__ */ new Map();
      } else {
        this._prelimContent = new Map(entries);
      }
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      this._prelimContent.forEach((value, key) => {
        this.set(key, value);
      });
      this._prelimContent = null;
    }
    /**
     * @return {YMap<MapType>}
     */
    _copy() {
      return new _YMap();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YMap<MapType>}
     */
    clone() {
      const map2 = new _YMap();
      this.forEach((value, key) => {
        map2.set(key, value instanceof AbstractType ? (
          /** @type {typeof value} */
          value.clone()
        ) : value);
      });
      return map2;
    }
    /**
     * Creates YMapEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      callTypeObservers(this, transaction, new YMapEvent(this, transaction, parentSubs));
    }
    /**
     * Transforms this Shared Type to a JSON object.
     *
     * @return {Object<string,any>}
     */
    toJSON() {
      this.doc ?? warnPrematureAccess();
      const map2 = {};
      this._map.forEach((item, key) => {
        if (!item.deleted) {
          const v = item.content.getContent()[item.length - 1];
          map2[key] = v instanceof AbstractType ? v.toJSON() : v;
        }
      });
      return map2;
    }
    /**
     * Returns the size of the YMap (count of key/value pairs)
     *
     * @return {number}
     */
    get size() {
      return [...createMapIterator(this)].length;
    }
    /**
     * Returns the keys for each element in the YMap Type.
     *
     * @return {IterableIterator<string>}
     */
    keys() {
      return iteratorMap(
        createMapIterator(this),
        /** @param {any} v */
        (v) => v[0]
      );
    }
    /**
     * Returns the values for each element in the YMap Type.
     *
     * @return {IterableIterator<MapType>}
     */
    values() {
      return iteratorMap(
        createMapIterator(this),
        /** @param {any} v */
        (v) => v[1].content.getContent()[v[1].length - 1]
      );
    }
    /**
     * Returns an Iterator of [key, value] pairs
     *
     * @return {IterableIterator<[string, MapType]>}
     */
    entries() {
      return iteratorMap(
        createMapIterator(this),
        /** @param {any} v */
        (v) => (
          /** @type {any} */
          [v[0], v[1].content.getContent()[v[1].length - 1]]
        )
      );
    }
    /**
     * Executes a provided function on once on every key-value pair.
     *
     * @param {function(MapType,string,YMap<MapType>):void} f A function to execute on every element of this YArray.
     */
    forEach(f) {
      this.doc ?? warnPrematureAccess();
      this._map.forEach((item, key) => {
        if (!item.deleted) {
          f(item.content.getContent()[item.length - 1], key, this);
        }
      });
    }
    /**
     * Returns an Iterator of [key, value] pairs
     *
     * @return {IterableIterator<[string, MapType]>}
     */
    [Symbol.iterator]() {
      return this.entries();
    }
    /**
     * Remove a specified element from this YMap.
     *
     * @param {string} key The key of the element to remove.
     */
    delete(key) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapDelete(transaction, this, key);
        });
      } else {
        this._prelimContent.delete(key);
      }
    }
    /**
     * Adds or updates an element with a specified key and value.
     * @template {MapType} VAL
     *
     * @param {string} key The key of the element to add to this YMap
     * @param {VAL} value The value of the element to add
     * @return {VAL}
     */
    set(key, value) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapSet(
            transaction,
            this,
            key,
            /** @type {any} */
            value
          );
        });
      } else {
        this._prelimContent.set(key, value);
      }
      return value;
    }
    /**
     * Returns a specified element from this YMap.
     *
     * @param {string} key
     * @return {MapType|undefined}
     */
    get(key) {
      return (
        /** @type {any} */
        typeMapGet(this, key)
      );
    }
    /**
     * Returns a boolean indicating whether the specified key exists or not.
     *
     * @param {string} key The key to test.
     * @return {boolean}
     */
    has(key) {
      return typeMapHas(this, key);
    }
    /**
     * Removes all elements from this YMap.
     */
    clear() {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          this.forEach(function(_value, key, map2) {
            typeMapDelete(transaction, map2, key);
          });
        });
      } else {
        this._prelimContent.clear();
      }
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YMapRefID);
    }
  };
  var readYMap = (_decoder) => new YMap();

  // src/types/YText.js
  var equalAttrs = (a, b) => a === b || typeof a === "object" && typeof b === "object" && a && b && equalFlat(a, b);
  var ItemTextListPosition = class {
    /**
     * @param {Item|null} left
     * @param {Item|null} right
     * @param {number} index
     * @param {Map<string,any>} currentAttributes
     */
    constructor(left, right, index, currentAttributes) {
      this.left = left;
      this.right = right;
      this.index = index;
      this.currentAttributes = currentAttributes;
    }
    /**
     * Only call this if you know that this.right is defined
     */
    forward() {
      if (this.right === null) {
        unexpectedCase();
      }
      switch (this.right.content.constructor) {
        case ContentFormat:
          if (!this.right.deleted) {
            updateCurrentAttributes(
              this.currentAttributes,
              /** @type {ContentFormat} */
              this.right.content
            );
          }
          break;
        default:
          if (!this.right.deleted) {
            this.index += this.right.length;
          }
          break;
      }
      this.left = this.right;
      this.right = this.right.right;
    }
  };
  var findNextPosition = (transaction, pos, count) => {
    while (pos.right !== null && count > 0) {
      switch (pos.right.content.constructor) {
        case ContentFormat:
          if (!pos.right.deleted) {
            updateCurrentAttributes(
              pos.currentAttributes,
              /** @type {ContentFormat} */
              pos.right.content
            );
          }
          break;
        default:
          if (!pos.right.deleted) {
            if (count < pos.right.length) {
              getItemCleanStart(transaction, createID(pos.right.id.client, pos.right.id.clock + count));
            }
            pos.index += pos.right.length;
            count -= pos.right.length;
          }
          break;
      }
      pos.left = pos.right;
      pos.right = pos.right.right;
    }
    return pos;
  };
  var findPosition = (transaction, parent, index, useSearchMarker) => {
    const currentAttributes = /* @__PURE__ */ new Map();
    const marker = useSearchMarker ? findMarker(parent, index) : null;
    if (marker) {
      const pos = new ItemTextListPosition(marker.p.left, marker.p, marker.index, currentAttributes);
      return findNextPosition(transaction, pos, index - marker.index);
    } else {
      const pos = new ItemTextListPosition(null, parent._start, 0, currentAttributes);
      return findNextPosition(transaction, pos, index);
    }
  };
  var insertNegatedAttributes = (transaction, parent, currPos, negatedAttributes) => {
    while (currPos.right !== null && (currPos.right.deleted === true || currPos.right.content.constructor === ContentFormat && equalAttrs(
      negatedAttributes.get(
        /** @type {ContentFormat} */
        currPos.right.content.key
      ),
      /** @type {ContentFormat} */
      currPos.right.content.value
    ))) {
      if (!currPos.right.deleted) {
        negatedAttributes.delete(
          /** @type {ContentFormat} */
          currPos.right.content.key
        );
      }
      currPos.forward();
    }
    const doc3 = transaction.doc;
    const ownClientId = doc3.clientID;
    negatedAttributes.forEach((val, key) => {
      const left = currPos.left;
      const right = currPos.right;
      const nextFormat = new Item(createID(ownClientId, getState(doc3.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
      nextFormat.integrate(transaction, 0);
      currPos.right = nextFormat;
      currPos.forward();
    });
  };
  var updateCurrentAttributes = (currentAttributes, format) => {
    const { key, value } = format;
    if (value === null) {
      currentAttributes.delete(key);
    } else {
      currentAttributes.set(key, value);
    }
  };
  var minimizeAttributeChanges = (currPos, attributes) => {
    while (true) {
      if (currPos.right === null) {
        break;
      } else if (currPos.right.deleted || currPos.right.content.constructor === ContentFormat && equalAttrs(
        attributes[
          /** @type {ContentFormat} */
          currPos.right.content.key
        ] ?? null,
        /** @type {ContentFormat} */
        currPos.right.content.value
      )) {
      } else {
        break;
      }
      currPos.forward();
    }
  };
  var insertAttributes = (transaction, parent, currPos, attributes) => {
    const doc3 = transaction.doc;
    const ownClientId = doc3.clientID;
    const negatedAttributes = /* @__PURE__ */ new Map();
    for (const key in attributes) {
      const val = attributes[key];
      const currentVal = currPos.currentAttributes.get(key) ?? null;
      if (!equalAttrs(currentVal, val)) {
        negatedAttributes.set(key, currentVal);
        const { left, right } = currPos;
        currPos.right = new Item(createID(ownClientId, getState(doc3.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
        currPos.right.integrate(transaction, 0);
        currPos.forward();
      }
    }
    return negatedAttributes;
  };
  var insertText2 = (transaction, parent, currPos, text2, attributes) => {
    currPos.currentAttributes.forEach((_val, key) => {
      if (attributes[key] === void 0) {
        attributes[key] = null;
      }
    });
    const doc3 = transaction.doc;
    const ownClientId = doc3.clientID;
    minimizeAttributeChanges(currPos, attributes);
    const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
    const content = text2.constructor === String ? new ContentString(
      /** @type {string} */
      text2
    ) : text2 instanceof AbstractType ? new ContentType(text2) : new ContentEmbed(text2);
    let { left, right, index } = currPos;
    if (parent._searchMarker) {
      updateMarkerChanges(parent._searchMarker, currPos.index, content.getLength());
    }
    right = new Item(createID(ownClientId, getState(doc3.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, content);
    right.integrate(transaction, 0);
    currPos.right = right;
    currPos.index = index;
    currPos.forward();
    insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
  };
  var formatText = (transaction, parent, currPos, length2, attributes) => {
    const doc3 = transaction.doc;
    const ownClientId = doc3.clientID;
    minimizeAttributeChanges(currPos, attributes);
    const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
    iterationLoop: while (currPos.right !== null && (length2 > 0 || negatedAttributes.size > 0 && (currPos.right.deleted || currPos.right.content.constructor === ContentFormat))) {
      if (!currPos.right.deleted) {
        switch (currPos.right.content.constructor) {
          case ContentFormat: {
            const { key, value } = (
              /** @type {ContentFormat} */
              currPos.right.content
            );
            const attr = attributes[key];
            if (attr !== void 0) {
              if (equalAttrs(attr, value)) {
                negatedAttributes.delete(key);
              } else {
                if (length2 === 0) {
                  break iterationLoop;
                }
                negatedAttributes.set(key, value);
              }
              currPos.right.delete(transaction);
            } else {
              currPos.currentAttributes.set(key, value);
            }
            break;
          }
          default:
            if (length2 < currPos.right.length) {
              getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length2));
            }
            length2 -= currPos.right.length;
            break;
        }
      }
      currPos.forward();
    }
    if (length2 > 0) {
      let newlines = "";
      for (; length2 > 0; length2--) {
        newlines += "\n";
      }
      currPos.right = new Item(createID(ownClientId, getState(doc3.store, ownClientId)), currPos.left, currPos.left && currPos.left.lastId, currPos.right, currPos.right && currPos.right.id, parent, null, new ContentString(newlines));
      currPos.right.integrate(transaction, 0);
      currPos.forward();
    }
    insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
  };
  var cleanupFormattingGap = (transaction, start, curr, startAttributes, currAttributes) => {
    let end = start;
    const endFormats = create();
    while (end && (!end.countable || end.deleted)) {
      if (!end.deleted && end.content.constructor === ContentFormat) {
        const cf = (
          /** @type {ContentFormat} */
          end.content
        );
        endFormats.set(cf.key, cf);
      }
      end = end.right;
    }
    let cleanups = 0;
    let reachedCurr = false;
    while (start !== end) {
      if (curr === start) {
        reachedCurr = true;
      }
      if (!start.deleted) {
        const content = start.content;
        switch (content.constructor) {
          case ContentFormat: {
            const { key, value } = (
              /** @type {ContentFormat} */
              content
            );
            const startAttrValue = startAttributes.get(key) ?? null;
            if (endFormats.get(key) !== content || startAttrValue === value) {
              start.delete(transaction);
              cleanups++;
              if (!reachedCurr && (currAttributes.get(key) ?? null) === value && startAttrValue !== value) {
                if (startAttrValue === null) {
                  currAttributes.delete(key);
                } else {
                  currAttributes.set(key, startAttrValue);
                }
              }
            }
            if (!reachedCurr && !start.deleted) {
              updateCurrentAttributes(
                currAttributes,
                /** @type {ContentFormat} */
                content
              );
            }
            break;
          }
        }
      }
      start = /** @type {Item} */
      start.right;
    }
    return cleanups;
  };
  var cleanupContextlessFormattingGap = (transaction, item) => {
    while (item && item.right && (item.right.deleted || !item.right.countable)) {
      item = item.right;
    }
    const attrs = /* @__PURE__ */ new Set();
    while (item && (item.deleted || !item.countable)) {
      if (!item.deleted && item.content.constructor === ContentFormat) {
        const key = (
          /** @type {ContentFormat} */
          item.content.key
        );
        if (attrs.has(key)) {
          item.delete(transaction);
        } else {
          attrs.add(key);
        }
      }
      item = item.left;
    }
  };
  var cleanupYTextFormatting = (type) => {
    let res = 0;
    transact(
      /** @type {Doc} */
      type.doc,
      (transaction) => {
        let start = (
          /** @type {Item} */
          type._start
        );
        let end = type._start;
        let startAttributes = create();
        const currentAttributes = copy(startAttributes);
        while (end) {
          if (end.deleted === false) {
            switch (end.content.constructor) {
              case ContentFormat:
                updateCurrentAttributes(
                  currentAttributes,
                  /** @type {ContentFormat} */
                  end.content
                );
                break;
              default:
                res += cleanupFormattingGap(transaction, start, end, startAttributes, currentAttributes);
                startAttributes = copy(currentAttributes);
                start = end;
                break;
            }
          }
          end = end.right;
        }
      }
    );
    return res;
  };
  var cleanupYTextAfterTransaction = (transaction) => {
    const needFullCleanup = /* @__PURE__ */ new Set();
    const doc3 = transaction.doc;
    for (const [client, afterClock] of transaction.afterState.entries()) {
      const clock = transaction.beforeState.get(client) || 0;
      if (afterClock === clock) {
        continue;
      }
      iterateStructs(
        transaction,
        /** @type {Array<Item|GC>} */
        doc3.store.clients.get(client),
        clock,
        afterClock,
        (item) => {
          if (!item.deleted && /** @type {Item} */
          item.content.constructor === ContentFormat && item.constructor !== GC) {
            needFullCleanup.add(
              /** @type {any} */
              item.parent
            );
          }
        }
      );
    }
    transact(doc3, (t) => {
      iterateDeletedStructs(transaction, transaction.deleteSet, (item) => {
        if (item instanceof GC || !/** @type {YText} */
        item.parent._hasFormatting || needFullCleanup.has(
          /** @type {YText} */
          item.parent
        )) {
          return;
        }
        const parent = (
          /** @type {YText} */
          item.parent
        );
        if (item.content.constructor === ContentFormat) {
          needFullCleanup.add(parent);
        } else {
          cleanupContextlessFormattingGap(t, item);
        }
      });
      for (const yText of needFullCleanup) {
        cleanupYTextFormatting(yText);
      }
    });
  };
  var deleteText = (transaction, currPos, length2) => {
    const startLength = length2;
    const startAttrs = copy(currPos.currentAttributes);
    const start = currPos.right;
    while (length2 > 0 && currPos.right !== null) {
      if (currPos.right.deleted === false) {
        switch (currPos.right.content.constructor) {
          case ContentType:
          case ContentEmbed:
          case ContentString:
            if (length2 < currPos.right.length) {
              getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length2));
            }
            length2 -= currPos.right.length;
            currPos.right.delete(transaction);
            break;
        }
      }
      currPos.forward();
    }
    if (start) {
      cleanupFormattingGap(transaction, start, currPos.right, startAttrs, currPos.currentAttributes);
    }
    const parent = (
      /** @type {AbstractType<any>} */
      /** @type {Item} */
      (currPos.left || currPos.right).parent
    );
    if (parent._searchMarker) {
      updateMarkerChanges(parent._searchMarker, currPos.index, -startLength + length2);
    }
    return currPos;
  };
  var YTextEvent = class extends YEvent {
    /**
     * @param {YText} ytext
     * @param {Transaction} transaction
     * @param {Set<any>} subs The keys that changed
     */
    constructor(ytext, transaction, subs) {
      super(ytext, transaction);
      this.childListChanged = false;
      this.keysChanged = /* @__PURE__ */ new Set();
      subs.forEach((sub) => {
        if (sub === null) {
          this.childListChanged = true;
        } else {
          this.keysChanged.add(sub);
        }
      });
    }
    /**
     * @type {{added:Set<Item>,deleted:Set<Item>,keys:Map<string,{action:'add'|'update'|'delete',oldValue:any}>,delta:Array<{insert?:Array<any>|string, delete?:number, retain?:number}>}}
     */
    get changes() {
      if (this._changes === null) {
        const changes = {
          keys: this.keys,
          delta: this.delta,
          added: /* @__PURE__ */ new Set(),
          deleted: /* @__PURE__ */ new Set()
        };
        this._changes = changes;
      }
      return (
        /** @type {any} */
        this._changes
      );
    }
    /**
     * Compute the changes in the delta format.
     * A {@link https://quilljs.com/docs/delta/|Quill Delta}) that represents the changes on the document.
     *
     * @type {Array<{insert?:string|object|AbstractType<any>, delete?:number, retain?:number, attributes?: Object<string,any>}>}
     *
     * @public
     */
    get delta() {
      if (this._delta === null) {
        const y = (
          /** @type {Doc} */
          this.target.doc
        );
        const delta = [];
        transact(y, (transaction) => {
          const currentAttributes = /* @__PURE__ */ new Map();
          const oldAttributes = /* @__PURE__ */ new Map();
          let item = this.target._start;
          let action = null;
          const attributes = {};
          let insert2 = "";
          let retain = 0;
          let deleteLen = 0;
          const addOp = () => {
            if (action !== null) {
              let op = null;
              switch (action) {
                case "delete":
                  if (deleteLen > 0) {
                    op = { delete: deleteLen };
                  }
                  deleteLen = 0;
                  break;
                case "insert":
                  if (typeof insert2 === "object" || insert2.length > 0) {
                    op = { insert: insert2 };
                    if (currentAttributes.size > 0) {
                      op.attributes = {};
                      currentAttributes.forEach((value, key) => {
                        if (value !== null) {
                          op.attributes[key] = value;
                        }
                      });
                    }
                  }
                  insert2 = "";
                  break;
                case "retain":
                  if (retain > 0) {
                    op = { retain };
                    if (!isEmpty(attributes)) {
                      op.attributes = assign({}, attributes);
                    }
                  }
                  retain = 0;
                  break;
              }
              if (op) delta.push(op);
              action = null;
            }
          };
          while (item !== null) {
            switch (item.content.constructor) {
              case ContentType:
              case ContentEmbed:
                if (this.adds(item)) {
                  if (!this.deletes(item)) {
                    addOp();
                    action = "insert";
                    insert2 = item.content.getContent()[0];
                    addOp();
                  }
                } else if (this.deletes(item)) {
                  if (action !== "delete") {
                    addOp();
                    action = "delete";
                  }
                  deleteLen += 1;
                } else if (!item.deleted) {
                  if (action !== "retain") {
                    addOp();
                    action = "retain";
                  }
                  retain += 1;
                }
                break;
              case ContentString:
                if (this.adds(item)) {
                  if (!this.deletes(item)) {
                    if (action !== "insert") {
                      addOp();
                      action = "insert";
                    }
                    insert2 += /** @type {ContentString} */
                    item.content.str;
                  }
                } else if (this.deletes(item)) {
                  if (action !== "delete") {
                    addOp();
                    action = "delete";
                  }
                  deleteLen += item.length;
                } else if (!item.deleted) {
                  if (action !== "retain") {
                    addOp();
                    action = "retain";
                  }
                  retain += item.length;
                }
                break;
              case ContentFormat: {
                const { key, value } = (
                  /** @type {ContentFormat} */
                  item.content
                );
                if (this.adds(item)) {
                  if (!this.deletes(item)) {
                    const curVal = currentAttributes.get(key) ?? null;
                    if (!equalAttrs(curVal, value)) {
                      if (action === "retain") {
                        addOp();
                      }
                      if (equalAttrs(value, oldAttributes.get(key) ?? null)) {
                        delete attributes[key];
                      } else {
                        attributes[key] = value;
                      }
                    } else if (value !== null) {
                      item.delete(transaction);
                    }
                  }
                } else if (this.deletes(item)) {
                  oldAttributes.set(key, value);
                  const curVal = currentAttributes.get(key) ?? null;
                  if (!equalAttrs(curVal, value)) {
                    if (action === "retain") {
                      addOp();
                    }
                    attributes[key] = curVal;
                  }
                } else if (!item.deleted) {
                  oldAttributes.set(key, value);
                  const attr = attributes[key];
                  if (attr !== void 0) {
                    if (!equalAttrs(attr, value)) {
                      if (action === "retain") {
                        addOp();
                      }
                      if (value === null) {
                        delete attributes[key];
                      } else {
                        attributes[key] = value;
                      }
                    } else if (attr !== null) {
                      item.delete(transaction);
                    }
                  }
                }
                if (!item.deleted) {
                  if (action === "insert") {
                    addOp();
                  }
                  updateCurrentAttributes(
                    currentAttributes,
                    /** @type {ContentFormat} */
                    item.content
                  );
                }
                break;
              }
            }
            item = item.right;
          }
          addOp();
          while (delta.length > 0) {
            const lastOp = delta[delta.length - 1];
            if (lastOp.retain !== void 0 && lastOp.attributes === void 0) {
              delta.pop();
            } else {
              break;
            }
          }
        });
        this._delta = delta;
      }
      return (
        /** @type {any} */
        this._delta
      );
    }
  };
  var YText = class _YText extends AbstractType {
    /**
     * @param {String} [string] The initial value of the YText.
     */
    constructor(string) {
      super();
      this._pending = string !== void 0 ? [() => this.insert(0, string)] : [];
      this._searchMarker = [];
      this._hasFormatting = false;
    }
    /**
     * Number of characters of this text type.
     *
     * @type {number}
     */
    get length() {
      this.doc ?? warnPrematureAccess();
      return this._length;
    }
    /**
     * @param {Doc} y
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      try {
        this._pending.forEach((f) => f());
      } catch (e) {
        console.error(e);
      }
      this._pending = null;
    }
    _copy() {
      return new _YText();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YText}
     */
    clone() {
      const text2 = new _YText();
      text2.applyDelta(this.toDelta());
      return text2;
    }
    /**
     * Creates YTextEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      super._callObserver(transaction, parentSubs);
      const event = new YTextEvent(this, transaction, parentSubs);
      callTypeObservers(this, transaction, event);
      if (!transaction.local && this._hasFormatting) {
        transaction._needFormattingCleanup = true;
      }
    }
    /**
     * Returns the unformatted string representation of this YText type.
     *
     * @public
     */
    toString() {
      this.doc ?? warnPrematureAccess();
      let str = "";
      let n = this._start;
      while (n !== null) {
        if (!n.deleted && n.countable && n.content.constructor === ContentString) {
          str += /** @type {ContentString} */
          n.content.str;
        }
        n = n.right;
      }
      return str;
    }
    /**
     * Returns the unformatted string representation of this YText type.
     *
     * @return {string}
     * @public
     */
    toJSON() {
      return this.toString();
    }
    /**
     * Apply a {@link Delta} on this shared YText type.
     *
     * @param {any} delta The changes to apply on this element.
     * @param {object}  opts
     * @param {boolean} [opts.sanitize] Sanitize input delta. Removes ending newlines if set to true.
     *
     *
     * @public
     */
    applyDelta(delta, { sanitize = true } = {}) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          const currPos = new ItemTextListPosition(null, this._start, 0, /* @__PURE__ */ new Map());
          for (let i = 0; i < delta.length; i++) {
            const op = delta[i];
            if (op.insert !== void 0) {
              const ins = !sanitize && typeof op.insert === "string" && i === delta.length - 1 && currPos.right === null && op.insert.slice(-1) === "\n" ? op.insert.slice(0, -1) : op.insert;
              if (typeof ins !== "string" || ins.length > 0) {
                insertText2(transaction, this, currPos, ins, op.attributes || {});
              }
            } else if (op.retain !== void 0) {
              formatText(transaction, this, currPos, op.retain, op.attributes || {});
            } else if (op.delete !== void 0) {
              deleteText(transaction, currPos, op.delete);
            }
          }
        });
      } else {
        this._pending.push(() => this.applyDelta(delta));
      }
    }
    /**
     * Returns the Delta representation of this YText type.
     *
     * @param {Snapshot} [snapshot]
     * @param {Snapshot} [prevSnapshot]
     * @param {function('removed' | 'added', ID):any} [computeYChange]
     * @return {any} The Delta representation of this type.
     *
     * @public
     */
    toDelta(snapshot2, prevSnapshot, computeYChange) {
      this.doc ?? warnPrematureAccess();
      const ops = [];
      const currentAttributes = /* @__PURE__ */ new Map();
      const doc3 = (
        /** @type {Doc} */
        this.doc
      );
      let str = "";
      let n = this._start;
      function packStr() {
        if (str.length > 0) {
          const attributes = {};
          let addAttributes = false;
          currentAttributes.forEach((value, key) => {
            addAttributes = true;
            attributes[key] = value;
          });
          const op = { insert: str };
          if (addAttributes) {
            op.attributes = attributes;
          }
          ops.push(op);
          str = "";
        }
      }
      const computeDelta = () => {
        while (n !== null) {
          if (isVisible(n, snapshot2) || prevSnapshot !== void 0 && isVisible(n, prevSnapshot)) {
            switch (n.content.constructor) {
              case ContentString: {
                const cur = currentAttributes.get("ychange");
                if (snapshot2 !== void 0 && !isVisible(n, snapshot2)) {
                  if (cur === void 0 || cur.user !== n.id.client || cur.type !== "removed") {
                    packStr();
                    currentAttributes.set("ychange", computeYChange ? computeYChange("removed", n.id) : { type: "removed" });
                  }
                } else if (prevSnapshot !== void 0 && !isVisible(n, prevSnapshot)) {
                  if (cur === void 0 || cur.user !== n.id.client || cur.type !== "added") {
                    packStr();
                    currentAttributes.set("ychange", computeYChange ? computeYChange("added", n.id) : { type: "added" });
                  }
                } else if (cur !== void 0) {
                  packStr();
                  currentAttributes.delete("ychange");
                }
                str += /** @type {ContentString} */
                n.content.str;
                break;
              }
              case ContentType:
              case ContentEmbed: {
                packStr();
                const op = {
                  insert: n.content.getContent()[0]
                };
                if (currentAttributes.size > 0) {
                  const attrs = (
                    /** @type {Object<string,any>} */
                    {}
                  );
                  op.attributes = attrs;
                  currentAttributes.forEach((value, key) => {
                    attrs[key] = value;
                  });
                }
                ops.push(op);
                break;
              }
              case ContentFormat:
                if (isVisible(n, snapshot2)) {
                  packStr();
                  updateCurrentAttributes(
                    currentAttributes,
                    /** @type {ContentFormat} */
                    n.content
                  );
                }
                break;
            }
          }
          n = n.right;
        }
        packStr();
      };
      if (snapshot2 || prevSnapshot) {
        transact(doc3, (transaction) => {
          if (snapshot2) {
            splitSnapshotAffectedStructs(transaction, snapshot2);
          }
          if (prevSnapshot) {
            splitSnapshotAffectedStructs(transaction, prevSnapshot);
          }
          computeDelta();
        }, "cleanup");
      } else {
        computeDelta();
      }
      return ops;
    }
    /**
     * Insert text at a given index.
     *
     * @param {number} index The index at which to start inserting.
     * @param {String} text The text to insert at the specified position.
     * @param {TextAttributes} [attributes] Optionally define some formatting
     *                                    information to apply on the inserted
     *                                    Text.
     * @public
     */
    insert(index, text2, attributes) {
      if (text2.length <= 0) {
        return;
      }
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          const pos = findPosition(transaction, this, index, !attributes);
          if (!attributes) {
            attributes = {};
            pos.currentAttributes.forEach((v, k) => {
              attributes[k] = v;
            });
          }
          insertText2(transaction, this, pos, text2, attributes);
        });
      } else {
        this._pending.push(() => this.insert(index, text2, attributes));
      }
    }
    /**
     * Inserts an embed at a index.
     *
     * @param {number} index The index to insert the embed at.
     * @param {Object | AbstractType<any>} embed The Object that represents the embed.
     * @param {TextAttributes} [attributes] Attribute information to apply on the
     *                                    embed
     *
     * @public
     */
    insertEmbed(index, embed, attributes) {
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          const pos = findPosition(transaction, this, index, !attributes);
          insertText2(transaction, this, pos, embed, attributes || {});
        });
      } else {
        this._pending.push(() => this.insertEmbed(index, embed, attributes || {}));
      }
    }
    /**
     * Deletes text starting from an index.
     *
     * @param {number} index Index at which to start deleting.
     * @param {number} length The number of characters to remove. Defaults to 1.
     *
     * @public
     */
    delete(index, length2) {
      if (length2 === 0) {
        return;
      }
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          deleteText(transaction, findPosition(transaction, this, index, true), length2);
        });
      } else {
        this._pending.push(() => this.delete(index, length2));
      }
    }
    /**
     * Assigns properties to a range of text.
     *
     * @param {number} index The position where to start formatting.
     * @param {number} length The amount of characters to assign properties to.
     * @param {TextAttributes} attributes Attribute information to apply on the
     *                                    text.
     *
     * @public
     */
    format(index, length2, attributes) {
      if (length2 === 0) {
        return;
      }
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          const pos = findPosition(transaction, this, index, false);
          if (pos.right === null) {
            return;
          }
          formatText(transaction, this, pos, length2, attributes);
        });
      } else {
        this._pending.push(() => this.format(index, length2, attributes));
      }
    }
    /**
     * Removes an attribute.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @param {String} attributeName The attribute name that is to be removed.
     *
     * @public
     */
    removeAttribute(attributeName) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapDelete(transaction, this, attributeName);
        });
      } else {
        this._pending.push(() => this.removeAttribute(attributeName));
      }
    }
    /**
     * Sets or updates an attribute.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @param {String} attributeName The attribute name that is to be set.
     * @param {any} attributeValue The attribute value that is to be set.
     *
     * @public
     */
    setAttribute(attributeName, attributeValue) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapSet(transaction, this, attributeName, attributeValue);
        });
      } else {
        this._pending.push(() => this.setAttribute(attributeName, attributeValue));
      }
    }
    /**
     * Returns an attribute value that belongs to the attribute name.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @param {String} attributeName The attribute name that identifies the
     *                               queried value.
     * @return {any} The queried attribute value.
     *
     * @public
     */
    getAttribute(attributeName) {
      return (
        /** @type {any} */
        typeMapGet(this, attributeName)
      );
    }
    /**
     * Returns all attribute name/value pairs in a JSON Object.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @return {Object<string, any>} A JSON Object that describes the attributes.
     *
     * @public
     */
    getAttributes() {
      return typeMapGetAll(this);
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YTextRefID);
    }
  };
  var readYText = (_decoder) => new YText();

  // src/types/YXmlFragment.js
  var YXmlTreeWalker = class {
    /**
     * @param {YXmlFragment | YXmlElement} root
     * @param {function(AbstractType<any>):boolean} [f]
     */
    constructor(root2, f = () => true) {
      this._filter = f;
      this._root = root2;
      this._currentNode = /** @type {Item} */
      root2._start;
      this._firstCall = true;
      root2.doc ?? warnPrematureAccess();
    }
    [Symbol.iterator]() {
      return this;
    }
    /**
     * Get the next node.
     *
     * @return {IteratorResult<YXmlElement|YXmlText|YXmlHook>} The next node.
     *
     * @public
     */
    next() {
      let n = this._currentNode;
      let type = n && n.content && /** @type {any} */
      n.content.type;
      if (n !== null && (!this._firstCall || n.deleted || !this._filter(type))) {
        do {
          type = /** @type {any} */
          n.content.type;
          if (!n.deleted && (type.constructor === YXmlElement || type.constructor === YXmlFragment) && type._start !== null) {
            n = type._start;
          } else {
            while (n !== null) {
              if (n.right !== null) {
                n = n.right;
                break;
              } else if (n.parent === this._root) {
                n = null;
              } else {
                n = /** @type {AbstractType<any>} */
                n.parent._item;
              }
            }
          }
        } while (n !== null && (n.deleted || !this._filter(
          /** @type {ContentType} */
          n.content.type
        )));
      }
      this._firstCall = false;
      if (n === null) {
        return { value: void 0, done: true };
      }
      this._currentNode = n;
      return { value: (
        /** @type {any} */
        n.content.type
      ), done: false };
    }
  };
  var YXmlFragment = class _YXmlFragment extends AbstractType {
    constructor() {
      super();
      this._prelimContent = [];
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get firstChild() {
      const first = this._first;
      return first ? first.content.getContent()[0] : null;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      this.insert(
        0,
        /** @type {Array<any>} */
        this._prelimContent
      );
      this._prelimContent = null;
    }
    _copy() {
      return new _YXmlFragment();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlFragment}
     */
    clone() {
      const el = new _YXmlFragment();
      el.insert(0, this.toArray().map((item) => item instanceof AbstractType ? item.clone() : item));
      return el;
    }
    get length() {
      this.doc ?? warnPrematureAccess();
      return this._prelimContent === null ? this._length : this._prelimContent.length;
    }
    /**
     * Create a subtree of childNodes.
     *
     * @example
     * const walker = elem.createTreeWalker(dom => dom.nodeName === 'div')
     * for (let node in walker) {
     *   // `node` is a div node
     *   nop(node)
     * }
     *
     * @param {function(AbstractType<any>):boolean} filter Function that is called on each child element and
     *                          returns a Boolean indicating whether the child
     *                          is to be included in the subtree.
     * @return {YXmlTreeWalker} A subtree and a position within it.
     *
     * @public
     */
    createTreeWalker(filter) {
      return new YXmlTreeWalker(this, filter);
    }
    /**
     * Returns the first YXmlElement that matches the query.
     * Similar to DOM's {@link querySelector}.
     *
     * Query support:
     *   - tagname
     * TODO:
     *   - id
     *   - attribute
     *
     * @param {CSS_Selector} query The query on the children.
     * @return {YXmlElement|YXmlText|YXmlHook|null} The first element that matches the query or null.
     *
     * @public
     */
    querySelector(query) {
      query = query.toUpperCase();
      const iterator = new YXmlTreeWalker(this, (element2) => element2.nodeName && element2.nodeName.toUpperCase() === query);
      const next = iterator.next();
      if (next.done) {
        return null;
      } else {
        return next.value;
      }
    }
    /**
     * Returns all YXmlElements that match the query.
     * Similar to Dom's {@link querySelectorAll}.
     *
     * @todo Does not yet support all queries. Currently only query by tagName.
     *
     * @param {CSS_Selector} query The query on the children
     * @return {Array<YXmlElement|YXmlText|YXmlHook|null>} The elements that match this query.
     *
     * @public
     */
    querySelectorAll(query) {
      query = query.toUpperCase();
      return from(new YXmlTreeWalker(this, (element2) => element2.nodeName && element2.nodeName.toUpperCase() === query));
    }
    /**
     * Creates YXmlEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      callTypeObservers(this, transaction, new YXmlEvent(this, parentSubs, transaction));
    }
    /**
     * Get the string representation of all the children of this YXmlFragment.
     *
     * @return {string} The string representation of all children.
     */
    toString() {
      return typeListMap(this, (xml) => xml.toString()).join("");
    }
    /**
     * @return {string}
     */
    toJSON() {
      return this.toString();
    }
    /**
     * Creates a Dom Element that mirrors this YXmlElement.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object<string, any>} [hooks={}] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type.
     * @return {Node} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks = {}, binding) {
      const fragment = _document.createDocumentFragment();
      if (binding !== void 0) {
        binding._createAssociation(fragment, this);
      }
      typeListForEach(this, (xmlType) => {
        fragment.insertBefore(xmlType.toDOM(_document, hooks, binding), null);
      });
      return fragment;
    }
    /**
     * Inserts new content at an index.
     *
     * @example
     *  // Insert character 'a' at position 0
     *  xml.insert(0, [new Y.XmlText('text')])
     *
     * @param {number} index The index to insert content at
     * @param {Array<YXmlElement|YXmlText>} content The array of content
     */
    insert(index, content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListInsertGenerics(transaction, this, index, content);
        });
      } else {
        this._prelimContent.splice(index, 0, ...content);
      }
    }
    /**
     * Inserts new content at an index.
     *
     * @example
     *  // Insert character 'a' at position 0
     *  xml.insert(0, [new Y.XmlText('text')])
     *
     * @param {null|Item|YXmlElement|YXmlText} ref The index to insert content at
     * @param {Array<YXmlElement|YXmlText>} content The array of content
     */
    insertAfter(ref, content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          const refItem = ref && ref instanceof AbstractType ? ref._item : ref;
          typeListInsertGenericsAfter(transaction, this, refItem, content);
        });
      } else {
        const pc = (
          /** @type {Array<any>} */
          this._prelimContent
        );
        const index = ref === null ? 0 : pc.findIndex((el) => el === ref) + 1;
        if (index === 0 && ref !== null) {
          throw create3("Reference item not found");
        }
        pc.splice(index, 0, ...content);
      }
    }
    /**
     * Deletes elements starting from an index.
     *
     * @param {number} index Index at which to start deleting elements
     * @param {number} [length=1] The number of elements to remove. Defaults to 1.
     */
    delete(index, length2 = 1) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListDelete(transaction, this, index, length2);
        });
      } else {
        this._prelimContent.splice(index, length2);
      }
    }
    /**
     * Transforms this YArray to a JavaScript Array.
     *
     * @return {Array<YXmlElement|YXmlText|YXmlHook>}
     */
    toArray() {
      return typeListToArray(this);
    }
    /**
     * Appends content to this YArray.
     *
     * @param {Array<YXmlElement|YXmlText>} content Array of content to append.
     */
    push(content) {
      this.insert(this.length, content);
    }
    /**
     * Prepends content to this YArray.
     *
     * @param {Array<YXmlElement|YXmlText>} content Array of content to prepend.
     */
    unshift(content) {
      this.insert(0, content);
    }
    /**
     * Returns the i-th element from a YArray.
     *
     * @param {number} index The index of the element to return from the YArray
     * @return {YXmlElement|YXmlText}
     */
    get(index) {
      return typeListGet(this, index);
    }
    /**
     * Returns a portion of this YXmlFragment into a JavaScript Array selected
     * from start to end (end not included).
     *
     * @param {number} [start]
     * @param {number} [end]
     * @return {Array<YXmlElement|YXmlText>}
     */
    slice(start = 0, end = this.length) {
      return typeListSlice(this, start, end);
    }
    /**
     * Executes a provided function on once on every child element.
     *
     * @param {function(YXmlElement|YXmlText,number, typeof self):void} f A function to execute on every element of this YArray.
     */
    forEach(f) {
      typeListForEach(this, f);
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlFragmentRefID);
    }
  };
  var readYXmlFragment = (_decoder) => new YXmlFragment();

  // src/types/YXmlElement.js
  var YXmlElement = class _YXmlElement extends YXmlFragment {
    constructor(nodeName = "UNDEFINED") {
      super();
      this.nodeName = nodeName;
      this._prelimAttrs = /* @__PURE__ */ new Map();
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get nextSibling() {
      const n = this._item ? this._item.next : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get prevSibling() {
      const n = this._item ? this._item.prev : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      /** @type {Map<string, any>} */
      this._prelimAttrs.forEach((value, key) => {
        this.setAttribute(key, value);
      });
      this._prelimAttrs = null;
    }
    /**
     * Creates an Item with the same effect as this Item (without position effect)
     *
     * @return {YXmlElement}
     */
    _copy() {
      return new _YXmlElement(this.nodeName);
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlElement<KV>}
     */
    clone() {
      const el = new _YXmlElement(this.nodeName);
      const attrs = this.getAttributes();
      forEach(attrs, (value, key) => {
        if (typeof value === "string") {
          el.setAttribute(key, value);
        }
      });
      el.insert(0, this.toArray().map((item) => item instanceof AbstractType ? item.clone() : item));
      return el;
    }
    /**
     * Returns the XML serialization of this YXmlElement.
     * The attributes are ordered by attribute-name, so you can easily use this
     * method to compare YXmlElements
     *
     * @return {string} The string representation of this type.
     *
     * @public
     */
    toString() {
      const attrs = this.getAttributes();
      const stringBuilder = [];
      const keys2 = [];
      for (const key in attrs) {
        keys2.push(key);
      }
      keys2.sort();
      const keysLen = keys2.length;
      for (let i = 0; i < keysLen; i++) {
        const key = keys2[i];
        stringBuilder.push(key + '="' + attrs[key] + '"');
      }
      const nodeName = this.nodeName.toLocaleLowerCase();
      const attrsString = stringBuilder.length > 0 ? " " + stringBuilder.join(" ") : "";
      return `<${nodeName}${attrsString}>${super.toString()}</${nodeName}>`;
    }
    /**
     * Removes an attribute from this YXmlElement.
     *
     * @param {string} attributeName The attribute name that is to be removed.
     *
     * @public
     */
    removeAttribute(attributeName) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapDelete(transaction, this, attributeName);
        });
      } else {
        this._prelimAttrs.delete(attributeName);
      }
    }
    /**
     * Sets or updates an attribute.
     *
     * @template {keyof KV & string} KEY
     *
     * @param {KEY} attributeName The attribute name that is to be set.
     * @param {KV[KEY]} attributeValue The attribute value that is to be set.
     *
     * @public
     */
    setAttribute(attributeName, attributeValue) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapSet(transaction, this, attributeName, attributeValue);
        });
      } else {
        this._prelimAttrs.set(attributeName, attributeValue);
      }
    }
    /**
     * Returns an attribute value that belongs to the attribute name.
     *
     * @template {keyof KV & string} KEY
     *
     * @param {KEY} attributeName The attribute name that identifies the
     *                               queried value.
     * @return {KV[KEY]|undefined} The queried attribute value.
     *
     * @public
     */
    getAttribute(attributeName) {
      return (
        /** @type {any} */
        typeMapGet(this, attributeName)
      );
    }
    /**
     * Returns whether an attribute exists
     *
     * @param {string} attributeName The attribute name to check for existence.
     * @return {boolean} whether the attribute exists.
     *
     * @public
     */
    hasAttribute(attributeName) {
      return (
        /** @type {any} */
        typeMapHas(this, attributeName)
      );
    }
    /**
     * Returns all attribute name/value pairs in a JSON Object.
     *
     * @param {Snapshot} [snapshot]
     * @return {{ [Key in Extract<keyof KV,string>]?: KV[Key]}} A JSON Object that describes the attributes.
     *
     * @public
     */
    getAttributes(snapshot2) {
      return (
        /** @type {any} */
        snapshot2 ? typeMapGetAllSnapshot(this, snapshot2) : typeMapGetAll(this)
      );
    }
    /**
     * Creates a Dom Element that mirrors this YXmlElement.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object<string, any>} [hooks={}] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type.
     * @return {Node} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks = {}, binding) {
      const dom = _document.createElement(this.nodeName);
      const attrs = this.getAttributes();
      for (const key in attrs) {
        const value = attrs[key];
        if (typeof value === "string") {
          dom.setAttribute(key, value);
        }
      }
      typeListForEach(this, (yxml) => {
        dom.appendChild(yxml.toDOM(_document, hooks, binding));
      });
      if (binding !== void 0) {
        binding._createAssociation(dom, this);
      }
      return dom;
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlElementRefID);
      encoder.writeKey(this.nodeName);
    }
  };
  var readYXmlElement = (decoder) => new YXmlElement(decoder.readKey());

  // src/types/YXmlEvent.js
  var YXmlEvent = class extends YEvent {
    /**
     * @param {YXmlElement|YXmlText|YXmlFragment} target The target on which the event is created.
     * @param {Set<string|null>} subs The set of changed attributes. `null` is included if the
     *                   child list changed.
     * @param {Transaction} transaction The transaction instance with wich the
     *                                  change was created.
     */
    constructor(target, subs, transaction) {
      super(target, transaction);
      this.childListChanged = false;
      this.attributesChanged = /* @__PURE__ */ new Set();
      subs.forEach((sub) => {
        if (sub === null) {
          this.childListChanged = true;
        } else {
          this.attributesChanged.add(sub);
        }
      });
    }
  };

  // src/types/YXmlHook.js
  var YXmlHook = class _YXmlHook extends YMap {
    /**
     * @param {string} hookName nodeName of the Dom Node.
     */
    constructor(hookName) {
      super();
      this.hookName = hookName;
    }
    /**
     * Creates an Item with the same effect as this Item (without position effect)
     */
    _copy() {
      return new _YXmlHook(this.hookName);
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlHook}
     */
    clone() {
      const el = new _YXmlHook(this.hookName);
      this.forEach((value, key) => {
        el.set(key, value);
      });
      return el;
    }
    /**
     * Creates a Dom Element that mirrors this YXmlElement.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object.<string, any>} [hooks] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type
     * @return {Element} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks = {}, binding) {
      const hook = hooks[this.hookName];
      let dom;
      if (hook !== void 0) {
        dom = hook.createDom(this);
      } else {
        dom = document.createElement(this.hookName);
      }
      dom.setAttribute("data-yjs-hook", this.hookName);
      if (binding !== void 0) {
        binding._createAssociation(dom, this);
      }
      return dom;
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlHookRefID);
      encoder.writeKey(this.hookName);
    }
  };
  var readYXmlHook = (decoder) => new YXmlHook(decoder.readKey());

  // src/types/YXmlText.js
  var YXmlText = class _YXmlText extends YText {
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get nextSibling() {
      const n = this._item ? this._item.next : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get prevSibling() {
      const n = this._item ? this._item.prev : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    _copy() {
      return new _YXmlText();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlText}
     */
    clone() {
      const text2 = new _YXmlText();
      text2.applyDelta(this.toDelta());
      return text2;
    }
    /**
     * Creates a Dom Element that mirrors this YXmlText.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object<string, any>} [hooks] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type.
     * @return {Text} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks, binding) {
      const dom = _document.createTextNode(this.toString());
      if (binding !== void 0) {
        binding._createAssociation(dom, this);
      }
      return dom;
    }
    toString() {
      return this.toDelta().map((delta) => {
        const nestedNodes = [];
        for (const nodeName in delta.attributes) {
          const attrs = [];
          for (const key in delta.attributes[nodeName]) {
            attrs.push({ key, value: delta.attributes[nodeName][key] });
          }
          attrs.sort((a, b) => a.key < b.key ? -1 : 1);
          nestedNodes.push({ nodeName, attrs });
        }
        nestedNodes.sort((a, b) => a.nodeName < b.nodeName ? -1 : 1);
        let str = "";
        for (let i = 0; i < nestedNodes.length; i++) {
          const node = nestedNodes[i];
          str += `<${node.nodeName}`;
          for (let j = 0; j < node.attrs.length; j++) {
            const attr = node.attrs[j];
            str += ` ${attr.key}="${attr.value}"`;
          }
          str += ">";
        }
        str += delta.insert;
        for (let i = nestedNodes.length - 1; i >= 0; i--) {
          str += `</${nestedNodes[i].nodeName}>`;
        }
        return str;
      }).join("");
    }
    /**
     * @return {string}
     */
    toJSON() {
      return this.toString();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlTextRefID);
    }
  };
  var readYXmlText = (decoder) => new YXmlText();

  // src/structs/AbstractStruct.js
  var AbstractStruct = class {
    /**
     * @param {ID} id
     * @param {number} length
     */
    constructor(id2, length2) {
      this.id = id2;
      this.length = length2;
    }
    /**
     * @type {boolean}
     */
    get deleted() {
      throw methodUnimplemented();
    }
    /**
     * Merge this struct with the item to the right.
     * This method is already assuming that `this.id.clock + this.length === this.id.clock`.
     * Also this method does *not* remove right from StructStore!
     * @param {AbstractStruct} right
     * @return {boolean} wether this merged with right
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     * @param {number} offset
     * @param {number} encodingRef
     */
    write(encoder, offset, encodingRef) {
      throw methodUnimplemented();
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      throw methodUnimplemented();
    }
  };

  // src/structs/GC.js
  var structGCRefNumber = 0;
  var GC = class extends AbstractStruct {
    get deleted() {
      return true;
    }
    delete() {
    }
    /**
     * @param {GC} right
     * @return {boolean}
     */
    mergeWith(right) {
      if (this.constructor !== right.constructor) {
        return false;
      }
      this.length += right.length;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      if (offset > 0) {
        this.id.clock += offset;
        this.length -= offset;
      }
      addStruct(transaction.doc.store, this);
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeInfo(structGCRefNumber);
      encoder.writeLen(this.length - offset);
    }
    /**
     * @param {Transaction} transaction
     * @param {StructStore} store
     * @return {null | number}
     */
    getMissing(transaction, store) {
      return null;
    }
  };

  // src/structs/ContentBinary.js
  var ContentBinary = class _ContentBinary {
    /**
     * @param {Uint8Array} content
     */
    constructor(content) {
      this.content = content;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.content];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentBinary}
     */
    copy() {
      return new _ContentBinary(this.content);
    }
    /**
     * @param {number} offset
     * @return {ContentBinary}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentBinary} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeBuf(this.content);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 3;
    }
  };
  var readContentBinary = (decoder) => new ContentBinary(decoder.readBuf());

  // src/structs/ContentDeleted.js
  var ContentDeleted = class _ContentDeleted {
    /**
     * @param {number} len
     */
    constructor(len) {
      this.len = len;
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.len;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return false;
    }
    /**
     * @return {ContentDeleted}
     */
    copy() {
      return new _ContentDeleted(this.len);
    }
    /**
     * @param {number} offset
     * @return {ContentDeleted}
     */
    splice(offset) {
      const right = new _ContentDeleted(this.len - offset);
      this.len = offset;
      return right;
    }
    /**
     * @param {ContentDeleted} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.len += right.len;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
      addToDeleteSet(transaction.deleteSet, item.id.client, item.id.clock, this.len);
      item.markDeleted();
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeLen(this.len - offset);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 1;
    }
  };
  var readContentDeleted = (decoder) => new ContentDeleted(decoder.readLen());

  // src/structs/ContentDoc.js
  var createDocFromOpts = (guid, opts) => new Doc({ guid, ...opts, shouldLoad: opts.shouldLoad || opts.autoLoad || false });
  var ContentDoc = class _ContentDoc {
    /**
     * @param {Doc} doc
     */
    constructor(doc3) {
      if (doc3._item) {
        console.error("This document was already integrated as a sub-document. You should create a second instance instead with the same guid.");
      }
      this.doc = doc3;
      const opts = {};
      this.opts = opts;
      if (!doc3.gc) {
        opts.gc = false;
      }
      if (doc3.autoLoad) {
        opts.autoLoad = true;
      }
      if (doc3.meta !== null) {
        opts.meta = doc3.meta;
      }
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.doc];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentDoc}
     */
    copy() {
      return new _ContentDoc(createDocFromOpts(this.doc.guid, this.opts));
    }
    /**
     * @param {number} offset
     * @return {ContentDoc}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentDoc} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
      this.doc._item = item;
      transaction.subdocsAdded.add(this.doc);
      if (this.doc.shouldLoad) {
        transaction.subdocsLoaded.add(this.doc);
      }
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
      if (transaction.subdocsAdded.has(this.doc)) {
        transaction.subdocsAdded.delete(this.doc);
      } else {
        transaction.subdocsRemoved.add(this.doc);
      }
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeString(this.doc.guid);
      encoder.writeAny(this.opts);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 9;
    }
  };
  var readContentDoc = (decoder) => new ContentDoc(createDocFromOpts(decoder.readString(), decoder.readAny()));

  // src/structs/ContentEmbed.js
  var ContentEmbed = class _ContentEmbed {
    /**
     * @param {Object} embed
     */
    constructor(embed) {
      this.embed = embed;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.embed];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentEmbed}
     */
    copy() {
      return new _ContentEmbed(this.embed);
    }
    /**
     * @param {number} offset
     * @return {ContentEmbed}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentEmbed} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeJSON(this.embed);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 5;
    }
  };
  var readContentEmbed = (decoder) => new ContentEmbed(decoder.readJSON());

  // src/structs/ContentFormat.js
  var ContentFormat = class _ContentFormat {
    /**
     * @param {string} key
     * @param {Object} value
     */
    constructor(key, value) {
      this.key = key;
      this.value = value;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return false;
    }
    /**
     * @return {ContentFormat}
     */
    copy() {
      return new _ContentFormat(this.key, this.value);
    }
    /**
     * @param {number} _offset
     * @return {ContentFormat}
     */
    splice(_offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentFormat} _right
     * @return {boolean}
     */
    mergeWith(_right) {
      return false;
    }
    /**
     * @param {Transaction} _transaction
     * @param {Item} item
     */
    integrate(_transaction, item) {
      const p = (
        /** @type {YText} */
        item.parent
      );
      p._searchMarker = null;
      p._hasFormatting = true;
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeKey(this.key);
      encoder.writeJSON(this.value);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 6;
    }
  };
  var readContentFormat = (decoder) => new ContentFormat(decoder.readKey(), decoder.readJSON());

  // src/structs/ContentJSON.js
  var ContentJSON = class _ContentJSON {
    /**
     * @param {Array<any>} arr
     */
    constructor(arr) {
      this.arr = arr;
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.arr.length;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return this.arr;
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentJSON}
     */
    copy() {
      return new _ContentJSON(this.arr);
    }
    /**
     * @param {number} offset
     * @return {ContentJSON}
     */
    splice(offset) {
      const right = new _ContentJSON(this.arr.slice(offset));
      this.arr = this.arr.slice(0, offset);
      return right;
    }
    /**
     * @param {ContentJSON} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.arr = this.arr.concat(right.arr);
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      const len = this.arr.length;
      encoder.writeLen(len - offset);
      for (let i = offset; i < len; i++) {
        const c = this.arr[i];
        encoder.writeString(c === void 0 ? "undefined" : JSON.stringify(c));
      }
    }
    /**
     * @return {number}
     */
    getRef() {
      return 2;
    }
  };
  var readContentJSON = (decoder) => {
    const len = decoder.readLen();
    const cs = [];
    for (let i = 0; i < len; i++) {
      const c = decoder.readString();
      if (c === "undefined") {
        cs.push(void 0);
      } else {
        cs.push(JSON.parse(c));
      }
    }
    return new ContentJSON(cs);
  };

  // src/structs/ContentAny.js
  var isDevMode = getVariable("node_env") === "development";
  var ContentAny = class _ContentAny {
    /**
     * @param {Array<any>} arr
     */
    constructor(arr) {
      this.arr = arr;
      isDevMode && deepFreeze(arr);
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.arr.length;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return this.arr;
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentAny}
     */
    copy() {
      return new _ContentAny(this.arr);
    }
    /**
     * @param {number} offset
     * @return {ContentAny}
     */
    splice(offset) {
      const right = new _ContentAny(this.arr.slice(offset));
      this.arr = this.arr.slice(0, offset);
      return right;
    }
    /**
     * @param {ContentAny} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.arr = this.arr.concat(right.arr);
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      const len = this.arr.length;
      encoder.writeLen(len - offset);
      for (let i = offset; i < len; i++) {
        const c = this.arr[i];
        encoder.writeAny(c);
      }
    }
    /**
     * @return {number}
     */
    getRef() {
      return 8;
    }
  };
  var readContentAny = (decoder) => {
    const len = decoder.readLen();
    const cs = [];
    for (let i = 0; i < len; i++) {
      cs.push(decoder.readAny());
    }
    return new ContentAny(cs);
  };

  // src/structs/ContentString.js
  var ContentString = class _ContentString {
    /**
     * @param {string} str
     */
    constructor(str) {
      this.str = str;
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.str.length;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return this.str.split("");
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentString}
     */
    copy() {
      return new _ContentString(this.str);
    }
    /**
     * @param {number} offset
     * @return {ContentString}
     */
    splice(offset) {
      const right = new _ContentString(this.str.slice(offset));
      this.str = this.str.slice(0, offset);
      const firstCharCode = this.str.charCodeAt(offset - 1);
      if (firstCharCode >= 55296 && firstCharCode <= 56319) {
        this.str = this.str.slice(0, offset - 1) + "\uFFFD";
        right.str = "\uFFFD" + right.str.slice(1);
      }
      return right;
    }
    /**
     * @param {ContentString} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.str += right.str;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeString(offset === 0 ? this.str : this.str.slice(offset));
    }
    /**
     * @return {number}
     */
    getRef() {
      return 4;
    }
  };
  var readContentString = (decoder) => new ContentString(decoder.readString());

  // src/structs/ContentType.js
  var typeRefs = [
    readYArray,
    readYMap,
    readYText,
    readYXmlElement,
    readYXmlFragment,
    readYXmlHook,
    readYXmlText
  ];
  var YArrayRefID = 0;
  var YMapRefID = 1;
  var YTextRefID = 2;
  var YXmlElementRefID = 3;
  var YXmlFragmentRefID = 4;
  var YXmlHookRefID = 5;
  var YXmlTextRefID = 6;
  var ContentType = class _ContentType {
    /**
     * @param {AbstractType<any>} type
     */
    constructor(type) {
      this.type = type;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.type];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentType}
     */
    copy() {
      return new _ContentType(this.type._copy());
    }
    /**
     * @param {number} offset
     * @return {ContentType}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentType} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
      this.type._integrate(transaction.doc, item);
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
      let item = this.type._start;
      while (item !== null) {
        if (!item.deleted) {
          item.delete(transaction);
        } else if (item.id.clock < (transaction.beforeState.get(item.id.client) || 0)) {
          transaction._mergeStructs.push(item);
        }
        item = item.right;
      }
      this.type._map.forEach((item2) => {
        if (!item2.deleted) {
          item2.delete(transaction);
        } else if (item2.id.clock < (transaction.beforeState.get(item2.id.client) || 0)) {
          transaction._mergeStructs.push(item2);
        }
      });
      transaction.changed.delete(this.type);
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
      let item = this.type._start;
      while (item !== null) {
        item.gc(store, true);
        item = item.right;
      }
      this.type._start = null;
      this.type._map.forEach(
        /** @param {Item | null} item */
        (item2) => {
          while (item2 !== null) {
            item2.gc(store, true);
            item2 = item2.left;
          }
        }
      );
      this.type._map = /* @__PURE__ */ new Map();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      this.type._write(encoder);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 7;
    }
  };
  var readContentType = (decoder) => new ContentType(typeRefs[decoder.readTypeRef()](decoder));

  // src/structs/Item.js
  var splitItem = (transaction, leftItem, diff) => {
    const { client, clock } = leftItem.id;
    const rightItem = new Item(
      createID(client, clock + diff),
      leftItem,
      createID(client, clock + diff - 1),
      leftItem.right,
      leftItem.rightOrigin,
      leftItem.parent,
      leftItem.parentSub,
      leftItem.content.splice(diff)
    );
    if (leftItem.deleted) {
      rightItem.markDeleted();
    }
    if (leftItem.keep) {
      rightItem.keep = true;
    }
    if (leftItem.redone !== null) {
      rightItem.redone = createID(leftItem.redone.client, leftItem.redone.clock + diff);
    }
    leftItem.right = rightItem;
    if (rightItem.right !== null) {
      rightItem.right.left = rightItem;
    }
    transaction._mergeStructs.push(rightItem);
    if (rightItem.parentSub !== null && rightItem.right === null) {
      rightItem.parent._map.set(rightItem.parentSub, rightItem);
    }
    leftItem.length = diff;
    return rightItem;
  };
  var Item = class _Item extends AbstractStruct {
    /**
     * @param {ID} id
     * @param {Item | null} left
     * @param {ID | null} origin
     * @param {Item | null} right
     * @param {ID | null} rightOrigin
     * @param {AbstractType<any>|ID|null} parent Is a type if integrated, is null if it is possible to copy parent from left or right, is ID before integration to search for it.
     * @param {string | null} parentSub
     * @param {AbstractContent} content
     */
    constructor(id2, left, origin, right, rightOrigin, parent, parentSub, content) {
      super(id2, content.getLength());
      this.origin = origin;
      this.left = left;
      this.right = right;
      this.rightOrigin = rightOrigin;
      this.parent = parent;
      this.parentSub = parentSub;
      this.redone = null;
      this.content = content;
      this.info = this.content.isCountable() ? BIT2 : 0;
    }
    /**
     * This is used to mark the item as an indexed fast-search marker
     *
     * @type {boolean}
     */
    set marker(isMarked) {
      if ((this.info & BIT4) > 0 !== isMarked) {
        this.info ^= BIT4;
      }
    }
    get marker() {
      return (this.info & BIT4) > 0;
    }
    /**
     * If true, do not garbage collect this Item.
     */
    get keep() {
      return (this.info & BIT1) > 0;
    }
    set keep(doKeep) {
      if (this.keep !== doKeep) {
        this.info ^= BIT1;
      }
    }
    get countable() {
      return (this.info & BIT2) > 0;
    }
    /**
     * Whether this item was deleted or not.
     * @type {Boolean}
     */
    get deleted() {
      return (this.info & BIT3) > 0;
    }
    set deleted(doDelete) {
      if (this.deleted !== doDelete) {
        this.info ^= BIT3;
      }
    }
    markDeleted() {
      this.info |= BIT3;
    }
    /**
     * Return the creator clientID of the missing op or define missing items and return null.
     *
     * @param {Transaction} transaction
     * @param {StructStore} store
     * @return {null | number}
     */
    getMissing(transaction, store) {
      if (this.origin && this.origin.client !== this.id.client && this.origin.clock >= getState(store, this.origin.client)) {
        return this.origin.client;
      }
      if (this.rightOrigin && this.rightOrigin.client !== this.id.client && this.rightOrigin.clock >= getState(store, this.rightOrigin.client)) {
        return this.rightOrigin.client;
      }
      if (this.parent && this.parent.constructor === ID && this.id.client !== this.parent.client && this.parent.clock >= getState(store, this.parent.client)) {
        return this.parent.client;
      }
      if (this.origin) {
        this.left = getItemCleanEnd(transaction, store, this.origin);
        this.origin = this.left.lastId;
      }
      if (this.rightOrigin) {
        this.right = getItemCleanStart(transaction, this.rightOrigin);
        this.rightOrigin = this.right.id;
      }
      if (this.left && this.left.constructor === GC || this.right && this.right.constructor === GC) {
        this.parent = null;
      } else if (!this.parent) {
        if (this.left && this.left.constructor === _Item) {
          this.parent = this.left.parent;
          this.parentSub = this.left.parentSub;
        }
        if (this.right && this.right.constructor === _Item) {
          this.parent = this.right.parent;
          this.parentSub = this.right.parentSub;
        }
      } else if (this.parent.constructor === ID) {
        const parentItem = getItem(store, this.parent);
        if (parentItem.constructor === GC) {
          this.parent = null;
        } else {
          this.parent = /** @type {ContentType} */
          parentItem.content.type;
        }
      }
      return null;
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      if (offset > 0) {
        this.id.clock += offset;
        this.left = getItemCleanEnd(transaction, transaction.doc.store, createID(this.id.client, this.id.clock - 1));
        this.origin = this.left.lastId;
        this.content = this.content.splice(offset);
        this.length -= offset;
      }
      if (this.parent) {
        if (!this.left && (!this.right || this.right.left !== null) || this.left && this.left.right !== this.right) {
          let left = this.left;
          let o;
          if (left !== null) {
            o = left.right;
          } else if (this.parentSub !== null) {
            o = /** @type {AbstractType<any>} */
            this.parent._map.get(this.parentSub) || null;
            while (o !== null && o.left !== null) {
              o = o.left;
            }
          } else {
            o = /** @type {AbstractType<any>} */
            this.parent._start;
          }
          const conflictingItems = /* @__PURE__ */ new Set();
          const itemsBeforeOrigin = /* @__PURE__ */ new Set();
          while (o !== null && o !== this.right) {
            itemsBeforeOrigin.add(o);
            conflictingItems.add(o);
            if (compareIDs(this.origin, o.origin)) {
              if (o.id.client < this.id.client) {
                left = o;
                conflictingItems.clear();
              } else if (compareIDs(this.rightOrigin, o.rightOrigin)) {
                break;
              }
            } else if (o.origin !== null && itemsBeforeOrigin.has(getItem(transaction.doc.store, o.origin))) {
              if (!conflictingItems.has(getItem(transaction.doc.store, o.origin))) {
                left = o;
                conflictingItems.clear();
              }
            } else {
              break;
            }
            o = o.right;
          }
          this.left = left;
        }
        if (this.left !== null) {
          const right = this.left.right;
          this.right = right;
          this.left.right = this;
        } else {
          let r;
          if (this.parentSub !== null) {
            r = /** @type {AbstractType<any>} */
            this.parent._map.get(this.parentSub) || null;
            while (r !== null && r.left !== null) {
              r = r.left;
            }
          } else {
            r = /** @type {AbstractType<any>} */
            this.parent._start;
            this.parent._start = this;
          }
          this.right = r;
        }
        if (this.right !== null) {
          this.right.left = this;
        } else if (this.parentSub !== null) {
          this.parent._map.set(this.parentSub, this);
          if (this.left !== null) {
            this.left.delete(transaction);
          }
        }
        if (this.parentSub === null && this.countable && !this.deleted) {
          this.parent._length += this.length;
        }
        addStruct(transaction.doc.store, this);
        this.content.integrate(transaction, this);
        addChangedTypeToTransaction(
          transaction,
          /** @type {AbstractType<any>} */
          this.parent,
          this.parentSub
        );
        if (
          /** @type {AbstractType<any>} */
          this.parent._item !== null && /** @type {AbstractType<any>} */
          this.parent._item.deleted || this.parentSub !== null && this.right !== null
        ) {
          this.delete(transaction);
        }
      } else {
        new GC(this.id, this.length).integrate(transaction, 0);
      }
    }
    /**
     * Returns the next non-deleted item
     */
    get next() {
      let n = this.right;
      while (n !== null && n.deleted) {
        n = n.right;
      }
      return n;
    }
    /**
     * Returns the previous non-deleted item
     */
    get prev() {
      let n = this.left;
      while (n !== null && n.deleted) {
        n = n.left;
      }
      return n;
    }
    /**
     * Computes the last content address of this Item.
     */
    get lastId() {
      return this.length === 1 ? this.id : createID(this.id.client, this.id.clock + this.length - 1);
    }
    /**
     * Try to merge two items
     *
     * @param {Item} right
     * @return {boolean}
     */
    mergeWith(right) {
      if (this.constructor === right.constructor && compareIDs(right.origin, this.lastId) && this.right === right && compareIDs(this.rightOrigin, right.rightOrigin) && this.id.client === right.id.client && this.id.clock + this.length === right.id.clock && this.deleted === right.deleted && this.redone === null && right.redone === null && this.content.constructor === right.content.constructor && this.content.mergeWith(right.content)) {
        const searchMarker = (
          /** @type {AbstractType<any>} */
          this.parent._searchMarker
        );
        if (searchMarker) {
          searchMarker.forEach((marker) => {
            if (marker.p === right) {
              marker.p = this;
              if (!this.deleted && this.countable) {
                marker.index -= this.length;
              }
            }
          });
        }
        if (right.keep) {
          this.keep = true;
        }
        this.right = right.right;
        if (this.right !== null) {
          this.right.left = this;
        }
        this.length += right.length;
        return true;
      }
      return false;
    }
    /**
     * Mark this Item as deleted.
     *
     * @param {Transaction} transaction
     */
    delete(transaction) {
      if (!this.deleted) {
        const parent = (
          /** @type {AbstractType<any>} */
          this.parent
        );
        if (this.countable && this.parentSub === null) {
          parent._length -= this.length;
        }
        this.markDeleted();
        addToDeleteSet(transaction.deleteSet, this.id.client, this.id.clock, this.length);
        addChangedTypeToTransaction(transaction, parent, this.parentSub);
        this.content.delete(transaction);
      }
    }
    /**
     * @param {StructStore} store
     * @param {boolean} parentGCd
     */
    gc(store, parentGCd) {
      if (!this.deleted) {
        throw unexpectedCase();
      }
      this.content.gc(store);
      if (parentGCd) {
        replaceStruct(store, this, new GC(this.id, this.length));
      } else {
        this.content = new ContentDeleted(this.length);
      }
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     * @param {number} offset
     */
    write(encoder, offset) {
      const origin = offset > 0 ? createID(this.id.client, this.id.clock + offset - 1) : this.origin;
      const rightOrigin = this.rightOrigin;
      const parentSub = this.parentSub;
      const info = this.content.getRef() & BITS5 | (origin === null ? 0 : BIT8) | // origin is defined
      (rightOrigin === null ? 0 : BIT7) | // right origin is defined
      (parentSub === null ? 0 : BIT6);
      encoder.writeInfo(info);
      if (origin !== null) {
        encoder.writeLeftID(origin);
      }
      if (rightOrigin !== null) {
        encoder.writeRightID(rightOrigin);
      }
      if (origin === null && rightOrigin === null) {
        const parent = (
          /** @type {AbstractType<any>} */
          this.parent
        );
        if (parent._item !== void 0) {
          const parentItem = parent._item;
          if (parentItem === null) {
            const ykey = findRootTypeKey(parent);
            encoder.writeParentInfo(true);
            encoder.writeString(ykey);
          } else {
            encoder.writeParentInfo(false);
            encoder.writeLeftID(parentItem.id);
          }
        } else if (parent.constructor === String) {
          encoder.writeParentInfo(true);
          encoder.writeString(parent);
        } else if (parent.constructor === ID) {
          encoder.writeParentInfo(false);
          encoder.writeLeftID(parent);
        } else {
          unexpectedCase();
        }
        if (parentSub !== null) {
          encoder.writeString(parentSub);
        }
      }
      this.content.write(encoder, offset);
    }
  };
  var readItemContent = (decoder, info) => contentRefs[info & BITS5](decoder);
  var contentRefs = [
    () => {
      unexpectedCase();
    },
    // GC is not ItemContent
    readContentDeleted,
    // 1
    readContentJSON,
    // 2
    readContentBinary,
    // 3
    readContentString,
    // 4
    readContentEmbed,
    // 5
    readContentFormat,
    // 6
    readContentType,
    // 7
    readContentAny,
    // 8
    readContentDoc,
    // 9
    () => {
      unexpectedCase();
    }
    // 10 - Skip is not ItemContent
  ];

  // src/structs/Skip.js
  var structSkipRefNumber = 10;
  var Skip = class extends AbstractStruct {
    get deleted() {
      return true;
    }
    delete() {
    }
    /**
     * @param {Skip} right
     * @return {boolean}
     */
    mergeWith(right) {
      if (this.constructor !== right.constructor) {
        return false;
      }
      this.length += right.length;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      unexpectedCase();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeInfo(structSkipRefNumber);
      writeVarUint(encoder.restEncoder, this.length - offset);
    }
    /**
     * @param {Transaction} transaction
     * @param {StructStore} store
     * @return {null | number}
     */
    getMissing(transaction, store) {
      return null;
    }
  };

  // src/index.js
  var glo = (
    /** @type {any} */
    typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {}
  );
  var importIdentifier = "__ $YJS$ __";
  if (glo[importIdentifier] === true) {
    console.error("Yjs was already imported. This breaks constructor checks and will lead to issues! - https://github.com/yjs/yjs/issues/438");
  }
  glo[importIdentifier] = true;

  // src/y-pojo.ts
  function deepEquals(managed, target) {
    const managedType = detectManagedType(managed);
    try {
      var targetType = target.constructor.name;
    } catch (e) {
      targetType = "undefined";
    }
    if (managedType == "YArray" && targetType == "Array") {
      const targetArray = target;
      const managedArray = managed;
      const result = managedArray.length == targetArray.length && targetArray.every((t, i) => deepEquals(managedArray.get(i), targetArray[i]));
      return result;
    } else if (managedType == "YMap" && targetType == "Object") {
      const targetMap = target;
      const managedMap = managed;
      let targetKeyCount = 0;
      for (let targetKey in targetMap) {
        targetKeyCount++;
        if (!deepEquals(managedMap.get(targetKey), targetMap[targetKey])) {
          return false;
        }
      }
      return targetKeyCount == Array.from(managedMap.keys()).length;
    } else {
      return target === managed;
    }
  }
  function syncronize(managedObj, targetObj) {
    let changed = false;
    const managedType = detectManagedType(managedObj);
    switch (managedType) {
      case "YArray":
        if (!Array.isArray(targetObj)) {
          throw new Error(`Sync failed, ${targetObj} was not array`);
        }
        const managedArray = managedObj;
        const targetArray = targetObj;
        const outOfRange = Symbol();
        let cursor = 0;
        for (let i = 0; i < targetArray.length; i++) {
          let match = false;
          const targetValue = targetArray[i];
          const len = managedArray.length > targetArray.length ? managedArray.length : targetArray.length;
          for (let j = cursor; !match && j < len; j++) {
            const managedValue = j < managedArray.length ? managedArray.get(j) : outOfRange;
            const targetValue2 = i < targetArray.length ? targetArray[i] : outOfRange;
            if (deepEquals(managedValue, targetValue2)) {
              for (let x = j - 1; x >= cursor; x--) {
                changed = true;
                managedArray.delete(x);
              }
              const deletedCount = j - cursor;
              cursor = j + 1 - deletedCount;
              match = true;
            }
          }
          if (!match) {
            try {
              var childType = targetValue.constructor.name;
            } catch (e) {
              childType = "undefined";
            }
            const managedChild = cursor < managedArray.length ? managedArray.get(cursor) : "undefined";
            const managedType2 = detectManagedType(managedChild);
            if (managedType2 == "YMap" && childType == "Object" || managedType2 == "YArray" && childType == "Array") {
              syncronize(managedChild, targetValue);
            } else {
              managedArray.insert(cursor, [syncChild(targetValue)]);
            }
            cursor++;
            changed = true;
          }
        }
        while (managedArray.length > targetArray.length) {
          changed = true;
          managedArray.delete(targetArray.length);
        }
        break;
      case "YMap":
        if (targetObj.constructor.name !== "Object") {
          throw new Error(`Sync failed, ${targetObj} was not object`);
        }
        const managedMap = managedObj;
        const targetMap = targetObj;
        for (const key of managedMap.keys()) {
          if (!(key in targetObj)) {
            managedMap.delete(key);
            changed = true;
            continue;
          }
          const managedChild = managedMap.get(key);
          const targetChild = targetMap[key];
          const managedType2 = detectManagedType(managedChild);
          try {
            var childType = targetChild.constructor.name;
          } catch (e) {
            childType = "undefined";
          }
          if (managedType2 == "YMap" && childType !== "Object" || managedType2 == "YArray" && childType !== "Array" || !["YMap", "YArray"].includes(managedType2) && managedType2 !== childType) {
            managedMap.delete(key);
            changed = true;
          } else if (managedType2 == "YMap" || managedType2 == "YArray") {
            const childChanged = syncronize(managedChild, targetChild);
            changed ||= childChanged;
          } else {
            if (managedChild !== targetChild) {
              managedMap.set(key, targetChild);
              changed = true;
            }
          }
        }
        for (const key in targetMap) {
          if (!managedMap.has(key)) {
            const child = syncChild(targetMap[key]);
            managedMap.set(key, child);
            changed = true;
          }
        }
        break;
      default:
        throw new Error(`can only iterate over Y.Map and Y.Array, got ${managedObj}`);
    }
    return changed;
  }
  function syncChild(child) {
    try {
      var childType = child.constructor.name;
    } catch (e) {
      childType = "undefined";
    }
    if (childType == "Array") {
      const arr = new YArray();
      syncronize(arr, child);
      return arr;
    } else if (childType == "Object") {
      const map2 = new YMap();
      syncronize(map2, child);
      return map2;
    } else {
      return child;
    }
  }
  function detectManagedType(managed) {
    try {
      if (managed.length !== void 0 && managed.get !== void 0) {
        return "YArray";
      } else if (managed.keys !== void 0 && managed.get !== void 0) {
        return "YMap";
      } else {
        return managed.constructor.name;
      }
    } catch (e) {
      return "undefined";
    }
  }

  // ../../node_modules/js-base64/base64.mjs
  var _hasBuffer = typeof Buffer === "function";
  var _TD = typeof TextDecoder === "function" ? new TextDecoder() : void 0;
  var _TE = typeof TextEncoder === "function" ? new TextEncoder() : void 0;
  var b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var b64chs = Array.prototype.slice.call(b64ch);
  var b64tab = ((a) => {
    let tab = {};
    a.forEach((c, i) => tab[c] = i);
    return tab;
  })(b64chs);
  var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
  var _fromCC = String.fromCharCode.bind(String);
  var _U8Afrom = typeof Uint8Array.from === "function" ? Uint8Array.from.bind(Uint8Array) : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));
  var _mkUriSafe = (src) => src.replace(/=/g, "").replace(/[+\/]/g, (m0) => m0 == "+" ? "-" : "_");
  var _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, "");
  var btoaPolyfill = (bin) => {
    let u32, c0, c1, c2, asc = "";
    const pad = bin.length % 3;
    for (let i = 0; i < bin.length; ) {
      if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)
        throw new TypeError("invalid character found");
      u32 = c0 << 16 | c1 << 8 | c2;
      asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];
    }
    return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
  };
  var _btoa = typeof btoa === "function" ? (bin) => btoa(bin) : _hasBuffer ? (bin) => Buffer.from(bin, "binary").toString("base64") : btoaPolyfill;
  var _fromUint8Array = _hasBuffer ? (u8a) => Buffer.from(u8a).toString("base64") : (u8a) => {
    const maxargs = 4096;
    let strs = [];
    for (let i = 0, l = u8a.length; i < l; i += maxargs) {
      strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
    }
    return _btoa(strs.join(""));
  };
  var fromUint8Array = (u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a);
  var atobPolyfill = (asc) => {
    asc = asc.replace(/\s+/g, "");
    if (!b64re.test(asc))
      throw new TypeError("malformed base64.");
    asc += "==".slice(2 - (asc.length & 3));
    let u24, bin = "", r1, r2;
    for (let i = 0; i < asc.length; ) {
      u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);
      bin += r1 === 64 ? _fromCC(u24 >> 16 & 255) : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255) : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
    }
    return bin;
  };
  var _atob = typeof atob === "function" ? (asc) => atob(_tidyB64(asc)) : _hasBuffer ? (asc) => Buffer.from(asc, "base64").toString("binary") : atobPolyfill;
  var _toUint8Array = _hasBuffer ? (a) => _U8Afrom(Buffer.from(a, "base64")) : (a) => _U8Afrom(_atob(a).split("").map((c) => c.charCodeAt(0)));
  var toUint8Array2 = (a) => _toUint8Array(_unURI(a));
  var _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/"));

  // entry.js
  var doc2;
  var root;
  var initialize = () => {
    doc2 = new Doc();
    if (complex) {
      root = doc2.getMap("r");
    } else {
      root = doc2.getText("t");
    }
    if (!complex && documentText && documentText.length > 0) {
      root.insert(0, documentText);
    } else if (complex && documentObject !== void 0) {
      syncronize(root, JSON.parse(documentObject));
    }
    return "initialized";
  };
  var applyUpdate2 = () => {
    let data = toUint8Array2(encodedUpdate);
    applyUpdateV2(doc2, data);
    return "hello";
  };
  var encodeStateAsUpdate2 = () => {
    let stateVector2 = void 0;
    if (encodedStateVector && encodedStateVector.length > 0) {
      stateVector2 = toUint8Array2(encodedStateVector);
    }
    let arr = encodeStateAsUpdateV2(doc2, stateVector2);
    return fromUint8Array(arr);
  };
  var stateVector = () => {
    return fromUint8Array(encodeStateVector(doc2));
  };
  var toString = () => {
    if (complex) {
      return JSON.stringify(root.toJSON());
    } else {
      return root.toString();
    }
  };
  var insert = () => {
    root.insert(insertPosition, insertText);
  };
  return __toCommonJS(entry_exports);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vZW50cnkuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvbWFwLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL3NldC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC9hcnJheS5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC9vYnNlcnZhYmxlLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL21hdGguanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvYmluYXJ5LmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL251bWJlci5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC9zdHJpbmcuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvZW5jb2RpbmcuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvZXJyb3IuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvZGVjb2RpbmcuanMiLCAiLi4vc3JjL3V0aWxzL0RlbGV0ZVNldC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC90aW1lLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL3Byb21pc2UuanMiLCAiLi4vc3JjL3V0aWxzL0RvYy5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC9jb25kaXRpb25zLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL3N0b3JhZ2UuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvb2JqZWN0LmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2Z1bmN0aW9uLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2Vudmlyb25tZW50LmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2J1ZmZlci5qcyIsICIuLi9zcmMvdXRpbHMvVXBkYXRlRGVjb2Rlci5qcyIsICIuLi9zcmMvdXRpbHMvVXBkYXRlRW5jb2Rlci5qcyIsICIuLi9zcmMvdXRpbHMvZW5jb2RpbmcuanMiLCAiLi4vc3JjL3V0aWxzL0V2ZW50SGFuZGxlci5qcyIsICIuLi9zcmMvdXRpbHMvSUQuanMiLCAiLi4vc3JjL3V0aWxzL1NuYXBzaG90LmpzIiwgIi4uL3NyYy91dGlscy9TdHJ1Y3RTdG9yZS5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC9wYWlyLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2RvbS5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC9zeW1ib2wuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5jb21tb24uanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5qcyIsICIuLi9zcmMvdXRpbHMvVHJhbnNhY3Rpb24uanMiLCAiLi4vc3JjL3V0aWxzL3VwZGF0ZXMuanMiLCAiLi4vc3JjL3V0aWxzL1lFdmVudC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGliMC9pdGVyYXRvci5qcyIsICIuLi9zcmMvdHlwZXMvQWJzdHJhY3RUeXBlLmpzIiwgIi4uL3NyYy90eXBlcy9ZQXJyYXkuanMiLCAiLi4vc3JjL3R5cGVzL1lNYXAuanMiLCAiLi4vc3JjL3R5cGVzL1lUZXh0LmpzIiwgIi4uL3NyYy90eXBlcy9ZWG1sRnJhZ21lbnQuanMiLCAiLi4vc3JjL3R5cGVzL1lYbWxFbGVtZW50LmpzIiwgIi4uL3NyYy90eXBlcy9ZWG1sRXZlbnQuanMiLCAiLi4vc3JjL3R5cGVzL1lYbWxIb29rLmpzIiwgIi4uL3NyYy90eXBlcy9ZWG1sVGV4dC5qcyIsICIuLi9zcmMvc3RydWN0cy9BYnN0cmFjdFN0cnVjdC5qcyIsICIuLi9zcmMvc3RydWN0cy9HQy5qcyIsICIuLi9zcmMvc3RydWN0cy9Db250ZW50QmluYXJ5LmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnREZWxldGVkLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnREb2MuanMiLCAiLi4vc3JjL3N0cnVjdHMvQ29udGVudEVtYmVkLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnRGb3JtYXQuanMiLCAiLi4vc3JjL3N0cnVjdHMvQ29udGVudEpTT04uanMiLCAiLi4vc3JjL3N0cnVjdHMvQ29udGVudEFueS5qcyIsICIuLi9zcmMvc3RydWN0cy9Db250ZW50U3RyaW5nLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnRUeXBlLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0l0ZW0uanMiLCAiLi4vc3JjL3N0cnVjdHMvU2tpcC5qcyIsICIuLi9zcmMvaW5kZXguanMiLCAiLi4vc3JjL3ktcG9qby50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvanMtYmFzZTY0L2Jhc2U2NC5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIFkgZnJvbSAnLi9zcmMnXG5pbXBvcnQge3N5bmNyb25pemV9IGZyb20gJy4vc3JjL3ktcG9qbydcbmltcG9ydCB7IGZyb21VaW50OEFycmF5LCB0b1VpbnQ4QXJyYXkgfSBmcm9tICdqcy1iYXNlNjQnXG5cbnZhciBkb2NcbnZhciByb290XG5cbmV4cG9ydCBjb25zdCBpbml0aWFsaXplID0gKCkgPT4ge1xuICAgIGRvYyA9IG5ldyBZLkRvYygpXG4gICAgaWYgKGNvbXBsZXgpIHtcbiAgICAgICAgcm9vdCA9IGRvYy5nZXRNYXAoXCJyXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdCA9IGRvYy5nZXRUZXh0KFwidFwiKVxuICAgIH1cblxuICAgIGlmICghY29tcGxleCAmJiBkb2N1bWVudFRleHQgJiYgZG9jdW1lbnRUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgcm9vdC5pbnNlcnQoMCwgZG9jdW1lbnRUZXh0KVxuICAgIH0gZWxzZSBpZiAoY29tcGxleCAmJiBkb2N1bWVudE9iamVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN5bmNyb25pemUocm9vdCwgSlNPTi5wYXJzZShkb2N1bWVudE9iamVjdCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIFwiaW5pdGlhbGl6ZWRcIlxufVxuXG5leHBvcnQgY29uc3QgYXBwbHlVcGRhdGUgPSAoKSA9PiB7XG4gICAgbGV0IGRhdGEgPSB0b1VpbnQ4QXJyYXkoZW5jb2RlZFVwZGF0ZSlcbiAgICBZLmFwcGx5VXBkYXRlVjIoZG9jLCBkYXRhKVxuXG4gICAgcmV0dXJuIFwiaGVsbG9cIlxufVxuXG5leHBvcnQgY29uc3QgZW5jb2RlU3RhdGVBc1VwZGF0ZSA9ICgpID0+IHtcbiAgICBsZXQgc3RhdGVWZWN0b3IgPSB1bmRlZmluZWRcbiAgICBpZiAoZW5jb2RlZFN0YXRlVmVjdG9yICYmIGVuY29kZWRTdGF0ZVZlY3Rvci5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN0YXRlVmVjdG9yID0gdG9VaW50OEFycmF5KGVuY29kZWRTdGF0ZVZlY3RvcilcbiAgICB9XG4gICAgbGV0IGFyciA9IFkuZW5jb2RlU3RhdGVBc1VwZGF0ZVYyKGRvYywgc3RhdGVWZWN0b3IpXG4gICAgcmV0dXJuIGZyb21VaW50OEFycmF5KGFycilcbn1cblxuZXhwb3J0IGNvbnN0IHN0YXRlVmVjdG9yID0gKCkgPT4ge1xuICAgIHJldHVybiBmcm9tVWludDhBcnJheShZLmVuY29kZVN0YXRlVmVjdG9yKGRvYykpXG59XG5cbmV4cG9ydCBjb25zdCB0b1N0cmluZyA9ICgpID0+IHtcbiAgICBpZiAoY29tcGxleCkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocm9vdC50b0pTT04oKSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcm9vdC50b1N0cmluZygpXG4gICAgfVxufVxuXG4vLyBTZXJ2ZXIgZG9lc24ndCBhY3R1YWxseSBtb2RpZnkgdGhlIGRvY3VtZW50LCB0aGVzZSBhcmUgZm9yIHRlc3RpbmdcblxuZXhwb3J0IGNvbnN0IGluc2VydCA9ICgpID0+IHtcbiAgICByb290Lmluc2VydChpbnNlcnRQb3NpdGlvbiwgaW5zZXJ0VGV4dClcbn0iLCAiLyoqXG4gKiBVdGlsaXR5IG1vZHVsZSB0byB3b3JrIHdpdGgga2V5LXZhbHVlIHN0b3Jlcy5cbiAqXG4gKiBAbW9kdWxlIG1hcFxuICovXG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBNYXAgaW5zdGFuY2UuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtNYXA8YW55LCBhbnk+fVxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gbmV3IE1hcCgpXG5cbi8qKlxuICogQ29weSBhIE1hcCBvYmplY3QgaW50byBhIGZyZXNoIE1hcCBvYmplY3QuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAdGVtcGxhdGUgSyxWXG4gKiBAcGFyYW0ge01hcDxLLFY+fSBtXG4gKiBAcmV0dXJuIHtNYXA8SyxWPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNvcHkgPSBtID0+IHtcbiAgY29uc3QgciA9IGNyZWF0ZSgpXG4gIG0uZm9yRWFjaCgodiwgaykgPT4geyByLnNldChrLCB2KSB9KVxuICByZXR1cm4gclxufVxuXG4vKipcbiAqIEdldCBtYXAgcHJvcGVydHkuIENyZWF0ZSBUIGlmIHByb3BlcnR5IGlzIHVuZGVmaW5lZCBhbmQgc2V0IFQgb24gbWFwLlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBsaXN0ZW5lcnMgPSBtYXAuc2V0SWZVbmRlZmluZWQoZXZlbnRzLCAnZXZlbnROYW1lJywgc2V0LmNyZWF0ZSlcbiAqIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpXG4gKiBgYGBcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7TWFwPGFueSwgYW55Pn0gTUFQXG4gKiBAdGVtcGxhdGUge01BUCBleHRlbmRzIE1hcDxhbnksaW5mZXIgVj4gPyBmdW5jdGlvbigpOlYgOiB1bmtub3dufSBDRlxuICogQHBhcmFtIHtNQVB9IG1hcFxuICogQHBhcmFtIHtNQVAgZXh0ZW5kcyBNYXA8aW5mZXIgSyxhbnk+ID8gSyA6IHVua25vd259IGtleVxuICogQHBhcmFtIHtDRn0gY3JlYXRlVFxuICogQHJldHVybiB7UmV0dXJuVHlwZTxDRj59XG4gKi9cbmV4cG9ydCBjb25zdCBzZXRJZlVuZGVmaW5lZCA9IChtYXAsIGtleSwgY3JlYXRlVCkgPT4ge1xuICBsZXQgc2V0ID0gbWFwLmdldChrZXkpXG4gIGlmIChzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIG1hcC5zZXQoa2V5LCBzZXQgPSBjcmVhdGVUKCkpXG4gIH1cbiAgcmV0dXJuIHNldFxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gQXJyYXkgYW5kIHBvcHVsYXRlcyBpdCB3aXRoIHRoZSBjb250ZW50IG9mIGFsbCBrZXktdmFsdWUgcGFpcnMgdXNpbmcgdGhlIGBmKHZhbHVlLCBrZXkpYCBmdW5jdGlvbi5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLXG4gKiBAdGVtcGxhdGUgVlxuICogQHRlbXBsYXRlIFJcbiAqIEBwYXJhbSB7TWFwPEssVj59IG1cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oVixLKTpSfSBmXG4gKiBAcmV0dXJuIHtBcnJheTxSPn1cbiAqL1xuZXhwb3J0IGNvbnN0IG1hcCA9IChtLCBmKSA9PiB7XG4gIGNvbnN0IHJlcyA9IFtdXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG0pIHtcbiAgICByZXMucHVzaChmKHZhbHVlLCBrZXkpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBUZXN0cyB3aGV0aGVyIGFueSBrZXktdmFsdWUgcGFpcnMgcGFzcyB0aGUgdGVzdCBpbXBsZW1lbnRlZCBieSBgZih2YWx1ZSwga2V5KWAuXG4gKlxuICogQHRvZG8gc2hvdWxkIHJlbmFtZSB0byBzb21lIC0gc2ltaWxhcmx5IHRvIEFycmF5LnNvbWVcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHtNYXA8SyxWPn0gbVxuICogQHBhcmFtIHtmdW5jdGlvbihWLEspOmJvb2xlYW59IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBhbnkgPSAobSwgZikgPT4ge1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBtKSB7XG4gICAgaWYgKGYodmFsdWUsIGtleSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIFRlc3RzIHdoZXRoZXIgYWxsIGtleS12YWx1ZSBwYWlycyBwYXNzIHRoZSB0ZXN0IGltcGxlbWVudGVkIGJ5IGBmKHZhbHVlLCBrZXkpYC5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHtNYXA8SyxWPn0gbVxuICogQHBhcmFtIHtmdW5jdGlvbihWLEspOmJvb2xlYW59IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBhbGwgPSAobSwgZikgPT4ge1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBtKSB7XG4gICAgaWYgKCFmKHZhbHVlLCBrZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBzZXRzLlxuICpcbiAqIEBtb2R1bGUgc2V0XG4gKi9cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9ICgpID0+IG5ldyBTZXQoKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1NldDxUPn0gc2V0XG4gKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHRvQXJyYXkgPSBzZXQgPT4gQXJyYXkuZnJvbShzZXQpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7U2V0PFQ+fSBzZXRcbiAqIEByZXR1cm4ge1R9XG4gKi9cbmV4cG9ydCBjb25zdCBmaXJzdCA9IHNldCA9PlxuICBzZXQudmFsdWVzKCkubmV4dCgpLnZhbHVlID8/IHVuZGVmaW5lZFxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0l0ZXJhYmxlPFQ+fSBlbnRyaWVzXG4gKiBAcmV0dXJuIHtTZXQ8VD59XG4gKi9cbmV4cG9ydCBjb25zdCBmcm9tID0gZW50cmllcyA9PiBuZXcgU2V0KGVudHJpZXMpXG4iLCAiLyoqXG4gKiBVdGlsaXR5IG1vZHVsZSB0byB3b3JrIHdpdGggQXJyYXlzLlxuICpcbiAqIEBtb2R1bGUgYXJyYXlcbiAqL1xuXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnLi9zZXQuanMnXG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFRoZSBlbGVtZW50IG11c3QgZXhpc3RcbiAqXG4gKiBAdGVtcGxhdGUgTFxuICogQHBhcmFtIHtBcnJheUxpa2U8TD59IGFyclxuICogQHJldHVybiB7TH1cbiAqL1xuZXhwb3J0IGNvbnN0IGxhc3QgPSBhcnIgPT4gYXJyW2Fyci5sZW5ndGggLSAxXVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBDXG4gKiBAcmV0dXJuIHtBcnJheTxDPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9ICgpID0+IC8qKiBAdHlwZSB7QXJyYXk8Qz59ICovIChbXSlcblxuLyoqXG4gKiBAdGVtcGxhdGUgRFxuICogQHBhcmFtIHtBcnJheTxEPn0gYVxuICogQHJldHVybiB7QXJyYXk8RD59XG4gKi9cbmV4cG9ydCBjb25zdCBjb3B5ID0gYSA9PiAvKiogQHR5cGUge0FycmF5PEQ+fSAqLyAoYS5zbGljZSgpKVxuXG4vKipcbiAqIEFwcGVuZCBlbGVtZW50cyBmcm9tIHNyYyB0byBkZXN0XG4gKlxuICogQHRlbXBsYXRlIE1cbiAqIEBwYXJhbSB7QXJyYXk8TT59IGRlc3RcbiAqIEBwYXJhbSB7QXJyYXk8TT59IHNyY1xuICovXG5leHBvcnQgY29uc3QgYXBwZW5kVG8gPSAoZGVzdCwgc3JjKSA9PiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3JjLmxlbmd0aDsgaSsrKSB7XG4gICAgZGVzdC5wdXNoKHNyY1tpXSlcbiAgfVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgc29tZXRoaW5nIGFycmF5LWxpa2UgdG8gYW4gYWN0dWFsIEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7QXJyYXlMaWtlPFQ+fEl0ZXJhYmxlPFQ+fSBhcnJheWxpa2VcbiAqIEByZXR1cm4ge1R9XG4gKi9cbmV4cG9ydCBjb25zdCBmcm9tID0gQXJyYXkuZnJvbVxuXG4vKipcbiAqIFRydWUgaWZmIGNvbmRpdGlvbiBob2xkcyBvbiBldmVyeSBlbGVtZW50IGluIHRoZSBBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBJVEVNXG4gKiBAdGVtcGxhdGUge0FycmF5TGlrZTxJVEVNPn0gQVJSXG4gKlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtmdW5jdGlvbihJVEVNLCBudW1iZXIsIEFSUik6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGV2ZXJ5ID0gKGFyciwgZikgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmICghZihhcnJbaV0sIGksIGFycikpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFRydWUgaWZmIGNvbmRpdGlvbiBob2xkcyBvbiBzb21lIGVsZW1lbnQgaW4gdGhlIEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIFNcbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPFM+fSBBUlJcbiAqIEBwYXJhbSB7QVJSfSBhcnJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oUywgbnVtYmVyLCBBUlIpOmJvb2xlYW59IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBzb21lID0gKGFyciwgZikgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChmKGFycltpXSwgaSwgYXJyKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxFTEVNPn0gYVxuICogQHBhcmFtIHtBcnJheUxpa2U8RUxFTT59IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbEZsYXQgPSAoYSwgYikgPT4gYS5sZW5ndGggPT09IGIubGVuZ3RoICYmIGV2ZXJ5KGEsIChpdGVtLCBpbmRleCkgPT4gaXRlbSA9PT0gYltpbmRleF0pXG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqIEBwYXJhbSB7QXJyYXk8QXJyYXk8RUxFTT4+fSBhcnJcbiAqIEByZXR1cm4ge0FycmF5PEVMRU0+fVxuICovXG5leHBvcnQgY29uc3QgZmxhdHRlbiA9IGFyciA9PiBmb2xkKGFyciwgLyoqIEB0eXBlIHtBcnJheTxFTEVNPn0gKi8gKFtdKSwgKGFjYywgdmFsKSA9PiBhY2MuY29uY2F0KHZhbCkpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24obnVtYmVyLCBBcnJheTxUPik6VH0gZlxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmZvbGQgPSAobGVuLCBmKSA9PiB7XG4gIGNvbnN0IGFycmF5ID0gbmV3IEFycmF5KGxlbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGFycmF5W2ldID0gZihpLCBhcnJheSlcbiAgfVxuICByZXR1cm4gYXJyYXlcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHRlbXBsYXRlIFJFU1VMVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcGFyYW0ge1JFU1VMVH0gc2VlZFxuICogQHBhcmFtIHtmdW5jdGlvbihSRVNVTFQsIFQsIG51bWJlcik6UkVTVUxUfSBmb2xkZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGZvbGQgPSAoYXJyLCBzZWVkLCBmb2xkZXIpID0+IGFyci5yZWR1Y2UoZm9sZGVyLCBzZWVkKVxuXG5leHBvcnQgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVuaXF1ZSA9IGFyciA9PiBmcm9tKHNldC5mcm9tKGFycikpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEB0ZW1wbGF0ZSBNXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxUPn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFQpOk19IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmlxdWVCeSA9IChhcnIsIG1hcHBlcikgPT4ge1xuICAvKipcbiAgICogQHR5cGUge1NldDxNPn1cbiAgICovXG4gIGNvbnN0IGhhcHBlbmVkID0gc2V0LmNyZWF0ZSgpXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8VD59XG4gICAqL1xuICBjb25zdCByZXN1bHQgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVsID0gYXJyW2ldXG4gICAgY29uc3QgbWFwcGVkID0gbWFwcGVyKGVsKVxuICAgIGlmICghaGFwcGVuZWQuaGFzKG1hcHBlZCkpIHtcbiAgICAgIGhhcHBlbmVkLmFkZChtYXBwZWQpXG4gICAgICByZXN1bHQucHVzaChlbClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPGFueT59IEFSUlxuICogQHRlbXBsYXRlIHtmdW5jdGlvbihBUlIgZXh0ZW5kcyBBcnJheUxpa2U8aW5mZXIgVD4gPyBUIDogbmV2ZXIsIG51bWJlciwgQVJSKTphbnl9IE1BUFBFUlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtNQVBQRVJ9IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8TUFQUEVSIGV4dGVuZHMgZnVuY3Rpb24oLi4uYW55KTogaW5mZXIgTSA/IE0gOiBuZXZlcj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAoYXJyLCBtYXBwZXIpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgY29uc3QgcmVzID0gQXJyYXkoYXJyLmxlbmd0aClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICByZXNbaV0gPSBtYXBwZXIoLyoqIEB0eXBlIHthbnl9ICovIChhcnJbaV0pLCBpLCAvKiogQHR5cGUge2FueX0gKi8gKGFycikpXG4gIH1cbiAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAocmVzKVxufVxuIiwgIi8qKlxuICogT2JzZXJ2YWJsZSBjbGFzcyBwcm90b3R5cGUuXG4gKlxuICogQG1vZHVsZSBvYnNlcnZhYmxlXG4gKi9cblxuaW1wb3J0ICogYXMgbWFwIGZyb20gJy4vbWFwLmpzJ1xuaW1wb3J0ICogYXMgc2V0IGZyb20gJy4vc2V0LmpzJ1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnLi9hcnJheS5qcydcblxuLyoqXG4gKiBIYW5kbGVzIG5hbWVkIGV2ZW50cy5cbiAqIEBleHBlcmltZW50YWxcbiAqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBhIChiZXR0ZXIgdHlwZWQpIGR1cGxpY2F0ZSBvZiBPYnNlcnZhYmxlLCB3aGljaCB3aWxsIHJlcGxhY2UgT2JzZXJ2YWJsZSBpbiB0aGVcbiAqIG5leHQgcmVsZWFzZS5cbiAqXG4gKiBAdGVtcGxhdGUge3tba2V5IGluIGtleW9mIEVWRU5UU106IGZ1bmN0aW9uKC4uLmFueSk6dm9pZH19IEVWRU5UU1xuICovXG5leHBvcnQgY2xhc3MgT2JzZXJ2YWJsZVYyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIC8qKlxuICAgICAqIFNvbWUgZGVzYy5cbiAgICAgKiBAdHlwZSB7TWFwPHN0cmluZywgU2V0PGFueT4+fVxuICAgICAqL1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSB7a2V5b2YgRVZFTlRTICYgc3RyaW5nfSBOQU1FXG4gICAqIEBwYXJhbSB7TkFNRX0gbmFtZVxuICAgKiBAcGFyYW0ge0VWRU5UU1tOQU1FXX0gZlxuICAgKi9cbiAgb24gKG5hbWUsIGYpIHtcbiAgICBtYXAuc2V0SWZVbmRlZmluZWQodGhpcy5fb2JzZXJ2ZXJzLCAvKiogQHR5cGUge3N0cmluZ30gKi8gKG5hbWUpLCBzZXQuY3JlYXRlKS5hZGQoZilcbiAgICByZXR1cm4gZlxuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSB7a2V5b2YgRVZFTlRTICYgc3RyaW5nfSBOQU1FXG4gICAqIEBwYXJhbSB7TkFNRX0gbmFtZVxuICAgKiBAcGFyYW0ge0VWRU5UU1tOQU1FXX0gZlxuICAgKi9cbiAgb25jZSAobmFtZSwgZikge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSAgey4uLmFueX0gYXJnc1xuICAgICAqL1xuICAgIGNvbnN0IF9mID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMub2ZmKG5hbWUsIC8qKiBAdHlwZSB7YW55fSAqLyAoX2YpKVxuICAgICAgZiguLi5hcmdzKVxuICAgIH1cbiAgICB0aGlzLm9uKG5hbWUsIC8qKiBAdHlwZSB7YW55fSAqLyAoX2YpKVxuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSB7a2V5b2YgRVZFTlRTICYgc3RyaW5nfSBOQU1FXG4gICAqIEBwYXJhbSB7TkFNRX0gbmFtZVxuICAgKiBAcGFyYW0ge0VWRU5UU1tOQU1FXX0gZlxuICAgKi9cbiAgb2ZmIChuYW1lLCBmKSB7XG4gICAgY29uc3Qgb2JzZXJ2ZXJzID0gdGhpcy5fb2JzZXJ2ZXJzLmdldChuYW1lKVxuICAgIGlmIChvYnNlcnZlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgb2JzZXJ2ZXJzLmRlbGV0ZShmKVxuICAgICAgaWYgKG9ic2VydmVycy5zaXplID09PSAwKSB7XG4gICAgICAgIHRoaXMuX29ic2VydmVycy5kZWxldGUobmFtZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW1pdCBhIG5hbWVkIGV2ZW50LiBBbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMgdGhhdCBsaXN0ZW4gdG8gdGhlXG4gICAqIHNwZWNpZmllZCBuYW1lIHdpbGwgcmVjZWl2ZSB0aGUgZXZlbnQuXG4gICAqXG4gICAqIEB0b2RvIFRoaXMgc2hvdWxkIGNhdGNoIGV4Y2VwdGlvbnNcbiAgICpcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lIFRoZSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0ge1BhcmFtZXRlcnM8RVZFTlRTW05BTUVdPn0gYXJncyBUaGUgYXJndW1lbnRzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgZW1pdCAobmFtZSwgYXJncykge1xuICAgIC8vIGNvcHkgYWxsIGxpc3RlbmVycyB0byBhbiBhcnJheSBmaXJzdCB0byBtYWtlIHN1cmUgdGhhdCBubyBldmVudCBpcyBlbWl0dGVkIHRvIGxpc3RlbmVycyB0aGF0IGFyZSBzdWJzY3JpYmVkIHdoaWxlIHRoZSBldmVudCBoYW5kbGVyIGlzIGNhbGxlZC5cbiAgICByZXR1cm4gYXJyYXkuZnJvbSgodGhpcy5fb2JzZXJ2ZXJzLmdldChuYW1lKSB8fCBtYXAuY3JlYXRlKCkpLnZhbHVlcygpKS5mb3JFYWNoKGYgPT4gZiguLi5hcmdzKSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG59XG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBIYW5kbGVzIG5hbWVkIGV2ZW50cy5cbiAqXG4gKiBAZGVwcmVjYXRlZFxuICogQHRlbXBsYXRlIE5cbiAqL1xuZXhwb3J0IGNsYXNzIE9ic2VydmFibGUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogU29tZSBkZXNjLlxuICAgICAqIEB0eXBlIHtNYXA8TiwgYW55Pn1cbiAgICAgKi9cbiAgICB0aGlzLl9vYnNlcnZlcnMgPSBtYXAuY3JlYXRlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge059IG5hbWVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gZlxuICAgKi9cbiAgb24gKG5hbWUsIGYpIHtcbiAgICBtYXAuc2V0SWZVbmRlZmluZWQodGhpcy5fb2JzZXJ2ZXJzLCBuYW1lLCBzZXQuY3JlYXRlKS5hZGQoZilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge059IG5hbWVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gZlxuICAgKi9cbiAgb25jZSAobmFtZSwgZikge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSAgey4uLmFueX0gYXJnc1xuICAgICAqL1xuICAgIGNvbnN0IF9mID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMub2ZmKG5hbWUsIF9mKVxuICAgICAgZiguLi5hcmdzKVxuICAgIH1cbiAgICB0aGlzLm9uKG5hbWUsIF9mKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmXG4gICAqL1xuICBvZmYgKG5hbWUsIGYpIHtcbiAgICBjb25zdCBvYnNlcnZlcnMgPSB0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpXG4gICAgaWYgKG9ic2VydmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBvYnNlcnZlcnMuZGVsZXRlKGYpXG4gICAgICBpZiAob2JzZXJ2ZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzLmRlbGV0ZShuYW1lKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0IGEgbmFtZWQgZXZlbnQuIEFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycyB0aGF0IGxpc3RlbiB0byB0aGVcbiAgICogc3BlY2lmaWVkIG5hbWUgd2lsbCByZWNlaXZlIHRoZSBldmVudC5cbiAgICpcbiAgICogQHRvZG8gVGhpcyBzaG91bGQgY2F0Y2ggZXhjZXB0aW9uc1xuICAgKlxuICAgKiBAcGFyYW0ge059IG5hbWUgVGhlIGV2ZW50IG5hbWUuXG4gICAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gYXJncyBUaGUgYXJndW1lbnRzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgZW1pdCAobmFtZSwgYXJncykge1xuICAgIC8vIGNvcHkgYWxsIGxpc3RlbmVycyB0byBhbiBhcnJheSBmaXJzdCB0byBtYWtlIHN1cmUgdGhhdCBubyBldmVudCBpcyBlbWl0dGVkIHRvIGxpc3RlbmVycyB0aGF0IGFyZSBzdWJzY3JpYmVkIHdoaWxlIHRoZSBldmVudCBoYW5kbGVyIGlzIGNhbGxlZC5cbiAgICByZXR1cm4gYXJyYXkuZnJvbSgodGhpcy5fb2JzZXJ2ZXJzLmdldChuYW1lKSB8fCBtYXAuY3JlYXRlKCkpLnZhbHVlcygpKS5mb3JFYWNoKGYgPT4gZiguLi5hcmdzKSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG59XG4vKiBjOCBpZ25vcmUgZW5kICovXG4iLCAiLyoqXG4gKiBDb21tb24gTWF0aCBleHByZXNzaW9ucy5cbiAqXG4gKiBAbW9kdWxlIG1hdGhcbiAqL1xuXG5leHBvcnQgY29uc3QgZmxvb3IgPSBNYXRoLmZsb29yXG5leHBvcnQgY29uc3QgY2VpbCA9IE1hdGguY2VpbFxuZXhwb3J0IGNvbnN0IGFicyA9IE1hdGguYWJzXG5leHBvcnQgY29uc3QgaW11bCA9IE1hdGguaW11bFxuZXhwb3J0IGNvbnN0IHJvdW5kID0gTWF0aC5yb3VuZFxuZXhwb3J0IGNvbnN0IGxvZzEwID0gTWF0aC5sb2cxMFxuZXhwb3J0IGNvbnN0IGxvZzIgPSBNYXRoLmxvZzJcbmV4cG9ydCBjb25zdCBsb2cgPSBNYXRoLmxvZ1xuZXhwb3J0IGNvbnN0IHNxcnQgPSBNYXRoLnNxcnRcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBhXG4gKiBAcGFyYW0ge251bWJlcn0gYlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgc3VtIG9mIGEgYW5kIGJcbiAqL1xuZXhwb3J0IGNvbnN0IGFkZCA9IChhLCBiKSA9PiBhICsgYlxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBzbWFsbGVyIGVsZW1lbnQgb2YgYSBhbmQgYlxuICovXG5leHBvcnQgY29uc3QgbWluID0gKGEsIGIpID0+IGEgPCBiID8gYSA6IGJcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBhXG4gKiBAcGFyYW0ge251bWJlcn0gYlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgYmlnZ2VyIGVsZW1lbnQgb2YgYSBhbmQgYlxuICovXG5leHBvcnQgY29uc3QgbWF4ID0gKGEsIGIpID0+IGEgPiBiID8gYSA6IGJcblxuZXhwb3J0IGNvbnN0IGlzTmFOID0gTnVtYmVyLmlzTmFOXG5cbmV4cG9ydCBjb25zdCBwb3cgPSBNYXRoLnBvd1xuLyoqXG4gKiBCYXNlIDEwIGV4cG9uZW50aWFsIGZ1bmN0aW9uLiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiAxMCByYWlzZWQgdG8gdGhlIHBvd2VyIG9mIHBvdy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gZXhwXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBleHAxMCA9IGV4cCA9PiBNYXRoLnBvdygxMCwgZXhwKVxuXG5leHBvcnQgY29uc3Qgc2lnbiA9IE1hdGguc2lnblxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBuXG4gKiBAcmV0dXJuIHtib29sZWFufSBXZXRoZXIgbiBpcyBuZWdhdGl2ZS4gVGhpcyBmdW5jdGlvbiBhbHNvIGRpZmZlcmVudGlhdGVzIGJldHdlZW4gLTAgYW5kICswXG4gKi9cbmV4cG9ydCBjb25zdCBpc05lZ2F0aXZlWmVybyA9IG4gPT4gbiAhPT0gMCA/IG4gPCAwIDogMSAvIG4gPCAwXG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogQmluYXJ5IGRhdGEgY29uc3RhbnRzLlxuICpcbiAqIEBtb2R1bGUgYmluYXJ5XG4gKi9cblxuLyoqXG4gKiBuLXRoIGJpdCBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVDEgPSAxXG5leHBvcnQgY29uc3QgQklUMiA9IDJcbmV4cG9ydCBjb25zdCBCSVQzID0gNFxuZXhwb3J0IGNvbnN0IEJJVDQgPSA4XG5leHBvcnQgY29uc3QgQklUNSA9IDE2XG5leHBvcnQgY29uc3QgQklUNiA9IDMyXG5leHBvcnQgY29uc3QgQklUNyA9IDY0XG5leHBvcnQgY29uc3QgQklUOCA9IDEyOFxuZXhwb3J0IGNvbnN0IEJJVDkgPSAyNTZcbmV4cG9ydCBjb25zdCBCSVQxMCA9IDUxMlxuZXhwb3J0IGNvbnN0IEJJVDExID0gMTAyNFxuZXhwb3J0IGNvbnN0IEJJVDEyID0gMjA0OFxuZXhwb3J0IGNvbnN0IEJJVDEzID0gNDA5NlxuZXhwb3J0IGNvbnN0IEJJVDE0ID0gODE5MlxuZXhwb3J0IGNvbnN0IEJJVDE1ID0gMTYzODRcbmV4cG9ydCBjb25zdCBCSVQxNiA9IDMyNzY4XG5leHBvcnQgY29uc3QgQklUMTcgPSA2NTUzNlxuZXhwb3J0IGNvbnN0IEJJVDE4ID0gMSA8PCAxN1xuZXhwb3J0IGNvbnN0IEJJVDE5ID0gMSA8PCAxOFxuZXhwb3J0IGNvbnN0IEJJVDIwID0gMSA8PCAxOVxuZXhwb3J0IGNvbnN0IEJJVDIxID0gMSA8PCAyMFxuZXhwb3J0IGNvbnN0IEJJVDIyID0gMSA8PCAyMVxuZXhwb3J0IGNvbnN0IEJJVDIzID0gMSA8PCAyMlxuZXhwb3J0IGNvbnN0IEJJVDI0ID0gMSA8PCAyM1xuZXhwb3J0IGNvbnN0IEJJVDI1ID0gMSA8PCAyNFxuZXhwb3J0IGNvbnN0IEJJVDI2ID0gMSA8PCAyNVxuZXhwb3J0IGNvbnN0IEJJVDI3ID0gMSA8PCAyNlxuZXhwb3J0IGNvbnN0IEJJVDI4ID0gMSA8PCAyN1xuZXhwb3J0IGNvbnN0IEJJVDI5ID0gMSA8PCAyOFxuZXhwb3J0IGNvbnN0IEJJVDMwID0gMSA8PCAyOVxuZXhwb3J0IGNvbnN0IEJJVDMxID0gMSA8PCAzMFxuZXhwb3J0IGNvbnN0IEJJVDMyID0gMSA8PCAzMVxuXG4vKipcbiAqIEZpcnN0IG4gYml0cyBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMwID0gMFxuZXhwb3J0IGNvbnN0IEJJVFMxID0gMVxuZXhwb3J0IGNvbnN0IEJJVFMyID0gM1xuZXhwb3J0IGNvbnN0IEJJVFMzID0gN1xuZXhwb3J0IGNvbnN0IEJJVFM0ID0gMTVcbmV4cG9ydCBjb25zdCBCSVRTNSA9IDMxXG5leHBvcnQgY29uc3QgQklUUzYgPSA2M1xuZXhwb3J0IGNvbnN0IEJJVFM3ID0gMTI3XG5leHBvcnQgY29uc3QgQklUUzggPSAyNTVcbmV4cG9ydCBjb25zdCBCSVRTOSA9IDUxMVxuZXhwb3J0IGNvbnN0IEJJVFMxMCA9IDEwMjNcbmV4cG9ydCBjb25zdCBCSVRTMTEgPSAyMDQ3XG5leHBvcnQgY29uc3QgQklUUzEyID0gNDA5NVxuZXhwb3J0IGNvbnN0IEJJVFMxMyA9IDgxOTFcbmV4cG9ydCBjb25zdCBCSVRTMTQgPSAxNjM4M1xuZXhwb3J0IGNvbnN0IEJJVFMxNSA9IDMyNzY3XG5leHBvcnQgY29uc3QgQklUUzE2ID0gNjU1MzVcbmV4cG9ydCBjb25zdCBCSVRTMTcgPSBCSVQxOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTggPSBCSVQxOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTkgPSBCSVQyMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjAgPSBCSVQyMSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjEgPSBCSVQyMiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjIgPSBCSVQyMyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjMgPSBCSVQyNCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjQgPSBCSVQyNSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjUgPSBCSVQyNiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjYgPSBCSVQyNyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjcgPSBCSVQyOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjggPSBCSVQyOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjkgPSBCSVQzMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMzAgPSBCSVQzMSAtIDFcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMSA9IDB4N0ZGRkZGRkZcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMiA9IDB4RkZGRkZGRkZcbiIsICIvKipcbiAqIFV0aWxpdHkgaGVscGVycyBmb3Igd29ya2luZyB3aXRoIG51bWJlcnMuXG4gKlxuICogQG1vZHVsZSBudW1iZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICcuL2JpbmFyeS5qcydcblxuZXhwb3J0IGNvbnN0IE1BWF9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxuZXhwb3J0IGNvbnN0IE1JTl9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUlxuXG5leHBvcnQgY29uc3QgTE9XRVNUX0lOVDMyID0gMSA8PCAzMVxuZXhwb3J0IGNvbnN0IEhJR0hFU1RfSU5UMzIgPSBiaW5hcnkuQklUUzMxXG5leHBvcnQgY29uc3QgSElHSEVTVF9VSU5UMzIgPSBiaW5hcnkuQklUUzMyXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCAobnVtID0+IHR5cGVvZiBudW0gPT09ICdudW1iZXInICYmIGlzRmluaXRlKG51bSkgJiYgbWF0aC5mbG9vcihudW0pID09PSBudW0pXG5leHBvcnQgY29uc3QgaXNOYU4gPSBOdW1iZXIuaXNOYU5cbmV4cG9ydCBjb25zdCBwYXJzZUludCA9IE51bWJlci5wYXJzZUludFxuXG4vKipcbiAqIENvdW50IHRoZSBudW1iZXIgb2YgXCIxXCIgYml0cyBpbiBhbiB1bnNpZ25lZCAzMmJpdCBudW1iZXIuXG4gKlxuICogU3VwZXIgZnVuIGJpdGNvdW50IGFsZ29yaXRobSBieSBCcmlhbiBLZXJuaWdoYW4uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqL1xuZXhwb3J0IGNvbnN0IGNvdW50Qml0cyA9IG4gPT4ge1xuICBuICY9IGJpbmFyeS5CSVRTMzJcbiAgbGV0IGNvdW50ID0gMFxuICB3aGlsZSAobikge1xuICAgIG4gJj0gKG4gLSAxKVxuICAgIGNvdW50KytcbiAgfVxuICByZXR1cm4gY291bnRcbn1cbiIsICJpbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuXG4vKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBzdHJpbmdzLlxuICpcbiAqIEBtb2R1bGUgc3RyaW5nXG4gKi9cblxuZXhwb3J0IGNvbnN0IGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGVcbmV4cG9ydCBjb25zdCBmcm9tQ29kZVBvaW50ID0gU3RyaW5nLmZyb21Db2RlUG9pbnRcblxuLyoqXG4gKiBUaGUgbGFyZ2VzdCB1dGYxNiBjaGFyYWN0ZXIuXG4gKiBDb3JyZXNwb25kcyB0byBVaW50OEFycmF5KFsyNTUsIDI1NV0pIG9yIGNoYXJjb2Rlb2YoMngyXjgpXG4gKi9cbmV4cG9ydCBjb25zdCBNQVhfVVRGMTZfQ0hBUkFDVEVSID0gZnJvbUNoYXJDb2RlKDY1NTM1KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmNvbnN0IHRvTG93ZXJDYXNlID0gcyA9PiBzLnRvTG93ZXJDYXNlKClcblxuY29uc3QgdHJpbUxlZnRSZWdleCA9IC9eXFxzKi9nXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHRyaW1MZWZ0ID0gcyA9PiBzLnJlcGxhY2UodHJpbUxlZnRSZWdleCwgJycpXG5cbmNvbnN0IGZyb21DYW1lbENhc2VSZWdleCA9IC8oW0EtWl0pL2dcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHBhcmFtIHtzdHJpbmd9IHNlcGFyYXRvclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgZnJvbUNhbWVsQ2FzZSA9IChzLCBzZXBhcmF0b3IpID0+IHRyaW1MZWZ0KHMucmVwbGFjZShmcm9tQ2FtZWxDYXNlUmVnZXgsIG1hdGNoID0+IGAke3NlcGFyYXRvcn0ke3RvTG93ZXJDYXNlKG1hdGNoKX1gKSlcblxuLyoqXG4gKiBDb21wdXRlIHRoZSB1dGY4Qnl0ZUxlbmd0aFxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgdXRmOEJ5dGVMZW5ndGggPSBzdHIgPT4gdW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikpLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBfZW5jb2RlVXRmOFBvbHlmaWxsID0gc3RyID0+IHtcbiAgY29uc3QgZW5jb2RlZFN0cmluZyA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKVxuICBjb25zdCBsZW4gPSBlbmNvZGVkU3RyaW5nLmxlbmd0aFxuICBjb25zdCBidWYgPSBuZXcgVWludDhBcnJheShsZW4pXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBidWZbaV0gPSAvKiogQHR5cGUge251bWJlcn0gKi8gKGVuY29kZWRTdHJpbmcuY29kZVBvaW50QXQoaSkpXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHV0ZjhUZXh0RW5jb2RlciA9IC8qKiBAdHlwZSB7VGV4dEVuY29kZXJ9ICovICh0eXBlb2YgVGV4dEVuY29kZXIgIT09ICd1bmRlZmluZWQnID8gbmV3IFRleHRFbmNvZGVyKCkgOiBudWxsKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBfZW5jb2RlVXRmOE5hdGl2ZSA9IHN0ciA9PiB1dGY4VGV4dEVuY29kZXIuZW5jb2RlKHN0cilcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZVV0ZjggPSB1dGY4VGV4dEVuY29kZXIgPyBfZW5jb2RlVXRmOE5hdGl2ZSA6IF9lbmNvZGVVdGY4UG9seWZpbGxcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgX2RlY29kZVV0ZjhQb2x5ZmlsbCA9IGJ1ZiA9PiB7XG4gIGxldCByZW1haW5pbmdMZW4gPSBidWYubGVuZ3RoXG4gIGxldCBlbmNvZGVkU3RyaW5nID0gJydcbiAgbGV0IGJ1ZlBvcyA9IDBcbiAgd2hpbGUgKHJlbWFpbmluZ0xlbiA+IDApIHtcbiAgICBjb25zdCBuZXh0TGVuID0gcmVtYWluaW5nTGVuIDwgMTAwMDAgPyByZW1haW5pbmdMZW4gOiAxMDAwMFxuICAgIGNvbnN0IGJ5dGVzID0gYnVmLnN1YmFycmF5KGJ1ZlBvcywgYnVmUG9zICsgbmV4dExlbilcbiAgICBidWZQb3MgKz0gbmV4dExlblxuICAgIC8vIFN0YXJ0aW5nIHdpdGggRVM1LjEgd2UgY2FuIHN1cHBseSBhIGdlbmVyaWMgYXJyYXktbGlrZSBvYmplY3QgYXMgYXJndW1lbnRzXG4gICAgZW5jb2RlZFN0cmluZyArPSBTdHJpbmcuZnJvbUNvZGVQb2ludC5hcHBseShudWxsLCAvKiogQHR5cGUge2FueX0gKi8gKGJ5dGVzKSlcbiAgICByZW1haW5pbmdMZW4gLT0gbmV4dExlblxuICB9XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKGVuY29kZWRTdHJpbmcpKVxufVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGxldCB1dGY4VGV4dERlY29kZXIgPSB0eXBlb2YgVGV4dERlY29kZXIgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IG5ldyBUZXh0RGVjb2RlcigndXRmLTgnLCB7IGZhdGFsOiB0cnVlLCBpZ25vcmVCT006IHRydWUgfSlcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5pZiAodXRmOFRleHREZWNvZGVyICYmIHV0ZjhUZXh0RGVjb2Rlci5kZWNvZGUobmV3IFVpbnQ4QXJyYXkoKSkubGVuZ3RoID09PSAxKSB7XG4gIC8vIFNhZmFyaSBkb2Vzbid0IGhhbmRsZSBCT00gY29ycmVjdGx5LlxuICAvLyBUaGlzIGZpeGVzIGEgYnVnIGluIFNhZmFyaSAxMy4wLjUgd2hlcmUgaXQgcHJvZHVjZXMgYSBCT00gdGhlIGZpcnN0IHRpbWUgaXQgaXMgY2FsbGVkLlxuICAvLyB1dGY4VGV4dERlY29kZXIuZGVjb2RlKG5ldyBVaW50OEFycmF5KCkpLmxlbmd0aCA9PT0gMSBvbiB0aGUgZmlyc3QgY2FsbCBhbmRcbiAgLy8gdXRmOFRleHREZWNvZGVyLmRlY29kZShuZXcgVWludDhBcnJheSgpKS5sZW5ndGggPT09IDEgb24gdGhlIHNlY29uZCBjYWxsXG4gIC8vIEFub3RoZXIgaXNzdWUgaXMgdGhhdCBmcm9tIHRoZW4gb24gbm8gQk9NIGNoYXJzIGFyZSByZWNvZ25pemVkIGFueW1vcmVcbiAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgdXRmOFRleHREZWNvZGVyID0gbnVsbFxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgX2RlY29kZVV0ZjhOYXRpdmUgPSBidWYgPT4gLyoqIEB0eXBlIHtUZXh0RGVjb2Rlcn0gKi8gKHV0ZjhUZXh0RGVjb2RlcikuZGVjb2RlKGJ1ZilcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGRlY29kZVV0ZjggPSB1dGY4VGV4dERlY29kZXIgPyBfZGVjb2RlVXRmOE5hdGl2ZSA6IF9kZWNvZGVVdGY4UG9seWZpbGxcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIFRoZSBpbml0aWFsIHN0cmluZ1xuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFN0YXJ0aW5nIHBvc2l0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gcmVtb3ZlIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRvIHJlbW92ZVxuICogQHBhcmFtIHtzdHJpbmd9IGluc2VydCBOZXcgY29udGVudCB0byBpbnNlcnRcbiAqL1xuZXhwb3J0IGNvbnN0IHNwbGljZSA9IChzdHIsIGluZGV4LCByZW1vdmUsIGluc2VydCA9ICcnKSA9PiBzdHIuc2xpY2UoMCwgaW5kZXgpICsgaW5zZXJ0ICsgc3RyLnNsaWNlKGluZGV4ICsgcmVtb3ZlKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBuXG4gKi9cbmV4cG9ydCBjb25zdCByZXBlYXQgPSAoc291cmNlLCBuKSA9PiBhcnJheS51bmZvbGQobiwgKCkgPT4gc291cmNlKS5qb2luKCcnKVxuIiwgIi8qKlxuICogRWZmaWNpZW50IHNjaGVtYS1sZXNzIGJpbmFyeSBlbmNvZGluZyB3aXRoIHN1cHBvcnQgZm9yIHZhcmlhYmxlIGxlbmd0aCBlbmNvZGluZy5cbiAqXG4gKiBVc2UgW2xpYjAvZW5jb2RpbmddIHdpdGggW2xpYjAvZGVjb2RpbmddLiBFdmVyeSBlbmNvZGluZyBmdW5jdGlvbiBoYXMgYSBjb3JyZXNwb25kaW5nIGRlY29kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEVuY29kZXMgbnVtYmVycyBpbiBsaXR0bGUtZW5kaWFuIG9yZGVyIChsZWFzdCB0byBtb3N0IHNpZ25pZmljYW50IGJ5dGUgb3JkZXIpXG4gKiBhbmQgaXMgY29tcGF0aWJsZSB3aXRoIEdvbGFuZydzIGJpbmFyeSBlbmNvZGluZyAoaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9lbmNvZGluZy9iaW5hcnkvKVxuICogd2hpY2ggaXMgYWxzbyB1c2VkIGluIFByb3RvY29sIEJ1ZmZlcnMuXG4gKlxuICogYGBganNcbiAqIC8vIGVuY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAqIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCAyNTYpXG4gKiBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyLCAnSGVsbG8gd29ybGQhJylcbiAqIGNvbnN0IGJ1ZiA9IGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyKVxuICogYGBgXG4gKlxuICogYGBganNcbiAqIC8vIGRlY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGRlY29kZXIgPSBkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZilcbiAqIGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpIC8vID0+IDI1NlxuICogZGVjb2RpbmcucmVhZFZhclN0cmluZyhkZWNvZGVyKSAvLyA9PiAnSGVsbG8gd29ybGQhJ1xuICogZGVjb2RpbmcuaGFzQ29udGVudChkZWNvZGVyKSAvLyA9PiBmYWxzZSAtIGFsbCBkYXRhIGlzIHJlYWRcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGUgZW5jb2RpbmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIG51bWJlciBmcm9tICcuL251bWJlci5qcydcbmltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICcuL2JpbmFyeS5qcydcbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJy4vYXJyYXkuanMnXG5cbi8qKlxuICogQSBCaW5hcnlFbmNvZGVyIGhhbmRsZXMgdGhlIGVuY29kaW5nIHRvIGFuIFVpbnQ4QXJyYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBFbmNvZGVyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuY3BvcyA9IDBcbiAgICB0aGlzLmNidWYgPSBuZXcgVWludDhBcnJheSgxMDApXG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PFVpbnQ4QXJyYXk+fVxuICAgICAqL1xuICAgIHRoaXMuYnVmcyA9IFtdXG4gIH1cbn1cblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEByZXR1cm4ge0VuY29kZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVFbmNvZGVyID0gKCkgPT4gbmV3IEVuY29kZXIoKVxuXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oRW5jb2Rlcik6dm9pZH0gZlxuICovXG5leHBvcnQgY29uc3QgZW5jb2RlID0gKGYpID0+IHtcbiAgY29uc3QgZW5jb2RlciA9IGNyZWF0ZUVuY29kZXIoKVxuICBmKGVuY29kZXIpXG4gIHJldHVybiB0b1VpbnQ4QXJyYXkoZW5jb2Rlcilcbn1cblxuLyoqXG4gKiBUaGUgY3VycmVudCBsZW5ndGggb2YgdGhlIGVuY29kZWQgZGF0YS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgbGVuZ3RoID0gZW5jb2RlciA9PiB7XG4gIGxldCBsZW4gPSBlbmNvZGVyLmNwb3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVyLmJ1ZnMubGVuZ3RoOyBpKyspIHtcbiAgICBsZW4gKz0gZW5jb2Rlci5idWZzW2ldLmxlbmd0aFxuICB9XG4gIHJldHVybiBsZW5cbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGVuY29kZXIgaXMgZW1wdHkuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBoYXNDb250ZW50ID0gZW5jb2RlciA9PiBlbmNvZGVyLmNwb3MgPiAwIHx8IGVuY29kZXIuYnVmcy5sZW5ndGggPiAwXG5cbi8qKlxuICogVHJhbnNmb3JtIHRvIFVpbnQ4QXJyYXkuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IFRoZSBjcmVhdGVkIEFycmF5QnVmZmVyLlxuICovXG5leHBvcnQgY29uc3QgdG9VaW50OEFycmF5ID0gZW5jb2RlciA9PiB7XG4gIGNvbnN0IHVpbnQ4YXJyID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKGVuY29kZXIpKVxuICBsZXQgY3VyUG9zID0gMFxuICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZXIuYnVmcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGQgPSBlbmNvZGVyLmJ1ZnNbaV1cbiAgICB1aW50OGFyci5zZXQoZCwgY3VyUG9zKVxuICAgIGN1clBvcyArPSBkLmxlbmd0aFxuICB9XG4gIHVpbnQ4YXJyLnNldChuZXcgVWludDhBcnJheShlbmNvZGVyLmNidWYuYnVmZmVyLCAwLCBlbmNvZGVyLmNwb3MpLCBjdXJQb3MpXG4gIHJldHVybiB1aW50OGFyclxufVxuXG4vKipcbiAqIFZlcmlmeSB0aGF0IGl0IGlzIHBvc3NpYmxlIHRvIHdyaXRlIGBsZW5gIGJ5dGVzIHd0aWhvdXQgY2hlY2tpbmcuIElmXG4gKiBuZWNlc3NhcnksIGEgbmV3IEJ1ZmZlciB3aXRoIHRoZSByZXF1aXJlZCBsZW5ndGggaXMgYXR0YWNoZWQuXG4gKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKi9cbmV4cG9ydCBjb25zdCB2ZXJpZnlMZW4gPSAoZW5jb2RlciwgbGVuKSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgaWYgKGJ1ZmZlckxlbiAtIGVuY29kZXIuY3BvcyA8IGxlbikge1xuICAgIGVuY29kZXIuYnVmcy5wdXNoKG5ldyBVaW50OEFycmF5KGVuY29kZXIuY2J1Zi5idWZmZXIsIDAsIGVuY29kZXIuY3BvcykpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkobWF0aC5tYXgoYnVmZmVyTGVuLCBsZW4pICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSB0byB0aGUgZW5jb2Rlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgYnl0ZSB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZSA9IChlbmNvZGVyLCBudW0pID0+IHtcbiAgY29uc3QgYnVmZmVyTGVuID0gZW5jb2Rlci5jYnVmLmxlbmd0aFxuICBpZiAoZW5jb2Rlci5jcG9zID09PSBidWZmZXJMZW4pIHtcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyTGVuICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbiAgZW5jb2Rlci5jYnVmW2VuY29kZXIuY3BvcysrXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGF0IGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gKiBQb3NpdGlvbiBtdXN0IGFscmVhZHkgYmUgd3JpdHRlbiAoaS5lLiBlbmNvZGVyLmxlbmd0aCA+IHBvcylcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBQb3NpdGlvbiB0byB3aGljaCB0byB3cml0ZSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHNldCA9IChlbmNvZGVyLCBwb3MsIG51bSkgPT4ge1xuICBsZXQgYnVmZmVyID0gbnVsbFxuICAvLyBpdGVyYXRlIGFsbCBidWZmZXJzIGFuZCBhZGp1c3QgcG9zaXRpb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVyLmJ1ZnMubGVuZ3RoICYmIGJ1ZmZlciA9PT0gbnVsbDsgaSsrKSB7XG4gICAgY29uc3QgYiA9IGVuY29kZXIuYnVmc1tpXVxuICAgIGlmIChwb3MgPCBiLmxlbmd0aCkge1xuICAgICAgYnVmZmVyID0gYiAvLyBmb3VuZCBidWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgcG9zIC09IGIubGVuZ3RoXG4gICAgfVxuICB9XG4gIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAvLyB1c2UgY3VycmVudCBidWZmZXJcbiAgICBidWZmZXIgPSBlbmNvZGVyLmNidWZcbiAgfVxuICBidWZmZXJbcG9zXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGFzIGFuIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVVpbnQ4ID0gd3JpdGVcblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSBhcyBhbiB1bnNpZ25lZCBJbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50OCA9IHNldFxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVVaW50MTYgPSAoZW5jb2RlciwgbnVtKSA9PiB7XG4gIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgd3JpdGUoZW5jb2RlciwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MTYgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgc2V0KGVuY29kZXIsIHBvcywgbnVtICYgYmluYXJ5LkJJVFM4KVxuICBzZXQoZW5jb2RlciwgcG9zICsgMSwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG5cbi8qKlxuICogV3JpdGUgdHdvIGJ5dGVzIGFzIGFuIHVuc2lnbmVkIGludGVnZXJcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgICBudW0gPj4+PSA4XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSB0d28gYnl0ZXMgYXMgYW4gdW5zaWduZWQgaW50ZWdlciBpbiBiaWcgZW5kaWFuIG9yZGVyLlxuICogKG1vc3Qgc2lnbmlmaWNhbnQgYnl0ZSBmaXJzdClcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyQmlnRW5kaWFuID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMzsgaSA+PSAwOyBpLS0pIHtcbiAgICB3cml0ZShlbmNvZGVyLCAobnVtID4+PiAoOCAqIGkpKSAmIGJpbmFyeS5CSVRTOClcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MzIgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICBzZXQoZW5jb2RlciwgcG9zICsgaSwgbnVtICYgYmluYXJ5LkJJVFM4KVxuICAgIG51bSA+Pj49IDhcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHVuc2lnbmVkIGludGVnZXIuIE1heCBlbmNvZGFibGUgaW50ZWdlciBpcyAyXjUzLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVWYXJVaW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICB3aGlsZSAobnVtID4gYmluYXJ5LkJJVFM3KSB7XG4gICAgd3JpdGUoZW5jb2RlciwgYmluYXJ5LkJJVDggfCAoYmluYXJ5LkJJVFM3ICYgbnVtKSlcbiAgICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDEyOCkgLy8gc2hpZnQgPj4+IDdcbiAgfVxuICB3cml0ZShlbmNvZGVyLCBiaW5hcnkuQklUUzcgJiBudW0pXG59XG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlci5cbiAqXG4gKiBXZSB1c2UgdGhlIDd0aCBiaXQgaW5zdGVhZCBmb3Igc2lnbmFsaW5nIHRoYXQgdGhpcyBpcyBhIG5lZ2F0aXZlIG51bWJlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFySW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyhudW0pXG4gIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgbnVtID0gLW51bVxuICB9XG4gIC8vICAgICAgICAgICAgIHwtIHdoZXRoZXIgdG8gY29udGludWUgcmVhZGluZyAgICAgICAgIHwtIHdoZXRoZXIgaXMgbmVnYXRpdmUgICAgIHwtIG51bWJlclxuICB3cml0ZShlbmNvZGVyLCAobnVtID4gYmluYXJ5LkJJVFM2ID8gYmluYXJ5LkJJVDggOiAwKSB8IChpc05lZ2F0aXZlID8gYmluYXJ5LkJJVDcgOiAwKSB8IChiaW5hcnkuQklUUzYgJiBudW0pKVxuICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDY0KSAvLyBzaGlmdCA+Pj4gNlxuICAvLyBXZSBkb24ndCBuZWVkIHRvIGNvbnNpZGVyIHRoZSBjYXNlIG9mIG51bSA9PT0gMCBzbyB3ZSBjYW4gdXNlIGEgZGlmZmVyZW50XG4gIC8vIHBhdHRlcm4gaGVyZSB0aGFuIGFib3ZlLlxuICB3aGlsZSAobnVtID4gMCkge1xuICAgIHdyaXRlKGVuY29kZXIsIChudW0gPiBiaW5hcnkuQklUUzcgPyBiaW5hcnkuQklUOCA6IDApIHwgKGJpbmFyeS5CSVRTNyAmIG51bSkpXG4gICAgbnVtID0gbWF0aC5mbG9vcihudW0gLyAxMjgpIC8vIHNoaWZ0ID4+PiA3XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNhY2hlIHRvIHN0b3JlIHN0cmluZ3MgdGVtcG9yYXJpbHlcbiAqL1xuY29uc3QgX3N0ckJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDMwMDAwKVxuY29uc3QgX21heFN0ckJTaXplID0gX3N0ckJ1ZmZlci5sZW5ndGggLyAzXG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggc3RyaW5nLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3QgX3dyaXRlVmFyU3RyaW5nTmF0aXZlID0gKGVuY29kZXIsIHN0cikgPT4ge1xuICBpZiAoc3RyLmxlbmd0aCA8IF9tYXhTdHJCU2l6ZSkge1xuICAgIC8vIFdlIGNhbiBlbmNvZGUgdGhlIHN0cmluZyBpbnRvIHRoZSBleGlzdGluZyBidWZmZXJcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgIGNvbnN0IHdyaXR0ZW4gPSBzdHJpbmcudXRmOFRleHRFbmNvZGVyLmVuY29kZUludG8oc3RyLCBfc3RyQnVmZmVyKS53cml0dGVuIHx8IDBcbiAgICB3cml0ZVZhclVpbnQoZW5jb2Rlciwgd3JpdHRlbilcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdyaXR0ZW47IGkrKykge1xuICAgICAgd3JpdGUoZW5jb2RlciwgX3N0ckJ1ZmZlcltpXSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHN0cmluZy5lbmNvZGVVdGY4KHN0cikpXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBhIHZhcmlhYmxlIGxlbmd0aCBzdHJpbmcuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbCA9IChlbmNvZGVyLCBzdHIpID0+IHtcbiAgY29uc3QgZW5jb2RlZFN0cmluZyA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKVxuICBjb25zdCBsZW4gPSBlbmNvZGVkU3RyaW5nLmxlbmd0aFxuICB3cml0ZVZhclVpbnQoZW5jb2RlciwgbGVuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgd3JpdGUoZW5jb2RlciwgLyoqIEB0eXBlIHtudW1iZXJ9ICovIChlbmNvZGVkU3RyaW5nLmNvZGVQb2ludEF0KGkpKSlcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHN0cmluZy5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB3cml0ZVZhclN0cmluZyA9IChzdHJpbmcudXRmOFRleHRFbmNvZGVyICYmIC8qKiBAdHlwZSB7YW55fSAqLyAoc3RyaW5nLnV0ZjhUZXh0RW5jb2RlcikuZW5jb2RlSW50bykgPyBfd3JpdGVWYXJTdHJpbmdOYXRpdmUgOiBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbFxuXG4vKipcbiAqIFdyaXRlIGEgc3RyaW5nIHRlcm1pbmF0ZWQgYnkgYSBzcGVjaWFsIGJ5dGUgc2VxdWVuY2UuIFRoaXMgaXMgbm90IHZlcnkgcGVyZm9ybWFudCBhbmQgaXNcbiAqIGdlbmVyYWxseSBkaXNjb3VyYWdlZC4gSG93ZXZlciwgdGhlIHJlc3VsdGluZyBieXRlIGFycmF5cyBhcmUgbGV4aW9ncmFwaGljYWxseSBvcmRlcmVkIHdoaWNoXG4gKiBtYWtlcyB0aGlzIGEgbmljZSBmZWF0dXJlIGZvciBkYXRhYmFzZXMuXG4gKlxuICogVGhlIHN0cmluZyB3aWxsIGJlIGVuY29kZWQgdXNpbmcgdXRmOCBhbmQgdGhlbiB0ZXJtaW5hdGVkIGFuZCBlc2NhcGVkIHVzaW5nIHdyaXRlVGVybWluYXRpbmdVaW50OEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkU3RyaW5nID0gKGVuY29kZXIsIHN0cikgPT5cbiAgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheShlbmNvZGVyLCBzdHJpbmcuZW5jb2RlVXRmOChzdHIpKVxuXG4vKipcbiAqIFdyaXRlIGEgdGVybWluYXRpbmcgVWludDhBcnJheS4gTm90ZSB0aGF0IHRoaXMgaXMgbm90IHBlcmZvcm1hbnQgYW5kIGlzIGdlbmVyYWxseVxuICogZGlzY291cmFnZWQuIFRoZXJlIGFyZSBmZXcgc2l0dWF0aW9ucyB3aGVuIHRoaXMgaXMgbmVlZGVkLlxuICpcbiAqIFdlIHVzZSAweDAgYXMgYSB0ZXJtaW5hdGluZyBjaGFyYWN0ZXIuIDB4MSBzZXJ2ZXMgYXMgYW4gZXNjYXBlIGNoYXJhY3RlciBmb3IgMHgwIGFuZCAweDEuXG4gKlxuICogRXhhbXBsZTogWzAsMSwyXSBpcyBlbmNvZGVkIHRvIFsxLDAsMSwxLDIsMF0uIDB4MCwgYW5kIDB4MSBuZWVkZWQgdG8gYmUgZXNjYXBlZCB1c2luZyAweDEuIFRoZW5cbiAqIHRoZSByZXN1bHQgaXMgdGVybWluYXRlZCB1c2luZyB0aGUgMHgwIGNoYXJhY3Rlci5cbiAqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBob3cgbWFueSBzeXN0ZW1zIGltcGxlbWVudCBudWxsIHRlcm1pbmF0ZWQgc3RyaW5ncy4gSG93ZXZlciwgd2UgdXNlIGFuIGVzY2FwZVxuICogY2hhcmFjdGVyIDB4MSB0byBhdm9pZCBpc3N1ZXMgYW5kIHBvdGVuaWFsIGF0dGFja3Mgb24gb3VyIGRhdGFiYXNlIChpZiB0aGlzIGlzIHVzZWQgYXMgYSBrZXlcbiAqIGVuY29kZXIgZm9yIE5vU3FsIGRhdGFiYXNlcykuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheSA9IChlbmNvZGVyLCBidWYpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWYubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBiID0gYnVmW2ldXG4gICAgaWYgKGIgPT09IDAgfHwgYiA9PT0gMSkge1xuICAgICAgd3JpdGUoZW5jb2RlciwgMSlcbiAgICB9XG4gICAgd3JpdGUoZW5jb2RlciwgYnVmW2ldKVxuICB9XG4gIHdyaXRlKGVuY29kZXIsIDApXG59XG5cbi8qKlxuICogV3JpdGUgdGhlIGNvbnRlbnQgb2YgYW5vdGhlciBFbmNvZGVyLlxuICpcbiAqIEBUT0RPOiBjYW4gYmUgaW1wcm92ZWQhXG4gKiAgICAgICAgLSBOb3RlOiBTaG91bGQgY29uc2lkZXIgdGhhdCB3aGVuIGFwcGVuZGluZyBhIGxvdCBvZiBzbWFsbCBFbmNvZGVycywgd2Ugc2hvdWxkIHJhdGhlciBjbG9uZSB0aGFuIHJlZmVyZW5jaW5nIHRoZSBvbGQgc3RydWN0dXJlLlxuICogICAgICAgICAgICAgICAgRW5jb2RlcnMgc3RhcnQgd2l0aCBhIHJhdGhlciBiaWcgaW5pdGlhbCBidWZmZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXIgVGhlIGVuVWludDhBcnJcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gYXBwZW5kIFRoZSBCaW5hcnlFbmNvZGVyIHRvIGJlIHdyaXR0ZW4uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUJpbmFyeUVuY29kZXIgPSAoZW5jb2RlciwgYXBwZW5kKSA9PiB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdG9VaW50OEFycmF5KGFwcGVuZCkpXG5cbi8qKlxuICogQXBwZW5kIGZpeGVkLWxlbmd0aCBVaW50OEFycmF5IHRvIHRoZSBlbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgY29uc3QgY3BvcyA9IGVuY29kZXIuY3Bvc1xuICBjb25zdCBsZWZ0Q29weUxlbiA9IG1hdGgubWluKGJ1ZmZlckxlbiAtIGNwb3MsIHVpbnQ4QXJyYXkubGVuZ3RoKVxuICBjb25zdCByaWdodENvcHlMZW4gPSB1aW50OEFycmF5Lmxlbmd0aCAtIGxlZnRDb3B5TGVuXG4gIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheSgwLCBsZWZ0Q29weUxlbiksIGNwb3MpXG4gIGVuY29kZXIuY3BvcyArPSBsZWZ0Q29weUxlblxuICBpZiAocmlnaHRDb3B5TGVuID4gMCkge1xuICAgIC8vIFN0aWxsIHNvbWV0aGluZyB0byB3cml0ZSwgd3JpdGUgcmlnaHQgaGFsZi4uXG4gICAgLy8gQXBwZW5kIG5ldyBidWZmZXJcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgLy8gbXVzdCBoYXZlIGF0IGxlYXN0IHNpemUgb2YgcmVtYWluaW5nIGJ1ZmZlclxuICAgIGVuY29kZXIuY2J1ZiA9IG5ldyBVaW50OEFycmF5KG1hdGgubWF4KGJ1ZmZlckxlbiAqIDIsIHJpZ2h0Q29weUxlbikpXG4gICAgLy8gY29weSBhcnJheVxuICAgIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheShsZWZ0Q29weUxlbikpXG4gICAgZW5jb2Rlci5jcG9zID0gcmlnaHRDb3B5TGVuXG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmQgYW4gVWludDhBcnJheSB0byBFbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFyVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIHdyaXRlVmFyVWludChlbmNvZGVyLCB1aW50OEFycmF5LmJ5dGVMZW5ndGgpXG4gIHdyaXRlVWludDhBcnJheShlbmNvZGVyLCB1aW50OEFycmF5KVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBEYXRhVmlldyBvZiB0aGUgbmV4dCBgbGVuYCBieXRlcy4gVXNlIGl0IHRvIHdyaXRlIGRhdGEgYWZ0ZXJcbiAqIGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cbiAqXG4gKiBgYGBqc1xuICogLy8gd3JpdGUgZmxvYXQzMiB1c2luZyBEYXRhVmlld1xuICogY29uc3QgZHYgPSB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LnNldEZsb2F0MzIoMCwgMS4xKVxuICogLy8gcmVhZCBmbG9hdDMyIHVzaW5nIERhdGFWaWV3XG4gKiBjb25zdCBkdiA9IHJlYWRGcm9tRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LmdldEZsb2F0MzIoMCkgLy8gPT4gMS4xMDAwMDAwMjM4NDE4NTggKGxlYXZpbmcgaXQgdG8gdGhlIHJlYWRlciB0byBmaW5kIG91dCB3aHkgdGhpcyBpcyB0aGUgY29ycmVjdCByZXN1bHQpXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEByZXR1cm4ge0RhdGFWaWV3fVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVPbkRhdGFWaWV3ID0gKGVuY29kZXIsIGxlbikgPT4ge1xuICB2ZXJpZnlMZW4oZW5jb2RlciwgbGVuKVxuICBjb25zdCBkdmlldyA9IG5ldyBEYXRhVmlldyhlbmNvZGVyLmNidWYuYnVmZmVyLCBlbmNvZGVyLmNwb3MsIGxlbilcbiAgZW5jb2Rlci5jcG9zICs9IGxlblxuICByZXR1cm4gZHZpZXdcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlRmxvYXQzMiA9IChlbmNvZGVyLCBudW0pID0+IHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA0KS5zZXRGbG9hdDMyKDAsIG51bSwgZmFsc2UpXG5cbi8qKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUZsb2F0NjQgPSAoZW5jb2RlciwgbnVtKSA9PiB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgOCkuc2V0RmxvYXQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdJbnQ2NCA9IChlbmNvZGVyLCBudW0pID0+IC8qKiBAdHlwZSB7YW55fSAqLyAod3JpdGVPbkRhdGFWaWV3KGVuY29kZXIsIDgpKS5zZXRCaWdJbnQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdVaW50NjQgPSAoZW5jb2RlciwgbnVtKSA9PiAvKiogQHR5cGUge2FueX0gKi8gKHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA4KSkuc2V0QmlnVWludDY0KDAsIG51bSwgZmFsc2UpXG5cbmNvbnN0IGZsb2F0VGVzdEJlZCA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoNCkpXG4vKipcbiAqIENoZWNrIGlmIGEgbnVtYmVyIGNhbiBiZSBlbmNvZGVkIGFzIGEgMzIgYml0IGZsb2F0LlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzRmxvYXQzMiA9IG51bSA9PiB7XG4gIGZsb2F0VGVzdEJlZC5zZXRGbG9hdDMyKDAsIG51bSlcbiAgcmV0dXJuIGZsb2F0VGVzdEJlZC5nZXRGbG9hdDMyKDApID09PSBudW1cbn1cblxuLyoqXG4gKiBFbmNvZGUgZGF0YSB3aXRoIGVmZmljaWVudCBiaW5hcnkgZm9ybWF0LlxuICpcbiAqIERpZmZlcmVuY2VzIHRvIEpTT046XG4gKiBcdTIwMjIgVHJhbnNmb3JtcyBkYXRhIHRvIGEgYmluYXJ5IGZvcm1hdCAobm90IHRvIGEgc3RyaW5nKVxuICogXHUyMDIyIEVuY29kZXMgdW5kZWZpbmVkLCBOYU4sIGFuZCBBcnJheUJ1ZmZlciAodGhlc2UgY2FuJ3QgYmUgcmVwcmVzZW50ZWQgaW4gSlNPTilcbiAqIFx1MjAyMiBOdW1iZXJzIGFyZSBlZmZpY2llbnRseSBlbmNvZGVkIGVpdGhlciBhcyBhIHZhcmlhYmxlIGxlbmd0aCBpbnRlZ2VyLCBhcyBhXG4gKiAgIDMyIGJpdCBmbG9hdCwgYXMgYSA2NCBiaXQgZmxvYXQsIG9yIGFzIGEgNjQgYml0IGJpZ2ludC5cbiAqXG4gKiBFbmNvZGluZyB0YWJsZTpcbiAqXG4gKiB8IERhdGEgVHlwZSAgICAgICAgICAgfCBQcmVmaXggICB8IEVuY29kaW5nIE1ldGhvZCAgICB8IENvbW1lbnQgfFxuICogfCAtLS0tLS0tLS0tLS0tLS0tLS0tIHwgLS0tLS0tLS0gfCAtLS0tLS0tLS0tLS0tLS0tLS0gfCAtLS0tLS0tIHxcbiAqIHwgdW5kZWZpbmVkICAgICAgICAgICB8IDEyNyAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgRnVuY3Rpb25zLCBzeW1ib2wsIGFuZCBldmVyeXRoaW5nIHRoYXQgY2Fubm90IGJlIGlkZW50aWZpZWQgaXMgZW5jb2RlZCBhcyB1bmRlZmluZWQgfFxuICogfCBudWxsICAgICAgICAgICAgICAgIHwgMTI2ICAgICAgfCAgICAgICAgICAgICAgICAgICAgfCB8XG4gKiB8IGludGVnZXIgICAgICAgICAgICAgfCAxMjUgICAgICB8IHdyaXRlVmFySW50ICAgICAgICB8IE9ubHkgZW5jb2RlcyAzMiBiaXQgc2lnbmVkIGludGVnZXJzIHxcbiAqIHwgZmxvYXQzMiAgICAgICAgICAgICB8IDEyNCAgICAgIHwgd3JpdGVGbG9hdDMyICAgICAgIHwgfFxuICogfCBmbG9hdDY0ICAgICAgICAgICAgIHwgMTIzICAgICAgfCB3cml0ZUZsb2F0NjQgICAgICAgfCB8XG4gKiB8IGJpZ2ludCAgICAgICAgICAgICAgfCAxMjIgICAgICB8IHdyaXRlQmlnSW50NjQgICAgICB8IHxcbiAqIHwgYm9vbGVhbiAoZmFsc2UpICAgICB8IDEyMSAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgVHJ1ZSBhbmQgZmFsc2UgYXJlIGRpZmZlcmVudCBkYXRhIHR5cGVzIHNvIHdlIHNhdmUgdGhlIGZvbGxvd2luZyBieXRlIHxcbiAqIHwgYm9vbGVhbiAodHJ1ZSkgICAgICB8IDEyMCAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgLSAwYjAxMTExMDAwIHNvIHRoZSBsYXN0IGJpdCBkZXRlcm1pbmVzIHdoZXRoZXIgdHJ1ZSBvciBmYWxzZSB8XG4gKiB8IHN0cmluZyAgICAgICAgICAgICAgfCAxMTkgICAgICB8IHdyaXRlVmFyU3RyaW5nICAgICB8IHxcbiAqIHwgb2JqZWN0PHN0cmluZyxhbnk+ICB8IDExOCAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ga2V5LXZhbHVlIHBhaXJzIHxcbiAqIHwgYXJyYXk8YW55PiAgICAgICAgICB8IDExNyAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ganNvbiB2YWx1ZXMgfFxuICogfCBVaW50OEFycmF5ICAgICAgICAgIHwgMTE2ICAgICAgfCB3cml0ZVZhclVpbnQ4QXJyYXkgfCBXZSB1c2UgVWludDhBcnJheSBmb3IgYW55IGtpbmQgb2YgYmluYXJ5IGRhdGEgfFxuICpcbiAqIFJlYXNvbnMgZm9yIHRoZSBkZWNyZWFzaW5nIHByZWZpeDpcbiAqIFdlIG5lZWQgdGhlIGZpcnN0IGJpdCBmb3IgZXh0ZW5kYWJpbGl0eSAobGF0ZXIgd2UgbWF5IHdhbnQgdG8gZW5jb2RlIHRoZVxuICogcHJlZml4IHdpdGggd3JpdGVWYXJVaW50KS4gVGhlIHJlbWFpbmluZyA3IGJpdHMgYXJlIGRpdmlkZWQgYXMgZm9sbG93czpcbiAqIFswLTMwXSAgIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgY3VzdG9tIHB1cnBvc2VzXG4gKiAgICAgICAgICAoZGVmaW5lZCBieSB0aGUgZnVuY3Rpb24gdGhhdCB1c2VzIHRoaXMgbGlicmFyeSlcbiAqIFszMS0xMjddIHRoZSBlbmQgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgZGF0YSBlbmNvZGluZyBieVxuICogICAgICAgICAgbGliMC9lbmNvZGluZy5qc1xuICpcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHt1bmRlZmluZWR8bnVsbHxudW1iZXJ8YmlnaW50fGJvb2xlYW58c3RyaW5nfE9iamVjdDxzdHJpbmcsYW55PnxBcnJheTxhbnk+fFVpbnQ4QXJyYXl9IGRhdGFcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlQW55ID0gKGVuY29kZXIsIGRhdGEpID0+IHtcbiAgc3dpdGNoICh0eXBlb2YgZGF0YSkge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAvLyBUWVBFIDExOTogU1RSSU5HXG4gICAgICB3cml0ZShlbmNvZGVyLCAxMTkpXG4gICAgICB3cml0ZVZhclN0cmluZyhlbmNvZGVyLCBkYXRhKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgaWYgKG51bWJlci5pc0ludGVnZXIoZGF0YSkgJiYgbWF0aC5hYnMoZGF0YSkgPD0gYmluYXJ5LkJJVFMzMSkge1xuICAgICAgICAvLyBUWVBFIDEyNTogSU5URUdFUlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjUpXG4gICAgICAgIHdyaXRlVmFySW50KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2UgaWYgKGlzRmxvYXQzMihkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDEyNDogRkxPQVQzMlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjQpXG4gICAgICAgIHdyaXRlRmxvYXQzMihlbmNvZGVyLCBkYXRhKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVFlQRSAxMjM6IEZMT0FUNjRcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTIzKVxuICAgICAgICB3cml0ZUZsb2F0NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmlnaW50JzpcbiAgICAgIC8vIFRZUEUgMTIyOiBCaWdJbnRcbiAgICAgIHdyaXRlKGVuY29kZXIsIDEyMilcbiAgICAgIHdyaXRlQmlnSW50NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgICAgIC8vIFRZUEUgMTI2OiBudWxsXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDEyNilcbiAgICAgIH0gZWxzZSBpZiAoYXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDExNzogQXJyYXlcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTE3KVxuICAgICAgICB3cml0ZVZhclVpbnQoZW5jb2RlciwgZGF0YS5sZW5ndGgpXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHdyaXRlQW55KGVuY29kZXIsIGRhdGFbaV0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgLy8gVFlQRSAxMTY6IEFycmF5QnVmZmVyXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExNilcbiAgICAgICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUWVBFIDExODogT2JqZWN0XG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExOClcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpXG4gICAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLCBrZXlzLmxlbmd0aClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXVxuICAgICAgICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIGtleSlcbiAgICAgICAgICB3cml0ZUFueShlbmNvZGVyLCBkYXRhW2tleV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAvLyBUWVBFIDEyMC8xMjE6IGJvb2xlYW4gKHRydWUvZmFsc2UpXG4gICAgICB3cml0ZShlbmNvZGVyLCBkYXRhID8gMTIwIDogMTIxKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gVFlQRSAxMjc6IHVuZGVmaW5lZFxuICAgICAgd3JpdGUoZW5jb2RlciwgMTI3KVxuICB9XG59XG5cbi8qKlxuICogTm93IGNvbWUgYSBmZXcgc3RhdGVmdWwgZW5jb2RlciB0aGF0IGhhdmUgdGhlaXIgb3duIGNsYXNzZXMuXG4gKi9cblxuLyoqXG4gKiBCYXNpYyBSdW4gTGVuZ3RoIEVuY29kZXIgLSBhIGJhc2ljIGNvbXByZXNzaW9uIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIEVuY29kZXMgWzEsMSwxLDddIHRvIFsxLDMsNywxXSAoMyB0aW1lcyAxLCAxIHRpbWUgNykuIFRoaXMgZW5jb2RlciBtaWdodCBkbyBtb3JlIGhhcm0gdGhhbiBnb29kIGlmIHRoZXJlIGFyZSBhIGxvdCBvZiB2YWx1ZXMgdGhhdCBhcmUgbm90IHJlcGVhdGVkLlxuICpcbiAqIEl0IHdhcyBvcmlnaW5hbGx5IHVzZWQgZm9yIGltYWdlIGNvbXByZXNzaW9uLiBDb29sIC4uIGFydGljbGUgaHR0cDovL2NzYnJ1Y2UuY29tL2NibS90cmFuc2FjdG9yL3BkZnMvdHJhbnNfdjdfaTA2LnBkZlxuICpcbiAqIEBub3RlIFQgbXVzdCBub3QgYmUgbnVsbCFcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICovXG5leHBvcnQgY2xhc3MgUmxlRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbihFbmNvZGVyLCBUKTp2b2lkfSB3cml0ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yICh3cml0ZXIpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogVGhlIHdyaXRlclxuICAgICAqL1xuICAgIHRoaXMudyA9IHdyaXRlclxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7VHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucyA9IG51bGxcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VH0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuY291bnQgPiAwKSB7XG4gICAgICAgIC8vIGZsdXNoIGNvdW50ZXIsIHVubGVzcyB0aGlzIGlzIHRoZSBmaXJzdCB2YWx1ZSAoY291bnQgPSAwKVxuICAgICAgICB3cml0ZVZhclVpbnQodGhpcywgdGhpcy5jb3VudCAtIDEpIC8vIHNpbmNlIGNvdW50IGlzIGFsd2F5cyA+IDAsIHdlIGNhbiBkZWNyZW1lbnQgYnkgb25lLiBub24tc3RhbmRhcmQgZW5jb2RpbmcgZnR3XG4gICAgICB9XG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgLy8gd3JpdGUgZmlyc3QgdmFsdWVcbiAgICAgIHRoaXMudyh0aGlzLCB2KVxuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJhc2ljIGRpZmYgZGVjb2RlciB1c2luZyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuXG4gKlxuICogRW5jb2RlcyB0aGUgdmFsdWVzIFszLCAxMTAwLCAxMTAxLCAxMDUwLCAwXSB0byBbMywgMTA5NywgMSwgLTUxLCAtMTA1MF0gdXNpbmcgd3JpdGVWYXJJbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICB3cml0ZVZhckludCh0aGlzLCB2IC0gdGhpcy5zKVxuICAgIHRoaXMucyA9IHZcbiAgfVxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2YgSW50RGlmZkVuY29kZXIgYW5kIFJsZUVuY29kZXIuXG4gKlxuICogQmFzaWNhbGx5IGZpcnN0IHdyaXRlcyB0aGUgSW50RGlmZkVuY29kZXIgYW5kIHRoZW4gY291bnRzIGR1cGxpY2F0ZSBkaWZmcyB1c2luZyBSbGVFbmNvZGluZy5cbiAqXG4gKiBFbmNvZGVzIHRoZSB2YWx1ZXMgWzEsMSwxLDIsMyw0LDUsNl0gYXMgWzEsMSwwLDIsMSw1XSAoUkxFKFsxLDAsMCwxLDEsMSwxLDFdKSBcdTIxRDIgUmxlSW50RGlmZlsxLDEsMCwyLDEsNV0pXG4gKi9cbmV4cG9ydCBjbGFzcyBSbGVJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLnMgPT09IHYgJiYgdGhpcy5jb3VudCA+IDApIHtcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5jb3VudCA+IDApIHtcbiAgICAgICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgICAgIHdyaXRlVmFyVWludCh0aGlzLCB0aGlzLmNvdW50IC0gMSkgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMCwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICAgIH1cbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICAvLyB3cml0ZSBmaXJzdCB2YWx1ZVxuICAgICAgd3JpdGVWYXJJbnQodGhpcywgdiAtIHRoaXMucylcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnRPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoVWludE9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgc2lnbiB0byBwb3NpdGl2ZVxuICAgIC8vIGNhc2UgMjogd3JpdGUgc2V2ZXJhbCB2YWx1ZXMuIHNldCBzaWduIHRvIG5lZ2F0aXZlIHRvIGluZGljYXRlIHRoYXQgdGhlcmUgaXMgYSBsZW5ndGggY29taW5nXG4gICAgd3JpdGVWYXJJbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50ID09PSAxID8gZW5jb2Rlci5zIDogLWVuY29kZXIucylcbiAgICBpZiAoZW5jb2Rlci5jb3VudCA+IDEpIHtcbiAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLmVuY29kZXIsIGVuY29kZXIuY291bnQgLSAyKSAvLyBzaW5jZSBjb3VudCBpcyBhbHdheXMgPiAxLCB3ZSBjYW4gZGVjcmVtZW50IGJ5IG9uZS4gbm9uLXN0YW5kYXJkIGVuY29kaW5nIGZ0d1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE9wdGltaXplZCBSbGUgZW5jb2RlciB0aGF0IGRvZXMgbm90IHN1ZmZlciBmcm9tIHRoZSBtZW50aW9uZWQgcHJvYmxlbSBvZiB0aGUgYmFzaWMgUmxlIGVuY29kZXIuXG4gKlxuICogSW50ZXJuYWxseSB1c2VzIFZhckludCBlbmNvZGVyIHRvIHdyaXRlIHVuc2lnbmVkIGludGVnZXJzLiBJZiB0aGUgaW5wdXQgb2NjdXJzIG11bHRpcGxlIHRpbWVzLCB3ZSB3cml0ZVxuICogd3JpdGUgaXQgYXMgYSBuZWdhdGl2ZSBudW1iZXIuIFRoZSBVaW50T3B0UmxlRGVjb2RlciB0aGVuIHVuZGVyc3RhbmRzIHRoYXQgaXQgbmVlZHMgdG8gcmVhZCBhIGNvdW50LlxuICpcbiAqIEVuY29kZXMgWzEsMiwzLDMsM10gYXMgWzEsMiwtMywzXSAob25jZSAxLCBvbmNlIDIsIHRocmVlIHRpbWVzIDMpXG4gKi9cbmV4cG9ydCBjbGFzcyBVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgZmx1c2hVaW50T3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmx1c2ggdGhlIGVuY29kZWQgc3RhdGUgYW5kIHRyYW5zZm9ybSB0aGlzIHRvIGEgVWludDhBcnJheS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uY2UuXG4gICAqL1xuICB0b1VpbnQ4QXJyYXkgKCkge1xuICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KHRoaXMuZW5jb2RlcilcbiAgfVxufVxuXG4vKipcbiAqIEluY3JlYXNpbmcgVWludCBPcHRpbWl6ZWQgUkxFIEVuY29kZXJcbiAqXG4gKiBUaGUgUkxFIGVuY29kZXIgY291bnRzIHRoZSBudW1iZXIgb2Ygc2FtZSBvY2N1cmVuY2VzIG9mIHRoZSBzYW1lIHZhbHVlLlxuICogVGhlIEluY1VpbnRPcHRSbGUgZW5jb2RlciBjb3VudHMgaWYgdGhlIHZhbHVlIGluY3JlYXNlcy5cbiAqIEkuZS4gNywgOCwgOSwgMTAgd2lsbCBiZSBlbmNvZGVkIGFzIFstNywgNF0uIDEsIDMsIDUgd2lsbCBiZSBlbmNvZGVkXG4gKiBhcyBbMSwgMywgNV0uXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmNVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zICsgdGhpcy5jb3VudCA9PT0gdikge1xuICAgICAgdGhpcy5jb3VudCsrXG4gICAgfSBlbHNlIHtcbiAgICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICB0aGlzLnMgPSB2XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZsdXNoIHRoZSBlbmNvZGVkIHN0YXRlIGFuZCB0cmFuc2Zvcm0gdGhpcyB0byBhIFVpbnQ4QXJyYXkuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBvbmNlLlxuICAgKi9cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBmbHVzaFVpbnRPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgcmV0dXJuIHRvVWludDhBcnJheSh0aGlzLmVuY29kZXIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0ludERpZmZPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoSW50RGlmZk9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gICAgICAgICAgMzEgYml0IG1ha2luZyB1cCB0aGUgZGlmZiB8IHdldGhlciB0byB3cml0ZSB0aGUgY291bnRlclxuICAgIC8vIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmIDw8IDEgfCAoZW5jb2Rlci5jb3VudCA9PT0gMSA/IDAgOiAxKVxuICAgIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmICogMiArIChlbmNvZGVyLmNvdW50ID09PSAxID8gMCA6IDEpXG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgZmlyc3QgYml0IHRvIHBvc2l0aXZlXG4gICAgLy8gY2FzZSAyOiB3cml0ZSBzZXZlcmFsIHZhbHVlcy4gc2V0IGZpcnN0IGJpdCB0byBuZWdhdGl2ZSB0byBpbmRpY2F0ZSB0aGF0IHRoZXJlIGlzIGEgbGVuZ3RoIGNvbWluZ1xuICAgIHdyaXRlVmFySW50KGVuY29kZXIuZW5jb2RlciwgZW5jb2RlZERpZmYpXG4gICAgaWYgKGVuY29kZXIuY291bnQgPiAxKSB7XG4gICAgICB3cml0ZVZhclVpbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50IC0gMikgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMSwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mIHRoZSBJbnREaWZmRW5jb2RlciBhbmQgdGhlIFVpbnRPcHRSbGVFbmNvZGVyLlxuICpcbiAqIFRoZSBjb3VudCBhcHByb2FjaCBpcyBzaW1pbGFyIHRvIHRoZSBVaW50RGlmZk9wdFJsZUVuY29kZXIsIGJ1dCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBuZWdhdGl2ZSBiaXRmbGFnLCBpdCBlbmNvZGVzXG4gKiBpbiB0aGUgTFNCIHdoZXRoZXIgYSBjb3VudCBpcyB0byBiZSByZWFkLiBUaGVyZWZvcmUgdGhpcyBFbmNvZGVyIG9ubHkgc3VwcG9ydHMgMzEgYml0IGludGVnZXJzIVxuICpcbiAqIEVuY29kZXMgWzEsIDIsIDMsIDJdIGFzIFszLCAxLCA2LCAtMV0gKG1vcmUgc3BlY2lmaWNhbGx5IFsoMSA8PCAxKSB8IDEsICgzIDw8IDApIHwgMCwgLTFdKVxuICpcbiAqIEludGVybmFsbHkgdXNlcyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuIENvbnRyYXJ5IHRvIG5vcm1hbCBVaW50VmFyIGVuY29kaW5nLCB0aGUgZmlyc3QgYnl0ZSBjb250YWluczpcbiAqICogMSBiaXQgdGhhdCBkZW5vdGVzIHdoZXRoZXIgdGhlIG5leHQgdmFsdWUgaXMgYSBjb3VudCAoTFNCKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0aGlzIHZhbHVlIGlzIG5lZ2F0aXZlIChNU0IgLSAxKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0byBjb250aW51ZSByZWFkaW5nIHRoZSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlciAoTVNCKVxuICpcbiAqIFRoZXJlZm9yZSwgb25seSBmaXZlIGJpdHMgcmVtYWluIHRvIGVuY29kZSBkaWZmIHJhbmdlcy5cbiAqXG4gKiBVc2UgdGhpcyBFbmNvZGVyIG9ubHkgd2hlbiBhcHByb3ByaWF0ZS4gSW4gbW9zdCBjYXNlcywgdGhpcyBpcyBwcm9iYWJseSBhIGJhZCBpZGVhLlxuICovXG5leHBvcnQgY2xhc3MgSW50RGlmZk9wdFJsZUVuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5lbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gMFxuICAgIHRoaXMuY291bnQgPSAwXG4gICAgdGhpcy5kaWZmID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLmRpZmYgPT09IHYgLSB0aGlzLnMpIHtcbiAgICAgIHRoaXMucyA9IHZcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBmbHVzaEludERpZmZPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgdGhpcy5kaWZmID0gdiAtIHRoaXMuc1xuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGbHVzaCB0aGUgZW5jb2RlZCBzdGF0ZSBhbmQgdHJhbnNmb3JtIHRoaXMgdG8gYSBVaW50OEFycmF5LlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBzaG91bGQgb25seSBiZSBjYWxsZWQgb25jZS5cbiAgICovXG4gIHRvVWludDhBcnJheSAoKSB7XG4gICAgZmx1c2hJbnREaWZmT3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgIHJldHVybiB0b1VpbnQ4QXJyYXkodGhpcy5lbmNvZGVyKVxuICB9XG59XG5cbi8qKlxuICogT3B0aW1pemVkIFN0cmluZyBFbmNvZGVyLlxuICpcbiAqIEVuY29kaW5nIG1hbnkgc21hbGwgc3RyaW5ncyBpbiBhIHNpbXBsZSBFbmNvZGVyIGlzIG5vdCB2ZXJ5IGVmZmljaWVudC4gVGhlIGZ1bmN0aW9uIGNhbGwgdG8gZGVjb2RlIGEgc3RyaW5nIHRha2VzIHNvbWUgdGltZSBhbmQgY3JlYXRlcyByZWZlcmVuY2VzIHRoYXQgbXVzdCBiZSBldmVudHVhbGx5IGRlbGV0ZWQuXG4gKiBJbiBwcmFjdGljZSwgd2hlbiBkZWNvZGluZyBzZXZlcmFsIG1pbGxpb24gc21hbGwgc3RyaW5ncywgdGhlIEdDIHdpbGwga2ljayBpbiBtb3JlIGFuZCBtb3JlIG9mdGVuIHRvIGNvbGxlY3Qgb3JwaGFuZWQgc3RyaW5nIG9iamVjdHMgKG9yIG1heWJlIHRoZXJlIGlzIGFub3RoZXIgcmVhc29uPykuXG4gKlxuICogVGhpcyBzdHJpbmcgZW5jb2RlciBzb2x2ZXMgdGhlIGFib3ZlIHByb2JsZW0uIEFsbCBzdHJpbmdzIGFyZSBjb25jYXRlbmF0ZWQgYW5kIHdyaXR0ZW4gYXMgYSBzaW5nbGUgc3RyaW5nIHVzaW5nIGEgc2luZ2xlIGVuY29kaW5nIGNhbGwuXG4gKlxuICogVGhlIGxlbmd0aHMgYXJlIGVuY29kZWQgdXNpbmcgYSBVaW50T3B0UmxlRW5jb2Rlci5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ0VuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PHN0cmluZz59XG4gICAgICovXG4gICAgdGhpcy5zYXJyID0gW11cbiAgICB0aGlzLnMgPSAnJ1xuICAgIHRoaXMubGVuc0UgPSBuZXcgVWludE9wdFJsZUVuY29kZXIoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAgICovXG4gIHdyaXRlIChzdHJpbmcpIHtcbiAgICB0aGlzLnMgKz0gc3RyaW5nXG4gICAgaWYgKHRoaXMucy5sZW5ndGggPiAxOSkge1xuICAgICAgdGhpcy5zYXJyLnB1c2godGhpcy5zKVxuICAgICAgdGhpcy5zID0gJydcbiAgICB9XG4gICAgdGhpcy5sZW5zRS53cml0ZShzdHJpbmcubGVuZ3RoKVxuICB9XG5cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBjb25zdCBlbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIHRoaXMuc2Fyci5wdXNoKHRoaXMucylcbiAgICB0aGlzLnMgPSAnJ1xuICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIHRoaXMuc2Fyci5qb2luKCcnKSlcbiAgICB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5sZW5zRS50b1VpbnQ4QXJyYXkoKSlcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KGVuY29kZXIpXG4gIH1cbn1cbiIsICIvKipcbiAqIEVycm9yIGhlbHBlcnMuXG4gKlxuICogQG1vZHVsZSBlcnJvclxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNcbiAqIEByZXR1cm4ge0Vycm9yfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9IHMgPT4gbmV3IEVycm9yKHMpXG5cbi8qKlxuICogQHRocm93cyB7RXJyb3J9XG4gKiBAcmV0dXJuIHtuZXZlcn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMyAqL1xuZXhwb3J0IGNvbnN0IG1ldGhvZFVuaW1wbGVtZW50ZWQgPSAoKSA9PiB7XG4gIHRocm93IGNyZWF0ZSgnTWV0aG9kIHVuaW1wbGVtZW50ZWQnKVxufVxuXG4vKipcbiAqIEB0aHJvd3Mge0Vycm9yfVxuICogQHJldHVybiB7bmV2ZXJ9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDMgKi9cbmV4cG9ydCBjb25zdCB1bmV4cGVjdGVkQ2FzZSA9ICgpID0+IHtcbiAgdGhyb3cgY3JlYXRlKCdVbmV4cGVjdGVkIGNhc2UnKVxufVxuIiwgIi8qKlxuICogRWZmaWNpZW50IHNjaGVtYS1sZXNzIGJpbmFyeSBkZWNvZGluZyB3aXRoIHN1cHBvcnQgZm9yIHZhcmlhYmxlIGxlbmd0aCBlbmNvZGluZy5cbiAqXG4gKiBVc2UgW2xpYjAvZGVjb2RpbmddIHdpdGggW2xpYjAvZW5jb2RpbmddLiBFdmVyeSBlbmNvZGluZyBmdW5jdGlvbiBoYXMgYSBjb3JyZXNwb25kaW5nIGRlY29kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEVuY29kZXMgbnVtYmVycyBpbiBsaXR0bGUtZW5kaWFuIG9yZGVyIChsZWFzdCB0byBtb3N0IHNpZ25pZmljYW50IGJ5dGUgb3JkZXIpXG4gKiBhbmQgaXMgY29tcGF0aWJsZSB3aXRoIEdvbGFuZydzIGJpbmFyeSBlbmNvZGluZyAoaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9lbmNvZGluZy9iaW5hcnkvKVxuICogd2hpY2ggaXMgYWxzbyB1c2VkIGluIFByb3RvY29sIEJ1ZmZlcnMuXG4gKlxuICogYGBganNcbiAqIC8vIGVuY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAqIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCAyNTYpXG4gKiBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyLCAnSGVsbG8gd29ybGQhJylcbiAqIGNvbnN0IGJ1ZiA9IGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyKVxuICogYGBgXG4gKlxuICogYGBganNcbiAqIC8vIGRlY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGRlY29kZXIgPSBkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZilcbiAqIGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpIC8vID0+IDI1NlxuICogZGVjb2RpbmcucmVhZFZhclN0cmluZyhkZWNvZGVyKSAvLyA9PiAnSGVsbG8gd29ybGQhJ1xuICogZGVjb2RpbmcuaGFzQ29udGVudChkZWNvZGVyKSAvLyA9PiBmYWxzZSAtIGFsbCBkYXRhIGlzIHJlYWRcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGUgZGVjb2RpbmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBiaW5hcnkgZnJvbSAnLi9iaW5hcnkuanMnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIG51bWJlciBmcm9tICcuL251bWJlci5qcydcbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJy4vZXJyb3IuanMnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICcuL2VuY29kaW5nLmpzJ1xuXG5jb25zdCBlcnJvclVuZXhwZWN0ZWRFbmRPZkFycmF5ID0gZXJyb3IuY3JlYXRlKCdVbmV4cGVjdGVkIGVuZCBvZiBhcnJheScpXG5jb25zdCBlcnJvckludGVnZXJPdXRPZlJhbmdlID0gZXJyb3IuY3JlYXRlKCdJbnRlZ2VyIG91dCBvZiBSYW5nZScpXG5cbi8qKlxuICogQSBEZWNvZGVyIGhhbmRsZXMgdGhlIGRlY29kaW5nIG9mIGFuIFVpbnQ4QXJyYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheSBCaW5hcnkgZGF0YSB0byBkZWNvZGVcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgLyoqXG4gICAgICogRGVjb2RpbmcgdGFyZ2V0LlxuICAgICAqXG4gICAgICogQHR5cGUge1VpbnQ4QXJyYXl9XG4gICAgICovXG4gICAgdGhpcy5hcnIgPSB1aW50OEFycmF5XG4gICAgLyoqXG4gICAgICogQ3VycmVudCBkZWNvZGluZyBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5wb3MgPSAwXG4gIH1cbn1cblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICogQHJldHVybiB7RGVjb2Rlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURlY29kZXIgPSB1aW50OEFycmF5ID0+IG5ldyBEZWNvZGVyKHVpbnQ4QXJyYXkpXG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBoYXNDb250ZW50ID0gZGVjb2RlciA9PiBkZWNvZGVyLnBvcyAhPT0gZGVjb2Rlci5hcnIubGVuZ3RoXG5cbi8qKlxuICogQ2xvbmUgYSBkZWNvZGVyIGluc3RhbmNlLlxuICogT3B0aW9uYWxseSBzZXQgYSBuZXcgcG9zaXRpb24gcGFyYW1ldGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge251bWJlcn0gW25ld1Bvc10gRGVmYXVsdHMgdG8gY3VycmVudCBwb3NpdGlvblxuICogQHJldHVybiB7RGVjb2Rlcn0gQSBjbG9uZSBvZiBgZGVjb2RlcmBcbiAqL1xuZXhwb3J0IGNvbnN0IGNsb25lID0gKGRlY29kZXIsIG5ld1BvcyA9IGRlY29kZXIucG9zKSA9PiB7XG4gIGNvbnN0IF9kZWNvZGVyID0gY3JlYXRlRGVjb2RlcihkZWNvZGVyLmFycilcbiAgX2RlY29kZXIucG9zID0gbmV3UG9zXG4gIHJldHVybiBfZGVjb2RlclxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBVaW50OEFycmF5IHZpZXcgb2YgdGhlIG5leHQgYGxlbmAgYnl0ZXMgYW5kIGFkdmFuY2UgdGhlIHBvc2l0aW9uIGJ5IGBsZW5gLlxuICpcbiAqIEltcG9ydGFudDogVGhlIFVpbnQ4QXJyYXkgc3RpbGwgcG9pbnRzIHRvIHRoZSB1bmRlcmx5aW5nIEFycmF5QnVmZmVyLiBNYWtlIHN1cmUgdG8gZGlzY2FyZCB0aGUgcmVzdWx0IGFzIHNvb24gYXMgcG9zc2libGUgdG8gcHJldmVudCBhbnkgbWVtb3J5IGxlYWtzLlxuICogICAgICAgICAgICBVc2UgYGJ1ZmZlci5jb3B5VWludDhBcnJheWAgdG8gY29weSB0aGUgcmVzdWx0IGludG8gYSBuZXcgVWludDhBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiBUaGUgbGVuZ3RoIG9mIGJ5dGVzIHRvIHJlYWRcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVWludDhBcnJheSA9IChkZWNvZGVyLCBsZW4pID0+IHtcbiAgY29uc3QgdmlldyA9IG5ldyBVaW50OEFycmF5KGRlY29kZXIuYXJyLmJ1ZmZlciwgZGVjb2Rlci5wb3MgKyBkZWNvZGVyLmFyci5ieXRlT2Zmc2V0LCBsZW4pXG4gIGRlY29kZXIucG9zICs9IGxlblxuICByZXR1cm4gdmlld1xufVxuXG4vKipcbiAqIFJlYWQgdmFyaWFibGUgbGVuZ3RoIFVpbnQ4QXJyYXkuXG4gKlxuICogSW1wb3J0YW50OiBUaGUgVWludDhBcnJheSBzdGlsbCBwb2ludHMgdG8gdGhlIHVuZGVybHlpbmcgQXJyYXlCdWZmZXIuIE1ha2Ugc3VyZSB0byBkaXNjYXJkIHRoZSByZXN1bHQgYXMgc29vbiBhcyBwb3NzaWJsZSB0byBwcmV2ZW50IGFueSBtZW1vcnkgbGVha3MuXG4gKiAgICAgICAgICAgIFVzZSBgYnVmZmVyLmNvcHlVaW50OEFycmF5YCB0byBjb3B5IHRoZSByZXN1bHQgaW50byBhIG5ldyBVaW50OEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFZhclVpbnQ4QXJyYXkgPSBkZWNvZGVyID0+IHJlYWRVaW50OEFycmF5KGRlY29kZXIsIHJlYWRWYXJVaW50KGRlY29kZXIpKVxuXG4vKipcbiAqIFJlYWQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgYXMgYW4gQXJyYXlCdWZmZXJcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFRhaWxBc1VpbnQ4QXJyYXkgPSBkZWNvZGVyID0+IHJlYWRVaW50OEFycmF5KGRlY29kZXIsIGRlY29kZXIuYXJyLmxlbmd0aCAtIGRlY29kZXIucG9zKVxuXG4vKipcbiAqIFNraXAgb25lIGJ5dGUsIGp1bXAgdG8gdGhlIG5leHQgcG9zaXRpb24uXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgbmV4dCBwb3NpdGlvblxuICovXG5leHBvcnQgY29uc3Qgc2tpcDggPSBkZWNvZGVyID0+IGRlY29kZXIucG9zKytcblxuLyoqXG4gKiBSZWFkIG9uZSBieXRlIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHJldHVybiB7bnVtYmVyfSBVbnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVWludDggPSBkZWNvZGVyID0+IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG5cbi8qKlxuICogUmVhZCAyIGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MTYgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3NdICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KVxuICBkZWNvZGVyLnBvcyArPSAyXG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogUmVhZCA0IGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MzIgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zXSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMV0gPDwgOCkgK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDJdIDw8IDE2KSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgM10gPDwgMjQpKSA+Pj4gMFxuICBkZWNvZGVyLnBvcyArPSA0XG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogUmVhZCA0IGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIgaW4gYmlnIGVuZGlhbiBvcmRlci5cbiAqIChtb3N0IHNpZ25pZmljYW50IGJ5dGUgZmlyc3QpXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MzJCaWdFbmRpYW4gPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgM10gK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDJdIDw8IDgpICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCAxNikgK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gPDwgMjQpKSA+Pj4gMFxuICBkZWNvZGVyLnBvcyArPSA0XG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogTG9vayBhaGVhZCB3aXRob3V0IGluY3JlbWVudGluZyB0aGUgcG9zaXRpb25cbiAqIHRvIHRoZSBuZXh0IGJ5dGUgYW5kIHJlYWQgaXQgYXMgdW5zaWduZWQgaW50ZWdlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICovXG5leHBvcnQgY29uc3QgcGVla1VpbnQ4ID0gZGVjb2RlciA9PiBkZWNvZGVyLmFycltkZWNvZGVyLnBvc11cblxuLyoqXG4gKiBMb29rIGFoZWFkIHdpdGhvdXQgaW5jcmVtZW50aW5nIHRoZSBwb3NpdGlvblxuICogdG8gdGhlIG5leHQgYnl0ZSBhbmQgcmVhZCBpdCBhcyB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IEFuIHVuc2lnbmVkIGludGVnZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVWludDE2ID0gZGVjb2RlciA9PlxuICBkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KVxuXG4vKipcbiAqIExvb2sgYWhlYWQgd2l0aG91dCBpbmNyZW1lbnRpbmcgdGhlIHBvc2l0aW9uXG4gKiB0byB0aGUgbmV4dCBieXRlIGFuZCByZWFkIGl0IGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBlZWtVaW50MzIgPSBkZWNvZGVyID0+IChcbiAgZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3NdICtcbiAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMV0gPDwgOCkgK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAyXSA8PCAxNikgK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAzXSA8PCAyNClcbikgPj4+IDBcblxuLyoqXG4gKiBSZWFkIHVuc2lnbmVkIGludGVnZXIgKDMyYml0KSB3aXRoIHZhcmlhYmxlIGxlbmd0aC5cbiAqIDEvOHRoIG9mIHRoZSBzdG9yYWdlIGlzIHVzZWQgYXMgZW5jb2Rpbmcgb3ZlcmhlYWQuXG4gKiAgKiBudW1iZXJzIDwgMl43IGlzIHN0b3JlZCBpbiBvbmUgYnl0bGVuZ3RoXG4gKiAgKiBudW1iZXJzIDwgMl4xNCBpcyBzdG9yZWQgaW4gdHdvIGJ5bGVuZ3RoXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5sZW5ndGhcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRWYXJVaW50ID0gZGVjb2RlciA9PiB7XG4gIGxldCBudW0gPSAwXG4gIGxldCBtdWx0ID0gMVxuICBjb25zdCBsZW4gPSBkZWNvZGVyLmFyci5sZW5ndGhcbiAgd2hpbGUgKGRlY29kZXIucG9zIDwgbGVuKSB7XG4gICAgY29uc3QgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gICAgLy8gbnVtID0gbnVtIHwgKChyICYgYmluYXJ5LkJJVFM3KSA8PCBsZW4pXG4gICAgbnVtID0gbnVtICsgKHIgJiBiaW5hcnkuQklUUzcpICogbXVsdCAvLyBzaGlmdCAkciA8PCAoNyojaXRlcmF0aW9ucykgYW5kIGFkZCBpdCB0byBudW1cbiAgICBtdWx0ICo9IDEyOCAvLyBuZXh0IGl0ZXJhdGlvbiwgc2hpZnQgNyBcIm1vcmVcIiB0byB0aGUgbGVmdFxuICAgIGlmIChyIDwgYmluYXJ5LkJJVDgpIHtcbiAgICAgIHJldHVybiBudW1cbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0YXJ0ICovXG4gICAgaWYgKG51bSA+IG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICB0aHJvdyBlcnJvckludGVnZXJPdXRPZlJhbmdlXG4gICAgfVxuICAgIC8qIGM4IGlnbm9yZSBzdG9wICovXG4gIH1cbiAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxufVxuXG4vKipcbiAqIFJlYWQgc2lnbmVkIGludGVnZXIgKDMyYml0KSB3aXRoIHZhcmlhYmxlIGxlbmd0aC5cbiAqIDEvOHRoIG9mIHRoZSBzdG9yYWdlIGlzIHVzZWQgYXMgZW5jb2Rpbmcgb3ZlcmhlYWQuXG4gKiAgKiBudW1iZXJzIDwgMl43IGlzIHN0b3JlZCBpbiBvbmUgYnl0bGVuZ3RoXG4gKiAgKiBudW1iZXJzIDwgMl4xNCBpcyBzdG9yZWQgaW4gdHdvIGJ5bGVuZ3RoXG4gKiBAdG9kbyBUaGlzIHNob3VsZCBwcm9iYWJseSBjcmVhdGUgdGhlIGludmVyc2Ugfm51bSBpZiBudW1iZXIgaXMgbmVnYXRpdmUgLSBidXQgdGhpcyB3b3VsZCBiZSBhIGJyZWFraW5nIGNoYW5nZS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLmxlbmd0aFxuICovXG5leHBvcnQgY29uc3QgcmVhZFZhckludCA9IGRlY29kZXIgPT4ge1xuICBsZXQgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gIGxldCBudW0gPSByICYgYmluYXJ5LkJJVFM2XG4gIGxldCBtdWx0ID0gNjRcbiAgY29uc3Qgc2lnbiA9IChyICYgYmluYXJ5LkJJVDcpID4gMCA/IC0xIDogMVxuICBpZiAoKHIgJiBiaW5hcnkuQklUOCkgPT09IDApIHtcbiAgICAvLyBkb24ndCBjb250aW51ZSByZWFkaW5nXG4gICAgcmV0dXJuIHNpZ24gKiBudW1cbiAgfVxuICBjb25zdCBsZW4gPSBkZWNvZGVyLmFyci5sZW5ndGhcbiAgd2hpbGUgKGRlY29kZXIucG9zIDwgbGVuKSB7XG4gICAgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gICAgLy8gbnVtID0gbnVtIHwgKChyICYgYmluYXJ5LkJJVFM3KSA8PCBsZW4pXG4gICAgbnVtID0gbnVtICsgKHIgJiBiaW5hcnkuQklUUzcpICogbXVsdFxuICAgIG11bHQgKj0gMTI4XG4gICAgaWYgKHIgPCBiaW5hcnkuQklUOCkge1xuICAgICAgcmV0dXJuIHNpZ24gKiBudW1cbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0YXJ0ICovXG4gICAgaWYgKG51bSA+IG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICB0aHJvdyBlcnJvckludGVnZXJPdXRPZlJhbmdlXG4gICAgfVxuICAgIC8qIGM4IGlnbm9yZSBzdG9wICovXG4gIH1cbiAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxufVxuXG4vKipcbiAqIExvb2sgYWhlYWQgYW5kIHJlYWQgdmFyVWludCB3aXRob3V0IGluY3JlbWVudGluZyBwb3NpdGlvblxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVmFyVWludCA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgZGVjb2Rlci5wb3MgPSBwb3NcbiAgcmV0dXJuIHNcbn1cblxuLyoqXG4gKiBMb29rIGFoZWFkIGFuZCByZWFkIHZhclVpbnQgd2l0aG91dCBpbmNyZW1lbnRpbmcgcG9zaXRpb25cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgcGVla1ZhckludCA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhckludChkZWNvZGVyKVxuICBkZWNvZGVyLnBvcyA9IHBvc1xuICByZXR1cm4gc1xufVxuXG4vKipcbiAqIFdlIGRvbid0IHRlc3QgdGhpcyBmdW5jdGlvbiBhbnltb3JlIGFzIHdlIHVzZSBuYXRpdmUgZGVjb2RpbmcvZW5jb2RpbmcgYnkgZGVmYXVsdCBub3cuXG4gKiBCZXR0ZXIgbm90IG1vZGlmeSB0aGlzIGFueW1vcmUuLlxuICpcbiAqIFRyYW5zZm9ybWluZyB1dGY4IHRvIGEgc3RyaW5nIGlzIHByZXR0eSBleHBlbnNpdmUuIFRoZSBjb2RlIHBlcmZvcm1zIDEweCBiZXR0ZXJcbiAqIHdoZW4gU3RyaW5nLmZyb21Db2RlUG9pbnQgaXMgZmVkIHdpdGggYWxsIGNoYXJhY3RlcnMgYXMgYXJndW1lbnRzLlxuICogQnV0IG1vc3QgZW52aXJvbm1lbnRzIGhhdmUgYSBtYXhpbXVtIG51bWJlciBvZiBhcmd1bWVudHMgcGVyIGZ1bmN0aW9ucy5cbiAqIEZvciBlZmZpZW5jeSByZWFzb25zIHdlIGFwcGx5IGEgbWF4aW11bSBvZiAxMDAwMCBjaGFyYWN0ZXJzIGF0IG9uY2UuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHJlYWQgU3RyaW5nLlxuICovXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmV4cG9ydCBjb25zdCBfcmVhZFZhclN0cmluZ1BvbHlmaWxsID0gZGVjb2RlciA9PiB7XG4gIGxldCByZW1haW5pbmdMZW4gPSByZWFkVmFyVWludChkZWNvZGVyKVxuICBpZiAocmVtYWluaW5nTGVuID09PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH0gZWxzZSB7XG4gICAgbGV0IGVuY29kZWRTdHJpbmcgPSBTdHJpbmcuZnJvbUNvZGVQb2ludChyZWFkVWludDgoZGVjb2RlcikpIC8vIHJlbWVtYmVyIHRvIGRlY3JlYXNlIHJlbWFpbmluZ0xlblxuICAgIGlmICgtLXJlbWFpbmluZ0xlbiA8IDEwMCkgeyAvLyBkbyBub3QgY3JlYXRlIGEgVWludDhBcnJheSBmb3Igc21hbGwgc3RyaW5nc1xuICAgICAgd2hpbGUgKHJlbWFpbmluZ0xlbi0tKSB7XG4gICAgICAgIGVuY29kZWRTdHJpbmcgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQocmVhZFVpbnQ4KGRlY29kZXIpKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAocmVtYWluaW5nTGVuID4gMCkge1xuICAgICAgICBjb25zdCBuZXh0TGVuID0gcmVtYWluaW5nTGVuIDwgMTAwMDAgPyByZW1haW5pbmdMZW4gOiAxMDAwMFxuICAgICAgICAvLyB0aGlzIGlzIGRhbmdlcm91cywgd2UgY3JlYXRlIGEgZnJlc2ggYXJyYXkgdmlldyBmcm9tIHRoZSBleGlzdGluZyBidWZmZXJcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBkZWNvZGVyLmFyci5zdWJhcnJheShkZWNvZGVyLnBvcywgZGVjb2Rlci5wb3MgKyBuZXh0TGVuKVxuICAgICAgICBkZWNvZGVyLnBvcyArPSBuZXh0TGVuXG4gICAgICAgIC8vIFN0YXJ0aW5nIHdpdGggRVM1LjEgd2UgY2FuIHN1cHBseSBhIGdlbmVyaWMgYXJyYXktbGlrZSBvYmplY3QgYXMgYXJndW1lbnRzXG4gICAgICAgIGVuY29kZWRTdHJpbmcgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQuYXBwbHkobnVsbCwgLyoqIEB0eXBlIHthbnl9ICovIChieXRlcykpXG4gICAgICAgIHJlbWFpbmluZ0xlbiAtPSBuZXh0TGVuXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKGVuY29kZWRTdHJpbmcpKVxuICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZWFkIFN0cmluZ1xuICovXG5leHBvcnQgY29uc3QgX3JlYWRWYXJTdHJpbmdOYXRpdmUgPSBkZWNvZGVyID0+XG4gIC8qKiBAdHlwZSBhbnkgKi8gKHN0cmluZy51dGY4VGV4dERlY29kZXIpLmRlY29kZShyZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcblxuLyoqXG4gKiBSZWFkIHN0cmluZyBvZiB2YXJpYWJsZSBsZW5ndGhcbiAqICogdmFyVWludCBpcyB1c2VkIHRvIHN0b3JlIHRoZSBsZW5ndGggb2YgdGhlIHN0cmluZ1xuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZWFkIFN0cmluZ1xuICpcbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCByZWFkVmFyU3RyaW5nID0gc3RyaW5nLnV0ZjhUZXh0RGVjb2RlciA/IF9yZWFkVmFyU3RyaW5nTmF0aXZlIDogX3JlYWRWYXJTdHJpbmdQb2x5ZmlsbFxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRUZXJtaW5hdGVkVWludDhBcnJheSA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gIGxldCBiXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgYiA9IHJlYWRVaW50OChkZWNvZGVyKVxuICAgIGlmIChiID09PSAwKSB7XG4gICAgICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG4gICAgfVxuICAgIGlmIChiID09PSAxKSB7XG4gICAgICBiID0gcmVhZFVpbnQ4KGRlY29kZXIpXG4gICAgfVxuICAgIGVuY29kaW5nLndyaXRlKGVuY29kZXIsIGIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRUZXJtaW5hdGVkU3RyaW5nID0gZGVjb2RlciA9PiBzdHJpbmcuZGVjb2RlVXRmOChyZWFkVGVybWluYXRlZFVpbnQ4QXJyYXkoZGVjb2RlcikpXG5cbi8qKlxuICogTG9vayBhaGVhZCBhbmQgcmVhZCB2YXJTdHJpbmcgd2l0aG91dCBpbmNyZW1lbnRpbmcgcG9zaXRpb25cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgcGVla1ZhclN0cmluZyA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhclN0cmluZyhkZWNvZGVyKVxuICBkZWNvZGVyLnBvcyA9IHBvc1xuICByZXR1cm4gc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICogQHJldHVybiB7RGF0YVZpZXd9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkRnJvbURhdGFWaWV3ID0gKGRlY29kZXIsIGxlbikgPT4ge1xuICBjb25zdCBkdiA9IG5ldyBEYXRhVmlldyhkZWNvZGVyLmFyci5idWZmZXIsIGRlY29kZXIuYXJyLmJ5dGVPZmZzZXQgKyBkZWNvZGVyLnBvcywgbGVuKVxuICBkZWNvZGVyLnBvcyArPSBsZW5cbiAgcmV0dXJuIGR2XG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkRmxvYXQzMiA9IGRlY29kZXIgPT4gcmVhZEZyb21EYXRhVmlldyhkZWNvZGVyLCA0KS5nZXRGbG9hdDMyKDAsIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICovXG5leHBvcnQgY29uc3QgcmVhZEZsb2F0NjQgPSBkZWNvZGVyID0+IHJlYWRGcm9tRGF0YVZpZXcoZGVjb2RlciwgOCkuZ2V0RmxvYXQ2NCgwLCBmYWxzZSlcblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRCaWdJbnQ2NCA9IGRlY29kZXIgPT4gLyoqIEB0eXBlIHthbnl9ICovIChyZWFkRnJvbURhdGFWaWV3KGRlY29kZXIsIDgpKS5nZXRCaWdJbnQ2NCgwLCBmYWxzZSlcblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRCaWdVaW50NjQgPSBkZWNvZGVyID0+IC8qKiBAdHlwZSB7YW55fSAqLyAocmVhZEZyb21EYXRhVmlldyhkZWNvZGVyLCA4KSkuZ2V0QmlnVWludDY0KDAsIGZhbHNlKVxuXG4vKipcbiAqIEB0eXBlIHtBcnJheTxmdW5jdGlvbihEZWNvZGVyKTphbnk+fVxuICovXG5jb25zdCByZWFkQW55TG9va3VwVGFibGUgPSBbXG4gIGRlY29kZXIgPT4gdW5kZWZpbmVkLCAvLyBDQVNFIDEyNzogdW5kZWZpbmVkXG4gIGRlY29kZXIgPT4gbnVsbCwgLy8gQ0FTRSAxMjY6IG51bGxcbiAgcmVhZFZhckludCwgLy8gQ0FTRSAxMjU6IGludGVnZXJcbiAgcmVhZEZsb2F0MzIsIC8vIENBU0UgMTI0OiBmbG9hdDMyXG4gIHJlYWRGbG9hdDY0LCAvLyBDQVNFIDEyMzogZmxvYXQ2NFxuICByZWFkQmlnSW50NjQsIC8vIENBU0UgMTIyOiBiaWdpbnRcbiAgZGVjb2RlciA9PiBmYWxzZSwgLy8gQ0FTRSAxMjE6IGJvb2xlYW4gKGZhbHNlKVxuICBkZWNvZGVyID0+IHRydWUsIC8vIENBU0UgMTIwOiBib29sZWFuICh0cnVlKVxuICByZWFkVmFyU3RyaW5nLCAvLyBDQVNFIDExOTogc3RyaW5nXG4gIGRlY29kZXIgPT4geyAvLyBDQVNFIDExODogb2JqZWN0PHN0cmluZyxhbnk+XG4gICAgY29uc3QgbGVuID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7T2JqZWN0PHN0cmluZyxhbnk+fVxuICAgICAqL1xuICAgIGNvbnN0IG9iaiA9IHt9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3Qga2V5ID0gcmVhZFZhclN0cmluZyhkZWNvZGVyKVxuICAgICAgb2JqW2tleV0gPSByZWFkQW55KGRlY29kZXIpXG4gICAgfVxuICAgIHJldHVybiBvYmpcbiAgfSxcbiAgZGVjb2RlciA9PiB7IC8vIENBU0UgMTE3OiBhcnJheTxhbnk+XG4gICAgY29uc3QgbGVuID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICBjb25zdCBhcnIgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyci5wdXNoKHJlYWRBbnkoZGVjb2RlcikpXG4gICAgfVxuICAgIHJldHVybiBhcnJcbiAgfSxcbiAgcmVhZFZhclVpbnQ4QXJyYXkgLy8gQ0FTRSAxMTY6IFVpbnQ4QXJyYXlcbl1cblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRBbnkgPSBkZWNvZGVyID0+IHJlYWRBbnlMb29rdXBUYWJsZVsxMjcgLSByZWFkVWludDgoZGVjb2RlcildKGRlY29kZXIpXG5cbi8qKlxuICogVCBtdXN0IG5vdCBiZSBudWxsLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbmV4cG9ydCBjbGFzcyBSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtmdW5jdGlvbihEZWNvZGVyKTpUfSByZWFkZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5LCByZWFkZXIpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIFRoZSByZWFkZXJcbiAgICAgKi9cbiAgICB0aGlzLnJlYWRlciA9IHJlYWRlclxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7VHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucyA9IG51bGxcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIHRoaXMucyA9IHRoaXMucmVhZGVyKHRoaXMpXG4gICAgICBpZiAoaGFzQ29udGVudCh0aGlzKSkge1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAxIC8vIHNlZSBlbmNvZGVyIGltcGxlbWVudGF0aW9uIGZvciB0aGUgcmVhc29uIHdoeSB0aGlzIGlzIGluY3JlbWVudGVkXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvdW50ID0gLTEgLy8gcmVhZCB0aGUgY3VycmVudCB2YWx1ZSBmb3JldmVyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY291bnQtLVxuICAgIHJldHVybiAvKiogQHR5cGUge1R9ICovICh0aGlzLnMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEludERpZmZEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSwgc3RhcnQpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IHN0YXJ0XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZCAoKSB7XG4gICAgdGhpcy5zICs9IHJlYWRWYXJJbnQodGhpcylcbiAgICByZXR1cm4gdGhpcy5zXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJsZUludERpZmZEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSwgc3RhcnQpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IHN0YXJ0XG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICByZWFkICgpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PT0gMCkge1xuICAgICAgdGhpcy5zICs9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIGlmIChoYXNDb250ZW50KHRoaXMpKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSByZWFkVmFyVWludCh0aGlzKSArIDEgLy8gc2VlIGVuY29kZXIgaW1wbGVtZW50YXRpb24gZm9yIHRoZSByZWFzb24gd2h5IHRoaXMgaXMgaW5jcmVtZW50ZWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAtMSAvLyByZWFkIHRoZSBjdXJyZW50IHZhbHVlIGZvcmV2ZXJcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAodGhpcy5zKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVaW50T3B0UmxlRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIHJlYWQgKCkge1xuICAgIGlmICh0aGlzLmNvdW50ID09PSAwKSB7XG4gICAgICB0aGlzLnMgPSByZWFkVmFySW50KHRoaXMpXG4gICAgICAvLyBpZiB0aGUgc2lnbiBpcyBuZWdhdGl2ZSwgd2UgcmVhZCB0aGUgY291bnQgdG9vLCBvdGhlcndpc2UgY291bnQgaXMgMVxuICAgICAgY29uc3QgaXNOZWdhdGl2ZSA9IG1hdGguaXNOZWdhdGl2ZVplcm8odGhpcy5zKVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgICAgIHRoaXMucyA9IC10aGlzLnNcbiAgICAgICAgdGhpcy5jb3VudCA9IHJlYWRWYXJVaW50KHRoaXMpICsgMlxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvdW50LS1cbiAgICByZXR1cm4gLyoqIEB0eXBlIHtudW1iZXJ9ICovICh0aGlzLnMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEluY1VpbnRPcHRSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgc3VwZXIodWludDhBcnJheSlcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IDBcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIHRoaXMucyA9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIC8vIGlmIHRoZSBzaWduIGlzIG5lZ2F0aXZlLCB3ZSByZWFkIHRoZSBjb3VudCB0b28sIG90aGVyd2lzZSBjb3VudCBpcyAxXG4gICAgICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyh0aGlzLnMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgaWYgKGlzTmVnYXRpdmUpIHtcbiAgICAgICAgdGhpcy5zID0gLXRoaXMuc1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY291bnQtLVxuICAgIHJldHVybiAvKiogQHR5cGUge251bWJlcn0gKi8gKHRoaXMucysrKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnREaWZmT3B0UmxlRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgICB0aGlzLmRpZmYgPSAwXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIGNvbnN0IGRpZmYgPSByZWFkVmFySW50KHRoaXMpXG4gICAgICAvLyBpZiB0aGUgZmlyc3QgYml0IGlzIHNldCwgd2UgcmVhZCBtb3JlIGRhdGFcbiAgICAgIGNvbnN0IGhhc0NvdW50ID0gZGlmZiAmIDFcbiAgICAgIHRoaXMuZGlmZiA9IG1hdGguZmxvb3IoZGlmZiAvIDIpIC8vIHNoaWZ0ID4+IDFcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICBpZiAoaGFzQ291bnQpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IHJlYWRWYXJVaW50KHRoaXMpICsgMlxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnMgKz0gdGhpcy5kaWZmXG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIHRoaXMuc1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHVpbnQ4QXJyYXkpIHtcbiAgICB0aGlzLmRlY29kZXIgPSBuZXcgVWludE9wdFJsZURlY29kZXIodWludDhBcnJheSlcbiAgICB0aGlzLnN0ciA9IHJlYWRWYXJTdHJpbmcodGhpcy5kZWNvZGVyKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zcG9zID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHJlYWQgKCkge1xuICAgIGNvbnN0IGVuZCA9IHRoaXMuc3BvcyArIHRoaXMuZGVjb2Rlci5yZWFkKClcbiAgICBjb25zdCByZXMgPSB0aGlzLnN0ci5zbGljZSh0aGlzLnNwb3MsIGVuZClcbiAgICB0aGlzLnNwb3MgPSBlbmRcbiAgICByZXR1cm4gcmVzXG4gIH1cbn1cbiIsICJpbXBvcnQge1xuICBmaW5kSW5kZXhTUyxcbiAgZ2V0U3RhdGUsXG4gIHNwbGl0SXRlbSxcbiAgaXRlcmF0ZVN0cnVjdHMsXG4gIFVwZGF0ZUVuY29kZXJWMixcbiAgRFNEZWNvZGVyVjEsIERTRW5jb2RlclYxLCBEU0RlY29kZXJWMiwgRFNFbmNvZGVyVjIsIEl0ZW0sIEdDLCBTdHJ1Y3RTdG9yZSwgVHJhbnNhY3Rpb24sIElEIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICdsaWIwL2FycmF5J1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcblxuZXhwb3J0IGNsYXNzIERlbGV0ZUl0ZW0ge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNsb2NrXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChjbG9jaywgbGVuKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLmNsb2NrID0gY2xvY2tcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMubGVuID0gbGVuXG4gIH1cbn1cblxuLyoqXG4gKiBXZSBubyBsb25nZXIgbWFpbnRhaW4gYSBEZWxldGVTdG9yZS4gRGVsZXRlU2V0IGlzIGEgdGVtcG9yYXJ5IG9iamVjdCB0aGF0IGlzIGNyZWF0ZWQgd2hlbiBuZWVkZWQuXG4gKiAtIFdoZW4gY3JlYXRlZCBpbiBhIHRyYW5zYWN0aW9uLCBpdCBtdXN0IG9ubHkgYmUgYWNjZXNzZWQgYWZ0ZXIgc29ydGluZywgYW5kIG1lcmdpbmdcbiAqICAgLSBUaGlzIERlbGV0ZVNldCBpcyBzZW5kIHRvIG90aGVyIGNsaWVudHNcbiAqIC0gV2UgZG8gbm90IGNyZWF0ZSBhIERlbGV0ZVNldCB3aGVuIHdlIHNlbmQgYSBzeW5jIG1lc3NhZ2UuIFRoZSBEZWxldGVTZXQgbWVzc2FnZSBpcyBjcmVhdGVkIGRpcmVjdGx5IGZyb20gU3RydWN0U3RvcmVcbiAqIC0gV2UgcmVhZCBhIERlbGV0ZVNldCBhcyBwYXJ0IG9mIGEgc3luYy91cGRhdGUgbWVzc2FnZS4gSW4gdGhpcyBjYXNlIHRoZSBEZWxldGVTZXQgaXMgYWxyZWFkeSBzb3J0ZWQgYW5kIG1lcmdlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlbGV0ZVNldCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7TWFwPG51bWJlcixBcnJheTxEZWxldGVJdGVtPj59XG4gICAgICovXG4gICAgdGhpcy5jbGllbnRzID0gbmV3IE1hcCgpXG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgYWxsIHN0cnVjdHMgdGhhdCB0aGUgRGVsZXRlU2V0IGdjJ3MuXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7RGVsZXRlU2V0fSBkc1xuICogQHBhcmFtIHtmdW5jdGlvbihHQ3xJdGVtKTp2b2lkfSBmXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBpdGVyYXRlRGVsZXRlZFN0cnVjdHMgPSAodHJhbnNhY3Rpb24sIGRzLCBmKSA9PlxuICBkcy5jbGllbnRzLmZvckVhY2goKGRlbGV0ZXMsIGNsaWVudGlkKSA9PiB7XG4gICAgY29uc3Qgc3RydWN0cyA9IC8qKiBAdHlwZSB7QXJyYXk8R0N8SXRlbT59ICovICh0cmFuc2FjdGlvbi5kb2Muc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50aWQpKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVsZXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVsID0gZGVsZXRlc1tpXVxuICAgICAgaXRlcmF0ZVN0cnVjdHModHJhbnNhY3Rpb24sIHN0cnVjdHMsIGRlbC5jbG9jaywgZGVsLmxlbiwgZilcbiAgICB9XG4gIH0pXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxEZWxldGVJdGVtPn0gZGlzXG4gKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAqIEByZXR1cm4ge251bWJlcnxudWxsfVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmRJbmRleERTID0gKGRpcywgY2xvY2spID0+IHtcbiAgbGV0IGxlZnQgPSAwXG4gIGxldCByaWdodCA9IGRpcy5sZW5ndGggLSAxXG4gIHdoaWxlIChsZWZ0IDw9IHJpZ2h0KSB7XG4gICAgY29uc3QgbWlkaW5kZXggPSBtYXRoLmZsb29yKChsZWZ0ICsgcmlnaHQpIC8gMilcbiAgICBjb25zdCBtaWQgPSBkaXNbbWlkaW5kZXhdXG4gICAgY29uc3QgbWlkY2xvY2sgPSBtaWQuY2xvY2tcbiAgICBpZiAobWlkY2xvY2sgPD0gY2xvY2spIHtcbiAgICAgIGlmIChjbG9jayA8IG1pZGNsb2NrICsgbWlkLmxlbikge1xuICAgICAgICByZXR1cm4gbWlkaW5kZXhcbiAgICAgIH1cbiAgICAgIGxlZnQgPSBtaWRpbmRleCArIDFcbiAgICB9IGVsc2Uge1xuICAgICAgcmlnaHQgPSBtaWRpbmRleCAtIDFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqIEBwYXJhbSB7SUR9IGlkXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGlzRGVsZXRlZCA9IChkcywgaWQpID0+IHtcbiAgY29uc3QgZGlzID0gZHMuY2xpZW50cy5nZXQoaWQuY2xpZW50KVxuICByZXR1cm4gZGlzICE9PSB1bmRlZmluZWQgJiYgZmluZEluZGV4RFMoZGlzLCBpZC5jbG9jaykgIT09IG51bGxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBzb3J0QW5kTWVyZ2VEZWxldGVTZXQgPSBkcyA9PiB7XG4gIGRzLmNsaWVudHMuZm9yRWFjaChkZWxzID0+IHtcbiAgICBkZWxzLnNvcnQoKGEsIGIpID0+IGEuY2xvY2sgLSBiLmNsb2NrKVxuICAgIC8vIG1lcmdlIGl0ZW1zIHdpdGhvdXQgZmlsdGVyaW5nIG9yIHNwbGljaW5nIHRoZSBhcnJheVxuICAgIC8vIGkgaXMgdGhlIGN1cnJlbnQgcG9pbnRlclxuICAgIC8vIGogcmVmZXJzIHRvIHRoZSBjdXJyZW50IGluc2VydCBwb3NpdGlvbiBmb3IgdGhlIHBvaW50ZWQgaXRlbVxuICAgIC8vIHRyeSB0byBtZXJnZSBkZWxzW2ldIGludG8gZGVsc1tqLTFdIG9yIHNldCBkZWxzW2pdPWRlbHNbaV1cbiAgICBsZXQgaSwgalxuICAgIGZvciAoaSA9IDEsIGogPSAxOyBpIDwgZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbGVmdCA9IGRlbHNbaiAtIDFdXG4gICAgICBjb25zdCByaWdodCA9IGRlbHNbaV1cbiAgICAgIGlmIChsZWZ0LmNsb2NrICsgbGVmdC5sZW4gPj0gcmlnaHQuY2xvY2spIHtcbiAgICAgICAgbGVmdC5sZW4gPSBtYXRoLm1heChsZWZ0LmxlbiwgcmlnaHQuY2xvY2sgKyByaWdodC5sZW4gLSBsZWZ0LmNsb2NrKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGogPCBpKSB7XG4gICAgICAgICAgZGVsc1tqXSA9IHJpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgaisrXG4gICAgICB9XG4gICAgfVxuICAgIGRlbHMubGVuZ3RoID0galxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8RGVsZXRlU2V0Pn0gZHNzXG4gKiBAcmV0dXJuIHtEZWxldGVTZXR9IEEgZnJlc2ggRGVsZXRlU2V0XG4gKi9cbmV4cG9ydCBjb25zdCBtZXJnZURlbGV0ZVNldHMgPSBkc3MgPT4ge1xuICBjb25zdCBtZXJnZWQgPSBuZXcgRGVsZXRlU2V0KClcbiAgZm9yIChsZXQgZHNzSSA9IDA7IGRzc0kgPCBkc3MubGVuZ3RoOyBkc3NJKyspIHtcbiAgICBkc3NbZHNzSV0uY2xpZW50cy5mb3JFYWNoKChkZWxzTGVmdCwgY2xpZW50KSA9PiB7XG4gICAgICBpZiAoIW1lcmdlZC5jbGllbnRzLmhhcyhjbGllbnQpKSB7XG4gICAgICAgIC8vIFdyaXRlIGFsbCBtaXNzaW5nIGtleXMgZnJvbSBjdXJyZW50IGRzIGFuZCBhbGwgZm9sbG93aW5nLlxuICAgICAgICAvLyBJZiBtZXJnZWQgYWxyZWFkeSBjb250YWlucyBgY2xpZW50YCBjdXJyZW50IGRzIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7QXJyYXk8RGVsZXRlSXRlbT59XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBkZWxzID0gZGVsc0xlZnQuc2xpY2UoKVxuICAgICAgICBmb3IgKGxldCBpID0gZHNzSSArIDE7IGkgPCBkc3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhcnJheS5hcHBlbmRUbyhkZWxzLCBkc3NbaV0uY2xpZW50cy5nZXQoY2xpZW50KSB8fCBbXSlcbiAgICAgICAgfVxuICAgICAgICBtZXJnZWQuY2xpZW50cy5zZXQoY2xpZW50LCBkZWxzKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgc29ydEFuZE1lcmdlRGVsZXRlU2V0KG1lcmdlZClcbiAgcmV0dXJuIG1lcmdlZFxufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVsZXRlU2V0fSBkc1xuICogQHBhcmFtIHtudW1iZXJ9IGNsaWVudFxuICogQHBhcmFtIHtudW1iZXJ9IGNsb2NrXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgYWRkVG9EZWxldGVTZXQgPSAoZHMsIGNsaWVudCwgY2xvY2ssIGxlbmd0aCkgPT4ge1xuICBtYXAuc2V0SWZVbmRlZmluZWQoZHMuY2xpZW50cywgY2xpZW50LCAoKSA9PiAvKiogQHR5cGUge0FycmF5PERlbGV0ZUl0ZW0+fSAqLyAoW10pKS5wdXNoKG5ldyBEZWxldGVJdGVtKGNsb2NrLCBsZW5ndGgpKVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlRGVsZXRlU2V0ID0gKCkgPT4gbmV3IERlbGV0ZVNldCgpXG5cbi8qKlxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3NcbiAqIEByZXR1cm4ge0RlbGV0ZVNldH0gTWVyZ2VkIGFuZCBzb3J0ZWQgRGVsZXRlU2V0XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRGVsZXRlU2V0RnJvbVN0cnVjdFN0b3JlID0gc3MgPT4ge1xuICBjb25zdCBkcyA9IGNyZWF0ZURlbGV0ZVNldCgpXG4gIHNzLmNsaWVudHMuZm9yRWFjaCgoc3RydWN0cywgY2xpZW50KSA9PiB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PERlbGV0ZUl0ZW0+fVxuICAgICAqL1xuICAgIGNvbnN0IGRzaXRlbXMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RydWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3RydWN0ID0gc3RydWN0c1tpXVxuICAgICAgaWYgKHN0cnVjdC5kZWxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNsb2NrID0gc3RydWN0LmlkLmNsb2NrXG4gICAgICAgIGxldCBsZW4gPSBzdHJ1Y3QubGVuZ3RoXG4gICAgICAgIGlmIChpICsgMSA8IHN0cnVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yIChsZXQgbmV4dCA9IHN0cnVjdHNbaSArIDFdOyBpICsgMSA8IHN0cnVjdHMubGVuZ3RoICYmIG5leHQuZGVsZXRlZDsgbmV4dCA9IHN0cnVjdHNbKytpICsgMV0pIHtcbiAgICAgICAgICAgIGxlbiArPSBuZXh0Lmxlbmd0aFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBkc2l0ZW1zLnB1c2gobmV3IERlbGV0ZUl0ZW0oY2xvY2ssIGxlbikpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkc2l0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgIGRzLmNsaWVudHMuc2V0KGNsaWVudCwgZHNpdGVtcylcbiAgICB9XG4gIH0pXG4gIHJldHVybiBkc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RFNFbmNvZGVyVjEgfCBEU0VuY29kZXJWMn0gZW5jb2RlclxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVEZWxldGVTZXQgPSAoZW5jb2RlciwgZHMpID0+IHtcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGRzLmNsaWVudHMuc2l6ZSlcblxuICAvLyBFbnN1cmUgdGhhdCB0aGUgZGVsZXRlIHNldCBpcyB3cml0dGVuIGluIGEgZGV0ZXJtaW5pc3RpYyBvcmRlclxuICBhcnJheS5mcm9tKGRzLmNsaWVudHMuZW50cmllcygpKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiWzBdIC0gYVswXSlcbiAgICAuZm9yRWFjaCgoW2NsaWVudCwgZHNpdGVtc10pID0+IHtcbiAgICAgIGVuY29kZXIucmVzZXREc0N1clZhbCgpXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgY2xpZW50KVxuICAgICAgY29uc3QgbGVuID0gZHNpdGVtcy5sZW5ndGhcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCBsZW4pXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBkc2l0ZW1zW2ldXG4gICAgICAgIGVuY29kZXIud3JpdGVEc0Nsb2NrKGl0ZW0uY2xvY2spXG4gICAgICAgIGVuY29kZXIud3JpdGVEc0xlbihpdGVtLmxlbilcbiAgICAgIH1cbiAgICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RFNEZWNvZGVyVjEgfCBEU0RlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7RGVsZXRlU2V0fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWREZWxldGVTZXQgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgZHMgPSBuZXcgRGVsZXRlU2V0KClcbiAgY29uc3QgbnVtQ2xpZW50cyA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ2xpZW50czsgaSsrKSB7XG4gICAgZGVjb2Rlci5yZXNldERzQ3VyVmFsKClcbiAgICBjb25zdCBjbGllbnQgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgIGNvbnN0IG51bWJlck9mRGVsZXRlcyA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgaWYgKG51bWJlck9mRGVsZXRlcyA+IDApIHtcbiAgICAgIGNvbnN0IGRzRmllbGQgPSBtYXAuc2V0SWZVbmRlZmluZWQoZHMuY2xpZW50cywgY2xpZW50LCAoKSA9PiAvKiogQHR5cGUge0FycmF5PERlbGV0ZUl0ZW0+fSAqLyAoW10pKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZkRlbGV0ZXM7IGkrKykge1xuICAgICAgICBkc0ZpZWxkLnB1c2gobmV3IERlbGV0ZUl0ZW0oZGVjb2Rlci5yZWFkRHNDbG9jaygpLCBkZWNvZGVyLnJlYWREc0xlbigpKSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRzXG59XG5cbi8qKlxuICogQHRvZG8gWURlY29kZXIgYWxzbyBjb250YWlucyByZWZlcmVuY2VzIHRvIFN0cmluZyBhbmQgb3RoZXIgRGVjb2RlcnMuIFdvdWxkIG1ha2Ugc2Vuc2UgdG8gZXhjaGFuZ2UgWURlY29kZXIudG9VaW50OEFycmF5IGZvciBZRGVjb2Rlci5Ec1RvVWludDhBcnJheSgpLi5cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7RFNEZWNvZGVyVjEgfCBEU0RlY29kZXJWMn0gZGVjb2RlclxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fG51bGx9IFJldHVybnMgYSB2MiB1cGRhdGUgY29udGFpbmluZyBhbGwgZGVsZXRlcyB0aGF0IGNvdWxkbid0IGJlIGFwcGxpZWQgeWV0OyBvciBudWxsIGlmIGFsbCBkZWxldGVzIHdlcmUgYXBwbGllZCBzdWNjZXNzZnVsbHkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZEFuZEFwcGx5RGVsZXRlU2V0ID0gKGRlY29kZXIsIHRyYW5zYWN0aW9uLCBzdG9yZSkgPT4ge1xuICBjb25zdCB1bmFwcGxpZWREUyA9IG5ldyBEZWxldGVTZXQoKVxuICBjb25zdCBudW1DbGllbnRzID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DbGllbnRzOyBpKyspIHtcbiAgICBkZWNvZGVyLnJlc2V0RHNDdXJWYWwoKVxuICAgIGNvbnN0IGNsaWVudCA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgY29uc3QgbnVtYmVyT2ZEZWxldGVzID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgICBjb25zdCBzdHJ1Y3RzID0gc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50KSB8fCBbXVxuICAgIGNvbnN0IHN0YXRlID0gZ2V0U3RhdGUoc3RvcmUsIGNsaWVudClcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mRGVsZXRlczsgaSsrKSB7XG4gICAgICBjb25zdCBjbG9jayA9IGRlY29kZXIucmVhZERzQ2xvY2soKVxuICAgICAgY29uc3QgY2xvY2tFbmQgPSBjbG9jayArIGRlY29kZXIucmVhZERzTGVuKClcbiAgICAgIGlmIChjbG9jayA8IHN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA8IGNsb2NrRW5kKSB7XG4gICAgICAgICAgYWRkVG9EZWxldGVTZXQodW5hcHBsaWVkRFMsIGNsaWVudCwgc3RhdGUsIGNsb2NrRW5kIC0gc3RhdGUpXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGluZGV4ID0gZmluZEluZGV4U1Moc3RydWN0cywgY2xvY2spXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXZSBjYW4gaWdub3JlIHRoZSBjYXNlIG9mIEdDIGFuZCBEZWxldGUgc3RydWN0cywgYmVjYXVzZSB3ZSBhcmUgZ29pbmcgdG8gc2tpcCB0aGVtXG4gICAgICAgICAqIEB0eXBlIHtJdGVtfVxuICAgICAgICAgKi9cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBsZXQgc3RydWN0ID0gc3RydWN0c1tpbmRleF1cbiAgICAgICAgLy8gc3BsaXQgdGhlIGZpcnN0IGl0ZW0gaWYgbmVjZXNzYXJ5XG4gICAgICAgIGlmICghc3RydWN0LmRlbGV0ZWQgJiYgc3RydWN0LmlkLmNsb2NrIDwgY2xvY2spIHtcbiAgICAgICAgICBzdHJ1Y3RzLnNwbGljZShpbmRleCArIDEsIDAsIHNwbGl0SXRlbSh0cmFuc2FjdGlvbiwgc3RydWN0LCBjbG9jayAtIHN0cnVjdC5pZC5jbG9jaykpXG4gICAgICAgICAgaW5kZXgrKyAvLyBpbmNyZWFzZSB3ZSBub3cgd2FudCB0byB1c2UgdGhlIG5leHQgc3RydWN0XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgc3RydWN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgc3RydWN0ID0gc3RydWN0c1tpbmRleCsrXVxuICAgICAgICAgIGlmIChzdHJ1Y3QuaWQuY2xvY2sgPCBjbG9ja0VuZCkge1xuICAgICAgICAgICAgaWYgKCFzdHJ1Y3QuZGVsZXRlZCkge1xuICAgICAgICAgICAgICBpZiAoY2xvY2tFbmQgPCBzdHJ1Y3QuaWQuY2xvY2sgKyBzdHJ1Y3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc3RydWN0cy5zcGxpY2UoaW5kZXgsIDAsIHNwbGl0SXRlbSh0cmFuc2FjdGlvbiwgc3RydWN0LCBjbG9ja0VuZCAtIHN0cnVjdC5pZC5jbG9jaykpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RydWN0LmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFkZFRvRGVsZXRlU2V0KHVuYXBwbGllZERTLCBjbGllbnQsIGNsb2NrLCBjbG9ja0VuZCAtIGNsb2NrKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAodW5hcHBsaWVkRFMuY2xpZW50cy5zaXplID4gMCkge1xuICAgIGNvbnN0IGRzID0gbmV3IFVwZGF0ZUVuY29kZXJWMigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGRzLnJlc3RFbmNvZGVyLCAwKSAvLyBlbmNvZGUgMCBzdHJ1Y3RzXG4gICAgd3JpdGVEZWxldGVTZXQoZHMsIHVuYXBwbGllZERTKVxuICAgIHJldHVybiBkcy50b1VpbnQ4QXJyYXkoKVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzMVxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzMlxuICovXG5leHBvcnQgY29uc3QgZXF1YWxEZWxldGVTZXRzID0gKGRzMSwgZHMyKSA9PiB7XG4gIGlmIChkczEuY2xpZW50cy5zaXplICE9PSBkczIuY2xpZW50cy5zaXplKSByZXR1cm4gZmFsc2VcbiAgZm9yIChjb25zdCBbY2xpZW50LCBkZWxldGVJdGVtczFdIG9mIGRzMS5jbGllbnRzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IGRlbGV0ZUl0ZW1zMiA9IC8qKiBAdHlwZSB7QXJyYXk8aW1wb3J0KCcuLi9pbnRlcm5hbHMuanMnKS5EZWxldGVJdGVtPn0gKi8gKGRzMi5jbGllbnRzLmdldChjbGllbnQpKVxuICAgIGlmIChkZWxldGVJdGVtczIgPT09IHVuZGVmaW5lZCB8fCBkZWxldGVJdGVtczEubGVuZ3RoICE9PSBkZWxldGVJdGVtczIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlbGV0ZUl0ZW1zMS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGkxID0gZGVsZXRlSXRlbXMxW2ldXG4gICAgICBjb25zdCBkaTIgPSBkZWxldGVJdGVtczJbaV1cbiAgICAgIGlmIChkaTEuY2xvY2sgIT09IGRpMi5jbG9jayB8fCBkaTEubGVuICE9PSBkaTIubGVuKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIHRpbWUuXG4gKlxuICogQG1vZHVsZSB0aW1lXG4gKi9cblxuaW1wb3J0ICogYXMgbWV0cmljIGZyb20gJy4vbWV0cmljLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5cbi8qKlxuICogUmV0dXJuIGN1cnJlbnQgdGltZS5cbiAqXG4gKiBAcmV0dXJuIHtEYXRlfVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IG5ldyBEYXRlKClcblxuLyoqXG4gKiBSZXR1cm4gY3VycmVudCB1bml4IHRpbWUuXG4gKlxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgZ2V0VW5peFRpbWUgPSBEYXRlLm5vd1xuXG4vKipcbiAqIFRyYW5zZm9ybSB0aW1lIChpbiBtcykgdG8gYSBodW1hbiByZWFkYWJsZSBmb3JtYXQuIEUuZy4gMTEwMCA9PiAxLjFzLiA2MHMgPT4gMW1pbi4gLjAwMSA9PiAxMFx1MDNCQ3MuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGQgZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGh1bWFuaXplZCBhcHByb3hpbWF0aW9uIG9mIHRpbWVcbiAqL1xuZXhwb3J0IGNvbnN0IGh1bWFuaXplRHVyYXRpb24gPSBkID0+IHtcbiAgaWYgKGQgPCA2MDAwMCkge1xuICAgIGNvbnN0IHAgPSBtZXRyaWMucHJlZml4KGQsIC0xKVxuICAgIHJldHVybiBtYXRoLnJvdW5kKHAubiAqIDEwMCkgLyAxMDAgKyBwLnByZWZpeCArICdzJ1xuICB9XG4gIGQgPSBtYXRoLmZsb29yKGQgLyAxMDAwKVxuICBjb25zdCBzZWNvbmRzID0gZCAlIDYwXG4gIGNvbnN0IG1pbnV0ZXMgPSBtYXRoLmZsb29yKGQgLyA2MCkgJSA2MFxuICBjb25zdCBob3VycyA9IG1hdGguZmxvb3IoZCAvIDM2MDApICUgMjRcbiAgY29uc3QgZGF5cyA9IG1hdGguZmxvb3IoZCAvIDg2NDAwKVxuICBpZiAoZGF5cyA+IDApIHtcbiAgICByZXR1cm4gZGF5cyArICdkJyArICgoaG91cnMgPiAwIHx8IG1pbnV0ZXMgPiAzMCkgPyAnICcgKyAobWludXRlcyA+IDMwID8gaG91cnMgKyAxIDogaG91cnMpICsgJ2gnIDogJycpXG4gIH1cbiAgaWYgKGhvdXJzID4gMCkge1xuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGhvdXJzICsgJ2gnICsgKChtaW51dGVzID4gMCB8fCBzZWNvbmRzID4gMzApID8gJyAnICsgKHNlY29uZHMgPiAzMCA/IG1pbnV0ZXMgKyAxIDogbWludXRlcykgKyAnbWluJyA6ICcnKVxuICB9XG4gIHJldHVybiBtaW51dGVzICsgJ21pbicgKyAoc2Vjb25kcyA+IDAgPyAnICcgKyBzZWNvbmRzICsgJ3MnIDogJycpXG59XG4iLCAiLyoqXG4gKiBVdGlsaXR5IGhlbHBlcnMgdG8gd29yayB3aXRoIHByb21pc2VzLlxuICpcbiAqIEBtb2R1bGUgcHJvbWlzZVxuICovXG5cbmltcG9ydCAqIGFzIHRpbWUgZnJvbSAnLi90aW1lLmpzJ1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAY2FsbGJhY2sgUHJvbWlzZVJlc29sdmVcbiAqIEBwYXJhbSB7VHxQcm9taXNlTGlrZTxUPn0gW3Jlc3VsdF1cbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFByb21pc2VSZXNvbHZlPFQ+LGZ1bmN0aW9uKEVycm9yKTp2b2lkKTphbnl9IGZcbiAqIEByZXR1cm4ge1Byb21pc2U8VD59XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSBmID0+IC8qKiBAdHlwZSB7UHJvbWlzZTxUPn0gKi8gKG5ldyBQcm9taXNlKGYpKVxuXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oZnVuY3Rpb24oKTp2b2lkLGZ1bmN0aW9uKEVycm9yKTp2b2lkKTp2b2lkfSBmXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRW1wdHkgPSBmID0+IG5ldyBQcm9taXNlKGYpXG5cbi8qKlxuICogYFByb21pc2UuYWxsYCB3YWl0IGZvciBhbGwgcHJvbWlzZXMgaW4gdGhlIGFycmF5IHRvIHJlc29sdmUgYW5kIHJldHVybiB0aGUgcmVzdWx0XG4gKiBAdGVtcGxhdGUge3Vua25vd25bXSB8IFtdfSBQU1xuICpcbiAqIEBwYXJhbSB7UFN9IHBzXG4gKiBAcmV0dXJuIHtQcm9taXNlPHsgLXJlYWRvbmx5IFtQIGluIGtleW9mIFBTXTogQXdhaXRlZDxQU1tQXT4gfT59XG4gKi9cbmV4cG9ydCBjb25zdCBhbGwgPSBQcm9taXNlLmFsbC5iaW5kKFByb21pc2UpXG5cbi8qKlxuICogQHBhcmFtIHtFcnJvcn0gW3JlYXNvbl1cbiAqIEByZXR1cm4ge1Byb21pc2U8bmV2ZXI+fVxuICovXG5leHBvcnQgY29uc3QgcmVqZWN0ID0gcmVhc29uID0+IFByb21pc2UucmVqZWN0KHJlYXNvbilcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfHZvaWR9IHJlc1xuICogQHJldHVybiB7UHJvbWlzZTxUfHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgcmVzb2x2ZSA9IHJlcyA9PiBQcm9taXNlLnJlc29sdmUocmVzKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R9IHJlc1xuICogQHJldHVybiB7UHJvbWlzZTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlc29sdmVXaXRoID0gcmVzID0+IFByb21pc2UucmVzb2x2ZShyZXMpXG5cbi8qKlxuICogQHRvZG8gTmV4dCB2ZXJzaW9uLCByZW9yZGVyIHBhcmFtZXRlcnM6IGNoZWNrLCBbdGltZW91dCwgW2ludGVydmFsUmVzb2x1dGlvbl1dXG4gKiBAZGVwcmVjYXRlZCB1c2UgdW50aWxBc3luYyBpbnN0ZWFkXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKTpib29sZWFufSBjaGVja1xuICogQHBhcmFtIHtudW1iZXJ9IFtpbnRlcnZhbFJlc29sdXRpb25dXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgdW50aWwgPSAodGltZW91dCwgY2hlY2ssIGludGVydmFsUmVzb2x1dGlvbiA9IDEwKSA9PiBjcmVhdGUoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICBjb25zdCBzdGFydFRpbWUgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgY29uc3QgaGFzVGltZW91dCA9IHRpbWVvdXQgPiAwXG4gIGNvbnN0IHVudGlsSW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgaWYgKGNoZWNrKCkpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpXG4gICAgICByZXNvbHZlKClcbiAgICB9IGVsc2UgaWYgKGhhc1RpbWVvdXQpIHtcbiAgICAgIC8qIGM4IGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAodGltZS5nZXRVbml4VGltZSgpIC0gc3RhcnRUaW1lID4gdGltZW91dCkge1xuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKVxuICAgICAgICByZWplY3QobmV3IEVycm9yKCdUaW1lb3V0JykpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnN0IGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwodW50aWxJbnRlcnZhbCwgaW50ZXJ2YWxSZXNvbHV0aW9uKVxufSlcblxuLyoqXG4gKiBAcGFyYW0geygpPT5Qcm9taXNlPGJvb2xlYW4+fGJvb2xlYW59IGNoZWNrXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dFxuICogQHBhcmFtIHtudW1iZXJ9IGludGVydmFsUmVzb2x1dGlvblxuICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVudGlsQXN5bmMgPSBhc3luYyAoY2hlY2ssIHRpbWVvdXQgPSAwLCBpbnRlcnZhbFJlc29sdXRpb24gPSAxMCkgPT4ge1xuICBjb25zdCBzdGFydFRpbWUgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgY29uc3Qgbm9UaW1lb3V0ID0gdGltZW91dCA8PSAwXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bm1vZGlmaWVkLWxvb3AtY29uZGl0aW9uXG4gIHdoaWxlIChub1RpbWVvdXQgfHwgdGltZS5nZXRVbml4VGltZSgpIC0gc3RhcnRUaW1lIDw9IHRpbWVvdXQpIHtcbiAgICBpZiAoYXdhaXQgY2hlY2soKSkgcmV0dXJuXG4gICAgYXdhaXQgd2FpdChpbnRlcnZhbFJlc29sdXRpb24pXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdUaW1lb3V0Jylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dFxuICogQHJldHVybiB7UHJvbWlzZTx1bmRlZmluZWQ+fVxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9IHRpbWVvdXQgPT4gY3JlYXRlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWVvdXQpKVxuXG4vKipcbiAqIENoZWNrcyBpZiBhbiBvYmplY3QgaXMgYSBwcm9taXNlIHVzaW5nIGR1Y2t0eXBpbmcuXG4gKlxuICogUHJvbWlzZXMgYXJlIG9mdGVuIHBvbHlmaWxsZWQsIHNvIGl0IG1ha2VzIHNlbnNlIHRvIGFkZCBzb21lIGFkZGl0aW9uYWwgZ3VhcmFudGVlcyBpZiB0aGUgdXNlciBvZiB0aGlzXG4gKiBsaWJyYXJ5IGhhcyBzb21lIGluc2FuZSBlbnZpcm9ubWVudCB3aGVyZSBnbG9iYWwgUHJvbWlzZSBvYmplY3RzIGFyZSBvdmVyd3JpdHRlbi5cbiAqXG4gKiBAcGFyYW0ge2FueX0gcFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGlzUHJvbWlzZSA9IHAgPT4gcCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHAgJiYgcC50aGVuICYmIHAuY2F0Y2ggJiYgcC5maW5hbGx5KVxuIiwgIi8qKlxuICogQG1vZHVsZSBZXG4gKi9cblxuaW1wb3J0IHtcbiAgU3RydWN0U3RvcmUsXG4gIEFic3RyYWN0VHlwZSxcbiAgWUFycmF5LFxuICBZVGV4dCxcbiAgWU1hcCxcbiAgWVhtbEVsZW1lbnQsXG4gIFlYbWxGcmFnbWVudCxcbiAgdHJhbnNhY3QsXG4gIENvbnRlbnREb2MsIEl0ZW0sIFRyYW5zYWN0aW9uLCBZRXZlbnQgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCB7IE9ic2VydmFibGVWMiB9IGZyb20gJ2xpYjAvb2JzZXJ2YWJsZSdcbmltcG9ydCAqIGFzIG1hcCBmcm9tICdsaWIwL21hcCdcbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJ2xpYjAvYXJyYXknXG5pbXBvcnQgKiBhcyBwcm9taXNlIGZyb20gJ2xpYjAvcHJvbWlzZSdcblxuZnVuY3Rpb24gdWludDMyKCkge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKDIgKiogMzIpKTtcbn1cblxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlTmV3Q2xpZW50SWQgPSB1aW50MzJcblxuZnVuY3Rpb24gdXVpZHY0KCkge1xuICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgPT4ge1xuICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuICAgIGNvbnN0IHYgPSBjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgfSk7XG59XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRG9jT3B0c1xuICogQHByb3BlcnR5IHtib29sZWFufSBbRG9jT3B0cy5nYz10cnVlXSBEaXNhYmxlIGdhcmJhZ2UgY29sbGVjdGlvbiAoZGVmYXVsdDogZ2M9dHJ1ZSlcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oSXRlbSk6Ym9vbGVhbn0gW0RvY09wdHMuZ2NGaWx0ZXJdIFdpbGwgYmUgY2FsbGVkIGJlZm9yZSBhbiBJdGVtIGlzIGdhcmJhZ2UgY29sbGVjdGVkLiBSZXR1cm4gZmFsc2UgdG8ga2VlcCB0aGUgSXRlbS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbRG9jT3B0cy5ndWlkXSBEZWZpbmUgYSBnbG9iYWxseSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyBkb2N1bWVudFxuICogQHByb3BlcnR5IHtzdHJpbmcgfCBudWxsfSBbRG9jT3B0cy5jb2xsZWN0aW9uaWRdIEFzc29jaWF0ZSB0aGlzIGRvY3VtZW50IHdpdGggYSBjb2xsZWN0aW9uLiBUaGlzIG9ubHkgcGxheXMgYSByb2xlIGlmIHlvdXIgcHJvdmlkZXIgaGFzIGEgY29uY2VwdCBvZiBjb2xsZWN0aW9uLlxuICogQHByb3BlcnR5IHthbnl9IFtEb2NPcHRzLm1ldGFdIEFueSBraW5kIG9mIG1ldGEgaW5mb3JtYXRpb24geW91IHdhbnQgdG8gYXNzb2NpYXRlIHdpdGggdGhpcyBkb2N1bWVudC4gSWYgdGhpcyBpcyBhIHN1YmRvY3VtZW50LCByZW1vdGUgcGVlcnMgd2lsbCBzdG9yZSB0aGUgbWV0YSBpbmZvcm1hdGlvbiBhcyB3ZWxsLlxuICogQHByb3BlcnR5IHtib29sZWFufSBbRG9jT3B0cy5hdXRvTG9hZF0gSWYgYSBzdWJkb2N1bWVudCwgYXV0b21hdGljYWxseSBsb2FkIGRvY3VtZW50LiBJZiB0aGlzIGlzIGEgc3ViZG9jdW1lbnQsIHJlbW90ZSBwZWVycyB3aWxsIGxvYWQgdGhlIGRvY3VtZW50IGFzIHdlbGwgYXV0b21hdGljYWxseS5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0RvY09wdHMuc2hvdWxkTG9hZF0gV2hldGhlciB0aGUgZG9jdW1lbnQgc2hvdWxkIGJlIHN5bmNlZCBieSB0aGUgcHJvdmlkZXIgbm93LiBUaGlzIGlzIHRvZ2dsZWQgdG8gdHJ1ZSB3aGVuIHlvdSBjYWxsIHlkb2MubG9hZCgpXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEb2NFdmVudHNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oRG9jKTp2b2lkfSBEb2NFdmVudHMuZGVzdHJveVxuICogQHByb3BlcnR5IHtmdW5jdGlvbihEb2MpOnZvaWR9IERvY0V2ZW50cy5sb2FkXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKGJvb2xlYW4sIERvYyk6dm9pZH0gRG9jRXZlbnRzLnN5bmNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVWludDhBcnJheSwgYW55LCBEb2MsIFRyYW5zYWN0aW9uKTp2b2lkfSBEb2NFdmVudHMudXBkYXRlXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKFVpbnQ4QXJyYXksIGFueSwgRG9jLCBUcmFuc2FjdGlvbik6dm9pZH0gRG9jRXZlbnRzLnVwZGF0ZVYyXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKERvYyk6dm9pZH0gRG9jRXZlbnRzLmJlZm9yZUFsbFRyYW5zYWN0aW9uc1xuICogQHByb3BlcnR5IHtmdW5jdGlvbihUcmFuc2FjdGlvbiwgRG9jKTp2b2lkfSBEb2NFdmVudHMuYmVmb3JlVHJhbnNhY3Rpb25cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVHJhbnNhY3Rpb24sIERvYyk6dm9pZH0gRG9jRXZlbnRzLmJlZm9yZU9ic2VydmVyQ2FsbHNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVHJhbnNhY3Rpb24sIERvYyk6dm9pZH0gRG9jRXZlbnRzLmFmdGVyVHJhbnNhY3Rpb25cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVHJhbnNhY3Rpb24sIERvYyk6dm9pZH0gRG9jRXZlbnRzLmFmdGVyVHJhbnNhY3Rpb25DbGVhbnVwXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKERvYywgQXJyYXk8VHJhbnNhY3Rpb24+KTp2b2lkfSBEb2NFdmVudHMuYWZ0ZXJBbGxUcmFuc2FjdGlvbnNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oeyBsb2FkZWQ6IFNldDxEb2M+LCBhZGRlZDogU2V0PERvYz4sIHJlbW92ZWQ6IFNldDxEb2M+IH0sIERvYywgVHJhbnNhY3Rpb24pOnZvaWR9IERvY0V2ZW50cy5zdWJkb2NzXG4gKi9cblxuLyoqXG4gKiBBIFlqcyBpbnN0YW5jZSBoYW5kbGVzIHRoZSBzdGF0ZSBvZiBzaGFyZWQgZGF0YS5cbiAqIEBleHRlbmRzIE9ic2VydmFibGVWMjxEb2NFdmVudHM+XG4gKi9cbmV4cG9ydCBjbGFzcyBEb2MgZXh0ZW5kcyBPYnNlcnZhYmxlVjIge1xuICAvKipcbiAgICogQHBhcmFtIHtEb2NPcHRzfSBvcHRzIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yICh7IGd1aWQgPSB1dWlkdjQoKSwgY29sbGVjdGlvbmlkID0gbnVsbCwgZ2MgPSB0cnVlLCBnY0ZpbHRlciA9ICgpID0+IHRydWUsIG1ldGEgPSBudWxsLCBhdXRvTG9hZCA9IGZhbHNlLCBzaG91bGRMb2FkID0gdHJ1ZSB9ID0ge30pIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5nYyA9IGdjXG4gICAgdGhpcy5nY0ZpbHRlciA9IGdjRmlsdGVyXG4gICAgdGhpcy5jbGllbnRJRCA9IGdlbmVyYXRlTmV3Q2xpZW50SWQoKVxuICAgIHRoaXMuZ3VpZCA9IGd1aWRcbiAgICB0aGlzLmNvbGxlY3Rpb25pZCA9IGNvbGxlY3Rpb25pZFxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLCBBYnN0cmFjdFR5cGU8WUV2ZW50PGFueT4+Pn1cbiAgICAgKi9cbiAgICB0aGlzLnNoYXJlID0gbmV3IE1hcCgpXG4gICAgdGhpcy5zdG9yZSA9IG5ldyBTdHJ1Y3RTdG9yZSgpXG4gICAgLyoqXG4gICAgICogQHR5cGUge1RyYW5zYWN0aW9uIHwgbnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLl90cmFuc2FjdGlvbiA9IG51bGxcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8VHJhbnNhY3Rpb24+fVxuICAgICAqL1xuICAgIHRoaXMuX3RyYW5zYWN0aW9uQ2xlYW51cHMgPSBbXVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTZXQ8RG9jPn1cbiAgICAgKi9cbiAgICB0aGlzLnN1YmRvY3MgPSBuZXcgU2V0KClcbiAgICAvKipcbiAgICAgKiBJZiB0aGlzIGRvY3VtZW50IGlzIGEgc3ViZG9jdW1lbnQgLSBhIGRvY3VtZW50IGludGVncmF0ZWQgaW50byBhbm90aGVyIGRvY3VtZW50IC0gdGhlbiBfaXRlbSBpcyBkZWZpbmVkLlxuICAgICAqIEB0eXBlIHtJdGVtP31cbiAgICAgKi9cbiAgICB0aGlzLl9pdGVtID0gbnVsbFxuICAgIHRoaXMuc2hvdWxkTG9hZCA9IHNob3VsZExvYWRcbiAgICB0aGlzLmF1dG9Mb2FkID0gYXV0b0xvYWRcbiAgICB0aGlzLm1ldGEgPSBtZXRhXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHRoZSBwZXJzaXN0ZW5jZSBwcm92aWRlciBsb2FkZWQgdGhlIGRvY3VtZW50IGZyb20gdGhlIGRhdGFiYXNlIG9yIHdoZW4gdGhlIGBzeW5jYCBldmVudCBmaXJlcy5cbiAgICAgKiBOb3RlIHRoYXQgbm90IGFsbCBwcm92aWRlcnMgaW1wbGVtZW50IHRoaXMgZmVhdHVyZS4gUHJvdmlkZXIgYXV0aG9ycyBhcmUgZW5jb3VyYWdlZCB0byBmaXJlIHRoZSBgbG9hZGAgZXZlbnQgd2hlbiB0aGUgZG9jIGNvbnRlbnQgaXMgbG9hZGVkIGZyb20gdGhlIGRhdGFiYXNlLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHRoZSBjb25uZWN0aW9uIHByb3ZpZGVyIGhhcyBzdWNjZXNzZnVsbHkgc3luY2VkIHdpdGggYSBiYWNrZW5kLlxuICAgICAqIE5vdGUgdGhhdCB3aGVuIHVzaW5nIHBlZXItdG8tcGVlciBwcm92aWRlcnMgdGhpcyBldmVudCBtYXkgbm90IHByb3ZpZGUgdmVyeSB1c2VmdWwuXG4gICAgICogQWxzbyBub3RlIHRoYXQgbm90IGFsbCBwcm92aWRlcnMgaW1wbGVtZW50IHRoaXMgZmVhdHVyZS4gUHJvdmlkZXIgYXV0aG9ycyBhcmUgZW5jb3VyYWdlZCB0byBmaXJlXG4gICAgICogdGhlIGBzeW5jYCBldmVudCB3aGVuIHRoZSBkb2MgaGFzIGJlZW4gc3luY2VkICh3aXRoIGB0cnVlYCBhcyBhIHBhcmFtZXRlcikgb3IgaWYgY29ubmVjdGlvbiBpc1xuICAgICAqIGxvc3QgKHdpdGggZmFsc2UgYXMgYSBwYXJhbWV0ZXIpLlxuICAgICAqL1xuICAgIHRoaXMuaXNTeW5jZWQgPSBmYWxzZVxuICAgIHRoaXMuaXNEZXN0cm95ZWQgPSBmYWxzZVxuICAgIC8qKlxuICAgICAqIFByb21pc2UgdGhhdCByZXNvbHZlcyBvbmNlIHRoZSBkb2N1bWVudCBoYXMgYmVlbiBsb2FkZWQgZnJvbSBhIHByZXNpc3RlbmNlIHByb3ZpZGVyLlxuICAgICAqL1xuICAgIHRoaXMud2hlbkxvYWRlZCA9IHByb21pc2UuY3JlYXRlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5vbignbG9hZCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWVcbiAgICAgICAgcmVzb2x2ZSh0aGlzKVxuICAgICAgfSlcbiAgICB9KVxuICAgIGNvbnN0IHByb3ZpZGVTeW5jZWRQcm9taXNlID0gKCkgPT4gcHJvbWlzZS5jcmVhdGUocmVzb2x2ZSA9PiB7XG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTeW5jZWRcbiAgICAgICAqL1xuICAgICAgY29uc3QgZXZlbnRIYW5kbGVyID0gKGlzU3luY2VkKSA9PiB7XG4gICAgICAgIGlmIChpc1N5bmNlZCA9PT0gdW5kZWZpbmVkIHx8IGlzU3luY2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgdGhpcy5vZmYoJ3N5bmMnLCBldmVudEhhbmRsZXIpXG4gICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMub24oJ3N5bmMnLCBldmVudEhhbmRsZXIpXG4gICAgfSlcbiAgICB0aGlzLm9uKCdzeW5jJywgaXNTeW5jZWQgPT4ge1xuICAgICAgaWYgKGlzU3luY2VkID09PSBmYWxzZSAmJiB0aGlzLmlzU3luY2VkKSB7XG4gICAgICAgIHRoaXMud2hlblN5bmNlZCA9IHByb3ZpZGVTeW5jZWRQcm9taXNlKClcbiAgICAgIH1cbiAgICAgIHRoaXMuaXNTeW5jZWQgPSBpc1N5bmNlZCA9PT0gdW5kZWZpbmVkIHx8IGlzU3luY2VkID09PSB0cnVlXG4gICAgICBpZiAodGhpcy5pc1N5bmNlZCAmJiAhdGhpcy5pc0xvYWRlZCkge1xuICAgICAgICB0aGlzLmVtaXQoJ2xvYWQnLCBbdGhpc10pXG4gICAgICB9XG4gICAgfSlcbiAgICAvKipcbiAgICAgKiBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgb25jZSB0aGUgZG9jdW1lbnQgaGFzIGJlZW4gc3luY2VkIHdpdGggYSBiYWNrZW5kLlxuICAgICAqIFRoaXMgcHJvbWlzZSBpcyByZWNyZWF0ZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBsb3N0LlxuICAgICAqIE5vdGUgdGhlIGRvY3VtZW50YXRpb24gYWJvdXQgdGhlIGBpc1N5bmNlZGAgcHJvcGVydHkuXG4gICAgICovXG4gICAgdGhpcy53aGVuU3luY2VkID0gcHJvdmlkZVN5bmNlZFByb21pc2UoKVxuICB9XG5cbiAgLyoqXG4gICAqIE5vdGlmeSB0aGUgcGFyZW50IGRvY3VtZW50IHRoYXQgeW91IHJlcXVlc3QgdG8gbG9hZCBkYXRhIGludG8gdGhpcyBzdWJkb2N1bWVudCAoaWYgaXQgaXMgYSBzdWJkb2N1bWVudCkuXG4gICAqXG4gICAqIGBsb2FkKClgIG1pZ2h0IGJlIHVzZWQgaW4gdGhlIGZ1dHVyZSB0byByZXF1ZXN0IGFueSBwcm92aWRlciB0byBsb2FkIHRoZSBtb3N0IGN1cnJlbnQgZGF0YS5cbiAgICpcbiAgICogSXQgaXMgc2FmZSB0byBjYWxsIGBsb2FkKClgIG11bHRpcGxlIHRpbWVzLlxuICAgKi9cbiAgbG9hZCAoKSB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuX2l0ZW1cbiAgICBpZiAoaXRlbSAhPT0gbnVsbCAmJiAhdGhpcy5zaG91bGRMb2FkKSB7XG4gICAgICB0cmFuc2FjdCgvKiogQHR5cGUge2FueX0gKi8gKGl0ZW0ucGFyZW50KS5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHJhbnNhY3Rpb24uc3ViZG9jc0xvYWRlZC5hZGQodGhpcylcbiAgICAgIH0sIG51bGwsIHRydWUpXG4gICAgfVxuICAgIHRoaXMuc2hvdWxkTG9hZCA9IHRydWVcbiAgfVxuXG4gIGdldFN1YmRvY3MgKCkge1xuICAgIHJldHVybiB0aGlzLnN1YmRvY3NcbiAgfVxuXG4gIGdldFN1YmRvY0d1aWRzICgpIHtcbiAgICByZXR1cm4gbmV3IFNldChhcnJheS5mcm9tKHRoaXMuc3ViZG9jcykubWFwKGRvYyA9PiBkb2MuZ3VpZCkpXG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGF0IGhhcHBlbiBpbnNpZGUgb2YgYSB0cmFuc2FjdGlvbiBhcmUgYnVuZGxlZC4gVGhpcyBtZWFucyB0aGF0XG4gICAqIHRoZSBvYnNlcnZlciBmaXJlcyBfYWZ0ZXJfIHRoZSB0cmFuc2FjdGlvbiBpcyBmaW5pc2hlZCBhbmQgdGhhdCBhbGwgY2hhbmdlc1xuICAgKiB0aGF0IGhhcHBlbmVkIGluc2lkZSBvZiB0aGUgdHJhbnNhY3Rpb24gYXJlIHNlbnQgYXMgb25lIG1lc3NhZ2UgdG8gdGhlXG4gICAqIG90aGVyIHBlZXJzLlxuICAgKlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFRyYW5zYWN0aW9uKTpUfSBmIFRoZSBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBhcyBhIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7YW55fSBbb3JpZ2luXSBPcmlnaW4gb2Ygd2hvIHN0YXJ0ZWQgdGhlIHRyYW5zYWN0aW9uLiBXaWxsIGJlIHN0b3JlZCBvbiB0cmFuc2FjdGlvbi5vcmlnaW5cbiAgICogQHJldHVybiBUXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRyYW5zYWN0IChmLCBvcmlnaW4gPSBudWxsKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0KHRoaXMsIGYsIG9yaWdpbilcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZpbmUgYSBzaGFyZWQgZGF0YSB0eXBlLlxuICAgKlxuICAgKiBNdWx0aXBsZSBjYWxscyBvZiBgeWRvYy5nZXQobmFtZSwgVHlwZUNvbnN0cnVjdG9yKWAgeWllbGQgdGhlIHNhbWUgcmVzdWx0XG4gICAqIGFuZCBkbyBub3Qgb3ZlcndyaXRlIGVhY2ggb3RoZXIuIEkuZS5cbiAgICogYHlkb2MuZ2V0KG5hbWUsIFkuQXJyYXkpID09PSB5ZG9jLmdldChuYW1lLCBZLkFycmF5KWBcbiAgICpcbiAgICogQWZ0ZXIgdGhpcyBtZXRob2QgaXMgY2FsbGVkLCB0aGUgdHlwZSBpcyBhbHNvIGF2YWlsYWJsZSBvbiBgeWRvYy5zaGFyZS5nZXQobmFtZSlgLlxuICAgKlxuICAgKiAqQmVzdCBQcmFjdGljZXM6KlxuICAgKiBEZWZpbmUgYWxsIHR5cGVzIHJpZ2h0IGFmdGVyIHRoZSBZLkRvYyBpbnN0YW5jZSBpcyBjcmVhdGVkIGFuZCBzdG9yZSB0aGVtIGluIGEgc2VwYXJhdGUgb2JqZWN0LlxuICAgKiBBbHNvIHVzZSB0aGUgdHlwZWQgbWV0aG9kcyBgZ2V0VGV4dChuYW1lKWAsIGBnZXRBcnJheShuYW1lKWAsIC4uXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSB7dHlwZW9mIEFic3RyYWN0VHlwZTxhbnk+fSBUeXBlXG4gICAqIEBleGFtcGxlXG4gICAqICAgY29uc3QgeWRvYyA9IG5ldyBZLkRvYyguLilcbiAgICogICBjb25zdCBhcHBTdGF0ZSA9IHtcbiAgICogICAgIGRvY3VtZW50OiB5ZG9jLmdldFRleHQoJ2RvY3VtZW50JylcbiAgICogICAgIGNvbW1lbnRzOiB5ZG9jLmdldEFycmF5KCdjb21tZW50cycpXG4gICAqICAgfVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge1R5cGV9IFR5cGVDb25zdHJ1Y3RvciBUaGUgY29uc3RydWN0b3Igb2YgdGhlIHR5cGUgZGVmaW5pdGlvbi4gRS5nLiBZLlRleHQsIFkuQXJyYXksIFkuTWFwLCAuLi5cbiAgICogQHJldHVybiB7SW5zdGFuY2VUeXBlPFR5cGU+fSBUaGUgY3JlYXRlZCB0eXBlLiBDb25zdHJ1Y3RlZCB3aXRoIFR5cGVDb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBnZXQgKG5hbWUsIFR5cGVDb25zdHJ1Y3RvciA9IC8qKiBAdHlwZSB7YW55fSAqLyAoQWJzdHJhY3RUeXBlKSkge1xuICAgIGNvbnN0IHR5cGUgPSBtYXAuc2V0SWZVbmRlZmluZWQodGhpcy5zaGFyZSwgbmFtZSwgKCkgPT4ge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgdCA9IG5ldyBUeXBlQ29uc3RydWN0b3IoKVxuICAgICAgdC5faW50ZWdyYXRlKHRoaXMsIG51bGwpXG4gICAgICByZXR1cm4gdFxuICAgIH0pXG4gICAgY29uc3QgQ29uc3RyID0gdHlwZS5jb25zdHJ1Y3RvclxuICAgIGlmIChUeXBlQ29uc3RydWN0b3IgIT09IEFic3RyYWN0VHlwZSAmJiBDb25zdHIgIT09IFR5cGVDb25zdHJ1Y3Rvcikge1xuICAgICAgaWYgKENvbnN0ciA9PT0gQWJzdHJhY3RUeXBlKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdCA9IG5ldyBUeXBlQ29uc3RydWN0b3IoKVxuICAgICAgICB0Ll9tYXAgPSB0eXBlLl9tYXBcbiAgICAgICAgdHlwZS5fbWFwLmZvckVhY2goLyoqIEBwYXJhbSB7SXRlbT99IG4gKi8gbiA9PiB7XG4gICAgICAgICAgZm9yICg7IG4gIT09IG51bGw7IG4gPSBuLmxlZnQpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIG4ucGFyZW50ID0gdFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgdC5fc3RhcnQgPSB0eXBlLl9zdGFydFxuICAgICAgICBmb3IgKGxldCBuID0gdC5fc3RhcnQ7IG4gIT09IG51bGw7IG4gPSBuLnJpZ2h0KSB7XG4gICAgICAgICAgbi5wYXJlbnQgPSB0XG4gICAgICAgIH1cbiAgICAgICAgdC5fbGVuZ3RoID0gdHlwZS5fbGVuZ3RoXG4gICAgICAgIHRoaXMuc2hhcmUuc2V0KG5hbWUsIHQpXG4gICAgICAgIHQuX2ludGVncmF0ZSh0aGlzLCBudWxsKVxuICAgICAgICByZXR1cm4gLyoqIEB0eXBlIHtJbnN0YW5jZVR5cGU8VHlwZT59ICovICh0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUeXBlIHdpdGggdGhlIG5hbWUgJHtuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlZmluZWQgd2l0aCBhIGRpZmZlcmVudCBjb25zdHJ1Y3RvcmApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAvKiogQHR5cGUge0luc3RhbmNlVHlwZTxUeXBlPn0gKi8gKHR5cGUpXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIFRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXVxuICAgKiBAcmV0dXJuIHtZQXJyYXk8VD59XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldEFycmF5IChuYW1lID0gJycpIHtcbiAgICByZXR1cm4gLyoqIEB0eXBlIHtZQXJyYXk8VD59ICovICh0aGlzLmdldChuYW1lLCBZQXJyYXkpKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV1cbiAgICogQHJldHVybiB7WVRleHR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldFRleHQgKG5hbWUgPSAnJykge1xuICAgIHJldHVybiB0aGlzLmdldChuYW1lLCBZVGV4dClcbiAgfVxuXG4gIC8qKlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWVdXG4gICAqIEByZXR1cm4ge1lNYXA8VD59XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldE1hcCAobmFtZSA9ICcnKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7WU1hcDxUPn0gKi8gKHRoaXMuZ2V0KG5hbWUsIFlNYXApKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV1cbiAgICogQHJldHVybiB7WVhtbEVsZW1lbnR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldFhtbEVsZW1lbnQgKG5hbWUgPSAnJykge1xuICAgIHJldHVybiAvKiogQHR5cGUge1lYbWxFbGVtZW50PHtba2V5OnN0cmluZ106c3RyaW5nfT59ICovICh0aGlzLmdldChuYW1lLCBZWG1sRWxlbWVudCkpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXVxuICAgKiBAcmV0dXJuIHtZWG1sRnJhZ21lbnR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldFhtbEZyYWdtZW50IChuYW1lID0gJycpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQobmFtZSwgWVhtbEZyYWdtZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBlbnRpcmUgZG9jdW1lbnQgaW50byBhIGpzIG9iamVjdCwgcmVjdXJzaXZlbHkgdHJhdmVyc2luZyBlYWNoIHlqcyB0eXBlXG4gICAqIERvZXNuJ3QgbG9nIHR5cGVzIHRoYXQgaGF2ZSBub3QgYmVlbiBkZWZpbmVkICh1c2luZyB5ZG9jLmdldFR5cGUoLi4pKS5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgRG8gbm90IHVzZSB0aGlzIG1ldGhvZCBhbmQgcmF0aGVyIGNhbGwgdG9KU09OIGRpcmVjdGx5IG9uIHRoZSBzaGFyZWQgdHlwZXMuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsIGFueT59XG4gICAqL1xuICB0b0pTT04gKCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLCBhbnk+fVxuICAgICAqL1xuICAgIGNvbnN0IGRvYyA9IHt9XG5cbiAgICB0aGlzLnNoYXJlLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGRvY1trZXldID0gdmFsdWUudG9KU09OKClcbiAgICB9KVxuXG4gICAgcmV0dXJuIGRvY1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXQgYGRlc3Ryb3lgIGV2ZW50IGFuZCB1bnJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVycy5cbiAgICovXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuaXNEZXN0cm95ZWQgPSB0cnVlXG4gICAgYXJyYXkuZnJvbSh0aGlzLnN1YmRvY3MpLmZvckVhY2goc3ViZG9jID0+IHN1YmRvYy5kZXN0cm95KCkpXG4gICAgY29uc3QgaXRlbSA9IHRoaXMuX2l0ZW1cbiAgICBpZiAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5faXRlbSA9IG51bGxcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSAvKiogQHR5cGUge0NvbnRlbnREb2N9ICovIChpdGVtLmNvbnRlbnQpXG4gICAgICBjb250ZW50LmRvYyA9IG5ldyBEb2MoeyBndWlkOiB0aGlzLmd1aWQsIC4uLmNvbnRlbnQub3B0cywgc2hvdWxkTG9hZDogZmFsc2UgfSlcbiAgICAgIGNvbnRlbnQuZG9jLl9pdGVtID0gaXRlbVxuICAgICAgdHJhbnNhY3QoLyoqIEB0eXBlIHthbnl9ICovIChpdGVtKS5wYXJlbnQuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIGNvbnN0IGRvYyA9IGNvbnRlbnQuZG9jXG4gICAgICAgIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgICAgdHJhbnNhY3Rpb24uc3ViZG9jc0FkZGVkLmFkZChkb2MpXG4gICAgICAgIH1cbiAgICAgICAgdHJhbnNhY3Rpb24uc3ViZG9jc1JlbW92ZWQuYWRkKHRoaXMpXG4gICAgICB9LCBudWxsLCB0cnVlKVxuICAgIH1cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgdGhpcy5lbWl0KCdkZXN0cm95ZWQnLCBbdHJ1ZV0pIC8vIERFUFJFQ0FURUQhXG4gICAgdGhpcy5lbWl0KCdkZXN0cm95JywgW3RoaXNdKVxuICAgIHN1cGVyLmRlc3Ryb3koKVxuICB9XG59XG4iLCAiLyoqXG4gKiBPZnRlbiB1c2VkIGNvbmRpdGlvbnMuXG4gKlxuICogQG1vZHVsZSBjb25kaXRpb25zXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfG51bGx8dW5kZWZpbmVkfSB2XG4gKiBAcmV0dXJuIHtUfG51bGx9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgdW5kZWZpbmVkVG9OdWxsID0gdiA9PiB2ID09PSB1bmRlZmluZWQgPyBudWxsIDogdlxuIiwgIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIElzb21vcnBoaWMgdmFyaWFibGUgc3RvcmFnZS5cbiAqXG4gKiBVc2VzIExvY2FsU3RvcmFnZSBpbiB0aGUgYnJvd3NlciBhbmQgZmFsbHMgYmFjayB0byBpbi1tZW1vcnkgc3RvcmFnZS5cbiAqXG4gKiBAbW9kdWxlIHN0b3JhZ2VcbiAqL1xuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmNsYXNzIFZhclN0b3JhZ2VQb2x5ZmlsbCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLm1hcCA9IG5ldyBNYXAoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHthbnl9IG5ld1ZhbHVlXG4gICAqL1xuICBzZXRJdGVtIChrZXksIG5ld1ZhbHVlKSB7XG4gICAgdGhpcy5tYXAuc2V0KGtleSwgbmV3VmFsdWUpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgZ2V0SXRlbSAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmdldChrZXkpXG4gIH1cbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHR5cGUge2FueX1cbiAqL1xubGV0IF9sb2NhbFN0b3JhZ2UgPSBuZXcgVmFyU3RvcmFnZVBvbHlmaWxsKClcbmxldCB1c2VQb2x5ZmlsbCA9IHRydWVcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG50cnkge1xuICAvLyBpZiB0aGUgc2FtZS1vcmlnaW4gcnVsZSBpcyB2aW9sYXRlZCwgYWNjZXNzaW5nIGxvY2FsU3RvcmFnZSBtaWdodCB0aHJvd24gYW4gZXJyb3JcbiAgaWYgKHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09ICd1bmRlZmluZWQnICYmIGxvY2FsU3RvcmFnZSkge1xuICAgIF9sb2NhbFN0b3JhZ2UgPSBsb2NhbFN0b3JhZ2VcbiAgICB1c2VQb2x5ZmlsbCA9IGZhbHNlXG4gIH1cbn0gY2F0Y2ggKGUpIHsgfVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBsb2NhbFN0b3JhZ2UgaW4gYnJvd3Nlciwgb3IgYSBwb2x5ZmlsbCBpbiBub2RlanNcbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB2YXJTdG9yYWdlID0gX2xvY2FsU3RvcmFnZVxuXG4vKipcbiAqIEEgcG9seWZpbGwgZm9yIGBhZGRFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgZXZlbnQgPT4gey4ufSlgIHRoYXQgZG9lcyBub3RoaW5nIGlmIHRoZSBwb2x5ZmlsbCBpcyBiZWluZyB1c2VkLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeyBrZXk6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZyB9KTogdm9pZH0gZXZlbnRIYW5kbGVyXG4gKiBAZnVuY3Rpb25cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBvbkNoYW5nZSA9IGV2ZW50SGFuZGxlciA9PiB1c2VQb2x5ZmlsbCB8fCBhZGRFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgLyoqIEB0eXBlIHthbnl9ICovIChldmVudEhhbmRsZXIpKVxuXG4vKipcbiAqIEEgcG9seWZpbGwgZm9yIGByZW1vdmVFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgZXZlbnQgPT4gey4ufSlgIHRoYXQgZG9lcyBub3RoaW5nIGlmIHRoZSBwb2x5ZmlsbCBpcyBiZWluZyB1c2VkLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeyBrZXk6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZyB9KTogdm9pZH0gZXZlbnRIYW5kbGVyXG4gKiBAZnVuY3Rpb25cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBvZmZDaGFuZ2UgPSBldmVudEhhbmRsZXIgPT4gdXNlUG9seWZpbGwgfHwgcmVtb3ZlRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIC8qKiBAdHlwZSB7YW55fSAqLyAoZXZlbnRIYW5kbGVyKSlcbiIsICIvKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIGZvciB3b3JraW5nIHdpdGggRWNtYVNjcmlwdCBvYmplY3RzLlxuICpcbiAqIEBtb2R1bGUgb2JqZWN0XG4gKi9cblxuLyoqXG4gKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLGFueT59IG9ialxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4vKipcbiAqIE9iamVjdC5hc3NpZ25cbiAqL1xuZXhwb3J0IGNvbnN0IGFzc2lnbiA9IE9iamVjdC5hc3NpZ25cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gb2JqXG4gKi9cbmV4cG9ydCBjb25zdCBrZXlzID0gT2JqZWN0LmtleXNcblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHt7W2s6c3RyaW5nXTpWfX0gb2JqXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFYsc3RyaW5nKTphbnl9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IGZvckVhY2ggPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGYob2JqW2tleV0sIGtleSlcbiAgfVxufVxuXG4vKipcbiAqIEB0b2RvIGltcGxlbWVudCBtYXBUb0FycmF5ICYgbWFwXG4gKlxuICogQHRlbXBsYXRlIFJcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LHN0cmluZyk6Un0gZlxuICogQHJldHVybiB7QXJyYXk8Uj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAob2JqLCBmKSA9PiB7XG4gIGNvbnN0IHJlc3VsdHMgPSBbXVxuICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICByZXN1bHRzLnB1c2goZihvYmpba2V5XSwga2V5KSlcbiAgfVxuICByZXR1cm4gcmVzdWx0c1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIHVzZSBvYmplY3Quc2l6ZSBpbnN0ZWFkXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gb2JqXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBsZW5ndGggPSBvYmogPT4ga2V5cyhvYmopLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNpemUgPSBvYmogPT4ga2V5cyhvYmopLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LHN0cmluZyk6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNvbWUgPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGlmIChmKG9ialtrZXldLCBrZXkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdHx1bmRlZmluZWR9IG9ialxuICovXG5leHBvcnQgY29uc3QgaXNFbXB0eSA9IG9iaiA9PiB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICBmb3IgKGNvbnN0IF9rIGluIG9iaikge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IG9ialxuICogQHBhcmFtIHtmdW5jdGlvbihhbnksc3RyaW5nKTpib29sZWFufSBmXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXZlcnkgPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGlmICghZihvYmpba2V5XSwga2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQ2FsbHMgYE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlgLlxuICpcbiAqIEBwYXJhbSB7YW55fSBvYmpcbiAqIEBwYXJhbSB7c3RyaW5nfHN5bWJvbH0ga2V5XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgaGFzUHJvcGVydHkgPSAob2JqLCBrZXkpID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSlcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gYVxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbEZsYXQgPSAoYSwgYikgPT4gYSA9PT0gYiB8fCAoc2l6ZShhKSA9PT0gc2l6ZShiKSAmJiBldmVyeShhLCAodmFsLCBrZXkpID0+ICh2YWwgIT09IHVuZGVmaW5lZCB8fCBoYXNQcm9wZXJ0eShiLCBrZXkpKSAmJiBiW2tleV0gPT09IHZhbCkpXG5cbi8qKlxuICogTWFrZSBhbiBvYmplY3QgaW1tdXRhYmxlLiBUaGlzIGh1cnRzIHBlcmZvcm1hbmNlIGFuZCBpcyB1c3VhbGx5IG5vdCBuZWVkZWQgaWYgeW91IHBlcmZvcm0gZ29vZFxuICogY29kaW5nIHByYWN0aWNlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IGZyZWV6ZSA9IE9iamVjdC5mcmVlemVcblxuLyoqXG4gKiBNYWtlIGFuIG9iamVjdCBhbmQgYWxsIGl0cyBjaGlsZHJlbiBpbW11dGFibGUuXG4gKiBUaGlzICpyZWFsbHkqIGh1cnRzIHBlcmZvcm1hbmNlIGFuZCBpcyB1c3VhbGx5IG5vdCBuZWVkZWQgaWYgeW91IHBlcmZvcm0gZ29vZCBjb2RpbmcgcHJhY3RpY2VzLlxuICpcbiAqIEB0ZW1wbGF0ZSB7YW55fSBUXG4gKiBAcGFyYW0ge1R9IG9cbiAqIEByZXR1cm4ge1JlYWRvbmx5PFQ+fVxuICovXG5leHBvcnQgY29uc3QgZGVlcEZyZWV6ZSA9IChvKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICBjb25zdCBjID0gb1trZXldXG4gICAgaWYgKHR5cGVvZiBjID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZGVlcEZyZWV6ZShvW2tleV0pXG4gICAgfVxuICB9XG4gIHJldHVybiBmcmVlemUobylcbn1cbiIsICIvKipcbiAqIENvbW1vbiBmdW5jdGlvbnMgYW5kIGZ1bmN0aW9uIGNhbGwgaGVscGVycy5cbiAqXG4gKiBAbW9kdWxlIGZ1bmN0aW9uXG4gKi9cblxuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnLi9hcnJheS5qcydcbmltcG9ydCAqIGFzIG9iamVjdCBmcm9tICcuL29iamVjdC5qcydcblxuLyoqXG4gKiBDYWxscyBhbGwgZnVuY3Rpb25zIGluIGBmc2Agd2l0aCBhcmdzLiBPbmx5IHRocm93cyBhZnRlciBhbGwgZnVuY3Rpb25zIHdlcmUgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSB7QXJyYXk8ZnVuY3Rpb24+fSBmc1xuICogQHBhcmFtIHtBcnJheTxhbnk+fSBhcmdzXG4gKi9cbmV4cG9ydCBjb25zdCBjYWxsQWxsID0gKGZzLCBhcmdzLCBpID0gMCkgPT4ge1xuICB0cnkge1xuICAgIGZvciAoOyBpIDwgZnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZzW2ldKC4uLmFyZ3MpXG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChpIDwgZnMubGVuZ3RoKSB7XG4gICAgICBjYWxsQWxsKGZzLCBhcmdzLCBpICsgMSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IG5vcCA9ICgpID0+IHt9XG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKTpUfSBmXG4gKiBAcmV0dXJuIHtUfVxuICovXG5leHBvcnQgY29uc3QgYXBwbHkgPSBmID0+IGYoKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBBXG4gKlxuICogQHBhcmFtIHtBfSBhXG4gKiBAcmV0dXJuIHtBfVxuICovXG5leHBvcnQgY29uc3QgaWQgPSBhID0+IGFcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICpcbiAqIEBwYXJhbSB7VH0gYVxuICogQHBhcmFtIHtUfSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXF1YWxpdHlTdHJpY3QgPSAoYSwgYikgPT4gYSA9PT0gYlxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKlxuICogQHBhcmFtIHtBcnJheTxUPnxvYmplY3R9IGFcbiAqIEBwYXJhbSB7QXJyYXk8VD58b2JqZWN0fSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXF1YWxpdHlGbGF0ID0gKGEsIGIpID0+IGEgPT09IGIgfHwgKGEgIT0gbnVsbCAmJiBiICE9IG51bGwgJiYgYS5jb25zdHJ1Y3RvciA9PT0gYi5jb25zdHJ1Y3RvciAmJiAoKGFycmF5LmlzQXJyYXkoYSkgJiYgYXJyYXkuZXF1YWxGbGF0KGEsIC8qKiBAdHlwZSB7QXJyYXk8VD59ICovIChiKSkpIHx8ICh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmVxdWFsRmxhdChhLCBiKSkpKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gYVxuICogQHBhcmFtIHthbnl9IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbGl0eURlZXAgPSAoYSwgYikgPT4ge1xuICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkge1xuICAgIHJldHVybiBlcXVhbGl0eVN0cmljdChhLCBiKVxuICB9XG4gIGlmIChhLmNvbnN0cnVjdG9yICE9PSBiLmNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHN3aXRjaCAoYS5jb25zdHJ1Y3Rvcikge1xuICAgIGNhc2UgQXJyYXlCdWZmZXI6XG4gICAgICBhID0gbmV3IFVpbnQ4QXJyYXkoYSlcbiAgICAgIGIgPSBuZXcgVWludDhBcnJheShiKVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1mYWxsdGhyb3VnaFxuICAgIGNhc2UgVWludDhBcnJheToge1xuICAgICAgaWYgKGEuYnl0ZUxlbmd0aCAhPT0gYi5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNhc2UgU2V0OiB7XG4gICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGEpIHtcbiAgICAgICAgaWYgKCFiLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICB9XG4gICAgY2FzZSBNYXA6IHtcbiAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGEua2V5cygpKSB7XG4gICAgICAgIGlmICghYi5oYXMoa2V5KSB8fCAhZXF1YWxpdHlEZWVwKGEuZ2V0KGtleSksIGIuZ2V0KGtleSkpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNhc2UgT2JqZWN0OlxuICAgICAgaWYgKG9iamVjdC5sZW5ndGgoYSkgIT09IG9iamVjdC5sZW5ndGgoYikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBhKSB7XG4gICAgICAgIGlmICghb2JqZWN0Lmhhc1Byb3BlcnR5KGEsIGtleSkgfHwgIWVxdWFsaXR5RGVlcChhW2tleV0sIGJba2V5XSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICBjYXNlIEFycmF5OlxuICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWVxdWFsaXR5RGVlcChhW2ldLCBiW2ldKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAdGVtcGxhdGUge1Z9IE9QVFNcbiAqXG4gKiBAcGFyYW0ge1Z9IHZhbHVlXG4gKiBAcGFyYW0ge0FycmF5PE9QVFM+fSBvcHRpb25zXG4gKi9cbi8vIEB0cy1pZ25vcmVcbmV4cG9ydCBjb25zdCBpc09uZU9mID0gKHZhbHVlLCBvcHRpb25zKSA9PiBvcHRpb25zLmluY2x1ZGVzKHZhbHVlKVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuZXhwb3J0IGNvbnN0IGlzQXJyYXkgPSBhcnJheS5pc0FycmF5XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHNcbiAqIEByZXR1cm4ge3MgaXMgU3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgaXNTdHJpbmcgPSAocykgPT4gcyAmJiBzLmNvbnN0cnVjdG9yID09PSBTdHJpbmdcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gblxuICogQHJldHVybiB7biBpcyBOdW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBpc051bWJlciA9IG4gPT4gbiAhPSBudWxsICYmIG4uY29uc3RydWN0b3IgPT09IE51bWJlclxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7YWJzdHJhY3QgbmV3ICguLi5hcmdzOiBhbnkpID0+IGFueX0gVFlQRVxuICogQHBhcmFtIHthbnl9IG5cbiAqIEBwYXJhbSB7VFlQRX0gVFxuICogQHJldHVybiB7biBpcyBJbnN0YW5jZVR5cGU8VFlQRT59XG4gKi9cbmV4cG9ydCBjb25zdCBpcyA9IChuLCBUKSA9PiBuICYmIG4uY29uc3RydWN0b3IgPT09IFRcblxuLyoqXG4gKiBAdGVtcGxhdGUge2Fic3RyYWN0IG5ldyAoLi4uYXJnczogYW55KSA9PiBhbnl9IFRZUEVcbiAqIEBwYXJhbSB7VFlQRX0gVFxuICovXG5leHBvcnQgY29uc3QgaXNUZW1wbGF0ZSA9IChUKSA9PlxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG5cbiAgICogQHJldHVybiB7biBpcyBJbnN0YW5jZVR5cGU8VFlQRT59XG4gICAqKi9cbiAgbiA9PiBuICYmIG4uY29uc3RydWN0b3IgPT09IFRcbiIsICIvKipcbiAqIElzb21vcnBoaWMgbW9kdWxlIHRvIHdvcmsgYWNjZXNzIHRoZSBlbnZpcm9ubWVudCAocXVlcnkgcGFyYW1zLCBlbnYgdmFyaWFibGVzKS5cbiAqXG4gKiBAbW9kdWxlIGVudmlyb25tZW50XG4gKi9cblxuaW1wb3J0ICogYXMgbWFwIGZyb20gJy4vbWFwLmpzJ1xuaW1wb3J0ICogYXMgc3RyaW5nIGZyb20gJy4vc3RyaW5nLmpzJ1xuaW1wb3J0ICogYXMgY29uZGl0aW9ucyBmcm9tICcuL2NvbmRpdGlvbnMuanMnXG5pbXBvcnQgKiBhcyBzdG9yYWdlIGZyb20gJy4vc3RvcmFnZS5qcydcbmltcG9ydCAqIGFzIGYgZnJvbSAnLi9mdW5jdGlvbi5qcydcblxuLyogYzggaWdub3JlIG5leHQgMiAqL1xuLy8gQHRzLWlnbm9yZVxuZXhwb3J0IGNvbnN0IGlzTm9kZSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLnJlbGVhc2UgJiYgL25vZGV8aW9cXC5qcy8udGVzdChwcm9jZXNzLnJlbGVhc2UubmFtZSkgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyA/IHByb2Nlc3MgOiAwKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgaXNCcm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAhaXNOb2RlXG4vKiBjOCBpZ25vcmUgbmV4dCAzICovXG5leHBvcnQgY29uc3QgaXNNYWMgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJ1xuICA/IC9NYWMvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKVxuICA6IGZhbHNlXG5cbi8qKlxuICogQHR5cGUge01hcDxzdHJpbmcsc3RyaW5nPn1cbiAqL1xubGV0IHBhcmFtc1xuY29uc3QgYXJncyA9IFtdXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY29uc3QgY29tcHV0ZVBhcmFtcyA9ICgpID0+IHtcbiAgaWYgKHBhcmFtcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGlzTm9kZSkge1xuICAgICAgcGFyYW1zID0gbWFwLmNyZWF0ZSgpXG4gICAgICBjb25zdCBwYXJncyA9IHByb2Nlc3MuYXJndlxuICAgICAgbGV0IGN1cnJQYXJhbU5hbWUgPSBudWxsXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBhcmcgPSBwYXJnc1tpXVxuICAgICAgICBpZiAocGFyZ1swXSA9PT0gJy0nKSB7XG4gICAgICAgICAgaWYgKGN1cnJQYXJhbU5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmFtcy5zZXQoY3VyclBhcmFtTmFtZSwgJycpXG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJQYXJhbU5hbWUgPSBwYXJnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGN1cnJQYXJhbU5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmFtcy5zZXQoY3VyclBhcmFtTmFtZSwgcGFyZylcbiAgICAgICAgICAgIGN1cnJQYXJhbU5hbWUgPSBudWxsXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChwYXJnKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGN1cnJQYXJhbU5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgcGFyYW1zLnNldChjdXJyUGFyYW1OYW1lLCAnJylcbiAgICAgIH1cbiAgICAgIC8vIGluIFJlYWN0TmF0aXZlIGZvciBleGFtcGxlIHRoaXMgd291bGQgbm90IGJlIHRydWUgKHVubGVzcyBjb25uZWN0ZWQgdG8gdGhlIFJlbW90ZSBEZWJ1Z2dlcilcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBsb2NhdGlvbiA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHBhcmFtcyA9IG1hcC5jcmVhdGUoKTsgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgICAobG9jYXRpb24uc2VhcmNoIHx8ICc/Jykuc2xpY2UoMSkuc3BsaXQoJyYnKS5mb3JFYWNoKChrdikgPT4ge1xuICAgICAgICBpZiAoa3YubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0ga3Yuc3BsaXQoJz0nKVxuICAgICAgICAgIHBhcmFtcy5zZXQoYC0tJHtzdHJpbmcuZnJvbUNhbWVsQ2FzZShrZXksICctJyl9YCwgdmFsdWUpXG4gICAgICAgICAgcGFyYW1zLnNldChgLSR7c3RyaW5nLmZyb21DYW1lbENhc2Uoa2V5LCAnLScpfWAsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMgPSBtYXAuY3JlYXRlKClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhcmFtc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBoYXNQYXJhbSA9IChuYW1lKSA9PiBjb21wdXRlUGFyYW1zKCkuaGFzKG5hbWUpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZWZhdWx0VmFsXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBnZXRQYXJhbSA9IChuYW1lLCBkZWZhdWx0VmFsKSA9PlxuICBjb21wdXRlUGFyYW1zKCkuZ2V0KG5hbWUpIHx8IGRlZmF1bHRWYWxcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfG51bGx9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDQgKi9cbmV4cG9ydCBjb25zdCBnZXRWYXJpYWJsZSA9IChuYW1lKSA9PlxuICBpc05vZGVcbiAgICA/IGNvbmRpdGlvbnMudW5kZWZpbmVkVG9OdWxsKHByb2Nlc3MuZW52W25hbWUudG9VcHBlckNhc2UoKS5yZXBsYWNlQWxsKCctJywgJ18nKV0pXG4gICAgOiBjb25kaXRpb25zLnVuZGVmaW5lZFRvTnVsbChzdG9yYWdlLnZhclN0b3JhZ2UuZ2V0SXRlbShuYW1lKSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfG51bGx9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBnZXRDb25mID0gKG5hbWUpID0+XG4gIGNvbXB1dGVQYXJhbXMoKS5nZXQoJy0tJyArIG5hbWUpIHx8IGdldFZhcmlhYmxlKG5hbWUpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuLyogYzggaWdub3JlIG5leHQgNSAqL1xuZXhwb3J0IGNvbnN0IGVuc3VyZUNvbmYgPSAobmFtZSkgPT4ge1xuICBjb25zdCBjID0gZ2V0Q29uZihuYW1lKVxuICBpZiAoYyA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGNvbmZpZ3VyYXRpb24gXCIke25hbWUudG9VcHBlckNhc2UoKS5yZXBsYWNlQWxsKCctJywgJ18nKX1cImApXG4gIHJldHVybiBjXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBoYXNDb25mID0gKG5hbWUpID0+XG4gIGhhc1BhcmFtKCctLScgKyBuYW1lKSB8fCBnZXRWYXJpYWJsZShuYW1lKSAhPT0gbnVsbFxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHByb2R1Y3Rpb24gPSBoYXNDb25mKCdwcm9kdWN0aW9uJylcblxuLyogYzggaWdub3JlIG5leHQgMiAqL1xuY29uc3QgZm9yY2VDb2xvciA9IGlzTm9kZSAmJlxuICBmLmlzT25lT2YocHJvY2Vzcy5lbnYuRk9SQ0VfQ09MT1IsIFsndHJ1ZScsICcxJywgJzInXSlcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIENvbG9yIGlzIGVuYWJsZWQgYnkgZGVmYXVsdCBpZiB0aGUgdGVybWluYWwgc3VwcG9ydHMgaXQuXG4gKlxuICogRXhwbGljaXRseSBlbmFibGUgY29sb3IgdXNpbmcgYC0tY29sb3JgIHBhcmFtZXRlclxuICogRGlzYWJsZSBjb2xvciB1c2luZyBgLS1uby1jb2xvcmAgcGFyYW1ldGVyIG9yIHVzaW5nIGBOT19DT0xPUj0xYCBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAqIGBGT1JDRV9DT0xPUj0xYCBlbmFibGVzIGNvbG9yIGFuZCB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgYWxsLlxuICovXG5leHBvcnQgY29uc3Qgc3VwcG9ydHNDb2xvciA9IGZvcmNlQ29sb3IgfHwgKFxuICAhaGFzUGFyYW0oJy0tbm8tY29sb3JzJykgJiYgLy8gQHRvZG8gZGVwcmVjYXRlIC0tbm8tY29sb3JzXG4gICFoYXNDb25mKCduby1jb2xvcicpICYmXG4gICghaXNOb2RlIHx8IHByb2Nlc3Muc3Rkb3V0LmlzVFRZKSAmJiAoXG4gICAgIWlzTm9kZSB8fFxuICAgIGhhc1BhcmFtKCctLWNvbG9yJykgfHxcbiAgICBnZXRWYXJpYWJsZSgnQ09MT1JURVJNJykgIT09IG51bGwgfHxcbiAgICAoZ2V0VmFyaWFibGUoJ1RFUk0nKSB8fCAnJykuaW5jbHVkZXMoJ2NvbG9yJylcbiAgKVxuKVxuLyogYzggaWdub3JlIHN0b3AgKi9cbiIsICIvKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIHRvIHdvcmsgd2l0aCBidWZmZXJzIChVaW50OEFycmF5KS5cbiAqXG4gKiBAbW9kdWxlIGJ1ZmZlclxuICovXG5cbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIGVudiBmcm9tICcuL2Vudmlyb25tZW50LmpzJ1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnLi9hcnJheS5qcydcbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnLi9tYXRoLmpzJ1xuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnLi9lbmNvZGluZy5qcydcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJy4vZGVjb2RpbmcuanMnXG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlVWludDhBcnJheUZyb21MZW4gPSBsZW4gPT4gbmV3IFVpbnQ4QXJyYXkobGVuKVxuXG4vKipcbiAqIENyZWF0ZSBVaW50OEFycmF5IHdpdGggaW5pdGlhbCBjb250ZW50IGZyb20gYnVmZmVyXG4gKlxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyXG4gKiBAcGFyYW0ge251bWJlcn0gYnl0ZU9mZnNldFxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlVWludDhBcnJheVZpZXdGcm9tQXJyYXlCdWZmZXIgPSAoYnVmZmVyLCBieXRlT2Zmc2V0LCBsZW5ndGgpID0+IG5ldyBVaW50OEFycmF5KGJ1ZmZlciwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuXG4vKipcbiAqIENyZWF0ZSBVaW50OEFycmF5IHdpdGggaW5pdGlhbCBjb250ZW50IGZyb20gYnVmZmVyXG4gKlxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVVaW50OEFycmF5RnJvbUFycmF5QnVmZmVyID0gYnVmZmVyID0+IG5ldyBVaW50OEFycmF5KGJ1ZmZlcilcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnl0ZXNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuY29uc3QgdG9CYXNlNjRCcm93c2VyID0gYnl0ZXMgPT4ge1xuICBsZXQgcyA9ICcnXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgcyArPSBzdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKVxuICB9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICByZXR1cm4gYnRvYShzKVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ5dGVzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmNvbnN0IHRvQmFzZTY0Tm9kZSA9IGJ5dGVzID0+IEJ1ZmZlci5mcm9tKGJ5dGVzLmJ1ZmZlciwgYnl0ZXMuYnl0ZU9mZnNldCwgYnl0ZXMuYnl0ZUxlbmd0aCkudG9TdHJpbmcoJ2Jhc2U2NCcpXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuY29uc3QgZnJvbUJhc2U2NEJyb3dzZXIgPSBzID0+IHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gIGNvbnN0IGEgPSBhdG9iKHMpXG4gIGNvbnN0IGJ5dGVzID0gY3JlYXRlVWludDhBcnJheUZyb21MZW4oYS5sZW5ndGgpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgIGJ5dGVzW2ldID0gYS5jaGFyQ29kZUF0KGkpXG4gIH1cbiAgcmV0dXJuIGJ5dGVzXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKi9cbmNvbnN0IGZyb21CYXNlNjROb2RlID0gcyA9PiB7XG4gIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5mcm9tKHMsICdiYXNlNjQnKVxuICByZXR1cm4gY3JlYXRlVWludDhBcnJheVZpZXdGcm9tQXJyYXlCdWZmZXIoYnVmLmJ1ZmZlciwgYnVmLmJ5dGVPZmZzZXQsIGJ1Zi5ieXRlTGVuZ3RoKVxufVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHRvQmFzZTY0ID0gZW52LmlzQnJvd3NlciA/IHRvQmFzZTY0QnJvd3NlciA6IHRvQmFzZTY0Tm9kZVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGZyb21CYXNlNjQgPSBlbnYuaXNCcm93c2VyID8gZnJvbUJhc2U2NEJyb3dzZXIgOiBmcm9tQmFzZTY0Tm9kZVxuXG4vKipcbiAqIEltcGxlbWVudHMgYmFzZTY0dXJsIC0gc2VlIGh0dHBzOi8vZGF0YXRyYWNrZXIuaWV0Zi5vcmcvZG9jL2h0bWwvcmZjNDY0OCNzZWN0aW9uLTVcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKi9cbmV4cG9ydCBjb25zdCB0b0Jhc2U2NFVybEVuY29kZWQgPSBidWYgPT4gdG9CYXNlNjQoYnVmKS5yZXBsYWNlQWxsKCcrJywgJy0nKS5yZXBsYWNlQWxsKCcvJywgJ18nKS5yZXBsYWNlQWxsKCc9JywgJycpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGJhc2U2NFxuICovXG5leHBvcnQgY29uc3QgZnJvbUJhc2U2NFVybEVuY29kZWQgPSBiYXNlNjQgPT4gZnJvbUJhc2U2NChiYXNlNjQucmVwbGFjZUFsbCgnLScsICcrJykucmVwbGFjZUFsbCgnXycsICcvJykpXG5cbi8qKlxuICogQmFzZTY0IGlzIGFsd2F5cyBhIG1vcmUgZWZmaWNpZW50IGNob2ljZS4gVGhpcyBleGlzdHMgZm9yIHV0aWxpdHkgcHVycG9zZXMgb25seS5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICovXG5leHBvcnQgY29uc3QgdG9IZXhTdHJpbmcgPSBidWYgPT4gYXJyYXkubWFwKGJ1ZiwgYiA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpKS5qb2luKCcnKVxuXG4vKipcbiAqIE5vdGU6IFRoaXMgZnVuY3Rpb24gZXhwZWN0cyB0aGF0IHRoZSBoZXggZG9lc24ndCBzdGFydCB3aXRoIDB4Li5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaGV4XG4gKi9cbmV4cG9ydCBjb25zdCBmcm9tSGV4U3RyaW5nID0gaGV4ID0+IHtcbiAgY29uc3QgaGxlbiA9IGhleC5sZW5ndGhcbiAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkobWF0aC5jZWlsKGhsZW4gLyAyKSlcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobGVuOyBpICs9IDIpIHtcbiAgICBidWZbYnVmLmxlbmd0aCAtIGkgLyAyIC0gMV0gPSBOdW1iZXIucGFyc2VJbnQoaGV4LnNsaWNlKGhsZW4gLSBpIC0gMiwgaGxlbiAtIGkpLCAxNilcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogQ29weSB0aGUgY29udGVudCBvZiBhbiBVaW50OEFycmF5IHZpZXcgdG8gYSBuZXcgQXJyYXlCdWZmZXIuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgY29weVVpbnQ4QXJyYXkgPSB1aW50OEFycmF5ID0+IHtcbiAgY29uc3QgbmV3QnVmID0gY3JlYXRlVWludDhBcnJheUZyb21MZW4odWludDhBcnJheS5ieXRlTGVuZ3RoKVxuICBuZXdCdWYuc2V0KHVpbnQ4QXJyYXkpXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLyoqXG4gKiBFbmNvZGUgYW55dGhpbmcgYXMgYSBVSW50OEFycmF5LiBJdCdzIGEgcHVuIG9uIHR5cGVzY3JpcHRzJ3MgYGFueWAgdHlwZS5cbiAqIFNlZSBlbmNvZGluZy53cml0ZUFueSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAcGFyYW0ge2FueX0gZGF0YVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZUFueSA9IGRhdGEgPT5cbiAgZW5jb2RpbmcuZW5jb2RlKGVuY29kZXIgPT4gZW5jb2Rpbmcud3JpdGVBbnkoZW5jb2RlciwgZGF0YSkpXG5cbi8qKlxuICogRGVjb2RlIGFuIGFueS1lbmNvZGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHthbnl9XG4gKi9cbmV4cG9ydCBjb25zdCBkZWNvZGVBbnkgPSBidWYgPT4gZGVjb2RpbmcucmVhZEFueShkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZikpXG5cbi8qKlxuICogU2hpZnQgQnl0ZSBBcnJheSB7Tn0gYml0cyB0byB0aGUgbGVmdC4gRG9lcyBub3QgZXhwYW5kIGJ5dGUgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBic1xuICogQHBhcmFtIHtudW1iZXJ9IE4gc2hvdWxkIGJlIGluIHRoZSByYW5nZSBvZiBbMC03XVxuICovXG5leHBvcnQgY29uc3Qgc2hpZnROQml0c0xlZnQgPSAoYnMsIE4pID0+IHtcbiAgaWYgKE4gPT09IDApIHJldHVybiBic1xuICBicyA9IG5ldyBVaW50OEFycmF5KGJzKVxuICBic1swXSA8PD0gTlxuICBmb3IgKGxldCBpID0gMTsgaSA8IGJzLmxlbmd0aDsgaSsrKSB7XG4gICAgYnNbaSAtIDFdIHw9IGJzW2ldID4+PiAoOCAtIE4pXG4gICAgYnNbaV0gPDw9IE5cbiAgfVxuICByZXR1cm4gYnNcbn1cbiIsICJpbXBvcnQgKiBhcyBidWZmZXIgZnJvbSAnbGliMC9idWZmZXInXG5pbXBvcnQgKiBhcyBkZWNvZGluZyBmcm9tICdsaWIwL2RlY29kaW5nJ1xuaW1wb3J0IHtcbiAgSUQsIGNyZWF0ZUlEXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuZXhwb3J0IGNsYXNzIERTRGVjb2RlclYxIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlclxuICAgKi9cbiAgY29uc3RydWN0b3IgKGRlY29kZXIpIHtcbiAgICB0aGlzLnJlc3REZWNvZGVyID0gZGVjb2RlclxuICB9XG5cbiAgcmVzZXREc0N1clZhbCAoKSB7XG4gICAgLy8gbm9wXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZERzQ2xvY2sgKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkVmFyVWludCh0aGlzLnJlc3REZWNvZGVyKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIHJlYWREc0xlbiAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVwZGF0ZURlY29kZXJWMSBleHRlbmRzIERTRGVjb2RlclYxIHtcbiAgLyoqXG4gICAqIEByZXR1cm4ge0lEfVxuICAgKi9cbiAgcmVhZExlZnRJRCAoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUlEKGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpLCBkZWNvZGluZy5yZWFkVmFyVWludCh0aGlzLnJlc3REZWNvZGVyKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtJRH1cbiAgICovXG4gIHJlYWRSaWdodElEICgpIHtcbiAgICByZXR1cm4gY3JlYXRlSUQoZGVjb2RpbmcucmVhZFZhclVpbnQodGhpcy5yZXN0RGVjb2RlciksIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgdGhlIG5leHQgY2xpZW50IGlkLlxuICAgKiBVc2UgdGhpcyBpbiBmYXZvciBvZiByZWFkSUQgd2hlbmV2ZXIgcG9zc2libGUgdG8gcmVkdWNlIHRoZSBudW1iZXIgb2Ygb2JqZWN0cyBjcmVhdGVkLlxuICAgKi9cbiAgcmVhZENsaWVudCAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfSBpbmZvIEFuIHVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAgICovXG4gIHJlYWRJbmZvICgpIHtcbiAgICByZXR1cm4gZGVjb2RpbmcucmVhZFVpbnQ4KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgcmVhZFN0cmluZyAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJTdHJpbmcodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBpc0tleVxuICAgKi9cbiAgcmVhZFBhcmVudEluZm8gKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkVmFyVWludCh0aGlzLnJlc3REZWNvZGVyKSA9PT0gMVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn0gaW5mbyBBbiB1bnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gICAqL1xuICByZWFkVHlwZVJlZiAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogV3JpdGUgbGVuIG9mIGEgc3RydWN0IC0gd2VsbCBzdWl0ZWQgZm9yIE9wdCBSTEUgZW5jb2Rlci5cbiAgICpcbiAgICogQHJldHVybiB7bnVtYmVyfSBsZW5cbiAgICovXG4gIHJlYWRMZW4gKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkVmFyVWludCh0aGlzLnJlc3REZWNvZGVyKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIHJlYWRBbnkgKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkQW55KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7VWludDhBcnJheX1cbiAgICovXG4gIHJlYWRCdWYgKCkge1xuICAgIHJldHVybiBidWZmZXIuY29weVVpbnQ4QXJyYXkoZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkodGhpcy5yZXN0RGVjb2RlcikpXG4gIH1cblxuICAvKipcbiAgICogTGVnYWN5IGltcGxlbWVudGF0aW9uIHVzZXMgSlNPTiBwYXJzZS4gV2UgdXNlIGFueS1kZWNvZGluZyBpbiB2Mi5cbiAgICpcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgcmVhZEpTT04gKCkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGRlY29kaW5nLnJlYWRWYXJTdHJpbmcodGhpcy5yZXN0RGVjb2RlcikpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgcmVhZEtleSAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJTdHJpbmcodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRFNEZWNvZGVyVjIge1xuICAvKipcbiAgICogQHBhcmFtIHtkZWNvZGluZy5EZWNvZGVyfSBkZWNvZGVyXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZGVjb2Rlcikge1xuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5kc0N1cnJWYWwgPSAwXG4gICAgdGhpcy5yZXN0RGVjb2RlciA9IGRlY29kZXJcbiAgfVxuXG4gIHJlc2V0RHNDdXJWYWwgKCkge1xuICAgIHRoaXMuZHNDdXJyVmFsID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIHJlYWREc0Nsb2NrICgpIHtcbiAgICB0aGlzLmRzQ3VyclZhbCArPSBkZWNvZGluZy5yZWFkVmFyVWludCh0aGlzLnJlc3REZWNvZGVyKVxuICAgIHJldHVybiB0aGlzLmRzQ3VyclZhbFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIHJlYWREc0xlbiAoKSB7XG4gICAgY29uc3QgZGlmZiA9IGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpICsgMVxuICAgIHRoaXMuZHNDdXJyVmFsICs9IGRpZmZcbiAgICByZXR1cm4gZGlmZlxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVcGRhdGVEZWNvZGVyVjIgZXh0ZW5kcyBEU0RlY29kZXJWMiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge2RlY29kaW5nLkRlY29kZXJ9IGRlY29kZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yIChkZWNvZGVyKSB7XG4gICAgc3VwZXIoZGVjb2RlcilcbiAgICAvKipcbiAgICAgKiBMaXN0IG9mIGNhY2hlZCBrZXlzLiBJZiB0aGUga2V5c1tpZF0gZG9lcyBub3QgZXhpc3QsIHdlIHJlYWQgYSBuZXcga2V5XG4gICAgICogZnJvbSBzdHJpbmdFbmNvZGVyIGFuZCBwdXNoIGl0IHRvIGtleXMuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7QXJyYXk8c3RyaW5nPn1cbiAgICAgKi9cbiAgICB0aGlzLmtleXMgPSBbXVxuICAgIGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpIC8vIHJlYWQgZmVhdHVyZSBmbGFnIC0gY3VycmVudGx5IHVudXNlZFxuICAgIHRoaXMua2V5Q2xvY2tEZWNvZGVyID0gbmV3IGRlY29kaW5nLkludERpZmZPcHRSbGVEZWNvZGVyKGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuICAgIHRoaXMuY2xpZW50RGVjb2RlciA9IG5ldyBkZWNvZGluZy5VaW50T3B0UmxlRGVjb2RlcihkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcbiAgICB0aGlzLmxlZnRDbG9ja0RlY29kZXIgPSBuZXcgZGVjb2RpbmcuSW50RGlmZk9wdFJsZURlY29kZXIoZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGVjb2RlcikpXG4gICAgdGhpcy5yaWdodENsb2NrRGVjb2RlciA9IG5ldyBkZWNvZGluZy5JbnREaWZmT3B0UmxlRGVjb2RlcihkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcbiAgICB0aGlzLmluZm9EZWNvZGVyID0gbmV3IGRlY29kaW5nLlJsZURlY29kZXIoZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGVjb2RlciksIGRlY29kaW5nLnJlYWRVaW50OClcbiAgICB0aGlzLnN0cmluZ0RlY29kZXIgPSBuZXcgZGVjb2RpbmcuU3RyaW5nRGVjb2RlcihkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcbiAgICB0aGlzLnBhcmVudEluZm9EZWNvZGVyID0gbmV3IGRlY29kaW5nLlJsZURlY29kZXIoZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGVjb2RlciksIGRlY29kaW5nLnJlYWRVaW50OClcbiAgICB0aGlzLnR5cGVSZWZEZWNvZGVyID0gbmV3IGRlY29kaW5nLlVpbnRPcHRSbGVEZWNvZGVyKGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuICAgIHRoaXMubGVuRGVjb2RlciA9IG5ldyBkZWNvZGluZy5VaW50T3B0UmxlRGVjb2RlcihkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtJRH1cbiAgICovXG4gIHJlYWRMZWZ0SUQgKCkge1xuICAgIHJldHVybiBuZXcgSUQodGhpcy5jbGllbnREZWNvZGVyLnJlYWQoKSwgdGhpcy5sZWZ0Q2xvY2tEZWNvZGVyLnJlYWQoKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtJRH1cbiAgICovXG4gIHJlYWRSaWdodElEICgpIHtcbiAgICByZXR1cm4gbmV3IElEKHRoaXMuY2xpZW50RGVjb2Rlci5yZWFkKCksIHRoaXMucmlnaHRDbG9ja0RlY29kZXIucmVhZCgpKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgdGhlIG5leHQgY2xpZW50IGlkLlxuICAgKiBVc2UgdGhpcyBpbiBmYXZvciBvZiByZWFkSUQgd2hlbmV2ZXIgcG9zc2libGUgdG8gcmVkdWNlIHRoZSBudW1iZXIgb2Ygb2JqZWN0cyBjcmVhdGVkLlxuICAgKi9cbiAgcmVhZENsaWVudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xpZW50RGVjb2Rlci5yZWFkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IGluZm8gQW4gdW5zaWduZWQgOC1iaXQgaW50ZWdlclxuICAgKi9cbiAgcmVhZEluZm8gKCkge1xuICAgIHJldHVybiAvKiogQHR5cGUge251bWJlcn0gKi8gKHRoaXMuaW5mb0RlY29kZXIucmVhZCgpKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHJlYWRTdHJpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLnN0cmluZ0RlY29kZXIucmVhZCgpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIHJlYWRQYXJlbnRJbmZvICgpIHtcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRJbmZvRGVjb2Rlci5yZWFkKCkgPT09IDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IEFuIHVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAgICovXG4gIHJlYWRUeXBlUmVmICgpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlUmVmRGVjb2Rlci5yZWFkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZSBsZW4gb2YgYSBzdHJ1Y3QgLSB3ZWxsIHN1aXRlZCBmb3IgT3B0IFJMRSBlbmNvZGVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICByZWFkTGVuICgpIHtcbiAgICByZXR1cm4gdGhpcy5sZW5EZWNvZGVyLnJlYWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIHJlYWRBbnkgKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkQW55KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7VWludDhBcnJheX1cbiAgICovXG4gIHJlYWRCdWYgKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheSh0aGlzLnJlc3REZWNvZGVyKVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgbWFpbmx5IGhlcmUgZm9yIGxlZ2FjeSBwdXJwb3Nlcy5cbiAgICpcbiAgICogSW5pdGlhbCB3ZSBpbmNvZGVkIG9iamVjdHMgdXNpbmcgSlNPTi4gTm93IHdlIHVzZSB0aGUgbXVjaCBmYXN0ZXIgbGliMC9hbnktZW5jb2Rlci4gVGhpcyBtZXRob2QgbWFpbmx5IGV4aXN0cyBmb3IgbGVnYWN5IHB1cnBvc2VzIGZvciB0aGUgdjEgZW5jb2Rlci5cbiAgICpcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgcmVhZEpTT04gKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkQW55KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgcmVhZEtleSAoKSB7XG4gICAgY29uc3Qga2V5Q2xvY2sgPSB0aGlzLmtleUNsb2NrRGVjb2Rlci5yZWFkKClcbiAgICBpZiAoa2V5Q2xvY2sgPCB0aGlzLmtleXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5rZXlzW2tleUNsb2NrXVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLnN0cmluZ0RlY29kZXIucmVhZCgpXG4gICAgICB0aGlzLmtleXMucHVzaChrZXkpXG4gICAgICByZXR1cm4ga2V5XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5cbmltcG9ydCB7XG4gIElEIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5leHBvcnQgY2xhc3MgRFNFbmNvZGVyVjEge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5yZXN0RW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICB9XG5cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KHRoaXMucmVzdEVuY29kZXIpXG4gIH1cblxuICByZXNldERzQ3VyVmFsICgpIHtcbiAgICAvLyBub3BcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAgICovXG4gIHdyaXRlRHNDbG9jayAoY2xvY2spIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgY2xvY2spXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICAgKi9cbiAgd3JpdGVEc0xlbiAobGVuKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGxlbilcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVXBkYXRlRW5jb2RlclYxIGV4dGVuZHMgRFNFbmNvZGVyVjEge1xuICAvKipcbiAgICogQHBhcmFtIHtJRH0gaWRcbiAgICovXG4gIHdyaXRlTGVmdElEIChpZCkge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBpZC5jbGllbnQpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGlkLmNsb2NrKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SUR9IGlkXG4gICAqL1xuICB3cml0ZVJpZ2h0SUQgKGlkKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGlkLmNsaWVudClcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgaWQuY2xvY2spXG4gIH1cblxuICAvKipcbiAgICogVXNlIHdyaXRlQ2xpZW50IGFuZCB3cml0ZUNsb2NrIGluc3RlYWQgb2Ygd3JpdGVJRCBpZiBwb3NzaWJsZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNsaWVudFxuICAgKi9cbiAgd3JpdGVDbGllbnQgKGNsaWVudCkge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBjbGllbnQpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZm8gQW4gdW5zaWduZWQgOC1iaXQgaW50ZWdlclxuICAgKi9cbiAgd3JpdGVJbmZvIChpbmZvKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVVaW50OCh0aGlzLnJlc3RFbmNvZGVyLCBpbmZvKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gICAqL1xuICB3cml0ZVN0cmluZyAocykge1xuICAgIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKHRoaXMucmVzdEVuY29kZXIsIHMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1lLZXlcbiAgICovXG4gIHdyaXRlUGFyZW50SW5mbyAoaXNZS2V5KSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGlzWUtleSA/IDEgOiAwKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmZvIEFuIHVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAgICovXG4gIHdyaXRlVHlwZVJlZiAoaW5mbykge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBpbmZvKVxuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlIGxlbiBvZiBhIHN0cnVjdCAtIHdlbGwgc3VpdGVkIGZvciBPcHQgUkxFIGVuY29kZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAgICovXG4gIHdyaXRlTGVuIChsZW4pIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgbGVuKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBhbnlcbiAgICovXG4gIHdyaXRlQW55IChhbnkpIHtcbiAgICBlbmNvZGluZy53cml0ZUFueSh0aGlzLnJlc3RFbmNvZGVyLCBhbnkpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAgICovXG4gIHdyaXRlQnVmIChidWYpIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkodGhpcy5yZXN0RW5jb2RlciwgYnVmKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBlbWJlZFxuICAgKi9cbiAgd3JpdGVKU09OIChlbWJlZCkge1xuICAgIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKHRoaXMucmVzdEVuY29kZXIsIEpTT04uc3RyaW5naWZ5KGVtYmVkKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqL1xuICB3cml0ZUtleSAoa2V5KSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJTdHJpbmcodGhpcy5yZXN0RW5jb2Rlciwga2V5KVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEU0VuY29kZXJWMiB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLnJlc3RFbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpIC8vIGVuY29kZXMgYWxsIHRoZSByZXN0IC8gbm9uLW9wdGltaXplZFxuICAgIHRoaXMuZHNDdXJyVmFsID0gMFxuICB9XG5cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KHRoaXMucmVzdEVuY29kZXIpXG4gIH1cblxuICByZXNldERzQ3VyVmFsICgpIHtcbiAgICB0aGlzLmRzQ3VyclZhbCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAgICovXG4gIHdyaXRlRHNDbG9jayAoY2xvY2spIHtcbiAgICBjb25zdCBkaWZmID0gY2xvY2sgLSB0aGlzLmRzQ3VyclZhbFxuICAgIHRoaXMuZHNDdXJyVmFsID0gY2xvY2tcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgZGlmZilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gICAqL1xuICB3cml0ZURzTGVuIChsZW4pIHtcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICBlcnJvci51bmV4cGVjdGVkQ2FzZSgpXG4gICAgfVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBsZW4gLSAxKVxuICAgIHRoaXMuZHNDdXJyVmFsICs9IGxlblxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVcGRhdGVFbmNvZGVyVjIgZXh0ZW5kcyBEU0VuY29kZXJWMiB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge01hcDxzdHJpbmcsbnVtYmVyPn1cbiAgICAgKi9cbiAgICB0aGlzLmtleU1hcCA9IG5ldyBNYXAoKVxuICAgIC8qKlxuICAgICAqIFJlZmVycyB0byB0aGUgbmV4dCB1bmlxZSBrZXktaWRlbnRpZmllciB0byBtZSB1c2VkLlxuICAgICAqIFNlZSB3cml0ZUtleSBtZXRob2QgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMua2V5Q2xvY2sgPSAwXG4gICAgdGhpcy5rZXlDbG9ja0VuY29kZXIgPSBuZXcgZW5jb2RpbmcuSW50RGlmZk9wdFJsZUVuY29kZXIoKVxuICAgIHRoaXMuY2xpZW50RW5jb2RlciA9IG5ldyBlbmNvZGluZy5VaW50T3B0UmxlRW5jb2RlcigpXG4gICAgdGhpcy5sZWZ0Q2xvY2tFbmNvZGVyID0gbmV3IGVuY29kaW5nLkludERpZmZPcHRSbGVFbmNvZGVyKClcbiAgICB0aGlzLnJpZ2h0Q2xvY2tFbmNvZGVyID0gbmV3IGVuY29kaW5nLkludERpZmZPcHRSbGVFbmNvZGVyKClcbiAgICB0aGlzLmluZm9FbmNvZGVyID0gbmV3IGVuY29kaW5nLlJsZUVuY29kZXIoZW5jb2Rpbmcud3JpdGVVaW50OClcbiAgICB0aGlzLnN0cmluZ0VuY29kZXIgPSBuZXcgZW5jb2RpbmcuU3RyaW5nRW5jb2RlcigpXG4gICAgdGhpcy5wYXJlbnRJbmZvRW5jb2RlciA9IG5ldyBlbmNvZGluZy5SbGVFbmNvZGVyKGVuY29kaW5nLndyaXRlVWludDgpXG4gICAgdGhpcy50eXBlUmVmRW5jb2RlciA9IG5ldyBlbmNvZGluZy5VaW50T3B0UmxlRW5jb2RlcigpXG4gICAgdGhpcy5sZW5FbmNvZGVyID0gbmV3IGVuY29kaW5nLlVpbnRPcHRSbGVFbmNvZGVyKClcbiAgfVxuXG4gIHRvVWludDhBcnJheSAoKSB7XG4gICAgY29uc3QgZW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCAwKSAvLyB0aGlzIGlzIGEgZmVhdHVyZSBmbGFnIHRoYXQgd2UgbWlnaHQgdXNlIGluIHRoZSBmdXR1cmVcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5rZXlDbG9ja0VuY29kZXIudG9VaW50OEFycmF5KCkpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHRoaXMuY2xpZW50RW5jb2Rlci50b1VpbnQ4QXJyYXkoKSlcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5sZWZ0Q2xvY2tFbmNvZGVyLnRvVWludDhBcnJheSgpKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCB0aGlzLnJpZ2h0Q2xvY2tFbmNvZGVyLnRvVWludDhBcnJheSgpKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkodGhpcy5pbmZvRW5jb2RlcikpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHRoaXMuc3RyaW5nRW5jb2Rlci50b1VpbnQ4QXJyYXkoKSlcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlciwgZW5jb2RpbmcudG9VaW50OEFycmF5KHRoaXMucGFyZW50SW5mb0VuY29kZXIpKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCB0aGlzLnR5cGVSZWZFbmNvZGVyLnRvVWludDhBcnJheSgpKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCB0aGlzLmxlbkVuY29kZXIudG9VaW50OEFycmF5KCkpXG4gICAgLy8gQG5vdGUgVGhlIHJlc3QgZW5jb2RlciBpcyBhcHBlbmRlZCEgKG5vdGUgdGhlIG1pc3NpbmcgdmFyKVxuICAgIGVuY29kaW5nLndyaXRlVWludDhBcnJheShlbmNvZGVyLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkodGhpcy5yZXN0RW5jb2RlcikpXG4gICAgcmV0dXJuIGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SUR9IGlkXG4gICAqL1xuICB3cml0ZUxlZnRJRCAoaWQpIHtcbiAgICB0aGlzLmNsaWVudEVuY29kZXIud3JpdGUoaWQuY2xpZW50KVxuICAgIHRoaXMubGVmdENsb2NrRW5jb2Rlci53cml0ZShpZC5jbG9jaylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0lEfSBpZFxuICAgKi9cbiAgd3JpdGVSaWdodElEIChpZCkge1xuICAgIHRoaXMuY2xpZW50RW5jb2Rlci53cml0ZShpZC5jbGllbnQpXG4gICAgdGhpcy5yaWdodENsb2NrRW5jb2Rlci53cml0ZShpZC5jbG9jaylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gY2xpZW50XG4gICAqL1xuICB3cml0ZUNsaWVudCAoY2xpZW50KSB7XG4gICAgdGhpcy5jbGllbnRFbmNvZGVyLndyaXRlKGNsaWVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5mbyBBbiB1bnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gICAqL1xuICB3cml0ZUluZm8gKGluZm8pIHtcbiAgICB0aGlzLmluZm9FbmNvZGVyLndyaXRlKGluZm8pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNcbiAgICovXG4gIHdyaXRlU3RyaW5nIChzKSB7XG4gICAgdGhpcy5zdHJpbmdFbmNvZGVyLndyaXRlKHMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1lLZXlcbiAgICovXG4gIHdyaXRlUGFyZW50SW5mbyAoaXNZS2V5KSB7XG4gICAgdGhpcy5wYXJlbnRJbmZvRW5jb2Rlci53cml0ZShpc1lLZXkgPyAxIDogMClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5mbyBBbiB1bnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gICAqL1xuICB3cml0ZVR5cGVSZWYgKGluZm8pIHtcbiAgICB0aGlzLnR5cGVSZWZFbmNvZGVyLndyaXRlKGluZm8pXG4gIH1cblxuICAvKipcbiAgICogV3JpdGUgbGVuIG9mIGEgc3RydWN0IC0gd2VsbCBzdWl0ZWQgZm9yIE9wdCBSTEUgZW5jb2Rlci5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICAgKi9cbiAgd3JpdGVMZW4gKGxlbikge1xuICAgIHRoaXMubGVuRW5jb2Rlci53cml0ZShsZW4pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IGFueVxuICAgKi9cbiAgd3JpdGVBbnkgKGFueSkge1xuICAgIGVuY29kaW5nLndyaXRlQW55KHRoaXMucmVzdEVuY29kZXIsIGFueSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICAgKi9cbiAgd3JpdGVCdWYgKGJ1Zikge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheSh0aGlzLnJlc3RFbmNvZGVyLCBidWYpXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBpcyBtYWlubHkgaGVyZSBmb3IgbGVnYWN5IHB1cnBvc2VzLlxuICAgKlxuICAgKiBJbml0aWFsIHdlIGluY29kZWQgb2JqZWN0cyB1c2luZyBKU09OLiBOb3cgd2UgdXNlIHRoZSBtdWNoIGZhc3RlciBsaWIwL2FueS1lbmNvZGVyLiBUaGlzIG1ldGhvZCBtYWlubHkgZXhpc3RzIGZvciBsZWdhY3kgcHVycG9zZXMgZm9yIHRoZSB2MSBlbmNvZGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gZW1iZWRcbiAgICovXG4gIHdyaXRlSlNPTiAoZW1iZWQpIHtcbiAgICBlbmNvZGluZy53cml0ZUFueSh0aGlzLnJlc3RFbmNvZGVyLCBlbWJlZClcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9wZXJ0eSBrZXlzIGFyZSBvZnRlbiByZXVzZWQuIEZvciBleGFtcGxlLCBpbiB5LXByb3NlbWlycm9yIHRoZSBrZXkgYGJvbGRgIG1pZ2h0XG4gICAqIG9jY3VyIHZlcnkgb2Z0ZW4uIEZvciBhIDNkIGFwcGxpY2F0aW9uLCB0aGUga2V5IGBwb3NpdGlvbmAgbWlnaHQgb2NjdXIgdmVyeSBvZnRlbi5cbiAgICpcbiAgICogV2UgY2FjaGUgdGhlc2Uga2V5cyBpbiBhIE1hcCBhbmQgcmVmZXIgdG8gdGhlbSB2aWEgYSB1bmlxdWUgbnVtYmVyLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqL1xuICB3cml0ZUtleSAoa2V5KSB7XG4gICAgY29uc3QgY2xvY2sgPSB0aGlzLmtleU1hcC5nZXQoa2V5KVxuICAgIGlmIChjbG9jayA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvKipcbiAgICAgICAqIEB0b2RvIHVuY29tbWVudCB0byBpbnRyb2R1Y2UgdGhpcyBmZWF0dXJlIGZpbmFsbHlcbiAgICAgICAqXG4gICAgICAgKiBCYWNrZ3JvdW5kLiBUaGUgQ29udGVudEZvcm1hdCBvYmplY3Qgd2FzIGFsd2F5cyBlbmNvZGVkIHVzaW5nIHdyaXRlS2V5LCBidXQgdGhlIGRlY29kZXIgdXNlZCB0byB1c2UgcmVhZFN0cmluZy5cbiAgICAgICAqIEZ1cnRoZXJtb3JlLCBJIGZvcmdvdCB0byBzZXQgdGhlIGtleWNsb2NrLiBTbyBldmVyeXRoaW5nIHdhcyB3b3JraW5nIGZpbmUuXG4gICAgICAgKlxuICAgICAgICogSG93ZXZlciwgdGhpcyBmZWF0dXJlIGhlcmUgaXMgYmFzaWNhbGx5IHVzZWxlc3MgYXMgaXQgaXMgbm90IGJlaW5nIHVzZWQgKGl0IGFjdHVhbGx5IG9ubHkgY29uc3VtZXMgZXh0cmEgbWVtb3J5KS5cbiAgICAgICAqXG4gICAgICAgKiBJIGRvbid0IGtub3cgeWV0IGhvdyB0byByZWludHJvZHVjZSB0aGlzIGZlYXR1cmUuLlxuICAgICAgICpcbiAgICAgICAqIE9sZGVyIGNsaWVudHMgd29uJ3QgYmUgYWJsZSB0byByZWFkIHVwZGF0ZXMgd2hlbiB3ZSByZWludHJvZHVjZSB0aGlzIGZlYXR1cmUuIFNvIHRoaXMgc2hvdWxkIHByb2JhYmx5IGJlIGRvbmUgdXNpbmcgYSBmbGFnLlxuICAgICAgICpcbiAgICAgICAqL1xuICAgICAgLy8gdGhpcy5rZXlNYXAuc2V0KGtleSwgdGhpcy5rZXlDbG9jaylcbiAgICAgIHRoaXMua2V5Q2xvY2tFbmNvZGVyLndyaXRlKHRoaXMua2V5Q2xvY2srKylcbiAgICAgIHRoaXMuc3RyaW5nRW5jb2Rlci53cml0ZShrZXkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5Q2xvY2tFbmNvZGVyLndyaXRlKGNsb2NrKVxuICAgIH1cbiAgfVxufVxuIiwgIi8qKlxuICogQG1vZHVsZSBlbmNvZGluZ1xuICovXG4vKlxuICogV2UgdXNlIHRoZSBmaXJzdCBmaXZlIGJpdHMgaW4gdGhlIGluZm8gZmxhZyBmb3IgZGV0ZXJtaW5pbmcgdGhlIHR5cGUgb2YgdGhlIHN0cnVjdC5cbiAqXG4gKiAwOiBHQ1xuICogMTogSXRlbSB3aXRoIERlbGV0ZWQgY29udGVudFxuICogMjogSXRlbSB3aXRoIEpTT04gY29udGVudFxuICogMzogSXRlbSB3aXRoIEJpbmFyeSBjb250ZW50XG4gKiA0OiBJdGVtIHdpdGggU3RyaW5nIGNvbnRlbnRcbiAqIDU6IEl0ZW0gd2l0aCBFbWJlZCBjb250ZW50IChmb3IgcmljaHRleHQgY29udGVudClcbiAqIDY6IEl0ZW0gd2l0aCBGb3JtYXQgY29udGVudCAoYSBmb3JtYXR0aW5nIG1hcmtlciBmb3IgcmljaHRleHQgY29udGVudClcbiAqIDc6IEl0ZW0gd2l0aCBUeXBlXG4gKi9cblxuaW1wb3J0IHtcbiAgZmluZEluZGV4U1MsXG4gIGdldFN0YXRlLFxuICBjcmVhdGVJRCxcbiAgZ2V0U3RhdGVWZWN0b3IsXG4gIHJlYWRBbmRBcHBseURlbGV0ZVNldCxcbiAgd3JpdGVEZWxldGVTZXQsXG4gIGNyZWF0ZURlbGV0ZVNldEZyb21TdHJ1Y3RTdG9yZSxcbiAgdHJhbnNhY3QsXG4gIHJlYWRJdGVtQ29udGVudCxcbiAgVXBkYXRlRGVjb2RlclYxLFxuICBVcGRhdGVEZWNvZGVyVjIsXG4gIFVwZGF0ZUVuY29kZXJWMSxcbiAgVXBkYXRlRW5jb2RlclYyLFxuICBEU0VuY29kZXJWMixcbiAgRFNEZWNvZGVyVjEsXG4gIERTRW5jb2RlclYxLFxuICBtZXJnZVVwZGF0ZXMsXG4gIG1lcmdlVXBkYXRlc1YyLFxuICBTa2lwLFxuICBkaWZmVXBkYXRlVjIsXG4gIGNvbnZlcnRVcGRhdGVGb3JtYXRWMlRvVjEsXG4gIERTRGVjb2RlclYyLCBEb2MsIFRyYW5zYWN0aW9uLCBHQywgSXRlbSwgU3RydWN0U3RvcmUgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5pbXBvcnQgKiBhcyBkZWNvZGluZyBmcm9tICdsaWIwL2RlY29kaW5nJ1xuaW1wb3J0ICogYXMgYmluYXJ5IGZyb20gJ2xpYjAvYmluYXJ5J1xuaW1wb3J0ICogYXMgbWFwIGZyb20gJ2xpYjAvbWFwJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICdsaWIwL2FycmF5J1xuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge0FycmF5PEdDfEl0ZW0+fSBzdHJ1Y3RzIEFsbCBzdHJ1Y3RzIGJ5IGBjbGllbnRgXG4gKiBAcGFyYW0ge251bWJlcn0gY2xpZW50XG4gKiBAcGFyYW0ge251bWJlcn0gY2xvY2sgd3JpdGUgc3RydWN0cyBzdGFydGluZyB3aXRoIGBJRChjbGllbnQsY2xvY2spYFxuICpcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCB3cml0ZVN0cnVjdHMgPSAoZW5jb2Rlciwgc3RydWN0cywgY2xpZW50LCBjbG9jaykgPT4ge1xuICAvLyB3cml0ZSBmaXJzdCBpZFxuICBjbG9jayA9IG1hdGgubWF4KGNsb2NrLCBzdHJ1Y3RzWzBdLmlkLmNsb2NrKSAvLyBtYWtlIHN1cmUgdGhlIGZpcnN0IGlkIGV4aXN0c1xuICBjb25zdCBzdGFydE5ld1N0cnVjdHMgPSBmaW5kSW5kZXhTUyhzdHJ1Y3RzLCBjbG9jaylcbiAgLy8gd3JpdGUgIyBlbmNvZGVkIHN0cnVjdHNcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIHN0cnVjdHMubGVuZ3RoIC0gc3RhcnROZXdTdHJ1Y3RzKVxuICBlbmNvZGVyLndyaXRlQ2xpZW50KGNsaWVudClcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGNsb2NrKVxuICBjb25zdCBmaXJzdFN0cnVjdCA9IHN0cnVjdHNbc3RhcnROZXdTdHJ1Y3RzXVxuICAvLyB3cml0ZSBmaXJzdCBzdHJ1Y3Qgd2l0aCBhbiBvZmZzZXRcbiAgZmlyc3RTdHJ1Y3Qud3JpdGUoZW5jb2RlciwgY2xvY2sgLSBmaXJzdFN0cnVjdC5pZC5jbG9jaylcbiAgZm9yIChsZXQgaSA9IHN0YXJ0TmV3U3RydWN0cyArIDE7IGkgPCBzdHJ1Y3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgc3RydWN0c1tpXS53cml0ZShlbmNvZGVyLCAwKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge01hcDxudW1iZXIsbnVtYmVyPn0gX3NtXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVDbGllbnRzU3RydWN0cyA9IChlbmNvZGVyLCBzdG9yZSwgX3NtKSA9PiB7XG4gIC8vIHdlIGZpbHRlciBhbGwgdmFsaWQgX3NtIGVudHJpZXMgaW50byBzbVxuICBjb25zdCBzbSA9IG5ldyBNYXAoKVxuICBfc20uZm9yRWFjaCgoY2xvY2ssIGNsaWVudCkgPT4ge1xuICAgIC8vIG9ubHkgd3JpdGUgaWYgbmV3IHN0cnVjdHMgYXJlIGF2YWlsYWJsZVxuICAgIGlmIChnZXRTdGF0ZShzdG9yZSwgY2xpZW50KSA+IGNsb2NrKSB7XG4gICAgICBzbS5zZXQoY2xpZW50LCBjbG9jaylcbiAgICB9XG4gIH0pXG4gIGdldFN0YXRlVmVjdG9yKHN0b3JlKS5mb3JFYWNoKChfY2xvY2ssIGNsaWVudCkgPT4ge1xuICAgIGlmICghX3NtLmhhcyhjbGllbnQpKSB7XG4gICAgICBzbS5zZXQoY2xpZW50LCAwKVxuICAgIH1cbiAgfSlcbiAgLy8gd3JpdGUgIyBzdGF0ZXMgdGhhdCB3ZXJlIHVwZGF0ZWRcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIHNtLnNpemUpXG4gIC8vIFdyaXRlIGl0ZW1zIHdpdGggaGlnaGVyIGNsaWVudCBpZHMgZmlyc3RcbiAgLy8gVGhpcyBoZWF2aWx5IGltcHJvdmVzIHRoZSBjb25mbGljdCBhbGdvcml0aG0uXG4gIGFycmF5LmZyb20oc20uZW50cmllcygpKS5zb3J0KChhLCBiKSA9PiBiWzBdIC0gYVswXSkuZm9yRWFjaCgoW2NsaWVudCwgY2xvY2tdKSA9PiB7XG4gICAgd3JpdGVTdHJ1Y3RzKGVuY29kZXIsIC8qKiBAdHlwZSB7QXJyYXk8R0N8SXRlbT59ICovIChzdG9yZS5jbGllbnRzLmdldChjbGllbnQpKSwgY2xpZW50LCBjbG9jaylcbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlciBUaGUgZGVjb2RlciBvYmplY3QgdG8gcmVhZCBkYXRhIGZyb20uXG4gKiBAcGFyYW0ge0RvY30gZG9jXG4gKiBAcmV0dXJuIHtNYXA8bnVtYmVyLCB7IGk6IG51bWJlciwgcmVmczogQXJyYXk8SXRlbSB8IEdDPiB9Pn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkQ2xpZW50c1N0cnVjdFJlZnMgPSAoZGVjb2RlciwgZG9jKSA9PiB7XG4gIC8qKlxuICAgKiBAdHlwZSB7TWFwPG51bWJlciwgeyBpOiBudW1iZXIsIHJlZnM6IEFycmF5PEl0ZW0gfCBHQz4gfT59XG4gICAqL1xuICBjb25zdCBjbGllbnRSZWZzID0gbWFwLmNyZWF0ZSgpXG4gIGNvbnN0IG51bU9mU3RhdGVVcGRhdGVzID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1PZlN0YXRlVXBkYXRlczsgaSsrKSB7XG4gICAgY29uc3QgbnVtYmVyT2ZTdHJ1Y3RzID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8R0N8SXRlbT59XG4gICAgICovXG4gICAgY29uc3QgcmVmcyA9IG5ldyBBcnJheShudW1iZXJPZlN0cnVjdHMpXG4gICAgY29uc3QgY2xpZW50ID0gZGVjb2Rlci5yZWFkQ2xpZW50KClcbiAgICBsZXQgY2xvY2sgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgIC8vIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBjbGllbnRSZWZzLnNldChjbGllbnQsIHsgaTogMCwgcmVmcyB9KVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZTdHJ1Y3RzOyBpKyspIHtcbiAgICAgIGNvbnN0IGluZm8gPSBkZWNvZGVyLnJlYWRJbmZvKClcbiAgICAgIHN3aXRjaCAoYmluYXJ5LkJJVFM1ICYgaW5mbykge1xuICAgICAgICBjYXNlIDA6IHsgLy8gR0NcbiAgICAgICAgICBjb25zdCBsZW4gPSBkZWNvZGVyLnJlYWRMZW4oKVxuICAgICAgICAgIHJlZnNbaV0gPSBuZXcgR0MoY3JlYXRlSUQoY2xpZW50LCBjbG9jayksIGxlbilcbiAgICAgICAgICBjbG9jayArPSBsZW5cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMTA6IHsgLy8gU2tpcCBTdHJ1Y3QgKG5vdGhpbmcgdG8gYXBwbHkpXG4gICAgICAgICAgLy8gQHRvZG8gd2UgY291bGQgcmVkdWNlIHRoZSBhbW91bnQgb2YgY2hlY2tzIGJ5IGFkZGluZyBTa2lwIHN0cnVjdCB0byBjbGllbnRSZWZzIHNvIHdlIGtub3cgdGhhdCBzb21ldGhpbmcgaXMgbWlzc2luZy5cbiAgICAgICAgICBjb25zdCBsZW4gPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgICAgICAgIHJlZnNbaV0gPSBuZXcgU2tpcChjcmVhdGVJRChjbGllbnQsIGNsb2NrKSwgbGVuKVxuICAgICAgICAgIGNsb2NrICs9IGxlblxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDogeyAvLyBJdGVtIHdpdGggY29udGVudFxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIFRoZSBvcHRpbWl6ZWQgaW1wbGVtZW50YXRpb24gZG9lc24ndCB1c2UgYW55IHZhcmlhYmxlcyBiZWNhdXNlIGlubGluaW5nIHZhcmlhYmxlcyBpcyBmYXN0ZXIuXG4gICAgICAgICAgICogQmVsb3cgYSBub24tb3B0aW1pemVkIHZlcnNpb24gaXMgc2hvd24gdGhhdCBpbXBsZW1lbnRzIHRoZSBiYXNpYyBhbGdvcml0aG0gd2l0aFxuICAgICAgICAgICAqIGEgZmV3IGNvbW1lbnRzXG4gICAgICAgICAgICovXG4gICAgICAgICAgY29uc3QgY2FudENvcHlQYXJlbnRJbmZvID0gKGluZm8gJiAoYmluYXJ5LkJJVDcgfCBiaW5hcnkuQklUOCkpID09PSAwXG4gICAgICAgICAgLy8gSWYgcGFyZW50ID0gbnVsbCBhbmQgbmVpdGhlciBsZWZ0IG5vciByaWdodCBhcmUgZGVmaW5lZCwgdGhlbiB3ZSBrbm93IHRoYXQgYHBhcmVudGAgaXMgY2hpbGQgb2YgYHlgXG4gICAgICAgICAgLy8gYW5kIHdlIHJlYWQgdGhlIG5leHQgc3RyaW5nIGFzIHBhcmVudFlLZXkuXG4gICAgICAgICAgLy8gSXQgaW5kaWNhdGVzIGhvdyB3ZSBzdG9yZS9yZXRyaWV2ZSBwYXJlbnQgZnJvbSBgeS5zaGFyZWBcbiAgICAgICAgICAvLyBAdHlwZSB7c3RyaW5nfG51bGx9XG4gICAgICAgICAgY29uc3Qgc3RydWN0ID0gbmV3IEl0ZW0oXG4gICAgICAgICAgICBjcmVhdGVJRChjbGllbnQsIGNsb2NrKSxcbiAgICAgICAgICAgIG51bGwsIC8vIGxlZnRcbiAgICAgICAgICAgIChpbmZvICYgYmluYXJ5LkJJVDgpID09PSBiaW5hcnkuQklUOCA/IGRlY29kZXIucmVhZExlZnRJRCgpIDogbnVsbCwgLy8gb3JpZ2luXG4gICAgICAgICAgICBudWxsLCAvLyByaWdodFxuICAgICAgICAgICAgKGluZm8gJiBiaW5hcnkuQklUNykgPT09IGJpbmFyeS5CSVQ3ID8gZGVjb2Rlci5yZWFkUmlnaHRJRCgpIDogbnVsbCwgLy8gcmlnaHQgb3JpZ2luXG4gICAgICAgICAgICBjYW50Q29weVBhcmVudEluZm8gPyAoZGVjb2Rlci5yZWFkUGFyZW50SW5mbygpID8gZG9jLmdldChkZWNvZGVyLnJlYWRTdHJpbmcoKSkgOiBkZWNvZGVyLnJlYWRMZWZ0SUQoKSkgOiBudWxsLCAvLyBwYXJlbnRcbiAgICAgICAgICAgIGNhbnRDb3B5UGFyZW50SW5mbyAmJiAoaW5mbyAmIGJpbmFyeS5CSVQ2KSA9PT0gYmluYXJ5LkJJVDYgPyBkZWNvZGVyLnJlYWRTdHJpbmcoKSA6IG51bGwsIC8vIHBhcmVudFN1YlxuICAgICAgICAgICAgcmVhZEl0ZW1Db250ZW50KGRlY29kZXIsIGluZm8pIC8vIGl0ZW0gY29udGVudFxuICAgICAgICAgIClcbiAgICAgICAgICAvKiBBIG5vbi1vcHRpbWl6ZWQgaW1wbGVtZW50YXRpb24gb2YgdGhlIGFib3ZlIGFsZ29yaXRobTpcblxuICAgICAgICAgIC8vIFRoZSBpdGVtIHRoYXQgd2FzIG9yaWdpbmFsbHkgdG8gdGhlIGxlZnQgb2YgdGhpcyBpdGVtLlxuICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IChpbmZvICYgYmluYXJ5LkJJVDgpID09PSBiaW5hcnkuQklUOCA/IGRlY29kZXIucmVhZExlZnRJRCgpIDogbnVsbFxuICAgICAgICAgIC8vIFRoZSBpdGVtIHRoYXQgd2FzIG9yaWdpbmFsbHkgdG8gdGhlIHJpZ2h0IG9mIHRoaXMgaXRlbS5cbiAgICAgICAgICBjb25zdCByaWdodE9yaWdpbiA9IChpbmZvICYgYmluYXJ5LkJJVDcpID09PSBiaW5hcnkuQklUNyA/IGRlY29kZXIucmVhZFJpZ2h0SUQoKSA6IG51bGxcbiAgICAgICAgICBjb25zdCBjYW50Q29weVBhcmVudEluZm8gPSAoaW5mbyAmIChiaW5hcnkuQklUNyB8IGJpbmFyeS5CSVQ4KSkgPT09IDBcbiAgICAgICAgICBjb25zdCBoYXNQYXJlbnRZS2V5ID0gY2FudENvcHlQYXJlbnRJbmZvID8gZGVjb2Rlci5yZWFkUGFyZW50SW5mbygpIDogZmFsc2VcbiAgICAgICAgICAvLyBJZiBwYXJlbnQgPSBudWxsIGFuZCBuZWl0aGVyIGxlZnQgbm9yIHJpZ2h0IGFyZSBkZWZpbmVkLCB0aGVuIHdlIGtub3cgdGhhdCBgcGFyZW50YCBpcyBjaGlsZCBvZiBgeWBcbiAgICAgICAgICAvLyBhbmQgd2UgcmVhZCB0aGUgbmV4dCBzdHJpbmcgYXMgcGFyZW50WUtleS5cbiAgICAgICAgICAvLyBJdCBpbmRpY2F0ZXMgaG93IHdlIHN0b3JlL3JldHJpZXZlIHBhcmVudCBmcm9tIGB5LnNoYXJlYFxuICAgICAgICAgIC8vIEB0eXBlIHtzdHJpbmd8bnVsbH1cbiAgICAgICAgICBjb25zdCBwYXJlbnRZS2V5ID0gY2FudENvcHlQYXJlbnRJbmZvICYmIGhhc1BhcmVudFlLZXkgPyBkZWNvZGVyLnJlYWRTdHJpbmcoKSA6IG51bGxcblxuICAgICAgICAgIGNvbnN0IHN0cnVjdCA9IG5ldyBJdGVtKFxuICAgICAgICAgICAgY3JlYXRlSUQoY2xpZW50LCBjbG9jayksXG4gICAgICAgICAgICBudWxsLCAvLyBsZWZ0XG4gICAgICAgICAgICBvcmlnaW4sIC8vIG9yaWdpblxuICAgICAgICAgICAgbnVsbCwgLy8gcmlnaHRcbiAgICAgICAgICAgIHJpZ2h0T3JpZ2luLCAvLyByaWdodCBvcmlnaW5cbiAgICAgICAgICAgIGNhbnRDb3B5UGFyZW50SW5mbyAmJiAhaGFzUGFyZW50WUtleSA/IGRlY29kZXIucmVhZExlZnRJRCgpIDogKHBhcmVudFlLZXkgIT09IG51bGwgPyBkb2MuZ2V0KHBhcmVudFlLZXkpIDogbnVsbCksIC8vIHBhcmVudFxuICAgICAgICAgICAgY2FudENvcHlQYXJlbnRJbmZvICYmIChpbmZvICYgYmluYXJ5LkJJVDYpID09PSBiaW5hcnkuQklUNiA/IGRlY29kZXIucmVhZFN0cmluZygpIDogbnVsbCwgLy8gcGFyZW50U3ViXG4gICAgICAgICAgICByZWFkSXRlbUNvbnRlbnQoZGVjb2RlciwgaW5mbykgLy8gaXRlbSBjb250ZW50XG4gICAgICAgICAgKVxuICAgICAgICAgICovXG4gICAgICAgICAgcmVmc1tpXSA9IHN0cnVjdFxuICAgICAgICAgIGNsb2NrICs9IHN0cnVjdC5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZygndGltZSB0byByZWFkOiAnLCBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSAvLyBAdG9kbyByZW1vdmVcbiAgfVxuICByZXR1cm4gY2xpZW50UmVmc1xufVxuXG4vKipcbiAqIFJlc3VtZSBjb21wdXRpbmcgc3RydWN0cyBnZW5lcmF0ZWQgYnkgc3RydWN0IHJlYWRlcnMuXG4gKlxuICogV2hpbGUgdGhlcmUgaXMgc29tZXRoaW5nIHRvIGRvLCB3ZSBpbnRlZ3JhdGUgc3RydWN0cyBpbiB0aGlzIG9yZGVyXG4gKiAxLiB0b3AgZWxlbWVudCBvbiBzdGFjaywgaWYgc3RhY2sgaXMgbm90IGVtcHR5XG4gKiAyLiBuZXh0IGVsZW1lbnQgZnJvbSBjdXJyZW50IHN0cnVjdCByZWFkZXIgKGlmIGVtcHR5LCB1c2UgbmV4dCBzdHJ1Y3QgcmVhZGVyKVxuICpcbiAqIElmIHN0cnVjdCBjYXVzYWxseSBkZXBlbmRzIG9uIGFub3RoZXIgc3RydWN0IChyZWYubWlzc2luZyksIHdlIHB1dCBuZXh0IHJlYWRlciBvZlxuICogYHJlZi5pZC5jbGllbnRgIG9uIHRvcCBvZiBzdGFjay5cbiAqXG4gKiBBdCBzb21lIHBvaW50IHdlIGZpbmQgYSBzdHJ1Y3QgdGhhdCBoYXMgbm8gY2F1c2FsIGRlcGVuZGVuY2llcyxcbiAqIHRoZW4gd2Ugc3RhcnQgZW1wdHlpbmcgdGhlIHN0YWNrLlxuICpcbiAqIEl0IGlzIG5vdCBwb3NzaWJsZSB0byBoYXZlIGNpcmNsZXM6IGkuZS4gc3RydWN0MSAoZnJvbSBjbGllbnQxKSBkZXBlbmRzIG9uIHN0cnVjdDIgKGZyb20gY2xpZW50MilcbiAqIGRlcGVuZHMgb24gc3RydWN0MyAoZnJvbSBjbGllbnQxKS4gVGhlcmVmb3JlIHRoZSBtYXggc3RhY2sgc2l6ZSBpcyBlcWF1bCB0byBgc3RydWN0UmVhZGVycy5sZW5ndGhgLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIGltcGxlbWVudGVkIGluIGEgd2F5IHNvIHRoYXQgd2UgY2FuIHJlc3VtZSBjb21wdXRhdGlvbiBpZiB0aGlzIHVwZGF0ZVxuICogY2F1c2FsbHkgZGVwZW5kcyBvbiBhbm90aGVyIHVwZGF0ZS5cbiAqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqIEBwYXJhbSB7TWFwPG51bWJlciwgeyBpOiBudW1iZXIsIHJlZnM6IChHQyB8IEl0ZW0pW10gfT59IGNsaWVudHNTdHJ1Y3RSZWZzXG4gKiBAcmV0dXJuIHsgbnVsbCB8IHsgdXBkYXRlOiBVaW50OEFycmF5LCBtaXNzaW5nOiBNYXA8bnVtYmVyLG51bWJlcj4gfSB9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCBpbnRlZ3JhdGVTdHJ1Y3RzID0gKHRyYW5zYWN0aW9uLCBzdG9yZSwgY2xpZW50c1N0cnVjdFJlZnMpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxJdGVtIHwgR0M+fVxuICAgKi9cbiAgY29uc3Qgc3RhY2sgPSBbXVxuICAvLyBzb3J0IHRoZW0gc28gdGhhdCB3ZSB0YWtlIHRoZSBoaWdoZXIgaWQgZmlyc3QsIGluIGNhc2Ugb2YgY29uZmxpY3RzIHRoZSBsb3dlciBpZCB3aWxsIHByb2JhYmx5IG5vdCBjb25mbGljdCB3aXRoIHRoZSBpZCBmcm9tIHRoZSBoaWdoZXIgdXNlci5cbiAgbGV0IGNsaWVudHNTdHJ1Y3RSZWZzSWRzID0gYXJyYXkuZnJvbShjbGllbnRzU3RydWN0UmVmcy5rZXlzKCkpLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxuICBpZiAoY2xpZW50c1N0cnVjdFJlZnNJZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBjb25zdCBnZXROZXh0U3RydWN0VGFyZ2V0ID0gKCkgPT4ge1xuICAgIGlmIChjbGllbnRzU3RydWN0UmVmc0lkcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIGxldCBuZXh0U3RydWN0c1RhcmdldCA9IC8qKiBAdHlwZSB7e2k6bnVtYmVyLHJlZnM6QXJyYXk8R0N8SXRlbT59fSAqLyAoY2xpZW50c1N0cnVjdFJlZnMuZ2V0KGNsaWVudHNTdHJ1Y3RSZWZzSWRzW2NsaWVudHNTdHJ1Y3RSZWZzSWRzLmxlbmd0aCAtIDFdKSlcbiAgICB3aGlsZSAobmV4dFN0cnVjdHNUYXJnZXQucmVmcy5sZW5ndGggPT09IG5leHRTdHJ1Y3RzVGFyZ2V0LmkpIHtcbiAgICAgIGNsaWVudHNTdHJ1Y3RSZWZzSWRzLnBvcCgpXG4gICAgICBpZiAoY2xpZW50c1N0cnVjdFJlZnNJZHMubGVuZ3RoID4gMCkge1xuICAgICAgICBuZXh0U3RydWN0c1RhcmdldCA9IC8qKiBAdHlwZSB7e2k6bnVtYmVyLHJlZnM6QXJyYXk8R0N8SXRlbT59fSAqLyAoY2xpZW50c1N0cnVjdFJlZnMuZ2V0KGNsaWVudHNTdHJ1Y3RSZWZzSWRzW2NsaWVudHNTdHJ1Y3RSZWZzSWRzLmxlbmd0aCAtIDFdKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXh0U3RydWN0c1RhcmdldFxuICB9XG4gIGxldCBjdXJTdHJ1Y3RzVGFyZ2V0ID0gZ2V0TmV4dFN0cnVjdFRhcmdldCgpXG4gIGlmIChjdXJTdHJ1Y3RzVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7U3RydWN0U3RvcmV9XG4gICAqL1xuICBjb25zdCByZXN0U3RydWN0cyA9IG5ldyBTdHJ1Y3RTdG9yZSgpXG4gIGNvbnN0IG1pc3NpbmdTViA9IG5ldyBNYXAoKVxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNsaWVudFxuICAgKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAgICovXG4gIGNvbnN0IHVwZGF0ZU1pc3NpbmdTdiA9IChjbGllbnQsIGNsb2NrKSA9PiB7XG4gICAgY29uc3QgbWNsb2NrID0gbWlzc2luZ1NWLmdldChjbGllbnQpXG4gICAgaWYgKG1jbG9jayA9PSBudWxsIHx8IG1jbG9jayA+IGNsb2NrKSB7XG4gICAgICBtaXNzaW5nU1Yuc2V0KGNsaWVudCwgY2xvY2spXG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAdHlwZSB7R0N8SXRlbX1cbiAgICovXG4gIGxldCBzdGFja0hlYWQgPSAvKiogQHR5cGUge2FueX0gKi8gKGN1clN0cnVjdHNUYXJnZXQpLnJlZnNbLyoqIEB0eXBlIHthbnl9ICovIChjdXJTdHJ1Y3RzVGFyZ2V0KS5pKytdXG4gIC8vIGNhY2hpbmcgdGhlIHN0YXRlIGJlY2F1c2UgaXQgaXMgdXNlZCB2ZXJ5IG9mdGVuXG4gIGNvbnN0IHN0YXRlID0gbmV3IE1hcCgpXG5cbiAgY29uc3QgYWRkU3RhY2tUb1Jlc3RTUyA9ICgpID0+IHtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc3RhY2spIHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGl0ZW0uaWQuY2xpZW50XG4gICAgICBjb25zdCB1bmFwcGxpY2FibGVJdGVtcyA9IGNsaWVudHNTdHJ1Y3RSZWZzLmdldChjbGllbnQpXG4gICAgICBpZiAodW5hcHBsaWNhYmxlSXRlbXMpIHtcbiAgICAgICAgLy8gZGVjcmVtZW50IGJlY2F1c2Ugd2Ugd2VyZW4ndCBhYmxlIHRvIGFwcGx5IHByZXZpb3VzIG9wZXJhdGlvblxuICAgICAgICB1bmFwcGxpY2FibGVJdGVtcy5pLS1cbiAgICAgICAgcmVzdFN0cnVjdHMuY2xpZW50cy5zZXQoY2xpZW50LCB1bmFwcGxpY2FibGVJdGVtcy5yZWZzLnNsaWNlKHVuYXBwbGljYWJsZUl0ZW1zLmkpKVxuICAgICAgICBjbGllbnRzU3RydWN0UmVmcy5kZWxldGUoY2xpZW50KVxuICAgICAgICB1bmFwcGxpY2FibGVJdGVtcy5pID0gMFxuICAgICAgICB1bmFwcGxpY2FibGVJdGVtcy5yZWZzID0gW11cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGl0ZW0gd2FzIHRoZSBsYXN0IGl0ZW0gb24gY2xpZW50c1N0cnVjdFJlZnMgYW5kIHRoZSBmaWVsZCB3YXMgYWxyZWFkeSBjbGVhcmVkLiBBZGQgaXRlbSB0byByZXN0U3RydWN0cyBhbmQgY29udGludWVcbiAgICAgICAgcmVzdFN0cnVjdHMuY2xpZW50cy5zZXQoY2xpZW50LCBbaXRlbV0pXG4gICAgICB9XG4gICAgICAvLyByZW1vdmUgY2xpZW50IGZyb20gY2xpZW50c1N0cnVjdFJlZnNJZHMgdG8gcHJldmVudCB1c2VycyBmcm9tIGFwcGx5aW5nIHRoZSBzYW1lIHVwZGF0ZSBhZ2FpblxuICAgICAgY2xpZW50c1N0cnVjdFJlZnNJZHMgPSBjbGllbnRzU3RydWN0UmVmc0lkcy5maWx0ZXIoYyA9PiBjICE9PSBjbGllbnQpXG4gICAgfVxuICAgIHN0YWNrLmxlbmd0aCA9IDBcbiAgfVxuXG4gIC8vIGl0ZXJhdGUgb3ZlciBhbGwgc3RydWN0IHJlYWRlcnMgdW50aWwgd2UgYXJlIGRvbmVcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBpZiAoc3RhY2tIZWFkLmNvbnN0cnVjdG9yICE9PSBTa2lwKSB7XG4gICAgICBjb25zdCBsb2NhbENsb2NrID0gbWFwLnNldElmVW5kZWZpbmVkKHN0YXRlLCBzdGFja0hlYWQuaWQuY2xpZW50LCAoKSA9PiBnZXRTdGF0ZShzdG9yZSwgc3RhY2tIZWFkLmlkLmNsaWVudCkpXG4gICAgICBjb25zdCBvZmZzZXQgPSBsb2NhbENsb2NrIC0gc3RhY2tIZWFkLmlkLmNsb2NrXG4gICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAvLyB1cGRhdGUgZnJvbSB0aGUgc2FtZSBjbGllbnQgaXMgbWlzc2luZ1xuICAgICAgICBzdGFjay5wdXNoKHN0YWNrSGVhZClcbiAgICAgICAgdXBkYXRlTWlzc2luZ1N2KHN0YWNrSGVhZC5pZC5jbGllbnQsIHN0YWNrSGVhZC5pZC5jbG9jayAtIDEpXG4gICAgICAgIC8vIGhpZCBhIGRlYWQgd2FsbCwgYWRkIGFsbCBpdGVtcyBmcm9tIHN0YWNrIHRvIHJlc3RTU1xuICAgICAgICBhZGRTdGFja1RvUmVzdFNTKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG1pc3NpbmcgPSBzdGFja0hlYWQuZ2V0TWlzc2luZyh0cmFuc2FjdGlvbiwgc3RvcmUpXG4gICAgICAgIGlmIChtaXNzaW5nICE9PSBudWxsKSB7XG4gICAgICAgICAgc3RhY2sucHVzaChzdGFja0hlYWQpXG4gICAgICAgICAgLy8gZ2V0IHRoZSBzdHJ1Y3QgcmVhZGVyIHRoYXQgaGFzIHRoZSBtaXNzaW5nIHN0cnVjdFxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEB0eXBlIHt7IHJlZnM6IEFycmF5PEdDfEl0ZW0+LCBpOiBudW1iZXIgfX1cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBjb25zdCBzdHJ1Y3RSZWZzID0gY2xpZW50c1N0cnVjdFJlZnMuZ2V0KC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAobWlzc2luZykpIHx8IHsgcmVmczogW10sIGk6IDAgfVxuICAgICAgICAgIGlmIChzdHJ1Y3RSZWZzLnJlZnMubGVuZ3RoID09PSBzdHJ1Y3RSZWZzLmkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgdXBkYXRlIG1lc3NhZ2UgY2F1c2FsbHkgZGVwZW5kcyBvbiBhbm90aGVyIHVwZGF0ZSBtZXNzYWdlIHRoYXQgZG9lc24ndCBleGlzdCB5ZXRcbiAgICAgICAgICAgIHVwZGF0ZU1pc3NpbmdTdigvKiogQHR5cGUge251bWJlcn0gKi8gKG1pc3NpbmcpLCBnZXRTdGF0ZShzdG9yZSwgbWlzc2luZykpXG4gICAgICAgICAgICBhZGRTdGFja1RvUmVzdFNTKClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhY2tIZWFkID0gc3RydWN0UmVmcy5yZWZzW3N0cnVjdFJlZnMuaSsrXVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ID09PSAwIHx8IG9mZnNldCA8IHN0YWNrSGVhZC5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBhbGwgZmluZSwgYXBwbHkgdGhlIHN0YWNraGVhZFxuICAgICAgICAgIHN0YWNrSGVhZC5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIG9mZnNldClcbiAgICAgICAgICBzdGF0ZS5zZXQoc3RhY2tIZWFkLmlkLmNsaWVudCwgc3RhY2tIZWFkLmlkLmNsb2NrICsgc3RhY2tIZWFkLmxlbmd0aClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBpdGVyYXRlIHRvIG5leHQgc3RhY2tIZWFkXG4gICAgaWYgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgIHN0YWNrSGVhZCA9IC8qKiBAdHlwZSB7R0N8SXRlbX0gKi8gKHN0YWNrLnBvcCgpKVxuICAgIH0gZWxzZSBpZiAoY3VyU3RydWN0c1RhcmdldCAhPT0gbnVsbCAmJiBjdXJTdHJ1Y3RzVGFyZ2V0LmkgPCBjdXJTdHJ1Y3RzVGFyZ2V0LnJlZnMubGVuZ3RoKSB7XG4gICAgICBzdGFja0hlYWQgPSAvKiogQHR5cGUge0dDfEl0ZW19ICovIChjdXJTdHJ1Y3RzVGFyZ2V0LnJlZnNbY3VyU3RydWN0c1RhcmdldC5pKytdKVxuICAgIH0gZWxzZSB7XG4gICAgICBjdXJTdHJ1Y3RzVGFyZ2V0ID0gZ2V0TmV4dFN0cnVjdFRhcmdldCgpXG4gICAgICBpZiAoY3VyU3RydWN0c1RhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAvLyB3ZSBhcmUgZG9uZSFcbiAgICAgICAgYnJlYWtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YWNrSGVhZCA9IC8qKiBAdHlwZSB7R0N8SXRlbX0gKi8gKGN1clN0cnVjdHNUYXJnZXQucmVmc1tjdXJTdHJ1Y3RzVGFyZ2V0LmkrK10pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChyZXN0U3RydWN0cy5jbGllbnRzLnNpemUgPiAwKSB7XG4gICAgY29uc3QgZW5jb2RlciA9IG5ldyBVcGRhdGVFbmNvZGVyVjIoKVxuICAgIHdyaXRlQ2xpZW50c1N0cnVjdHMoZW5jb2RlciwgcmVzdFN0cnVjdHMsIG5ldyBNYXAoKSlcbiAgICAvLyB3cml0ZSBlbXB0eSBkZWxldGVzZXRcbiAgICAvLyB3cml0ZURlbGV0ZVNldChlbmNvZGVyLCBuZXcgRGVsZXRlU2V0KCkpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIDApIC8vID0+IG5vIG5lZWQgZm9yIGFuIGV4dHJhIGZ1bmN0aW9uIGNhbGwsIGp1c3Qgd3JpdGUgMCBkZWxldGVzXG4gICAgcmV0dXJuIHsgbWlzc2luZzogbWlzc2luZ1NWLCB1cGRhdGU6IGVuY29kZXIudG9VaW50OEFycmF5KCkgfVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVTdHJ1Y3RzRnJvbVRyYW5zYWN0aW9uID0gKGVuY29kZXIsIHRyYW5zYWN0aW9uKSA9PiB3cml0ZUNsaWVudHNTdHJ1Y3RzKGVuY29kZXIsIHRyYW5zYWN0aW9uLmRvYy5zdG9yZSwgdHJhbnNhY3Rpb24uYmVmb3JlU3RhdGUpXG5cbi8qKlxuICogUmVhZCBhbmQgYXBwbHkgYSBkb2N1bWVudCB1cGRhdGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoYXMgdGhlIHNhbWUgZWZmZWN0IGFzIGBhcHBseVVwZGF0ZWAgYnV0IGFjY2VwdHMgYSBkZWNvZGVyLlxuICpcbiAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlclxuICogQHBhcmFtIHtEb2N9IHlkb2NcbiAqIEBwYXJhbSB7YW55fSBbdHJhbnNhY3Rpb25PcmlnaW5dIFRoaXMgd2lsbCBiZSBzdG9yZWQgb24gYHRyYW5zYWN0aW9uLm9yaWdpbmAgYW5kIGAub24oJ3VwZGF0ZScsICh1cGRhdGUsIG9yaWdpbikpYFxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IFtzdHJ1Y3REZWNvZGVyXVxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFVwZGF0ZVYyID0gKGRlY29kZXIsIHlkb2MsIHRyYW5zYWN0aW9uT3JpZ2luLCBzdHJ1Y3REZWNvZGVyID0gbmV3IFVwZGF0ZURlY29kZXJWMihkZWNvZGVyKSkgPT5cbiAgdHJhbnNhY3QoeWRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgIC8vIGZvcmNlIHRoYXQgdHJhbnNhY3Rpb24ubG9jYWwgaXMgc2V0IHRvIG5vbi1sb2NhbFxuICAgIHRyYW5zYWN0aW9uLmxvY2FsID0gZmFsc2VcbiAgICBsZXQgcmV0cnkgPSBmYWxzZVxuICAgIGNvbnN0IGRvYyA9IHRyYW5zYWN0aW9uLmRvY1xuICAgIGNvbnN0IHN0b3JlID0gZG9jLnN0b3JlXG4gICAgLy8gbGV0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBjb25zdCBzcyA9IHJlYWRDbGllbnRzU3RydWN0UmVmcyhzdHJ1Y3REZWNvZGVyLCBkb2MpXG4gICAgLy8gY29uc29sZS5sb2coJ3RpbWUgdG8gcmVhZCBzdHJ1Y3RzOiAnLCBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSAvLyBAdG9kbyByZW1vdmVcbiAgICAvLyBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgLy8gY29uc29sZS5sb2coJ3RpbWUgdG8gbWVyZ2U6ICcsIHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpIC8vIEB0b2RvIHJlbW92ZVxuICAgIC8vIHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBjb25zdCByZXN0U3RydWN0cyA9IGludGVncmF0ZVN0cnVjdHModHJhbnNhY3Rpb24sIHN0b3JlLCBzcylcbiAgICBjb25zdCBwZW5kaW5nID0gc3RvcmUucGVuZGluZ1N0cnVjdHNcbiAgICBpZiAocGVuZGluZykge1xuICAgICAgLy8gY2hlY2sgaWYgd2UgY2FuIGFwcGx5IHNvbWV0aGluZ1xuICAgICAgZm9yIChjb25zdCBbY2xpZW50LCBjbG9ja10gb2YgcGVuZGluZy5taXNzaW5nKSB7XG4gICAgICAgIGlmIChjbG9jayA8IGdldFN0YXRlKHN0b3JlLCBjbGllbnQpKSB7XG4gICAgICAgICAgcmV0cnkgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJlc3RTdHJ1Y3RzKSB7XG4gICAgICAgIC8vIG1lcmdlIHJlc3RTdHJ1Y3RzIGludG8gc3RvcmUucGVuZGluZ1xuICAgICAgICBmb3IgKGNvbnN0IFtjbGllbnQsIGNsb2NrXSBvZiByZXN0U3RydWN0cy5taXNzaW5nKSB7XG4gICAgICAgICAgY29uc3QgbWNsb2NrID0gcGVuZGluZy5taXNzaW5nLmdldChjbGllbnQpXG4gICAgICAgICAgaWYgKG1jbG9jayA9PSBudWxsIHx8IG1jbG9jayA+IGNsb2NrKSB7XG4gICAgICAgICAgICBwZW5kaW5nLm1pc3Npbmcuc2V0KGNsaWVudCwgY2xvY2spXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBlbmRpbmcudXBkYXRlID0gbWVyZ2VVcGRhdGVzVjIoW3BlbmRpbmcudXBkYXRlLCByZXN0U3RydWN0cy51cGRhdGVdKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdG9yZS5wZW5kaW5nU3RydWN0cyA9IHJlc3RTdHJ1Y3RzXG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKCd0aW1lIHRvIGludGVncmF0ZTogJywgcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLy8gQHRvZG8gcmVtb3ZlXG4gICAgLy8gc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGNvbnN0IGRzUmVzdCA9IHJlYWRBbmRBcHBseURlbGV0ZVNldChzdHJ1Y3REZWNvZGVyLCB0cmFuc2FjdGlvbiwgc3RvcmUpXG4gICAgaWYgKHN0b3JlLnBlbmRpbmdEcykge1xuICAgICAgLy8gQHRvZG8gd2UgY291bGQgbWFrZSBhIGxvd2VyLWJvdW5kIHN0YXRlLXZlY3RvciBjaGVjayBhcyB3ZSBkbyBhYm92ZVxuICAgICAgY29uc3QgcGVuZGluZ0RTVXBkYXRlID0gbmV3IFVwZGF0ZURlY29kZXJWMihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHN0b3JlLnBlbmRpbmdEcykpXG4gICAgICBkZWNvZGluZy5yZWFkVmFyVWludChwZW5kaW5nRFNVcGRhdGUucmVzdERlY29kZXIpIC8vIHJlYWQgMCBzdHJ1Y3RzLCBiZWNhdXNlIHdlIG9ubHkgZW5jb2RlIGRlbGV0ZXMgaW4gcGVuZGluZ2RzdXBkYXRlXG4gICAgICBjb25zdCBkc1Jlc3QyID0gcmVhZEFuZEFwcGx5RGVsZXRlU2V0KHBlbmRpbmdEU1VwZGF0ZSwgdHJhbnNhY3Rpb24sIHN0b3JlKVxuICAgICAgaWYgKGRzUmVzdCAmJiBkc1Jlc3QyKSB7XG4gICAgICAgIC8vIGNhc2UgMTogZHMxICE9IG51bGwgJiYgZHMyICE9IG51bGxcbiAgICAgICAgc3RvcmUucGVuZGluZ0RzID0gbWVyZ2VVcGRhdGVzVjIoW2RzUmVzdCwgZHNSZXN0Ml0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjYXNlIDI6IGRzMSAhPSBudWxsXG4gICAgICAgIC8vIGNhc2UgMzogZHMyICE9IG51bGxcbiAgICAgICAgLy8gY2FzZSA0OiBkczEgPT0gbnVsbCAmJiBkczIgPT0gbnVsbFxuICAgICAgICBzdG9yZS5wZW5kaW5nRHMgPSBkc1Jlc3QgfHwgZHNSZXN0MlxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFaXRoZXIgZHNSZXN0ID09IG51bGwgJiYgcGVuZGluZ0RzID09IG51bGwgT1IgZHNSZXN0ICE9IG51bGxcbiAgICAgIHN0b3JlLnBlbmRpbmdEcyA9IGRzUmVzdFxuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZygndGltZSB0byBjbGVhbnVwOiAnLCBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSAvLyBAdG9kbyByZW1vdmVcbiAgICAvLyBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXG5cbiAgICAvLyBjb25zb2xlLmxvZygndGltZSB0byByZXN1bWUgZGVsZXRlIHJlYWRlcnM6ICcsIHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpIC8vIEB0b2RvIHJlbW92ZVxuICAgIC8vIHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBpZiAocmV0cnkpIHtcbiAgICAgIGNvbnN0IHVwZGF0ZSA9IC8qKiBAdHlwZSB7e3VwZGF0ZTogVWludDhBcnJheX19ICovIChzdG9yZS5wZW5kaW5nU3RydWN0cykudXBkYXRlXG4gICAgICBzdG9yZS5wZW5kaW5nU3RydWN0cyA9IG51bGxcbiAgICAgIGFwcGx5VXBkYXRlVjIodHJhbnNhY3Rpb24uZG9jLCB1cGRhdGUpXG4gICAgfVxuICB9LCB0cmFuc2FjdGlvbk9yaWdpbiwgZmFsc2UpXG5cbi8qKlxuICogUmVhZCBhbmQgYXBwbHkgYSBkb2N1bWVudCB1cGRhdGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoYXMgdGhlIHNhbWUgZWZmZWN0IGFzIGBhcHBseVVwZGF0ZWAgYnV0IGFjY2VwdHMgYSBkZWNvZGVyLlxuICpcbiAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlclxuICogQHBhcmFtIHtEb2N9IHlkb2NcbiAqIEBwYXJhbSB7YW55fSBbdHJhbnNhY3Rpb25PcmlnaW5dIFRoaXMgd2lsbCBiZSBzdG9yZWQgb24gYHRyYW5zYWN0aW9uLm9yaWdpbmAgYW5kIGAub24oJ3VwZGF0ZScsICh1cGRhdGUsIG9yaWdpbikpYFxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFVwZGF0ZSA9IChkZWNvZGVyLCB5ZG9jLCB0cmFuc2FjdGlvbk9yaWdpbikgPT4gcmVhZFVwZGF0ZVYyKGRlY29kZXIsIHlkb2MsIHRyYW5zYWN0aW9uT3JpZ2luLCBuZXcgVXBkYXRlRGVjb2RlclYxKGRlY29kZXIpKVxuXG4vKipcbiAqIEFwcGx5IGEgZG9jdW1lbnQgdXBkYXRlIGNyZWF0ZWQgYnksIGZvciBleGFtcGxlLCBgeS5vbigndXBkYXRlJywgdXBkYXRlID0+IC4uKWAgb3IgYHVwZGF0ZSA9IGVuY29kZVN0YXRlQXNVcGRhdGUoKWAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoYXMgdGhlIHNhbWUgZWZmZWN0IGFzIGByZWFkVXBkYXRlYCBidXQgYWNjZXB0cyBhbiBVaW50OEFycmF5IGluc3RlYWQgb2YgYSBEZWNvZGVyLlxuICpcbiAqIEBwYXJhbSB7RG9jfSB5ZG9jXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICogQHBhcmFtIHthbnl9IFt0cmFuc2FjdGlvbk9yaWdpbl0gVGhpcyB3aWxsIGJlIHN0b3JlZCBvbiBgdHJhbnNhY3Rpb24ub3JpZ2luYCBhbmQgYC5vbigndXBkYXRlJywgKHVwZGF0ZSwgb3JpZ2luKSlgXG4gKiBAcGFyYW0ge3R5cGVvZiBVcGRhdGVEZWNvZGVyVjEgfCB0eXBlb2YgVXBkYXRlRGVjb2RlclYyfSBbWURlY29kZXJdXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBhcHBseVVwZGF0ZVYyID0gKHlkb2MsIHVwZGF0ZSwgdHJhbnNhY3Rpb25PcmlnaW4sIFlEZWNvZGVyID0gVXBkYXRlRGVjb2RlclYyKSA9PiB7XG4gIGNvbnN0IGRlY29kZXIgPSBkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSlcbiAgcmVhZFVwZGF0ZVYyKGRlY29kZXIsIHlkb2MsIHRyYW5zYWN0aW9uT3JpZ2luLCBuZXcgWURlY29kZXIoZGVjb2RlcikpXG59XG5cbi8qKlxuICogQXBwbHkgYSBkb2N1bWVudCB1cGRhdGUgY3JlYXRlZCBieSwgZm9yIGV4YW1wbGUsIGB5Lm9uKCd1cGRhdGUnLCB1cGRhdGUgPT4gLi4pYCBvciBgdXBkYXRlID0gZW5jb2RlU3RhdGVBc1VwZGF0ZSgpYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyB0aGUgc2FtZSBlZmZlY3QgYXMgYHJlYWRVcGRhdGVgIGJ1dCBhY2NlcHRzIGFuIFVpbnQ4QXJyYXkgaW5zdGVhZCBvZiBhIERlY29kZXIuXG4gKlxuICogQHBhcmFtIHtEb2N9IHlkb2NcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge2FueX0gW3RyYW5zYWN0aW9uT3JpZ2luXSBUaGlzIHdpbGwgYmUgc3RvcmVkIG9uIGB0cmFuc2FjdGlvbi5vcmlnaW5gIGFuZCBgLm9uKCd1cGRhdGUnLCAodXBkYXRlLCBvcmlnaW4pKWBcbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGFwcGx5VXBkYXRlID0gKHlkb2MsIHVwZGF0ZSwgdHJhbnNhY3Rpb25PcmlnaW4pID0+IGFwcGx5VXBkYXRlVjIoeWRvYywgdXBkYXRlLCB0cmFuc2FjdGlvbk9yaWdpbiwgVXBkYXRlRGVjb2RlclYxKVxuXG4vKipcbiAqIFdyaXRlIGFsbCB0aGUgZG9jdW1lbnQgYXMgYSBzaW5nbGUgdXBkYXRlIG1lc3NhZ2UuIElmIHlvdSBzcGVjaWZ5IHRoZSBzdGF0ZSBvZiB0aGUgcmVtb3RlIGNsaWVudCAoYHRhcmdldFN0YXRlVmVjdG9yYCkgaXQgd2lsbFxuICogb25seSB3cml0ZSB0aGUgb3BlcmF0aW9ucyB0aGF0IGFyZSBtaXNzaW5nLlxuICpcbiAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge0RvY30gZG9jXG4gKiBAcGFyYW0ge01hcDxudW1iZXIsbnVtYmVyPn0gW3RhcmdldFN0YXRlVmVjdG9yXSBUaGUgc3RhdGUgb2YgdGhlIHRhcmdldCB0aGF0IHJlY2VpdmVzIHRoZSB1cGRhdGUuIExlYXZlIGVtcHR5IHRvIHdyaXRlIGFsbCBrbm93biBzdHJ1Y3RzXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVN0YXRlQXNVcGRhdGUgPSAoZW5jb2RlciwgZG9jLCB0YXJnZXRTdGF0ZVZlY3RvciA9IG5ldyBNYXAoKSkgPT4ge1xuICB3cml0ZUNsaWVudHNTdHJ1Y3RzKGVuY29kZXIsIGRvYy5zdG9yZSwgdGFyZ2V0U3RhdGVWZWN0b3IpXG4gIHdyaXRlRGVsZXRlU2V0KGVuY29kZXIsIGNyZWF0ZURlbGV0ZVNldEZyb21TdHJ1Y3RTdG9yZShkb2Muc3RvcmUpKVxufVxuXG4vKipcbiAqIFdyaXRlIGFsbCB0aGUgZG9jdW1lbnQgYXMgYSBzaW5nbGUgdXBkYXRlIG1lc3NhZ2UgdGhhdCBjYW4gYmUgYXBwbGllZCBvbiB0aGUgcmVtb3RlIGRvY3VtZW50LiBJZiB5b3Ugc3BlY2lmeSB0aGUgc3RhdGUgb2YgdGhlIHJlbW90ZSBjbGllbnQgKGB0YXJnZXRTdGF0ZWApIGl0IHdpbGxcbiAqIG9ubHkgd3JpdGUgdGhlIG9wZXJhdGlvbnMgdGhhdCBhcmUgbWlzc2luZy5cbiAqXG4gKiBVc2UgYHdyaXRlU3RhdGVBc1VwZGF0ZWAgaW5zdGVhZCBpZiB5b3UgYXJlIHdvcmtpbmcgd2l0aCBsaWIwL2VuY29kaW5nLmpzI0VuY29kZXJcbiAqXG4gKiBAcGFyYW0ge0RvY30gZG9jXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IFtlbmNvZGVkVGFyZ2V0U3RhdGVWZWN0b3JdIFRoZSBzdGF0ZSBvZiB0aGUgdGFyZ2V0IHRoYXQgcmVjZWl2ZXMgdGhlIHVwZGF0ZS4gTGVhdmUgZW1wdHkgdG8gd3JpdGUgYWxsIGtub3duIHN0cnVjdHNcbiAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBbZW5jb2Rlcl1cbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTdGF0ZUFzVXBkYXRlVjIgPSAoZG9jLCBlbmNvZGVkVGFyZ2V0U3RhdGVWZWN0b3IgPSBuZXcgVWludDhBcnJheShbMF0pLCBlbmNvZGVyID0gbmV3IFVwZGF0ZUVuY29kZXJWMigpKSA9PiB7XG4gIGNvbnN0IHRhcmdldFN0YXRlVmVjdG9yID0gZGVjb2RlU3RhdGVWZWN0b3IoZW5jb2RlZFRhcmdldFN0YXRlVmVjdG9yKVxuICB3cml0ZVN0YXRlQXNVcGRhdGUoZW5jb2RlciwgZG9jLCB0YXJnZXRTdGF0ZVZlY3RvcilcbiAgY29uc3QgdXBkYXRlcyA9IFtlbmNvZGVyLnRvVWludDhBcnJheSgpXVxuICAvLyBhbHNvIGFkZCB0aGUgcGVuZGluZyB1cGRhdGVzIChpZiB0aGVyZSBhcmUgYW55KVxuICBpZiAoZG9jLnN0b3JlLnBlbmRpbmdEcykge1xuICAgIHVwZGF0ZXMucHVzaChkb2Muc3RvcmUucGVuZGluZ0RzKVxuICB9XG4gIGlmIChkb2Muc3RvcmUucGVuZGluZ1N0cnVjdHMpIHtcbiAgICB1cGRhdGVzLnB1c2goZGlmZlVwZGF0ZVYyKGRvYy5zdG9yZS5wZW5kaW5nU3RydWN0cy51cGRhdGUsIGVuY29kZWRUYXJnZXRTdGF0ZVZlY3RvcikpXG4gIH1cbiAgaWYgKHVwZGF0ZXMubGVuZ3RoID4gMSkge1xuICAgIGlmIChlbmNvZGVyLmNvbnN0cnVjdG9yID09PSBVcGRhdGVFbmNvZGVyVjEpIHtcbiAgICAgIHJldHVybiBtZXJnZVVwZGF0ZXModXBkYXRlcy5tYXAoKHVwZGF0ZSwgaSkgPT4gaSA9PT0gMCA/IHVwZGF0ZSA6IGNvbnZlcnRVcGRhdGVGb3JtYXRWMlRvVjEodXBkYXRlKSkpXG4gICAgfSBlbHNlIGlmIChlbmNvZGVyLmNvbnN0cnVjdG9yID09PSBVcGRhdGVFbmNvZGVyVjIpIHtcbiAgICAgIHJldHVybiBtZXJnZVVwZGF0ZXNWMih1cGRhdGVzKVxuICAgIH1cbiAgfVxuICByZXR1cm4gdXBkYXRlc1swXVxufVxuXG4vKipcbiAqIFdyaXRlIGFsbCB0aGUgZG9jdW1lbnQgYXMgYSBzaW5nbGUgdXBkYXRlIG1lc3NhZ2UgdGhhdCBjYW4gYmUgYXBwbGllZCBvbiB0aGUgcmVtb3RlIGRvY3VtZW50LiBJZiB5b3Ugc3BlY2lmeSB0aGUgc3RhdGUgb2YgdGhlIHJlbW90ZSBjbGllbnQgKGB0YXJnZXRTdGF0ZWApIGl0IHdpbGxcbiAqIG9ubHkgd3JpdGUgdGhlIG9wZXJhdGlvbnMgdGhhdCBhcmUgbWlzc2luZy5cbiAqXG4gKiBVc2UgYHdyaXRlU3RhdGVBc1VwZGF0ZWAgaW5zdGVhZCBpZiB5b3UgYXJlIHdvcmtpbmcgd2l0aCBsaWIwL2VuY29kaW5nLmpzI0VuY29kZXJcbiAqXG4gKiBAcGFyYW0ge0RvY30gZG9jXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IFtlbmNvZGVkVGFyZ2V0U3RhdGVWZWN0b3JdIFRoZSBzdGF0ZSBvZiB0aGUgdGFyZ2V0IHRoYXQgcmVjZWl2ZXMgdGhlIHVwZGF0ZS4gTGVhdmUgZW1wdHkgdG8gd3JpdGUgYWxsIGtub3duIHN0cnVjdHNcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTdGF0ZUFzVXBkYXRlID0gKGRvYywgZW5jb2RlZFRhcmdldFN0YXRlVmVjdG9yKSA9PiBlbmNvZGVTdGF0ZUFzVXBkYXRlVjIoZG9jLCBlbmNvZGVkVGFyZ2V0U3RhdGVWZWN0b3IsIG5ldyBVcGRhdGVFbmNvZGVyVjEoKSlcblxuLyoqXG4gKiBSZWFkIHN0YXRlIHZlY3RvciBmcm9tIERlY29kZXIgYW5kIHJldHVybiBhcyBNYXBcbiAqXG4gKiBAcGFyYW0ge0RTRGVjb2RlclYxIHwgRFNEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge01hcDxudW1iZXIsbnVtYmVyPn0gTWFwcyBgY2xpZW50YCB0byB0aGUgbnVtYmVyIG5leHQgZXhwZWN0ZWQgYGNsb2NrYCBmcm9tIHRoYXQgY2xpZW50LlxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFN0YXRlVmVjdG9yID0gZGVjb2RlciA9PiB7XG4gIGNvbnN0IHNzID0gbmV3IE1hcCgpXG4gIGNvbnN0IHNzTGVuZ3RoID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzc0xlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2xpZW50ID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgICBjb25zdCBjbG9jayA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgc3Muc2V0KGNsaWVudCwgY2xvY2spXG4gIH1cbiAgcmV0dXJuIHNzXG59XG5cbi8qKlxuICogUmVhZCBkZWNvZGVkU3RhdGUgYW5kIHJldHVybiBTdGF0ZSBhcyBNYXAuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkZWNvZGVkU3RhdGVcbiAqIEByZXR1cm4ge01hcDxudW1iZXIsbnVtYmVyPn0gTWFwcyBgY2xpZW50YCB0byB0aGUgbnVtYmVyIG5leHQgZXhwZWN0ZWQgYGNsb2NrYCBmcm9tIHRoYXQgY2xpZW50LlxuICpcbiAqIEBmdW5jdGlvblxuICovXG4vLyBleHBvcnQgY29uc3QgZGVjb2RlU3RhdGVWZWN0b3JWMiA9IGRlY29kZWRTdGF0ZSA9PiByZWFkU3RhdGVWZWN0b3IobmV3IERTRGVjb2RlclYyKGRlY29kaW5nLmNyZWF0ZURlY29kZXIoZGVjb2RlZFN0YXRlKSkpXG5cbi8qKlxuICogUmVhZCBkZWNvZGVkU3RhdGUgYW5kIHJldHVybiBTdGF0ZSBhcyBNYXAuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkZWNvZGVkU3RhdGVcbiAqIEByZXR1cm4ge01hcDxudW1iZXIsbnVtYmVyPn0gTWFwcyBgY2xpZW50YCB0byB0aGUgbnVtYmVyIG5leHQgZXhwZWN0ZWQgYGNsb2NrYCBmcm9tIHRoYXQgY2xpZW50LlxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZGVjb2RlU3RhdGVWZWN0b3IgPSBkZWNvZGVkU3RhdGUgPT4gcmVhZFN0YXRlVmVjdG9yKG5ldyBEU0RlY29kZXJWMShkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGRlY29kZWRTdGF0ZSkpKVxuXG4vKipcbiAqIEBwYXJhbSB7RFNFbmNvZGVyVjEgfCBEU0VuY29kZXJWMn0gZW5jb2RlclxuICogQHBhcmFtIHtNYXA8bnVtYmVyLG51bWJlcj59IHN2XG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlU3RhdGVWZWN0b3IgPSAoZW5jb2Rlciwgc3YpID0+IHtcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIHN2LnNpemUpXG4gIGFycmF5LmZyb20oc3YuZW50cmllcygpKS5zb3J0KChhLCBiKSA9PiBiWzBdIC0gYVswXSkuZm9yRWFjaCgoW2NsaWVudCwgY2xvY2tdKSA9PiB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGNsaWVudCkgLy8gQHRvZG8gdXNlIGEgc3BlY2lhbCBjbGllbnQgZGVjb2RlciB0aGF0IGlzIGJhc2VkIG9uIG1hcHBpbmdcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgY2xvY2spXG4gIH0pXG4gIHJldHVybiBlbmNvZGVyXG59XG5cbi8qKlxuICogQHBhcmFtIHtEU0VuY29kZXJWMSB8IERTRW5jb2RlclYyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge0RvY30gZG9jXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZURvY3VtZW50U3RhdGVWZWN0b3IgPSAoZW5jb2RlciwgZG9jKSA9PiB3cml0ZVN0YXRlVmVjdG9yKGVuY29kZXIsIGdldFN0YXRlVmVjdG9yKGRvYy5zdG9yZSkpXG5cbi8qKlxuICogRW5jb2RlIFN0YXRlIGFzIFVpbnQ4QXJyYXkuXG4gKlxuICogQHBhcmFtIHtEb2N8TWFwPG51bWJlcixudW1iZXI+fSBkb2NcbiAqIEBwYXJhbSB7RFNFbmNvZGVyVjEgfCBEU0VuY29kZXJWMn0gW2VuY29kZXJdXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZW5jb2RlU3RhdGVWZWN0b3JWMiA9IChkb2MsIGVuY29kZXIgPSBuZXcgRFNFbmNvZGVyVjIoKSkgPT4ge1xuICBpZiAoZG9jIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgd3JpdGVTdGF0ZVZlY3RvcihlbmNvZGVyLCBkb2MpXG4gIH0gZWxzZSB7XG4gICAgd3JpdGVEb2N1bWVudFN0YXRlVmVjdG9yKGVuY29kZXIsIGRvYylcbiAgfVxuICByZXR1cm4gZW5jb2Rlci50b1VpbnQ4QXJyYXkoKVxufVxuXG4vKipcbiAqIEVuY29kZSBTdGF0ZSBhcyBVaW50OEFycmF5LlxuICpcbiAqIEBwYXJhbSB7RG9jfE1hcDxudW1iZXIsbnVtYmVyPn0gZG9jXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZW5jb2RlU3RhdGVWZWN0b3IgPSBkb2MgPT4gZW5jb2RlU3RhdGVWZWN0b3JWMihkb2MsIG5ldyBEU0VuY29kZXJWMSgpKVxuIiwgImltcG9ydCAqIGFzIGYgZnJvbSAnbGliMC9mdW5jdGlvbidcblxuLyoqXG4gKiBHZW5lcmFsIGV2ZW50IGhhbmRsZXIgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQHRlbXBsYXRlIEFSRzAsIEFSRzFcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRIYW5kbGVyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxmdW5jdGlvbihBUkcwLCBBUkcxKTp2b2lkPn1cbiAgICAgKi9cbiAgICB0aGlzLmwgPSBbXVxuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEFSRzAsQVJHMVxuICogQHJldHVybnMge0V2ZW50SGFuZGxlcjxBUkcwLEFSRzE+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUV2ZW50SGFuZGxlciA9ICgpID0+IG5ldyBFdmVudEhhbmRsZXIoKVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdGhhdCBpcyBjYWxsZWQgd2hlblxuICoge0BsaW5rIEV2ZW50SGFuZGxlciNjYWxsRXZlbnRMaXN0ZW5lcnN9IGlzIGNhbGxlZC5cbiAqXG4gKiBAdGVtcGxhdGUgQVJHMCxBUkcxXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxBUkcwLEFSRzE+fSBldmVudEhhbmRsZXJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oQVJHMCxBUkcxKTp2b2lkfSBmIFRoZSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGFkZEV2ZW50SGFuZGxlckxpc3RlbmVyID0gKGV2ZW50SGFuZGxlciwgZikgPT5cbiAgZXZlbnRIYW5kbGVyLmwucHVzaChmKVxuXG4vKipcbiAqIFJlbW92ZXMgYW4gZXZlbnQgbGlzdGVuZXIuXG4gKlxuICogQHRlbXBsYXRlIEFSRzAsQVJHMVxuICogQHBhcmFtIHtFdmVudEhhbmRsZXI8QVJHMCxBUkcxPn0gZXZlbnRIYW5kbGVyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEFSRzAsQVJHMSk6dm9pZH0gZiBUaGUgZXZlbnQgaGFuZGxlciB0aGF0IHdhcyBhZGRlZCB3aXRoXG4gKiAgICAgICAgICAgICAgICAgICAgIHtAbGluayBFdmVudEhhbmRsZXIjYWRkRXZlbnRMaXN0ZW5lcn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVFdmVudEhhbmRsZXJMaXN0ZW5lciA9IChldmVudEhhbmRsZXIsIGYpID0+IHtcbiAgY29uc3QgbCA9IGV2ZW50SGFuZGxlci5sXG4gIGNvbnN0IGxlbiA9IGwubGVuZ3RoXG4gIGV2ZW50SGFuZGxlci5sID0gbC5maWx0ZXIoZyA9PiBmICE9PSBnKVxuICBpZiAobGVuID09PSBldmVudEhhbmRsZXIubC5sZW5ndGgpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbeWpzXSBUcmllZCB0byByZW1vdmUgZXZlbnQgaGFuZGxlciB0aGF0IGRvZXNuXFwndCBleGlzdC4nKVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgZXZlbnQgbGlzdGVuZXJzLlxuICogQHRlbXBsYXRlIEFSRzAsQVJHMVxuICogQHBhcmFtIHtFdmVudEhhbmRsZXI8QVJHMCxBUkcxPn0gZXZlbnRIYW5kbGVyXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVtb3ZlQWxsRXZlbnRIYW5kbGVyTGlzdGVuZXJzID0gZXZlbnRIYW5kbGVyID0+IHtcbiAgZXZlbnRIYW5kbGVyLmwubGVuZ3RoID0gMFxufVxuXG4vKipcbiAqIENhbGwgYWxsIGV2ZW50IGxpc3RlbmVycyB0aGF0IHdlcmUgYWRkZWQgdmlhXG4gKiB7QGxpbmsgRXZlbnRIYW5kbGVyI2FkZEV2ZW50TGlzdGVuZXJ9LlxuICpcbiAqIEB0ZW1wbGF0ZSBBUkcwLEFSRzFcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPEFSRzAsQVJHMT59IGV2ZW50SGFuZGxlclxuICogQHBhcmFtIHtBUkcwfSBhcmcwXG4gKiBAcGFyYW0ge0FSRzF9IGFyZzFcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjYWxsRXZlbnRIYW5kbGVyTGlzdGVuZXJzID0gKGV2ZW50SGFuZGxlciwgYXJnMCwgYXJnMSkgPT5cbiAgZi5jYWxsQWxsKGV2ZW50SGFuZGxlci5sLCBbYXJnMCwgYXJnMV0pXG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RUeXBlIH0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcblxuZXhwb3J0IGNsYXNzIElEIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjbGllbnQgY2xpZW50IGlkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjbG9jayB1bmlxdWUgcGVyIGNsaWVudCBpZCwgY29udGludW91cyBudW1iZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yIChjbGllbnQsIGNsb2NrKSB7XG4gICAgLyoqXG4gICAgICogQ2xpZW50IGlkXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLmNsaWVudCA9IGNsaWVudFxuICAgIC8qKlxuICAgICAqIHVuaXF1ZSBwZXIgY2xpZW50IGlkLCBjb250aW51b3VzIG51bWJlclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5jbG9jayA9IGNsb2NrXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0lEIHwgbnVsbH0gYVxuICogQHBhcmFtIHtJRCB8IG51bGx9IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjb21wYXJlSURzID0gKGEsIGIpID0+IGEgPT09IGIgfHwgKGEgIT09IG51bGwgJiYgYiAhPT0gbnVsbCAmJiBhLmNsaWVudCA9PT0gYi5jbGllbnQgJiYgYS5jbG9jayA9PT0gYi5jbG9jaylcblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gY2xpZW50XG4gKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVJRCA9IChjbGllbnQsIGNsb2NrKSA9PiBuZXcgSUQoY2xpZW50LCBjbG9jaylcblxuLyoqXG4gKiBAcGFyYW0ge2VuY29kaW5nLkVuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7SUR9IGlkXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVJRCA9IChlbmNvZGVyLCBpZCkgPT4ge1xuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgaWQuY2xpZW50KVxuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgaWQuY2xvY2spXG59XG5cbi8qKlxuICogUmVhZCBJRC5cbiAqICogSWYgZmlyc3QgdmFyVWludCByZWFkIGlzIDB4RkZGRkZGIGEgUm9vdElEIGlzIHJldHVybmVkLlxuICogKiBPdGhlcndpc2UgYW4gSUQgaXMgcmV0dXJuZWRcbiAqXG4gKiBAcGFyYW0ge2RlY29kaW5nLkRlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge0lEfVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRJRCA9IGRlY29kZXIgPT5cbiAgY3JlYXRlSUQoZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlciksIGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpKVxuXG4vKipcbiAqIFRoZSB0b3AgdHlwZXMgYXJlIG1hcHBlZCBmcm9tIHkuc2hhcmUuZ2V0KGtleW5hbWUpID0+IHR5cGUuXG4gKiBgdHlwZWAgZG9lcyBub3Qgc3RvcmUgYW55IGluZm9ybWF0aW9uIGFib3V0IHRoZSBga2V5bmFtZWAuXG4gKiBUaGlzIGZ1bmN0aW9uIGZpbmRzIHRoZSBjb3JyZWN0IGBrZXluYW1lYCBmb3IgYHR5cGVgIGFuZCB0aHJvd3Mgb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBmaW5kUm9vdFR5cGVLZXkgPSB0eXBlID0+IHtcbiAgLy8gQHRzLWlnbm9yZSBfeSBtdXN0IGJlIGRlZmluZWQsIG90aGVyd2lzZSB1bmV4cGVjdGVkIGNhc2VcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdHlwZS5kb2Muc2hhcmUuZW50cmllcygpKSB7XG4gICAgaWYgKHZhbHVlID09PSB0eXBlKSB7XG4gICAgICByZXR1cm4ga2V5XG4gICAgfVxuICB9XG4gIHRocm93IGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbn1cbiIsICJpbXBvcnQge1xuICBpc0RlbGV0ZWQsXG4gIGNyZWF0ZURlbGV0ZVNldEZyb21TdHJ1Y3RTdG9yZSxcbiAgZ2V0U3RhdGVWZWN0b3IsXG4gIGdldEl0ZW1DbGVhblN0YXJ0LFxuICBpdGVyYXRlRGVsZXRlZFN0cnVjdHMsXG4gIHdyaXRlRGVsZXRlU2V0LFxuICB3cml0ZVN0YXRlVmVjdG9yLFxuICByZWFkRGVsZXRlU2V0LFxuICByZWFkU3RhdGVWZWN0b3IsXG4gIGNyZWF0ZURlbGV0ZVNldCxcbiAgY3JlYXRlSUQsXG4gIGdldFN0YXRlLFxuICBmaW5kSW5kZXhTUyxcbiAgVXBkYXRlRW5jb2RlclYyLFxuICBhcHBseVVwZGF0ZVYyLFxuICBMYXp5U3RydWN0UmVhZGVyLFxuICBlcXVhbERlbGV0ZVNldHMsXG4gIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBEU0VuY29kZXJWMSwgRFNFbmNvZGVyVjIsIERTRGVjb2RlclYxLCBEU0RlY29kZXJWMiwgVHJhbnNhY3Rpb24sIERvYywgRGVsZXRlU2V0LCBJdGVtLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gIG1lcmdlRGVsZXRlU2V0c1xufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIG1hcCBmcm9tICdsaWIwL21hcCdcbmltcG9ydCAqIGFzIHNldCBmcm9tICdsaWIwL3NldCdcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuXG5leHBvcnQgY2xhc3MgU25hcHNob3Qge1xuICAvKipcbiAgICogQHBhcmFtIHtEZWxldGVTZXR9IGRzXG4gICAqIEBwYXJhbSB7TWFwPG51bWJlcixudW1iZXI+fSBzdiBzdGF0ZSBtYXBcbiAgICovXG4gIGNvbnN0cnVjdG9yIChkcywgc3YpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RGVsZXRlU2V0fVxuICAgICAqL1xuICAgIHRoaXMuZHMgPSBkc1xuICAgIC8qKlxuICAgICAqIFN0YXRlIE1hcFxuICAgICAqIEB0eXBlIHtNYXA8bnVtYmVyLG51bWJlcj59XG4gICAgICovXG4gICAgdGhpcy5zdiA9IHN2XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwMVxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcDJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbFNuYXBzaG90cyA9IChzbmFwMSwgc25hcDIpID0+IHtcbiAgY29uc3QgZHMxID0gc25hcDEuZHMuY2xpZW50c1xuICBjb25zdCBkczIgPSBzbmFwMi5kcy5jbGllbnRzXG4gIGNvbnN0IHN2MSA9IHNuYXAxLnN2XG4gIGNvbnN0IHN2MiA9IHNuYXAyLnN2XG4gIGlmIChzdjEuc2l6ZSAhPT0gc3YyLnNpemUgfHwgZHMxLnNpemUgIT09IGRzMi5zaXplKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2Ygc3YxLmVudHJpZXMoKSkge1xuICAgIGlmIChzdjIuZ2V0KGtleSkgIT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBbY2xpZW50LCBkc2l0ZW1zMV0gb2YgZHMxLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IGRzaXRlbXMyID0gZHMyLmdldChjbGllbnQpIHx8IFtdXG4gICAgaWYgKGRzaXRlbXMxLmxlbmd0aCAhPT0gZHNpdGVtczIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc2l0ZW1zMS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZHNpdGVtMSA9IGRzaXRlbXMxW2ldXG4gICAgICBjb25zdCBkc2l0ZW0yID0gZHNpdGVtczJbaV1cbiAgICAgIGlmIChkc2l0ZW0xLmNsb2NrICE9PSBkc2l0ZW0yLmNsb2NrIHx8IGRzaXRlbTEubGVuICE9PSBkc2l0ZW0yLmxlbikge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwc2hvdFxuICogQHBhcmFtIHtEU0VuY29kZXJWMSB8IERTRW5jb2RlclYyfSBbZW5jb2Rlcl1cbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTbmFwc2hvdFYyID0gKHNuYXBzaG90LCBlbmNvZGVyID0gbmV3IERTRW5jb2RlclYyKCkpID0+IHtcbiAgd3JpdGVEZWxldGVTZXQoZW5jb2Rlciwgc25hcHNob3QuZHMpXG4gIHdyaXRlU3RhdGVWZWN0b3IoZW5jb2Rlciwgc25hcHNob3Quc3YpXG4gIHJldHVybiBlbmNvZGVyLnRvVWludDhBcnJheSgpXG59XG5cbi8qKlxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTbmFwc2hvdCA9IHNuYXBzaG90ID0+IGVuY29kZVNuYXBzaG90VjIoc25hcHNob3QsIG5ldyBEU0VuY29kZXJWMSgpKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcGFyYW0ge0RTRGVjb2RlclYxIHwgRFNEZWNvZGVyVjJ9IFtkZWNvZGVyXVxuICogQHJldHVybiB7U25hcHNob3R9XG4gKi9cbmV4cG9ydCBjb25zdCBkZWNvZGVTbmFwc2hvdFYyID0gKGJ1ZiwgZGVjb2RlciA9IG5ldyBEU0RlY29kZXJWMihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZikpKSA9PiB7XG4gIHJldHVybiBuZXcgU25hcHNob3QocmVhZERlbGV0ZVNldChkZWNvZGVyKSwgcmVhZFN0YXRlVmVjdG9yKGRlY29kZXIpKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHtTbmFwc2hvdH1cbiAqL1xuZXhwb3J0IGNvbnN0IGRlY29kZVNuYXBzaG90ID0gYnVmID0+IGRlY29kZVNuYXBzaG90VjIoYnVmLCBuZXcgRFNEZWNvZGVyVjEoZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihidWYpKSlcblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqIEBwYXJhbSB7TWFwPG51bWJlcixudW1iZXI+fSBzbVxuICogQHJldHVybiB7U25hcHNob3R9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVTbmFwc2hvdCA9IChkcywgc20pID0+IG5ldyBTbmFwc2hvdChkcywgc20pXG5cbmV4cG9ydCBjb25zdCBlbXB0eVNuYXBzaG90ID0gY3JlYXRlU25hcHNob3QoY3JlYXRlRGVsZXRlU2V0KCksIG5ldyBNYXAoKSlcblxuLyoqXG4gKiBAcGFyYW0ge0RvY30gZG9jXG4gKiBAcmV0dXJuIHtTbmFwc2hvdH1cbiAqL1xuZXhwb3J0IGNvbnN0IHNuYXBzaG90ID0gZG9jID0+IGNyZWF0ZVNuYXBzaG90KGNyZWF0ZURlbGV0ZVNldEZyb21TdHJ1Y3RTdG9yZShkb2Muc3RvcmUpLCBnZXRTdGF0ZVZlY3Rvcihkb2Muc3RvcmUpKVxuXG4vKipcbiAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICogQHBhcmFtIHtTbmFwc2hvdHx1bmRlZmluZWR9IHNuYXBzaG90XG4gKlxuICogQHByb3RlY3RlZFxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBpc1Zpc2libGUgPSAoaXRlbSwgc25hcHNob3QpID0+IHNuYXBzaG90ID09PSB1bmRlZmluZWRcbiAgPyAhaXRlbS5kZWxldGVkXG4gIDogc25hcHNob3Quc3YuaGFzKGl0ZW0uaWQuY2xpZW50KSAmJiAoc25hcHNob3Quc3YuZ2V0KGl0ZW0uaWQuY2xpZW50KSB8fCAwKSA+IGl0ZW0uaWQuY2xvY2sgJiYgIWlzRGVsZXRlZChzbmFwc2hvdC5kcywgaXRlbS5pZClcblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqL1xuZXhwb3J0IGNvbnN0IHNwbGl0U25hcHNob3RBZmZlY3RlZFN0cnVjdHMgPSAodHJhbnNhY3Rpb24sIHNuYXBzaG90KSA9PiB7XG4gIGNvbnN0IG1ldGEgPSBtYXAuc2V0SWZVbmRlZmluZWQodHJhbnNhY3Rpb24ubWV0YSwgc3BsaXRTbmFwc2hvdEFmZmVjdGVkU3RydWN0cywgc2V0LmNyZWF0ZSlcbiAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5kb2Muc3RvcmVcbiAgLy8gY2hlY2sgaWYgd2UgYWxyZWFkeSBzcGxpdCBmb3IgdGhpcyBzbmFwc2hvdFxuICBpZiAoIW1ldGEuaGFzKHNuYXBzaG90KSkge1xuICAgIHNuYXBzaG90LnN2LmZvckVhY2goKGNsb2NrLCBjbGllbnQpID0+IHtcbiAgICAgIGlmIChjbG9jayA8IGdldFN0YXRlKHN0b3JlLCBjbGllbnQpKSB7XG4gICAgICAgIGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBjcmVhdGVJRChjbGllbnQsIGNsb2NrKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIGl0ZXJhdGVEZWxldGVkU3RydWN0cyh0cmFuc2FjdGlvbiwgc25hcHNob3QuZHMsIF9pdGVtID0+IHt9KVxuICAgIG1ldGEuYWRkKHNuYXBzaG90KVxuICB9XG59XG5cbi8qKlxuICogQGV4YW1wbGVcbiAqICBjb25zdCB5ZG9jID0gbmV3IFkuRG9jKHsgZ2M6IGZhbHNlIH0pXG4gKiAgeWRvYy5nZXRUZXh0KCkuaW5zZXJ0KDAsICd3b3JsZCEnKVxuICogIGNvbnN0IHNuYXBzaG90ID0gWS5zbmFwc2hvdCh5ZG9jKVxuICogIHlkb2MuZ2V0VGV4dCgpLmluc2VydCgwLCAnaGVsbG8gJylcbiAqICBjb25zdCByZXN0b3JlZCA9IFkuY3JlYXRlRG9jRnJvbVNuYXBzaG90KHlkb2MsIHNuYXBzaG90KVxuICogIGFzc2VydChyZXN0b3JlZC5nZXRUZXh0KCkudG9TdHJpbmcoKSA9PT0gJ3dvcmxkIScpXG4gKlxuICogQHBhcmFtIHtEb2N9IG9yaWdpbkRvY1xuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqIEBwYXJhbSB7RG9jfSBbbmV3RG9jXSBPcHRpb25hbGx5LCB5b3UgbWF5IGRlZmluZSB0aGUgWWpzIGRvY3VtZW50IHRoYXQgcmVjZWl2ZXMgdGhlIGRhdGEgZnJvbSBvcmlnaW5Eb2NcbiAqIEByZXR1cm4ge0RvY31cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURvY0Zyb21TbmFwc2hvdCA9IChvcmlnaW5Eb2MsIHNuYXBzaG90LCBuZXdEb2MgPSBuZXcgRG9jKCkpID0+IHtcbiAgaWYgKG9yaWdpbkRvYy5nYykge1xuICAgIC8vIHdlIHNob3VsZCBub3QgdHJ5IHRvIHJlc3RvcmUgYSBHQy1lZCBkb2N1bWVudCwgYmVjYXVzZSBzb21lIG9mIHRoZSByZXN0b3JlZCBpdGVtcyBtaWdodCBoYXZlIHRoZWlyIGNvbnRlbnQgZGVsZXRlZFxuICAgIHRocm93IG5ldyBFcnJvcignR2FyYmFnZS1jb2xsZWN0aW9uIG11c3QgYmUgZGlzYWJsZWQgaW4gYG9yaWdpbkRvY2AhJylcbiAgfVxuICBjb25zdCB7IHN2LCBkcyB9ID0gc25hcHNob3RcblxuICBjb25zdCBlbmNvZGVyID0gbmV3IFVwZGF0ZUVuY29kZXJWMigpXG4gIG9yaWdpbkRvYy50cmFuc2FjdCh0cmFuc2FjdGlvbiA9PiB7XG4gICAgbGV0IHNpemUgPSAwXG4gICAgc3YuZm9yRWFjaChjbG9jayA9PiB7XG4gICAgICBpZiAoY2xvY2sgPiAwKSB7XG4gICAgICAgIHNpemUrK1xuICAgICAgfVxuICAgIH0pXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIHNpemUpXG4gICAgLy8gc3BsaXR0aW5nIHRoZSBzdHJ1Y3RzIGJlZm9yZSB3cml0aW5nIHRoZW0gdG8gdGhlIGVuY29kZXJcbiAgICBmb3IgKGNvbnN0IFtjbGllbnQsIGNsb2NrXSBvZiBzdikge1xuICAgICAgaWYgKGNsb2NrID09PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBpZiAoY2xvY2sgPCBnZXRTdGF0ZShvcmlnaW5Eb2Muc3RvcmUsIGNsaWVudCkpIHtcbiAgICAgICAgZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGNyZWF0ZUlEKGNsaWVudCwgY2xvY2spKVxuICAgICAgfVxuICAgICAgY29uc3Qgc3RydWN0cyA9IG9yaWdpbkRvYy5zdG9yZS5jbGllbnRzLmdldChjbGllbnQpIHx8IFtdXG4gICAgICBjb25zdCBsYXN0U3RydWN0SW5kZXggPSBmaW5kSW5kZXhTUyhzdHJ1Y3RzLCBjbG9jayAtIDEpXG4gICAgICAvLyB3cml0ZSAjIGVuY29kZWQgc3RydWN0c1xuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGxhc3RTdHJ1Y3RJbmRleCArIDEpXG4gICAgICBlbmNvZGVyLndyaXRlQ2xpZW50KGNsaWVudClcbiAgICAgIC8vIGZpcnN0IGNsb2NrIHdyaXR0ZW4gaXMgMFxuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIDApXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBsYXN0U3RydWN0SW5kZXg7IGkrKykge1xuICAgICAgICBzdHJ1Y3RzW2ldLndyaXRlKGVuY29kZXIsIDApXG4gICAgICB9XG4gICAgfVxuICAgIHdyaXRlRGVsZXRlU2V0KGVuY29kZXIsIGRzKVxuICB9KVxuXG4gIGFwcGx5VXBkYXRlVjIobmV3RG9jLCBlbmNvZGVyLnRvVWludDhBcnJheSgpLCAnc25hcHNob3QnKVxuICByZXR1cm4gbmV3RG9jXG59XG5cbi8qKlxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge3R5cGVvZiBVcGRhdGVEZWNvZGVyVjIgfCB0eXBlb2YgVXBkYXRlRGVjb2RlclYxfSBbWURlY29kZXJdXG4gKi9cbmV4cG9ydCBjb25zdCBzbmFwc2hvdENvbnRhaW5zVXBkYXRlVjIgPSAoc25hcHNob3QsIHVwZGF0ZSwgWURlY29kZXIgPSBVcGRhdGVEZWNvZGVyVjIpID0+IHtcbiAgY29uc3Qgc3RydWN0cyA9IFtdXG4gIGNvbnN0IHVwZGF0ZURlY29kZXIgPSBuZXcgWURlY29kZXIoZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpKVxuICBjb25zdCBsYXp5RGVjb2RlciA9IG5ldyBMYXp5U3RydWN0UmVhZGVyKHVwZGF0ZURlY29kZXIsIGZhbHNlKVxuICBmb3IgKGxldCBjdXJyID0gbGF6eURlY29kZXIuY3VycjsgY3VyciAhPT0gbnVsbDsgY3VyciA9IGxhenlEZWNvZGVyLm5leHQoKSkge1xuICAgIHN0cnVjdHMucHVzaChjdXJyKVxuICAgIGlmICgoc25hcHNob3Quc3YuZ2V0KGN1cnIuaWQuY2xpZW50KSB8fCAwKSA8IGN1cnIuaWQuY2xvY2sgKyBjdXJyLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIGNvbnN0IG1lcmdlZERTID0gbWVyZ2VEZWxldGVTZXRzKFtzbmFwc2hvdC5kcywgcmVhZERlbGV0ZVNldCh1cGRhdGVEZWNvZGVyKV0pXG4gIHJldHVybiBlcXVhbERlbGV0ZVNldHMoc25hcHNob3QuZHMsIG1lcmdlZERTKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7U25hcHNob3R9IHNuYXBzaG90XG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICovXG5leHBvcnQgY29uc3Qgc25hcHNob3RDb250YWluc1VwZGF0ZSA9IChzbmFwc2hvdCwgdXBkYXRlKSA9PiBzbmFwc2hvdENvbnRhaW5zVXBkYXRlVjIoc25hcHNob3QsIHVwZGF0ZSwgVXBkYXRlRGVjb2RlclYxKVxuIiwgImltcG9ydCB7XG4gIEdDLFxuICBzcGxpdEl0ZW0sXG4gIFRyYW5zYWN0aW9uLCBJRCwgSXRlbSwgRFNEZWNvZGVyVjIgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnbGliMC9tYXRoJ1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcblxuZXhwb3J0IGNsYXNzIFN0cnVjdFN0b3JlIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNYXA8bnVtYmVyLEFycmF5PEdDfEl0ZW0+Pn1cbiAgICAgKi9cbiAgICB0aGlzLmNsaWVudHMgPSBuZXcgTWFwKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVsbCB8IHsgbWlzc2luZzogTWFwPG51bWJlciwgbnVtYmVyPiwgdXBkYXRlOiBVaW50OEFycmF5IH19XG4gICAgICovXG4gICAgdGhpcy5wZW5kaW5nU3RydWN0cyA9IG51bGxcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVsbCB8IFVpbnQ4QXJyYXl9XG4gICAgICovXG4gICAgdGhpcy5wZW5kaW5nRHMgPSBudWxsXG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHN0YXRlcyBhcyBhIE1hcDxjbGllbnQsY2xvY2s+LlxuICogTm90ZSB0aGF0IGNsb2NrIHJlZmVycyB0byB0aGUgbmV4dCBleHBlY3RlZCBjbG9jayBpZC5cbiAqXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICogQHJldHVybiB7TWFwPG51bWJlcixudW1iZXI+fVxuICpcbiAqIEBwdWJsaWNcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZ2V0U3RhdGVWZWN0b3IgPSBzdG9yZSA9PiB7XG4gIGNvbnN0IHNtID0gbmV3IE1hcCgpXG4gIHN0b3JlLmNsaWVudHMuZm9yRWFjaCgoc3RydWN0cywgY2xpZW50KSA9PiB7XG4gICAgY29uc3Qgc3RydWN0ID0gc3RydWN0c1tzdHJ1Y3RzLmxlbmd0aCAtIDFdXG4gICAgc20uc2V0KGNsaWVudCwgc3RydWN0LmlkLmNsb2NrICsgc3RydWN0Lmxlbmd0aClcbiAgfSlcbiAgcmV0dXJuIHNtXG59XG5cbi8qKlxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbGllbnRcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqXG4gKiBAcHVibGljXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGdldFN0YXRlID0gKHN0b3JlLCBjbGllbnQpID0+IHtcbiAgY29uc3Qgc3RydWN0cyA9IHN0b3JlLmNsaWVudHMuZ2V0KGNsaWVudClcbiAgaWYgKHN0cnVjdHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgY29uc3QgbGFzdFN0cnVjdCA9IHN0cnVjdHNbc3RydWN0cy5sZW5ndGggLSAxXVxuICByZXR1cm4gbGFzdFN0cnVjdC5pZC5jbG9jayArIGxhc3RTdHJ1Y3QubGVuZ3RoXG59XG5cbi8qKlxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBpbnRlZ3JldHlDaGVjayA9IHN0b3JlID0+IHtcbiAgc3RvcmUuY2xpZW50cy5mb3JFYWNoKHN0cnVjdHMgPT4ge1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgc3RydWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbCA9IHN0cnVjdHNbaSAtIDFdXG4gICAgICBjb25zdCByID0gc3RydWN0c1tpXVxuICAgICAgaWYgKGwuaWQuY2xvY2sgKyBsLmxlbmd0aCAhPT0gci5pZC5jbG9jaykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0cnVjdFN0b3JlIGZhaWxlZCBpbnRlZ3JldHkgY2hlY2snKVxuICAgICAgfVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICogQHBhcmFtIHtHQ3xJdGVtfSBzdHJ1Y3RcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBhZGRTdHJ1Y3QgPSAoc3RvcmUsIHN0cnVjdCkgPT4ge1xuICBsZXQgc3RydWN0cyA9IHN0b3JlLmNsaWVudHMuZ2V0KHN0cnVjdC5pZC5jbGllbnQpXG4gIGlmIChzdHJ1Y3RzID09PSB1bmRlZmluZWQpIHtcbiAgICBzdHJ1Y3RzID0gW11cbiAgICBzdG9yZS5jbGllbnRzLnNldChzdHJ1Y3QuaWQuY2xpZW50LCBzdHJ1Y3RzKVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGxhc3RTdHJ1Y3QgPSBzdHJ1Y3RzW3N0cnVjdHMubGVuZ3RoIC0gMV1cbiAgICBpZiAobGFzdFN0cnVjdC5pZC5jbG9jayArIGxhc3RTdHJ1Y3QubGVuZ3RoICE9PSBzdHJ1Y3QuaWQuY2xvY2spIHtcbiAgICAgIHRocm93IGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbiAgICB9XG4gIH1cbiAgc3RydWN0cy5wdXNoKHN0cnVjdClcbn1cblxuLyoqXG4gKiBQZXJmb3JtIGEgYmluYXJ5IHNlYXJjaCBvbiBhIHNvcnRlZCBhcnJheVxuICogQHBhcmFtIHtBcnJheTxJdGVtfEdDPn0gc3RydWN0c1xuICogQHBhcmFtIHtudW1iZXJ9IGNsb2NrXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZmluZEluZGV4U1MgPSAoc3RydWN0cywgY2xvY2spID0+IHtcbiAgbGV0IGxlZnQgPSAwXG4gIGxldCByaWdodCA9IHN0cnVjdHMubGVuZ3RoIC0gMVxuICBsZXQgbWlkID0gc3RydWN0c1tyaWdodF1cbiAgbGV0IG1pZGNsb2NrID0gbWlkLmlkLmNsb2NrXG4gIGlmIChtaWRjbG9jayA9PT0gY2xvY2spIHtcbiAgICByZXR1cm4gcmlnaHRcbiAgfVxuICAvLyBAdG9kbyBkb2VzIGl0IGV2ZW4gbWFrZSBzZW5zZSB0byBwaXZvdCB0aGUgc2VhcmNoP1xuICAvLyBJZiBhIGdvb2Qgc3BsaXQgbWlzc2VzLCBpdCBtaWdodCBhY3R1YWxseSBpbmNyZWFzZSB0aGUgdGltZSB0byBmaW5kIHRoZSBjb3JyZWN0IGl0ZW0uXG4gIC8vIEN1cnJlbnRseSwgdGhlIG9ubHkgYWR2YW50YWdlIGlzIHRoYXQgc2VhcmNoIHdpdGggcGl2b3RpbmcgbWlnaHQgZmluZCB0aGUgaXRlbSBvbiB0aGUgZmlyc3QgdHJ5LlxuICBsZXQgbWlkaW5kZXggPSBtYXRoLmZsb29yKChjbG9jayAvIChtaWRjbG9jayArIG1pZC5sZW5ndGggLSAxKSkgKiByaWdodCkgLy8gcGl2b3RpbmcgdGhlIHNlYXJjaFxuICB3aGlsZSAobGVmdCA8PSByaWdodCkge1xuICAgIG1pZCA9IHN0cnVjdHNbbWlkaW5kZXhdXG4gICAgbWlkY2xvY2sgPSBtaWQuaWQuY2xvY2tcbiAgICBpZiAobWlkY2xvY2sgPD0gY2xvY2spIHtcbiAgICAgIGlmIChjbG9jayA8IG1pZGNsb2NrICsgbWlkLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbWlkaW5kZXhcbiAgICAgIH1cbiAgICAgIGxlZnQgPSBtaWRpbmRleCArIDFcbiAgICB9IGVsc2Uge1xuICAgICAgcmlnaHQgPSBtaWRpbmRleCAtIDFcbiAgICB9XG4gICAgbWlkaW5kZXggPSBtYXRoLmZsb29yKChsZWZ0ICsgcmlnaHQpIC8gMilcbiAgfVxuICAvLyBBbHdheXMgY2hlY2sgc3RhdGUgYmVmb3JlIGxvb2tpbmcgZm9yIGEgc3RydWN0IGluIFN0cnVjdFN0b3JlXG4gIC8vIFRoZXJlZm9yZSB0aGUgY2FzZSBvZiBub3QgZmluZGluZyBhIHN0cnVjdCBpcyB1bmV4cGVjdGVkXG4gIHRocm93IGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbn1cblxuLyoqXG4gKiBFeHBlY3RzIHRoYXQgaWQgaXMgYWN0dWFsbHkgaW4gc3RvcmUuIFRoaXMgZnVuY3Rpb24gdGhyb3dzIG9yIGlzIGFuIGluZmluaXRlIGxvb3Agb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge0lEfSBpZFxuICogQHJldHVybiB7R0N8SXRlbX1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBmaW5kID0gKHN0b3JlLCBpZCkgPT4ge1xuICAvKipcbiAgICogQHR5cGUge0FycmF5PEdDfEl0ZW0+fVxuICAgKi9cbiAgLy8gQHRzLWlnbm9yZVxuICBjb25zdCBzdHJ1Y3RzID0gc3RvcmUuY2xpZW50cy5nZXQoaWQuY2xpZW50KVxuICByZXR1cm4gc3RydWN0c1tmaW5kSW5kZXhTUyhzdHJ1Y3RzLCBpZC5jbG9jayldXG59XG5cbi8qKlxuICogRXhwZWN0cyB0aGF0IGlkIGlzIGFjdHVhbGx5IGluIHN0b3JlLiBUaGlzIGZ1bmN0aW9uIHRocm93cyBvciBpcyBhbiBpbmZpbml0ZSBsb29wIG90aGVyd2lzZS5cbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGdldEl0ZW0gPSAvKiogQHR5cGUge2Z1bmN0aW9uKFN0cnVjdFN0b3JlLElEKTpJdGVtfSAqLyAoZmluZClcblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBcnJheTxJdGVtfEdDPn0gc3RydWN0c1xuICogQHBhcmFtIHtudW1iZXJ9IGNsb2NrXG4gKi9cbmV4cG9ydCBjb25zdCBmaW5kSW5kZXhDbGVhblN0YXJ0ID0gKHRyYW5zYWN0aW9uLCBzdHJ1Y3RzLCBjbG9jaykgPT4ge1xuICBjb25zdCBpbmRleCA9IGZpbmRJbmRleFNTKHN0cnVjdHMsIGNsb2NrKVxuICBjb25zdCBzdHJ1Y3QgPSBzdHJ1Y3RzW2luZGV4XVxuICBpZiAoc3RydWN0LmlkLmNsb2NrIDwgY2xvY2sgJiYgc3RydWN0IGluc3RhbmNlb2YgSXRlbSkge1xuICAgIHN0cnVjdHMuc3BsaWNlKGluZGV4ICsgMSwgMCwgc3BsaXRJdGVtKHRyYW5zYWN0aW9uLCBzdHJ1Y3QsIGNsb2NrIC0gc3RydWN0LmlkLmNsb2NrKSlcbiAgICByZXR1cm4gaW5kZXggKyAxXG4gIH1cbiAgcmV0dXJuIGluZGV4XG59XG5cbi8qKlxuICogRXhwZWN0cyB0aGF0IGlkIGlzIGFjdHVhbGx5IGluIHN0b3JlLiBUaGlzIGZ1bmN0aW9uIHRocm93cyBvciBpcyBhbiBpbmZpbml0ZSBsb29wIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtJRH0gaWRcbiAqIEByZXR1cm4ge0l0ZW19XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZ2V0SXRlbUNsZWFuU3RhcnQgPSAodHJhbnNhY3Rpb24sIGlkKSA9PiB7XG4gIGNvbnN0IHN0cnVjdHMgPSAvKiogQHR5cGUge0FycmF5PEl0ZW0+fSAqLyAodHJhbnNhY3Rpb24uZG9jLnN0b3JlLmNsaWVudHMuZ2V0KGlkLmNsaWVudCkpXG4gIHJldHVybiBzdHJ1Y3RzW2ZpbmRJbmRleENsZWFuU3RhcnQodHJhbnNhY3Rpb24sIHN0cnVjdHMsIGlkLmNsb2NrKV1cbn1cblxuLyoqXG4gKiBFeHBlY3RzIHRoYXQgaWQgaXMgYWN0dWFsbHkgaW4gc3RvcmUuIFRoaXMgZnVuY3Rpb24gdGhyb3dzIG9yIGlzIGFuIGluZmluaXRlIGxvb3Agb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICogQHBhcmFtIHtJRH0gaWRcbiAqIEByZXR1cm4ge0l0ZW19XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZ2V0SXRlbUNsZWFuRW5kID0gKHRyYW5zYWN0aW9uLCBzdG9yZSwgaWQpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxJdGVtPn1cbiAgICovXG4gIC8vIEB0cy1pZ25vcmVcbiAgY29uc3Qgc3RydWN0cyA9IHN0b3JlLmNsaWVudHMuZ2V0KGlkLmNsaWVudClcbiAgY29uc3QgaW5kZXggPSBmaW5kSW5kZXhTUyhzdHJ1Y3RzLCBpZC5jbG9jaylcbiAgY29uc3Qgc3RydWN0ID0gc3RydWN0c1tpbmRleF1cbiAgaWYgKGlkLmNsb2NrICE9PSBzdHJ1Y3QuaWQuY2xvY2sgKyBzdHJ1Y3QubGVuZ3RoIC0gMSAmJiBzdHJ1Y3QuY29uc3RydWN0b3IgIT09IEdDKSB7XG4gICAgc3RydWN0cy5zcGxpY2UoaW5kZXggKyAxLCAwLCBzcGxpdEl0ZW0odHJhbnNhY3Rpb24sIHN0cnVjdCwgaWQuY2xvY2sgLSBzdHJ1Y3QuaWQuY2xvY2sgKyAxKSlcbiAgfVxuICByZXR1cm4gc3RydWN0XG59XG5cbi8qKlxuICogUmVwbGFjZSBgaXRlbWAgd2l0aCBgbmV3aXRlbWAgaW4gc3RvcmVcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge0dDfEl0ZW19IHN0cnVjdFxuICogQHBhcmFtIHtHQ3xJdGVtfSBuZXdTdHJ1Y3RcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZXBsYWNlU3RydWN0ID0gKHN0b3JlLCBzdHJ1Y3QsIG5ld1N0cnVjdCkgPT4ge1xuICBjb25zdCBzdHJ1Y3RzID0gLyoqIEB0eXBlIHtBcnJheTxHQ3xJdGVtPn0gKi8gKHN0b3JlLmNsaWVudHMuZ2V0KHN0cnVjdC5pZC5jbGllbnQpKVxuICBzdHJ1Y3RzW2ZpbmRJbmRleFNTKHN0cnVjdHMsIHN0cnVjdC5pZC5jbG9jayldID0gbmV3U3RydWN0XG59XG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIGEgcmFuZ2Ugb2Ygc3RydWN0c1xuICpcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0FycmF5PEl0ZW18R0M+fSBzdHJ1Y3RzXG4gKiBAcGFyYW0ge251bWJlcn0gY2xvY2tTdGFydCBJbmNsdXNpdmUgc3RhcnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oR0N8SXRlbSk6dm9pZH0gZlxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgaXRlcmF0ZVN0cnVjdHMgPSAodHJhbnNhY3Rpb24sIHN0cnVjdHMsIGNsb2NrU3RhcnQsIGxlbiwgZikgPT4ge1xuICBpZiAobGVuID09PSAwKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgY2xvY2tFbmQgPSBjbG9ja1N0YXJ0ICsgbGVuXG4gIGxldCBpbmRleCA9IGZpbmRJbmRleENsZWFuU3RhcnQodHJhbnNhY3Rpb24sIHN0cnVjdHMsIGNsb2NrU3RhcnQpXG4gIGxldCBzdHJ1Y3RcbiAgZG8ge1xuICAgIHN0cnVjdCA9IHN0cnVjdHNbaW5kZXgrK11cbiAgICBpZiAoY2xvY2tFbmQgPCBzdHJ1Y3QuaWQuY2xvY2sgKyBzdHJ1Y3QubGVuZ3RoKSB7XG4gICAgICBmaW5kSW5kZXhDbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBzdHJ1Y3RzLCBjbG9ja0VuZClcbiAgICB9XG4gICAgZihzdHJ1Y3QpXG4gIH0gd2hpbGUgKGluZGV4IDwgc3RydWN0cy5sZW5ndGggJiYgc3RydWN0c1tpbmRleF0uaWQuY2xvY2sgPCBjbG9ja0VuZClcbn1cbiIsICIvKipcbiAqIFdvcmtpbmcgd2l0aCB2YWx1ZSBwYWlycy5cbiAqXG4gKiBAbW9kdWxlIHBhaXJcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqL1xuZXhwb3J0IGNsYXNzIFBhaXIge1xuICAvKipcbiAgICogQHBhcmFtIHtMfSBsZWZ0XG4gICAqIEBwYXJhbSB7Un0gcmlnaHRcbiAgICovXG4gIGNvbnN0cnVjdG9yIChsZWZ0LCByaWdodCkge1xuICAgIHRoaXMubGVmdCA9IGxlZnRcbiAgICB0aGlzLnJpZ2h0ID0gcmlnaHRcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqIEBwYXJhbSB7TH0gbGVmdFxuICogQHBhcmFtIHtSfSByaWdodFxuICogQHJldHVybiB7UGFpcjxMLFI+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKGxlZnQsIHJpZ2h0KSA9PiBuZXcgUGFpcihsZWZ0LCByaWdodClcblxuLyoqXG4gKiBAdGVtcGxhdGUgTCxSXG4gKiBAcGFyYW0ge1J9IHJpZ2h0XG4gKiBAcGFyYW0ge0x9IGxlZnRcbiAqIEByZXR1cm4ge1BhaXI8TCxSPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVJldmVyc2VkID0gKHJpZ2h0LCBsZWZ0KSA9PiBuZXcgUGFpcihsZWZ0LCByaWdodClcblxuLyoqXG4gKiBAdGVtcGxhdGUgTCxSXG4gKiBAcGFyYW0ge0FycmF5PFBhaXI8TCxSPj59IGFyclxuICogQHBhcmFtIHtmdW5jdGlvbihMLCBSKTphbnl9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IGZvckVhY2ggPSAoYXJyLCBmKSA9PiBhcnIuZm9yRWFjaChwID0+IGYocC5sZWZ0LCBwLnJpZ2h0KSlcblxuLyoqXG4gKiBAdGVtcGxhdGUgTCxSLFhcbiAqIEBwYXJhbSB7QXJyYXk8UGFpcjxMLFI+Pn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEwsIFIpOlh9IGZcbiAqIEByZXR1cm4ge0FycmF5PFg+fVxuICovXG5leHBvcnQgY29uc3QgbWFwID0gKGFyciwgZikgPT4gYXJyLm1hcChwID0+IGYocC5sZWZ0LCBwLnJpZ2h0KSlcbiIsICIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyoqXG4gKiBVdGlsaXR5IG1vZHVsZSB0byB3b3JrIHdpdGggdGhlIERPTS5cbiAqXG4gKiBAbW9kdWxlIGRvbVxuICovXG5cbmltcG9ydCAqIGFzIHBhaXIgZnJvbSAnLi9wYWlyLmpzJ1xuaW1wb3J0ICogYXMgbWFwIGZyb20gJy4vbWFwLmpzJ1xuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHR5cGUge0RvY3VtZW50fVxuICovXG5leHBvcnQgY29uc3QgZG9jID0gLyoqIEB0eXBlIHtEb2N1bWVudH0gKi8gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBkb2N1bWVudCA6IHt9KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUVsZW1lbnQgPSBuYW1lID0+IGRvYy5jcmVhdGVFbGVtZW50KG5hbWUpXG5cbi8qKlxuICogQHJldHVybiB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURvY3VtZW50RnJhZ21lbnQgPSAoKSA9PiBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm4ge1RleHR9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVUZXh0Tm9kZSA9IHRleHQgPT4gZG9jLmNyZWF0ZVRleHROb2RlKHRleHQpXG5cbmV4cG9ydCBjb25zdCBkb21QYXJzZXIgPSAvKiogQHR5cGUge0RPTVBhcnNlcn0gKi8gKHR5cGVvZiBET01QYXJzZXIgIT09ICd1bmRlZmluZWQnID8gbmV3IERPTVBhcnNlcigpIDogbnVsbClcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKi9cbmV4cG9ydCBjb25zdCBlbWl0Q3VzdG9tRXZlbnQgPSAoZWwsIG5hbWUsIG9wdHMpID0+IGVsLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUsIG9wdHMpKVxuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7QXJyYXk8cGFpci5QYWlyPHN0cmluZyxzdHJpbmd8Ym9vbGVhbj4+fSBhdHRycyBBcnJheSBvZiBrZXktdmFsdWUgcGFpcnNcbiAqIEByZXR1cm4ge0VsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBzZXRBdHRyaWJ1dGVzID0gKGVsLCBhdHRycykgPT4ge1xuICBwYWlyLmZvckVhY2goYXR0cnMsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGtleSlcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSB0cnVlKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCAnJylcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgfVxuICB9KVxuICByZXR1cm4gZWxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsIHN0cmluZz59IGF0dHJzIEFycmF5IG9mIGtleS12YWx1ZSBwYWlyc1xuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IHNldEF0dHJpYnV0ZXNNYXAgPSAoZWwsIGF0dHJzKSA9PiB7XG4gIGF0dHJzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHsgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIH0pXG4gIHJldHVybiBlbFxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT58SFRNTENvbGxlY3Rpb259IGNoaWxkcmVuXG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5leHBvcnQgY29uc3QgZnJhZ21lbnQgPSBjaGlsZHJlbiA9PiB7XG4gIGNvbnN0IGZyYWdtZW50ID0gY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBhcHBlbmRDaGlsZChmcmFnbWVudCwgY2hpbGRyZW5baV0pXG4gIH1cbiAgcmV0dXJuIGZyYWdtZW50XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnRcbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgYXBwZW5kID0gKHBhcmVudCwgbm9kZXMpID0+IHtcbiAgYXBwZW5kQ2hpbGQocGFyZW50LCBmcmFnbWVudChub2RlcykpXG4gIHJldHVybiBwYXJlbnRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbFxuICovXG5leHBvcnQgY29uc3QgcmVtb3ZlID0gZWwgPT4gZWwucmVtb3ZlKClcblxuLyoqXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7RXZlbnRMaXN0ZW5lcn0gZlxuICovXG5leHBvcnQgY29uc3QgYWRkRXZlbnRMaXN0ZW5lciA9IChlbCwgbmFtZSwgZikgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmKVxuXG4vKipcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtFdmVudExpc3RlbmVyfSBmXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVFdmVudExpc3RlbmVyID0gKGVsLCBuYW1lLCBmKSA9PiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGYpXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBub2RlXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsRXZlbnRMaXN0ZW5lcj4+fSBsaXN0ZW5lcnNcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cbmV4cG9ydCBjb25zdCBhZGRFdmVudExpc3RlbmVycyA9IChub2RlLCBsaXN0ZW5lcnMpID0+IHtcbiAgcGFpci5mb3JFYWNoKGxpc3RlbmVycywgKG5hbWUsIGYpID0+IGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgbmFtZSwgZikpXG4gIHJldHVybiBub2RlXG59XG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBub2RlXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsRXZlbnRMaXN0ZW5lcj4+fSBsaXN0ZW5lcnNcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVFdmVudExpc3RlbmVycyA9IChub2RlLCBsaXN0ZW5lcnMpID0+IHtcbiAgcGFpci5mb3JFYWNoKGxpc3RlbmVycywgKG5hbWUsIGYpID0+IHJlbW92ZUV2ZW50TGlzdGVuZXIobm9kZSwgbmFtZSwgZikpXG4gIHJldHVybiBub2RlXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7QXJyYXk8cGFpci5QYWlyPHN0cmluZyxzdHJpbmc+fHBhaXIuUGFpcjxzdHJpbmcsYm9vbGVhbj4+fSBhdHRycyBBcnJheSBvZiBrZXktdmFsdWUgcGFpcnNcbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IGNoaWxkcmVuXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgZWxlbWVudCA9IChuYW1lLCBhdHRycyA9IFtdLCBjaGlsZHJlbiA9IFtdKSA9PlxuICBhcHBlbmQoc2V0QXR0cmlidXRlcyhjcmVhdGVFbGVtZW50KG5hbWUpLCBhdHRycyksIGNoaWxkcmVuKVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxuICovXG5leHBvcnQgY29uc3QgY2FudmFzID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcbiAgY29uc3QgYyA9IC8qKiBAdHlwZSB7SFRNTENhbnZhc0VsZW1lbnR9ICovIChjcmVhdGVFbGVtZW50KCdjYW52YXMnKSlcbiAgYy5oZWlnaHQgPSBoZWlnaHRcbiAgYy53aWR0aCA9IHdpZHRoXG4gIHJldHVybiBjXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRcbiAqIEByZXR1cm4ge1RleHR9XG4gKi9cbmV4cG9ydCBjb25zdCB0ZXh0ID0gY3JlYXRlVGV4dE5vZGVcblxuLyoqXG4gKiBAcGFyYW0ge3BhaXIuUGFpcjxzdHJpbmcsc3RyaW5nPn0gcGFpclxuICovXG5leHBvcnQgY29uc3QgcGFpclRvU3R5bGVTdHJpbmcgPSBwYWlyID0+IGAke3BhaXIubGVmdH06JHtwYWlyLnJpZ2h0fTtgXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxwYWlyLlBhaXI8c3RyaW5nLHN0cmluZz4+fSBwYWlyc1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgcGFpcnNUb1N0eWxlU3RyaW5nID0gcGFpcnMgPT4gcGFpcnMubWFwKHBhaXJUb1N0eWxlU3RyaW5nKS5qb2luKCcnKVxuXG4vKipcbiAqIEBwYXJhbSB7TWFwPHN0cmluZyxzdHJpbmc+fSBtXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBtYXBUb1N0eWxlU3RyaW5nID0gbSA9PiBtYXAubWFwKG0sICh2YWx1ZSwga2V5KSA9PiBgJHtrZXl9OiR7dmFsdWV9O2ApLmpvaW4oJycpXG5cbi8qKlxuICogQHRvZG8gc2hvdWxkIGFsd2F5cyBxdWVyeSBvbiBhIGRvbSBlbGVtZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudHxTaGFkb3dSb290fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5XG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudCB8IG51bGx9XG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVNlbGVjdG9yID0gKGVsLCBxdWVyeSkgPT4gZWwucXVlcnlTZWxlY3RvcihxdWVyeSlcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fFNoYWRvd1Jvb3R9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnlcbiAqIEByZXR1cm4ge05vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+fVxuICovXG5leHBvcnQgY29uc3QgcXVlcnlTZWxlY3RvckFsbCA9IChlbCwgcXVlcnkpID0+IGVsLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGdldEVsZW1lbnRCeUlkID0gaWQgPT4gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvYy5nZXRFbGVtZW50QnlJZChpZCkpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWxcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICovXG5jb25zdCBfcGFyc2UgPSBodG1sID0+IGRvbVBhcnNlci5wYXJzZUZyb21TdHJpbmcoYDxodG1sPjxib2R5PiR7aHRtbH08L2JvZHk+PC9odG1sPmAsICd0ZXh0L2h0bWwnKS5ib2R5XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWxcbiAqIEByZXR1cm4ge0RvY3VtZW50RnJhZ21lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZUZyYWdtZW50ID0gaHRtbCA9PiBmcmFnbWVudCgvKiogQHR5cGUge2FueX0gKi8gKF9wYXJzZShodG1sKS5jaGlsZE5vZGVzKSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbFxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZUVsZW1lbnQgPSBodG1sID0+IC8qKiBAdHlwZSBIVE1MRWxlbWVudCAqLyAoX3BhcnNlKGh0bWwpLmZpcnN0RWxlbWVudENoaWxkKVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9sZEVsXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9IG5ld0VsXG4gKi9cbmV4cG9ydCBjb25zdCByZXBsYWNlV2l0aCA9IChvbGRFbCwgbmV3RWwpID0+IG9sZEVsLnJlcGxhY2VXaXRoKG5ld0VsKVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBhcmVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7Tm9kZXxudWxsfSByZWZcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgaW5zZXJ0QmVmb3JlID0gKHBhcmVudCwgZWwsIHJlZikgPT4gcGFyZW50Lmluc2VydEJlZm9yZShlbCwgcmVmKVxuXG4vKipcbiAqIEBwYXJhbSB7Tm9kZX0gcGFyZW50XG4gKiBAcGFyYW0ge05vZGV9IGNoaWxkXG4gKiBAcmV0dXJuIHtOb2RlfVxuICovXG5leHBvcnQgY29uc3QgYXBwZW5kQ2hpbGQgPSAocGFyZW50LCBjaGlsZCkgPT4gcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKVxuXG5leHBvcnQgY29uc3QgRUxFTUVOVF9OT0RFID0gZG9jLkVMRU1FTlRfTk9ERVxuZXhwb3J0IGNvbnN0IFRFWFRfTk9ERSA9IGRvYy5URVhUX05PREVcbmV4cG9ydCBjb25zdCBDREFUQV9TRUNUSU9OX05PREUgPSBkb2MuQ0RBVEFfU0VDVElPTl9OT0RFXG5leHBvcnQgY29uc3QgQ09NTUVOVF9OT0RFID0gZG9jLkNPTU1FTlRfTk9ERVxuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX05PREUgPSBkb2MuRE9DVU1FTlRfTk9ERVxuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX1RZUEVfTk9ERSA9IGRvYy5ET0NVTUVOVF9UWVBFX05PREVcbmV4cG9ydCBjb25zdCBET0NVTUVOVF9GUkFHTUVOVF9OT0RFID0gZG9jLkRPQ1VNRU5UX0ZSQUdNRU5UX05PREVcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gbm9kZVxuICogQHBhcmFtIHtudW1iZXJ9IHR5cGVcbiAqL1xuZXhwb3J0IGNvbnN0IGNoZWNrTm9kZVR5cGUgPSAobm9kZSwgdHlwZSkgPT4gbm9kZS5ub2RlVHlwZSA9PT0gdHlwZVxuXG4vKipcbiAqIEBwYXJhbSB7Tm9kZX0gcGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjaGlsZFxuICovXG5leHBvcnQgY29uc3QgaXNQYXJlbnRPZiA9IChwYXJlbnQsIGNoaWxkKSA9PiB7XG4gIGxldCBwID0gY2hpbGQucGFyZW50Tm9kZVxuICB3aGlsZSAocCAmJiBwICE9PSBwYXJlbnQpIHtcbiAgICBwID0gcC5wYXJlbnROb2RlXG4gIH1cbiAgcmV0dXJuIHAgPT09IHBhcmVudFxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cbiIsICIvKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBFY21hU2NyaXB0IFN5bWJvbHMuXG4gKlxuICogQG1vZHVsZSBzeW1ib2xcbiAqL1xuXG4vKipcbiAqIFJldHVybiBmcmVzaCBzeW1ib2wuXG4gKlxuICogQHJldHVybiB7U3ltYm9sfVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gU3ltYm9sXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHNcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBpc1N5bWJvbCA9IHMgPT4gdHlwZW9mIHMgPT09ICdzeW1ib2wnXG4iLCAiaW1wb3J0ICogYXMgc3ltYm9sIGZyb20gJy4vc3ltYm9sLmpzJ1xuaW1wb3J0ICogYXMgdGltZSBmcm9tICcuL3RpbWUuanMnXG5pbXBvcnQgKiBhcyBlbnYgZnJvbSAnLi9lbnZpcm9ubWVudC5qcydcbmltcG9ydCAqIGFzIGZ1bmMgZnJvbSAnLi9mdW5jdGlvbi5qcydcbmltcG9ydCAqIGFzIGpzb24gZnJvbSAnLi9qc29uLmpzJ1xuXG5leHBvcnQgY29uc3QgQk9MRCA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IFVOQk9MRCA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IEJMVUUgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBHUkVZID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgR1JFRU4gPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBSRUQgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBQVVJQTEUgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBPUkFOR0UgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBVTkNPTE9SID0gc3ltYm9sLmNyZWF0ZSgpXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHVuZGVmaW5lZHxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXJ8ZnVuY3Rpb24oKTphbnk+fSBhcmdzXG4gKiBAcmV0dXJuIHtBcnJheTxzdHJpbmd8b2JqZWN0fG51bWJlcnx1bmRlZmluZWQ+fVxuICovXG5leHBvcnQgY29uc3QgY29tcHV0ZU5vQ29sb3JMb2dnaW5nQXJncyA9IGFyZ3MgPT4ge1xuICBpZiAoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXT8uY29uc3RydWN0b3IgPT09IEZ1bmN0aW9uKSB7XG4gICAgYXJncyA9IC8qKiBAdHlwZSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gKi8gKC8qKiBAdHlwZSB7W2Z1bmN0aW9uXX0gKi8gKGFyZ3MpWzBdKCkpXG4gIH1cbiAgY29uc3Qgc3RyQnVpbGRlciA9IFtdXG4gIGNvbnN0IGxvZ0FyZ3MgPSBbXVxuICAvLyB0cnkgd2l0aCBmb3JtYXR0aW5nIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHVuc3VwcG9ydGVkXG4gIGxldCBpID0gMFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2ldXG4gICAgaWYgKGFyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBicmVha1xuICAgIH0gZWxzZSBpZiAoYXJnLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgfHwgYXJnLmNvbnN0cnVjdG9yID09PSBOdW1iZXIpIHtcbiAgICAgIHN0ckJ1aWxkZXIucHVzaChhcmcpXG4gICAgfSBlbHNlIGlmIChhcmcuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgaWYgKGkgPiAwKSB7XG4gICAgLy8gY3JlYXRlIGxvZ0FyZ3Mgd2l0aCB3aGF0IHdlIGhhdmUgc28gZmFyXG4gICAgbG9nQXJncy5wdXNoKHN0ckJ1aWxkZXIuam9pbignJykpXG4gIH1cbiAgLy8gYXBwZW5kIHRoZSByZXN0XG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV1cbiAgICBpZiAoIShhcmcgaW5zdGFuY2VvZiBTeW1ib2wpKSB7XG4gICAgICBsb2dBcmdzLnB1c2goYXJnKVxuICAgIH1cbiAgfVxuICByZXR1cm4gbG9nQXJnc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuY29uc3QgbG9nZ2luZ0NvbG9ycyA9IFtHUkVFTiwgUFVSUExFLCBPUkFOR0UsIEJMVUVdXG5sZXQgbmV4dENvbG9yID0gMFxubGV0IGxhc3RMb2dnaW5nVGltZSA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbiguLi5hbnkpOnZvaWR9IF9wcmludFxuICogQHBhcmFtIHtzdHJpbmd9IG1vZHVsZU5hbWVcbiAqIEByZXR1cm4ge2Z1bmN0aW9uKC4uLmFueSk6dm9pZH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vZHVsZUxvZ2dlciA9IChfcHJpbnQsIG1vZHVsZU5hbWUpID0+IHtcbiAgY29uc3QgY29sb3IgPSBsb2dnaW5nQ29sb3JzW25leHRDb2xvcl1cbiAgY29uc3QgZGVidWdSZWdleFZhciA9IGVudi5nZXRWYXJpYWJsZSgnbG9nJylcbiAgY29uc3QgZG9Mb2dnaW5nID0gZGVidWdSZWdleFZhciAhPT0gbnVsbCAmJlxuICAgIChkZWJ1Z1JlZ2V4VmFyID09PSAnKicgfHwgZGVidWdSZWdleFZhciA9PT0gJ3RydWUnIHx8XG4gICAgICBuZXcgUmVnRXhwKGRlYnVnUmVnZXhWYXIsICdnaScpLnRlc3QobW9kdWxlTmFtZSkpXG4gIG5leHRDb2xvciA9IChuZXh0Q29sb3IgKyAxKSAlIGxvZ2dpbmdDb2xvcnMubGVuZ3RoXG4gIG1vZHVsZU5hbWUgKz0gJzogJ1xuICByZXR1cm4gIWRvTG9nZ2luZ1xuICAgID8gZnVuYy5ub3BcbiAgICA6ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdPy5jb25zdHJ1Y3RvciA9PT0gRnVuY3Rpb24pIHtcbiAgICAgICAgICBhcmdzID0gYXJnc1swXSgpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGltZU5vdyA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICAgICAgICBjb25zdCB0aW1lRGlmZiA9IHRpbWVOb3cgLSBsYXN0TG9nZ2luZ1RpbWVcbiAgICAgICAgbGFzdExvZ2dpbmdUaW1lID0gdGltZU5vd1xuICAgICAgICBfcHJpbnQoXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgbW9kdWxlTmFtZSxcbiAgICAgICAgICBVTkNPTE9SLFxuICAgICAgICAgIC4uLmFyZ3MubWFwKChhcmcpID0+IHtcbiAgICAgICAgICAgIGlmIChhcmcgIT0gbnVsbCAmJiBhcmcuY29uc3RydWN0b3IgPT09IFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgICAgYXJnID0gQXJyYXkuZnJvbShhcmcpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0ID0gdHlwZW9mIGFyZ1xuICAgICAgICAgICAgc3dpdGNoICh0KSB7XG4gICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZ1xuICAgICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzb24uc3RyaW5naWZ5KGFyZylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgICcgKycgKyB0aW1lRGlmZiArICdtcydcbiAgICAgICAgKVxuICAgICAgfVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cbiIsICIvKipcbiAqIElzb21vcnBoaWMgbG9nZ2luZyBtb2R1bGUgd2l0aCBzdXBwb3J0IGZvciBjb2xvcnMhXG4gKlxuICogQG1vZHVsZSBsb2dnaW5nXG4gKi9cblxuaW1wb3J0ICogYXMgZW52IGZyb20gJy4vZW52aXJvbm1lbnQuanMnXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnLi9zZXQuanMnXG5pbXBvcnQgKiBhcyBwYWlyIGZyb20gJy4vcGFpci5qcydcbmltcG9ydCAqIGFzIGRvbSBmcm9tICcuL2RvbS5qcydcbmltcG9ydCAqIGFzIGpzb24gZnJvbSAnLi9qc29uLmpzJ1xuaW1wb3J0ICogYXMgbWFwIGZyb20gJy4vbWFwLmpzJ1xuaW1wb3J0ICogYXMgZXZlbnRsb29wIGZyb20gJy4vZXZlbnRsb29wLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5pbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9sb2dnaW5nLmNvbW1vbi5qcydcblxuZXhwb3J0IHsgQk9MRCwgVU5CT0xELCBCTFVFLCBHUkVZLCBHUkVFTiwgUkVELCBQVVJQTEUsIE9SQU5HRSwgVU5DT0xPUiB9IGZyb20gJy4vbG9nZ2luZy5jb21tb24uanMnXG5cbi8qKlxuICogQHR5cGUge09iamVjdDxTeW1ib2wscGFpci5QYWlyPHN0cmluZyxzdHJpbmc+Pn1cbiAqL1xuY29uc3QgX2Jyb3dzZXJTdHlsZU1hcCA9IHtcbiAgW2NvbW1vbi5CT0xEXTogcGFpci5jcmVhdGUoJ2ZvbnQtd2VpZ2h0JywgJ2JvbGQnKSxcbiAgW2NvbW1vbi5VTkJPTERdOiBwYWlyLmNyZWF0ZSgnZm9udC13ZWlnaHQnLCAnbm9ybWFsJyksXG4gIFtjb21tb24uQkxVRV06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdibHVlJyksXG4gIFtjb21tb24uR1JFRU5dOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAnZ3JlZW4nKSxcbiAgW2NvbW1vbi5HUkVZXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ2dyZXknKSxcbiAgW2NvbW1vbi5SRURdOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAncmVkJyksXG4gIFtjb21tb24uUFVSUExFXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ3B1cnBsZScpLFxuICBbY29tbW9uLk9SQU5HRV06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdvcmFuZ2UnKSwgLy8gbm90IHdlbGwgc3VwcG9ydGVkIGluIGNocm9tZSB3aGVuIGRlYnVnZ2luZyBub2RlIHdpdGggaW5zcGVjdG9yIC0gVE9ETzogZGVwcmVjYXRlXG4gIFtjb21tb24uVU5DT0xPUl06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdibGFjaycpXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXJ8ZnVuY3Rpb24oKTphbnk+fSBhcmdzXG4gKiBAcmV0dXJuIHtBcnJheTxzdHJpbmd8b2JqZWN0fG51bWJlcj59XG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY29uc3QgY29tcHV0ZUJyb3dzZXJMb2dnaW5nQXJncyA9IChhcmdzKSA9PiB7XG4gIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdPy5jb25zdHJ1Y3RvciA9PT0gRnVuY3Rpb24pIHtcbiAgICBhcmdzID0gLyoqIEB0eXBlIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSAqLyAoLyoqIEB0eXBlIHtbZnVuY3Rpb25dfSAqLyAoYXJncylbMF0oKSlcbiAgfVxuICBjb25zdCBzdHJCdWlsZGVyID0gW11cbiAgY29uc3Qgc3R5bGVzID0gW11cbiAgY29uc3QgY3VycmVudFN0eWxlID0gbWFwLmNyZWF0ZSgpXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8c3RyaW5nfE9iamVjdHxudW1iZXI+fVxuICAgKi9cbiAgbGV0IGxvZ0FyZ3MgPSBbXVxuICAvLyB0cnkgd2l0aCBmb3JtYXR0aW5nIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHVuc3VwcG9ydGVkXG4gIGxldCBpID0gMFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2ldXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IHN0eWxlID0gX2Jyb3dzZXJTdHlsZU1hcFthcmddXG4gICAgaWYgKHN0eWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGN1cnJlbnRTdHlsZS5zZXQoc3R5bGUubGVmdCwgc3R5bGUucmlnaHQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgaWYgKGFyZy5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nIHx8IGFyZy5jb25zdHJ1Y3RvciA9PT0gTnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZG9tLm1hcFRvU3R5bGVTdHJpbmcoY3VycmVudFN0eWxlKVxuICAgICAgICBpZiAoaSA+IDAgfHwgc3R5bGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHN0ckJ1aWxkZXIucHVzaCgnJWMnICsgYXJnKVxuICAgICAgICAgIHN0eWxlcy5wdXNoKHN0eWxlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ckJ1aWxkZXIucHVzaChhcmcpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpID4gMCkge1xuICAgIC8vIGNyZWF0ZSBsb2dBcmdzIHdpdGggd2hhdCB3ZSBoYXZlIHNvIGZhclxuICAgIGxvZ0FyZ3MgPSBzdHlsZXNcbiAgICBsb2dBcmdzLnVuc2hpZnQoc3RyQnVpbGRlci5qb2luKCcnKSlcbiAgfVxuICAvLyBhcHBlbmQgdGhlIHJlc3RcbiAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXVxuICAgIGlmICghKGFyZyBpbnN0YW5jZW9mIFN5bWJvbCkpIHtcbiAgICAgIGxvZ0FyZ3MucHVzaChhcmcpXG4gICAgfVxuICB9XG4gIHJldHVybiBsb2dBcmdzXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmNvbnN0IGNvbXB1dGVMb2dnaW5nQXJncyA9IGVudi5zdXBwb3J0c0NvbG9yXG4gID8gY29tcHV0ZUJyb3dzZXJMb2dnaW5nQXJnc1xuICA6IGNvbW1vbi5jb21wdXRlTm9Db2xvckxvZ2dpbmdBcmdzXG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICovXG5leHBvcnQgY29uc3QgcHJpbnQgPSAoLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmxvZyguLi5jb21wdXRlTG9nZ2luZ0FyZ3MoYXJncykpXG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMucHJpbnQoYXJncykpXG59XG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IHdhcm4gPSAoLi4uYXJncykgPT4ge1xuICBjb25zb2xlLndhcm4oLi4uY29tcHV0ZUxvZ2dpbmdBcmdzKGFyZ3MpKVxuICBhcmdzLnVuc2hpZnQoY29tbW9uLk9SQU5HRSlcbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5wcmludChhcmdzKSlcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuZXhwb3J0IGNvbnN0IHByaW50RXJyb3IgPSAoZXJyKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyKVxuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLnByaW50RXJyb3IoZXJyKSlcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHVybCBpbWFnZSBsb2NhdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCBoZWlnaHQgb2YgdGhlIGltYWdlIGluIHBpeGVsXG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuZXhwb3J0IGNvbnN0IHByaW50SW1nID0gKHVybCwgaGVpZ2h0KSA9PiB7XG4gIGlmIChlbnYuaXNCcm93c2VyKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAnJWMgICAgICAgICAgICAgICAgICAgICAgJyxcbiAgICAgIGBmb250LXNpemU6ICR7aGVpZ2h0fXB4OyBiYWNrZ3JvdW5kLXNpemU6IGNvbnRhaW47IGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7IGJhY2tncm91bmQtaW1hZ2U6IHVybCgke3VybH0pYFxuICAgIClcbiAgICAvLyBjb25zb2xlLmxvZygnJWMgICAgICAgICAgICAgICAgJywgYGZvbnQtc2l6ZTogJHtoZWlnaHR9eDsgYmFja2dyb3VuZDogdXJsKCR7dXJsfSkgbm8tcmVwZWF0O2ApXG4gIH1cbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5wcmludEltZyh1cmwsIGhlaWdodCkpXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBiYXNlNjRcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IHByaW50SW1nQmFzZTY0ID0gKGJhc2U2NCwgaGVpZ2h0KSA9PlxuICBwcmludEltZyhgZGF0YTppbWFnZS9naWY7YmFzZTY0LCR7YmFzZTY0fWAsIGhlaWdodClcblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IGdyb3VwID0gKC4uLmFyZ3MpID0+IHtcbiAgY29uc29sZS5ncm91cCguLi5jb21wdXRlTG9nZ2luZ0FyZ3MoYXJncykpXG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMuZ3JvdXAoYXJncykpXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gKi9cbmV4cG9ydCBjb25zdCBncm91cENvbGxhcHNlZCA9ICguLi5hcmdzKSA9PiB7XG4gIGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoLi4uY29tcHV0ZUxvZ2dpbmdBcmdzKGFyZ3MpKVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLmdyb3VwQ29sbGFwc2VkKGFyZ3MpKVxufVxuXG5leHBvcnQgY29uc3QgZ3JvdXBFbmQgPSAoKSA9PiB7XG4gIGNvbnNvbGUuZ3JvdXBFbmQoKVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLmdyb3VwRW5kKCkpXG59XG5cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbigpOk5vZGV9IGNyZWF0ZU5vZGVcbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IHByaW50RG9tID0gKGNyZWF0ZU5vZGUpID0+XG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMucHJpbnREb20oY3JlYXRlTm9kZSgpKSlcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IHByaW50Q2FudmFzID0gKGNhbnZhcywgaGVpZ2h0KSA9PlxuICBwcmludEltZyhjYW52YXMudG9EYXRhVVJMKCksIGhlaWdodClcblxuZXhwb3J0IGNvbnN0IHZjb25zb2xlcyA9IHNldC5jcmVhdGUoKVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICogQHJldHVybiB7QXJyYXk8RWxlbWVudD59XG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY29uc3QgX2NvbXB1dGVMaW5lU3BhbnMgPSAoYXJncykgPT4ge1xuICBjb25zdCBzcGFucyA9IFtdXG4gIGNvbnN0IGN1cnJlbnRTdHlsZSA9IG5ldyBNYXAoKVxuICAvLyB0cnkgd2l0aCBmb3JtYXR0aW5nIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHVuc3VwcG9ydGVkXG4gIGxldCBpID0gMFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgYXJnID0gYXJnc1tpXVxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBzdHlsZSA9IF9icm93c2VyU3R5bGVNYXBbYXJnXVxuICAgIGlmIChzdHlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjdXJyZW50U3R5bGUuc2V0KHN0eWxlLmxlZnQsIHN0eWxlLnJpZ2h0KVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYXJnID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJnID0gJ3VuZGVmaW5lZCAnXG4gICAgICB9XG4gICAgICBpZiAoYXJnLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgfHwgYXJnLmNvbnN0cnVjdG9yID09PSBOdW1iZXIpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBzcGFuID0gZG9tLmVsZW1lbnQoJ3NwYW4nLCBbXG4gICAgICAgICAgcGFpci5jcmVhdGUoJ3N0eWxlJywgZG9tLm1hcFRvU3R5bGVTdHJpbmcoY3VycmVudFN0eWxlKSlcbiAgICAgICAgXSwgW2RvbS50ZXh0KGFyZy50b1N0cmluZygpKV0pXG4gICAgICAgIGlmIChzcGFuLmlubmVySFRNTCA9PT0gJycpIHtcbiAgICAgICAgICBzcGFuLmlubmVySFRNTCA9ICcmbmJzcDsnXG4gICAgICAgIH1cbiAgICAgICAgc3BhbnMucHVzaChzcGFuKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gYXBwZW5kIHRoZSByZXN0XG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjb250ZW50ID0gYXJnc1tpXVxuICAgIGlmICghKGNvbnRlbnQgaW5zdGFuY2VvZiBTeW1ib2wpKSB7XG4gICAgICBpZiAoY29udGVudC5jb25zdHJ1Y3RvciAhPT0gU3RyaW5nICYmIGNvbnRlbnQuY29uc3RydWN0b3IgIT09IE51bWJlcikge1xuICAgICAgICBjb250ZW50ID0gJyAnICsganNvbi5zdHJpbmdpZnkoY29udGVudCkgKyAnICdcbiAgICAgIH1cbiAgICAgIHNwYW5zLnB1c2goXG4gICAgICAgIGRvbS5lbGVtZW50KCdzcGFuJywgW10sIFtkb20udGV4dCgvKiogQHR5cGUge3N0cmluZ30gKi8gKGNvbnRlbnQpKV0pXG4gICAgICApXG4gICAgfVxuICB9XG4gIHJldHVybiBzcGFuc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuY29uc3QgbGluZVN0eWxlID1cbiAgJ2ZvbnQtZmFtaWx5Om1vbm9zcGFjZTtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZTJlMmUyO3BhZGRpbmc6MnB4OydcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5leHBvcnQgY2xhc3MgVkNvbnNvbGUge1xuICAvKipcbiAgICogQHBhcmFtIHtFbGVtZW50fSBkb21cbiAgICovXG4gIGNvbnN0cnVjdG9yIChkb20pIHtcbiAgICB0aGlzLmRvbSA9IGRvbVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2NvbnRhaW5lciA9IHRoaXMuZG9tXG4gICAgdGhpcy5kZXB0aCA9IDBcbiAgICB2Y29uc29sZXMuYWRkKHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29sbGFwc2VkXG4gICAqL1xuICBncm91cCAoYXJncywgY29sbGFwc2VkID0gZmFsc2UpIHtcbiAgICBldmVudGxvb3AuZW5xdWV1ZSgoKSA9PiB7XG4gICAgICBjb25zdCB0cmlhbmdsZURvd24gPSBkb20uZWxlbWVudCgnc3BhbicsIFtcbiAgICAgICAgcGFpci5jcmVhdGUoJ2hpZGRlbicsIGNvbGxhcHNlZCksXG4gICAgICAgIHBhaXIuY3JlYXRlKCdzdHlsZScsICdjb2xvcjpncmV5O2ZvbnQtc2l6ZToxMjAlOycpXG4gICAgICBdLCBbZG9tLnRleHQoJ1x1MjVCQycpXSlcbiAgICAgIGNvbnN0IHRyaWFuZ2xlUmlnaHQgPSBkb20uZWxlbWVudCgnc3BhbicsIFtcbiAgICAgICAgcGFpci5jcmVhdGUoJ2hpZGRlbicsICFjb2xsYXBzZWQpLFxuICAgICAgICBwYWlyLmNyZWF0ZSgnc3R5bGUnLCAnY29sb3I6Z3JleTtmb250LXNpemU6MTI1JTsnKVxuICAgICAgXSwgW2RvbS50ZXh0KCdcdTI1QjYnKV0pXG4gICAgICBjb25zdCBjb250ZW50ID0gZG9tLmVsZW1lbnQoXG4gICAgICAgICdkaXYnLFxuICAgICAgICBbcGFpci5jcmVhdGUoXG4gICAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgICBgJHtsaW5lU3R5bGV9O3BhZGRpbmctbGVmdDoke3RoaXMuZGVwdGggKiAxMH1weGBcbiAgICAgICAgKV0sXG4gICAgICAgIFt0cmlhbmdsZURvd24sIHRyaWFuZ2xlUmlnaHQsIGRvbS50ZXh0KCcgJyldLmNvbmNhdChcbiAgICAgICAgICBfY29tcHV0ZUxpbmVTcGFucyhhcmdzKVxuICAgICAgICApXG4gICAgICApXG4gICAgICBjb25zdCBuZXh0Q29udGFpbmVyID0gZG9tLmVsZW1lbnQoJ2RpdicsIFtcbiAgICAgICAgcGFpci5jcmVhdGUoJ2hpZGRlbicsIGNvbGxhcHNlZClcbiAgICAgIF0pXG4gICAgICBjb25zdCBuZXh0TGluZSA9IGRvbS5lbGVtZW50KCdkaXYnLCBbXSwgW2NvbnRlbnQsIG5leHRDb250YWluZXJdKVxuICAgICAgZG9tLmFwcGVuZCh0aGlzLmNjb250YWluZXIsIFtuZXh0TGluZV0pXG4gICAgICB0aGlzLmNjb250YWluZXIgPSBuZXh0Q29udGFpbmVyXG4gICAgICB0aGlzLmRlcHRoKytcbiAgICAgIC8vIHdoZW4gaGVhZGVyIGlzIGNsaWNrZWQsIGNvbGxhcHNlL3VuY29sbGFwc2UgY29udGFpbmVyXG4gICAgICBkb20uYWRkRXZlbnRMaXN0ZW5lcihjb250ZW50LCAnY2xpY2snLCAoX2V2ZW50KSA9PiB7XG4gICAgICAgIG5leHRDb250YWluZXIudG9nZ2xlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgICB0cmlhbmdsZURvd24udG9nZ2xlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgICB0cmlhbmdsZVJpZ2h0LnRvZ2dsZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAgICovXG4gIGdyb3VwQ29sbGFwc2VkIChhcmdzKSB7XG4gICAgdGhpcy5ncm91cChhcmdzLCB0cnVlKVxuICB9XG5cbiAgZ3JvdXBFbmQgKCkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlcHRoID4gMCkge1xuICAgICAgICB0aGlzLmRlcHRoLS1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmNjb250YWluZXIgPSB0aGlzLmNjb250YWluZXIucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAgICovXG4gIHByaW50IChhcmdzKSB7XG4gICAgZXZlbnRsb29wLmVucXVldWUoKCkgPT4ge1xuICAgICAgZG9tLmFwcGVuZCh0aGlzLmNjb250YWluZXIsIFtcbiAgICAgICAgZG9tLmVsZW1lbnQoJ2RpdicsIFtcbiAgICAgICAgICBwYWlyLmNyZWF0ZShcbiAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICBgJHtsaW5lU3R5bGV9O3BhZGRpbmctbGVmdDoke3RoaXMuZGVwdGggKiAxMH1weGBcbiAgICAgICAgICApXG4gICAgICAgIF0sIF9jb21wdXRlTGluZVNwYW5zKGFyZ3MpKVxuICAgICAgXSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICAgKi9cbiAgcHJpbnRFcnJvciAoZXJyKSB7XG4gICAgdGhpcy5wcmludChbY29tbW9uLlJFRCwgY29tbW9uLkJPTEQsIGVyci50b1N0cmluZygpXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAgICovXG4gIHByaW50SW1nICh1cmwsIGhlaWdodCkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGRvbS5hcHBlbmQodGhpcy5jY29udGFpbmVyLCBbXG4gICAgICAgIGRvbS5lbGVtZW50KCdpbWcnLCBbXG4gICAgICAgICAgcGFpci5jcmVhdGUoJ3NyYycsIHVybCksXG4gICAgICAgICAgcGFpci5jcmVhdGUoJ2hlaWdodCcsIGAke21hdGgucm91bmQoaGVpZ2h0ICogMS41KX1weGApXG4gICAgICAgIF0pXG4gICAgICBdKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXG4gICAqL1xuICBwcmludERvbSAobm9kZSkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGRvbS5hcHBlbmQodGhpcy5jY29udGFpbmVyLCBbbm9kZV0pXG4gICAgfSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIHZjb25zb2xlcy5kZWxldGUodGhpcylcbiAgICB9KVxuICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZG9tXG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgY3JlYXRlVkNvbnNvbGUgPSAoZG9tKSA9PiBuZXcgVkNvbnNvbGUoZG9tKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lXG4gKiBAcmV0dXJuIHtmdW5jdGlvbiguLi5hbnkpOnZvaWR9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2R1bGVMb2dnZXIgPSAobW9kdWxlTmFtZSkgPT4gY29tbW9uLmNyZWF0ZU1vZHVsZUxvZ2dlcihwcmludCwgbW9kdWxlTmFtZSlcbiIsICJpbXBvcnQge1xuICBnZXRTdGF0ZSxcbiAgd3JpdGVTdHJ1Y3RzRnJvbVRyYW5zYWN0aW9uLFxuICB3cml0ZURlbGV0ZVNldCxcbiAgRGVsZXRlU2V0LFxuICBzb3J0QW5kTWVyZ2VEZWxldGVTZXQsXG4gIGdldFN0YXRlVmVjdG9yLFxuICBmaW5kSW5kZXhTUyxcbiAgY2FsbEV2ZW50SGFuZGxlckxpc3RlbmVycyxcbiAgSXRlbSxcbiAgZ2VuZXJhdGVOZXdDbGllbnRJZCxcbiAgY3JlYXRlSUQsXG4gIGNsZWFudXBZVGV4dEFmdGVyVHJhbnNhY3Rpb24sXG4gIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBHQywgU3RydWN0U3RvcmUsIEFic3RyYWN0VHlwZSwgQWJzdHJhY3RTdHJ1Y3QsIFlFdmVudCwgRG9jIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJ2xpYjAvbWF0aCdcbmltcG9ydCAqIGFzIHNldCBmcm9tICdsaWIwL3NldCdcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnbGliMC9sb2dnaW5nJ1xuaW1wb3J0IHsgY2FsbEFsbCB9IGZyb20gJ2xpYjAvZnVuY3Rpb24nXG5cbi8qKlxuICogQSB0cmFuc2FjdGlvbiBpcyBjcmVhdGVkIGZvciBldmVyeSBjaGFuZ2Ugb24gdGhlIFlqcyBtb2RlbC4gSXQgaXMgcG9zc2libGVcbiAqIHRvIGJ1bmRsZSBjaGFuZ2VzIG9uIHRoZSBZanMgbW9kZWwgaW4gYSBzaW5nbGUgdHJhbnNhY3Rpb24gdG9cbiAqIG1pbmltaXplIHRoZSBudW1iZXIgb24gbWVzc2FnZXMgc2VudCBhbmQgdGhlIG51bWJlciBvZiBvYnNlcnZlciBjYWxscy5cbiAqIElmIHBvc3NpYmxlIHRoZSB1c2VyIG9mIHRoaXMgbGlicmFyeSBzaG91bGQgYnVuZGxlIGFzIG1hbnkgY2hhbmdlcyBhc1xuICogcG9zc2libGUuIEhlcmUgaXMgYW4gZXhhbXBsZSB0byBpbGx1c3RyYXRlIHRoZSBhZHZhbnRhZ2VzIG9mIGJ1bmRsaW5nOlxuICpcbiAqIEBleGFtcGxlXG4gKiBjb25zdCB5ZG9jID0gbmV3IFkuRG9jKClcbiAqIGNvbnN0IG1hcCA9IHlkb2MuZ2V0TWFwKCdtYXAnKVxuICogLy8gTG9nIGNvbnRlbnQgd2hlbiBjaGFuZ2UgaXMgdHJpZ2dlcmVkXG4gKiBtYXAub2JzZXJ2ZSgoKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKCdjaGFuZ2UgdHJpZ2dlcmVkJylcbiAqIH0pXG4gKiAvLyBFYWNoIGNoYW5nZSBvbiB0aGUgbWFwIHR5cGUgdHJpZ2dlcnMgYSBsb2cgbWVzc2FnZTpcbiAqIG1hcC5zZXQoJ2EnLCAwKSAvLyA9PiBcImNoYW5nZSB0cmlnZ2VyZWRcIlxuICogbWFwLnNldCgnYicsIDApIC8vID0+IFwiY2hhbmdlIHRyaWdnZXJlZFwiXG4gKiAvLyBXaGVuIHB1dCBpbiBhIHRyYW5zYWN0aW9uLCBpdCB3aWxsIHRyaWdnZXIgdGhlIGxvZyBhZnRlciB0aGUgdHJhbnNhY3Rpb246XG4gKiB5ZG9jLnRyYW5zYWN0KCgpID0+IHtcbiAqICAgbWFwLnNldCgnYScsIDEpXG4gKiAgIG1hcC5zZXQoJ2InLCAxKVxuICogfSkgLy8gPT4gXCJjaGFuZ2UgdHJpZ2dlcmVkXCJcbiAqXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFuc2FjdGlvbiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0RvY30gZG9jXG4gICAqIEBwYXJhbSB7YW55fSBvcmlnaW5cbiAgICogQHBhcmFtIHtib29sZWFufSBsb2NhbFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGRvYywgb3JpZ2luLCBsb2NhbCkge1xuICAgIC8qKlxuICAgICAqIFRoZSBZanMgaW5zdGFuY2UuXG4gICAgICogQHR5cGUge0RvY31cbiAgICAgKi9cbiAgICB0aGlzLmRvYyA9IGRvY1xuICAgIC8qKlxuICAgICAqIERlc2NyaWJlcyB0aGUgc2V0IG9mIGRlbGV0ZWQgaXRlbXMgYnkgaWRzXG4gICAgICogQHR5cGUge0RlbGV0ZVNldH1cbiAgICAgKi9cbiAgICB0aGlzLmRlbGV0ZVNldCA9IG5ldyBEZWxldGVTZXQoKVxuICAgIC8qKlxuICAgICAqIEhvbGRzIHRoZSBzdGF0ZSBiZWZvcmUgdGhlIHRyYW5zYWN0aW9uIHN0YXJ0ZWQuXG4gICAgICogQHR5cGUge01hcDxOdW1iZXIsTnVtYmVyPn1cbiAgICAgKi9cbiAgICB0aGlzLmJlZm9yZVN0YXRlID0gZ2V0U3RhdGVWZWN0b3IoZG9jLnN0b3JlKVxuICAgIC8qKlxuICAgICAqIEhvbGRzIHRoZSBzdGF0ZSBhZnRlciB0aGUgdHJhbnNhY3Rpb24uXG4gICAgICogQHR5cGUge01hcDxOdW1iZXIsTnVtYmVyPn1cbiAgICAgKi9cbiAgICB0aGlzLmFmdGVyU3RhdGUgPSBuZXcgTWFwKClcbiAgICAvKipcbiAgICAgKiBBbGwgdHlwZXMgdGhhdCB3ZXJlIGRpcmVjdGx5IG1vZGlmaWVkIChwcm9wZXJ0eSBhZGRlZCBvciBjaGlsZFxuICAgICAqIGluc2VydGVkL2RlbGV0ZWQpLiBOZXcgdHlwZXMgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGlzIFNldC5cbiAgICAgKiBNYXBzIGZyb20gdHlwZSB0byBwYXJlbnRTdWJzIChgaXRlbS5wYXJlbnRTdWIgPSBudWxsYCBmb3IgWUFycmF5KVxuICAgICAqIEB0eXBlIHtNYXA8QWJzdHJhY3RUeXBlPFlFdmVudDxhbnk+PixTZXQ8U3RyaW5nfG51bGw+Pn1cbiAgICAgKi9cbiAgICB0aGlzLmNoYW5nZWQgPSBuZXcgTWFwKClcbiAgICAvKipcbiAgICAgKiBTdG9yZXMgdGhlIGV2ZW50cyBmb3IgdGhlIHR5cGVzIHRoYXQgb2JzZXJ2ZSBhbHNvIGNoaWxkIGVsZW1lbnRzLlxuICAgICAqIEl0IGlzIG1haW5seSB1c2VkIGJ5IGBvYnNlcnZlRGVlcGAuXG4gICAgICogQHR5cGUge01hcDxBYnN0cmFjdFR5cGU8WUV2ZW50PGFueT4+LEFycmF5PFlFdmVudDxhbnk+Pj59XG4gICAgICovXG4gICAgdGhpcy5jaGFuZ2VkUGFyZW50VHlwZXMgPSBuZXcgTWFwKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8QWJzdHJhY3RTdHJ1Y3Q+fVxuICAgICAqL1xuICAgIHRoaXMuX21lcmdlU3RydWN0cyA9IFtdXG4gICAgLyoqXG4gICAgICogQHR5cGUge2FueX1cbiAgICAgKi9cbiAgICB0aGlzLm9yaWdpbiA9IG9yaWdpblxuICAgIC8qKlxuICAgICAqIFN0b3JlcyBtZXRhIGluZm9ybWF0aW9uIG9uIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEB0eXBlIHtNYXA8YW55LGFueT59XG4gICAgICovXG4gICAgdGhpcy5tZXRhID0gbmV3IE1hcCgpXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGlzIGNoYW5nZSBvcmlnaW5hdGVzIGZyb20gdGhpcyBkb2MuXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5sb2NhbCA9IGxvY2FsXG4gICAgLyoqXG4gICAgICogQHR5cGUge1NldDxEb2M+fVxuICAgICAqL1xuICAgIHRoaXMuc3ViZG9jc0FkZGVkID0gbmV3IFNldCgpXG4gICAgLyoqXG4gICAgICogQHR5cGUge1NldDxEb2M+fVxuICAgICAqL1xuICAgIHRoaXMuc3ViZG9jc1JlbW92ZWQgPSBuZXcgU2V0KClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U2V0PERvYz59XG4gICAgICovXG4gICAgdGhpcy5zdWJkb2NzTG9hZGVkID0gbmV3IFNldCgpXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5fbmVlZEZvcm1hdHRpbmdDbGVhbnVwID0gZmFsc2VcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBkYXRhIHdhcyB3cml0dGVuLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVVcGRhdGVNZXNzYWdlRnJvbVRyYW5zYWN0aW9uID0gKGVuY29kZXIsIHRyYW5zYWN0aW9uKSA9PiB7XG4gIGlmICh0cmFuc2FjdGlvbi5kZWxldGVTZXQuY2xpZW50cy5zaXplID09PSAwICYmICFtYXAuYW55KHRyYW5zYWN0aW9uLmFmdGVyU3RhdGUsIChjbG9jaywgY2xpZW50KSA9PiB0cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZS5nZXQoY2xpZW50KSAhPT0gY2xvY2spKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgc29ydEFuZE1lcmdlRGVsZXRlU2V0KHRyYW5zYWN0aW9uLmRlbGV0ZVNldClcbiAgd3JpdGVTdHJ1Y3RzRnJvbVRyYW5zYWN0aW9uKGVuY29kZXIsIHRyYW5zYWN0aW9uKVxuICB3cml0ZURlbGV0ZVNldChlbmNvZGVyLCB0cmFuc2FjdGlvbi5kZWxldGVTZXQpXG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBuZXh0SUQgPSB0cmFuc2FjdGlvbiA9PiB7XG4gIGNvbnN0IHkgPSB0cmFuc2FjdGlvbi5kb2NcbiAgcmV0dXJuIGNyZWF0ZUlEKHkuY2xpZW50SUQsIGdldFN0YXRlKHkuc3RvcmUsIHkuY2xpZW50SUQpKVxufVxuXG4vKipcbiAqIElmIGB0eXBlLnBhcmVudGAgd2FzIGFkZGVkIGluIGN1cnJlbnQgdHJhbnNhY3Rpb24sIGB0eXBlYCB0ZWNobmljYWxseVxuICogZGlkIG5vdCBjaGFuZ2UsIGl0IHdhcyBqdXN0IGFkZGVkIGFuZCB3ZSBzaG91bGQgbm90IGZpcmUgZXZlbnRzIGZvciBgdHlwZWAuXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPFlFdmVudDxhbnk+Pn0gdHlwZVxuICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gcGFyZW50U3ViXG4gKi9cbmV4cG9ydCBjb25zdCBhZGRDaGFuZ2VkVHlwZVRvVHJhbnNhY3Rpb24gPSAodHJhbnNhY3Rpb24sIHR5cGUsIHBhcmVudFN1YikgPT4ge1xuICBjb25zdCBpdGVtID0gdHlwZS5faXRlbVxuICBpZiAoaXRlbSA9PT0gbnVsbCB8fCAoaXRlbS5pZC5jbG9jayA8ICh0cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZS5nZXQoaXRlbS5pZC5jbGllbnQpIHx8IDApICYmICFpdGVtLmRlbGV0ZWQpKSB7XG4gICAgbWFwLnNldElmVW5kZWZpbmVkKHRyYW5zYWN0aW9uLmNoYW5nZWQsIHR5cGUsIHNldC5jcmVhdGUpLmFkZChwYXJlbnRTdWIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PEFic3RyYWN0U3RydWN0Pn0gc3RydWN0c1xuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHJldHVybiB7bnVtYmVyfSAjIG9mIG1lcmdlZCBzdHJ1Y3RzXG4gKi9cbmNvbnN0IHRyeVRvTWVyZ2VXaXRoTGVmdHMgPSAoc3RydWN0cywgcG9zKSA9PiB7XG4gIGxldCByaWdodCA9IHN0cnVjdHNbcG9zXVxuICBsZXQgbGVmdCA9IHN0cnVjdHNbcG9zIC0gMV1cbiAgbGV0IGkgPSBwb3NcbiAgZm9yICg7IGkgPiAwOyByaWdodCA9IGxlZnQsIGxlZnQgPSBzdHJ1Y3RzWy0taSAtIDFdKSB7XG4gICAgaWYgKGxlZnQuZGVsZXRlZCA9PT0gcmlnaHQuZGVsZXRlZCAmJiBsZWZ0LmNvbnN0cnVjdG9yID09PSByaWdodC5jb25zdHJ1Y3Rvcikge1xuICAgICAgaWYgKGxlZnQubWVyZ2VXaXRoKHJpZ2h0KSkge1xuICAgICAgICBpZiAocmlnaHQgaW5zdGFuY2VvZiBJdGVtICYmIHJpZ2h0LnBhcmVudFN1YiAhPT0gbnVsbCAmJiAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAocmlnaHQucGFyZW50KS5fbWFwLmdldChyaWdodC5wYXJlbnRTdWIpID09PSByaWdodCkge1xuICAgICAgICAgIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChyaWdodC5wYXJlbnQpLl9tYXAuc2V0KHJpZ2h0LnBhcmVudFN1YiwgLyoqIEB0eXBlIHtJdGVtfSAqLyAobGVmdCkpXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICB9XG4gICAgYnJlYWtcbiAgfVxuICBjb25zdCBtZXJnZWQgPSBwb3MgLSBpXG4gIGlmIChtZXJnZWQpIHtcbiAgICAvLyByZW1vdmUgYWxsIG1lcmdlZCBzdHJ1Y3RzIGZyb20gdGhlIGFycmF5XG4gICAgc3RydWN0cy5zcGxpY2UocG9zICsgMSAtIG1lcmdlZCwgbWVyZ2VkKVxuICB9XG4gIHJldHVybiBtZXJnZWRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEl0ZW0pOmJvb2xlYW59IGdjRmlsdGVyXG4gKi9cbmNvbnN0IHRyeUdjRGVsZXRlU2V0ID0gKGRzLCBzdG9yZSwgZ2NGaWx0ZXIpID0+IHtcbiAgZm9yIChjb25zdCBbY2xpZW50LCBkZWxldGVJdGVtc10gb2YgZHMuY2xpZW50cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCBzdHJ1Y3RzID0gLyoqIEB0eXBlIHtBcnJheTxHQ3xJdGVtPn0gKi8gKHN0b3JlLmNsaWVudHMuZ2V0KGNsaWVudCkpXG4gICAgZm9yIChsZXQgZGkgPSBkZWxldGVJdGVtcy5sZW5ndGggLSAxOyBkaSA+PSAwOyBkaS0tKSB7XG4gICAgICBjb25zdCBkZWxldGVJdGVtID0gZGVsZXRlSXRlbXNbZGldXG4gICAgICBjb25zdCBlbmREZWxldGVJdGVtQ2xvY2sgPSBkZWxldGVJdGVtLmNsb2NrICsgZGVsZXRlSXRlbS5sZW5cbiAgICAgIGZvciAoXG4gICAgICAgIGxldCBzaSA9IGZpbmRJbmRleFNTKHN0cnVjdHMsIGRlbGV0ZUl0ZW0uY2xvY2spLCBzdHJ1Y3QgPSBzdHJ1Y3RzW3NpXTtcbiAgICAgICAgc2kgPCBzdHJ1Y3RzLmxlbmd0aCAmJiBzdHJ1Y3QuaWQuY2xvY2sgPCBlbmREZWxldGVJdGVtQ2xvY2s7XG4gICAgICAgIHN0cnVjdCA9IHN0cnVjdHNbKytzaV1cbiAgICAgICkge1xuICAgICAgICBjb25zdCBzdHJ1Y3QgPSBzdHJ1Y3RzW3NpXVxuICAgICAgICBpZiAoZGVsZXRlSXRlbS5jbG9jayArIGRlbGV0ZUl0ZW0ubGVuIDw9IHN0cnVjdC5pZC5jbG9jaykge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0cnVjdCBpbnN0YW5jZW9mIEl0ZW0gJiYgc3RydWN0LmRlbGV0ZWQgJiYgIXN0cnVjdC5rZWVwICYmIGdjRmlsdGVyKHN0cnVjdCkpIHtcbiAgICAgICAgICBzdHJ1Y3QuZ2Moc3RvcmUsIGZhbHNlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICovXG5jb25zdCB0cnlNZXJnZURlbGV0ZVNldCA9IChkcywgc3RvcmUpID0+IHtcbiAgLy8gdHJ5IHRvIG1lcmdlIGRlbGV0ZWQgLyBnYydkIGl0ZW1zXG4gIC8vIG1lcmdlIGZyb20gcmlnaHQgdG8gbGVmdCBmb3IgYmV0dGVyIGVmZmljaWVuY3kgYW5kIHNvIHdlIGRvbid0IG1pc3MgYW55IG1lcmdlIHRhcmdldHNcbiAgZHMuY2xpZW50cy5mb3JFYWNoKChkZWxldGVJdGVtcywgY2xpZW50KSA9PiB7XG4gICAgY29uc3Qgc3RydWN0cyA9IC8qKiBAdHlwZSB7QXJyYXk8R0N8SXRlbT59ICovIChzdG9yZS5jbGllbnRzLmdldChjbGllbnQpKVxuICAgIGZvciAobGV0IGRpID0gZGVsZXRlSXRlbXMubGVuZ3RoIC0gMTsgZGkgPj0gMDsgZGktLSkge1xuICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IGRlbGV0ZUl0ZW1zW2RpXVxuICAgICAgLy8gc3RhcnQgd2l0aCBtZXJnaW5nIHRoZSBpdGVtIG5leHQgdG8gdGhlIGxhc3QgZGVsZXRlZCBpdGVtXG4gICAgICBjb25zdCBtb3N0UmlnaHRJbmRleFRvQ2hlY2sgPSBtYXRoLm1pbihzdHJ1Y3RzLmxlbmd0aCAtIDEsIDEgKyBmaW5kSW5kZXhTUyhzdHJ1Y3RzLCBkZWxldGVJdGVtLmNsb2NrICsgZGVsZXRlSXRlbS5sZW4gLSAxKSlcbiAgICAgIGZvciAoXG4gICAgICAgIGxldCBzaSA9IG1vc3RSaWdodEluZGV4VG9DaGVjaywgc3RydWN0ID0gc3RydWN0c1tzaV07XG4gICAgICAgIHNpID4gMCAmJiBzdHJ1Y3QuaWQuY2xvY2sgPj0gZGVsZXRlSXRlbS5jbG9jaztcbiAgICAgICAgc3RydWN0ID0gc3RydWN0c1tzaV1cbiAgICAgICkge1xuICAgICAgICBzaSAtPSAxICsgdHJ5VG9NZXJnZVdpdGhMZWZ0cyhzdHJ1Y3RzLCBzaSlcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICogQHBhcmFtIHtmdW5jdGlvbihJdGVtKTpib29sZWFufSBnY0ZpbHRlclxuICovXG5leHBvcnQgY29uc3QgdHJ5R2MgPSAoZHMsIHN0b3JlLCBnY0ZpbHRlcikgPT4ge1xuICB0cnlHY0RlbGV0ZVNldChkcywgc3RvcmUsIGdjRmlsdGVyKVxuICB0cnlNZXJnZURlbGV0ZVNldChkcywgc3RvcmUpXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxUcmFuc2FjdGlvbj59IHRyYW5zYWN0aW9uQ2xlYW51cHNcbiAqIEBwYXJhbSB7bnVtYmVyfSBpXG4gKi9cbmNvbnN0IGNsZWFudXBUcmFuc2FjdGlvbnMgPSAodHJhbnNhY3Rpb25DbGVhbnVwcywgaSkgPT4ge1xuICBpZiAoaSA8IHRyYW5zYWN0aW9uQ2xlYW51cHMubGVuZ3RoKSB7XG4gICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvbkNsZWFudXBzW2ldXG4gICAgY29uc3QgZG9jID0gdHJhbnNhY3Rpb24uZG9jXG4gICAgY29uc3Qgc3RvcmUgPSBkb2Muc3RvcmVcbiAgICBjb25zdCBkcyA9IHRyYW5zYWN0aW9uLmRlbGV0ZVNldFxuICAgIGNvbnN0IG1lcmdlU3RydWN0cyA9IHRyYW5zYWN0aW9uLl9tZXJnZVN0cnVjdHNcbiAgICB0cnkge1xuICAgICAgc29ydEFuZE1lcmdlRGVsZXRlU2V0KGRzKVxuICAgICAgdHJhbnNhY3Rpb24uYWZ0ZXJTdGF0ZSA9IGdldFN0YXRlVmVjdG9yKHRyYW5zYWN0aW9uLmRvYy5zdG9yZSlcbiAgICAgIGRvYy5lbWl0KCdiZWZvcmVPYnNlcnZlckNhbGxzJywgW3RyYW5zYWN0aW9uLCBkb2NdKVxuICAgICAgLyoqXG4gICAgICAgKiBBbiBhcnJheSBvZiBldmVudCBjYWxsYmFja3MuXG4gICAgICAgKlxuICAgICAgICogRWFjaCBjYWxsYmFjayBpcyBjYWxsZWQgZXZlbiBpZiB0aGUgb3RoZXIgb25lcyB0aHJvdyBlcnJvcnMuXG4gICAgICAgKlxuICAgICAgICogQHR5cGUge0FycmF5PGZ1bmN0aW9uKCk6dm9pZD59XG4gICAgICAgKi9cbiAgICAgIGNvbnN0IGZzID0gW11cbiAgICAgIC8vIG9ic2VydmUgZXZlbnRzIG9uIGNoYW5nZWQgdHlwZXNcbiAgICAgIHRyYW5zYWN0aW9uLmNoYW5nZWQuZm9yRWFjaCgoc3VicywgaXRlbXR5cGUpID0+XG4gICAgICAgIGZzLnB1c2goKCkgPT4ge1xuICAgICAgICAgIGlmIChpdGVtdHlwZS5faXRlbSA9PT0gbnVsbCB8fCAhaXRlbXR5cGUuX2l0ZW0uZGVsZXRlZCkge1xuICAgICAgICAgICAgaXRlbXR5cGUuX2NhbGxPYnNlcnZlcih0cmFuc2FjdGlvbiwgc3VicylcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICBmcy5wdXNoKCgpID0+IHtcbiAgICAgICAgLy8gZGVlcCBvYnNlcnZlIGV2ZW50c1xuICAgICAgICB0cmFuc2FjdGlvbi5jaGFuZ2VkUGFyZW50VHlwZXMuZm9yRWFjaCgoZXZlbnRzLCB0eXBlKSA9PiB7XG4gICAgICAgICAgLy8gV2UgbmVlZCB0byB0aGluayBhYm91dCB0aGUgcG9zc2liaWxpdHkgdGhhdCB0aGUgdXNlciB0cmFuc2Zvcm1zIHRoZVxuICAgICAgICAgIC8vIFkuRG9jIGluIHRoZSBldmVudC5cbiAgICAgICAgICBpZiAodHlwZS5fZEVILmwubGVuZ3RoID4gMCAmJiAodHlwZS5faXRlbSA9PT0gbnVsbCB8fCAhdHlwZS5faXRlbS5kZWxldGVkKSkge1xuICAgICAgICAgICAgZXZlbnRzID0gZXZlbnRzXG4gICAgICAgICAgICAgIC5maWx0ZXIoZXZlbnQgPT5cbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQuX2l0ZW0gPT09IG51bGwgfHwgIWV2ZW50LnRhcmdldC5faXRlbS5kZWxldGVkXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIGV2ZW50c1xuICAgICAgICAgICAgICAuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCA9IHR5cGVcbiAgICAgICAgICAgICAgICAvLyBwYXRoIGlzIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHRhcmdldFxuICAgICAgICAgICAgICAgIGV2ZW50Ll9wYXRoID0gbnVsbFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgLy8gc29ydCBldmVudHMgYnkgcGF0aCBsZW5ndGggc28gdGhhdCB0b3AtbGV2ZWwgZXZlbnRzIGFyZSBmaXJlZCBmaXJzdC5cbiAgICAgICAgICAgIGV2ZW50c1xuICAgICAgICAgICAgICAuc29ydCgoZXZlbnQxLCBldmVudDIpID0+IGV2ZW50MS5wYXRoLmxlbmd0aCAtIGV2ZW50Mi5wYXRoLmxlbmd0aClcbiAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gY2hlY2sgZm9yIGV2ZW50cy5sZW5ndGhcbiAgICAgICAgICAgIC8vIGJlY2F1c2Ugd2Uga25vdyBpdCBoYXMgYXQgbGVhc3Qgb25lIGVsZW1lbnRcbiAgICAgICAgICAgIGNhbGxFdmVudEhhbmRsZXJMaXN0ZW5lcnModHlwZS5fZEVILCBldmVudHMsIHRyYW5zYWN0aW9uKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICBmcy5wdXNoKCgpID0+IGRvYy5lbWl0KCdhZnRlclRyYW5zYWN0aW9uJywgW3RyYW5zYWN0aW9uLCBkb2NdKSlcbiAgICAgIGNhbGxBbGwoZnMsIFtdKVxuICAgICAgaWYgKHRyYW5zYWN0aW9uLl9uZWVkRm9ybWF0dGluZ0NsZWFudXApIHtcbiAgICAgICAgY2xlYW51cFlUZXh0QWZ0ZXJUcmFuc2FjdGlvbih0cmFuc2FjdGlvbilcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gUmVwbGFjZSBkZWxldGVkIGl0ZW1zIHdpdGggSXRlbURlbGV0ZWQgLyBHQy5cbiAgICAgIC8vIFRoaXMgaXMgd2hlcmUgY29udGVudCBpcyBhY3R1YWxseSByZW1vdmUgZnJvbSB0aGUgWWpzIERvYy5cbiAgICAgIGlmIChkb2MuZ2MpIHtcbiAgICAgICAgdHJ5R2NEZWxldGVTZXQoZHMsIHN0b3JlLCBkb2MuZ2NGaWx0ZXIpXG4gICAgICB9XG4gICAgICB0cnlNZXJnZURlbGV0ZVNldChkcywgc3RvcmUpXG5cbiAgICAgIC8vIG9uIGFsbCBhZmZlY3RlZCBzdG9yZS5jbGllbnRzIHByb3BzLCB0cnkgdG8gbWVyZ2VcbiAgICAgIHRyYW5zYWN0aW9uLmFmdGVyU3RhdGUuZm9yRWFjaCgoY2xvY2ssIGNsaWVudCkgPT4ge1xuICAgICAgICBjb25zdCBiZWZvcmVDbG9jayA9IHRyYW5zYWN0aW9uLmJlZm9yZVN0YXRlLmdldChjbGllbnQpIHx8IDBcbiAgICAgICAgaWYgKGJlZm9yZUNsb2NrICE9PSBjbG9jaykge1xuICAgICAgICAgIGNvbnN0IHN0cnVjdHMgPSAvKiogQHR5cGUge0FycmF5PEdDfEl0ZW0+fSAqLyAoc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50KSlcbiAgICAgICAgICAvLyB3ZSBpdGVyYXRlIGZyb20gcmlnaHQgdG8gbGVmdCBzbyB3ZSBjYW4gc2FmZWx5IHJlbW92ZSBlbnRyaWVzXG4gICAgICAgICAgY29uc3QgZmlyc3RDaGFuZ2VQb3MgPSBtYXRoLm1heChmaW5kSW5kZXhTUyhzdHJ1Y3RzLCBiZWZvcmVDbG9jayksIDEpXG4gICAgICAgICAgZm9yIChsZXQgaSA9IHN0cnVjdHMubGVuZ3RoIC0gMTsgaSA+PSBmaXJzdENoYW5nZVBvczspIHtcbiAgICAgICAgICAgIGkgLT0gMSArIHRyeVRvTWVyZ2VXaXRoTGVmdHMoc3RydWN0cywgaSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAvLyB0cnkgdG8gbWVyZ2UgbWVyZ2VTdHJ1Y3RzXG4gICAgICAvLyBAdG9kbzogaXQgbWFrZXMgbW9yZSBzZW5zZSB0byB0cmFuc2Zvcm0gbWVyZ2VTdHJ1Y3RzIHRvIGEgRFMsIHNvcnQgaXQsIGFuZCBtZXJnZSBmcm9tIHJpZ2h0IHRvIGxlZnRcbiAgICAgIC8vICAgICAgICBidXQgYXQgdGhlIG1vbWVudCBEUyBkb2VzIG5vdCBoYW5kbGUgZHVwbGljYXRlc1xuICAgICAgZm9yIChsZXQgaSA9IG1lcmdlU3RydWN0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBjb25zdCB7IGNsaWVudCwgY2xvY2sgfSA9IG1lcmdlU3RydWN0c1tpXS5pZFxuICAgICAgICBjb25zdCBzdHJ1Y3RzID0gLyoqIEB0eXBlIHtBcnJheTxHQ3xJdGVtPn0gKi8gKHN0b3JlLmNsaWVudHMuZ2V0KGNsaWVudCkpXG4gICAgICAgIGNvbnN0IHJlcGxhY2VkU3RydWN0UG9zID0gZmluZEluZGV4U1Moc3RydWN0cywgY2xvY2spXG4gICAgICAgIGlmIChyZXBsYWNlZFN0cnVjdFBvcyArIDEgPCBzdHJ1Y3RzLmxlbmd0aCkge1xuICAgICAgICAgIGlmICh0cnlUb01lcmdlV2l0aExlZnRzKHN0cnVjdHMsIHJlcGxhY2VkU3RydWN0UG9zICsgMSkgPiAxKSB7XG4gICAgICAgICAgICBjb250aW51ZSAvLyBubyBuZWVkIHRvIHBlcmZvcm0gbmV4dCBjaGVjaywgYm90aCBhcmUgYWxyZWFkeSBtZXJnZWRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlcGxhY2VkU3RydWN0UG9zID4gMCkge1xuICAgICAgICAgIHRyeVRvTWVyZ2VXaXRoTGVmdHMoc3RydWN0cywgcmVwbGFjZWRTdHJ1Y3RQb3MpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghdHJhbnNhY3Rpb24ubG9jYWwgJiYgdHJhbnNhY3Rpb24uYWZ0ZXJTdGF0ZS5nZXQoZG9jLmNsaWVudElEKSAhPT0gdHJhbnNhY3Rpb24uYmVmb3JlU3RhdGUuZ2V0KGRvYy5jbGllbnRJRCkpIHtcbiAgICAgICAgbG9nZ2luZy5wcmludChsb2dnaW5nLk9SQU5HRSwgbG9nZ2luZy5CT0xELCAnW3lqc10gJywgbG9nZ2luZy5VTkJPTEQsIGxvZ2dpbmcuUkVELCAnQ2hhbmdlZCB0aGUgY2xpZW50LWlkIGJlY2F1c2UgYW5vdGhlciBjbGllbnQgc2VlbXMgdG8gYmUgdXNpbmcgaXQuJylcbiAgICAgICAgZG9jLmNsaWVudElEID0gZ2VuZXJhdGVOZXdDbGllbnRJZCgpXG4gICAgICB9XG4gICAgICAvLyBAdG9kbyBNZXJnZSBhbGwgdGhlIHRyYW5zYWN0aW9ucyBpbnRvIG9uZSBhbmQgcHJvdmlkZSBzZW5kIHRoZSBkYXRhIGFzIGEgc2luZ2xlIHVwZGF0ZSBtZXNzYWdlXG4gICAgICBkb2MuZW1pdCgnYWZ0ZXJUcmFuc2FjdGlvbkNsZWFudXAnLCBbdHJhbnNhY3Rpb24sIGRvY10pXG4gICAgICBpZiAoZG9jLl9vYnNlcnZlcnMuaGFzKCd1cGRhdGUnKSkge1xuICAgICAgICBjb25zdCBlbmNvZGVyID0gbmV3IFVwZGF0ZUVuY29kZXJWMSgpXG4gICAgICAgIGNvbnN0IGhhc0NvbnRlbnQgPSB3cml0ZVVwZGF0ZU1lc3NhZ2VGcm9tVHJhbnNhY3Rpb24oZW5jb2RlciwgdHJhbnNhY3Rpb24pXG4gICAgICAgIGlmIChoYXNDb250ZW50KSB7XG4gICAgICAgICAgZG9jLmVtaXQoJ3VwZGF0ZScsIFtlbmNvZGVyLnRvVWludDhBcnJheSgpLCB0cmFuc2FjdGlvbi5vcmlnaW4sIGRvYywgdHJhbnNhY3Rpb25dKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZG9jLl9vYnNlcnZlcnMuaGFzKCd1cGRhdGVWMicpKSB7XG4gICAgICAgIGNvbnN0IGVuY29kZXIgPSBuZXcgVXBkYXRlRW5jb2RlclYyKClcbiAgICAgICAgY29uc3QgaGFzQ29udGVudCA9IHdyaXRlVXBkYXRlTWVzc2FnZUZyb21UcmFuc2FjdGlvbihlbmNvZGVyLCB0cmFuc2FjdGlvbilcbiAgICAgICAgaWYgKGhhc0NvbnRlbnQpIHtcbiAgICAgICAgICBkb2MuZW1pdCgndXBkYXRlVjInLCBbZW5jb2Rlci50b1VpbnQ4QXJyYXkoKSwgdHJhbnNhY3Rpb24ub3JpZ2luLCBkb2MsIHRyYW5zYWN0aW9uXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgeyBzdWJkb2NzQWRkZWQsIHN1YmRvY3NMb2FkZWQsIHN1YmRvY3NSZW1vdmVkIH0gPSB0cmFuc2FjdGlvblxuICAgICAgaWYgKHN1YmRvY3NBZGRlZC5zaXplID4gMCB8fCBzdWJkb2NzUmVtb3ZlZC5zaXplID4gMCB8fCBzdWJkb2NzTG9hZGVkLnNpemUgPiAwKSB7XG4gICAgICAgIHN1YmRvY3NBZGRlZC5mb3JFYWNoKHN1YmRvYyA9PiB7XG4gICAgICAgICAgc3ViZG9jLmNsaWVudElEID0gZG9jLmNsaWVudElEXG4gICAgICAgICAgaWYgKHN1YmRvYy5jb2xsZWN0aW9uaWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgc3ViZG9jLmNvbGxlY3Rpb25pZCA9IGRvYy5jb2xsZWN0aW9uaWRcbiAgICAgICAgICB9XG4gICAgICAgICAgZG9jLnN1YmRvY3MuYWRkKHN1YmRvYylcbiAgICAgICAgfSlcbiAgICAgICAgc3ViZG9jc1JlbW92ZWQuZm9yRWFjaChzdWJkb2MgPT4gZG9jLnN1YmRvY3MuZGVsZXRlKHN1YmRvYykpXG4gICAgICAgIGRvYy5lbWl0KCdzdWJkb2NzJywgW3sgbG9hZGVkOiBzdWJkb2NzTG9hZGVkLCBhZGRlZDogc3ViZG9jc0FkZGVkLCByZW1vdmVkOiBzdWJkb2NzUmVtb3ZlZCB9LCBkb2MsIHRyYW5zYWN0aW9uXSlcbiAgICAgICAgc3ViZG9jc1JlbW92ZWQuZm9yRWFjaChzdWJkb2MgPT4gc3ViZG9jLmRlc3Ryb3koKSlcbiAgICAgIH1cblxuICAgICAgaWYgKHRyYW5zYWN0aW9uQ2xlYW51cHMubGVuZ3RoIDw9IGkgKyAxKSB7XG4gICAgICAgIGRvYy5fdHJhbnNhY3Rpb25DbGVhbnVwcyA9IFtdXG4gICAgICAgIGRvYy5lbWl0KCdhZnRlckFsbFRyYW5zYWN0aW9ucycsIFtkb2MsIHRyYW5zYWN0aW9uQ2xlYW51cHNdKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xlYW51cFRyYW5zYWN0aW9ucyh0cmFuc2FjdGlvbkNsZWFudXBzLCBpICsgMSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBmdW5jdGlvbmFsaXR5IG9mIGB5LnRyYW5zYWN0KCgpPT57Li59KWBcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtEb2N9IGRvY1xuICogQHBhcmFtIHtmdW5jdGlvbihUcmFuc2FjdGlvbik6VH0gZlxuICogQHBhcmFtIHthbnl9IFtvcmlnaW49dHJ1ZV1cbiAqIEByZXR1cm4ge1R9XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0cmFuc2FjdCA9IChkb2MsIGYsIG9yaWdpbiA9IG51bGwsIGxvY2FsID0gdHJ1ZSkgPT4ge1xuICBjb25zdCB0cmFuc2FjdGlvbkNsZWFudXBzID0gZG9jLl90cmFuc2FjdGlvbkNsZWFudXBzXG4gIGxldCBpbml0aWFsQ2FsbCA9IGZhbHNlXG4gIC8qKlxuICAgKiBAdHlwZSB7YW55fVxuICAgKi9cbiAgbGV0IHJlc3VsdCA9IG51bGxcbiAgaWYgKGRvYy5fdHJhbnNhY3Rpb24gPT09IG51bGwpIHtcbiAgICBpbml0aWFsQ2FsbCA9IHRydWVcbiAgICBkb2MuX3RyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKGRvYywgb3JpZ2luLCBsb2NhbClcbiAgICB0cmFuc2FjdGlvbkNsZWFudXBzLnB1c2goZG9jLl90cmFuc2FjdGlvbilcbiAgICBpZiAodHJhbnNhY3Rpb25DbGVhbnVwcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGRvYy5lbWl0KCdiZWZvcmVBbGxUcmFuc2FjdGlvbnMnLCBbZG9jXSlcbiAgICB9XG4gICAgZG9jLmVtaXQoJ2JlZm9yZVRyYW5zYWN0aW9uJywgW2RvYy5fdHJhbnNhY3Rpb24sIGRvY10pXG4gIH1cbiAgdHJ5IHtcbiAgICByZXN1bHQgPSBmKGRvYy5fdHJhbnNhY3Rpb24pXG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGluaXRpYWxDYWxsKSB7XG4gICAgICBjb25zdCBmaW5pc2hDbGVhbnVwID0gZG9jLl90cmFuc2FjdGlvbiA9PT0gdHJhbnNhY3Rpb25DbGVhbnVwc1swXVxuICAgICAgZG9jLl90cmFuc2FjdGlvbiA9IG51bGxcbiAgICAgIGlmIChmaW5pc2hDbGVhbnVwKSB7XG4gICAgICAgIC8vIFRoZSBmaXJzdCB0cmFuc2FjdGlvbiBlbmRlZCwgbm93IHByb2Nlc3Mgb2JzZXJ2ZXIgY2FsbHMuXG4gICAgICAgIC8vIE9ic2VydmVyIGNhbGwgbWF5IGNyZWF0ZSBuZXcgdHJhbnNhY3Rpb25zIGZvciB3aGljaCB3ZSBuZWVkIHRvIGNhbGwgdGhlIG9ic2VydmVycyBhbmQgZG8gY2xlYW51cC5cbiAgICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBuZXN0IHRoZXNlIGNhbGxzLCBzbyB3ZSBleGVjdXRlIHRoZXNlIGNhbGxzIG9uZSBhZnRlclxuICAgICAgICAvLyBhbm90aGVyLlxuICAgICAgICAvLyBBbHNvIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgYWxsIGNsZWFudXBzIGFyZSBjYWxsZWQsIGV2ZW4gaWYgdGhlXG4gICAgICAgIC8vIG9ic2VydmVzIHRocm93IGVycm9ycy5cbiAgICAgICAgLy8gVGhpcyBmaWxlIGlzIGZ1bGwgb2YgaGFja3kgdHJ5IHt9IGZpbmFsbHkge30gYmxvY2tzIHRvIGVuc3VyZSB0aGF0IGFuXG4gICAgICAgIC8vIGV2ZW50IGNhbiB0aHJvdyBlcnJvcnMgYW5kIGFsc28gdGhhdCB0aGUgY2xlYW51cCBpcyBjYWxsZWQuXG4gICAgICAgIGNsZWFudXBUcmFuc2FjdGlvbnModHJhbnNhY3Rpb25DbGVhbnVwcywgMClcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwgImltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICdsaWIwL2JpbmFyeSdcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcbmltcG9ydCAqIGFzIGYgZnJvbSAnbGliMC9mdW5jdGlvbidcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnbGliMC9sb2dnaW5nJ1xuaW1wb3J0ICogYXMgbWFwIGZyb20gJ2xpYjAvbWFwJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgKiBhcyBzdHJpbmcgZnJvbSAnbGliMC9zdHJpbmcnXG5cbmltcG9ydCB7XG4gIENvbnRlbnRBbnksXG4gIENvbnRlbnRCaW5hcnksXG4gIENvbnRlbnREZWxldGVkLFxuICBDb250ZW50RG9jLFxuICBDb250ZW50RW1iZWQsXG4gIENvbnRlbnRGb3JtYXQsXG4gIENvbnRlbnRKU09OLFxuICBDb250ZW50U3RyaW5nLFxuICBDb250ZW50VHlwZSxcbiAgY3JlYXRlSUQsXG4gIGRlY29kZVN0YXRlVmVjdG9yLFxuICBEU0VuY29kZXJWMSxcbiAgRFNFbmNvZGVyVjIsXG4gIEdDLFxuICBJdGVtLFxuICBtZXJnZURlbGV0ZVNldHMsXG4gIHJlYWREZWxldGVTZXQsXG4gIHJlYWRJdGVtQ29udGVudCxcbiAgU2tpcCxcbiAgVXBkYXRlRGVjb2RlclYxLFxuICBVcGRhdGVEZWNvZGVyVjIsXG4gIFVwZGF0ZUVuY29kZXJWMSxcbiAgVXBkYXRlRW5jb2RlclYyLFxuICB3cml0ZURlbGV0ZVNldCxcbiAgWVhtbEVsZW1lbnQsXG4gIFlYbWxIb29rXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICovXG5mdW5jdGlvbiAqIGxhenlTdHJ1Y3RSZWFkZXJHZW5lcmF0b3IgKGRlY29kZXIpIHtcbiAgY29uc3QgbnVtT2ZTdGF0ZVVwZGF0ZXMgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bU9mU3RhdGVVcGRhdGVzOyBpKyspIHtcbiAgICBjb25zdCBudW1iZXJPZlN0cnVjdHMgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgIGNvbnN0IGNsaWVudCA9IGRlY29kZXIucmVhZENsaWVudCgpXG4gICAgbGV0IGNsb2NrID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mU3RydWN0czsgaSsrKSB7XG4gICAgICBjb25zdCBpbmZvID0gZGVjb2Rlci5yZWFkSW5mbygpXG4gICAgICAvLyBAdG9kbyB1c2Ugc3dpdGNoIGluc3RlYWQgb2YgaWZzXG4gICAgICBpZiAoaW5mbyA9PT0gMTApIHtcbiAgICAgICAgY29uc3QgbGVuID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgICAgICAgeWllbGQgbmV3IFNraXAoY3JlYXRlSUQoY2xpZW50LCBjbG9jayksIGxlbilcbiAgICAgICAgY2xvY2sgKz0gbGVuXG4gICAgICB9IGVsc2UgaWYgKChiaW5hcnkuQklUUzUgJiBpbmZvKSAhPT0gMCkge1xuICAgICAgICBjb25zdCBjYW50Q29weVBhcmVudEluZm8gPSAoaW5mbyAmIChiaW5hcnkuQklUNyB8IGJpbmFyeS5CSVQ4KSkgPT09IDBcbiAgICAgICAgLy8gSWYgcGFyZW50ID0gbnVsbCBhbmQgbmVpdGhlciBsZWZ0IG5vciByaWdodCBhcmUgZGVmaW5lZCwgdGhlbiB3ZSBrbm93IHRoYXQgYHBhcmVudGAgaXMgY2hpbGQgb2YgYHlgXG4gICAgICAgIC8vIGFuZCB3ZSByZWFkIHRoZSBuZXh0IHN0cmluZyBhcyBwYXJlbnRZS2V5LlxuICAgICAgICAvLyBJdCBpbmRpY2F0ZXMgaG93IHdlIHN0b3JlL3JldHJpZXZlIHBhcmVudCBmcm9tIGB5LnNoYXJlYFxuICAgICAgICAvLyBAdHlwZSB7c3RyaW5nfG51bGx9XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IG5ldyBJdGVtKFxuICAgICAgICAgIGNyZWF0ZUlEKGNsaWVudCwgY2xvY2spLFxuICAgICAgICAgIG51bGwsIC8vIGxlZnRcbiAgICAgICAgICAoaW5mbyAmIGJpbmFyeS5CSVQ4KSA9PT0gYmluYXJ5LkJJVDggPyBkZWNvZGVyLnJlYWRMZWZ0SUQoKSA6IG51bGwsIC8vIG9yaWdpblxuICAgICAgICAgIG51bGwsIC8vIHJpZ2h0XG4gICAgICAgICAgKGluZm8gJiBiaW5hcnkuQklUNykgPT09IGJpbmFyeS5CSVQ3ID8gZGVjb2Rlci5yZWFkUmlnaHRJRCgpIDogbnVsbCwgLy8gcmlnaHQgb3JpZ2luXG4gICAgICAgICAgLy8gQHRzLWlnbm9yZSBGb3JjZSB3cml0aW5nIGEgc3RyaW5nIGhlcmUuXG4gICAgICAgICAgY2FudENvcHlQYXJlbnRJbmZvID8gKGRlY29kZXIucmVhZFBhcmVudEluZm8oKSA/IGRlY29kZXIucmVhZFN0cmluZygpIDogZGVjb2Rlci5yZWFkTGVmdElEKCkpIDogbnVsbCwgLy8gcGFyZW50XG4gICAgICAgICAgY2FudENvcHlQYXJlbnRJbmZvICYmIChpbmZvICYgYmluYXJ5LkJJVDYpID09PSBiaW5hcnkuQklUNiA/IGRlY29kZXIucmVhZFN0cmluZygpIDogbnVsbCwgLy8gcGFyZW50U3ViXG4gICAgICAgICAgcmVhZEl0ZW1Db250ZW50KGRlY29kZXIsIGluZm8pIC8vIGl0ZW0gY29udGVudFxuICAgICAgICApXG4gICAgICAgIHlpZWxkIHN0cnVjdFxuICAgICAgICBjbG9jayArPSBzdHJ1Y3QubGVuZ3RoXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBsZW4gPSBkZWNvZGVyLnJlYWRMZW4oKVxuICAgICAgICB5aWVsZCBuZXcgR0MoY3JlYXRlSUQoY2xpZW50LCBjbG9jayksIGxlbilcbiAgICAgICAgY2xvY2sgKz0gbGVuXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMYXp5U3RydWN0UmVhZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZmlsdGVyU2tpcHNcbiAgICovXG4gIGNvbnN0cnVjdG9yIChkZWNvZGVyLCBmaWx0ZXJTa2lwcykge1xuICAgIHRoaXMuZ2VuID0gbGF6eVN0cnVjdFJlYWRlckdlbmVyYXRvcihkZWNvZGVyKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudWxsIHwgSXRlbSB8IFNraXAgfCBHQ31cbiAgICAgKi9cbiAgICB0aGlzLmN1cnIgPSBudWxsXG4gICAgdGhpcy5kb25lID0gZmFsc2VcbiAgICB0aGlzLmZpbHRlclNraXBzID0gZmlsdGVyU2tpcHNcbiAgICB0aGlzLm5leHQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0l0ZW0gfCBHQyB8IFNraXAgfG51bGx9XG4gICAqL1xuICBuZXh0ICgpIHtcbiAgICAvLyBpZ25vcmUgXCJTa2lwXCIgc3RydWN0c1xuICAgIGRvIHtcbiAgICAgIHRoaXMuY3VyciA9IHRoaXMuZ2VuLm5leHQoKS52YWx1ZSB8fCBudWxsXG4gICAgfSB3aGlsZSAodGhpcy5maWx0ZXJTa2lwcyAmJiB0aGlzLmN1cnIgIT09IG51bGwgJiYgdGhpcy5jdXJyLmNvbnN0cnVjdG9yID09PSBTa2lwKVxuICAgIHJldHVybiB0aGlzLmN1cnJcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKlxuICovXG5leHBvcnQgY29uc3QgbG9nVXBkYXRlID0gdXBkYXRlID0+IGxvZ1VwZGF0ZVYyKHVwZGF0ZSwgVXBkYXRlRGVjb2RlclYxKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge3R5cGVvZiBVcGRhdGVEZWNvZGVyVjIgfCB0eXBlb2YgVXBkYXRlRGVjb2RlclYxfSBbWURlY29kZXJdXG4gKlxuICovXG5leHBvcnQgY29uc3QgbG9nVXBkYXRlVjIgPSAodXBkYXRlLCBZRGVjb2RlciA9IFVwZGF0ZURlY29kZXJWMikgPT4ge1xuICBjb25zdCBzdHJ1Y3RzID0gW11cbiAgY29uc3QgdXBkYXRlRGVjb2RlciA9IG5ldyBZRGVjb2RlcihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSkpXG4gIGNvbnN0IGxhenlEZWNvZGVyID0gbmV3IExhenlTdHJ1Y3RSZWFkZXIodXBkYXRlRGVjb2RlciwgZmFsc2UpXG4gIGZvciAobGV0IGN1cnIgPSBsYXp5RGVjb2Rlci5jdXJyOyBjdXJyICE9PSBudWxsOyBjdXJyID0gbGF6eURlY29kZXIubmV4dCgpKSB7XG4gICAgc3RydWN0cy5wdXNoKGN1cnIpXG4gIH1cbiAgbG9nZ2luZy5wcmludCgnU3RydWN0czogJywgc3RydWN0cylcbiAgY29uc3QgZHMgPSByZWFkRGVsZXRlU2V0KHVwZGF0ZURlY29kZXIpXG4gIGxvZ2dpbmcucHJpbnQoJ0RlbGV0ZVNldDogJywgZHMpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqXG4gKi9cbmV4cG9ydCBjb25zdCBkZWNvZGVVcGRhdGUgPSAodXBkYXRlKSA9PiBkZWNvZGVVcGRhdGVWMih1cGRhdGUsIFVwZGF0ZURlY29kZXJWMSlcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICogQHBhcmFtIHt0eXBlb2YgVXBkYXRlRGVjb2RlclYyIHwgdHlwZW9mIFVwZGF0ZURlY29kZXJWMX0gW1lEZWNvZGVyXVxuICpcbiAqL1xuZXhwb3J0IGNvbnN0IGRlY29kZVVwZGF0ZVYyID0gKHVwZGF0ZSwgWURlY29kZXIgPSBVcGRhdGVEZWNvZGVyVjIpID0+IHtcbiAgY29uc3Qgc3RydWN0cyA9IFtdXG4gIGNvbnN0IHVwZGF0ZURlY29kZXIgPSBuZXcgWURlY29kZXIoZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpKVxuICBjb25zdCBsYXp5RGVjb2RlciA9IG5ldyBMYXp5U3RydWN0UmVhZGVyKHVwZGF0ZURlY29kZXIsIGZhbHNlKVxuICBmb3IgKGxldCBjdXJyID0gbGF6eURlY29kZXIuY3VycjsgY3VyciAhPT0gbnVsbDsgY3VyciA9IGxhenlEZWNvZGVyLm5leHQoKSkge1xuICAgIHN0cnVjdHMucHVzaChjdXJyKVxuICB9XG4gIHJldHVybiB7XG4gICAgc3RydWN0cyxcbiAgICBkczogcmVhZERlbGV0ZVNldCh1cGRhdGVEZWNvZGVyKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMYXp5U3RydWN0V3JpdGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZW5jb2Rlcikge1xuICAgIHRoaXMuY3VyckNsaWVudCA9IDBcbiAgICB0aGlzLnN0YXJ0Q2xvY2sgPSAwXG4gICAgdGhpcy53cml0dGVuID0gMFxuICAgIHRoaXMuZW5jb2RlciA9IGVuY29kZXJcbiAgICAvKipcbiAgICAgKiBXZSB3YW50IHRvIHdyaXRlIG9wZXJhdGlvbnMgbGF6aWx5LCBidXQgYWxzbyB3ZSBuZWVkIHRvIGtub3cgYmVmb3JlaGFuZCBob3cgbWFueSBvcGVyYXRpb25zIHdlIHdhbnQgdG8gd3JpdGUgZm9yIGVhY2ggY2xpZW50LlxuICAgICAqXG4gICAgICogVGhpcyBraW5kIG9mIG1ldGEtaW5mb3JtYXRpb24gKCNjbGllbnRzLCAjc3RydWN0cy1wZXItY2xpZW50LXdyaXR0ZW4pIGlzIHdyaXR0ZW4gdG8gdGhlIHJlc3RFbmNvZGVyLlxuICAgICAqXG4gICAgICogV2UgZnJhZ21lbnQgdGhlIHJlc3RFbmNvZGVyIGFuZCBzdG9yZSBhIHNsaWNlIG9mIGl0IHBlci1jbGllbnQgdW50aWwgd2Uga25vdyBob3cgbWFueSBjbGllbnRzIHRoZXJlIGFyZS5cbiAgICAgKiBXaGVuIHdlIGZsdXNoICh0b1VpbnQ4QXJyYXkpIHdlIHdyaXRlIHRoZSByZXN0RW5jb2RlciB1c2luZyB0aGUgZnJhZ21lbnRzIGFuZCB0aGUgbWV0YS1pbmZvcm1hdGlvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtBcnJheTx7IHdyaXR0ZW46IG51bWJlciwgcmVzdEVuY29kZXI6IFVpbnQ4QXJyYXkgfT59XG4gICAgICovXG4gICAgdGhpcy5jbGllbnRTdHJ1Y3RzID0gW11cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8VWludDhBcnJheT59IHVwZGF0ZXNcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBtZXJnZVVwZGF0ZXMgPSB1cGRhdGVzID0+IG1lcmdlVXBkYXRlc1YyKHVwZGF0ZXMsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRW5jb2RlclYxKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge3R5cGVvZiBEU0VuY29kZXJWMSB8IHR5cGVvZiBEU0VuY29kZXJWMn0gWUVuY29kZXJcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMSB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjJ9IFlEZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgZW5jb2RlU3RhdGVWZWN0b3JGcm9tVXBkYXRlVjIgPSAodXBkYXRlLCBZRW5jb2RlciA9IERTRW5jb2RlclYyLCBZRGVjb2RlciA9IFVwZGF0ZURlY29kZXJWMikgPT4ge1xuICBjb25zdCBlbmNvZGVyID0gbmV3IFlFbmNvZGVyKClcbiAgY29uc3QgdXBkYXRlRGVjb2RlciA9IG5ldyBMYXp5U3RydWN0UmVhZGVyKG5ldyBZRGVjb2RlcihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSkpLCBmYWxzZSlcbiAgbGV0IGN1cnIgPSB1cGRhdGVEZWNvZGVyLmN1cnJcbiAgaWYgKGN1cnIgIT09IG51bGwpIHtcbiAgICBsZXQgc2l6ZSA9IDBcbiAgICBsZXQgY3VyckNsaWVudCA9IGN1cnIuaWQuY2xpZW50XG4gICAgbGV0IHN0b3BDb3VudGluZyA9IGN1cnIuaWQuY2xvY2sgIT09IDAgLy8gbXVzdCBzdGFydCBhdCAwXG4gICAgbGV0IGN1cnJDbG9jayA9IHN0b3BDb3VudGluZyA/IDAgOiBjdXJyLmlkLmNsb2NrICsgY3Vyci5sZW5ndGhcbiAgICBmb3IgKDsgY3VyciAhPT0gbnVsbDsgY3VyciA9IHVwZGF0ZURlY29kZXIubmV4dCgpKSB7XG4gICAgICBpZiAoY3VyckNsaWVudCAhPT0gY3Vyci5pZC5jbGllbnQpIHtcbiAgICAgICAgaWYgKGN1cnJDbG9jayAhPT0gMCkge1xuICAgICAgICAgIHNpemUrK1xuICAgICAgICAgIC8vIFdlIGZvdW5kIGEgbmV3IGNsaWVudFxuICAgICAgICAgIC8vIHdyaXRlIHdoYXQgd2UgaGF2ZSB0byB0aGUgZW5jb2RlclxuICAgICAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCBjdXJyQ2xpZW50KVxuICAgICAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCBjdXJyQ2xvY2spXG4gICAgICAgIH1cbiAgICAgICAgY3VyckNsaWVudCA9IGN1cnIuaWQuY2xpZW50XG4gICAgICAgIGN1cnJDbG9jayA9IDBcbiAgICAgICAgc3RvcENvdW50aW5nID0gY3Vyci5pZC5jbG9jayAhPT0gMFxuICAgICAgfVxuICAgICAgLy8gd2UgaWdub3JlIHNraXBzXG4gICAgICBpZiAoY3Vyci5jb25zdHJ1Y3RvciA9PT0gU2tpcCkge1xuICAgICAgICBzdG9wQ291bnRpbmcgPSB0cnVlXG4gICAgICB9XG4gICAgICBpZiAoIXN0b3BDb3VudGluZykge1xuICAgICAgICBjdXJyQ2xvY2sgPSBjdXJyLmlkLmNsb2NrICsgY3Vyci5sZW5ndGhcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gd3JpdGUgd2hhdCB3ZSBoYXZlXG4gICAgaWYgKGN1cnJDbG9jayAhPT0gMCkge1xuICAgICAgc2l6ZSsrXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgY3VyckNsaWVudClcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCBjdXJyQ2xvY2spXG4gICAgfVxuICAgIC8vIHByZXBlbmQgdGhlIHNpemUgb2YgdGhlIHN0YXRlIHZlY3RvclxuICAgIGNvbnN0IGVuYyA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmMsIHNpemUpXG4gICAgZW5jb2Rpbmcud3JpdGVCaW5hcnlFbmNvZGVyKGVuYywgZW5jb2Rlci5yZXN0RW5jb2RlcilcbiAgICBlbmNvZGVyLnJlc3RFbmNvZGVyID0gZW5jXG4gICAgcmV0dXJuIGVuY29kZXIudG9VaW50OEFycmF5KClcbiAgfSBlbHNlIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgMClcbiAgICByZXR1cm4gZW5jb2Rlci50b1VpbnQ4QXJyYXkoKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTdGF0ZVZlY3RvckZyb21VcGRhdGUgPSB1cGRhdGUgPT4gZW5jb2RlU3RhdGVWZWN0b3JGcm9tVXBkYXRlVjIodXBkYXRlLCBEU0VuY29kZXJWMSwgVXBkYXRlRGVjb2RlclYxKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge3R5cGVvZiBVcGRhdGVEZWNvZGVyVjEgfCB0eXBlb2YgVXBkYXRlRGVjb2RlclYyfSBZRGVjb2RlclxuICogQHJldHVybiB7eyBmcm9tOiBNYXA8bnVtYmVyLG51bWJlcj4sIHRvOiBNYXA8bnVtYmVyLG51bWJlcj4gfX1cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlVXBkYXRlTWV0YVYyID0gKHVwZGF0ZSwgWURlY29kZXIgPSBVcGRhdGVEZWNvZGVyVjIpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtNYXA8bnVtYmVyLCBudW1iZXI+fVxuICAgKi9cbiAgY29uc3QgZnJvbSA9IG5ldyBNYXAoKVxuICAvKipcbiAgICogQHR5cGUge01hcDxudW1iZXIsIG51bWJlcj59XG4gICAqL1xuICBjb25zdCB0byA9IG5ldyBNYXAoKVxuICBjb25zdCB1cGRhdGVEZWNvZGVyID0gbmV3IExhenlTdHJ1Y3RSZWFkZXIobmV3IFlEZWNvZGVyKGRlY29kaW5nLmNyZWF0ZURlY29kZXIodXBkYXRlKSksIGZhbHNlKVxuICBsZXQgY3VyciA9IHVwZGF0ZURlY29kZXIuY3VyclxuICBpZiAoY3VyciAhPT0gbnVsbCkge1xuICAgIGxldCBjdXJyQ2xpZW50ID0gY3Vyci5pZC5jbGllbnRcbiAgICBsZXQgY3VyckNsb2NrID0gY3Vyci5pZC5jbG9ja1xuICAgIC8vIHdyaXRlIHRoZSBiZWdpbm5pbmcgdG8gYGZyb21gXG4gICAgZnJvbS5zZXQoY3VyckNsaWVudCwgY3VyckNsb2NrKVxuICAgIGZvciAoOyBjdXJyICE9PSBudWxsOyBjdXJyID0gdXBkYXRlRGVjb2Rlci5uZXh0KCkpIHtcbiAgICAgIGlmIChjdXJyQ2xpZW50ICE9PSBjdXJyLmlkLmNsaWVudCkge1xuICAgICAgICAvLyBXZSBmb3VuZCBhIG5ldyBjbGllbnRcbiAgICAgICAgLy8gd3JpdGUgdGhlIGVuZCB0byBgdG9gXG4gICAgICAgIHRvLnNldChjdXJyQ2xpZW50LCBjdXJyQ2xvY2spXG4gICAgICAgIC8vIHdyaXRlIHRoZSBiZWdpbm5pbmcgdG8gYGZyb21gXG4gICAgICAgIGZyb20uc2V0KGN1cnIuaWQuY2xpZW50LCBjdXJyLmlkLmNsb2NrKVxuICAgICAgICAvLyB1cGRhdGUgY3VyckNsaWVudFxuICAgICAgICBjdXJyQ2xpZW50ID0gY3Vyci5pZC5jbGllbnRcbiAgICAgIH1cbiAgICAgIGN1cnJDbG9jayA9IGN1cnIuaWQuY2xvY2sgKyBjdXJyLmxlbmd0aFxuICAgIH1cbiAgICAvLyB3cml0ZSB0aGUgZW5kIHRvIGB0b2BcbiAgICB0by5zZXQoY3VyckNsaWVudCwgY3VyckNsb2NrKVxuICB9XG4gIHJldHVybiB7IGZyb20sIHRvIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICogQHJldHVybiB7eyBmcm9tOiBNYXA8bnVtYmVyLG51bWJlcj4sIHRvOiBNYXA8bnVtYmVyLG51bWJlcj4gfX1cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlVXBkYXRlTWV0YSA9IHVwZGF0ZSA9PiBwYXJzZVVwZGF0ZU1ldGFWMih1cGRhdGUsIFVwZGF0ZURlY29kZXJWMSlcblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyBpbnRlbmRlZCB0byBzbGljZSBhbnkga2luZCBvZiBzdHJ1Y3QgYW5kIHJldHJpZXZlIHRoZSByaWdodCBwYXJ0LlxuICogSXQgZG9lcyBub3QgaGFuZGxlIHNpZGUtZWZmZWN0cywgc28gaXQgc2hvdWxkIG9ubHkgYmUgdXNlZCBieSB0aGUgbGF6eS1lbmNvZGVyLlxuICpcbiAqIEBwYXJhbSB7SXRlbSB8IEdDIHwgU2tpcH0gbGVmdFxuICogQHBhcmFtIHtudW1iZXJ9IGRpZmZcbiAqIEByZXR1cm4ge0l0ZW0gfCBHQ31cbiAqL1xuY29uc3Qgc2xpY2VTdHJ1Y3QgPSAobGVmdCwgZGlmZikgPT4ge1xuICBpZiAobGVmdC5jb25zdHJ1Y3RvciA9PT0gR0MpIHtcbiAgICBjb25zdCB7IGNsaWVudCwgY2xvY2sgfSA9IGxlZnQuaWRcbiAgICByZXR1cm4gbmV3IEdDKGNyZWF0ZUlEKGNsaWVudCwgY2xvY2sgKyBkaWZmKSwgbGVmdC5sZW5ndGggLSBkaWZmKVxuICB9IGVsc2UgaWYgKGxlZnQuY29uc3RydWN0b3IgPT09IFNraXApIHtcbiAgICBjb25zdCB7IGNsaWVudCwgY2xvY2sgfSA9IGxlZnQuaWRcbiAgICByZXR1cm4gbmV3IFNraXAoY3JlYXRlSUQoY2xpZW50LCBjbG9jayArIGRpZmYpLCBsZWZ0Lmxlbmd0aCAtIGRpZmYpXG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbGVmdEl0ZW0gPSAvKiogQHR5cGUge0l0ZW19ICovIChsZWZ0KVxuICAgIGNvbnN0IHsgY2xpZW50LCBjbG9jayB9ID0gbGVmdEl0ZW0uaWRcbiAgICByZXR1cm4gbmV3IEl0ZW0oXG4gICAgICBjcmVhdGVJRChjbGllbnQsIGNsb2NrICsgZGlmZiksXG4gICAgICBudWxsLFxuICAgICAgY3JlYXRlSUQoY2xpZW50LCBjbG9jayArIGRpZmYgLSAxKSxcbiAgICAgIG51bGwsXG4gICAgICBsZWZ0SXRlbS5yaWdodE9yaWdpbixcbiAgICAgIGxlZnRJdGVtLnBhcmVudCxcbiAgICAgIGxlZnRJdGVtLnBhcmVudFN1YixcbiAgICAgIGxlZnRJdGVtLmNvbnRlbnQuc3BsaWNlKGRpZmYpXG4gICAgKVxuICB9XG59XG5cbi8qKlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd29ya3Mgc2ltaWxhcmx5IHRvIGByZWFkVXBkYXRlVjJgLlxuICpcbiAqIEBwYXJhbSB7QXJyYXk8VWludDhBcnJheT59IHVwZGF0ZXNcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMSB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjJ9IFtZRGVjb2Rlcl1cbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZUVuY29kZXJWMSB8IHR5cGVvZiBVcGRhdGVFbmNvZGVyVjJ9IFtZRW5jb2Rlcl1cbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBtZXJnZVVwZGF0ZXNWMiA9ICh1cGRhdGVzLCBZRGVjb2RlciA9IFVwZGF0ZURlY29kZXJWMiwgWUVuY29kZXIgPSBVcGRhdGVFbmNvZGVyVjIpID0+IHtcbiAgaWYgKHVwZGF0ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIHVwZGF0ZXNbMF1cbiAgfVxuICBjb25zdCB1cGRhdGVEZWNvZGVycyA9IHVwZGF0ZXMubWFwKHVwZGF0ZSA9PiBuZXcgWURlY29kZXIoZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpKSlcbiAgbGV0IGxhenlTdHJ1Y3REZWNvZGVycyA9IHVwZGF0ZURlY29kZXJzLm1hcChkZWNvZGVyID0+IG5ldyBMYXp5U3RydWN0UmVhZGVyKGRlY29kZXIsIHRydWUpKVxuXG4gIC8qKlxuICAgKiBAdG9kbyB3ZSBkb24ndCBuZWVkIG9mZnNldCBiZWNhdXNlIHdlIGFsd2F5cyBzbGljZSBiZWZvcmVcbiAgICogQHR5cGUge251bGwgfCB7IHN0cnVjdDogSXRlbSB8IEdDIHwgU2tpcCwgb2Zmc2V0OiBudW1iZXIgfX1cbiAgICovXG4gIGxldCBjdXJyV3JpdGUgPSBudWxsXG5cbiAgY29uc3QgdXBkYXRlRW5jb2RlciA9IG5ldyBZRW5jb2RlcigpXG4gIC8vIHdyaXRlIHN0cnVjdHMgbGF6aWx5XG4gIGNvbnN0IGxhenlTdHJ1Y3RFbmNvZGVyID0gbmV3IExhenlTdHJ1Y3RXcml0ZXIodXBkYXRlRW5jb2RlcilcblxuICAvLyBOb3RlOiBXZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGFsbCBsYXp5U3RydWN0RGVjb2RlcnMgYXJlIGZ1bGx5IGNvbnN1bWVkXG4gIC8vIE5vdGU6IFNob3VsZCBtZXJnZSBkb2N1bWVudCB1cGRhdGVzIHdoZW5ldmVyIHBvc3NpYmxlIC0gZXZlbiBmcm9tIGRpZmZlcmVudCB1cGRhdGVzXG4gIC8vIE5vdGU6IFNob3VsZCBoYW5kbGUgdGhhdCBzb21lIG9wZXJhdGlvbnMgY2Fubm90IGJlIGFwcGxpZWQgeWV0ICgpXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICAvLyBXcml0ZSBoaWdoZXIgY2xpZW50cyBmaXJzdCBcdTIxRDIgc29ydCBieSBjbGllbnRJRCAmIGNsb2NrIGFuZCByZW1vdmUgZGVjb2RlcnMgd2l0aG91dCBjb250ZW50XG4gICAgbGF6eVN0cnVjdERlY29kZXJzID0gbGF6eVN0cnVjdERlY29kZXJzLmZpbHRlcihkZWMgPT4gZGVjLmN1cnIgIT09IG51bGwpXG4gICAgbGF6eVN0cnVjdERlY29kZXJzLnNvcnQoXG4gICAgICAvKiogQHR5cGUge2Z1bmN0aW9uKGFueSxhbnkpOm51bWJlcn0gKi8gKGRlYzEsIGRlYzIpID0+IHtcbiAgICAgICAgaWYgKGRlYzEuY3Vyci5pZC5jbGllbnQgPT09IGRlYzIuY3Vyci5pZC5jbGllbnQpIHtcbiAgICAgICAgICBjb25zdCBjbG9ja0RpZmYgPSBkZWMxLmN1cnIuaWQuY2xvY2sgLSBkZWMyLmN1cnIuaWQuY2xvY2tcbiAgICAgICAgICBpZiAoY2xvY2tEaWZmID09PSAwKSB7XG4gICAgICAgICAgICAvLyBAdG9kbyByZW1vdmUgcmVmZXJlbmNlcyB0byBza2lwIHNpbmNlIHRoZSBzdHJ1Y3REZWNvZGVycyBtdXN0IGZpbHRlciBTa2lwcy5cbiAgICAgICAgICAgIHJldHVybiBkZWMxLmN1cnIuY29uc3RydWN0b3IgPT09IGRlYzIuY3Vyci5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgOiBkZWMxLmN1cnIuY29uc3RydWN0b3IgPT09IFNraXAgPyAxIDogLTEgLy8gd2UgYXJlIGZpbHRlcmluZyBza2lwcyBhbnl3YXkuXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjbG9ja0RpZmZcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGRlYzIuY3Vyci5pZC5jbGllbnQgLSBkZWMxLmN1cnIuaWQuY2xpZW50XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gICAgaWYgKGxhenlTdHJ1Y3REZWNvZGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNvbnN0IGN1cnJEZWNvZGVyID0gbGF6eVN0cnVjdERlY29kZXJzWzBdXG4gICAgLy8gd3JpdGUgZnJvbSBjdXJyRGVjb2RlciB1bnRpbCB0aGUgbmV4dCBvcGVyYXRpb24gaXMgZnJvbSBhbm90aGVyIGNsaWVudCBvciBpZiBmaWxsZXItc3RydWN0XG4gICAgLy8gdGhlbiB3ZSBuZWVkIHRvIHJlb3JkZXIgdGhlIGRlY29kZXJzIGFuZCBmaW5kIHRoZSBuZXh0IG9wZXJhdGlvbiB0byB3cml0ZVxuICAgIGNvbnN0IGZpcnN0Q2xpZW50ID0gLyoqIEB0eXBlIHtJdGVtIHwgR0N9ICovIChjdXJyRGVjb2Rlci5jdXJyKS5pZC5jbGllbnRcblxuICAgIGlmIChjdXJyV3JpdGUgIT09IG51bGwpIHtcbiAgICAgIGxldCBjdXJyID0gLyoqIEB0eXBlIHtJdGVtIHwgR0MgfCBudWxsfSAqLyAoY3VyckRlY29kZXIuY3VycilcbiAgICAgIGxldCBpdGVyYXRlZCA9IGZhbHNlXG5cbiAgICAgIC8vIGl0ZXJhdGUgdW50aWwgd2UgZmluZCBzb21ldGhpbmcgdGhhdCB3ZSBoYXZlbid0IHdyaXR0ZW4gYWxyZWFkeVxuICAgICAgLy8gcmVtZW1iZXI6IGZpcnN0IHRoZSBoaWdoIGNsaWVudC1pZHMgYXJlIHdyaXR0ZW5cbiAgICAgIHdoaWxlIChjdXJyICE9PSBudWxsICYmIGN1cnIuaWQuY2xvY2sgKyBjdXJyLmxlbmd0aCA8PSBjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrICsgY3VycldyaXRlLnN0cnVjdC5sZW5ndGggJiYgY3Vyci5pZC5jbGllbnQgPj0gY3VycldyaXRlLnN0cnVjdC5pZC5jbGllbnQpIHtcbiAgICAgICAgY3VyciA9IGN1cnJEZWNvZGVyLm5leHQoKVxuICAgICAgICBpdGVyYXRlZCA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgY3VyciA9PT0gbnVsbCB8fCAvLyBjdXJyZW50IGRlY29kZXIgaXMgZW1wdHlcbiAgICAgICAgY3Vyci5pZC5jbGllbnQgIT09IGZpcnN0Q2xpZW50IHx8IC8vIGNoZWNrIHdoZXRoZXIgdGhlcmUgaXMgYW5vdGhlciBkZWNvZGVyIHRoYXQgaGFzIGhhcyB1cGRhdGVzIGZyb20gYGZpcnN0Q2xpZW50YFxuICAgICAgICAoaXRlcmF0ZWQgJiYgY3Vyci5pZC5jbG9jayA+IGN1cnJXcml0ZS5zdHJ1Y3QuaWQuY2xvY2sgKyBjdXJyV3JpdGUuc3RydWN0Lmxlbmd0aCkgLy8gdGhlIGFib3ZlIHdoaWxlIGxvb3Agd2FzIHVzZWQgYW5kIHdlIGFyZSBwb3RlbnRpYWxseSBtaXNzaW5nIHVwZGF0ZXNcbiAgICAgICkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZiAoZmlyc3RDbGllbnQgIT09IGN1cnJXcml0ZS5zdHJ1Y3QuaWQuY2xpZW50KSB7XG4gICAgICAgIHdyaXRlU3RydWN0VG9MYXp5U3RydWN0V3JpdGVyKGxhenlTdHJ1Y3RFbmNvZGVyLCBjdXJyV3JpdGUuc3RydWN0LCBjdXJyV3JpdGUub2Zmc2V0KVxuICAgICAgICBjdXJyV3JpdGUgPSB7IHN0cnVjdDogY3Vyciwgb2Zmc2V0OiAwIH1cbiAgICAgICAgY3VyckRlY29kZXIubmV4dCgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY3VycldyaXRlLnN0cnVjdC5pZC5jbG9jayArIGN1cnJXcml0ZS5zdHJ1Y3QubGVuZ3RoIDwgY3Vyci5pZC5jbG9jaykge1xuICAgICAgICAgIC8vIEB0b2RvIHdyaXRlIGN1cnJTdHJ1Y3QgJiBzZXQgY3VyclN0cnVjdCA9IFNraXAoY2xvY2sgPSBjdXJyU3RydWN0LmlkLmNsb2NrICsgY3VyclN0cnVjdC5sZW5ndGgsIGxlbmd0aCA9IGN1cnIuaWQuY2xvY2sgLSBzZWxmLmNsb2NrKVxuICAgICAgICAgIGlmIChjdXJyV3JpdGUuc3RydWN0LmNvbnN0cnVjdG9yID09PSBTa2lwKSB7XG4gICAgICAgICAgICAvLyBleHRlbmQgZXhpc3Rpbmcgc2tpcFxuICAgICAgICAgICAgY3VycldyaXRlLnN0cnVjdC5sZW5ndGggPSBjdXJyLmlkLmNsb2NrICsgY3Vyci5sZW5ndGggLSBjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdyaXRlU3RydWN0VG9MYXp5U3RydWN0V3JpdGVyKGxhenlTdHJ1Y3RFbmNvZGVyLCBjdXJyV3JpdGUuc3RydWN0LCBjdXJyV3JpdGUub2Zmc2V0KVxuICAgICAgICAgICAgY29uc3QgZGlmZiA9IGN1cnIuaWQuY2xvY2sgLSBjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrIC0gY3VycldyaXRlLnN0cnVjdC5sZW5ndGhcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHR5cGUge1NraXB9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0IHN0cnVjdCA9IG5ldyBTa2lwKGNyZWF0ZUlEKGZpcnN0Q2xpZW50LCBjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrICsgY3VycldyaXRlLnN0cnVjdC5sZW5ndGgpLCBkaWZmKVxuICAgICAgICAgICAgY3VycldyaXRlID0geyBzdHJ1Y3QsIG9mZnNldDogMCB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyAvLyBpZiAoY3VycldyaXRlLnN0cnVjdC5pZC5jbG9jayArIGN1cnJXcml0ZS5zdHJ1Y3QubGVuZ3RoID49IGN1cnIuaWQuY2xvY2spIHtcbiAgICAgICAgICBjb25zdCBkaWZmID0gY3VycldyaXRlLnN0cnVjdC5pZC5jbG9jayArIGN1cnJXcml0ZS5zdHJ1Y3QubGVuZ3RoIC0gY3Vyci5pZC5jbG9ja1xuICAgICAgICAgIGlmIChkaWZmID4gMCkge1xuICAgICAgICAgICAgaWYgKGN1cnJXcml0ZS5zdHJ1Y3QuY29uc3RydWN0b3IgPT09IFNraXApIHtcbiAgICAgICAgICAgICAgLy8gcHJlZmVyIHRvIHNsaWNlIFNraXAgYmVjYXVzZSB0aGUgb3RoZXIgc3RydWN0IG1pZ2h0IGNvbnRhaW4gbW9yZSBpbmZvcm1hdGlvblxuICAgICAgICAgICAgICBjdXJyV3JpdGUuc3RydWN0Lmxlbmd0aCAtPSBkaWZmXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjdXJyID0gc2xpY2VTdHJ1Y3QoY3VyciwgZGlmZilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFjdXJyV3JpdGUuc3RydWN0Lm1lcmdlV2l0aCgvKiogQHR5cGUge2FueX0gKi8gKGN1cnIpKSkge1xuICAgICAgICAgICAgd3JpdGVTdHJ1Y3RUb0xhenlTdHJ1Y3RXcml0ZXIobGF6eVN0cnVjdEVuY29kZXIsIGN1cnJXcml0ZS5zdHJ1Y3QsIGN1cnJXcml0ZS5vZmZzZXQpXG4gICAgICAgICAgICBjdXJyV3JpdGUgPSB7IHN0cnVjdDogY3Vyciwgb2Zmc2V0OiAwIH1cbiAgICAgICAgICAgIGN1cnJEZWNvZGVyLm5leHQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyV3JpdGUgPSB7IHN0cnVjdDogLyoqIEB0eXBlIHtJdGVtIHwgR0N9ICovIChjdXJyRGVjb2Rlci5jdXJyKSwgb2Zmc2V0OiAwIH1cbiAgICAgIGN1cnJEZWNvZGVyLm5leHQoKVxuICAgIH1cbiAgICBmb3IgKFxuICAgICAgbGV0IG5leHQgPSBjdXJyRGVjb2Rlci5jdXJyO1xuICAgICAgbmV4dCAhPT0gbnVsbCAmJiBuZXh0LmlkLmNsaWVudCA9PT0gZmlyc3RDbGllbnQgJiYgbmV4dC5pZC5jbG9jayA9PT0gY3VycldyaXRlLnN0cnVjdC5pZC5jbG9jayArIGN1cnJXcml0ZS5zdHJ1Y3QubGVuZ3RoICYmIG5leHQuY29uc3RydWN0b3IgIT09IFNraXA7XG4gICAgICBuZXh0ID0gY3VyckRlY29kZXIubmV4dCgpXG4gICAgKSB7XG4gICAgICB3cml0ZVN0cnVjdFRvTGF6eVN0cnVjdFdyaXRlcihsYXp5U3RydWN0RW5jb2RlciwgY3VycldyaXRlLnN0cnVjdCwgY3VycldyaXRlLm9mZnNldClcbiAgICAgIGN1cnJXcml0ZSA9IHsgc3RydWN0OiBuZXh0LCBvZmZzZXQ6IDAgfVxuICAgIH1cbiAgfVxuICBpZiAoY3VycldyaXRlICE9PSBudWxsKSB7XG4gICAgd3JpdGVTdHJ1Y3RUb0xhenlTdHJ1Y3RXcml0ZXIobGF6eVN0cnVjdEVuY29kZXIsIGN1cnJXcml0ZS5zdHJ1Y3QsIGN1cnJXcml0ZS5vZmZzZXQpXG4gICAgY3VycldyaXRlID0gbnVsbFxuICB9XG4gIGZpbmlzaExhenlTdHJ1Y3RXcml0aW5nKGxhenlTdHJ1Y3RFbmNvZGVyKVxuXG4gIGNvbnN0IGRzcyA9IHVwZGF0ZURlY29kZXJzLm1hcChkZWNvZGVyID0+IHJlYWREZWxldGVTZXQoZGVjb2RlcikpXG4gIGNvbnN0IGRzID0gbWVyZ2VEZWxldGVTZXRzKGRzcylcbiAgd3JpdGVEZWxldGVTZXQodXBkYXRlRW5jb2RlciwgZHMpXG4gIHJldHVybiB1cGRhdGVFbmNvZGVyLnRvVWludDhBcnJheSgpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gc3ZcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMSB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjJ9IFtZRGVjb2Rlcl1cbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZUVuY29kZXJWMSB8IHR5cGVvZiBVcGRhdGVFbmNvZGVyVjJ9IFtZRW5jb2Rlcl1cbiAqL1xuZXhwb3J0IGNvbnN0IGRpZmZVcGRhdGVWMiA9ICh1cGRhdGUsIHN2LCBZRGVjb2RlciA9IFVwZGF0ZURlY29kZXJWMiwgWUVuY29kZXIgPSBVcGRhdGVFbmNvZGVyVjIpID0+IHtcbiAgY29uc3Qgc3RhdGUgPSBkZWNvZGVTdGF0ZVZlY3RvcihzdilcbiAgY29uc3QgZW5jb2RlciA9IG5ldyBZRW5jb2RlcigpXG4gIGNvbnN0IGxhenlTdHJ1Y3RXcml0ZXIgPSBuZXcgTGF6eVN0cnVjdFdyaXRlcihlbmNvZGVyKVxuICBjb25zdCBkZWNvZGVyID0gbmV3IFlEZWNvZGVyKGRlY29kaW5nLmNyZWF0ZURlY29kZXIodXBkYXRlKSlcbiAgY29uc3QgcmVhZGVyID0gbmV3IExhenlTdHJ1Y3RSZWFkZXIoZGVjb2RlciwgZmFsc2UpXG4gIHdoaWxlIChyZWFkZXIuY3Vycikge1xuICAgIGNvbnN0IGN1cnIgPSByZWFkZXIuY3VyclxuICAgIGNvbnN0IGN1cnJDbGllbnQgPSBjdXJyLmlkLmNsaWVudFxuICAgIGNvbnN0IHN2Q2xvY2sgPSBzdGF0ZS5nZXQoY3VyckNsaWVudCkgfHwgMFxuICAgIGlmIChyZWFkZXIuY3Vyci5jb25zdHJ1Y3RvciA9PT0gU2tpcCkge1xuICAgICAgLy8gdGhlIGZpcnN0IHdyaXR0ZW4gc3RydWN0IHNob3VsZG4ndCBiZSBhIHNraXBcbiAgICAgIHJlYWRlci5uZXh0KClcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIGlmIChjdXJyLmlkLmNsb2NrICsgY3Vyci5sZW5ndGggPiBzdkNsb2NrKSB7XG4gICAgICB3cml0ZVN0cnVjdFRvTGF6eVN0cnVjdFdyaXRlcihsYXp5U3RydWN0V3JpdGVyLCBjdXJyLCBtYXRoLm1heChzdkNsb2NrIC0gY3Vyci5pZC5jbG9jaywgMCkpXG4gICAgICByZWFkZXIubmV4dCgpXG4gICAgICB3aGlsZSAocmVhZGVyLmN1cnIgJiYgcmVhZGVyLmN1cnIuaWQuY2xpZW50ID09PSBjdXJyQ2xpZW50KSB7XG4gICAgICAgIHdyaXRlU3RydWN0VG9MYXp5U3RydWN0V3JpdGVyKGxhenlTdHJ1Y3RXcml0ZXIsIHJlYWRlci5jdXJyLCAwKVxuICAgICAgICByZWFkZXIubmV4dCgpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHJlYWQgdW50aWwgc29tZXRoaW5nIG5ldyBjb21lcyB1cFxuICAgICAgd2hpbGUgKHJlYWRlci5jdXJyICYmIHJlYWRlci5jdXJyLmlkLmNsaWVudCA9PT0gY3VyckNsaWVudCAmJiByZWFkZXIuY3Vyci5pZC5jbG9jayArIHJlYWRlci5jdXJyLmxlbmd0aCA8PSBzdkNsb2NrKSB7XG4gICAgICAgIHJlYWRlci5uZXh0KClcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZmluaXNoTGF6eVN0cnVjdFdyaXRpbmcobGF6eVN0cnVjdFdyaXRlcilcbiAgLy8gd3JpdGUgZHNcbiAgY29uc3QgZHMgPSByZWFkRGVsZXRlU2V0KGRlY29kZXIpXG4gIHdyaXRlRGVsZXRlU2V0KGVuY29kZXIsIGRzKVxuICByZXR1cm4gZW5jb2Rlci50b1VpbnQ4QXJyYXkoKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHN2XG4gKi9cbmV4cG9ydCBjb25zdCBkaWZmVXBkYXRlID0gKHVwZGF0ZSwgc3YpID0+IGRpZmZVcGRhdGVWMih1cGRhdGUsIHN2LCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMSlcblxuLyoqXG4gKiBAcGFyYW0ge0xhenlTdHJ1Y3RXcml0ZXJ9IGxhenlXcml0ZXJcbiAqL1xuY29uc3QgZmx1c2hMYXp5U3RydWN0V3JpdGVyID0gbGF6eVdyaXRlciA9PiB7XG4gIGlmIChsYXp5V3JpdGVyLndyaXR0ZW4gPiAwKSB7XG4gICAgbGF6eVdyaXRlci5jbGllbnRTdHJ1Y3RzLnB1c2goeyB3cml0dGVuOiBsYXp5V3JpdGVyLndyaXR0ZW4sIHJlc3RFbmNvZGVyOiBlbmNvZGluZy50b1VpbnQ4QXJyYXkobGF6eVdyaXRlci5lbmNvZGVyLnJlc3RFbmNvZGVyKSB9KVxuICAgIGxhenlXcml0ZXIuZW5jb2Rlci5yZXN0RW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGxhenlXcml0ZXIud3JpdHRlbiA9IDBcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7TGF6eVN0cnVjdFdyaXRlcn0gbGF6eVdyaXRlclxuICogQHBhcmFtIHtJdGVtIHwgR0N9IHN0cnVjdFxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICovXG5jb25zdCB3cml0ZVN0cnVjdFRvTGF6eVN0cnVjdFdyaXRlciA9IChsYXp5V3JpdGVyLCBzdHJ1Y3QsIG9mZnNldCkgPT4ge1xuICAvLyBmbHVzaCBjdXJyIGlmIHdlIHN0YXJ0IGFub3RoZXIgY2xpZW50XG4gIGlmIChsYXp5V3JpdGVyLndyaXR0ZW4gPiAwICYmIGxhenlXcml0ZXIuY3VyckNsaWVudCAhPT0gc3RydWN0LmlkLmNsaWVudCkge1xuICAgIGZsdXNoTGF6eVN0cnVjdFdyaXRlcihsYXp5V3JpdGVyKVxuICB9XG4gIGlmIChsYXp5V3JpdGVyLndyaXR0ZW4gPT09IDApIHtcbiAgICBsYXp5V3JpdGVyLmN1cnJDbGllbnQgPSBzdHJ1Y3QuaWQuY2xpZW50XG4gICAgLy8gd3JpdGUgbmV4dCBjbGllbnRcbiAgICBsYXp5V3JpdGVyLmVuY29kZXIud3JpdGVDbGllbnQoc3RydWN0LmlkLmNsaWVudClcbiAgICAvLyB3cml0ZSBzdGFydENsb2NrXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGxhenlXcml0ZXIuZW5jb2Rlci5yZXN0RW5jb2Rlciwgc3RydWN0LmlkLmNsb2NrICsgb2Zmc2V0KVxuICB9XG4gIHN0cnVjdC53cml0ZShsYXp5V3JpdGVyLmVuY29kZXIsIG9mZnNldClcbiAgbGF6eVdyaXRlci53cml0dGVuKytcbn1cbi8qKlxuICogQ2FsbCB0aGlzIGZ1bmN0aW9uIHdoZW4gd2UgY29sbGVjdGVkIGFsbCBwYXJ0cyBhbmQgd2FudCB0b1xuICogcHV0IGFsbCB0aGUgcGFydHMgdG9nZXRoZXIuIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsXG4gKiB5b3UgY2FuIGNvbnRpbnVlIHVzaW5nIHRoZSBVcGRhdGVFbmNvZGVyLlxuICpcbiAqIEBwYXJhbSB7TGF6eVN0cnVjdFdyaXRlcn0gbGF6eVdyaXRlclxuICovXG5jb25zdCBmaW5pc2hMYXp5U3RydWN0V3JpdGluZyA9IChsYXp5V3JpdGVyKSA9PiB7XG4gIGZsdXNoTGF6eVN0cnVjdFdyaXRlcihsYXp5V3JpdGVyKVxuXG4gIC8vIHRoaXMgaXMgYSBmcmVzaCBlbmNvZGVyIGJlY2F1c2Ugd2UgY2FsbGVkIGZsdXNoQ3VyclxuICBjb25zdCByZXN0RW5jb2RlciA9IGxhenlXcml0ZXIuZW5jb2Rlci5yZXN0RW5jb2RlclxuXG4gIC8qKlxuICAgKiBOb3cgd2UgcHV0IGFsbCB0aGUgZnJhZ21lbnRzIHRvZ2V0aGVyLlxuICAgKiBUaGlzIHdvcmtzIHNpbWlsYXJseSB0byBgd3JpdGVDbGllbnRzU3RydWN0c2BcbiAgICovXG5cbiAgLy8gd3JpdGUgIyBzdGF0ZXMgdGhhdCB3ZXJlIHVwZGF0ZWQgLSBpLmUuIHRoZSBjbGllbnRzXG4gIGVuY29kaW5nLndyaXRlVmFyVWludChyZXN0RW5jb2RlciwgbGF6eVdyaXRlci5jbGllbnRTdHJ1Y3RzLmxlbmd0aClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxhenlXcml0ZXIuY2xpZW50U3RydWN0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHBhcnRTdHJ1Y3RzID0gbGF6eVdyaXRlci5jbGllbnRTdHJ1Y3RzW2ldXG4gICAgLyoqXG4gICAgICogV29ya3Mgc2ltaWxhcmx5IHRvIGB3cml0ZVN0cnVjdHNgXG4gICAgICovXG4gICAgLy8gd3JpdGUgIyBlbmNvZGVkIHN0cnVjdHNcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQocmVzdEVuY29kZXIsIHBhcnRTdHJ1Y3RzLndyaXR0ZW4pXG4gICAgLy8gd3JpdGUgdGhlIHJlc3Qgb2YgdGhlIGZyYWdtZW50XG4gICAgZW5jb2Rpbmcud3JpdGVVaW50OEFycmF5KHJlc3RFbmNvZGVyLCBwYXJ0U3RydWN0cy5yZXN0RW5jb2RlcilcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEl0ZW18R0N8U2tpcCk6SXRlbXxHQ3xTa2lwfSBibG9ja1RyYW5zZm9ybWVyXG4gKiBAcGFyYW0ge3R5cGVvZiBVcGRhdGVEZWNvZGVyVjIgfCB0eXBlb2YgVXBkYXRlRGVjb2RlclYxfSBZRGVjb2RlclxuICogQHBhcmFtIHt0eXBlb2YgVXBkYXRlRW5jb2RlclYyIHwgdHlwZW9mIFVwZGF0ZUVuY29kZXJWMSB9IFlFbmNvZGVyXG4gKi9cbmV4cG9ydCBjb25zdCBjb252ZXJ0VXBkYXRlRm9ybWF0ID0gKHVwZGF0ZSwgYmxvY2tUcmFuc2Zvcm1lciwgWURlY29kZXIsIFlFbmNvZGVyKSA9PiB7XG4gIGNvbnN0IHVwZGF0ZURlY29kZXIgPSBuZXcgWURlY29kZXIoZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpKVxuICBjb25zdCBsYXp5RGVjb2RlciA9IG5ldyBMYXp5U3RydWN0UmVhZGVyKHVwZGF0ZURlY29kZXIsIGZhbHNlKVxuICBjb25zdCB1cGRhdGVFbmNvZGVyID0gbmV3IFlFbmNvZGVyKClcbiAgY29uc3QgbGF6eVdyaXRlciA9IG5ldyBMYXp5U3RydWN0V3JpdGVyKHVwZGF0ZUVuY29kZXIpXG4gIGZvciAobGV0IGN1cnIgPSBsYXp5RGVjb2Rlci5jdXJyOyBjdXJyICE9PSBudWxsOyBjdXJyID0gbGF6eURlY29kZXIubmV4dCgpKSB7XG4gICAgd3JpdGVTdHJ1Y3RUb0xhenlTdHJ1Y3RXcml0ZXIobGF6eVdyaXRlciwgYmxvY2tUcmFuc2Zvcm1lcihjdXJyKSwgMClcbiAgfVxuICBmaW5pc2hMYXp5U3RydWN0V3JpdGluZyhsYXp5V3JpdGVyKVxuICBjb25zdCBkcyA9IHJlYWREZWxldGVTZXQodXBkYXRlRGVjb2RlcilcbiAgd3JpdGVEZWxldGVTZXQodXBkYXRlRW5jb2RlciwgZHMpXG4gIHJldHVybiB1cGRhdGVFbmNvZGVyLnRvVWludDhBcnJheSgpXG59XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gT2JmdXNjYXRvck9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW09iZnVzY2F0b3JPcHRpb25zLmZvcm1hdHRpbmc9dHJ1ZV1cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW09iZnVzY2F0b3JPcHRpb25zLnN1YmRvY3M9dHJ1ZV1cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW09iZnVzY2F0b3JPcHRpb25zLnl4bWw9dHJ1ZV0gV2hldGhlciB0byBvYmZ1c2NhdGUgbm9kZU5hbWUgLyBob29rTmFtZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtPYmZ1c2NhdG9yT3B0aW9uc30gb2JmdXNjYXRvclxuICovXG5jb25zdCBjcmVhdGVPYmZ1c2NhdG9yID0gKHsgZm9ybWF0dGluZyA9IHRydWUsIHN1YmRvY3MgPSB0cnVlLCB5eG1sID0gdHJ1ZSB9ID0ge30pID0+IHtcbiAgbGV0IGkgPSAwXG4gIGNvbnN0IG1hcEtleUNhY2hlID0gbWFwLmNyZWF0ZSgpXG4gIGNvbnN0IG5vZGVOYW1lQ2FjaGUgPSBtYXAuY3JlYXRlKClcbiAgY29uc3QgZm9ybWF0dGluZ0tleUNhY2hlID0gbWFwLmNyZWF0ZSgpXG4gIGNvbnN0IGZvcm1hdHRpbmdWYWx1ZUNhY2hlID0gbWFwLmNyZWF0ZSgpXG4gIGZvcm1hdHRpbmdWYWx1ZUNhY2hlLnNldChudWxsLCBudWxsKSAvLyBlbmQgb2YgYSBmb3JtYXR0aW5nIHJhbmdlIHNob3VsZCBhbHdheXMgYmUgdGhlIGVuZCBvZiBhIGZvcm1hdHRpbmcgcmFuZ2VcbiAgLyoqXG4gICAqIEBwYXJhbSB7SXRlbXxHQ3xTa2lwfSBibG9ja1xuICAgKiBAcmV0dXJuIHtJdGVtfEdDfFNraXB9XG4gICAqL1xuICByZXR1cm4gYmxvY2sgPT4ge1xuICAgIHN3aXRjaCAoYmxvY2suY29uc3RydWN0b3IpIHtcbiAgICAgIGNhc2UgR0M6XG4gICAgICBjYXNlIFNraXA6XG4gICAgICAgIHJldHVybiBibG9ja1xuICAgICAgY2FzZSBJdGVtOiB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSAvKiogQHR5cGUge0l0ZW19ICovIChibG9jaylcbiAgICAgICAgY29uc3QgY29udGVudCA9IGl0ZW0uY29udGVudFxuICAgICAgICBzd2l0Y2ggKGNvbnRlbnQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICBjYXNlIENvbnRlbnREZWxldGVkOlxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIENvbnRlbnRUeXBlOiB7XG4gICAgICAgICAgICBpZiAoeXhtbCkge1xuICAgICAgICAgICAgICBjb25zdCB0eXBlID0gLyoqIEB0eXBlIHtDb250ZW50VHlwZX0gKi8gKGNvbnRlbnQpLnR5cGVcbiAgICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBZWG1sRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHR5cGUubm9kZU5hbWUgPSBtYXAuc2V0SWZVbmRlZmluZWQobm9kZU5hbWVDYWNoZSwgdHlwZS5ub2RlTmFtZSwgKCkgPT4gJ25vZGUtJyArIGkpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBZWG1sSG9vaykge1xuICAgICAgICAgICAgICAgIHR5cGUuaG9va05hbWUgPSBtYXAuc2V0SWZVbmRlZmluZWQobm9kZU5hbWVDYWNoZSwgdHlwZS5ob29rTmFtZSwgKCkgPT4gJ2hvb2stJyArIGkpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgQ29udGVudEFueToge1xuICAgICAgICAgICAgY29uc3QgYyA9IC8qKiBAdHlwZSB7Q29udGVudEFueX0gKi8gKGNvbnRlbnQpXG4gICAgICAgICAgICBjLmFyciA9IGMuYXJyLm1hcCgoKSA9PiBpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBDb250ZW50QmluYXJ5OiB7XG4gICAgICAgICAgICBjb25zdCBjID0gLyoqIEB0eXBlIHtDb250ZW50QmluYXJ5fSAqLyAoY29udGVudClcbiAgICAgICAgICAgIGMuY29udGVudCA9IG5ldyBVaW50OEFycmF5KFtpXSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgQ29udGVudERvYzoge1xuICAgICAgICAgICAgY29uc3QgYyA9IC8qKiBAdHlwZSB7Q29udGVudERvY30gKi8gKGNvbnRlbnQpXG4gICAgICAgICAgICBpZiAoc3ViZG9jcykge1xuICAgICAgICAgICAgICBjLm9wdHMgPSB7fVxuICAgICAgICAgICAgICBjLmRvYy5ndWlkID0gaSArICcnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIENvbnRlbnRFbWJlZDoge1xuICAgICAgICAgICAgY29uc3QgYyA9IC8qKiBAdHlwZSB7Q29udGVudEVtYmVkfSAqLyAoY29udGVudClcbiAgICAgICAgICAgIGMuZW1iZWQgPSB7fVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBDb250ZW50Rm9ybWF0OiB7XG4gICAgICAgICAgICBjb25zdCBjID0gLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoY29udGVudClcbiAgICAgICAgICAgIGlmIChmb3JtYXR0aW5nKSB7XG4gICAgICAgICAgICAgIGMua2V5ID0gbWFwLnNldElmVW5kZWZpbmVkKGZvcm1hdHRpbmdLZXlDYWNoZSwgYy5rZXksICgpID0+IGkgKyAnJylcbiAgICAgICAgICAgICAgYy52YWx1ZSA9IG1hcC5zZXRJZlVuZGVmaW5lZChmb3JtYXR0aW5nVmFsdWVDYWNoZSwgYy52YWx1ZSwgKCkgPT4gKHsgaSB9KSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgQ29udGVudEpTT046IHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSAvKiogQHR5cGUge0NvbnRlbnRKU09OfSAqLyAoY29udGVudClcbiAgICAgICAgICAgIGMuYXJyID0gYy5hcnIubWFwKCgpID0+IGkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIENvbnRlbnRTdHJpbmc6IHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSAvKiogQHR5cGUge0NvbnRlbnRTdHJpbmd9ICovIChjb250ZW50KVxuICAgICAgICAgICAgYy5zdHIgPSBzdHJpbmcucmVwZWF0KChpICUgMTApICsgJycsIGMuc3RyLmxlbmd0aClcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyB1bmtub3duIGNvbnRlbnQgdHlwZVxuICAgICAgICAgICAgZXJyb3IudW5leHBlY3RlZENhc2UoKVxuICAgICAgICB9XG4gICAgICAgIGlmIChpdGVtLnBhcmVudFN1Yikge1xuICAgICAgICAgIGl0ZW0ucGFyZW50U3ViID0gbWFwLnNldElmVW5kZWZpbmVkKG1hcEtleUNhY2hlLCBpdGVtLnBhcmVudFN1YiwgKCkgPT4gaSArICcnKVxuICAgICAgICB9XG4gICAgICAgIGkrK1xuICAgICAgICByZXR1cm4gYmxvY2tcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIHVua25vd24gYmxvY2stdHlwZVxuICAgICAgICBlcnJvci51bmV4cGVjdGVkQ2FzZSgpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBvYmZ1c2NhdGVzIHRoZSBjb250ZW50IG9mIGEgWWpzIHVwZGF0ZS4gVGhpcyBpcyB1c2VmdWwgdG8gc2hhcmVcbiAqIGJ1Z2d5IFlqcyBkb2N1bWVudHMgd2hpbGUgc2lnbmlmaWNhbnRseSBsaW1pdGluZyB0aGUgcG9zc2liaWxpdHkgdGhhdCBhXG4gKiBkZXZlbG9wZXIgY2FuIG9uIHRoZSB1c2VyLiBOb3RlIHRoYXQgaXQgbWlnaHQgc3RpbGwgYmUgcG9zc2libGUgdG8gZGVkdWNlXG4gKiBzb21lIGluZm9ybWF0aW9uIGJ5IGFuYWx5emluZyB0aGUgXCJzdHJ1Y3R1cmVcIiBvZiB0aGUgZG9jdW1lbnQgb3IgYnkgYW5hbHl6aW5nXG4gKiB0aGUgdHlwaW5nIGJlaGF2aW9yIHVzaW5nIHRoZSBDUkRULXJlbGF0ZWQgbWV0YWRhdGEgdGhhdCBpcyBzdGlsbCBrZXB0IGZ1bGx5XG4gKiBpbnRhY3QuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7T2JmdXNjYXRvck9wdGlvbnN9IFtvcHRzXVxuICovXG5leHBvcnQgY29uc3Qgb2JmdXNjYXRlVXBkYXRlID0gKHVwZGF0ZSwgb3B0cykgPT4gY29udmVydFVwZGF0ZUZvcm1hdCh1cGRhdGUsIGNyZWF0ZU9iZnVzY2F0b3Iob3B0cyksIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRW5jb2RlclYxKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge09iZnVzY2F0b3JPcHRpb25zfSBbb3B0c11cbiAqL1xuZXhwb3J0IGNvbnN0IG9iZnVzY2F0ZVVwZGF0ZVYyID0gKHVwZGF0ZSwgb3B0cykgPT4gY29udmVydFVwZGF0ZUZvcm1hdCh1cGRhdGUsIGNyZWF0ZU9iZnVzY2F0b3Iob3B0cyksIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYyKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKi9cbmV4cG9ydCBjb25zdCBjb252ZXJ0VXBkYXRlRm9ybWF0VjFUb1YyID0gdXBkYXRlID0+IGNvbnZlcnRVcGRhdGVGb3JtYXQodXBkYXRlLCBmLmlkLCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMilcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICovXG5leHBvcnQgY29uc3QgY29udmVydFVwZGF0ZUZvcm1hdFYyVG9WMSA9IHVwZGF0ZSA9PiBjb252ZXJ0VXBkYXRlRm9ybWF0KHVwZGF0ZSwgZi5pZCwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEpXG4iLCAiaW1wb3J0IHtcbiAgaXNEZWxldGVkLFxuICBJdGVtLCBBYnN0cmFjdFR5cGUsIFRyYW5zYWN0aW9uLCBBYnN0cmFjdFN0cnVjdCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgc2V0IGZyb20gJ2xpYjAvc2V0J1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnbGliMC9hcnJheSdcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5cbmNvbnN0IGVycm9yQ29tcHV0ZUNoYW5nZXMgPSAnWW91IG11c3Qgbm90IGNvbXB1dGUgY2hhbmdlcyBhZnRlciB0aGUgZXZlbnQtaGFuZGxlciBmaXJlZC4nXG5cbi8qKlxuICogQHRlbXBsYXRlIHtBYnN0cmFjdFR5cGU8YW55Pn0gVFxuICogWUV2ZW50IGRlc2NyaWJlcyB0aGUgY2hhbmdlcyBvbiBhIFlUeXBlLlxuICovXG5leHBvcnQgY2xhc3MgWUV2ZW50IHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VH0gdGFyZ2V0IFRoZSBjaGFuZ2VkIHR5cGUuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvciAodGFyZ2V0LCB0cmFuc2FjdGlvbikge1xuICAgIC8qKlxuICAgICAqIFRoZSB0eXBlIG9uIHdoaWNoIHRoaXMgZXZlbnQgd2FzIGNyZWF0ZWQgb24uXG4gICAgICogQHR5cGUge1R9XG4gICAgICovXG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXRcbiAgICAvKipcbiAgICAgKiBUaGUgY3VycmVudCB0YXJnZXQgb24gd2hpY2ggdGhlIG9ic2VydmUgY2FsbGJhY2sgaXMgY2FsbGVkLlxuICAgICAqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn1cbiAgICAgKi9cbiAgICB0aGlzLmN1cnJlbnRUYXJnZXQgPSB0YXJnZXRcbiAgICAvKipcbiAgICAgKiBUaGUgdHJhbnNhY3Rpb24gdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudC5cbiAgICAgKiBAdHlwZSB7VHJhbnNhY3Rpb259XG4gICAgICovXG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uXG4gICAgLyoqXG4gICAgICogQHR5cGUge09iamVjdHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMuX2NoYW5nZXMgPSBudWxsXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bGwgfCBNYXA8c3RyaW5nLCB7IGFjdGlvbjogJ2FkZCcgfCAndXBkYXRlJyB8ICdkZWxldGUnLCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55IH0+fVxuICAgICAqL1xuICAgIHRoaXMuX2tleXMgPSBudWxsXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bGwgfCBBcnJheTx7IGluc2VydD86IHN0cmluZyB8IEFycmF5PGFueT4gfCBvYmplY3QgfCBBYnN0cmFjdFR5cGU8YW55PiwgcmV0YWluPzogbnVtYmVyLCBkZWxldGU/OiBudW1iZXIsIGF0dHJpYnV0ZXM/OiBPYmplY3Q8c3RyaW5nLCBhbnk+IH0+fVxuICAgICAqL1xuICAgIHRoaXMuX2RlbHRhID0gbnVsbFxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxzdHJpbmd8bnVtYmVyPnxudWxsfVxuICAgICAqL1xuICAgIHRoaXMuX3BhdGggPSBudWxsXG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZXMgdGhlIHBhdGggZnJvbSBgeWAgdG8gdGhlIGNoYW5nZWQgdHlwZS5cbiAgICpcbiAgICogQHRvZG8gdjE0IHNob3VsZCBzdGFuZGFyZGl6ZSBvbiBwYXRoOiBBcnJheTx7cGFyZW50LCBpbmRleH0+IGJlY2F1c2UgdGhhdCBpcyBlYXNpZXIgdG8gd29yayB3aXRoLlxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIHByb3BlcnR5IGhvbGRzOlxuICAgKiBAZXhhbXBsZVxuICAgKiAgIGxldCB0eXBlID0geVxuICAgKiAgIGV2ZW50LnBhdGguZm9yRWFjaChkaXIgPT4ge1xuICAgKiAgICAgdHlwZSA9IHR5cGUuZ2V0KGRpcilcbiAgICogICB9KVxuICAgKiAgIHR5cGUgPT09IGV2ZW50LnRhcmdldCAvLyA9PiB0cnVlXG4gICAqL1xuICBnZXQgcGF0aCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhdGggfHwgKHRoaXMuX3BhdGggPSBnZXRQYXRoVG8odGhpcy5jdXJyZW50VGFyZ2V0LCB0aGlzLnRhcmdldCkpXG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBzdHJ1Y3QgaXMgZGVsZXRlZCBieSB0aGlzIGV2ZW50LlxuICAgKlxuICAgKiBJbiBjb250cmFzdCB0byBjaGFuZ2UuZGVsZXRlZCwgdGhpcyBtZXRob2QgYWxzbyByZXR1cm5zIHRydWUgaWYgdGhlIHN0cnVjdCB3YXMgYWRkZWQgYW5kIHRoZW4gZGVsZXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtBYnN0cmFjdFN0cnVjdH0gc3RydWN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBkZWxldGVzIChzdHJ1Y3QpIHtcbiAgICByZXR1cm4gaXNEZWxldGVkKHRoaXMudHJhbnNhY3Rpb24uZGVsZXRlU2V0LCBzdHJ1Y3QuaWQpXG4gIH1cblxuICAvKipcbiAgICogQHR5cGUge01hcDxzdHJpbmcsIHsgYWN0aW9uOiAnYWRkJyB8ICd1cGRhdGUnIHwgJ2RlbGV0ZScsIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkgfT59XG4gICAqL1xuICBnZXQga2V5cyAoKSB7XG4gICAgaWYgKHRoaXMuX2tleXMgPT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLnRyYW5zYWN0aW9uLmRvYy5fdHJhbnNhY3Rpb25DbGVhbnVwcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgZXJyb3IuY3JlYXRlKGVycm9yQ29tcHV0ZUNoYW5nZXMpXG4gICAgICB9XG4gICAgICBjb25zdCBrZXlzID0gbmV3IE1hcCgpXG4gICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnRhcmdldFxuICAgICAgY29uc3QgY2hhbmdlZCA9IC8qKiBAdHlwZSBTZXQ8c3RyaW5nfG51bGw+ICovICh0aGlzLnRyYW5zYWN0aW9uLmNoYW5nZWQuZ2V0KHRhcmdldCkpXG4gICAgICBjaGFuZ2VkLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgaWYgKGtleSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGl0ZW0gPSAvKiogQHR5cGUge0l0ZW19ICovICh0YXJnZXQuX21hcC5nZXQoa2V5KSlcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBAdHlwZSB7J2RlbGV0ZScgfCAnYWRkJyB8ICd1cGRhdGUnfVxuICAgICAgICAgICAqL1xuICAgICAgICAgIGxldCBhY3Rpb25cbiAgICAgICAgICBsZXQgb2xkVmFsdWVcbiAgICAgICAgICBpZiAodGhpcy5hZGRzKGl0ZW0pKSB7XG4gICAgICAgICAgICBsZXQgcHJldiA9IGl0ZW0ubGVmdFxuICAgICAgICAgICAgd2hpbGUgKHByZXYgIT09IG51bGwgJiYgdGhpcy5hZGRzKHByZXYpKSB7XG4gICAgICAgICAgICAgIHByZXYgPSBwcmV2LmxlZnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmRlbGV0ZXMoaXRlbSkpIHtcbiAgICAgICAgICAgICAgaWYgKHByZXYgIT09IG51bGwgJiYgdGhpcy5kZWxldGVzKHByZXYpKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gJ2RlbGV0ZSdcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZSA9IGFycmF5Lmxhc3QocHJldi5jb250ZW50LmdldENvbnRlbnQoKSlcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKHByZXYgIT09IG51bGwgJiYgdGhpcy5kZWxldGVzKHByZXYpKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gJ3VwZGF0ZSdcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZSA9IGFycmF5Lmxhc3QocHJldi5jb250ZW50LmdldENvbnRlbnQoKSlcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSAnYWRkJ1xuICAgICAgICAgICAgICAgIG9sZFZhbHVlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVsZXRlcyhpdGVtKSkge1xuICAgICAgICAgICAgICBhY3Rpb24gPSAnZGVsZXRlJ1xuICAgICAgICAgICAgICBvbGRWYWx1ZSA9IGFycmF5Lmxhc3QoLyoqIEB0eXBlIHtJdGVtfSAqLyBpdGVtLmNvbnRlbnQuZ2V0Q29udGVudCgpKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIC8vIG5vcFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBrZXlzLnNldChrZXksIHsgYWN0aW9uLCBvbGRWYWx1ZSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5fa2V5cyA9IGtleXNcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2tleXNcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGlzIGEgY29tcHV0ZWQgcHJvcGVydHkuIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGJlIHNhZmVseSBjb21wdXRlZCBkdXJpbmcgdGhlXG4gICAqIGV2ZW50IGNhbGwuIENvbXB1dGluZyB0aGlzIHByb3BlcnR5IGFmdGVyIG90aGVyIGNoYW5nZXMgaGFwcGVuZWQgbWlnaHQgcmVzdWx0IGluXG4gICAqIHVuZXhwZWN0ZWQgYmVoYXZpb3IgKGluY29ycmVjdCBjb21wdXRhdGlvbiBvZiBkZWx0YXMpLiBBIHNhZmUgd2F5IHRvIGNvbGxlY3QgY2hhbmdlc1xuICAgKiBpcyB0byBzdG9yZSB0aGUgYGNoYW5nZXNgIG9yIHRoZSBgZGVsdGFgIG9iamVjdC4gQXZvaWQgc3RvcmluZyB0aGUgYHRyYW5zYWN0aW9uYCBvYmplY3QuXG4gICAqXG4gICAqIEB0eXBlIHtBcnJheTx7aW5zZXJ0Pzogc3RyaW5nIHwgQXJyYXk8YW55PiB8IG9iamVjdCB8IEFic3RyYWN0VHlwZTxhbnk+LCByZXRhaW4/OiBudW1iZXIsIGRlbGV0ZT86IG51bWJlciwgYXR0cmlidXRlcz86IE9iamVjdDxzdHJpbmcsIGFueT59Pn1cbiAgICovXG4gIGdldCBkZWx0YSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlcy5kZWx0YVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgc3RydWN0IGlzIGFkZGVkIGJ5IHRoaXMgZXZlbnQuXG4gICAqXG4gICAqIEluIGNvbnRyYXN0IHRvIGNoYW5nZS5kZWxldGVkLCB0aGlzIG1ldGhvZCBhbHNvIHJldHVybnMgdHJ1ZSBpZiB0aGUgc3RydWN0IHdhcyBhZGRlZCBhbmQgdGhlbiBkZWxldGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge0Fic3RyYWN0U3RydWN0fSBzdHJ1Y3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGFkZHMgKHN0cnVjdCkge1xuICAgIHJldHVybiBzdHJ1Y3QuaWQuY2xvY2sgPj0gKHRoaXMudHJhbnNhY3Rpb24uYmVmb3JlU3RhdGUuZ2V0KHN0cnVjdC5pZC5jbGllbnQpIHx8IDApXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBpcyBhIGNvbXB1dGVkIHByb3BlcnR5LiBOb3RlIHRoYXQgdGhpcyBjYW4gb25seSBiZSBzYWZlbHkgY29tcHV0ZWQgZHVyaW5nIHRoZVxuICAgKiBldmVudCBjYWxsLiBDb21wdXRpbmcgdGhpcyBwcm9wZXJ0eSBhZnRlciBvdGhlciBjaGFuZ2VzIGhhcHBlbmVkIG1pZ2h0IHJlc3VsdCBpblxuICAgKiB1bmV4cGVjdGVkIGJlaGF2aW9yIChpbmNvcnJlY3QgY29tcHV0YXRpb24gb2YgZGVsdGFzKS4gQSBzYWZlIHdheSB0byBjb2xsZWN0IGNoYW5nZXNcbiAgICogaXMgdG8gc3RvcmUgdGhlIGBjaGFuZ2VzYCBvciB0aGUgYGRlbHRhYCBvYmplY3QuIEF2b2lkIHN0b3JpbmcgdGhlIGB0cmFuc2FjdGlvbmAgb2JqZWN0LlxuICAgKlxuICAgKiBAdHlwZSB7e2FkZGVkOlNldDxJdGVtPixkZWxldGVkOlNldDxJdGVtPixrZXlzOk1hcDxzdHJpbmcse2FjdGlvbjonYWRkJ3wndXBkYXRlJ3wnZGVsZXRlJyxvbGRWYWx1ZTphbnl9PixkZWx0YTpBcnJheTx7aW5zZXJ0PzpBcnJheTxhbnk+fHN0cmluZywgZGVsZXRlPzpudW1iZXIsIHJldGFpbj86bnVtYmVyfT59fVxuICAgKi9cbiAgZ2V0IGNoYW5nZXMgKCkge1xuICAgIGxldCBjaGFuZ2VzID0gdGhpcy5fY2hhbmdlc1xuICAgIGlmIChjaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy50cmFuc2FjdGlvbi5kb2MuX3RyYW5zYWN0aW9uQ2xlYW51cHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IGVycm9yLmNyZWF0ZShlcnJvckNvbXB1dGVDaGFuZ2VzKVxuICAgICAgfVxuICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy50YXJnZXRcbiAgICAgIGNvbnN0IGFkZGVkID0gc2V0LmNyZWF0ZSgpXG4gICAgICBjb25zdCBkZWxldGVkID0gc2V0LmNyZWF0ZSgpXG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHtBcnJheTx7aW5zZXJ0OkFycmF5PGFueT59fHtkZWxldGU6bnVtYmVyfXx7cmV0YWluOm51bWJlcn0+fVxuICAgICAgICovXG4gICAgICBjb25zdCBkZWx0YSA9IFtdXG4gICAgICBjaGFuZ2VzID0ge1xuICAgICAgICBhZGRlZCxcbiAgICAgICAgZGVsZXRlZCxcbiAgICAgICAgZGVsdGEsXG4gICAgICAgIGtleXM6IHRoaXMua2V5c1xuICAgICAgfVxuICAgICAgY29uc3QgY2hhbmdlZCA9IC8qKiBAdHlwZSBTZXQ8c3RyaW5nfG51bGw+ICovICh0aGlzLnRyYW5zYWN0aW9uLmNoYW5nZWQuZ2V0KHRhcmdldCkpXG4gICAgICBpZiAoY2hhbmdlZC5oYXMobnVsbCkpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHthbnl9XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgbGFzdE9wID0gbnVsbFxuICAgICAgICBjb25zdCBwYWNrT3AgPSAoKSA9PiB7XG4gICAgICAgICAgaWYgKGxhc3RPcCkge1xuICAgICAgICAgICAgZGVsdGEucHVzaChsYXN0T3ApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGl0ZW0gPSB0YXJnZXQuX3N0YXJ0OyBpdGVtICE9PSBudWxsOyBpdGVtID0gaXRlbS5yaWdodCkge1xuICAgICAgICAgIGlmIChpdGVtLmRlbGV0ZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRlbGV0ZXMoaXRlbSkgJiYgIXRoaXMuYWRkcyhpdGVtKSkge1xuICAgICAgICAgICAgICBpZiAobGFzdE9wID09PSBudWxsIHx8IGxhc3RPcC5kZWxldGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBhY2tPcCgpXG4gICAgICAgICAgICAgICAgbGFzdE9wID0geyBkZWxldGU6IDAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxhc3RPcC5kZWxldGUgKz0gaXRlbS5sZW5ndGhcbiAgICAgICAgICAgICAgZGVsZXRlZC5hZGQoaXRlbSlcbiAgICAgICAgICAgIH0gLy8gZWxzZSBub3BcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuYWRkcyhpdGVtKSkge1xuICAgICAgICAgICAgICBpZiAobGFzdE9wID09PSBudWxsIHx8IGxhc3RPcC5pbnNlcnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBhY2tPcCgpXG4gICAgICAgICAgICAgICAgbGFzdE9wID0geyBpbnNlcnQ6IFtdIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsYXN0T3AuaW5zZXJ0ID0gbGFzdE9wLmluc2VydC5jb25jYXQoaXRlbS5jb250ZW50LmdldENvbnRlbnQoKSlcbiAgICAgICAgICAgICAgYWRkZWQuYWRkKGl0ZW0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAobGFzdE9wID09PSBudWxsIHx8IGxhc3RPcC5yZXRhaW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBhY2tPcCgpXG4gICAgICAgICAgICAgICAgbGFzdE9wID0geyByZXRhaW46IDAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxhc3RPcC5yZXRhaW4gKz0gaXRlbS5sZW5ndGhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhc3RPcCAhPT0gbnVsbCAmJiBsYXN0T3AucmV0YWluID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwYWNrT3AoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9jaGFuZ2VzID0gY2hhbmdlc1xuICAgIH1cbiAgICByZXR1cm4gLyoqIEB0eXBlIHthbnl9ICovIChjaGFuZ2VzKVxuICB9XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgcGF0aCBmcm9tIHRoaXMgdHlwZSB0byB0aGUgc3BlY2lmaWVkIHRhcmdldC5cbiAqXG4gKiBAZXhhbXBsZVxuICogICAvLyBgY2hpbGRgIHNob3VsZCBiZSBhY2Nlc3NpYmxlIHZpYSBgdHlwZS5nZXQocGF0aFswXSkuZ2V0KHBhdGhbMV0pLi5gXG4gKiAgIGNvbnN0IHBhdGggPSB0eXBlLmdldFBhdGhUbyhjaGlsZClcbiAqICAgLy8gYXNzdW1pbmcgYHR5cGUgaW5zdGFuY2VvZiBZQXJyYXlgXG4gKiAgIGNvbnNvbGUubG9nKHBhdGgpIC8vIG1pZ2h0IGxvb2sgbGlrZSA9PiBbMiwgJ2tleTEnXVxuICogICBjaGlsZCA9PT0gdHlwZS5nZXQocGF0aFswXSkuZ2V0KHBhdGhbMV0pXG4gKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBjaGlsZCB0YXJnZXRcbiAqIEByZXR1cm4ge0FycmF5PHN0cmluZ3xudW1iZXI+fSBQYXRoIHRvIHRoZSB0YXJnZXRcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IGdldFBhdGhUbyA9IChwYXJlbnQsIGNoaWxkKSA9PiB7XG4gIGNvbnN0IHBhdGggPSBbXVxuICB3aGlsZSAoY2hpbGQuX2l0ZW0gIT09IG51bGwgJiYgY2hpbGQgIT09IHBhcmVudCkge1xuICAgIGlmIChjaGlsZC5faXRlbS5wYXJlbnRTdWIgIT09IG51bGwpIHtcbiAgICAgIC8vIHBhcmVudCBpcyBtYXAtaXNoXG4gICAgICBwYXRoLnVuc2hpZnQoY2hpbGQuX2l0ZW0ucGFyZW50U3ViKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBwYXJlbnQgaXMgYXJyYXktaXNoXG4gICAgICBsZXQgaSA9IDBcbiAgICAgIGxldCBjID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKGNoaWxkLl9pdGVtLnBhcmVudCkuX3N0YXJ0XG4gICAgICB3aGlsZSAoYyAhPT0gY2hpbGQuX2l0ZW0gJiYgYyAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoIWMuZGVsZXRlZCAmJiBjLmNvdW50YWJsZSkge1xuICAgICAgICAgIGkgKz0gYy5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgICBjID0gYy5yaWdodFxuICAgICAgfVxuICAgICAgcGF0aC51bnNoaWZ0KGkpXG4gICAgfVxuICAgIGNoaWxkID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKGNoaWxkLl9pdGVtLnBhcmVudClcbiAgfVxuICByZXR1cm4gcGF0aFxufVxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gY3JlYXRlIGFuZCBtYW5pcHVsYXRlIEl0ZXJhdG9ycy5cbiAqXG4gKiBAbW9kdWxlIGl0ZXJhdG9yXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgVCxSXG4gKiBAcGFyYW0ge0l0ZXJhdG9yPFQ+fSBpdGVyYXRvclxuICogQHBhcmFtIHtmdW5jdGlvbihUKTpSfSBmXG4gKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPFI+fVxuICovXG5leHBvcnQgY29uc3QgbWFwSXRlcmF0b3IgPSAoaXRlcmF0b3IsIGYpID0+ICh7XG4gIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuICAvLyBAdHMtaWdub3JlXG4gIG5leHQgKCkge1xuICAgIGNvbnN0IHIgPSBpdGVyYXRvci5uZXh0KClcbiAgICByZXR1cm4geyB2YWx1ZTogci5kb25lID8gdW5kZWZpbmVkIDogZihyLnZhbHVlKSwgZG9uZTogci5kb25lIH1cbiAgfVxufSlcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtmdW5jdGlvbigpOkl0ZXJhdG9yUmVzdWx0PFQ+fSBuZXh0XG4gKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPFQ+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlSXRlcmF0b3IgPSBuZXh0ID0+ICh7XG4gIC8qKlxuICAgKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPFQ+fVxuICAgKi9cbiAgW1N5bWJvbC5pdGVyYXRvcl0gKCkge1xuICAgIHJldHVybiB0aGlzXG4gIH0sXG4gIC8vIEB0cy1pZ25vcmVcbiAgbmV4dFxufSlcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtJdGVyYXRvcjxUPn0gaXRlcmF0b3JcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oVCk6Ym9vbGVhbn0gZmlsdGVyXG4gKi9cbmV4cG9ydCBjb25zdCBpdGVyYXRvckZpbHRlciA9IChpdGVyYXRvciwgZmlsdGVyKSA9PiBjcmVhdGVJdGVyYXRvcigoKSA9PiB7XG4gIGxldCByZXNcbiAgZG8ge1xuICAgIHJlcyA9IGl0ZXJhdG9yLm5leHQoKVxuICB9IHdoaWxlICghcmVzLmRvbmUgJiYgIWZpbHRlcihyZXMudmFsdWUpKVxuICByZXR1cm4gcmVzXG59KVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBULE1cbiAqIEBwYXJhbSB7SXRlcmF0b3I8VD59IGl0ZXJhdG9yXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFQpOk19IGZtYXBcbiAqL1xuZXhwb3J0IGNvbnN0IGl0ZXJhdG9yTWFwID0gKGl0ZXJhdG9yLCBmbWFwKSA9PiBjcmVhdGVJdGVyYXRvcigoKSA9PiB7XG4gIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGl0ZXJhdG9yLm5leHQoKVxuICByZXR1cm4geyBkb25lLCB2YWx1ZTogZG9uZSA/IHVuZGVmaW5lZCA6IGZtYXAodmFsdWUpIH1cbn0pXG4iLCAiaW1wb3J0IHtcbiAgcmVtb3ZlRXZlbnRIYW5kbGVyTGlzdGVuZXIsXG4gIGNhbGxFdmVudEhhbmRsZXJMaXN0ZW5lcnMsXG4gIGFkZEV2ZW50SGFuZGxlckxpc3RlbmVyLFxuICBjcmVhdGVFdmVudEhhbmRsZXIsXG4gIGdldFN0YXRlLFxuICBpc1Zpc2libGUsXG4gIENvbnRlbnRUeXBlLFxuICBjcmVhdGVJRCxcbiAgQ29udGVudEFueSxcbiAgQ29udGVudEJpbmFyeSxcbiAgZ2V0SXRlbUNsZWFuU3RhcnQsXG4gIENvbnRlbnREb2MsIFlUZXh0LCBZQXJyYXksIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBEb2MsIFNuYXBzaG90LCBUcmFuc2FjdGlvbiwgRXZlbnRIYW5kbGVyLCBZRXZlbnQsIEl0ZW0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBpdGVyYXRvciBmcm9tICdsaWIwL2l0ZXJhdG9yJ1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnbGliMC9tYXRoJ1xuaW1wb3J0ICogYXMgbG9nIGZyb20gJ2xpYjAvbG9nZ2luZydcblxuLyoqXG4gKiBodHRwczovL2RvY3MueWpzLmRldi9nZXR0aW5nLXN0YXJ0ZWQvd29ya2luZy13aXRoLXNoYXJlZC10eXBlcyNjYXZlYXRzXG4gKi9cbmV4cG9ydCBjb25zdCB3YXJuUHJlbWF0dXJlQWNjZXNzID0gKCkgPT4geyBsb2cud2FybignSW52YWxpZCBhY2Nlc3M6IEFkZCBZanMgdHlwZSB0byBhIGRvY3VtZW50IGJlZm9yZSByZWFkaW5nIGRhdGEuJykgfVxuXG5jb25zdCBtYXhTZWFyY2hNYXJrZXIgPSA4MFxuXG4vKipcbiAqIEEgdW5pcXVlIHRpbWVzdGFtcCB0aGF0IGlkZW50aWZpZXMgZWFjaCBtYXJrZXIuXG4gKlxuICogVGltZSBpcyByZWxhdGl2ZSwuLiB0aGlzIGlzIG1vcmUgbGlrZSBhbiBldmVyLWluY3JlYXNpbmcgY2xvY2suXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xubGV0IGdsb2JhbFNlYXJjaE1hcmtlclRpbWVzdGFtcCA9IDBcblxuZXhwb3J0IGNsYXNzIEFycmF5U2VhcmNoTWFya2VyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7SXRlbX0gcFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICovXG4gIGNvbnN0cnVjdG9yIChwLCBpbmRleCkge1xuICAgIHAubWFya2VyID0gdHJ1ZVxuICAgIHRoaXMucCA9IHBcbiAgICB0aGlzLmluZGV4ID0gaW5kZXhcbiAgICB0aGlzLnRpbWVzdGFtcCA9IGdsb2JhbFNlYXJjaE1hcmtlclRpbWVzdGFtcCsrXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5U2VhcmNoTWFya2VyfSBtYXJrZXJcbiAqL1xuY29uc3QgcmVmcmVzaE1hcmtlclRpbWVzdGFtcCA9IG1hcmtlciA9PiB7IG1hcmtlci50aW1lc3RhbXAgPSBnbG9iYWxTZWFyY2hNYXJrZXJUaW1lc3RhbXArKyB9XG5cbi8qKlxuICogVGhpcyBpcyByYXRoZXIgY29tcGxleCBzbyB0aGlzIGZ1bmN0aW9uIGlzIHRoZSBvbmx5IHRoaW5nIHRoYXQgc2hvdWxkIG92ZXJ3cml0ZSBhIG1hcmtlclxuICpcbiAqIEBwYXJhbSB7QXJyYXlTZWFyY2hNYXJrZXJ9IG1hcmtlclxuICogQHBhcmFtIHtJdGVtfSBwXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqL1xuY29uc3Qgb3ZlcndyaXRlTWFya2VyID0gKG1hcmtlciwgcCwgaW5kZXgpID0+IHtcbiAgbWFya2VyLnAubWFya2VyID0gZmFsc2VcbiAgbWFya2VyLnAgPSBwXG4gIHAubWFya2VyID0gdHJ1ZVxuICBtYXJrZXIuaW5kZXggPSBpbmRleFxuICBtYXJrZXIudGltZXN0YW1wID0gZ2xvYmFsU2VhcmNoTWFya2VyVGltZXN0YW1wKytcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PEFycmF5U2VhcmNoTWFya2VyPn0gc2VhcmNoTWFya2VyXG4gKiBAcGFyYW0ge0l0ZW19IHBcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICovXG5jb25zdCBtYXJrUG9zaXRpb24gPSAoc2VhcmNoTWFya2VyLCBwLCBpbmRleCkgPT4ge1xuICBpZiAoc2VhcmNoTWFya2VyLmxlbmd0aCA+PSBtYXhTZWFyY2hNYXJrZXIpIHtcbiAgICAvLyBvdmVycmlkZSBvbGRlc3QgbWFya2VyICh3ZSBkb24ndCB3YW50IHRvIGNyZWF0ZSBtb3JlIG9iamVjdHMpXG4gICAgY29uc3QgbWFya2VyID0gc2VhcmNoTWFya2VyLnJlZHVjZSgoYSwgYikgPT4gYS50aW1lc3RhbXAgPCBiLnRpbWVzdGFtcCA/IGEgOiBiKVxuICAgIG92ZXJ3cml0ZU1hcmtlcihtYXJrZXIsIHAsIGluZGV4KVxuICAgIHJldHVybiBtYXJrZXJcbiAgfSBlbHNlIHtcbiAgICAvLyBjcmVhdGUgbmV3IG1hcmtlclxuICAgIGNvbnN0IHBtID0gbmV3IEFycmF5U2VhcmNoTWFya2VyKHAsIGluZGV4KVxuICAgIHNlYXJjaE1hcmtlci5wdXNoKHBtKVxuICAgIHJldHVybiBwbVxuICB9XG59XG5cbi8qKlxuICogU2VhcmNoIG1hcmtlciBoZWxwIHVzIHRvIGZpbmQgcG9zaXRpb25zIGluIHRoZSBhc3NvY2lhdGl2ZSBhcnJheSBmYXN0ZXIuXG4gKlxuICogVGhleSBzcGVlZCB1cCB0aGUgcHJvY2VzcyBvZiBmaW5kaW5nIGEgcG9zaXRpb24gd2l0aG91dCBtdWNoIGJvb2trZWVwaW5nLlxuICpcbiAqIEEgbWF4aW11bSBvZiBgbWF4U2VhcmNoTWFya2VyYCBvYmplY3RzIGFyZSBjcmVhdGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWx3YXlzIHJldHVybnMgYSByZWZyZXNoZWQgbWFya2VyICh1cGRhdGVkIHRpbWVzdGFtcClcbiAqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB5YXJyYXlcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICovXG5leHBvcnQgY29uc3QgZmluZE1hcmtlciA9ICh5YXJyYXksIGluZGV4KSA9PiB7XG4gIGlmICh5YXJyYXkuX3N0YXJ0ID09PSBudWxsIHx8IGluZGV4ID09PSAwIHx8IHlhcnJheS5fc2VhcmNoTWFya2VyID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBjb25zdCBtYXJrZXIgPSB5YXJyYXkuX3NlYXJjaE1hcmtlci5sZW5ndGggPT09IDAgPyBudWxsIDogeWFycmF5Ll9zZWFyY2hNYXJrZXIucmVkdWNlKChhLCBiKSA9PiBtYXRoLmFicyhpbmRleCAtIGEuaW5kZXgpIDwgbWF0aC5hYnMoaW5kZXggLSBiLmluZGV4KSA/IGEgOiBiKVxuICBsZXQgcCA9IHlhcnJheS5fc3RhcnRcbiAgbGV0IHBpbmRleCA9IDBcbiAgaWYgKG1hcmtlciAhPT0gbnVsbCkge1xuICAgIHAgPSBtYXJrZXIucFxuICAgIHBpbmRleCA9IG1hcmtlci5pbmRleFxuICAgIHJlZnJlc2hNYXJrZXJUaW1lc3RhbXAobWFya2VyKSAvLyB3ZSB1c2VkIGl0LCB3ZSBtaWdodCBuZWVkIHRvIHVzZSBpdCBhZ2FpblxuICB9XG4gIC8vIGl0ZXJhdGUgdG8gcmlnaHQgaWYgcG9zc2libGVcbiAgd2hpbGUgKHAucmlnaHQgIT09IG51bGwgJiYgcGluZGV4IDwgaW5kZXgpIHtcbiAgICBpZiAoIXAuZGVsZXRlZCAmJiBwLmNvdW50YWJsZSkge1xuICAgICAgaWYgKGluZGV4IDwgcGluZGV4ICsgcC5sZW5ndGgpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIHBpbmRleCArPSBwLmxlbmd0aFxuICAgIH1cbiAgICBwID0gcC5yaWdodFxuICB9XG4gIC8vIGl0ZXJhdGUgdG8gbGVmdCBpZiBuZWNlc3NhcnkgKG1pZ2h0IGJlIHRoYXQgcGluZGV4ID4gaW5kZXgpXG4gIHdoaWxlIChwLmxlZnQgIT09IG51bGwgJiYgcGluZGV4ID4gaW5kZXgpIHtcbiAgICBwID0gcC5sZWZ0XG4gICAgaWYgKCFwLmRlbGV0ZWQgJiYgcC5jb3VudGFibGUpIHtcbiAgICAgIHBpbmRleCAtPSBwLmxlbmd0aFxuICAgIH1cbiAgfVxuICAvLyB3ZSB3YW50IHRvIG1ha2Ugc3VyZSB0aGF0IHAgY2FuJ3QgYmUgbWVyZ2VkIHdpdGggbGVmdCwgYmVjYXVzZSB0aGF0IHdvdWxkIHNjcmV3IHVwIGV2ZXJ5dGhpbmdcbiAgLy8gaW4gdGhhdCBjYXMganVzdCByZXR1cm4gd2hhdCB3ZSBoYXZlIChpdCBpcyBtb3N0IGxpa2VseSB0aGUgYmVzdCBtYXJrZXIgYW55d2F5KVxuICAvLyBpdGVyYXRlIHRvIGxlZnQgdW50aWwgcCBjYW4ndCBiZSBtZXJnZWQgd2l0aCBsZWZ0XG4gIHdoaWxlIChwLmxlZnQgIT09IG51bGwgJiYgcC5sZWZ0LmlkLmNsaWVudCA9PT0gcC5pZC5jbGllbnQgJiYgcC5sZWZ0LmlkLmNsb2NrICsgcC5sZWZ0Lmxlbmd0aCA9PT0gcC5pZC5jbG9jaykge1xuICAgIHAgPSBwLmxlZnRcbiAgICBpZiAoIXAuZGVsZXRlZCAmJiBwLmNvdW50YWJsZSkge1xuICAgICAgcGluZGV4IC09IHAubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgLy8gQHRvZG8gcmVtb3ZlIVxuICAvLyBhc3N1cmUgcG9zaXRpb25cbiAgLy8ge1xuICAvLyAgIGxldCBzdGFydCA9IHlhcnJheS5fc3RhcnRcbiAgLy8gICBsZXQgcG9zID0gMFxuICAvLyAgIHdoaWxlIChzdGFydCAhPT0gcCkge1xuICAvLyAgICAgaWYgKCFzdGFydC5kZWxldGVkICYmIHN0YXJ0LmNvdW50YWJsZSkge1xuICAvLyAgICAgICBwb3MgKz0gc3RhcnQubGVuZ3RoXG4gIC8vICAgICB9XG4gIC8vICAgICBzdGFydCA9IC8qKiBAdHlwZSB7SXRlbX0gKi8gKHN0YXJ0LnJpZ2h0KVxuICAvLyAgIH1cbiAgLy8gICBpZiAocG9zICE9PSBwaW5kZXgpIHtcbiAgLy8gICAgIGRlYnVnZ2VyXG4gIC8vICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvdGNoYSBwb3NpdGlvbiBmYWlsIScpXG4gIC8vICAgfVxuICAvLyB9XG4gIC8vIGlmIChtYXJrZXIpIHtcbiAgLy8gICBpZiAod2luZG93Lmxlbmd0aGVzID09IG51bGwpIHtcbiAgLy8gICAgIHdpbmRvdy5sZW5ndGhlcyA9IFtdXG4gIC8vICAgICB3aW5kb3cuZ2V0TGVuZ3RoZXMgPSAoKSA9PiB3aW5kb3cubGVuZ3RoZXMuc29ydCgoYSwgYikgPT4gYSAtIGIpXG4gIC8vICAgfVxuICAvLyAgIHdpbmRvdy5sZW5ndGhlcy5wdXNoKG1hcmtlci5pbmRleCAtIHBpbmRleClcbiAgLy8gICBjb25zb2xlLmxvZygnZGlzdGFuY2UnLCBtYXJrZXIuaW5kZXggLSBwaW5kZXgsICdsZW4nLCBwICYmIHAucGFyZW50Lmxlbmd0aClcbiAgLy8gfVxuICBpZiAobWFya2VyICE9PSBudWxsICYmIG1hdGguYWJzKG1hcmtlci5pbmRleCAtIHBpbmRleCkgPCAvKiogQHR5cGUge1lUZXh0fFlBcnJheTxhbnk+fSAqLyAocC5wYXJlbnQpLmxlbmd0aCAvIG1heFNlYXJjaE1hcmtlcikge1xuICAgIC8vIGFkanVzdCBleGlzdGluZyBtYXJrZXJcbiAgICBvdmVyd3JpdGVNYXJrZXIobWFya2VyLCBwLCBwaW5kZXgpXG4gICAgcmV0dXJuIG1hcmtlclxuICB9IGVsc2Uge1xuICAgIC8vIGNyZWF0ZSBuZXcgbWFya2VyXG4gICAgcmV0dXJuIG1hcmtQb3NpdGlvbih5YXJyYXkuX3NlYXJjaE1hcmtlciwgcCwgcGluZGV4KVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIG1hcmtlcnMgd2hlbiBhIGNoYW5nZSBoYXBwZW5lZC5cbiAqXG4gKiBUaGlzIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGRvaW5nIGEgZGVsZXRpb24hXG4gKlxuICogQHBhcmFtIHtBcnJheTxBcnJheVNlYXJjaE1hcmtlcj59IHNlYXJjaE1hcmtlclxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIElmIGluc2VydGlvbiwgbGVuIGlzIHBvc2l0aXZlLiBJZiBkZWxldGlvbiwgbGVuIGlzIG5lZ2F0aXZlLlxuICovXG5leHBvcnQgY29uc3QgdXBkYXRlTWFya2VyQ2hhbmdlcyA9IChzZWFyY2hNYXJrZXIsIGluZGV4LCBsZW4pID0+IHtcbiAgZm9yIChsZXQgaSA9IHNlYXJjaE1hcmtlci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IG0gPSBzZWFyY2hNYXJrZXJbaV1cbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgICAgICovXG4gICAgICBsZXQgcCA9IG0ucFxuICAgICAgcC5tYXJrZXIgPSBmYWxzZVxuICAgICAgLy8gSWRlYWxseSB3ZSBqdXN0IHdhbnQgdG8gZG8gYSBzaW1wbGUgcG9zaXRpb24gY29tcGFyaXNvbiwgYnV0IHRoaXMgd2lsbCBvbmx5IHdvcmsgaWZcbiAgICAgIC8vIHNlYXJjaCBtYXJrZXJzIGRvbid0IHBvaW50IHRvIGRlbGV0ZWQgaXRlbXMgZm9yIGZvcm1hdHMuXG4gICAgICAvLyBJdGVyYXRlIG1hcmtlciB0byBwcmV2IHVuZGVsZXRlZCBjb3VudGFibGUgcG9zaXRpb24gc28gd2Uga25vdyB3aGF0IHRvIGRvIHdoZW4gdXBkYXRpbmcgYSBwb3NpdGlvblxuICAgICAgd2hpbGUgKHAgJiYgKHAuZGVsZXRlZCB8fCAhcC5jb3VudGFibGUpKSB7XG4gICAgICAgIHAgPSBwLmxlZnRcbiAgICAgICAgaWYgKHAgJiYgIXAuZGVsZXRlZCAmJiBwLmNvdW50YWJsZSkge1xuICAgICAgICAgIC8vIGFkanVzdCBwb3NpdGlvbi4gdGhlIGxvb3Agc2hvdWxkIGJyZWFrIG5vd1xuICAgICAgICAgIG0uaW5kZXggLT0gcC5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHAgPT09IG51bGwgfHwgcC5tYXJrZXIgPT09IHRydWUpIHtcbiAgICAgICAgLy8gcmVtb3ZlIHNlYXJjaCBtYXJrZXIgaWYgdXBkYXRlZCBwb3NpdGlvbiBpcyBudWxsIG9yIGlmIHBvc2l0aW9uIGlzIGFscmVhZHkgbWFya2VkXG4gICAgICAgIHNlYXJjaE1hcmtlci5zcGxpY2UoaSwgMSlcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIG0ucCA9IHBcbiAgICAgIHAubWFya2VyID0gdHJ1ZVxuICAgIH1cbiAgICBpZiAoaW5kZXggPCBtLmluZGV4IHx8IChsZW4gPiAwICYmIGluZGV4ID09PSBtLmluZGV4KSkgeyAvLyBhIHNpbXBsZSBpbmRleCA8PSBtLmluZGV4IGNoZWNrIHdvdWxkIGFjdHVhbGx5IHN1ZmZpY2VcbiAgICAgIG0uaW5kZXggPSBtYXRoLm1heChpbmRleCwgbS5pbmRleCArIGxlbilcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBY2N1bXVsYXRlIGFsbCAobGlzdCkgY2hpbGRyZW4gb2YgYSB0eXBlIGFuZCByZXR1cm4gdGhlbSBhcyBhbiBBcnJheS5cbiAqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB0XG4gKiBAcmV0dXJuIHtBcnJheTxJdGVtPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGdldFR5cGVDaGlsZHJlbiA9IHQgPT4ge1xuICB0LmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgbGV0IHMgPSB0Ll9zdGFydFxuICBjb25zdCBhcnIgPSBbXVxuICB3aGlsZSAocykge1xuICAgIGFyci5wdXNoKHMpXG4gICAgcyA9IHMucmlnaHRcbiAgfVxuICByZXR1cm4gYXJyXG59XG5cbi8qKlxuICogQ2FsbCBldmVudCBsaXN0ZW5lcnMgd2l0aCBhbiBldmVudC4gVGhpcyB3aWxsIGFsc28gYWRkIGFuIGV2ZW50IHRvIGFsbFxuICogcGFyZW50cyAoZm9yIGAub2JzZXJ2ZURlZXBgIGhhbmRsZXJzKS5cbiAqXG4gKiBAdGVtcGxhdGUgRXZlbnRUeXBlXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxFdmVudFR5cGU+fSB0eXBlXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtFdmVudFR5cGV9IGV2ZW50XG4gKi9cbmV4cG9ydCBjb25zdCBjYWxsVHlwZU9ic2VydmVycyA9ICh0eXBlLCB0cmFuc2FjdGlvbiwgZXZlbnQpID0+IHtcbiAgY29uc3QgY2hhbmdlZFR5cGUgPSB0eXBlXG4gIGNvbnN0IGNoYW5nZWRQYXJlbnRUeXBlcyA9IHRyYW5zYWN0aW9uLmNoYW5nZWRQYXJlbnRUeXBlc1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBtYXAuc2V0SWZVbmRlZmluZWQoY2hhbmdlZFBhcmVudFR5cGVzLCB0eXBlLCAoKSA9PiBbXSkucHVzaChldmVudClcbiAgICBpZiAodHlwZS5faXRlbSA9PT0gbnVsbCkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gICAgdHlwZSA9IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0eXBlLl9pdGVtLnBhcmVudClcbiAgfVxuICBjYWxsRXZlbnRIYW5kbGVyTGlzdGVuZXJzKGNoYW5nZWRUeXBlLl9lSCwgZXZlbnQsIHRyYW5zYWN0aW9uKVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBFdmVudFR5cGVcbiAqIEFic3RyYWN0IFlqcyBUeXBlIGNsYXNzXG4gKi9cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdFR5cGUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLl9pdGVtID0gbnVsbFxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLEl0ZW0+fVxuICAgICAqL1xuICAgIHRoaXMuX21hcCA9IG5ldyBNYXAoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAgICovXG4gICAgdGhpcy5fc3RhcnQgPSBudWxsXG4gICAgLyoqXG4gICAgICogQHR5cGUge0RvY3xudWxsfVxuICAgICAqL1xuICAgIHRoaXMuZG9jID0gbnVsbFxuICAgIHRoaXMuX2xlbmd0aCA9IDBcbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqIEB0eXBlIHtFdmVudEhhbmRsZXI8RXZlbnRUeXBlLFRyYW5zYWN0aW9uPn1cbiAgICAgKi9cbiAgICB0aGlzLl9lSCA9IGNyZWF0ZUV2ZW50SGFuZGxlcigpXG4gICAgLyoqXG4gICAgICogRGVlcCBldmVudCBoYW5kbGVyc1xuICAgICAqIEB0eXBlIHtFdmVudEhhbmRsZXI8QXJyYXk8WUV2ZW50PGFueT4+LFRyYW5zYWN0aW9uPn1cbiAgICAgKi9cbiAgICB0aGlzLl9kRUggPSBjcmVhdGVFdmVudEhhbmRsZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudWxsIHwgQXJyYXk8QXJyYXlTZWFyY2hNYXJrZXI+fVxuICAgICAqL1xuICAgIHRoaXMuX3NlYXJjaE1hcmtlciA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBYnN0cmFjdFR5cGU8YW55PnxudWxsfVxuICAgKi9cbiAgZ2V0IHBhcmVudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2l0ZW0gPyAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5faXRlbS5wYXJlbnQpIDogbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEludGVncmF0ZSB0aGlzIHR5cGUgaW50byB0aGUgWWpzIGluc3RhbmNlLlxuICAgKlxuICAgKiAqIFNhdmUgdGhpcyBzdHJ1Y3QgaW4gdGhlIG9zXG4gICAqICogVGhpcyB0eXBlIGlzIHNlbnQgdG8gb3RoZXIgY2xpZW50XG4gICAqICogT2JzZXJ2ZXIgZnVuY3Rpb25zIGFyZSBmaXJlZFxuICAgKlxuICAgKiBAcGFyYW0ge0RvY30geSBUaGUgWWpzIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7SXRlbXxudWxsfSBpdGVtXG4gICAqL1xuICBfaW50ZWdyYXRlICh5LCBpdGVtKSB7XG4gICAgdGhpcy5kb2MgPSB5XG4gICAgdGhpcy5faXRlbSA9IGl0ZW1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBYnN0cmFjdFR5cGU8RXZlbnRUeXBlPn1cbiAgICovXG4gIF9jb3B5ICgpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIGNvcHkgb2YgdGhpcyBkYXRhIHR5cGUgdGhhdCBjYW4gYmUgaW5jbHVkZWQgc29tZXdoZXJlIGVsc2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgY29udGVudCBpcyBvbmx5IHJlYWRhYmxlIF9hZnRlcl8gaXQgaGFzIGJlZW4gaW5jbHVkZWQgc29tZXdoZXJlIGluIHRoZSBZZG9jLlxuICAgKlxuICAgKiBAcmV0dXJuIHtBYnN0cmFjdFR5cGU8RXZlbnRUeXBlPn1cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gX2VuY29kZXJcbiAgICovXG4gIF93cml0ZSAoX2VuY29kZXIpIHsgfVxuXG4gIC8qKlxuICAgKiBUaGUgZmlyc3Qgbm9uLWRlbGV0ZWQgaXRlbVxuICAgKi9cbiAgZ2V0IF9maXJzdCAoKSB7XG4gICAgbGV0IG4gPSB0aGlzLl9zdGFydFxuICAgIHdoaWxlIChuICE9PSBudWxsICYmIG4uZGVsZXRlZCkge1xuICAgICAgbiA9IG4ucmlnaHRcbiAgICB9XG4gICAgcmV0dXJuIG5cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFlFdmVudCBhbmQgY2FsbHMgYWxsIHR5cGUgb2JzZXJ2ZXJzLlxuICAgKiBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IGVhY2ggdHlwZS5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTZXQ8bnVsbHxzdHJpbmc+fSBfcGFyZW50U3VicyBLZXlzIGNoYW5nZWQgb24gdGhpcyB0eXBlLiBgbnVsbGAgaWYgbGlzdCB3YXMgbW9kaWZpZWQuXG4gICAqL1xuICBfY2FsbE9ic2VydmVyICh0cmFuc2FjdGlvbiwgX3BhcmVudFN1YnMpIHtcbiAgICBpZiAoIXRyYW5zYWN0aW9uLmxvY2FsICYmIHRoaXMuX3NlYXJjaE1hcmtlcikge1xuICAgICAgdGhpcy5fc2VhcmNoTWFya2VyLmxlbmd0aCA9IDBcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZSBhbGwgZXZlbnRzIHRoYXQgYXJlIGNyZWF0ZWQgb24gdGhpcyB0eXBlLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKEV2ZW50VHlwZSwgVHJhbnNhY3Rpb24pOnZvaWR9IGYgT2JzZXJ2ZXIgZnVuY3Rpb25cbiAgICovXG4gIG9ic2VydmUgKGYpIHtcbiAgICBhZGRFdmVudEhhbmRsZXJMaXN0ZW5lcih0aGlzLl9lSCwgZilcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnNlcnZlIGFsbCBldmVudHMgdGhhdCBhcmUgY3JlYXRlZCBieSB0aGlzIHR5cGUgYW5kIGl0cyBjaGlsZHJlbi5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbihBcnJheTxZRXZlbnQ8YW55Pj4sVHJhbnNhY3Rpb24pOnZvaWR9IGYgT2JzZXJ2ZXIgZnVuY3Rpb25cbiAgICovXG4gIG9ic2VydmVEZWVwIChmKSB7XG4gICAgYWRkRXZlbnRIYW5kbGVyTGlzdGVuZXIodGhpcy5fZEVILCBmKVxuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYW4gb2JzZXJ2ZXIgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oRXZlbnRUeXBlLFRyYW5zYWN0aW9uKTp2b2lkfSBmIE9ic2VydmVyIGZ1bmN0aW9uXG4gICAqL1xuICB1bm9ic2VydmUgKGYpIHtcbiAgICByZW1vdmVFdmVudEhhbmRsZXJMaXN0ZW5lcih0aGlzLl9lSCwgZilcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGFuIG9ic2VydmVyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKEFycmF5PFlFdmVudDxhbnk+PixUcmFuc2FjdGlvbik6dm9pZH0gZiBPYnNlcnZlciBmdW5jdGlvblxuICAgKi9cbiAgdW5vYnNlcnZlRGVlcCAoZikge1xuICAgIHJlbW92ZUV2ZW50SGFuZGxlckxpc3RlbmVyKHRoaXMuX2RFSCwgZilcbiAgfVxuXG4gIC8qKlxuICAgKiBAYWJzdHJhY3RcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgdG9KU09OICgpIHt9XG59XG5cbi8qKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gdHlwZVxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gKiBAcGFyYW0ge251bWJlcn0gZW5kXG4gKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0U2xpY2UgPSAodHlwZSwgc3RhcnQsIGVuZCkgPT4ge1xuICB0eXBlLmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gdHlwZS5fbGVuZ3RoICsgc3RhcnRcbiAgfVxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCA9IHR5cGUuX2xlbmd0aCArIGVuZFxuICB9XG4gIGxldCBsZW4gPSBlbmQgLSBzdGFydFxuICBjb25zdCBjcyA9IFtdXG4gIGxldCBuID0gdHlwZS5fc3RhcnRcbiAgd2hpbGUgKG4gIT09IG51bGwgJiYgbGVuID4gMCkge1xuICAgIGlmIChuLmNvdW50YWJsZSAmJiAhbi5kZWxldGVkKSB7XG4gICAgICBjb25zdCBjID0gbi5jb250ZW50LmdldENvbnRlbnQoKVxuICAgICAgaWYgKGMubGVuZ3RoIDw9IHN0YXJ0KSB7XG4gICAgICAgIHN0YXJ0IC09IGMubGVuZ3RoXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBjLmxlbmd0aCAmJiBsZW4gPiAwOyBpKyspIHtcbiAgICAgICAgICBjcy5wdXNoKGNbaV0pXG4gICAgICAgICAgbGVuLS1cbiAgICAgICAgfVxuICAgICAgICBzdGFydCA9IDBcbiAgICAgIH1cbiAgICB9XG4gICAgbiA9IG4ucmlnaHRcbiAgfVxuICByZXR1cm4gY3Ncbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB0eXBlXG4gKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0VG9BcnJheSA9IHR5cGUgPT4ge1xuICB0eXBlLmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgY29uc3QgY3MgPSBbXVxuICBsZXQgbiA9IHR5cGUuX3N0YXJ0XG4gIHdoaWxlIChuICE9PSBudWxsKSB7XG4gICAgaWYgKG4uY291bnRhYmxlICYmICFuLmRlbGV0ZWQpIHtcbiAgICAgIGNvbnN0IGMgPSBuLmNvbnRlbnQuZ2V0Q29udGVudCgpXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3MucHVzaChjW2ldKVxuICAgICAgfVxuICAgIH1cbiAgICBuID0gbi5yaWdodFxuICB9XG4gIHJldHVybiBjc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEBwYXJhbSB7U25hcHNob3R9IHNuYXBzaG90XG4gKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0VG9BcnJheVNuYXBzaG90ID0gKHR5cGUsIHNuYXBzaG90KSA9PiB7XG4gIGNvbnN0IGNzID0gW11cbiAgbGV0IG4gPSB0eXBlLl9zdGFydFxuICB3aGlsZSAobiAhPT0gbnVsbCkge1xuICAgIGlmIChuLmNvdW50YWJsZSAmJiBpc1Zpc2libGUobiwgc25hcHNob3QpKSB7XG4gICAgICBjb25zdCBjID0gbi5jb250ZW50LmdldENvbnRlbnQoKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNzLnB1c2goY1tpXSlcbiAgICAgIH1cbiAgICB9XG4gICAgbiA9IG4ucmlnaHRcbiAgfVxuICByZXR1cm4gY3Ncbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBhIHByb3ZpZGVkIGZ1bmN0aW9uIG9uIG9uY2Ugb24gZXZlcnkgZWxlbWVudCBvZiB0aGlzIFlBcnJheS5cbiAqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB0eXBlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGFueSxudW1iZXIsYW55KTp2b2lkfSBmIEEgZnVuY3Rpb24gdG8gZXhlY3V0ZSBvbiBldmVyeSBlbGVtZW50IG9mIHRoaXMgWUFycmF5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0Rm9yRWFjaCA9ICh0eXBlLCBmKSA9PiB7XG4gIGxldCBpbmRleCA9IDBcbiAgbGV0IG4gPSB0eXBlLl9zdGFydFxuICB0eXBlLmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgd2hpbGUgKG4gIT09IG51bGwpIHtcbiAgICBpZiAobi5jb3VudGFibGUgJiYgIW4uZGVsZXRlZCkge1xuICAgICAgY29uc3QgYyA9IG4uY29udGVudC5nZXRDb250ZW50KClcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmKGNbaV0sIGluZGV4KyssIHR5cGUpXG4gICAgICB9XG4gICAgfVxuICAgIG4gPSBuLnJpZ2h0XG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgQyxSXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB0eXBlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEMsbnVtYmVyLEFic3RyYWN0VHlwZTxhbnk+KTpSfSBmXG4gKiBAcmV0dXJuIHtBcnJheTxSPn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTGlzdE1hcCA9ICh0eXBlLCBmKSA9PiB7XG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGNvbnN0IHJlc3VsdCA9IFtdXG4gIHR5cGVMaXN0Rm9yRWFjaCh0eXBlLCAoYywgaSkgPT4ge1xuICAgIHJlc3VsdC5wdXNoKGYoYywgaSwgdHlwZSkpXG4gIH0pXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB0eXBlXG4gKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPGFueT59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RDcmVhdGVJdGVyYXRvciA9IHR5cGUgPT4ge1xuICBsZXQgbiA9IHR5cGUuX3N0YXJ0XG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8YW55PnxudWxsfVxuICAgKi9cbiAgbGV0IGN1cnJlbnRDb250ZW50ID0gbnVsbFxuICBsZXQgY3VycmVudENvbnRlbnRJbmRleCA9IDBcbiAgcmV0dXJuIHtcbiAgICBbU3ltYm9sLml0ZXJhdG9yXSAoKSB7XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH0sXG4gICAgbmV4dDogKCkgPT4ge1xuICAgICAgLy8gZmluZCBzb21lIGNvbnRlbnRcbiAgICAgIGlmIChjdXJyZW50Q29udGVudCA9PT0gbnVsbCkge1xuICAgICAgICB3aGlsZSAobiAhPT0gbnVsbCAmJiBuLmRlbGV0ZWQpIHtcbiAgICAgICAgICBuID0gbi5yaWdodFxuICAgICAgICB9XG4gICAgICAgIC8vIGNoZWNrIGlmIHdlIHJlYWNoZWQgdGhlIGVuZCwgbm8gbmVlZCB0byBjaGVjayBjdXJyZW50Q29udGVudCwgYmVjYXVzZSBpdCBkb2VzIG5vdCBleGlzdFxuICAgICAgICBpZiAobiA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkb25lOiB0cnVlLFxuICAgICAgICAgICAgdmFsdWU6IHVuZGVmaW5lZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB3ZSBmb3VuZCBuLCBzbyB3ZSBjYW4gc2V0IGN1cnJlbnRDb250ZW50XG4gICAgICAgIGN1cnJlbnRDb250ZW50ID0gbi5jb250ZW50LmdldENvbnRlbnQoKVxuICAgICAgICBjdXJyZW50Q29udGVudEluZGV4ID0gMFxuICAgICAgICBuID0gbi5yaWdodCAvLyB3ZSB1c2VkIHRoZSBjb250ZW50IG9mIG4sIG5vdyBpdGVyYXRlIHRvIG5leHRcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlID0gY3VycmVudENvbnRlbnRbY3VycmVudENvbnRlbnRJbmRleCsrXVxuICAgICAgLy8gY2hlY2sgaWYgd2UgbmVlZCB0byBlbXB0eSBjdXJyZW50Q29udGVudFxuICAgICAgaWYgKGN1cnJlbnRDb250ZW50Lmxlbmd0aCA8PSBjdXJyZW50Q29udGVudEluZGV4KSB7XG4gICAgICAgIGN1cnJlbnRDb250ZW50ID0gbnVsbFxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZG9uZTogZmFsc2UsXG4gICAgICAgIHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBwcm92aWRlZCBmdW5jdGlvbiBvbiBvbmNlIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhpcyBZQXJyYXkuXG4gKiBPcGVyYXRlcyBvbiBhIHNuYXBzaG90dGVkIHN0YXRlIG9mIHRoZSBkb2N1bWVudC5cbiAqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB0eXBlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGFueSxudW1iZXIsQWJzdHJhY3RUeXBlPGFueT4pOnZvaWR9IGYgQSBmdW5jdGlvbiB0byBleGVjdXRlIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhpcyBZQXJyYXkuXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwc2hvdFxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0Rm9yRWFjaFNuYXBzaG90ID0gKHR5cGUsIGYsIHNuYXBzaG90KSA9PiB7XG4gIGxldCBpbmRleCA9IDBcbiAgbGV0IG4gPSB0eXBlLl9zdGFydFxuICB3aGlsZSAobiAhPT0gbnVsbCkge1xuICAgIGlmIChuLmNvdW50YWJsZSAmJiBpc1Zpc2libGUobiwgc25hcHNob3QpKSB7XG4gICAgICBjb25zdCBjID0gbi5jb250ZW50LmdldENvbnRlbnQoKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGYoY1tpXSwgaW5kZXgrKywgdHlwZSlcbiAgICAgIH1cbiAgICB9XG4gICAgbiA9IG4ucmlnaHRcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICogQHJldHVybiB7YW55fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0R2V0ID0gKHR5cGUsIGluZGV4KSA9PiB7XG4gIHR5cGUuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICBjb25zdCBtYXJrZXIgPSBmaW5kTWFya2VyKHR5cGUsIGluZGV4KVxuICBsZXQgbiA9IHR5cGUuX3N0YXJ0XG4gIGlmIChtYXJrZXIgIT09IG51bGwpIHtcbiAgICBuID0gbWFya2VyLnBcbiAgICBpbmRleCAtPSBtYXJrZXIuaW5kZXhcbiAgfVxuICBmb3IgKDsgbiAhPT0gbnVsbDsgbiA9IG4ucmlnaHQpIHtcbiAgICBpZiAoIW4uZGVsZXRlZCAmJiBuLmNvdW50YWJsZSkge1xuICAgICAgaWYgKGluZGV4IDwgbi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG4uY29udGVudC5nZXRDb250ZW50KClbaW5kZXhdXG4gICAgICB9XG4gICAgICBpbmRleCAtPSBuLmxlbmd0aFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7SXRlbT99IHJlZmVyZW5jZUl0ZW1cbiAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0PHN0cmluZyxhbnk+fEFycmF5PGFueT58Ym9vbGVhbnxudW1iZXJ8bnVsbHxzdHJpbmd8VWludDhBcnJheT59IGNvbnRlbnRcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTGlzdEluc2VydEdlbmVyaWNzQWZ0ZXIgPSAodHJhbnNhY3Rpb24sIHBhcmVudCwgcmVmZXJlbmNlSXRlbSwgY29udGVudCkgPT4ge1xuICBsZXQgbGVmdCA9IHJlZmVyZW5jZUl0ZW1cbiAgY29uc3QgZG9jID0gdHJhbnNhY3Rpb24uZG9jXG4gIGNvbnN0IG93bkNsaWVudElkID0gZG9jLmNsaWVudElEXG4gIGNvbnN0IHN0b3JlID0gZG9jLnN0b3JlXG4gIGNvbnN0IHJpZ2h0ID0gcmVmZXJlbmNlSXRlbSA9PT0gbnVsbCA/IHBhcmVudC5fc3RhcnQgOiByZWZlcmVuY2VJdGVtLnJpZ2h0XG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8T2JqZWN0fEFycmF5PGFueT58bnVtYmVyfG51bGw+fVxuICAgKi9cbiAgbGV0IGpzb25Db250ZW50ID0gW11cbiAgY29uc3QgcGFja0pzb25Db250ZW50ID0gKCkgPT4ge1xuICAgIGlmIChqc29uQ29udGVudC5sZW5ndGggPiAwKSB7XG4gICAgICBsZWZ0ID0gbmV3IEl0ZW0oY3JlYXRlSUQob3duQ2xpZW50SWQsIGdldFN0YXRlKHN0b3JlLCBvd25DbGllbnRJZCkpLCBsZWZ0LCBsZWZ0ICYmIGxlZnQubGFzdElkLCByaWdodCwgcmlnaHQgJiYgcmlnaHQuaWQsIHBhcmVudCwgbnVsbCwgbmV3IENvbnRlbnRBbnkoanNvbkNvbnRlbnQpKVxuICAgICAgbGVmdC5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIDApXG4gICAgICBqc29uQ29udGVudCA9IFtdXG4gICAgfVxuICB9XG4gIGNvbnRlbnQuZm9yRWFjaChjID0+IHtcbiAgICBpZiAoYyA9PT0gbnVsbCkge1xuICAgICAganNvbkNvbnRlbnQucHVzaChjKVxuICAgIH0gZWxzZSB7XG4gICAgICBzd2l0Y2ggKGMuY29uc3RydWN0b3IpIHtcbiAgICAgICAgY2FzZSBOdW1iZXI6XG4gICAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgICBjYXNlIEJvb2xlYW46XG4gICAgICAgIGNhc2UgQXJyYXk6XG4gICAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICAgIGpzb25Db250ZW50LnB1c2goYylcbiAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHBhY2tKc29uQ29udGVudCgpXG4gICAgICAgICAgc3dpdGNoIChjLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjYXNlIFVpbnQ4QXJyYXk6XG4gICAgICAgICAgICBjYXNlIEFycmF5QnVmZmVyOlxuICAgICAgICAgICAgICBsZWZ0ID0gbmV3IEl0ZW0oY3JlYXRlSUQob3duQ2xpZW50SWQsIGdldFN0YXRlKHN0b3JlLCBvd25DbGllbnRJZCkpLCBsZWZ0LCBsZWZ0ICYmIGxlZnQubGFzdElkLCByaWdodCwgcmlnaHQgJiYgcmlnaHQuaWQsIHBhcmVudCwgbnVsbCwgbmV3IENvbnRlbnRCaW5hcnkobmV3IFVpbnQ4QXJyYXkoLyoqIEB0eXBlIHtVaW50OEFycmF5fSAqLyAoYykpKSlcbiAgICAgICAgICAgICAgbGVmdC5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIERvYzpcbiAgICAgICAgICAgICAgbGVmdCA9IG5ldyBJdGVtKGNyZWF0ZUlEKG93bkNsaWVudElkLCBnZXRTdGF0ZShzdG9yZSwgb3duQ2xpZW50SWQpKSwgbGVmdCwgbGVmdCAmJiBsZWZ0Lmxhc3RJZCwgcmlnaHQsIHJpZ2h0ICYmIHJpZ2h0LmlkLCBwYXJlbnQsIG51bGwsIG5ldyBDb250ZW50RG9jKC8qKiBAdHlwZSB7RG9jfSAqLyAoYykpKVxuICAgICAgICAgICAgICBsZWZ0LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGlmIChjIGluc3RhbmNlb2YgQWJzdHJhY3RUeXBlKSB7XG4gICAgICAgICAgICAgICAgbGVmdCA9IG5ldyBJdGVtKGNyZWF0ZUlEKG93bkNsaWVudElkLCBnZXRTdGF0ZShzdG9yZSwgb3duQ2xpZW50SWQpKSwgbGVmdCwgbGVmdCAmJiBsZWZ0Lmxhc3RJZCwgcmlnaHQsIHJpZ2h0ICYmIHJpZ2h0LmlkLCBwYXJlbnQsIG51bGwsIG5ldyBDb250ZW50VHlwZShjKSlcbiAgICAgICAgICAgICAgICBsZWZ0LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgY29udGVudCB0eXBlIGluIGluc2VydCBvcGVyYXRpb24nKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcbiAgcGFja0pzb25Db250ZW50KClcbn1cblxuY29uc3QgbGVuZ3RoRXhjZWVkZWQgPSAoKSA9PiBlcnJvci5jcmVhdGUoJ0xlbmd0aCBleGNlZWRlZCEnKVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHtBcnJheTxPYmplY3Q8c3RyaW5nLGFueT58QXJyYXk8YW55PnxudW1iZXJ8bnVsbHxzdHJpbmd8VWludDhBcnJheT59IGNvbnRlbnRcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTGlzdEluc2VydEdlbmVyaWNzID0gKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGluZGV4LCBjb250ZW50KSA9PiB7XG4gIGlmIChpbmRleCA+IHBhcmVudC5fbGVuZ3RoKSB7XG4gICAgdGhyb3cgbGVuZ3RoRXhjZWVkZWQoKVxuICB9XG4gIGlmIChpbmRleCA9PT0gMCkge1xuICAgIGlmIChwYXJlbnQuX3NlYXJjaE1hcmtlcikge1xuICAgICAgdXBkYXRlTWFya2VyQ2hhbmdlcyhwYXJlbnQuX3NlYXJjaE1hcmtlciwgaW5kZXgsIGNvbnRlbnQubGVuZ3RoKVxuICAgIH1cbiAgICByZXR1cm4gdHlwZUxpc3RJbnNlcnRHZW5lcmljc0FmdGVyKHRyYW5zYWN0aW9uLCBwYXJlbnQsIG51bGwsIGNvbnRlbnQpXG4gIH1cbiAgY29uc3Qgc3RhcnRJbmRleCA9IGluZGV4XG4gIGNvbnN0IG1hcmtlciA9IGZpbmRNYXJrZXIocGFyZW50LCBpbmRleClcbiAgbGV0IG4gPSBwYXJlbnQuX3N0YXJ0XG4gIGlmIChtYXJrZXIgIT09IG51bGwpIHtcbiAgICBuID0gbWFya2VyLnBcbiAgICBpbmRleCAtPSBtYXJrZXIuaW5kZXhcbiAgICAvLyB3ZSBuZWVkIHRvIGl0ZXJhdGUgb25lIHRvIHRoZSBsZWZ0IHNvIHRoYXQgdGhlIGFsZ29yaXRobSB3b3Jrc1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgLy8gQHRvZG8gcmVmYWN0b3IgdGhpcyBhcyBpdCBhY3R1YWxseSBkb2Vzbid0IGNvbnNpZGVyIGZvcm1hdHNcbiAgICAgIG4gPSBuLnByZXYgLy8gaW1wb3J0YW50ISBnZXQgdGhlIGxlZnQgdW5kZWxldGVkIGl0ZW0gc28gdGhhdCB3ZSBjYW4gYWN0dWFsbHkgZGVjcmVhc2UgaW5kZXhcbiAgICAgIGluZGV4ICs9IChuICYmIG4uY291bnRhYmxlICYmICFuLmRlbGV0ZWQpID8gbi5sZW5ndGggOiAwXG4gICAgfVxuICB9XG4gIGZvciAoOyBuICE9PSBudWxsOyBuID0gbi5yaWdodCkge1xuICAgIGlmICghbi5kZWxldGVkICYmIG4uY291bnRhYmxlKSB7XG4gICAgICBpZiAoaW5kZXggPD0gbi5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGluZGV4IDwgbi5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBpbnNlcnQgaW4tYmV0d2VlblxuICAgICAgICAgIGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBjcmVhdGVJRChuLmlkLmNsaWVudCwgbi5pZC5jbG9jayArIGluZGV4KSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgaW5kZXggLT0gbi5sZW5ndGhcbiAgICB9XG4gIH1cbiAgaWYgKHBhcmVudC5fc2VhcmNoTWFya2VyKSB7XG4gICAgdXBkYXRlTWFya2VyQ2hhbmdlcyhwYXJlbnQuX3NlYXJjaE1hcmtlciwgc3RhcnRJbmRleCwgY29udGVudC5sZW5ndGgpXG4gIH1cbiAgcmV0dXJuIHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3NBZnRlcih0cmFuc2FjdGlvbiwgcGFyZW50LCBuLCBjb250ZW50KVxufVxuXG4vKipcbiAqIFB1c2hpbmcgY29udGVudCBpcyBzcGVjaWFsIGFzIHdlIGdlbmVyYWxseSB3YW50IHRvIHB1c2ggYWZ0ZXIgdGhlIGxhc3QgaXRlbS4gU28gd2UgZG9uJ3QgaGF2ZSB0byB1cGRhdGVcbiAqIHRoZSBzZXJhY2ggbWFya2VyLlxuICpcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0PHN0cmluZyxhbnk+fEFycmF5PGFueT58bnVtYmVyfG51bGx8c3RyaW5nfFVpbnQ4QXJyYXk+fSBjb250ZW50XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RQdXNoR2VuZXJpY3MgPSAodHJhbnNhY3Rpb24sIHBhcmVudCwgY29udGVudCkgPT4ge1xuICAvLyBVc2UgdGhlIG1hcmtlciB3aXRoIHRoZSBoaWdoZXN0IGluZGV4IGFuZCBpdGVyYXRlIHRvIHRoZSByaWdodC5cbiAgY29uc3QgbWFya2VyID0gKHBhcmVudC5fc2VhcmNoTWFya2VyIHx8IFtdKS5yZWR1Y2UoKG1heE1hcmtlciwgY3Vyck1hcmtlcikgPT4gY3Vyck1hcmtlci5pbmRleCA+IG1heE1hcmtlci5pbmRleCA/IGN1cnJNYXJrZXIgOiBtYXhNYXJrZXIsIHsgaW5kZXg6IDAsIHA6IHBhcmVudC5fc3RhcnQgfSlcbiAgbGV0IG4gPSBtYXJrZXIucFxuICBpZiAobikge1xuICAgIHdoaWxlIChuLnJpZ2h0KSB7XG4gICAgICBuID0gbi5yaWdodFxuICAgIH1cbiAgfVxuICByZXR1cm4gdHlwZUxpc3RJbnNlcnRHZW5lcmljc0FmdGVyKHRyYW5zYWN0aW9uLCBwYXJlbnQsIG4sIGNvbnRlbnQpXG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3REZWxldGUgPSAodHJhbnNhY3Rpb24sIHBhcmVudCwgaW5kZXgsIGxlbmd0aCkgPT4ge1xuICBpZiAobGVuZ3RoID09PSAwKSB7IHJldHVybiB9XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSBpbmRleFxuICBjb25zdCBzdGFydExlbmd0aCA9IGxlbmd0aFxuICBjb25zdCBtYXJrZXIgPSBmaW5kTWFya2VyKHBhcmVudCwgaW5kZXgpXG4gIGxldCBuID0gcGFyZW50Ll9zdGFydFxuICBpZiAobWFya2VyICE9PSBudWxsKSB7XG4gICAgbiA9IG1hcmtlci5wXG4gICAgaW5kZXggLT0gbWFya2VyLmluZGV4XG4gIH1cbiAgLy8gY29tcHV0ZSB0aGUgZmlyc3QgaXRlbSB0byBiZSBkZWxldGVkXG4gIGZvciAoOyBuICE9PSBudWxsICYmIGluZGV4ID4gMDsgbiA9IG4ucmlnaHQpIHtcbiAgICBpZiAoIW4uZGVsZXRlZCAmJiBuLmNvdW50YWJsZSkge1xuICAgICAgaWYgKGluZGV4IDwgbi5sZW5ndGgpIHtcbiAgICAgICAgZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGNyZWF0ZUlEKG4uaWQuY2xpZW50LCBuLmlkLmNsb2NrICsgaW5kZXgpKVxuICAgICAgfVxuICAgICAgaW5kZXggLT0gbi5sZW5ndGhcbiAgICB9XG4gIH1cbiAgLy8gZGVsZXRlIGFsbCBpdGVtcyB1bnRpbCBkb25lXG4gIHdoaWxlIChsZW5ndGggPiAwICYmIG4gIT09IG51bGwpIHtcbiAgICBpZiAoIW4uZGVsZXRlZCkge1xuICAgICAgaWYgKGxlbmd0aCA8IG4ubGVuZ3RoKSB7XG4gICAgICAgIGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBjcmVhdGVJRChuLmlkLmNsaWVudCwgbi5pZC5jbG9jayArIGxlbmd0aCkpXG4gICAgICB9XG4gICAgICBuLmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgIGxlbmd0aCAtPSBuLmxlbmd0aFxuICAgIH1cbiAgICBuID0gbi5yaWdodFxuICB9XG4gIGlmIChsZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgbGVuZ3RoRXhjZWVkZWQoKVxuICB9XG4gIGlmIChwYXJlbnQuX3NlYXJjaE1hcmtlcikge1xuICAgIHVwZGF0ZU1hcmtlckNoYW5nZXMocGFyZW50Ll9zZWFyY2hNYXJrZXIsIHN0YXJ0SW5kZXgsIC1zdGFydExlbmd0aCArIGxlbmd0aCAvKiBpbiBjYXNlIHdlIHJlbW92ZSB0aGUgYWJvdmUgZXhjZXB0aW9uICovKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVNYXBEZWxldGUgPSAodHJhbnNhY3Rpb24sIHBhcmVudCwga2V5KSA9PiB7XG4gIGNvbnN0IGMgPSBwYXJlbnQuX21hcC5nZXQoa2V5KVxuICBpZiAoYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgYy5kZWxldGUodHJhbnNhY3Rpb24pXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge09iamVjdHxudW1iZXJ8bnVsbHxBcnJheTxhbnk+fHN0cmluZ3xVaW50OEFycmF5fEFic3RyYWN0VHlwZTxhbnk+fSB2YWx1ZVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVNYXBTZXQgPSAodHJhbnNhY3Rpb24sIHBhcmVudCwga2V5LCB2YWx1ZSkgPT4ge1xuICBjb25zdCBsZWZ0ID0gcGFyZW50Ll9tYXAuZ2V0KGtleSkgfHwgbnVsbFxuICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgY29uc3Qgb3duQ2xpZW50SWQgPSBkb2MuY2xpZW50SURcbiAgbGV0IGNvbnRlbnRcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBjb250ZW50ID0gbmV3IENvbnRlbnRBbnkoW3ZhbHVlXSlcbiAgfSBlbHNlIHtcbiAgICBzd2l0Y2ggKHZhbHVlLmNvbnN0cnVjdG9yKSB7XG4gICAgICBjYXNlIE51bWJlcjpcbiAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgY2FzZSBCb29sZWFuOlxuICAgICAgY2FzZSBBcnJheTpcbiAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICBjb250ZW50ID0gbmV3IENvbnRlbnRBbnkoW3ZhbHVlXSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgVWludDhBcnJheTpcbiAgICAgICAgY29udGVudCA9IG5ldyBDb250ZW50QmluYXJ5KC8qKiBAdHlwZSB7VWludDhBcnJheX0gKi8gKHZhbHVlKSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgRG9jOlxuICAgICAgICBjb250ZW50ID0gbmV3IENvbnRlbnREb2MoLyoqIEB0eXBlIHtEb2N9ICovICh2YWx1ZSkpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBYnN0cmFjdFR5cGUpIHtcbiAgICAgICAgICBjb250ZW50ID0gbmV3IENvbnRlbnRUeXBlKHZhbHVlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBjb250ZW50IHR5cGUnKVxuICAgICAgICB9XG4gICAgfVxuICB9XG4gIG5ldyBJdGVtKGNyZWF0ZUlEKG93bkNsaWVudElkLCBnZXRTdGF0ZShkb2Muc3RvcmUsIG93bkNsaWVudElkKSksIGxlZnQsIGxlZnQgJiYgbGVmdC5sYXN0SWQsIG51bGwsIG51bGwsIHBhcmVudCwga2V5LCBjb250ZW50KS5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIDApXG59XG5cbi8qKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLGFueT58bnVtYmVyfG51bGx8QXJyYXk8YW55PnxzdHJpbmd8VWludDhBcnJheXxBYnN0cmFjdFR5cGU8YW55Pnx1bmRlZmluZWR9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZU1hcEdldCA9IChwYXJlbnQsIGtleSkgPT4ge1xuICBwYXJlbnQuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICBjb25zdCB2YWwgPSBwYXJlbnQuX21hcC5nZXQoa2V5KVxuICByZXR1cm4gdmFsICE9PSB1bmRlZmluZWQgJiYgIXZhbC5kZWxldGVkID8gdmFsLmNvbnRlbnQuZ2V0Q29udGVudCgpW3ZhbC5sZW5ndGggLSAxXSA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHJldHVybiB7T2JqZWN0PHN0cmluZyxPYmplY3Q8c3RyaW5nLGFueT58bnVtYmVyfG51bGx8QXJyYXk8YW55PnxzdHJpbmd8VWludDhBcnJheXxBYnN0cmFjdFR5cGU8YW55Pnx1bmRlZmluZWQ+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVNYXBHZXRBbGwgPSAocGFyZW50KSA9PiB7XG4gIC8qKlxuICAgKiBAdHlwZSB7T2JqZWN0PHN0cmluZyxhbnk+fVxuICAgKi9cbiAgY29uc3QgcmVzID0ge31cbiAgcGFyZW50LmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgcGFyZW50Ll9tYXAuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgIGlmICghdmFsdWUuZGVsZXRlZCkge1xuICAgICAgcmVzW2tleV0gPSB2YWx1ZS5jb250ZW50LmdldENvbnRlbnQoKVt2YWx1ZS5sZW5ndGggLSAxXVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIHJlc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTWFwSGFzID0gKHBhcmVudCwga2V5KSA9PiB7XG4gIHBhcmVudC5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gIGNvbnN0IHZhbCA9IHBhcmVudC5fbWFwLmdldChrZXkpXG4gIHJldHVybiB2YWwgIT09IHVuZGVmaW5lZCAmJiAhdmFsLmRlbGV0ZWRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7U25hcHNob3R9IHNuYXBzaG90XG4gKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLGFueT58bnVtYmVyfG51bGx8QXJyYXk8YW55PnxzdHJpbmd8VWludDhBcnJheXxBYnN0cmFjdFR5cGU8YW55Pnx1bmRlZmluZWR9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZU1hcEdldFNuYXBzaG90ID0gKHBhcmVudCwga2V5LCBzbmFwc2hvdCkgPT4ge1xuICBsZXQgdiA9IHBhcmVudC5fbWFwLmdldChrZXkpIHx8IG51bGxcbiAgd2hpbGUgKHYgIT09IG51bGwgJiYgKCFzbmFwc2hvdC5zdi5oYXModi5pZC5jbGllbnQpIHx8IHYuaWQuY2xvY2sgPj0gKHNuYXBzaG90LnN2LmdldCh2LmlkLmNsaWVudCkgfHwgMCkpKSB7XG4gICAgdiA9IHYubGVmdFxuICB9XG4gIHJldHVybiB2ICE9PSBudWxsICYmIGlzVmlzaWJsZSh2LCBzbmFwc2hvdCkgPyB2LmNvbnRlbnQuZ2V0Q29udGVudCgpW3YubGVuZ3RoIC0gMV0gOiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7U25hcHNob3R9IHNuYXBzaG90XG4gKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLE9iamVjdDxzdHJpbmcsYW55PnxudW1iZXJ8bnVsbHxBcnJheTxhbnk+fHN0cmluZ3xVaW50OEFycmF5fEFic3RyYWN0VHlwZTxhbnk+fHVuZGVmaW5lZD59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZU1hcEdldEFsbFNuYXBzaG90ID0gKHBhcmVudCwgc25hcHNob3QpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAqL1xuICBjb25zdCByZXMgPSB7fVxuICBwYXJlbnQuX21hcC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICAgKi9cbiAgICBsZXQgdiA9IHZhbHVlXG4gICAgd2hpbGUgKHYgIT09IG51bGwgJiYgKCFzbmFwc2hvdC5zdi5oYXModi5pZC5jbGllbnQpIHx8IHYuaWQuY2xvY2sgPj0gKHNuYXBzaG90LnN2LmdldCh2LmlkLmNsaWVudCkgfHwgMCkpKSB7XG4gICAgICB2ID0gdi5sZWZ0XG4gICAgfVxuICAgIGlmICh2ICE9PSBudWxsICYmIGlzVmlzaWJsZSh2LCBzbmFwc2hvdCkpIHtcbiAgICAgIHJlc1trZXldID0gdi5jb250ZW50LmdldENvbnRlbnQoKVt2Lmxlbmd0aCAtIDFdXG4gICAgfVxuICB9KVxuICByZXR1cm4gcmVzXG59XG5cbi8qKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55PiAmIHsgX21hcDogTWFwPHN0cmluZywgSXRlbT4gfX0gdHlwZVxuICogQHJldHVybiB7SXRlcmFibGVJdGVyYXRvcjxBcnJheTxhbnk+Pn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVNYXBJdGVyYXRvciA9IHR5cGUgPT4ge1xuICB0eXBlLmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgcmV0dXJuIGl0ZXJhdG9yLml0ZXJhdG9yRmlsdGVyKHR5cGUuX21hcC5lbnRyaWVzKCksIC8qKiBAcGFyYW0ge2FueX0gZW50cnkgKi8gZW50cnkgPT4gIWVudHJ5WzFdLmRlbGV0ZWQpXG59XG4iLCAiLyoqXG4gKiBAbW9kdWxlIFlBcnJheVxuICovXG5cbmltcG9ydCB7XG4gIFlFdmVudCxcbiAgQWJzdHJhY3RUeXBlLFxuICB0eXBlTGlzdEdldCxcbiAgdHlwZUxpc3RUb0FycmF5LFxuICB0eXBlTGlzdEZvckVhY2gsXG4gIHR5cGVMaXN0Q3JlYXRlSXRlcmF0b3IsXG4gIHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3MsXG4gIHR5cGVMaXN0UHVzaEdlbmVyaWNzLFxuICB0eXBlTGlzdERlbGV0ZSxcbiAgdHlwZUxpc3RNYXAsXG4gIFlBcnJheVJlZklELFxuICBjYWxsVHlwZU9ic2VydmVycyxcbiAgdHJhbnNhY3QsXG4gIHdhcm5QcmVtYXR1cmVBY2Nlc3MsXG4gIEFycmF5U2VhcmNoTWFya2VyLCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIERvYywgVHJhbnNhY3Rpb24sIEl0ZW0gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5pbXBvcnQgeyB0eXBlTGlzdFNsaWNlIH0gZnJvbSAnLi9BYnN0cmFjdFR5cGUuanMnXG5cbi8qKlxuICogRXZlbnQgdGhhdCBkZXNjcmliZXMgdGhlIGNoYW5nZXMgb24gYSBZQXJyYXlcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAZXh0ZW5kcyBZRXZlbnQ8WUFycmF5PFQ+PlxuICovXG5leHBvcnQgY2xhc3MgWUFycmF5RXZlbnQgZXh0ZW5kcyBZRXZlbnQge31cblxuLyoqXG4gKiBBIHNoYXJlZCBBcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAZXh0ZW5kcyBBYnN0cmFjdFR5cGU8WUFycmF5RXZlbnQ8VD4+XG4gKiBAaW1wbGVtZW50cyB7SXRlcmFibGU8VD59XG4gKi9cbmV4cG9ydCBjbGFzcyBZQXJyYXkgZXh0ZW5kcyBBYnN0cmFjdFR5cGUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxhbnk+P31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX3ByZWxpbUNvbnRlbnQgPSBbXVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxBcnJheVNlYXJjaE1hcmtlcj59XG4gICAgICovXG4gICAgdGhpcy5fc2VhcmNoTWFya2VyID0gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBuZXcgWUFycmF5IGNvbnRhaW5pbmcgdGhlIHNwZWNpZmllZCBpdGVtcy5cbiAgICogQHRlbXBsYXRlIHtPYmplY3Q8c3RyaW5nLGFueT58QXJyYXk8YW55PnxudW1iZXJ8bnVsbHxzdHJpbmd8VWludDhBcnJheX0gVFxuICAgKiBAcGFyYW0ge0FycmF5PFQ+fSBpdGVtc1xuICAgKiBAcmV0dXJuIHtZQXJyYXk8VD59XG4gICAqL1xuICBzdGF0aWMgZnJvbSAoaXRlbXMpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7WUFycmF5PFQ+fVxuICAgICAqL1xuICAgIGNvbnN0IGEgPSBuZXcgWUFycmF5KClcbiAgICBhLnB1c2goaXRlbXMpXG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlZ3JhdGUgdGhpcyB0eXBlIGludG8gdGhlIFlqcyBpbnN0YW5jZS5cbiAgICpcbiAgICogKiBTYXZlIHRoaXMgc3RydWN0IGluIHRoZSBvc1xuICAgKiAqIFRoaXMgdHlwZSBpcyBzZW50IHRvIG90aGVyIGNsaWVudFxuICAgKiAqIE9ic2VydmVyIGZ1bmN0aW9ucyBhcmUgZmlyZWRcbiAgICpcbiAgICogQHBhcmFtIHtEb2N9IHkgVGhlIFlqcyBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIF9pbnRlZ3JhdGUgKHksIGl0ZW0pIHtcbiAgICBzdXBlci5faW50ZWdyYXRlKHksIGl0ZW0pXG4gICAgdGhpcy5pbnNlcnQoMCwgLyoqIEB0eXBlIHtBcnJheTxhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudCkpXG4gICAgdGhpcy5fcHJlbGltQ29udGVudCA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtZQXJyYXk8VD59XG4gICAqL1xuICBfY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBZQXJyYXkoKVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgY29weSBvZiB0aGlzIGRhdGEgdHlwZSB0aGF0IGNhbiBiZSBpbmNsdWRlZCBzb21ld2hlcmUgZWxzZS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoZSBjb250ZW50IGlzIG9ubHkgcmVhZGFibGUgX2FmdGVyXyBpdCBoYXMgYmVlbiBpbmNsdWRlZCBzb21ld2hlcmUgaW4gdGhlIFlkb2MuXG4gICAqXG4gICAqIEByZXR1cm4ge1lBcnJheTxUPn1cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7WUFycmF5PFQ+fVxuICAgICAqL1xuICAgIGNvbnN0IGFyciA9IG5ldyBZQXJyYXkoKVxuICAgIGFyci5pbnNlcnQoMCwgdGhpcy50b0FycmF5KCkubWFwKGVsID0+XG4gICAgICBlbCBpbnN0YW5jZW9mIEFic3RyYWN0VHlwZSA/IC8qKiBAdHlwZSB7dHlwZW9mIGVsfSAqLyAoZWwuY2xvbmUoKSkgOiBlbFxuICAgICkpXG4gICAgcmV0dXJuIGFyclxuICB9XG5cbiAgZ2V0IGxlbmd0aCAoKSB7XG4gICAgdGhpcy5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gICAgcmV0dXJuIHRoaXMuX2xlbmd0aFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgWUFycmF5RXZlbnQgYW5kIGNhbGxzIG9ic2VydmVycy5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTZXQ8bnVsbHxzdHJpbmc+fSBwYXJlbnRTdWJzIEtleXMgY2hhbmdlZCBvbiB0aGlzIHR5cGUuIGBudWxsYCBpZiBsaXN0IHdhcyBtb2RpZmllZC5cbiAgICovXG4gIF9jYWxsT2JzZXJ2ZXIgKHRyYW5zYWN0aW9uLCBwYXJlbnRTdWJzKSB7XG4gICAgc3VwZXIuX2NhbGxPYnNlcnZlcih0cmFuc2FjdGlvbiwgcGFyZW50U3VicylcbiAgICBjYWxsVHlwZU9ic2VydmVycyh0aGlzLCB0cmFuc2FjdGlvbiwgbmV3IFlBcnJheUV2ZW50KHRoaXMsIHRyYW5zYWN0aW9uKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnRzIG5ldyBjb250ZW50IGF0IGFuIGluZGV4LlxuICAgKlxuICAgKiBJbXBvcnRhbnQ6IFRoaXMgZnVuY3Rpb24gZXhwZWN0cyBhbiBhcnJheSBvZiBjb250ZW50LiBOb3QganVzdCBhIGNvbnRlbnRcbiAgICogb2JqZWN0LiBUaGUgcmVhc29uIGZvciB0aGlzIFwid2VpcmRuZXNzXCIgaXMgdGhhdCBpbnNlcnRpbmcgc2V2ZXJhbCBlbGVtZW50c1xuICAgKiBpcyB2ZXJ5IGVmZmljaWVudCB3aGVuIGl0IGlzIGRvbmUgYXMgYSBzaW5nbGUgb3BlcmF0aW9uLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgLy8gSW5zZXJ0IGNoYXJhY3RlciAnYScgYXQgcG9zaXRpb24gMFxuICAgKiAgeWFycmF5Lmluc2VydCgwLCBbJ2EnXSlcbiAgICogIC8vIEluc2VydCBudW1iZXJzIDEsIDIgYXQgcG9zaXRpb24gMVxuICAgKiAgeWFycmF5Lmluc2VydCgxLCBbMSwgMl0pXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBUaGUgaW5kZXggdG8gaW5zZXJ0IGNvbnRlbnQgYXQuXG4gICAqIEBwYXJhbSB7QXJyYXk8VD59IGNvbnRlbnQgVGhlIGFycmF5IG9mIGNvbnRlbnRcbiAgICovXG4gIGluc2VydCAoaW5kZXgsIGNvbnRlbnQpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3ModHJhbnNhY3Rpb24sIHRoaXMsIGluZGV4LCAvKiogQHR5cGUge2FueX0gKi8gKGNvbnRlbnQpKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudCkuc3BsaWNlKGluZGV4LCAwLCAuLi5jb250ZW50KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIGNvbnRlbnQgdG8gdGhpcyBZQXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXk8VD59IGNvbnRlbnQgQXJyYXkgb2YgY29udGVudCB0byBhcHBlbmQuXG4gICAqXG4gICAqIEB0b2RvIFVzZSB0aGUgZm9sbG93aW5nIGltcGxlbWVudGF0aW9uIGluIGFsbCB0eXBlcy5cbiAgICovXG4gIHB1c2ggKGNvbnRlbnQpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHR5cGVMaXN0UHVzaEdlbmVyaWNzKHRyYW5zYWN0aW9uLCB0aGlzLCAvKiogQHR5cGUge2FueX0gKi8gKGNvbnRlbnQpKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudCkucHVzaCguLi5jb250ZW50KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwZW5kcyBjb250ZW50IHRvIHRoaXMgWUFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5PFQ+fSBjb250ZW50IEFycmF5IG9mIGNvbnRlbnQgdG8gcHJlcGVuZC5cbiAgICovXG4gIHVuc2hpZnQgKGNvbnRlbnQpIHtcbiAgICB0aGlzLmluc2VydCgwLCBjb250ZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgZWxlbWVudHMgc3RhcnRpbmcgZnJvbSBhbiBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IEluZGV4IGF0IHdoaWNoIHRvIHN0YXJ0IGRlbGV0aW5nIGVsZW1lbnRzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggVGhlIG51bWJlciBvZiBlbGVtZW50cyB0byByZW1vdmUuIERlZmF1bHRzIHRvIDEuXG4gICAqL1xuICBkZWxldGUgKGluZGV4LCBsZW5ndGggPSAxKSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTGlzdERlbGV0ZSh0cmFuc2FjdGlvbiwgdGhpcywgaW5kZXgsIGxlbmd0aClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7QXJyYXk8YW55Pn0gKi8gKHRoaXMuX3ByZWxpbUNvbnRlbnQpLnNwbGljZShpbmRleCwgbGVuZ3RoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpLXRoIGVsZW1lbnQgZnJvbSBhIFlBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byByZXR1cm4gZnJvbSB0aGUgWUFycmF5XG4gICAqIEByZXR1cm4ge1R9XG4gICAqL1xuICBnZXQgKGluZGV4KSB7XG4gICAgcmV0dXJuIHR5cGVMaXN0R2V0KHRoaXMsIGluZGV4KVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgdGhpcyBZQXJyYXkgdG8gYSBKYXZhU2NyaXB0IEFycmF5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAgICovXG4gIHRvQXJyYXkgKCkge1xuICAgIHJldHVybiB0eXBlTGlzdFRvQXJyYXkodGhpcylcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcG9ydGlvbiBvZiB0aGlzIFlBcnJheSBpbnRvIGEgSmF2YVNjcmlwdCBBcnJheSBzZWxlY3RlZFxuICAgKiBmcm9tIHN0YXJ0IHRvIGVuZCAoZW5kIG5vdCBpbmNsdWRlZCkuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZW5kXVxuICAgKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAgICovXG4gIHNsaWNlIChzdGFydCA9IDAsIGVuZCA9IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHR5cGVMaXN0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIHRoaXMgU2hhcmVkIFR5cGUgdG8gYSBKU09OIG9iamVjdC5cbiAgICpcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIHRvSlNPTiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwKGMgPT4gYyBpbnN0YW5jZW9mIEFic3RyYWN0VHlwZSA/IGMudG9KU09OKCkgOiBjKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gQXJyYXkgd2l0aCB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgYSBwcm92aWRlZCBmdW5jdGlvbiBvbiBldmVyeVxuICAgKiBlbGVtZW50IG9mIHRoaXMgWUFycmF5LlxuICAgKlxuICAgKiBAdGVtcGxhdGUgTVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFQsbnVtYmVyLFlBcnJheTxUPik6TX0gZiBGdW5jdGlvbiB0aGF0IHByb2R1Y2VzIGFuIGVsZW1lbnQgb2YgdGhlIG5ldyBBcnJheVxuICAgKiBAcmV0dXJuIHtBcnJheTxNPn0gQSBuZXcgYXJyYXkgd2l0aCBlYWNoIGVsZW1lbnQgYmVpbmcgdGhlIHJlc3VsdCBvZiB0aGVcbiAgICogICAgICAgICAgICAgICAgIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICBtYXAgKGYpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RNYXAodGhpcywgLyoqIEB0eXBlIHthbnl9ICovIChmKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhIHByb3ZpZGVkIGZ1bmN0aW9uIG9uY2Ugb24gZXZlcnkgZWxlbWVudCBvZiB0aGlzIFlBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbihULG51bWJlcixZQXJyYXk8VD4pOnZvaWR9IGYgQSBmdW5jdGlvbiB0byBleGVjdXRlIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhpcyBZQXJyYXkuXG4gICAqL1xuICBmb3JFYWNoIChmKSB7XG4gICAgdHlwZUxpc3RGb3JFYWNoKHRoaXMsIGYpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7SXRlcmFibGVJdGVyYXRvcjxUPn1cbiAgICovXG4gIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RDcmVhdGVJdGVyYXRvcih0aGlzKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqL1xuICBfd3JpdGUgKGVuY29kZXIpIHtcbiAgICBlbmNvZGVyLndyaXRlVHlwZVJlZihZQXJyYXlSZWZJRClcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBfZGVjb2RlclxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRZQXJyYXkgPSBfZGVjb2RlciA9PiBuZXcgWUFycmF5KClcbiIsICIvKipcbiAqIEBtb2R1bGUgWU1hcFxuICovXG5cbmltcG9ydCB7XG4gIFlFdmVudCxcbiAgQWJzdHJhY3RUeXBlLFxuICB0eXBlTWFwRGVsZXRlLFxuICB0eXBlTWFwU2V0LFxuICB0eXBlTWFwR2V0LFxuICB0eXBlTWFwSGFzLFxuICBjcmVhdGVNYXBJdGVyYXRvcixcbiAgWU1hcFJlZklELFxuICBjYWxsVHlwZU9ic2VydmVycyxcbiAgdHJhbnNhY3QsXG4gIHdhcm5QcmVtYXR1cmVBY2Nlc3MsXG4gIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgRG9jLCBUcmFuc2FjdGlvbiwgSXRlbSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgaXRlcmF0b3IgZnJvbSAnbGliMC9pdGVyYXRvcidcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQGV4dGVuZHMgWUV2ZW50PFlNYXA8VD4+XG4gKiBFdmVudCB0aGF0IGRlc2NyaWJlcyB0aGUgY2hhbmdlcyBvbiBhIFlNYXAuXG4gKi9cbmV4cG9ydCBjbGFzcyBZTWFwRXZlbnQgZXh0ZW5kcyBZRXZlbnQge1xuICAvKipcbiAgICogQHBhcmFtIHtZTWFwPFQ+fSB5bWFwIFRoZSBZQXJyYXkgdGhhdCBjaGFuZ2VkLlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge1NldDxhbnk+fSBzdWJzIFRoZSBrZXlzIHRoYXQgY2hhbmdlZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yICh5bWFwLCB0cmFuc2FjdGlvbiwgc3Vicykge1xuICAgIHN1cGVyKHltYXAsIHRyYW5zYWN0aW9uKVxuICAgIHRoaXMua2V5c0NoYW5nZWQgPSBzdWJzXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgTWFwVHlwZVxuICogQSBzaGFyZWQgTWFwIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIEBleHRlbmRzIEFic3RyYWN0VHlwZTxZTWFwRXZlbnQ8TWFwVHlwZT4+XG4gKiBAaW1wbGVtZW50cyB7SXRlcmFibGU8W3N0cmluZywgTWFwVHlwZV0+fVxuICovXG5leHBvcnQgY2xhc3MgWU1hcCBleHRlbmRzIEFic3RyYWN0VHlwZSB7XG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge0l0ZXJhYmxlPHJlYWRvbmx5IFtzdHJpbmcsIGFueV0+PX0gZW50cmllcyAtIGFuIG9wdGlvbmFsIGl0ZXJhYmxlIHRvIGluaXRpYWxpemUgdGhlIFlNYXBcbiAgICovXG4gIGNvbnN0cnVjdG9yIChlbnRyaWVzKSB7XG4gICAgc3VwZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLGFueT4/fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fcHJlbGltQ29udGVudCA9IG51bGxcblxuICAgIGlmIChlbnRyaWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3ByZWxpbUNvbnRlbnQgPSBuZXcgTWFwKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHJlbGltQ29udGVudCA9IG5ldyBNYXAoZW50cmllcylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW50ZWdyYXRlIHRoaXMgdHlwZSBpbnRvIHRoZSBZanMgaW5zdGFuY2UuXG4gICAqXG4gICAqICogU2F2ZSB0aGlzIHN0cnVjdCBpbiB0aGUgb3NcbiAgICogKiBUaGlzIHR5cGUgaXMgc2VudCB0byBvdGhlciBjbGllbnRcbiAgICogKiBPYnNlcnZlciBmdW5jdGlvbnMgYXJlIGZpcmVkXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jfSB5IFRoZSBZanMgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBfaW50ZWdyYXRlICh5LCBpdGVtKSB7XG4gICAgc3VwZXIuX2ludGVncmF0ZSh5LCBpdGVtKVxuICAgIDsvKiogQHR5cGUge01hcDxzdHJpbmcsIGFueT59ICovICh0aGlzLl9wcmVsaW1Db250ZW50KS5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICB0aGlzLnNldChrZXksIHZhbHVlKVxuICAgIH0pXG4gICAgdGhpcy5fcHJlbGltQ29udGVudCA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtZTWFwPE1hcFR5cGU+fVxuICAgKi9cbiAgX2NvcHkgKCkge1xuICAgIHJldHVybiBuZXcgWU1hcCgpXG4gIH1cblxuICAvKipcbiAgICogTWFrZXMgYSBjb3B5IG9mIHRoaXMgZGF0YSB0eXBlIHRoYXQgY2FuIGJlIGluY2x1ZGVkIHNvbWV3aGVyZSBlbHNlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIGNvbnRlbnQgaXMgb25seSByZWFkYWJsZSBfYWZ0ZXJfIGl0IGhhcyBiZWVuIGluY2x1ZGVkIHNvbWV3aGVyZSBpbiB0aGUgWWRvYy5cbiAgICpcbiAgICogQHJldHVybiB7WU1hcDxNYXBUeXBlPn1cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7WU1hcDxNYXBUeXBlPn1cbiAgICAgKi9cbiAgICBjb25zdCBtYXAgPSBuZXcgWU1hcCgpXG4gICAgdGhpcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBtYXAuc2V0KGtleSwgdmFsdWUgaW5zdGFuY2VvZiBBYnN0cmFjdFR5cGUgPyAvKiogQHR5cGUge3R5cGVvZiB2YWx1ZX0gKi8gKHZhbHVlLmNsb25lKCkpIDogdmFsdWUpXG4gICAgfSlcbiAgICByZXR1cm4gbWFwXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBZTWFwRXZlbnQgYW5kIGNhbGxzIG9ic2VydmVycy5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTZXQ8bnVsbHxzdHJpbmc+fSBwYXJlbnRTdWJzIEtleXMgY2hhbmdlZCBvbiB0aGlzIHR5cGUuIGBudWxsYCBpZiBsaXN0IHdhcyBtb2RpZmllZC5cbiAgICovXG4gIF9jYWxsT2JzZXJ2ZXIgKHRyYW5zYWN0aW9uLCBwYXJlbnRTdWJzKSB7XG4gICAgY2FsbFR5cGVPYnNlcnZlcnModGhpcywgdHJhbnNhY3Rpb24sIG5ldyBZTWFwRXZlbnQodGhpcywgdHJhbnNhY3Rpb24sIHBhcmVudFN1YnMpKVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgdGhpcyBTaGFyZWQgVHlwZSB0byBhIEpTT04gb2JqZWN0LlxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAqL1xuICB0b0pTT04gKCkge1xuICAgIHRoaXMuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLE1hcFR5cGU+fVxuICAgICAqL1xuICAgIGNvbnN0IG1hcCA9IHt9XG4gICAgdGhpcy5fbWFwLmZvckVhY2goKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgaWYgKCFpdGVtLmRlbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgdiA9IGl0ZW0uY29udGVudC5nZXRDb250ZW50KClbaXRlbS5sZW5ndGggLSAxXVxuICAgICAgICBtYXBba2V5XSA9IHYgaW5zdGFuY2VvZiBBYnN0cmFjdFR5cGUgPyB2LnRvSlNPTigpIDogdlxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIG1hcFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHNpemUgb2YgdGhlIFlNYXAgKGNvdW50IG9mIGtleS92YWx1ZSBwYWlycylcbiAgICpcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IHNpemUgKCkge1xuICAgIHJldHVybiBbLi4uY3JlYXRlTWFwSXRlcmF0b3IodGhpcyldLmxlbmd0aFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGtleXMgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgWU1hcCBUeXBlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz59XG4gICAqL1xuICBrZXlzICgpIHtcbiAgICByZXR1cm4gaXRlcmF0b3IuaXRlcmF0b3JNYXAoY3JlYXRlTWFwSXRlcmF0b3IodGhpcyksIC8qKiBAcGFyYW0ge2FueX0gdiAqLyB2ID0+IHZbMF0pXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdmFsdWVzIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIFlNYXAgVHlwZS5cbiAgICpcbiAgICogQHJldHVybiB7SXRlcmFibGVJdGVyYXRvcjxNYXBUeXBlPn1cbiAgICovXG4gIHZhbHVlcyAoKSB7XG4gICAgcmV0dXJuIGl0ZXJhdG9yLml0ZXJhdG9yTWFwKGNyZWF0ZU1hcEl0ZXJhdG9yKHRoaXMpLCAvKiogQHBhcmFtIHthbnl9IHYgKi8gdiA9PiB2WzFdLmNvbnRlbnQuZ2V0Q29udGVudCgpW3ZbMV0ubGVuZ3RoIC0gMV0pXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBJdGVyYXRvciBvZiBba2V5LCB2YWx1ZV0gcGFpcnNcbiAgICpcbiAgICogQHJldHVybiB7SXRlcmFibGVJdGVyYXRvcjxbc3RyaW5nLCBNYXBUeXBlXT59XG4gICAqL1xuICBlbnRyaWVzICgpIHtcbiAgICByZXR1cm4gaXRlcmF0b3IuaXRlcmF0b3JNYXAoY3JlYXRlTWFwSXRlcmF0b3IodGhpcyksIC8qKiBAcGFyYW0ge2FueX0gdiAqLyB2ID0+IC8qKiBAdHlwZSB7YW55fSAqLyAoW3ZbMF0sIHZbMV0uY29udGVudC5nZXRDb250ZW50KClbdlsxXS5sZW5ndGggLSAxXV0pKVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGEgcHJvdmlkZWQgZnVuY3Rpb24gb24gb25jZSBvbiBldmVyeSBrZXktdmFsdWUgcGFpci5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbihNYXBUeXBlLHN0cmluZyxZTWFwPE1hcFR5cGU+KTp2b2lkfSBmIEEgZnVuY3Rpb24gdG8gZXhlY3V0ZSBvbiBldmVyeSBlbGVtZW50IG9mIHRoaXMgWUFycmF5LlxuICAgKi9cbiAgZm9yRWFjaCAoZikge1xuICAgIHRoaXMuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICAgIHRoaXMuX21hcC5mb3JFYWNoKChpdGVtLCBrZXkpID0+IHtcbiAgICAgIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgIGYoaXRlbS5jb250ZW50LmdldENvbnRlbnQoKVtpdGVtLmxlbmd0aCAtIDFdLCBrZXksIHRoaXMpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIEl0ZXJhdG9yIG9mIFtrZXksIHZhbHVlXSBwYWlyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPFtzdHJpbmcsIE1hcFR5cGVdPn1cbiAgICovXG4gIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzKClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBzcGVjaWZpZWQgZWxlbWVudCBmcm9tIHRoaXMgWU1hcC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbGVtZW50IHRvIHJlbW92ZS5cbiAgICovXG4gIGRlbGV0ZSAoa2V5KSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTWFwRGVsZXRlKHRyYW5zYWN0aW9uLCB0aGlzLCBrZXkpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge01hcDxzdHJpbmcsIGFueT59ICovICh0aGlzLl9wcmVsaW1Db250ZW50KS5kZWxldGUoa2V5KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG9yIHVwZGF0ZXMgYW4gZWxlbWVudCB3aXRoIGEgc3BlY2lmaWVkIGtleSBhbmQgdmFsdWUuXG4gICAqIEB0ZW1wbGF0ZSB7TWFwVHlwZX0gVkFMXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZWxlbWVudCB0byBhZGQgdG8gdGhpcyBZTWFwXG4gICAqIEBwYXJhbSB7VkFMfSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIGVsZW1lbnQgdG8gYWRkXG4gICAqIEByZXR1cm4ge1ZBTH1cbiAgICovXG4gIHNldCAoa2V5LCB2YWx1ZSkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHlwZU1hcFNldCh0cmFuc2FjdGlvbiwgdGhpcywga2V5LCAvKiogQHR5cGUge2FueX0gKi8gKHZhbHVlKSlcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgYW55Pn0gKi8gKHRoaXMuX3ByZWxpbUNvbnRlbnQpLnNldChrZXksIHZhbHVlKVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3BlY2lmaWVkIGVsZW1lbnQgZnJvbSB0aGlzIFlNYXAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHJldHVybiB7TWFwVHlwZXx1bmRlZmluZWR9XG4gICAqL1xuICBnZXQgKGtleSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKHR5cGVNYXBHZXQodGhpcywga2V5KSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHNwZWNpZmllZCBrZXkgZXhpc3RzIG9yIG5vdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIHRlc3QuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBoYXMgKGtleSkge1xuICAgIHJldHVybiB0eXBlTWFwSGFzKHRoaXMsIGtleSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBlbGVtZW50cyBmcm9tIHRoaXMgWU1hcC5cbiAgICovXG4gIGNsZWFyICgpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoX3ZhbHVlLCBrZXksIG1hcCkge1xuICAgICAgICAgIHR5cGVNYXBEZWxldGUodHJhbnNhY3Rpb24sIG1hcCwga2V5KVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudCkuY2xlYXIoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKi9cbiAgX3dyaXRlIChlbmNvZGVyKSB7XG4gICAgZW5jb2Rlci53cml0ZVR5cGVSZWYoWU1hcFJlZklEKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IF9kZWNvZGVyXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFlNYXAgPSBfZGVjb2RlciA9PiBuZXcgWU1hcCgpXG4iLCAiLyoqXG4gKiBAbW9kdWxlIFlUZXh0XG4gKi9cblxuaW1wb3J0IHtcbiAgWUV2ZW50LFxuICBBYnN0cmFjdFR5cGUsXG4gIGdldEl0ZW1DbGVhblN0YXJ0LFxuICBnZXRTdGF0ZSxcbiAgaXNWaXNpYmxlLFxuICBjcmVhdGVJRCxcbiAgWVRleHRSZWZJRCxcbiAgY2FsbFR5cGVPYnNlcnZlcnMsXG4gIHRyYW5zYWN0LFxuICBDb250ZW50RW1iZWQsXG4gIEdDLFxuICBDb250ZW50Rm9ybWF0LFxuICBDb250ZW50U3RyaW5nLFxuICBzcGxpdFNuYXBzaG90QWZmZWN0ZWRTdHJ1Y3RzLFxuICBpdGVyYXRlRGVsZXRlZFN0cnVjdHMsXG4gIGl0ZXJhdGVTdHJ1Y3RzLFxuICBmaW5kTWFya2VyLFxuICB0eXBlTWFwRGVsZXRlLFxuICB0eXBlTWFwU2V0LFxuICB0eXBlTWFwR2V0LFxuICB0eXBlTWFwR2V0QWxsLFxuICB1cGRhdGVNYXJrZXJDaGFuZ2VzLFxuICBDb250ZW50VHlwZSxcbiAgd2FyblByZW1hdHVyZUFjY2VzcyxcbiAgQXJyYXlTZWFyY2hNYXJrZXIsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgSUQsIERvYywgSXRlbSwgU25hcHNob3QsIFRyYW5zYWN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBvYmplY3QgZnJvbSAnbGliMC9vYmplY3QnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBhXG4gKiBAcGFyYW0ge2FueX0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgZXF1YWxBdHRycyA9IChhLCBiKSA9PiBhID09PSBiIHx8ICh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnICYmIGEgJiYgYiAmJiBvYmplY3QuZXF1YWxGbGF0KGEsIGIpKVxuXG5leHBvcnQgY2xhc3MgSXRlbVRleHRMaXN0UG9zaXRpb24ge1xuICAvKipcbiAgICogQHBhcmFtIHtJdGVtfG51bGx9IGxlZnRcbiAgICogQHBhcmFtIHtJdGVtfG51bGx9IHJpZ2h0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgKiBAcGFyYW0ge01hcDxzdHJpbmcsYW55Pn0gY3VycmVudEF0dHJpYnV0ZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yIChsZWZ0LCByaWdodCwgaW5kZXgsIGN1cnJlbnRBdHRyaWJ1dGVzKSB7XG4gICAgdGhpcy5sZWZ0ID0gbGVmdFxuICAgIHRoaXMucmlnaHQgPSByaWdodFxuICAgIHRoaXMuaW5kZXggPSBpbmRleFxuICAgIHRoaXMuY3VycmVudEF0dHJpYnV0ZXMgPSBjdXJyZW50QXR0cmlidXRlc1xuICB9XG5cbiAgLyoqXG4gICAqIE9ubHkgY2FsbCB0aGlzIGlmIHlvdSBrbm93IHRoYXQgdGhpcy5yaWdodCBpcyBkZWZpbmVkXG4gICAqL1xuICBmb3J3YXJkICgpIHtcbiAgICBpZiAodGhpcy5yaWdodCA9PT0gbnVsbCkge1xuICAgICAgZXJyb3IudW5leHBlY3RlZENhc2UoKVxuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMucmlnaHQuY29udGVudC5jb25zdHJ1Y3Rvcikge1xuICAgICAgY2FzZSBDb250ZW50Rm9ybWF0OlxuICAgICAgICBpZiAoIXRoaXMucmlnaHQuZGVsZXRlZCkge1xuICAgICAgICAgIHVwZGF0ZUN1cnJlbnRBdHRyaWJ1dGVzKHRoaXMuY3VycmVudEF0dHJpYnV0ZXMsIC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKHRoaXMucmlnaHQuY29udGVudCkpXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmICghdGhpcy5yaWdodC5kZWxldGVkKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCArPSB0aGlzLnJpZ2h0Lmxlbmd0aFxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgfVxuICAgIHRoaXMubGVmdCA9IHRoaXMucmlnaHRcbiAgICB0aGlzLnJpZ2h0ID0gdGhpcy5yaWdodC5yaWdodFxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7SXRlbVRleHRMaXN0UG9zaXRpb259IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IHN0ZXBzIHRvIG1vdmUgZm9yd2FyZFxuICogQHJldHVybiB7SXRlbVRleHRMaXN0UG9zaXRpb259XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCBmaW5kTmV4dFBvc2l0aW9uID0gKHRyYW5zYWN0aW9uLCBwb3MsIGNvdW50KSA9PiB7XG4gIHdoaWxlIChwb3MucmlnaHQgIT09IG51bGwgJiYgY291bnQgPiAwKSB7XG4gICAgc3dpdGNoIChwb3MucmlnaHQuY29udGVudC5jb25zdHJ1Y3Rvcikge1xuICAgICAgY2FzZSBDb250ZW50Rm9ybWF0OlxuICAgICAgICBpZiAoIXBvcy5yaWdodC5kZWxldGVkKSB7XG4gICAgICAgICAgdXBkYXRlQ3VycmVudEF0dHJpYnV0ZXMocG9zLmN1cnJlbnRBdHRyaWJ1dGVzLCAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChwb3MucmlnaHQuY29udGVudCkpXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmICghcG9zLnJpZ2h0LmRlbGV0ZWQpIHtcbiAgICAgICAgICBpZiAoY291bnQgPCBwb3MucmlnaHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBzcGxpdCByaWdodFxuICAgICAgICAgICAgZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGNyZWF0ZUlEKHBvcy5yaWdodC5pZC5jbGllbnQsIHBvcy5yaWdodC5pZC5jbG9jayArIGNvdW50KSlcbiAgICAgICAgICB9XG4gICAgICAgICAgcG9zLmluZGV4ICs9IHBvcy5yaWdodC5sZW5ndGhcbiAgICAgICAgICBjb3VudCAtPSBwb3MucmlnaHQubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG4gICAgcG9zLmxlZnQgPSBwb3MucmlnaHRcbiAgICBwb3MucmlnaHQgPSBwb3MucmlnaHQucmlnaHRcbiAgICAvLyBwb3MuZm9yd2FyZCgpIC0gd2UgZG9uJ3QgZm9yd2FyZCBiZWNhdXNlIHRoYXQgd291bGQgaGFsdmUgdGhlIHBlcmZvcm1hbmNlIGJlY2F1c2Ugd2UgYWxyZWFkeSBkbyB0aGUgY2hlY2tzIGFib3ZlXG4gIH1cbiAgcmV0dXJuIHBvc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHtib29sZWFufSB1c2VTZWFyY2hNYXJrZXJcbiAqIEByZXR1cm4ge0l0ZW1UZXh0TGlzdFBvc2l0aW9ufVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuY29uc3QgZmluZFBvc2l0aW9uID0gKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGluZGV4LCB1c2VTZWFyY2hNYXJrZXIpID0+IHtcbiAgY29uc3QgY3VycmVudEF0dHJpYnV0ZXMgPSBuZXcgTWFwKClcbiAgY29uc3QgbWFya2VyID0gdXNlU2VhcmNoTWFya2VyID8gZmluZE1hcmtlcihwYXJlbnQsIGluZGV4KSA6IG51bGxcbiAgaWYgKG1hcmtlcikge1xuICAgIGNvbnN0IHBvcyA9IG5ldyBJdGVtVGV4dExpc3RQb3NpdGlvbihtYXJrZXIucC5sZWZ0LCBtYXJrZXIucCwgbWFya2VyLmluZGV4LCBjdXJyZW50QXR0cmlidXRlcylcbiAgICByZXR1cm4gZmluZE5leHRQb3NpdGlvbih0cmFuc2FjdGlvbiwgcG9zLCBpbmRleCAtIG1hcmtlci5pbmRleClcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwb3MgPSBuZXcgSXRlbVRleHRMaXN0UG9zaXRpb24obnVsbCwgcGFyZW50Ll9zdGFydCwgMCwgY3VycmVudEF0dHJpYnV0ZXMpXG4gICAgcmV0dXJuIGZpbmROZXh0UG9zaXRpb24odHJhbnNhY3Rpb24sIHBvcywgaW5kZXgpXG4gIH1cbn1cblxuLyoqXG4gKiBOZWdhdGUgYXBwbGllZCBmb3JtYXRzXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtJdGVtVGV4dExpc3RQb3NpdGlvbn0gY3VyclBvc1xuICogQHBhcmFtIHtNYXA8c3RyaW5nLGFueT59IG5lZ2F0ZWRBdHRyaWJ1dGVzXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCBpbnNlcnROZWdhdGVkQXR0cmlidXRlcyA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCBuZWdhdGVkQXR0cmlidXRlcykgPT4ge1xuICAvLyBjaGVjayBpZiB3ZSByZWFsbHkgbmVlZCB0byByZW1vdmUgYXR0cmlidXRlc1xuICB3aGlsZSAoXG4gICAgY3VyclBvcy5yaWdodCAhPT0gbnVsbCAmJiAoXG4gICAgICBjdXJyUG9zLnJpZ2h0LmRlbGV0ZWQgPT09IHRydWUgfHwgKFxuICAgICAgICBjdXJyUG9zLnJpZ2h0LmNvbnRlbnQuY29uc3RydWN0b3IgPT09IENvbnRlbnRGb3JtYXQgJiZcbiAgICAgICAgZXF1YWxBdHRycyhuZWdhdGVkQXR0cmlidXRlcy5nZXQoLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoY3VyclBvcy5yaWdodC5jb250ZW50KS5rZXkpLCAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQpLnZhbHVlKVxuICAgICAgKVxuICAgIClcbiAgKSB7XG4gICAgaWYgKCFjdXJyUG9zLnJpZ2h0LmRlbGV0ZWQpIHtcbiAgICAgIG5lZ2F0ZWRBdHRyaWJ1dGVzLmRlbGV0ZSgvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQpLmtleSlcbiAgICB9XG4gICAgY3VyclBvcy5mb3J3YXJkKClcbiAgfVxuICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgY29uc3Qgb3duQ2xpZW50SWQgPSBkb2MuY2xpZW50SURcbiAgbmVnYXRlZEF0dHJpYnV0ZXMuZm9yRWFjaCgodmFsLCBrZXkpID0+IHtcbiAgICBjb25zdCBsZWZ0ID0gY3VyclBvcy5sZWZ0XG4gICAgY29uc3QgcmlnaHQgPSBjdXJyUG9zLnJpZ2h0XG4gICAgY29uc3QgbmV4dEZvcm1hdCA9IG5ldyBJdGVtKGNyZWF0ZUlEKG93bkNsaWVudElkLCBnZXRTdGF0ZShkb2Muc3RvcmUsIG93bkNsaWVudElkKSksIGxlZnQsIGxlZnQgJiYgbGVmdC5sYXN0SWQsIHJpZ2h0LCByaWdodCAmJiByaWdodC5pZCwgcGFyZW50LCBudWxsLCBuZXcgQ29udGVudEZvcm1hdChrZXksIHZhbCkpXG4gICAgbmV4dEZvcm1hdC5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIDApXG4gICAgY3VyclBvcy5yaWdodCA9IG5leHRGb3JtYXRcbiAgICBjdXJyUG9zLmZvcndhcmQoKVxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7TWFwPHN0cmluZyxhbnk+fSBjdXJyZW50QXR0cmlidXRlc1xuICogQHBhcmFtIHtDb250ZW50Rm9ybWF0fSBmb3JtYXRcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IHVwZGF0ZUN1cnJlbnRBdHRyaWJ1dGVzID0gKGN1cnJlbnRBdHRyaWJ1dGVzLCBmb3JtYXQpID0+IHtcbiAgY29uc3QgeyBrZXksIHZhbHVlIH0gPSBmb3JtYXRcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgY3VycmVudEF0dHJpYnV0ZXMuZGVsZXRlKGtleSlcbiAgfSBlbHNlIHtcbiAgICBjdXJyZW50QXR0cmlidXRlcy5zZXQoa2V5LCB2YWx1ZSlcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7SXRlbVRleHRMaXN0UG9zaXRpb259IGN1cnJQb3NcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBhdHRyaWJ1dGVzXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCBtaW5pbWl6ZUF0dHJpYnV0ZUNoYW5nZXMgPSAoY3VyclBvcywgYXR0cmlidXRlcykgPT4ge1xuICAvLyBnbyByaWdodCB3aGlsZSBhdHRyaWJ1dGVzW3JpZ2h0LmtleV0gPT09IHJpZ2h0LnZhbHVlIChvciByaWdodCBpcyBkZWxldGVkKVxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGlmIChjdXJyUG9zLnJpZ2h0ID09PSBudWxsKSB7XG4gICAgICBicmVha1xuICAgIH0gZWxzZSBpZiAoY3VyclBvcy5yaWdodC5kZWxldGVkIHx8IChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQuY29uc3RydWN0b3IgPT09IENvbnRlbnRGb3JtYXQgJiYgZXF1YWxBdHRycyhhdHRyaWJ1dGVzWygvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQpKS5rZXldID8/IG51bGwsIC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKGN1cnJQb3MucmlnaHQuY29udGVudCkudmFsdWUpKSkge1xuICAgICAgLy9cbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWtcbiAgICB9XG4gICAgY3VyclBvcy5mb3J3YXJkKClcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7SXRlbVRleHRMaXN0UG9zaXRpb259IGN1cnJQb3NcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJuIHtNYXA8c3RyaW5nLGFueT59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICoqL1xuY29uc3QgaW5zZXJ0QXR0cmlidXRlcyA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCBhdHRyaWJ1dGVzKSA9PiB7XG4gIGNvbnN0IGRvYyA9IHRyYW5zYWN0aW9uLmRvY1xuICBjb25zdCBvd25DbGllbnRJZCA9IGRvYy5jbGllbnRJRFxuICBjb25zdCBuZWdhdGVkQXR0cmlidXRlcyA9IG5ldyBNYXAoKVxuICAvLyBpbnNlcnQgZm9ybWF0LXN0YXJ0IGl0ZW1zXG4gIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCB2YWwgPSBhdHRyaWJ1dGVzW2tleV1cbiAgICBjb25zdCBjdXJyZW50VmFsID0gY3VyclBvcy5jdXJyZW50QXR0cmlidXRlcy5nZXQoa2V5KSA/PyBudWxsXG4gICAgaWYgKCFlcXVhbEF0dHJzKGN1cnJlbnRWYWwsIHZhbCkpIHtcbiAgICAgIC8vIHNhdmUgbmVnYXRlZCBhdHRyaWJ1dGUgKHNldCBudWxsIGlmIGN1cnJlbnRWYWwgdW5kZWZpbmVkKVxuICAgICAgbmVnYXRlZEF0dHJpYnV0ZXMuc2V0KGtleSwgY3VycmVudFZhbClcbiAgICAgIGNvbnN0IHsgbGVmdCwgcmlnaHQgfSA9IGN1cnJQb3NcbiAgICAgIGN1cnJQb3MucmlnaHQgPSBuZXcgSXRlbShjcmVhdGVJRChvd25DbGllbnRJZCwgZ2V0U3RhdGUoZG9jLnN0b3JlLCBvd25DbGllbnRJZCkpLCBsZWZ0LCBsZWZ0ICYmIGxlZnQubGFzdElkLCByaWdodCwgcmlnaHQgJiYgcmlnaHQuaWQsIHBhcmVudCwgbnVsbCwgbmV3IENvbnRlbnRGb3JtYXQoa2V5LCB2YWwpKVxuICAgICAgY3VyclBvcy5yaWdodC5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIDApXG4gICAgICBjdXJyUG9zLmZvcndhcmQoKVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmVnYXRlZEF0dHJpYnV0ZXNcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge0l0ZW1UZXh0TGlzdFBvc2l0aW9ufSBjdXJyUG9zXG4gKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R8QWJzdHJhY3RUeXBlPGFueT59IHRleHRcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBhdHRyaWJ1dGVzXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICoqL1xuY29uc3QgaW5zZXJ0VGV4dCA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCB0ZXh0LCBhdHRyaWJ1dGVzKSA9PiB7XG4gIGN1cnJQb3MuY3VycmVudEF0dHJpYnV0ZXMuZm9yRWFjaCgoX3ZhbCwga2V5KSA9PiB7XG4gICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhdHRyaWJ1dGVzW2tleV0gPSBudWxsXG4gICAgfVxuICB9KVxuICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgY29uc3Qgb3duQ2xpZW50SWQgPSBkb2MuY2xpZW50SURcbiAgbWluaW1pemVBdHRyaWJ1dGVDaGFuZ2VzKGN1cnJQb3MsIGF0dHJpYnV0ZXMpXG4gIGNvbnN0IG5lZ2F0ZWRBdHRyaWJ1dGVzID0gaW5zZXJ0QXR0cmlidXRlcyh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCBhdHRyaWJ1dGVzKVxuICAvLyBpbnNlcnQgY29udGVudFxuICBjb25zdCBjb250ZW50ID0gdGV4dC5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nID8gbmV3IENvbnRlbnRTdHJpbmcoLyoqIEB0eXBlIHtzdHJpbmd9ICovICh0ZXh0KSkgOiAodGV4dCBpbnN0YW5jZW9mIEFic3RyYWN0VHlwZSA/IG5ldyBDb250ZW50VHlwZSh0ZXh0KSA6IG5ldyBDb250ZW50RW1iZWQodGV4dCkpXG4gIGxldCB7IGxlZnQsIHJpZ2h0LCBpbmRleCB9ID0gY3VyclBvc1xuICBpZiAocGFyZW50Ll9zZWFyY2hNYXJrZXIpIHtcbiAgICB1cGRhdGVNYXJrZXJDaGFuZ2VzKHBhcmVudC5fc2VhcmNoTWFya2VyLCBjdXJyUG9zLmluZGV4LCBjb250ZW50LmdldExlbmd0aCgpKVxuICB9XG4gIHJpZ2h0ID0gbmV3IEl0ZW0oY3JlYXRlSUQob3duQ2xpZW50SWQsIGdldFN0YXRlKGRvYy5zdG9yZSwgb3duQ2xpZW50SWQpKSwgbGVmdCwgbGVmdCAmJiBsZWZ0Lmxhc3RJZCwgcmlnaHQsIHJpZ2h0ICYmIHJpZ2h0LmlkLCBwYXJlbnQsIG51bGwsIGNvbnRlbnQpXG4gIHJpZ2h0LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgY3VyclBvcy5yaWdodCA9IHJpZ2h0XG4gIGN1cnJQb3MuaW5kZXggPSBpbmRleFxuICBjdXJyUG9zLmZvcndhcmQoKVxuICBpbnNlcnROZWdhdGVkQXR0cmlidXRlcyh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCBuZWdhdGVkQXR0cmlidXRlcylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge0l0ZW1UZXh0TGlzdFBvc2l0aW9ufSBjdXJyUG9zXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gYXR0cmlidXRlc1xuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuY29uc3QgZm9ybWF0VGV4dCA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCBsZW5ndGgsIGF0dHJpYnV0ZXMpID0+IHtcbiAgY29uc3QgZG9jID0gdHJhbnNhY3Rpb24uZG9jXG4gIGNvbnN0IG93bkNsaWVudElkID0gZG9jLmNsaWVudElEXG4gIG1pbmltaXplQXR0cmlidXRlQ2hhbmdlcyhjdXJyUG9zLCBhdHRyaWJ1dGVzKVxuICBjb25zdCBuZWdhdGVkQXR0cmlidXRlcyA9IGluc2VydEF0dHJpYnV0ZXModHJhbnNhY3Rpb24sIHBhcmVudCwgY3VyclBvcywgYXR0cmlidXRlcylcbiAgLy8gaXRlcmF0ZSB1bnRpbCBmaXJzdCBub24tZm9ybWF0IG9yIG51bGwgaXMgZm91bmRcbiAgLy8gZGVsZXRlIGFsbCBmb3JtYXRzIHdpdGggYXR0cmlidXRlc1tmb3JtYXQua2V5XSAhPSBudWxsXG4gIC8vIGFsc28gY2hlY2sgdGhlIGF0dHJpYnV0ZXMgYWZ0ZXIgdGhlIGZpcnN0IG5vbi1mb3JtYXQgYXMgd2UgZG8gbm90IHdhbnQgdG8gaW5zZXJ0IHJlZHVuZGFudCBuZWdhdGVkIGF0dHJpYnV0ZXMgdGhlcmVcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWxhYmVsc1xuICBpdGVyYXRpb25Mb29wOiB3aGlsZSAoXG4gICAgY3VyclBvcy5yaWdodCAhPT0gbnVsbCAmJlxuICAgIChsZW5ndGggPiAwIHx8XG4gICAgICAoXG4gICAgICAgIG5lZ2F0ZWRBdHRyaWJ1dGVzLnNpemUgPiAwICYmXG4gICAgICAgIChjdXJyUG9zLnJpZ2h0LmRlbGV0ZWQgfHwgY3VyclBvcy5yaWdodC5jb250ZW50LmNvbnN0cnVjdG9yID09PSBDb250ZW50Rm9ybWF0KVxuICAgICAgKVxuICAgIClcbiAgKSB7XG4gICAgaWYgKCFjdXJyUG9zLnJpZ2h0LmRlbGV0ZWQpIHtcbiAgICAgIHN3aXRjaCAoY3VyclBvcy5yaWdodC5jb250ZW50LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgIGNhc2UgQ29udGVudEZvcm1hdDoge1xuICAgICAgICAgIGNvbnN0IHsga2V5LCB2YWx1ZSB9ID0gLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoY3VyclBvcy5yaWdodC5jb250ZW50KVxuICAgICAgICAgIGNvbnN0IGF0dHIgPSBhdHRyaWJ1dGVzW2tleV1cbiAgICAgICAgICBpZiAoYXR0ciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoZXF1YWxBdHRycyhhdHRyLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgbmVnYXRlZEF0dHJpYnV0ZXMuZGVsZXRlKGtleSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBubyBuZWVkIHRvIGZ1cnRoZXIgZXh0ZW5kIG5lZ2F0ZWRBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWxhYmVsc1xuICAgICAgICAgICAgICAgIGJyZWFrIGl0ZXJhdGlvbkxvb3BcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBuZWdhdGVkQXR0cmlidXRlcy5zZXQoa2V5LCB2YWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJQb3MucmlnaHQuZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyUG9zLmN1cnJlbnRBdHRyaWJ1dGVzLnNldChrZXksIHZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKGxlbmd0aCA8IGN1cnJQb3MucmlnaHQubGVuZ3RoKSB7XG4gICAgICAgICAgICBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgY3JlYXRlSUQoY3VyclBvcy5yaWdodC5pZC5jbGllbnQsIGN1cnJQb3MucmlnaHQuaWQuY2xvY2sgKyBsZW5ndGgpKVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZW5ndGggLT0gY3VyclBvcy5yaWdodC5sZW5ndGhcbiAgICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICBjdXJyUG9zLmZvcndhcmQoKVxuICB9XG4gIC8vIFF1aWxsIGp1c3QgYXNzdW1lcyB0aGF0IHRoZSBlZGl0b3Igc3RhcnRzIHdpdGggYSBuZXdsaW5lIGFuZCB0aGF0IGl0IGFsd2F5c1xuICAvLyBlbmRzIHdpdGggYSBuZXdsaW5lLiBXZSBvbmx5IGluc2VydCB0aGF0IG5ld2xpbmUgd2hlbiBhIG5ldyBuZXdsaW5lIGlzXG4gIC8vIGluc2VydGVkIC0gaS5lIHdoZW4gbGVuZ3RoIGlzIGJpZ2dlciB0aGFuIHR5cGUubGVuZ3RoXG4gIGlmIChsZW5ndGggPiAwKSB7XG4gICAgbGV0IG5ld2xpbmVzID0gJydcbiAgICBmb3IgKDsgbGVuZ3RoID4gMDsgbGVuZ3RoLS0pIHtcbiAgICAgIG5ld2xpbmVzICs9ICdcXG4nXG4gICAgfVxuICAgIGN1cnJQb3MucmlnaHQgPSBuZXcgSXRlbShjcmVhdGVJRChvd25DbGllbnRJZCwgZ2V0U3RhdGUoZG9jLnN0b3JlLCBvd25DbGllbnRJZCkpLCBjdXJyUG9zLmxlZnQsIGN1cnJQb3MubGVmdCAmJiBjdXJyUG9zLmxlZnQubGFzdElkLCBjdXJyUG9zLnJpZ2h0LCBjdXJyUG9zLnJpZ2h0ICYmIGN1cnJQb3MucmlnaHQuaWQsIHBhcmVudCwgbnVsbCwgbmV3IENvbnRlbnRTdHJpbmcobmV3bGluZXMpKVxuICAgIGN1cnJQb3MucmlnaHQuaW50ZWdyYXRlKHRyYW5zYWN0aW9uLCAwKVxuICAgIGN1cnJQb3MuZm9yd2FyZCgpXG4gIH1cbiAgaW5zZXJ0TmVnYXRlZEF0dHJpYnV0ZXModHJhbnNhY3Rpb24sIHBhcmVudCwgY3VyclBvcywgbmVnYXRlZEF0dHJpYnV0ZXMpXG59XG5cbi8qKlxuICogQ2FsbCB0aGlzIGZ1bmN0aW9uIGFmdGVyIHN0cmluZyBjb250ZW50IGhhcyBiZWVuIGRlbGV0ZWQgaW4gb3JkZXIgdG9cbiAqIGNsZWFuIHVwIGZvcm1hdHRpbmcgSXRlbXMuXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7SXRlbX0gc3RhcnRcbiAqIEBwYXJhbSB7SXRlbXxudWxsfSBjdXJyIGV4Y2x1c2l2ZSBlbmQsIGF1dG9tYXRpY2FsbHkgaXRlcmF0ZXMgdG8gdGhlIG5leHQgQ29udGVudCBJdGVtXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsYW55Pn0gc3RhcnRBdHRyaWJ1dGVzXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsYW55Pn0gY3VyckF0dHJpYnV0ZXNcbiAqIEByZXR1cm4ge251bWJlcn0gVGhlIGFtb3VudCBvZiBmb3JtYXR0aW5nIEl0ZW1zIGRlbGV0ZWQuXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IGNsZWFudXBGb3JtYXR0aW5nR2FwID0gKHRyYW5zYWN0aW9uLCBzdGFydCwgY3Vyciwgc3RhcnRBdHRyaWJ1dGVzLCBjdXJyQXR0cmlidXRlcykgPT4ge1xuICAvKipcbiAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICovXG4gIGxldCBlbmQgPSBzdGFydFxuICAvKipcbiAgICogQHR5cGUge01hcDxzdHJpbmcsQ29udGVudEZvcm1hdD59XG4gICAqL1xuICBjb25zdCBlbmRGb3JtYXRzID0gbWFwLmNyZWF0ZSgpXG4gIHdoaWxlIChlbmQgJiYgKCFlbmQuY291bnRhYmxlIHx8IGVuZC5kZWxldGVkKSkge1xuICAgIGlmICghZW5kLmRlbGV0ZWQgJiYgZW5kLmNvbnRlbnQuY29uc3RydWN0b3IgPT09IENvbnRlbnRGb3JtYXQpIHtcbiAgICAgIGNvbnN0IGNmID0gLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoZW5kLmNvbnRlbnQpXG4gICAgICBlbmRGb3JtYXRzLnNldChjZi5rZXksIGNmKVxuICAgIH1cbiAgICBlbmQgPSBlbmQucmlnaHRcbiAgfVxuICBsZXQgY2xlYW51cHMgPSAwXG4gIGxldCByZWFjaGVkQ3VyciA9IGZhbHNlXG4gIHdoaWxlIChzdGFydCAhPT0gZW5kKSB7XG4gICAgaWYgKGN1cnIgPT09IHN0YXJ0KSB7XG4gICAgICByZWFjaGVkQ3VyciA9IHRydWVcbiAgICB9XG4gICAgaWYgKCFzdGFydC5kZWxldGVkKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gc3RhcnQuY29udGVudFxuICAgICAgc3dpdGNoIChjb250ZW50LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgIGNhc2UgQ29udGVudEZvcm1hdDoge1xuICAgICAgICAgIGNvbnN0IHsga2V5LCB2YWx1ZSB9ID0gLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoY29udGVudClcbiAgICAgICAgICBjb25zdCBzdGFydEF0dHJWYWx1ZSA9IHN0YXJ0QXR0cmlidXRlcy5nZXQoa2V5KSA/PyBudWxsXG4gICAgICAgICAgaWYgKGVuZEZvcm1hdHMuZ2V0KGtleSkgIT09IGNvbnRlbnQgfHwgc3RhcnRBdHRyVmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAvLyBFaXRoZXIgdGhpcyBmb3JtYXQgaXMgb3ZlcndyaXR0ZW4gb3IgaXQgaXMgbm90IG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSBhdHRyaWJ1dGUgYWxyZWFkeSBleGlzdGVkLlxuICAgICAgICAgICAgc3RhcnQuZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgICAgICAgY2xlYW51cHMrK1xuICAgICAgICAgICAgaWYgKCFyZWFjaGVkQ3VyciAmJiAoY3VyckF0dHJpYnV0ZXMuZ2V0KGtleSkgPz8gbnVsbCkgPT09IHZhbHVlICYmIHN0YXJ0QXR0clZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICBpZiAoc3RhcnRBdHRyVmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyQXR0cmlidXRlcy5kZWxldGUoa2V5KVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1cnJBdHRyaWJ1dGVzLnNldChrZXksIHN0YXJ0QXR0clZhbHVlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmVhY2hlZEN1cnIgJiYgIXN0YXJ0LmRlbGV0ZWQpIHtcbiAgICAgICAgICAgIHVwZGF0ZUN1cnJlbnRBdHRyaWJ1dGVzKGN1cnJBdHRyaWJ1dGVzLCAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjb250ZW50KSlcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBzdGFydCA9IC8qKiBAdHlwZSB7SXRlbX0gKi8gKHN0YXJ0LnJpZ2h0KVxuICB9XG4gIHJldHVybiBjbGVhbnVwc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0l0ZW0gfCBudWxsfSBpdGVtXG4gKi9cbmNvbnN0IGNsZWFudXBDb250ZXh0bGVzc0Zvcm1hdHRpbmdHYXAgPSAodHJhbnNhY3Rpb24sIGl0ZW0pID0+IHtcbiAgLy8gaXRlcmF0ZSB1bnRpbCBpdGVtLnJpZ2h0IGlzIG51bGwgb3IgY29udGVudFxuICB3aGlsZSAoaXRlbSAmJiBpdGVtLnJpZ2h0ICYmIChpdGVtLnJpZ2h0LmRlbGV0ZWQgfHwgIWl0ZW0ucmlnaHQuY291bnRhYmxlKSkge1xuICAgIGl0ZW0gPSBpdGVtLnJpZ2h0XG4gIH1cbiAgY29uc3QgYXR0cnMgPSBuZXcgU2V0KClcbiAgLy8gaXRlcmF0ZSBiYWNrIHVudGlsIGEgY29udGVudCBpdGVtIGlzIGZvdW5kXG4gIHdoaWxlIChpdGVtICYmIChpdGVtLmRlbGV0ZWQgfHwgIWl0ZW0uY291bnRhYmxlKSkge1xuICAgIGlmICghaXRlbS5kZWxldGVkICYmIGl0ZW0uY29udGVudC5jb25zdHJ1Y3RvciA9PT0gQ29udGVudEZvcm1hdCkge1xuICAgICAgY29uc3Qga2V5ID0gLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoaXRlbS5jb250ZW50KS5rZXlcbiAgICAgIGlmIChhdHRycy5oYXMoa2V5KSkge1xuICAgICAgICBpdGVtLmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJzLmFkZChrZXkpXG4gICAgICB9XG4gICAgfVxuICAgIGl0ZW0gPSBpdGVtLmxlZnRcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZXhwZXJpbWVudGFsIGFuZCBzdWJqZWN0IHRvIGNoYW5nZSAvIGJlIHJlbW92ZWQuXG4gKlxuICogSWRlYWxseSwgd2UgZG9uJ3QgbmVlZCB0aGlzIGZ1bmN0aW9uIGF0IGFsbC4gRm9ybWF0dGluZyBhdHRyaWJ1dGVzIHNob3VsZCBiZSBjbGVhbmVkIHVwXG4gKiBhdXRvbWF0aWNhbGx5IGFmdGVyIGVhY2ggY2hhbmdlLiBUaGlzIGZ1bmN0aW9uIGl0ZXJhdGVzIHR3aWNlIG92ZXIgdGhlIGNvbXBsZXRlIFlUZXh0IHR5cGVcbiAqIGFuZCByZW1vdmVzIHVubmVjZXNzYXJ5IGZvcm1hdHRpbmcgYXR0cmlidXRlcy4gVGhpcyBpcyBhbHNvIGhlbHBmdWwgZm9yIHRlc3RpbmcuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3b24ndCBiZSBleHBvcnRlZCBhbnltb3JlIGFzIHNvb24gYXMgdGhlcmUgaXMgY29uZmlkZW5jZSB0aGF0IHRoZSBZVGV4dCB0eXBlIHdvcmtzIGFzIGludGVuZGVkLlxuICpcbiAqIEBwYXJhbSB7WVRleHR9IHR5cGVcbiAqIEByZXR1cm4ge251bWJlcn0gSG93IG1hbnkgZm9ybWF0dGluZyBhdHRyaWJ1dGVzIGhhdmUgYmVlbiBjbGVhbmVkIHVwLlxuICovXG5leHBvcnQgY29uc3QgY2xlYW51cFlUZXh0Rm9ybWF0dGluZyA9IHR5cGUgPT4ge1xuICBsZXQgcmVzID0gMFxuICB0cmFuc2FjdCgvKiogQHR5cGUge0RvY30gKi8gKHR5cGUuZG9jKSwgdHJhbnNhY3Rpb24gPT4ge1xuICAgIGxldCBzdGFydCA9IC8qKiBAdHlwZSB7SXRlbX0gKi8gKHR5cGUuX3N0YXJ0KVxuICAgIGxldCBlbmQgPSB0eXBlLl9zdGFydFxuICAgIGxldCBzdGFydEF0dHJpYnV0ZXMgPSBtYXAuY3JlYXRlKClcbiAgICBjb25zdCBjdXJyZW50QXR0cmlidXRlcyA9IG1hcC5jb3B5KHN0YXJ0QXR0cmlidXRlcylcbiAgICB3aGlsZSAoZW5kKSB7XG4gICAgICBpZiAoZW5kLmRlbGV0ZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIHN3aXRjaCAoZW5kLmNvbnRlbnQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICBjYXNlIENvbnRlbnRGb3JtYXQ6XG4gICAgICAgICAgICB1cGRhdGVDdXJyZW50QXR0cmlidXRlcyhjdXJyZW50QXR0cmlidXRlcywgLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoZW5kLmNvbnRlbnQpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmVzICs9IGNsZWFudXBGb3JtYXR0aW5nR2FwKHRyYW5zYWN0aW9uLCBzdGFydCwgZW5kLCBzdGFydEF0dHJpYnV0ZXMsIGN1cnJlbnRBdHRyaWJ1dGVzKVxuICAgICAgICAgICAgc3RhcnRBdHRyaWJ1dGVzID0gbWFwLmNvcHkoY3VycmVudEF0dHJpYnV0ZXMpXG4gICAgICAgICAgICBzdGFydCA9IGVuZFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZW5kID0gZW5kLnJpZ2h0XG4gICAgfVxuICB9KVxuICByZXR1cm4gcmVzXG59XG5cbi8qKlxuICogVGhpcyB3aWxsIGJlIGNhbGxlZCBieSB0aGUgdHJhbnNjdGlvbiBvbmNlIHRoZSBldmVudCBoYW5kbGVycyBhcmUgY2FsbGVkIHRvIHBvdGVudGlhbGx5IGNsZWFudXBcbiAqIGZvcm1hdHRpbmcgYXR0cmlidXRlcy5cbiAqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICovXG5leHBvcnQgY29uc3QgY2xlYW51cFlUZXh0QWZ0ZXJUcmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtTZXQ8WVRleHQ+fVxuICAgKi9cbiAgY29uc3QgbmVlZEZ1bGxDbGVhbnVwID0gbmV3IFNldCgpXG4gIC8vIGNoZWNrIGlmIGFub3RoZXIgZm9ybWF0dGluZyBpdGVtIHdhcyBpbnNlcnRlZFxuICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgZm9yIChjb25zdCBbY2xpZW50LCBhZnRlckNsb2NrXSBvZiB0cmFuc2FjdGlvbi5hZnRlclN0YXRlLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IGNsb2NrID0gdHJhbnNhY3Rpb24uYmVmb3JlU3RhdGUuZ2V0KGNsaWVudCkgfHwgMFxuICAgIGlmIChhZnRlckNsb2NrID09PSBjbG9jaykge1xuICAgICAgY29udGludWVcbiAgICB9XG4gICAgaXRlcmF0ZVN0cnVjdHModHJhbnNhY3Rpb24sIC8qKiBAdHlwZSB7QXJyYXk8SXRlbXxHQz59ICovIChkb2Muc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50KSksIGNsb2NrLCBhZnRlckNsb2NrLCBpdGVtID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgIWl0ZW0uZGVsZXRlZCAmJiAvKiogQHR5cGUge0l0ZW19ICovIChpdGVtKS5jb250ZW50LmNvbnN0cnVjdG9yID09PSBDb250ZW50Rm9ybWF0ICYmIGl0ZW0uY29uc3RydWN0b3IgIT09IEdDXG4gICAgICApIHtcbiAgICAgICAgbmVlZEZ1bGxDbGVhbnVwLmFkZCgvKiogQHR5cGUge2FueX0gKi8gKGl0ZW0pLnBhcmVudClcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIC8vIGNsZWFudXAgaW4gYSBuZXcgdHJhbnNhY3Rpb25cbiAgdHJhbnNhY3QoZG9jLCAodCkgPT4ge1xuICAgIGl0ZXJhdGVEZWxldGVkU3RydWN0cyh0cmFuc2FjdGlvbiwgdHJhbnNhY3Rpb24uZGVsZXRlU2V0LCBpdGVtID0+IHtcbiAgICAgIGlmIChpdGVtIGluc3RhbmNlb2YgR0MgfHwgISgvKiogQHR5cGUge1lUZXh0fSAqLyAoaXRlbS5wYXJlbnQpLl9oYXNGb3JtYXR0aW5nKSB8fCBuZWVkRnVsbENsZWFudXAuaGFzKC8qKiBAdHlwZSB7WVRleHR9ICovIChpdGVtLnBhcmVudCkpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgcGFyZW50ID0gLyoqIEB0eXBlIHtZVGV4dH0gKi8gKGl0ZW0ucGFyZW50KVxuICAgICAgaWYgKGl0ZW0uY29udGVudC5jb25zdHJ1Y3RvciA9PT0gQ29udGVudEZvcm1hdCkge1xuICAgICAgICBuZWVkRnVsbENsZWFudXAuYWRkKHBhcmVudClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIG5vIGZvcm1hdHRpbmcgYXR0cmlidXRlIHdhcyBpbnNlcnRlZCBvciBkZWxldGVkLCB3ZSBjYW4gbWFrZSBkdWUgd2l0aCBjb250ZXh0bGVzc1xuICAgICAgICAvLyBmb3JtYXR0aW5nIGNsZWFudXBzLlxuICAgICAgICAvLyBDb250ZXh0bGVzczogaXQgaXMgbm90IG5lY2Vzc2FyeSB0byBjb21wdXRlIGN1cnJlbnRBdHRyaWJ1dGVzIGZvciB0aGUgYWZmZWN0ZWQgcG9zaXRpb24uXG4gICAgICAgIGNsZWFudXBDb250ZXh0bGVzc0Zvcm1hdHRpbmdHYXAodCwgaXRlbSlcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIElmIGEgZm9ybWF0dGluZyBpdGVtIHdhcyBpbnNlcnRlZCwgd2Ugc2ltcGx5IGNsZWFuIHRoZSB3aG9sZSB0eXBlLlxuICAgIC8vIFdlIG5lZWQgdG8gY29tcHV0ZSBjdXJyZW50QXR0cmlidXRlcyBmb3IgdGhlIGN1cnJlbnQgcG9zaXRpb24gYW55d2F5LlxuICAgIGZvciAoY29uc3QgeVRleHQgb2YgbmVlZEZ1bGxDbGVhbnVwKSB7XG4gICAgICBjbGVhbnVwWVRleHRGb3JtYXR0aW5nKHlUZXh0KVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtJdGVtVGV4dExpc3RQb3NpdGlvbn0gY3VyclBvc1xuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICogQHJldHVybiB7SXRlbVRleHRMaXN0UG9zaXRpb259XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCBkZWxldGVUZXh0ID0gKHRyYW5zYWN0aW9uLCBjdXJyUG9zLCBsZW5ndGgpID0+IHtcbiAgY29uc3Qgc3RhcnRMZW5ndGggPSBsZW5ndGhcbiAgY29uc3Qgc3RhcnRBdHRycyA9IG1hcC5jb3B5KGN1cnJQb3MuY3VycmVudEF0dHJpYnV0ZXMpXG4gIGNvbnN0IHN0YXJ0ID0gY3VyclBvcy5yaWdodFxuICB3aGlsZSAobGVuZ3RoID4gMCAmJiBjdXJyUG9zLnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgaWYgKGN1cnJQb3MucmlnaHQuZGVsZXRlZCA9PT0gZmFsc2UpIHtcbiAgICAgIHN3aXRjaCAoY3VyclBvcy5yaWdodC5jb250ZW50LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgIGNhc2UgQ29udGVudFR5cGU6XG4gICAgICAgIGNhc2UgQ29udGVudEVtYmVkOlxuICAgICAgICBjYXNlIENvbnRlbnRTdHJpbmc6XG4gICAgICAgICAgaWYgKGxlbmd0aCA8IGN1cnJQb3MucmlnaHQubGVuZ3RoKSB7XG4gICAgICAgICAgICBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgY3JlYXRlSUQoY3VyclBvcy5yaWdodC5pZC5jbGllbnQsIGN1cnJQb3MucmlnaHQuaWQuY2xvY2sgKyBsZW5ndGgpKVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZW5ndGggLT0gY3VyclBvcy5yaWdodC5sZW5ndGhcbiAgICAgICAgICBjdXJyUG9zLnJpZ2h0LmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICBjdXJyUG9zLmZvcndhcmQoKVxuICB9XG4gIGlmIChzdGFydCkge1xuICAgIGNsZWFudXBGb3JtYXR0aW5nR2FwKHRyYW5zYWN0aW9uLCBzdGFydCwgY3VyclBvcy5yaWdodCwgc3RhcnRBdHRycywgY3VyclBvcy5jdXJyZW50QXR0cmlidXRlcylcbiAgfVxuICBjb25zdCBwYXJlbnQgPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAoLyoqIEB0eXBlIHtJdGVtfSAqLyAoY3VyclBvcy5sZWZ0IHx8IGN1cnJQb3MucmlnaHQpLnBhcmVudClcbiAgaWYgKHBhcmVudC5fc2VhcmNoTWFya2VyKSB7XG4gICAgdXBkYXRlTWFya2VyQ2hhbmdlcyhwYXJlbnQuX3NlYXJjaE1hcmtlciwgY3VyclBvcy5pbmRleCwgLXN0YXJ0TGVuZ3RoICsgbGVuZ3RoKVxuICB9XG4gIHJldHVybiBjdXJyUG9zXG59XG5cbi8qKlxuICogVGhlIFF1aWxsIERlbHRhIGZvcm1hdCByZXByZXNlbnRzIGNoYW5nZXMgb24gYSB0ZXh0IGRvY3VtZW50IHdpdGhcbiAqIGZvcm1hdHRpbmcgaW5mb3JtYXRpb24uIEZvciBtb3IgaW5mb3JtYXRpb24gdmlzaXQge0BsaW5rIGh0dHBzOi8vcXVpbGxqcy5jb20vZG9jcy9kZWx0YS98UXVpbGwgRGVsdGF9XG4gKlxuICogQGV4YW1wbGVcbiAqICAge1xuICogICAgIG9wczogW1xuICogICAgICAgeyBpbnNlcnQ6ICdHYW5kYWxmJywgYXR0cmlidXRlczogeyBib2xkOiB0cnVlIH0gfSxcbiAqICAgICAgIHsgaW5zZXJ0OiAnIHRoZSAnIH0sXG4gKiAgICAgICB7IGluc2VydDogJ0dyZXknLCBhdHRyaWJ1dGVzOiB7IGNvbG9yOiAnI2NjY2NjYycgfSB9XG4gKiAgICAgXVxuICogICB9XG4gKlxuICovXG5cbi8qKlxuICAqIEF0dHJpYnV0ZXMgdGhhdCBjYW4gYmUgYXNzaWduZWQgdG8gYSBzZWxlY3Rpb24gb2YgdGV4dC5cbiAgKlxuICAqIEBleGFtcGxlXG4gICogICB7XG4gICogICAgIGJvbGQ6IHRydWUsXG4gICogICAgIGZvbnQtc2l6ZTogJzQwcHgnXG4gICogICB9XG4gICpcbiAgKiBAdHlwZWRlZiB7T2JqZWN0fSBUZXh0QXR0cmlidXRlc1xuICAqL1xuXG4vKipcbiAqIEBleHRlbmRzIFlFdmVudDxZVGV4dD5cbiAqIEV2ZW50IHRoYXQgZGVzY3JpYmVzIHRoZSBjaGFuZ2VzIG9uIGEgWVRleHQgdHlwZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFlUZXh0RXZlbnQgZXh0ZW5kcyBZRXZlbnQge1xuICAvKipcbiAgICogQHBhcmFtIHtZVGV4dH0geXRleHRcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTZXQ8YW55Pn0gc3VicyBUaGUga2V5cyB0aGF0IGNoYW5nZWRcbiAgICovXG4gIGNvbnN0cnVjdG9yICh5dGV4dCwgdHJhbnNhY3Rpb24sIHN1YnMpIHtcbiAgICBzdXBlcih5dGV4dCwgdHJhbnNhY3Rpb24pXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgY2hpbGRyZW4gY2hhbmdlZC5cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuY2hpbGRMaXN0Q2hhbmdlZCA9IGZhbHNlXG4gICAgLyoqXG4gICAgICogU2V0IG9mIGFsbCBjaGFuZ2VkIGF0dHJpYnV0ZXMuXG4gICAgICogQHR5cGUge1NldDxzdHJpbmc+fVxuICAgICAqL1xuICAgIHRoaXMua2V5c0NoYW5nZWQgPSBuZXcgU2V0KClcbiAgICBzdWJzLmZvckVhY2goKHN1YikgPT4ge1xuICAgICAgaWYgKHN1YiA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLmNoaWxkTGlzdENoYW5nZWQgPSB0cnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmtleXNDaGFuZ2VkLmFkZChzdWIpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7e2FkZGVkOlNldDxJdGVtPixkZWxldGVkOlNldDxJdGVtPixrZXlzOk1hcDxzdHJpbmcse2FjdGlvbjonYWRkJ3wndXBkYXRlJ3wnZGVsZXRlJyxvbGRWYWx1ZTphbnl9PixkZWx0YTpBcnJheTx7aW5zZXJ0PzpBcnJheTxhbnk+fHN0cmluZywgZGVsZXRlPzpudW1iZXIsIHJldGFpbj86bnVtYmVyfT59fVxuICAgKi9cbiAgZ2V0IGNoYW5nZXMgKCkge1xuICAgIGlmICh0aGlzLl9jaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHt7YWRkZWQ6U2V0PEl0ZW0+LGRlbGV0ZWQ6U2V0PEl0ZW0+LGtleXM6TWFwPHN0cmluZyx7YWN0aW9uOidhZGQnfCd1cGRhdGUnfCdkZWxldGUnLG9sZFZhbHVlOmFueX0+LGRlbHRhOkFycmF5PHtpbnNlcnQ/OkFycmF5PGFueT58c3RyaW5nfEFic3RyYWN0VHlwZTxhbnk+fG9iamVjdCwgZGVsZXRlPzpudW1iZXIsIHJldGFpbj86bnVtYmVyfT59fVxuICAgICAgICovXG4gICAgICBjb25zdCBjaGFuZ2VzID0ge1xuICAgICAgICBrZXlzOiB0aGlzLmtleXMsXG4gICAgICAgIGRlbHRhOiB0aGlzLmRlbHRhLFxuICAgICAgICBhZGRlZDogbmV3IFNldCgpLFxuICAgICAgICBkZWxldGVkOiBuZXcgU2V0KClcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NoYW5nZXMgPSBjaGFuZ2VzXG4gICAgfVxuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKHRoaXMuX2NoYW5nZXMpXG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgY2hhbmdlcyBpbiB0aGUgZGVsdGEgZm9ybWF0LlxuICAgKiBBIHtAbGluayBodHRwczovL3F1aWxsanMuY29tL2RvY3MvZGVsdGEvfFF1aWxsIERlbHRhfSkgdGhhdCByZXByZXNlbnRzIHRoZSBjaGFuZ2VzIG9uIHRoZSBkb2N1bWVudC5cbiAgICpcbiAgICogQHR5cGUge0FycmF5PHtpbnNlcnQ/OnN0cmluZ3xvYmplY3R8QWJzdHJhY3RUeXBlPGFueT4sIGRlbGV0ZT86bnVtYmVyLCByZXRhaW4/Om51bWJlciwgYXR0cmlidXRlcz86IE9iamVjdDxzdHJpbmcsYW55Pn0+fVxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBnZXQgZGVsdGEgKCkge1xuICAgIGlmICh0aGlzLl9kZWx0YSA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgeSA9IC8qKiBAdHlwZSB7RG9jfSAqLyAodGhpcy50YXJnZXQuZG9jKVxuICAgICAgLyoqXG4gICAgICAgKiBAdHlwZSB7QXJyYXk8e2luc2VydD86c3RyaW5nfG9iamVjdHxBYnN0cmFjdFR5cGU8YW55PiwgZGVsZXRlPzpudW1iZXIsIHJldGFpbj86bnVtYmVyLCBhdHRyaWJ1dGVzPzogT2JqZWN0PHN0cmluZyxhbnk+fT59XG4gICAgICAgKi9cbiAgICAgIGNvbnN0IGRlbHRhID0gW11cbiAgICAgIHRyYW5zYWN0KHksIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudEF0dHJpYnV0ZXMgPSBuZXcgTWFwKCkgLy8gc2F2ZXMgYWxsIGN1cnJlbnQgYXR0cmlidXRlcyBmb3IgaW5zZXJ0XG4gICAgICAgIGNvbnN0IG9sZEF0dHJpYnV0ZXMgPSBuZXcgTWFwKClcbiAgICAgICAgbGV0IGl0ZW0gPSB0aGlzLnRhcmdldC5fc3RhcnRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmc/fVxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IGFjdGlvbiA9IG51bGxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge30gLy8gY291bnRzIGFkZGVkIG9yIHJlbW92ZWQgbmV3IGF0dHJpYnV0ZXMgZm9yIHJldGFpblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge3N0cmluZ3xvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgaW5zZXJ0ID0gJydcbiAgICAgICAgbGV0IHJldGFpbiA9IDBcbiAgICAgICAgbGV0IGRlbGV0ZUxlbiA9IDBcbiAgICAgICAgY29uc3QgYWRkT3AgPSAoKSA9PiB7XG4gICAgICAgICAgaWYgKGFjdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAdHlwZSB7YW55fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsZXQgb3AgPSBudWxsXG4gICAgICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgICBjYXNlICdkZWxldGUnOlxuICAgICAgICAgICAgICAgIGlmIChkZWxldGVMZW4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICBvcCA9IHsgZGVsZXRlOiBkZWxldGVMZW4gfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWxldGVMZW4gPSAwXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnaW5zZXJ0JzpcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGluc2VydCA9PT0gJ29iamVjdCcgfHwgaW5zZXJ0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIG9wID0geyBpbnNlcnQgfVxuICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRBdHRyaWJ1dGVzLnNpemUgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wLmF0dHJpYnV0ZXMgPSB7fVxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QXR0cmlidXRlcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcC5hdHRyaWJ1dGVzW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5zZXJ0ID0gJydcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdyZXRhaW4nOlxuICAgICAgICAgICAgICAgIGlmIChyZXRhaW4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICBvcCA9IHsgcmV0YWluIH1cbiAgICAgICAgICAgICAgICAgIGlmICghb2JqZWN0LmlzRW1wdHkoYXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgb3AuYXR0cmlidXRlcyA9IG9iamVjdC5hc3NpZ24oe30sIGF0dHJpYnV0ZXMpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldGFpbiA9IDBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wKSBkZWx0YS5wdXNoKG9wKVxuICAgICAgICAgICAgYWN0aW9uID0gbnVsbFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgICAgIHN3aXRjaCAoaXRlbS5jb250ZW50LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjYXNlIENvbnRlbnRUeXBlOlxuICAgICAgICAgICAgY2FzZSBDb250ZW50RW1iZWQ6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmFkZHMoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZGVsZXRlcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgYWRkT3AoKVxuICAgICAgICAgICAgICAgICAgYWN0aW9uID0gJ2luc2VydCdcbiAgICAgICAgICAgICAgICAgIGluc2VydCA9IGl0ZW0uY29udGVudC5nZXRDb250ZW50KClbMF1cbiAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5kZWxldGVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPT0gJ2RlbGV0ZScpIHtcbiAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICAgIGFjdGlvbiA9ICdkZWxldGUnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlbGV0ZUxlbiArPSAxXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWl0ZW0uZGVsZXRlZCkge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gIT09ICdyZXRhaW4nKSB7XG4gICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgICBhY3Rpb24gPSAncmV0YWluJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXRhaW4gKz0gMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIENvbnRlbnRTdHJpbmc6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmFkZHMoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZGVsZXRlcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPT0gJ2luc2VydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkT3AoKVxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSAnaW5zZXJ0J1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaW5zZXJ0ICs9IC8qKiBAdHlwZSB7Q29udGVudFN0cmluZ30gKi8gKGl0ZW0uY29udGVudCkuc3RyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGVsZXRlcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgICBhY3Rpb24gPSAnZGVsZXRlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWxldGVMZW4gKz0gaXRlbS5sZW5ndGhcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPT0gJ3JldGFpbicpIHtcbiAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICAgIGFjdGlvbiA9ICdyZXRhaW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldGFpbiArPSBpdGVtLmxlbmd0aFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIENvbnRlbnRGb3JtYXQ6IHtcbiAgICAgICAgICAgICAgY29uc3QgeyBrZXksIHZhbHVlIH0gPSAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChpdGVtLmNvbnRlbnQpXG4gICAgICAgICAgICAgIGlmICh0aGlzLmFkZHMoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZGVsZXRlcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgY3VyVmFsID0gY3VycmVudEF0dHJpYnV0ZXMuZ2V0KGtleSkgPz8gbnVsbFxuICAgICAgICAgICAgICAgICAgaWYgKCFlcXVhbEF0dHJzKGN1clZhbCwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09ICdyZXRhaW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgYWRkT3AoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcXVhbEF0dHJzKHZhbHVlLCAob2xkQXR0cmlidXRlcy5nZXQoa2V5KSA/PyBudWxsKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgYXR0cmlidXRlc1trZXldXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlc1trZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5kZWxldGVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlcy5zZXQoa2V5LCB2YWx1ZSlcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJWYWwgPSBjdXJyZW50QXR0cmlidXRlcy5nZXQoa2V5KSA/PyBudWxsXG4gICAgICAgICAgICAgICAgaWYgKCFlcXVhbEF0dHJzKGN1clZhbCwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uID09PSAncmV0YWluJykge1xuICAgICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSBjdXJWYWxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWl0ZW0uZGVsZXRlZCkge1xuICAgICAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXMuc2V0KGtleSwgdmFsdWUpXG4gICAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGF0dHJpYnV0ZXNba2V5XVxuICAgICAgICAgICAgICAgIGlmIChhdHRyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgIGlmICghZXF1YWxBdHRycyhhdHRyLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3JldGFpbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGF0dHJpYnV0ZXNba2V5XVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0ciAhPT0gbnVsbCkgeyAvLyB0aGlzIHdpbGwgYmUgY2xlYW5lZCB1cCBhdXRvbWF0aWNhbGx5IGJ5IHRoZSBjb250ZXh0bGVzcyBjbGVhbnVwIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoIWl0ZW0uZGVsZXRlZCkge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09ICdpbnNlcnQnKSB7XG4gICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVwZGF0ZUN1cnJlbnRBdHRyaWJ1dGVzKGN1cnJlbnRBdHRyaWJ1dGVzLCAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChpdGVtLmNvbnRlbnQpKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW0gPSBpdGVtLnJpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgYWRkT3AoKVxuICAgICAgICB3aGlsZSAoZGVsdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IGxhc3RPcCA9IGRlbHRhW2RlbHRhLmxlbmd0aCAtIDFdXG4gICAgICAgICAgaWYgKGxhc3RPcC5yZXRhaW4gIT09IHVuZGVmaW5lZCAmJiBsYXN0T3AuYXR0cmlidXRlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyByZXRhaW4gZGVsdGEncyBpZiB0aGV5IGRvbid0IGFzc2lnbiBhdHRyaWJ1dGVzXG4gICAgICAgICAgICBkZWx0YS5wb3AoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHRoaXMuX2RlbHRhID0gZGVsdGFcbiAgICB9XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAodGhpcy5fZGVsdGEpXG4gIH1cbn1cblxuLyoqXG4gKiBUeXBlIHRoYXQgcmVwcmVzZW50cyB0ZXh0IHdpdGggZm9ybWF0dGluZyBpbmZvcm1hdGlvbi5cbiAqXG4gKiBUaGlzIHR5cGUgcmVwbGFjZXMgeS1yaWNodGV4dCBhcyB0aGlzIGltcGxlbWVudGF0aW9uIGlzIGFibGUgdG8gaGFuZGxlXG4gKiBibG9jayBmb3JtYXRzIChmb3JtYXQgaW5mb3JtYXRpb24gb24gYSBwYXJhZ3JhcGgpLCBlbWJlZHMgKGNvbXBsZXggZWxlbWVudHNcbiAqIGxpa2UgcGljdHVyZXMgYW5kIHZpZGVvcyksIGFuZCB0ZXh0IGZvcm1hdHMgKCoqYm9sZCoqLCAqaXRhbGljKikuXG4gKlxuICogQGV4dGVuZHMgQWJzdHJhY3RUeXBlPFlUZXh0RXZlbnQ+XG4gKi9cbmV4cG9ydCBjbGFzcyBZVGV4dCBleHRlbmRzIEFic3RyYWN0VHlwZSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gW3N0cmluZ10gVGhlIGluaXRpYWwgdmFsdWUgb2YgdGhlIFlUZXh0LlxuICAgKi9cbiAgY29uc3RydWN0b3IgKHN0cmluZykge1xuICAgIHN1cGVyKClcbiAgICAvKipcbiAgICAgKiBBcnJheSBvZiBwZW5kaW5nIG9wZXJhdGlvbnMgb24gdGhpcyB0eXBlXG4gICAgICogQHR5cGUge0FycmF5PGZ1bmN0aW9uKCk6dm9pZD4/fVxuICAgICAqL1xuICAgIHRoaXMuX3BlbmRpbmcgPSBzdHJpbmcgIT09IHVuZGVmaW5lZCA/IFsoKSA9PiB0aGlzLmluc2VydCgwLCBzdHJpbmcpXSA6IFtdXG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PEFycmF5U2VhcmNoTWFya2VyPnxudWxsfVxuICAgICAqL1xuICAgIHRoaXMuX3NlYXJjaE1hcmtlciA9IFtdXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGlzIFlUZXh0IGNvbnRhaW5zIGZvcm1hdHRpbmcgYXR0cmlidXRlcy5cbiAgICAgKiBUaGlzIGZsYWcgaXMgdXBkYXRlZCB3aGVuIGEgZm9ybWF0dGluZyBpdGVtIGlzIGludGVncmF0ZWQgKHNlZSBDb250ZW50Rm9ybWF0LmludGVncmF0ZSlcbiAgICAgKi9cbiAgICB0aGlzLl9oYXNGb3JtYXR0aW5nID0gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgY2hhcmFjdGVycyBvZiB0aGlzIHRleHQgdHlwZS5cbiAgICpcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCBsZW5ndGggKCkge1xuICAgIHRoaXMuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICAgIHJldHVybiB0aGlzLl9sZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0RvY30geVxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIF9pbnRlZ3JhdGUgKHksIGl0ZW0pIHtcbiAgICBzdXBlci5faW50ZWdyYXRlKHksIGl0ZW0pXG4gICAgdHJ5IHtcbiAgICAgIC8qKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24+fSAqLyAodGhpcy5fcGVuZGluZykuZm9yRWFjaChmID0+IGYoKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgfVxuICAgIHRoaXMuX3BlbmRpbmcgPSBudWxsXG4gIH1cblxuICBfY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBZVGV4dCgpXG4gIH1cblxuICAvKipcbiAgICogTWFrZXMgYSBjb3B5IG9mIHRoaXMgZGF0YSB0eXBlIHRoYXQgY2FuIGJlIGluY2x1ZGVkIHNvbWV3aGVyZSBlbHNlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIGNvbnRlbnQgaXMgb25seSByZWFkYWJsZSBfYWZ0ZXJfIGl0IGhhcyBiZWVuIGluY2x1ZGVkIHNvbWV3aGVyZSBpbiB0aGUgWWRvYy5cbiAgICpcbiAgICogQHJldHVybiB7WVRleHR9XG4gICAqL1xuICBjbG9uZSAoKSB7XG4gICAgY29uc3QgdGV4dCA9IG5ldyBZVGV4dCgpXG4gICAgdGV4dC5hcHBseURlbHRhKHRoaXMudG9EZWx0YSgpKVxuICAgIHJldHVybiB0ZXh0XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBZVGV4dEV2ZW50IGFuZCBjYWxscyBvYnNlcnZlcnMuXG4gICAqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7U2V0PG51bGx8c3RyaW5nPn0gcGFyZW50U3VicyBLZXlzIGNoYW5nZWQgb24gdGhpcyB0eXBlLiBgbnVsbGAgaWYgbGlzdCB3YXMgbW9kaWZpZWQuXG4gICAqL1xuICBfY2FsbE9ic2VydmVyICh0cmFuc2FjdGlvbiwgcGFyZW50U3Vicykge1xuICAgIHN1cGVyLl9jYWxsT2JzZXJ2ZXIodHJhbnNhY3Rpb24sIHBhcmVudFN1YnMpXG4gICAgY29uc3QgZXZlbnQgPSBuZXcgWVRleHRFdmVudCh0aGlzLCB0cmFuc2FjdGlvbiwgcGFyZW50U3VicylcbiAgICBjYWxsVHlwZU9ic2VydmVycyh0aGlzLCB0cmFuc2FjdGlvbiwgZXZlbnQpXG4gICAgLy8gSWYgYSByZW1vdGUgY2hhbmdlIGhhcHBlbmVkLCB3ZSB0cnkgdG8gY2xlYW51cCBwb3RlbnRpYWwgZm9ybWF0dGluZyBkdXBsaWNhdGVzLlxuICAgIGlmICghdHJhbnNhY3Rpb24ubG9jYWwgJiYgdGhpcy5faGFzRm9ybWF0dGluZykge1xuICAgICAgdHJhbnNhY3Rpb24uX25lZWRGb3JtYXR0aW5nQ2xlYW51cCA9IHRydWVcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdW5mb3JtYXR0ZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgWVRleHQgdHlwZS5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdG9TdHJpbmcgKCkge1xuICAgIHRoaXMuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICAgIGxldCBzdHIgPSAnJ1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAgICovXG4gICAgbGV0IG4gPSB0aGlzLl9zdGFydFxuICAgIHdoaWxlIChuICE9PSBudWxsKSB7XG4gICAgICBpZiAoIW4uZGVsZXRlZCAmJiBuLmNvdW50YWJsZSAmJiBuLmNvbnRlbnQuY29uc3RydWN0b3IgPT09IENvbnRlbnRTdHJpbmcpIHtcbiAgICAgICAgc3RyICs9IC8qKiBAdHlwZSB7Q29udGVudFN0cmluZ30gKi8gKG4uY29udGVudCkuc3RyXG4gICAgICB9XG4gICAgICBuID0gbi5yaWdodFxuICAgIH1cbiAgICByZXR1cm4gc3RyXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdW5mb3JtYXR0ZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgWVRleHQgdHlwZS5cbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b0pTT04gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKClcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSBhIHtAbGluayBEZWx0YX0gb24gdGhpcyBzaGFyZWQgWVRleHQgdHlwZS5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGRlbHRhIFRoZSBjaGFuZ2VzIHRvIGFwcGx5IG9uIHRoaXMgZWxlbWVudC5cbiAgICogQHBhcmFtIHtvYmplY3R9ICBvcHRzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuc2FuaXRpemVdIFNhbml0aXplIGlucHV0IGRlbHRhLiBSZW1vdmVzIGVuZGluZyBuZXdsaW5lcyBpZiBzZXQgdG8gdHJ1ZS5cbiAgICpcbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgYXBwbHlEZWx0YSAoZGVsdGEsIHsgc2FuaXRpemUgPSB0cnVlIH0gPSB7fSkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgY29uc3QgY3VyclBvcyA9IG5ldyBJdGVtVGV4dExpc3RQb3NpdGlvbihudWxsLCB0aGlzLl9zdGFydCwgMCwgbmV3IE1hcCgpKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlbHRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb3AgPSBkZWx0YVtpXVxuICAgICAgICAgIGlmIChvcC5pbnNlcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gUXVpbGwgYXNzdW1lcyB0aGF0IHRoZSBjb250ZW50IHN0YXJ0cyB3aXRoIGFuIGVtcHR5IHBhcmFncmFwaC5cbiAgICAgICAgICAgIC8vIFlqcy9ZLlRleHQgYXNzdW1lcyB0aGF0IGl0IHN0YXJ0cyBlbXB0eS4gV2UgYWx3YXlzIGhpZGUgdGhhdFxuICAgICAgICAgICAgLy8gdGhlcmUgaXMgYSBuZXdsaW5lIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRlbnQuXG4gICAgICAgICAgICAvLyBJZiB3ZSBvbWl0IHRoaXMgc3RlcCwgY2xpZW50cyB3aWxsIHNlZSBhIGRpZmZlcmVudCBudW1iZXIgb2ZcbiAgICAgICAgICAgIC8vIHBhcmFncmFwaHMsIGJ1dCBub3RoaW5nIGJhZCB3aWxsIGhhcHBlbi5cbiAgICAgICAgICAgIGNvbnN0IGlucyA9ICghc2FuaXRpemUgJiYgdHlwZW9mIG9wLmluc2VydCA9PT0gJ3N0cmluZycgJiYgaSA9PT0gZGVsdGEubGVuZ3RoIC0gMSAmJiBjdXJyUG9zLnJpZ2h0ID09PSBudWxsICYmIG9wLmluc2VydC5zbGljZSgtMSkgPT09ICdcXG4nKSA/IG9wLmluc2VydC5zbGljZSgwLCAtMSkgOiBvcC5pbnNlcnRcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5zICE9PSAnc3RyaW5nJyB8fCBpbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBpbnNlcnRUZXh0KHRyYW5zYWN0aW9uLCB0aGlzLCBjdXJyUG9zLCBpbnMsIG9wLmF0dHJpYnV0ZXMgfHwge30pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChvcC5yZXRhaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9ybWF0VGV4dCh0cmFuc2FjdGlvbiwgdGhpcywgY3VyclBvcywgb3AucmV0YWluLCBvcC5hdHRyaWJ1dGVzIHx8IHt9KVxuICAgICAgICAgIH0gZWxzZSBpZiAob3AuZGVsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZVRleHQodHJhbnNhY3Rpb24sIGN1cnJQb3MsIG9wLmRlbGV0ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24+fSAqLyAodGhpcy5fcGVuZGluZykucHVzaCgoKSA9PiB0aGlzLmFwcGx5RGVsdGEoZGVsdGEpKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBEZWx0YSByZXByZXNlbnRhdGlvbiBvZiB0aGlzIFlUZXh0IHR5cGUuXG4gICAqXG4gICAqIEBwYXJhbSB7U25hcHNob3R9IFtzbmFwc2hvdF1cbiAgICogQHBhcmFtIHtTbmFwc2hvdH0gW3ByZXZTbmFwc2hvdF1cbiAgICogQHBhcmFtIHtmdW5jdGlvbigncmVtb3ZlZCcgfCAnYWRkZWQnLCBJRCk6YW55fSBbY29tcHV0ZVlDaGFuZ2VdXG4gICAqIEByZXR1cm4ge2FueX0gVGhlIERlbHRhIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgdHlwZS5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdG9EZWx0YSAoc25hcHNob3QsIHByZXZTbmFwc2hvdCwgY29tcHV0ZVlDaGFuZ2UpIHtcbiAgICB0aGlzLmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgICAvKipcbiAgICAgKiBAdHlwZXtBcnJheTxhbnk+fVxuICAgICAqL1xuICAgIGNvbnN0IG9wcyA9IFtdXG4gICAgY29uc3QgY3VycmVudEF0dHJpYnV0ZXMgPSBuZXcgTWFwKClcbiAgICBjb25zdCBkb2MgPSAvKiogQHR5cGUge0RvY30gKi8gKHRoaXMuZG9jKVxuICAgIGxldCBzdHIgPSAnJ1xuICAgIGxldCBuID0gdGhpcy5fc3RhcnRcbiAgICBmdW5jdGlvbiBwYWNrU3RyICgpIHtcbiAgICAgIGlmIChzdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBwYWNrIHN0ciB3aXRoIGF0dHJpYnV0ZXMgdG8gb3BzXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0PHN0cmluZyxhbnk+fVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IHt9XG4gICAgICAgIGxldCBhZGRBdHRyaWJ1dGVzID0gZmFsc2VcbiAgICAgICAgY3VycmVudEF0dHJpYnV0ZXMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgIGFkZEF0dHJpYnV0ZXMgPSB0cnVlXG4gICAgICAgICAgYXR0cmlidXRlc1trZXldID0gdmFsdWVcbiAgICAgICAgfSlcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBvcCA9IHsgaW5zZXJ0OiBzdHIgfVxuICAgICAgICBpZiAoYWRkQXR0cmlidXRlcykge1xuICAgICAgICAgIG9wLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzXG4gICAgICAgIH1cbiAgICAgICAgb3BzLnB1c2gob3ApXG4gICAgICAgIHN0ciA9ICcnXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGNvbXB1dGVEZWx0YSA9ICgpID0+IHtcbiAgICAgIHdoaWxlIChuICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChpc1Zpc2libGUobiwgc25hcHNob3QpIHx8IChwcmV2U25hcHNob3QgIT09IHVuZGVmaW5lZCAmJiBpc1Zpc2libGUobiwgcHJldlNuYXBzaG90KSkpIHtcbiAgICAgICAgICBzd2l0Y2ggKG4uY29udGVudC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgY2FzZSBDb250ZW50U3RyaW5nOiB7XG4gICAgICAgICAgICAgIGNvbnN0IGN1ciA9IGN1cnJlbnRBdHRyaWJ1dGVzLmdldCgneWNoYW5nZScpXG4gICAgICAgICAgICAgIGlmIChzbmFwc2hvdCAhPT0gdW5kZWZpbmVkICYmICFpc1Zpc2libGUobiwgc25hcHNob3QpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdW5kZWZpbmVkIHx8IGN1ci51c2VyICE9PSBuLmlkLmNsaWVudCB8fCBjdXIudHlwZSAhPT0gJ3JlbW92ZWQnKSB7XG4gICAgICAgICAgICAgICAgICBwYWNrU3RyKClcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGVzLnNldCgneWNoYW5nZScsIGNvbXB1dGVZQ2hhbmdlID8gY29tcHV0ZVlDaGFuZ2UoJ3JlbW92ZWQnLCBuLmlkKSA6IHsgdHlwZTogJ3JlbW92ZWQnIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZXZTbmFwc2hvdCAhPT0gdW5kZWZpbmVkICYmICFpc1Zpc2libGUobiwgcHJldlNuYXBzaG90KSkge1xuICAgICAgICAgICAgICAgIGlmIChjdXIgPT09IHVuZGVmaW5lZCB8fCBjdXIudXNlciAhPT0gbi5pZC5jbGllbnQgfHwgY3VyLnR5cGUgIT09ICdhZGRlZCcpIHtcbiAgICAgICAgICAgICAgICAgIHBhY2tTdHIoKVxuICAgICAgICAgICAgICAgICAgY3VycmVudEF0dHJpYnV0ZXMuc2V0KCd5Y2hhbmdlJywgY29tcHV0ZVlDaGFuZ2UgPyBjb21wdXRlWUNoYW5nZSgnYWRkZWQnLCBuLmlkKSA6IHsgdHlwZTogJ2FkZGVkJyB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBhY2tTdHIoKVxuICAgICAgICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGVzLmRlbGV0ZSgneWNoYW5nZScpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RyICs9IC8qKiBAdHlwZSB7Q29udGVudFN0cmluZ30gKi8gKG4uY29udGVudCkuc3RyXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIENvbnRlbnRUeXBlOlxuICAgICAgICAgICAgY2FzZSBDb250ZW50RW1iZWQ6IHtcbiAgICAgICAgICAgICAgcGFja1N0cigpXG4gICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0PHN0cmluZyxhbnk+fVxuICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgY29uc3Qgb3AgPSB7XG4gICAgICAgICAgICAgICAgaW5zZXJ0OiBuLmNvbnRlbnQuZ2V0Q29udGVudCgpWzBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGN1cnJlbnRBdHRyaWJ1dGVzLnNpemUgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cnMgPSAvKiogQHR5cGUge09iamVjdDxzdHJpbmcsYW55Pn0gKi8gKHt9KVxuICAgICAgICAgICAgICAgIG9wLmF0dHJpYnV0ZXMgPSBhdHRyc1xuICAgICAgICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGVzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGF0dHJzW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgb3BzLnB1c2gob3ApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIENvbnRlbnRGb3JtYXQ6XG4gICAgICAgICAgICAgIGlmIChpc1Zpc2libGUobiwgc25hcHNob3QpKSB7XG4gICAgICAgICAgICAgICAgcGFja1N0cigpXG4gICAgICAgICAgICAgICAgdXBkYXRlQ3VycmVudEF0dHJpYnV0ZXMoY3VycmVudEF0dHJpYnV0ZXMsIC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKG4uY29udGVudCkpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbiA9IG4ucmlnaHRcbiAgICAgIH1cbiAgICAgIHBhY2tTdHIoKVxuICAgIH1cbiAgICBpZiAoc25hcHNob3QgfHwgcHJldlNuYXBzaG90KSB7XG4gICAgICAvLyBzbmFwc2hvdHMgYXJlIG1lcmdlZCBhZ2FpbiBhZnRlciB0aGUgdHJhbnNhY3Rpb24sIHNvIHdlIG5lZWQgdG8ga2VlcCB0aGVcbiAgICAgIC8vIHRyYW5zYWN0aW9uIGFsaXZlIHVudGlsIHdlIGFyZSBkb25lXG4gICAgICB0cmFuc2FjdChkb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgaWYgKHNuYXBzaG90KSB7XG4gICAgICAgICAgc3BsaXRTbmFwc2hvdEFmZmVjdGVkU3RydWN0cyh0cmFuc2FjdGlvbiwgc25hcHNob3QpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZTbmFwc2hvdCkge1xuICAgICAgICAgIHNwbGl0U25hcHNob3RBZmZlY3RlZFN0cnVjdHModHJhbnNhY3Rpb24sIHByZXZTbmFwc2hvdClcbiAgICAgICAgfVxuICAgICAgICBjb21wdXRlRGVsdGEoKVxuICAgICAgfSwgJ2NsZWFudXAnKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb21wdXRlRGVsdGEoKVxuICAgIH1cbiAgICByZXR1cm4gb3BzXG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0IHRleHQgYXQgYSBnaXZlbiBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBzdGFydCBpbnNlcnRpbmcuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRvIGluc2VydCBhdCB0aGUgc3BlY2lmaWVkIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0ge1RleHRBdHRyaWJ1dGVzfSBbYXR0cmlidXRlc10gT3B0aW9uYWxseSBkZWZpbmUgc29tZSBmb3JtYXR0aW5nXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3JtYXRpb24gdG8gYXBwbHkgb24gdGhlIGluc2VydGVkXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGV4dC5cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgaW5zZXJ0IChpbmRleCwgdGV4dCwgYXR0cmlidXRlcykge1xuICAgIGlmICh0ZXh0Lmxlbmd0aCA8PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgeSA9IHRoaXMuZG9jXG4gICAgaWYgKHkgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHksIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgY29uc3QgcG9zID0gZmluZFBvc2l0aW9uKHRyYW5zYWN0aW9uLCB0aGlzLCBpbmRleCwgIWF0dHJpYnV0ZXMpXG4gICAgICAgIGlmICghYXR0cmlidXRlcykge1xuICAgICAgICAgIGF0dHJpYnV0ZXMgPSB7fVxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBwb3MuY3VycmVudEF0dHJpYnV0ZXMuZm9yRWFjaCgodiwgaykgPT4geyBhdHRyaWJ1dGVzW2tdID0gdiB9KVxuICAgICAgICB9XG4gICAgICAgIGluc2VydFRleHQodHJhbnNhY3Rpb24sIHRoaXMsIHBvcywgdGV4dCwgYXR0cmlidXRlcylcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24+fSAqLyAodGhpcy5fcGVuZGluZykucHVzaCgoKSA9PiB0aGlzLmluc2VydChpbmRleCwgdGV4dCwgYXR0cmlidXRlcykpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydHMgYW4gZW1iZWQgYXQgYSBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCB0byBpbnNlcnQgdGhlIGVtYmVkIGF0LlxuICAgKiBAcGFyYW0ge09iamVjdCB8IEFic3RyYWN0VHlwZTxhbnk+fSBlbWJlZCBUaGUgT2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgZW1iZWQuXG4gICAqIEBwYXJhbSB7VGV4dEF0dHJpYnV0ZXN9IFthdHRyaWJ1dGVzXSBBdHRyaWJ1dGUgaW5mb3JtYXRpb24gdG8gYXBwbHkgb24gdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1iZWRcbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgaW5zZXJ0RW1iZWQgKGluZGV4LCBlbWJlZCwgYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHkgPSB0aGlzLmRvY1xuICAgIGlmICh5ICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh5LCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIGNvbnN0IHBvcyA9IGZpbmRQb3NpdGlvbih0cmFuc2FjdGlvbiwgdGhpcywgaW5kZXgsICFhdHRyaWJ1dGVzKVxuICAgICAgICBpbnNlcnRUZXh0KHRyYW5zYWN0aW9uLCB0aGlzLCBwb3MsIGVtYmVkLCBhdHRyaWJ1dGVzIHx8IHt9KVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxmdW5jdGlvbj59ICovICh0aGlzLl9wZW5kaW5nKS5wdXNoKCgpID0+IHRoaXMuaW5zZXJ0RW1iZWQoaW5kZXgsIGVtYmVkLCBhdHRyaWJ1dGVzIHx8IHt9KSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyB0ZXh0IHN0YXJ0aW5nIGZyb20gYW4gaW5kZXguXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBJbmRleCBhdCB3aGljaCB0byBzdGFydCBkZWxldGluZy5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgdG8gcmVtb3ZlLiBEZWZhdWx0cyB0byAxLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBkZWxldGUgKGluZGV4LCBsZW5ndGgpIHtcbiAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgeSA9IHRoaXMuZG9jXG4gICAgaWYgKHkgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHksIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgZGVsZXRlVGV4dCh0cmFuc2FjdGlvbiwgZmluZFBvc2l0aW9uKHRyYW5zYWN0aW9uLCB0aGlzLCBpbmRleCwgdHJ1ZSksIGxlbmd0aClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24+fSAqLyAodGhpcy5fcGVuZGluZykucHVzaCgoKSA9PiB0aGlzLmRlbGV0ZShpbmRleCwgbGVuZ3RoKSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXNzaWducyBwcm9wZXJ0aWVzIHRvIGEgcmFuZ2Ugb2YgdGV4dC5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBwb3NpdGlvbiB3aGVyZSB0byBzdGFydCBmb3JtYXR0aW5nLlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIFRoZSBhbW91bnQgb2YgY2hhcmFjdGVycyB0byBhc3NpZ24gcHJvcGVydGllcyB0by5cbiAgICogQHBhcmFtIHtUZXh0QXR0cmlidXRlc30gYXR0cmlidXRlcyBBdHRyaWJ1dGUgaW5mb3JtYXRpb24gdG8gYXBwbHkgb24gdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZm9ybWF0IChpbmRleCwgbGVuZ3RoLCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHkgPSB0aGlzLmRvY1xuICAgIGlmICh5ICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh5LCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIGNvbnN0IHBvcyA9IGZpbmRQb3NpdGlvbih0cmFuc2FjdGlvbiwgdGhpcywgaW5kZXgsIGZhbHNlKVxuICAgICAgICBpZiAocG9zLnJpZ2h0ID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgZm9ybWF0VGV4dCh0cmFuc2FjdGlvbiwgdGhpcywgcG9zLCBsZW5ndGgsIGF0dHJpYnV0ZXMpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge0FycmF5PGZ1bmN0aW9uPn0gKi8gKHRoaXMuX3BlbmRpbmcpLnB1c2goKCkgPT4gdGhpcy5mb3JtYXQoaW5kZXgsIGxlbmd0aCwgYXR0cmlidXRlcykpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gYXR0cmlidXRlLlxuICAgKlxuICAgKiBAbm90ZSBYbWwtVGV4dCBub2RlcyBkb24ndCBoYXZlIGF0dHJpYnV0ZXMuIFlvdSBjYW4gdXNlIHRoaXMgZmVhdHVyZSB0byBhc3NpZ24gcHJvcGVydGllcyB0byBjb21wbGV0ZSB0ZXh0LWJsb2Nrcy5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF0dHJpYnV0ZU5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRoYXQgaXMgdG8gYmUgcmVtb3ZlZC5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgcmVtb3ZlQXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTWFwRGVsZXRlKHRyYW5zYWN0aW9uLCB0aGlzLCBhdHRyaWJ1dGVOYW1lKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxmdW5jdGlvbj59ICovICh0aGlzLl9wZW5kaW5nKS5wdXNoKCgpID0+IHRoaXMucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIG9yIHVwZGF0ZXMgYW4gYXR0cmlidXRlLlxuICAgKlxuICAgKiBAbm90ZSBYbWwtVGV4dCBub2RlcyBkb24ndCBoYXZlIGF0dHJpYnV0ZXMuIFlvdSBjYW4gdXNlIHRoaXMgZmVhdHVyZSB0byBhc3NpZ24gcHJvcGVydGllcyB0byBjb21wbGV0ZSB0ZXh0LWJsb2Nrcy5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF0dHJpYnV0ZU5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRoYXQgaXMgdG8gYmUgc2V0LlxuICAgKiBAcGFyYW0ge2FueX0gYXR0cmlidXRlVmFsdWUgVGhlIGF0dHJpYnV0ZSB2YWx1ZSB0aGF0IGlzIHRvIGJlIHNldC5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgc2V0QXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHlwZU1hcFNldCh0cmFuc2FjdGlvbiwgdGhpcywgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge0FycmF5PGZ1bmN0aW9uPn0gKi8gKHRoaXMuX3BlbmRpbmcpLnB1c2goKCkgPT4gdGhpcy5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUpKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGF0dHJpYnV0ZSB2YWx1ZSB0aGF0IGJlbG9uZ3MgdG8gdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgKlxuICAgKiBAbm90ZSBYbWwtVGV4dCBub2RlcyBkb24ndCBoYXZlIGF0dHJpYnV0ZXMuIFlvdSBjYW4gdXNlIHRoaXMgZmVhdHVyZSB0byBhc3NpZ24gcHJvcGVydGllcyB0byBjb21wbGV0ZSB0ZXh0LWJsb2Nrcy5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF0dHJpYnV0ZU5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRoYXQgaWRlbnRpZmllcyB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcmllZCB2YWx1ZS5cbiAgICogQHJldHVybiB7YW55fSBUaGUgcXVlcmllZCBhdHRyaWJ1dGUgdmFsdWUuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldEF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKHR5cGVNYXBHZXQodGhpcywgYXR0cmlidXRlTmFtZSkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgaW4gYSBKU09OIE9iamVjdC5cbiAgICpcbiAgICogQG5vdGUgWG1sLVRleHQgbm9kZXMgZG9uJ3QgaGF2ZSBhdHRyaWJ1dGVzLiBZb3UgY2FuIHVzZSB0aGlzIGZlYXR1cmUgdG8gYXNzaWduIHByb3BlcnRpZXMgdG8gY29tcGxldGUgdGV4dC1ibG9ja3MuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsIGFueT59IEEgSlNPTiBPYmplY3QgdGhhdCBkZXNjcmliZXMgdGhlIGF0dHJpYnV0ZXMuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldEF0dHJpYnV0ZXMgKCkge1xuICAgIHJldHVybiB0eXBlTWFwR2V0QWxsKHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICovXG4gIF93cml0ZSAoZW5jb2Rlcikge1xuICAgIGVuY29kZXIud3JpdGVUeXBlUmVmKFlUZXh0UmVmSUQpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gX2RlY29kZXJcbiAqIEByZXR1cm4ge1lUZXh0fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRZVGV4dCA9IF9kZWNvZGVyID0+IG5ldyBZVGV4dCgpXG4iLCAiLyoqXG4gKiBAbW9kdWxlIFlYbWxcbiAqL1xuXG5pbXBvcnQge1xuICBZWG1sRXZlbnQsXG4gIFlYbWxFbGVtZW50LFxuICBBYnN0cmFjdFR5cGUsXG4gIHR5cGVMaXN0TWFwLFxuICB0eXBlTGlzdEZvckVhY2gsXG4gIHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3MsXG4gIHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3NBZnRlcixcbiAgdHlwZUxpc3REZWxldGUsXG4gIHR5cGVMaXN0VG9BcnJheSxcbiAgWVhtbEZyYWdtZW50UmVmSUQsXG4gIGNhbGxUeXBlT2JzZXJ2ZXJzLFxuICB0cmFuc2FjdCxcbiAgdHlwZUxpc3RHZXQsXG4gIHR5cGVMaXN0U2xpY2UsXG4gIHdhcm5QcmVtYXR1cmVBY2Nlc3MsXG4gIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgRG9jLCBDb250ZW50VHlwZSwgVHJhbnNhY3Rpb24sIEl0ZW0sIFlYbWxUZXh0LCBZWG1sSG9vayAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJ2xpYjAvYXJyYXknXG5cbi8qKlxuICogRGVmaW5lIHRoZSBlbGVtZW50cyB0byB3aGljaCBhIHNldCBvZiBDU1MgcXVlcmllcyBhcHBseS5cbiAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvQ1NTX1NlbGVjdG9yc3xDU1NfU2VsZWN0b3JzfVxuICpcbiAqIEBleGFtcGxlXG4gKiAgIHF1ZXJ5ID0gJy5jbGFzc1NlbGVjdG9yJ1xuICogICBxdWVyeSA9ICdub2RlU2VsZWN0b3InXG4gKiAgIHF1ZXJ5ID0gJyNpZFNlbGVjdG9yJ1xuICpcbiAqIEB0eXBlZGVmIHtzdHJpbmd9IENTU19TZWxlY3RvclxuICovXG5cbi8qKlxuICogRG9tIGZpbHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAY2FsbGJhY2sgZG9tRmlsdGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIG9mIHRoZSBlbGVtZW50XG4gKiBAcGFyYW0ge01hcH0gYXR0cmlidXRlcyBUaGUgbWFwIG9mIGF0dHJpYnV0ZXMuXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRvIGluY2x1ZGUgdGhlIERvbSBub2RlIGluIHRoZSBZWG1sRWxlbWVudC5cbiAqL1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBzdWJzZXQgb2YgdGhlIG5vZGVzIG9mIGEgWVhtbEVsZW1lbnQgLyBZWG1sRnJhZ21lbnQgYW5kIGFcbiAqIHBvc2l0aW9uIHdpdGhpbiB0aGVtLlxuICpcbiAqIENhbiBiZSBjcmVhdGVkIHdpdGgge0BsaW5rIFlYbWxGcmFnbWVudCNjcmVhdGVUcmVlV2Fsa2VyfVxuICpcbiAqIEBwdWJsaWNcbiAqIEBpbXBsZW1lbnRzIHtJdGVyYWJsZTxZWG1sRWxlbWVudHxZWG1sVGV4dHxZWG1sRWxlbWVudHxZWG1sSG9vaz59XG4gKi9cbmV4cG9ydCBjbGFzcyBZWG1sVHJlZVdhbGtlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1lYbWxGcmFnbWVudCB8IFlYbWxFbGVtZW50fSByb290XG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oQWJzdHJhY3RUeXBlPGFueT4pOmJvb2xlYW59IFtmXVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHJvb3QsIGYgPSAoKSA9PiB0cnVlKSB7XG4gICAgdGhpcy5fZmlsdGVyID0gZlxuICAgIHRoaXMuX3Jvb3QgPSByb290XG4gICAgLyoqXG4gICAgICogQHR5cGUge0l0ZW19XG4gICAgICovXG4gICAgdGhpcy5fY3VycmVudE5vZGUgPSAvKiogQHR5cGUge0l0ZW19ICovIChyb290Ll9zdGFydClcbiAgICB0aGlzLl9maXJzdENhbGwgPSB0cnVlXG4gICAgcm9vdC5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSAoKSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG5leHQgbm9kZS5cbiAgICpcbiAgICogQHJldHVybiB7SXRlcmF0b3JSZXN1bHQ8WVhtbEVsZW1lbnR8WVhtbFRleHR8WVhtbEhvb2s+fSBUaGUgbmV4dCBub2RlLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBuZXh0ICgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgICAqL1xuICAgIGxldCBuID0gdGhpcy5fY3VycmVudE5vZGVcbiAgICBsZXQgdHlwZSA9IG4gJiYgbi5jb250ZW50ICYmIC8qKiBAdHlwZSB7YW55fSAqLyAobi5jb250ZW50KS50eXBlXG4gICAgaWYgKG4gIT09IG51bGwgJiYgKCF0aGlzLl9maXJzdENhbGwgfHwgbi5kZWxldGVkIHx8ICF0aGlzLl9maWx0ZXIodHlwZSkpKSB7IC8vIGlmIGZpcnN0IGNhbGwsIHdlIGNoZWNrIGlmIHdlIGNhbiB1c2UgdGhlIGZpcnN0IGl0ZW1cbiAgICAgIGRvIHtcbiAgICAgICAgdHlwZSA9IC8qKiBAdHlwZSB7YW55fSAqLyAobi5jb250ZW50KS50eXBlXG4gICAgICAgIGlmICghbi5kZWxldGVkICYmICh0eXBlLmNvbnN0cnVjdG9yID09PSBZWG1sRWxlbWVudCB8fCB0eXBlLmNvbnN0cnVjdG9yID09PSBZWG1sRnJhZ21lbnQpICYmIHR5cGUuX3N0YXJ0ICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gd2FsayBkb3duIGluIHRoZSB0cmVlXG4gICAgICAgICAgbiA9IHR5cGUuX3N0YXJ0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gd2FsayByaWdodCBvciB1cCBpbiB0aGUgdHJlZVxuICAgICAgICAgIHdoaWxlIChuICE9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobi5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBuID0gbi5yaWdodFxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuLnBhcmVudCA9PT0gdGhpcy5fcm9vdCkge1xuICAgICAgICAgICAgICBuID0gbnVsbFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbiA9IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChuLnBhcmVudCkuX2l0ZW1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gd2hpbGUgKG4gIT09IG51bGwgJiYgKG4uZGVsZXRlZCB8fCAhdGhpcy5fZmlsdGVyKC8qKiBAdHlwZSB7Q29udGVudFR5cGV9ICovIChuLmNvbnRlbnQpLnR5cGUpKSlcbiAgICB9XG4gICAgdGhpcy5fZmlyc3RDYWxsID0gZmFsc2VcbiAgICBpZiAobiA9PT0gbnVsbCkge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9XG4gICAgfVxuICAgIHRoaXMuX2N1cnJlbnROb2RlID0gblxuICAgIHJldHVybiB7IHZhbHVlOiAvKiogQHR5cGUge2FueX0gKi8gKG4uY29udGVudCkudHlwZSwgZG9uZTogZmFsc2UgfVxuICB9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGxpc3Qgb2Yge0BsaW5rIFlYbWxFbGVtZW50fS5hbmQge0BsaW5rIFlYbWxUZXh0fSB0eXBlcy5cbiAqIEEgWXhtbEZyYWdtZW50IGlzIHNpbWlsYXIgdG8gYSB7QGxpbmsgWVhtbEVsZW1lbnR9LCBidXQgaXQgZG9lcyBub3QgaGF2ZSBhXG4gKiBub2RlTmFtZSBhbmQgaXQgZG9lcyBub3QgaGF2ZSBhdHRyaWJ1dGVzLiBUaG91Z2ggaXQgY2FuIGJlIGJvdW5kIHRvIGEgRE9NXG4gKiBlbGVtZW50IC0gaW4gdGhpcyBjYXNlIHRoZSBhdHRyaWJ1dGVzIGFuZCB0aGUgbm9kZU5hbWUgYXJlIG5vdCBzaGFyZWQuXG4gKlxuICogQHB1YmxpY1xuICogQGV4dGVuZHMgQWJzdHJhY3RUeXBlPFlYbWxFdmVudD5cbiAqL1xuZXhwb3J0IGNsYXNzIFlYbWxGcmFnbWVudCBleHRlbmRzIEFic3RyYWN0VHlwZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PGFueT58bnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLl9wcmVsaW1Db250ZW50ID0gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7WVhtbEVsZW1lbnR8WVhtbFRleHR8bnVsbH1cbiAgICovXG4gIGdldCBmaXJzdENoaWxkICgpIHtcbiAgICBjb25zdCBmaXJzdCA9IHRoaXMuX2ZpcnN0XG4gICAgcmV0dXJuIGZpcnN0ID8gZmlyc3QuY29udGVudC5nZXRDb250ZW50KClbMF0gOiBudWxsXG4gIH1cblxuICAvKipcbiAgICogSW50ZWdyYXRlIHRoaXMgdHlwZSBpbnRvIHRoZSBZanMgaW5zdGFuY2UuXG4gICAqXG4gICAqICogU2F2ZSB0aGlzIHN0cnVjdCBpbiB0aGUgb3NcbiAgICogKiBUaGlzIHR5cGUgaXMgc2VudCB0byBvdGhlciBjbGllbnRcbiAgICogKiBPYnNlcnZlciBmdW5jdGlvbnMgYXJlIGZpcmVkXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jfSB5IFRoZSBZanMgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBfaW50ZWdyYXRlICh5LCBpdGVtKSB7XG4gICAgc3VwZXIuX2ludGVncmF0ZSh5LCBpdGVtKVxuICAgIHRoaXMuaW5zZXJ0KDAsIC8qKiBAdHlwZSB7QXJyYXk8YW55Pn0gKi8gKHRoaXMuX3ByZWxpbUNvbnRlbnQpKVxuICAgIHRoaXMuX3ByZWxpbUNvbnRlbnQgPSBudWxsXG4gIH1cblxuICBfY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBZWG1sRnJhZ21lbnQoKVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgY29weSBvZiB0aGlzIGRhdGEgdHlwZSB0aGF0IGNhbiBiZSBpbmNsdWRlZCBzb21ld2hlcmUgZWxzZS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoZSBjb250ZW50IGlzIG9ubHkgcmVhZGFibGUgX2FmdGVyXyBpdCBoYXMgYmVlbiBpbmNsdWRlZCBzb21ld2hlcmUgaW4gdGhlIFlkb2MuXG4gICAqXG4gICAqIEByZXR1cm4ge1lYbWxGcmFnbWVudH1cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICBjb25zdCBlbCA9IG5ldyBZWG1sRnJhZ21lbnQoKVxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBlbC5pbnNlcnQoMCwgdGhpcy50b0FycmF5KCkubWFwKGl0ZW0gPT4gaXRlbSBpbnN0YW5jZW9mIEFic3RyYWN0VHlwZSA/IGl0ZW0uY2xvbmUoKSA6IGl0ZW0pKVxuICAgIHJldHVybiBlbFxuICB9XG5cbiAgZ2V0IGxlbmd0aCAoKSB7XG4gICAgdGhpcy5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gICAgcmV0dXJuIHRoaXMuX3ByZWxpbUNvbnRlbnQgPT09IG51bGwgPyB0aGlzLl9sZW5ndGggOiB0aGlzLl9wcmVsaW1Db250ZW50Lmxlbmd0aFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHN1YnRyZWUgb2YgY2hpbGROb2Rlcy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogY29uc3Qgd2Fsa2VyID0gZWxlbS5jcmVhdGVUcmVlV2Fsa2VyKGRvbSA9PiBkb20ubm9kZU5hbWUgPT09ICdkaXYnKVxuICAgKiBmb3IgKGxldCBub2RlIGluIHdhbGtlcikge1xuICAgKiAgIC8vIGBub2RlYCBpcyBhIGRpdiBub2RlXG4gICAqICAgbm9wKG5vZGUpXG4gICAqIH1cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbihBYnN0cmFjdFR5cGU8YW55Pik6Ym9vbGVhbn0gZmlsdGVyIEZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIG9uIGVhY2ggY2hpbGQgZWxlbWVudCBhbmRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybnMgYSBCb29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgY2hpbGRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIGlzIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBzdWJ0cmVlLlxuICAgKiBAcmV0dXJuIHtZWG1sVHJlZVdhbGtlcn0gQSBzdWJ0cmVlIGFuZCBhIHBvc2l0aW9uIHdpdGhpbiBpdC5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgY3JlYXRlVHJlZVdhbGtlciAoZmlsdGVyKSB7XG4gICAgcmV0dXJuIG5ldyBZWG1sVHJlZVdhbGtlcih0aGlzLCBmaWx0ZXIpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZmlyc3QgWVhtbEVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeS5cbiAgICogU2ltaWxhciB0byBET00ncyB7QGxpbmsgcXVlcnlTZWxlY3Rvcn0uXG4gICAqXG4gICAqIFF1ZXJ5IHN1cHBvcnQ6XG4gICAqICAgLSB0YWduYW1lXG4gICAqIFRPRE86XG4gICAqICAgLSBpZFxuICAgKiAgIC0gYXR0cmlidXRlXG4gICAqXG4gICAqIEBwYXJhbSB7Q1NTX1NlbGVjdG9yfSBxdWVyeSBUaGUgcXVlcnkgb24gdGhlIGNoaWxkcmVuLlxuICAgKiBAcmV0dXJuIHtZWG1sRWxlbWVudHxZWG1sVGV4dHxZWG1sSG9va3xudWxsfSBUaGUgZmlyc3QgZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIHF1ZXJ5IG9yIG51bGwuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHF1ZXJ5U2VsZWN0b3IgKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBxdWVyeS50b1VwcGVyQ2FzZSgpXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGl0ZXJhdG9yID0gbmV3IFlYbWxUcmVlV2Fsa2VyKHRoaXMsIGVsZW1lbnQgPT4gZWxlbWVudC5ub2RlTmFtZSAmJiBlbGVtZW50Lm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgPT09IHF1ZXJ5KVxuICAgIGNvbnN0IG5leHQgPSBpdGVyYXRvci5uZXh0KClcbiAgICBpZiAobmV4dC5kb25lKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV4dC52YWx1ZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBZWG1sRWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgcXVlcnkuXG4gICAqIFNpbWlsYXIgdG8gRG9tJ3Mge0BsaW5rIHF1ZXJ5U2VsZWN0b3JBbGx9LlxuICAgKlxuICAgKiBAdG9kbyBEb2VzIG5vdCB5ZXQgc3VwcG9ydCBhbGwgcXVlcmllcy4gQ3VycmVudGx5IG9ubHkgcXVlcnkgYnkgdGFnTmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHtDU1NfU2VsZWN0b3J9IHF1ZXJ5IFRoZSBxdWVyeSBvbiB0aGUgY2hpbGRyZW5cbiAgICogQHJldHVybiB7QXJyYXk8WVhtbEVsZW1lbnR8WVhtbFRleHR8WVhtbEhvb2t8bnVsbD59IFRoZSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoaXMgcXVlcnkuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHF1ZXJ5U2VsZWN0b3JBbGwgKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBxdWVyeS50b1VwcGVyQ2FzZSgpXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiBhcnJheS5mcm9tKG5ldyBZWG1sVHJlZVdhbGtlcih0aGlzLCBlbGVtZW50ID0+IGVsZW1lbnQubm9kZU5hbWUgJiYgZWxlbWVudC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpID09PSBxdWVyeSkpXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBZWG1sRXZlbnQgYW5kIGNhbGxzIG9ic2VydmVycy5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTZXQ8bnVsbHxzdHJpbmc+fSBwYXJlbnRTdWJzIEtleXMgY2hhbmdlZCBvbiB0aGlzIHR5cGUuIGBudWxsYCBpZiBsaXN0IHdhcyBtb2RpZmllZC5cbiAgICovXG4gIF9jYWxsT2JzZXJ2ZXIgKHRyYW5zYWN0aW9uLCBwYXJlbnRTdWJzKSB7XG4gICAgY2FsbFR5cGVPYnNlcnZlcnModGhpcywgdHJhbnNhY3Rpb24sIG5ldyBZWG1sRXZlbnQodGhpcywgcGFyZW50U3VicywgdHJhbnNhY3Rpb24pKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGFsbCB0aGUgY2hpbGRyZW4gb2YgdGhpcyBZWG1sRnJhZ21lbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhbGwgY2hpbGRyZW4uXG4gICAqL1xuICB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuIHR5cGVMaXN0TWFwKHRoaXMsIHhtbCA9PiB4bWwudG9TdHJpbmcoKSkuam9pbignJylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0pTT04gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgRG9tIEVsZW1lbnQgdGhhdCBtaXJyb3JzIHRoaXMgWVhtbEVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IFtfZG9jdW1lbnQ9ZG9jdW1lbnRdIFRoZSBkb2N1bWVudCBvYmplY3QgKHlvdSBtdXN0IGRlZmluZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIHdoZW4gY2FsbGluZyB0aGlzIG1ldGhvZCBpblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlanMpXG4gICAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZywgYW55Pn0gW2hvb2tzPXt9XSBPcHRpb25hbCBwcm9wZXJ0eSB0byBjdXN0b21pemUgaG93IGhvb2tzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlIHByZXNlbnRlZCBpbiB0aGUgRE9NXG4gICAqIEBwYXJhbSB7YW55fSBbYmluZGluZ10gWW91IHNob3VsZCBub3Qgc2V0IHRoaXMgcHJvcGVydHkuIFRoaXMgaXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCBpZiBEb21CaW5kaW5nIHdhbnRzIHRvIGNyZWF0ZSBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc29jaWF0aW9uIHRvIHRoZSBjcmVhdGVkIERPTSB0eXBlLlxuICAgKiBAcmV0dXJuIHtOb2RlfSBUaGUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50fERvbSBFbGVtZW50fVxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b0RPTSAoX2RvY3VtZW50ID0gZG9jdW1lbnQsIGhvb2tzID0ge30sIGJpbmRpbmcpIHtcbiAgICBjb25zdCBmcmFnbWVudCA9IF9kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgICBpZiAoYmluZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBiaW5kaW5nLl9jcmVhdGVBc3NvY2lhdGlvbihmcmFnbWVudCwgdGhpcylcbiAgICB9XG4gICAgdHlwZUxpc3RGb3JFYWNoKHRoaXMsIHhtbFR5cGUgPT4ge1xuICAgICAgZnJhZ21lbnQuaW5zZXJ0QmVmb3JlKHhtbFR5cGUudG9ET00oX2RvY3VtZW50LCBob29rcywgYmluZGluZyksIG51bGwpXG4gICAgfSlcbiAgICByZXR1cm4gZnJhZ21lbnRcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnRzIG5ldyBjb250ZW50IGF0IGFuIGluZGV4LlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgLy8gSW5zZXJ0IGNoYXJhY3RlciAnYScgYXQgcG9zaXRpb24gMFxuICAgKiAgeG1sLmluc2VydCgwLCBbbmV3IFkuWG1sVGV4dCgndGV4dCcpXSlcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCB0byBpbnNlcnQgY29udGVudCBhdFxuICAgKiBAcGFyYW0ge0FycmF5PFlYbWxFbGVtZW50fFlYbWxUZXh0Pn0gY29udGVudCBUaGUgYXJyYXkgb2YgY29udGVudFxuICAgKi9cbiAgaW5zZXJ0IChpbmRleCwgY29udGVudCkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHlwZUxpc3RJbnNlcnRHZW5lcmljcyh0cmFuc2FjdGlvbiwgdGhpcywgaW5kZXgsIGNvbnRlbnQpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBAdHMtaWdub3JlIF9wcmVsaW1Db250ZW50IGlzIGRlZmluZWQgYmVjYXVzZSB0aGlzIGlzIG5vdCB5ZXQgaW50ZWdyYXRlZFxuICAgICAgdGhpcy5fcHJlbGltQ29udGVudC5zcGxpY2UoaW5kZXgsIDAsIC4uLmNvbnRlbnQpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydHMgbmV3IGNvbnRlbnQgYXQgYW4gaW5kZXguXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAvLyBJbnNlcnQgY2hhcmFjdGVyICdhJyBhdCBwb3NpdGlvbiAwXG4gICAqICB4bWwuaW5zZXJ0KDAsIFtuZXcgWS5YbWxUZXh0KCd0ZXh0JyldKVxuICAgKlxuICAgKiBAcGFyYW0ge251bGx8SXRlbXxZWG1sRWxlbWVudHxZWG1sVGV4dH0gcmVmIFRoZSBpbmRleCB0byBpbnNlcnQgY29udGVudCBhdFxuICAgKiBAcGFyYW0ge0FycmF5PFlYbWxFbGVtZW50fFlYbWxUZXh0Pn0gY29udGVudCBUaGUgYXJyYXkgb2YgY29udGVudFxuICAgKi9cbiAgaW5zZXJ0QWZ0ZXIgKHJlZiwgY29udGVudCkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgY29uc3QgcmVmSXRlbSA9IChyZWYgJiYgcmVmIGluc3RhbmNlb2YgQWJzdHJhY3RUeXBlKSA/IHJlZi5faXRlbSA6IHJlZlxuICAgICAgICB0eXBlTGlzdEluc2VydEdlbmVyaWNzQWZ0ZXIodHJhbnNhY3Rpb24sIHRoaXMsIHJlZkl0ZW0sIGNvbnRlbnQpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwYyA9IC8qKiBAdHlwZSB7QXJyYXk8YW55Pn0gKi8gKHRoaXMuX3ByZWxpbUNvbnRlbnQpXG4gICAgICBjb25zdCBpbmRleCA9IHJlZiA9PT0gbnVsbCA/IDAgOiBwYy5maW5kSW5kZXgoZWwgPT4gZWwgPT09IHJlZikgKyAxXG4gICAgICBpZiAoaW5kZXggPT09IDAgJiYgcmVmICE9PSBudWxsKSB7XG4gICAgICAgIHRocm93IGVycm9yLmNyZWF0ZSgnUmVmZXJlbmNlIGl0ZW0gbm90IGZvdW5kJylcbiAgICAgIH1cbiAgICAgIHBjLnNwbGljZShpbmRleCwgMCwgLi4uY29udGVudClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBlbGVtZW50cyBzdGFydGluZyBmcm9tIGFuIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggSW5kZXggYXQgd2hpY2ggdG8gc3RhcnQgZGVsZXRpbmcgZWxlbWVudHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGg9MV0gVGhlIG51bWJlciBvZiBlbGVtZW50cyB0byByZW1vdmUuIERlZmF1bHRzIHRvIDEuXG4gICAqL1xuICBkZWxldGUgKGluZGV4LCBsZW5ndGggPSAxKSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTGlzdERlbGV0ZSh0cmFuc2FjdGlvbiwgdGhpcywgaW5kZXgsIGxlbmd0aClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEB0cy1pZ25vcmUgX3ByZWxpbUNvbnRlbnQgaXMgZGVmaW5lZCBiZWNhdXNlIHRoaXMgaXMgbm90IHlldCBpbnRlZ3JhdGVkXG4gICAgICB0aGlzLl9wcmVsaW1Db250ZW50LnNwbGljZShpbmRleCwgbGVuZ3RoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIHRoaXMgWUFycmF5IHRvIGEgSmF2YVNjcmlwdCBBcnJheS5cbiAgICpcbiAgICogQHJldHVybiB7QXJyYXk8WVhtbEVsZW1lbnR8WVhtbFRleHR8WVhtbEhvb2s+fVxuICAgKi9cbiAgdG9BcnJheSAoKSB7XG4gICAgcmV0dXJuIHR5cGVMaXN0VG9BcnJheSh0aGlzKVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZHMgY29udGVudCB0byB0aGlzIFlBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxZWG1sRWxlbWVudHxZWG1sVGV4dD59IGNvbnRlbnQgQXJyYXkgb2YgY29udGVudCB0byBhcHBlbmQuXG4gICAqL1xuICBwdXNoIChjb250ZW50KSB7XG4gICAgdGhpcy5pbnNlcnQodGhpcy5sZW5ndGgsIGNvbnRlbnQpXG4gIH1cblxuICAvKipcbiAgICogUHJlcGVuZHMgY29udGVudCB0byB0aGlzIFlBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxZWG1sRWxlbWVudHxZWG1sVGV4dD59IGNvbnRlbnQgQXJyYXkgb2YgY29udGVudCB0byBwcmVwZW5kLlxuICAgKi9cbiAgdW5zaGlmdCAoY29udGVudCkge1xuICAgIHRoaXMuaW5zZXJ0KDAsIGNvbnRlbnQpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaS10aCBlbGVtZW50IGZyb20gYSBZQXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gcmV0dXJuIGZyb20gdGhlIFlBcnJheVxuICAgKiBAcmV0dXJuIHtZWG1sRWxlbWVudHxZWG1sVGV4dH1cbiAgICovXG4gIGdldCAoaW5kZXgpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RHZXQodGhpcywgaW5kZXgpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHBvcnRpb24gb2YgdGhpcyBZWG1sRnJhZ21lbnQgaW50byBhIEphdmFTY3JpcHQgQXJyYXkgc2VsZWN0ZWRcbiAgICogZnJvbSBzdGFydCB0byBlbmQgKGVuZCBub3QgaW5jbHVkZWQpLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0XVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2VuZF1cbiAgICogQHJldHVybiB7QXJyYXk8WVhtbEVsZW1lbnR8WVhtbFRleHQ+fVxuICAgKi9cbiAgc2xpY2UgKHN0YXJ0ID0gMCwgZW5kID0gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGEgcHJvdmlkZWQgZnVuY3Rpb24gb24gb25jZSBvbiBldmVyeSBjaGlsZCBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFlYbWxFbGVtZW50fFlYbWxUZXh0LG51bWJlciwgdHlwZW9mIHNlbGYpOnZvaWR9IGYgQSBmdW5jdGlvbiB0byBleGVjdXRlIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhpcyBZQXJyYXkuXG4gICAqL1xuICBmb3JFYWNoIChmKSB7XG4gICAgdHlwZUxpc3RGb3JFYWNoKHRoaXMsIGYpXG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtIHRoZSBwcm9wZXJ0aWVzIG9mIHRoaXMgdHlwZSB0byBiaW5hcnkgYW5kIHdyaXRlIGl0IHRvIGFuXG4gICAqIEJpbmFyeUVuY29kZXIuXG4gICAqXG4gICAqIFRoaXMgaXMgY2FsbGVkIHdoZW4gdGhpcyBJdGVtIGlzIHNlbnQgdG8gYSByZW1vdGUgcGVlci5cbiAgICpcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXIgVGhlIGVuY29kZXIgdG8gd3JpdGUgZGF0YSB0by5cbiAgICovXG4gIF93cml0ZSAoZW5jb2Rlcikge1xuICAgIGVuY29kZXIud3JpdGVUeXBlUmVmKFlYbWxGcmFnbWVudFJlZklEKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IF9kZWNvZGVyXG4gKiBAcmV0dXJuIHtZWG1sRnJhZ21lbnR9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFlYbWxGcmFnbWVudCA9IF9kZWNvZGVyID0+IG5ldyBZWG1sRnJhZ21lbnQoKVxuIiwgImltcG9ydCAqIGFzIG9iamVjdCBmcm9tICdsaWIwL29iamVjdCdcblxuaW1wb3J0IHtcbiAgWVhtbEZyYWdtZW50LFxuICB0cmFuc2FjdCxcbiAgdHlwZU1hcERlbGV0ZSxcbiAgdHlwZU1hcEhhcyxcbiAgdHlwZU1hcFNldCxcbiAgdHlwZU1hcEdldCxcbiAgdHlwZU1hcEdldEFsbCxcbiAgdHlwZU1hcEdldEFsbFNuYXBzaG90LFxuICB0eXBlTGlzdEZvckVhY2gsXG4gIFlYbWxFbGVtZW50UmVmSUQsXG4gIFNuYXBzaG90LCBZWG1sVGV4dCwgQ29udGVudFR5cGUsIEFic3RyYWN0VHlwZSwgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBEb2MsIEl0ZW0gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdHxudW1iZXJ8bnVsbHxBcnJheTxhbnk+fHN0cmluZ3xVaW50OEFycmF5fEFic3RyYWN0VHlwZTxhbnk+fSBWYWx1ZVR5cGVzXG4gKi9cblxuLyoqXG4gKiBBbiBZWG1sRWxlbWVudCBpbWl0YXRlcyB0aGUgYmVoYXZpb3Igb2YgYVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnR8RG9tIEVsZW1lbnRcbiAqXG4gKiAqIEFuIFlYbWxFbGVtZW50IGhhcyBhdHRyaWJ1dGVzIChrZXkgdmFsdWUgcGFpcnMpXG4gKiAqIEFuIFlYbWxFbGVtZW50IGhhcyBjaGlsZEVsZW1lbnRzIHRoYXQgbXVzdCBpbmhlcml0IGZyb20gWVhtbEVsZW1lbnRcbiAqXG4gKiBAdGVtcGxhdGUge3sgW2tleTogc3RyaW5nXTogVmFsdWVUeXBlcyB9fSBbS1Y9eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfV1cbiAqL1xuZXhwb3J0IGNsYXNzIFlYbWxFbGVtZW50IGV4dGVuZHMgWVhtbEZyYWdtZW50IHtcbiAgY29uc3RydWN0b3IgKG5vZGVOYW1lID0gJ1VOREVGSU5FRCcpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5ub2RlTmFtZSA9IG5vZGVOYW1lXG4gICAgLyoqXG4gICAgICogQHR5cGUge01hcDxzdHJpbmcsIGFueT58bnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLl9wcmVsaW1BdHRycyA9IG5ldyBNYXAoKVxuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtZWG1sRWxlbWVudHxZWG1sVGV4dHxudWxsfVxuICAgKi9cbiAgZ2V0IG5leHRTaWJsaW5nICgpIHtcbiAgICBjb25zdCBuID0gdGhpcy5faXRlbSA/IHRoaXMuX2l0ZW0ubmV4dCA6IG51bGxcbiAgICByZXR1cm4gbiA/IC8qKiBAdHlwZSB7WVhtbEVsZW1lbnR8WVhtbFRleHR9ICovICgvKiogQHR5cGUge0NvbnRlbnRUeXBlfSAqLyAobi5jb250ZW50KS50eXBlKSA6IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7WVhtbEVsZW1lbnR8WVhtbFRleHR8bnVsbH1cbiAgICovXG4gIGdldCBwcmV2U2libGluZyAoKSB7XG4gICAgY29uc3QgbiA9IHRoaXMuX2l0ZW0gPyB0aGlzLl9pdGVtLnByZXYgOiBudWxsXG4gICAgcmV0dXJuIG4gPyAvKiogQHR5cGUge1lYbWxFbGVtZW50fFlYbWxUZXh0fSAqLyAoLyoqIEB0eXBlIHtDb250ZW50VHlwZX0gKi8gKG4uY29udGVudCkudHlwZSkgOiBudWxsXG4gIH1cblxuICAvKipcbiAgICogSW50ZWdyYXRlIHRoaXMgdHlwZSBpbnRvIHRoZSBZanMgaW5zdGFuY2UuXG4gICAqXG4gICAqICogU2F2ZSB0aGlzIHN0cnVjdCBpbiB0aGUgb3NcbiAgICogKiBUaGlzIHR5cGUgaXMgc2VudCB0byBvdGhlciBjbGllbnRcbiAgICogKiBPYnNlcnZlciBmdW5jdGlvbnMgYXJlIGZpcmVkXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jfSB5IFRoZSBZanMgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBfaW50ZWdyYXRlICh5LCBpdGVtKSB7XG4gICAgc3VwZXIuX2ludGVncmF0ZSh5LCBpdGVtKVxuICAgIDsoLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBhbnk+fSAqLyAodGhpcy5fcHJlbGltQXR0cnMpKS5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKVxuICAgIH0pXG4gICAgdGhpcy5fcHJlbGltQXR0cnMgPSBudWxsXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBJdGVtIHdpdGggdGhlIHNhbWUgZWZmZWN0IGFzIHRoaXMgSXRlbSAod2l0aG91dCBwb3NpdGlvbiBlZmZlY3QpXG4gICAqXG4gICAqIEByZXR1cm4ge1lYbWxFbGVtZW50fVxuICAgKi9cbiAgX2NvcHkgKCkge1xuICAgIHJldHVybiBuZXcgWVhtbEVsZW1lbnQodGhpcy5ub2RlTmFtZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIGNvcHkgb2YgdGhpcyBkYXRhIHR5cGUgdGhhdCBjYW4gYmUgaW5jbHVkZWQgc29tZXdoZXJlIGVsc2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgY29udGVudCBpcyBvbmx5IHJlYWRhYmxlIF9hZnRlcl8gaXQgaGFzIGJlZW4gaW5jbHVkZWQgc29tZXdoZXJlIGluIHRoZSBZZG9jLlxuICAgKlxuICAgKiBAcmV0dXJuIHtZWG1sRWxlbWVudDxLVj59XG4gICAqL1xuICBjbG9uZSAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge1lYbWxFbGVtZW50PEtWPn1cbiAgICAgKi9cbiAgICBjb25zdCBlbCA9IG5ldyBZWG1sRWxlbWVudCh0aGlzLm5vZGVOYW1lKVxuICAgIGNvbnN0IGF0dHJzID0gdGhpcy5nZXRBdHRyaWJ1dGVzKClcbiAgICBvYmplY3QuZm9yRWFjaChhdHRycywgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKVxuICAgICAgfVxuICAgIH0pXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGVsLmluc2VydCgwLCB0aGlzLnRvQXJyYXkoKS5tYXAoaXRlbSA9PiBpdGVtIGluc3RhbmNlb2YgQWJzdHJhY3RUeXBlID8gaXRlbS5jbG9uZSgpIDogaXRlbSkpXG4gICAgcmV0dXJuIGVsXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgWE1MIHNlcmlhbGl6YXRpb24gb2YgdGhpcyBZWG1sRWxlbWVudC5cbiAgICogVGhlIGF0dHJpYnV0ZXMgYXJlIG9yZGVyZWQgYnkgYXR0cmlidXRlLW5hbWUsIHNvIHlvdSBjYW4gZWFzaWx5IHVzZSB0aGlzXG4gICAqIG1ldGhvZCB0byBjb21wYXJlIFlYbWxFbGVtZW50c1xuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyB0eXBlLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b1N0cmluZyAoKSB7XG4gICAgY29uc3QgYXR0cnMgPSB0aGlzLmdldEF0dHJpYnV0ZXMoKVxuICAgIGNvbnN0IHN0cmluZ0J1aWxkZXIgPSBbXVxuICAgIGNvbnN0IGtleXMgPSBbXVxuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJzKSB7XG4gICAgICBrZXlzLnB1c2goa2V5KVxuICAgIH1cbiAgICBrZXlzLnNvcnQoKVxuICAgIGNvbnN0IGtleXNMZW4gPSBrZXlzLmxlbmd0aFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c0xlbjsgaSsrKSB7XG4gICAgICBjb25zdCBrZXkgPSBrZXlzW2ldXG4gICAgICBzdHJpbmdCdWlsZGVyLnB1c2goa2V5ICsgJz1cIicgKyBhdHRyc1trZXldICsgJ1wiJylcbiAgICB9XG4gICAgY29uc3Qgbm9kZU5hbWUgPSB0aGlzLm5vZGVOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKClcbiAgICBjb25zdCBhdHRyc1N0cmluZyA9IHN0cmluZ0J1aWxkZXIubGVuZ3RoID4gMCA/ICcgJyArIHN0cmluZ0J1aWxkZXIuam9pbignICcpIDogJydcbiAgICByZXR1cm4gYDwke25vZGVOYW1lfSR7YXR0cnNTdHJpbmd9PiR7c3VwZXIudG9TdHJpbmcoKX08LyR7bm9kZU5hbWV9PmBcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIGF0dHJpYnV0ZSBmcm9tIHRoaXMgWVhtbEVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGVOYW1lIFRoZSBhdHRyaWJ1dGUgbmFtZSB0aGF0IGlzIHRvIGJlIHJlbW92ZWQuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHJlbW92ZUF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHlwZU1hcERlbGV0ZSh0cmFuc2FjdGlvbiwgdGhpcywgYXR0cmlidXRlTmFtZSlcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7TWFwPHN0cmluZyxhbnk+fSAqLyAodGhpcy5fcHJlbGltQXR0cnMpLmRlbGV0ZShhdHRyaWJ1dGVOYW1lKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIG9yIHVwZGF0ZXMgYW4gYXR0cmlidXRlLlxuICAgKlxuICAgKiBAdGVtcGxhdGUge2tleW9mIEtWICYgc3RyaW5nfSBLRVlcbiAgICpcbiAgICogQHBhcmFtIHtLRVl9IGF0dHJpYnV0ZU5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRoYXQgaXMgdG8gYmUgc2V0LlxuICAgKiBAcGFyYW0ge0tWW0tFWV19IGF0dHJpYnV0ZVZhbHVlIFRoZSBhdHRyaWJ1dGUgdmFsdWUgdGhhdCBpcyB0byBiZSBzZXQuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHNldEF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHR5cGVNYXBTZXQodHJhbnNhY3Rpb24sIHRoaXMsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBhbnk+fSAqLyAodGhpcy5fcHJlbGltQXR0cnMpLnNldChhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhdHRyaWJ1dGUgdmFsdWUgdGhhdCBiZWxvbmdzIHRvIHRoZSBhdHRyaWJ1dGUgbmFtZS5cbiAgICpcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBLViAmIHN0cmluZ30gS0VZXG4gICAqXG4gICAqIEBwYXJhbSB7S0VZfSBhdHRyaWJ1dGVOYW1lIFRoZSBhdHRyaWJ1dGUgbmFtZSB0aGF0IGlkZW50aWZpZXMgdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJpZWQgdmFsdWUuXG4gICAqIEByZXR1cm4ge0tWW0tFWV18dW5kZWZpbmVkfSBUaGUgcXVlcmllZCBhdHRyaWJ1dGUgdmFsdWUuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldEF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKHR5cGVNYXBHZXQodGhpcywgYXR0cmlidXRlTmFtZSkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGFuIGF0dHJpYnV0ZSBleGlzdHNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGF0dHJpYnV0ZU5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRvIGNoZWNrIGZvciBleGlzdGVuY2UuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGF0dHJpYnV0ZSBleGlzdHMuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGhhc0F0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKHR5cGVNYXBIYXModGhpcywgYXR0cmlidXRlTmFtZSkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgaW4gYSBKU09OIE9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTbmFwc2hvdH0gW3NuYXBzaG90XVxuICAgKiBAcmV0dXJuIHt7IFtLZXkgaW4gRXh0cmFjdDxrZXlvZiBLVixzdHJpbmc+XT86IEtWW0tleV19fSBBIEpTT04gT2JqZWN0IHRoYXQgZGVzY3JpYmVzIHRoZSBhdHRyaWJ1dGVzLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBnZXRBdHRyaWJ1dGVzIChzbmFwc2hvdCkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKHNuYXBzaG90ID8gdHlwZU1hcEdldEFsbFNuYXBzaG90KHRoaXMsIHNuYXBzaG90KSA6IHR5cGVNYXBHZXRBbGwodGhpcykpXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIERvbSBFbGVtZW50IHRoYXQgbWlycm9ycyB0aGlzIFlYbWxFbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0RvY3VtZW50fSBbX2RvY3VtZW50PWRvY3VtZW50XSBUaGUgZG9jdW1lbnQgb2JqZWN0ICh5b3UgbXVzdCBkZWZpbmVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyB3aGVuIGNhbGxpbmcgdGhpcyBtZXRob2QgaW5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZWpzKVxuICAgKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsIGFueT59IFtob29rcz17fV0gT3B0aW9uYWwgcHJvcGVydHkgdG8gY3VzdG9taXplIGhvdyBob29rc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZSBwcmVzZW50ZWQgaW4gdGhlIERPTVxuICAgKiBAcGFyYW0ge2FueX0gW2JpbmRpbmddIFlvdSBzaG91bGQgbm90IHNldCB0aGlzIHByb3BlcnR5LiBUaGlzIGlzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZWQgaWYgRG9tQmluZGluZyB3YW50cyB0byBjcmVhdGUgYVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NvY2lhdGlvbiB0byB0aGUgY3JlYXRlZCBET00gdHlwZS5cbiAgICogQHJldHVybiB7Tm9kZX0gVGhlIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudHxEb20gRWxlbWVudH1cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdG9ET00gKF9kb2N1bWVudCA9IGRvY3VtZW50LCBob29rcyA9IHt9LCBiaW5kaW5nKSB7XG4gICAgY29uc3QgZG9tID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy5ub2RlTmFtZSlcbiAgICBjb25zdCBhdHRycyA9IHRoaXMuZ2V0QXR0cmlidXRlcygpXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cnMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0cnNba2V5XVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZG9tLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKVxuICAgICAgfVxuICAgIH1cbiAgICB0eXBlTGlzdEZvckVhY2godGhpcywgeXhtbCA9PiB7XG4gICAgICBkb20uYXBwZW5kQ2hpbGQoeXhtbC50b0RPTShfZG9jdW1lbnQsIGhvb2tzLCBiaW5kaW5nKSlcbiAgICB9KVxuICAgIGlmIChiaW5kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGJpbmRpbmcuX2NyZWF0ZUFzc29jaWF0aW9uKGRvbSwgdGhpcylcbiAgICB9XG4gICAgcmV0dXJuIGRvbVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybSB0aGUgcHJvcGVydGllcyBvZiB0aGlzIHR5cGUgdG8gYmluYXJ5IGFuZCB3cml0ZSBpdCB0byBhblxuICAgKiBCaW5hcnlFbmNvZGVyLlxuICAgKlxuICAgKiBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoaXMgSXRlbSBpcyBzZW50IHRvIGEgcmVtb3RlIHBlZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyIFRoZSBlbmNvZGVyIHRvIHdyaXRlIGRhdGEgdG8uXG4gICAqL1xuICBfd3JpdGUgKGVuY29kZXIpIHtcbiAgICBlbmNvZGVyLndyaXRlVHlwZVJlZihZWG1sRWxlbWVudFJlZklEKVxuICAgIGVuY29kZXIud3JpdGVLZXkodGhpcy5ub2RlTmFtZSlcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtZWG1sRWxlbWVudH1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRZWG1sRWxlbWVudCA9IGRlY29kZXIgPT4gbmV3IFlYbWxFbGVtZW50KGRlY29kZXIucmVhZEtleSgpKVxuIiwgImltcG9ydCB7XG4gIFlFdmVudCxcbiAgWVhtbFRleHQsIFlYbWxFbGVtZW50LCBZWG1sRnJhZ21lbnQsIFRyYW5zYWN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG4vKipcbiAqIEBleHRlbmRzIFlFdmVudDxZWG1sRWxlbWVudHxZWG1sVGV4dHxZWG1sRnJhZ21lbnQ+XG4gKiBBbiBFdmVudCB0aGF0IGRlc2NyaWJlcyBjaGFuZ2VzIG9uIGEgWVhtbCBFbGVtZW50IG9yIFl4bWwgRnJhZ21lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIFlYbWxFdmVudCBleHRlbmRzIFlFdmVudCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1lYbWxFbGVtZW50fFlYbWxUZXh0fFlYbWxGcmFnbWVudH0gdGFyZ2V0IFRoZSB0YXJnZXQgb24gd2hpY2ggdGhlIGV2ZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7U2V0PHN0cmluZ3xudWxsPn0gc3VicyBUaGUgc2V0IG9mIGNoYW5nZWQgYXR0cmlidXRlcy4gYG51bGxgIGlzIGluY2x1ZGVkIGlmIHRoZVxuICAgKiAgICAgICAgICAgICAgICAgICBjaGlsZCBsaXN0IGNoYW5nZWQuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uIFRoZSB0cmFuc2FjdGlvbiBpbnN0YW5jZSB3aXRoIHdpY2ggdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZSB3YXMgY3JlYXRlZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yICh0YXJnZXQsIHN1YnMsIHRyYW5zYWN0aW9uKSB7XG4gICAgc3VwZXIodGFyZ2V0LCB0cmFuc2FjdGlvbilcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBjaGlsZHJlbiBjaGFuZ2VkLlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5jaGlsZExpc3RDaGFuZ2VkID0gZmFsc2VcbiAgICAvKipcbiAgICAgKiBTZXQgb2YgYWxsIGNoYW5nZWQgYXR0cmlidXRlcy5cbiAgICAgKiBAdHlwZSB7U2V0PHN0cmluZz59XG4gICAgICovXG4gICAgdGhpcy5hdHRyaWJ1dGVzQ2hhbmdlZCA9IG5ldyBTZXQoKVxuICAgIHN1YnMuZm9yRWFjaCgoc3ViKSA9PiB7XG4gICAgICBpZiAoc3ViID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuY2hpbGRMaXN0Q2hhbmdlZCA9IHRydWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc0NoYW5nZWQuYWRkKHN1YilcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG4iLCAiaW1wb3J0IHtcbiAgWU1hcCxcbiAgWVhtbEhvb2tSZWZJRCxcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG4vKipcbiAqIFlvdSBjYW4gbWFuYWdlIGJpbmRpbmcgdG8gYSBjdXN0b20gdHlwZSB3aXRoIFlYbWxIb29rLlxuICpcbiAqIEBleHRlbmRzIHtZTWFwPGFueT59XG4gKi9cbmV4cG9ydCBjbGFzcyBZWG1sSG9vayBleHRlbmRzIFlNYXAge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhvb2tOYW1lIG5vZGVOYW1lIG9mIHRoZSBEb20gTm9kZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChob29rTmFtZSkge1xuICAgIHN1cGVyKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMuaG9va05hbWUgPSBob29rTmFtZVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gSXRlbSB3aXRoIHRoZSBzYW1lIGVmZmVjdCBhcyB0aGlzIEl0ZW0gKHdpdGhvdXQgcG9zaXRpb24gZWZmZWN0KVxuICAgKi9cbiAgX2NvcHkgKCkge1xuICAgIHJldHVybiBuZXcgWVhtbEhvb2sodGhpcy5ob29rTmFtZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIGNvcHkgb2YgdGhpcyBkYXRhIHR5cGUgdGhhdCBjYW4gYmUgaW5jbHVkZWQgc29tZXdoZXJlIGVsc2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgY29udGVudCBpcyBvbmx5IHJlYWRhYmxlIF9hZnRlcl8gaXQgaGFzIGJlZW4gaW5jbHVkZWQgc29tZXdoZXJlIGluIHRoZSBZZG9jLlxuICAgKlxuICAgKiBAcmV0dXJuIHtZWG1sSG9va31cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICBjb25zdCBlbCA9IG5ldyBZWG1sSG9vayh0aGlzLmhvb2tOYW1lKVxuICAgIHRoaXMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgZWwuc2V0KGtleSwgdmFsdWUpXG4gICAgfSlcbiAgICByZXR1cm4gZWxcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgRG9tIEVsZW1lbnQgdGhhdCBtaXJyb3JzIHRoaXMgWVhtbEVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IFtfZG9jdW1lbnQ9ZG9jdW1lbnRdIFRoZSBkb2N1bWVudCBvYmplY3QgKHlvdSBtdXN0IGRlZmluZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIHdoZW4gY2FsbGluZyB0aGlzIG1ldGhvZCBpblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlanMpXG4gICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsIGFueT59IFtob29rc10gT3B0aW9uYWwgcHJvcGVydHkgdG8gY3VzdG9taXplIGhvdyBob29rc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZSBwcmVzZW50ZWQgaW4gdGhlIERPTVxuICAgKiBAcGFyYW0ge2FueX0gW2JpbmRpbmddIFlvdSBzaG91bGQgbm90IHNldCB0aGlzIHByb3BlcnR5LiBUaGlzIGlzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZWQgaWYgRG9tQmluZGluZyB3YW50cyB0byBjcmVhdGUgYVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NvY2lhdGlvbiB0byB0aGUgY3JlYXRlZCBET00gdHlwZVxuICAgKiBAcmV0dXJuIHtFbGVtZW50fSBUaGUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50fERvbSBFbGVtZW50fVxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b0RPTSAoX2RvY3VtZW50ID0gZG9jdW1lbnQsIGhvb2tzID0ge30sIGJpbmRpbmcpIHtcbiAgICBjb25zdCBob29rID0gaG9va3NbdGhpcy5ob29rTmFtZV1cbiAgICBsZXQgZG9tXG4gICAgaWYgKGhvb2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZG9tID0gaG9vay5jcmVhdGVEb20odGhpcylcbiAgICB9IGVsc2Uge1xuICAgICAgZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLmhvb2tOYW1lKVxuICAgIH1cbiAgICBkb20uc2V0QXR0cmlidXRlKCdkYXRhLXlqcy1ob29rJywgdGhpcy5ob29rTmFtZSlcbiAgICBpZiAoYmluZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBiaW5kaW5nLl9jcmVhdGVBc3NvY2lhdGlvbihkb20sIHRoaXMpXG4gICAgfVxuICAgIHJldHVybiBkb21cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm0gdGhlIHByb3BlcnRpZXMgb2YgdGhpcyB0eXBlIHRvIGJpbmFyeSBhbmQgd3JpdGUgaXQgdG8gYW5cbiAgICogQmluYXJ5RW5jb2Rlci5cbiAgICpcbiAgICogVGhpcyBpcyBjYWxsZWQgd2hlbiB0aGlzIEl0ZW0gaXMgc2VudCB0byBhIHJlbW90ZSBwZWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlciBUaGUgZW5jb2RlciB0byB3cml0ZSBkYXRhIHRvLlxuICAgKi9cbiAgX3dyaXRlIChlbmNvZGVyKSB7XG4gICAgZW5jb2Rlci53cml0ZVR5cGVSZWYoWVhtbEhvb2tSZWZJRClcbiAgICBlbmNvZGVyLndyaXRlS2V5KHRoaXMuaG9va05hbWUpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7WVhtbEhvb2t9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFlYbWxIb29rID0gZGVjb2RlciA9PlxuICBuZXcgWVhtbEhvb2soZGVjb2Rlci5yZWFkS2V5KCkpXG4iLCAiaW1wb3J0IHtcbiAgWVRleHQsXG4gIFlYbWxUZXh0UmVmSUQsXG4gIENvbnRlbnRUeXBlLCBZWG1sRWxlbWVudCwgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuLyoqXG4gKiBSZXByZXNlbnRzIHRleHQgaW4gYSBEb20gRWxlbWVudC4gSW4gdGhlIGZ1dHVyZSB0aGlzIHR5cGUgd2lsbCBhbHNvIGhhbmRsZVxuICogc2ltcGxlIGZvcm1hdHRpbmcgaW5mb3JtYXRpb24gbGlrZSBib2xkIGFuZCBpdGFsaWMuXG4gKi9cbmV4cG9ydCBjbGFzcyBZWG1sVGV4dCBleHRlbmRzIFlUZXh0IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtZWG1sRWxlbWVudHxZWG1sVGV4dHxudWxsfVxuICAgKi9cbiAgZ2V0IG5leHRTaWJsaW5nICgpIHtcbiAgICBjb25zdCBuID0gdGhpcy5faXRlbSA/IHRoaXMuX2l0ZW0ubmV4dCA6IG51bGxcbiAgICByZXR1cm4gbiA/IC8qKiBAdHlwZSB7WVhtbEVsZW1lbnR8WVhtbFRleHR9ICovICgvKiogQHR5cGUge0NvbnRlbnRUeXBlfSAqLyAobi5jb250ZW50KS50eXBlKSA6IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7WVhtbEVsZW1lbnR8WVhtbFRleHR8bnVsbH1cbiAgICovXG4gIGdldCBwcmV2U2libGluZyAoKSB7XG4gICAgY29uc3QgbiA9IHRoaXMuX2l0ZW0gPyB0aGlzLl9pdGVtLnByZXYgOiBudWxsXG4gICAgcmV0dXJuIG4gPyAvKiogQHR5cGUge1lYbWxFbGVtZW50fFlYbWxUZXh0fSAqLyAoLyoqIEB0eXBlIHtDb250ZW50VHlwZX0gKi8gKG4uY29udGVudCkudHlwZSkgOiBudWxsXG4gIH1cblxuICBfY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBZWG1sVGV4dCgpXG4gIH1cblxuICAvKipcbiAgICogTWFrZXMgYSBjb3B5IG9mIHRoaXMgZGF0YSB0eXBlIHRoYXQgY2FuIGJlIGluY2x1ZGVkIHNvbWV3aGVyZSBlbHNlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIGNvbnRlbnQgaXMgb25seSByZWFkYWJsZSBfYWZ0ZXJfIGl0IGhhcyBiZWVuIGluY2x1ZGVkIHNvbWV3aGVyZSBpbiB0aGUgWWRvYy5cbiAgICpcbiAgICogQHJldHVybiB7WVhtbFRleHR9XG4gICAqL1xuICBjbG9uZSAoKSB7XG4gICAgY29uc3QgdGV4dCA9IG5ldyBZWG1sVGV4dCgpXG4gICAgdGV4dC5hcHBseURlbHRhKHRoaXMudG9EZWx0YSgpKVxuICAgIHJldHVybiB0ZXh0XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIERvbSBFbGVtZW50IHRoYXQgbWlycm9ycyB0aGlzIFlYbWxUZXh0LlxuICAgKlxuICAgKiBAcGFyYW0ge0RvY3VtZW50fSBbX2RvY3VtZW50PWRvY3VtZW50XSBUaGUgZG9jdW1lbnQgb2JqZWN0ICh5b3UgbXVzdCBkZWZpbmVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyB3aGVuIGNhbGxpbmcgdGhpcyBtZXRob2QgaW5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZWpzKVxuICAgKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsIGFueT59IFtob29rc10gT3B0aW9uYWwgcHJvcGVydHkgdG8gY3VzdG9taXplIGhvdyBob29rc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZSBwcmVzZW50ZWQgaW4gdGhlIERPTVxuICAgKiBAcGFyYW0ge2FueX0gW2JpbmRpbmddIFlvdSBzaG91bGQgbm90IHNldCB0aGlzIHByb3BlcnR5LiBUaGlzIGlzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZWQgaWYgRG9tQmluZGluZyB3YW50cyB0byBjcmVhdGUgYVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NvY2lhdGlvbiB0byB0aGUgY3JlYXRlZCBET00gdHlwZS5cbiAgICogQHJldHVybiB7VGV4dH0gVGhlIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudHxEb20gRWxlbWVudH1cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdG9ET00gKF9kb2N1bWVudCA9IGRvY3VtZW50LCBob29rcywgYmluZGluZykge1xuICAgIGNvbnN0IGRvbSA9IF9kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0aGlzLnRvU3RyaW5nKCkpXG4gICAgaWYgKGJpbmRpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYmluZGluZy5fY3JlYXRlQXNzb2NpYXRpb24oZG9tLCB0aGlzKVxuICAgIH1cbiAgICByZXR1cm4gZG9tXG4gIH1cblxuICB0b1N0cmluZyAoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiB0aGlzLnRvRGVsdGEoKS5tYXAoZGVsdGEgPT4ge1xuICAgICAgY29uc3QgbmVzdGVkTm9kZXMgPSBbXVxuICAgICAgZm9yIChjb25zdCBub2RlTmFtZSBpbiBkZWx0YS5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIGNvbnN0IGF0dHJzID0gW11cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gZGVsdGEuYXR0cmlidXRlc1tub2RlTmFtZV0pIHtcbiAgICAgICAgICBhdHRycy5wdXNoKHsga2V5LCB2YWx1ZTogZGVsdGEuYXR0cmlidXRlc1tub2RlTmFtZV1ba2V5XSB9KVxuICAgICAgICB9XG4gICAgICAgIC8vIHNvcnQgYXR0cmlidXRlcyB0byBnZXQgYSB1bmlxdWUgb3JkZXJcbiAgICAgICAgYXR0cnMuc29ydCgoYSwgYikgPT4gYS5rZXkgPCBiLmtleSA/IC0xIDogMSlcbiAgICAgICAgbmVzdGVkTm9kZXMucHVzaCh7IG5vZGVOYW1lLCBhdHRycyB9KVxuICAgICAgfVxuICAgICAgLy8gc29ydCBub2RlIG9yZGVyIHRvIGdldCBhIHVuaXF1ZSBvcmRlclxuICAgICAgbmVzdGVkTm9kZXMuc29ydCgoYSwgYikgPT4gYS5ub2RlTmFtZSA8IGIubm9kZU5hbWUgPyAtMSA6IDEpXG4gICAgICAvLyBub3cgY29udmVydCB0byBkb20gc3RyaW5nXG4gICAgICBsZXQgc3RyID0gJydcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVzdGVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5lc3RlZE5vZGVzW2ldXG4gICAgICAgIHN0ciArPSBgPCR7bm9kZS5ub2RlTmFtZX1gXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZS5hdHRycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGF0dHIgPSBub2RlLmF0dHJzW2pdXG4gICAgICAgICAgc3RyICs9IGAgJHthdHRyLmtleX09XCIke2F0dHIudmFsdWV9XCJgXG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9ICc+J1xuICAgICAgfVxuICAgICAgc3RyICs9IGRlbHRhLmluc2VydFxuICAgICAgZm9yIChsZXQgaSA9IG5lc3RlZE5vZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHN0ciArPSBgPC8ke25lc3RlZE5vZGVzW2ldLm5vZGVOYW1lfT5gXG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyXG4gICAgfSkuam9pbignJylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0pTT04gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKi9cbiAgX3dyaXRlIChlbmNvZGVyKSB7XG4gICAgZW5jb2Rlci53cml0ZVR5cGVSZWYoWVhtbFRleHRSZWZJRClcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtZWG1sVGV4dH1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkWVhtbFRleHQgPSBkZWNvZGVyID0+IG5ldyBZWG1sVGV4dCgpXG4iLCAiaW1wb3J0IHtcbiAgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIElELCBUcmFuc2FjdGlvbiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcblxuZXhwb3J0IGNsYXNzIEFic3RyYWN0U3RydWN0IHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7SUR9IGlkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGhcbiAgICovXG4gIGNvbnN0cnVjdG9yIChpZCwgbGVuZ3RoKSB7XG4gICAgdGhpcy5pZCA9IGlkXG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIGdldCBkZWxldGVkICgpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXJnZSB0aGlzIHN0cnVjdCB3aXRoIHRoZSBpdGVtIHRvIHRoZSByaWdodC5cbiAgICogVGhpcyBtZXRob2QgaXMgYWxyZWFkeSBhc3N1bWluZyB0aGF0IGB0aGlzLmlkLmNsb2NrICsgdGhpcy5sZW5ndGggPT09IHRoaXMuaWQuY2xvY2tgLlxuICAgKiBBbHNvIHRoaXMgbWV0aG9kIGRvZXMgKm5vdCogcmVtb3ZlIHJpZ2h0IGZyb20gU3RydWN0U3RvcmUhXG4gICAqIEBwYXJhbSB7QWJzdHJhY3RTdHJ1Y3R9IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHdldGhlciB0aGlzIG1lcmdlZCB3aXRoIHJpZ2h0XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXIgVGhlIGVuY29kZXIgdG8gd3JpdGUgZGF0YSB0by5cbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKiBAcGFyYW0ge251bWJlcn0gZW5jb2RpbmdSZWZcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQsIGVuY29kaW5nUmVmKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgaW50ZWdyYXRlICh0cmFuc2FjdGlvbiwgb2Zmc2V0KSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cbn1cbiIsICJpbXBvcnQge1xuICBBYnN0cmFjdFN0cnVjdCxcbiAgYWRkU3RydWN0LFxuICBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIFN0cnVjdFN0b3JlLCBUcmFuc2FjdGlvbiwgSUQgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmV4cG9ydCBjb25zdCBzdHJ1Y3RHQ1JlZk51bWJlciA9IDBcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgR0MgZXh0ZW5kcyBBYnN0cmFjdFN0cnVjdCB7XG4gIGdldCBkZWxldGVkICgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZGVsZXRlICgpIHt9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0N9IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IgIT09IHJpZ2h0LmNvbnN0cnVjdG9yKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdGhpcy5sZW5ndGggKz0gcmlnaHQubGVuZ3RoXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBvZmZzZXQpIHtcbiAgICBpZiAob2Zmc2V0ID4gMCkge1xuICAgICAgdGhpcy5pZC5jbG9jayArPSBvZmZzZXRcbiAgICAgIHRoaXMubGVuZ3RoIC09IG9mZnNldFxuICAgIH1cbiAgICBhZGRTdHJ1Y3QodHJhbnNhY3Rpb24uZG9jLnN0b3JlLCB0aGlzKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBlbmNvZGVyLndyaXRlSW5mbyhzdHJ1Y3RHQ1JlZk51bWJlcilcbiAgICBlbmNvZGVyLndyaXRlTGVuKHRoaXMubGVuZ3RoIC0gb2Zmc2V0KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqIEByZXR1cm4ge251bGwgfCBudW1iZXJ9XG4gICAqL1xuICBnZXRNaXNzaW5nICh0cmFuc2FjdGlvbiwgc3RvcmUpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG4iLCAiaW1wb3J0IHtcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBTdHJ1Y3RTdG9yZSwgSXRlbSwgVHJhbnNhY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5cbmV4cG9ydCBjbGFzcyBDb250ZW50QmluYXJ5IHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gY29udGVudFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGNvbnRlbnQpIHtcbiAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0TGVuZ3RoICgpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gICAqL1xuICBnZXRDb250ZW50ICgpIHtcbiAgICByZXR1cm4gW3RoaXMuY29udGVudF1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Q29udGVudEJpbmFyeX1cbiAgICovXG4gIGNvcHkgKCkge1xuICAgIHJldHVybiBuZXcgQ29udGVudEJpbmFyeSh0aGlzLmNvbnRlbnQpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKiBAcmV0dXJuIHtDb250ZW50QmluYXJ5fVxuICAgKi9cbiAgc3BsaWNlIChvZmZzZXQpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0NvbnRlbnRCaW5hcnl9IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBpdGVtKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICAgKi9cbiAgZ2MgKHN0b3JlKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCkge1xuICAgIGVuY29kZXIud3JpdGVCdWYodGhpcy5jb250ZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDNcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyIH0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudEJpbmFyeX1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDb250ZW50QmluYXJ5ID0gZGVjb2RlciA9PiBuZXcgQ29udGVudEJpbmFyeShkZWNvZGVyLnJlYWRCdWYoKSlcbiIsICJpbXBvcnQge1xuICBhZGRUb0RlbGV0ZVNldCxcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBTdHJ1Y3RTdG9yZSwgSXRlbSwgVHJhbnNhY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmV4cG9ydCBjbGFzcyBDb250ZW50RGVsZXRlZCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAobGVuKSB7XG4gICAgdGhpcy5sZW4gPSBsZW5cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiB0aGlzLmxlblxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gICAqL1xuICBnZXRDb250ZW50ICgpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0NvbnRlbnREZWxldGVkfVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZW50RGVsZXRlZCh0aGlzLmxlbilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnREZWxldGVkfVxuICAgKi9cbiAgc3BsaWNlIChvZmZzZXQpIHtcbiAgICBjb25zdCByaWdodCA9IG5ldyBDb250ZW50RGVsZXRlZCh0aGlzLmxlbiAtIG9mZnNldClcbiAgICB0aGlzLmxlbiA9IG9mZnNldFxuICAgIHJldHVybiByaWdodFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29udGVudERlbGV0ZWR9IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgdGhpcy5sZW4gKz0gcmlnaHQubGVuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIGl0ZW0pIHtcbiAgICBhZGRUb0RlbGV0ZVNldCh0cmFuc2FjdGlvbi5kZWxldGVTZXQsIGl0ZW0uaWQuY2xpZW50LCBpdGVtLmlkLmNsb2NrLCB0aGlzLmxlbilcbiAgICBpdGVtLm1hcmtEZWxldGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKi9cbiAgZGVsZXRlICh0cmFuc2FjdGlvbikge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqL1xuICBnYyAoc3RvcmUpIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgZW5jb2Rlci53cml0ZUxlbih0aGlzLmxlbiAtIG9mZnNldClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRSZWYgKCkge1xuICAgIHJldHVybiAxXG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyIH0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudERlbGV0ZWR9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkQ29udGVudERlbGV0ZWQgPSBkZWNvZGVyID0+IG5ldyBDb250ZW50RGVsZXRlZChkZWNvZGVyLnJlYWRMZW4oKSlcbiIsICJpbXBvcnQge1xuICBEb2MsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgU3RydWN0U3RvcmUsIFRyYW5zYWN0aW9uLCBJdGVtIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBndWlkXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsIGFueT59IG9wdHNcbiAqL1xuY29uc3QgY3JlYXRlRG9jRnJvbU9wdHMgPSAoZ3VpZCwgb3B0cykgPT4gbmV3IERvYyh7IGd1aWQsIC4uLm9wdHMsIHNob3VsZExvYWQ6IG9wdHMuc2hvdWxkTG9hZCB8fCBvcHRzLmF1dG9Mb2FkIHx8IGZhbHNlIH0pXG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRlbnREb2Mge1xuICAvKipcbiAgICogQHBhcmFtIHtEb2N9IGRvY1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGRvYykge1xuICAgIGlmIChkb2MuX2l0ZW0pIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoaXMgZG9jdW1lbnQgd2FzIGFscmVhZHkgaW50ZWdyYXRlZCBhcyBhIHN1Yi1kb2N1bWVudC4gWW91IHNob3VsZCBjcmVhdGUgYSBzZWNvbmQgaW5zdGFuY2UgaW5zdGVhZCB3aXRoIHRoZSBzYW1lIGd1aWQuJylcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHR5cGUge0RvY31cbiAgICAgKi9cbiAgICB0aGlzLmRvYyA9IGRvY1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHthbnl9XG4gICAgICovXG4gICAgY29uc3Qgb3B0cyA9IHt9XG4gICAgdGhpcy5vcHRzID0gb3B0c1xuICAgIGlmICghZG9jLmdjKSB7XG4gICAgICBvcHRzLmdjID0gZmFsc2VcbiAgICB9XG4gICAgaWYgKGRvYy5hdXRvTG9hZCkge1xuICAgICAgb3B0cy5hdXRvTG9hZCA9IHRydWVcbiAgICB9XG4gICAgaWYgKGRvYy5tZXRhICE9PSBudWxsKSB7XG4gICAgICBvcHRzLm1ldGEgPSBkb2MubWV0YVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGdldENvbnRlbnQgKCkge1xuICAgIHJldHVybiBbdGhpcy5kb2NdXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzQ291bnRhYmxlICgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0NvbnRlbnREb2N9XG4gICAqL1xuICBjb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IENvbnRlbnREb2MoY3JlYXRlRG9jRnJvbU9wdHModGhpcy5kb2MuZ3VpZCwgdGhpcy5vcHRzKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnREb2N9XG4gICAqL1xuICBzcGxpY2UgKG9mZnNldCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29udGVudERvY30gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIGl0ZW0pIHtcbiAgICAvLyB0aGlzIG5lZWRzIHRvIGJlIHJlZmxlY3RlZCBpbiBkb2MuZGVzdHJveSBhcyB3ZWxsXG4gICAgdGhpcy5kb2MuX2l0ZW0gPSBpdGVtXG4gICAgdHJhbnNhY3Rpb24uc3ViZG9jc0FkZGVkLmFkZCh0aGlzLmRvYylcbiAgICBpZiAodGhpcy5kb2Muc2hvdWxkTG9hZCkge1xuICAgICAgdHJhbnNhY3Rpb24uc3ViZG9jc0xvYWRlZC5hZGQodGhpcy5kb2MpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqL1xuICBkZWxldGUgKHRyYW5zYWN0aW9uKSB7XG4gICAgaWYgKHRyYW5zYWN0aW9uLnN1YmRvY3NBZGRlZC5oYXModGhpcy5kb2MpKSB7XG4gICAgICB0cmFuc2FjdGlvbi5zdWJkb2NzQWRkZWQuZGVsZXRlKHRoaXMuZG9jKVxuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2FjdGlvbi5zdWJkb2NzUmVtb3ZlZC5hZGQodGhpcy5kb2MpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqL1xuICBnYyAoc3RvcmUpIHsgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgZW5jb2Rlci53cml0ZVN0cmluZyh0aGlzLmRvYy5ndWlkKVxuICAgIGVuY29kZXIud3JpdGVBbnkodGhpcy5vcHRzKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDlcbiAgfVxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge0NvbnRlbnREb2N9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkQ29udGVudERvYyA9IGRlY29kZXIgPT4gbmV3IENvbnRlbnREb2MoY3JlYXRlRG9jRnJvbU9wdHMoZGVjb2Rlci5yZWFkU3RyaW5nKCksIGRlY29kZXIucmVhZEFueSgpKSlcbiIsICJpbXBvcnQge1xuICBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIFN0cnVjdFN0b3JlLCBJdGVtLCBUcmFuc2FjdGlvbiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgQ29udGVudEVtYmVkIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbWJlZFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGVtYmVkKSB7XG4gICAgdGhpcy5lbWJlZCA9IGVtYmVkXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0TGVuZ3RoICgpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gICAqL1xuICBnZXRDb250ZW50ICgpIHtcbiAgICByZXR1cm4gW3RoaXMuZW1iZWRdXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzQ291bnRhYmxlICgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0NvbnRlbnRFbWJlZH1cbiAgICovXG4gIGNvcHkgKCkge1xuICAgIHJldHVybiBuZXcgQ29udGVudEVtYmVkKHRoaXMuZW1iZWQpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKiBAcmV0dXJuIHtDb250ZW50RW1iZWR9XG4gICAqL1xuICBzcGxpY2UgKG9mZnNldCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29udGVudEVtYmVkfSByaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChyaWdodCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICAgKi9cbiAgaW50ZWdyYXRlICh0cmFuc2FjdGlvbiwgaXRlbSkge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqL1xuICBkZWxldGUgKHRyYW5zYWN0aW9uKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICovXG4gIGdjIChzdG9yZSkge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBlbmNvZGVyLndyaXRlSlNPTih0aGlzLmVtYmVkKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDVcbiAgfVxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge0NvbnRlbnRFbWJlZH1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDb250ZW50RW1iZWQgPSBkZWNvZGVyID0+IG5ldyBDb250ZW50RW1iZWQoZGVjb2Rlci5yZWFkSlNPTigpKVxuIiwgImltcG9ydCB7XG4gIFlUZXh0LCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIEl0ZW0sIFN0cnVjdFN0b3JlLCBUcmFuc2FjdGlvbiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgQ29udGVudEZvcm1hdCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZVxuICAgKi9cbiAgY29uc3RydWN0b3IgKGtleSwgdmFsdWUpIHtcbiAgICB0aGlzLmtleSA9IGtleVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldExlbmd0aCAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgZ2V0Q29udGVudCAoKSB7XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzQ291bnRhYmxlICgpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtDb250ZW50Rm9ybWF0fVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZW50Rm9ybWF0KHRoaXMua2V5LCB0aGlzLnZhbHVlKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBfb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnRGb3JtYXR9XG4gICAqL1xuICBzcGxpY2UgKF9vZmZzZXQpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0NvbnRlbnRGb3JtYXR9IF9yaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChfcmlnaHQpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSBfdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBpbnRlZ3JhdGUgKF90cmFuc2FjdGlvbiwgaXRlbSkge1xuICAgIC8vIEB0b2RvIHNlYXJjaG1hcmtlciBhcmUgY3VycmVudGx5IHVuc3VwcG9ydGVkIGZvciByaWNoIHRleHQgZG9jdW1lbnRzXG4gICAgY29uc3QgcCA9IC8qKiBAdHlwZSB7WVRleHR9ICovIChpdGVtLnBhcmVudClcbiAgICBwLl9zZWFyY2hNYXJrZXIgPSBudWxsXG4gICAgcC5faGFzRm9ybWF0dGluZyA9IHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKi9cbiAgZGVsZXRlICh0cmFuc2FjdGlvbikge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqL1xuICBnYyAoc3RvcmUpIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgZW5jb2Rlci53cml0ZUtleSh0aGlzLmtleSlcbiAgICBlbmNvZGVyLndyaXRlSlNPTih0aGlzLnZhbHVlKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDZcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtDb250ZW50Rm9ybWF0fVxuICovXG5leHBvcnQgY29uc3QgcmVhZENvbnRlbnRGb3JtYXQgPSBkZWNvZGVyID0+IG5ldyBDb250ZW50Rm9ybWF0KGRlY29kZXIucmVhZEtleSgpLCBkZWNvZGVyLnJlYWRKU09OKCkpXG4iLCAiaW1wb3J0IHtcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBUcmFuc2FjdGlvbiwgSXRlbSwgU3RydWN0U3RvcmUgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRlbnRKU09OIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gYXJyXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoYXJyKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PGFueT59XG4gICAgICovXG4gICAgdGhpcy5hcnIgPSBhcnJcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiB0aGlzLmFyci5sZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgZ2V0Q29udGVudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJyXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzQ291bnRhYmxlICgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0NvbnRlbnRKU09OfVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZW50SlNPTih0aGlzLmFycilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnRKU09OfVxuICAgKi9cbiAgc3BsaWNlIChvZmZzZXQpIHtcbiAgICBjb25zdCByaWdodCA9IG5ldyBDb250ZW50SlNPTih0aGlzLmFyci5zbGljZShvZmZzZXQpKVxuICAgIHRoaXMuYXJyID0gdGhpcy5hcnIuc2xpY2UoMCwgb2Zmc2V0KVxuICAgIHJldHVybiByaWdodFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29udGVudEpTT059IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgdGhpcy5hcnIgPSB0aGlzLmFyci5jb25jYXQocmlnaHQuYXJyKVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBpdGVtKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICAgKi9cbiAgZ2MgKHN0b3JlKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCkge1xuICAgIGNvbnN0IGxlbiA9IHRoaXMuYXJyLmxlbmd0aFxuICAgIGVuY29kZXIud3JpdGVMZW4obGVuIC0gb2Zmc2V0KVxuICAgIGZvciAobGV0IGkgPSBvZmZzZXQ7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3QgYyA9IHRoaXMuYXJyW2ldXG4gICAgICBlbmNvZGVyLndyaXRlU3RyaW5nKGMgPT09IHVuZGVmaW5lZCA/ICd1bmRlZmluZWQnIDogSlNPTi5zdHJpbmdpZnkoYykpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDJcbiAgfVxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge0NvbnRlbnRKU09OfVxuICovXG5leHBvcnQgY29uc3QgcmVhZENvbnRlbnRKU09OID0gZGVjb2RlciA9PiB7XG4gIGNvbnN0IGxlbiA9IGRlY29kZXIucmVhZExlbigpXG4gIGNvbnN0IGNzID0gW11cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGNvbnN0IGMgPSBkZWNvZGVyLnJlYWRTdHJpbmcoKVxuICAgIGlmIChjID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY3MucHVzaCh1bmRlZmluZWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNzLnB1c2goSlNPTi5wYXJzZShjKSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ldyBDb250ZW50SlNPTihjcylcbn1cbiIsICJpbXBvcnQge1xuICBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFRyYW5zYWN0aW9uLCBJdGVtLCBTdHJ1Y3RTdG9yZSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgZW52IGZyb20gJ2xpYjAvZW52aXJvbm1lbnQnXG5pbXBvcnQgKiBhcyBvYmplY3QgZnJvbSAnbGliMC9vYmplY3QnXG5cbmNvbnN0IGlzRGV2TW9kZSA9IGVudi5nZXRWYXJpYWJsZSgnbm9kZV9lbnYnKSA9PT0gJ2RldmVsb3BtZW50J1xuXG5leHBvcnQgY2xhc3MgQ29udGVudEFueSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PGFueT59IGFyclxuICAgKi9cbiAgY29uc3RydWN0b3IgKGFycikge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxhbnk+fVxuICAgICAqL1xuICAgIHRoaXMuYXJyID0gYXJyXG4gICAgaXNEZXZNb2RlICYmIG9iamVjdC5kZWVwRnJlZXplKGFycilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiB0aGlzLmFyci5sZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgZ2V0Q29udGVudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJyXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzQ291bnRhYmxlICgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0NvbnRlbnRBbnl9XG4gICAqL1xuICBjb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IENvbnRlbnRBbnkodGhpcy5hcnIpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKiBAcmV0dXJuIHtDb250ZW50QW55fVxuICAgKi9cbiAgc3BsaWNlIChvZmZzZXQpIHtcbiAgICBjb25zdCByaWdodCA9IG5ldyBDb250ZW50QW55KHRoaXMuYXJyLnNsaWNlKG9mZnNldCkpXG4gICAgdGhpcy5hcnIgPSB0aGlzLmFyci5zbGljZSgwLCBvZmZzZXQpXG4gICAgcmV0dXJuIHJpZ2h0XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb250ZW50QW55fSByaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChyaWdodCkge1xuICAgIHRoaXMuYXJyID0gdGhpcy5hcnIuY29uY2F0KHJpZ2h0LmFycilcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICAgKi9cbiAgaW50ZWdyYXRlICh0cmFuc2FjdGlvbiwgaXRlbSkge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqL1xuICBkZWxldGUgKHRyYW5zYWN0aW9uKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICovXG4gIGdjIChzdG9yZSkge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBjb25zdCBsZW4gPSB0aGlzLmFyci5sZW5ndGhcbiAgICBlbmNvZGVyLndyaXRlTGVuKGxlbiAtIG9mZnNldClcbiAgICBmb3IgKGxldCBpID0gb2Zmc2V0OyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLmFycltpXVxuICAgICAgZW5jb2Rlci53cml0ZUFueShjKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRSZWYgKCkge1xuICAgIHJldHVybiA4XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudEFueX1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDb250ZW50QW55ID0gZGVjb2RlciA9PiB7XG4gIGNvbnN0IGxlbiA9IGRlY29kZXIucmVhZExlbigpXG4gIGNvbnN0IGNzID0gW11cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGNzLnB1c2goZGVjb2Rlci5yZWFkQW55KCkpXG4gIH1cbiAgcmV0dXJuIG5ldyBDb250ZW50QW55KGNzKVxufVxuIiwgImltcG9ydCB7XG4gIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgVHJhbnNhY3Rpb24sIEl0ZW0sIFN0cnVjdFN0b3JlIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBDb250ZW50U3RyaW5nIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAgICovXG4gIGNvbnN0cnVjdG9yIChzdHIpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMuc3RyID0gc3RyXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0TGVuZ3RoICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdHIubGVuZ3RoXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGdldENvbnRlbnQgKCkge1xuICAgIHJldHVybiB0aGlzLnN0ci5zcGxpdCgnJylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Q29udGVudFN0cmluZ31cbiAgICovXG4gIGNvcHkgKCkge1xuICAgIHJldHVybiBuZXcgQ29udGVudFN0cmluZyh0aGlzLnN0cilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnRTdHJpbmd9XG4gICAqL1xuICBzcGxpY2UgKG9mZnNldCkge1xuICAgIGNvbnN0IHJpZ2h0ID0gbmV3IENvbnRlbnRTdHJpbmcodGhpcy5zdHIuc2xpY2Uob2Zmc2V0KSlcbiAgICB0aGlzLnN0ciA9IHRoaXMuc3RyLnNsaWNlKDAsIG9mZnNldClcblxuICAgIC8vIFByZXZlbnQgZW5jb2RpbmcgaW52YWxpZCBkb2N1bWVudHMgYmVjYXVzZSBvZiBzcGxpdHRpbmcgb2Ygc3Vycm9nYXRlIHBhaXJzOiBodHRwczovL2dpdGh1Yi5jb20veWpzL3lqcy9pc3N1ZXMvMjQ4XG4gICAgY29uc3QgZmlyc3RDaGFyQ29kZSA9IHRoaXMuc3RyLmNoYXJDb2RlQXQob2Zmc2V0IC0gMSlcbiAgICBpZiAoZmlyc3RDaGFyQ29kZSA+PSAweEQ4MDAgJiYgZmlyc3RDaGFyQ29kZSA8PSAweERCRkYpIHtcbiAgICAgIC8vIExhc3QgY2hhcmFjdGVyIG9mIHRoZSBsZWZ0IHNwbGl0IGlzIHRoZSBzdGFydCBvZiBhIHN1cnJvZ2F0ZSB1dGYxNi91Y3MyIHBhaXIuXG4gICAgICAvLyBXZSBkb24ndCBzdXBwb3J0IHNwbGl0dGluZyBvZiBzdXJyb2dhdGUgcGFpcnMgYmVjYXVzZSB0aGlzIG1heSBsZWFkIHRvIGludmFsaWQgZG9jdW1lbnRzLlxuICAgICAgLy8gUmVwbGFjZSB0aGUgaW52YWxpZCBjaGFyYWN0ZXIgd2l0aCBhIHVuaWNvZGUgcmVwbGFjZW1lbnQgY2hhcmFjdGVyIChcdUZGRkQgLyBVK0ZGRkQpXG4gICAgICB0aGlzLnN0ciA9IHRoaXMuc3RyLnNsaWNlKDAsIG9mZnNldCAtIDEpICsgJ1x1RkZGRCdcbiAgICAgIC8vIHJlcGxhY2UgcmlnaHQgYXMgd2VsbFxuICAgICAgcmlnaHQuc3RyID0gJ1x1RkZGRCcgKyByaWdodC5zdHIuc2xpY2UoMSlcbiAgICB9XG4gICAgcmV0dXJuIHJpZ2h0XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb250ZW50U3RyaW5nfSByaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChyaWdodCkge1xuICAgIHRoaXMuc3RyICs9IHJpZ2h0LnN0clxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBpdGVtKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICAgKi9cbiAgZ2MgKHN0b3JlKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCkge1xuICAgIGVuY29kZXIud3JpdGVTdHJpbmcob2Zmc2V0ID09PSAwID8gdGhpcy5zdHIgOiB0aGlzLnN0ci5zbGljZShvZmZzZXQpKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDRcbiAgfVxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge0NvbnRlbnRTdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkQ29udGVudFN0cmluZyA9IGRlY29kZXIgPT4gbmV3IENvbnRlbnRTdHJpbmcoZGVjb2Rlci5yZWFkU3RyaW5nKCkpXG4iLCAiaW1wb3J0IHtcbiAgcmVhZFlBcnJheSxcbiAgcmVhZFlNYXAsXG4gIHJlYWRZVGV4dCxcbiAgcmVhZFlYbWxFbGVtZW50LFxuICByZWFkWVhtbEZyYWdtZW50LFxuICByZWFkWVhtbEhvb2ssXG4gIHJlYWRZWG1sVGV4dCxcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBTdHJ1Y3RTdG9yZSwgVHJhbnNhY3Rpb24sIEl0ZW0sIFlFdmVudCwgQWJzdHJhY3RUeXBlIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG4vKipcbiAqIEB0eXBlIHtBcnJheTxmdW5jdGlvbihVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjIpOkFic3RyYWN0VHlwZTxhbnk+Pn1cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlUmVmcyA9IFtcbiAgcmVhZFlBcnJheSxcbiAgcmVhZFlNYXAsXG4gIHJlYWRZVGV4dCxcbiAgcmVhZFlYbWxFbGVtZW50LFxuICByZWFkWVhtbEZyYWdtZW50LFxuICByZWFkWVhtbEhvb2ssXG4gIHJlYWRZWG1sVGV4dFxuXVxuXG5leHBvcnQgY29uc3QgWUFycmF5UmVmSUQgPSAwXG5leHBvcnQgY29uc3QgWU1hcFJlZklEID0gMVxuZXhwb3J0IGNvbnN0IFlUZXh0UmVmSUQgPSAyXG5leHBvcnQgY29uc3QgWVhtbEVsZW1lbnRSZWZJRCA9IDNcbmV4cG9ydCBjb25zdCBZWG1sRnJhZ21lbnRSZWZJRCA9IDRcbmV4cG9ydCBjb25zdCBZWG1sSG9va1JlZklEID0gNVxuZXhwb3J0IGNvbnN0IFlYbWxUZXh0UmVmSUQgPSA2XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRlbnRUeXBlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAgICovXG4gIGNvbnN0cnVjdG9yICh0eXBlKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fVxuICAgICAqL1xuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGdldENvbnRlbnQgKCkge1xuICAgIHJldHVybiBbdGhpcy50eXBlXVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0NvdW50YWJsZSAoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtDb250ZW50VHlwZX1cbiAgICovXG4gIGNvcHkgKCkge1xuICAgIHJldHVybiBuZXcgQ29udGVudFR5cGUodGhpcy50eXBlLl9jb3B5KCkpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKiBAcmV0dXJuIHtDb250ZW50VHlwZX1cbiAgICovXG4gIHNwbGljZSAob2Zmc2V0KSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb250ZW50VHlwZX0gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIGl0ZW0pIHtcbiAgICB0aGlzLnR5cGUuX2ludGVncmF0ZSh0cmFuc2FjdGlvbi5kb2MsIGl0ZW0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudHlwZS5fc3RhcnRcbiAgICB3aGlsZSAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgaWYgKCFpdGVtLmRlbGV0ZWQpIHtcbiAgICAgICAgaXRlbS5kZWxldGUodHJhbnNhY3Rpb24pXG4gICAgICB9IGVsc2UgaWYgKGl0ZW0uaWQuY2xvY2sgPCAodHJhbnNhY3Rpb24uYmVmb3JlU3RhdGUuZ2V0KGl0ZW0uaWQuY2xpZW50KSB8fCAwKSkge1xuICAgICAgICAvLyBUaGlzIHdpbGwgYmUgZ2MnZCBsYXRlciBhbmQgd2Ugd2FudCB0byBtZXJnZSBpdCBpZiBwb3NzaWJsZVxuICAgICAgICAvLyBXZSB0cnkgdG8gbWVyZ2UgYWxsIGRlbGV0ZWQgaXRlbXMgYWZ0ZXIgZWFjaCB0cmFuc2FjdGlvbixcbiAgICAgICAgLy8gYnV0IHdlIGhhdmUgbm8ga25vd2xlZGdlIGFib3V0IHRoYXQgdGhpcyBuZWVkcyB0byBiZSBtZXJnZWRcbiAgICAgICAgLy8gc2luY2UgaXQgaXMgbm90IGluIHRyYW5zYWN0aW9uLmRzLiBIZW5jZSB3ZSBhZGQgaXQgdG8gdHJhbnNhY3Rpb24uX21lcmdlU3RydWN0c1xuICAgICAgICB0cmFuc2FjdGlvbi5fbWVyZ2VTdHJ1Y3RzLnB1c2goaXRlbSlcbiAgICAgIH1cbiAgICAgIGl0ZW0gPSBpdGVtLnJpZ2h0XG4gICAgfVxuICAgIHRoaXMudHlwZS5fbWFwLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBpZiAoIWl0ZW0uZGVsZXRlZCkge1xuICAgICAgICBpdGVtLmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS5pZC5jbG9jayA8ICh0cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZS5nZXQoaXRlbS5pZC5jbGllbnQpIHx8IDApKSB7XG4gICAgICAgIC8vIHNhbWUgYXMgYWJvdmVcbiAgICAgICAgdHJhbnNhY3Rpb24uX21lcmdlU3RydWN0cy5wdXNoKGl0ZW0pXG4gICAgICB9XG4gICAgfSlcbiAgICB0cmFuc2FjdGlvbi5jaGFuZ2VkLmRlbGV0ZSh0aGlzLnR5cGUpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICovXG4gIGdjIChzdG9yZSkge1xuICAgIGxldCBpdGVtID0gdGhpcy50eXBlLl9zdGFydFxuICAgIHdoaWxlIChpdGVtICE9PSBudWxsKSB7XG4gICAgICBpdGVtLmdjKHN0b3JlLCB0cnVlKVxuICAgICAgaXRlbSA9IGl0ZW0ucmlnaHRcbiAgICB9XG4gICAgdGhpcy50eXBlLl9zdGFydCA9IG51bGxcbiAgICB0aGlzLnR5cGUuX21hcC5mb3JFYWNoKC8qKiBAcGFyYW0ge0l0ZW0gfCBudWxsfSBpdGVtICovIChpdGVtKSA9PiB7XG4gICAgICB3aGlsZSAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgICBpdGVtLmdjKHN0b3JlLCB0cnVlKVxuICAgICAgICBpdGVtID0gaXRlbS5sZWZ0XG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLnR5cGUuX21hcCA9IG5ldyBNYXAoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICB0aGlzLnR5cGUuX3dyaXRlKGVuY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICByZXR1cm4gN1xuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudFR5cGV9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkQ29udGVudFR5cGUgPSBkZWNvZGVyID0+IG5ldyBDb250ZW50VHlwZSh0eXBlUmVmc1tkZWNvZGVyLnJlYWRUeXBlUmVmKCldKGRlY29kZXIpKVxuIiwgImltcG9ydCB7XG4gIEdDLFxuICBnZXRTdGF0ZSxcbiAgQWJzdHJhY3RTdHJ1Y3QsXG4gIHJlcGxhY2VTdHJ1Y3QsXG4gIGFkZFN0cnVjdCxcbiAgYWRkVG9EZWxldGVTZXQsXG4gIGZpbmRSb290VHlwZUtleSxcbiAgY29tcGFyZUlEcyxcbiAgZ2V0SXRlbSxcbiAgZ2V0SXRlbUNsZWFuRW5kLFxuICBnZXRJdGVtQ2xlYW5TdGFydCxcbiAgcmVhZENvbnRlbnREZWxldGVkLFxuICByZWFkQ29udGVudEJpbmFyeSxcbiAgcmVhZENvbnRlbnRKU09OLFxuICByZWFkQ29udGVudEFueSxcbiAgcmVhZENvbnRlbnRTdHJpbmcsXG4gIHJlYWRDb250ZW50RW1iZWQsXG4gIHJlYWRDb250ZW50RG9jLFxuICBjcmVhdGVJRCxcbiAgcmVhZENvbnRlbnRGb3JtYXQsXG4gIHJlYWRDb250ZW50VHlwZSxcbiAgYWRkQ2hhbmdlZFR5cGVUb1RyYW5zYWN0aW9uLFxuICBpc0RlbGV0ZWQsXG4gIFN0YWNrSXRlbSwgRGVsZXRlU2V0LCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIENvbnRlbnRUeXBlLCBDb250ZW50RGVsZXRlZCwgU3RydWN0U3RvcmUsIElELCBBYnN0cmFjdFR5cGUsIFRyYW5zYWN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuaW1wb3J0ICogYXMgYmluYXJ5IGZyb20gJ2xpYjAvYmluYXJ5J1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnbGliMC9hcnJheSdcblxuLyoqXG4gKiBAdG9kbyBUaGlzIHNob3VsZCByZXR1cm4gc2V2ZXJhbCBpdGVtc1xuICpcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge0lEfSBpZFxuICogQHJldHVybiB7e2l0ZW06SXRlbSwgZGlmZjpudW1iZXJ9fVxuICovXG5leHBvcnQgY29uc3QgZm9sbG93UmVkb25lID0gKHN0b3JlLCBpZCkgPT4ge1xuICAvKipcbiAgICogQHR5cGUge0lEfG51bGx9XG4gICAqL1xuICBsZXQgbmV4dElEID0gaWRcbiAgbGV0IGRpZmYgPSAwXG4gIGxldCBpdGVtXG4gIGRvIHtcbiAgICBpZiAoZGlmZiA+IDApIHtcbiAgICAgIG5leHRJRCA9IGNyZWF0ZUlEKG5leHRJRC5jbGllbnQsIG5leHRJRC5jbG9jayArIGRpZmYpXG4gICAgfVxuICAgIGl0ZW0gPSBnZXRJdGVtKHN0b3JlLCBuZXh0SUQpXG4gICAgZGlmZiA9IG5leHRJRC5jbG9jayAtIGl0ZW0uaWQuY2xvY2tcbiAgICBuZXh0SUQgPSBpdGVtLnJlZG9uZVxuICB9IHdoaWxlIChuZXh0SUQgIT09IG51bGwgJiYgaXRlbSBpbnN0YW5jZW9mIEl0ZW0pXG4gIHJldHVybiB7XG4gICAgaXRlbSwgZGlmZlxuICB9XG59XG5cbi8qKlxuICogTWFrZSBzdXJlIHRoYXQgbmVpdGhlciBpdGVtIG5vciBhbnkgb2YgaXRzIHBhcmVudHMgaXMgZXZlciBkZWxldGVkLlxuICpcbiAqIFRoaXMgcHJvcGVydHkgZG9lcyBub3QgcGVyc2lzdCB3aGVuIHN0b3JpbmcgaXQgaW50byBhIGRhdGFiYXNlIG9yIHdoZW5cbiAqIHNlbmRpbmcgaXQgdG8gb3RoZXIgcGVlcnNcbiAqXG4gKiBAcGFyYW0ge0l0ZW18bnVsbH0gaXRlbVxuICogQHBhcmFtIHtib29sZWFufSBrZWVwXG4gKi9cbmV4cG9ydCBjb25zdCBrZWVwSXRlbSA9IChpdGVtLCBrZWVwKSA9PiB7XG4gIHdoaWxlIChpdGVtICE9PSBudWxsICYmIGl0ZW0ua2VlcCAhPT0ga2VlcCkge1xuICAgIGl0ZW0ua2VlcCA9IGtlZXBcbiAgICBpdGVtID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKGl0ZW0ucGFyZW50KS5faXRlbVxuICB9XG59XG5cbi8qKlxuICogU3BsaXQgbGVmdEl0ZW0gaW50byB0d28gaXRlbXNcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0l0ZW19IGxlZnRJdGVtXG4gKiBAcGFyYW0ge251bWJlcn0gZGlmZlxuICogQHJldHVybiB7SXRlbX1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBzcGxpdEl0ZW0gPSAodHJhbnNhY3Rpb24sIGxlZnRJdGVtLCBkaWZmKSA9PiB7XG4gIC8vIGNyZWF0ZSByaWdodEl0ZW1cbiAgY29uc3QgeyBjbGllbnQsIGNsb2NrIH0gPSBsZWZ0SXRlbS5pZFxuICBjb25zdCByaWdodEl0ZW0gPSBuZXcgSXRlbShcbiAgICBjcmVhdGVJRChjbGllbnQsIGNsb2NrICsgZGlmZiksXG4gICAgbGVmdEl0ZW0sXG4gICAgY3JlYXRlSUQoY2xpZW50LCBjbG9jayArIGRpZmYgLSAxKSxcbiAgICBsZWZ0SXRlbS5yaWdodCxcbiAgICBsZWZ0SXRlbS5yaWdodE9yaWdpbixcbiAgICBsZWZ0SXRlbS5wYXJlbnQsXG4gICAgbGVmdEl0ZW0ucGFyZW50U3ViLFxuICAgIGxlZnRJdGVtLmNvbnRlbnQuc3BsaWNlKGRpZmYpXG4gIClcbiAgaWYgKGxlZnRJdGVtLmRlbGV0ZWQpIHtcbiAgICByaWdodEl0ZW0ubWFya0RlbGV0ZWQoKVxuICB9XG4gIGlmIChsZWZ0SXRlbS5rZWVwKSB7XG4gICAgcmlnaHRJdGVtLmtlZXAgPSB0cnVlXG4gIH1cbiAgaWYgKGxlZnRJdGVtLnJlZG9uZSAhPT0gbnVsbCkge1xuICAgIHJpZ2h0SXRlbS5yZWRvbmUgPSBjcmVhdGVJRChsZWZ0SXRlbS5yZWRvbmUuY2xpZW50LCBsZWZ0SXRlbS5yZWRvbmUuY2xvY2sgKyBkaWZmKVxuICB9XG4gIC8vIHVwZGF0ZSBsZWZ0IChkbyBub3Qgc2V0IGxlZnRJdGVtLnJpZ2h0T3JpZ2luIGFzIGl0IHdpbGwgbGVhZCB0byBwcm9ibGVtcyB3aGVuIHN5bmNpbmcpXG4gIGxlZnRJdGVtLnJpZ2h0ID0gcmlnaHRJdGVtXG4gIC8vIHVwZGF0ZSByaWdodFxuICBpZiAocmlnaHRJdGVtLnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgcmlnaHRJdGVtLnJpZ2h0LmxlZnQgPSByaWdodEl0ZW1cbiAgfVxuICAvLyByaWdodCBpcyBtb3JlIHNwZWNpZmljLlxuICB0cmFuc2FjdGlvbi5fbWVyZ2VTdHJ1Y3RzLnB1c2gocmlnaHRJdGVtKVxuICAvLyB1cGRhdGUgcGFyZW50Ll9tYXBcbiAgaWYgKHJpZ2h0SXRlbS5wYXJlbnRTdWIgIT09IG51bGwgJiYgcmlnaHRJdGVtLnJpZ2h0ID09PSBudWxsKSB7XG4gICAgLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHJpZ2h0SXRlbS5wYXJlbnQpLl9tYXAuc2V0KHJpZ2h0SXRlbS5wYXJlbnRTdWIsIHJpZ2h0SXRlbSlcbiAgfVxuICBsZWZ0SXRlbS5sZW5ndGggPSBkaWZmXG4gIHJldHVybiByaWdodEl0ZW1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PFN0YWNrSXRlbT59IHN0YWNrXG4gKiBAcGFyYW0ge0lEfSBpZFxuICovXG5jb25zdCBpc0RlbGV0ZWRCeVVuZG9TdGFjayA9IChzdGFjaywgaWQpID0+IGFycmF5LnNvbWUoc3RhY2ssIC8qKiBAcGFyYW0ge1N0YWNrSXRlbX0gcyAqLyBzID0+IGlzRGVsZXRlZChzLmRlbGV0aW9ucywgaWQpKVxuXG4vKipcbiAqIFJlZG9lcyB0aGUgZWZmZWN0IG9mIHRoaXMgb3BlcmF0aW9uLlxuICpcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uIFRoZSBZanMgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAqIEBwYXJhbSB7U2V0PEl0ZW0+fSByZWRvaXRlbXNcbiAqIEBwYXJhbSB7RGVsZXRlU2V0fSBpdGVtc1RvRGVsZXRlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlnbm9yZVJlbW90ZU1hcENoYW5nZXNcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi91dGlscy9VbmRvTWFuYWdlci5qcycpLlVuZG9NYW5hZ2VyfSB1bVxuICpcbiAqIEByZXR1cm4ge0l0ZW18bnVsbH1cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3QgcmVkb0l0ZW0gPSAodHJhbnNhY3Rpb24sIGl0ZW0sIHJlZG9pdGVtcywgaXRlbXNUb0RlbGV0ZSwgaWdub3JlUmVtb3RlTWFwQ2hhbmdlcywgdW0pID0+IHtcbiAgY29uc3QgZG9jID0gdHJhbnNhY3Rpb24uZG9jXG4gIGNvbnN0IHN0b3JlID0gZG9jLnN0b3JlXG4gIGNvbnN0IG93bkNsaWVudElEID0gZG9jLmNsaWVudElEXG4gIGNvbnN0IHJlZG9uZSA9IGl0ZW0ucmVkb25lXG4gIGlmIChyZWRvbmUgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIHJlZG9uZSlcbiAgfVxuICBsZXQgcGFyZW50SXRlbSA9IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChpdGVtLnBhcmVudCkuX2l0ZW1cbiAgLyoqXG4gICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAqL1xuICBsZXQgbGVmdCA9IG51bGxcbiAgLyoqXG4gICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAqL1xuICBsZXQgcmlnaHRcbiAgLy8gbWFrZSBzdXJlIHRoYXQgcGFyZW50IGlzIHJlZG9uZVxuICBpZiAocGFyZW50SXRlbSAhPT0gbnVsbCAmJiBwYXJlbnRJdGVtLmRlbGV0ZWQgPT09IHRydWUpIHtcbiAgICAvLyB0cnkgdG8gdW5kbyBwYXJlbnQgaWYgaXQgd2lsbCBiZSB1bmRvbmUgYW55d2F5XG4gICAgaWYgKHBhcmVudEl0ZW0ucmVkb25lID09PSBudWxsICYmICghcmVkb2l0ZW1zLmhhcyhwYXJlbnRJdGVtKSB8fCByZWRvSXRlbSh0cmFuc2FjdGlvbiwgcGFyZW50SXRlbSwgcmVkb2l0ZW1zLCBpdGVtc1RvRGVsZXRlLCBpZ25vcmVSZW1vdGVNYXBDaGFuZ2VzLCB1bSkgPT09IG51bGwpKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICB3aGlsZSAocGFyZW50SXRlbS5yZWRvbmUgIT09IG51bGwpIHtcbiAgICAgIHBhcmVudEl0ZW0gPSBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgcGFyZW50SXRlbS5yZWRvbmUpXG4gICAgfVxuICB9XG4gIGNvbnN0IHBhcmVudFR5cGUgPSBwYXJlbnRJdGVtID09PSBudWxsID8gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKGl0ZW0ucGFyZW50KSA6IC8qKiBAdHlwZSB7Q29udGVudFR5cGV9ICovIChwYXJlbnRJdGVtLmNvbnRlbnQpLnR5cGVcblxuICBpZiAoaXRlbS5wYXJlbnRTdWIgPT09IG51bGwpIHtcbiAgICAvLyBJcyBhbiBhcnJheSBpdGVtLiBJbnNlcnQgYXQgdGhlIG9sZCBwb3NpdGlvblxuICAgIGxlZnQgPSBpdGVtLmxlZnRcbiAgICByaWdodCA9IGl0ZW1cbiAgICAvLyBmaW5kIG5leHQgY2xvbmVkX3JlZG8gaXRlbXNcbiAgICB3aGlsZSAobGVmdCAhPT0gbnVsbCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgICAgICovXG4gICAgICBsZXQgbGVmdFRyYWNlID0gbGVmdFxuICAgICAgLy8gdHJhY2UgcmVkb25lIHVudGlsIHBhcmVudCBtYXRjaGVzXG4gICAgICB3aGlsZSAobGVmdFRyYWNlICE9PSBudWxsICYmIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChsZWZ0VHJhY2UucGFyZW50KS5faXRlbSAhPT0gcGFyZW50SXRlbSkge1xuICAgICAgICBsZWZ0VHJhY2UgPSBsZWZ0VHJhY2UucmVkb25lID09PSBudWxsID8gbnVsbCA6IGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBsZWZ0VHJhY2UucmVkb25lKVxuICAgICAgfVxuICAgICAgaWYgKGxlZnRUcmFjZSAhPT0gbnVsbCAmJiAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAobGVmdFRyYWNlLnBhcmVudCkuX2l0ZW0gPT09IHBhcmVudEl0ZW0pIHtcbiAgICAgICAgbGVmdCA9IGxlZnRUcmFjZVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgbGVmdCA9IGxlZnQubGVmdFxuICAgIH1cbiAgICB3aGlsZSAocmlnaHQgIT09IG51bGwpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICAgICAqL1xuICAgICAgbGV0IHJpZ2h0VHJhY2UgPSByaWdodFxuICAgICAgLy8gdHJhY2UgcmVkb25lIHVudGlsIHBhcmVudCBtYXRjaGVzXG4gICAgICB3aGlsZSAocmlnaHRUcmFjZSAhPT0gbnVsbCAmJiAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAocmlnaHRUcmFjZS5wYXJlbnQpLl9pdGVtICE9PSBwYXJlbnRJdGVtKSB7XG4gICAgICAgIHJpZ2h0VHJhY2UgPSByaWdodFRyYWNlLnJlZG9uZSA9PT0gbnVsbCA/IG51bGwgOiBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgcmlnaHRUcmFjZS5yZWRvbmUpXG4gICAgICB9XG4gICAgICBpZiAocmlnaHRUcmFjZSAhPT0gbnVsbCAmJiAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAocmlnaHRUcmFjZS5wYXJlbnQpLl9pdGVtID09PSBwYXJlbnRJdGVtKSB7XG4gICAgICAgIHJpZ2h0ID0gcmlnaHRUcmFjZVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgcmlnaHQgPSByaWdodC5yaWdodFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByaWdodCA9IG51bGxcbiAgICBpZiAoaXRlbS5yaWdodCAmJiAhaWdub3JlUmVtb3RlTWFwQ2hhbmdlcykge1xuICAgICAgbGVmdCA9IGl0ZW1cbiAgICAgIC8vIEl0ZXJhdGUgcmlnaHQgd2hpbGUgcmlnaHQgaXMgaW4gaXRlbXNUb0RlbGV0ZVxuICAgICAgLy8gSWYgaXQgaXMgaW50ZW5kZWQgdG8gZGVsZXRlIHJpZ2h0IHdoaWxlIGl0ZW0gaXMgcmVkb25lLCB3ZSBjYW4gZXhwZWN0IHRoYXQgaXRlbSBzaG91bGQgcmVwbGFjZSByaWdodC5cbiAgICAgIHdoaWxlIChsZWZ0ICE9PSBudWxsICYmIGxlZnQucmlnaHQgIT09IG51bGwgJiYgKGxlZnQucmlnaHQucmVkb25lIHx8IGlzRGVsZXRlZChpdGVtc1RvRGVsZXRlLCBsZWZ0LnJpZ2h0LmlkKSB8fCBpc0RlbGV0ZWRCeVVuZG9TdGFjayh1bS51bmRvU3RhY2ssIGxlZnQucmlnaHQuaWQpIHx8IGlzRGVsZXRlZEJ5VW5kb1N0YWNrKHVtLnJlZG9TdGFjaywgbGVmdC5yaWdodC5pZCkpKSB7XG4gICAgICAgIGxlZnQgPSBsZWZ0LnJpZ2h0XG4gICAgICAgIC8vIGZvbGxvdyByZWRvbmVcbiAgICAgICAgd2hpbGUgKGxlZnQucmVkb25lKSBsZWZ0ID0gZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGxlZnQucmVkb25lKVxuICAgICAgfVxuICAgICAgaWYgKGxlZnQgJiYgbGVmdC5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAvLyBJdCBpcyBub3QgcG9zc2libGUgdG8gcmVkbyB0aGlzIGl0ZW0gYmVjYXVzZSBpdCBjb25mbGljdHMgd2l0aCBhXG4gICAgICAgIC8vIGNoYW5nZSBmcm9tIGFub3RoZXIgY2xpZW50XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxlZnQgPSBwYXJlbnRUeXBlLl9tYXAuZ2V0KGl0ZW0ucGFyZW50U3ViKSB8fCBudWxsXG4gICAgfVxuICB9XG4gIGNvbnN0IG5leHRDbG9jayA9IGdldFN0YXRlKHN0b3JlLCBvd25DbGllbnRJRClcbiAgY29uc3QgbmV4dElkID0gY3JlYXRlSUQob3duQ2xpZW50SUQsIG5leHRDbG9jaylcbiAgY29uc3QgcmVkb25lSXRlbSA9IG5ldyBJdGVtKFxuICAgIG5leHRJZCxcbiAgICBsZWZ0LCBsZWZ0ICYmIGxlZnQubGFzdElkLFxuICAgIHJpZ2h0LCByaWdodCAmJiByaWdodC5pZCxcbiAgICBwYXJlbnRUeXBlLFxuICAgIGl0ZW0ucGFyZW50U3ViLFxuICAgIGl0ZW0uY29udGVudC5jb3B5KClcbiAgKVxuICBpdGVtLnJlZG9uZSA9IG5leHRJZFxuICBrZWVwSXRlbShyZWRvbmVJdGVtLCB0cnVlKVxuICByZWRvbmVJdGVtLmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgcmV0dXJuIHJlZG9uZUl0ZW1cbn1cblxuLyoqXG4gKiBBYnN0cmFjdCBjbGFzcyB0aGF0IHJlcHJlc2VudHMgYW55IGNvbnRlbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBJdGVtIGV4dGVuZHMgQWJzdHJhY3RTdHJ1Y3Qge1xuICAvKipcbiAgICogQHBhcmFtIHtJRH0gaWRcbiAgICogQHBhcmFtIHtJdGVtIHwgbnVsbH0gbGVmdFxuICAgKiBAcGFyYW0ge0lEIHwgbnVsbH0gb3JpZ2luXG4gICAqIEBwYXJhbSB7SXRlbSB8IG51bGx9IHJpZ2h0XG4gICAqIEBwYXJhbSB7SUQgfCBudWxsfSByaWdodE9yaWdpblxuICAgKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fElEfG51bGx9IHBhcmVudCBJcyBhIHR5cGUgaWYgaW50ZWdyYXRlZCwgaXMgbnVsbCBpZiBpdCBpcyBwb3NzaWJsZSB0byBjb3B5IHBhcmVudCBmcm9tIGxlZnQgb3IgcmlnaHQsIGlzIElEIGJlZm9yZSBpbnRlZ3JhdGlvbiB0byBzZWFyY2ggZm9yIGl0LlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IG51bGx9IHBhcmVudFN1YlxuICAgKiBAcGFyYW0ge0Fic3RyYWN0Q29udGVudH0gY29udGVudFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGlkLCBsZWZ0LCBvcmlnaW4sIHJpZ2h0LCByaWdodE9yaWdpbiwgcGFyZW50LCBwYXJlbnRTdWIsIGNvbnRlbnQpIHtcbiAgICBzdXBlcihpZCwgY29udGVudC5nZXRMZW5ndGgoKSlcbiAgICAvKipcbiAgICAgKiBUaGUgaXRlbSB0aGF0IHdhcyBvcmlnaW5hbGx5IHRvIHRoZSBsZWZ0IG9mIHRoaXMgaXRlbS5cbiAgICAgKiBAdHlwZSB7SUQgfCBudWxsfVxuICAgICAqL1xuICAgIHRoaXMub3JpZ2luID0gb3JpZ2luXG4gICAgLyoqXG4gICAgICogVGhlIGl0ZW0gdGhhdCBpcyBjdXJyZW50bHkgdG8gdGhlIGxlZnQgb2YgdGhpcyBpdGVtLlxuICAgICAqIEB0eXBlIHtJdGVtIHwgbnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLmxlZnQgPSBsZWZ0XG4gICAgLyoqXG4gICAgICogVGhlIGl0ZW0gdGhhdCBpcyBjdXJyZW50bHkgdG8gdGhlIHJpZ2h0IG9mIHRoaXMgaXRlbS5cbiAgICAgKiBAdHlwZSB7SXRlbSB8IG51bGx9XG4gICAgICovXG4gICAgdGhpcy5yaWdodCA9IHJpZ2h0XG4gICAgLyoqXG4gICAgICogVGhlIGl0ZW0gdGhhdCB3YXMgb3JpZ2luYWxseSB0byB0aGUgcmlnaHQgb2YgdGhpcyBpdGVtLlxuICAgICAqIEB0eXBlIHtJRCB8IG51bGx9XG4gICAgICovXG4gICAgdGhpcy5yaWdodE9yaWdpbiA9IHJpZ2h0T3JpZ2luXG4gICAgLyoqXG4gICAgICogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fElEfG51bGx9XG4gICAgICovXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbiAgICAvKipcbiAgICAgKiBJZiB0aGUgcGFyZW50IHJlZmVycyB0byB0aGlzIGl0ZW0gd2l0aCBzb21lIGtpbmQgb2Yga2V5IChlLmcuIFlNYXAsIHRoZVxuICAgICAqIGtleSBpcyBzcGVjaWZpZWQgaGVyZS4gVGhlIGtleSBpcyB0aGVuIHVzZWQgdG8gcmVmZXIgdG8gdGhlIGxpc3QgaW4gd2hpY2hcbiAgICAgKiB0byBpbnNlcnQgdGhpcyBpdGVtLiBJZiBgcGFyZW50U3ViID0gbnVsbGAgdHlwZS5fc3RhcnQgaXMgdGhlIGxpc3QgaW5cbiAgICAgKiB3aGljaCB0byBpbnNlcnQgdG8uIE90aGVyd2lzZSBpdCBpcyBgcGFyZW50Ll9tYXBgLlxuICAgICAqIEB0eXBlIHtTdHJpbmcgfCBudWxsfVxuICAgICAqL1xuICAgIHRoaXMucGFyZW50U3ViID0gcGFyZW50U3ViXG4gICAgLyoqXG4gICAgICogSWYgdGhpcyB0eXBlJ3MgZWZmZWN0IGlzIHJlZG9uZSB0aGlzIHR5cGUgcmVmZXJzIHRvIHRoZSB0eXBlIHRoYXQgdW5kaWRcbiAgICAgKiB0aGlzIG9wZXJhdGlvbi5cbiAgICAgKiBAdHlwZSB7SUQgfCBudWxsfVxuICAgICAqL1xuICAgIHRoaXMucmVkb25lID0gbnVsbFxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBYnN0cmFjdENvbnRlbnR9XG4gICAgICovXG4gICAgdGhpcy5jb250ZW50ID0gY29udGVudFxuICAgIC8qKlxuICAgICAqIGJpdDE6IGtlZXBcbiAgICAgKiBiaXQyOiBjb3VudGFibGVcbiAgICAgKiBiaXQzOiBkZWxldGVkXG4gICAgICogYml0NDogbWFyayAtIG1hcmsgbm9kZSBhcyBmYXN0LXNlYXJjaC1tYXJrZXJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfSBieXRlXG4gICAgICovXG4gICAgdGhpcy5pbmZvID0gdGhpcy5jb250ZW50LmlzQ291bnRhYmxlKCkgPyBiaW5hcnkuQklUMiA6IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gbWFyayB0aGUgaXRlbSBhcyBhbiBpbmRleGVkIGZhc3Qtc2VhcmNoIG1hcmtlclxuICAgKlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHNldCBtYXJrZXIgKGlzTWFya2VkKSB7XG4gICAgaWYgKCgodGhpcy5pbmZvICYgYmluYXJ5LkJJVDQpID4gMCkgIT09IGlzTWFya2VkKSB7XG4gICAgICB0aGlzLmluZm8gXj0gYmluYXJ5LkJJVDRcbiAgICB9XG4gIH1cblxuICBnZXQgbWFya2VyICgpIHtcbiAgICByZXR1cm4gKHRoaXMuaW5mbyAmIGJpbmFyeS5CSVQ0KSA+IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCBkbyBub3QgZ2FyYmFnZSBjb2xsZWN0IHRoaXMgSXRlbS5cbiAgICovXG4gIGdldCBrZWVwICgpIHtcbiAgICByZXR1cm4gKHRoaXMuaW5mbyAmIGJpbmFyeS5CSVQxKSA+IDBcbiAgfVxuXG4gIHNldCBrZWVwIChkb0tlZXApIHtcbiAgICBpZiAodGhpcy5rZWVwICE9PSBkb0tlZXApIHtcbiAgICAgIHRoaXMuaW5mbyBePSBiaW5hcnkuQklUMVxuICAgIH1cbiAgfVxuXG4gIGdldCBjb3VudGFibGUgKCkge1xuICAgIHJldHVybiAodGhpcy5pbmZvICYgYmluYXJ5LkJJVDIpID4gMFxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBpdGVtIHdhcyBkZWxldGVkIG9yIG5vdC5cbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICBnZXQgZGVsZXRlZCAoKSB7XG4gICAgcmV0dXJuICh0aGlzLmluZm8gJiBiaW5hcnkuQklUMykgPiAwXG4gIH1cblxuICBzZXQgZGVsZXRlZCAoZG9EZWxldGUpIHtcbiAgICBpZiAodGhpcy5kZWxldGVkICE9PSBkb0RlbGV0ZSkge1xuICAgICAgdGhpcy5pbmZvIF49IGJpbmFyeS5CSVQzXG4gICAgfVxuICB9XG5cbiAgbWFya0RlbGV0ZWQgKCkge1xuICAgIHRoaXMuaW5mbyB8PSBiaW5hcnkuQklUM1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgY3JlYXRvciBjbGllbnRJRCBvZiB0aGUgbWlzc2luZyBvcCBvciBkZWZpbmUgbWlzc2luZyBpdGVtcyBhbmQgcmV0dXJuIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqIEByZXR1cm4ge251bGwgfCBudW1iZXJ9XG4gICAqL1xuICBnZXRNaXNzaW5nICh0cmFuc2FjdGlvbiwgc3RvcmUpIHtcbiAgICBpZiAodGhpcy5vcmlnaW4gJiYgdGhpcy5vcmlnaW4uY2xpZW50ICE9PSB0aGlzLmlkLmNsaWVudCAmJiB0aGlzLm9yaWdpbi5jbG9jayA+PSBnZXRTdGF0ZShzdG9yZSwgdGhpcy5vcmlnaW4uY2xpZW50KSkge1xuICAgICAgcmV0dXJuIHRoaXMub3JpZ2luLmNsaWVudFxuICAgIH1cbiAgICBpZiAodGhpcy5yaWdodE9yaWdpbiAmJiB0aGlzLnJpZ2h0T3JpZ2luLmNsaWVudCAhPT0gdGhpcy5pZC5jbGllbnQgJiYgdGhpcy5yaWdodE9yaWdpbi5jbG9jayA+PSBnZXRTdGF0ZShzdG9yZSwgdGhpcy5yaWdodE9yaWdpbi5jbGllbnQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5yaWdodE9yaWdpbi5jbGllbnRcbiAgICB9XG4gICAgaWYgKHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50LmNvbnN0cnVjdG9yID09PSBJRCAmJiB0aGlzLmlkLmNsaWVudCAhPT0gdGhpcy5wYXJlbnQuY2xpZW50ICYmIHRoaXMucGFyZW50LmNsb2NrID49IGdldFN0YXRlKHN0b3JlLCB0aGlzLnBhcmVudC5jbGllbnQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQuY2xpZW50XG4gICAgfVxuXG4gICAgLy8gV2UgaGF2ZSBhbGwgbWlzc2luZyBpZHMsIG5vdyBmaW5kIHRoZSBpdGVtc1xuXG4gICAgaWYgKHRoaXMub3JpZ2luKSB7XG4gICAgICB0aGlzLmxlZnQgPSBnZXRJdGVtQ2xlYW5FbmQodHJhbnNhY3Rpb24sIHN0b3JlLCB0aGlzLm9yaWdpbilcbiAgICAgIHRoaXMub3JpZ2luID0gdGhpcy5sZWZ0Lmxhc3RJZFxuICAgIH1cbiAgICBpZiAodGhpcy5yaWdodE9yaWdpbikge1xuICAgICAgdGhpcy5yaWdodCA9IGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCB0aGlzLnJpZ2h0T3JpZ2luKVxuICAgICAgdGhpcy5yaWdodE9yaWdpbiA9IHRoaXMucmlnaHQuaWRcbiAgICB9XG4gICAgaWYgKCh0aGlzLmxlZnQgJiYgdGhpcy5sZWZ0LmNvbnN0cnVjdG9yID09PSBHQykgfHwgKHRoaXMucmlnaHQgJiYgdGhpcy5yaWdodC5jb25zdHJ1Y3RvciA9PT0gR0MpKSB7XG4gICAgICB0aGlzLnBhcmVudCA9IG51bGxcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnBhcmVudCkge1xuICAgICAgLy8gb25seSBzZXQgcGFyZW50IGlmIHRoaXMgc2hvdWxkbid0IGJlIGdhcmJhZ2UgY29sbGVjdGVkXG4gICAgICBpZiAodGhpcy5sZWZ0ICYmIHRoaXMubGVmdC5jb25zdHJ1Y3RvciA9PT0gSXRlbSkge1xuICAgICAgICB0aGlzLnBhcmVudCA9IHRoaXMubGVmdC5wYXJlbnRcbiAgICAgICAgdGhpcy5wYXJlbnRTdWIgPSB0aGlzLmxlZnQucGFyZW50U3ViXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5yaWdodCAmJiB0aGlzLnJpZ2h0LmNvbnN0cnVjdG9yID09PSBJdGVtKSB7XG4gICAgICAgIHRoaXMucGFyZW50ID0gdGhpcy5yaWdodC5wYXJlbnRcbiAgICAgICAgdGhpcy5wYXJlbnRTdWIgPSB0aGlzLnJpZ2h0LnBhcmVudFN1YlxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5wYXJlbnQuY29uc3RydWN0b3IgPT09IElEKSB7XG4gICAgICBjb25zdCBwYXJlbnRJdGVtID0gZ2V0SXRlbShzdG9yZSwgdGhpcy5wYXJlbnQpXG4gICAgICBpZiAocGFyZW50SXRlbS5jb25zdHJ1Y3RvciA9PT0gR0MpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBudWxsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBhcmVudCA9IC8qKiBAdHlwZSB7Q29udGVudFR5cGV9ICovIChwYXJlbnRJdGVtLmNvbnRlbnQpLnR5cGVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBvZmZzZXQpIHtcbiAgICBpZiAob2Zmc2V0ID4gMCkge1xuICAgICAgdGhpcy5pZC5jbG9jayArPSBvZmZzZXRcbiAgICAgIHRoaXMubGVmdCA9IGdldEl0ZW1DbGVhbkVuZCh0cmFuc2FjdGlvbiwgdHJhbnNhY3Rpb24uZG9jLnN0b3JlLCBjcmVhdGVJRCh0aGlzLmlkLmNsaWVudCwgdGhpcy5pZC5jbG9jayAtIDEpKVxuICAgICAgdGhpcy5vcmlnaW4gPSB0aGlzLmxlZnQubGFzdElkXG4gICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLmNvbnRlbnQuc3BsaWNlKG9mZnNldClcbiAgICAgIHRoaXMubGVuZ3RoIC09IG9mZnNldFxuICAgIH1cblxuICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgaWYgKCghdGhpcy5sZWZ0ICYmICghdGhpcy5yaWdodCB8fCB0aGlzLnJpZ2h0LmxlZnQgIT09IG51bGwpKSB8fCAodGhpcy5sZWZ0ICYmIHRoaXMubGVmdC5yaWdodCAhPT0gdGhpcy5yaWdodCkpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgbGVmdCA9IHRoaXMubGVmdFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IG9cbiAgICAgICAgLy8gc2V0IG8gdG8gdGhlIGZpcnN0IGNvbmZsaWN0aW5nIGl0ZW1cbiAgICAgICAgaWYgKGxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgICBvID0gbGVmdC5yaWdodFxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucGFyZW50U3ViICE9PSBudWxsKSB7XG4gICAgICAgICAgbyA9IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0aGlzLnBhcmVudCkuX21hcC5nZXQodGhpcy5wYXJlbnRTdWIpIHx8IG51bGxcbiAgICAgICAgICB3aGlsZSAobyAhPT0gbnVsbCAmJiBvLmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIG8gPSBvLmxlZnRcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbyA9IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0aGlzLnBhcmVudCkuX3N0YXJ0XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogdXNlIHNvbWV0aGluZyBsaWtlIERlbGV0ZVNldCBoZXJlIChhIHRyZWUgaW1wbGVtZW50YXRpb24gd291bGQgYmUgYmVzdClcbiAgICAgICAgLy8gQHRvZG8gdXNlIGdsb2JhbCBzZXQgZGVmaW5pdGlvbnNcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtTZXQ8SXRlbT59XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBjb25mbGljdGluZ0l0ZW1zID0gbmV3IFNldCgpXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U2V0PEl0ZW0+fVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgaXRlbXNCZWZvcmVPcmlnaW4gPSBuZXcgU2V0KClcbiAgICAgICAgLy8gTGV0IGMgaW4gY29uZmxpY3RpbmdJdGVtcywgYiBpbiBpdGVtc0JlZm9yZU9yaWdpblxuICAgICAgICAvLyAqKip7b3JpZ2lufWJiYmJ7dGhpc317YyxifXtjLGJ9e299KioqXG4gICAgICAgIC8vIE5vdGUgdGhhdCBjb25mbGljdGluZ0l0ZW1zIGlzIGEgc3Vic2V0IG9mIGl0ZW1zQmVmb3JlT3JpZ2luXG4gICAgICAgIHdoaWxlIChvICE9PSBudWxsICYmIG8gIT09IHRoaXMucmlnaHQpIHtcbiAgICAgICAgICBpdGVtc0JlZm9yZU9yaWdpbi5hZGQobylcbiAgICAgICAgICBjb25mbGljdGluZ0l0ZW1zLmFkZChvKVxuICAgICAgICAgIGlmIChjb21wYXJlSURzKHRoaXMub3JpZ2luLCBvLm9yaWdpbikpIHtcbiAgICAgICAgICAgIC8vIGNhc2UgMVxuICAgICAgICAgICAgaWYgKG8uaWQuY2xpZW50IDwgdGhpcy5pZC5jbGllbnQpIHtcbiAgICAgICAgICAgICAgbGVmdCA9IG9cbiAgICAgICAgICAgICAgY29uZmxpY3RpbmdJdGVtcy5jbGVhcigpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbXBhcmVJRHModGhpcy5yaWdodE9yaWdpbiwgby5yaWdodE9yaWdpbikpIHtcbiAgICAgICAgICAgICAgLy8gdGhpcyBhbmQgbyBhcmUgY29uZmxpY3RpbmcgYW5kIHBvaW50IHRvIHRoZSBzYW1lIGludGVncmF0aW9uIHBvaW50cy4gVGhlIGlkIGRlY2lkZXMgd2hpY2ggaXRlbSBjb21lcyBmaXJzdC5cbiAgICAgICAgICAgICAgLy8gU2luY2UgdGhpcyBpcyB0byB0aGUgbGVmdCBvZiBvLCB3ZSBjYW4gYnJlYWsgaGVyZVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfSAvLyBlbHNlLCBvIG1pZ2h0IGJlIGludGVncmF0ZWQgYmVmb3JlIGFuIGl0ZW0gdGhhdCB0aGlzIGNvbmZsaWN0cyB3aXRoLiBJZiBzbywgd2Ugd2lsbCBmaW5kIGl0IGluIHRoZSBuZXh0IGl0ZXJhdGlvbnNcbiAgICAgICAgICB9IGVsc2UgaWYgKG8ub3JpZ2luICE9PSBudWxsICYmIGl0ZW1zQmVmb3JlT3JpZ2luLmhhcyhnZXRJdGVtKHRyYW5zYWN0aW9uLmRvYy5zdG9yZSwgby5vcmlnaW4pKSkgeyAvLyB1c2UgZ2V0SXRlbSBpbnN0ZWFkIG9mIGdldEl0ZW1DbGVhbkVuZCBiZWNhdXNlIHdlIGRvbid0IHdhbnQgLyBuZWVkIHRvIHNwbGl0IGl0ZW1zLlxuICAgICAgICAgICAgLy8gY2FzZSAyXG4gICAgICAgICAgICBpZiAoIWNvbmZsaWN0aW5nSXRlbXMuaGFzKGdldEl0ZW0odHJhbnNhY3Rpb24uZG9jLnN0b3JlLCBvLm9yaWdpbikpKSB7XG4gICAgICAgICAgICAgIGxlZnQgPSBvXG4gICAgICAgICAgICAgIGNvbmZsaWN0aW5nSXRlbXMuY2xlYXIoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBvID0gby5yaWdodFxuICAgICAgICB9XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnRcbiAgICAgIH1cbiAgICAgIC8vIHJlY29ubmVjdCBsZWZ0L3JpZ2h0ICsgdXBkYXRlIHBhcmVudCBtYXAvc3RhcnQgaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAodGhpcy5sZWZ0ICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5sZWZ0LnJpZ2h0XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodFxuICAgICAgICB0aGlzLmxlZnQucmlnaHQgPSB0aGlzXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgclxuICAgICAgICBpZiAodGhpcy5wYXJlbnRTdWIgIT09IG51bGwpIHtcbiAgICAgICAgICByID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5fbWFwLmdldCh0aGlzLnBhcmVudFN1YikgfHwgbnVsbFxuICAgICAgICAgIHdoaWxlIChyICE9PSBudWxsICYmIHIubGVmdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgciA9IHIubGVmdFxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5fc3RhcnRcbiAgICAgICAgICA7LyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5fc3RhcnQgPSB0aGlzXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yaWdodCA9IHJcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMucmlnaHQubGVmdCA9IHRoaXNcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5wYXJlbnRTdWIgIT09IG51bGwpIHtcbiAgICAgICAgLy8gc2V0IGFzIGN1cnJlbnQgcGFyZW50IHZhbHVlIGlmIHJpZ2h0ID09PSBudWxsIGFuZCB0aGlzIGlzIHBhcmVudFN1YlxuICAgICAgICAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLl9tYXAuc2V0KHRoaXMucGFyZW50U3ViLCB0aGlzKVxuICAgICAgICBpZiAodGhpcy5sZWZ0ICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gdGhpcyBpcyB0aGUgY3VycmVudCBhdHRyaWJ1dGUgdmFsdWUgb2YgcGFyZW50LiBkZWxldGUgcmlnaHRcbiAgICAgICAgICB0aGlzLmxlZnQuZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBhZGp1c3QgbGVuZ3RoIG9mIHBhcmVudFxuICAgICAgaWYgKHRoaXMucGFyZW50U3ViID09PSBudWxsICYmIHRoaXMuY291bnRhYmxlICYmICF0aGlzLmRlbGV0ZWQpIHtcbiAgICAgICAgLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5fbGVuZ3RoICs9IHRoaXMubGVuZ3RoXG4gICAgICB9XG4gICAgICBhZGRTdHJ1Y3QodHJhbnNhY3Rpb24uZG9jLnN0b3JlLCB0aGlzKVxuICAgICAgdGhpcy5jb250ZW50LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgdGhpcylcbiAgICAgIC8vIGFkZCBwYXJlbnQgdG8gdHJhbnNhY3Rpb24uY2hhbmdlZFxuICAgICAgYWRkQ2hhbmdlZFR5cGVUb1RyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLCB0aGlzLnBhcmVudFN1YilcbiAgICAgIGlmICgoLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5faXRlbSAhPT0gbnVsbCAmJiAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLl9pdGVtLmRlbGV0ZWQpIHx8ICh0aGlzLnBhcmVudFN1YiAhPT0gbnVsbCAmJiB0aGlzLnJpZ2h0ICE9PSBudWxsKSkge1xuICAgICAgICAvLyBkZWxldGUgaWYgcGFyZW50IGlzIGRlbGV0ZWQgb3IgaWYgdGhpcyBpcyBub3QgdGhlIGN1cnJlbnQgYXR0cmlidXRlIHZhbHVlIG9mIHBhcmVudFxuICAgICAgICB0aGlzLmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcGFyZW50IGlzIG5vdCBkZWZpbmVkLiBJbnRlZ3JhdGUgR0Mgc3RydWN0IGluc3RlYWRcbiAgICAgIG5ldyBHQyh0aGlzLmlkLCB0aGlzLmxlbmd0aCkuaW50ZWdyYXRlKHRyYW5zYWN0aW9uLCAwKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBuZXh0IG5vbi1kZWxldGVkIGl0ZW1cbiAgICovXG4gIGdldCBuZXh0ICgpIHtcbiAgICBsZXQgbiA9IHRoaXMucmlnaHRcbiAgICB3aGlsZSAobiAhPT0gbnVsbCAmJiBuLmRlbGV0ZWQpIHtcbiAgICAgIG4gPSBuLnJpZ2h0XG4gICAgfVxuICAgIHJldHVybiBuXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJldmlvdXMgbm9uLWRlbGV0ZWQgaXRlbVxuICAgKi9cbiAgZ2V0IHByZXYgKCkge1xuICAgIGxldCBuID0gdGhpcy5sZWZ0XG4gICAgd2hpbGUgKG4gIT09IG51bGwgJiYgbi5kZWxldGVkKSB7XG4gICAgICBuID0gbi5sZWZ0XG4gICAgfVxuICAgIHJldHVybiBuXG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZXMgdGhlIGxhc3QgY29udGVudCBhZGRyZXNzIG9mIHRoaXMgSXRlbS5cbiAgICovXG4gIGdldCBsYXN0SWQgKCkge1xuICAgIC8vIGFsbG9jYXRpbmcgaWRzIGlzIHByZXR0eSBjb3N0bHkgYmVjYXVzZSBvZiB0aGUgYW1vdW50IG9mIGlkcyBjcmVhdGVkLCBzbyB3ZSB0cnkgdG8gcmV1c2Ugd2hlbmV2ZXIgcG9zc2libGVcbiAgICByZXR1cm4gdGhpcy5sZW5ndGggPT09IDEgPyB0aGlzLmlkIDogY3JlYXRlSUQodGhpcy5pZC5jbGllbnQsIHRoaXMuaWQuY2xvY2sgKyB0aGlzLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIG1lcmdlIHR3byBpdGVtc1xuICAgKlxuICAgKiBAcGFyYW0ge0l0ZW19IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5jb25zdHJ1Y3RvciA9PT0gcmlnaHQuY29uc3RydWN0b3IgJiZcbiAgICAgIGNvbXBhcmVJRHMocmlnaHQub3JpZ2luLCB0aGlzLmxhc3RJZCkgJiZcbiAgICAgIHRoaXMucmlnaHQgPT09IHJpZ2h0ICYmXG4gICAgICBjb21wYXJlSURzKHRoaXMucmlnaHRPcmlnaW4sIHJpZ2h0LnJpZ2h0T3JpZ2luKSAmJlxuICAgICAgdGhpcy5pZC5jbGllbnQgPT09IHJpZ2h0LmlkLmNsaWVudCAmJlxuICAgICAgdGhpcy5pZC5jbG9jayArIHRoaXMubGVuZ3RoID09PSByaWdodC5pZC5jbG9jayAmJlxuICAgICAgdGhpcy5kZWxldGVkID09PSByaWdodC5kZWxldGVkICYmXG4gICAgICB0aGlzLnJlZG9uZSA9PT0gbnVsbCAmJlxuICAgICAgcmlnaHQucmVkb25lID09PSBudWxsICYmXG4gICAgICB0aGlzLmNvbnRlbnQuY29uc3RydWN0b3IgPT09IHJpZ2h0LmNvbnRlbnQuY29uc3RydWN0b3IgJiZcbiAgICAgIHRoaXMuY29udGVudC5tZXJnZVdpdGgocmlnaHQuY29udGVudClcbiAgICApIHtcbiAgICAgIGNvbnN0IHNlYXJjaE1hcmtlciA9IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0aGlzLnBhcmVudCkuX3NlYXJjaE1hcmtlclxuICAgICAgaWYgKHNlYXJjaE1hcmtlcikge1xuICAgICAgICBzZWFyY2hNYXJrZXIuZm9yRWFjaChtYXJrZXIgPT4ge1xuICAgICAgICAgIGlmIChtYXJrZXIucCA9PT0gcmlnaHQpIHtcbiAgICAgICAgICAgIC8vIHJpZ2h0IGlzIGdvaW5nIHRvIGJlIFwiZm9yZ290dGVuXCIgc28gd2UgbmVlZCB0byB1cGRhdGUgdGhlIG1hcmtlclxuICAgICAgICAgICAgbWFya2VyLnAgPSB0aGlzXG4gICAgICAgICAgICAvLyBhZGp1c3QgbWFya2VyIGluZGV4XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGVsZXRlZCAmJiB0aGlzLmNvdW50YWJsZSkge1xuICAgICAgICAgICAgICBtYXJrZXIuaW5kZXggLT0gdGhpcy5sZW5ndGhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAocmlnaHQua2VlcCkge1xuICAgICAgICB0aGlzLmtlZXAgPSB0cnVlXG4gICAgICB9XG4gICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQucmlnaHRcbiAgICAgIGlmICh0aGlzLnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMucmlnaHQubGVmdCA9IHRoaXNcbiAgICAgIH1cbiAgICAgIHRoaXMubGVuZ3RoICs9IHJpZ2h0Lmxlbmd0aFxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogTWFyayB0aGlzIEl0ZW0gYXMgZGVsZXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHtcbiAgICBpZiAoIXRoaXMuZGVsZXRlZCkge1xuICAgICAgY29uc3QgcGFyZW50ID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KVxuICAgICAgLy8gYWRqdXN0IHRoZSBsZW5ndGggb2YgcGFyZW50XG4gICAgICBpZiAodGhpcy5jb3VudGFibGUgJiYgdGhpcy5wYXJlbnRTdWIgPT09IG51bGwpIHtcbiAgICAgICAgcGFyZW50Ll9sZW5ndGggLT0gdGhpcy5sZW5ndGhcbiAgICAgIH1cbiAgICAgIHRoaXMubWFya0RlbGV0ZWQoKVxuICAgICAgYWRkVG9EZWxldGVTZXQodHJhbnNhY3Rpb24uZGVsZXRlU2V0LCB0aGlzLmlkLmNsaWVudCwgdGhpcy5pZC5jbG9jaywgdGhpcy5sZW5ndGgpXG4gICAgICBhZGRDaGFuZ2VkVHlwZVRvVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHBhcmVudCwgdGhpcy5wYXJlbnRTdWIpXG4gICAgICB0aGlzLmNvbnRlbnQuZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHBhcmVudEdDZFxuICAgKi9cbiAgZ2MgKHN0b3JlLCBwYXJlbnRHQ2QpIHtcbiAgICBpZiAoIXRoaXMuZGVsZXRlZCkge1xuICAgICAgdGhyb3cgZXJyb3IudW5leHBlY3RlZENhc2UoKVxuICAgIH1cbiAgICB0aGlzLmNvbnRlbnQuZ2Moc3RvcmUpXG4gICAgaWYgKHBhcmVudEdDZCkge1xuICAgICAgcmVwbGFjZVN0cnVjdChzdG9yZSwgdGhpcywgbmV3IEdDKHRoaXMuaWQsIHRoaXMubGVuZ3RoKSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb250ZW50ID0gbmV3IENvbnRlbnREZWxldGVkKHRoaXMubGVuZ3RoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm0gdGhlIHByb3BlcnRpZXMgb2YgdGhpcyB0eXBlIHRvIGJpbmFyeSBhbmQgd3JpdGUgaXQgdG8gYW5cbiAgICogQmluYXJ5RW5jb2Rlci5cbiAgICpcbiAgICogVGhpcyBpcyBjYWxsZWQgd2hlbiB0aGlzIEl0ZW0gaXMgc2VudCB0byBhIHJlbW90ZSBwZWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlciBUaGUgZW5jb2RlciB0byB3cml0ZSBkYXRhIHRvLlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgY29uc3Qgb3JpZ2luID0gb2Zmc2V0ID4gMCA/IGNyZWF0ZUlEKHRoaXMuaWQuY2xpZW50LCB0aGlzLmlkLmNsb2NrICsgb2Zmc2V0IC0gMSkgOiB0aGlzLm9yaWdpblxuICAgIGNvbnN0IHJpZ2h0T3JpZ2luID0gdGhpcy5yaWdodE9yaWdpblxuICAgIGNvbnN0IHBhcmVudFN1YiA9IHRoaXMucGFyZW50U3ViXG4gICAgY29uc3QgaW5mbyA9ICh0aGlzLmNvbnRlbnQuZ2V0UmVmKCkgJiBiaW5hcnkuQklUUzUpIHxcbiAgICAgIChvcmlnaW4gPT09IG51bGwgPyAwIDogYmluYXJ5LkJJVDgpIHwgLy8gb3JpZ2luIGlzIGRlZmluZWRcbiAgICAgIChyaWdodE9yaWdpbiA9PT0gbnVsbCA/IDAgOiBiaW5hcnkuQklUNykgfCAvLyByaWdodCBvcmlnaW4gaXMgZGVmaW5lZFxuICAgICAgKHBhcmVudFN1YiA9PT0gbnVsbCA/IDAgOiBiaW5hcnkuQklUNikgLy8gcGFyZW50U3ViIGlzIG5vbi1udWxsXG4gICAgZW5jb2Rlci53cml0ZUluZm8oaW5mbylcbiAgICBpZiAob3JpZ2luICE9PSBudWxsKSB7XG4gICAgICBlbmNvZGVyLndyaXRlTGVmdElEKG9yaWdpbilcbiAgICB9XG4gICAgaWYgKHJpZ2h0T3JpZ2luICE9PSBudWxsKSB7XG4gICAgICBlbmNvZGVyLndyaXRlUmlnaHRJRChyaWdodE9yaWdpbilcbiAgICB9XG4gICAgaWYgKG9yaWdpbiA9PT0gbnVsbCAmJiByaWdodE9yaWdpbiA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgcGFyZW50ID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KVxuICAgICAgaWYgKHBhcmVudC5faXRlbSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudEl0ZW0gPSBwYXJlbnQuX2l0ZW1cbiAgICAgICAgaWYgKHBhcmVudEl0ZW0gPT09IG51bGwpIHtcbiAgICAgICAgICAvLyBwYXJlbnQgdHlwZSBvbiB5Ll9tYXBcbiAgICAgICAgICAvLyBmaW5kIHRoZSBjb3JyZWN0IGtleVxuICAgICAgICAgIGNvbnN0IHlrZXkgPSBmaW5kUm9vdFR5cGVLZXkocGFyZW50KVxuICAgICAgICAgIGVuY29kZXIud3JpdGVQYXJlbnRJbmZvKHRydWUpIC8vIHdyaXRlIHBhcmVudFlLZXlcbiAgICAgICAgICBlbmNvZGVyLndyaXRlU3RyaW5nKHlrZXkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW5jb2Rlci53cml0ZVBhcmVudEluZm8oZmFsc2UpIC8vIHdyaXRlIHBhcmVudCBpZFxuICAgICAgICAgIGVuY29kZXIud3JpdGVMZWZ0SUQocGFyZW50SXRlbS5pZClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChwYXJlbnQuY29uc3RydWN0b3IgPT09IFN0cmluZykgeyAvLyB0aGlzIGVkZ2UgY2FzZSB3YXMgYWRkZWQgYnkgZGlmZmVyZW50aWFsIHVwZGF0ZXNcbiAgICAgICAgZW5jb2Rlci53cml0ZVBhcmVudEluZm8odHJ1ZSkgLy8gd3JpdGUgcGFyZW50WUtleVxuICAgICAgICBlbmNvZGVyLndyaXRlU3RyaW5nKHBhcmVudClcbiAgICAgIH0gZWxzZSBpZiAocGFyZW50LmNvbnN0cnVjdG9yID09PSBJRCkge1xuICAgICAgICBlbmNvZGVyLndyaXRlUGFyZW50SW5mbyhmYWxzZSkgLy8gd3JpdGUgcGFyZW50IGlkXG4gICAgICAgIGVuY29kZXIud3JpdGVMZWZ0SUQocGFyZW50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3IudW5leHBlY3RlZENhc2UoKVxuICAgICAgfVxuICAgICAgaWYgKHBhcmVudFN1YiAhPT0gbnVsbCkge1xuICAgICAgICBlbmNvZGVyLndyaXRlU3RyaW5nKHBhcmVudFN1YilcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jb250ZW50LndyaXRlKGVuY29kZXIsIG9mZnNldClcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gaW5mb1xuICovXG5leHBvcnQgY29uc3QgcmVhZEl0ZW1Db250ZW50ID0gKGRlY29kZXIsIGluZm8pID0+IGNvbnRlbnRSZWZzW2luZm8gJiBiaW5hcnkuQklUUzVdKGRlY29kZXIpXG5cbi8qKlxuICogQSBsb29rdXAgbWFwIGZvciByZWFkaW5nIEl0ZW0gY29udGVudC5cbiAqXG4gKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24oVXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyKTpBYnN0cmFjdENvbnRlbnQ+fVxuICovXG5leHBvcnQgY29uc3QgY29udGVudFJlZnMgPSBbXG4gICgpID0+IHsgZXJyb3IudW5leHBlY3RlZENhc2UoKSB9LCAvLyBHQyBpcyBub3QgSXRlbUNvbnRlbnRcbiAgcmVhZENvbnRlbnREZWxldGVkLCAvLyAxXG4gIHJlYWRDb250ZW50SlNPTiwgLy8gMlxuICByZWFkQ29udGVudEJpbmFyeSwgLy8gM1xuICByZWFkQ29udGVudFN0cmluZywgLy8gNFxuICByZWFkQ29udGVudEVtYmVkLCAvLyA1XG4gIHJlYWRDb250ZW50Rm9ybWF0LCAvLyA2XG4gIHJlYWRDb250ZW50VHlwZSwgLy8gN1xuICByZWFkQ29udGVudEFueSwgLy8gOFxuICByZWFkQ29udGVudERvYywgLy8gOVxuICAoKSA9PiB7IGVycm9yLnVuZXhwZWN0ZWRDYXNlKCkgfSAvLyAxMCAtIFNraXAgaXMgbm90IEl0ZW1Db250ZW50XG5dXG5cbi8qKlxuICogRG8gbm90IGltcGxlbWVudCB0aGlzIGNsYXNzIVxuICovXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RDb250ZW50IHtcbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldExlbmd0aCAoKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGdldENvbnRlbnQgKCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIFNob3VsZCByZXR1cm4gZmFsc2UgaWYgdGhpcyBJdGVtIGlzIHNvbWUga2luZCBvZiBtZXRhIGluZm9ybWF0aW9uXG4gICAqIChlLmcuIGZvcm1hdCBpbmZvcm1hdGlvbikuXG4gICAqXG4gICAqICogV2hldGhlciB0aGlzIEl0ZW0gc2hvdWxkIGJlIGFkZHJlc3NhYmxlIHZpYSBgeWFycmF5LmdldChpKWBcbiAgICogKiBXaGV0aGVyIHRoaXMgSXRlbSBzaG91bGQgYmUgY291bnRlZCB3aGVuIGNvbXB1dGluZyB5YXJyYXkubGVuZ3RoXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0NvdW50YWJsZSAoKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QWJzdHJhY3RDb250ZW50fVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IF9vZmZzZXRcbiAgICogQHJldHVybiB7QWJzdHJhY3RDb250ZW50fVxuICAgKi9cbiAgc3BsaWNlIChfb2Zmc2V0KSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtBYnN0cmFjdENvbnRlbnR9IF9yaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChfcmlnaHQpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSBfdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtJdGVtfSBfaXRlbVxuICAgKi9cbiAgaW50ZWdyYXRlIChfdHJhbnNhY3Rpb24sIF9pdGVtKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gX3RyYW5zYWN0aW9uXG4gICAqL1xuICBkZWxldGUgKF90cmFuc2FjdGlvbikge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IF9zdG9yZVxuICAgKi9cbiAgZ2MgKF9zdG9yZSkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBfZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gX29mZnNldFxuICAgKi9cbiAgd3JpdGUgKF9lbmNvZGVyLCBfb2Zmc2V0KSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxufVxuIiwgImltcG9ydCB7XG4gIEFic3RyYWN0U3RydWN0LFxuICBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgU3RydWN0U3RvcmUsIFRyYW5zYWN0aW9uLCBJRCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuXG5leHBvcnQgY29uc3Qgc3RydWN0U2tpcFJlZk51bWJlciA9IDEwXG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIFNraXAgZXh0ZW5kcyBBYnN0cmFjdFN0cnVjdCB7XG4gIGdldCBkZWxldGVkICgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZGVsZXRlICgpIHt9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U2tpcH0gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3RvciAhPT0gcmlnaHQuY29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB0aGlzLmxlbmd0aCArPSByaWdodC5sZW5ndGhcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIG9mZnNldCkge1xuICAgIC8vIHNraXAgc3RydWN0cyBjYW5ub3QgYmUgaW50ZWdyYXRlZFxuICAgIGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgZW5jb2Rlci53cml0ZUluZm8oc3RydWN0U2tpcFJlZk51bWJlcilcbiAgICAvLyB3cml0ZSBhcyBWYXJVaW50IGJlY2F1c2UgU2tpcHMgY2FuJ3QgbWFrZSB1c2Ugb2YgcHJlZGljdGFibGUgbGVuZ3RoLWVuY29kaW5nXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIHRoaXMubGVuZ3RoIC0gb2Zmc2V0KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqIEByZXR1cm4ge251bGwgfCBudW1iZXJ9XG4gICAqL1xuICBnZXRNaXNzaW5nICh0cmFuc2FjdGlvbiwgc3RvcmUpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG4iLCAiLyoqIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG5leHBvcnQge1xuICBEb2MsXG4gIFRyYW5zYWN0aW9uLFxuICBZQXJyYXkgYXMgQXJyYXksXG4gIFlNYXAgYXMgTWFwLFxuICBZVGV4dCBhcyBUZXh0LFxuICBZWG1sVGV4dCBhcyBYbWxUZXh0LFxuICBZWG1sSG9vayBhcyBYbWxIb29rLFxuICBZWG1sRWxlbWVudCBhcyBYbWxFbGVtZW50LFxuICBZWG1sRnJhZ21lbnQgYXMgWG1sRnJhZ21lbnQsXG4gIFlYbWxFdmVudCxcbiAgWU1hcEV2ZW50LFxuICBZQXJyYXlFdmVudCxcbiAgWVRleHRFdmVudCxcbiAgWUV2ZW50LFxuICBJdGVtLFxuICBBYnN0cmFjdFN0cnVjdCxcbiAgR0MsXG4gIFNraXAsXG4gIENvbnRlbnRCaW5hcnksXG4gIENvbnRlbnREZWxldGVkLFxuICBDb250ZW50RG9jLFxuICBDb250ZW50RW1iZWQsXG4gIENvbnRlbnRGb3JtYXQsXG4gIENvbnRlbnRKU09OLFxuICBDb250ZW50QW55LFxuICBDb250ZW50U3RyaW5nLFxuICBDb250ZW50VHlwZSxcbiAgQWJzdHJhY3RUeXBlLFxuICBnZXRUeXBlQ2hpbGRyZW4sXG4gIGNyZWF0ZVJlbGF0aXZlUG9zaXRpb25Gcm9tVHlwZUluZGV4LFxuICBjcmVhdGVSZWxhdGl2ZVBvc2l0aW9uRnJvbUpTT04sXG4gIGNyZWF0ZUFic29sdXRlUG9zaXRpb25Gcm9tUmVsYXRpdmVQb3NpdGlvbixcbiAgY29tcGFyZVJlbGF0aXZlUG9zaXRpb25zLFxuICBBYnNvbHV0ZVBvc2l0aW9uLFxuICBSZWxhdGl2ZVBvc2l0aW9uLFxuICBJRCxcbiAgY3JlYXRlSUQsXG4gIGNvbXBhcmVJRHMsXG4gIGdldFN0YXRlLFxuICBTbmFwc2hvdCxcbiAgY3JlYXRlU25hcHNob3QsXG4gIGNyZWF0ZURlbGV0ZVNldCxcbiAgY3JlYXRlRGVsZXRlU2V0RnJvbVN0cnVjdFN0b3JlLFxuICBjbGVhbnVwWVRleHRGb3JtYXR0aW5nLFxuICBzbmFwc2hvdCxcbiAgZW1wdHlTbmFwc2hvdCxcbiAgZmluZFJvb3RUeXBlS2V5LFxuICBmaW5kSW5kZXhTUyxcbiAgZ2V0SXRlbSxcbiAgdHlwZUxpc3RUb0FycmF5U25hcHNob3QsXG4gIHR5cGVNYXBHZXRTbmFwc2hvdCxcbiAgdHlwZU1hcEdldEFsbFNuYXBzaG90LFxuICBjcmVhdGVEb2NGcm9tU25hcHNob3QsXG4gIGl0ZXJhdGVEZWxldGVkU3RydWN0cyxcbiAgYXBwbHlVcGRhdGUsXG4gIGFwcGx5VXBkYXRlVjIsXG4gIHJlYWRVcGRhdGUsXG4gIHJlYWRVcGRhdGVWMixcbiAgZW5jb2RlU3RhdGVBc1VwZGF0ZSxcbiAgZW5jb2RlU3RhdGVBc1VwZGF0ZVYyLFxuICBlbmNvZGVTdGF0ZVZlY3RvcixcbiAgVW5kb01hbmFnZXIsXG4gIGRlY29kZVNuYXBzaG90LFxuICBlbmNvZGVTbmFwc2hvdCxcbiAgZGVjb2RlU25hcHNob3RWMixcbiAgZW5jb2RlU25hcHNob3RWMixcbiAgZGVjb2RlU3RhdGVWZWN0b3IsXG4gIGxvZ1VwZGF0ZSxcbiAgbG9nVXBkYXRlVjIsXG4gIGRlY29kZVVwZGF0ZSxcbiAgZGVjb2RlVXBkYXRlVjIsXG4gIHJlbGF0aXZlUG9zaXRpb25Ub0pTT04sXG4gIGlzRGVsZXRlZCxcbiAgaXNQYXJlbnRPZixcbiAgZXF1YWxTbmFwc2hvdHMsXG4gIFBlcm1hbmVudFVzZXJEYXRhLCAvLyBAVE9ETyBleHBlcmltZW50YWxcbiAgdHJ5R2MsXG4gIHRyYW5zYWN0LFxuICBBYnN0cmFjdENvbm5lY3RvcixcbiAgbG9nVHlwZSxcbiAgbWVyZ2VVcGRhdGVzLFxuICBtZXJnZVVwZGF0ZXNWMixcbiAgcGFyc2VVcGRhdGVNZXRhLFxuICBwYXJzZVVwZGF0ZU1ldGFWMixcbiAgZW5jb2RlU3RhdGVWZWN0b3JGcm9tVXBkYXRlLFxuICBlbmNvZGVTdGF0ZVZlY3RvckZyb21VcGRhdGVWMixcbiAgZW5jb2RlUmVsYXRpdmVQb3NpdGlvbixcbiAgZGVjb2RlUmVsYXRpdmVQb3NpdGlvbixcbiAgZGlmZlVwZGF0ZSxcbiAgZGlmZlVwZGF0ZVYyLFxuICBjb252ZXJ0VXBkYXRlRm9ybWF0VjFUb1YyLFxuICBjb252ZXJ0VXBkYXRlRm9ybWF0VjJUb1YxLFxuICBvYmZ1c2NhdGVVcGRhdGUsXG4gIG9iZnVzY2F0ZVVwZGF0ZVYyLFxuICBVcGRhdGVFbmNvZGVyVjEsXG4gIFVwZGF0ZUVuY29kZXJWMixcbiAgVXBkYXRlRGVjb2RlclYxLFxuICBVcGRhdGVEZWNvZGVyVjIsXG4gIGVxdWFsRGVsZXRlU2V0cyxcbiAgbWVyZ2VEZWxldGVTZXRzLFxuICBzbmFwc2hvdENvbnRhaW5zVXBkYXRlXG59IGZyb20gJy4vaW50ZXJuYWxzLmpzJ1xuXG5jb25zdCBnbG8gPSAvKiogQHR5cGUge2FueX0gKi8gKHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJ1xuICA/IGdsb2JhbFRoaXNcbiAgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgID8gd2luZG93XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB7fSlcblxuY29uc3QgaW1wb3J0SWRlbnRpZmllciA9ICdfXyAkWUpTJCBfXydcblxuaWYgKGdsb1tpbXBvcnRJZGVudGlmaWVyXSA9PT0gdHJ1ZSkge1xuICAvKipcbiAgICogRGVhciByZWFkZXIgb2YgdGhpcyBtZXNzYWdlLiBQbGVhc2UgdGFrZSB0aGlzIHNlcmlvdXNseS5cbiAgICpcbiAgICogSWYgeW91IHNlZSB0aGlzIG1lc3NhZ2UsIG1ha2Ugc3VyZSB0aGF0IHlvdSBvbmx5IGltcG9ydCBvbmUgdmVyc2lvbiBvZiBZanMuIEluIG1hbnkgY2FzZXMsXG4gICAqIHlvdXIgcGFja2FnZSBtYW5hZ2VyIGluc3RhbGxzIHR3byB2ZXJzaW9ucyBvZiBZanMgdGhhdCBhcmUgdXNlZCBieSBkaWZmZXJlbnQgcGFja2FnZXMgd2l0aGluIHlvdXIgcHJvamVjdC5cbiAgICogQW5vdGhlciByZWFzb24gZm9yIHRoaXMgbWVzc2FnZSBpcyB0aGF0IHNvbWUgcGFydHMgb2YgeW91ciBwcm9qZWN0IHVzZSB0aGUgY29tbW9uanMgdmVyc2lvbiBvZiBZanNcbiAgICogYW5kIG90aGVycyB1c2UgdGhlIEVjbWFTY3JpcHQgdmVyc2lvbiBvZiBZanMuXG4gICAqXG4gICAqIFRoaXMgb2Z0ZW4gbGVhZHMgdG8gaXNzdWVzIHRoYXQgYXJlIGhhcmQgdG8gZGVidWcuIFdlIG9mdGVuIG5lZWQgdG8gcGVyZm9ybSBjb25zdHJ1Y3RvciBjaGVja3MsXG4gICAqIGUuZy4gYHN0cnVjdCBpbnN0YW5jZW9mIEdDYC4gSWYgeW91IGltcG9ydGVkIGRpZmZlcmVudCB2ZXJzaW9ucyBvZiBZanMsIGl0IGlzIGltcG9zc2libGUgZm9yIHVzIHRvXG4gICAqIGRvIHRoZSBjb25zdHJ1Y3RvciBjaGVja3MgYW55bW9yZSAtIHdoaWNoIG1pZ2h0IGJyZWFrIHRoZSBDUkRUIGFsZ29yaXRobS5cbiAgICpcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL3lqcy95anMvaXNzdWVzLzQzOFxuICAgKi9cbiAgY29uc29sZS5lcnJvcignWWpzIHdhcyBhbHJlYWR5IGltcG9ydGVkLiBUaGlzIGJyZWFrcyBjb25zdHJ1Y3RvciBjaGVja3MgYW5kIHdpbGwgbGVhZCB0byBpc3N1ZXMhIC0gaHR0cHM6Ly9naXRodWIuY29tL3lqcy95anMvaXNzdWVzLzQzOCcpXG59XG5nbG9baW1wb3J0SWRlbnRpZmllcl0gPSB0cnVlXG4iLCAiaW1wb3J0ICogYXMgWSBmcm9tIFwiLi9pbmRleFwiXG5cbnR5cGUgbWFuYWdlZFR5cGUgPSBZLk1hcDxhbnk+IHwgWS5BcnJheTxhbnk+IHwgc3RyaW5nIHwgbnVtYmVyXG50eXBlIHN1cHBvcnRlZFR5cGUgPSBvYmplY3QgfCBzdHJpbmcgfCBudW1iZXJcblxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBFcXVhbHMobWFuYWdlZDogbWFuYWdlZFR5cGUsIHRhcmdldDogc3VwcG9ydGVkVHlwZSB8IHN1cHBvcnRlZFR5cGVbXSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1hbmFnZWRUeXBlID0gZGV0ZWN0TWFuYWdlZFR5cGUobWFuYWdlZClcblxuICAgIHRyeSB7XG4gICAgICAgIHZhciB0YXJnZXRUeXBlID0gdGFyZ2V0LmNvbnN0cnVjdG9yLm5hbWVcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRhcmdldFR5cGUgPSBcInVuZGVmaW5lZFwiXG4gICAgfVxuXG4gICAgaWYgKG1hbmFnZWRUeXBlID09IFwiWUFycmF5XCIgJiYgdGFyZ2V0VHlwZSA9PSBcIkFycmF5XCIpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0QXJyYXkgPSAodGFyZ2V0IGFzIEFycmF5PGFueT4pXG4gICAgICAgIGNvbnN0IG1hbmFnZWRBcnJheSA9IChtYW5hZ2VkIGFzIFkuQXJyYXk8YW55PilcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBtYW5hZ2VkQXJyYXkubGVuZ3RoID09IHRhcmdldEFycmF5Lmxlbmd0aCAmJiB0YXJnZXRBcnJheS5ldmVyeSgodCwgaSkgPT4gZGVlcEVxdWFscyhtYW5hZ2VkQXJyYXkuZ2V0KGkpLCB0YXJnZXRBcnJheVtpXSkpXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICB9IGVsc2UgaWYgKG1hbmFnZWRUeXBlID09IFwiWU1hcFwiICYmIHRhcmdldFR5cGUgPT0gXCJPYmplY3RcIikge1xuICAgICAgICBjb25zdCB0YXJnZXRNYXAgPSAodGFyZ2V0IGFzIFJlY29yZDxzdHJpbmcsIGFueT4pXG4gICAgICAgIGNvbnN0IG1hbmFnZWRNYXAgPSAobWFuYWdlZCBhcyBZLk1hcDxhbnk+KVxuXG4gICAgICAgIGxldCB0YXJnZXRLZXlDb3VudCA9IDBcbiAgICAgICAgZm9yIChsZXQgdGFyZ2V0S2V5IGluIHRhcmdldE1hcCkge1xuICAgICAgICAgICAgdGFyZ2V0S2V5Q291bnQrK1xuICAgICAgICAgICAgaWYgKCFkZWVwRXF1YWxzKG1hbmFnZWRNYXAuZ2V0KHRhcmdldEtleSksIHRhcmdldE1hcFt0YXJnZXRLZXldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YXJnZXRLZXlDb3VudCA9PSBBcnJheS5mcm9tKG1hbmFnZWRNYXAua2V5cygpKS5sZW5ndGhcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGFyZ2V0ID09PSBtYW5hZ2VkXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3luY3Jvbml6ZShcbiAgICBtYW5hZ2VkT2JqOiBZLk1hcDxhbnk+IHwgWS5BcnJheTxhbnk+LFxuICAgIHRhcmdldE9iajogUmVjb3JkPHN0cmluZywgYW55PiB8IGFueVtdLFxuKTogYm9vbGVhbiB7XG5cbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlXG5cbiAgICBjb25zdCBtYW5hZ2VkVHlwZSA9IGRldGVjdE1hbmFnZWRUeXBlKG1hbmFnZWRPYmopXG5cbiAgICBzd2l0Y2ggKG1hbmFnZWRUeXBlKSB7XG4gICAgICAgIGNhc2UgXCJZQXJyYXlcIjpcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YXJnZXRPYmopKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTeW5jIGZhaWxlZCwgJHt0YXJnZXRPYmp9IHdhcyBub3QgYXJyYXlgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtYW5hZ2VkQXJyYXkgPSBtYW5hZ2VkT2JqIGFzIFkuQXJyYXk8YW55PlxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0QXJyYXkgPSB0YXJnZXRPYmogYXMgYW55W11cbiAgICAgICAgICAgIGNvbnN0IG91dE9mUmFuZ2UgPSBTeW1ib2woKVxuXG4gICAgICAgICAgICBsZXQgY3Vyc29yID0gMFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YXJnZXRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBtYXRjaCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0VmFsdWUgPSB0YXJnZXRBcnJheVtpXVxuICAgICAgICAgICAgICAgIGNvbnN0IGxlbiA9IChtYW5hZ2VkQXJyYXkubGVuZ3RoID4gdGFyZ2V0QXJyYXkubGVuZ3RoKSA/ICBtYW5hZ2VkQXJyYXkubGVuZ3RoIDogdGFyZ2V0QXJyYXkubGVuZ3RoXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IGN1cnNvcjsgIW1hdGNoICYmIGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYW5hZ2VkVmFsdWUgPSAoaiA8IG1hbmFnZWRBcnJheS5sZW5ndGgpID8gbWFuYWdlZEFycmF5LmdldChqKSA6IG91dE9mUmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0VmFsdWUgPSAoaSA8IHRhcmdldEFycmF5Lmxlbmd0aCkgPyB0YXJnZXRBcnJheVtpXSA6IG91dE9mUmFuZ2VcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVlcEVxdWFscyhtYW5hZ2VkVmFsdWUsIHRhcmdldFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IGotMTsgeCA+PSBjdXJzb3I7IHgtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEFycmF5LmRlbGV0ZSh4KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVsZXRlZENvdW50ID0gaiAtIGN1cnNvclxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gaisxIC0gZGVsZXRlZENvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGRUeXBlID0gdGFyZ2V0VmFsdWUuY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFR5cGUgPSBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFuYWdlZENoaWxkID0gKGN1cnNvciA8IG1hbmFnZWRBcnJheS5sZW5ndGgpID8gbWFuYWdlZEFycmF5LmdldChjdXJzb3IpIDogXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYW5hZ2VkVHlwZSA9IGRldGVjdE1hbmFnZWRUeXBlKG1hbmFnZWRDaGlsZClcblxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgaWYgdGhleSdyZSBjb21wYXRpYmxlIHR5cGVzIHdlIHNob3VsZCBnbyBkZWVwZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlcmUgd2FzIG5vIGV4YWN0IG1hdGNoIGluIHRoZSBsaXN0LCBzbyBhc3N1bWUgdGhlIGltbWVkaWF0ZWx5IG5leHQgb2JqZWN0IHNob3VsZCBiZSB0aGUgbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgaWYgKChtYW5hZ2VkVHlwZSA9PSBcIllNYXBcIiAmJiBjaGlsZFR5cGUgPT0gXCJPYmplY3RcIikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChtYW5hZ2VkVHlwZSA9PSBcIllBcnJheVwiICYmIGNoaWxkVHlwZSA9PSBcIkFycmF5XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzeW5jcm9uaXplKG1hbmFnZWRDaGlsZCwgdGFyZ2V0VmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkQXJyYXkuaW5zZXJ0KGN1cnNvciwgW3N5bmNDaGlsZCh0YXJnZXRWYWx1ZSldKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yKytcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAobWFuYWdlZEFycmF5Lmxlbmd0aCA+IHRhcmdldEFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgbWFuYWdlZEFycmF5LmRlbGV0ZSh0YXJnZXRBcnJheS5sZW5ndGgpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgXCJZTWFwXCI6XG4gICAgICAgICAgICBpZiAodGFyZ2V0T2JqLmNvbnN0cnVjdG9yLm5hbWUgIT09IFwiT2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFN5bmMgZmFpbGVkLCAke3RhcmdldE9ian0gd2FzIG5vdCBvYmplY3RgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtYW5hZ2VkTWFwID0gbWFuYWdlZE9iaiBhcyBZLk1hcDxhbnk+XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRNYXAgPSB0YXJnZXRPYmogYXMgUmVjb3JkPHN0cmluZywgYW55PlxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBtYW5hZ2VkTWFwLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGlmICghKGtleSBpbiB0YXJnZXRPYmopKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGl0ZW0ncyBiZWVuIHJlbW92ZWQgZnJvbSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZE1hcC5kZWxldGUoa2V5KVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBtYW5hZ2VkQ2hpbGQgPSBtYW5hZ2VkTWFwLmdldChrZXkpXG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0Q2hpbGQgPSB0YXJnZXRNYXBba2V5XVxuXG4gICAgICAgICAgICAgICAgY29uc3QgbWFuYWdlZFR5cGUgPSBkZXRlY3RNYW5hZ2VkVHlwZShtYW5hZ2VkQ2hpbGQpXG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGRUeXBlID0gdGFyZ2V0Q2hpbGQuY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRUeXBlID0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICgobWFuYWdlZFR5cGUgPT0gXCJZTWFwXCIgJiYgY2hpbGRUeXBlICE9PSBcIk9iamVjdFwiKSB8fFxuICAgICAgICAgICAgICAgICAgICAobWFuYWdlZFR5cGUgPT0gXCJZQXJyYXlcIiAmJiBjaGlsZFR5cGUgIT09IFwiQXJyYXlcIikgfHxcbiAgICAgICAgICAgICAgICAgICAgKCFbXCJZTWFwXCIsIFwiWUFycmF5XCJdLmluY2x1ZGVzKG1hbmFnZWRUeXBlKSAmJiBtYW5hZ2VkVHlwZSAhPT0gY2hpbGRUeXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGZ1bmRhbWVudGFsbHkgY2hhbmdlZCwgZGVsZXRlIHRoZSBleGlzdGluZyByZWNvcmQgYW5kIHJlY3JlYXRlIGl0IGluIHNlY29uZCBwYXNzXG4gICAgICAgICAgICAgICAgICAgIG1hbmFnZWRNYXAuZGVsZXRlKGtleSlcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hbmFnZWRUeXBlID09IFwiWU1hcFwiIHx8IG1hbmFnZWRUeXBlID09IFwiWUFycmF5XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhleSBtYXRjaCBpbiB0eXBlcywgc28gZ28gZGVlcGVyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkQ2hhbmdlZCA9IHN5bmNyb25pemUobWFuYWdlZENoaWxkLCB0YXJnZXRDaGlsZClcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCB8fD0gY2hpbGRDaGFuZ2VkXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhleSBhcmUgbm90IGNvbXBsZXggdHlwZXMgc28ganVzdCBhc3NpZ24gaXQgaW50byB0aGUgbWFwXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYW5hZ2VkQ2hpbGQgIT09IHRhcmdldENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkTWFwLnNldChrZXksIHRhcmdldENoaWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGFyZ2V0TWFwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYW5hZ2VkTWFwLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gc3luY0NoaWxkKHRhcmdldE1hcFtrZXldKVxuXG4gICAgICAgICAgICAgICAgICAgIG1hbmFnZWRNYXAuc2V0KGtleSwgY2hpbGQpXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2FuIG9ubHkgaXRlcmF0ZSBvdmVyIFkuTWFwIGFuZCBZLkFycmF5LCBnb3QgJHttYW5hZ2VkT2JqfWApXG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2VkXG59XG5cbmZ1bmN0aW9uIHN5bmNDaGlsZChjaGlsZDogYW55KTogYW55IHtcbiAgICB0cnkge1xuICAgICAgICB2YXIgY2hpbGRUeXBlID0gY2hpbGQuY29uc3RydWN0b3IubmFtZVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2hpbGRUeXBlID0gXCJ1bmRlZmluZWRcIlxuICAgIH1cblxuICAgIGlmIChjaGlsZFR5cGUgPT0gXCJBcnJheVwiKSB7XG4gICAgICAgIGNvbnN0IGFyciA9IG5ldyBZLkFycmF5KClcblxuICAgICAgICBzeW5jcm9uaXplKGFycixjaGlsZClcbiAgICAgICAgcmV0dXJuIGFyclxuICAgIH0gZWxzZSBpZiAoY2hpbGRUeXBlID09IFwiT2JqZWN0XCIpIHtcbiAgICAgICAgY29uc3QgbWFwID0gbmV3IFkuTWFwKClcblxuICAgICAgICBzeW5jcm9uaXplKG1hcCwgY2hpbGQpXG4gICAgICAgIHJldHVybiBtYXBcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY2hpbGRcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRldGVjdE1hbmFnZWRUeXBlKG1hbmFnZWQ6IGFueSk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKG1hbmFnZWQubGVuZ3RoICE9PSB1bmRlZmluZWQgJiYgbWFuYWdlZC5nZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiWUFycmF5XCJcbiAgICAgICAgfSBlbHNlIGlmIChtYW5hZ2VkLmtleXMgIT09IHVuZGVmaW5lZCAmJiBtYW5hZ2VkLmdldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJZTWFwXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtYW5hZ2VkLmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIFwidW5kZWZpbmVkXCJcbiAgICB9XG59IiwgIi8qKlxuICogIGJhc2U2NC50c1xuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQlNEIDMtQ2xhdXNlIExpY2Vuc2UuXG4gKiAgICBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKlxuICogIFJlZmVyZW5jZXM6XG4gKiAgICBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NFxuICpcbiAqIEBhdXRob3IgRGFuIEtvZ2FpIChodHRwczovL2dpdGh1Yi5jb20vZGFua29nYWkpXG4gKi9cbmNvbnN0IHZlcnNpb24gPSAnMy43LjcnO1xuLyoqXG4gKiBAZGVwcmVjYXRlZCB1c2UgbG93ZXJjYXNlIGB2ZXJzaW9uYC5cbiAqL1xuY29uc3QgVkVSU0lPTiA9IHZlcnNpb247XG5jb25zdCBfaGFzQnVmZmVyID0gdHlwZW9mIEJ1ZmZlciA9PT0gJ2Z1bmN0aW9uJztcbmNvbnN0IF9URCA9IHR5cGVvZiBUZXh0RGVjb2RlciA9PT0gJ2Z1bmN0aW9uJyA/IG5ldyBUZXh0RGVjb2RlcigpIDogdW5kZWZpbmVkO1xuY29uc3QgX1RFID0gdHlwZW9mIFRleHRFbmNvZGVyID09PSAnZnVuY3Rpb24nID8gbmV3IFRleHRFbmNvZGVyKCkgOiB1bmRlZmluZWQ7XG5jb25zdCBiNjRjaCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPSc7XG5jb25zdCBiNjRjaHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChiNjRjaCk7XG5jb25zdCBiNjR0YWIgPSAoKGEpID0+IHtcbiAgICBsZXQgdGFiID0ge307XG4gICAgYS5mb3JFYWNoKChjLCBpKSA9PiB0YWJbY10gPSBpKTtcbiAgICByZXR1cm4gdGFiO1xufSkoYjY0Y2hzKTtcbmNvbnN0IGI2NHJlID0gL14oPzpbQS1aYS16XFxkK1xcL117NH0pKj8oPzpbQS1aYS16XFxkK1xcL117Mn0oPzo9PSk/fFtBLVphLXpcXGQrXFwvXXszfT0/KT8kLztcbmNvbnN0IF9mcm9tQ0MgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmJpbmQoU3RyaW5nKTtcbmNvbnN0IF9VOEFmcm9tID0gdHlwZW9mIFVpbnQ4QXJyYXkuZnJvbSA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gVWludDhBcnJheS5mcm9tLmJpbmQoVWludDhBcnJheSlcbiAgICA6IChpdCkgPT4gbmV3IFVpbnQ4QXJyYXkoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaXQsIDApKTtcbmNvbnN0IF9ta1VyaVNhZmUgPSAoc3JjKSA9PiBzcmNcbiAgICAucmVwbGFjZSgvPS9nLCAnJykucmVwbGFjZSgvWytcXC9dL2csIChtMCkgPT4gbTAgPT0gJysnID8gJy0nIDogJ18nKTtcbmNvbnN0IF90aWR5QjY0ID0gKHMpID0+IHMucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9dL2csICcnKTtcbi8qKlxuICogcG9seWZpbGwgdmVyc2lvbiBvZiBgYnRvYWBcbiAqL1xuY29uc3QgYnRvYVBvbHlmaWxsID0gKGJpbikgPT4ge1xuICAgIC8vIGNvbnNvbGUubG9nKCdwb2x5ZmlsbGVkJyk7XG4gICAgbGV0IHUzMiwgYzAsIGMxLCBjMiwgYXNjID0gJyc7XG4gICAgY29uc3QgcGFkID0gYmluLmxlbmd0aCAlIDM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW4ubGVuZ3RoOykge1xuICAgICAgICBpZiAoKGMwID0gYmluLmNoYXJDb2RlQXQoaSsrKSkgPiAyNTUgfHxcbiAgICAgICAgICAgIChjMSA9IGJpbi5jaGFyQ29kZUF0KGkrKykpID4gMjU1IHx8XG4gICAgICAgICAgICAoYzIgPSBiaW4uY2hhckNvZGVBdChpKyspKSA+IDI1NSlcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ludmFsaWQgY2hhcmFjdGVyIGZvdW5kJyk7XG4gICAgICAgIHUzMiA9IChjMCA8PCAxNikgfCAoYzEgPDwgOCkgfCBjMjtcbiAgICAgICAgYXNjICs9IGI2NGNoc1t1MzIgPj4gMTggJiA2M11cbiAgICAgICAgICAgICsgYjY0Y2hzW3UzMiA+PiAxMiAmIDYzXVxuICAgICAgICAgICAgKyBiNjRjaHNbdTMyID4+IDYgJiA2M11cbiAgICAgICAgICAgICsgYjY0Y2hzW3UzMiAmIDYzXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZCA/IGFzYy5zbGljZSgwLCBwYWQgLSAzKSArIFwiPT09XCIuc3Vic3RyaW5nKHBhZCkgOiBhc2M7XG59O1xuLyoqXG4gKiBkb2VzIHdoYXQgYHdpbmRvdy5idG9hYCBvZiB3ZWIgYnJvd3NlcnMgZG8uXG4gKiBAcGFyYW0ge1N0cmluZ30gYmluIGJpbmFyeSBzdHJpbmdcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEJhc2U2NC1lbmNvZGVkIHN0cmluZ1xuICovXG5jb25zdCBfYnRvYSA9IHR5cGVvZiBidG9hID09PSAnZnVuY3Rpb24nID8gKGJpbikgPT4gYnRvYShiaW4pXG4gICAgOiBfaGFzQnVmZmVyID8gKGJpbikgPT4gQnVmZmVyLmZyb20oYmluLCAnYmluYXJ5JykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgICAgIDogYnRvYVBvbHlmaWxsO1xuY29uc3QgX2Zyb21VaW50OEFycmF5ID0gX2hhc0J1ZmZlclxuICAgID8gKHU4YSkgPT4gQnVmZmVyLmZyb20odThhKS50b1N0cmluZygnYmFzZTY0JylcbiAgICA6ICh1OGEpID0+IHtcbiAgICAgICAgLy8gY2YuIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNzEwMDAxL2hvdy10by1jb252ZXJ0LXVpbnQ4LWFycmF5LXRvLWJhc2U2NC1lbmNvZGVkLXN0cmluZy8xMjcxMzMyNiMxMjcxMzMyNlxuICAgICAgICBjb25zdCBtYXhhcmdzID0gMHgxMDAwO1xuICAgICAgICBsZXQgc3RycyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IHU4YS5sZW5ndGg7IGkgPCBsOyBpICs9IG1heGFyZ3MpIHtcbiAgICAgICAgICAgIHN0cnMucHVzaChfZnJvbUNDLmFwcGx5KG51bGwsIHU4YS5zdWJhcnJheShpLCBpICsgbWF4YXJncykpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2J0b2Eoc3Rycy5qb2luKCcnKSk7XG4gICAgfTtcbi8qKlxuICogY29udmVydHMgYSBVaW50OEFycmF5IHRvIGEgQmFzZTY0IHN0cmluZy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VybHNhZmVdIFVSTC1hbmQtZmlsZW5hbWUtc2FmZSBhIGxhIFJGQzQ2NDggXHUwMEE3NVxuICogQHJldHVybnMge3N0cmluZ30gQmFzZTY0IHN0cmluZ1xuICovXG5jb25zdCBmcm9tVWludDhBcnJheSA9ICh1OGEsIHVybHNhZmUgPSBmYWxzZSkgPT4gdXJsc2FmZSA/IF9ta1VyaVNhZmUoX2Zyb21VaW50OEFycmF5KHU4YSkpIDogX2Zyb21VaW50OEFycmF5KHU4YSk7XG4vLyBUaGlzIHRyaWNrIGlzIGZvdW5kIGJyb2tlbiBodHRwczovL2dpdGh1Yi5jb20vZGFua29nYWkvanMtYmFzZTY0L2lzc3Vlcy8xMzBcbi8vIGNvbnN0IHV0b2IgPSAoc3JjOiBzdHJpbmcpID0+IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzcmMpKTtcbi8vIHJldmVydGluZyBnb29kIG9sZCBmYXRpb25lZCByZWdleHBcbmNvbnN0IGNiX3V0b2IgPSAoYykgPT4ge1xuICAgIGlmIChjLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgdmFyIGNjID0gYy5jaGFyQ29kZUF0KDApO1xuICAgICAgICByZXR1cm4gY2MgPCAweDgwID8gY1xuICAgICAgICAgICAgOiBjYyA8IDB4ODAwID8gKF9mcm9tQ0MoMHhjMCB8IChjYyA+Pj4gNikpXG4gICAgICAgICAgICAgICAgKyBfZnJvbUNDKDB4ODAgfCAoY2MgJiAweDNmKSkpXG4gICAgICAgICAgICAgICAgOiAoX2Zyb21DQygweGUwIHwgKChjYyA+Pj4gMTIpICYgMHgwZikpXG4gICAgICAgICAgICAgICAgICAgICsgX2Zyb21DQygweDgwIHwgKChjYyA+Pj4gNikgJiAweDNmKSlcbiAgICAgICAgICAgICAgICAgICAgKyBfZnJvbUNDKDB4ODAgfCAoY2MgJiAweDNmKSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGNjID0gMHgxMDAwMFxuICAgICAgICAgICAgKyAoYy5jaGFyQ29kZUF0KDApIC0gMHhEODAwKSAqIDB4NDAwXG4gICAgICAgICAgICArIChjLmNoYXJDb2RlQXQoMSkgLSAweERDMDApO1xuICAgICAgICByZXR1cm4gKF9mcm9tQ0MoMHhmMCB8ICgoY2MgPj4+IDE4KSAmIDB4MDcpKVxuICAgICAgICAgICAgKyBfZnJvbUNDKDB4ODAgfCAoKGNjID4+PiAxMikgJiAweDNmKSlcbiAgICAgICAgICAgICsgX2Zyb21DQygweDgwIHwgKChjYyA+Pj4gNikgJiAweDNmKSlcbiAgICAgICAgICAgICsgX2Zyb21DQygweDgwIHwgKGNjICYgMHgzZikpKTtcbiAgICB9XG59O1xuY29uc3QgcmVfdXRvYiA9IC9bXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZGXXxbXlxceDAwLVxceDdGXS9nO1xuLyoqXG4gKiBAZGVwcmVjYXRlZCBzaG91bGQgaGF2ZSBiZWVuIGludGVybmFsIHVzZSBvbmx5LlxuICogQHBhcmFtIHtzdHJpbmd9IHNyYyBVVEYtOCBzdHJpbmdcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFVURi0xNiBzdHJpbmdcbiAqL1xuY29uc3QgdXRvYiA9ICh1KSA9PiB1LnJlcGxhY2UocmVfdXRvYiwgY2JfdXRvYik7XG4vL1xuY29uc3QgX2VuY29kZSA9IF9oYXNCdWZmZXJcbiAgICA/IChzKSA9PiBCdWZmZXIuZnJvbShzLCAndXRmOCcpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgIDogX1RFXG4gICAgICAgID8gKHMpID0+IF9mcm9tVWludDhBcnJheShfVEUuZW5jb2RlKHMpKVxuICAgICAgICA6IChzKSA9PiBfYnRvYSh1dG9iKHMpKTtcbi8qKlxuICogY29udmVydHMgYSBVVEYtOC1lbmNvZGVkIHN0cmluZyB0byBhIEJhc2U2NCBzdHJpbmcuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1cmxzYWZlXSBpZiBgdHJ1ZWAgbWFrZSB0aGUgcmVzdWx0IFVSTC1zYWZlXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBCYXNlNjQgc3RyaW5nXG4gKi9cbmNvbnN0IGVuY29kZSA9IChzcmMsIHVybHNhZmUgPSBmYWxzZSkgPT4gdXJsc2FmZVxuICAgID8gX21rVXJpU2FmZShfZW5jb2RlKHNyYykpXG4gICAgOiBfZW5jb2RlKHNyYyk7XG4vKipcbiAqIGNvbnZlcnRzIGEgVVRGLTgtZW5jb2RlZCBzdHJpbmcgdG8gVVJMLXNhZmUgQmFzZTY0IFJGQzQ2NDggXHUwMEE3NS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IEJhc2U2NCBzdHJpbmdcbiAqL1xuY29uc3QgZW5jb2RlVVJJID0gKHNyYykgPT4gZW5jb2RlKHNyYywgdHJ1ZSk7XG4vLyBUaGlzIHRyaWNrIGlzIGZvdW5kIGJyb2tlbiBodHRwczovL2dpdGh1Yi5jb20vZGFua29nYWkvanMtYmFzZTY0L2lzc3Vlcy8xMzBcbi8vIGNvbnN0IGJ0b3UgPSAoc3JjOiBzdHJpbmcpID0+IGRlY29kZVVSSUNvbXBvbmVudChlc2NhcGUoc3JjKSk7XG4vLyByZXZlcnRpbmcgZ29vZCBvbGQgZmF0aW9uZWQgcmVnZXhwXG5jb25zdCByZV9idG91ID0gL1tcXHhDMC1cXHhERl1bXFx4ODAtXFx4QkZdfFtcXHhFMC1cXHhFRl1bXFx4ODAtXFx4QkZdezJ9fFtcXHhGMC1cXHhGN11bXFx4ODAtXFx4QkZdezN9L2c7XG5jb25zdCBjYl9idG91ID0gKGNjY2MpID0+IHtcbiAgICBzd2l0Y2ggKGNjY2MubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHZhciBjcCA9ICgoMHgwNyAmIGNjY2MuY2hhckNvZGVBdCgwKSkgPDwgMTgpXG4gICAgICAgICAgICAgICAgfCAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpIDw8IDEyKVxuICAgICAgICAgICAgICAgIHwgKCgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDIpKSA8PCA2KVxuICAgICAgICAgICAgICAgIHwgKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMykpLCBvZmZzZXQgPSBjcCAtIDB4MTAwMDA7XG4gICAgICAgICAgICByZXR1cm4gKF9mcm9tQ0MoKG9mZnNldCA+Pj4gMTApICsgMHhEODAwKVxuICAgICAgICAgICAgICAgICsgX2Zyb21DQygob2Zmc2V0ICYgMHgzRkYpICsgMHhEQzAwKSk7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBfZnJvbUNDKCgoMHgwZiAmIGNjY2MuY2hhckNvZGVBdCgwKSkgPDwgMTIpXG4gICAgICAgICAgICAgICAgfCAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpIDw8IDYpXG4gICAgICAgICAgICAgICAgfCAoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgyKSkpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIF9mcm9tQ0MoKCgweDFmICYgY2NjYy5jaGFyQ29kZUF0KDApKSA8PCA2KVxuICAgICAgICAgICAgICAgIHwgKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpKTtcbiAgICB9XG59O1xuLyoqXG4gKiBAZGVwcmVjYXRlZCBzaG91bGQgaGF2ZSBiZWVuIGludGVybmFsIHVzZSBvbmx5LlxuICogQHBhcmFtIHtzdHJpbmd9IHNyYyBVVEYtMTYgc3RyaW5nXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBVVEYtOCBzdHJpbmdcbiAqL1xuY29uc3QgYnRvdSA9IChiKSA9PiBiLnJlcGxhY2UocmVfYnRvdSwgY2JfYnRvdSk7XG4vKipcbiAqIHBvbHlmaWxsIHZlcnNpb24gb2YgYGF0b2JgXG4gKi9cbmNvbnN0IGF0b2JQb2x5ZmlsbCA9IChhc2MpID0+IHtcbiAgICAvLyBjb25zb2xlLmxvZygncG9seWZpbGxlZCcpO1xuICAgIGFzYyA9IGFzYy5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgICBpZiAoIWI2NHJlLnRlc3QoYXNjKSlcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbWFsZm9ybWVkIGJhc2U2NC4nKTtcbiAgICBhc2MgKz0gJz09Jy5zbGljZSgyIC0gKGFzYy5sZW5ndGggJiAzKSk7XG4gICAgbGV0IHUyNCwgYmluID0gJycsIHIxLCByMjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzYy5sZW5ndGg7KSB7XG4gICAgICAgIHUyNCA9IGI2NHRhYlthc2MuY2hhckF0KGkrKyldIDw8IDE4XG4gICAgICAgICAgICB8IGI2NHRhYlthc2MuY2hhckF0KGkrKyldIDw8IDEyXG4gICAgICAgICAgICB8IChyMSA9IGI2NHRhYlthc2MuY2hhckF0KGkrKyldKSA8PCA2XG4gICAgICAgICAgICB8IChyMiA9IGI2NHRhYlthc2MuY2hhckF0KGkrKyldKTtcbiAgICAgICAgYmluICs9IHIxID09PSA2NCA/IF9mcm9tQ0ModTI0ID4+IDE2ICYgMjU1KVxuICAgICAgICAgICAgOiByMiA9PT0gNjQgPyBfZnJvbUNDKHUyNCA+PiAxNiAmIDI1NSwgdTI0ID4+IDggJiAyNTUpXG4gICAgICAgICAgICAgICAgOiBfZnJvbUNDKHUyNCA+PiAxNiAmIDI1NSwgdTI0ID4+IDggJiAyNTUsIHUyNCAmIDI1NSk7XG4gICAgfVxuICAgIHJldHVybiBiaW47XG59O1xuLyoqXG4gKiBkb2VzIHdoYXQgYHdpbmRvdy5hdG9iYCBvZiB3ZWIgYnJvd3NlcnMgZG8uXG4gKiBAcGFyYW0ge1N0cmluZ30gYXNjIEJhc2U2NC1lbmNvZGVkIHN0cmluZ1xuICogQHJldHVybnMge3N0cmluZ30gYmluYXJ5IHN0cmluZ1xuICovXG5jb25zdCBfYXRvYiA9IHR5cGVvZiBhdG9iID09PSAnZnVuY3Rpb24nID8gKGFzYykgPT4gYXRvYihfdGlkeUI2NChhc2MpKVxuICAgIDogX2hhc0J1ZmZlciA/IChhc2MpID0+IEJ1ZmZlci5mcm9tKGFzYywgJ2Jhc2U2NCcpLnRvU3RyaW5nKCdiaW5hcnknKVxuICAgICAgICA6IGF0b2JQb2x5ZmlsbDtcbi8vXG5jb25zdCBfdG9VaW50OEFycmF5ID0gX2hhc0J1ZmZlclxuICAgID8gKGEpID0+IF9VOEFmcm9tKEJ1ZmZlci5mcm9tKGEsICdiYXNlNjQnKSlcbiAgICA6IChhKSA9PiBfVThBZnJvbShfYXRvYihhKS5zcGxpdCgnJykubWFwKGMgPT4gYy5jaGFyQ29kZUF0KDApKSk7XG4vKipcbiAqIGNvbnZlcnRzIGEgQmFzZTY0IHN0cmluZyB0byBhIFVpbnQ4QXJyYXkuXG4gKi9cbmNvbnN0IHRvVWludDhBcnJheSA9IChhKSA9PiBfdG9VaW50OEFycmF5KF91blVSSShhKSk7XG4vL1xuY29uc3QgX2RlY29kZSA9IF9oYXNCdWZmZXJcbiAgICA/IChhKSA9PiBCdWZmZXIuZnJvbShhLCAnYmFzZTY0JykudG9TdHJpbmcoJ3V0ZjgnKVxuICAgIDogX1REXG4gICAgICAgID8gKGEpID0+IF9URC5kZWNvZGUoX3RvVWludDhBcnJheShhKSlcbiAgICAgICAgOiAoYSkgPT4gYnRvdShfYXRvYihhKSk7XG5jb25zdCBfdW5VUkkgPSAoYSkgPT4gX3RpZHlCNjQoYS5yZXBsYWNlKC9bLV9dL2csIChtMCkgPT4gbTAgPT0gJy0nID8gJysnIDogJy8nKSk7XG4vKipcbiAqIGNvbnZlcnRzIGEgQmFzZTY0IHN0cmluZyB0byBhIFVURi04IHN0cmluZy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgQmFzZTY0IHN0cmluZy4gIEJvdGggbm9ybWFsIGFuZCBVUkwtc2FmZSBhcmUgc3VwcG9ydGVkXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBVVEYtOCBzdHJpbmdcbiAqL1xuY29uc3QgZGVjb2RlID0gKHNyYykgPT4gX2RlY29kZShfdW5VUkkoc3JjKSk7XG4vKipcbiAqIGNoZWNrIGlmIGEgdmFsdWUgaXMgYSB2YWxpZCBCYXNlNjQgc3RyaW5nXG4gKiBAcGFyYW0ge1N0cmluZ30gc3JjIGEgdmFsdWUgdG8gY2hlY2tcbiAgKi9cbmNvbnN0IGlzVmFsaWQgPSAoc3JjKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBzcmMgIT09ICdzdHJpbmcnKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgcyA9IHNyYy5yZXBsYWNlKC9cXHMrL2csICcnKS5yZXBsYWNlKC89ezAsMn0kLywgJycpO1xuICAgIHJldHVybiAhL1teXFxzMC05YS16QS1aXFwrL10vLnRlc3QocykgfHwgIS9bXlxcczAtOWEtekEtWlxcLV9dLy50ZXN0KHMpO1xufTtcbi8vXG5jb25zdCBfbm9FbnVtID0gKHYpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdiwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWVcbiAgICB9O1xufTtcbi8qKlxuICogZXh0ZW5kIFN0cmluZy5wcm90b3R5cGUgd2l0aCByZWxldmFudCBtZXRob2RzXG4gKi9cbmNvbnN0IGV4dGVuZFN0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBfYWRkID0gKG5hbWUsIGJvZHkpID0+IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJpbmcucHJvdG90eXBlLCBuYW1lLCBfbm9FbnVtKGJvZHkpKTtcbiAgICBfYWRkKCdmcm9tQmFzZTY0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVjb2RlKHRoaXMpOyB9KTtcbiAgICBfYWRkKCd0b0Jhc2U2NCcsIGZ1bmN0aW9uICh1cmxzYWZlKSB7IHJldHVybiBlbmNvZGUodGhpcywgdXJsc2FmZSk7IH0pO1xuICAgIF9hZGQoJ3RvQmFzZTY0VVJJJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZW5jb2RlKHRoaXMsIHRydWUpOyB9KTtcbiAgICBfYWRkKCd0b0Jhc2U2NFVSTCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVuY29kZSh0aGlzLCB0cnVlKTsgfSk7XG4gICAgX2FkZCgndG9VaW50OEFycmF5JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gdG9VaW50OEFycmF5KHRoaXMpOyB9KTtcbn07XG4vKipcbiAqIGV4dGVuZCBVaW50OEFycmF5LnByb3RvdHlwZSB3aXRoIHJlbGV2YW50IG1ldGhvZHNcbiAqL1xuY29uc3QgZXh0ZW5kVWludDhBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBfYWRkID0gKG5hbWUsIGJvZHkpID0+IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShVaW50OEFycmF5LnByb3RvdHlwZSwgbmFtZSwgX25vRW51bShib2R5KSk7XG4gICAgX2FkZCgndG9CYXNlNjQnLCBmdW5jdGlvbiAodXJsc2FmZSkgeyByZXR1cm4gZnJvbVVpbnQ4QXJyYXkodGhpcywgdXJsc2FmZSk7IH0pO1xuICAgIF9hZGQoJ3RvQmFzZTY0VVJJJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZnJvbVVpbnQ4QXJyYXkodGhpcywgdHJ1ZSk7IH0pO1xuICAgIF9hZGQoJ3RvQmFzZTY0VVJMJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZnJvbVVpbnQ4QXJyYXkodGhpcywgdHJ1ZSk7IH0pO1xufTtcbi8qKlxuICogZXh0ZW5kIEJ1aWx0aW4gcHJvdG90eXBlcyB3aXRoIHJlbGV2YW50IG1ldGhvZHNcbiAqL1xuY29uc3QgZXh0ZW5kQnVpbHRpbnMgPSAoKSA9PiB7XG4gICAgZXh0ZW5kU3RyaW5nKCk7XG4gICAgZXh0ZW5kVWludDhBcnJheSgpO1xufTtcbmNvbnN0IGdCYXNlNjQgPSB7XG4gICAgdmVyc2lvbjogdmVyc2lvbixcbiAgICBWRVJTSU9OOiBWRVJTSU9OLFxuICAgIGF0b2I6IF9hdG9iLFxuICAgIGF0b2JQb2x5ZmlsbDogYXRvYlBvbHlmaWxsLFxuICAgIGJ0b2E6IF9idG9hLFxuICAgIGJ0b2FQb2x5ZmlsbDogYnRvYVBvbHlmaWxsLFxuICAgIGZyb21CYXNlNjQ6IGRlY29kZSxcbiAgICB0b0Jhc2U2NDogZW5jb2RlLFxuICAgIGVuY29kZTogZW5jb2RlLFxuICAgIGVuY29kZVVSSTogZW5jb2RlVVJJLFxuICAgIGVuY29kZVVSTDogZW5jb2RlVVJJLFxuICAgIHV0b2I6IHV0b2IsXG4gICAgYnRvdTogYnRvdSxcbiAgICBkZWNvZGU6IGRlY29kZSxcbiAgICBpc1ZhbGlkOiBpc1ZhbGlkLFxuICAgIGZyb21VaW50OEFycmF5OiBmcm9tVWludDhBcnJheSxcbiAgICB0b1VpbnQ4QXJyYXk6IHRvVWludDhBcnJheSxcbiAgICBleHRlbmRTdHJpbmc6IGV4dGVuZFN0cmluZyxcbiAgICBleHRlbmRVaW50OEFycmF5OiBleHRlbmRVaW50OEFycmF5LFxuICAgIGV4dGVuZEJ1aWx0aW5zOiBleHRlbmRCdWlsdGluc1xufTtcbi8vIG1ha2VjanM6Q1VUIC8vXG5leHBvcnQgeyB2ZXJzaW9uIH07XG5leHBvcnQgeyBWRVJTSU9OIH07XG5leHBvcnQgeyBfYXRvYiBhcyBhdG9iIH07XG5leHBvcnQgeyBhdG9iUG9seWZpbGwgfTtcbmV4cG9ydCB7IF9idG9hIGFzIGJ0b2EgfTtcbmV4cG9ydCB7IGJ0b2FQb2x5ZmlsbCB9O1xuZXhwb3J0IHsgZGVjb2RlIGFzIGZyb21CYXNlNjQgfTtcbmV4cG9ydCB7IGVuY29kZSBhcyB0b0Jhc2U2NCB9O1xuZXhwb3J0IHsgdXRvYiB9O1xuZXhwb3J0IHsgZW5jb2RlIH07XG5leHBvcnQgeyBlbmNvZGVVUkkgfTtcbmV4cG9ydCB7IGVuY29kZVVSSSBhcyBlbmNvZGVVUkwgfTtcbmV4cG9ydCB7IGJ0b3UgfTtcbmV4cG9ydCB7IGRlY29kZSB9O1xuZXhwb3J0IHsgaXNWYWxpZCB9O1xuZXhwb3J0IHsgZnJvbVVpbnQ4QXJyYXkgfTtcbmV4cG9ydCB7IHRvVWludDhBcnJheSB9O1xuZXhwb3J0IHsgZXh0ZW5kU3RyaW5nIH07XG5leHBvcnQgeyBleHRlbmRVaW50OEFycmF5IH07XG5leHBvcnQgeyBleHRlbmRCdWlsdGlucyB9O1xuLy8gYW5kIGZpbmFsbHksXG5leHBvcnQgeyBnQmFzZTY0IGFzIEJhc2U2NCB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUEsdUJBQUFBO0FBQUEsSUFBQSwyQkFBQUM7QUFBQSxJQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ2NPLE1BQU0sU0FBUyxNQUFNLG9CQUFJLElBQUk7QUFVN0IsTUFBTSxPQUFPLE9BQUs7QUFDdkIsVUFBTSxJQUFJLE9BQU87QUFDakIsTUFBRSxRQUFRLENBQUMsR0FBRyxNQUFNO0FBQUUsUUFBRSxJQUFJLEdBQUcsQ0FBQztBQUFBLElBQUUsQ0FBQztBQUNuQyxXQUFPO0FBQUEsRUFDVDtBQWtCTyxNQUFNLGlCQUFpQixDQUFDQyxNQUFLLEtBQUssWUFBWTtBQUNuRCxRQUFJLE1BQU1BLEtBQUksSUFBSSxHQUFHO0FBQ3JCLFFBQUksUUFBUSxRQUFXO0FBQ3JCLE1B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QVEsc0JBQXNCRixNQUFLSSxZQUFXO0FBQ2xELFdBQU8sZUFBZSxHQUFHO0FBQUEsRUFDN0I7QUFFTyxNQUFNLGNBQWMsTUFBTTtBQUM3QixXQUFPLGVBQWlCLGtCQUFrQkosSUFBRyxDQUFDO0FBQUEsRUFDbEQ7QUFFTyxNQUFNLFdBQVcsTUFBTTtBQUMxQixRQUFJLFNBQVM7QUFDVCxhQUFPLEtBQUssVUFBVSxLQUFLLE9BQU8sQ0FBQztBQUFBLElBQ3ZDLE9BQU87QUFDSCxhQUFPLEtBQUssU0FBUztBQUFBLElBQ3pCO0FBQUEsRUFDSjtBQUlPLE1BQU0sU0FBUyxNQUFNO0FBQ3hCLFNBQUssT0FBTyxnQkFBZ0IsVUFBVTtBQUFBLEVBQzFDOyIsCiAgIm5hbWVzIjogWyJhcHBseVVwZGF0ZSIsICJlbmNvZGVTdGF0ZUFzVXBkYXRlIiwgIm1hcCIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImFyZ3MiLCAiaXNOYU4iLCAia2V5cyIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImlkIiwgImxlbmd0aCIsICJpIiwgImNyZWF0ZSIsICJjcmVhdGUiLCAiZG9jIiwgImFyZ3MiLCAiaWQiLCAiYW55IiwgImRvYyIsICJpIiwgImRvYyIsICJkb2MiLCAic25hcHNob3QiLCAiY3JlYXRlIiwgImlkIiwgImNyZWF0ZSIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImFyZ3MiLCAiY3JlYXRlIiwgImFyZ3MiLCAic3R5bGUiLCAiY3JlYXRlIiwgImRvYyIsICJjcmVhdGUiLCAic3RydWN0IiwgImRvYyIsICJpIiwgImhhc0NvbnRlbnQiLCAiaSIsICJjcmVhdGUiLCAia2V5cyIsICJkb2MiLCAiY3JlYXRlIiwgImxlbmd0aCIsICJzbmFwc2hvdCIsICJsZW5ndGgiLCAibWFwIiwgImRvYyIsICJpbnNlcnRUZXh0IiwgInRleHQiLCAibGVuZ3RoIiwgImluc2VydCIsICJzbmFwc2hvdCIsICJyb290IiwgImVsZW1lbnQiLCAiY3JlYXRlIiwgImxlbmd0aCIsICJrZXlzIiwgInNuYXBzaG90IiwgInRleHQiLCAiaWQiLCAibGVuZ3RoIiwgImRvYyIsICJpdGVtIiwgImlkIiwgInRhcmdldFZhbHVlIiwgIm1hbmFnZWRUeXBlIiwgIm1hcCIsICJ0b1VpbnQ4QXJyYXkiLCAiZG9jIiwgImFwcGx5VXBkYXRlIiwgInRvVWludDhBcnJheSIsICJlbmNvZGVTdGF0ZUFzVXBkYXRlIiwgInN0YXRlVmVjdG9yIl0KfQo=
