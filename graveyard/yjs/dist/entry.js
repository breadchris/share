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

  // ../node_modules/lib0/map.js
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

  // ../node_modules/lib0/set.js
  var create2 = () => /* @__PURE__ */ new Set();

  // ../node_modules/lib0/array.js
  var last = (arr) => arr[arr.length - 1];
  var appendTo = (dest, src) => {
    for (let i = 0; i < src.length; i++) {
      dest.push(src[i]);
    }
  };
  var from = Array.from;
  var isArray = Array.isArray;

  // ../node_modules/lib0/observable.js
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

  // ../node_modules/lib0/math.js
  var floor = Math.floor;
  var abs = Math.abs;
  var min = (a, b) => a < b ? a : b;
  var max = (a, b) => a > b ? a : b;
  var isNaN = Number.isNaN;
  var isNegativeZero = (n) => n !== 0 ? n < 0 : 1 / n < 0;

  // ../node_modules/lib0/binary.js
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

  // ../node_modules/lib0/number.js
  var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
  var LOWEST_INT32 = 1 << 31;
  var isInteger = Number.isInteger || ((num) => typeof num === "number" && isFinite(num) && floor(num) === num);
  var isNaN2 = Number.isNaN;
  var parseInt = Number.parseInt;

  // ../node_modules/lib0/string.js
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

  // ../node_modules/lib0/encoding.js
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

  // ../node_modules/lib0/error.js
  var create3 = (s) => new Error(s);
  var methodUnimplemented = () => {
    throw create3("Method unimplemented");
  };
  var unexpectedCase = () => {
    throw create3("Unexpected case");
  };

  // ../node_modules/lib0/decoding.js
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

  // ../node_modules/lib0/time.js
  var getUnixTime = Date.now;

  // ../node_modules/lib0/promise.js
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

  // ../node_modules/lib0/conditions.js
  var undefinedToNull = (v) => v === void 0 ? null : v;

  // ../node_modules/lib0/storage.js
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

  // ../node_modules/lib0/object.js
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

  // ../node_modules/lib0/function.js
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

  // ../node_modules/lib0/environment.js
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

  // ../node_modules/lib0/buffer.js
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

  // ../node_modules/lib0/pair.js
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

  // ../node_modules/lib0/dom.js
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

  // ../node_modules/lib0/symbol.js
  var create6 = Symbol;

  // ../node_modules/lib0/logging.common.js
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

  // ../node_modules/lib0/logging.js
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

  // ../node_modules/lib0/iterator.js
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
      isDevMode && (void 0)(arr);
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

  // ../node_modules/js-base64/base64.mjs
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vZW50cnkuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvbWFwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL3NldC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC9hcnJheS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC9vYnNlcnZhYmxlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL21hdGguanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvYmluYXJ5LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL251bWJlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC9zdHJpbmcuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvZW5jb2RpbmcuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvZXJyb3IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvZGVjb2RpbmcuanMiLCAiLi4vc3JjL3V0aWxzL0RlbGV0ZVNldC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC90aW1lLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL3Byb21pc2UuanMiLCAiLi4vc3JjL3V0aWxzL0RvYy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC9jb25kaXRpb25zLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL3N0b3JhZ2UuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvb2JqZWN0LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2Z1bmN0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2Vudmlyb25tZW50LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2J1ZmZlci5qcyIsICIuLi9zcmMvdXRpbHMvVXBkYXRlRGVjb2Rlci5qcyIsICIuLi9zcmMvdXRpbHMvVXBkYXRlRW5jb2Rlci5qcyIsICIuLi9zcmMvdXRpbHMvZW5jb2RpbmcuanMiLCAiLi4vc3JjL3V0aWxzL0V2ZW50SGFuZGxlci5qcyIsICIuLi9zcmMvdXRpbHMvSUQuanMiLCAiLi4vc3JjL3V0aWxzL1NuYXBzaG90LmpzIiwgIi4uL3NyYy91dGlscy9TdHJ1Y3RTdG9yZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC9wYWlyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9saWIwL2RvbS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC9zeW1ib2wuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5jb21tb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5qcyIsICIuLi9zcmMvdXRpbHMvVHJhbnNhY3Rpb24uanMiLCAiLi4vc3JjL3V0aWxzL3VwZGF0ZXMuanMiLCAiLi4vc3JjL3V0aWxzL1lFdmVudC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGliMC9pdGVyYXRvci5qcyIsICIuLi9zcmMvdHlwZXMvQWJzdHJhY3RUeXBlLmpzIiwgIi4uL3NyYy90eXBlcy9ZQXJyYXkuanMiLCAiLi4vc3JjL3R5cGVzL1lNYXAuanMiLCAiLi4vc3JjL3R5cGVzL1lUZXh0LmpzIiwgIi4uL3NyYy90eXBlcy9ZWG1sRnJhZ21lbnQuanMiLCAiLi4vc3JjL3R5cGVzL1lYbWxFbGVtZW50LmpzIiwgIi4uL3NyYy90eXBlcy9ZWG1sRXZlbnQuanMiLCAiLi4vc3JjL3R5cGVzL1lYbWxIb29rLmpzIiwgIi4uL3NyYy90eXBlcy9ZWG1sVGV4dC5qcyIsICIuLi9zcmMvc3RydWN0cy9BYnN0cmFjdFN0cnVjdC5qcyIsICIuLi9zcmMvc3RydWN0cy9HQy5qcyIsICIuLi9zcmMvc3RydWN0cy9Db250ZW50QmluYXJ5LmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnREZWxldGVkLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnREb2MuanMiLCAiLi4vc3JjL3N0cnVjdHMvQ29udGVudEVtYmVkLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnRGb3JtYXQuanMiLCAiLi4vc3JjL3N0cnVjdHMvQ29udGVudEpTT04uanMiLCAiLi4vc3JjL3N0cnVjdHMvQ29udGVudEFueS5qcyIsICIuLi9zcmMvc3RydWN0cy9Db250ZW50U3RyaW5nLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0NvbnRlbnRUeXBlLmpzIiwgIi4uL3NyYy9zdHJ1Y3RzL0l0ZW0uanMiLCAiLi4vc3JjL3N0cnVjdHMvU2tpcC5qcyIsICIuLi9zcmMvaW5kZXguanMiLCAiLi4vc3JjL3ktcG9qby50cyIsICIuLi8uLi9ub2RlX21vZHVsZXMvanMtYmFzZTY0L2Jhc2U2NC5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIFkgZnJvbSAnLi9zcmMnXG5pbXBvcnQge3N5bmNyb25pemV9IGZyb20gJy4vc3JjL3ktcG9qbydcbmltcG9ydCB7IGZyb21VaW50OEFycmF5LCB0b1VpbnQ4QXJyYXkgfSBmcm9tICdqcy1iYXNlNjQnXG5cbnZhciBkb2NcbnZhciByb290XG5cbmV4cG9ydCBjb25zdCBpbml0aWFsaXplID0gKCkgPT4ge1xuICAgIGRvYyA9IG5ldyBZLkRvYygpXG4gICAgaWYgKGNvbXBsZXgpIHtcbiAgICAgICAgcm9vdCA9IGRvYy5nZXRNYXAoXCJyXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdCA9IGRvYy5nZXRUZXh0KFwidFwiKVxuICAgIH1cblxuICAgIGlmICghY29tcGxleCAmJiBkb2N1bWVudFRleHQgJiYgZG9jdW1lbnRUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgcm9vdC5pbnNlcnQoMCwgZG9jdW1lbnRUZXh0KVxuICAgIH0gZWxzZSBpZiAoY29tcGxleCAmJiBkb2N1bWVudE9iamVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN5bmNyb25pemUocm9vdCwgSlNPTi5wYXJzZShkb2N1bWVudE9iamVjdCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIFwiaW5pdGlhbGl6ZWRcIlxufVxuXG5leHBvcnQgY29uc3QgYXBwbHlVcGRhdGUgPSAoKSA9PiB7XG4gICAgbGV0IGRhdGEgPSB0b1VpbnQ4QXJyYXkoZW5jb2RlZFVwZGF0ZSlcbiAgICBZLmFwcGx5VXBkYXRlVjIoZG9jLCBkYXRhKVxuXG4gICAgcmV0dXJuIFwiaGVsbG9cIlxufVxuXG5leHBvcnQgY29uc3QgZW5jb2RlU3RhdGVBc1VwZGF0ZSA9ICgpID0+IHtcbiAgICBsZXQgc3RhdGVWZWN0b3IgPSB1bmRlZmluZWRcbiAgICBpZiAoZW5jb2RlZFN0YXRlVmVjdG9yICYmIGVuY29kZWRTdGF0ZVZlY3Rvci5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN0YXRlVmVjdG9yID0gdG9VaW50OEFycmF5KGVuY29kZWRTdGF0ZVZlY3RvcilcbiAgICB9XG4gICAgbGV0IGFyciA9IFkuZW5jb2RlU3RhdGVBc1VwZGF0ZVYyKGRvYywgc3RhdGVWZWN0b3IpXG4gICAgcmV0dXJuIGZyb21VaW50OEFycmF5KGFycilcbn1cblxuZXhwb3J0IGNvbnN0IHN0YXRlVmVjdG9yID0gKCkgPT4ge1xuICAgIHJldHVybiBmcm9tVWludDhBcnJheShZLmVuY29kZVN0YXRlVmVjdG9yKGRvYykpXG59XG5cbmV4cG9ydCBjb25zdCB0b1N0cmluZyA9ICgpID0+IHtcbiAgICBpZiAoY29tcGxleCkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocm9vdC50b0pTT04oKSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcm9vdC50b1N0cmluZygpXG4gICAgfVxufVxuXG4vLyBTZXJ2ZXIgZG9lc24ndCBhY3R1YWxseSBtb2RpZnkgdGhlIGRvY3VtZW50LCB0aGVzZSBhcmUgZm9yIHRlc3RpbmdcblxuZXhwb3J0IGNvbnN0IGluc2VydCA9ICgpID0+IHtcbiAgICByb290Lmluc2VydChpbnNlcnRQb3NpdGlvbiwgaW5zZXJ0VGV4dClcbn0iLCAiLyoqXG4gKiBVdGlsaXR5IG1vZHVsZSB0byB3b3JrIHdpdGgga2V5LXZhbHVlIHN0b3Jlcy5cbiAqXG4gKiBAbW9kdWxlIG1hcFxuICovXG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBNYXAgaW5zdGFuY2UuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtNYXA8YW55LCBhbnk+fVxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gbmV3IE1hcCgpXG5cbi8qKlxuICogQ29weSBhIE1hcCBvYmplY3QgaW50byBhIGZyZXNoIE1hcCBvYmplY3QuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAdGVtcGxhdGUgSyxWXG4gKiBAcGFyYW0ge01hcDxLLFY+fSBtXG4gKiBAcmV0dXJuIHtNYXA8SyxWPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNvcHkgPSBtID0+IHtcbiAgY29uc3QgciA9IGNyZWF0ZSgpXG4gIG0uZm9yRWFjaCgodiwgaykgPT4geyByLnNldChrLCB2KSB9KVxuICByZXR1cm4gclxufVxuXG4vKipcbiAqIEdldCBtYXAgcHJvcGVydHkuIENyZWF0ZSBUIGlmIHByb3BlcnR5IGlzIHVuZGVmaW5lZCBhbmQgc2V0IFQgb24gbWFwLlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBsaXN0ZW5lcnMgPSBtYXAuc2V0SWZVbmRlZmluZWQoZXZlbnRzLCAnZXZlbnROYW1lJywgc2V0LmNyZWF0ZSlcbiAqIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpXG4gKiBgYGBcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7TWFwPGFueSwgYW55Pn0gTUFQXG4gKiBAdGVtcGxhdGUge01BUCBleHRlbmRzIE1hcDxhbnksaW5mZXIgVj4gPyBmdW5jdGlvbigpOlYgOiB1bmtub3dufSBDRlxuICogQHBhcmFtIHtNQVB9IG1hcFxuICogQHBhcmFtIHtNQVAgZXh0ZW5kcyBNYXA8aW5mZXIgSyxhbnk+ID8gSyA6IHVua25vd259IGtleVxuICogQHBhcmFtIHtDRn0gY3JlYXRlVFxuICogQHJldHVybiB7UmV0dXJuVHlwZTxDRj59XG4gKi9cbmV4cG9ydCBjb25zdCBzZXRJZlVuZGVmaW5lZCA9IChtYXAsIGtleSwgY3JlYXRlVCkgPT4ge1xuICBsZXQgc2V0ID0gbWFwLmdldChrZXkpXG4gIGlmIChzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIG1hcC5zZXQoa2V5LCBzZXQgPSBjcmVhdGVUKCkpXG4gIH1cbiAgcmV0dXJuIHNldFxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gQXJyYXkgYW5kIHBvcHVsYXRlcyBpdCB3aXRoIHRoZSBjb250ZW50IG9mIGFsbCBrZXktdmFsdWUgcGFpcnMgdXNpbmcgdGhlIGBmKHZhbHVlLCBrZXkpYCBmdW5jdGlvbi5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLXG4gKiBAdGVtcGxhdGUgVlxuICogQHRlbXBsYXRlIFJcbiAqIEBwYXJhbSB7TWFwPEssVj59IG1cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oVixLKTpSfSBmXG4gKiBAcmV0dXJuIHtBcnJheTxSPn1cbiAqL1xuZXhwb3J0IGNvbnN0IG1hcCA9IChtLCBmKSA9PiB7XG4gIGNvbnN0IHJlcyA9IFtdXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG0pIHtcbiAgICByZXMucHVzaChmKHZhbHVlLCBrZXkpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBUZXN0cyB3aGV0aGVyIGFueSBrZXktdmFsdWUgcGFpcnMgcGFzcyB0aGUgdGVzdCBpbXBsZW1lbnRlZCBieSBgZih2YWx1ZSwga2V5KWAuXG4gKlxuICogQHRvZG8gc2hvdWxkIHJlbmFtZSB0byBzb21lIC0gc2ltaWxhcmx5IHRvIEFycmF5LnNvbWVcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHtNYXA8SyxWPn0gbVxuICogQHBhcmFtIHtmdW5jdGlvbihWLEspOmJvb2xlYW59IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBhbnkgPSAobSwgZikgPT4ge1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBtKSB7XG4gICAgaWYgKGYodmFsdWUsIGtleSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIFRlc3RzIHdoZXRoZXIgYWxsIGtleS12YWx1ZSBwYWlycyBwYXNzIHRoZSB0ZXN0IGltcGxlbWVudGVkIGJ5IGBmKHZhbHVlLCBrZXkpYC5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHtNYXA8SyxWPn0gbVxuICogQHBhcmFtIHtmdW5jdGlvbihWLEspOmJvb2xlYW59IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBhbGwgPSAobSwgZikgPT4ge1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBtKSB7XG4gICAgaWYgKCFmKHZhbHVlLCBrZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBzZXRzLlxuICpcbiAqIEBtb2R1bGUgc2V0XG4gKi9cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9ICgpID0+IG5ldyBTZXQoKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1NldDxUPn0gc2V0XG4gKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHRvQXJyYXkgPSBzZXQgPT4gQXJyYXkuZnJvbShzZXQpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7U2V0PFQ+fSBzZXRcbiAqIEByZXR1cm4ge1R9XG4gKi9cbmV4cG9ydCBjb25zdCBmaXJzdCA9IHNldCA9PlxuICBzZXQudmFsdWVzKCkubmV4dCgpLnZhbHVlID8/IHVuZGVmaW5lZFxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0l0ZXJhYmxlPFQ+fSBlbnRyaWVzXG4gKiBAcmV0dXJuIHtTZXQ8VD59XG4gKi9cbmV4cG9ydCBjb25zdCBmcm9tID0gZW50cmllcyA9PiBuZXcgU2V0KGVudHJpZXMpXG4iLCAiLyoqXG4gKiBVdGlsaXR5IG1vZHVsZSB0byB3b3JrIHdpdGggQXJyYXlzLlxuICpcbiAqIEBtb2R1bGUgYXJyYXlcbiAqL1xuXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnLi9zZXQuanMnXG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFRoZSBlbGVtZW50IG11c3QgZXhpc3RcbiAqXG4gKiBAdGVtcGxhdGUgTFxuICogQHBhcmFtIHtBcnJheUxpa2U8TD59IGFyclxuICogQHJldHVybiB7TH1cbiAqL1xuZXhwb3J0IGNvbnN0IGxhc3QgPSBhcnIgPT4gYXJyW2Fyci5sZW5ndGggLSAxXVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBDXG4gKiBAcmV0dXJuIHtBcnJheTxDPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9ICgpID0+IC8qKiBAdHlwZSB7QXJyYXk8Qz59ICovIChbXSlcblxuLyoqXG4gKiBAdGVtcGxhdGUgRFxuICogQHBhcmFtIHtBcnJheTxEPn0gYVxuICogQHJldHVybiB7QXJyYXk8RD59XG4gKi9cbmV4cG9ydCBjb25zdCBjb3B5ID0gYSA9PiAvKiogQHR5cGUge0FycmF5PEQ+fSAqLyAoYS5zbGljZSgpKVxuXG4vKipcbiAqIEFwcGVuZCBlbGVtZW50cyBmcm9tIHNyYyB0byBkZXN0XG4gKlxuICogQHRlbXBsYXRlIE1cbiAqIEBwYXJhbSB7QXJyYXk8TT59IGRlc3RcbiAqIEBwYXJhbSB7QXJyYXk8TT59IHNyY1xuICovXG5leHBvcnQgY29uc3QgYXBwZW5kVG8gPSAoZGVzdCwgc3JjKSA9PiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3JjLmxlbmd0aDsgaSsrKSB7XG4gICAgZGVzdC5wdXNoKHNyY1tpXSlcbiAgfVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgc29tZXRoaW5nIGFycmF5LWxpa2UgdG8gYW4gYWN0dWFsIEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7QXJyYXlMaWtlPFQ+fEl0ZXJhYmxlPFQ+fSBhcnJheWxpa2VcbiAqIEByZXR1cm4ge1R9XG4gKi9cbmV4cG9ydCBjb25zdCBmcm9tID0gQXJyYXkuZnJvbVxuXG4vKipcbiAqIFRydWUgaWZmIGNvbmRpdGlvbiBob2xkcyBvbiBldmVyeSBlbGVtZW50IGluIHRoZSBBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBJVEVNXG4gKiBAdGVtcGxhdGUge0FycmF5TGlrZTxJVEVNPn0gQVJSXG4gKlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtmdW5jdGlvbihJVEVNLCBudW1iZXIsIEFSUik6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGV2ZXJ5ID0gKGFyciwgZikgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmICghZihhcnJbaV0sIGksIGFycikpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFRydWUgaWZmIGNvbmRpdGlvbiBob2xkcyBvbiBzb21lIGVsZW1lbnQgaW4gdGhlIEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIFNcbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPFM+fSBBUlJcbiAqIEBwYXJhbSB7QVJSfSBhcnJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oUywgbnVtYmVyLCBBUlIpOmJvb2xlYW59IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBzb21lID0gKGFyciwgZikgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChmKGFycltpXSwgaSwgYXJyKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxFTEVNPn0gYVxuICogQHBhcmFtIHtBcnJheUxpa2U8RUxFTT59IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbEZsYXQgPSAoYSwgYikgPT4gYS5sZW5ndGggPT09IGIubGVuZ3RoICYmIGV2ZXJ5KGEsIChpdGVtLCBpbmRleCkgPT4gaXRlbSA9PT0gYltpbmRleF0pXG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqIEBwYXJhbSB7QXJyYXk8QXJyYXk8RUxFTT4+fSBhcnJcbiAqIEByZXR1cm4ge0FycmF5PEVMRU0+fVxuICovXG5leHBvcnQgY29uc3QgZmxhdHRlbiA9IGFyciA9PiBmb2xkKGFyciwgLyoqIEB0eXBlIHtBcnJheTxFTEVNPn0gKi8gKFtdKSwgKGFjYywgdmFsKSA9PiBhY2MuY29uY2F0KHZhbCkpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24obnVtYmVyLCBBcnJheTxUPik6VH0gZlxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmZvbGQgPSAobGVuLCBmKSA9PiB7XG4gIGNvbnN0IGFycmF5ID0gbmV3IEFycmF5KGxlbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGFycmF5W2ldID0gZihpLCBhcnJheSlcbiAgfVxuICByZXR1cm4gYXJyYXlcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHRlbXBsYXRlIFJFU1VMVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcGFyYW0ge1JFU1VMVH0gc2VlZFxuICogQHBhcmFtIHtmdW5jdGlvbihSRVNVTFQsIFQsIG51bWJlcik6UkVTVUxUfSBmb2xkZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGZvbGQgPSAoYXJyLCBzZWVkLCBmb2xkZXIpID0+IGFyci5yZWR1Y2UoZm9sZGVyLCBzZWVkKVxuXG5leHBvcnQgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVuaXF1ZSA9IGFyciA9PiBmcm9tKHNldC5mcm9tKGFycikpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEB0ZW1wbGF0ZSBNXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxUPn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFQpOk19IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmlxdWVCeSA9IChhcnIsIG1hcHBlcikgPT4ge1xuICAvKipcbiAgICogQHR5cGUge1NldDxNPn1cbiAgICovXG4gIGNvbnN0IGhhcHBlbmVkID0gc2V0LmNyZWF0ZSgpXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8VD59XG4gICAqL1xuICBjb25zdCByZXN1bHQgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVsID0gYXJyW2ldXG4gICAgY29uc3QgbWFwcGVkID0gbWFwcGVyKGVsKVxuICAgIGlmICghaGFwcGVuZWQuaGFzKG1hcHBlZCkpIHtcbiAgICAgIGhhcHBlbmVkLmFkZChtYXBwZWQpXG4gICAgICByZXN1bHQucHVzaChlbClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPGFueT59IEFSUlxuICogQHRlbXBsYXRlIHtmdW5jdGlvbihBUlIgZXh0ZW5kcyBBcnJheUxpa2U8aW5mZXIgVD4gPyBUIDogbmV2ZXIsIG51bWJlciwgQVJSKTphbnl9IE1BUFBFUlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtNQVBQRVJ9IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8TUFQUEVSIGV4dGVuZHMgZnVuY3Rpb24oLi4uYW55KTogaW5mZXIgTSA/IE0gOiBuZXZlcj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAoYXJyLCBtYXBwZXIpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgY29uc3QgcmVzID0gQXJyYXkoYXJyLmxlbmd0aClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICByZXNbaV0gPSBtYXBwZXIoLyoqIEB0eXBlIHthbnl9ICovIChhcnJbaV0pLCBpLCAvKiogQHR5cGUge2FueX0gKi8gKGFycikpXG4gIH1cbiAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAocmVzKVxufVxuIiwgIi8qKlxuICogT2JzZXJ2YWJsZSBjbGFzcyBwcm90b3R5cGUuXG4gKlxuICogQG1vZHVsZSBvYnNlcnZhYmxlXG4gKi9cblxuaW1wb3J0ICogYXMgbWFwIGZyb20gJy4vbWFwLmpzJ1xuaW1wb3J0ICogYXMgc2V0IGZyb20gJy4vc2V0LmpzJ1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnLi9hcnJheS5qcydcblxuLyoqXG4gKiBIYW5kbGVzIG5hbWVkIGV2ZW50cy5cbiAqIEBleHBlcmltZW50YWxcbiAqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBhIChiZXR0ZXIgdHlwZWQpIGR1cGxpY2F0ZSBvZiBPYnNlcnZhYmxlLCB3aGljaCB3aWxsIHJlcGxhY2UgT2JzZXJ2YWJsZSBpbiB0aGVcbiAqIG5leHQgcmVsZWFzZS5cbiAqXG4gKiBAdGVtcGxhdGUge3tba2V5IGluIGtleW9mIEVWRU5UU106IGZ1bmN0aW9uKC4uLmFueSk6dm9pZH19IEVWRU5UU1xuICovXG5leHBvcnQgY2xhc3MgT2JzZXJ2YWJsZVYyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIC8qKlxuICAgICAqIFNvbWUgZGVzYy5cbiAgICAgKiBAdHlwZSB7TWFwPHN0cmluZywgU2V0PGFueT4+fVxuICAgICAqL1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSB7a2V5b2YgRVZFTlRTICYgc3RyaW5nfSBOQU1FXG4gICAqIEBwYXJhbSB7TkFNRX0gbmFtZVxuICAgKiBAcGFyYW0ge0VWRU5UU1tOQU1FXX0gZlxuICAgKi9cbiAgb24gKG5hbWUsIGYpIHtcbiAgICBtYXAuc2V0SWZVbmRlZmluZWQodGhpcy5fb2JzZXJ2ZXJzLCAvKiogQHR5cGUge3N0cmluZ30gKi8gKG5hbWUpLCBzZXQuY3JlYXRlKS5hZGQoZilcbiAgICByZXR1cm4gZlxuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSB7a2V5b2YgRVZFTlRTICYgc3RyaW5nfSBOQU1FXG4gICAqIEBwYXJhbSB7TkFNRX0gbmFtZVxuICAgKiBAcGFyYW0ge0VWRU5UU1tOQU1FXX0gZlxuICAgKi9cbiAgb25jZSAobmFtZSwgZikge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSAgey4uLmFueX0gYXJnc1xuICAgICAqL1xuICAgIGNvbnN0IF9mID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMub2ZmKG5hbWUsIC8qKiBAdHlwZSB7YW55fSAqLyAoX2YpKVxuICAgICAgZiguLi5hcmdzKVxuICAgIH1cbiAgICB0aGlzLm9uKG5hbWUsIC8qKiBAdHlwZSB7YW55fSAqLyAoX2YpKVxuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSB7a2V5b2YgRVZFTlRTICYgc3RyaW5nfSBOQU1FXG4gICAqIEBwYXJhbSB7TkFNRX0gbmFtZVxuICAgKiBAcGFyYW0ge0VWRU5UU1tOQU1FXX0gZlxuICAgKi9cbiAgb2ZmIChuYW1lLCBmKSB7XG4gICAgY29uc3Qgb2JzZXJ2ZXJzID0gdGhpcy5fb2JzZXJ2ZXJzLmdldChuYW1lKVxuICAgIGlmIChvYnNlcnZlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgb2JzZXJ2ZXJzLmRlbGV0ZShmKVxuICAgICAgaWYgKG9ic2VydmVycy5zaXplID09PSAwKSB7XG4gICAgICAgIHRoaXMuX29ic2VydmVycy5kZWxldGUobmFtZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW1pdCBhIG5hbWVkIGV2ZW50LiBBbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMgdGhhdCBsaXN0ZW4gdG8gdGhlXG4gICAqIHNwZWNpZmllZCBuYW1lIHdpbGwgcmVjZWl2ZSB0aGUgZXZlbnQuXG4gICAqXG4gICAqIEB0b2RvIFRoaXMgc2hvdWxkIGNhdGNoIGV4Y2VwdGlvbnNcbiAgICpcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lIFRoZSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0ge1BhcmFtZXRlcnM8RVZFTlRTW05BTUVdPn0gYXJncyBUaGUgYXJndW1lbnRzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgZW1pdCAobmFtZSwgYXJncykge1xuICAgIC8vIGNvcHkgYWxsIGxpc3RlbmVycyB0byBhbiBhcnJheSBmaXJzdCB0byBtYWtlIHN1cmUgdGhhdCBubyBldmVudCBpcyBlbWl0dGVkIHRvIGxpc3RlbmVycyB0aGF0IGFyZSBzdWJzY3JpYmVkIHdoaWxlIHRoZSBldmVudCBoYW5kbGVyIGlzIGNhbGxlZC5cbiAgICByZXR1cm4gYXJyYXkuZnJvbSgodGhpcy5fb2JzZXJ2ZXJzLmdldChuYW1lKSB8fCBtYXAuY3JlYXRlKCkpLnZhbHVlcygpKS5mb3JFYWNoKGYgPT4gZiguLi5hcmdzKSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG59XG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBIYW5kbGVzIG5hbWVkIGV2ZW50cy5cbiAqXG4gKiBAZGVwcmVjYXRlZFxuICogQHRlbXBsYXRlIE5cbiAqL1xuZXhwb3J0IGNsYXNzIE9ic2VydmFibGUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogU29tZSBkZXNjLlxuICAgICAqIEB0eXBlIHtNYXA8TiwgYW55Pn1cbiAgICAgKi9cbiAgICB0aGlzLl9vYnNlcnZlcnMgPSBtYXAuY3JlYXRlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge059IG5hbWVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gZlxuICAgKi9cbiAgb24gKG5hbWUsIGYpIHtcbiAgICBtYXAuc2V0SWZVbmRlZmluZWQodGhpcy5fb2JzZXJ2ZXJzLCBuYW1lLCBzZXQuY3JlYXRlKS5hZGQoZilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge059IG5hbWVcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gZlxuICAgKi9cbiAgb25jZSAobmFtZSwgZikge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSAgey4uLmFueX0gYXJnc1xuICAgICAqL1xuICAgIGNvbnN0IF9mID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMub2ZmKG5hbWUsIF9mKVxuICAgICAgZiguLi5hcmdzKVxuICAgIH1cbiAgICB0aGlzLm9uKG5hbWUsIF9mKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmXG4gICAqL1xuICBvZmYgKG5hbWUsIGYpIHtcbiAgICBjb25zdCBvYnNlcnZlcnMgPSB0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpXG4gICAgaWYgKG9ic2VydmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBvYnNlcnZlcnMuZGVsZXRlKGYpXG4gICAgICBpZiAob2JzZXJ2ZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzLmRlbGV0ZShuYW1lKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0IGEgbmFtZWQgZXZlbnQuIEFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycyB0aGF0IGxpc3RlbiB0byB0aGVcbiAgICogc3BlY2lmaWVkIG5hbWUgd2lsbCByZWNlaXZlIHRoZSBldmVudC5cbiAgICpcbiAgICogQHRvZG8gVGhpcyBzaG91bGQgY2F0Y2ggZXhjZXB0aW9uc1xuICAgKlxuICAgKiBAcGFyYW0ge059IG5hbWUgVGhlIGV2ZW50IG5hbWUuXG4gICAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gYXJncyBUaGUgYXJndW1lbnRzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgZW1pdCAobmFtZSwgYXJncykge1xuICAgIC8vIGNvcHkgYWxsIGxpc3RlbmVycyB0byBhbiBhcnJheSBmaXJzdCB0byBtYWtlIHN1cmUgdGhhdCBubyBldmVudCBpcyBlbWl0dGVkIHRvIGxpc3RlbmVycyB0aGF0IGFyZSBzdWJzY3JpYmVkIHdoaWxlIHRoZSBldmVudCBoYW5kbGVyIGlzIGNhbGxlZC5cbiAgICByZXR1cm4gYXJyYXkuZnJvbSgodGhpcy5fb2JzZXJ2ZXJzLmdldChuYW1lKSB8fCBtYXAuY3JlYXRlKCkpLnZhbHVlcygpKS5mb3JFYWNoKGYgPT4gZiguLi5hcmdzKSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG59XG4vKiBjOCBpZ25vcmUgZW5kICovXG4iLCAiLyoqXG4gKiBDb21tb24gTWF0aCBleHByZXNzaW9ucy5cbiAqXG4gKiBAbW9kdWxlIG1hdGhcbiAqL1xuXG5leHBvcnQgY29uc3QgZmxvb3IgPSBNYXRoLmZsb29yXG5leHBvcnQgY29uc3QgY2VpbCA9IE1hdGguY2VpbFxuZXhwb3J0IGNvbnN0IGFicyA9IE1hdGguYWJzXG5leHBvcnQgY29uc3QgaW11bCA9IE1hdGguaW11bFxuZXhwb3J0IGNvbnN0IHJvdW5kID0gTWF0aC5yb3VuZFxuZXhwb3J0IGNvbnN0IGxvZzEwID0gTWF0aC5sb2cxMFxuZXhwb3J0IGNvbnN0IGxvZzIgPSBNYXRoLmxvZzJcbmV4cG9ydCBjb25zdCBsb2cgPSBNYXRoLmxvZ1xuZXhwb3J0IGNvbnN0IHNxcnQgPSBNYXRoLnNxcnRcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBhXG4gKiBAcGFyYW0ge251bWJlcn0gYlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgc3VtIG9mIGEgYW5kIGJcbiAqL1xuZXhwb3J0IGNvbnN0IGFkZCA9IChhLCBiKSA9PiBhICsgYlxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBzbWFsbGVyIGVsZW1lbnQgb2YgYSBhbmQgYlxuICovXG5leHBvcnQgY29uc3QgbWluID0gKGEsIGIpID0+IGEgPCBiID8gYSA6IGJcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBhXG4gKiBAcGFyYW0ge251bWJlcn0gYlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgYmlnZ2VyIGVsZW1lbnQgb2YgYSBhbmQgYlxuICovXG5leHBvcnQgY29uc3QgbWF4ID0gKGEsIGIpID0+IGEgPiBiID8gYSA6IGJcblxuZXhwb3J0IGNvbnN0IGlzTmFOID0gTnVtYmVyLmlzTmFOXG5cbmV4cG9ydCBjb25zdCBwb3cgPSBNYXRoLnBvd1xuLyoqXG4gKiBCYXNlIDEwIGV4cG9uZW50aWFsIGZ1bmN0aW9uLiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiAxMCByYWlzZWQgdG8gdGhlIHBvd2VyIG9mIHBvdy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gZXhwXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBleHAxMCA9IGV4cCA9PiBNYXRoLnBvdygxMCwgZXhwKVxuXG5leHBvcnQgY29uc3Qgc2lnbiA9IE1hdGguc2lnblxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBuXG4gKiBAcmV0dXJuIHtib29sZWFufSBXZXRoZXIgbiBpcyBuZWdhdGl2ZS4gVGhpcyBmdW5jdGlvbiBhbHNvIGRpZmZlcmVudGlhdGVzIGJldHdlZW4gLTAgYW5kICswXG4gKi9cbmV4cG9ydCBjb25zdCBpc05lZ2F0aXZlWmVybyA9IG4gPT4gbiAhPT0gMCA/IG4gPCAwIDogMSAvIG4gPCAwXG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogQmluYXJ5IGRhdGEgY29uc3RhbnRzLlxuICpcbiAqIEBtb2R1bGUgYmluYXJ5XG4gKi9cblxuLyoqXG4gKiBuLXRoIGJpdCBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVDEgPSAxXG5leHBvcnQgY29uc3QgQklUMiA9IDJcbmV4cG9ydCBjb25zdCBCSVQzID0gNFxuZXhwb3J0IGNvbnN0IEJJVDQgPSA4XG5leHBvcnQgY29uc3QgQklUNSA9IDE2XG5leHBvcnQgY29uc3QgQklUNiA9IDMyXG5leHBvcnQgY29uc3QgQklUNyA9IDY0XG5leHBvcnQgY29uc3QgQklUOCA9IDEyOFxuZXhwb3J0IGNvbnN0IEJJVDkgPSAyNTZcbmV4cG9ydCBjb25zdCBCSVQxMCA9IDUxMlxuZXhwb3J0IGNvbnN0IEJJVDExID0gMTAyNFxuZXhwb3J0IGNvbnN0IEJJVDEyID0gMjA0OFxuZXhwb3J0IGNvbnN0IEJJVDEzID0gNDA5NlxuZXhwb3J0IGNvbnN0IEJJVDE0ID0gODE5MlxuZXhwb3J0IGNvbnN0IEJJVDE1ID0gMTYzODRcbmV4cG9ydCBjb25zdCBCSVQxNiA9IDMyNzY4XG5leHBvcnQgY29uc3QgQklUMTcgPSA2NTUzNlxuZXhwb3J0IGNvbnN0IEJJVDE4ID0gMSA8PCAxN1xuZXhwb3J0IGNvbnN0IEJJVDE5ID0gMSA8PCAxOFxuZXhwb3J0IGNvbnN0IEJJVDIwID0gMSA8PCAxOVxuZXhwb3J0IGNvbnN0IEJJVDIxID0gMSA8PCAyMFxuZXhwb3J0IGNvbnN0IEJJVDIyID0gMSA8PCAyMVxuZXhwb3J0IGNvbnN0IEJJVDIzID0gMSA8PCAyMlxuZXhwb3J0IGNvbnN0IEJJVDI0ID0gMSA8PCAyM1xuZXhwb3J0IGNvbnN0IEJJVDI1ID0gMSA8PCAyNFxuZXhwb3J0IGNvbnN0IEJJVDI2ID0gMSA8PCAyNVxuZXhwb3J0IGNvbnN0IEJJVDI3ID0gMSA8PCAyNlxuZXhwb3J0IGNvbnN0IEJJVDI4ID0gMSA8PCAyN1xuZXhwb3J0IGNvbnN0IEJJVDI5ID0gMSA8PCAyOFxuZXhwb3J0IGNvbnN0IEJJVDMwID0gMSA8PCAyOVxuZXhwb3J0IGNvbnN0IEJJVDMxID0gMSA8PCAzMFxuZXhwb3J0IGNvbnN0IEJJVDMyID0gMSA8PCAzMVxuXG4vKipcbiAqIEZpcnN0IG4gYml0cyBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMwID0gMFxuZXhwb3J0IGNvbnN0IEJJVFMxID0gMVxuZXhwb3J0IGNvbnN0IEJJVFMyID0gM1xuZXhwb3J0IGNvbnN0IEJJVFMzID0gN1xuZXhwb3J0IGNvbnN0IEJJVFM0ID0gMTVcbmV4cG9ydCBjb25zdCBCSVRTNSA9IDMxXG5leHBvcnQgY29uc3QgQklUUzYgPSA2M1xuZXhwb3J0IGNvbnN0IEJJVFM3ID0gMTI3XG5leHBvcnQgY29uc3QgQklUUzggPSAyNTVcbmV4cG9ydCBjb25zdCBCSVRTOSA9IDUxMVxuZXhwb3J0IGNvbnN0IEJJVFMxMCA9IDEwMjNcbmV4cG9ydCBjb25zdCBCSVRTMTEgPSAyMDQ3XG5leHBvcnQgY29uc3QgQklUUzEyID0gNDA5NVxuZXhwb3J0IGNvbnN0IEJJVFMxMyA9IDgxOTFcbmV4cG9ydCBjb25zdCBCSVRTMTQgPSAxNjM4M1xuZXhwb3J0IGNvbnN0IEJJVFMxNSA9IDMyNzY3XG5leHBvcnQgY29uc3QgQklUUzE2ID0gNjU1MzVcbmV4cG9ydCBjb25zdCBCSVRTMTcgPSBCSVQxOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTggPSBCSVQxOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTkgPSBCSVQyMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjAgPSBCSVQyMSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjEgPSBCSVQyMiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjIgPSBCSVQyMyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjMgPSBCSVQyNCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjQgPSBCSVQyNSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjUgPSBCSVQyNiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjYgPSBCSVQyNyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjcgPSBCSVQyOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjggPSBCSVQyOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjkgPSBCSVQzMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMzAgPSBCSVQzMSAtIDFcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMSA9IDB4N0ZGRkZGRkZcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMiA9IDB4RkZGRkZGRkZcbiIsICIvKipcbiAqIFV0aWxpdHkgaGVscGVycyBmb3Igd29ya2luZyB3aXRoIG51bWJlcnMuXG4gKlxuICogQG1vZHVsZSBudW1iZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICcuL2JpbmFyeS5qcydcblxuZXhwb3J0IGNvbnN0IE1BWF9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxuZXhwb3J0IGNvbnN0IE1JTl9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUlxuXG5leHBvcnQgY29uc3QgTE9XRVNUX0lOVDMyID0gMSA8PCAzMVxuZXhwb3J0IGNvbnN0IEhJR0hFU1RfSU5UMzIgPSBiaW5hcnkuQklUUzMxXG5leHBvcnQgY29uc3QgSElHSEVTVF9VSU5UMzIgPSBiaW5hcnkuQklUUzMyXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCAobnVtID0+IHR5cGVvZiBudW0gPT09ICdudW1iZXInICYmIGlzRmluaXRlKG51bSkgJiYgbWF0aC5mbG9vcihudW0pID09PSBudW0pXG5leHBvcnQgY29uc3QgaXNOYU4gPSBOdW1iZXIuaXNOYU5cbmV4cG9ydCBjb25zdCBwYXJzZUludCA9IE51bWJlci5wYXJzZUludFxuXG4vKipcbiAqIENvdW50IHRoZSBudW1iZXIgb2YgXCIxXCIgYml0cyBpbiBhbiB1bnNpZ25lZCAzMmJpdCBudW1iZXIuXG4gKlxuICogU3VwZXIgZnVuIGJpdGNvdW50IGFsZ29yaXRobSBieSBCcmlhbiBLZXJuaWdoYW4uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqL1xuZXhwb3J0IGNvbnN0IGNvdW50Qml0cyA9IG4gPT4ge1xuICBuICY9IGJpbmFyeS5CSVRTMzJcbiAgbGV0IGNvdW50ID0gMFxuICB3aGlsZSAobikge1xuICAgIG4gJj0gKG4gLSAxKVxuICAgIGNvdW50KytcbiAgfVxuICByZXR1cm4gY291bnRcbn1cbiIsICJpbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuXG4vKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBzdHJpbmdzLlxuICpcbiAqIEBtb2R1bGUgc3RyaW5nXG4gKi9cblxuZXhwb3J0IGNvbnN0IGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGVcbmV4cG9ydCBjb25zdCBmcm9tQ29kZVBvaW50ID0gU3RyaW5nLmZyb21Db2RlUG9pbnRcblxuLyoqXG4gKiBUaGUgbGFyZ2VzdCB1dGYxNiBjaGFyYWN0ZXIuXG4gKiBDb3JyZXNwb25kcyB0byBVaW50OEFycmF5KFsyNTUsIDI1NV0pIG9yIGNoYXJjb2Rlb2YoMngyXjgpXG4gKi9cbmV4cG9ydCBjb25zdCBNQVhfVVRGMTZfQ0hBUkFDVEVSID0gZnJvbUNoYXJDb2RlKDY1NTM1KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmNvbnN0IHRvTG93ZXJDYXNlID0gcyA9PiBzLnRvTG93ZXJDYXNlKClcblxuY29uc3QgdHJpbUxlZnRSZWdleCA9IC9eXFxzKi9nXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHRyaW1MZWZ0ID0gcyA9PiBzLnJlcGxhY2UodHJpbUxlZnRSZWdleCwgJycpXG5cbmNvbnN0IGZyb21DYW1lbENhc2VSZWdleCA9IC8oW0EtWl0pL2dcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHBhcmFtIHtzdHJpbmd9IHNlcGFyYXRvclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgZnJvbUNhbWVsQ2FzZSA9IChzLCBzZXBhcmF0b3IpID0+IHRyaW1MZWZ0KHMucmVwbGFjZShmcm9tQ2FtZWxDYXNlUmVnZXgsIG1hdGNoID0+IGAke3NlcGFyYXRvcn0ke3RvTG93ZXJDYXNlKG1hdGNoKX1gKSlcblxuLyoqXG4gKiBDb21wdXRlIHRoZSB1dGY4Qnl0ZUxlbmd0aFxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgdXRmOEJ5dGVMZW5ndGggPSBzdHIgPT4gdW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikpLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBfZW5jb2RlVXRmOFBvbHlmaWxsID0gc3RyID0+IHtcbiAgY29uc3QgZW5jb2RlZFN0cmluZyA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKVxuICBjb25zdCBsZW4gPSBlbmNvZGVkU3RyaW5nLmxlbmd0aFxuICBjb25zdCBidWYgPSBuZXcgVWludDhBcnJheShsZW4pXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBidWZbaV0gPSAvKiogQHR5cGUge251bWJlcn0gKi8gKGVuY29kZWRTdHJpbmcuY29kZVBvaW50QXQoaSkpXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHV0ZjhUZXh0RW5jb2RlciA9IC8qKiBAdHlwZSB7VGV4dEVuY29kZXJ9ICovICh0eXBlb2YgVGV4dEVuY29kZXIgIT09ICd1bmRlZmluZWQnID8gbmV3IFRleHRFbmNvZGVyKCkgOiBudWxsKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBfZW5jb2RlVXRmOE5hdGl2ZSA9IHN0ciA9PiB1dGY4VGV4dEVuY29kZXIuZW5jb2RlKHN0cilcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZVV0ZjggPSB1dGY4VGV4dEVuY29kZXIgPyBfZW5jb2RlVXRmOE5hdGl2ZSA6IF9lbmNvZGVVdGY4UG9seWZpbGxcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgX2RlY29kZVV0ZjhQb2x5ZmlsbCA9IGJ1ZiA9PiB7XG4gIGxldCByZW1haW5pbmdMZW4gPSBidWYubGVuZ3RoXG4gIGxldCBlbmNvZGVkU3RyaW5nID0gJydcbiAgbGV0IGJ1ZlBvcyA9IDBcbiAgd2hpbGUgKHJlbWFpbmluZ0xlbiA+IDApIHtcbiAgICBjb25zdCBuZXh0TGVuID0gcmVtYWluaW5nTGVuIDwgMTAwMDAgPyByZW1haW5pbmdMZW4gOiAxMDAwMFxuICAgIGNvbnN0IGJ5dGVzID0gYnVmLnN1YmFycmF5KGJ1ZlBvcywgYnVmUG9zICsgbmV4dExlbilcbiAgICBidWZQb3MgKz0gbmV4dExlblxuICAgIC8vIFN0YXJ0aW5nIHdpdGggRVM1LjEgd2UgY2FuIHN1cHBseSBhIGdlbmVyaWMgYXJyYXktbGlrZSBvYmplY3QgYXMgYXJndW1lbnRzXG4gICAgZW5jb2RlZFN0cmluZyArPSBTdHJpbmcuZnJvbUNvZGVQb2ludC5hcHBseShudWxsLCAvKiogQHR5cGUge2FueX0gKi8gKGJ5dGVzKSlcbiAgICByZW1haW5pbmdMZW4gLT0gbmV4dExlblxuICB9XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKGVuY29kZWRTdHJpbmcpKVxufVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGxldCB1dGY4VGV4dERlY29kZXIgPSB0eXBlb2YgVGV4dERlY29kZXIgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IG5ldyBUZXh0RGVjb2RlcigndXRmLTgnLCB7IGZhdGFsOiB0cnVlLCBpZ25vcmVCT006IHRydWUgfSlcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5pZiAodXRmOFRleHREZWNvZGVyICYmIHV0ZjhUZXh0RGVjb2Rlci5kZWNvZGUobmV3IFVpbnQ4QXJyYXkoKSkubGVuZ3RoID09PSAxKSB7XG4gIC8vIFNhZmFyaSBkb2Vzbid0IGhhbmRsZSBCT00gY29ycmVjdGx5LlxuICAvLyBUaGlzIGZpeGVzIGEgYnVnIGluIFNhZmFyaSAxMy4wLjUgd2hlcmUgaXQgcHJvZHVjZXMgYSBCT00gdGhlIGZpcnN0IHRpbWUgaXQgaXMgY2FsbGVkLlxuICAvLyB1dGY4VGV4dERlY29kZXIuZGVjb2RlKG5ldyBVaW50OEFycmF5KCkpLmxlbmd0aCA9PT0gMSBvbiB0aGUgZmlyc3QgY2FsbCBhbmRcbiAgLy8gdXRmOFRleHREZWNvZGVyLmRlY29kZShuZXcgVWludDhBcnJheSgpKS5sZW5ndGggPT09IDEgb24gdGhlIHNlY29uZCBjYWxsXG4gIC8vIEFub3RoZXIgaXNzdWUgaXMgdGhhdCBmcm9tIHRoZW4gb24gbm8gQk9NIGNoYXJzIGFyZSByZWNvZ25pemVkIGFueW1vcmVcbiAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgdXRmOFRleHREZWNvZGVyID0gbnVsbFxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgX2RlY29kZVV0ZjhOYXRpdmUgPSBidWYgPT4gLyoqIEB0eXBlIHtUZXh0RGVjb2Rlcn0gKi8gKHV0ZjhUZXh0RGVjb2RlcikuZGVjb2RlKGJ1ZilcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGRlY29kZVV0ZjggPSB1dGY4VGV4dERlY29kZXIgPyBfZGVjb2RlVXRmOE5hdGl2ZSA6IF9kZWNvZGVVdGY4UG9seWZpbGxcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIFRoZSBpbml0aWFsIHN0cmluZ1xuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFN0YXJ0aW5nIHBvc2l0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gcmVtb3ZlIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRvIHJlbW92ZVxuICogQHBhcmFtIHtzdHJpbmd9IGluc2VydCBOZXcgY29udGVudCB0byBpbnNlcnRcbiAqL1xuZXhwb3J0IGNvbnN0IHNwbGljZSA9IChzdHIsIGluZGV4LCByZW1vdmUsIGluc2VydCA9ICcnKSA9PiBzdHIuc2xpY2UoMCwgaW5kZXgpICsgaW5zZXJ0ICsgc3RyLnNsaWNlKGluZGV4ICsgcmVtb3ZlKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBuXG4gKi9cbmV4cG9ydCBjb25zdCByZXBlYXQgPSAoc291cmNlLCBuKSA9PiBhcnJheS51bmZvbGQobiwgKCkgPT4gc291cmNlKS5qb2luKCcnKVxuIiwgIi8qKlxuICogRWZmaWNpZW50IHNjaGVtYS1sZXNzIGJpbmFyeSBlbmNvZGluZyB3aXRoIHN1cHBvcnQgZm9yIHZhcmlhYmxlIGxlbmd0aCBlbmNvZGluZy5cbiAqXG4gKiBVc2UgW2xpYjAvZW5jb2RpbmddIHdpdGggW2xpYjAvZGVjb2RpbmddLiBFdmVyeSBlbmNvZGluZyBmdW5jdGlvbiBoYXMgYSBjb3JyZXNwb25kaW5nIGRlY29kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEVuY29kZXMgbnVtYmVycyBpbiBsaXR0bGUtZW5kaWFuIG9yZGVyIChsZWFzdCB0byBtb3N0IHNpZ25pZmljYW50IGJ5dGUgb3JkZXIpXG4gKiBhbmQgaXMgY29tcGF0aWJsZSB3aXRoIEdvbGFuZydzIGJpbmFyeSBlbmNvZGluZyAoaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9lbmNvZGluZy9iaW5hcnkvKVxuICogd2hpY2ggaXMgYWxzbyB1c2VkIGluIFByb3RvY29sIEJ1ZmZlcnMuXG4gKlxuICogYGBganNcbiAqIC8vIGVuY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAqIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCAyNTYpXG4gKiBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyLCAnSGVsbG8gd29ybGQhJylcbiAqIGNvbnN0IGJ1ZiA9IGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyKVxuICogYGBgXG4gKlxuICogYGBganNcbiAqIC8vIGRlY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGRlY29kZXIgPSBkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZilcbiAqIGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpIC8vID0+IDI1NlxuICogZGVjb2RpbmcucmVhZFZhclN0cmluZyhkZWNvZGVyKSAvLyA9PiAnSGVsbG8gd29ybGQhJ1xuICogZGVjb2RpbmcuaGFzQ29udGVudChkZWNvZGVyKSAvLyA9PiBmYWxzZSAtIGFsbCBkYXRhIGlzIHJlYWRcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGUgZW5jb2RpbmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIG51bWJlciBmcm9tICcuL251bWJlci5qcydcbmltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICcuL2JpbmFyeS5qcydcbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJy4vYXJyYXkuanMnXG5cbi8qKlxuICogQSBCaW5hcnlFbmNvZGVyIGhhbmRsZXMgdGhlIGVuY29kaW5nIHRvIGFuIFVpbnQ4QXJyYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBFbmNvZGVyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuY3BvcyA9IDBcbiAgICB0aGlzLmNidWYgPSBuZXcgVWludDhBcnJheSgxMDApXG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PFVpbnQ4QXJyYXk+fVxuICAgICAqL1xuICAgIHRoaXMuYnVmcyA9IFtdXG4gIH1cbn1cblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEByZXR1cm4ge0VuY29kZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVFbmNvZGVyID0gKCkgPT4gbmV3IEVuY29kZXIoKVxuXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oRW5jb2Rlcik6dm9pZH0gZlxuICovXG5leHBvcnQgY29uc3QgZW5jb2RlID0gKGYpID0+IHtcbiAgY29uc3QgZW5jb2RlciA9IGNyZWF0ZUVuY29kZXIoKVxuICBmKGVuY29kZXIpXG4gIHJldHVybiB0b1VpbnQ4QXJyYXkoZW5jb2Rlcilcbn1cblxuLyoqXG4gKiBUaGUgY3VycmVudCBsZW5ndGggb2YgdGhlIGVuY29kZWQgZGF0YS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgbGVuZ3RoID0gZW5jb2RlciA9PiB7XG4gIGxldCBsZW4gPSBlbmNvZGVyLmNwb3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVyLmJ1ZnMubGVuZ3RoOyBpKyspIHtcbiAgICBsZW4gKz0gZW5jb2Rlci5idWZzW2ldLmxlbmd0aFxuICB9XG4gIHJldHVybiBsZW5cbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGVuY29kZXIgaXMgZW1wdHkuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBoYXNDb250ZW50ID0gZW5jb2RlciA9PiBlbmNvZGVyLmNwb3MgPiAwIHx8IGVuY29kZXIuYnVmcy5sZW5ndGggPiAwXG5cbi8qKlxuICogVHJhbnNmb3JtIHRvIFVpbnQ4QXJyYXkuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IFRoZSBjcmVhdGVkIEFycmF5QnVmZmVyLlxuICovXG5leHBvcnQgY29uc3QgdG9VaW50OEFycmF5ID0gZW5jb2RlciA9PiB7XG4gIGNvbnN0IHVpbnQ4YXJyID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKGVuY29kZXIpKVxuICBsZXQgY3VyUG9zID0gMFxuICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZXIuYnVmcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGQgPSBlbmNvZGVyLmJ1ZnNbaV1cbiAgICB1aW50OGFyci5zZXQoZCwgY3VyUG9zKVxuICAgIGN1clBvcyArPSBkLmxlbmd0aFxuICB9XG4gIHVpbnQ4YXJyLnNldChuZXcgVWludDhBcnJheShlbmNvZGVyLmNidWYuYnVmZmVyLCAwLCBlbmNvZGVyLmNwb3MpLCBjdXJQb3MpXG4gIHJldHVybiB1aW50OGFyclxufVxuXG4vKipcbiAqIFZlcmlmeSB0aGF0IGl0IGlzIHBvc3NpYmxlIHRvIHdyaXRlIGBsZW5gIGJ5dGVzIHd0aWhvdXQgY2hlY2tpbmcuIElmXG4gKiBuZWNlc3NhcnksIGEgbmV3IEJ1ZmZlciB3aXRoIHRoZSByZXF1aXJlZCBsZW5ndGggaXMgYXR0YWNoZWQuXG4gKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKi9cbmV4cG9ydCBjb25zdCB2ZXJpZnlMZW4gPSAoZW5jb2RlciwgbGVuKSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgaWYgKGJ1ZmZlckxlbiAtIGVuY29kZXIuY3BvcyA8IGxlbikge1xuICAgIGVuY29kZXIuYnVmcy5wdXNoKG5ldyBVaW50OEFycmF5KGVuY29kZXIuY2J1Zi5idWZmZXIsIDAsIGVuY29kZXIuY3BvcykpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkobWF0aC5tYXgoYnVmZmVyTGVuLCBsZW4pICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSB0byB0aGUgZW5jb2Rlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgYnl0ZSB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZSA9IChlbmNvZGVyLCBudW0pID0+IHtcbiAgY29uc3QgYnVmZmVyTGVuID0gZW5jb2Rlci5jYnVmLmxlbmd0aFxuICBpZiAoZW5jb2Rlci5jcG9zID09PSBidWZmZXJMZW4pIHtcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyTGVuICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbiAgZW5jb2Rlci5jYnVmW2VuY29kZXIuY3BvcysrXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGF0IGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gKiBQb3NpdGlvbiBtdXN0IGFscmVhZHkgYmUgd3JpdHRlbiAoaS5lLiBlbmNvZGVyLmxlbmd0aCA+IHBvcylcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBQb3NpdGlvbiB0byB3aGljaCB0byB3cml0ZSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHNldCA9IChlbmNvZGVyLCBwb3MsIG51bSkgPT4ge1xuICBsZXQgYnVmZmVyID0gbnVsbFxuICAvLyBpdGVyYXRlIGFsbCBidWZmZXJzIGFuZCBhZGp1c3QgcG9zaXRpb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVyLmJ1ZnMubGVuZ3RoICYmIGJ1ZmZlciA9PT0gbnVsbDsgaSsrKSB7XG4gICAgY29uc3QgYiA9IGVuY29kZXIuYnVmc1tpXVxuICAgIGlmIChwb3MgPCBiLmxlbmd0aCkge1xuICAgICAgYnVmZmVyID0gYiAvLyBmb3VuZCBidWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgcG9zIC09IGIubGVuZ3RoXG4gICAgfVxuICB9XG4gIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAvLyB1c2UgY3VycmVudCBidWZmZXJcbiAgICBidWZmZXIgPSBlbmNvZGVyLmNidWZcbiAgfVxuICBidWZmZXJbcG9zXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGFzIGFuIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVVpbnQ4ID0gd3JpdGVcblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSBhcyBhbiB1bnNpZ25lZCBJbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50OCA9IHNldFxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVVaW50MTYgPSAoZW5jb2RlciwgbnVtKSA9PiB7XG4gIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgd3JpdGUoZW5jb2RlciwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MTYgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgc2V0KGVuY29kZXIsIHBvcywgbnVtICYgYmluYXJ5LkJJVFM4KVxuICBzZXQoZW5jb2RlciwgcG9zICsgMSwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG5cbi8qKlxuICogV3JpdGUgdHdvIGJ5dGVzIGFzIGFuIHVuc2lnbmVkIGludGVnZXJcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgICBudW0gPj4+PSA4XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSB0d28gYnl0ZXMgYXMgYW4gdW5zaWduZWQgaW50ZWdlciBpbiBiaWcgZW5kaWFuIG9yZGVyLlxuICogKG1vc3Qgc2lnbmlmaWNhbnQgYnl0ZSBmaXJzdClcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyQmlnRW5kaWFuID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMzsgaSA+PSAwOyBpLS0pIHtcbiAgICB3cml0ZShlbmNvZGVyLCAobnVtID4+PiAoOCAqIGkpKSAmIGJpbmFyeS5CSVRTOClcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MzIgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICBzZXQoZW5jb2RlciwgcG9zICsgaSwgbnVtICYgYmluYXJ5LkJJVFM4KVxuICAgIG51bSA+Pj49IDhcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHVuc2lnbmVkIGludGVnZXIuIE1heCBlbmNvZGFibGUgaW50ZWdlciBpcyAyXjUzLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVWYXJVaW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICB3aGlsZSAobnVtID4gYmluYXJ5LkJJVFM3KSB7XG4gICAgd3JpdGUoZW5jb2RlciwgYmluYXJ5LkJJVDggfCAoYmluYXJ5LkJJVFM3ICYgbnVtKSlcbiAgICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDEyOCkgLy8gc2hpZnQgPj4+IDdcbiAgfVxuICB3cml0ZShlbmNvZGVyLCBiaW5hcnkuQklUUzcgJiBudW0pXG59XG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlci5cbiAqXG4gKiBXZSB1c2UgdGhlIDd0aCBiaXQgaW5zdGVhZCBmb3Igc2lnbmFsaW5nIHRoYXQgdGhpcyBpcyBhIG5lZ2F0aXZlIG51bWJlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFySW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyhudW0pXG4gIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgbnVtID0gLW51bVxuICB9XG4gIC8vICAgICAgICAgICAgIHwtIHdoZXRoZXIgdG8gY29udGludWUgcmVhZGluZyAgICAgICAgIHwtIHdoZXRoZXIgaXMgbmVnYXRpdmUgICAgIHwtIG51bWJlclxuICB3cml0ZShlbmNvZGVyLCAobnVtID4gYmluYXJ5LkJJVFM2ID8gYmluYXJ5LkJJVDggOiAwKSB8IChpc05lZ2F0aXZlID8gYmluYXJ5LkJJVDcgOiAwKSB8IChiaW5hcnkuQklUUzYgJiBudW0pKVxuICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDY0KSAvLyBzaGlmdCA+Pj4gNlxuICAvLyBXZSBkb24ndCBuZWVkIHRvIGNvbnNpZGVyIHRoZSBjYXNlIG9mIG51bSA9PT0gMCBzbyB3ZSBjYW4gdXNlIGEgZGlmZmVyZW50XG4gIC8vIHBhdHRlcm4gaGVyZSB0aGFuIGFib3ZlLlxuICB3aGlsZSAobnVtID4gMCkge1xuICAgIHdyaXRlKGVuY29kZXIsIChudW0gPiBiaW5hcnkuQklUUzcgPyBiaW5hcnkuQklUOCA6IDApIHwgKGJpbmFyeS5CSVRTNyAmIG51bSkpXG4gICAgbnVtID0gbWF0aC5mbG9vcihudW0gLyAxMjgpIC8vIHNoaWZ0ID4+PiA3XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNhY2hlIHRvIHN0b3JlIHN0cmluZ3MgdGVtcG9yYXJpbHlcbiAqL1xuY29uc3QgX3N0ckJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDMwMDAwKVxuY29uc3QgX21heFN0ckJTaXplID0gX3N0ckJ1ZmZlci5sZW5ndGggLyAzXG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggc3RyaW5nLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3QgX3dyaXRlVmFyU3RyaW5nTmF0aXZlID0gKGVuY29kZXIsIHN0cikgPT4ge1xuICBpZiAoc3RyLmxlbmd0aCA8IF9tYXhTdHJCU2l6ZSkge1xuICAgIC8vIFdlIGNhbiBlbmNvZGUgdGhlIHN0cmluZyBpbnRvIHRoZSBleGlzdGluZyBidWZmZXJcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgIGNvbnN0IHdyaXR0ZW4gPSBzdHJpbmcudXRmOFRleHRFbmNvZGVyLmVuY29kZUludG8oc3RyLCBfc3RyQnVmZmVyKS53cml0dGVuIHx8IDBcbiAgICB3cml0ZVZhclVpbnQoZW5jb2Rlciwgd3JpdHRlbilcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdyaXR0ZW47IGkrKykge1xuICAgICAgd3JpdGUoZW5jb2RlciwgX3N0ckJ1ZmZlcltpXSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHN0cmluZy5lbmNvZGVVdGY4KHN0cikpXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBhIHZhcmlhYmxlIGxlbmd0aCBzdHJpbmcuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbCA9IChlbmNvZGVyLCBzdHIpID0+IHtcbiAgY29uc3QgZW5jb2RlZFN0cmluZyA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKVxuICBjb25zdCBsZW4gPSBlbmNvZGVkU3RyaW5nLmxlbmd0aFxuICB3cml0ZVZhclVpbnQoZW5jb2RlciwgbGVuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgd3JpdGUoZW5jb2RlciwgLyoqIEB0eXBlIHtudW1iZXJ9ICovIChlbmNvZGVkU3RyaW5nLmNvZGVQb2ludEF0KGkpKSlcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHN0cmluZy5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB3cml0ZVZhclN0cmluZyA9IChzdHJpbmcudXRmOFRleHRFbmNvZGVyICYmIC8qKiBAdHlwZSB7YW55fSAqLyAoc3RyaW5nLnV0ZjhUZXh0RW5jb2RlcikuZW5jb2RlSW50bykgPyBfd3JpdGVWYXJTdHJpbmdOYXRpdmUgOiBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbFxuXG4vKipcbiAqIFdyaXRlIGEgc3RyaW5nIHRlcm1pbmF0ZWQgYnkgYSBzcGVjaWFsIGJ5dGUgc2VxdWVuY2UuIFRoaXMgaXMgbm90IHZlcnkgcGVyZm9ybWFudCBhbmQgaXNcbiAqIGdlbmVyYWxseSBkaXNjb3VyYWdlZC4gSG93ZXZlciwgdGhlIHJlc3VsdGluZyBieXRlIGFycmF5cyBhcmUgbGV4aW9ncmFwaGljYWxseSBvcmRlcmVkIHdoaWNoXG4gKiBtYWtlcyB0aGlzIGEgbmljZSBmZWF0dXJlIGZvciBkYXRhYmFzZXMuXG4gKlxuICogVGhlIHN0cmluZyB3aWxsIGJlIGVuY29kZWQgdXNpbmcgdXRmOCBhbmQgdGhlbiB0ZXJtaW5hdGVkIGFuZCBlc2NhcGVkIHVzaW5nIHdyaXRlVGVybWluYXRpbmdVaW50OEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkU3RyaW5nID0gKGVuY29kZXIsIHN0cikgPT5cbiAgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheShlbmNvZGVyLCBzdHJpbmcuZW5jb2RlVXRmOChzdHIpKVxuXG4vKipcbiAqIFdyaXRlIGEgdGVybWluYXRpbmcgVWludDhBcnJheS4gTm90ZSB0aGF0IHRoaXMgaXMgbm90IHBlcmZvcm1hbnQgYW5kIGlzIGdlbmVyYWxseVxuICogZGlzY291cmFnZWQuIFRoZXJlIGFyZSBmZXcgc2l0dWF0aW9ucyB3aGVuIHRoaXMgaXMgbmVlZGVkLlxuICpcbiAqIFdlIHVzZSAweDAgYXMgYSB0ZXJtaW5hdGluZyBjaGFyYWN0ZXIuIDB4MSBzZXJ2ZXMgYXMgYW4gZXNjYXBlIGNoYXJhY3RlciBmb3IgMHgwIGFuZCAweDEuXG4gKlxuICogRXhhbXBsZTogWzAsMSwyXSBpcyBlbmNvZGVkIHRvIFsxLDAsMSwxLDIsMF0uIDB4MCwgYW5kIDB4MSBuZWVkZWQgdG8gYmUgZXNjYXBlZCB1c2luZyAweDEuIFRoZW5cbiAqIHRoZSByZXN1bHQgaXMgdGVybWluYXRlZCB1c2luZyB0aGUgMHgwIGNoYXJhY3Rlci5cbiAqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBob3cgbWFueSBzeXN0ZW1zIGltcGxlbWVudCBudWxsIHRlcm1pbmF0ZWQgc3RyaW5ncy4gSG93ZXZlciwgd2UgdXNlIGFuIGVzY2FwZVxuICogY2hhcmFjdGVyIDB4MSB0byBhdm9pZCBpc3N1ZXMgYW5kIHBvdGVuaWFsIGF0dGFja3Mgb24gb3VyIGRhdGFiYXNlIChpZiB0aGlzIGlzIHVzZWQgYXMgYSBrZXlcbiAqIGVuY29kZXIgZm9yIE5vU3FsIGRhdGFiYXNlcykuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheSA9IChlbmNvZGVyLCBidWYpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWYubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBiID0gYnVmW2ldXG4gICAgaWYgKGIgPT09IDAgfHwgYiA9PT0gMSkge1xuICAgICAgd3JpdGUoZW5jb2RlciwgMSlcbiAgICB9XG4gICAgd3JpdGUoZW5jb2RlciwgYnVmW2ldKVxuICB9XG4gIHdyaXRlKGVuY29kZXIsIDApXG59XG5cbi8qKlxuICogV3JpdGUgdGhlIGNvbnRlbnQgb2YgYW5vdGhlciBFbmNvZGVyLlxuICpcbiAqIEBUT0RPOiBjYW4gYmUgaW1wcm92ZWQhXG4gKiAgICAgICAgLSBOb3RlOiBTaG91bGQgY29uc2lkZXIgdGhhdCB3aGVuIGFwcGVuZGluZyBhIGxvdCBvZiBzbWFsbCBFbmNvZGVycywgd2Ugc2hvdWxkIHJhdGhlciBjbG9uZSB0aGFuIHJlZmVyZW5jaW5nIHRoZSBvbGQgc3RydWN0dXJlLlxuICogICAgICAgICAgICAgICAgRW5jb2RlcnMgc3RhcnQgd2l0aCBhIHJhdGhlciBiaWcgaW5pdGlhbCBidWZmZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXIgVGhlIGVuVWludDhBcnJcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gYXBwZW5kIFRoZSBCaW5hcnlFbmNvZGVyIHRvIGJlIHdyaXR0ZW4uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUJpbmFyeUVuY29kZXIgPSAoZW5jb2RlciwgYXBwZW5kKSA9PiB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdG9VaW50OEFycmF5KGFwcGVuZCkpXG5cbi8qKlxuICogQXBwZW5kIGZpeGVkLWxlbmd0aCBVaW50OEFycmF5IHRvIHRoZSBlbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgY29uc3QgY3BvcyA9IGVuY29kZXIuY3Bvc1xuICBjb25zdCBsZWZ0Q29weUxlbiA9IG1hdGgubWluKGJ1ZmZlckxlbiAtIGNwb3MsIHVpbnQ4QXJyYXkubGVuZ3RoKVxuICBjb25zdCByaWdodENvcHlMZW4gPSB1aW50OEFycmF5Lmxlbmd0aCAtIGxlZnRDb3B5TGVuXG4gIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheSgwLCBsZWZ0Q29weUxlbiksIGNwb3MpXG4gIGVuY29kZXIuY3BvcyArPSBsZWZ0Q29weUxlblxuICBpZiAocmlnaHRDb3B5TGVuID4gMCkge1xuICAgIC8vIFN0aWxsIHNvbWV0aGluZyB0byB3cml0ZSwgd3JpdGUgcmlnaHQgaGFsZi4uXG4gICAgLy8gQXBwZW5kIG5ldyBidWZmZXJcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgLy8gbXVzdCBoYXZlIGF0IGxlYXN0IHNpemUgb2YgcmVtYWluaW5nIGJ1ZmZlclxuICAgIGVuY29kZXIuY2J1ZiA9IG5ldyBVaW50OEFycmF5KG1hdGgubWF4KGJ1ZmZlckxlbiAqIDIsIHJpZ2h0Q29weUxlbikpXG4gICAgLy8gY29weSBhcnJheVxuICAgIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheShsZWZ0Q29weUxlbikpXG4gICAgZW5jb2Rlci5jcG9zID0gcmlnaHRDb3B5TGVuXG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmQgYW4gVWludDhBcnJheSB0byBFbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFyVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIHdyaXRlVmFyVWludChlbmNvZGVyLCB1aW50OEFycmF5LmJ5dGVMZW5ndGgpXG4gIHdyaXRlVWludDhBcnJheShlbmNvZGVyLCB1aW50OEFycmF5KVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBEYXRhVmlldyBvZiB0aGUgbmV4dCBgbGVuYCBieXRlcy4gVXNlIGl0IHRvIHdyaXRlIGRhdGEgYWZ0ZXJcbiAqIGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cbiAqXG4gKiBgYGBqc1xuICogLy8gd3JpdGUgZmxvYXQzMiB1c2luZyBEYXRhVmlld1xuICogY29uc3QgZHYgPSB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LnNldEZsb2F0MzIoMCwgMS4xKVxuICogLy8gcmVhZCBmbG9hdDMyIHVzaW5nIERhdGFWaWV3XG4gKiBjb25zdCBkdiA9IHJlYWRGcm9tRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LmdldEZsb2F0MzIoMCkgLy8gPT4gMS4xMDAwMDAwMjM4NDE4NTggKGxlYXZpbmcgaXQgdG8gdGhlIHJlYWRlciB0byBmaW5kIG91dCB3aHkgdGhpcyBpcyB0aGUgY29ycmVjdCByZXN1bHQpXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEByZXR1cm4ge0RhdGFWaWV3fVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVPbkRhdGFWaWV3ID0gKGVuY29kZXIsIGxlbikgPT4ge1xuICB2ZXJpZnlMZW4oZW5jb2RlciwgbGVuKVxuICBjb25zdCBkdmlldyA9IG5ldyBEYXRhVmlldyhlbmNvZGVyLmNidWYuYnVmZmVyLCBlbmNvZGVyLmNwb3MsIGxlbilcbiAgZW5jb2Rlci5jcG9zICs9IGxlblxuICByZXR1cm4gZHZpZXdcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlRmxvYXQzMiA9IChlbmNvZGVyLCBudW0pID0+IHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA0KS5zZXRGbG9hdDMyKDAsIG51bSwgZmFsc2UpXG5cbi8qKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUZsb2F0NjQgPSAoZW5jb2RlciwgbnVtKSA9PiB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgOCkuc2V0RmxvYXQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdJbnQ2NCA9IChlbmNvZGVyLCBudW0pID0+IC8qKiBAdHlwZSB7YW55fSAqLyAod3JpdGVPbkRhdGFWaWV3KGVuY29kZXIsIDgpKS5zZXRCaWdJbnQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdVaW50NjQgPSAoZW5jb2RlciwgbnVtKSA9PiAvKiogQHR5cGUge2FueX0gKi8gKHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA4KSkuc2V0QmlnVWludDY0KDAsIG51bSwgZmFsc2UpXG5cbmNvbnN0IGZsb2F0VGVzdEJlZCA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoNCkpXG4vKipcbiAqIENoZWNrIGlmIGEgbnVtYmVyIGNhbiBiZSBlbmNvZGVkIGFzIGEgMzIgYml0IGZsb2F0LlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzRmxvYXQzMiA9IG51bSA9PiB7XG4gIGZsb2F0VGVzdEJlZC5zZXRGbG9hdDMyKDAsIG51bSlcbiAgcmV0dXJuIGZsb2F0VGVzdEJlZC5nZXRGbG9hdDMyKDApID09PSBudW1cbn1cblxuLyoqXG4gKiBFbmNvZGUgZGF0YSB3aXRoIGVmZmljaWVudCBiaW5hcnkgZm9ybWF0LlxuICpcbiAqIERpZmZlcmVuY2VzIHRvIEpTT046XG4gKiBcdTIwMjIgVHJhbnNmb3JtcyBkYXRhIHRvIGEgYmluYXJ5IGZvcm1hdCAobm90IHRvIGEgc3RyaW5nKVxuICogXHUyMDIyIEVuY29kZXMgdW5kZWZpbmVkLCBOYU4sIGFuZCBBcnJheUJ1ZmZlciAodGhlc2UgY2FuJ3QgYmUgcmVwcmVzZW50ZWQgaW4gSlNPTilcbiAqIFx1MjAyMiBOdW1iZXJzIGFyZSBlZmZpY2llbnRseSBlbmNvZGVkIGVpdGhlciBhcyBhIHZhcmlhYmxlIGxlbmd0aCBpbnRlZ2VyLCBhcyBhXG4gKiAgIDMyIGJpdCBmbG9hdCwgYXMgYSA2NCBiaXQgZmxvYXQsIG9yIGFzIGEgNjQgYml0IGJpZ2ludC5cbiAqXG4gKiBFbmNvZGluZyB0YWJsZTpcbiAqXG4gKiB8IERhdGEgVHlwZSAgICAgICAgICAgfCBQcmVmaXggICB8IEVuY29kaW5nIE1ldGhvZCAgICB8IENvbW1lbnQgfFxuICogfCAtLS0tLS0tLS0tLS0tLS0tLS0tIHwgLS0tLS0tLS0gfCAtLS0tLS0tLS0tLS0tLS0tLS0gfCAtLS0tLS0tIHxcbiAqIHwgdW5kZWZpbmVkICAgICAgICAgICB8IDEyNyAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgRnVuY3Rpb25zLCBzeW1ib2wsIGFuZCBldmVyeXRoaW5nIHRoYXQgY2Fubm90IGJlIGlkZW50aWZpZWQgaXMgZW5jb2RlZCBhcyB1bmRlZmluZWQgfFxuICogfCBudWxsICAgICAgICAgICAgICAgIHwgMTI2ICAgICAgfCAgICAgICAgICAgICAgICAgICAgfCB8XG4gKiB8IGludGVnZXIgICAgICAgICAgICAgfCAxMjUgICAgICB8IHdyaXRlVmFySW50ICAgICAgICB8IE9ubHkgZW5jb2RlcyAzMiBiaXQgc2lnbmVkIGludGVnZXJzIHxcbiAqIHwgZmxvYXQzMiAgICAgICAgICAgICB8IDEyNCAgICAgIHwgd3JpdGVGbG9hdDMyICAgICAgIHwgfFxuICogfCBmbG9hdDY0ICAgICAgICAgICAgIHwgMTIzICAgICAgfCB3cml0ZUZsb2F0NjQgICAgICAgfCB8XG4gKiB8IGJpZ2ludCAgICAgICAgICAgICAgfCAxMjIgICAgICB8IHdyaXRlQmlnSW50NjQgICAgICB8IHxcbiAqIHwgYm9vbGVhbiAoZmFsc2UpICAgICB8IDEyMSAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgVHJ1ZSBhbmQgZmFsc2UgYXJlIGRpZmZlcmVudCBkYXRhIHR5cGVzIHNvIHdlIHNhdmUgdGhlIGZvbGxvd2luZyBieXRlIHxcbiAqIHwgYm9vbGVhbiAodHJ1ZSkgICAgICB8IDEyMCAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgLSAwYjAxMTExMDAwIHNvIHRoZSBsYXN0IGJpdCBkZXRlcm1pbmVzIHdoZXRoZXIgdHJ1ZSBvciBmYWxzZSB8XG4gKiB8IHN0cmluZyAgICAgICAgICAgICAgfCAxMTkgICAgICB8IHdyaXRlVmFyU3RyaW5nICAgICB8IHxcbiAqIHwgb2JqZWN0PHN0cmluZyxhbnk+ICB8IDExOCAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ga2V5LXZhbHVlIHBhaXJzIHxcbiAqIHwgYXJyYXk8YW55PiAgICAgICAgICB8IDExNyAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ganNvbiB2YWx1ZXMgfFxuICogfCBVaW50OEFycmF5ICAgICAgICAgIHwgMTE2ICAgICAgfCB3cml0ZVZhclVpbnQ4QXJyYXkgfCBXZSB1c2UgVWludDhBcnJheSBmb3IgYW55IGtpbmQgb2YgYmluYXJ5IGRhdGEgfFxuICpcbiAqIFJlYXNvbnMgZm9yIHRoZSBkZWNyZWFzaW5nIHByZWZpeDpcbiAqIFdlIG5lZWQgdGhlIGZpcnN0IGJpdCBmb3IgZXh0ZW5kYWJpbGl0eSAobGF0ZXIgd2UgbWF5IHdhbnQgdG8gZW5jb2RlIHRoZVxuICogcHJlZml4IHdpdGggd3JpdGVWYXJVaW50KS4gVGhlIHJlbWFpbmluZyA3IGJpdHMgYXJlIGRpdmlkZWQgYXMgZm9sbG93czpcbiAqIFswLTMwXSAgIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgY3VzdG9tIHB1cnBvc2VzXG4gKiAgICAgICAgICAoZGVmaW5lZCBieSB0aGUgZnVuY3Rpb24gdGhhdCB1c2VzIHRoaXMgbGlicmFyeSlcbiAqIFszMS0xMjddIHRoZSBlbmQgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgZGF0YSBlbmNvZGluZyBieVxuICogICAgICAgICAgbGliMC9lbmNvZGluZy5qc1xuICpcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHt1bmRlZmluZWR8bnVsbHxudW1iZXJ8YmlnaW50fGJvb2xlYW58c3RyaW5nfE9iamVjdDxzdHJpbmcsYW55PnxBcnJheTxhbnk+fFVpbnQ4QXJyYXl9IGRhdGFcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlQW55ID0gKGVuY29kZXIsIGRhdGEpID0+IHtcbiAgc3dpdGNoICh0eXBlb2YgZGF0YSkge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAvLyBUWVBFIDExOTogU1RSSU5HXG4gICAgICB3cml0ZShlbmNvZGVyLCAxMTkpXG4gICAgICB3cml0ZVZhclN0cmluZyhlbmNvZGVyLCBkYXRhKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgaWYgKG51bWJlci5pc0ludGVnZXIoZGF0YSkgJiYgbWF0aC5hYnMoZGF0YSkgPD0gYmluYXJ5LkJJVFMzMSkge1xuICAgICAgICAvLyBUWVBFIDEyNTogSU5URUdFUlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjUpXG4gICAgICAgIHdyaXRlVmFySW50KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2UgaWYgKGlzRmxvYXQzMihkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDEyNDogRkxPQVQzMlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjQpXG4gICAgICAgIHdyaXRlRmxvYXQzMihlbmNvZGVyLCBkYXRhKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVFlQRSAxMjM6IEZMT0FUNjRcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTIzKVxuICAgICAgICB3cml0ZUZsb2F0NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmlnaW50JzpcbiAgICAgIC8vIFRZUEUgMTIyOiBCaWdJbnRcbiAgICAgIHdyaXRlKGVuY29kZXIsIDEyMilcbiAgICAgIHdyaXRlQmlnSW50NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgICAgIC8vIFRZUEUgMTI2OiBudWxsXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDEyNilcbiAgICAgIH0gZWxzZSBpZiAoYXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDExNzogQXJyYXlcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTE3KVxuICAgICAgICB3cml0ZVZhclVpbnQoZW5jb2RlciwgZGF0YS5sZW5ndGgpXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHdyaXRlQW55KGVuY29kZXIsIGRhdGFbaV0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgLy8gVFlQRSAxMTY6IEFycmF5QnVmZmVyXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExNilcbiAgICAgICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUWVBFIDExODogT2JqZWN0XG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExOClcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpXG4gICAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLCBrZXlzLmxlbmd0aClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXVxuICAgICAgICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIGtleSlcbiAgICAgICAgICB3cml0ZUFueShlbmNvZGVyLCBkYXRhW2tleV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAvLyBUWVBFIDEyMC8xMjE6IGJvb2xlYW4gKHRydWUvZmFsc2UpXG4gICAgICB3cml0ZShlbmNvZGVyLCBkYXRhID8gMTIwIDogMTIxKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gVFlQRSAxMjc6IHVuZGVmaW5lZFxuICAgICAgd3JpdGUoZW5jb2RlciwgMTI3KVxuICB9XG59XG5cbi8qKlxuICogTm93IGNvbWUgYSBmZXcgc3RhdGVmdWwgZW5jb2RlciB0aGF0IGhhdmUgdGhlaXIgb3duIGNsYXNzZXMuXG4gKi9cblxuLyoqXG4gKiBCYXNpYyBSdW4gTGVuZ3RoIEVuY29kZXIgLSBhIGJhc2ljIGNvbXByZXNzaW9uIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIEVuY29kZXMgWzEsMSwxLDddIHRvIFsxLDMsNywxXSAoMyB0aW1lcyAxLCAxIHRpbWUgNykuIFRoaXMgZW5jb2RlciBtaWdodCBkbyBtb3JlIGhhcm0gdGhhbiBnb29kIGlmIHRoZXJlIGFyZSBhIGxvdCBvZiB2YWx1ZXMgdGhhdCBhcmUgbm90IHJlcGVhdGVkLlxuICpcbiAqIEl0IHdhcyBvcmlnaW5hbGx5IHVzZWQgZm9yIGltYWdlIGNvbXByZXNzaW9uLiBDb29sIC4uIGFydGljbGUgaHR0cDovL2NzYnJ1Y2UuY29tL2NibS90cmFuc2FjdG9yL3BkZnMvdHJhbnNfdjdfaTA2LnBkZlxuICpcbiAqIEBub3RlIFQgbXVzdCBub3QgYmUgbnVsbCFcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICovXG5leHBvcnQgY2xhc3MgUmxlRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbihFbmNvZGVyLCBUKTp2b2lkfSB3cml0ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yICh3cml0ZXIpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogVGhlIHdyaXRlclxuICAgICAqL1xuICAgIHRoaXMudyA9IHdyaXRlclxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7VHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucyA9IG51bGxcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VH0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuY291bnQgPiAwKSB7XG4gICAgICAgIC8vIGZsdXNoIGNvdW50ZXIsIHVubGVzcyB0aGlzIGlzIHRoZSBmaXJzdCB2YWx1ZSAoY291bnQgPSAwKVxuICAgICAgICB3cml0ZVZhclVpbnQodGhpcywgdGhpcy5jb3VudCAtIDEpIC8vIHNpbmNlIGNvdW50IGlzIGFsd2F5cyA+IDAsIHdlIGNhbiBkZWNyZW1lbnQgYnkgb25lLiBub24tc3RhbmRhcmQgZW5jb2RpbmcgZnR3XG4gICAgICB9XG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgLy8gd3JpdGUgZmlyc3QgdmFsdWVcbiAgICAgIHRoaXMudyh0aGlzLCB2KVxuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJhc2ljIGRpZmYgZGVjb2RlciB1c2luZyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuXG4gKlxuICogRW5jb2RlcyB0aGUgdmFsdWVzIFszLCAxMTAwLCAxMTAxLCAxMDUwLCAwXSB0byBbMywgMTA5NywgMSwgLTUxLCAtMTA1MF0gdXNpbmcgd3JpdGVWYXJJbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICB3cml0ZVZhckludCh0aGlzLCB2IC0gdGhpcy5zKVxuICAgIHRoaXMucyA9IHZcbiAgfVxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2YgSW50RGlmZkVuY29kZXIgYW5kIFJsZUVuY29kZXIuXG4gKlxuICogQmFzaWNhbGx5IGZpcnN0IHdyaXRlcyB0aGUgSW50RGlmZkVuY29kZXIgYW5kIHRoZW4gY291bnRzIGR1cGxpY2F0ZSBkaWZmcyB1c2luZyBSbGVFbmNvZGluZy5cbiAqXG4gKiBFbmNvZGVzIHRoZSB2YWx1ZXMgWzEsMSwxLDIsMyw0LDUsNl0gYXMgWzEsMSwwLDIsMSw1XSAoUkxFKFsxLDAsMCwxLDEsMSwxLDFdKSBcdTIxRDIgUmxlSW50RGlmZlsxLDEsMCwyLDEsNV0pXG4gKi9cbmV4cG9ydCBjbGFzcyBSbGVJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLnMgPT09IHYgJiYgdGhpcy5jb3VudCA+IDApIHtcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5jb3VudCA+IDApIHtcbiAgICAgICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgICAgIHdyaXRlVmFyVWludCh0aGlzLCB0aGlzLmNvdW50IC0gMSkgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMCwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICAgIH1cbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICAvLyB3cml0ZSBmaXJzdCB2YWx1ZVxuICAgICAgd3JpdGVWYXJJbnQodGhpcywgdiAtIHRoaXMucylcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnRPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoVWludE9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgc2lnbiB0byBwb3NpdGl2ZVxuICAgIC8vIGNhc2UgMjogd3JpdGUgc2V2ZXJhbCB2YWx1ZXMuIHNldCBzaWduIHRvIG5lZ2F0aXZlIHRvIGluZGljYXRlIHRoYXQgdGhlcmUgaXMgYSBsZW5ndGggY29taW5nXG4gICAgd3JpdGVWYXJJbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50ID09PSAxID8gZW5jb2Rlci5zIDogLWVuY29kZXIucylcbiAgICBpZiAoZW5jb2Rlci5jb3VudCA+IDEpIHtcbiAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLmVuY29kZXIsIGVuY29kZXIuY291bnQgLSAyKSAvLyBzaW5jZSBjb3VudCBpcyBhbHdheXMgPiAxLCB3ZSBjYW4gZGVjcmVtZW50IGJ5IG9uZS4gbm9uLXN0YW5kYXJkIGVuY29kaW5nIGZ0d1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE9wdGltaXplZCBSbGUgZW5jb2RlciB0aGF0IGRvZXMgbm90IHN1ZmZlciBmcm9tIHRoZSBtZW50aW9uZWQgcHJvYmxlbSBvZiB0aGUgYmFzaWMgUmxlIGVuY29kZXIuXG4gKlxuICogSW50ZXJuYWxseSB1c2VzIFZhckludCBlbmNvZGVyIHRvIHdyaXRlIHVuc2lnbmVkIGludGVnZXJzLiBJZiB0aGUgaW5wdXQgb2NjdXJzIG11bHRpcGxlIHRpbWVzLCB3ZSB3cml0ZVxuICogd3JpdGUgaXQgYXMgYSBuZWdhdGl2ZSBudW1iZXIuIFRoZSBVaW50T3B0UmxlRGVjb2RlciB0aGVuIHVuZGVyc3RhbmRzIHRoYXQgaXQgbmVlZHMgdG8gcmVhZCBhIGNvdW50LlxuICpcbiAqIEVuY29kZXMgWzEsMiwzLDMsM10gYXMgWzEsMiwtMywzXSAob25jZSAxLCBvbmNlIDIsIHRocmVlIHRpbWVzIDMpXG4gKi9cbmV4cG9ydCBjbGFzcyBVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgZmx1c2hVaW50T3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmx1c2ggdGhlIGVuY29kZWQgc3RhdGUgYW5kIHRyYW5zZm9ybSB0aGlzIHRvIGEgVWludDhBcnJheS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uY2UuXG4gICAqL1xuICB0b1VpbnQ4QXJyYXkgKCkge1xuICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KHRoaXMuZW5jb2RlcilcbiAgfVxufVxuXG4vKipcbiAqIEluY3JlYXNpbmcgVWludCBPcHRpbWl6ZWQgUkxFIEVuY29kZXJcbiAqXG4gKiBUaGUgUkxFIGVuY29kZXIgY291bnRzIHRoZSBudW1iZXIgb2Ygc2FtZSBvY2N1cmVuY2VzIG9mIHRoZSBzYW1lIHZhbHVlLlxuICogVGhlIEluY1VpbnRPcHRSbGUgZW5jb2RlciBjb3VudHMgaWYgdGhlIHZhbHVlIGluY3JlYXNlcy5cbiAqIEkuZS4gNywgOCwgOSwgMTAgd2lsbCBiZSBlbmNvZGVkIGFzIFstNywgNF0uIDEsIDMsIDUgd2lsbCBiZSBlbmNvZGVkXG4gKiBhcyBbMSwgMywgNV0uXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmNVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zICsgdGhpcy5jb3VudCA9PT0gdikge1xuICAgICAgdGhpcy5jb3VudCsrXG4gICAgfSBlbHNlIHtcbiAgICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICB0aGlzLnMgPSB2XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZsdXNoIHRoZSBlbmNvZGVkIHN0YXRlIGFuZCB0cmFuc2Zvcm0gdGhpcyB0byBhIFVpbnQ4QXJyYXkuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBvbmNlLlxuICAgKi9cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBmbHVzaFVpbnRPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgcmV0dXJuIHRvVWludDhBcnJheSh0aGlzLmVuY29kZXIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0ludERpZmZPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoSW50RGlmZk9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gICAgICAgICAgMzEgYml0IG1ha2luZyB1cCB0aGUgZGlmZiB8IHdldGhlciB0byB3cml0ZSB0aGUgY291bnRlclxuICAgIC8vIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmIDw8IDEgfCAoZW5jb2Rlci5jb3VudCA9PT0gMSA/IDAgOiAxKVxuICAgIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmICogMiArIChlbmNvZGVyLmNvdW50ID09PSAxID8gMCA6IDEpXG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgZmlyc3QgYml0IHRvIHBvc2l0aXZlXG4gICAgLy8gY2FzZSAyOiB3cml0ZSBzZXZlcmFsIHZhbHVlcy4gc2V0IGZpcnN0IGJpdCB0byBuZWdhdGl2ZSB0byBpbmRpY2F0ZSB0aGF0IHRoZXJlIGlzIGEgbGVuZ3RoIGNvbWluZ1xuICAgIHdyaXRlVmFySW50KGVuY29kZXIuZW5jb2RlciwgZW5jb2RlZERpZmYpXG4gICAgaWYgKGVuY29kZXIuY291bnQgPiAxKSB7XG4gICAgICB3cml0ZVZhclVpbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50IC0gMikgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMSwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mIHRoZSBJbnREaWZmRW5jb2RlciBhbmQgdGhlIFVpbnRPcHRSbGVFbmNvZGVyLlxuICpcbiAqIFRoZSBjb3VudCBhcHByb2FjaCBpcyBzaW1pbGFyIHRvIHRoZSBVaW50RGlmZk9wdFJsZUVuY29kZXIsIGJ1dCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBuZWdhdGl2ZSBiaXRmbGFnLCBpdCBlbmNvZGVzXG4gKiBpbiB0aGUgTFNCIHdoZXRoZXIgYSBjb3VudCBpcyB0byBiZSByZWFkLiBUaGVyZWZvcmUgdGhpcyBFbmNvZGVyIG9ubHkgc3VwcG9ydHMgMzEgYml0IGludGVnZXJzIVxuICpcbiAqIEVuY29kZXMgWzEsIDIsIDMsIDJdIGFzIFszLCAxLCA2LCAtMV0gKG1vcmUgc3BlY2lmaWNhbGx5IFsoMSA8PCAxKSB8IDEsICgzIDw8IDApIHwgMCwgLTFdKVxuICpcbiAqIEludGVybmFsbHkgdXNlcyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuIENvbnRyYXJ5IHRvIG5vcm1hbCBVaW50VmFyIGVuY29kaW5nLCB0aGUgZmlyc3QgYnl0ZSBjb250YWluczpcbiAqICogMSBiaXQgdGhhdCBkZW5vdGVzIHdoZXRoZXIgdGhlIG5leHQgdmFsdWUgaXMgYSBjb3VudCAoTFNCKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0aGlzIHZhbHVlIGlzIG5lZ2F0aXZlIChNU0IgLSAxKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0byBjb250aW51ZSByZWFkaW5nIHRoZSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlciAoTVNCKVxuICpcbiAqIFRoZXJlZm9yZSwgb25seSBmaXZlIGJpdHMgcmVtYWluIHRvIGVuY29kZSBkaWZmIHJhbmdlcy5cbiAqXG4gKiBVc2UgdGhpcyBFbmNvZGVyIG9ubHkgd2hlbiBhcHByb3ByaWF0ZS4gSW4gbW9zdCBjYXNlcywgdGhpcyBpcyBwcm9iYWJseSBhIGJhZCBpZGVhLlxuICovXG5leHBvcnQgY2xhc3MgSW50RGlmZk9wdFJsZUVuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5lbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gMFxuICAgIHRoaXMuY291bnQgPSAwXG4gICAgdGhpcy5kaWZmID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLmRpZmYgPT09IHYgLSB0aGlzLnMpIHtcbiAgICAgIHRoaXMucyA9IHZcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBmbHVzaEludERpZmZPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgdGhpcy5kaWZmID0gdiAtIHRoaXMuc1xuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGbHVzaCB0aGUgZW5jb2RlZCBzdGF0ZSBhbmQgdHJhbnNmb3JtIHRoaXMgdG8gYSBVaW50OEFycmF5LlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBzaG91bGQgb25seSBiZSBjYWxsZWQgb25jZS5cbiAgICovXG4gIHRvVWludDhBcnJheSAoKSB7XG4gICAgZmx1c2hJbnREaWZmT3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgIHJldHVybiB0b1VpbnQ4QXJyYXkodGhpcy5lbmNvZGVyKVxuICB9XG59XG5cbi8qKlxuICogT3B0aW1pemVkIFN0cmluZyBFbmNvZGVyLlxuICpcbiAqIEVuY29kaW5nIG1hbnkgc21hbGwgc3RyaW5ncyBpbiBhIHNpbXBsZSBFbmNvZGVyIGlzIG5vdCB2ZXJ5IGVmZmljaWVudC4gVGhlIGZ1bmN0aW9uIGNhbGwgdG8gZGVjb2RlIGEgc3RyaW5nIHRha2VzIHNvbWUgdGltZSBhbmQgY3JlYXRlcyByZWZlcmVuY2VzIHRoYXQgbXVzdCBiZSBldmVudHVhbGx5IGRlbGV0ZWQuXG4gKiBJbiBwcmFjdGljZSwgd2hlbiBkZWNvZGluZyBzZXZlcmFsIG1pbGxpb24gc21hbGwgc3RyaW5ncywgdGhlIEdDIHdpbGwga2ljayBpbiBtb3JlIGFuZCBtb3JlIG9mdGVuIHRvIGNvbGxlY3Qgb3JwaGFuZWQgc3RyaW5nIG9iamVjdHMgKG9yIG1heWJlIHRoZXJlIGlzIGFub3RoZXIgcmVhc29uPykuXG4gKlxuICogVGhpcyBzdHJpbmcgZW5jb2RlciBzb2x2ZXMgdGhlIGFib3ZlIHByb2JsZW0uIEFsbCBzdHJpbmdzIGFyZSBjb25jYXRlbmF0ZWQgYW5kIHdyaXR0ZW4gYXMgYSBzaW5nbGUgc3RyaW5nIHVzaW5nIGEgc2luZ2xlIGVuY29kaW5nIGNhbGwuXG4gKlxuICogVGhlIGxlbmd0aHMgYXJlIGVuY29kZWQgdXNpbmcgYSBVaW50T3B0UmxlRW5jb2Rlci5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ0VuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PHN0cmluZz59XG4gICAgICovXG4gICAgdGhpcy5zYXJyID0gW11cbiAgICB0aGlzLnMgPSAnJ1xuICAgIHRoaXMubGVuc0UgPSBuZXcgVWludE9wdFJsZUVuY29kZXIoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAgICovXG4gIHdyaXRlIChzdHJpbmcpIHtcbiAgICB0aGlzLnMgKz0gc3RyaW5nXG4gICAgaWYgKHRoaXMucy5sZW5ndGggPiAxOSkge1xuICAgICAgdGhpcy5zYXJyLnB1c2godGhpcy5zKVxuICAgICAgdGhpcy5zID0gJydcbiAgICB9XG4gICAgdGhpcy5sZW5zRS53cml0ZShzdHJpbmcubGVuZ3RoKVxuICB9XG5cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBjb25zdCBlbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIHRoaXMuc2Fyci5wdXNoKHRoaXMucylcbiAgICB0aGlzLnMgPSAnJ1xuICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIHRoaXMuc2Fyci5qb2luKCcnKSlcbiAgICB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5sZW5zRS50b1VpbnQ4QXJyYXkoKSlcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KGVuY29kZXIpXG4gIH1cbn1cbiIsICIvKipcbiAqIEVycm9yIGhlbHBlcnMuXG4gKlxuICogQG1vZHVsZSBlcnJvclxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNcbiAqIEByZXR1cm4ge0Vycm9yfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9IHMgPT4gbmV3IEVycm9yKHMpXG5cbi8qKlxuICogQHRocm93cyB7RXJyb3J9XG4gKiBAcmV0dXJuIHtuZXZlcn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMyAqL1xuZXhwb3J0IGNvbnN0IG1ldGhvZFVuaW1wbGVtZW50ZWQgPSAoKSA9PiB7XG4gIHRocm93IGNyZWF0ZSgnTWV0aG9kIHVuaW1wbGVtZW50ZWQnKVxufVxuXG4vKipcbiAqIEB0aHJvd3Mge0Vycm9yfVxuICogQHJldHVybiB7bmV2ZXJ9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDMgKi9cbmV4cG9ydCBjb25zdCB1bmV4cGVjdGVkQ2FzZSA9ICgpID0+IHtcbiAgdGhyb3cgY3JlYXRlKCdVbmV4cGVjdGVkIGNhc2UnKVxufVxuIiwgIi8qKlxuICogRWZmaWNpZW50IHNjaGVtYS1sZXNzIGJpbmFyeSBkZWNvZGluZyB3aXRoIHN1cHBvcnQgZm9yIHZhcmlhYmxlIGxlbmd0aCBlbmNvZGluZy5cbiAqXG4gKiBVc2UgW2xpYjAvZGVjb2RpbmddIHdpdGggW2xpYjAvZW5jb2RpbmddLiBFdmVyeSBlbmNvZGluZyBmdW5jdGlvbiBoYXMgYSBjb3JyZXNwb25kaW5nIGRlY29kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEVuY29kZXMgbnVtYmVycyBpbiBsaXR0bGUtZW5kaWFuIG9yZGVyIChsZWFzdCB0byBtb3N0IHNpZ25pZmljYW50IGJ5dGUgb3JkZXIpXG4gKiBhbmQgaXMgY29tcGF0aWJsZSB3aXRoIEdvbGFuZydzIGJpbmFyeSBlbmNvZGluZyAoaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9lbmNvZGluZy9iaW5hcnkvKVxuICogd2hpY2ggaXMgYWxzbyB1c2VkIGluIFByb3RvY29sIEJ1ZmZlcnMuXG4gKlxuICogYGBganNcbiAqIC8vIGVuY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAqIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCAyNTYpXG4gKiBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyLCAnSGVsbG8gd29ybGQhJylcbiAqIGNvbnN0IGJ1ZiA9IGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyKVxuICogYGBgXG4gKlxuICogYGBganNcbiAqIC8vIGRlY29kaW5nIHN0ZXBcbiAqIGNvbnN0IGRlY29kZXIgPSBkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZilcbiAqIGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpIC8vID0+IDI1NlxuICogZGVjb2RpbmcucmVhZFZhclN0cmluZyhkZWNvZGVyKSAvLyA9PiAnSGVsbG8gd29ybGQhJ1xuICogZGVjb2RpbmcuaGFzQ29udGVudChkZWNvZGVyKSAvLyA9PiBmYWxzZSAtIGFsbCBkYXRhIGlzIHJlYWRcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGUgZGVjb2RpbmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBiaW5hcnkgZnJvbSAnLi9iaW5hcnkuanMnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIG51bWJlciBmcm9tICcuL251bWJlci5qcydcbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJy4vZXJyb3IuanMnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICcuL2VuY29kaW5nLmpzJ1xuXG5jb25zdCBlcnJvclVuZXhwZWN0ZWRFbmRPZkFycmF5ID0gZXJyb3IuY3JlYXRlKCdVbmV4cGVjdGVkIGVuZCBvZiBhcnJheScpXG5jb25zdCBlcnJvckludGVnZXJPdXRPZlJhbmdlID0gZXJyb3IuY3JlYXRlKCdJbnRlZ2VyIG91dCBvZiBSYW5nZScpXG5cbi8qKlxuICogQSBEZWNvZGVyIGhhbmRsZXMgdGhlIGRlY29kaW5nIG9mIGFuIFVpbnQ4QXJyYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheSBCaW5hcnkgZGF0YSB0byBkZWNvZGVcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgLyoqXG4gICAgICogRGVjb2RpbmcgdGFyZ2V0LlxuICAgICAqXG4gICAgICogQHR5cGUge1VpbnQ4QXJyYXl9XG4gICAgICovXG4gICAgdGhpcy5hcnIgPSB1aW50OEFycmF5XG4gICAgLyoqXG4gICAgICogQ3VycmVudCBkZWNvZGluZyBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5wb3MgPSAwXG4gIH1cbn1cblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICogQHJldHVybiB7RGVjb2Rlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURlY29kZXIgPSB1aW50OEFycmF5ID0+IG5ldyBEZWNvZGVyKHVpbnQ4QXJyYXkpXG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBoYXNDb250ZW50ID0gZGVjb2RlciA9PiBkZWNvZGVyLnBvcyAhPT0gZGVjb2Rlci5hcnIubGVuZ3RoXG5cbi8qKlxuICogQ2xvbmUgYSBkZWNvZGVyIGluc3RhbmNlLlxuICogT3B0aW9uYWxseSBzZXQgYSBuZXcgcG9zaXRpb24gcGFyYW1ldGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge251bWJlcn0gW25ld1Bvc10gRGVmYXVsdHMgdG8gY3VycmVudCBwb3NpdGlvblxuICogQHJldHVybiB7RGVjb2Rlcn0gQSBjbG9uZSBvZiBgZGVjb2RlcmBcbiAqL1xuZXhwb3J0IGNvbnN0IGNsb25lID0gKGRlY29kZXIsIG5ld1BvcyA9IGRlY29kZXIucG9zKSA9PiB7XG4gIGNvbnN0IF9kZWNvZGVyID0gY3JlYXRlRGVjb2RlcihkZWNvZGVyLmFycilcbiAgX2RlY29kZXIucG9zID0gbmV3UG9zXG4gIHJldHVybiBfZGVjb2RlclxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBVaW50OEFycmF5IHZpZXcgb2YgdGhlIG5leHQgYGxlbmAgYnl0ZXMgYW5kIGFkdmFuY2UgdGhlIHBvc2l0aW9uIGJ5IGBsZW5gLlxuICpcbiAqIEltcG9ydGFudDogVGhlIFVpbnQ4QXJyYXkgc3RpbGwgcG9pbnRzIHRvIHRoZSB1bmRlcmx5aW5nIEFycmF5QnVmZmVyLiBNYWtlIHN1cmUgdG8gZGlzY2FyZCB0aGUgcmVzdWx0IGFzIHNvb24gYXMgcG9zc2libGUgdG8gcHJldmVudCBhbnkgbWVtb3J5IGxlYWtzLlxuICogICAgICAgICAgICBVc2UgYGJ1ZmZlci5jb3B5VWludDhBcnJheWAgdG8gY29weSB0aGUgcmVzdWx0IGludG8gYSBuZXcgVWludDhBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiBUaGUgbGVuZ3RoIG9mIGJ5dGVzIHRvIHJlYWRcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVWludDhBcnJheSA9IChkZWNvZGVyLCBsZW4pID0+IHtcbiAgY29uc3QgdmlldyA9IG5ldyBVaW50OEFycmF5KGRlY29kZXIuYXJyLmJ1ZmZlciwgZGVjb2Rlci5wb3MgKyBkZWNvZGVyLmFyci5ieXRlT2Zmc2V0LCBsZW4pXG4gIGRlY29kZXIucG9zICs9IGxlblxuICByZXR1cm4gdmlld1xufVxuXG4vKipcbiAqIFJlYWQgdmFyaWFibGUgbGVuZ3RoIFVpbnQ4QXJyYXkuXG4gKlxuICogSW1wb3J0YW50OiBUaGUgVWludDhBcnJheSBzdGlsbCBwb2ludHMgdG8gdGhlIHVuZGVybHlpbmcgQXJyYXlCdWZmZXIuIE1ha2Ugc3VyZSB0byBkaXNjYXJkIHRoZSByZXN1bHQgYXMgc29vbiBhcyBwb3NzaWJsZSB0byBwcmV2ZW50IGFueSBtZW1vcnkgbGVha3MuXG4gKiAgICAgICAgICAgIFVzZSBgYnVmZmVyLmNvcHlVaW50OEFycmF5YCB0byBjb3B5IHRoZSByZXN1bHQgaW50byBhIG5ldyBVaW50OEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFZhclVpbnQ4QXJyYXkgPSBkZWNvZGVyID0+IHJlYWRVaW50OEFycmF5KGRlY29kZXIsIHJlYWRWYXJVaW50KGRlY29kZXIpKVxuXG4vKipcbiAqIFJlYWQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgYXMgYW4gQXJyYXlCdWZmZXJcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFRhaWxBc1VpbnQ4QXJyYXkgPSBkZWNvZGVyID0+IHJlYWRVaW50OEFycmF5KGRlY29kZXIsIGRlY29kZXIuYXJyLmxlbmd0aCAtIGRlY29kZXIucG9zKVxuXG4vKipcbiAqIFNraXAgb25lIGJ5dGUsIGp1bXAgdG8gdGhlIG5leHQgcG9zaXRpb24uXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgbmV4dCBwb3NpdGlvblxuICovXG5leHBvcnQgY29uc3Qgc2tpcDggPSBkZWNvZGVyID0+IGRlY29kZXIucG9zKytcblxuLyoqXG4gKiBSZWFkIG9uZSBieXRlIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHJldHVybiB7bnVtYmVyfSBVbnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVWludDggPSBkZWNvZGVyID0+IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG5cbi8qKlxuICogUmVhZCAyIGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MTYgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3NdICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KVxuICBkZWNvZGVyLnBvcyArPSAyXG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogUmVhZCA0IGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MzIgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zXSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMV0gPDwgOCkgK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDJdIDw8IDE2KSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgM10gPDwgMjQpKSA+Pj4gMFxuICBkZWNvZGVyLnBvcyArPSA0XG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogUmVhZCA0IGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIgaW4gYmlnIGVuZGlhbiBvcmRlci5cbiAqIChtb3N0IHNpZ25pZmljYW50IGJ5dGUgZmlyc3QpXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MzJCaWdFbmRpYW4gPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgM10gK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDJdIDw8IDgpICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCAxNikgK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gPDwgMjQpKSA+Pj4gMFxuICBkZWNvZGVyLnBvcyArPSA0XG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogTG9vayBhaGVhZCB3aXRob3V0IGluY3JlbWVudGluZyB0aGUgcG9zaXRpb25cbiAqIHRvIHRoZSBuZXh0IGJ5dGUgYW5kIHJlYWQgaXQgYXMgdW5zaWduZWQgaW50ZWdlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICovXG5leHBvcnQgY29uc3QgcGVla1VpbnQ4ID0gZGVjb2RlciA9PiBkZWNvZGVyLmFycltkZWNvZGVyLnBvc11cblxuLyoqXG4gKiBMb29rIGFoZWFkIHdpdGhvdXQgaW5jcmVtZW50aW5nIHRoZSBwb3NpdGlvblxuICogdG8gdGhlIG5leHQgYnl0ZSBhbmQgcmVhZCBpdCBhcyB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IEFuIHVuc2lnbmVkIGludGVnZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVWludDE2ID0gZGVjb2RlciA9PlxuICBkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KVxuXG4vKipcbiAqIExvb2sgYWhlYWQgd2l0aG91dCBpbmNyZW1lbnRpbmcgdGhlIHBvc2l0aW9uXG4gKiB0byB0aGUgbmV4dCBieXRlIGFuZCByZWFkIGl0IGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBlZWtVaW50MzIgPSBkZWNvZGVyID0+IChcbiAgZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3NdICtcbiAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMV0gPDwgOCkgK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAyXSA8PCAxNikgK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAzXSA8PCAyNClcbikgPj4+IDBcblxuLyoqXG4gKiBSZWFkIHVuc2lnbmVkIGludGVnZXIgKDMyYml0KSB3aXRoIHZhcmlhYmxlIGxlbmd0aC5cbiAqIDEvOHRoIG9mIHRoZSBzdG9yYWdlIGlzIHVzZWQgYXMgZW5jb2Rpbmcgb3ZlcmhlYWQuXG4gKiAgKiBudW1iZXJzIDwgMl43IGlzIHN0b3JlZCBpbiBvbmUgYnl0bGVuZ3RoXG4gKiAgKiBudW1iZXJzIDwgMl4xNCBpcyBzdG9yZWQgaW4gdHdvIGJ5bGVuZ3RoXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5sZW5ndGhcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRWYXJVaW50ID0gZGVjb2RlciA9PiB7XG4gIGxldCBudW0gPSAwXG4gIGxldCBtdWx0ID0gMVxuICBjb25zdCBsZW4gPSBkZWNvZGVyLmFyci5sZW5ndGhcbiAgd2hpbGUgKGRlY29kZXIucG9zIDwgbGVuKSB7XG4gICAgY29uc3QgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gICAgLy8gbnVtID0gbnVtIHwgKChyICYgYmluYXJ5LkJJVFM3KSA8PCBsZW4pXG4gICAgbnVtID0gbnVtICsgKHIgJiBiaW5hcnkuQklUUzcpICogbXVsdCAvLyBzaGlmdCAkciA8PCAoNyojaXRlcmF0aW9ucykgYW5kIGFkZCBpdCB0byBudW1cbiAgICBtdWx0ICo9IDEyOCAvLyBuZXh0IGl0ZXJhdGlvbiwgc2hpZnQgNyBcIm1vcmVcIiB0byB0aGUgbGVmdFxuICAgIGlmIChyIDwgYmluYXJ5LkJJVDgpIHtcbiAgICAgIHJldHVybiBudW1cbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0YXJ0ICovXG4gICAgaWYgKG51bSA+IG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICB0aHJvdyBlcnJvckludGVnZXJPdXRPZlJhbmdlXG4gICAgfVxuICAgIC8qIGM4IGlnbm9yZSBzdG9wICovXG4gIH1cbiAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxufVxuXG4vKipcbiAqIFJlYWQgc2lnbmVkIGludGVnZXIgKDMyYml0KSB3aXRoIHZhcmlhYmxlIGxlbmd0aC5cbiAqIDEvOHRoIG9mIHRoZSBzdG9yYWdlIGlzIHVzZWQgYXMgZW5jb2Rpbmcgb3ZlcmhlYWQuXG4gKiAgKiBudW1iZXJzIDwgMl43IGlzIHN0b3JlZCBpbiBvbmUgYnl0bGVuZ3RoXG4gKiAgKiBudW1iZXJzIDwgMl4xNCBpcyBzdG9yZWQgaW4gdHdvIGJ5bGVuZ3RoXG4gKiBAdG9kbyBUaGlzIHNob3VsZCBwcm9iYWJseSBjcmVhdGUgdGhlIGludmVyc2Ugfm51bSBpZiBudW1iZXIgaXMgbmVnYXRpdmUgLSBidXQgdGhpcyB3b3VsZCBiZSBhIGJyZWFraW5nIGNoYW5nZS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLmxlbmd0aFxuICovXG5leHBvcnQgY29uc3QgcmVhZFZhckludCA9IGRlY29kZXIgPT4ge1xuICBsZXQgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gIGxldCBudW0gPSByICYgYmluYXJ5LkJJVFM2XG4gIGxldCBtdWx0ID0gNjRcbiAgY29uc3Qgc2lnbiA9IChyICYgYmluYXJ5LkJJVDcpID4gMCA/IC0xIDogMVxuICBpZiAoKHIgJiBiaW5hcnkuQklUOCkgPT09IDApIHtcbiAgICAvLyBkb24ndCBjb250aW51ZSByZWFkaW5nXG4gICAgcmV0dXJuIHNpZ24gKiBudW1cbiAgfVxuICBjb25zdCBsZW4gPSBkZWNvZGVyLmFyci5sZW5ndGhcbiAgd2hpbGUgKGRlY29kZXIucG9zIDwgbGVuKSB7XG4gICAgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gICAgLy8gbnVtID0gbnVtIHwgKChyICYgYmluYXJ5LkJJVFM3KSA8PCBsZW4pXG4gICAgbnVtID0gbnVtICsgKHIgJiBiaW5hcnkuQklUUzcpICogbXVsdFxuICAgIG11bHQgKj0gMTI4XG4gICAgaWYgKHIgPCBiaW5hcnkuQklUOCkge1xuICAgICAgcmV0dXJuIHNpZ24gKiBudW1cbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0YXJ0ICovXG4gICAgaWYgKG51bSA+IG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICB0aHJvdyBlcnJvckludGVnZXJPdXRPZlJhbmdlXG4gICAgfVxuICAgIC8qIGM4IGlnbm9yZSBzdG9wICovXG4gIH1cbiAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxufVxuXG4vKipcbiAqIExvb2sgYWhlYWQgYW5kIHJlYWQgdmFyVWludCB3aXRob3V0IGluY3JlbWVudGluZyBwb3NpdGlvblxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVmFyVWludCA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgZGVjb2Rlci5wb3MgPSBwb3NcbiAgcmV0dXJuIHNcbn1cblxuLyoqXG4gKiBMb29rIGFoZWFkIGFuZCByZWFkIHZhclVpbnQgd2l0aG91dCBpbmNyZW1lbnRpbmcgcG9zaXRpb25cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgcGVla1ZhckludCA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhckludChkZWNvZGVyKVxuICBkZWNvZGVyLnBvcyA9IHBvc1xuICByZXR1cm4gc1xufVxuXG4vKipcbiAqIFdlIGRvbid0IHRlc3QgdGhpcyBmdW5jdGlvbiBhbnltb3JlIGFzIHdlIHVzZSBuYXRpdmUgZGVjb2RpbmcvZW5jb2RpbmcgYnkgZGVmYXVsdCBub3cuXG4gKiBCZXR0ZXIgbm90IG1vZGlmeSB0aGlzIGFueW1vcmUuLlxuICpcbiAqIFRyYW5zZm9ybWluZyB1dGY4IHRvIGEgc3RyaW5nIGlzIHByZXR0eSBleHBlbnNpdmUuIFRoZSBjb2RlIHBlcmZvcm1zIDEweCBiZXR0ZXJcbiAqIHdoZW4gU3RyaW5nLmZyb21Db2RlUG9pbnQgaXMgZmVkIHdpdGggYWxsIGNoYXJhY3RlcnMgYXMgYXJndW1lbnRzLlxuICogQnV0IG1vc3QgZW52aXJvbm1lbnRzIGhhdmUgYSBtYXhpbXVtIG51bWJlciBvZiBhcmd1bWVudHMgcGVyIGZ1bmN0aW9ucy5cbiAqIEZvciBlZmZpZW5jeSByZWFzb25zIHdlIGFwcGx5IGEgbWF4aW11bSBvZiAxMDAwMCBjaGFyYWN0ZXJzIGF0IG9uY2UuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHJlYWQgU3RyaW5nLlxuICovXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmV4cG9ydCBjb25zdCBfcmVhZFZhclN0cmluZ1BvbHlmaWxsID0gZGVjb2RlciA9PiB7XG4gIGxldCByZW1haW5pbmdMZW4gPSByZWFkVmFyVWludChkZWNvZGVyKVxuICBpZiAocmVtYWluaW5nTGVuID09PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH0gZWxzZSB7XG4gICAgbGV0IGVuY29kZWRTdHJpbmcgPSBTdHJpbmcuZnJvbUNvZGVQb2ludChyZWFkVWludDgoZGVjb2RlcikpIC8vIHJlbWVtYmVyIHRvIGRlY3JlYXNlIHJlbWFpbmluZ0xlblxuICAgIGlmICgtLXJlbWFpbmluZ0xlbiA8IDEwMCkgeyAvLyBkbyBub3QgY3JlYXRlIGEgVWludDhBcnJheSBmb3Igc21hbGwgc3RyaW5nc1xuICAgICAgd2hpbGUgKHJlbWFpbmluZ0xlbi0tKSB7XG4gICAgICAgIGVuY29kZWRTdHJpbmcgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQocmVhZFVpbnQ4KGRlY29kZXIpKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAocmVtYWluaW5nTGVuID4gMCkge1xuICAgICAgICBjb25zdCBuZXh0TGVuID0gcmVtYWluaW5nTGVuIDwgMTAwMDAgPyByZW1haW5pbmdMZW4gOiAxMDAwMFxuICAgICAgICAvLyB0aGlzIGlzIGRhbmdlcm91cywgd2UgY3JlYXRlIGEgZnJlc2ggYXJyYXkgdmlldyBmcm9tIHRoZSBleGlzdGluZyBidWZmZXJcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBkZWNvZGVyLmFyci5zdWJhcnJheShkZWNvZGVyLnBvcywgZGVjb2Rlci5wb3MgKyBuZXh0TGVuKVxuICAgICAgICBkZWNvZGVyLnBvcyArPSBuZXh0TGVuXG4gICAgICAgIC8vIFN0YXJ0aW5nIHdpdGggRVM1LjEgd2UgY2FuIHN1cHBseSBhIGdlbmVyaWMgYXJyYXktbGlrZSBvYmplY3QgYXMgYXJndW1lbnRzXG4gICAgICAgIGVuY29kZWRTdHJpbmcgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQuYXBwbHkobnVsbCwgLyoqIEB0eXBlIHthbnl9ICovIChieXRlcykpXG4gICAgICAgIHJlbWFpbmluZ0xlbiAtPSBuZXh0TGVuXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKGVuY29kZWRTdHJpbmcpKVxuICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZWFkIFN0cmluZ1xuICovXG5leHBvcnQgY29uc3QgX3JlYWRWYXJTdHJpbmdOYXRpdmUgPSBkZWNvZGVyID0+XG4gIC8qKiBAdHlwZSBhbnkgKi8gKHN0cmluZy51dGY4VGV4dERlY29kZXIpLmRlY29kZShyZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcblxuLyoqXG4gKiBSZWFkIHN0cmluZyBvZiB2YXJpYWJsZSBsZW5ndGhcbiAqICogdmFyVWludCBpcyB1c2VkIHRvIHN0b3JlIHRoZSBsZW5ndGggb2YgdGhlIHN0cmluZ1xuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZWFkIFN0cmluZ1xuICpcbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCByZWFkVmFyU3RyaW5nID0gc3RyaW5nLnV0ZjhUZXh0RGVjb2RlciA/IF9yZWFkVmFyU3RyaW5nTmF0aXZlIDogX3JlYWRWYXJTdHJpbmdQb2x5ZmlsbFxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRUZXJtaW5hdGVkVWludDhBcnJheSA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gIGxldCBiXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgYiA9IHJlYWRVaW50OChkZWNvZGVyKVxuICAgIGlmIChiID09PSAwKSB7XG4gICAgICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG4gICAgfVxuICAgIGlmIChiID09PSAxKSB7XG4gICAgICBiID0gcmVhZFVpbnQ4KGRlY29kZXIpXG4gICAgfVxuICAgIGVuY29kaW5nLndyaXRlKGVuY29kZXIsIGIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRUZXJtaW5hdGVkU3RyaW5nID0gZGVjb2RlciA9PiBzdHJpbmcuZGVjb2RlVXRmOChyZWFkVGVybWluYXRlZFVpbnQ4QXJyYXkoZGVjb2RlcikpXG5cbi8qKlxuICogTG9vayBhaGVhZCBhbmQgcmVhZCB2YXJTdHJpbmcgd2l0aG91dCBpbmNyZW1lbnRpbmcgcG9zaXRpb25cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgcGVla1ZhclN0cmluZyA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhclN0cmluZyhkZWNvZGVyKVxuICBkZWNvZGVyLnBvcyA9IHBvc1xuICByZXR1cm4gc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICogQHJldHVybiB7RGF0YVZpZXd9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkRnJvbURhdGFWaWV3ID0gKGRlY29kZXIsIGxlbikgPT4ge1xuICBjb25zdCBkdiA9IG5ldyBEYXRhVmlldyhkZWNvZGVyLmFyci5idWZmZXIsIGRlY29kZXIuYXJyLmJ5dGVPZmZzZXQgKyBkZWNvZGVyLnBvcywgbGVuKVxuICBkZWNvZGVyLnBvcyArPSBsZW5cbiAgcmV0dXJuIGR2XG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkRmxvYXQzMiA9IGRlY29kZXIgPT4gcmVhZEZyb21EYXRhVmlldyhkZWNvZGVyLCA0KS5nZXRGbG9hdDMyKDAsIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICovXG5leHBvcnQgY29uc3QgcmVhZEZsb2F0NjQgPSBkZWNvZGVyID0+IHJlYWRGcm9tRGF0YVZpZXcoZGVjb2RlciwgOCkuZ2V0RmxvYXQ2NCgwLCBmYWxzZSlcblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRCaWdJbnQ2NCA9IGRlY29kZXIgPT4gLyoqIEB0eXBlIHthbnl9ICovIChyZWFkRnJvbURhdGFWaWV3KGRlY29kZXIsIDgpKS5nZXRCaWdJbnQ2NCgwLCBmYWxzZSlcblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRCaWdVaW50NjQgPSBkZWNvZGVyID0+IC8qKiBAdHlwZSB7YW55fSAqLyAocmVhZEZyb21EYXRhVmlldyhkZWNvZGVyLCA4KSkuZ2V0QmlnVWludDY0KDAsIGZhbHNlKVxuXG4vKipcbiAqIEB0eXBlIHtBcnJheTxmdW5jdGlvbihEZWNvZGVyKTphbnk+fVxuICovXG5jb25zdCByZWFkQW55TG9va3VwVGFibGUgPSBbXG4gIGRlY29kZXIgPT4gdW5kZWZpbmVkLCAvLyBDQVNFIDEyNzogdW5kZWZpbmVkXG4gIGRlY29kZXIgPT4gbnVsbCwgLy8gQ0FTRSAxMjY6IG51bGxcbiAgcmVhZFZhckludCwgLy8gQ0FTRSAxMjU6IGludGVnZXJcbiAgcmVhZEZsb2F0MzIsIC8vIENBU0UgMTI0OiBmbG9hdDMyXG4gIHJlYWRGbG9hdDY0LCAvLyBDQVNFIDEyMzogZmxvYXQ2NFxuICByZWFkQmlnSW50NjQsIC8vIENBU0UgMTIyOiBiaWdpbnRcbiAgZGVjb2RlciA9PiBmYWxzZSwgLy8gQ0FTRSAxMjE6IGJvb2xlYW4gKGZhbHNlKVxuICBkZWNvZGVyID0+IHRydWUsIC8vIENBU0UgMTIwOiBib29sZWFuICh0cnVlKVxuICByZWFkVmFyU3RyaW5nLCAvLyBDQVNFIDExOTogc3RyaW5nXG4gIGRlY29kZXIgPT4geyAvLyBDQVNFIDExODogb2JqZWN0PHN0cmluZyxhbnk+XG4gICAgY29uc3QgbGVuID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7T2JqZWN0PHN0cmluZyxhbnk+fVxuICAgICAqL1xuICAgIGNvbnN0IG9iaiA9IHt9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3Qga2V5ID0gcmVhZFZhclN0cmluZyhkZWNvZGVyKVxuICAgICAgb2JqW2tleV0gPSByZWFkQW55KGRlY29kZXIpXG4gICAgfVxuICAgIHJldHVybiBvYmpcbiAgfSxcbiAgZGVjb2RlciA9PiB7IC8vIENBU0UgMTE3OiBhcnJheTxhbnk+XG4gICAgY29uc3QgbGVuID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICBjb25zdCBhcnIgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyci5wdXNoKHJlYWRBbnkoZGVjb2RlcikpXG4gICAgfVxuICAgIHJldHVybiBhcnJcbiAgfSxcbiAgcmVhZFZhclVpbnQ4QXJyYXkgLy8gQ0FTRSAxMTY6IFVpbnQ4QXJyYXlcbl1cblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRBbnkgPSBkZWNvZGVyID0+IHJlYWRBbnlMb29rdXBUYWJsZVsxMjcgLSByZWFkVWludDgoZGVjb2RlcildKGRlY29kZXIpXG5cbi8qKlxuICogVCBtdXN0IG5vdCBiZSBudWxsLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbmV4cG9ydCBjbGFzcyBSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtmdW5jdGlvbihEZWNvZGVyKTpUfSByZWFkZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5LCByZWFkZXIpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIFRoZSByZWFkZXJcbiAgICAgKi9cbiAgICB0aGlzLnJlYWRlciA9IHJlYWRlclxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7VHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucyA9IG51bGxcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIHRoaXMucyA9IHRoaXMucmVhZGVyKHRoaXMpXG4gICAgICBpZiAoaGFzQ29udGVudCh0aGlzKSkge1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAxIC8vIHNlZSBlbmNvZGVyIGltcGxlbWVudGF0aW9uIGZvciB0aGUgcmVhc29uIHdoeSB0aGlzIGlzIGluY3JlbWVudGVkXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvdW50ID0gLTEgLy8gcmVhZCB0aGUgY3VycmVudCB2YWx1ZSBmb3JldmVyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY291bnQtLVxuICAgIHJldHVybiAvKiogQHR5cGUge1R9ICovICh0aGlzLnMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEludERpZmZEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSwgc3RhcnQpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IHN0YXJ0XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZCAoKSB7XG4gICAgdGhpcy5zICs9IHJlYWRWYXJJbnQodGhpcylcbiAgICByZXR1cm4gdGhpcy5zXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJsZUludERpZmZEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSwgc3RhcnQpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IHN0YXJ0XG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICByZWFkICgpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PT0gMCkge1xuICAgICAgdGhpcy5zICs9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIGlmIChoYXNDb250ZW50KHRoaXMpKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSByZWFkVmFyVWludCh0aGlzKSArIDEgLy8gc2VlIGVuY29kZXIgaW1wbGVtZW50YXRpb24gZm9yIHRoZSByZWFzb24gd2h5IHRoaXMgaXMgaW5jcmVtZW50ZWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAtMSAvLyByZWFkIHRoZSBjdXJyZW50IHZhbHVlIGZvcmV2ZXJcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAodGhpcy5zKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVaW50T3B0UmxlRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIHJlYWQgKCkge1xuICAgIGlmICh0aGlzLmNvdW50ID09PSAwKSB7XG4gICAgICB0aGlzLnMgPSByZWFkVmFySW50KHRoaXMpXG4gICAgICAvLyBpZiB0aGUgc2lnbiBpcyBuZWdhdGl2ZSwgd2UgcmVhZCB0aGUgY291bnQgdG9vLCBvdGhlcndpc2UgY291bnQgaXMgMVxuICAgICAgY29uc3QgaXNOZWdhdGl2ZSA9IG1hdGguaXNOZWdhdGl2ZVplcm8odGhpcy5zKVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgICAgIHRoaXMucyA9IC10aGlzLnNcbiAgICAgICAgdGhpcy5jb3VudCA9IHJlYWRWYXJVaW50KHRoaXMpICsgMlxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvdW50LS1cbiAgICByZXR1cm4gLyoqIEB0eXBlIHtudW1iZXJ9ICovICh0aGlzLnMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEluY1VpbnRPcHRSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgc3VwZXIodWludDhBcnJheSlcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IDBcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIHRoaXMucyA9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIC8vIGlmIHRoZSBzaWduIGlzIG5lZ2F0aXZlLCB3ZSByZWFkIHRoZSBjb3VudCB0b28sIG90aGVyd2lzZSBjb3VudCBpcyAxXG4gICAgICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyh0aGlzLnMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgaWYgKGlzTmVnYXRpdmUpIHtcbiAgICAgICAgdGhpcy5zID0gLXRoaXMuc1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY291bnQtLVxuICAgIHJldHVybiAvKiogQHR5cGUge251bWJlcn0gKi8gKHRoaXMucysrKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnREaWZmT3B0UmxlRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgICB0aGlzLmRpZmYgPSAwXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIGNvbnN0IGRpZmYgPSByZWFkVmFySW50KHRoaXMpXG4gICAgICAvLyBpZiB0aGUgZmlyc3QgYml0IGlzIHNldCwgd2UgcmVhZCBtb3JlIGRhdGFcbiAgICAgIGNvbnN0IGhhc0NvdW50ID0gZGlmZiAmIDFcbiAgICAgIHRoaXMuZGlmZiA9IG1hdGguZmxvb3IoZGlmZiAvIDIpIC8vIHNoaWZ0ID4+IDFcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICBpZiAoaGFzQ291bnQpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IHJlYWRWYXJVaW50KHRoaXMpICsgMlxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnMgKz0gdGhpcy5kaWZmXG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIHRoaXMuc1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHVpbnQ4QXJyYXkpIHtcbiAgICB0aGlzLmRlY29kZXIgPSBuZXcgVWludE9wdFJsZURlY29kZXIodWludDhBcnJheSlcbiAgICB0aGlzLnN0ciA9IHJlYWRWYXJTdHJpbmcodGhpcy5kZWNvZGVyKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zcG9zID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHJlYWQgKCkge1xuICAgIGNvbnN0IGVuZCA9IHRoaXMuc3BvcyArIHRoaXMuZGVjb2Rlci5yZWFkKClcbiAgICBjb25zdCByZXMgPSB0aGlzLnN0ci5zbGljZSh0aGlzLnNwb3MsIGVuZClcbiAgICB0aGlzLnNwb3MgPSBlbmRcbiAgICByZXR1cm4gcmVzXG4gIH1cbn1cbiIsICJpbXBvcnQge1xuICBmaW5kSW5kZXhTUyxcbiAgZ2V0U3RhdGUsXG4gIHNwbGl0SXRlbSxcbiAgaXRlcmF0ZVN0cnVjdHMsXG4gIFVwZGF0ZUVuY29kZXJWMixcbiAgRFNEZWNvZGVyVjEsIERTRW5jb2RlclYxLCBEU0RlY29kZXJWMiwgRFNFbmNvZGVyVjIsIEl0ZW0sIEdDLCBTdHJ1Y3RTdG9yZSwgVHJhbnNhY3Rpb24sIElEIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICdsaWIwL2FycmF5J1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcblxuZXhwb3J0IGNsYXNzIERlbGV0ZUl0ZW0ge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNsb2NrXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChjbG9jaywgbGVuKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLmNsb2NrID0gY2xvY2tcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMubGVuID0gbGVuXG4gIH1cbn1cblxuLyoqXG4gKiBXZSBubyBsb25nZXIgbWFpbnRhaW4gYSBEZWxldGVTdG9yZS4gRGVsZXRlU2V0IGlzIGEgdGVtcG9yYXJ5IG9iamVjdCB0aGF0IGlzIGNyZWF0ZWQgd2hlbiBuZWVkZWQuXG4gKiAtIFdoZW4gY3JlYXRlZCBpbiBhIHRyYW5zYWN0aW9uLCBpdCBtdXN0IG9ubHkgYmUgYWNjZXNzZWQgYWZ0ZXIgc29ydGluZywgYW5kIG1lcmdpbmdcbiAqICAgLSBUaGlzIERlbGV0ZVNldCBpcyBzZW5kIHRvIG90aGVyIGNsaWVudHNcbiAqIC0gV2UgZG8gbm90IGNyZWF0ZSBhIERlbGV0ZVNldCB3aGVuIHdlIHNlbmQgYSBzeW5jIG1lc3NhZ2UuIFRoZSBEZWxldGVTZXQgbWVzc2FnZSBpcyBjcmVhdGVkIGRpcmVjdGx5IGZyb20gU3RydWN0U3RvcmVcbiAqIC0gV2UgcmVhZCBhIERlbGV0ZVNldCBhcyBwYXJ0IG9mIGEgc3luYy91cGRhdGUgbWVzc2FnZS4gSW4gdGhpcyBjYXNlIHRoZSBEZWxldGVTZXQgaXMgYWxyZWFkeSBzb3J0ZWQgYW5kIG1lcmdlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlbGV0ZVNldCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7TWFwPG51bWJlcixBcnJheTxEZWxldGVJdGVtPj59XG4gICAgICovXG4gICAgdGhpcy5jbGllbnRzID0gbmV3IE1hcCgpXG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgYWxsIHN0cnVjdHMgdGhhdCB0aGUgRGVsZXRlU2V0IGdjJ3MuXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7RGVsZXRlU2V0fSBkc1xuICogQHBhcmFtIHtmdW5jdGlvbihHQ3xJdGVtKTp2b2lkfSBmXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBpdGVyYXRlRGVsZXRlZFN0cnVjdHMgPSAodHJhbnNhY3Rpb24sIGRzLCBmKSA9PlxuICBkcy5jbGllbnRzLmZvckVhY2goKGRlbGV0ZXMsIGNsaWVudGlkKSA9PiB7XG4gICAgY29uc3Qgc3RydWN0cyA9IC8qKiBAdHlwZSB7QXJyYXk8R0N8SXRlbT59ICovICh0cmFuc2FjdGlvbi5kb2Muc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50aWQpKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVsZXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVsID0gZGVsZXRlc1tpXVxuICAgICAgaXRlcmF0ZVN0cnVjdHModHJhbnNhY3Rpb24sIHN0cnVjdHMsIGRlbC5jbG9jaywgZGVsLmxlbiwgZilcbiAgICB9XG4gIH0pXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxEZWxldGVJdGVtPn0gZGlzXG4gKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAqIEByZXR1cm4ge251bWJlcnxudWxsfVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmRJbmRleERTID0gKGRpcywgY2xvY2spID0+IHtcbiAgbGV0IGxlZnQgPSAwXG4gIGxldCByaWdodCA9IGRpcy5sZW5ndGggLSAxXG4gIHdoaWxlIChsZWZ0IDw9IHJpZ2h0KSB7XG4gICAgY29uc3QgbWlkaW5kZXggPSBtYXRoLmZsb29yKChsZWZ0ICsgcmlnaHQpIC8gMilcbiAgICBjb25zdCBtaWQgPSBkaXNbbWlkaW5kZXhdXG4gICAgY29uc3QgbWlkY2xvY2sgPSBtaWQuY2xvY2tcbiAgICBpZiAobWlkY2xvY2sgPD0gY2xvY2spIHtcbiAgICAgIGlmIChjbG9jayA8IG1pZGNsb2NrICsgbWlkLmxlbikge1xuICAgICAgICByZXR1cm4gbWlkaW5kZXhcbiAgICAgIH1cbiAgICAgIGxlZnQgPSBtaWRpbmRleCArIDFcbiAgICB9IGVsc2Uge1xuICAgICAgcmlnaHQgPSBtaWRpbmRleCAtIDFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqIEBwYXJhbSB7SUR9IGlkXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGlzRGVsZXRlZCA9IChkcywgaWQpID0+IHtcbiAgY29uc3QgZGlzID0gZHMuY2xpZW50cy5nZXQoaWQuY2xpZW50KVxuICByZXR1cm4gZGlzICE9PSB1bmRlZmluZWQgJiYgZmluZEluZGV4RFMoZGlzLCBpZC5jbG9jaykgIT09IG51bGxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBzb3J0QW5kTWVyZ2VEZWxldGVTZXQgPSBkcyA9PiB7XG4gIGRzLmNsaWVudHMuZm9yRWFjaChkZWxzID0+IHtcbiAgICBkZWxzLnNvcnQoKGEsIGIpID0+IGEuY2xvY2sgLSBiLmNsb2NrKVxuICAgIC8vIG1lcmdlIGl0ZW1zIHdpdGhvdXQgZmlsdGVyaW5nIG9yIHNwbGljaW5nIHRoZSBhcnJheVxuICAgIC8vIGkgaXMgdGhlIGN1cnJlbnQgcG9pbnRlclxuICAgIC8vIGogcmVmZXJzIHRvIHRoZSBjdXJyZW50IGluc2VydCBwb3NpdGlvbiBmb3IgdGhlIHBvaW50ZWQgaXRlbVxuICAgIC8vIHRyeSB0byBtZXJnZSBkZWxzW2ldIGludG8gZGVsc1tqLTFdIG9yIHNldCBkZWxzW2pdPWRlbHNbaV1cbiAgICBsZXQgaSwgalxuICAgIGZvciAoaSA9IDEsIGogPSAxOyBpIDwgZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbGVmdCA9IGRlbHNbaiAtIDFdXG4gICAgICBjb25zdCByaWdodCA9IGRlbHNbaV1cbiAgICAgIGlmIChsZWZ0LmNsb2NrICsgbGVmdC5sZW4gPj0gcmlnaHQuY2xvY2spIHtcbiAgICAgICAgbGVmdC5sZW4gPSBtYXRoLm1heChsZWZ0LmxlbiwgcmlnaHQuY2xvY2sgKyByaWdodC5sZW4gLSBsZWZ0LmNsb2NrKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGogPCBpKSB7XG4gICAgICAgICAgZGVsc1tqXSA9IHJpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgaisrXG4gICAgICB9XG4gICAgfVxuICAgIGRlbHMubGVuZ3RoID0galxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8RGVsZXRlU2V0Pn0gZHNzXG4gKiBAcmV0dXJuIHtEZWxldGVTZXR9IEEgZnJlc2ggRGVsZXRlU2V0XG4gKi9cbmV4cG9ydCBjb25zdCBtZXJnZURlbGV0ZVNldHMgPSBkc3MgPT4ge1xuICBjb25zdCBtZXJnZWQgPSBuZXcgRGVsZXRlU2V0KClcbiAgZm9yIChsZXQgZHNzSSA9IDA7IGRzc0kgPCBkc3MubGVuZ3RoOyBkc3NJKyspIHtcbiAgICBkc3NbZHNzSV0uY2xpZW50cy5mb3JFYWNoKChkZWxzTGVmdCwgY2xpZW50KSA9PiB7XG4gICAgICBpZiAoIW1lcmdlZC5jbGllbnRzLmhhcyhjbGllbnQpKSB7XG4gICAgICAgIC8vIFdyaXRlIGFsbCBtaXNzaW5nIGtleXMgZnJvbSBjdXJyZW50IGRzIGFuZCBhbGwgZm9sbG93aW5nLlxuICAgICAgICAvLyBJZiBtZXJnZWQgYWxyZWFkeSBjb250YWlucyBgY2xpZW50YCBjdXJyZW50IGRzIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7QXJyYXk8RGVsZXRlSXRlbT59XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBkZWxzID0gZGVsc0xlZnQuc2xpY2UoKVxuICAgICAgICBmb3IgKGxldCBpID0gZHNzSSArIDE7IGkgPCBkc3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhcnJheS5hcHBlbmRUbyhkZWxzLCBkc3NbaV0uY2xpZW50cy5nZXQoY2xpZW50KSB8fCBbXSlcbiAgICAgICAgfVxuICAgICAgICBtZXJnZWQuY2xpZW50cy5zZXQoY2xpZW50LCBkZWxzKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgc29ydEFuZE1lcmdlRGVsZXRlU2V0KG1lcmdlZClcbiAgcmV0dXJuIG1lcmdlZFxufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVsZXRlU2V0fSBkc1xuICogQHBhcmFtIHtudW1iZXJ9IGNsaWVudFxuICogQHBhcmFtIHtudW1iZXJ9IGNsb2NrXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgYWRkVG9EZWxldGVTZXQgPSAoZHMsIGNsaWVudCwgY2xvY2ssIGxlbmd0aCkgPT4ge1xuICBtYXAuc2V0SWZVbmRlZmluZWQoZHMuY2xpZW50cywgY2xpZW50LCAoKSA9PiAvKiogQHR5cGUge0FycmF5PERlbGV0ZUl0ZW0+fSAqLyAoW10pKS5wdXNoKG5ldyBEZWxldGVJdGVtKGNsb2NrLCBsZW5ndGgpKVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlRGVsZXRlU2V0ID0gKCkgPT4gbmV3IERlbGV0ZVNldCgpXG5cbi8qKlxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3NcbiAqIEByZXR1cm4ge0RlbGV0ZVNldH0gTWVyZ2VkIGFuZCBzb3J0ZWQgRGVsZXRlU2V0XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRGVsZXRlU2V0RnJvbVN0cnVjdFN0b3JlID0gc3MgPT4ge1xuICBjb25zdCBkcyA9IGNyZWF0ZURlbGV0ZVNldCgpXG4gIHNzLmNsaWVudHMuZm9yRWFjaCgoc3RydWN0cywgY2xpZW50KSA9PiB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PERlbGV0ZUl0ZW0+fVxuICAgICAqL1xuICAgIGNvbnN0IGRzaXRlbXMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RydWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3RydWN0ID0gc3RydWN0c1tpXVxuICAgICAgaWYgKHN0cnVjdC5kZWxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNsb2NrID0gc3RydWN0LmlkLmNsb2NrXG4gICAgICAgIGxldCBsZW4gPSBzdHJ1Y3QubGVuZ3RoXG4gICAgICAgIGlmIChpICsgMSA8IHN0cnVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yIChsZXQgbmV4dCA9IHN0cnVjdHNbaSArIDFdOyBpICsgMSA8IHN0cnVjdHMubGVuZ3RoICYmIG5leHQuZGVsZXRlZDsgbmV4dCA9IHN0cnVjdHNbKytpICsgMV0pIHtcbiAgICAgICAgICAgIGxlbiArPSBuZXh0Lmxlbmd0aFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBkc2l0ZW1zLnB1c2gobmV3IERlbGV0ZUl0ZW0oY2xvY2ssIGxlbikpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkc2l0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgIGRzLmNsaWVudHMuc2V0KGNsaWVudCwgZHNpdGVtcylcbiAgICB9XG4gIH0pXG4gIHJldHVybiBkc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RFNFbmNvZGVyVjEgfCBEU0VuY29kZXJWMn0gZW5jb2RlclxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVEZWxldGVTZXQgPSAoZW5jb2RlciwgZHMpID0+IHtcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGRzLmNsaWVudHMuc2l6ZSlcblxuICAvLyBFbnN1cmUgdGhhdCB0aGUgZGVsZXRlIHNldCBpcyB3cml0dGVuIGluIGEgZGV0ZXJtaW5pc3RpYyBvcmRlclxuICBhcnJheS5mcm9tKGRzLmNsaWVudHMuZW50cmllcygpKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiWzBdIC0gYVswXSlcbiAgICAuZm9yRWFjaCgoW2NsaWVudCwgZHNpdGVtc10pID0+IHtcbiAgICAgIGVuY29kZXIucmVzZXREc0N1clZhbCgpXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgY2xpZW50KVxuICAgICAgY29uc3QgbGVuID0gZHNpdGVtcy5sZW5ndGhcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCBsZW4pXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBkc2l0ZW1zW2ldXG4gICAgICAgIGVuY29kZXIud3JpdGVEc0Nsb2NrKGl0ZW0uY2xvY2spXG4gICAgICAgIGVuY29kZXIud3JpdGVEc0xlbihpdGVtLmxlbilcbiAgICAgIH1cbiAgICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RFNEZWNvZGVyVjEgfCBEU0RlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7RGVsZXRlU2V0fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWREZWxldGVTZXQgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgZHMgPSBuZXcgRGVsZXRlU2V0KClcbiAgY29uc3QgbnVtQ2xpZW50cyA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ2xpZW50czsgaSsrKSB7XG4gICAgZGVjb2Rlci5yZXNldERzQ3VyVmFsKClcbiAgICBjb25zdCBjbGllbnQgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgIGNvbnN0IG51bWJlck9mRGVsZXRlcyA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgaWYgKG51bWJlck9mRGVsZXRlcyA+IDApIHtcbiAgICAgIGNvbnN0IGRzRmllbGQgPSBtYXAuc2V0SWZVbmRlZmluZWQoZHMuY2xpZW50cywgY2xpZW50LCAoKSA9PiAvKiogQHR5cGUge0FycmF5PERlbGV0ZUl0ZW0+fSAqLyAoW10pKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZkRlbGV0ZXM7IGkrKykge1xuICAgICAgICBkc0ZpZWxkLnB1c2gobmV3IERlbGV0ZUl0ZW0oZGVjb2Rlci5yZWFkRHNDbG9jaygpLCBkZWNvZGVyLnJlYWREc0xlbigpKSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRzXG59XG5cbi8qKlxuICogQHRvZG8gWURlY29kZXIgYWxzbyBjb250YWlucyByZWZlcmVuY2VzIHRvIFN0cmluZyBhbmQgb3RoZXIgRGVjb2RlcnMuIFdvdWxkIG1ha2Ugc2Vuc2UgdG8gZXhjaGFuZ2UgWURlY29kZXIudG9VaW50OEFycmF5IGZvciBZRGVjb2Rlci5Ec1RvVWludDhBcnJheSgpLi5cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7RFNEZWNvZGVyVjEgfCBEU0RlY29kZXJWMn0gZGVjb2RlclxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fG51bGx9IFJldHVybnMgYSB2MiB1cGRhdGUgY29udGFpbmluZyBhbGwgZGVsZXRlcyB0aGF0IGNvdWxkbid0IGJlIGFwcGxpZWQgeWV0OyBvciBudWxsIGlmIGFsbCBkZWxldGVzIHdlcmUgYXBwbGllZCBzdWNjZXNzZnVsbHkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZEFuZEFwcGx5RGVsZXRlU2V0ID0gKGRlY29kZXIsIHRyYW5zYWN0aW9uLCBzdG9yZSkgPT4ge1xuICBjb25zdCB1bmFwcGxpZWREUyA9IG5ldyBEZWxldGVTZXQoKVxuICBjb25zdCBudW1DbGllbnRzID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DbGllbnRzOyBpKyspIHtcbiAgICBkZWNvZGVyLnJlc2V0RHNDdXJWYWwoKVxuICAgIGNvbnN0IGNsaWVudCA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgY29uc3QgbnVtYmVyT2ZEZWxldGVzID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgICBjb25zdCBzdHJ1Y3RzID0gc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50KSB8fCBbXVxuICAgIGNvbnN0IHN0YXRlID0gZ2V0U3RhdGUoc3RvcmUsIGNsaWVudClcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mRGVsZXRlczsgaSsrKSB7XG4gICAgICBjb25zdCBjbG9jayA9IGRlY29kZXIucmVhZERzQ2xvY2soKVxuICAgICAgY29uc3QgY2xvY2tFbmQgPSBjbG9jayArIGRlY29kZXIucmVhZERzTGVuKClcbiAgICAgIGlmIChjbG9jayA8IHN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA8IGNsb2NrRW5kKSB7XG4gICAgICAgICAgYWRkVG9EZWxldGVTZXQodW5hcHBsaWVkRFMsIGNsaWVudCwgc3RhdGUsIGNsb2NrRW5kIC0gc3RhdGUpXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGluZGV4ID0gZmluZEluZGV4U1Moc3RydWN0cywgY2xvY2spXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXZSBjYW4gaWdub3JlIHRoZSBjYXNlIG9mIEdDIGFuZCBEZWxldGUgc3RydWN0cywgYmVjYXVzZSB3ZSBhcmUgZ29pbmcgdG8gc2tpcCB0aGVtXG4gICAgICAgICAqIEB0eXBlIHtJdGVtfVxuICAgICAgICAgKi9cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBsZXQgc3RydWN0ID0gc3RydWN0c1tpbmRleF1cbiAgICAgICAgLy8gc3BsaXQgdGhlIGZpcnN0IGl0ZW0gaWYgbmVjZXNzYXJ5XG4gICAgICAgIGlmICghc3RydWN0LmRlbGV0ZWQgJiYgc3RydWN0LmlkLmNsb2NrIDwgY2xvY2spIHtcbiAgICAgICAgICBzdHJ1Y3RzLnNwbGljZShpbmRleCArIDEsIDAsIHNwbGl0SXRlbSh0cmFuc2FjdGlvbiwgc3RydWN0LCBjbG9jayAtIHN0cnVjdC5pZC5jbG9jaykpXG4gICAgICAgICAgaW5kZXgrKyAvLyBpbmNyZWFzZSB3ZSBub3cgd2FudCB0byB1c2UgdGhlIG5leHQgc3RydWN0XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgc3RydWN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgc3RydWN0ID0gc3RydWN0c1tpbmRleCsrXVxuICAgICAgICAgIGlmIChzdHJ1Y3QuaWQuY2xvY2sgPCBjbG9ja0VuZCkge1xuICAgICAgICAgICAgaWYgKCFzdHJ1Y3QuZGVsZXRlZCkge1xuICAgICAgICAgICAgICBpZiAoY2xvY2tFbmQgPCBzdHJ1Y3QuaWQuY2xvY2sgKyBzdHJ1Y3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc3RydWN0cy5zcGxpY2UoaW5kZXgsIDAsIHNwbGl0SXRlbSh0cmFuc2FjdGlvbiwgc3RydWN0LCBjbG9ja0VuZCAtIHN0cnVjdC5pZC5jbG9jaykpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RydWN0LmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFkZFRvRGVsZXRlU2V0KHVuYXBwbGllZERTLCBjbGllbnQsIGNsb2NrLCBjbG9ja0VuZCAtIGNsb2NrKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAodW5hcHBsaWVkRFMuY2xpZW50cy5zaXplID4gMCkge1xuICAgIGNvbnN0IGRzID0gbmV3IFVwZGF0ZUVuY29kZXJWMigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGRzLnJlc3RFbmNvZGVyLCAwKSAvLyBlbmNvZGUgMCBzdHJ1Y3RzXG4gICAgd3JpdGVEZWxldGVTZXQoZHMsIHVuYXBwbGllZERTKVxuICAgIHJldHVybiBkcy50b1VpbnQ4QXJyYXkoKVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzMVxuICogQHBhcmFtIHtEZWxldGVTZXR9IGRzMlxuICovXG5leHBvcnQgY29uc3QgZXF1YWxEZWxldGVTZXRzID0gKGRzMSwgZHMyKSA9PiB7XG4gIGlmIChkczEuY2xpZW50cy5zaXplICE9PSBkczIuY2xpZW50cy5zaXplKSByZXR1cm4gZmFsc2VcbiAgZm9yIChjb25zdCBbY2xpZW50LCBkZWxldGVJdGVtczFdIG9mIGRzMS5jbGllbnRzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IGRlbGV0ZUl0ZW1zMiA9IC8qKiBAdHlwZSB7QXJyYXk8aW1wb3J0KCcuLi9pbnRlcm5hbHMuanMnKS5EZWxldGVJdGVtPn0gKi8gKGRzMi5jbGllbnRzLmdldChjbGllbnQpKVxuICAgIGlmIChkZWxldGVJdGVtczIgPT09IHVuZGVmaW5lZCB8fCBkZWxldGVJdGVtczEubGVuZ3RoICE9PSBkZWxldGVJdGVtczIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlbGV0ZUl0ZW1zMS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGkxID0gZGVsZXRlSXRlbXMxW2ldXG4gICAgICBjb25zdCBkaTIgPSBkZWxldGVJdGVtczJbaV1cbiAgICAgIGlmIChkaTEuY2xvY2sgIT09IGRpMi5jbG9jayB8fCBkaTEubGVuICE9PSBkaTIubGVuKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIHRpbWUuXG4gKlxuICogQG1vZHVsZSB0aW1lXG4gKi9cblxuaW1wb3J0ICogYXMgbWV0cmljIGZyb20gJy4vbWV0cmljLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5cbi8qKlxuICogUmV0dXJuIGN1cnJlbnQgdGltZS5cbiAqXG4gKiBAcmV0dXJuIHtEYXRlfVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IG5ldyBEYXRlKClcblxuLyoqXG4gKiBSZXR1cm4gY3VycmVudCB1bml4IHRpbWUuXG4gKlxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgZ2V0VW5peFRpbWUgPSBEYXRlLm5vd1xuXG4vKipcbiAqIFRyYW5zZm9ybSB0aW1lIChpbiBtcykgdG8gYSBodW1hbiByZWFkYWJsZSBmb3JtYXQuIEUuZy4gMTEwMCA9PiAxLjFzLiA2MHMgPT4gMW1pbi4gLjAwMSA9PiAxMFx1MDNCQ3MuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGQgZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGh1bWFuaXplZCBhcHByb3hpbWF0aW9uIG9mIHRpbWVcbiAqL1xuZXhwb3J0IGNvbnN0IGh1bWFuaXplRHVyYXRpb24gPSBkID0+IHtcbiAgaWYgKGQgPCA2MDAwMCkge1xuICAgIGNvbnN0IHAgPSBtZXRyaWMucHJlZml4KGQsIC0xKVxuICAgIHJldHVybiBtYXRoLnJvdW5kKHAubiAqIDEwMCkgLyAxMDAgKyBwLnByZWZpeCArICdzJ1xuICB9XG4gIGQgPSBtYXRoLmZsb29yKGQgLyAxMDAwKVxuICBjb25zdCBzZWNvbmRzID0gZCAlIDYwXG4gIGNvbnN0IG1pbnV0ZXMgPSBtYXRoLmZsb29yKGQgLyA2MCkgJSA2MFxuICBjb25zdCBob3VycyA9IG1hdGguZmxvb3IoZCAvIDM2MDApICUgMjRcbiAgY29uc3QgZGF5cyA9IG1hdGguZmxvb3IoZCAvIDg2NDAwKVxuICBpZiAoZGF5cyA+IDApIHtcbiAgICByZXR1cm4gZGF5cyArICdkJyArICgoaG91cnMgPiAwIHx8IG1pbnV0ZXMgPiAzMCkgPyAnICcgKyAobWludXRlcyA+IDMwID8gaG91cnMgKyAxIDogaG91cnMpICsgJ2gnIDogJycpXG4gIH1cbiAgaWYgKGhvdXJzID4gMCkge1xuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGhvdXJzICsgJ2gnICsgKChtaW51dGVzID4gMCB8fCBzZWNvbmRzID4gMzApID8gJyAnICsgKHNlY29uZHMgPiAzMCA/IG1pbnV0ZXMgKyAxIDogbWludXRlcykgKyAnbWluJyA6ICcnKVxuICB9XG4gIHJldHVybiBtaW51dGVzICsgJ21pbicgKyAoc2Vjb25kcyA+IDAgPyAnICcgKyBzZWNvbmRzICsgJ3MnIDogJycpXG59XG4iLCAiLyoqXG4gKiBVdGlsaXR5IGhlbHBlcnMgdG8gd29yayB3aXRoIHByb21pc2VzLlxuICpcbiAqIEBtb2R1bGUgcHJvbWlzZVxuICovXG5cbmltcG9ydCAqIGFzIHRpbWUgZnJvbSAnLi90aW1lLmpzJ1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAY2FsbGJhY2sgUHJvbWlzZVJlc29sdmVcbiAqIEBwYXJhbSB7VHxQcm9taXNlTGlrZTxUPn0gW3Jlc3VsdF1cbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFByb21pc2VSZXNvbHZlPFQ+LGZ1bmN0aW9uKEVycm9yKTp2b2lkKTphbnl9IGZcbiAqIEByZXR1cm4ge1Byb21pc2U8VD59XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSBmID0+IC8qKiBAdHlwZSB7UHJvbWlzZTxUPn0gKi8gKG5ldyBQcm9taXNlKGYpKVxuXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oZnVuY3Rpb24oKTp2b2lkLGZ1bmN0aW9uKEVycm9yKTp2b2lkKTp2b2lkfSBmXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRW1wdHkgPSBmID0+IG5ldyBQcm9taXNlKGYpXG5cbi8qKlxuICogYFByb21pc2UuYWxsYCB3YWl0IGZvciBhbGwgcHJvbWlzZXMgaW4gdGhlIGFycmF5IHRvIHJlc29sdmUgYW5kIHJldHVybiB0aGUgcmVzdWx0XG4gKiBAdGVtcGxhdGUge3Vua25vd25bXSB8IFtdfSBQU1xuICpcbiAqIEBwYXJhbSB7UFN9IHBzXG4gKiBAcmV0dXJuIHtQcm9taXNlPHsgLXJlYWRvbmx5IFtQIGluIGtleW9mIFBTXTogQXdhaXRlZDxQU1tQXT4gfT59XG4gKi9cbmV4cG9ydCBjb25zdCBhbGwgPSBQcm9taXNlLmFsbC5iaW5kKFByb21pc2UpXG5cbi8qKlxuICogQHBhcmFtIHtFcnJvcn0gW3JlYXNvbl1cbiAqIEByZXR1cm4ge1Byb21pc2U8bmV2ZXI+fVxuICovXG5leHBvcnQgY29uc3QgcmVqZWN0ID0gcmVhc29uID0+IFByb21pc2UucmVqZWN0KHJlYXNvbilcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfHZvaWR9IHJlc1xuICogQHJldHVybiB7UHJvbWlzZTxUfHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgcmVzb2x2ZSA9IHJlcyA9PiBQcm9taXNlLnJlc29sdmUocmVzKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R9IHJlc1xuICogQHJldHVybiB7UHJvbWlzZTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlc29sdmVXaXRoID0gcmVzID0+IFByb21pc2UucmVzb2x2ZShyZXMpXG5cbi8qKlxuICogQHRvZG8gTmV4dCB2ZXJzaW9uLCByZW9yZGVyIHBhcmFtZXRlcnM6IGNoZWNrLCBbdGltZW91dCwgW2ludGVydmFsUmVzb2x1dGlvbl1dXG4gKiBAZGVwcmVjYXRlZCB1c2UgdW50aWxBc3luYyBpbnN0ZWFkXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKTpib29sZWFufSBjaGVja1xuICogQHBhcmFtIHtudW1iZXJ9IFtpbnRlcnZhbFJlc29sdXRpb25dXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgdW50aWwgPSAodGltZW91dCwgY2hlY2ssIGludGVydmFsUmVzb2x1dGlvbiA9IDEwKSA9PiBjcmVhdGUoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICBjb25zdCBzdGFydFRpbWUgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgY29uc3QgaGFzVGltZW91dCA9IHRpbWVvdXQgPiAwXG4gIGNvbnN0IHVudGlsSW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgaWYgKGNoZWNrKCkpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpXG4gICAgICByZXNvbHZlKClcbiAgICB9IGVsc2UgaWYgKGhhc1RpbWVvdXQpIHtcbiAgICAgIC8qIGM4IGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAodGltZS5nZXRVbml4VGltZSgpIC0gc3RhcnRUaW1lID4gdGltZW91dCkge1xuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKVxuICAgICAgICByZWplY3QobmV3IEVycm9yKCdUaW1lb3V0JykpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnN0IGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwodW50aWxJbnRlcnZhbCwgaW50ZXJ2YWxSZXNvbHV0aW9uKVxufSlcblxuLyoqXG4gKiBAcGFyYW0geygpPT5Qcm9taXNlPGJvb2xlYW4+fGJvb2xlYW59IGNoZWNrXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dFxuICogQHBhcmFtIHtudW1iZXJ9IGludGVydmFsUmVzb2x1dGlvblxuICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVudGlsQXN5bmMgPSBhc3luYyAoY2hlY2ssIHRpbWVvdXQgPSAwLCBpbnRlcnZhbFJlc29sdXRpb24gPSAxMCkgPT4ge1xuICBjb25zdCBzdGFydFRpbWUgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgY29uc3Qgbm9UaW1lb3V0ID0gdGltZW91dCA8PSAwXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bm1vZGlmaWVkLWxvb3AtY29uZGl0aW9uXG4gIHdoaWxlIChub1RpbWVvdXQgfHwgdGltZS5nZXRVbml4VGltZSgpIC0gc3RhcnRUaW1lIDw9IHRpbWVvdXQpIHtcbiAgICBpZiAoYXdhaXQgY2hlY2soKSkgcmV0dXJuXG4gICAgYXdhaXQgd2FpdChpbnRlcnZhbFJlc29sdXRpb24pXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdUaW1lb3V0Jylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dFxuICogQHJldHVybiB7UHJvbWlzZTx1bmRlZmluZWQ+fVxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9IHRpbWVvdXQgPT4gY3JlYXRlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWVvdXQpKVxuXG4vKipcbiAqIENoZWNrcyBpZiBhbiBvYmplY3QgaXMgYSBwcm9taXNlIHVzaW5nIGR1Y2t0eXBpbmcuXG4gKlxuICogUHJvbWlzZXMgYXJlIG9mdGVuIHBvbHlmaWxsZWQsIHNvIGl0IG1ha2VzIHNlbnNlIHRvIGFkZCBzb21lIGFkZGl0aW9uYWwgZ3VhcmFudGVlcyBpZiB0aGUgdXNlciBvZiB0aGlzXG4gKiBsaWJyYXJ5IGhhcyBzb21lIGluc2FuZSBlbnZpcm9ubWVudCB3aGVyZSBnbG9iYWwgUHJvbWlzZSBvYmplY3RzIGFyZSBvdmVyd3JpdHRlbi5cbiAqXG4gKiBAcGFyYW0ge2FueX0gcFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGlzUHJvbWlzZSA9IHAgPT4gcCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHAgJiYgcC50aGVuICYmIHAuY2F0Y2ggJiYgcC5maW5hbGx5KVxuIiwgIi8qKlxuICogQG1vZHVsZSBZXG4gKi9cblxuaW1wb3J0IHtcbiAgU3RydWN0U3RvcmUsXG4gIEFic3RyYWN0VHlwZSxcbiAgWUFycmF5LFxuICBZVGV4dCxcbiAgWU1hcCxcbiAgWVhtbEVsZW1lbnQsXG4gIFlYbWxGcmFnbWVudCxcbiAgdHJhbnNhY3QsXG4gIENvbnRlbnREb2MsIEl0ZW0sIFRyYW5zYWN0aW9uLCBZRXZlbnQgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCB7IE9ic2VydmFibGVWMiB9IGZyb20gJ2xpYjAvb2JzZXJ2YWJsZSdcbmltcG9ydCAqIGFzIG1hcCBmcm9tICdsaWIwL21hcCdcbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJ2xpYjAvYXJyYXknXG5pbXBvcnQgKiBhcyBwcm9taXNlIGZyb20gJ2xpYjAvcHJvbWlzZSdcblxuZnVuY3Rpb24gdWludDMyKCkge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKDIgKiogMzIpKTtcbn1cblxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlTmV3Q2xpZW50SWQgPSB1aW50MzJcblxuZnVuY3Rpb24gdXVpZHY0KCkge1xuICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgPT4ge1xuICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuICAgIGNvbnN0IHYgPSBjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgfSk7XG59XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRG9jT3B0c1xuICogQHByb3BlcnR5IHtib29sZWFufSBbRG9jT3B0cy5nYz10cnVlXSBEaXNhYmxlIGdhcmJhZ2UgY29sbGVjdGlvbiAoZGVmYXVsdDogZ2M9dHJ1ZSlcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oSXRlbSk6Ym9vbGVhbn0gW0RvY09wdHMuZ2NGaWx0ZXJdIFdpbGwgYmUgY2FsbGVkIGJlZm9yZSBhbiBJdGVtIGlzIGdhcmJhZ2UgY29sbGVjdGVkLiBSZXR1cm4gZmFsc2UgdG8ga2VlcCB0aGUgSXRlbS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbRG9jT3B0cy5ndWlkXSBEZWZpbmUgYSBnbG9iYWxseSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyBkb2N1bWVudFxuICogQHByb3BlcnR5IHtzdHJpbmcgfCBudWxsfSBbRG9jT3B0cy5jb2xsZWN0aW9uaWRdIEFzc29jaWF0ZSB0aGlzIGRvY3VtZW50IHdpdGggYSBjb2xsZWN0aW9uLiBUaGlzIG9ubHkgcGxheXMgYSByb2xlIGlmIHlvdXIgcHJvdmlkZXIgaGFzIGEgY29uY2VwdCBvZiBjb2xsZWN0aW9uLlxuICogQHByb3BlcnR5IHthbnl9IFtEb2NPcHRzLm1ldGFdIEFueSBraW5kIG9mIG1ldGEgaW5mb3JtYXRpb24geW91IHdhbnQgdG8gYXNzb2NpYXRlIHdpdGggdGhpcyBkb2N1bWVudC4gSWYgdGhpcyBpcyBhIHN1YmRvY3VtZW50LCByZW1vdGUgcGVlcnMgd2lsbCBzdG9yZSB0aGUgbWV0YSBpbmZvcm1hdGlvbiBhcyB3ZWxsLlxuICogQHByb3BlcnR5IHtib29sZWFufSBbRG9jT3B0cy5hdXRvTG9hZF0gSWYgYSBzdWJkb2N1bWVudCwgYXV0b21hdGljYWxseSBsb2FkIGRvY3VtZW50LiBJZiB0aGlzIGlzIGEgc3ViZG9jdW1lbnQsIHJlbW90ZSBwZWVycyB3aWxsIGxvYWQgdGhlIGRvY3VtZW50IGFzIHdlbGwgYXV0b21hdGljYWxseS5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0RvY09wdHMuc2hvdWxkTG9hZF0gV2hldGhlciB0aGUgZG9jdW1lbnQgc2hvdWxkIGJlIHN5bmNlZCBieSB0aGUgcHJvdmlkZXIgbm93LiBUaGlzIGlzIHRvZ2dsZWQgdG8gdHJ1ZSB3aGVuIHlvdSBjYWxsIHlkb2MubG9hZCgpXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEb2NFdmVudHNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oRG9jKTp2b2lkfSBEb2NFdmVudHMuZGVzdHJveVxuICogQHByb3BlcnR5IHtmdW5jdGlvbihEb2MpOnZvaWR9IERvY0V2ZW50cy5sb2FkXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKGJvb2xlYW4sIERvYyk6dm9pZH0gRG9jRXZlbnRzLnN5bmNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVWludDhBcnJheSwgYW55LCBEb2MsIFRyYW5zYWN0aW9uKTp2b2lkfSBEb2NFdmVudHMudXBkYXRlXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKFVpbnQ4QXJyYXksIGFueSwgRG9jLCBUcmFuc2FjdGlvbik6dm9pZH0gRG9jRXZlbnRzLnVwZGF0ZVYyXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKERvYyk6dm9pZH0gRG9jRXZlbnRzLmJlZm9yZUFsbFRyYW5zYWN0aW9uc1xuICogQHByb3BlcnR5IHtmdW5jdGlvbihUcmFuc2FjdGlvbiwgRG9jKTp2b2lkfSBEb2NFdmVudHMuYmVmb3JlVHJhbnNhY3Rpb25cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVHJhbnNhY3Rpb24sIERvYyk6dm9pZH0gRG9jRXZlbnRzLmJlZm9yZU9ic2VydmVyQ2FsbHNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVHJhbnNhY3Rpb24sIERvYyk6dm9pZH0gRG9jRXZlbnRzLmFmdGVyVHJhbnNhY3Rpb25cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oVHJhbnNhY3Rpb24sIERvYyk6dm9pZH0gRG9jRXZlbnRzLmFmdGVyVHJhbnNhY3Rpb25DbGVhbnVwXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKERvYywgQXJyYXk8VHJhbnNhY3Rpb24+KTp2b2lkfSBEb2NFdmVudHMuYWZ0ZXJBbGxUcmFuc2FjdGlvbnNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oeyBsb2FkZWQ6IFNldDxEb2M+LCBhZGRlZDogU2V0PERvYz4sIHJlbW92ZWQ6IFNldDxEb2M+IH0sIERvYywgVHJhbnNhY3Rpb24pOnZvaWR9IERvY0V2ZW50cy5zdWJkb2NzXG4gKi9cblxuLyoqXG4gKiBBIFlqcyBpbnN0YW5jZSBoYW5kbGVzIHRoZSBzdGF0ZSBvZiBzaGFyZWQgZGF0YS5cbiAqIEBleHRlbmRzIE9ic2VydmFibGVWMjxEb2NFdmVudHM+XG4gKi9cbmV4cG9ydCBjbGFzcyBEb2MgZXh0ZW5kcyBPYnNlcnZhYmxlVjIge1xuICAvKipcbiAgICogQHBhcmFtIHtEb2NPcHRzfSBvcHRzIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yICh7IGd1aWQgPSB1dWlkdjQoKSwgY29sbGVjdGlvbmlkID0gbnVsbCwgZ2MgPSB0cnVlLCBnY0ZpbHRlciA9ICgpID0+IHRydWUsIG1ldGEgPSBudWxsLCBhdXRvTG9hZCA9IGZhbHNlLCBzaG91bGRMb2FkID0gdHJ1ZSB9ID0ge30pIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5nYyA9IGdjXG4gICAgdGhpcy5nY0ZpbHRlciA9IGdjRmlsdGVyXG4gICAgdGhpcy5jbGllbnRJRCA9IGdlbmVyYXRlTmV3Q2xpZW50SWQoKVxuICAgIHRoaXMuZ3VpZCA9IGd1aWRcbiAgICB0aGlzLmNvbGxlY3Rpb25pZCA9IGNvbGxlY3Rpb25pZFxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLCBBYnN0cmFjdFR5cGU8WUV2ZW50PGFueT4+Pn1cbiAgICAgKi9cbiAgICB0aGlzLnNoYXJlID0gbmV3IE1hcCgpXG4gICAgdGhpcy5zdG9yZSA9IG5ldyBTdHJ1Y3RTdG9yZSgpXG4gICAgLyoqXG4gICAgICogQHR5cGUge1RyYW5zYWN0aW9uIHwgbnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLl90cmFuc2FjdGlvbiA9IG51bGxcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8VHJhbnNhY3Rpb24+fVxuICAgICAqL1xuICAgIHRoaXMuX3RyYW5zYWN0aW9uQ2xlYW51cHMgPSBbXVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTZXQ8RG9jPn1cbiAgICAgKi9cbiAgICB0aGlzLnN1YmRvY3MgPSBuZXcgU2V0KClcbiAgICAvKipcbiAgICAgKiBJZiB0aGlzIGRvY3VtZW50IGlzIGEgc3ViZG9jdW1lbnQgLSBhIGRvY3VtZW50IGludGVncmF0ZWQgaW50byBhbm90aGVyIGRvY3VtZW50IC0gdGhlbiBfaXRlbSBpcyBkZWZpbmVkLlxuICAgICAqIEB0eXBlIHtJdGVtP31cbiAgICAgKi9cbiAgICB0aGlzLl9pdGVtID0gbnVsbFxuICAgIHRoaXMuc2hvdWxkTG9hZCA9IHNob3VsZExvYWRcbiAgICB0aGlzLmF1dG9Mb2FkID0gYXV0b0xvYWRcbiAgICB0aGlzLm1ldGEgPSBtZXRhXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHRoZSBwZXJzaXN0ZW5jZSBwcm92aWRlciBsb2FkZWQgdGhlIGRvY3VtZW50IGZyb20gdGhlIGRhdGFiYXNlIG9yIHdoZW4gdGhlIGBzeW5jYCBldmVudCBmaXJlcy5cbiAgICAgKiBOb3RlIHRoYXQgbm90IGFsbCBwcm92aWRlcnMgaW1wbGVtZW50IHRoaXMgZmVhdHVyZS4gUHJvdmlkZXIgYXV0aG9ycyBhcmUgZW5jb3VyYWdlZCB0byBmaXJlIHRoZSBgbG9hZGAgZXZlbnQgd2hlbiB0aGUgZG9jIGNvbnRlbnQgaXMgbG9hZGVkIGZyb20gdGhlIGRhdGFiYXNlLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHRoZSBjb25uZWN0aW9uIHByb3ZpZGVyIGhhcyBzdWNjZXNzZnVsbHkgc3luY2VkIHdpdGggYSBiYWNrZW5kLlxuICAgICAqIE5vdGUgdGhhdCB3aGVuIHVzaW5nIHBlZXItdG8tcGVlciBwcm92aWRlcnMgdGhpcyBldmVudCBtYXkgbm90IHByb3ZpZGUgdmVyeSB1c2VmdWwuXG4gICAgICogQWxzbyBub3RlIHRoYXQgbm90IGFsbCBwcm92aWRlcnMgaW1wbGVtZW50IHRoaXMgZmVhdHVyZS4gUHJvdmlkZXIgYXV0aG9ycyBhcmUgZW5jb3VyYWdlZCB0byBmaXJlXG4gICAgICogdGhlIGBzeW5jYCBldmVudCB3aGVuIHRoZSBkb2MgaGFzIGJlZW4gc3luY2VkICh3aXRoIGB0cnVlYCBhcyBhIHBhcmFtZXRlcikgb3IgaWYgY29ubmVjdGlvbiBpc1xuICAgICAqIGxvc3QgKHdpdGggZmFsc2UgYXMgYSBwYXJhbWV0ZXIpLlxuICAgICAqL1xuICAgIHRoaXMuaXNTeW5jZWQgPSBmYWxzZVxuICAgIHRoaXMuaXNEZXN0cm95ZWQgPSBmYWxzZVxuICAgIC8qKlxuICAgICAqIFByb21pc2UgdGhhdCByZXNvbHZlcyBvbmNlIHRoZSBkb2N1bWVudCBoYXMgYmVlbiBsb2FkZWQgZnJvbSBhIHByZXNpc3RlbmNlIHByb3ZpZGVyLlxuICAgICAqL1xuICAgIHRoaXMud2hlbkxvYWRlZCA9IHByb21pc2UuY3JlYXRlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5vbignbG9hZCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWVcbiAgICAgICAgcmVzb2x2ZSh0aGlzKVxuICAgICAgfSlcbiAgICB9KVxuICAgIGNvbnN0IHByb3ZpZGVTeW5jZWRQcm9taXNlID0gKCkgPT4gcHJvbWlzZS5jcmVhdGUocmVzb2x2ZSA9PiB7XG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTeW5jZWRcbiAgICAgICAqL1xuICAgICAgY29uc3QgZXZlbnRIYW5kbGVyID0gKGlzU3luY2VkKSA9PiB7XG4gICAgICAgIGlmIChpc1N5bmNlZCA9PT0gdW5kZWZpbmVkIHx8IGlzU3luY2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgdGhpcy5vZmYoJ3N5bmMnLCBldmVudEhhbmRsZXIpXG4gICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMub24oJ3N5bmMnLCBldmVudEhhbmRsZXIpXG4gICAgfSlcbiAgICB0aGlzLm9uKCdzeW5jJywgaXNTeW5jZWQgPT4ge1xuICAgICAgaWYgKGlzU3luY2VkID09PSBmYWxzZSAmJiB0aGlzLmlzU3luY2VkKSB7XG4gICAgICAgIHRoaXMud2hlblN5bmNlZCA9IHByb3ZpZGVTeW5jZWRQcm9taXNlKClcbiAgICAgIH1cbiAgICAgIHRoaXMuaXNTeW5jZWQgPSBpc1N5bmNlZCA9PT0gdW5kZWZpbmVkIHx8IGlzU3luY2VkID09PSB0cnVlXG4gICAgICBpZiAodGhpcy5pc1N5bmNlZCAmJiAhdGhpcy5pc0xvYWRlZCkge1xuICAgICAgICB0aGlzLmVtaXQoJ2xvYWQnLCBbdGhpc10pXG4gICAgICB9XG4gICAgfSlcbiAgICAvKipcbiAgICAgKiBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgb25jZSB0aGUgZG9jdW1lbnQgaGFzIGJlZW4gc3luY2VkIHdpdGggYSBiYWNrZW5kLlxuICAgICAqIFRoaXMgcHJvbWlzZSBpcyByZWNyZWF0ZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBsb3N0LlxuICAgICAqIE5vdGUgdGhlIGRvY3VtZW50YXRpb24gYWJvdXQgdGhlIGBpc1N5bmNlZGAgcHJvcGVydHkuXG4gICAgICovXG4gICAgdGhpcy53aGVuU3luY2VkID0gcHJvdmlkZVN5bmNlZFByb21pc2UoKVxuICB9XG5cbiAgLyoqXG4gICAqIE5vdGlmeSB0aGUgcGFyZW50IGRvY3VtZW50IHRoYXQgeW91IHJlcXVlc3QgdG8gbG9hZCBkYXRhIGludG8gdGhpcyBzdWJkb2N1bWVudCAoaWYgaXQgaXMgYSBzdWJkb2N1bWVudCkuXG4gICAqXG4gICAqIGBsb2FkKClgIG1pZ2h0IGJlIHVzZWQgaW4gdGhlIGZ1dHVyZSB0byByZXF1ZXN0IGFueSBwcm92aWRlciB0byBsb2FkIHRoZSBtb3N0IGN1cnJlbnQgZGF0YS5cbiAgICpcbiAgICogSXQgaXMgc2FmZSB0byBjYWxsIGBsb2FkKClgIG11bHRpcGxlIHRpbWVzLlxuICAgKi9cbiAgbG9hZCAoKSB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuX2l0ZW1cbiAgICBpZiAoaXRlbSAhPT0gbnVsbCAmJiAhdGhpcy5zaG91bGRMb2FkKSB7XG4gICAgICB0cmFuc2FjdCgvKiogQHR5cGUge2FueX0gKi8gKGl0ZW0ucGFyZW50KS5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHJhbnNhY3Rpb24uc3ViZG9jc0xvYWRlZC5hZGQodGhpcylcbiAgICAgIH0sIG51bGwsIHRydWUpXG4gICAgfVxuICAgIHRoaXMuc2hvdWxkTG9hZCA9IHRydWVcbiAgfVxuXG4gIGdldFN1YmRvY3MgKCkge1xuICAgIHJldHVybiB0aGlzLnN1YmRvY3NcbiAgfVxuXG4gIGdldFN1YmRvY0d1aWRzICgpIHtcbiAgICByZXR1cm4gbmV3IFNldChhcnJheS5mcm9tKHRoaXMuc3ViZG9jcykubWFwKGRvYyA9PiBkb2MuZ3VpZCkpXG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGF0IGhhcHBlbiBpbnNpZGUgb2YgYSB0cmFuc2FjdGlvbiBhcmUgYnVuZGxlZC4gVGhpcyBtZWFucyB0aGF0XG4gICAqIHRoZSBvYnNlcnZlciBmaXJlcyBfYWZ0ZXJfIHRoZSB0cmFuc2FjdGlvbiBpcyBmaW5pc2hlZCBhbmQgdGhhdCBhbGwgY2hhbmdlc1xuICAgKiB0aGF0IGhhcHBlbmVkIGluc2lkZSBvZiB0aGUgdHJhbnNhY3Rpb24gYXJlIHNlbnQgYXMgb25lIG1lc3NhZ2UgdG8gdGhlXG4gICAqIG90aGVyIHBlZXJzLlxuICAgKlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFRyYW5zYWN0aW9uKTpUfSBmIFRoZSBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBhcyBhIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7YW55fSBbb3JpZ2luXSBPcmlnaW4gb2Ygd2hvIHN0YXJ0ZWQgdGhlIHRyYW5zYWN0aW9uLiBXaWxsIGJlIHN0b3JlZCBvbiB0cmFuc2FjdGlvbi5vcmlnaW5cbiAgICogQHJldHVybiBUXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRyYW5zYWN0IChmLCBvcmlnaW4gPSBudWxsKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0KHRoaXMsIGYsIG9yaWdpbilcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZpbmUgYSBzaGFyZWQgZGF0YSB0eXBlLlxuICAgKlxuICAgKiBNdWx0aXBsZSBjYWxscyBvZiBgeWRvYy5nZXQobmFtZSwgVHlwZUNvbnN0cnVjdG9yKWAgeWllbGQgdGhlIHNhbWUgcmVzdWx0XG4gICAqIGFuZCBkbyBub3Qgb3ZlcndyaXRlIGVhY2ggb3RoZXIuIEkuZS5cbiAgICogYHlkb2MuZ2V0KG5hbWUsIFkuQXJyYXkpID09PSB5ZG9jLmdldChuYW1lLCBZLkFycmF5KWBcbiAgICpcbiAgICogQWZ0ZXIgdGhpcyBtZXRob2QgaXMgY2FsbGVkLCB0aGUgdHlwZSBpcyBhbHNvIGF2YWlsYWJsZSBvbiBgeWRvYy5zaGFyZS5nZXQobmFtZSlgLlxuICAgKlxuICAgKiAqQmVzdCBQcmFjdGljZXM6KlxuICAgKiBEZWZpbmUgYWxsIHR5cGVzIHJpZ2h0IGFmdGVyIHRoZSBZLkRvYyBpbnN0YW5jZSBpcyBjcmVhdGVkIGFuZCBzdG9yZSB0aGVtIGluIGEgc2VwYXJhdGUgb2JqZWN0LlxuICAgKiBBbHNvIHVzZSB0aGUgdHlwZWQgbWV0aG9kcyBgZ2V0VGV4dChuYW1lKWAsIGBnZXRBcnJheShuYW1lKWAsIC4uXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSB7dHlwZW9mIEFic3RyYWN0VHlwZTxhbnk+fSBUeXBlXG4gICAqIEBleGFtcGxlXG4gICAqICAgY29uc3QgeWRvYyA9IG5ldyBZLkRvYyguLilcbiAgICogICBjb25zdCBhcHBTdGF0ZSA9IHtcbiAgICogICAgIGRvY3VtZW50OiB5ZG9jLmdldFRleHQoJ2RvY3VtZW50JylcbiAgICogICAgIGNvbW1lbnRzOiB5ZG9jLmdldEFycmF5KCdjb21tZW50cycpXG4gICAqICAgfVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge1R5cGV9IFR5cGVDb25zdHJ1Y3RvciBUaGUgY29uc3RydWN0b3Igb2YgdGhlIHR5cGUgZGVmaW5pdGlvbi4gRS5nLiBZLlRleHQsIFkuQXJyYXksIFkuTWFwLCAuLi5cbiAgICogQHJldHVybiB7SW5zdGFuY2VUeXBlPFR5cGU+fSBUaGUgY3JlYXRlZCB0eXBlLiBDb25zdHJ1Y3RlZCB3aXRoIFR5cGVDb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBnZXQgKG5hbWUsIFR5cGVDb25zdHJ1Y3RvciA9IC8qKiBAdHlwZSB7YW55fSAqLyAoQWJzdHJhY3RUeXBlKSkge1xuICAgIGNvbnN0IHR5cGUgPSBtYXAuc2V0SWZVbmRlZmluZWQodGhpcy5zaGFyZSwgbmFtZSwgKCkgPT4ge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgdCA9IG5ldyBUeXBlQ29uc3RydWN0b3IoKVxuICAgICAgdC5faW50ZWdyYXRlKHRoaXMsIG51bGwpXG4gICAgICByZXR1cm4gdFxuICAgIH0pXG4gICAgY29uc3QgQ29uc3RyID0gdHlwZS5jb25zdHJ1Y3RvclxuICAgIGlmIChUeXBlQ29uc3RydWN0b3IgIT09IEFic3RyYWN0VHlwZSAmJiBDb25zdHIgIT09IFR5cGVDb25zdHJ1Y3Rvcikge1xuICAgICAgaWYgKENvbnN0ciA9PT0gQWJzdHJhY3RUeXBlKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdCA9IG5ldyBUeXBlQ29uc3RydWN0b3IoKVxuICAgICAgICB0Ll9tYXAgPSB0eXBlLl9tYXBcbiAgICAgICAgdHlwZS5fbWFwLmZvckVhY2goLyoqIEBwYXJhbSB7SXRlbT99IG4gKi8gbiA9PiB7XG4gICAgICAgICAgZm9yICg7IG4gIT09IG51bGw7IG4gPSBuLmxlZnQpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIG4ucGFyZW50ID0gdFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgdC5fc3RhcnQgPSB0eXBlLl9zdGFydFxuICAgICAgICBmb3IgKGxldCBuID0gdC5fc3RhcnQ7IG4gIT09IG51bGw7IG4gPSBuLnJpZ2h0KSB7XG4gICAgICAgICAgbi5wYXJlbnQgPSB0XG4gICAgICAgIH1cbiAgICAgICAgdC5fbGVuZ3RoID0gdHlwZS5fbGVuZ3RoXG4gICAgICAgIHRoaXMuc2hhcmUuc2V0KG5hbWUsIHQpXG4gICAgICAgIHQuX2ludGVncmF0ZSh0aGlzLCBudWxsKVxuICAgICAgICByZXR1cm4gLyoqIEB0eXBlIHtJbnN0YW5jZVR5cGU8VHlwZT59ICovICh0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUeXBlIHdpdGggdGhlIG5hbWUgJHtuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlZmluZWQgd2l0aCBhIGRpZmZlcmVudCBjb25zdHJ1Y3RvcmApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAvKiogQHR5cGUge0luc3RhbmNlVHlwZTxUeXBlPn0gKi8gKHR5cGUpXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIFRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXVxuICAgKiBAcmV0dXJuIHtZQXJyYXk8VD59XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldEFycmF5IChuYW1lID0gJycpIHtcbiAgICByZXR1cm4gLyoqIEB0eXBlIHtZQXJyYXk8VD59ICovICh0aGlzLmdldChuYW1lLCBZQXJyYXkpKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV1cbiAgICogQHJldHVybiB7WVRleHR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldFRleHQgKG5hbWUgPSAnJykge1xuICAgIHJldHVybiB0aGlzLmdldChuYW1lLCBZVGV4dClcbiAgfVxuXG4gIC8qKlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWVdXG4gICAqIEByZXR1cm4ge1lNYXA8VD59XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldE1hcCAobmFtZSA9ICcnKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7WU1hcDxUPn0gKi8gKHRoaXMuZ2V0KG5hbWUsIFlNYXApKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV1cbiAgICogQHJldHVybiB7WVhtbEVsZW1lbnR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldFhtbEVsZW1lbnQgKG5hbWUgPSAnJykge1xuICAgIHJldHVybiAvKiogQHR5cGUge1lYbWxFbGVtZW50PHtba2V5OnN0cmluZ106c3RyaW5nfT59ICovICh0aGlzLmdldChuYW1lLCBZWG1sRWxlbWVudCkpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXVxuICAgKiBAcmV0dXJuIHtZWG1sRnJhZ21lbnR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldFhtbEZyYWdtZW50IChuYW1lID0gJycpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQobmFtZSwgWVhtbEZyYWdtZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBlbnRpcmUgZG9jdW1lbnQgaW50byBhIGpzIG9iamVjdCwgcmVjdXJzaXZlbHkgdHJhdmVyc2luZyBlYWNoIHlqcyB0eXBlXG4gICAqIERvZXNuJ3QgbG9nIHR5cGVzIHRoYXQgaGF2ZSBub3QgYmVlbiBkZWZpbmVkICh1c2luZyB5ZG9jLmdldFR5cGUoLi4pKS5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgRG8gbm90IHVzZSB0aGlzIG1ldGhvZCBhbmQgcmF0aGVyIGNhbGwgdG9KU09OIGRpcmVjdGx5IG9uIHRoZSBzaGFyZWQgdHlwZXMuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsIGFueT59XG4gICAqL1xuICB0b0pTT04gKCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLCBhbnk+fVxuICAgICAqL1xuICAgIGNvbnN0IGRvYyA9IHt9XG5cbiAgICB0aGlzLnNoYXJlLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGRvY1trZXldID0gdmFsdWUudG9KU09OKClcbiAgICB9KVxuXG4gICAgcmV0dXJuIGRvY1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXQgYGRlc3Ryb3lgIGV2ZW50IGFuZCB1bnJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVycy5cbiAgICovXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuaXNEZXN0cm95ZWQgPSB0cnVlXG4gICAgYXJyYXkuZnJvbSh0aGlzLnN1YmRvY3MpLmZvckVhY2goc3ViZG9jID0+IHN1YmRvYy5kZXN0cm95KCkpXG4gICAgY29uc3QgaXRlbSA9IHRoaXMuX2l0ZW1cbiAgICBpZiAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5faXRlbSA9IG51bGxcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSAvKiogQHR5cGUge0NvbnRlbnREb2N9ICovIChpdGVtLmNvbnRlbnQpXG4gICAgICBjb250ZW50LmRvYyA9IG5ldyBEb2MoeyBndWlkOiB0aGlzLmd1aWQsIC4uLmNvbnRlbnQub3B0cywgc2hvdWxkTG9hZDogZmFsc2UgfSlcbiAgICAgIGNvbnRlbnQuZG9jLl9pdGVtID0gaXRlbVxuICAgICAgdHJhbnNhY3QoLyoqIEB0eXBlIHthbnl9ICovIChpdGVtKS5wYXJlbnQuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIGNvbnN0IGRvYyA9IGNvbnRlbnQuZG9jXG4gICAgICAgIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgICAgdHJhbnNhY3Rpb24uc3ViZG9jc0FkZGVkLmFkZChkb2MpXG4gICAgICAgIH1cbiAgICAgICAgdHJhbnNhY3Rpb24uc3ViZG9jc1JlbW92ZWQuYWRkKHRoaXMpXG4gICAgICB9LCBudWxsLCB0cnVlKVxuICAgIH1cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgdGhpcy5lbWl0KCdkZXN0cm95ZWQnLCBbdHJ1ZV0pIC8vIERFUFJFQ0FURUQhXG4gICAgdGhpcy5lbWl0KCdkZXN0cm95JywgW3RoaXNdKVxuICAgIHN1cGVyLmRlc3Ryb3koKVxuICB9XG59XG4iLCAiLyoqXG4gKiBPZnRlbiB1c2VkIGNvbmRpdGlvbnMuXG4gKlxuICogQG1vZHVsZSBjb25kaXRpb25zXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfG51bGx8dW5kZWZpbmVkfSB2XG4gKiBAcmV0dXJuIHtUfG51bGx9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgdW5kZWZpbmVkVG9OdWxsID0gdiA9PiB2ID09PSB1bmRlZmluZWQgPyBudWxsIDogdlxuIiwgIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIElzb21vcnBoaWMgdmFyaWFibGUgc3RvcmFnZS5cbiAqXG4gKiBVc2VzIExvY2FsU3RvcmFnZSBpbiB0aGUgYnJvd3NlciBhbmQgZmFsbHMgYmFjayB0byBpbi1tZW1vcnkgc3RvcmFnZS5cbiAqXG4gKiBAbW9kdWxlIHN0b3JhZ2VcbiAqL1xuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmNsYXNzIFZhclN0b3JhZ2VQb2x5ZmlsbCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLm1hcCA9IG5ldyBNYXAoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHthbnl9IG5ld1ZhbHVlXG4gICAqL1xuICBzZXRJdGVtIChrZXksIG5ld1ZhbHVlKSB7XG4gICAgdGhpcy5tYXAuc2V0KGtleSwgbmV3VmFsdWUpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKi9cbiAgZ2V0SXRlbSAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmdldChrZXkpXG4gIH1cbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHR5cGUge2FueX1cbiAqL1xubGV0IF9sb2NhbFN0b3JhZ2UgPSBuZXcgVmFyU3RvcmFnZVBvbHlmaWxsKClcbmxldCB1c2VQb2x5ZmlsbCA9IHRydWVcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG50cnkge1xuICAvLyBpZiB0aGUgc2FtZS1vcmlnaW4gcnVsZSBpcyB2aW9sYXRlZCwgYWNjZXNzaW5nIGxvY2FsU3RvcmFnZSBtaWdodCB0aHJvd24gYW4gZXJyb3JcbiAgaWYgKHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09ICd1bmRlZmluZWQnICYmIGxvY2FsU3RvcmFnZSkge1xuICAgIF9sb2NhbFN0b3JhZ2UgPSBsb2NhbFN0b3JhZ2VcbiAgICB1c2VQb2x5ZmlsbCA9IGZhbHNlXG4gIH1cbn0gY2F0Y2ggKGUpIHsgfVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBsb2NhbFN0b3JhZ2UgaW4gYnJvd3Nlciwgb3IgYSBwb2x5ZmlsbCBpbiBub2RlanNcbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB2YXJTdG9yYWdlID0gX2xvY2FsU3RvcmFnZVxuXG4vKipcbiAqIEEgcG9seWZpbGwgZm9yIGBhZGRFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgZXZlbnQgPT4gey4ufSlgIHRoYXQgZG9lcyBub3RoaW5nIGlmIHRoZSBwb2x5ZmlsbCBpcyBiZWluZyB1c2VkLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeyBrZXk6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZyB9KTogdm9pZH0gZXZlbnRIYW5kbGVyXG4gKiBAZnVuY3Rpb25cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBvbkNoYW5nZSA9IGV2ZW50SGFuZGxlciA9PiB1c2VQb2x5ZmlsbCB8fCBhZGRFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgLyoqIEB0eXBlIHthbnl9ICovIChldmVudEhhbmRsZXIpKVxuXG4vKipcbiAqIEEgcG9seWZpbGwgZm9yIGByZW1vdmVFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgZXZlbnQgPT4gey4ufSlgIHRoYXQgZG9lcyBub3RoaW5nIGlmIHRoZSBwb2x5ZmlsbCBpcyBiZWluZyB1c2VkLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeyBrZXk6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZyB9KTogdm9pZH0gZXZlbnRIYW5kbGVyXG4gKiBAZnVuY3Rpb25cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBvZmZDaGFuZ2UgPSBldmVudEhhbmRsZXIgPT4gdXNlUG9seWZpbGwgfHwgcmVtb3ZlRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIC8qKiBAdHlwZSB7YW55fSAqLyAoZXZlbnRIYW5kbGVyKSlcbiIsICIvKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIGZvciB3b3JraW5nIHdpdGggRWNtYVNjcmlwdCBvYmplY3RzLlxuICpcbiAqIEBtb2R1bGUgb2JqZWN0XG4gKi9cblxuLyoqXG4gKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLGFueT59IG9ialxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4vKipcbiAqIE9iamVjdC5hc3NpZ25cbiAqL1xuZXhwb3J0IGNvbnN0IGFzc2lnbiA9IE9iamVjdC5hc3NpZ25cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gb2JqXG4gKi9cbmV4cG9ydCBjb25zdCBrZXlzID0gT2JqZWN0LmtleXNcblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHt7W2s6c3RyaW5nXTpWfX0gb2JqXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFYsc3RyaW5nKTphbnl9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IGZvckVhY2ggPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGYob2JqW2tleV0sIGtleSlcbiAgfVxufVxuXG4vKipcbiAqIEB0b2RvIGltcGxlbWVudCBtYXBUb0FycmF5ICYgbWFwXG4gKlxuICogQHRlbXBsYXRlIFJcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LHN0cmluZyk6Un0gZlxuICogQHJldHVybiB7QXJyYXk8Uj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAob2JqLCBmKSA9PiB7XG4gIGNvbnN0IHJlc3VsdHMgPSBbXVxuICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICByZXN1bHRzLnB1c2goZihvYmpba2V5XSwga2V5KSlcbiAgfVxuICByZXR1cm4gcmVzdWx0c1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIHVzZSBvYmplY3Quc2l6ZSBpbnN0ZWFkXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gb2JqXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBsZW5ndGggPSBvYmogPT4ga2V5cyhvYmopLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNpemUgPSBvYmogPT4ga2V5cyhvYmopLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LHN0cmluZyk6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNvbWUgPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGlmIChmKG9ialtrZXldLCBrZXkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdHx1bmRlZmluZWR9IG9ialxuICovXG5leHBvcnQgY29uc3QgaXNFbXB0eSA9IG9iaiA9PiB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICBmb3IgKGNvbnN0IF9rIGluIG9iaikge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IG9ialxuICogQHBhcmFtIHtmdW5jdGlvbihhbnksc3RyaW5nKTpib29sZWFufSBmXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXZlcnkgPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGlmICghZihvYmpba2V5XSwga2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQ2FsbHMgYE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlgLlxuICpcbiAqIEBwYXJhbSB7YW55fSBvYmpcbiAqIEBwYXJhbSB7c3RyaW5nfHN5bWJvbH0ga2V5XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgaGFzUHJvcGVydHkgPSAob2JqLCBrZXkpID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSlcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gYVxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbEZsYXQgPSAoYSwgYikgPT4gYSA9PT0gYiB8fCAoc2l6ZShhKSA9PT0gc2l6ZShiKSAmJiBldmVyeShhLCAodmFsLCBrZXkpID0+ICh2YWwgIT09IHVuZGVmaW5lZCB8fCBoYXNQcm9wZXJ0eShiLCBrZXkpKSAmJiBiW2tleV0gPT09IHZhbCkpXG4iLCAiLyoqXG4gKiBDb21tb24gZnVuY3Rpb25zIGFuZCBmdW5jdGlvbiBjYWxsIGhlbHBlcnMuXG4gKlxuICogQG1vZHVsZSBmdW5jdGlvblxuICovXG5cbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJy4vYXJyYXkuanMnXG5pbXBvcnQgKiBhcyBvYmplY3QgZnJvbSAnLi9vYmplY3QuanMnXG5cbi8qKlxuICogQ2FsbHMgYWxsIGZ1bmN0aW9ucyBpbiBgZnNgIHdpdGggYXJncy4gT25seSB0aHJvd3MgYWZ0ZXIgYWxsIGZ1bmN0aW9ucyB3ZXJlIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5PGZ1bmN0aW9uPn0gZnNcbiAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gYXJnc1xuICovXG5leHBvcnQgY29uc3QgY2FsbEFsbCA9IChmcywgYXJncywgaSA9IDApID0+IHtcbiAgdHJ5IHtcbiAgICBmb3IgKDsgaSA8IGZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmc1tpXSguLi5hcmdzKVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoaSA8IGZzLmxlbmd0aCkge1xuICAgICAgY2FsbEFsbChmcywgYXJncywgaSArIDEpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBub3AgPSAoKSA9PiB7fVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCk6VH0gZlxuICogQHJldHVybiB7VH1cbiAqL1xuZXhwb3J0IGNvbnN0IGFwcGx5ID0gZiA9PiBmKClcblxuLyoqXG4gKiBAdGVtcGxhdGUgQVxuICpcbiAqIEBwYXJhbSB7QX0gYVxuICogQHJldHVybiB7QX1cbiAqL1xuZXhwb3J0IGNvbnN0IGlkID0gYSA9PiBhXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqXG4gKiBAcGFyYW0ge1R9IGFcbiAqIEBwYXJhbSB7VH0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFsaXR5U3RyaWN0ID0gKGEsIGIpID0+IGEgPT09IGJcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICpcbiAqIEBwYXJhbSB7QXJyYXk8VD58b2JqZWN0fSBhXG4gKiBAcGFyYW0ge0FycmF5PFQ+fG9iamVjdH0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFsaXR5RmxhdCA9IChhLCBiKSA9PiBhID09PSBiIHx8IChhICE9IG51bGwgJiYgYiAhPSBudWxsICYmIGEuY29uc3RydWN0b3IgPT09IGIuY29uc3RydWN0b3IgJiYgKChhcnJheS5pc0FycmF5KGEpICYmIGFycmF5LmVxdWFsRmxhdChhLCAvKiogQHR5cGUge0FycmF5PFQ+fSAqLyAoYikpKSB8fCAodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIG9iamVjdC5lcXVhbEZsYXQoYSwgYikpKSlcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGFcbiAqIEBwYXJhbSB7YW55fSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXF1YWxpdHlEZWVwID0gKGEsIGIpID0+IHtcbiAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHtcbiAgICByZXR1cm4gZXF1YWxpdHlTdHJpY3QoYSwgYilcbiAgfVxuICBpZiAoYS5jb25zdHJ1Y3RvciAhPT0gYi5jb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBzd2l0Y2ggKGEuY29uc3RydWN0b3IpIHtcbiAgICBjYXNlIEFycmF5QnVmZmVyOlxuICAgICAgYSA9IG5ldyBVaW50OEFycmF5KGEpXG4gICAgICBiID0gbmV3IFVpbnQ4QXJyYXkoYilcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZmFsbHRocm91Z2hcbiAgICBjYXNlIFVpbnQ4QXJyYXk6IHtcbiAgICAgIGlmIChhLmJ5dGVMZW5ndGggIT09IGIuYnl0ZUxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgICBjYXNlIFNldDoge1xuICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhKSB7XG4gICAgICAgIGlmICghYi5oYXModmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNhc2UgTWFwOiB7XG4gICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBhLmtleXMoKSkge1xuICAgICAgICBpZiAoIWIuaGFzKGtleSkgfHwgIWVxdWFsaXR5RGVlcChhLmdldChrZXkpLCBiLmdldChrZXkpKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgICBjYXNlIE9iamVjdDpcbiAgICAgIGlmIChvYmplY3QubGVuZ3RoKGEpICE9PSBvYmplY3QubGVuZ3RoKGIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoIW9iamVjdC5oYXNQcm9wZXJ0eShhLCBrZXkpIHx8ICFlcXVhbGl0eURlZXAoYVtrZXldLCBiW2tleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSBBcnJheTpcbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFlcXVhbGl0eURlZXAoYVtpXSwgYltpXSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHRlbXBsYXRlIHtWfSBPUFRTXG4gKlxuICogQHBhcmFtIHtWfSB2YWx1ZVxuICogQHBhcmFtIHtBcnJheTxPUFRTPn0gb3B0aW9uc1xuICovXG4vLyBAdHMtaWdub3JlXG5leHBvcnQgY29uc3QgaXNPbmVPZiA9ICh2YWx1ZSwgb3B0aW9ucykgPT4gb3B0aW9ucy5pbmNsdWRlcyh2YWx1ZSlcbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbmV4cG9ydCBjb25zdCBpc0FycmF5ID0gYXJyYXkuaXNBcnJheVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBzXG4gKiBAcmV0dXJuIHtzIGlzIFN0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IGlzU3RyaW5nID0gKHMpID0+IHMgJiYgcy5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IG5cbiAqIEByZXR1cm4ge24gaXMgTnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgaXNOdW1iZXIgPSBuID0+IG4gIT0gbnVsbCAmJiBuLmNvbnN0cnVjdG9yID09PSBOdW1iZXJcblxuLyoqXG4gKiBAdGVtcGxhdGUge2Fic3RyYWN0IG5ldyAoLi4uYXJnczogYW55KSA9PiBhbnl9IFRZUEVcbiAqIEBwYXJhbSB7YW55fSBuXG4gKiBAcGFyYW0ge1RZUEV9IFRcbiAqIEByZXR1cm4ge24gaXMgSW5zdGFuY2VUeXBlPFRZUEU+fVxuICovXG5leHBvcnQgY29uc3QgaXMgPSAobiwgVCkgPT4gbiAmJiBuLmNvbnN0cnVjdG9yID09PSBUXG5cbi8qKlxuICogQHRlbXBsYXRlIHthYnN0cmFjdCBuZXcgKC4uLmFyZ3M6IGFueSkgPT4gYW55fSBUWVBFXG4gKiBAcGFyYW0ge1RZUEV9IFRcbiAqL1xuZXhwb3J0IGNvbnN0IGlzVGVtcGxhdGUgPSAoVCkgPT5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBuXG4gICAqIEByZXR1cm4ge24gaXMgSW5zdGFuY2VUeXBlPFRZUEU+fVxuICAgKiovXG4gIG4gPT4gbiAmJiBuLmNvbnN0cnVjdG9yID09PSBUXG4iLCAiLyoqXG4gKiBJc29tb3JwaGljIG1vZHVsZSB0byB3b3JrIGFjY2VzcyB0aGUgZW52aXJvbm1lbnQgKHF1ZXJ5IHBhcmFtcywgZW52IHZhcmlhYmxlcykuXG4gKlxuICogQG1vZHVsZSBtYXBcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5pbXBvcnQgKiBhcyBzdHJpbmcgZnJvbSAnLi9zdHJpbmcuanMnXG5pbXBvcnQgKiBhcyBjb25kaXRpb25zIGZyb20gJy4vY29uZGl0aW9ucy5qcydcbmltcG9ydCAqIGFzIHN0b3JhZ2UgZnJvbSAnLi9zdG9yYWdlLmpzJ1xuaW1wb3J0ICogYXMgZiBmcm9tICcuL2Z1bmN0aW9uLmpzJ1xuXG4vKiBjOCBpZ25vcmUgbmV4dCAyICovXG4vLyBAdHMtaWdub3JlXG5leHBvcnQgY29uc3QgaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MucmVsZWFzZSAmJiAvbm9kZXxpb1xcLmpzLy50ZXN0KHByb2Nlc3MucmVsZWFzZS5uYW1lKSAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2VzcyA6IDApID09PSAnW29iamVjdCBwcm9jZXNzXSdcblxuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBpc0Jyb3dzZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmICFpc05vZGVcbi8qIGM4IGlnbm9yZSBuZXh0IDMgKi9cbmV4cG9ydCBjb25zdCBpc01hYyA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnXG4gID8gL01hYy8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pXG4gIDogZmFsc2VcblxuLyoqXG4gKiBAdHlwZSB7TWFwPHN0cmluZyxzdHJpbmc+fVxuICovXG5sZXQgcGFyYW1zXG5jb25zdCBhcmdzID0gW11cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5jb25zdCBjb21wdXRlUGFyYW1zID0gKCkgPT4ge1xuICBpZiAocGFyYW1zID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoaXNOb2RlKSB7XG4gICAgICBwYXJhbXMgPSBtYXAuY3JlYXRlKClcbiAgICAgIGNvbnN0IHBhcmdzID0gcHJvY2Vzcy5hcmd2XG4gICAgICBsZXQgY3VyclBhcmFtTmFtZSA9IG51bGxcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFyZyA9IHBhcmdzW2ldXG4gICAgICAgIGlmIChwYXJnWzBdID09PSAnLScpIHtcbiAgICAgICAgICBpZiAoY3VyclBhcmFtTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyYW1zLnNldChjdXJyUGFyYW1OYW1lLCAnJylcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VyclBhcmFtTmFtZSA9IHBhcmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoY3VyclBhcmFtTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyYW1zLnNldChjdXJyUGFyYW1OYW1lLCBwYXJnKVxuICAgICAgICAgICAgY3VyclBhcmFtTmFtZSA9IG51bGxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJncy5wdXNoKHBhcmcpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoY3VyclBhcmFtTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICBwYXJhbXMuc2V0KGN1cnJQYXJhbU5hbWUsICcnKVxuICAgICAgfVxuICAgICAgLy8gaW4gUmVhY3ROYXRpdmUgZm9yIGV4YW1wbGUgdGhpcyB3b3VsZCBub3QgYmUgdHJ1ZSAodW5sZXNzIGNvbm5lY3RlZCB0byB0aGUgUmVtb3RlIERlYnVnZ2VyKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGxvY2F0aW9uID09PSAnb2JqZWN0Jykge1xuICAgICAgcGFyYW1zID0gbWFwLmNyZWF0ZSgpOyAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgICAgIChsb2NhdGlvbi5zZWFyY2ggfHwgJz8nKS5zbGljZSgxKS5zcGxpdCgnJicpLmZvckVhY2goKGt2KSA9PiB7XG4gICAgICAgIGlmIChrdi5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBjb25zdCBba2V5LCB2YWx1ZV0gPSBrdi5zcGxpdCgnPScpXG4gICAgICAgICAgcGFyYW1zLnNldChgLS0ke3N0cmluZy5mcm9tQ2FtZWxDYXNlKGtleSwgJy0nKX1gLCB2YWx1ZSlcbiAgICAgICAgICBwYXJhbXMuc2V0KGAtJHtzdHJpbmcuZnJvbUNhbWVsQ2FzZShrZXksICctJyl9YCwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcyA9IG1hcC5jcmVhdGUoKVxuICAgIH1cbiAgfVxuICByZXR1cm4gcGFyYW1zXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGhhc1BhcmFtID0gKG5hbWUpID0+IGNvbXB1dGVQYXJhbXMoKS5oYXMobmFtZSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGRlZmF1bHRWYWxcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IGdldFBhcmFtID0gKG5hbWUsIGRlZmF1bHRWYWwpID0+XG4gIGNvbXB1dGVQYXJhbXMoKS5nZXQobmFtZSkgfHwgZGVmYXVsdFZhbFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgNCAqL1xuZXhwb3J0IGNvbnN0IGdldFZhcmlhYmxlID0gKG5hbWUpID0+XG4gIGlzTm9kZVxuICAgID8gY29uZGl0aW9ucy51bmRlZmluZWRUb051bGwocHJvY2Vzcy5lbnZbbmFtZS50b1VwcGVyQ2FzZSgpLnJlcGxhY2VBbGwoJy0nLCAnXycpXSlcbiAgICA6IGNvbmRpdGlvbnMudW5kZWZpbmVkVG9OdWxsKHN0b3JhZ2UudmFyU3RvcmFnZS5nZXRJdGVtKG5hbWUpKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IGdldENvbmYgPSAobmFtZSkgPT5cbiAgY29tcHV0ZVBhcmFtcygpLmdldCgnLS0nICsgbmFtZSkgfHwgZ2V0VmFyaWFibGUobmFtZSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCA1ICovXG5leHBvcnQgY29uc3QgZW5zdXJlQ29uZiA9IChuYW1lKSA9PiB7XG4gIGNvbnN0IGMgPSBnZXRDb25mKG5hbWUpXG4gIGlmIChjID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgY29uZmlndXJhdGlvbiBcIiR7bmFtZS50b1VwcGVyQ2FzZSgpLnJlcGxhY2VBbGwoJy0nLCAnXycpfVwiYClcbiAgcmV0dXJuIGNcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IGhhc0NvbmYgPSAobmFtZSkgPT5cbiAgaGFzUGFyYW0oJy0tJyArIG5hbWUpIHx8IGdldFZhcmlhYmxlKG5hbWUpICE9PSBudWxsXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgcHJvZHVjdGlvbiA9IGhhc0NvbmYoJ3Byb2R1Y3Rpb24nKVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAyICovXG5jb25zdCBmb3JjZUNvbG9yID0gaXNOb2RlICYmXG4gIGYuaXNPbmVPZihwcm9jZXNzLmVudi5GT1JDRV9DT0xPUiwgWyd0cnVlJywgJzEnLCAnMiddKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQ29sb3IgaXMgZW5hYmxlZCBieSBkZWZhdWx0IGlmIHRoZSB0ZXJtaW5hbCBzdXBwb3J0cyBpdC5cbiAqXG4gKiBFeHBsaWNpdGx5IGVuYWJsZSBjb2xvciB1c2luZyBgLS1jb2xvcmAgcGFyYW1ldGVyXG4gKiBEaXNhYmxlIGNvbG9yIHVzaW5nIGAtLW5vLWNvbG9yYCBwYXJhbWV0ZXIgb3IgdXNpbmcgYE5PX0NPTE9SPTFgIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICogYEZPUkNFX0NPTE9SPTFgIGVuYWJsZXMgY29sb3IgYW5kIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBhbGwuXG4gKi9cbmV4cG9ydCBjb25zdCBzdXBwb3J0c0NvbG9yID0gZm9yY2VDb2xvciB8fCAoXG4gICFoYXNQYXJhbSgnLS1uby1jb2xvcnMnKSAmJiAvLyBAdG9kbyBkZXByZWNhdGUgLS1uby1jb2xvcnNcbiAgIWhhc0NvbmYoJ25vLWNvbG9yJykgJiZcbiAgKCFpc05vZGUgfHwgcHJvY2Vzcy5zdGRvdXQuaXNUVFkpICYmIChcbiAgICAhaXNOb2RlIHx8XG4gICAgaGFzUGFyYW0oJy0tY29sb3InKSB8fFxuICAgIGdldFZhcmlhYmxlKCdDT0xPUlRFUk0nKSAhPT0gbnVsbCB8fFxuICAgIChnZXRWYXJpYWJsZSgnVEVSTScpIHx8ICcnKS5pbmNsdWRlcygnY29sb3InKVxuICApXG4pXG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuIiwgIi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgdG8gd29yayB3aXRoIGJ1ZmZlcnMgKFVpbnQ4QXJyYXkpLlxuICpcbiAqIEBtb2R1bGUgYnVmZmVyXG4gKi9cblxuaW1wb3J0ICogYXMgc3RyaW5nIGZyb20gJy4vc3RyaW5nLmpzJ1xuaW1wb3J0ICogYXMgZW52IGZyb20gJy4vZW52aXJvbm1lbnQuanMnXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICcuL2VuY29kaW5nLmpzJ1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnLi9kZWNvZGluZy5qcydcblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVVaW50OEFycmF5RnJvbUxlbiA9IGxlbiA9PiBuZXcgVWludDhBcnJheShsZW4pXG5cbi8qKlxuICogQ3JlYXRlIFVpbnQ4QXJyYXkgd2l0aCBpbml0aWFsIGNvbnRlbnQgZnJvbSBidWZmZXJcbiAqXG4gKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBidWZmZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlT2Zmc2V0XG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVVaW50OEFycmF5Vmlld0Zyb21BcnJheUJ1ZmZlciA9IChidWZmZXIsIGJ5dGVPZmZzZXQsIGxlbmd0aCkgPT4gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCBieXRlT2Zmc2V0LCBsZW5ndGgpXG5cbi8qKlxuICogQ3JlYXRlIFVpbnQ4QXJyYXkgd2l0aCBpbml0aWFsIGNvbnRlbnQgZnJvbSBidWZmZXJcbiAqXG4gKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBidWZmZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVVpbnQ4QXJyYXlGcm9tQXJyYXlCdWZmZXIgPSBidWZmZXIgPT4gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBieXRlc1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5jb25zdCB0b0Jhc2U2NEJyb3dzZXIgPSBieXRlcyA9PiB7XG4gIGxldCBzID0gJydcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBieXRlcy5ieXRlTGVuZ3RoOyBpKyspIHtcbiAgICBzICs9IHN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pXG4gIH1cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gIHJldHVybiBidG9hKHMpXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnl0ZXNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuY29uc3QgdG9CYXNlNjROb2RlID0gYnl0ZXMgPT4gQnVmZmVyLmZyb20oYnl0ZXMuYnVmZmVyLCBieXRlcy5ieXRlT2Zmc2V0LCBieXRlcy5ieXRlTGVuZ3RoKS50b1N0cmluZygnYmFzZTY0JylcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5jb25zdCBmcm9tQmFzZTY0QnJvd3NlciA9IHMgPT4ge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgY29uc3QgYSA9IGF0b2IocylcbiAgY29uc3QgYnl0ZXMgPSBjcmVhdGVVaW50OEFycmF5RnJvbUxlbihhLmxlbmd0aClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgYnl0ZXNbaV0gPSBhLmNoYXJDb2RlQXQoaSlcbiAgfVxuICByZXR1cm4gYnl0ZXNcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNcbiAqL1xuY29uc3QgZnJvbUJhc2U2NE5vZGUgPSBzID0+IHtcbiAgY29uc3QgYnVmID0gQnVmZmVyLmZyb20ocywgJ2Jhc2U2NCcpXG4gIHJldHVybiBjcmVhdGVVaW50OEFycmF5Vmlld0Zyb21BcnJheUJ1ZmZlcihidWYuYnVmZmVyLCBidWYuYnl0ZU9mZnNldCwgYnVmLmJ5dGVMZW5ndGgpXG59XG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgdG9CYXNlNjQgPSBlbnYuaXNCcm93c2VyID8gdG9CYXNlNjRCcm93c2VyIDogdG9CYXNlNjROb2RlXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgZnJvbUJhc2U2NCA9IGVudi5pc0Jyb3dzZXIgPyBmcm9tQmFzZTY0QnJvd3NlciA6IGZyb21CYXNlNjROb2RlXG5cbi8qKlxuICogSW1wbGVtZW50cyBiYXNlNjR1cmwgLSBzZWUgaHR0cHM6Ly9kYXRhdHJhY2tlci5pZXRmLm9yZy9kb2MvaHRtbC9yZmM0NjQ4I3NlY3Rpb24tNVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAqL1xuZXhwb3J0IGNvbnN0IHRvQmFzZTY0VXJsRW5jb2RlZCA9IGJ1ZiA9PiB0b0Jhc2U2NChidWYpLnJlcGxhY2VBbGwoJysnLCAnLScpLnJlcGxhY2VBbGwoJy8nLCAnXycpLnJlcGxhY2VBbGwoJz0nLCAnJylcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmFzZTY0XG4gKi9cbmV4cG9ydCBjb25zdCBmcm9tQmFzZTY0VXJsRW5jb2RlZCA9IGJhc2U2NCA9PiBmcm9tQmFzZTY0KGJhc2U2NC5yZXBsYWNlQWxsKCctJywgJysnKS5yZXBsYWNlQWxsKCdfJywgJy8nKSlcblxuLyoqXG4gKiBCYXNlNjQgaXMgYWx3YXlzIGEgbW9yZSBlZmZpY2llbnQgY2hvaWNlLiBUaGlzIGV4aXN0cyBmb3IgdXRpbGl0eSBwdXJwb3NlcyBvbmx5LlxuICpcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKi9cbmV4cG9ydCBjb25zdCB0b0hleFN0cmluZyA9IGJ1ZiA9PiBhcnJheS5tYXAoYnVmLCBiID0+IGIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykpLmpvaW4oJycpXG5cbi8qKlxuICogTm90ZTogVGhpcyBmdW5jdGlvbiBleHBlY3RzIHRoYXQgdGhlIGhleCBkb2Vzbid0IHN0YXJ0IHdpdGggMHguLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBoZXhcbiAqL1xuZXhwb3J0IGNvbnN0IGZyb21IZXhTdHJpbmcgPSBoZXggPT4ge1xuICBjb25zdCBobGVuID0gaGV4Lmxlbmd0aFxuICBjb25zdCBidWYgPSBuZXcgVWludDhBcnJheShtYXRoLmNlaWwoaGxlbiAvIDIpKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhsZW47IGkgKz0gMikge1xuICAgIGJ1ZltidWYubGVuZ3RoIC0gaSAvIDIgLSAxXSA9IE51bWJlci5wYXJzZUludChoZXguc2xpY2UoaGxlbiAtIGkgLSAyLCBobGVuIC0gaSksIDE2KVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBDb3B5IHRoZSBjb250ZW50IG9mIGFuIFVpbnQ4QXJyYXkgdmlldyB0byBhIG5ldyBBcnJheUJ1ZmZlci5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBjb3B5VWludDhBcnJheSA9IHVpbnQ4QXJyYXkgPT4ge1xuICBjb25zdCBuZXdCdWYgPSBjcmVhdGVVaW50OEFycmF5RnJvbUxlbih1aW50OEFycmF5LmJ5dGVMZW5ndGgpXG4gIG5ld0J1Zi5zZXQodWludDhBcnJheSlcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKipcbiAqIEVuY29kZSBhbnl0aGluZyBhcyBhIFVJbnQ4QXJyYXkuIEl0J3MgYSBwdW4gb24gdHlwZXNjcmlwdHMncyBgYW55YCB0eXBlLlxuICogU2VlIGVuY29kaW5nLndyaXRlQW55IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICpcbiAqIEBwYXJhbSB7YW55fSBkYXRhXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgZW5jb2RlQW55ID0gZGF0YSA9PlxuICBlbmNvZGluZy5lbmNvZGUoZW5jb2RlciA9PiBlbmNvZGluZy53cml0ZUFueShlbmNvZGVyLCBkYXRhKSlcblxuLyoqXG4gKiBEZWNvZGUgYW4gYW55LWVuY29kZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAqIEByZXR1cm4ge2FueX1cbiAqL1xuZXhwb3J0IGNvbnN0IGRlY29kZUFueSA9IGJ1ZiA9PiBkZWNvZGluZy5yZWFkQW55KGRlY29kaW5nLmNyZWF0ZURlY29kZXIoYnVmKSlcblxuLyoqXG4gKiBTaGlmdCBCeXRlIEFycmF5IHtOfSBiaXRzIHRvIHRoZSBsZWZ0LiBEb2VzIG5vdCBleHBhbmQgYnl0ZSBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJzXG4gKiBAcGFyYW0ge251bWJlcn0gTiBzaG91bGQgYmUgaW4gdGhlIHJhbmdlIG9mIFswLTddXG4gKi9cbmV4cG9ydCBjb25zdCBzaGlmdE5CaXRzTGVmdCA9IChicywgTikgPT4ge1xuICBpZiAoTiA9PT0gMCkgcmV0dXJuIGJzXG4gIGJzID0gbmV3IFVpbnQ4QXJyYXkoYnMpXG4gIGJzWzBdIDw8PSBOXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgYnMubGVuZ3RoOyBpKyspIHtcbiAgICBic1tpIC0gMV0gfD0gYnNbaV0gPj4+ICg4IC0gTilcbiAgICBic1tpXSA8PD0gTlxuICB9XG4gIHJldHVybiBic1xufVxuIiwgImltcG9ydCAqIGFzIGJ1ZmZlciBmcm9tICdsaWIwL2J1ZmZlcidcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQge1xuICBJRCwgY3JlYXRlSURcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5leHBvcnQgY2xhc3MgRFNEZWNvZGVyVjEge1xuICAvKipcbiAgICogQHBhcmFtIHtkZWNvZGluZy5EZWNvZGVyfSBkZWNvZGVyXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZGVjb2Rlcikge1xuICAgIHRoaXMucmVzdERlY29kZXIgPSBkZWNvZGVyXG4gIH1cblxuICByZXNldERzQ3VyVmFsICgpIHtcbiAgICAvLyBub3BcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICByZWFkRHNDbG9jayAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZERzTGVuICgpIHtcbiAgICByZXR1cm4gZGVjb2RpbmcucmVhZFZhclVpbnQodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVXBkYXRlRGVjb2RlclYxIGV4dGVuZHMgRFNEZWNvZGVyVjEge1xuICAvKipcbiAgICogQHJldHVybiB7SUR9XG4gICAqL1xuICByZWFkTGVmdElEICgpIHtcbiAgICByZXR1cm4gY3JlYXRlSUQoZGVjb2RpbmcucmVhZFZhclVpbnQodGhpcy5yZXN0RGVjb2RlciksIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0lEfVxuICAgKi9cbiAgcmVhZFJpZ2h0SUQgKCkge1xuICAgIHJldHVybiBjcmVhdGVJRChkZWNvZGluZy5yZWFkVmFyVWludCh0aGlzLnJlc3REZWNvZGVyKSwgZGVjb2RpbmcucmVhZFZhclVpbnQodGhpcy5yZXN0RGVjb2RlcikpXG4gIH1cblxuICAvKipcbiAgICogUmVhZCB0aGUgbmV4dCBjbGllbnQgaWQuXG4gICAqIFVzZSB0aGlzIGluIGZhdm9yIG9mIHJlYWRJRCB3aGVuZXZlciBwb3NzaWJsZSB0byByZWR1Y2UgdGhlIG51bWJlciBvZiBvYmplY3RzIGNyZWF0ZWQuXG4gICAqL1xuICByZWFkQ2xpZW50ICgpIHtcbiAgICByZXR1cm4gZGVjb2RpbmcucmVhZFZhclVpbnQodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IGluZm8gQW4gdW5zaWduZWQgOC1iaXQgaW50ZWdlclxuICAgKi9cbiAgcmVhZEluZm8gKCkge1xuICAgIHJldHVybiBkZWNvZGluZy5yZWFkVWludDgodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICByZWFkU3RyaW5nICgpIHtcbiAgICByZXR1cm4gZGVjb2RpbmcucmVhZFZhclN0cmluZyh0aGlzLnJlc3REZWNvZGVyKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IGlzS2V5XG4gICAqL1xuICByZWFkUGFyZW50SW5mbyAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpID09PSAxXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfSBpbmZvIEFuIHVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAgICovXG4gIHJlYWRUeXBlUmVmICgpIHtcbiAgICByZXR1cm4gZGVjb2RpbmcucmVhZFZhclVpbnQodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZSBsZW4gb2YgYSBzdHJ1Y3QgLSB3ZWxsIHN1aXRlZCBmb3IgT3B0IFJMRSBlbmNvZGVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IGxlblxuICAgKi9cbiAgcmVhZExlbiAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgcmVhZEFueSAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRBbnkodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICAgKi9cbiAgcmVhZEJ1ZiAoKSB7XG4gICAgcmV0dXJuIGJ1ZmZlci5jb3B5VWludDhBcnJheShkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheSh0aGlzLnJlc3REZWNvZGVyKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBMZWdhY3kgaW1wbGVtZW50YXRpb24gdXNlcyBKU09OIHBhcnNlLiBXZSB1c2UgYW55LWRlY29kaW5nIGluIHYyLlxuICAgKlxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICByZWFkSlNPTiAoKSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZGVjb2RpbmcucmVhZFZhclN0cmluZyh0aGlzLnJlc3REZWNvZGVyKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICByZWFkS2V5ICgpIHtcbiAgICByZXR1cm4gZGVjb2RpbmcucmVhZFZhclN0cmluZyh0aGlzLnJlc3REZWNvZGVyKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEU0RlY29kZXJWMiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge2RlY29kaW5nLkRlY29kZXJ9IGRlY29kZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yIChkZWNvZGVyKSB7XG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLmRzQ3VyclZhbCA9IDBcbiAgICB0aGlzLnJlc3REZWNvZGVyID0gZGVjb2RlclxuICB9XG5cbiAgcmVzZXREc0N1clZhbCAoKSB7XG4gICAgdGhpcy5kc0N1cnJWYWwgPSAwXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZERzQ2xvY2sgKCkge1xuICAgIHRoaXMuZHNDdXJyVmFsICs9IGRlY29kaW5nLnJlYWRWYXJVaW50KHRoaXMucmVzdERlY29kZXIpXG4gICAgcmV0dXJuIHRoaXMuZHNDdXJyVmFsXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZERzTGVuICgpIHtcbiAgICBjb25zdCBkaWZmID0gZGVjb2RpbmcucmVhZFZhclVpbnQodGhpcy5yZXN0RGVjb2RlcikgKyAxXG4gICAgdGhpcy5kc0N1cnJWYWwgKz0gZGlmZlxuICAgIHJldHVybiBkaWZmXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVwZGF0ZURlY29kZXJWMiBleHRlbmRzIERTRGVjb2RlclYyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlclxuICAgKi9cbiAgY29uc3RydWN0b3IgKGRlY29kZXIpIHtcbiAgICBzdXBlcihkZWNvZGVyKVxuICAgIC8qKlxuICAgICAqIExpc3Qgb2YgY2FjaGVkIGtleXMuIElmIHRoZSBrZXlzW2lkXSBkb2VzIG5vdCBleGlzdCwgd2UgcmVhZCBhIG5ldyBrZXlcbiAgICAgKiBmcm9tIHN0cmluZ0VuY29kZXIgYW5kIHB1c2ggaXQgdG8ga2V5cy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtBcnJheTxzdHJpbmc+fVxuICAgICAqL1xuICAgIHRoaXMua2V5cyA9IFtdXG4gICAgZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcikgLy8gcmVhZCBmZWF0dXJlIGZsYWcgLSBjdXJyZW50bHkgdW51c2VkXG4gICAgdGhpcy5rZXlDbG9ja0RlY29kZXIgPSBuZXcgZGVjb2RpbmcuSW50RGlmZk9wdFJsZURlY29kZXIoZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGVjb2RlcikpXG4gICAgdGhpcy5jbGllbnREZWNvZGVyID0gbmV3IGRlY29kaW5nLlVpbnRPcHRSbGVEZWNvZGVyKGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuICAgIHRoaXMubGVmdENsb2NrRGVjb2RlciA9IG5ldyBkZWNvZGluZy5JbnREaWZmT3B0UmxlRGVjb2RlcihkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcbiAgICB0aGlzLnJpZ2h0Q2xvY2tEZWNvZGVyID0gbmV3IGRlY29kaW5nLkludERpZmZPcHRSbGVEZWNvZGVyKGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuICAgIHRoaXMuaW5mb0RlY29kZXIgPSBuZXcgZGVjb2RpbmcuUmxlRGVjb2RlcihkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSwgZGVjb2RpbmcucmVhZFVpbnQ4KVxuICAgIHRoaXMuc3RyaW5nRGVjb2RlciA9IG5ldyBkZWNvZGluZy5TdHJpbmdEZWNvZGVyKGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuICAgIHRoaXMucGFyZW50SW5mb0RlY29kZXIgPSBuZXcgZGVjb2RpbmcuUmxlRGVjb2RlcihkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSwgZGVjb2RpbmcucmVhZFVpbnQ4KVxuICAgIHRoaXMudHlwZVJlZkRlY29kZXIgPSBuZXcgZGVjb2RpbmcuVWludE9wdFJsZURlY29kZXIoZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGVjb2RlcikpXG4gICAgdGhpcy5sZW5EZWNvZGVyID0gbmV3IGRlY29kaW5nLlVpbnRPcHRSbGVEZWNvZGVyKGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0lEfVxuICAgKi9cbiAgcmVhZExlZnRJRCAoKSB7XG4gICAgcmV0dXJuIG5ldyBJRCh0aGlzLmNsaWVudERlY29kZXIucmVhZCgpLCB0aGlzLmxlZnRDbG9ja0RlY29kZXIucmVhZCgpKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0lEfVxuICAgKi9cbiAgcmVhZFJpZ2h0SUQgKCkge1xuICAgIHJldHVybiBuZXcgSUQodGhpcy5jbGllbnREZWNvZGVyLnJlYWQoKSwgdGhpcy5yaWdodENsb2NrRGVjb2Rlci5yZWFkKCkpXG4gIH1cblxuICAvKipcbiAgICogUmVhZCB0aGUgbmV4dCBjbGllbnQgaWQuXG4gICAqIFVzZSB0aGlzIGluIGZhdm9yIG9mIHJlYWRJRCB3aGVuZXZlciBwb3NzaWJsZSB0byByZWR1Y2UgdGhlIG51bWJlciBvZiBvYmplY3RzIGNyZWF0ZWQuXG4gICAqL1xuICByZWFkQ2xpZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5jbGllbnREZWNvZGVyLnJlYWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn0gaW5mbyBBbiB1bnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gICAqL1xuICByZWFkSW5mbyAoKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAodGhpcy5pbmZvRGVjb2Rlci5yZWFkKCkpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgcmVhZFN0cmluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RyaW5nRGVjb2Rlci5yZWFkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgcmVhZFBhcmVudEluZm8gKCkge1xuICAgIHJldHVybiB0aGlzLnBhcmVudEluZm9EZWNvZGVyLnJlYWQoKSA9PT0gMVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgOC1iaXQgaW50ZWdlclxuICAgKi9cbiAgcmVhZFR5cGVSZWYgKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGVSZWZEZWNvZGVyLnJlYWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlIGxlbiBvZiBhIHN0cnVjdCAtIHdlbGwgc3VpdGVkIGZvciBPcHQgUkxFIGVuY29kZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIHJlYWRMZW4gKCkge1xuICAgIHJldHVybiB0aGlzLmxlbkRlY29kZXIucmVhZCgpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgcmVhZEFueSAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRBbnkodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICAgKi9cbiAgcmVhZEJ1ZiAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KHRoaXMucmVzdERlY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBpcyBtYWlubHkgaGVyZSBmb3IgbGVnYWN5IHB1cnBvc2VzLlxuICAgKlxuICAgKiBJbml0aWFsIHdlIGluY29kZWQgb2JqZWN0cyB1c2luZyBKU09OLiBOb3cgd2UgdXNlIHRoZSBtdWNoIGZhc3RlciBsaWIwL2FueS1lbmNvZGVyLiBUaGlzIG1ldGhvZCBtYWlubHkgZXhpc3RzIGZvciBsZWdhY3kgcHVycG9zZXMgZm9yIHRoZSB2MSBlbmNvZGVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICByZWFkSlNPTiAoKSB7XG4gICAgcmV0dXJuIGRlY29kaW5nLnJlYWRBbnkodGhpcy5yZXN0RGVjb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICByZWFkS2V5ICgpIHtcbiAgICBjb25zdCBrZXlDbG9jayA9IHRoaXMua2V5Q2xvY2tEZWNvZGVyLnJlYWQoKVxuICAgIGlmIChrZXlDbG9jayA8IHRoaXMua2V5cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLmtleXNba2V5Q2xvY2tdXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMuc3RyaW5nRGVjb2Rlci5yZWFkKClcbiAgICAgIHRoaXMua2V5cy5wdXNoKGtleSlcbiAgICAgIHJldHVybiBrZXlcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnbGliMC9lbmNvZGluZydcblxuaW1wb3J0IHtcbiAgSUQgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmV4cG9ydCBjbGFzcyBEU0VuY29kZXJWMSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLnJlc3RFbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gIH1cblxuICB0b1VpbnQ4QXJyYXkgKCkge1xuICAgIHJldHVybiBlbmNvZGluZy50b1VpbnQ4QXJyYXkodGhpcy5yZXN0RW5jb2RlcilcbiAgfVxuXG4gIHJlc2V0RHNDdXJWYWwgKCkge1xuICAgIC8vIG5vcFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjbG9ja1xuICAgKi9cbiAgd3JpdGVEc0Nsb2NrIChjbG9jaykge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBjbG9jaylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gICAqL1xuICB3cml0ZURzTGVuIChsZW4pIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgbGVuKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVcGRhdGVFbmNvZGVyVjEgZXh0ZW5kcyBEU0VuY29kZXJWMSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0lEfSBpZFxuICAgKi9cbiAgd3JpdGVMZWZ0SUQgKGlkKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGlkLmNsaWVudClcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgaWQuY2xvY2spXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtJRH0gaWRcbiAgICovXG4gIHdyaXRlUmlnaHRJRCAoaWQpIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgaWQuY2xpZW50KVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBpZC5jbG9jaylcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2Ugd3JpdGVDbGllbnQgYW5kIHdyaXRlQ2xvY2sgaW5zdGVhZCBvZiB3cml0ZUlEIGlmIHBvc3NpYmxlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gY2xpZW50XG4gICAqL1xuICB3cml0ZUNsaWVudCAoY2xpZW50KSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGNsaWVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5mbyBBbiB1bnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gICAqL1xuICB3cml0ZUluZm8gKGluZm8pIHtcbiAgICBlbmNvZGluZy53cml0ZVVpbnQ4KHRoaXMucmVzdEVuY29kZXIsIGluZm8pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNcbiAgICovXG4gIHdyaXRlU3RyaW5nIChzKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJTdHJpbmcodGhpcy5yZXN0RW5jb2RlciwgcylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzWUtleVxuICAgKi9cbiAgd3JpdGVQYXJlbnRJbmZvIChpc1lLZXkpIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQodGhpcy5yZXN0RW5jb2RlciwgaXNZS2V5ID8gMSA6IDApXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZm8gQW4gdW5zaWduZWQgOC1iaXQgaW50ZWdlclxuICAgKi9cbiAgd3JpdGVUeXBlUmVmIChpbmZvKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGluZm8pXG4gIH1cblxuICAvKipcbiAgICogV3JpdGUgbGVuIG9mIGEgc3RydWN0IC0gd2VsbCBzdWl0ZWQgZm9yIE9wdCBSTEUgZW5jb2Rlci5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICAgKi9cbiAgd3JpdGVMZW4gKGxlbikge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBsZW4pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IGFueVxuICAgKi9cbiAgd3JpdGVBbnkgKGFueSkge1xuICAgIGVuY29kaW5nLndyaXRlQW55KHRoaXMucmVzdEVuY29kZXIsIGFueSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICAgKi9cbiAgd3JpdGVCdWYgKGJ1Zikge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheSh0aGlzLnJlc3RFbmNvZGVyLCBidWYpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IGVtYmVkXG4gICAqL1xuICB3cml0ZUpTT04gKGVtYmVkKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJTdHJpbmcodGhpcy5yZXN0RW5jb2RlciwgSlNPTi5zdHJpbmdpZnkoZW1iZWQpKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICovXG4gIHdyaXRlS2V5IChrZXkpIHtcbiAgICBlbmNvZGluZy53cml0ZVZhclN0cmluZyh0aGlzLnJlc3RFbmNvZGVyLCBrZXkpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERTRW5jb2RlclYyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMucmVzdEVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKCkgLy8gZW5jb2RlcyBhbGwgdGhlIHJlc3QgLyBub24tb3B0aW1pemVkXG4gICAgdGhpcy5kc0N1cnJWYWwgPSAwXG4gIH1cblxuICB0b1VpbnQ4QXJyYXkgKCkge1xuICAgIHJldHVybiBlbmNvZGluZy50b1VpbnQ4QXJyYXkodGhpcy5yZXN0RW5jb2RlcilcbiAgfVxuXG4gIHJlc2V0RHNDdXJWYWwgKCkge1xuICAgIHRoaXMuZHNDdXJyVmFsID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjbG9ja1xuICAgKi9cbiAgd3JpdGVEc0Nsb2NrIChjbG9jaykge1xuICAgIGNvbnN0IGRpZmYgPSBjbG9jayAtIHRoaXMuZHNDdXJyVmFsXG4gICAgdGhpcy5kc0N1cnJWYWwgPSBjbG9ja1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludCh0aGlzLnJlc3RFbmNvZGVyLCBkaWZmKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAgICovXG4gIHdyaXRlRHNMZW4gKGxlbikge1xuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbiAgICB9XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHRoaXMucmVzdEVuY29kZXIsIGxlbiAtIDEpXG4gICAgdGhpcy5kc0N1cnJWYWwgKz0gbGVuXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVwZGF0ZUVuY29kZXJWMiBleHRlbmRzIERTRW5jb2RlclYyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7TWFwPHN0cmluZyxudW1iZXI+fVxuICAgICAqL1xuICAgIHRoaXMua2V5TWFwID0gbmV3IE1hcCgpXG4gICAgLyoqXG4gICAgICogUmVmZXJzIHRvIHRoZSBuZXh0IHVuaXFlIGtleS1pZGVudGlmaWVyIHRvIG1lIHVzZWQuXG4gICAgICogU2VlIHdyaXRlS2V5IG1ldGhvZCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5rZXlDbG9jayA9IDBcbiAgICB0aGlzLmtleUNsb2NrRW5jb2RlciA9IG5ldyBlbmNvZGluZy5JbnREaWZmT3B0UmxlRW5jb2RlcigpXG4gICAgdGhpcy5jbGllbnRFbmNvZGVyID0gbmV3IGVuY29kaW5nLlVpbnRPcHRSbGVFbmNvZGVyKClcbiAgICB0aGlzLmxlZnRDbG9ja0VuY29kZXIgPSBuZXcgZW5jb2RpbmcuSW50RGlmZk9wdFJsZUVuY29kZXIoKVxuICAgIHRoaXMucmlnaHRDbG9ja0VuY29kZXIgPSBuZXcgZW5jb2RpbmcuSW50RGlmZk9wdFJsZUVuY29kZXIoKVxuICAgIHRoaXMuaW5mb0VuY29kZXIgPSBuZXcgZW5jb2RpbmcuUmxlRW5jb2RlcihlbmNvZGluZy53cml0ZVVpbnQ4KVxuICAgIHRoaXMuc3RyaW5nRW5jb2RlciA9IG5ldyBlbmNvZGluZy5TdHJpbmdFbmNvZGVyKClcbiAgICB0aGlzLnBhcmVudEluZm9FbmNvZGVyID0gbmV3IGVuY29kaW5nLlJsZUVuY29kZXIoZW5jb2Rpbmcud3JpdGVVaW50OClcbiAgICB0aGlzLnR5cGVSZWZFbmNvZGVyID0gbmV3IGVuY29kaW5nLlVpbnRPcHRSbGVFbmNvZGVyKClcbiAgICB0aGlzLmxlbkVuY29kZXIgPSBuZXcgZW5jb2RpbmcuVWludE9wdFJsZUVuY29kZXIoKVxuICB9XG5cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIDApIC8vIHRoaXMgaXMgYSBmZWF0dXJlIGZsYWcgdGhhdCB3ZSBtaWdodCB1c2UgaW4gdGhlIGZ1dHVyZVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCB0aGlzLmtleUNsb2NrRW5jb2Rlci50b1VpbnQ4QXJyYXkoKSlcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5jbGllbnRFbmNvZGVyLnRvVWludDhBcnJheSgpKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCB0aGlzLmxlZnRDbG9ja0VuY29kZXIudG9VaW50OEFycmF5KCkpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHRoaXMucmlnaHRDbG9ja0VuY29kZXIudG9VaW50OEFycmF5KCkpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIGVuY29kaW5nLnRvVWludDhBcnJheSh0aGlzLmluZm9FbmNvZGVyKSlcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5zdHJpbmdFbmNvZGVyLnRvVWludDhBcnJheSgpKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkodGhpcy5wYXJlbnRJbmZvRW5jb2RlcikpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHRoaXMudHlwZVJlZkVuY29kZXIudG9VaW50OEFycmF5KCkpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHRoaXMubGVuRW5jb2Rlci50b1VpbnQ4QXJyYXkoKSlcbiAgICAvLyBAbm90ZSBUaGUgcmVzdCBlbmNvZGVyIGlzIGFwcGVuZGVkISAobm90ZSB0aGUgbWlzc2luZyB2YXIpXG4gICAgZW5jb2Rpbmcud3JpdGVVaW50OEFycmF5KGVuY29kZXIsIGVuY29kaW5nLnRvVWludDhBcnJheSh0aGlzLnJlc3RFbmNvZGVyKSlcbiAgICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtJRH0gaWRcbiAgICovXG4gIHdyaXRlTGVmdElEIChpZCkge1xuICAgIHRoaXMuY2xpZW50RW5jb2Rlci53cml0ZShpZC5jbGllbnQpXG4gICAgdGhpcy5sZWZ0Q2xvY2tFbmNvZGVyLndyaXRlKGlkLmNsb2NrKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SUR9IGlkXG4gICAqL1xuICB3cml0ZVJpZ2h0SUQgKGlkKSB7XG4gICAgdGhpcy5jbGllbnRFbmNvZGVyLndyaXRlKGlkLmNsaWVudClcbiAgICB0aGlzLnJpZ2h0Q2xvY2tFbmNvZGVyLndyaXRlKGlkLmNsb2NrKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjbGllbnRcbiAgICovXG4gIHdyaXRlQ2xpZW50IChjbGllbnQpIHtcbiAgICB0aGlzLmNsaWVudEVuY29kZXIud3JpdGUoY2xpZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmZvIEFuIHVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAgICovXG4gIHdyaXRlSW5mbyAoaW5mbykge1xuICAgIHRoaXMuaW5mb0VuY29kZXIud3JpdGUoaW5mbylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc1xuICAgKi9cbiAgd3JpdGVTdHJpbmcgKHMpIHtcbiAgICB0aGlzLnN0cmluZ0VuY29kZXIud3JpdGUocylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzWUtleVxuICAgKi9cbiAgd3JpdGVQYXJlbnRJbmZvIChpc1lLZXkpIHtcbiAgICB0aGlzLnBhcmVudEluZm9FbmNvZGVyLndyaXRlKGlzWUtleSA/IDEgOiAwKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmZvIEFuIHVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAgICovXG4gIHdyaXRlVHlwZVJlZiAoaW5mbykge1xuICAgIHRoaXMudHlwZVJlZkVuY29kZXIud3JpdGUoaW5mbylcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZSBsZW4gb2YgYSBzdHJ1Y3QgLSB3ZWxsIHN1aXRlZCBmb3IgT3B0IFJMRSBlbmNvZGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gICAqL1xuICB3cml0ZUxlbiAobGVuKSB7XG4gICAgdGhpcy5sZW5FbmNvZGVyLndyaXRlKGxlbilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gYW55XG4gICAqL1xuICB3cml0ZUFueSAoYW55KSB7XG4gICAgZW5jb2Rpbmcud3JpdGVBbnkodGhpcy5yZXN0RW5jb2RlciwgYW55KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gICAqL1xuICB3cml0ZUJ1ZiAoYnVmKSB7XG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KHRoaXMucmVzdEVuY29kZXIsIGJ1ZilcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGlzIG1haW5seSBoZXJlIGZvciBsZWdhY3kgcHVycG9zZXMuXG4gICAqXG4gICAqIEluaXRpYWwgd2UgaW5jb2RlZCBvYmplY3RzIHVzaW5nIEpTT04uIE5vdyB3ZSB1c2UgdGhlIG11Y2ggZmFzdGVyIGxpYjAvYW55LWVuY29kZXIuIFRoaXMgbWV0aG9kIG1haW5seSBleGlzdHMgZm9yIGxlZ2FjeSBwdXJwb3NlcyBmb3IgdGhlIHYxIGVuY29kZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBlbWJlZFxuICAgKi9cbiAgd3JpdGVKU09OIChlbWJlZCkge1xuICAgIGVuY29kaW5nLndyaXRlQW55KHRoaXMucmVzdEVuY29kZXIsIGVtYmVkKVxuICB9XG5cbiAgLyoqXG4gICAqIFByb3BlcnR5IGtleXMgYXJlIG9mdGVuIHJldXNlZC4gRm9yIGV4YW1wbGUsIGluIHktcHJvc2VtaXJyb3IgdGhlIGtleSBgYm9sZGAgbWlnaHRcbiAgICogb2NjdXIgdmVyeSBvZnRlbi4gRm9yIGEgM2QgYXBwbGljYXRpb24sIHRoZSBrZXkgYHBvc2l0aW9uYCBtaWdodCBvY2N1ciB2ZXJ5IG9mdGVuLlxuICAgKlxuICAgKiBXZSBjYWNoZSB0aGVzZSBrZXlzIGluIGEgTWFwIGFuZCByZWZlciB0byB0aGVtIHZpYSBhIHVuaXF1ZSBudW1iZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICovXG4gIHdyaXRlS2V5IChrZXkpIHtcbiAgICBjb25zdCBjbG9jayA9IHRoaXMua2V5TWFwLmdldChrZXkpXG4gICAgaWYgKGNsb2NrID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHRvZG8gdW5jb21tZW50IHRvIGludHJvZHVjZSB0aGlzIGZlYXR1cmUgZmluYWxseVxuICAgICAgICpcbiAgICAgICAqIEJhY2tncm91bmQuIFRoZSBDb250ZW50Rm9ybWF0IG9iamVjdCB3YXMgYWx3YXlzIGVuY29kZWQgdXNpbmcgd3JpdGVLZXksIGJ1dCB0aGUgZGVjb2RlciB1c2VkIHRvIHVzZSByZWFkU3RyaW5nLlxuICAgICAgICogRnVydGhlcm1vcmUsIEkgZm9yZ290IHRvIHNldCB0aGUga2V5Y2xvY2suIFNvIGV2ZXJ5dGhpbmcgd2FzIHdvcmtpbmcgZmluZS5cbiAgICAgICAqXG4gICAgICAgKiBIb3dldmVyLCB0aGlzIGZlYXR1cmUgaGVyZSBpcyBiYXNpY2FsbHkgdXNlbGVzcyBhcyBpdCBpcyBub3QgYmVpbmcgdXNlZCAoaXQgYWN0dWFsbHkgb25seSBjb25zdW1lcyBleHRyYSBtZW1vcnkpLlxuICAgICAgICpcbiAgICAgICAqIEkgZG9uJ3Qga25vdyB5ZXQgaG93IHRvIHJlaW50cm9kdWNlIHRoaXMgZmVhdHVyZS4uXG4gICAgICAgKlxuICAgICAgICogT2xkZXIgY2xpZW50cyB3b24ndCBiZSBhYmxlIHRvIHJlYWQgdXBkYXRlcyB3aGVuIHdlIHJlaW50cm9kdWNlIHRoaXMgZmVhdHVyZS4gU28gdGhpcyBzaG91bGQgcHJvYmFibHkgYmUgZG9uZSB1c2luZyBhIGZsYWcuXG4gICAgICAgKlxuICAgICAgICovXG4gICAgICAvLyB0aGlzLmtleU1hcC5zZXQoa2V5LCB0aGlzLmtleUNsb2NrKVxuICAgICAgdGhpcy5rZXlDbG9ja0VuY29kZXIud3JpdGUodGhpcy5rZXlDbG9jaysrKVxuICAgICAgdGhpcy5zdHJpbmdFbmNvZGVyLndyaXRlKGtleSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXlDbG9ja0VuY29kZXIud3JpdGUoY2xvY2spXG4gICAgfVxuICB9XG59XG4iLCAiLyoqXG4gKiBAbW9kdWxlIGVuY29kaW5nXG4gKi9cbi8qXG4gKiBXZSB1c2UgdGhlIGZpcnN0IGZpdmUgYml0cyBpbiB0aGUgaW5mbyBmbGFnIGZvciBkZXRlcm1pbmluZyB0aGUgdHlwZSBvZiB0aGUgc3RydWN0LlxuICpcbiAqIDA6IEdDXG4gKiAxOiBJdGVtIHdpdGggRGVsZXRlZCBjb250ZW50XG4gKiAyOiBJdGVtIHdpdGggSlNPTiBjb250ZW50XG4gKiAzOiBJdGVtIHdpdGggQmluYXJ5IGNvbnRlbnRcbiAqIDQ6IEl0ZW0gd2l0aCBTdHJpbmcgY29udGVudFxuICogNTogSXRlbSB3aXRoIEVtYmVkIGNvbnRlbnQgKGZvciByaWNodGV4dCBjb250ZW50KVxuICogNjogSXRlbSB3aXRoIEZvcm1hdCBjb250ZW50IChhIGZvcm1hdHRpbmcgbWFya2VyIGZvciByaWNodGV4dCBjb250ZW50KVxuICogNzogSXRlbSB3aXRoIFR5cGVcbiAqL1xuXG5pbXBvcnQge1xuICBmaW5kSW5kZXhTUyxcbiAgZ2V0U3RhdGUsXG4gIGNyZWF0ZUlELFxuICBnZXRTdGF0ZVZlY3RvcixcbiAgcmVhZEFuZEFwcGx5RGVsZXRlU2V0LFxuICB3cml0ZURlbGV0ZVNldCxcbiAgY3JlYXRlRGVsZXRlU2V0RnJvbVN0cnVjdFN0b3JlLFxuICB0cmFuc2FjdCxcbiAgcmVhZEl0ZW1Db250ZW50LFxuICBVcGRhdGVEZWNvZGVyVjEsXG4gIFVwZGF0ZURlY29kZXJWMixcbiAgVXBkYXRlRW5jb2RlclYxLFxuICBVcGRhdGVFbmNvZGVyVjIsXG4gIERTRW5jb2RlclYyLFxuICBEU0RlY29kZXJWMSxcbiAgRFNFbmNvZGVyVjEsXG4gIG1lcmdlVXBkYXRlcyxcbiAgbWVyZ2VVcGRhdGVzVjIsXG4gIFNraXAsXG4gIGRpZmZVcGRhdGVWMixcbiAgY29udmVydFVwZGF0ZUZvcm1hdFYyVG9WMSxcbiAgRFNEZWNvZGVyVjIsIERvYywgVHJhbnNhY3Rpb24sIEdDLCBJdGVtLCBTdHJ1Y3RTdG9yZSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnbGliMC9lbmNvZGluZydcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQgKiBhcyBiaW5hcnkgZnJvbSAnbGliMC9iaW5hcnknXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJ2xpYjAvbWF0aCdcbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJ2xpYjAvYXJyYXknXG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7QXJyYXk8R0N8SXRlbT59IHN0cnVjdHMgQWxsIHN0cnVjdHMgYnkgYGNsaWVudGBcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbGllbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbG9jayB3cml0ZSBzdHJ1Y3RzIHN0YXJ0aW5nIHdpdGggYElEKGNsaWVudCxjbG9jaylgXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IHdyaXRlU3RydWN0cyA9IChlbmNvZGVyLCBzdHJ1Y3RzLCBjbGllbnQsIGNsb2NrKSA9PiB7XG4gIC8vIHdyaXRlIGZpcnN0IGlkXG4gIGNsb2NrID0gbWF0aC5tYXgoY2xvY2ssIHN0cnVjdHNbMF0uaWQuY2xvY2spIC8vIG1ha2Ugc3VyZSB0aGUgZmlyc3QgaWQgZXhpc3RzXG4gIGNvbnN0IHN0YXJ0TmV3U3RydWN0cyA9IGZpbmRJbmRleFNTKHN0cnVjdHMsIGNsb2NrKVxuICAvLyB3cml0ZSAjIGVuY29kZWQgc3RydWN0c1xuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2Rlciwgc3RydWN0cy5sZW5ndGggLSBzdGFydE5ld1N0cnVjdHMpXG4gIGVuY29kZXIud3JpdGVDbGllbnQoY2xpZW50KVxuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgY2xvY2spXG4gIGNvbnN0IGZpcnN0U3RydWN0ID0gc3RydWN0c1tzdGFydE5ld1N0cnVjdHNdXG4gIC8vIHdyaXRlIGZpcnN0IHN0cnVjdCB3aXRoIGFuIG9mZnNldFxuICBmaXJzdFN0cnVjdC53cml0ZShlbmNvZGVyLCBjbG9jayAtIGZpcnN0U3RydWN0LmlkLmNsb2NrKVxuICBmb3IgKGxldCBpID0gc3RhcnROZXdTdHJ1Y3RzICsgMTsgaSA8IHN0cnVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICBzdHJ1Y3RzW2ldLndyaXRlKGVuY29kZXIsIDApXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqIEBwYXJhbSB7TWFwPG51bWJlcixudW1iZXI+fSBfc21cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUNsaWVudHNTdHJ1Y3RzID0gKGVuY29kZXIsIHN0b3JlLCBfc20pID0+IHtcbiAgLy8gd2UgZmlsdGVyIGFsbCB2YWxpZCBfc20gZW50cmllcyBpbnRvIHNtXG4gIGNvbnN0IHNtID0gbmV3IE1hcCgpXG4gIF9zbS5mb3JFYWNoKChjbG9jaywgY2xpZW50KSA9PiB7XG4gICAgLy8gb25seSB3cml0ZSBpZiBuZXcgc3RydWN0cyBhcmUgYXZhaWxhYmxlXG4gICAgaWYgKGdldFN0YXRlKHN0b3JlLCBjbGllbnQpID4gY2xvY2spIHtcbiAgICAgIHNtLnNldChjbGllbnQsIGNsb2NrKVxuICAgIH1cbiAgfSlcbiAgZ2V0U3RhdGVWZWN0b3Ioc3RvcmUpLmZvckVhY2goKF9jbG9jaywgY2xpZW50KSA9PiB7XG4gICAgaWYgKCFfc20uaGFzKGNsaWVudCkpIHtcbiAgICAgIHNtLnNldChjbGllbnQsIDApXG4gICAgfVxuICB9KVxuICAvLyB3cml0ZSAjIHN0YXRlcyB0aGF0IHdlcmUgdXBkYXRlZFxuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2Rlciwgc20uc2l6ZSlcbiAgLy8gV3JpdGUgaXRlbXMgd2l0aCBoaWdoZXIgY2xpZW50IGlkcyBmaXJzdFxuICAvLyBUaGlzIGhlYXZpbHkgaW1wcm92ZXMgdGhlIGNvbmZsaWN0IGFsZ29yaXRobS5cbiAgYXJyYXkuZnJvbShzbS5lbnRyaWVzKCkpLnNvcnQoKGEsIGIpID0+IGJbMF0gLSBhWzBdKS5mb3JFYWNoKChbY2xpZW50LCBjbG9ja10pID0+IHtcbiAgICB3cml0ZVN0cnVjdHMoZW5jb2RlciwgLyoqIEB0eXBlIHtBcnJheTxHQ3xJdGVtPn0gKi8gKHN0b3JlLmNsaWVudHMuZ2V0KGNsaWVudCkpLCBjbGllbnQsIGNsb2NrKVxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyIFRoZSBkZWNvZGVyIG9iamVjdCB0byByZWFkIGRhdGEgZnJvbS5cbiAqIEBwYXJhbSB7RG9jfSBkb2NcbiAqIEByZXR1cm4ge01hcDxudW1iZXIsIHsgaTogbnVtYmVyLCByZWZzOiBBcnJheTxJdGVtIHwgR0M+IH0+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDbGllbnRzU3RydWN0UmVmcyA9IChkZWNvZGVyLCBkb2MpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtNYXA8bnVtYmVyLCB7IGk6IG51bWJlciwgcmVmczogQXJyYXk8SXRlbSB8IEdDPiB9Pn1cbiAgICovXG4gIGNvbnN0IGNsaWVudFJlZnMgPSBtYXAuY3JlYXRlKClcbiAgY29uc3QgbnVtT2ZTdGF0ZVVwZGF0ZXMgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bU9mU3RhdGVVcGRhdGVzOyBpKyspIHtcbiAgICBjb25zdCBudW1iZXJPZlN0cnVjdHMgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxHQ3xJdGVtPn1cbiAgICAgKi9cbiAgICBjb25zdCByZWZzID0gbmV3IEFycmF5KG51bWJlck9mU3RydWN0cylcbiAgICBjb25zdCBjbGllbnQgPSBkZWNvZGVyLnJlYWRDbGllbnQoKVxuICAgIGxldCBjbG9jayA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgLy8gY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGNsaWVudFJlZnMuc2V0KGNsaWVudCwgeyBpOiAwLCByZWZzIH0pXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZlN0cnVjdHM7IGkrKykge1xuICAgICAgY29uc3QgaW5mbyA9IGRlY29kZXIucmVhZEluZm8oKVxuICAgICAgc3dpdGNoIChiaW5hcnkuQklUUzUgJiBpbmZvKSB7XG4gICAgICAgIGNhc2UgMDogeyAvLyBHQ1xuICAgICAgICAgIGNvbnN0IGxlbiA9IGRlY29kZXIucmVhZExlbigpXG4gICAgICAgICAgcmVmc1tpXSA9IG5ldyBHQyhjcmVhdGVJRChjbGllbnQsIGNsb2NrKSwgbGVuKVxuICAgICAgICAgIGNsb2NrICs9IGxlblxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAxMDogeyAvLyBTa2lwIFN0cnVjdCAobm90aGluZyB0byBhcHBseSlcbiAgICAgICAgICAvLyBAdG9kbyB3ZSBjb3VsZCByZWR1Y2UgdGhlIGFtb3VudCBvZiBjaGVja3MgYnkgYWRkaW5nIFNraXAgc3RydWN0IHRvIGNsaWVudFJlZnMgc28gd2Uga25vdyB0aGF0IHNvbWV0aGluZyBpcyBtaXNzaW5nLlxuICAgICAgICAgIGNvbnN0IGxlbiA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgICAgICAgcmVmc1tpXSA9IG5ldyBTa2lwKGNyZWF0ZUlEKGNsaWVudCwgY2xvY2spLCBsZW4pXG4gICAgICAgICAgY2xvY2sgKz0gbGVuXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiB7IC8vIEl0ZW0gd2l0aCBjb250ZW50XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogVGhlIG9wdGltaXplZCBpbXBsZW1lbnRhdGlvbiBkb2Vzbid0IHVzZSBhbnkgdmFyaWFibGVzIGJlY2F1c2UgaW5saW5pbmcgdmFyaWFibGVzIGlzIGZhc3Rlci5cbiAgICAgICAgICAgKiBCZWxvdyBhIG5vbi1vcHRpbWl6ZWQgdmVyc2lvbiBpcyBzaG93biB0aGF0IGltcGxlbWVudHMgdGhlIGJhc2ljIGFsZ29yaXRobSB3aXRoXG4gICAgICAgICAgICogYSBmZXcgY29tbWVudHNcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBjb25zdCBjYW50Q29weVBhcmVudEluZm8gPSAoaW5mbyAmIChiaW5hcnkuQklUNyB8IGJpbmFyeS5CSVQ4KSkgPT09IDBcbiAgICAgICAgICAvLyBJZiBwYXJlbnQgPSBudWxsIGFuZCBuZWl0aGVyIGxlZnQgbm9yIHJpZ2h0IGFyZSBkZWZpbmVkLCB0aGVuIHdlIGtub3cgdGhhdCBgcGFyZW50YCBpcyBjaGlsZCBvZiBgeWBcbiAgICAgICAgICAvLyBhbmQgd2UgcmVhZCB0aGUgbmV4dCBzdHJpbmcgYXMgcGFyZW50WUtleS5cbiAgICAgICAgICAvLyBJdCBpbmRpY2F0ZXMgaG93IHdlIHN0b3JlL3JldHJpZXZlIHBhcmVudCBmcm9tIGB5LnNoYXJlYFxuICAgICAgICAgIC8vIEB0eXBlIHtzdHJpbmd8bnVsbH1cbiAgICAgICAgICBjb25zdCBzdHJ1Y3QgPSBuZXcgSXRlbShcbiAgICAgICAgICAgIGNyZWF0ZUlEKGNsaWVudCwgY2xvY2spLFxuICAgICAgICAgICAgbnVsbCwgLy8gbGVmdFxuICAgICAgICAgICAgKGluZm8gJiBiaW5hcnkuQklUOCkgPT09IGJpbmFyeS5CSVQ4ID8gZGVjb2Rlci5yZWFkTGVmdElEKCkgOiBudWxsLCAvLyBvcmlnaW5cbiAgICAgICAgICAgIG51bGwsIC8vIHJpZ2h0XG4gICAgICAgICAgICAoaW5mbyAmIGJpbmFyeS5CSVQ3KSA9PT0gYmluYXJ5LkJJVDcgPyBkZWNvZGVyLnJlYWRSaWdodElEKCkgOiBudWxsLCAvLyByaWdodCBvcmlnaW5cbiAgICAgICAgICAgIGNhbnRDb3B5UGFyZW50SW5mbyA/IChkZWNvZGVyLnJlYWRQYXJlbnRJbmZvKCkgPyBkb2MuZ2V0KGRlY29kZXIucmVhZFN0cmluZygpKSA6IGRlY29kZXIucmVhZExlZnRJRCgpKSA6IG51bGwsIC8vIHBhcmVudFxuICAgICAgICAgICAgY2FudENvcHlQYXJlbnRJbmZvICYmIChpbmZvICYgYmluYXJ5LkJJVDYpID09PSBiaW5hcnkuQklUNiA/IGRlY29kZXIucmVhZFN0cmluZygpIDogbnVsbCwgLy8gcGFyZW50U3ViXG4gICAgICAgICAgICByZWFkSXRlbUNvbnRlbnQoZGVjb2RlciwgaW5mbykgLy8gaXRlbSBjb250ZW50XG4gICAgICAgICAgKVxuICAgICAgICAgIC8qIEEgbm9uLW9wdGltaXplZCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYWJvdmUgYWxnb3JpdGhtOlxuXG4gICAgICAgICAgLy8gVGhlIGl0ZW0gdGhhdCB3YXMgb3JpZ2luYWxseSB0byB0aGUgbGVmdCBvZiB0aGlzIGl0ZW0uXG4gICAgICAgICAgY29uc3Qgb3JpZ2luID0gKGluZm8gJiBiaW5hcnkuQklUOCkgPT09IGJpbmFyeS5CSVQ4ID8gZGVjb2Rlci5yZWFkTGVmdElEKCkgOiBudWxsXG4gICAgICAgICAgLy8gVGhlIGl0ZW0gdGhhdCB3YXMgb3JpZ2luYWxseSB0byB0aGUgcmlnaHQgb2YgdGhpcyBpdGVtLlxuICAgICAgICAgIGNvbnN0IHJpZ2h0T3JpZ2luID0gKGluZm8gJiBiaW5hcnkuQklUNykgPT09IGJpbmFyeS5CSVQ3ID8gZGVjb2Rlci5yZWFkUmlnaHRJRCgpIDogbnVsbFxuICAgICAgICAgIGNvbnN0IGNhbnRDb3B5UGFyZW50SW5mbyA9IChpbmZvICYgKGJpbmFyeS5CSVQ3IHwgYmluYXJ5LkJJVDgpKSA9PT0gMFxuICAgICAgICAgIGNvbnN0IGhhc1BhcmVudFlLZXkgPSBjYW50Q29weVBhcmVudEluZm8gPyBkZWNvZGVyLnJlYWRQYXJlbnRJbmZvKCkgOiBmYWxzZVxuICAgICAgICAgIC8vIElmIHBhcmVudCA9IG51bGwgYW5kIG5laXRoZXIgbGVmdCBub3IgcmlnaHQgYXJlIGRlZmluZWQsIHRoZW4gd2Uga25vdyB0aGF0IGBwYXJlbnRgIGlzIGNoaWxkIG9mIGB5YFxuICAgICAgICAgIC8vIGFuZCB3ZSByZWFkIHRoZSBuZXh0IHN0cmluZyBhcyBwYXJlbnRZS2V5LlxuICAgICAgICAgIC8vIEl0IGluZGljYXRlcyBob3cgd2Ugc3RvcmUvcmV0cmlldmUgcGFyZW50IGZyb20gYHkuc2hhcmVgXG4gICAgICAgICAgLy8gQHR5cGUge3N0cmluZ3xudWxsfVxuICAgICAgICAgIGNvbnN0IHBhcmVudFlLZXkgPSBjYW50Q29weVBhcmVudEluZm8gJiYgaGFzUGFyZW50WUtleSA/IGRlY29kZXIucmVhZFN0cmluZygpIDogbnVsbFxuXG4gICAgICAgICAgY29uc3Qgc3RydWN0ID0gbmV3IEl0ZW0oXG4gICAgICAgICAgICBjcmVhdGVJRChjbGllbnQsIGNsb2NrKSxcbiAgICAgICAgICAgIG51bGwsIC8vIGxlZnRcbiAgICAgICAgICAgIG9yaWdpbiwgLy8gb3JpZ2luXG4gICAgICAgICAgICBudWxsLCAvLyByaWdodFxuICAgICAgICAgICAgcmlnaHRPcmlnaW4sIC8vIHJpZ2h0IG9yaWdpblxuICAgICAgICAgICAgY2FudENvcHlQYXJlbnRJbmZvICYmICFoYXNQYXJlbnRZS2V5ID8gZGVjb2Rlci5yZWFkTGVmdElEKCkgOiAocGFyZW50WUtleSAhPT0gbnVsbCA/IGRvYy5nZXQocGFyZW50WUtleSkgOiBudWxsKSwgLy8gcGFyZW50XG4gICAgICAgICAgICBjYW50Q29weVBhcmVudEluZm8gJiYgKGluZm8gJiBiaW5hcnkuQklUNikgPT09IGJpbmFyeS5CSVQ2ID8gZGVjb2Rlci5yZWFkU3RyaW5nKCkgOiBudWxsLCAvLyBwYXJlbnRTdWJcbiAgICAgICAgICAgIHJlYWRJdGVtQ29udGVudChkZWNvZGVyLCBpbmZvKSAvLyBpdGVtIGNvbnRlbnRcbiAgICAgICAgICApXG4gICAgICAgICAgKi9cbiAgICAgICAgICByZWZzW2ldID0gc3RydWN0XG4gICAgICAgICAgY2xvY2sgKz0gc3RydWN0Lmxlbmd0aFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKCd0aW1lIHRvIHJlYWQ6ICcsIHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpIC8vIEB0b2RvIHJlbW92ZVxuICB9XG4gIHJldHVybiBjbGllbnRSZWZzXG59XG5cbi8qKlxuICogUmVzdW1lIGNvbXB1dGluZyBzdHJ1Y3RzIGdlbmVyYXRlZCBieSBzdHJ1Y3QgcmVhZGVycy5cbiAqXG4gKiBXaGlsZSB0aGVyZSBpcyBzb21ldGhpbmcgdG8gZG8sIHdlIGludGVncmF0ZSBzdHJ1Y3RzIGluIHRoaXMgb3JkZXJcbiAqIDEuIHRvcCBlbGVtZW50IG9uIHN0YWNrLCBpZiBzdGFjayBpcyBub3QgZW1wdHlcbiAqIDIuIG5leHQgZWxlbWVudCBmcm9tIGN1cnJlbnQgc3RydWN0IHJlYWRlciAoaWYgZW1wdHksIHVzZSBuZXh0IHN0cnVjdCByZWFkZXIpXG4gKlxuICogSWYgc3RydWN0IGNhdXNhbGx5IGRlcGVuZHMgb24gYW5vdGhlciBzdHJ1Y3QgKHJlZi5taXNzaW5nKSwgd2UgcHV0IG5leHQgcmVhZGVyIG9mXG4gKiBgcmVmLmlkLmNsaWVudGAgb24gdG9wIG9mIHN0YWNrLlxuICpcbiAqIEF0IHNvbWUgcG9pbnQgd2UgZmluZCBhIHN0cnVjdCB0aGF0IGhhcyBubyBjYXVzYWwgZGVwZW5kZW5jaWVzLFxuICogdGhlbiB3ZSBzdGFydCBlbXB0eWluZyB0aGUgc3RhY2suXG4gKlxuICogSXQgaXMgbm90IHBvc3NpYmxlIHRvIGhhdmUgY2lyY2xlczogaS5lLiBzdHJ1Y3QxIChmcm9tIGNsaWVudDEpIGRlcGVuZHMgb24gc3RydWN0MiAoZnJvbSBjbGllbnQyKVxuICogZGVwZW5kcyBvbiBzdHJ1Y3QzIChmcm9tIGNsaWVudDEpLiBUaGVyZWZvcmUgdGhlIG1heCBzdGFjayBzaXplIGlzIGVxYXVsIHRvIGBzdHJ1Y3RSZWFkZXJzLmxlbmd0aGAuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgaW1wbGVtZW50ZWQgaW4gYSB3YXkgc28gdGhhdCB3ZSBjYW4gcmVzdW1lIGNvbXB1dGF0aW9uIGlmIHRoaXMgdXBkYXRlXG4gKiBjYXVzYWxseSBkZXBlbmRzIG9uIGFub3RoZXIgdXBkYXRlLlxuICpcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICogQHBhcmFtIHtNYXA8bnVtYmVyLCB7IGk6IG51bWJlciwgcmVmczogKEdDIHwgSXRlbSlbXSB9Pn0gY2xpZW50c1N0cnVjdFJlZnNcbiAqIEByZXR1cm4geyBudWxsIHwgeyB1cGRhdGU6IFVpbnQ4QXJyYXksIG1pc3Npbmc6IE1hcDxudW1iZXIsbnVtYmVyPiB9IH1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IGludGVncmF0ZVN0cnVjdHMgPSAodHJhbnNhY3Rpb24sIHN0b3JlLCBjbGllbnRzU3RydWN0UmVmcykgPT4ge1xuICAvKipcbiAgICogQHR5cGUge0FycmF5PEl0ZW0gfCBHQz59XG4gICAqL1xuICBjb25zdCBzdGFjayA9IFtdXG4gIC8vIHNvcnQgdGhlbSBzbyB0aGF0IHdlIHRha2UgdGhlIGhpZ2hlciBpZCBmaXJzdCwgaW4gY2FzZSBvZiBjb25mbGljdHMgdGhlIGxvd2VyIGlkIHdpbGwgcHJvYmFibHkgbm90IGNvbmZsaWN0IHdpdGggdGhlIGlkIGZyb20gdGhlIGhpZ2hlciB1c2VyLlxuICBsZXQgY2xpZW50c1N0cnVjdFJlZnNJZHMgPSBhcnJheS5mcm9tKGNsaWVudHNTdHJ1Y3RSZWZzLmtleXMoKSkuc29ydCgoYSwgYikgPT4gYSAtIGIpXG4gIGlmIChjbGllbnRzU3RydWN0UmVmc0lkcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGNvbnN0IGdldE5leHRTdHJ1Y3RUYXJnZXQgPSAoKSA9PiB7XG4gICAgaWYgKGNsaWVudHNTdHJ1Y3RSZWZzSWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgbGV0IG5leHRTdHJ1Y3RzVGFyZ2V0ID0gLyoqIEB0eXBlIHt7aTpudW1iZXIscmVmczpBcnJheTxHQ3xJdGVtPn19ICovIChjbGllbnRzU3RydWN0UmVmcy5nZXQoY2xpZW50c1N0cnVjdFJlZnNJZHNbY2xpZW50c1N0cnVjdFJlZnNJZHMubGVuZ3RoIC0gMV0pKVxuICAgIHdoaWxlIChuZXh0U3RydWN0c1RhcmdldC5yZWZzLmxlbmd0aCA9PT0gbmV4dFN0cnVjdHNUYXJnZXQuaSkge1xuICAgICAgY2xpZW50c1N0cnVjdFJlZnNJZHMucG9wKClcbiAgICAgIGlmIChjbGllbnRzU3RydWN0UmVmc0lkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIG5leHRTdHJ1Y3RzVGFyZ2V0ID0gLyoqIEB0eXBlIHt7aTpudW1iZXIscmVmczpBcnJheTxHQ3xJdGVtPn19ICovIChjbGllbnRzU3RydWN0UmVmcy5nZXQoY2xpZW50c1N0cnVjdFJlZnNJZHNbY2xpZW50c1N0cnVjdFJlZnNJZHMubGVuZ3RoIC0gMV0pKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5leHRTdHJ1Y3RzVGFyZ2V0XG4gIH1cbiAgbGV0IGN1clN0cnVjdHNUYXJnZXQgPSBnZXROZXh0U3RydWN0VGFyZ2V0KClcbiAgaWYgKGN1clN0cnVjdHNUYXJnZXQgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtTdHJ1Y3RTdG9yZX1cbiAgICovXG4gIGNvbnN0IHJlc3RTdHJ1Y3RzID0gbmV3IFN0cnVjdFN0b3JlKClcbiAgY29uc3QgbWlzc2luZ1NWID0gbmV3IE1hcCgpXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gY2xpZW50XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjbG9ja1xuICAgKi9cbiAgY29uc3QgdXBkYXRlTWlzc2luZ1N2ID0gKGNsaWVudCwgY2xvY2spID0+IHtcbiAgICBjb25zdCBtY2xvY2sgPSBtaXNzaW5nU1YuZ2V0KGNsaWVudClcbiAgICBpZiAobWNsb2NrID09IG51bGwgfHwgbWNsb2NrID4gY2xvY2spIHtcbiAgICAgIG1pc3NpbmdTVi5zZXQoY2xpZW50LCBjbG9jaylcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEB0eXBlIHtHQ3xJdGVtfVxuICAgKi9cbiAgbGV0IHN0YWNrSGVhZCA9IC8qKiBAdHlwZSB7YW55fSAqLyAoY3VyU3RydWN0c1RhcmdldCkucmVmc1svKiogQHR5cGUge2FueX0gKi8gKGN1clN0cnVjdHNUYXJnZXQpLmkrK11cbiAgLy8gY2FjaGluZyB0aGUgc3RhdGUgYmVjYXVzZSBpdCBpcyB1c2VkIHZlcnkgb2Z0ZW5cbiAgY29uc3Qgc3RhdGUgPSBuZXcgTWFwKClcblxuICBjb25zdCBhZGRTdGFja1RvUmVzdFNTID0gKCkgPT4ge1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzdGFjaykge1xuICAgICAgY29uc3QgY2xpZW50ID0gaXRlbS5pZC5jbGllbnRcbiAgICAgIGNvbnN0IHVuYXBwbGljYWJsZUl0ZW1zID0gY2xpZW50c1N0cnVjdFJlZnMuZ2V0KGNsaWVudClcbiAgICAgIGlmICh1bmFwcGxpY2FibGVJdGVtcykge1xuICAgICAgICAvLyBkZWNyZW1lbnQgYmVjYXVzZSB3ZSB3ZXJlbid0IGFibGUgdG8gYXBwbHkgcHJldmlvdXMgb3BlcmF0aW9uXG4gICAgICAgIHVuYXBwbGljYWJsZUl0ZW1zLmktLVxuICAgICAgICByZXN0U3RydWN0cy5jbGllbnRzLnNldChjbGllbnQsIHVuYXBwbGljYWJsZUl0ZW1zLnJlZnMuc2xpY2UodW5hcHBsaWNhYmxlSXRlbXMuaSkpXG4gICAgICAgIGNsaWVudHNTdHJ1Y3RSZWZzLmRlbGV0ZShjbGllbnQpXG4gICAgICAgIHVuYXBwbGljYWJsZUl0ZW1zLmkgPSAwXG4gICAgICAgIHVuYXBwbGljYWJsZUl0ZW1zLnJlZnMgPSBbXVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaXRlbSB3YXMgdGhlIGxhc3QgaXRlbSBvbiBjbGllbnRzU3RydWN0UmVmcyBhbmQgdGhlIGZpZWxkIHdhcyBhbHJlYWR5IGNsZWFyZWQuIEFkZCBpdGVtIHRvIHJlc3RTdHJ1Y3RzIGFuZCBjb250aW51ZVxuICAgICAgICByZXN0U3RydWN0cy5jbGllbnRzLnNldChjbGllbnQsIFtpdGVtXSlcbiAgICAgIH1cbiAgICAgIC8vIHJlbW92ZSBjbGllbnQgZnJvbSBjbGllbnRzU3RydWN0UmVmc0lkcyB0byBwcmV2ZW50IHVzZXJzIGZyb20gYXBwbHlpbmcgdGhlIHNhbWUgdXBkYXRlIGFnYWluXG4gICAgICBjbGllbnRzU3RydWN0UmVmc0lkcyA9IGNsaWVudHNTdHJ1Y3RSZWZzSWRzLmZpbHRlcihjID0+IGMgIT09IGNsaWVudClcbiAgICB9XG4gICAgc3RhY2subGVuZ3RoID0gMFxuICB9XG5cbiAgLy8gaXRlcmF0ZSBvdmVyIGFsbCBzdHJ1Y3QgcmVhZGVycyB1bnRpbCB3ZSBhcmUgZG9uZVxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGlmIChzdGFja0hlYWQuY29uc3RydWN0b3IgIT09IFNraXApIHtcbiAgICAgIGNvbnN0IGxvY2FsQ2xvY2sgPSBtYXAuc2V0SWZVbmRlZmluZWQoc3RhdGUsIHN0YWNrSGVhZC5pZC5jbGllbnQsICgpID0+IGdldFN0YXRlKHN0b3JlLCBzdGFja0hlYWQuaWQuY2xpZW50KSlcbiAgICAgIGNvbnN0IG9mZnNldCA9IGxvY2FsQ2xvY2sgLSBzdGFja0hlYWQuaWQuY2xvY2tcbiAgICAgIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgICAgIC8vIHVwZGF0ZSBmcm9tIHRoZSBzYW1lIGNsaWVudCBpcyBtaXNzaW5nXG4gICAgICAgIHN0YWNrLnB1c2goc3RhY2tIZWFkKVxuICAgICAgICB1cGRhdGVNaXNzaW5nU3Yoc3RhY2tIZWFkLmlkLmNsaWVudCwgc3RhY2tIZWFkLmlkLmNsb2NrIC0gMSlcbiAgICAgICAgLy8gaGlkIGEgZGVhZCB3YWxsLCBhZGQgYWxsIGl0ZW1zIGZyb20gc3RhY2sgdG8gcmVzdFNTXG4gICAgICAgIGFkZFN0YWNrVG9SZXN0U1MoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbWlzc2luZyA9IHN0YWNrSGVhZC5nZXRNaXNzaW5nKHRyYW5zYWN0aW9uLCBzdG9yZSlcbiAgICAgICAgaWYgKG1pc3NpbmcgIT09IG51bGwpIHtcbiAgICAgICAgICBzdGFjay5wdXNoKHN0YWNrSGVhZClcbiAgICAgICAgICAvLyBnZXQgdGhlIHN0cnVjdCByZWFkZXIgdGhhdCBoYXMgdGhlIG1pc3Npbmcgc3RydWN0XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQHR5cGUge3sgcmVmczogQXJyYXk8R0N8SXRlbT4sIGk6IG51bWJlciB9fVxuICAgICAgICAgICAqL1xuICAgICAgICAgIGNvbnN0IHN0cnVjdFJlZnMgPSBjbGllbnRzU3RydWN0UmVmcy5nZXQoLyoqIEB0eXBlIHtudW1iZXJ9ICovIChtaXNzaW5nKSkgfHwgeyByZWZzOiBbXSwgaTogMCB9XG4gICAgICAgICAgaWYgKHN0cnVjdFJlZnMucmVmcy5sZW5ndGggPT09IHN0cnVjdFJlZnMuaSkge1xuICAgICAgICAgICAgLy8gVGhpcyB1cGRhdGUgbWVzc2FnZSBjYXVzYWxseSBkZXBlbmRzIG9uIGFub3RoZXIgdXBkYXRlIG1lc3NhZ2UgdGhhdCBkb2Vzbid0IGV4aXN0IHlldFxuICAgICAgICAgICAgdXBkYXRlTWlzc2luZ1N2KC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAobWlzc2luZyksIGdldFN0YXRlKHN0b3JlLCBtaXNzaW5nKSlcbiAgICAgICAgICAgIGFkZFN0YWNrVG9SZXN0U1MoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGFja0hlYWQgPSBzdHJ1Y3RSZWZzLnJlZnNbc3RydWN0UmVmcy5pKytdXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPT09IDAgfHwgb2Zmc2V0IDwgc3RhY2tIZWFkLmxlbmd0aCkge1xuICAgICAgICAgIC8vIGFsbCBmaW5lLCBhcHBseSB0aGUgc3RhY2toZWFkXG4gICAgICAgICAgc3RhY2tIZWFkLmludGVncmF0ZSh0cmFuc2FjdGlvbiwgb2Zmc2V0KVxuICAgICAgICAgIHN0YXRlLnNldChzdGFja0hlYWQuaWQuY2xpZW50LCBzdGFja0hlYWQuaWQuY2xvY2sgKyBzdGFja0hlYWQubGVuZ3RoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGl0ZXJhdGUgdG8gbmV4dCBzdGFja0hlYWRcbiAgICBpZiAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgc3RhY2tIZWFkID0gLyoqIEB0eXBlIHtHQ3xJdGVtfSAqLyAoc3RhY2sucG9wKCkpXG4gICAgfSBlbHNlIGlmIChjdXJTdHJ1Y3RzVGFyZ2V0ICE9PSBudWxsICYmIGN1clN0cnVjdHNUYXJnZXQuaSA8IGN1clN0cnVjdHNUYXJnZXQucmVmcy5sZW5ndGgpIHtcbiAgICAgIHN0YWNrSGVhZCA9IC8qKiBAdHlwZSB7R0N8SXRlbX0gKi8gKGN1clN0cnVjdHNUYXJnZXQucmVmc1tjdXJTdHJ1Y3RzVGFyZ2V0LmkrK10pXG4gICAgfSBlbHNlIHtcbiAgICAgIGN1clN0cnVjdHNUYXJnZXQgPSBnZXROZXh0U3RydWN0VGFyZ2V0KClcbiAgICAgIGlmIChjdXJTdHJ1Y3RzVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgIC8vIHdlIGFyZSBkb25lIVxuICAgICAgICBicmVha1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhY2tIZWFkID0gLyoqIEB0eXBlIHtHQ3xJdGVtfSAqLyAoY3VyU3RydWN0c1RhcmdldC5yZWZzW2N1clN0cnVjdHNUYXJnZXQuaSsrXSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHJlc3RTdHJ1Y3RzLmNsaWVudHMuc2l6ZSA+IDApIHtcbiAgICBjb25zdCBlbmNvZGVyID0gbmV3IFVwZGF0ZUVuY29kZXJWMigpXG4gICAgd3JpdGVDbGllbnRzU3RydWN0cyhlbmNvZGVyLCByZXN0U3RydWN0cywgbmV3IE1hcCgpKVxuICAgIC8vIHdyaXRlIGVtcHR5IGRlbGV0ZXNldFxuICAgIC8vIHdyaXRlRGVsZXRlU2V0KGVuY29kZXIsIG5ldyBEZWxldGVTZXQoKSlcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgMCkgLy8gPT4gbm8gbmVlZCBmb3IgYW4gZXh0cmEgZnVuY3Rpb24gY2FsbCwganVzdCB3cml0ZSAwIGRlbGV0ZXNcbiAgICByZXR1cm4geyBtaXNzaW5nOiBtaXNzaW5nU1YsIHVwZGF0ZTogZW5jb2Rlci50b1VpbnQ4QXJyYXkoKSB9XG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVN0cnVjdHNGcm9tVHJhbnNhY3Rpb24gPSAoZW5jb2RlciwgdHJhbnNhY3Rpb24pID0+IHdyaXRlQ2xpZW50c1N0cnVjdHMoZW5jb2RlciwgdHJhbnNhY3Rpb24uZG9jLnN0b3JlLCB0cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZSlcblxuLyoqXG4gKiBSZWFkIGFuZCBhcHBseSBhIGRvY3VtZW50IHVwZGF0ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyB0aGUgc2FtZSBlZmZlY3QgYXMgYGFwcGx5VXBkYXRlYCBidXQgYWNjZXB0cyBhIGRlY29kZXIuXG4gKlxuICogQHBhcmFtIHtkZWNvZGluZy5EZWNvZGVyfSBkZWNvZGVyXG4gKiBAcGFyYW0ge0RvY30geWRvY1xuICogQHBhcmFtIHthbnl9IFt0cmFuc2FjdGlvbk9yaWdpbl0gVGhpcyB3aWxsIGJlIHN0b3JlZCBvbiBgdHJhbnNhY3Rpb24ub3JpZ2luYCBhbmQgYC5vbigndXBkYXRlJywgKHVwZGF0ZSwgb3JpZ2luKSlgXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gW3N0cnVjdERlY29kZXJdXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVXBkYXRlVjIgPSAoZGVjb2RlciwgeWRvYywgdHJhbnNhY3Rpb25PcmlnaW4sIHN0cnVjdERlY29kZXIgPSBuZXcgVXBkYXRlRGVjb2RlclYyKGRlY29kZXIpKSA9PlxuICB0cmFuc2FjdCh5ZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgLy8gZm9yY2UgdGhhdCB0cmFuc2FjdGlvbi5sb2NhbCBpcyBzZXQgdG8gbm9uLWxvY2FsXG4gICAgdHJhbnNhY3Rpb24ubG9jYWwgPSBmYWxzZVxuICAgIGxldCByZXRyeSA9IGZhbHNlXG4gICAgY29uc3QgZG9jID0gdHJhbnNhY3Rpb24uZG9jXG4gICAgY29uc3Qgc3RvcmUgPSBkb2Muc3RvcmVcbiAgICAvLyBsZXQgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGNvbnN0IHNzID0gcmVhZENsaWVudHNTdHJ1Y3RSZWZzKHN0cnVjdERlY29kZXIsIGRvYylcbiAgICAvLyBjb25zb2xlLmxvZygndGltZSB0byByZWFkIHN0cnVjdHM6ICcsIHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpIC8vIEB0b2RvIHJlbW92ZVxuICAgIC8vIHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAvLyBjb25zb2xlLmxvZygndGltZSB0byBtZXJnZTogJywgcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLy8gQHRvZG8gcmVtb3ZlXG4gICAgLy8gc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGNvbnN0IHJlc3RTdHJ1Y3RzID0gaW50ZWdyYXRlU3RydWN0cyh0cmFuc2FjdGlvbiwgc3RvcmUsIHNzKVxuICAgIGNvbnN0IHBlbmRpbmcgPSBzdG9yZS5wZW5kaW5nU3RydWN0c1xuICAgIGlmIChwZW5kaW5nKSB7XG4gICAgICAvLyBjaGVjayBpZiB3ZSBjYW4gYXBwbHkgc29tZXRoaW5nXG4gICAgICBmb3IgKGNvbnN0IFtjbGllbnQsIGNsb2NrXSBvZiBwZW5kaW5nLm1pc3NpbmcpIHtcbiAgICAgICAgaWYgKGNsb2NrIDwgZ2V0U3RhdGUoc3RvcmUsIGNsaWVudCkpIHtcbiAgICAgICAgICByZXRyeSA9IHRydWVcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocmVzdFN0cnVjdHMpIHtcbiAgICAgICAgLy8gbWVyZ2UgcmVzdFN0cnVjdHMgaW50byBzdG9yZS5wZW5kaW5nXG4gICAgICAgIGZvciAoY29uc3QgW2NsaWVudCwgY2xvY2tdIG9mIHJlc3RTdHJ1Y3RzLm1pc3NpbmcpIHtcbiAgICAgICAgICBjb25zdCBtY2xvY2sgPSBwZW5kaW5nLm1pc3NpbmcuZ2V0KGNsaWVudClcbiAgICAgICAgICBpZiAobWNsb2NrID09IG51bGwgfHwgbWNsb2NrID4gY2xvY2spIHtcbiAgICAgICAgICAgIHBlbmRpbmcubWlzc2luZy5zZXQoY2xpZW50LCBjbG9jaylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGVuZGluZy51cGRhdGUgPSBtZXJnZVVwZGF0ZXNWMihbcGVuZGluZy51cGRhdGUsIHJlc3RTdHJ1Y3RzLnVwZGF0ZV0pXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3JlLnBlbmRpbmdTdHJ1Y3RzID0gcmVzdFN0cnVjdHNcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coJ3RpbWUgdG8gaW50ZWdyYXRlOiAnLCBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSAvLyBAdG9kbyByZW1vdmVcbiAgICAvLyBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgY29uc3QgZHNSZXN0ID0gcmVhZEFuZEFwcGx5RGVsZXRlU2V0KHN0cnVjdERlY29kZXIsIHRyYW5zYWN0aW9uLCBzdG9yZSlcbiAgICBpZiAoc3RvcmUucGVuZGluZ0RzKSB7XG4gICAgICAvLyBAdG9kbyB3ZSBjb3VsZCBtYWtlIGEgbG93ZXItYm91bmQgc3RhdGUtdmVjdG9yIGNoZWNrIGFzIHdlIGRvIGFib3ZlXG4gICAgICBjb25zdCBwZW5kaW5nRFNVcGRhdGUgPSBuZXcgVXBkYXRlRGVjb2RlclYyKGRlY29kaW5nLmNyZWF0ZURlY29kZXIoc3RvcmUucGVuZGluZ0RzKSlcbiAgICAgIGRlY29kaW5nLnJlYWRWYXJVaW50KHBlbmRpbmdEU1VwZGF0ZS5yZXN0RGVjb2RlcikgLy8gcmVhZCAwIHN0cnVjdHMsIGJlY2F1c2Ugd2Ugb25seSBlbmNvZGUgZGVsZXRlcyBpbiBwZW5kaW5nZHN1cGRhdGVcbiAgICAgIGNvbnN0IGRzUmVzdDIgPSByZWFkQW5kQXBwbHlEZWxldGVTZXQocGVuZGluZ0RTVXBkYXRlLCB0cmFuc2FjdGlvbiwgc3RvcmUpXG4gICAgICBpZiAoZHNSZXN0ICYmIGRzUmVzdDIpIHtcbiAgICAgICAgLy8gY2FzZSAxOiBkczEgIT0gbnVsbCAmJiBkczIgIT0gbnVsbFxuICAgICAgICBzdG9yZS5wZW5kaW5nRHMgPSBtZXJnZVVwZGF0ZXNWMihbZHNSZXN0LCBkc1Jlc3QyXSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNhc2UgMjogZHMxICE9IG51bGxcbiAgICAgICAgLy8gY2FzZSAzOiBkczIgIT0gbnVsbFxuICAgICAgICAvLyBjYXNlIDQ6IGRzMSA9PSBudWxsICYmIGRzMiA9PSBudWxsXG4gICAgICAgIHN0b3JlLnBlbmRpbmdEcyA9IGRzUmVzdCB8fCBkc1Jlc3QyXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVpdGhlciBkc1Jlc3QgPT0gbnVsbCAmJiBwZW5kaW5nRHMgPT0gbnVsbCBPUiBkc1Jlc3QgIT0gbnVsbFxuICAgICAgc3RvcmUucGVuZGluZ0RzID0gZHNSZXN0XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKCd0aW1lIHRvIGNsZWFudXA6ICcsIHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpIC8vIEB0b2RvIHJlbW92ZVxuICAgIC8vIHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcblxuICAgIC8vIGNvbnNvbGUubG9nKCd0aW1lIHRvIHJlc3VtZSBkZWxldGUgcmVhZGVyczogJywgcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLy8gQHRvZG8gcmVtb3ZlXG4gICAgLy8gc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGlmIChyZXRyeSkge1xuICAgICAgY29uc3QgdXBkYXRlID0gLyoqIEB0eXBlIHt7dXBkYXRlOiBVaW50OEFycmF5fX0gKi8gKHN0b3JlLnBlbmRpbmdTdHJ1Y3RzKS51cGRhdGVcbiAgICAgIHN0b3JlLnBlbmRpbmdTdHJ1Y3RzID0gbnVsbFxuICAgICAgYXBwbHlVcGRhdGVWMih0cmFuc2FjdGlvbi5kb2MsIHVwZGF0ZSlcbiAgICB9XG4gIH0sIHRyYW5zYWN0aW9uT3JpZ2luLCBmYWxzZSlcblxuLyoqXG4gKiBSZWFkIGFuZCBhcHBseSBhIGRvY3VtZW50IHVwZGF0ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyB0aGUgc2FtZSBlZmZlY3QgYXMgYGFwcGx5VXBkYXRlYCBidXQgYWNjZXB0cyBhIGRlY29kZXIuXG4gKlxuICogQHBhcmFtIHtkZWNvZGluZy5EZWNvZGVyfSBkZWNvZGVyXG4gKiBAcGFyYW0ge0RvY30geWRvY1xuICogQHBhcmFtIHthbnl9IFt0cmFuc2FjdGlvbk9yaWdpbl0gVGhpcyB3aWxsIGJlIHN0b3JlZCBvbiBgdHJhbnNhY3Rpb24ub3JpZ2luYCBhbmQgYC5vbigndXBkYXRlJywgKHVwZGF0ZSwgb3JpZ2luKSlgXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVXBkYXRlID0gKGRlY29kZXIsIHlkb2MsIHRyYW5zYWN0aW9uT3JpZ2luKSA9PiByZWFkVXBkYXRlVjIoZGVjb2RlciwgeWRvYywgdHJhbnNhY3Rpb25PcmlnaW4sIG5ldyBVcGRhdGVEZWNvZGVyVjEoZGVjb2RlcikpXG5cbi8qKlxuICogQXBwbHkgYSBkb2N1bWVudCB1cGRhdGUgY3JlYXRlZCBieSwgZm9yIGV4YW1wbGUsIGB5Lm9uKCd1cGRhdGUnLCB1cGRhdGUgPT4gLi4pYCBvciBgdXBkYXRlID0gZW5jb2RlU3RhdGVBc1VwZGF0ZSgpYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyB0aGUgc2FtZSBlZmZlY3QgYXMgYHJlYWRVcGRhdGVgIGJ1dCBhY2NlcHRzIGFuIFVpbnQ4QXJyYXkgaW5zdGVhZCBvZiBhIERlY29kZXIuXG4gKlxuICogQHBhcmFtIHtEb2N9IHlkb2NcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge2FueX0gW3RyYW5zYWN0aW9uT3JpZ2luXSBUaGlzIHdpbGwgYmUgc3RvcmVkIG9uIGB0cmFuc2FjdGlvbi5vcmlnaW5gIGFuZCBgLm9uKCd1cGRhdGUnLCAodXBkYXRlLCBvcmlnaW4pKWBcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMSB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjJ9IFtZRGVjb2Rlcl1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGFwcGx5VXBkYXRlVjIgPSAoeWRvYywgdXBkYXRlLCB0cmFuc2FjdGlvbk9yaWdpbiwgWURlY29kZXIgPSBVcGRhdGVEZWNvZGVyVjIpID0+IHtcbiAgY29uc3QgZGVjb2RlciA9IGRlY29kaW5nLmNyZWF0ZURlY29kZXIodXBkYXRlKVxuICByZWFkVXBkYXRlVjIoZGVjb2RlciwgeWRvYywgdHJhbnNhY3Rpb25PcmlnaW4sIG5ldyBZRGVjb2RlcihkZWNvZGVyKSlcbn1cblxuLyoqXG4gKiBBcHBseSBhIGRvY3VtZW50IHVwZGF0ZSBjcmVhdGVkIGJ5LCBmb3IgZXhhbXBsZSwgYHkub24oJ3VwZGF0ZScsIHVwZGF0ZSA9PiAuLilgIG9yIGB1cGRhdGUgPSBlbmNvZGVTdGF0ZUFzVXBkYXRlKClgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFzIHRoZSBzYW1lIGVmZmVjdCBhcyBgcmVhZFVwZGF0ZWAgYnV0IGFjY2VwdHMgYW4gVWludDhBcnJheSBpbnN0ZWFkIG9mIGEgRGVjb2Rlci5cbiAqXG4gKiBAcGFyYW0ge0RvY30geWRvY1xuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7YW55fSBbdHJhbnNhY3Rpb25PcmlnaW5dIFRoaXMgd2lsbCBiZSBzdG9yZWQgb24gYHRyYW5zYWN0aW9uLm9yaWdpbmAgYW5kIGAub24oJ3VwZGF0ZScsICh1cGRhdGUsIG9yaWdpbikpYFxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgYXBwbHlVcGRhdGUgPSAoeWRvYywgdXBkYXRlLCB0cmFuc2FjdGlvbk9yaWdpbikgPT4gYXBwbHlVcGRhdGVWMih5ZG9jLCB1cGRhdGUsIHRyYW5zYWN0aW9uT3JpZ2luLCBVcGRhdGVEZWNvZGVyVjEpXG5cbi8qKlxuICogV3JpdGUgYWxsIHRoZSBkb2N1bWVudCBhcyBhIHNpbmdsZSB1cGRhdGUgbWVzc2FnZS4gSWYgeW91IHNwZWNpZnkgdGhlIHN0YXRlIG9mIHRoZSByZW1vdGUgY2xpZW50IChgdGFyZ2V0U3RhdGVWZWN0b3JgKSBpdCB3aWxsXG4gKiBvbmx5IHdyaXRlIHRoZSBvcGVyYXRpb25zIHRoYXQgYXJlIG1pc3NpbmcuXG4gKlxuICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7RG9jfSBkb2NcbiAqIEBwYXJhbSB7TWFwPG51bWJlcixudW1iZXI+fSBbdGFyZ2V0U3RhdGVWZWN0b3JdIFRoZSBzdGF0ZSBvZiB0aGUgdGFyZ2V0IHRoYXQgcmVjZWl2ZXMgdGhlIHVwZGF0ZS4gTGVhdmUgZW1wdHkgdG8gd3JpdGUgYWxsIGtub3duIHN0cnVjdHNcbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlU3RhdGVBc1VwZGF0ZSA9IChlbmNvZGVyLCBkb2MsIHRhcmdldFN0YXRlVmVjdG9yID0gbmV3IE1hcCgpKSA9PiB7XG4gIHdyaXRlQ2xpZW50c1N0cnVjdHMoZW5jb2RlciwgZG9jLnN0b3JlLCB0YXJnZXRTdGF0ZVZlY3RvcilcbiAgd3JpdGVEZWxldGVTZXQoZW5jb2RlciwgY3JlYXRlRGVsZXRlU2V0RnJvbVN0cnVjdFN0b3JlKGRvYy5zdG9yZSkpXG59XG5cbi8qKlxuICogV3JpdGUgYWxsIHRoZSBkb2N1bWVudCBhcyBhIHNpbmdsZSB1cGRhdGUgbWVzc2FnZSB0aGF0IGNhbiBiZSBhcHBsaWVkIG9uIHRoZSByZW1vdGUgZG9jdW1lbnQuIElmIHlvdSBzcGVjaWZ5IHRoZSBzdGF0ZSBvZiB0aGUgcmVtb3RlIGNsaWVudCAoYHRhcmdldFN0YXRlYCkgaXQgd2lsbFxuICogb25seSB3cml0ZSB0aGUgb3BlcmF0aW9ucyB0aGF0IGFyZSBtaXNzaW5nLlxuICpcbiAqIFVzZSBgd3JpdGVTdGF0ZUFzVXBkYXRlYCBpbnN0ZWFkIGlmIHlvdSBhcmUgd29ya2luZyB3aXRoIGxpYjAvZW5jb2RpbmcuanMjRW5jb2RlclxuICpcbiAqIEBwYXJhbSB7RG9jfSBkb2NcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gW2VuY29kZWRUYXJnZXRTdGF0ZVZlY3Rvcl0gVGhlIHN0YXRlIG9mIHRoZSB0YXJnZXQgdGhhdCByZWNlaXZlcyB0aGUgdXBkYXRlLiBMZWF2ZSBlbXB0eSB0byB3cml0ZSBhbGwga25vd24gc3RydWN0c1xuICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IFtlbmNvZGVyXVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZVN0YXRlQXNVcGRhdGVWMiA9IChkb2MsIGVuY29kZWRUYXJnZXRTdGF0ZVZlY3RvciA9IG5ldyBVaW50OEFycmF5KFswXSksIGVuY29kZXIgPSBuZXcgVXBkYXRlRW5jb2RlclYyKCkpID0+IHtcbiAgY29uc3QgdGFyZ2V0U3RhdGVWZWN0b3IgPSBkZWNvZGVTdGF0ZVZlY3RvcihlbmNvZGVkVGFyZ2V0U3RhdGVWZWN0b3IpXG4gIHdyaXRlU3RhdGVBc1VwZGF0ZShlbmNvZGVyLCBkb2MsIHRhcmdldFN0YXRlVmVjdG9yKVxuICBjb25zdCB1cGRhdGVzID0gW2VuY29kZXIudG9VaW50OEFycmF5KCldXG4gIC8vIGFsc28gYWRkIHRoZSBwZW5kaW5nIHVwZGF0ZXMgKGlmIHRoZXJlIGFyZSBhbnkpXG4gIGlmIChkb2Muc3RvcmUucGVuZGluZ0RzKSB7XG4gICAgdXBkYXRlcy5wdXNoKGRvYy5zdG9yZS5wZW5kaW5nRHMpXG4gIH1cbiAgaWYgKGRvYy5zdG9yZS5wZW5kaW5nU3RydWN0cykge1xuICAgIHVwZGF0ZXMucHVzaChkaWZmVXBkYXRlVjIoZG9jLnN0b3JlLnBlbmRpbmdTdHJ1Y3RzLnVwZGF0ZSwgZW5jb2RlZFRhcmdldFN0YXRlVmVjdG9yKSlcbiAgfVxuICBpZiAodXBkYXRlcy5sZW5ndGggPiAxKSB7XG4gICAgaWYgKGVuY29kZXIuY29uc3RydWN0b3IgPT09IFVwZGF0ZUVuY29kZXJWMSkge1xuICAgICAgcmV0dXJuIG1lcmdlVXBkYXRlcyh1cGRhdGVzLm1hcCgodXBkYXRlLCBpKSA9PiBpID09PSAwID8gdXBkYXRlIDogY29udmVydFVwZGF0ZUZvcm1hdFYyVG9WMSh1cGRhdGUpKSlcbiAgICB9IGVsc2UgaWYgKGVuY29kZXIuY29uc3RydWN0b3IgPT09IFVwZGF0ZUVuY29kZXJWMikge1xuICAgICAgcmV0dXJuIG1lcmdlVXBkYXRlc1YyKHVwZGF0ZXMpXG4gICAgfVxuICB9XG4gIHJldHVybiB1cGRhdGVzWzBdXG59XG5cbi8qKlxuICogV3JpdGUgYWxsIHRoZSBkb2N1bWVudCBhcyBhIHNpbmdsZSB1cGRhdGUgbWVzc2FnZSB0aGF0IGNhbiBiZSBhcHBsaWVkIG9uIHRoZSByZW1vdGUgZG9jdW1lbnQuIElmIHlvdSBzcGVjaWZ5IHRoZSBzdGF0ZSBvZiB0aGUgcmVtb3RlIGNsaWVudCAoYHRhcmdldFN0YXRlYCkgaXQgd2lsbFxuICogb25seSB3cml0ZSB0aGUgb3BlcmF0aW9ucyB0aGF0IGFyZSBtaXNzaW5nLlxuICpcbiAqIFVzZSBgd3JpdGVTdGF0ZUFzVXBkYXRlYCBpbnN0ZWFkIGlmIHlvdSBhcmUgd29ya2luZyB3aXRoIGxpYjAvZW5jb2RpbmcuanMjRW5jb2RlclxuICpcbiAqIEBwYXJhbSB7RG9jfSBkb2NcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gW2VuY29kZWRUYXJnZXRTdGF0ZVZlY3Rvcl0gVGhlIHN0YXRlIG9mIHRoZSB0YXJnZXQgdGhhdCByZWNlaXZlcyB0aGUgdXBkYXRlLiBMZWF2ZSBlbXB0eSB0byB3cml0ZSBhbGwga25vd24gc3RydWN0c1xuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZVN0YXRlQXNVcGRhdGUgPSAoZG9jLCBlbmNvZGVkVGFyZ2V0U3RhdGVWZWN0b3IpID0+IGVuY29kZVN0YXRlQXNVcGRhdGVWMihkb2MsIGVuY29kZWRUYXJnZXRTdGF0ZVZlY3RvciwgbmV3IFVwZGF0ZUVuY29kZXJWMSgpKVxuXG4vKipcbiAqIFJlYWQgc3RhdGUgdmVjdG9yIGZyb20gRGVjb2RlciBhbmQgcmV0dXJuIGFzIE1hcFxuICpcbiAqIEBwYXJhbSB7RFNEZWNvZGVyVjEgfCBEU0RlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7TWFwPG51bWJlcixudW1iZXI+fSBNYXBzIGBjbGllbnRgIHRvIHRoZSBudW1iZXIgbmV4dCBleHBlY3RlZCBgY2xvY2tgIGZyb20gdGhhdCBjbGllbnQuXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkU3RhdGVWZWN0b3IgPSBkZWNvZGVyID0+IHtcbiAgY29uc3Qgc3MgPSBuZXcgTWFwKClcbiAgY29uc3Qgc3NMZW5ndGggPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNzTGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjbGllbnQgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgIGNvbnN0IGNsb2NrID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2Rlci5yZXN0RGVjb2RlcilcbiAgICBzcy5zZXQoY2xpZW50LCBjbG9jaylcbiAgfVxuICByZXR1cm4gc3Ncbn1cblxuLyoqXG4gKiBSZWFkIGRlY29kZWRTdGF0ZSBhbmQgcmV0dXJuIFN0YXRlIGFzIE1hcC5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRlY29kZWRTdGF0ZVxuICogQHJldHVybiB7TWFwPG51bWJlcixudW1iZXI+fSBNYXBzIGBjbGllbnRgIHRvIHRoZSBudW1iZXIgbmV4dCBleHBlY3RlZCBgY2xvY2tgIGZyb20gdGhhdCBjbGllbnQuXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbi8vIGV4cG9ydCBjb25zdCBkZWNvZGVTdGF0ZVZlY3RvclYyID0gZGVjb2RlZFN0YXRlID0+IHJlYWRTdGF0ZVZlY3RvcihuZXcgRFNEZWNvZGVyVjIoZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihkZWNvZGVkU3RhdGUpKSlcblxuLyoqXG4gKiBSZWFkIGRlY29kZWRTdGF0ZSBhbmQgcmV0dXJuIFN0YXRlIGFzIE1hcC5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRlY29kZWRTdGF0ZVxuICogQHJldHVybiB7TWFwPG51bWJlcixudW1iZXI+fSBNYXBzIGBjbGllbnRgIHRvIHRoZSBudW1iZXIgbmV4dCBleHBlY3RlZCBgY2xvY2tgIGZyb20gdGhhdCBjbGllbnQuXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBkZWNvZGVTdGF0ZVZlY3RvciA9IGRlY29kZWRTdGF0ZSA9PiByZWFkU3RhdGVWZWN0b3IobmV3IERTRGVjb2RlclYxKGRlY29kaW5nLmNyZWF0ZURlY29kZXIoZGVjb2RlZFN0YXRlKSkpXG5cbi8qKlxuICogQHBhcmFtIHtEU0VuY29kZXJWMSB8IERTRW5jb2RlclYyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge01hcDxudW1iZXIsbnVtYmVyPn0gc3ZcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVTdGF0ZVZlY3RvciA9IChlbmNvZGVyLCBzdikgPT4ge1xuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2Rlciwgc3Yuc2l6ZSlcbiAgYXJyYXkuZnJvbShzdi5lbnRyaWVzKCkpLnNvcnQoKGEsIGIpID0+IGJbMF0gLSBhWzBdKS5mb3JFYWNoKChbY2xpZW50LCBjbG9ja10pID0+IHtcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgY2xpZW50KSAvLyBAdG9kbyB1c2UgYSBzcGVjaWFsIGNsaWVudCBkZWNvZGVyIHRoYXQgaXMgYmFzZWQgb24gbWFwcGluZ1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCBjbG9jaylcbiAgfSlcbiAgcmV0dXJuIGVuY29kZXJcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RTRW5jb2RlclYxIHwgRFNFbmNvZGVyVjJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7RG9jfSBkb2NcbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlRG9jdW1lbnRTdGF0ZVZlY3RvciA9IChlbmNvZGVyLCBkb2MpID0+IHdyaXRlU3RhdGVWZWN0b3IoZW5jb2RlciwgZ2V0U3RhdGVWZWN0b3IoZG9jLnN0b3JlKSlcblxuLyoqXG4gKiBFbmNvZGUgU3RhdGUgYXMgVWludDhBcnJheS5cbiAqXG4gKiBAcGFyYW0ge0RvY3xNYXA8bnVtYmVyLG51bWJlcj59IGRvY1xuICogQHBhcmFtIHtEU0VuY29kZXJWMSB8IERTRW5jb2RlclYyfSBbZW5jb2Rlcl1cbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTdGF0ZVZlY3RvclYyID0gKGRvYywgZW5jb2RlciA9IG5ldyBEU0VuY29kZXJWMigpKSA9PiB7XG4gIGlmIChkb2MgaW5zdGFuY2VvZiBNYXApIHtcbiAgICB3cml0ZVN0YXRlVmVjdG9yKGVuY29kZXIsIGRvYylcbiAgfSBlbHNlIHtcbiAgICB3cml0ZURvY3VtZW50U3RhdGVWZWN0b3IoZW5jb2RlciwgZG9jKVxuICB9XG4gIHJldHVybiBlbmNvZGVyLnRvVWludDhBcnJheSgpXG59XG5cbi8qKlxuICogRW5jb2RlIFN0YXRlIGFzIFVpbnQ4QXJyYXkuXG4gKlxuICogQHBhcmFtIHtEb2N8TWFwPG51bWJlcixudW1iZXI+fSBkb2NcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTdGF0ZVZlY3RvciA9IGRvYyA9PiBlbmNvZGVTdGF0ZVZlY3RvclYyKGRvYywgbmV3IERTRW5jb2RlclYxKCkpXG4iLCAiaW1wb3J0ICogYXMgZiBmcm9tICdsaWIwL2Z1bmN0aW9uJ1xuXG4vKipcbiAqIEdlbmVyYWwgZXZlbnQgaGFuZGxlciBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBAdGVtcGxhdGUgQVJHMCwgQVJHMVxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEhhbmRsZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PGZ1bmN0aW9uKEFSRzAsIEFSRzEpOnZvaWQ+fVxuICAgICAqL1xuICAgIHRoaXMubCA9IFtdXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgQVJHMCxBUkcxXG4gKiBAcmV0dXJucyB7RXZlbnRIYW5kbGVyPEFSRzAsQVJHMT59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRXZlbnRIYW5kbGVyID0gKCkgPT4gbmV3IEV2ZW50SGFuZGxlcigpXG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuXG4gKiB7QGxpbmsgRXZlbnRIYW5kbGVyI2NhbGxFdmVudExpc3RlbmVyc30gaXMgY2FsbGVkLlxuICpcbiAqIEB0ZW1wbGF0ZSBBUkcwLEFSRzFcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPEFSRzAsQVJHMT59IGV2ZW50SGFuZGxlclxuICogQHBhcmFtIHtmdW5jdGlvbihBUkcwLEFSRzEpOnZvaWR9IGYgVGhlIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgYWRkRXZlbnRIYW5kbGVyTGlzdGVuZXIgPSAoZXZlbnRIYW5kbGVyLCBmKSA9PlxuICBldmVudEhhbmRsZXIubC5wdXNoKGYpXG5cbi8qKlxuICogUmVtb3ZlcyBhbiBldmVudCBsaXN0ZW5lci5cbiAqXG4gKiBAdGVtcGxhdGUgQVJHMCxBUkcxXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxBUkcwLEFSRzE+fSBldmVudEhhbmRsZXJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oQVJHMCxBUkcxKTp2b2lkfSBmIFRoZSBldmVudCBoYW5kbGVyIHRoYXQgd2FzIGFkZGVkIHdpdGhcbiAqICAgICAgICAgICAgICAgICAgICAge0BsaW5rIEV2ZW50SGFuZGxlciNhZGRFdmVudExpc3RlbmVyfVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlbW92ZUV2ZW50SGFuZGxlckxpc3RlbmVyID0gKGV2ZW50SGFuZGxlciwgZikgPT4ge1xuICBjb25zdCBsID0gZXZlbnRIYW5kbGVyLmxcbiAgY29uc3QgbGVuID0gbC5sZW5ndGhcbiAgZXZlbnRIYW5kbGVyLmwgPSBsLmZpbHRlcihnID0+IGYgIT09IGcpXG4gIGlmIChsZW4gPT09IGV2ZW50SGFuZGxlci5sLmxlbmd0aCkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1t5anNdIFRyaWVkIHRvIHJlbW92ZSBldmVudCBoYW5kbGVyIHRoYXQgZG9lc25cXCd0IGV4aXN0LicpXG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBldmVudCBsaXN0ZW5lcnMuXG4gKiBAdGVtcGxhdGUgQVJHMCxBUkcxXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxBUkcwLEFSRzE+fSBldmVudEhhbmRsZXJcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVBbGxFdmVudEhhbmRsZXJMaXN0ZW5lcnMgPSBldmVudEhhbmRsZXIgPT4ge1xuICBldmVudEhhbmRsZXIubC5sZW5ndGggPSAwXG59XG5cbi8qKlxuICogQ2FsbCBhbGwgZXZlbnQgbGlzdGVuZXJzIHRoYXQgd2VyZSBhZGRlZCB2aWFcbiAqIHtAbGluayBFdmVudEhhbmRsZXIjYWRkRXZlbnRMaXN0ZW5lcn0uXG4gKlxuICogQHRlbXBsYXRlIEFSRzAsQVJHMVxuICogQHBhcmFtIHtFdmVudEhhbmRsZXI8QVJHMCxBUkcxPn0gZXZlbnRIYW5kbGVyXG4gKiBAcGFyYW0ge0FSRzB9IGFyZzBcbiAqIEBwYXJhbSB7QVJHMX0gYXJnMVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGNhbGxFdmVudEhhbmRsZXJMaXN0ZW5lcnMgPSAoZXZlbnRIYW5kbGVyLCBhcmcwLCBhcmcxKSA9PlxuICBmLmNhbGxBbGwoZXZlbnRIYW5kbGVyLmwsIFthcmcwLCBhcmcxXSlcbiIsICJpbXBvcnQgeyBBYnN0cmFjdFR5cGUgfSBmcm9tICcuLi9pbnRlcm5hbHMuanMnIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG5leHBvcnQgY2xhc3MgSUQge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNsaWVudCBjbGllbnQgaWRcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNsb2NrIHVuaXF1ZSBwZXIgY2xpZW50IGlkLCBjb250aW51b3VzIG51bWJlclxuICAgKi9cbiAgY29uc3RydWN0b3IgKGNsaWVudCwgY2xvY2spIHtcbiAgICAvKipcbiAgICAgKiBDbGllbnQgaWRcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50ID0gY2xpZW50XG4gICAgLyoqXG4gICAgICogdW5pcXVlIHBlciBjbGllbnQgaWQsIGNvbnRpbnVvdXMgbnVtYmVyXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLmNsb2NrID0gY2xvY2tcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7SUQgfCBudWxsfSBhXG4gKiBAcGFyYW0ge0lEIHwgbnVsbH0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXBhcmVJRHMgPSAoYSwgYikgPT4gYSA9PT0gYiB8fCAoYSAhPT0gbnVsbCAmJiBiICE9PSBudWxsICYmIGEuY2xpZW50ID09PSBiLmNsaWVudCAmJiBhLmNsb2NrID09PSBiLmNsb2NrKVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbGllbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbG9ja1xuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUlEID0gKGNsaWVudCwgY2xvY2spID0+IG5ldyBJRChjbGllbnQsIGNsb2NrKVxuXG4vKipcbiAqIEBwYXJhbSB7ZW5jb2RpbmcuRW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtJRH0gaWRcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUlEID0gKGVuY29kZXIsIGlkKSA9PiB7XG4gIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBpZC5jbGllbnQpXG4gIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBpZC5jbG9jaylcbn1cblxuLyoqXG4gKiBSZWFkIElELlxuICogKiBJZiBmaXJzdCB2YXJVaW50IHJlYWQgaXMgMHhGRkZGRkYgYSBSb290SUQgaXMgcmV0dXJuZWQuXG4gKiAqIE90aGVyd2lzZSBhbiBJRCBpcyByZXR1cm5lZFxuICpcbiAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7SUR9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZElEID0gZGVjb2RlciA9PlxuICBjcmVhdGVJRChkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKSwgZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcikpXG5cbi8qKlxuICogVGhlIHRvcCB0eXBlcyBhcmUgbWFwcGVkIGZyb20geS5zaGFyZS5nZXQoa2V5bmFtZSkgPT4gdHlwZS5cbiAqIGB0eXBlYCBkb2VzIG5vdCBzdG9yZSBhbnkgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGBrZXluYW1lYC5cbiAqIFRoaXMgZnVuY3Rpb24gZmluZHMgdGhlIGNvcnJlY3QgYGtleW5hbWVgIGZvciBgdHlwZWAgYW5kIHRocm93cyBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gdHlwZVxuICogQHJldHVybiB7c3RyaW5nfVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmRSb290VHlwZUtleSA9IHR5cGUgPT4ge1xuICAvLyBAdHMtaWdub3JlIF95IG11c3QgYmUgZGVmaW5lZCwgb3RoZXJ3aXNlIHVuZXhwZWN0ZWQgY2FzZVxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB0eXBlLmRvYy5zaGFyZS5lbnRyaWVzKCkpIHtcbiAgICBpZiAodmFsdWUgPT09IHR5cGUpIHtcbiAgICAgIHJldHVybiBrZXlcbiAgICB9XG4gIH1cbiAgdGhyb3cgZXJyb3IudW5leHBlY3RlZENhc2UoKVxufVxuIiwgImltcG9ydCB7XG4gIGlzRGVsZXRlZCxcbiAgY3JlYXRlRGVsZXRlU2V0RnJvbVN0cnVjdFN0b3JlLFxuICBnZXRTdGF0ZVZlY3RvcixcbiAgZ2V0SXRlbUNsZWFuU3RhcnQsXG4gIGl0ZXJhdGVEZWxldGVkU3RydWN0cyxcbiAgd3JpdGVEZWxldGVTZXQsXG4gIHdyaXRlU3RhdGVWZWN0b3IsXG4gIHJlYWREZWxldGVTZXQsXG4gIHJlYWRTdGF0ZVZlY3RvcixcbiAgY3JlYXRlRGVsZXRlU2V0LFxuICBjcmVhdGVJRCxcbiAgZ2V0U3RhdGUsXG4gIGZpbmRJbmRleFNTLFxuICBVcGRhdGVFbmNvZGVyVjIsXG4gIGFwcGx5VXBkYXRlVjIsXG4gIExhenlTdHJ1Y3RSZWFkZXIsXG4gIGVxdWFsRGVsZXRlU2V0cyxcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIERTRW5jb2RlclYxLCBEU0VuY29kZXJWMiwgRFNEZWNvZGVyVjEsIERTRGVjb2RlclYyLCBUcmFuc2FjdGlvbiwgRG9jLCBEZWxldGVTZXQsIEl0ZW0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgbWVyZ2VEZWxldGVTZXRzXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgbWFwIGZyb20gJ2xpYjAvbWFwJ1xuaW1wb3J0ICogYXMgc2V0IGZyb20gJ2xpYjAvc2V0J1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5cbmV4cG9ydCBjbGFzcyBTbmFwc2hvdCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAgICogQHBhcmFtIHtNYXA8bnVtYmVyLG51bWJlcj59IHN2IHN0YXRlIG1hcFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGRzLCBzdikge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtEZWxldGVTZXR9XG4gICAgICovXG4gICAgdGhpcy5kcyA9IGRzXG4gICAgLyoqXG4gICAgICogU3RhdGUgTWFwXG4gICAgICogQHR5cGUge01hcDxudW1iZXIsbnVtYmVyPn1cbiAgICAgKi9cbiAgICB0aGlzLnN2ID0gc3ZcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7U25hcHNob3R9IHNuYXAxXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwMlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFsU25hcHNob3RzID0gKHNuYXAxLCBzbmFwMikgPT4ge1xuICBjb25zdCBkczEgPSBzbmFwMS5kcy5jbGllbnRzXG4gIGNvbnN0IGRzMiA9IHNuYXAyLmRzLmNsaWVudHNcbiAgY29uc3Qgc3YxID0gc25hcDEuc3ZcbiAgY29uc3Qgc3YyID0gc25hcDIuc3ZcbiAgaWYgKHN2MS5zaXplICE9PSBzdjIuc2l6ZSB8fCBkczEuc2l6ZSAhPT0gZHMyLnNpemUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBzdjEuZW50cmllcygpKSB7XG4gICAgaWYgKHN2Mi5nZXQoa2V5KSAhPT0gdmFsdWUpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IFtjbGllbnQsIGRzaXRlbXMxXSBvZiBkczEuZW50cmllcygpKSB7XG4gICAgY29uc3QgZHNpdGVtczIgPSBkczIuZ2V0KGNsaWVudCkgfHwgW11cbiAgICBpZiAoZHNpdGVtczEubGVuZ3RoICE9PSBkc2l0ZW1zMi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRzaXRlbXMxLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkc2l0ZW0xID0gZHNpdGVtczFbaV1cbiAgICAgIGNvbnN0IGRzaXRlbTIgPSBkc2l0ZW1zMltpXVxuICAgICAgaWYgKGRzaXRlbTEuY2xvY2sgIT09IGRzaXRlbTIuY2xvY2sgfHwgZHNpdGVtMS5sZW4gIT09IGRzaXRlbTIubGVuKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7U25hcHNob3R9IHNuYXBzaG90XG4gKiBAcGFyYW0ge0RTRW5jb2RlclYxIHwgRFNFbmNvZGVyVjJ9IFtlbmNvZGVyXVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZVNuYXBzaG90VjIgPSAoc25hcHNob3QsIGVuY29kZXIgPSBuZXcgRFNFbmNvZGVyVjIoKSkgPT4ge1xuICB3cml0ZURlbGV0ZVNldChlbmNvZGVyLCBzbmFwc2hvdC5kcylcbiAgd3JpdGVTdGF0ZVZlY3RvcihlbmNvZGVyLCBzbmFwc2hvdC5zdilcbiAgcmV0dXJuIGVuY29kZXIudG9VaW50OEFycmF5KClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwc2hvdFxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZVNuYXBzaG90ID0gc25hcHNob3QgPT4gZW5jb2RlU25hcHNob3RWMihzbmFwc2hvdCwgbmV3IERTRW5jb2RlclYxKCkpXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAqIEBwYXJhbSB7RFNEZWNvZGVyVjEgfCBEU0RlY29kZXJWMn0gW2RlY29kZXJdXG4gKiBAcmV0dXJuIHtTbmFwc2hvdH1cbiAqL1xuZXhwb3J0IGNvbnN0IGRlY29kZVNuYXBzaG90VjIgPSAoYnVmLCBkZWNvZGVyID0gbmV3IERTRGVjb2RlclYyKGRlY29kaW5nLmNyZWF0ZURlY29kZXIoYnVmKSkpID0+IHtcbiAgcmV0dXJuIG5ldyBTbmFwc2hvdChyZWFkRGVsZXRlU2V0KGRlY29kZXIpLCByZWFkU3RhdGVWZWN0b3IoZGVjb2RlcikpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAqIEByZXR1cm4ge1NuYXBzaG90fVxuICovXG5leHBvcnQgY29uc3QgZGVjb2RlU25hcHNob3QgPSBidWYgPT4gZGVjb2RlU25hcHNob3RWMihidWYsIG5ldyBEU0RlY29kZXJWMShkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZikpKVxuXG4vKipcbiAqIEBwYXJhbSB7RGVsZXRlU2V0fSBkc1xuICogQHBhcmFtIHtNYXA8bnVtYmVyLG51bWJlcj59IHNtXG4gKiBAcmV0dXJuIHtTbmFwc2hvdH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVNuYXBzaG90ID0gKGRzLCBzbSkgPT4gbmV3IFNuYXBzaG90KGRzLCBzbSlcblxuZXhwb3J0IGNvbnN0IGVtcHR5U25hcHNob3QgPSBjcmVhdGVTbmFwc2hvdChjcmVhdGVEZWxldGVTZXQoKSwgbmV3IE1hcCgpKVxuXG4vKipcbiAqIEBwYXJhbSB7RG9jfSBkb2NcbiAqIEByZXR1cm4ge1NuYXBzaG90fVxuICovXG5leHBvcnQgY29uc3Qgc25hcHNob3QgPSBkb2MgPT4gY3JlYXRlU25hcHNob3QoY3JlYXRlRGVsZXRlU2V0RnJvbVN0cnVjdFN0b3JlKGRvYy5zdG9yZSksIGdldFN0YXRlVmVjdG9yKGRvYy5zdG9yZSkpXG5cbi8qKlxuICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gKiBAcGFyYW0ge1NuYXBzaG90fHVuZGVmaW5lZH0gc25hcHNob3RcbiAqXG4gKiBAcHJvdGVjdGVkXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGlzVmlzaWJsZSA9IChpdGVtLCBzbmFwc2hvdCkgPT4gc25hcHNob3QgPT09IHVuZGVmaW5lZFxuICA/ICFpdGVtLmRlbGV0ZWRcbiAgOiBzbmFwc2hvdC5zdi5oYXMoaXRlbS5pZC5jbGllbnQpICYmIChzbmFwc2hvdC5zdi5nZXQoaXRlbS5pZC5jbGllbnQpIHx8IDApID4gaXRlbS5pZC5jbG9jayAmJiAhaXNEZWxldGVkKHNuYXBzaG90LmRzLCBpdGVtLmlkKVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwc2hvdFxuICovXG5leHBvcnQgY29uc3Qgc3BsaXRTbmFwc2hvdEFmZmVjdGVkU3RydWN0cyA9ICh0cmFuc2FjdGlvbiwgc25hcHNob3QpID0+IHtcbiAgY29uc3QgbWV0YSA9IG1hcC5zZXRJZlVuZGVmaW5lZCh0cmFuc2FjdGlvbi5tZXRhLCBzcGxpdFNuYXBzaG90QWZmZWN0ZWRTdHJ1Y3RzLCBzZXQuY3JlYXRlKVxuICBjb25zdCBzdG9yZSA9IHRyYW5zYWN0aW9uLmRvYy5zdG9yZVxuICAvLyBjaGVjayBpZiB3ZSBhbHJlYWR5IHNwbGl0IGZvciB0aGlzIHNuYXBzaG90XG4gIGlmICghbWV0YS5oYXMoc25hcHNob3QpKSB7XG4gICAgc25hcHNob3Quc3YuZm9yRWFjaCgoY2xvY2ssIGNsaWVudCkgPT4ge1xuICAgICAgaWYgKGNsb2NrIDwgZ2V0U3RhdGUoc3RvcmUsIGNsaWVudCkpIHtcbiAgICAgICAgZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGNyZWF0ZUlEKGNsaWVudCwgY2xvY2spKVxuICAgICAgfVxuICAgIH0pXG4gICAgaXRlcmF0ZURlbGV0ZWRTdHJ1Y3RzKHRyYW5zYWN0aW9uLCBzbmFwc2hvdC5kcywgX2l0ZW0gPT4ge30pXG4gICAgbWV0YS5hZGQoc25hcHNob3QpXG4gIH1cbn1cblxuLyoqXG4gKiBAZXhhbXBsZVxuICogIGNvbnN0IHlkb2MgPSBuZXcgWS5Eb2MoeyBnYzogZmFsc2UgfSlcbiAqICB5ZG9jLmdldFRleHQoKS5pbnNlcnQoMCwgJ3dvcmxkIScpXG4gKiAgY29uc3Qgc25hcHNob3QgPSBZLnNuYXBzaG90KHlkb2MpXG4gKiAgeWRvYy5nZXRUZXh0KCkuaW5zZXJ0KDAsICdoZWxsbyAnKVxuICogIGNvbnN0IHJlc3RvcmVkID0gWS5jcmVhdGVEb2NGcm9tU25hcHNob3QoeWRvYywgc25hcHNob3QpXG4gKiAgYXNzZXJ0KHJlc3RvcmVkLmdldFRleHQoKS50b1N0cmluZygpID09PSAnd29ybGQhJylcbiAqXG4gKiBAcGFyYW0ge0RvY30gb3JpZ2luRG9jXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwc2hvdFxuICogQHBhcmFtIHtEb2N9IFtuZXdEb2NdIE9wdGlvbmFsbHksIHlvdSBtYXkgZGVmaW5lIHRoZSBZanMgZG9jdW1lbnQgdGhhdCByZWNlaXZlcyB0aGUgZGF0YSBmcm9tIG9yaWdpbkRvY1xuICogQHJldHVybiB7RG9jfVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRG9jRnJvbVNuYXBzaG90ID0gKG9yaWdpbkRvYywgc25hcHNob3QsIG5ld0RvYyA9IG5ldyBEb2MoKSkgPT4ge1xuICBpZiAob3JpZ2luRG9jLmdjKSB7XG4gICAgLy8gd2Ugc2hvdWxkIG5vdCB0cnkgdG8gcmVzdG9yZSBhIEdDLWVkIGRvY3VtZW50LCBiZWNhdXNlIHNvbWUgb2YgdGhlIHJlc3RvcmVkIGl0ZW1zIG1pZ2h0IGhhdmUgdGhlaXIgY29udGVudCBkZWxldGVkXG4gICAgdGhyb3cgbmV3IEVycm9yKCdHYXJiYWdlLWNvbGxlY3Rpb24gbXVzdCBiZSBkaXNhYmxlZCBpbiBgb3JpZ2luRG9jYCEnKVxuICB9XG4gIGNvbnN0IHsgc3YsIGRzIH0gPSBzbmFwc2hvdFxuXG4gIGNvbnN0IGVuY29kZXIgPSBuZXcgVXBkYXRlRW5jb2RlclYyKClcbiAgb3JpZ2luRG9jLnRyYW5zYWN0KHRyYW5zYWN0aW9uID0+IHtcbiAgICBsZXQgc2l6ZSA9IDBcbiAgICBzdi5mb3JFYWNoKGNsb2NrID0+IHtcbiAgICAgIGlmIChjbG9jayA+IDApIHtcbiAgICAgICAgc2l6ZSsrXG4gICAgICB9XG4gICAgfSlcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2Rlciwgc2l6ZSlcbiAgICAvLyBzcGxpdHRpbmcgdGhlIHN0cnVjdHMgYmVmb3JlIHdyaXRpbmcgdGhlbSB0byB0aGUgZW5jb2RlclxuICAgIGZvciAoY29uc3QgW2NsaWVudCwgY2xvY2tdIG9mIHN2KSB7XG4gICAgICBpZiAoY2xvY2sgPT09IDApIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGlmIChjbG9jayA8IGdldFN0YXRlKG9yaWdpbkRvYy5zdG9yZSwgY2xpZW50KSkge1xuICAgICAgICBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgY3JlYXRlSUQoY2xpZW50LCBjbG9jaykpXG4gICAgICB9XG4gICAgICBjb25zdCBzdHJ1Y3RzID0gb3JpZ2luRG9jLnN0b3JlLmNsaWVudHMuZ2V0KGNsaWVudCkgfHwgW11cbiAgICAgIGNvbnN0IGxhc3RTdHJ1Y3RJbmRleCA9IGZpbmRJbmRleFNTKHN0cnVjdHMsIGNsb2NrIC0gMSlcbiAgICAgIC8vIHdyaXRlICMgZW5jb2RlZCBzdHJ1Y3RzXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgbGFzdFN0cnVjdEluZGV4ICsgMSlcbiAgICAgIGVuY29kZXIud3JpdGVDbGllbnQoY2xpZW50KVxuICAgICAgLy8gZmlyc3QgY2xvY2sgd3JpdHRlbiBpcyAwXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgMClcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGxhc3RTdHJ1Y3RJbmRleDsgaSsrKSB7XG4gICAgICAgIHN0cnVjdHNbaV0ud3JpdGUoZW5jb2RlciwgMClcbiAgICAgIH1cbiAgICB9XG4gICAgd3JpdGVEZWxldGVTZXQoZW5jb2RlciwgZHMpXG4gIH0pXG5cbiAgYXBwbHlVcGRhdGVWMihuZXdEb2MsIGVuY29kZXIudG9VaW50OEFycmF5KCksICdzbmFwc2hvdCcpXG4gIHJldHVybiBuZXdEb2Ncbn1cblxuLyoqXG4gKiBAcGFyYW0ge1NuYXBzaG90fSBzbmFwc2hvdFxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMiB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjF9IFtZRGVjb2Rlcl1cbiAqL1xuZXhwb3J0IGNvbnN0IHNuYXBzaG90Q29udGFpbnNVcGRhdGVWMiA9IChzbmFwc2hvdCwgdXBkYXRlLCBZRGVjb2RlciA9IFVwZGF0ZURlY29kZXJWMikgPT4ge1xuICBjb25zdCBzdHJ1Y3RzID0gW11cbiAgY29uc3QgdXBkYXRlRGVjb2RlciA9IG5ldyBZRGVjb2RlcihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSkpXG4gIGNvbnN0IGxhenlEZWNvZGVyID0gbmV3IExhenlTdHJ1Y3RSZWFkZXIodXBkYXRlRGVjb2RlciwgZmFsc2UpXG4gIGZvciAobGV0IGN1cnIgPSBsYXp5RGVjb2Rlci5jdXJyOyBjdXJyICE9PSBudWxsOyBjdXJyID0gbGF6eURlY29kZXIubmV4dCgpKSB7XG4gICAgc3RydWN0cy5wdXNoKGN1cnIpXG4gICAgaWYgKChzbmFwc2hvdC5zdi5nZXQoY3Vyci5pZC5jbGllbnQpIHx8IDApIDwgY3Vyci5pZC5jbG9jayArIGN1cnIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgY29uc3QgbWVyZ2VkRFMgPSBtZXJnZURlbGV0ZVNldHMoW3NuYXBzaG90LmRzLCByZWFkRGVsZXRlU2V0KHVwZGF0ZURlY29kZXIpXSlcbiAgcmV0dXJuIGVxdWFsRGVsZXRlU2V0cyhzbmFwc2hvdC5kcywgbWVyZ2VkRFMpXG59XG5cbi8qKlxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKi9cbmV4cG9ydCBjb25zdCBzbmFwc2hvdENvbnRhaW5zVXBkYXRlID0gKHNuYXBzaG90LCB1cGRhdGUpID0+IHNuYXBzaG90Q29udGFpbnNVcGRhdGVWMihzbmFwc2hvdCwgdXBkYXRlLCBVcGRhdGVEZWNvZGVyVjEpXG4iLCAiaW1wb3J0IHtcbiAgR0MsXG4gIHNwbGl0SXRlbSxcbiAgVHJhbnNhY3Rpb24sIElELCBJdGVtLCBEU0RlY29kZXJWMiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG5leHBvcnQgY2xhc3MgU3RydWN0U3RvcmUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge01hcDxudW1iZXIsQXJyYXk8R0N8SXRlbT4+fVxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50cyA9IG5ldyBNYXAoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudWxsIHwgeyBtaXNzaW5nOiBNYXA8bnVtYmVyLCBudW1iZXI+LCB1cGRhdGU6IFVpbnQ4QXJyYXkgfX1cbiAgICAgKi9cbiAgICB0aGlzLnBlbmRpbmdTdHJ1Y3RzID0gbnVsbFxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudWxsIHwgVWludDhBcnJheX1cbiAgICAgKi9cbiAgICB0aGlzLnBlbmRpbmdEcyA9IG51bGxcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0aGUgc3RhdGVzIGFzIGEgTWFwPGNsaWVudCxjbG9jaz4uXG4gKiBOb3RlIHRoYXQgY2xvY2sgcmVmZXJzIHRvIHRoZSBuZXh0IGV4cGVjdGVkIGNsb2NrIGlkLlxuICpcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcmV0dXJuIHtNYXA8bnVtYmVyLG51bWJlcj59XG4gKlxuICogQHB1YmxpY1xuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRTdGF0ZVZlY3RvciA9IHN0b3JlID0+IHtcbiAgY29uc3Qgc20gPSBuZXcgTWFwKClcbiAgc3RvcmUuY2xpZW50cy5mb3JFYWNoKChzdHJ1Y3RzLCBjbGllbnQpID0+IHtcbiAgICBjb25zdCBzdHJ1Y3QgPSBzdHJ1Y3RzW3N0cnVjdHMubGVuZ3RoIC0gMV1cbiAgICBzbS5zZXQoY2xpZW50LCBzdHJ1Y3QuaWQuY2xvY2sgKyBzdHJ1Y3QubGVuZ3RoKVxuICB9KVxuICByZXR1cm4gc21cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICogQHBhcmFtIHtudW1iZXJ9IGNsaWVudFxuICogQHJldHVybiB7bnVtYmVyfVxuICpcbiAqIEBwdWJsaWNcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZ2V0U3RhdGUgPSAoc3RvcmUsIGNsaWVudCkgPT4ge1xuICBjb25zdCBzdHJ1Y3RzID0gc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50KVxuICBpZiAoc3RydWN0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBjb25zdCBsYXN0U3RydWN0ID0gc3RydWN0c1tzdHJ1Y3RzLmxlbmd0aCAtIDFdXG4gIHJldHVybiBsYXN0U3RydWN0LmlkLmNsb2NrICsgbGFzdFN0cnVjdC5sZW5ndGhcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGludGVncmV0eUNoZWNrID0gc3RvcmUgPT4ge1xuICBzdG9yZS5jbGllbnRzLmZvckVhY2goc3RydWN0cyA9PiB7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzdHJ1Y3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBsID0gc3RydWN0c1tpIC0gMV1cbiAgICAgIGNvbnN0IHIgPSBzdHJ1Y3RzW2ldXG4gICAgICBpZiAobC5pZC5jbG9jayArIGwubGVuZ3RoICE9PSByLmlkLmNsb2NrKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU3RydWN0U3RvcmUgZmFpbGVkIGludGVncmV0eSBjaGVjaycpXG4gICAgICB9XG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge0dDfEl0ZW19IHN0cnVjdFxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGFkZFN0cnVjdCA9IChzdG9yZSwgc3RydWN0KSA9PiB7XG4gIGxldCBzdHJ1Y3RzID0gc3RvcmUuY2xpZW50cy5nZXQoc3RydWN0LmlkLmNsaWVudClcbiAgaWYgKHN0cnVjdHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0cnVjdHMgPSBbXVxuICAgIHN0b3JlLmNsaWVudHMuc2V0KHN0cnVjdC5pZC5jbGllbnQsIHN0cnVjdHMpXG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbGFzdFN0cnVjdCA9IHN0cnVjdHNbc3RydWN0cy5sZW5ndGggLSAxXVxuICAgIGlmIChsYXN0U3RydWN0LmlkLmNsb2NrICsgbGFzdFN0cnVjdC5sZW5ndGggIT09IHN0cnVjdC5pZC5jbG9jaykge1xuICAgICAgdGhyb3cgZXJyb3IudW5leHBlY3RlZENhc2UoKVxuICAgIH1cbiAgfVxuICBzdHJ1Y3RzLnB1c2goc3RydWN0KVxufVxuXG4vKipcbiAqIFBlcmZvcm0gYSBiaW5hcnkgc2VhcmNoIG9uIGEgc29ydGVkIGFycmF5XG4gKiBAcGFyYW0ge0FycmF5PEl0ZW18R0M+fSBzdHJ1Y3RzXG4gKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBmaW5kSW5kZXhTUyA9IChzdHJ1Y3RzLCBjbG9jaykgPT4ge1xuICBsZXQgbGVmdCA9IDBcbiAgbGV0IHJpZ2h0ID0gc3RydWN0cy5sZW5ndGggLSAxXG4gIGxldCBtaWQgPSBzdHJ1Y3RzW3JpZ2h0XVxuICBsZXQgbWlkY2xvY2sgPSBtaWQuaWQuY2xvY2tcbiAgaWYgKG1pZGNsb2NrID09PSBjbG9jaykge1xuICAgIHJldHVybiByaWdodFxuICB9XG4gIC8vIEB0b2RvIGRvZXMgaXQgZXZlbiBtYWtlIHNlbnNlIHRvIHBpdm90IHRoZSBzZWFyY2g/XG4gIC8vIElmIGEgZ29vZCBzcGxpdCBtaXNzZXMsIGl0IG1pZ2h0IGFjdHVhbGx5IGluY3JlYXNlIHRoZSB0aW1lIHRvIGZpbmQgdGhlIGNvcnJlY3QgaXRlbS5cbiAgLy8gQ3VycmVudGx5LCB0aGUgb25seSBhZHZhbnRhZ2UgaXMgdGhhdCBzZWFyY2ggd2l0aCBwaXZvdGluZyBtaWdodCBmaW5kIHRoZSBpdGVtIG9uIHRoZSBmaXJzdCB0cnkuXG4gIGxldCBtaWRpbmRleCA9IG1hdGguZmxvb3IoKGNsb2NrIC8gKG1pZGNsb2NrICsgbWlkLmxlbmd0aCAtIDEpKSAqIHJpZ2h0KSAvLyBwaXZvdGluZyB0aGUgc2VhcmNoXG4gIHdoaWxlIChsZWZ0IDw9IHJpZ2h0KSB7XG4gICAgbWlkID0gc3RydWN0c1ttaWRpbmRleF1cbiAgICBtaWRjbG9jayA9IG1pZC5pZC5jbG9ja1xuICAgIGlmIChtaWRjbG9jayA8PSBjbG9jaykge1xuICAgICAgaWYgKGNsb2NrIDwgbWlkY2xvY2sgKyBtaWQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBtaWRpbmRleFxuICAgICAgfVxuICAgICAgbGVmdCA9IG1pZGluZGV4ICsgMVxuICAgIH0gZWxzZSB7XG4gICAgICByaWdodCA9IG1pZGluZGV4IC0gMVxuICAgIH1cbiAgICBtaWRpbmRleCA9IG1hdGguZmxvb3IoKGxlZnQgKyByaWdodCkgLyAyKVxuICB9XG4gIC8vIEFsd2F5cyBjaGVjayBzdGF0ZSBiZWZvcmUgbG9va2luZyBmb3IgYSBzdHJ1Y3QgaW4gU3RydWN0U3RvcmVcbiAgLy8gVGhlcmVmb3JlIHRoZSBjYXNlIG9mIG5vdCBmaW5kaW5nIGEgc3RydWN0IGlzIHVuZXhwZWN0ZWRcbiAgdGhyb3cgZXJyb3IudW5leHBlY3RlZENhc2UoKVxufVxuXG4vKipcbiAqIEV4cGVjdHMgdGhhdCBpZCBpcyBhY3R1YWxseSBpbiBzdG9yZS4gVGhpcyBmdW5jdGlvbiB0aHJvd3Mgb3IgaXMgYW4gaW5maW5pdGUgbG9vcCBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqIEBwYXJhbSB7SUR9IGlkXG4gKiBAcmV0dXJuIHtHQ3xJdGVtfVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmQgPSAoc3RvcmUsIGlkKSA9PiB7XG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8R0N8SXRlbT59XG4gICAqL1xuICAvLyBAdHMtaWdub3JlXG4gIGNvbnN0IHN0cnVjdHMgPSBzdG9yZS5jbGllbnRzLmdldChpZC5jbGllbnQpXG4gIHJldHVybiBzdHJ1Y3RzW2ZpbmRJbmRleFNTKHN0cnVjdHMsIGlkLmNsb2NrKV1cbn1cblxuLyoqXG4gKiBFeHBlY3RzIHRoYXQgaWQgaXMgYWN0dWFsbHkgaW4gc3RvcmUuIFRoaXMgZnVuY3Rpb24gdGhyb3dzIG9yIGlzIGFuIGluZmluaXRlIGxvb3Agb3RoZXJ3aXNlLlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgZ2V0SXRlbSA9IC8qKiBAdHlwZSB7ZnVuY3Rpb24oU3RydWN0U3RvcmUsSUQpOkl0ZW19ICovIChmaW5kKVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0FycmF5PEl0ZW18R0M+fSBzdHJ1Y3RzXG4gKiBAcGFyYW0ge251bWJlcn0gY2xvY2tcbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmRJbmRleENsZWFuU3RhcnQgPSAodHJhbnNhY3Rpb24sIHN0cnVjdHMsIGNsb2NrKSA9PiB7XG4gIGNvbnN0IGluZGV4ID0gZmluZEluZGV4U1Moc3RydWN0cywgY2xvY2spXG4gIGNvbnN0IHN0cnVjdCA9IHN0cnVjdHNbaW5kZXhdXG4gIGlmIChzdHJ1Y3QuaWQuY2xvY2sgPCBjbG9jayAmJiBzdHJ1Y3QgaW5zdGFuY2VvZiBJdGVtKSB7XG4gICAgc3RydWN0cy5zcGxpY2UoaW5kZXggKyAxLCAwLCBzcGxpdEl0ZW0odHJhbnNhY3Rpb24sIHN0cnVjdCwgY2xvY2sgLSBzdHJ1Y3QuaWQuY2xvY2spKVxuICAgIHJldHVybiBpbmRleCArIDFcbiAgfVxuICByZXR1cm4gaW5kZXhcbn1cblxuLyoqXG4gKiBFeHBlY3RzIHRoYXQgaWQgaXMgYWN0dWFsbHkgaW4gc3RvcmUuIFRoaXMgZnVuY3Rpb24gdGhyb3dzIG9yIGlzIGFuIGluZmluaXRlIGxvb3Agb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0lEfSBpZFxuICogQHJldHVybiB7SXRlbX1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRJdGVtQ2xlYW5TdGFydCA9ICh0cmFuc2FjdGlvbiwgaWQpID0+IHtcbiAgY29uc3Qgc3RydWN0cyA9IC8qKiBAdHlwZSB7QXJyYXk8SXRlbT59ICovICh0cmFuc2FjdGlvbi5kb2Muc3RvcmUuY2xpZW50cy5nZXQoaWQuY2xpZW50KSlcbiAgcmV0dXJuIHN0cnVjdHNbZmluZEluZGV4Q2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgc3RydWN0cywgaWQuY2xvY2spXVxufVxuXG4vKipcbiAqIEV4cGVjdHMgdGhhdCBpZCBpcyBhY3R1YWxseSBpbiBzdG9yZS4gVGhpcyBmdW5jdGlvbiB0aHJvd3Mgb3IgaXMgYW4gaW5maW5pdGUgbG9vcCBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge0lEfSBpZFxuICogQHJldHVybiB7SXRlbX1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRJdGVtQ2xlYW5FbmQgPSAodHJhbnNhY3Rpb24sIHN0b3JlLCBpZCkgPT4ge1xuICAvKipcbiAgICogQHR5cGUge0FycmF5PEl0ZW0+fVxuICAgKi9cbiAgLy8gQHRzLWlnbm9yZVxuICBjb25zdCBzdHJ1Y3RzID0gc3RvcmUuY2xpZW50cy5nZXQoaWQuY2xpZW50KVxuICBjb25zdCBpbmRleCA9IGZpbmRJbmRleFNTKHN0cnVjdHMsIGlkLmNsb2NrKVxuICBjb25zdCBzdHJ1Y3QgPSBzdHJ1Y3RzW2luZGV4XVxuICBpZiAoaWQuY2xvY2sgIT09IHN0cnVjdC5pZC5jbG9jayArIHN0cnVjdC5sZW5ndGggLSAxICYmIHN0cnVjdC5jb25zdHJ1Y3RvciAhPT0gR0MpIHtcbiAgICBzdHJ1Y3RzLnNwbGljZShpbmRleCArIDEsIDAsIHNwbGl0SXRlbSh0cmFuc2FjdGlvbiwgc3RydWN0LCBpZC5jbG9jayAtIHN0cnVjdC5pZC5jbG9jayArIDEpKVxuICB9XG4gIHJldHVybiBzdHJ1Y3Rcbn1cblxuLyoqXG4gKiBSZXBsYWNlIGBpdGVtYCB3aXRoIGBuZXdpdGVtYCBpbiBzdG9yZVxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqIEBwYXJhbSB7R0N8SXRlbX0gc3RydWN0XG4gKiBAcGFyYW0ge0dDfEl0ZW19IG5ld1N0cnVjdFxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlcGxhY2VTdHJ1Y3QgPSAoc3RvcmUsIHN0cnVjdCwgbmV3U3RydWN0KSA9PiB7XG4gIGNvbnN0IHN0cnVjdHMgPSAvKiogQHR5cGUge0FycmF5PEdDfEl0ZW0+fSAqLyAoc3RvcmUuY2xpZW50cy5nZXQoc3RydWN0LmlkLmNsaWVudCkpXG4gIHN0cnVjdHNbZmluZEluZGV4U1Moc3RydWN0cywgc3RydWN0LmlkLmNsb2NrKV0gPSBuZXdTdHJ1Y3Rcbn1cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgYSByYW5nZSBvZiBzdHJ1Y3RzXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QXJyYXk8SXRlbXxHQz59IHN0cnVjdHNcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbG9ja1N0YXJ0IEluY2x1c2l2ZSBzdGFydFxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICogQHBhcmFtIHtmdW5jdGlvbihHQ3xJdGVtKTp2b2lkfSBmXG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBpdGVyYXRlU3RydWN0cyA9ICh0cmFuc2FjdGlvbiwgc3RydWN0cywgY2xvY2tTdGFydCwgbGVuLCBmKSA9PiB7XG4gIGlmIChsZW4gPT09IDApIHtcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBjbG9ja0VuZCA9IGNsb2NrU3RhcnQgKyBsZW5cbiAgbGV0IGluZGV4ID0gZmluZEluZGV4Q2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgc3RydWN0cywgY2xvY2tTdGFydClcbiAgbGV0IHN0cnVjdFxuICBkbyB7XG4gICAgc3RydWN0ID0gc3RydWN0c1tpbmRleCsrXVxuICAgIGlmIChjbG9ja0VuZCA8IHN0cnVjdC5pZC5jbG9jayArIHN0cnVjdC5sZW5ndGgpIHtcbiAgICAgIGZpbmRJbmRleENsZWFuU3RhcnQodHJhbnNhY3Rpb24sIHN0cnVjdHMsIGNsb2NrRW5kKVxuICAgIH1cbiAgICBmKHN0cnVjdClcbiAgfSB3aGlsZSAoaW5kZXggPCBzdHJ1Y3RzLmxlbmd0aCAmJiBzdHJ1Y3RzW2luZGV4XS5pZC5jbG9jayA8IGNsb2NrRW5kKVxufVxuIiwgIi8qKlxuICogV29ya2luZyB3aXRoIHZhbHVlIHBhaXJzLlxuICpcbiAqIEBtb2R1bGUgcGFpclxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIEwsUlxuICovXG5leHBvcnQgY2xhc3MgUGFpciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0x9IGxlZnRcbiAgICogQHBhcmFtIHtSfSByaWdodFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGxlZnQsIHJpZ2h0KSB7XG4gICAgdGhpcy5sZWZ0ID0gbGVmdFxuICAgIHRoaXMucmlnaHQgPSByaWdodFxuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEwsUlxuICogQHBhcmFtIHtMfSBsZWZ0XG4gKiBAcGFyYW0ge1J9IHJpZ2h0XG4gKiBAcmV0dXJuIHtQYWlyPEwsUj59XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSAobGVmdCwgcmlnaHQpID0+IG5ldyBQYWlyKGxlZnQsIHJpZ2h0KVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqIEBwYXJhbSB7Un0gcmlnaHRcbiAqIEBwYXJhbSB7TH0gbGVmdFxuICogQHJldHVybiB7UGFpcjxMLFI+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlUmV2ZXJzZWQgPSAocmlnaHQsIGxlZnQpID0+IG5ldyBQYWlyKGxlZnQsIHJpZ2h0KVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqIEBwYXJhbSB7QXJyYXk8UGFpcjxMLFI+Pn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEwsIFIpOmFueX0gZlxuICovXG5leHBvcnQgY29uc3QgZm9yRWFjaCA9IChhcnIsIGYpID0+IGFyci5mb3JFYWNoKHAgPT4gZihwLmxlZnQsIHAucmlnaHQpKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFIsWFxuICogQHBhcmFtIHtBcnJheTxQYWlyPEwsUj4+fSBhcnJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oTCwgUik6WH0gZlxuICogQHJldHVybiB7QXJyYXk8WD59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAoYXJyLCBmKSA9PiBhcnIubWFwKHAgPT4gZihwLmxlZnQsIHAucmlnaHQpKVxuIiwgIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCB0aGUgRE9NLlxuICpcbiAqIEBtb2R1bGUgZG9tXG4gKi9cblxuaW1wb3J0ICogYXMgcGFpciBmcm9tICcuL3BhaXIuanMnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAdHlwZSB7RG9jdW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBkb2MgPSAvKiogQHR5cGUge0RvY3VtZW50fSAqLyAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50IDoge30pXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRWxlbWVudCA9IG5hbWUgPT4gZG9jLmNyZWF0ZUVsZW1lbnQobmFtZSlcblxuLyoqXG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRG9jdW1lbnRGcmFnbWVudCA9ICgpID0+IGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHJldHVybiB7VGV4dH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVRleHROb2RlID0gdGV4dCA9PiBkb2MuY3JlYXRlVGV4dE5vZGUodGV4dClcblxuZXhwb3J0IGNvbnN0IGRvbVBhcnNlciA9IC8qKiBAdHlwZSB7RE9NUGFyc2VyfSAqLyAodHlwZW9mIERPTVBhcnNlciAhPT0gJ3VuZGVmaW5lZCcgPyBuZXcgRE9NUGFyc2VyKCkgOiBudWxsKVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqL1xuZXhwb3J0IGNvbnN0IGVtaXRDdXN0b21FdmVudCA9IChlbCwgbmFtZSwgb3B0cykgPT4gZWwuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgb3B0cykpXG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtBcnJheTxwYWlyLlBhaXI8c3RyaW5nLHN0cmluZ3xib29sZWFuPj59IGF0dHJzIEFycmF5IG9mIGtleS12YWx1ZSBwYWlyc1xuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IHNldEF0dHJpYnV0ZXMgPSAoZWwsIGF0dHJzKSA9PiB7XG4gIHBhaXIuZm9yRWFjaChhdHRycywgKGtleSwgdmFsdWUpID0+IHtcbiAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KVxuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksICcnKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBlbFxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7TWFwPHN0cmluZywgc3RyaW5nPn0gYXR0cnMgQXJyYXkgb2Yga2V5LXZhbHVlIHBhaXJzXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3Qgc2V0QXR0cmlidXRlc01hcCA9IChlbCwgYXR0cnMpID0+IHtcbiAgYXR0cnMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4geyBlbC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkgfSlcbiAgcmV0dXJuIGVsXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxOb2RlPnxIVE1MQ29sbGVjdGlvbn0gY2hpbGRyZW5cbiAqIEByZXR1cm4ge0RvY3VtZW50RnJhZ21lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBmcmFnbWVudCA9IGNoaWxkcmVuID0+IHtcbiAgY29uc3QgZnJhZ21lbnQgPSBjcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGFwcGVuZENoaWxkKGZyYWdtZW50LCBjaGlsZHJlbltpXSlcbiAgfVxuICByZXR1cm4gZnJhZ21lbnRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudFxuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gbm9kZXNcbiAqIEByZXR1cm4ge0VsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBhcHBlbmQgPSAocGFyZW50LCBub2RlcykgPT4ge1xuICBhcHBlbmRDaGlsZChwYXJlbnQsIGZyYWdtZW50KG5vZGVzKSlcbiAgcmV0dXJuIHBhcmVudFxufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmUgPSBlbCA9PiBlbC5yZW1vdmUoKVxuXG4vKipcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtFdmVudExpc3RlbmVyfSBmXG4gKi9cbmV4cG9ydCBjb25zdCBhZGRFdmVudExpc3RlbmVyID0gKGVsLCBuYW1lLCBmKSA9PiBlbC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGYpXG5cbi8qKlxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJ9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IHJlbW92ZUV2ZW50TGlzdGVuZXIgPSAoZWwsIG5hbWUsIGYpID0+IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgZilcblxuLyoqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7QXJyYXk8cGFpci5QYWlyPHN0cmluZyxFdmVudExpc3RlbmVyPj59IGxpc3RlbmVyc1xuICogQHJldHVybiB7Tm9kZX1cbiAqL1xuZXhwb3J0IGNvbnN0IGFkZEV2ZW50TGlzdGVuZXJzID0gKG5vZGUsIGxpc3RlbmVycykgPT4ge1xuICBwYWlyLmZvckVhY2gobGlzdGVuZXJzLCAobmFtZSwgZikgPT4gYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBuYW1lLCBmKSlcbiAgcmV0dXJuIG5vZGVcbn1cblxuLyoqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7QXJyYXk8cGFpci5QYWlyPHN0cmluZyxFdmVudExpc3RlbmVyPj59IGxpc3RlbmVyc1xuICogQHJldHVybiB7Tm9kZX1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlbW92ZUV2ZW50TGlzdGVuZXJzID0gKG5vZGUsIGxpc3RlbmVycykgPT4ge1xuICBwYWlyLmZvckVhY2gobGlzdGVuZXJzLCAobmFtZSwgZikgPT4gcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBuYW1lLCBmKSlcbiAgcmV0dXJuIG5vZGVcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtBcnJheTxwYWlyLlBhaXI8c3RyaW5nLHN0cmluZz58cGFpci5QYWlyPHN0cmluZyxib29sZWFuPj59IGF0dHJzIEFycmF5IG9mIGtleS12YWx1ZSBwYWlyc1xuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gY2hpbGRyZW5cbiAqIEByZXR1cm4ge0VsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBlbGVtZW50ID0gKG5hbWUsIGF0dHJzID0gW10sIGNoaWxkcmVuID0gW10pID0+XG4gIGFwcGVuZChzZXRBdHRyaWJ1dGVzKGNyZWF0ZUVsZW1lbnQobmFtZSksIGF0dHJzKSwgY2hpbGRyZW4pXG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XG4gKi9cbmV4cG9ydCBjb25zdCBjYW52YXMgPSAod2lkdGgsIGhlaWdodCkgPT4ge1xuICBjb25zdCBjID0gLyoqIEB0eXBlIHtIVE1MQ2FudmFzRWxlbWVudH0gKi8gKGNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpKVxuICBjLmhlaWdodCA9IGhlaWdodFxuICBjLndpZHRoID0gd2lkdGhcbiAgcmV0dXJuIGNcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdFxuICogQHJldHVybiB7VGV4dH1cbiAqL1xuZXhwb3J0IGNvbnN0IHRleHQgPSBjcmVhdGVUZXh0Tm9kZVxuXG4vKipcbiAqIEBwYXJhbSB7cGFpci5QYWlyPHN0cmluZyxzdHJpbmc+fSBwYWlyXG4gKi9cbmV4cG9ydCBjb25zdCBwYWlyVG9TdHlsZVN0cmluZyA9IHBhaXIgPT4gYCR7cGFpci5sZWZ0fToke3BhaXIucmlnaHR9O2BcblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsc3RyaW5nPj59IHBhaXJzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBwYWlyc1RvU3R5bGVTdHJpbmcgPSBwYWlycyA9PiBwYWlycy5tYXAocGFpclRvU3R5bGVTdHJpbmcpLmpvaW4oJycpXG5cbi8qKlxuICogQHBhcmFtIHtNYXA8c3RyaW5nLHN0cmluZz59IG1cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IG1hcFRvU3R5bGVTdHJpbmcgPSBtID0+IG1hcC5tYXAobSwgKHZhbHVlLCBrZXkpID0+IGAke2tleX06JHt2YWx1ZX07YCkuam9pbignJylcblxuLyoqXG4gKiBAdG9kbyBzaG91bGQgYWx3YXlzIHF1ZXJ5IG9uIGEgZG9tIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fFNoYWRvd1Jvb3R9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnlcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50IHwgbnVsbH1cbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5U2VsZWN0b3IgPSAoZWwsIHF1ZXJ5KSA9PiBlbC5xdWVyeVNlbGVjdG9yKHF1ZXJ5KVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR8U2hhZG93Um9vdH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeVxuICogQHJldHVybiB7Tm9kZUxpc3RPZjxIVE1MRWxlbWVudD59XG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVNlbGVjdG9yQWxsID0gKGVsLCBxdWVyeSkgPT4gZWwucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgZ2V0RWxlbWVudEJ5SWQgPSBpZCA9PiAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jLmdldEVsZW1lbnRCeUlkKGlkKSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbFxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gKi9cbmNvbnN0IF9wYXJzZSA9IGh0bWwgPT4gZG9tUGFyc2VyLnBhcnNlRnJvbVN0cmluZyhgPGh0bWw+PGJvZHk+JHtodG1sfTwvYm9keT48L2h0bWw+YCwgJ3RleHQvaHRtbCcpLmJvZHlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbFxuICogQHJldHVybiB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlRnJhZ21lbnQgPSBodG1sID0+IGZyYWdtZW50KC8qKiBAdHlwZSB7YW55fSAqLyAoX3BhcnNlKGh0bWwpLmNoaWxkTm9kZXMpKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlRWxlbWVudCA9IGh0bWwgPT4gLyoqIEB0eXBlIEhUTUxFbGVtZW50ICovIChfcGFyc2UoaHRtbCkuZmlyc3RFbGVtZW50Q2hpbGQpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gb2xkRWxcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gbmV3RWxcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcGxhY2VXaXRoID0gKG9sZEVsLCBuZXdFbCkgPT4gb2xkRWwucmVwbGFjZVdpdGgobmV3RWwpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gcGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbFxuICogQHBhcmFtIHtOb2RlfG51bGx9IHJlZlxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBpbnNlcnRCZWZvcmUgPSAocGFyZW50LCBlbCwgcmVmKSA9PiBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsLCByZWYpXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7Tm9kZX0gY2hpbGRcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cbmV4cG9ydCBjb25zdCBhcHBlbmRDaGlsZCA9IChwYXJlbnQsIGNoaWxkKSA9PiBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpXG5cbmV4cG9ydCBjb25zdCBFTEVNRU5UX05PREUgPSBkb2MuRUxFTUVOVF9OT0RFXG5leHBvcnQgY29uc3QgVEVYVF9OT0RFID0gZG9jLlRFWFRfTk9ERVxuZXhwb3J0IGNvbnN0IENEQVRBX1NFQ1RJT05fTk9ERSA9IGRvYy5DREFUQV9TRUNUSU9OX05PREVcbmV4cG9ydCBjb25zdCBDT01NRU5UX05PREUgPSBkb2MuQ09NTUVOVF9OT0RFXG5leHBvcnQgY29uc3QgRE9DVU1FTlRfTk9ERSA9IGRvYy5ET0NVTUVOVF9OT0RFXG5leHBvcnQgY29uc3QgRE9DVU1FTlRfVFlQRV9OT0RFID0gZG9jLkRPQ1VNRU5UX1RZUEVfTk9ERVxuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSBkb2MuRE9DVU1FTlRfRlJBR01FTlRfTk9ERVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBub2RlXG4gKiBAcGFyYW0ge251bWJlcn0gdHlwZVxuICovXG5leHBvcnQgY29uc3QgY2hlY2tOb2RlVHlwZSA9IChub2RlLCB0eXBlKSA9PiBub2RlLm5vZGVUeXBlID09PSB0eXBlXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNoaWxkXG4gKi9cbmV4cG9ydCBjb25zdCBpc1BhcmVudE9mID0gKHBhcmVudCwgY2hpbGQpID0+IHtcbiAgbGV0IHAgPSBjaGlsZC5wYXJlbnROb2RlXG4gIHdoaWxlIChwICYmIHAgIT09IHBhcmVudCkge1xuICAgIHAgPSBwLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gcCA9PT0gcGFyZW50XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIEVjbWFTY3JpcHQgU3ltYm9scy5cbiAqXG4gKiBAbW9kdWxlIHN5bWJvbFxuICovXG5cbi8qKlxuICogUmV0dXJuIGZyZXNoIHN5bWJvbC5cbiAqXG4gKiBAcmV0dXJuIHtTeW1ib2x9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSBTeW1ib2xcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gc1xuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGlzU3ltYm9sID0gcyA9PiB0eXBlb2YgcyA9PT0gJ3N5bWJvbCdcbiIsICJpbXBvcnQgKiBhcyBzeW1ib2wgZnJvbSAnLi9zeW1ib2wuanMnXG5pbXBvcnQgKiBhcyB0aW1lIGZyb20gJy4vdGltZS5qcydcbmltcG9ydCAqIGFzIGVudiBmcm9tICcuL2Vudmlyb25tZW50LmpzJ1xuaW1wb3J0ICogYXMgZnVuYyBmcm9tICcuL2Z1bmN0aW9uLmpzJ1xuaW1wb3J0ICogYXMganNvbiBmcm9tICcuL2pzb24uanMnXG5cbmV4cG9ydCBjb25zdCBCT0xEID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgVU5CT0xEID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgQkxVRSA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IEdSRVkgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBHUkVFTiA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IFJFRCA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IFBVUlBMRSA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IE9SQU5HRSA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IFVOQ09MT1IgPSBzeW1ib2wuY3JlYXRlKClcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8dW5kZWZpbmVkfHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcnxmdW5jdGlvbigpOmFueT59IGFyZ3NcbiAqIEByZXR1cm4ge0FycmF5PHN0cmluZ3xvYmplY3R8bnVtYmVyfHVuZGVmaW5lZD59XG4gKi9cbmV4cG9ydCBjb25zdCBjb21wdXRlTm9Db2xvckxvZ2dpbmdBcmdzID0gYXJncyA9PiB7XG4gIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdPy5jb25zdHJ1Y3RvciA9PT0gRnVuY3Rpb24pIHtcbiAgICBhcmdzID0gLyoqIEB0eXBlIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSAqLyAoLyoqIEB0eXBlIHtbZnVuY3Rpb25dfSAqLyAoYXJncylbMF0oKSlcbiAgfVxuICBjb25zdCBzdHJCdWlsZGVyID0gW11cbiAgY29uc3QgbG9nQXJncyA9IFtdXG4gIC8vIHRyeSB3aXRoIGZvcm1hdHRpbmcgdW50aWwgd2UgZmluZCBzb21ldGhpbmcgdW5zdXBwb3J0ZWRcbiAgbGV0IGkgPSAwXG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV1cbiAgICBpZiAoYXJnID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGJyZWFrXG4gICAgfSBlbHNlIGlmIChhcmcuY29uc3RydWN0b3IgPT09IFN0cmluZyB8fCBhcmcuY29uc3RydWN0b3IgPT09IE51bWJlcikge1xuICAgICAgc3RyQnVpbGRlci5wdXNoKGFyZylcbiAgICB9IGVsc2UgaWYgKGFyZy5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICBpZiAoaSA+IDApIHtcbiAgICAvLyBjcmVhdGUgbG9nQXJncyB3aXRoIHdoYXQgd2UgaGF2ZSBzbyBmYXJcbiAgICBsb2dBcmdzLnB1c2goc3RyQnVpbGRlci5qb2luKCcnKSlcbiAgfVxuICAvLyBhcHBlbmQgdGhlIHJlc3RcbiAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXVxuICAgIGlmICghKGFyZyBpbnN0YW5jZW9mIFN5bWJvbCkpIHtcbiAgICAgIGxvZ0FyZ3MucHVzaChhcmcpXG4gICAgfVxuICB9XG4gIHJldHVybiBsb2dBcmdzXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG5jb25zdCBsb2dnaW5nQ29sb3JzID0gW0dSRUVOLCBQVVJQTEUsIE9SQU5HRSwgQkxVRV1cbmxldCBuZXh0Q29sb3IgPSAwXG5sZXQgbGFzdExvZ2dpbmdUaW1lID0gdGltZS5nZXRVbml4VGltZSgpXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKC4uLmFueSk6dm9pZH0gX3ByaW50XG4gKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlTmFtZVxuICogQHJldHVybiB7ZnVuY3Rpb24oLi4uYW55KTp2b2lkfVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlTW9kdWxlTG9nZ2VyID0gKF9wcmludCwgbW9kdWxlTmFtZSkgPT4ge1xuICBjb25zdCBjb2xvciA9IGxvZ2dpbmdDb2xvcnNbbmV4dENvbG9yXVxuICBjb25zdCBkZWJ1Z1JlZ2V4VmFyID0gZW52LmdldFZhcmlhYmxlKCdsb2cnKVxuICBjb25zdCBkb0xvZ2dpbmcgPSBkZWJ1Z1JlZ2V4VmFyICE9PSBudWxsICYmXG4gICAgKGRlYnVnUmVnZXhWYXIgPT09ICcqJyB8fCBkZWJ1Z1JlZ2V4VmFyID09PSAndHJ1ZScgfHxcbiAgICAgIG5ldyBSZWdFeHAoZGVidWdSZWdleFZhciwgJ2dpJykudGVzdChtb2R1bGVOYW1lKSlcbiAgbmV4dENvbG9yID0gKG5leHRDb2xvciArIDEpICUgbG9nZ2luZ0NvbG9ycy5sZW5ndGhcbiAgbW9kdWxlTmFtZSArPSAnOiAnXG4gIHJldHVybiAhZG9Mb2dnaW5nXG4gICAgPyBmdW5jLm5vcFxuICAgIDogKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIGFyZ3NbMF0/LmNvbnN0cnVjdG9yID09PSBGdW5jdGlvbikge1xuICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdKClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aW1lTm93ID0gdGltZS5nZXRVbml4VGltZSgpXG4gICAgICAgIGNvbnN0IHRpbWVEaWZmID0gdGltZU5vdyAtIGxhc3RMb2dnaW5nVGltZVxuICAgICAgICBsYXN0TG9nZ2luZ1RpbWUgPSB0aW1lTm93XG4gICAgICAgIF9wcmludChcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBtb2R1bGVOYW1lLFxuICAgICAgICAgIFVOQ09MT1IsXG4gICAgICAgICAgLi4uYXJncy5tYXAoKGFyZykgPT4ge1xuICAgICAgICAgICAgaWYgKGFyZyAhPSBudWxsICYmIGFyZy5jb25zdHJ1Y3RvciA9PT0gVWludDhBcnJheSkge1xuICAgICAgICAgICAgICBhcmcgPSBBcnJheS5mcm9tKGFyZylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHQgPSB0eXBlb2YgYXJnXG4gICAgICAgICAgICBzd2l0Y2ggKHQpIHtcbiAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnXG4gICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ganNvbi5zdHJpbmdpZnkoYXJnKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSksXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgJyArJyArIHRpbWVEaWZmICsgJ21zJ1xuICAgICAgICApXG4gICAgICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuIiwgIi8qKlxuICogSXNvbW9ycGhpYyBsb2dnaW5nIG1vZHVsZSB3aXRoIHN1cHBvcnQgZm9yIGNvbG9ycyFcbiAqXG4gKiBAbW9kdWxlIGxvZ2dpbmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBlbnYgZnJvbSAnLi9lbnZpcm9ubWVudC5qcydcbmltcG9ydCAqIGFzIHNldCBmcm9tICcuL3NldC5qcydcbmltcG9ydCAqIGFzIHBhaXIgZnJvbSAnLi9wYWlyLmpzJ1xuaW1wb3J0ICogYXMgZG9tIGZyb20gJy4vZG9tLmpzJ1xuaW1wb3J0ICogYXMganNvbiBmcm9tICcuL2pzb24uanMnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5pbXBvcnQgKiBhcyBldmVudGxvb3AgZnJvbSAnLi9ldmVudGxvb3AuanMnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIGNvbW1vbiBmcm9tICcuL2xvZ2dpbmcuY29tbW9uLmpzJ1xuXG5leHBvcnQgeyBCT0xELCBVTkJPTEQsIEJMVUUsIEdSRVksIEdSRUVOLCBSRUQsIFBVUlBMRSwgT1JBTkdFLCBVTkNPTE9SIH0gZnJvbSAnLi9sb2dnaW5nLmNvbW1vbi5qcydcblxuLyoqXG4gKiBAdHlwZSB7T2JqZWN0PFN5bWJvbCxwYWlyLlBhaXI8c3RyaW5nLHN0cmluZz4+fVxuICovXG5jb25zdCBfYnJvd3NlclN0eWxlTWFwID0ge1xuICBbY29tbW9uLkJPTERdOiBwYWlyLmNyZWF0ZSgnZm9udC13ZWlnaHQnLCAnYm9sZCcpLFxuICBbY29tbW9uLlVOQk9MRF06IHBhaXIuY3JlYXRlKCdmb250LXdlaWdodCcsICdub3JtYWwnKSxcbiAgW2NvbW1vbi5CTFVFXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ2JsdWUnKSxcbiAgW2NvbW1vbi5HUkVFTl06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdncmVlbicpLFxuICBbY29tbW9uLkdSRVldOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAnZ3JleScpLFxuICBbY29tbW9uLlJFRF06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdyZWQnKSxcbiAgW2NvbW1vbi5QVVJQTEVdOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAncHVycGxlJyksXG4gIFtjb21tb24uT1JBTkdFXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ29yYW5nZScpLCAvLyBub3Qgd2VsbCBzdXBwb3J0ZWQgaW4gY2hyb21lIHdoZW4gZGVidWdnaW5nIG5vZGUgd2l0aCBpbnNwZWN0b3IgLSBUT0RPOiBkZXByZWNhdGVcbiAgW2NvbW1vbi5VTkNPTE9SXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ2JsYWNrJylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcnxmdW5jdGlvbigpOmFueT59IGFyZ3NcbiAqIEByZXR1cm4ge0FycmF5PHN0cmluZ3xvYmplY3R8bnVtYmVyPn1cbiAqL1xuLyogYzggaWdub3JlIHN0YXJ0ICovXG5jb25zdCBjb21wdXRlQnJvd3NlckxvZ2dpbmdBcmdzID0gKGFyZ3MpID0+IHtcbiAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIGFyZ3NbMF0/LmNvbnN0cnVjdG9yID09PSBGdW5jdGlvbikge1xuICAgIGFyZ3MgPSAvKiogQHR5cGUge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59ICovICgvKiogQHR5cGUge1tmdW5jdGlvbl19ICovIChhcmdzKVswXSgpKVxuICB9XG4gIGNvbnN0IHN0ckJ1aWxkZXIgPSBbXVxuICBjb25zdCBzdHlsZXMgPSBbXVxuICBjb25zdCBjdXJyZW50U3R5bGUgPSBtYXAuY3JlYXRlKClcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxzdHJpbmd8T2JqZWN0fG51bWJlcj59XG4gICAqL1xuICBsZXQgbG9nQXJncyA9IFtdXG4gIC8vIHRyeSB3aXRoIGZvcm1hdHRpbmcgdW50aWwgd2UgZmluZCBzb21ldGhpbmcgdW5zdXBwb3J0ZWRcbiAgbGV0IGkgPSAwXG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV1cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3Qgc3R5bGUgPSBfYnJvd3NlclN0eWxlTWFwW2FyZ11cbiAgICBpZiAoc3R5bGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY3VycmVudFN0eWxlLnNldChzdHlsZS5sZWZ0LCBzdHlsZS5yaWdodClcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGFyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBpZiAoYXJnLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgfHwgYXJnLmNvbnN0cnVjdG9yID09PSBOdW1iZXIpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBkb20ubWFwVG9TdHlsZVN0cmluZyhjdXJyZW50U3R5bGUpXG4gICAgICAgIGlmIChpID4gMCB8fCBzdHlsZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc3RyQnVpbGRlci5wdXNoKCclYycgKyBhcmcpXG4gICAgICAgICAgc3R5bGVzLnB1c2goc3R5bGUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyQnVpbGRlci5wdXNoKGFyZylcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGkgPiAwKSB7XG4gICAgLy8gY3JlYXRlIGxvZ0FyZ3Mgd2l0aCB3aGF0IHdlIGhhdmUgc28gZmFyXG4gICAgbG9nQXJncyA9IHN0eWxlc1xuICAgIGxvZ0FyZ3MudW5zaGlmdChzdHJCdWlsZGVyLmpvaW4oJycpKVxuICB9XG4gIC8vIGFwcGVuZCB0aGUgcmVzdFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2ldXG4gICAgaWYgKCEoYXJnIGluc3RhbmNlb2YgU3ltYm9sKSkge1xuICAgICAgbG9nQXJncy5wdXNoKGFyZylcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxvZ0FyZ3Ncbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY29uc3QgY29tcHV0ZUxvZ2dpbmdBcmdzID0gZW52LnN1cHBvcnRzQ29sb3JcbiAgPyBjb21wdXRlQnJvd3NlckxvZ2dpbmdBcmdzXG4gIDogY29tbW9uLmNvbXB1dGVOb0NvbG9yTG9nZ2luZ0FyZ3Ncbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gKi9cbmV4cG9ydCBjb25zdCBwcmludCA9ICguLi5hcmdzKSA9PiB7XG4gIGNvbnNvbGUubG9nKC4uLmNvbXB1dGVMb2dnaW5nQXJncyhhcmdzKSlcbiAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5wcmludChhcmdzKSlcbn1cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICovXG5leHBvcnQgY29uc3Qgd2FybiA9ICguLi5hcmdzKSA9PiB7XG4gIGNvbnNvbGUud2FybiguLi5jb21wdXRlTG9nZ2luZ0FyZ3MoYXJncykpXG4gIGFyZ3MudW5zaGlmdChjb21tb24uT1JBTkdFKVxuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLnByaW50KGFyZ3MpKVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnJcbiAqL1xuLyogYzggaWdub3JlIHN0YXJ0ICovXG5leHBvcnQgY29uc3QgcHJpbnRFcnJvciA9IChlcnIpID0+IHtcbiAgY29uc29sZS5lcnJvcihlcnIpXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMucHJpbnRFcnJvcihlcnIpKVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIGltYWdlIGxvY2F0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IGhlaWdodCBvZiB0aGUgaW1hZ2UgaW4gcGl4ZWxcbiAqL1xuLyogYzggaWdub3JlIHN0YXJ0ICovXG5leHBvcnQgY29uc3QgcHJpbnRJbWcgPSAodXJsLCBoZWlnaHQpID0+IHtcbiAgaWYgKGVudi5pc0Jyb3dzZXIpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICclYyAgICAgICAgICAgICAgICAgICAgICAnLFxuICAgICAgYGZvbnQtc2l6ZTogJHtoZWlnaHR9cHg7IGJhY2tncm91bmQtc2l6ZTogY29udGFpbjsgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDsgYmFja2dyb3VuZC1pbWFnZTogdXJsKCR7dXJsfSlgXG4gICAgKVxuICAgIC8vIGNvbnNvbGUubG9nKCclYyAgICAgICAgICAgICAgICAnLCBgZm9udC1zaXplOiAke2hlaWdodH14OyBiYWNrZ3JvdW5kOiB1cmwoJHt1cmx9KSBuby1yZXBlYXQ7YClcbiAgfVxuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLnByaW50SW1nKHVybCwgaGVpZ2h0KSlcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGJhc2U2NFxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAyICovXG5leHBvcnQgY29uc3QgcHJpbnRJbWdCYXNlNjQgPSAoYmFzZTY0LCBoZWlnaHQpID0+XG4gIHByaW50SW1nKGBkYXRhOmltYWdlL2dpZjtiYXNlNjQsJHtiYXNlNjR9YCwgaGVpZ2h0KVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICovXG5leHBvcnQgY29uc3QgZ3JvdXAgPSAoLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmdyb3VwKC4uLmNvbXB1dGVMb2dnaW5nQXJncyhhcmdzKSlcbiAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5ncm91cChhcmdzKSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IGdyb3VwQ29sbGFwc2VkID0gKC4uLmFyZ3MpID0+IHtcbiAgY29uc29sZS5ncm91cENvbGxhcHNlZCguLi5jb21wdXRlTG9nZ2luZ0FyZ3MoYXJncykpXG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMuZ3JvdXBDb2xsYXBzZWQoYXJncykpXG59XG5cbmV4cG9ydCBjb25zdCBncm91cEVuZCA9ICgpID0+IHtcbiAgY29uc29sZS5ncm91cEVuZCgpXG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMuZ3JvdXBFbmQoKSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCk6Tm9kZX0gY3JlYXRlTm9kZVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAyICovXG5leHBvcnQgY29uc3QgcHJpbnREb20gPSAoY3JlYXRlTm9kZSkgPT5cbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5wcmludERvbShjcmVhdGVOb2RlKCkpKVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhc1xuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAyICovXG5leHBvcnQgY29uc3QgcHJpbnRDYW52YXMgPSAoY2FudmFzLCBoZWlnaHQpID0+XG4gIHByaW50SW1nKGNhbnZhcy50b0RhdGFVUkwoKSwgaGVpZ2h0KVxuXG5leHBvcnQgY29uc3QgdmNvbnNvbGVzID0gc2V0LmNyZWF0ZSgpXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gKiBAcmV0dXJuIHtBcnJheTxFbGVtZW50Pn1cbiAqL1xuLyogYzggaWdub3JlIHN0YXJ0ICovXG5jb25zdCBfY29tcHV0ZUxpbmVTcGFucyA9IChhcmdzKSA9PiB7XG4gIGNvbnN0IHNwYW5zID0gW11cbiAgY29uc3QgY3VycmVudFN0eWxlID0gbmV3IE1hcCgpXG4gIC8vIHRyeSB3aXRoIGZvcm1hdHRpbmcgdW50aWwgd2UgZmluZCBzb21ldGhpbmcgdW5zdXBwb3J0ZWRcbiAgbGV0IGkgPSAwXG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBhcmcgPSBhcmdzW2ldXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IHN0eWxlID0gX2Jyb3dzZXJTdHlsZU1hcFthcmddXG4gICAgaWYgKHN0eWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGN1cnJlbnRTdHlsZS5zZXQoc3R5bGUubGVmdCwgc3R5bGUucmlnaHQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhcmcgPSAndW5kZWZpbmVkICdcbiAgICAgIH1cbiAgICAgIGlmIChhcmcuY29uc3RydWN0b3IgPT09IFN0cmluZyB8fCBhcmcuY29uc3RydWN0b3IgPT09IE51bWJlcikge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb20uZWxlbWVudCgnc3BhbicsIFtcbiAgICAgICAgICBwYWlyLmNyZWF0ZSgnc3R5bGUnLCBkb20ubWFwVG9TdHlsZVN0cmluZyhjdXJyZW50U3R5bGUpKVxuICAgICAgICBdLCBbZG9tLnRleHQoYXJnLnRvU3RyaW5nKCkpXSlcbiAgICAgICAgaWYgKHNwYW4uaW5uZXJIVE1MID09PSAnJykge1xuICAgICAgICAgIHNwYW4uaW5uZXJIVE1MID0gJyZuYnNwOydcbiAgICAgICAgfVxuICAgICAgICBzcGFucy5wdXNoKHNwYW4pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyBhcHBlbmQgdGhlIHJlc3RcbiAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNvbnRlbnQgPSBhcmdzW2ldXG4gICAgaWYgKCEoY29udGVudCBpbnN0YW5jZW9mIFN5bWJvbCkpIHtcbiAgICAgIGlmIChjb250ZW50LmNvbnN0cnVjdG9yICE9PSBTdHJpbmcgJiYgY29udGVudC5jb25zdHJ1Y3RvciAhPT0gTnVtYmVyKSB7XG4gICAgICAgIGNvbnRlbnQgPSAnICcgKyBqc29uLnN0cmluZ2lmeShjb250ZW50KSArICcgJ1xuICAgICAgfVxuICAgICAgc3BhbnMucHVzaChcbiAgICAgICAgZG9tLmVsZW1lbnQoJ3NwYW4nLCBbXSwgW2RvbS50ZXh0KC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAoY29udGVudCkpXSlcbiAgICAgIClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNwYW5zXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG5jb25zdCBsaW5lU3R5bGUgPVxuICAnZm9udC1mYW1pbHk6bW9ub3NwYWNlO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNlMmUyZTI7cGFkZGluZzoycHg7J1xuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmV4cG9ydCBjbGFzcyBWQ29uc29sZSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGRvbVxuICAgKi9cbiAgY29uc3RydWN0b3IgKGRvbSkge1xuICAgIHRoaXMuZG9tID0gZG9tXG4gICAgLyoqXG4gICAgICogQHR5cGUge0VsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5jY29udGFpbmVyID0gdGhpcy5kb21cbiAgICB0aGlzLmRlcHRoID0gMFxuICAgIHZjb25zb2xlcy5hZGQodGhpcylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAgICogQHBhcmFtIHtib29sZWFufSBjb2xsYXBzZWRcbiAgICovXG4gIGdyb3VwIChhcmdzLCBjb2xsYXBzZWQgPSBmYWxzZSkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGNvbnN0IHRyaWFuZ2xlRG93biA9IGRvbS5lbGVtZW50KCdzcGFuJywgW1xuICAgICAgICBwYWlyLmNyZWF0ZSgnaGlkZGVuJywgY29sbGFwc2VkKSxcbiAgICAgICAgcGFpci5jcmVhdGUoJ3N0eWxlJywgJ2NvbG9yOmdyZXk7Zm9udC1zaXplOjEyMCU7JylcbiAgICAgIF0sIFtkb20udGV4dCgnXHUyNUJDJyldKVxuICAgICAgY29uc3QgdHJpYW5nbGVSaWdodCA9IGRvbS5lbGVtZW50KCdzcGFuJywgW1xuICAgICAgICBwYWlyLmNyZWF0ZSgnaGlkZGVuJywgIWNvbGxhcHNlZCksXG4gICAgICAgIHBhaXIuY3JlYXRlKCdzdHlsZScsICdjb2xvcjpncmV5O2ZvbnQtc2l6ZToxMjUlOycpXG4gICAgICBdLCBbZG9tLnRleHQoJ1x1MjVCNicpXSlcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBkb20uZWxlbWVudChcbiAgICAgICAgJ2RpdicsXG4gICAgICAgIFtwYWlyLmNyZWF0ZShcbiAgICAgICAgICAnc3R5bGUnLFxuICAgICAgICAgIGAke2xpbmVTdHlsZX07cGFkZGluZy1sZWZ0OiR7dGhpcy5kZXB0aCAqIDEwfXB4YFxuICAgICAgICApXSxcbiAgICAgICAgW3RyaWFuZ2xlRG93biwgdHJpYW5nbGVSaWdodCwgZG9tLnRleHQoJyAnKV0uY29uY2F0KFxuICAgICAgICAgIF9jb21wdXRlTGluZVNwYW5zKGFyZ3MpXG4gICAgICAgIClcbiAgICAgIClcbiAgICAgIGNvbnN0IG5leHRDb250YWluZXIgPSBkb20uZWxlbWVudCgnZGl2JywgW1xuICAgICAgICBwYWlyLmNyZWF0ZSgnaGlkZGVuJywgY29sbGFwc2VkKVxuICAgICAgXSlcbiAgICAgIGNvbnN0IG5leHRMaW5lID0gZG9tLmVsZW1lbnQoJ2RpdicsIFtdLCBbY29udGVudCwgbmV4dENvbnRhaW5lcl0pXG4gICAgICBkb20uYXBwZW5kKHRoaXMuY2NvbnRhaW5lciwgW25leHRMaW5lXSlcbiAgICAgIHRoaXMuY2NvbnRhaW5lciA9IG5leHRDb250YWluZXJcbiAgICAgIHRoaXMuZGVwdGgrK1xuICAgICAgLy8gd2hlbiBoZWFkZXIgaXMgY2xpY2tlZCwgY29sbGFwc2UvdW5jb2xsYXBzZSBjb250YWluZXJcbiAgICAgIGRvbS5hZGRFdmVudExpc3RlbmVyKGNvbnRlbnQsICdjbGljaycsIChfZXZlbnQpID0+IHtcbiAgICAgICAgbmV4dENvbnRhaW5lci50b2dnbGVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgICAgIHRyaWFuZ2xlRG93bi50b2dnbGVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgICAgIHRyaWFuZ2xlUmlnaHQudG9nZ2xlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICAgKi9cbiAgZ3JvdXBDb2xsYXBzZWQgKGFyZ3MpIHtcbiAgICB0aGlzLmdyb3VwKGFyZ3MsIHRydWUpXG4gIH1cblxuICBncm91cEVuZCAoKSB7XG4gICAgZXZlbnRsb29wLmVucXVldWUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVwdGggPiAwKSB7XG4gICAgICAgIHRoaXMuZGVwdGgtLVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHRoaXMuY2NvbnRhaW5lciA9IHRoaXMuY2NvbnRhaW5lci5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnRcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICAgKi9cbiAgcHJpbnQgKGFyZ3MpIHtcbiAgICBldmVudGxvb3AuZW5xdWV1ZSgoKSA9PiB7XG4gICAgICBkb20uYXBwZW5kKHRoaXMuY2NvbnRhaW5lciwgW1xuICAgICAgICBkb20uZWxlbWVudCgnZGl2JywgW1xuICAgICAgICAgIHBhaXIuY3JlYXRlKFxuICAgICAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgICAgIGAke2xpbmVTdHlsZX07cGFkZGluZy1sZWZ0OiR7dGhpcy5kZXB0aCAqIDEwfXB4YFxuICAgICAgICAgIClcbiAgICAgICAgXSwgX2NvbXB1dGVMaW5lU3BhbnMoYXJncykpXG4gICAgICBdKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gICAqL1xuICBwcmludEVycm9yIChlcnIpIHtcbiAgICB0aGlzLnByaW50KFtjb21tb24uUkVELCBjb21tb24uQk9MRCwgZXJyLnRvU3RyaW5nKCldKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxuICAgKi9cbiAgcHJpbnRJbWcgKHVybCwgaGVpZ2h0KSB7XG4gICAgZXZlbnRsb29wLmVucXVldWUoKCkgPT4ge1xuICAgICAgZG9tLmFwcGVuZCh0aGlzLmNjb250YWluZXIsIFtcbiAgICAgICAgZG9tLmVsZW1lbnQoJ2ltZycsIFtcbiAgICAgICAgICBwYWlyLmNyZWF0ZSgnc3JjJywgdXJsKSxcbiAgICAgICAgICBwYWlyLmNyZWF0ZSgnaGVpZ2h0JywgYCR7bWF0aC5yb3VuZChoZWlnaHQgKiAxLjUpfXB4YClcbiAgICAgICAgXSlcbiAgICAgIF0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHByaW50RG9tIChub2RlKSB7XG4gICAgZXZlbnRsb29wLmVucXVldWUoKCkgPT4ge1xuICAgICAgZG9tLmFwcGVuZCh0aGlzLmNjb250YWluZXIsIFtub2RlXSlcbiAgICB9KVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgZXZlbnRsb29wLmVucXVldWUoKCkgPT4ge1xuICAgICAgdmNvbnNvbGVzLmRlbGV0ZSh0aGlzKVxuICAgIH0pXG4gIH1cbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBkb21cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVWQ29uc29sZSA9IChkb20pID0+IG5ldyBWQ29uc29sZShkb20pXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1vZHVsZU5hbWVcbiAqIEByZXR1cm4ge2Z1bmN0aW9uKC4uLmFueSk6dm9pZH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vZHVsZUxvZ2dlciA9IChtb2R1bGVOYW1lKSA9PiBjb21tb24uY3JlYXRlTW9kdWxlTG9nZ2VyKHByaW50LCBtb2R1bGVOYW1lKVxuIiwgImltcG9ydCB7XG4gIGdldFN0YXRlLFxuICB3cml0ZVN0cnVjdHNGcm9tVHJhbnNhY3Rpb24sXG4gIHdyaXRlRGVsZXRlU2V0LFxuICBEZWxldGVTZXQsXG4gIHNvcnRBbmRNZXJnZURlbGV0ZVNldCxcbiAgZ2V0U3RhdGVWZWN0b3IsXG4gIGZpbmRJbmRleFNTLFxuICBjYWxsRXZlbnRIYW5kbGVyTGlzdGVuZXJzLFxuICBJdGVtLFxuICBnZW5lcmF0ZU5ld0NsaWVudElkLFxuICBjcmVhdGVJRCxcbiAgY2xlYW51cFlUZXh0QWZ0ZXJUcmFuc2FjdGlvbixcbiAgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIEdDLCBTdHJ1Y3RTdG9yZSwgQWJzdHJhY3RUeXBlLCBBYnN0cmFjdFN0cnVjdCwgWUV2ZW50LCBEb2MgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIG1hcCBmcm9tICdsaWIwL21hcCdcbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnbGliMC9tYXRoJ1xuaW1wb3J0ICogYXMgc2V0IGZyb20gJ2xpYjAvc2V0J1xuaW1wb3J0ICogYXMgbG9nZ2luZyBmcm9tICdsaWIwL2xvZ2dpbmcnXG5pbXBvcnQgeyBjYWxsQWxsIH0gZnJvbSAnbGliMC9mdW5jdGlvbidcblxuLyoqXG4gKiBBIHRyYW5zYWN0aW9uIGlzIGNyZWF0ZWQgZm9yIGV2ZXJ5IGNoYW5nZSBvbiB0aGUgWWpzIG1vZGVsLiBJdCBpcyBwb3NzaWJsZVxuICogdG8gYnVuZGxlIGNoYW5nZXMgb24gdGhlIFlqcyBtb2RlbCBpbiBhIHNpbmdsZSB0cmFuc2FjdGlvbiB0b1xuICogbWluaW1pemUgdGhlIG51bWJlciBvbiBtZXNzYWdlcyBzZW50IGFuZCB0aGUgbnVtYmVyIG9mIG9ic2VydmVyIGNhbGxzLlxuICogSWYgcG9zc2libGUgdGhlIHVzZXIgb2YgdGhpcyBsaWJyYXJ5IHNob3VsZCBidW5kbGUgYXMgbWFueSBjaGFuZ2VzIGFzXG4gKiBwb3NzaWJsZS4gSGVyZSBpcyBhbiBleGFtcGxlIHRvIGlsbHVzdHJhdGUgdGhlIGFkdmFudGFnZXMgb2YgYnVuZGxpbmc6XG4gKlxuICogQGV4YW1wbGVcbiAqIGNvbnN0IHlkb2MgPSBuZXcgWS5Eb2MoKVxuICogY29uc3QgbWFwID0geWRvYy5nZXRNYXAoJ21hcCcpXG4gKiAvLyBMb2cgY29udGVudCB3aGVuIGNoYW5nZSBpcyB0cmlnZ2VyZWRcbiAqIG1hcC5vYnNlcnZlKCgpID0+IHtcbiAqICAgY29uc29sZS5sb2coJ2NoYW5nZSB0cmlnZ2VyZWQnKVxuICogfSlcbiAqIC8vIEVhY2ggY2hhbmdlIG9uIHRoZSBtYXAgdHlwZSB0cmlnZ2VycyBhIGxvZyBtZXNzYWdlOlxuICogbWFwLnNldCgnYScsIDApIC8vID0+IFwiY2hhbmdlIHRyaWdnZXJlZFwiXG4gKiBtYXAuc2V0KCdiJywgMCkgLy8gPT4gXCJjaGFuZ2UgdHJpZ2dlcmVkXCJcbiAqIC8vIFdoZW4gcHV0IGluIGEgdHJhbnNhY3Rpb24sIGl0IHdpbGwgdHJpZ2dlciB0aGUgbG9nIGFmdGVyIHRoZSB0cmFuc2FjdGlvbjpcbiAqIHlkb2MudHJhbnNhY3QoKCkgPT4ge1xuICogICBtYXAuc2V0KCdhJywgMSlcbiAqICAgbWFwLnNldCgnYicsIDEpXG4gKiB9KSAvLyA9PiBcImNoYW5nZSB0cmlnZ2VyZWRcIlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNsYXNzIFRyYW5zYWN0aW9uIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7RG9jfSBkb2NcbiAgICogQHBhcmFtIHthbnl9IG9yaWdpblxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGxvY2FsXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZG9jLCBvcmlnaW4sIGxvY2FsKSB7XG4gICAgLyoqXG4gICAgICogVGhlIFlqcyBpbnN0YW5jZS5cbiAgICAgKiBAdHlwZSB7RG9jfVxuICAgICAqL1xuICAgIHRoaXMuZG9jID0gZG9jXG4gICAgLyoqXG4gICAgICogRGVzY3JpYmVzIHRoZSBzZXQgb2YgZGVsZXRlZCBpdGVtcyBieSBpZHNcbiAgICAgKiBAdHlwZSB7RGVsZXRlU2V0fVxuICAgICAqL1xuICAgIHRoaXMuZGVsZXRlU2V0ID0gbmV3IERlbGV0ZVNldCgpXG4gICAgLyoqXG4gICAgICogSG9sZHMgdGhlIHN0YXRlIGJlZm9yZSB0aGUgdHJhbnNhY3Rpb24gc3RhcnRlZC5cbiAgICAgKiBAdHlwZSB7TWFwPE51bWJlcixOdW1iZXI+fVxuICAgICAqL1xuICAgIHRoaXMuYmVmb3JlU3RhdGUgPSBnZXRTdGF0ZVZlY3Rvcihkb2Muc3RvcmUpXG4gICAgLyoqXG4gICAgICogSG9sZHMgdGhlIHN0YXRlIGFmdGVyIHRoZSB0cmFuc2FjdGlvbi5cbiAgICAgKiBAdHlwZSB7TWFwPE51bWJlcixOdW1iZXI+fVxuICAgICAqL1xuICAgIHRoaXMuYWZ0ZXJTdGF0ZSA9IG5ldyBNYXAoKVxuICAgIC8qKlxuICAgICAqIEFsbCB0eXBlcyB0aGF0IHdlcmUgZGlyZWN0bHkgbW9kaWZpZWQgKHByb3BlcnR5IGFkZGVkIG9yIGNoaWxkXG4gICAgICogaW5zZXJ0ZWQvZGVsZXRlZCkuIE5ldyB0eXBlcyBhcmUgbm90IGluY2x1ZGVkIGluIHRoaXMgU2V0LlxuICAgICAqIE1hcHMgZnJvbSB0eXBlIHRvIHBhcmVudFN1YnMgKGBpdGVtLnBhcmVudFN1YiA9IG51bGxgIGZvciBZQXJyYXkpXG4gICAgICogQHR5cGUge01hcDxBYnN0cmFjdFR5cGU8WUV2ZW50PGFueT4+LFNldDxTdHJpbmd8bnVsbD4+fVxuICAgICAqL1xuICAgIHRoaXMuY2hhbmdlZCA9IG5ldyBNYXAoKVxuICAgIC8qKlxuICAgICAqIFN0b3JlcyB0aGUgZXZlbnRzIGZvciB0aGUgdHlwZXMgdGhhdCBvYnNlcnZlIGFsc28gY2hpbGQgZWxlbWVudHMuXG4gICAgICogSXQgaXMgbWFpbmx5IHVzZWQgYnkgYG9ic2VydmVEZWVwYC5cbiAgICAgKiBAdHlwZSB7TWFwPEFic3RyYWN0VHlwZTxZRXZlbnQ8YW55Pj4sQXJyYXk8WUV2ZW50PGFueT4+Pn1cbiAgICAgKi9cbiAgICB0aGlzLmNoYW5nZWRQYXJlbnRUeXBlcyA9IG5ldyBNYXAoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxBYnN0cmFjdFN0cnVjdD59XG4gICAgICovXG4gICAgdGhpcy5fbWVyZ2VTdHJ1Y3RzID0gW11cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7YW55fVxuICAgICAqL1xuICAgIHRoaXMub3JpZ2luID0gb3JpZ2luXG4gICAgLyoqXG4gICAgICogU3RvcmVzIG1ldGEgaW5mb3JtYXRpb24gb24gdGhlIHRyYW5zYWN0aW9uXG4gICAgICogQHR5cGUge01hcDxhbnksYW55Pn1cbiAgICAgKi9cbiAgICB0aGlzLm1ldGEgPSBuZXcgTWFwKClcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoaXMgY2hhbmdlIG9yaWdpbmF0ZXMgZnJvbSB0aGlzIGRvYy5cbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLmxvY2FsID0gbG9jYWxcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U2V0PERvYz59XG4gICAgICovXG4gICAgdGhpcy5zdWJkb2NzQWRkZWQgPSBuZXcgU2V0KClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U2V0PERvYz59XG4gICAgICovXG4gICAgdGhpcy5zdWJkb2NzUmVtb3ZlZCA9IG5ldyBTZXQoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTZXQ8RG9jPn1cbiAgICAgKi9cbiAgICB0aGlzLnN1YmRvY3NMb2FkZWQgPSBuZXcgU2V0KClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLl9uZWVkRm9ybWF0dGluZ0NsZWFudXAgPSBmYWxzZVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIGRhdGEgd2FzIHdyaXR0ZW4uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVVwZGF0ZU1lc3NhZ2VGcm9tVHJhbnNhY3Rpb24gPSAoZW5jb2RlciwgdHJhbnNhY3Rpb24pID0+IHtcbiAgaWYgKHRyYW5zYWN0aW9uLmRlbGV0ZVNldC5jbGllbnRzLnNpemUgPT09IDAgJiYgIW1hcC5hbnkodHJhbnNhY3Rpb24uYWZ0ZXJTdGF0ZSwgKGNsb2NrLCBjbGllbnQpID0+IHRyYW5zYWN0aW9uLmJlZm9yZVN0YXRlLmdldChjbGllbnQpICE9PSBjbG9jaykpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICBzb3J0QW5kTWVyZ2VEZWxldGVTZXQodHJhbnNhY3Rpb24uZGVsZXRlU2V0KVxuICB3cml0ZVN0cnVjdHNGcm9tVHJhbnNhY3Rpb24oZW5jb2RlciwgdHJhbnNhY3Rpb24pXG4gIHdyaXRlRGVsZXRlU2V0KGVuY29kZXIsIHRyYW5zYWN0aW9uLmRlbGV0ZVNldClcbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IG5leHRJRCA9IHRyYW5zYWN0aW9uID0+IHtcbiAgY29uc3QgeSA9IHRyYW5zYWN0aW9uLmRvY1xuICByZXR1cm4gY3JlYXRlSUQoeS5jbGllbnRJRCwgZ2V0U3RhdGUoeS5zdG9yZSwgeS5jbGllbnRJRCkpXG59XG5cbi8qKlxuICogSWYgYHR5cGUucGFyZW50YCB3YXMgYWRkZWQgaW4gY3VycmVudCB0cmFuc2FjdGlvbiwgYHR5cGVgIHRlY2huaWNhbGx5XG4gKiBkaWQgbm90IGNoYW5nZSwgaXQgd2FzIGp1c3QgYWRkZWQgYW5kIHdlIHNob3VsZCBub3QgZmlyZSBldmVudHMgZm9yIGB0eXBlYC5cbiAqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8WUV2ZW50PGFueT4+fSB0eXBlXG4gKiBAcGFyYW0ge3N0cmluZ3xudWxsfSBwYXJlbnRTdWJcbiAqL1xuZXhwb3J0IGNvbnN0IGFkZENoYW5nZWRUeXBlVG9UcmFuc2FjdGlvbiA9ICh0cmFuc2FjdGlvbiwgdHlwZSwgcGFyZW50U3ViKSA9PiB7XG4gIGNvbnN0IGl0ZW0gPSB0eXBlLl9pdGVtXG4gIGlmIChpdGVtID09PSBudWxsIHx8IChpdGVtLmlkLmNsb2NrIDwgKHRyYW5zYWN0aW9uLmJlZm9yZVN0YXRlLmdldChpdGVtLmlkLmNsaWVudCkgfHwgMCkgJiYgIWl0ZW0uZGVsZXRlZCkpIHtcbiAgICBtYXAuc2V0SWZVbmRlZmluZWQodHJhbnNhY3Rpb24uY2hhbmdlZCwgdHlwZSwgc2V0LmNyZWF0ZSkuYWRkKHBhcmVudFN1YilcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8QWJzdHJhY3RTdHJ1Y3Q+fSBzdHJ1Y3RzXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcmV0dXJuIHtudW1iZXJ9ICMgb2YgbWVyZ2VkIHN0cnVjdHNcbiAqL1xuY29uc3QgdHJ5VG9NZXJnZVdpdGhMZWZ0cyA9IChzdHJ1Y3RzLCBwb3MpID0+IHtcbiAgbGV0IHJpZ2h0ID0gc3RydWN0c1twb3NdXG4gIGxldCBsZWZ0ID0gc3RydWN0c1twb3MgLSAxXVxuICBsZXQgaSA9IHBvc1xuICBmb3IgKDsgaSA+IDA7IHJpZ2h0ID0gbGVmdCwgbGVmdCA9IHN0cnVjdHNbLS1pIC0gMV0pIHtcbiAgICBpZiAobGVmdC5kZWxldGVkID09PSByaWdodC5kZWxldGVkICYmIGxlZnQuY29uc3RydWN0b3IgPT09IHJpZ2h0LmNvbnN0cnVjdG9yKSB7XG4gICAgICBpZiAobGVmdC5tZXJnZVdpdGgocmlnaHQpKSB7XG4gICAgICAgIGlmIChyaWdodCBpbnN0YW5jZW9mIEl0ZW0gJiYgcmlnaHQucGFyZW50U3ViICE9PSBudWxsICYmIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChyaWdodC5wYXJlbnQpLl9tYXAuZ2V0KHJpZ2h0LnBhcmVudFN1YikgPT09IHJpZ2h0KSB7XG4gICAgICAgICAgLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHJpZ2h0LnBhcmVudCkuX21hcC5zZXQocmlnaHQucGFyZW50U3ViLCAvKiogQHR5cGUge0l0ZW19ICovIChsZWZ0KSlcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgIH1cbiAgICBicmVha1xuICB9XG4gIGNvbnN0IG1lcmdlZCA9IHBvcyAtIGlcbiAgaWYgKG1lcmdlZCkge1xuICAgIC8vIHJlbW92ZSBhbGwgbWVyZ2VkIHN0cnVjdHMgZnJvbSB0aGUgYXJyYXlcbiAgICBzdHJ1Y3RzLnNwbGljZShwb3MgKyAxIC0gbWVyZ2VkLCBtZXJnZWQpXG4gIH1cbiAgcmV0dXJuIG1lcmdlZFxufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVsZXRlU2V0fSBkc1xuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oSXRlbSk6Ym9vbGVhbn0gZ2NGaWx0ZXJcbiAqL1xuY29uc3QgdHJ5R2NEZWxldGVTZXQgPSAoZHMsIHN0b3JlLCBnY0ZpbHRlcikgPT4ge1xuICBmb3IgKGNvbnN0IFtjbGllbnQsIGRlbGV0ZUl0ZW1zXSBvZiBkcy5jbGllbnRzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHN0cnVjdHMgPSAvKiogQHR5cGUge0FycmF5PEdDfEl0ZW0+fSAqLyAoc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50KSlcbiAgICBmb3IgKGxldCBkaSA9IGRlbGV0ZUl0ZW1zLmxlbmd0aCAtIDE7IGRpID49IDA7IGRpLS0pIHtcbiAgICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBkZWxldGVJdGVtc1tkaV1cbiAgICAgIGNvbnN0IGVuZERlbGV0ZUl0ZW1DbG9jayA9IGRlbGV0ZUl0ZW0uY2xvY2sgKyBkZWxldGVJdGVtLmxlblxuICAgICAgZm9yIChcbiAgICAgICAgbGV0IHNpID0gZmluZEluZGV4U1Moc3RydWN0cywgZGVsZXRlSXRlbS5jbG9jayksIHN0cnVjdCA9IHN0cnVjdHNbc2ldO1xuICAgICAgICBzaSA8IHN0cnVjdHMubGVuZ3RoICYmIHN0cnVjdC5pZC5jbG9jayA8IGVuZERlbGV0ZUl0ZW1DbG9jaztcbiAgICAgICAgc3RydWN0ID0gc3RydWN0c1srK3NpXVxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHN0cnVjdHNbc2ldXG4gICAgICAgIGlmIChkZWxldGVJdGVtLmNsb2NrICsgZGVsZXRlSXRlbS5sZW4gPD0gc3RydWN0LmlkLmNsb2NrKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RydWN0IGluc3RhbmNlb2YgSXRlbSAmJiBzdHJ1Y3QuZGVsZXRlZCAmJiAhc3RydWN0LmtlZXAgJiYgZ2NGaWx0ZXIoc3RydWN0KSkge1xuICAgICAgICAgIHN0cnVjdC5nYyhzdG9yZSwgZmFsc2UpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKi9cbmNvbnN0IHRyeU1lcmdlRGVsZXRlU2V0ID0gKGRzLCBzdG9yZSkgPT4ge1xuICAvLyB0cnkgdG8gbWVyZ2UgZGVsZXRlZCAvIGdjJ2QgaXRlbXNcbiAgLy8gbWVyZ2UgZnJvbSByaWdodCB0byBsZWZ0IGZvciBiZXR0ZXIgZWZmaWNpZW5jeSBhbmQgc28gd2UgZG9uJ3QgbWlzcyBhbnkgbWVyZ2UgdGFyZ2V0c1xuICBkcy5jbGllbnRzLmZvckVhY2goKGRlbGV0ZUl0ZW1zLCBjbGllbnQpID0+IHtcbiAgICBjb25zdCBzdHJ1Y3RzID0gLyoqIEB0eXBlIHtBcnJheTxHQ3xJdGVtPn0gKi8gKHN0b3JlLmNsaWVudHMuZ2V0KGNsaWVudCkpXG4gICAgZm9yIChsZXQgZGkgPSBkZWxldGVJdGVtcy5sZW5ndGggLSAxOyBkaSA+PSAwOyBkaS0tKSB7XG4gICAgICBjb25zdCBkZWxldGVJdGVtID0gZGVsZXRlSXRlbXNbZGldXG4gICAgICAvLyBzdGFydCB3aXRoIG1lcmdpbmcgdGhlIGl0ZW0gbmV4dCB0byB0aGUgbGFzdCBkZWxldGVkIGl0ZW1cbiAgICAgIGNvbnN0IG1vc3RSaWdodEluZGV4VG9DaGVjayA9IG1hdGgubWluKHN0cnVjdHMubGVuZ3RoIC0gMSwgMSArIGZpbmRJbmRleFNTKHN0cnVjdHMsIGRlbGV0ZUl0ZW0uY2xvY2sgKyBkZWxldGVJdGVtLmxlbiAtIDEpKVxuICAgICAgZm9yIChcbiAgICAgICAgbGV0IHNpID0gbW9zdFJpZ2h0SW5kZXhUb0NoZWNrLCBzdHJ1Y3QgPSBzdHJ1Y3RzW3NpXTtcbiAgICAgICAgc2kgPiAwICYmIHN0cnVjdC5pZC5jbG9jayA+PSBkZWxldGVJdGVtLmNsb2NrO1xuICAgICAgICBzdHJ1Y3QgPSBzdHJ1Y3RzW3NpXVxuICAgICAgKSB7XG4gICAgICAgIHNpIC09IDEgKyB0cnlUb01lcmdlV2l0aExlZnRzKHN0cnVjdHMsIHNpKVxuICAgICAgfVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlbGV0ZVNldH0gZHNcbiAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEl0ZW0pOmJvb2xlYW59IGdjRmlsdGVyXG4gKi9cbmV4cG9ydCBjb25zdCB0cnlHYyA9IChkcywgc3RvcmUsIGdjRmlsdGVyKSA9PiB7XG4gIHRyeUdjRGVsZXRlU2V0KGRzLCBzdG9yZSwgZ2NGaWx0ZXIpXG4gIHRyeU1lcmdlRGVsZXRlU2V0KGRzLCBzdG9yZSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PFRyYW5zYWN0aW9uPn0gdHJhbnNhY3Rpb25DbGVhbnVwc1xuICogQHBhcmFtIHtudW1iZXJ9IGlcbiAqL1xuY29uc3QgY2xlYW51cFRyYW5zYWN0aW9ucyA9ICh0cmFuc2FjdGlvbkNsZWFudXBzLCBpKSA9PiB7XG4gIGlmIChpIDwgdHJhbnNhY3Rpb25DbGVhbnVwcy5sZW5ndGgpIHtcbiAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uQ2xlYW51cHNbaV1cbiAgICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgICBjb25zdCBzdG9yZSA9IGRvYy5zdG9yZVxuICAgIGNvbnN0IGRzID0gdHJhbnNhY3Rpb24uZGVsZXRlU2V0XG4gICAgY29uc3QgbWVyZ2VTdHJ1Y3RzID0gdHJhbnNhY3Rpb24uX21lcmdlU3RydWN0c1xuICAgIHRyeSB7XG4gICAgICBzb3J0QW5kTWVyZ2VEZWxldGVTZXQoZHMpXG4gICAgICB0cmFuc2FjdGlvbi5hZnRlclN0YXRlID0gZ2V0U3RhdGVWZWN0b3IodHJhbnNhY3Rpb24uZG9jLnN0b3JlKVxuICAgICAgZG9jLmVtaXQoJ2JlZm9yZU9ic2VydmVyQ2FsbHMnLCBbdHJhbnNhY3Rpb24sIGRvY10pXG4gICAgICAvKipcbiAgICAgICAqIEFuIGFycmF5IG9mIGV2ZW50IGNhbGxiYWNrcy5cbiAgICAgICAqXG4gICAgICAgKiBFYWNoIGNhbGxiYWNrIGlzIGNhbGxlZCBldmVuIGlmIHRoZSBvdGhlciBvbmVzIHRocm93IGVycm9ycy5cbiAgICAgICAqXG4gICAgICAgKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24oKTp2b2lkPn1cbiAgICAgICAqL1xuICAgICAgY29uc3QgZnMgPSBbXVxuICAgICAgLy8gb2JzZXJ2ZSBldmVudHMgb24gY2hhbmdlZCB0eXBlc1xuICAgICAgdHJhbnNhY3Rpb24uY2hhbmdlZC5mb3JFYWNoKChzdWJzLCBpdGVtdHlwZSkgPT5cbiAgICAgICAgZnMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgaWYgKGl0ZW10eXBlLl9pdGVtID09PSBudWxsIHx8ICFpdGVtdHlwZS5faXRlbS5kZWxldGVkKSB7XG4gICAgICAgICAgICBpdGVtdHlwZS5fY2FsbE9ic2VydmVyKHRyYW5zYWN0aW9uLCBzdWJzKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIGZzLnB1c2goKCkgPT4ge1xuICAgICAgICAvLyBkZWVwIG9ic2VydmUgZXZlbnRzXG4gICAgICAgIHRyYW5zYWN0aW9uLmNoYW5nZWRQYXJlbnRUeXBlcy5mb3JFYWNoKChldmVudHMsIHR5cGUpID0+IHtcbiAgICAgICAgICAvLyBXZSBuZWVkIHRvIHRoaW5rIGFib3V0IHRoZSBwb3NzaWJpbGl0eSB0aGF0IHRoZSB1c2VyIHRyYW5zZm9ybXMgdGhlXG4gICAgICAgICAgLy8gWS5Eb2MgaW4gdGhlIGV2ZW50LlxuICAgICAgICAgIGlmICh0eXBlLl9kRUgubC5sZW5ndGggPiAwICYmICh0eXBlLl9pdGVtID09PSBudWxsIHx8ICF0eXBlLl9pdGVtLmRlbGV0ZWQpKSB7XG4gICAgICAgICAgICBldmVudHMgPSBldmVudHNcbiAgICAgICAgICAgICAgLmZpbHRlcihldmVudCA9PlxuICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC5faXRlbSA9PT0gbnVsbCB8fCAhZXZlbnQudGFyZ2V0Ll9pdGVtLmRlbGV0ZWRcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgZXZlbnRzXG4gICAgICAgICAgICAgIC5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gdHlwZVxuICAgICAgICAgICAgICAgIC8vIHBhdGggaXMgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZXZlbnQuX3BhdGggPSBudWxsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyBzb3J0IGV2ZW50cyBieSBwYXRoIGxlbmd0aCBzbyB0aGF0IHRvcC1sZXZlbCBldmVudHMgYXJlIGZpcmVkIGZpcnN0LlxuICAgICAgICAgICAgZXZlbnRzXG4gICAgICAgICAgICAgIC5zb3J0KChldmVudDEsIGV2ZW50MikgPT4gZXZlbnQxLnBhdGgubGVuZ3RoIC0gZXZlbnQyLnBhdGgubGVuZ3RoKVxuICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBjaGVjayBmb3IgZXZlbnRzLmxlbmd0aFxuICAgICAgICAgICAgLy8gYmVjYXVzZSB3ZSBrbm93IGl0IGhhcyBhdCBsZWFzdCBvbmUgZWxlbWVudFxuICAgICAgICAgICAgY2FsbEV2ZW50SGFuZGxlckxpc3RlbmVycyh0eXBlLl9kRUgsIGV2ZW50cywgdHJhbnNhY3Rpb24pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICAgIGZzLnB1c2goKCkgPT4gZG9jLmVtaXQoJ2FmdGVyVHJhbnNhY3Rpb24nLCBbdHJhbnNhY3Rpb24sIGRvY10pKVxuICAgICAgY2FsbEFsbChmcywgW10pXG4gICAgICBpZiAodHJhbnNhY3Rpb24uX25lZWRGb3JtYXR0aW5nQ2xlYW51cCkge1xuICAgICAgICBjbGVhbnVwWVRleHRBZnRlclRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBSZXBsYWNlIGRlbGV0ZWQgaXRlbXMgd2l0aCBJdGVtRGVsZXRlZCAvIEdDLlxuICAgICAgLy8gVGhpcyBpcyB3aGVyZSBjb250ZW50IGlzIGFjdHVhbGx5IHJlbW92ZSBmcm9tIHRoZSBZanMgRG9jLlxuICAgICAgaWYgKGRvYy5nYykge1xuICAgICAgICB0cnlHY0RlbGV0ZVNldChkcywgc3RvcmUsIGRvYy5nY0ZpbHRlcilcbiAgICAgIH1cbiAgICAgIHRyeU1lcmdlRGVsZXRlU2V0KGRzLCBzdG9yZSlcblxuICAgICAgLy8gb24gYWxsIGFmZmVjdGVkIHN0b3JlLmNsaWVudHMgcHJvcHMsIHRyeSB0byBtZXJnZVxuICAgICAgdHJhbnNhY3Rpb24uYWZ0ZXJTdGF0ZS5mb3JFYWNoKChjbG9jaywgY2xpZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGJlZm9yZUNsb2NrID0gdHJhbnNhY3Rpb24uYmVmb3JlU3RhdGUuZ2V0KGNsaWVudCkgfHwgMFxuICAgICAgICBpZiAoYmVmb3JlQ2xvY2sgIT09IGNsb2NrKSB7XG4gICAgICAgICAgY29uc3Qgc3RydWN0cyA9IC8qKiBAdHlwZSB7QXJyYXk8R0N8SXRlbT59ICovIChzdG9yZS5jbGllbnRzLmdldChjbGllbnQpKVxuICAgICAgICAgIC8vIHdlIGl0ZXJhdGUgZnJvbSByaWdodCB0byBsZWZ0IHNvIHdlIGNhbiBzYWZlbHkgcmVtb3ZlIGVudHJpZXNcbiAgICAgICAgICBjb25zdCBmaXJzdENoYW5nZVBvcyA9IG1hdGgubWF4KGZpbmRJbmRleFNTKHN0cnVjdHMsIGJlZm9yZUNsb2NrKSwgMSlcbiAgICAgICAgICBmb3IgKGxldCBpID0gc3RydWN0cy5sZW5ndGggLSAxOyBpID49IGZpcnN0Q2hhbmdlUG9zOykge1xuICAgICAgICAgICAgaSAtPSAxICsgdHJ5VG9NZXJnZVdpdGhMZWZ0cyhzdHJ1Y3RzLCBpKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC8vIHRyeSB0byBtZXJnZSBtZXJnZVN0cnVjdHNcbiAgICAgIC8vIEB0b2RvOiBpdCBtYWtlcyBtb3JlIHNlbnNlIHRvIHRyYW5zZm9ybSBtZXJnZVN0cnVjdHMgdG8gYSBEUywgc29ydCBpdCwgYW5kIG1lcmdlIGZyb20gcmlnaHQgdG8gbGVmdFxuICAgICAgLy8gICAgICAgIGJ1dCBhdCB0aGUgbW9tZW50IERTIGRvZXMgbm90IGhhbmRsZSBkdXBsaWNhdGVzXG4gICAgICBmb3IgKGxldCBpID0gbWVyZ2VTdHJ1Y3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGNvbnN0IHsgY2xpZW50LCBjbG9jayB9ID0gbWVyZ2VTdHJ1Y3RzW2ldLmlkXG4gICAgICAgIGNvbnN0IHN0cnVjdHMgPSAvKiogQHR5cGUge0FycmF5PEdDfEl0ZW0+fSAqLyAoc3RvcmUuY2xpZW50cy5nZXQoY2xpZW50KSlcbiAgICAgICAgY29uc3QgcmVwbGFjZWRTdHJ1Y3RQb3MgPSBmaW5kSW5kZXhTUyhzdHJ1Y3RzLCBjbG9jaylcbiAgICAgICAgaWYgKHJlcGxhY2VkU3RydWN0UG9zICsgMSA8IHN0cnVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRyeVRvTWVyZ2VXaXRoTGVmdHMoc3RydWN0cywgcmVwbGFjZWRTdHJ1Y3RQb3MgKyAxKSA+IDEpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlIC8vIG5vIG5lZWQgdG8gcGVyZm9ybSBuZXh0IGNoZWNrLCBib3RoIGFyZSBhbHJlYWR5IG1lcmdlZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocmVwbGFjZWRTdHJ1Y3RQb3MgPiAwKSB7XG4gICAgICAgICAgdHJ5VG9NZXJnZVdpdGhMZWZ0cyhzdHJ1Y3RzLCByZXBsYWNlZFN0cnVjdFBvcylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCF0cmFuc2FjdGlvbi5sb2NhbCAmJiB0cmFuc2FjdGlvbi5hZnRlclN0YXRlLmdldChkb2MuY2xpZW50SUQpICE9PSB0cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZS5nZXQoZG9jLmNsaWVudElEKSkge1xuICAgICAgICBsb2dnaW5nLnByaW50KGxvZ2dpbmcuT1JBTkdFLCBsb2dnaW5nLkJPTEQsICdbeWpzXSAnLCBsb2dnaW5nLlVOQk9MRCwgbG9nZ2luZy5SRUQsICdDaGFuZ2VkIHRoZSBjbGllbnQtaWQgYmVjYXVzZSBhbm90aGVyIGNsaWVudCBzZWVtcyB0byBiZSB1c2luZyBpdC4nKVxuICAgICAgICBkb2MuY2xpZW50SUQgPSBnZW5lcmF0ZU5ld0NsaWVudElkKClcbiAgICAgIH1cbiAgICAgIC8vIEB0b2RvIE1lcmdlIGFsbCB0aGUgdHJhbnNhY3Rpb25zIGludG8gb25lIGFuZCBwcm92aWRlIHNlbmQgdGhlIGRhdGEgYXMgYSBzaW5nbGUgdXBkYXRlIG1lc3NhZ2VcbiAgICAgIGRvYy5lbWl0KCdhZnRlclRyYW5zYWN0aW9uQ2xlYW51cCcsIFt0cmFuc2FjdGlvbiwgZG9jXSlcbiAgICAgIGlmIChkb2MuX29ic2VydmVycy5oYXMoJ3VwZGF0ZScpKSB7XG4gICAgICAgIGNvbnN0IGVuY29kZXIgPSBuZXcgVXBkYXRlRW5jb2RlclYxKClcbiAgICAgICAgY29uc3QgaGFzQ29udGVudCA9IHdyaXRlVXBkYXRlTWVzc2FnZUZyb21UcmFuc2FjdGlvbihlbmNvZGVyLCB0cmFuc2FjdGlvbilcbiAgICAgICAgaWYgKGhhc0NvbnRlbnQpIHtcbiAgICAgICAgICBkb2MuZW1pdCgndXBkYXRlJywgW2VuY29kZXIudG9VaW50OEFycmF5KCksIHRyYW5zYWN0aW9uLm9yaWdpbiwgZG9jLCB0cmFuc2FjdGlvbl0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChkb2MuX29ic2VydmVycy5oYXMoJ3VwZGF0ZVYyJykpIHtcbiAgICAgICAgY29uc3QgZW5jb2RlciA9IG5ldyBVcGRhdGVFbmNvZGVyVjIoKVxuICAgICAgICBjb25zdCBoYXNDb250ZW50ID0gd3JpdGVVcGRhdGVNZXNzYWdlRnJvbVRyYW5zYWN0aW9uKGVuY29kZXIsIHRyYW5zYWN0aW9uKVxuICAgICAgICBpZiAoaGFzQ29udGVudCkge1xuICAgICAgICAgIGRvYy5lbWl0KCd1cGRhdGVWMicsIFtlbmNvZGVyLnRvVWludDhBcnJheSgpLCB0cmFuc2FjdGlvbi5vcmlnaW4sIGRvYywgdHJhbnNhY3Rpb25dKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCB7IHN1YmRvY3NBZGRlZCwgc3ViZG9jc0xvYWRlZCwgc3ViZG9jc1JlbW92ZWQgfSA9IHRyYW5zYWN0aW9uXG4gICAgICBpZiAoc3ViZG9jc0FkZGVkLnNpemUgPiAwIHx8IHN1YmRvY3NSZW1vdmVkLnNpemUgPiAwIHx8IHN1YmRvY3NMb2FkZWQuc2l6ZSA+IDApIHtcbiAgICAgICAgc3ViZG9jc0FkZGVkLmZvckVhY2goc3ViZG9jID0+IHtcbiAgICAgICAgICBzdWJkb2MuY2xpZW50SUQgPSBkb2MuY2xpZW50SURcbiAgICAgICAgICBpZiAoc3ViZG9jLmNvbGxlY3Rpb25pZCA9PSBudWxsKSB7XG4gICAgICAgICAgICBzdWJkb2MuY29sbGVjdGlvbmlkID0gZG9jLmNvbGxlY3Rpb25pZFxuICAgICAgICAgIH1cbiAgICAgICAgICBkb2Muc3ViZG9jcy5hZGQoc3ViZG9jKVxuICAgICAgICB9KVxuICAgICAgICBzdWJkb2NzUmVtb3ZlZC5mb3JFYWNoKHN1YmRvYyA9PiBkb2Muc3ViZG9jcy5kZWxldGUoc3ViZG9jKSlcbiAgICAgICAgZG9jLmVtaXQoJ3N1YmRvY3MnLCBbeyBsb2FkZWQ6IHN1YmRvY3NMb2FkZWQsIGFkZGVkOiBzdWJkb2NzQWRkZWQsIHJlbW92ZWQ6IHN1YmRvY3NSZW1vdmVkIH0sIGRvYywgdHJhbnNhY3Rpb25dKVxuICAgICAgICBzdWJkb2NzUmVtb3ZlZC5mb3JFYWNoKHN1YmRvYyA9PiBzdWJkb2MuZGVzdHJveSgpKVxuICAgICAgfVxuXG4gICAgICBpZiAodHJhbnNhY3Rpb25DbGVhbnVwcy5sZW5ndGggPD0gaSArIDEpIHtcbiAgICAgICAgZG9jLl90cmFuc2FjdGlvbkNsZWFudXBzID0gW11cbiAgICAgICAgZG9jLmVtaXQoJ2FmdGVyQWxsVHJhbnNhY3Rpb25zJywgW2RvYywgdHJhbnNhY3Rpb25DbGVhbnVwc10pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbGVhbnVwVHJhbnNhY3Rpb25zKHRyYW5zYWN0aW9uQ2xlYW51cHMsIGkgKyAxKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgYHkudHJhbnNhY3QoKCk9PnsuLn0pYFxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0RvY30gZG9jXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFRyYW5zYWN0aW9uKTpUfSBmXG4gKiBAcGFyYW0ge2FueX0gW29yaWdpbj10cnVlXVxuICogQHJldHVybiB7VH1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHRyYW5zYWN0ID0gKGRvYywgZiwgb3JpZ2luID0gbnVsbCwgbG9jYWwgPSB0cnVlKSA9PiB7XG4gIGNvbnN0IHRyYW5zYWN0aW9uQ2xlYW51cHMgPSBkb2MuX3RyYW5zYWN0aW9uQ2xlYW51cHNcbiAgbGV0IGluaXRpYWxDYWxsID0gZmFsc2VcbiAgLyoqXG4gICAqIEB0eXBlIHthbnl9XG4gICAqL1xuICBsZXQgcmVzdWx0ID0gbnVsbFxuICBpZiAoZG9jLl90cmFuc2FjdGlvbiA9PT0gbnVsbCkge1xuICAgIGluaXRpYWxDYWxsID0gdHJ1ZVxuICAgIGRvYy5fdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oZG9jLCBvcmlnaW4sIGxvY2FsKVxuICAgIHRyYW5zYWN0aW9uQ2xlYW51cHMucHVzaChkb2MuX3RyYW5zYWN0aW9uKVxuICAgIGlmICh0cmFuc2FjdGlvbkNsZWFudXBzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgZG9jLmVtaXQoJ2JlZm9yZUFsbFRyYW5zYWN0aW9ucycsIFtkb2NdKVxuICAgIH1cbiAgICBkb2MuZW1pdCgnYmVmb3JlVHJhbnNhY3Rpb24nLCBbZG9jLl90cmFuc2FjdGlvbiwgZG9jXSlcbiAgfVxuICB0cnkge1xuICAgIHJlc3VsdCA9IGYoZG9jLl90cmFuc2FjdGlvbilcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoaW5pdGlhbENhbGwpIHtcbiAgICAgIGNvbnN0IGZpbmlzaENsZWFudXAgPSBkb2MuX3RyYW5zYWN0aW9uID09PSB0cmFuc2FjdGlvbkNsZWFudXBzWzBdXG4gICAgICBkb2MuX3RyYW5zYWN0aW9uID0gbnVsbFxuICAgICAgaWYgKGZpbmlzaENsZWFudXApIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IHRyYW5zYWN0aW9uIGVuZGVkLCBub3cgcHJvY2VzcyBvYnNlcnZlciBjYWxscy5cbiAgICAgICAgLy8gT2JzZXJ2ZXIgY2FsbCBtYXkgY3JlYXRlIG5ldyB0cmFuc2FjdGlvbnMgZm9yIHdoaWNoIHdlIG5lZWQgdG8gY2FsbCB0aGUgb2JzZXJ2ZXJzIGFuZCBkbyBjbGVhbnVwLlxuICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRvIG5lc3QgdGhlc2UgY2FsbHMsIHNvIHdlIGV4ZWN1dGUgdGhlc2UgY2FsbHMgb25lIGFmdGVyXG4gICAgICAgIC8vIGFub3RoZXIuXG4gICAgICAgIC8vIEFsc28gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBhbGwgY2xlYW51cHMgYXJlIGNhbGxlZCwgZXZlbiBpZiB0aGVcbiAgICAgICAgLy8gb2JzZXJ2ZXMgdGhyb3cgZXJyb3JzLlxuICAgICAgICAvLyBUaGlzIGZpbGUgaXMgZnVsbCBvZiBoYWNreSB0cnkge30gZmluYWxseSB7fSBibG9ja3MgdG8gZW5zdXJlIHRoYXQgYW5cbiAgICAgICAgLy8gZXZlbnQgY2FuIHRocm93IGVycm9ycyBhbmQgYWxzbyB0aGF0IHRoZSBjbGVhbnVwIGlzIGNhbGxlZC5cbiAgICAgICAgY2xlYW51cFRyYW5zYWN0aW9ucyh0cmFuc2FjdGlvbkNsZWFudXBzLCAwKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG4iLCAiaW1wb3J0ICogYXMgYmluYXJ5IGZyb20gJ2xpYjAvYmluYXJ5J1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuaW1wb3J0ICogYXMgZiBmcm9tICdsaWIwL2Z1bmN0aW9uJ1xuaW1wb3J0ICogYXMgbG9nZ2luZyBmcm9tICdsaWIwL2xvZ2dpbmcnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJ2xpYjAvbWF0aCdcbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICdsaWIwL3N0cmluZydcblxuaW1wb3J0IHtcbiAgQ29udGVudEFueSxcbiAgQ29udGVudEJpbmFyeSxcbiAgQ29udGVudERlbGV0ZWQsXG4gIENvbnRlbnREb2MsXG4gIENvbnRlbnRFbWJlZCxcbiAgQ29udGVudEZvcm1hdCxcbiAgQ29udGVudEpTT04sXG4gIENvbnRlbnRTdHJpbmcsXG4gIENvbnRlbnRUeXBlLFxuICBjcmVhdGVJRCxcbiAgZGVjb2RlU3RhdGVWZWN0b3IsXG4gIERTRW5jb2RlclYxLFxuICBEU0VuY29kZXJWMixcbiAgR0MsXG4gIEl0ZW0sXG4gIG1lcmdlRGVsZXRlU2V0cyxcbiAgcmVhZERlbGV0ZVNldCxcbiAgcmVhZEl0ZW1Db250ZW50LFxuICBTa2lwLFxuICBVcGRhdGVEZWNvZGVyVjEsXG4gIFVwZGF0ZURlY29kZXJWMixcbiAgVXBkYXRlRW5jb2RlclYxLFxuICBVcGRhdGVFbmNvZGVyVjIsXG4gIHdyaXRlRGVsZXRlU2V0LFxuICBZWG1sRWxlbWVudCxcbiAgWVhtbEhvb2tcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKi9cbmZ1bmN0aW9uICogbGF6eVN0cnVjdFJlYWRlckdlbmVyYXRvciAoZGVjb2Rlcikge1xuICBjb25zdCBudW1PZlN0YXRlVXBkYXRlcyA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtT2ZTdGF0ZVVwZGF0ZXM7IGkrKykge1xuICAgIGNvbnN0IG51bWJlck9mU3RydWN0cyA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIucmVzdERlY29kZXIpXG4gICAgY29uc3QgY2xpZW50ID0gZGVjb2Rlci5yZWFkQ2xpZW50KClcbiAgICBsZXQgY2xvY2sgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZTdHJ1Y3RzOyBpKyspIHtcbiAgICAgIGNvbnN0IGluZm8gPSBkZWNvZGVyLnJlYWRJbmZvKClcbiAgICAgIC8vIEB0b2RvIHVzZSBzd2l0Y2ggaW5zdGVhZCBvZiBpZnNcbiAgICAgIGlmIChpbmZvID09PSAxMCkge1xuICAgICAgICBjb25zdCBsZW4gPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyLnJlc3REZWNvZGVyKVxuICAgICAgICB5aWVsZCBuZXcgU2tpcChjcmVhdGVJRChjbGllbnQsIGNsb2NrKSwgbGVuKVxuICAgICAgICBjbG9jayArPSBsZW5cbiAgICAgIH0gZWxzZSBpZiAoKGJpbmFyeS5CSVRTNSAmIGluZm8pICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IGNhbnRDb3B5UGFyZW50SW5mbyA9IChpbmZvICYgKGJpbmFyeS5CSVQ3IHwgYmluYXJ5LkJJVDgpKSA9PT0gMFxuICAgICAgICAvLyBJZiBwYXJlbnQgPSBudWxsIGFuZCBuZWl0aGVyIGxlZnQgbm9yIHJpZ2h0IGFyZSBkZWZpbmVkLCB0aGVuIHdlIGtub3cgdGhhdCBgcGFyZW50YCBpcyBjaGlsZCBvZiBgeWBcbiAgICAgICAgLy8gYW5kIHdlIHJlYWQgdGhlIG5leHQgc3RyaW5nIGFzIHBhcmVudFlLZXkuXG4gICAgICAgIC8vIEl0IGluZGljYXRlcyBob3cgd2Ugc3RvcmUvcmV0cmlldmUgcGFyZW50IGZyb20gYHkuc2hhcmVgXG4gICAgICAgIC8vIEB0eXBlIHtzdHJpbmd8bnVsbH1cbiAgICAgICAgY29uc3Qgc3RydWN0ID0gbmV3IEl0ZW0oXG4gICAgICAgICAgY3JlYXRlSUQoY2xpZW50LCBjbG9jayksXG4gICAgICAgICAgbnVsbCwgLy8gbGVmdFxuICAgICAgICAgIChpbmZvICYgYmluYXJ5LkJJVDgpID09PSBiaW5hcnkuQklUOCA/IGRlY29kZXIucmVhZExlZnRJRCgpIDogbnVsbCwgLy8gb3JpZ2luXG4gICAgICAgICAgbnVsbCwgLy8gcmlnaHRcbiAgICAgICAgICAoaW5mbyAmIGJpbmFyeS5CSVQ3KSA9PT0gYmluYXJ5LkJJVDcgPyBkZWNvZGVyLnJlYWRSaWdodElEKCkgOiBudWxsLCAvLyByaWdodCBvcmlnaW5cbiAgICAgICAgICAvLyBAdHMtaWdub3JlIEZvcmNlIHdyaXRpbmcgYSBzdHJpbmcgaGVyZS5cbiAgICAgICAgICBjYW50Q29weVBhcmVudEluZm8gPyAoZGVjb2Rlci5yZWFkUGFyZW50SW5mbygpID8gZGVjb2Rlci5yZWFkU3RyaW5nKCkgOiBkZWNvZGVyLnJlYWRMZWZ0SUQoKSkgOiBudWxsLCAvLyBwYXJlbnRcbiAgICAgICAgICBjYW50Q29weVBhcmVudEluZm8gJiYgKGluZm8gJiBiaW5hcnkuQklUNikgPT09IGJpbmFyeS5CSVQ2ID8gZGVjb2Rlci5yZWFkU3RyaW5nKCkgOiBudWxsLCAvLyBwYXJlbnRTdWJcbiAgICAgICAgICByZWFkSXRlbUNvbnRlbnQoZGVjb2RlciwgaW5mbykgLy8gaXRlbSBjb250ZW50XG4gICAgICAgIClcbiAgICAgICAgeWllbGQgc3RydWN0XG4gICAgICAgIGNsb2NrICs9IHN0cnVjdC5sZW5ndGhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGxlbiA9IGRlY29kZXIucmVhZExlbigpXG4gICAgICAgIHlpZWxkIG5ldyBHQyhjcmVhdGVJRChjbGllbnQsIGNsb2NrKSwgbGVuKVxuICAgICAgICBjbG9jayArPSBsZW5cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExhenlTdHJ1Y3RSZWFkZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAgICogQHBhcmFtIHtib29sZWFufSBmaWx0ZXJTa2lwc1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGRlY29kZXIsIGZpbHRlclNraXBzKSB7XG4gICAgdGhpcy5nZW4gPSBsYXp5U3RydWN0UmVhZGVyR2VuZXJhdG9yKGRlY29kZXIpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bGwgfCBJdGVtIHwgU2tpcCB8IEdDfVxuICAgICAqL1xuICAgIHRoaXMuY3VyciA9IG51bGxcbiAgICB0aGlzLmRvbmUgPSBmYWxzZVxuICAgIHRoaXMuZmlsdGVyU2tpcHMgPSBmaWx0ZXJTa2lwc1xuICAgIHRoaXMubmV4dCgpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7SXRlbSB8IEdDIHwgU2tpcCB8bnVsbH1cbiAgICovXG4gIG5leHQgKCkge1xuICAgIC8vIGlnbm9yZSBcIlNraXBcIiBzdHJ1Y3RzXG4gICAgZG8ge1xuICAgICAgdGhpcy5jdXJyID0gdGhpcy5nZW4ubmV4dCgpLnZhbHVlIHx8IG51bGxcbiAgICB9IHdoaWxlICh0aGlzLmZpbHRlclNraXBzICYmIHRoaXMuY3VyciAhPT0gbnVsbCAmJiB0aGlzLmN1cnIuY29uc3RydWN0b3IgPT09IFNraXApXG4gICAgcmV0dXJuIHRoaXMuY3VyclxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqXG4gKi9cbmV4cG9ydCBjb25zdCBsb2dVcGRhdGUgPSB1cGRhdGUgPT4gbG9nVXBkYXRlVjIodXBkYXRlLCBVcGRhdGVEZWNvZGVyVjEpXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMiB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjF9IFtZRGVjb2Rlcl1cbiAqXG4gKi9cbmV4cG9ydCBjb25zdCBsb2dVcGRhdGVWMiA9ICh1cGRhdGUsIFlEZWNvZGVyID0gVXBkYXRlRGVjb2RlclYyKSA9PiB7XG4gIGNvbnN0IHN0cnVjdHMgPSBbXVxuICBjb25zdCB1cGRhdGVEZWNvZGVyID0gbmV3IFlEZWNvZGVyKGRlY29kaW5nLmNyZWF0ZURlY29kZXIodXBkYXRlKSlcbiAgY29uc3QgbGF6eURlY29kZXIgPSBuZXcgTGF6eVN0cnVjdFJlYWRlcih1cGRhdGVEZWNvZGVyLCBmYWxzZSlcbiAgZm9yIChsZXQgY3VyciA9IGxhenlEZWNvZGVyLmN1cnI7IGN1cnIgIT09IG51bGw7IGN1cnIgPSBsYXp5RGVjb2Rlci5uZXh0KCkpIHtcbiAgICBzdHJ1Y3RzLnB1c2goY3VycilcbiAgfVxuICBsb2dnaW5nLnByaW50KCdTdHJ1Y3RzOiAnLCBzdHJ1Y3RzKVxuICBjb25zdCBkcyA9IHJlYWREZWxldGVTZXQodXBkYXRlRGVjb2RlcilcbiAgbG9nZ2luZy5wcmludCgnRGVsZXRlU2V0OiAnLCBkcylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICpcbiAqL1xuZXhwb3J0IGNvbnN0IGRlY29kZVVwZGF0ZSA9ICh1cGRhdGUpID0+IGRlY29kZVVwZGF0ZVYyKHVwZGF0ZSwgVXBkYXRlRGVjb2RlclYxKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge3R5cGVvZiBVcGRhdGVEZWNvZGVyVjIgfCB0eXBlb2YgVXBkYXRlRGVjb2RlclYxfSBbWURlY29kZXJdXG4gKlxuICovXG5leHBvcnQgY29uc3QgZGVjb2RlVXBkYXRlVjIgPSAodXBkYXRlLCBZRGVjb2RlciA9IFVwZGF0ZURlY29kZXJWMikgPT4ge1xuICBjb25zdCBzdHJ1Y3RzID0gW11cbiAgY29uc3QgdXBkYXRlRGVjb2RlciA9IG5ldyBZRGVjb2RlcihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSkpXG4gIGNvbnN0IGxhenlEZWNvZGVyID0gbmV3IExhenlTdHJ1Y3RSZWFkZXIodXBkYXRlRGVjb2RlciwgZmFsc2UpXG4gIGZvciAobGV0IGN1cnIgPSBsYXp5RGVjb2Rlci5jdXJyOyBjdXJyICE9PSBudWxsOyBjdXJyID0gbGF6eURlY29kZXIubmV4dCgpKSB7XG4gICAgc3RydWN0cy5wdXNoKGN1cnIpXG4gIH1cbiAgcmV0dXJuIHtcbiAgICBzdHJ1Y3RzLFxuICAgIGRzOiByZWFkRGVsZXRlU2V0KHVwZGF0ZURlY29kZXIpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExhenlTdHJ1Y3RXcml0ZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yIChlbmNvZGVyKSB7XG4gICAgdGhpcy5jdXJyQ2xpZW50ID0gMFxuICAgIHRoaXMuc3RhcnRDbG9jayA9IDBcbiAgICB0aGlzLndyaXR0ZW4gPSAwXG4gICAgdGhpcy5lbmNvZGVyID0gZW5jb2RlclxuICAgIC8qKlxuICAgICAqIFdlIHdhbnQgdG8gd3JpdGUgb3BlcmF0aW9ucyBsYXppbHksIGJ1dCBhbHNvIHdlIG5lZWQgdG8ga25vdyBiZWZvcmVoYW5kIGhvdyBtYW55IG9wZXJhdGlvbnMgd2Ugd2FudCB0byB3cml0ZSBmb3IgZWFjaCBjbGllbnQuXG4gICAgICpcbiAgICAgKiBUaGlzIGtpbmQgb2YgbWV0YS1pbmZvcm1hdGlvbiAoI2NsaWVudHMsICNzdHJ1Y3RzLXBlci1jbGllbnQtd3JpdHRlbikgaXMgd3JpdHRlbiB0byB0aGUgcmVzdEVuY29kZXIuXG4gICAgICpcbiAgICAgKiBXZSBmcmFnbWVudCB0aGUgcmVzdEVuY29kZXIgYW5kIHN0b3JlIGEgc2xpY2Ugb2YgaXQgcGVyLWNsaWVudCB1bnRpbCB3ZSBrbm93IGhvdyBtYW55IGNsaWVudHMgdGhlcmUgYXJlLlxuICAgICAqIFdoZW4gd2UgZmx1c2ggKHRvVWludDhBcnJheSkgd2Ugd3JpdGUgdGhlIHJlc3RFbmNvZGVyIHVzaW5nIHRoZSBmcmFnbWVudHMgYW5kIHRoZSBtZXRhLWluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHR5cGUge0FycmF5PHsgd3JpdHRlbjogbnVtYmVyLCByZXN0RW5jb2RlcjogVWludDhBcnJheSB9Pn1cbiAgICAgKi9cbiAgICB0aGlzLmNsaWVudFN0cnVjdHMgPSBbXVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxVaW50OEFycmF5Pn0gdXBkYXRlc1xuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IG1lcmdlVXBkYXRlcyA9IHVwZGF0ZXMgPT4gbWVyZ2VVcGRhdGVzVjIodXBkYXRlcywgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVFbmNvZGVyVjEpXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7dHlwZW9mIERTRW5jb2RlclYxIHwgdHlwZW9mIERTRW5jb2RlclYyfSBZRW5jb2RlclxuICogQHBhcmFtIHt0eXBlb2YgVXBkYXRlRGVjb2RlclYxIHwgdHlwZW9mIFVwZGF0ZURlY29kZXJWMn0gWURlY29kZXJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVTdGF0ZVZlY3RvckZyb21VcGRhdGVWMiA9ICh1cGRhdGUsIFlFbmNvZGVyID0gRFNFbmNvZGVyVjIsIFlEZWNvZGVyID0gVXBkYXRlRGVjb2RlclYyKSA9PiB7XG4gIGNvbnN0IGVuY29kZXIgPSBuZXcgWUVuY29kZXIoKVxuICBjb25zdCB1cGRhdGVEZWNvZGVyID0gbmV3IExhenlTdHJ1Y3RSZWFkZXIobmV3IFlEZWNvZGVyKGRlY29kaW5nLmNyZWF0ZURlY29kZXIodXBkYXRlKSksIGZhbHNlKVxuICBsZXQgY3VyciA9IHVwZGF0ZURlY29kZXIuY3VyclxuICBpZiAoY3VyciAhPT0gbnVsbCkge1xuICAgIGxldCBzaXplID0gMFxuICAgIGxldCBjdXJyQ2xpZW50ID0gY3Vyci5pZC5jbGllbnRcbiAgICBsZXQgc3RvcENvdW50aW5nID0gY3Vyci5pZC5jbG9jayAhPT0gMCAvLyBtdXN0IHN0YXJ0IGF0IDBcbiAgICBsZXQgY3VyckNsb2NrID0gc3RvcENvdW50aW5nID8gMCA6IGN1cnIuaWQuY2xvY2sgKyBjdXJyLmxlbmd0aFxuICAgIGZvciAoOyBjdXJyICE9PSBudWxsOyBjdXJyID0gdXBkYXRlRGVjb2Rlci5uZXh0KCkpIHtcbiAgICAgIGlmIChjdXJyQ2xpZW50ICE9PSBjdXJyLmlkLmNsaWVudCkge1xuICAgICAgICBpZiAoY3VyckNsb2NrICE9PSAwKSB7XG4gICAgICAgICAgc2l6ZSsrXG4gICAgICAgICAgLy8gV2UgZm91bmQgYSBuZXcgY2xpZW50XG4gICAgICAgICAgLy8gd3JpdGUgd2hhdCB3ZSBoYXZlIHRvIHRoZSBlbmNvZGVyXG4gICAgICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGN1cnJDbGllbnQpXG4gICAgICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGN1cnJDbG9jaylcbiAgICAgICAgfVxuICAgICAgICBjdXJyQ2xpZW50ID0gY3Vyci5pZC5jbGllbnRcbiAgICAgICAgY3VyckNsb2NrID0gMFxuICAgICAgICBzdG9wQ291bnRpbmcgPSBjdXJyLmlkLmNsb2NrICE9PSAwXG4gICAgICB9XG4gICAgICAvLyB3ZSBpZ25vcmUgc2tpcHNcbiAgICAgIGlmIChjdXJyLmNvbnN0cnVjdG9yID09PSBTa2lwKSB7XG4gICAgICAgIHN0b3BDb3VudGluZyA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmICghc3RvcENvdW50aW5nKSB7XG4gICAgICAgIGN1cnJDbG9jayA9IGN1cnIuaWQuY2xvY2sgKyBjdXJyLmxlbmd0aFxuICAgICAgfVxuICAgIH1cbiAgICAvLyB3cml0ZSB3aGF0IHdlIGhhdmVcbiAgICBpZiAoY3VyckNsb2NrICE9PSAwKSB7XG4gICAgICBzaXplKytcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCBjdXJyQ2xpZW50KVxuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIucmVzdEVuY29kZXIsIGN1cnJDbG9jaylcbiAgICB9XG4gICAgLy8gcHJlcGVuZCB0aGUgc2l6ZSBvZiB0aGUgc3RhdGUgdmVjdG9yXG4gICAgY29uc3QgZW5jID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuYywgc2l6ZSlcbiAgICBlbmNvZGluZy53cml0ZUJpbmFyeUVuY29kZXIoZW5jLCBlbmNvZGVyLnJlc3RFbmNvZGVyKVxuICAgIGVuY29kZXIucmVzdEVuY29kZXIgPSBlbmNcbiAgICByZXR1cm4gZW5jb2Rlci50b1VpbnQ4QXJyYXkoKVxuICB9IGVsc2Uge1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLnJlc3RFbmNvZGVyLCAwKVxuICAgIHJldHVybiBlbmNvZGVyLnRvVWludDhBcnJheSgpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZVN0YXRlVmVjdG9yRnJvbVVwZGF0ZSA9IHVwZGF0ZSA9PiBlbmNvZGVTdGF0ZVZlY3RvckZyb21VcGRhdGVWMih1cGRhdGUsIERTRW5jb2RlclYxLCBVcGRhdGVEZWNvZGVyVjEpXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMSB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjJ9IFlEZWNvZGVyXG4gKiBAcmV0dXJuIHt7IGZyb206IE1hcDxudW1iZXIsbnVtYmVyPiwgdG86IE1hcDxudW1iZXIsbnVtYmVyPiB9fVxuICovXG5leHBvcnQgY29uc3QgcGFyc2VVcGRhdGVNZXRhVjIgPSAodXBkYXRlLCBZRGVjb2RlciA9IFVwZGF0ZURlY29kZXJWMikgPT4ge1xuICAvKipcbiAgICogQHR5cGUge01hcDxudW1iZXIsIG51bWJlcj59XG4gICAqL1xuICBjb25zdCBmcm9tID0gbmV3IE1hcCgpXG4gIC8qKlxuICAgKiBAdHlwZSB7TWFwPG51bWJlciwgbnVtYmVyPn1cbiAgICovXG4gIGNvbnN0IHRvID0gbmV3IE1hcCgpXG4gIGNvbnN0IHVwZGF0ZURlY29kZXIgPSBuZXcgTGF6eVN0cnVjdFJlYWRlcihuZXcgWURlY29kZXIoZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpKSwgZmFsc2UpXG4gIGxldCBjdXJyID0gdXBkYXRlRGVjb2Rlci5jdXJyXG4gIGlmIChjdXJyICE9PSBudWxsKSB7XG4gICAgbGV0IGN1cnJDbGllbnQgPSBjdXJyLmlkLmNsaWVudFxuICAgIGxldCBjdXJyQ2xvY2sgPSBjdXJyLmlkLmNsb2NrXG4gICAgLy8gd3JpdGUgdGhlIGJlZ2lubmluZyB0byBgZnJvbWBcbiAgICBmcm9tLnNldChjdXJyQ2xpZW50LCBjdXJyQ2xvY2spXG4gICAgZm9yICg7IGN1cnIgIT09IG51bGw7IGN1cnIgPSB1cGRhdGVEZWNvZGVyLm5leHQoKSkge1xuICAgICAgaWYgKGN1cnJDbGllbnQgIT09IGN1cnIuaWQuY2xpZW50KSB7XG4gICAgICAgIC8vIFdlIGZvdW5kIGEgbmV3IGNsaWVudFxuICAgICAgICAvLyB3cml0ZSB0aGUgZW5kIHRvIGB0b2BcbiAgICAgICAgdG8uc2V0KGN1cnJDbGllbnQsIGN1cnJDbG9jaylcbiAgICAgICAgLy8gd3JpdGUgdGhlIGJlZ2lubmluZyB0byBgZnJvbWBcbiAgICAgICAgZnJvbS5zZXQoY3Vyci5pZC5jbGllbnQsIGN1cnIuaWQuY2xvY2spXG4gICAgICAgIC8vIHVwZGF0ZSBjdXJyQ2xpZW50XG4gICAgICAgIGN1cnJDbGllbnQgPSBjdXJyLmlkLmNsaWVudFxuICAgICAgfVxuICAgICAgY3VyckNsb2NrID0gY3Vyci5pZC5jbG9jayArIGN1cnIubGVuZ3RoXG4gICAgfVxuICAgIC8vIHdyaXRlIHRoZSBlbmQgdG8gYHRvYFxuICAgIHRvLnNldChjdXJyQ2xpZW50LCBjdXJyQ2xvY2spXG4gIH1cbiAgcmV0dXJuIHsgZnJvbSwgdG8gfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcmV0dXJuIHt7IGZyb206IE1hcDxudW1iZXIsbnVtYmVyPiwgdG86IE1hcDxudW1iZXIsbnVtYmVyPiB9fVxuICovXG5leHBvcnQgY29uc3QgcGFyc2VVcGRhdGVNZXRhID0gdXBkYXRlID0+IHBhcnNlVXBkYXRlTWV0YVYyKHVwZGF0ZSwgVXBkYXRlRGVjb2RlclYxKVxuXG4vKipcbiAqIFRoaXMgbWV0aG9kIGlzIGludGVuZGVkIHRvIHNsaWNlIGFueSBraW5kIG9mIHN0cnVjdCBhbmQgcmV0cmlldmUgdGhlIHJpZ2h0IHBhcnQuXG4gKiBJdCBkb2VzIG5vdCBoYW5kbGUgc2lkZS1lZmZlY3RzLCBzbyBpdCBzaG91bGQgb25seSBiZSB1c2VkIGJ5IHRoZSBsYXp5LWVuY29kZXIuXG4gKlxuICogQHBhcmFtIHtJdGVtIHwgR0MgfCBTa2lwfSBsZWZ0XG4gKiBAcGFyYW0ge251bWJlcn0gZGlmZlxuICogQHJldHVybiB7SXRlbSB8IEdDfVxuICovXG5jb25zdCBzbGljZVN0cnVjdCA9IChsZWZ0LCBkaWZmKSA9PiB7XG4gIGlmIChsZWZ0LmNvbnN0cnVjdG9yID09PSBHQykge1xuICAgIGNvbnN0IHsgY2xpZW50LCBjbG9jayB9ID0gbGVmdC5pZFxuICAgIHJldHVybiBuZXcgR0MoY3JlYXRlSUQoY2xpZW50LCBjbG9jayArIGRpZmYpLCBsZWZ0Lmxlbmd0aCAtIGRpZmYpXG4gIH0gZWxzZSBpZiAobGVmdC5jb25zdHJ1Y3RvciA9PT0gU2tpcCkge1xuICAgIGNvbnN0IHsgY2xpZW50LCBjbG9jayB9ID0gbGVmdC5pZFxuICAgIHJldHVybiBuZXcgU2tpcChjcmVhdGVJRChjbGllbnQsIGNsb2NrICsgZGlmZiksIGxlZnQubGVuZ3RoIC0gZGlmZilcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBsZWZ0SXRlbSA9IC8qKiBAdHlwZSB7SXRlbX0gKi8gKGxlZnQpXG4gICAgY29uc3QgeyBjbGllbnQsIGNsb2NrIH0gPSBsZWZ0SXRlbS5pZFxuICAgIHJldHVybiBuZXcgSXRlbShcbiAgICAgIGNyZWF0ZUlEKGNsaWVudCwgY2xvY2sgKyBkaWZmKSxcbiAgICAgIG51bGwsXG4gICAgICBjcmVhdGVJRChjbGllbnQsIGNsb2NrICsgZGlmZiAtIDEpLFxuICAgICAgbnVsbCxcbiAgICAgIGxlZnRJdGVtLnJpZ2h0T3JpZ2luLFxuICAgICAgbGVmdEl0ZW0ucGFyZW50LFxuICAgICAgbGVmdEl0ZW0ucGFyZW50U3ViLFxuICAgICAgbGVmdEl0ZW0uY29udGVudC5zcGxpY2UoZGlmZilcbiAgICApXG4gIH1cbn1cblxuLyoqXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3b3JrcyBzaW1pbGFybHkgdG8gYHJlYWRVcGRhdGVWMmAuXG4gKlxuICogQHBhcmFtIHtBcnJheTxVaW50OEFycmF5Pn0gdXBkYXRlc1xuICogQHBhcmFtIHt0eXBlb2YgVXBkYXRlRGVjb2RlclYxIHwgdHlwZW9mIFVwZGF0ZURlY29kZXJWMn0gW1lEZWNvZGVyXVxuICogQHBhcmFtIHt0eXBlb2YgVXBkYXRlRW5jb2RlclYxIHwgdHlwZW9mIFVwZGF0ZUVuY29kZXJWMn0gW1lFbmNvZGVyXVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IG1lcmdlVXBkYXRlc1YyID0gKHVwZGF0ZXMsIFlEZWNvZGVyID0gVXBkYXRlRGVjb2RlclYyLCBZRW5jb2RlciA9IFVwZGF0ZUVuY29kZXJWMikgPT4ge1xuICBpZiAodXBkYXRlcy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gdXBkYXRlc1swXVxuICB9XG4gIGNvbnN0IHVwZGF0ZURlY29kZXJzID0gdXBkYXRlcy5tYXAodXBkYXRlID0+IG5ldyBZRGVjb2RlcihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSkpKVxuICBsZXQgbGF6eVN0cnVjdERlY29kZXJzID0gdXBkYXRlRGVjb2RlcnMubWFwKGRlY29kZXIgPT4gbmV3IExhenlTdHJ1Y3RSZWFkZXIoZGVjb2RlciwgdHJ1ZSkpXG5cbiAgLyoqXG4gICAqIEB0b2RvIHdlIGRvbid0IG5lZWQgb2Zmc2V0IGJlY2F1c2Ugd2UgYWx3YXlzIHNsaWNlIGJlZm9yZVxuICAgKiBAdHlwZSB7bnVsbCB8IHsgc3RydWN0OiBJdGVtIHwgR0MgfCBTa2lwLCBvZmZzZXQ6IG51bWJlciB9fVxuICAgKi9cbiAgbGV0IGN1cnJXcml0ZSA9IG51bGxcblxuICBjb25zdCB1cGRhdGVFbmNvZGVyID0gbmV3IFlFbmNvZGVyKClcbiAgLy8gd3JpdGUgc3RydWN0cyBsYXppbHlcbiAgY29uc3QgbGF6eVN0cnVjdEVuY29kZXIgPSBuZXcgTGF6eVN0cnVjdFdyaXRlcih1cGRhdGVFbmNvZGVyKVxuXG4gIC8vIE5vdGU6IFdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgYWxsIGxhenlTdHJ1Y3REZWNvZGVycyBhcmUgZnVsbHkgY29uc3VtZWRcbiAgLy8gTm90ZTogU2hvdWxkIG1lcmdlIGRvY3VtZW50IHVwZGF0ZXMgd2hlbmV2ZXIgcG9zc2libGUgLSBldmVuIGZyb20gZGlmZmVyZW50IHVwZGF0ZXNcbiAgLy8gTm90ZTogU2hvdWxkIGhhbmRsZSB0aGF0IHNvbWUgb3BlcmF0aW9ucyBjYW5ub3QgYmUgYXBwbGllZCB5ZXQgKClcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIC8vIFdyaXRlIGhpZ2hlciBjbGllbnRzIGZpcnN0IFx1MjFEMiBzb3J0IGJ5IGNsaWVudElEICYgY2xvY2sgYW5kIHJlbW92ZSBkZWNvZGVycyB3aXRob3V0IGNvbnRlbnRcbiAgICBsYXp5U3RydWN0RGVjb2RlcnMgPSBsYXp5U3RydWN0RGVjb2RlcnMuZmlsdGVyKGRlYyA9PiBkZWMuY3VyciAhPT0gbnVsbClcbiAgICBsYXp5U3RydWN0RGVjb2RlcnMuc29ydChcbiAgICAgIC8qKiBAdHlwZSB7ZnVuY3Rpb24oYW55LGFueSk6bnVtYmVyfSAqLyAoZGVjMSwgZGVjMikgPT4ge1xuICAgICAgICBpZiAoZGVjMS5jdXJyLmlkLmNsaWVudCA9PT0gZGVjMi5jdXJyLmlkLmNsaWVudCkge1xuICAgICAgICAgIGNvbnN0IGNsb2NrRGlmZiA9IGRlYzEuY3Vyci5pZC5jbG9jayAtIGRlYzIuY3Vyci5pZC5jbG9ja1xuICAgICAgICAgIGlmIChjbG9ja0RpZmYgPT09IDApIHtcbiAgICAgICAgICAgIC8vIEB0b2RvIHJlbW92ZSByZWZlcmVuY2VzIHRvIHNraXAgc2luY2UgdGhlIHN0cnVjdERlY29kZXJzIG11c3QgZmlsdGVyIFNraXBzLlxuICAgICAgICAgICAgcmV0dXJuIGRlYzEuY3Vyci5jb25zdHJ1Y3RvciA9PT0gZGVjMi5jdXJyLmNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICA6IGRlYzEuY3Vyci5jb25zdHJ1Y3RvciA9PT0gU2tpcCA/IDEgOiAtMSAvLyB3ZSBhcmUgZmlsdGVyaW5nIHNraXBzIGFueXdheS5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNsb2NrRGlmZlxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZGVjMi5jdXJyLmlkLmNsaWVudCAtIGRlYzEuY3Vyci5pZC5jbGllbnRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgICBpZiAobGF6eVN0cnVjdERlY29kZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gICAgY29uc3QgY3VyckRlY29kZXIgPSBsYXp5U3RydWN0RGVjb2RlcnNbMF1cbiAgICAvLyB3cml0ZSBmcm9tIGN1cnJEZWNvZGVyIHVudGlsIHRoZSBuZXh0IG9wZXJhdGlvbiBpcyBmcm9tIGFub3RoZXIgY2xpZW50IG9yIGlmIGZpbGxlci1zdHJ1Y3RcbiAgICAvLyB0aGVuIHdlIG5lZWQgdG8gcmVvcmRlciB0aGUgZGVjb2RlcnMgYW5kIGZpbmQgdGhlIG5leHQgb3BlcmF0aW9uIHRvIHdyaXRlXG4gICAgY29uc3QgZmlyc3RDbGllbnQgPSAvKiogQHR5cGUge0l0ZW0gfCBHQ30gKi8gKGN1cnJEZWNvZGVyLmN1cnIpLmlkLmNsaWVudFxuXG4gICAgaWYgKGN1cnJXcml0ZSAhPT0gbnVsbCkge1xuICAgICAgbGV0IGN1cnIgPSAvKiogQHR5cGUge0l0ZW0gfCBHQyB8IG51bGx9ICovIChjdXJyRGVjb2Rlci5jdXJyKVxuICAgICAgbGV0IGl0ZXJhdGVkID0gZmFsc2VcblxuICAgICAgLy8gaXRlcmF0ZSB1bnRpbCB3ZSBmaW5kIHNvbWV0aGluZyB0aGF0IHdlIGhhdmVuJ3Qgd3JpdHRlbiBhbHJlYWR5XG4gICAgICAvLyByZW1lbWJlcjogZmlyc3QgdGhlIGhpZ2ggY2xpZW50LWlkcyBhcmUgd3JpdHRlblxuICAgICAgd2hpbGUgKGN1cnIgIT09IG51bGwgJiYgY3Vyci5pZC5jbG9jayArIGN1cnIubGVuZ3RoIDw9IGN1cnJXcml0ZS5zdHJ1Y3QuaWQuY2xvY2sgKyBjdXJyV3JpdGUuc3RydWN0Lmxlbmd0aCAmJiBjdXJyLmlkLmNsaWVudCA+PSBjdXJyV3JpdGUuc3RydWN0LmlkLmNsaWVudCkge1xuICAgICAgICBjdXJyID0gY3VyckRlY29kZXIubmV4dCgpXG4gICAgICAgIGl0ZXJhdGVkID0gdHJ1ZVxuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICBjdXJyID09PSBudWxsIHx8IC8vIGN1cnJlbnQgZGVjb2RlciBpcyBlbXB0eVxuICAgICAgICBjdXJyLmlkLmNsaWVudCAhPT0gZmlyc3RDbGllbnQgfHwgLy8gY2hlY2sgd2hldGhlciB0aGVyZSBpcyBhbm90aGVyIGRlY29kZXIgdGhhdCBoYXMgaGFzIHVwZGF0ZXMgZnJvbSBgZmlyc3RDbGllbnRgXG4gICAgICAgIChpdGVyYXRlZCAmJiBjdXJyLmlkLmNsb2NrID4gY3VycldyaXRlLnN0cnVjdC5pZC5jbG9jayArIGN1cnJXcml0ZS5zdHJ1Y3QubGVuZ3RoKSAvLyB0aGUgYWJvdmUgd2hpbGUgbG9vcCB3YXMgdXNlZCBhbmQgd2UgYXJlIHBvdGVudGlhbGx5IG1pc3NpbmcgdXBkYXRlc1xuICAgICAgKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGlmIChmaXJzdENsaWVudCAhPT0gY3VycldyaXRlLnN0cnVjdC5pZC5jbGllbnQpIHtcbiAgICAgICAgd3JpdGVTdHJ1Y3RUb0xhenlTdHJ1Y3RXcml0ZXIobGF6eVN0cnVjdEVuY29kZXIsIGN1cnJXcml0ZS5zdHJ1Y3QsIGN1cnJXcml0ZS5vZmZzZXQpXG4gICAgICAgIGN1cnJXcml0ZSA9IHsgc3RydWN0OiBjdXJyLCBvZmZzZXQ6IDAgfVxuICAgICAgICBjdXJyRGVjb2Rlci5uZXh0KClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrICsgY3VycldyaXRlLnN0cnVjdC5sZW5ndGggPCBjdXJyLmlkLmNsb2NrKSB7XG4gICAgICAgICAgLy8gQHRvZG8gd3JpdGUgY3VyclN0cnVjdCAmIHNldCBjdXJyU3RydWN0ID0gU2tpcChjbG9jayA9IGN1cnJTdHJ1Y3QuaWQuY2xvY2sgKyBjdXJyU3RydWN0Lmxlbmd0aCwgbGVuZ3RoID0gY3Vyci5pZC5jbG9jayAtIHNlbGYuY2xvY2spXG4gICAgICAgICAgaWYgKGN1cnJXcml0ZS5zdHJ1Y3QuY29uc3RydWN0b3IgPT09IFNraXApIHtcbiAgICAgICAgICAgIC8vIGV4dGVuZCBleGlzdGluZyBza2lwXG4gICAgICAgICAgICBjdXJyV3JpdGUuc3RydWN0Lmxlbmd0aCA9IGN1cnIuaWQuY2xvY2sgKyBjdXJyLmxlbmd0aCAtIGN1cnJXcml0ZS5zdHJ1Y3QuaWQuY2xvY2tcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd3JpdGVTdHJ1Y3RUb0xhenlTdHJ1Y3RXcml0ZXIobGF6eVN0cnVjdEVuY29kZXIsIGN1cnJXcml0ZS5zdHJ1Y3QsIGN1cnJXcml0ZS5vZmZzZXQpXG4gICAgICAgICAgICBjb25zdCBkaWZmID0gY3Vyci5pZC5jbG9jayAtIGN1cnJXcml0ZS5zdHJ1Y3QuaWQuY2xvY2sgLSBjdXJyV3JpdGUuc3RydWN0Lmxlbmd0aFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAdHlwZSB7U2tpcH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29uc3Qgc3RydWN0ID0gbmV3IFNraXAoY3JlYXRlSUQoZmlyc3RDbGllbnQsIGN1cnJXcml0ZS5zdHJ1Y3QuaWQuY2xvY2sgKyBjdXJyV3JpdGUuc3RydWN0Lmxlbmd0aCksIGRpZmYpXG4gICAgICAgICAgICBjdXJyV3JpdGUgPSB7IHN0cnVjdCwgb2Zmc2V0OiAwIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIGlmIChjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrICsgY3VycldyaXRlLnN0cnVjdC5sZW5ndGggPj0gY3Vyci5pZC5jbG9jaykge1xuICAgICAgICAgIGNvbnN0IGRpZmYgPSBjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrICsgY3VycldyaXRlLnN0cnVjdC5sZW5ndGggLSBjdXJyLmlkLmNsb2NrXG4gICAgICAgICAgaWYgKGRpZmYgPiAwKSB7XG4gICAgICAgICAgICBpZiAoY3VycldyaXRlLnN0cnVjdC5jb25zdHJ1Y3RvciA9PT0gU2tpcCkge1xuICAgICAgICAgICAgICAvLyBwcmVmZXIgdG8gc2xpY2UgU2tpcCBiZWNhdXNlIHRoZSBvdGhlciBzdHJ1Y3QgbWlnaHQgY29udGFpbiBtb3JlIGluZm9ybWF0aW9uXG4gICAgICAgICAgICAgIGN1cnJXcml0ZS5zdHJ1Y3QubGVuZ3RoIC09IGRpZmZcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGN1cnIgPSBzbGljZVN0cnVjdChjdXJyLCBkaWZmKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWN1cnJXcml0ZS5zdHJ1Y3QubWVyZ2VXaXRoKC8qKiBAdHlwZSB7YW55fSAqLyAoY3VycikpKSB7XG4gICAgICAgICAgICB3cml0ZVN0cnVjdFRvTGF6eVN0cnVjdFdyaXRlcihsYXp5U3RydWN0RW5jb2RlciwgY3VycldyaXRlLnN0cnVjdCwgY3VycldyaXRlLm9mZnNldClcbiAgICAgICAgICAgIGN1cnJXcml0ZSA9IHsgc3RydWN0OiBjdXJyLCBvZmZzZXQ6IDAgfVxuICAgICAgICAgICAgY3VyckRlY29kZXIubmV4dCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJXcml0ZSA9IHsgc3RydWN0OiAvKiogQHR5cGUge0l0ZW0gfCBHQ30gKi8gKGN1cnJEZWNvZGVyLmN1cnIpLCBvZmZzZXQ6IDAgfVxuICAgICAgY3VyckRlY29kZXIubmV4dCgpXG4gICAgfVxuICAgIGZvciAoXG4gICAgICBsZXQgbmV4dCA9IGN1cnJEZWNvZGVyLmN1cnI7XG4gICAgICBuZXh0ICE9PSBudWxsICYmIG5leHQuaWQuY2xpZW50ID09PSBmaXJzdENsaWVudCAmJiBuZXh0LmlkLmNsb2NrID09PSBjdXJyV3JpdGUuc3RydWN0LmlkLmNsb2NrICsgY3VycldyaXRlLnN0cnVjdC5sZW5ndGggJiYgbmV4dC5jb25zdHJ1Y3RvciAhPT0gU2tpcDtcbiAgICAgIG5leHQgPSBjdXJyRGVjb2Rlci5uZXh0KClcbiAgICApIHtcbiAgICAgIHdyaXRlU3RydWN0VG9MYXp5U3RydWN0V3JpdGVyKGxhenlTdHJ1Y3RFbmNvZGVyLCBjdXJyV3JpdGUuc3RydWN0LCBjdXJyV3JpdGUub2Zmc2V0KVxuICAgICAgY3VycldyaXRlID0geyBzdHJ1Y3Q6IG5leHQsIG9mZnNldDogMCB9XG4gICAgfVxuICB9XG4gIGlmIChjdXJyV3JpdGUgIT09IG51bGwpIHtcbiAgICB3cml0ZVN0cnVjdFRvTGF6eVN0cnVjdFdyaXRlcihsYXp5U3RydWN0RW5jb2RlciwgY3VycldyaXRlLnN0cnVjdCwgY3VycldyaXRlLm9mZnNldClcbiAgICBjdXJyV3JpdGUgPSBudWxsXG4gIH1cbiAgZmluaXNoTGF6eVN0cnVjdFdyaXRpbmcobGF6eVN0cnVjdEVuY29kZXIpXG5cbiAgY29uc3QgZHNzID0gdXBkYXRlRGVjb2RlcnMubWFwKGRlY29kZXIgPT4gcmVhZERlbGV0ZVNldChkZWNvZGVyKSlcbiAgY29uc3QgZHMgPSBtZXJnZURlbGV0ZVNldHMoZHNzKVxuICB3cml0ZURlbGV0ZVNldCh1cGRhdGVFbmNvZGVyLCBkcylcbiAgcmV0dXJuIHVwZGF0ZUVuY29kZXIudG9VaW50OEFycmF5KClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBzdlxuICogQHBhcmFtIHt0eXBlb2YgVXBkYXRlRGVjb2RlclYxIHwgdHlwZW9mIFVwZGF0ZURlY29kZXJWMn0gW1lEZWNvZGVyXVxuICogQHBhcmFtIHt0eXBlb2YgVXBkYXRlRW5jb2RlclYxIHwgdHlwZW9mIFVwZGF0ZUVuY29kZXJWMn0gW1lFbmNvZGVyXVxuICovXG5leHBvcnQgY29uc3QgZGlmZlVwZGF0ZVYyID0gKHVwZGF0ZSwgc3YsIFlEZWNvZGVyID0gVXBkYXRlRGVjb2RlclYyLCBZRW5jb2RlciA9IFVwZGF0ZUVuY29kZXJWMikgPT4ge1xuICBjb25zdCBzdGF0ZSA9IGRlY29kZVN0YXRlVmVjdG9yKHN2KVxuICBjb25zdCBlbmNvZGVyID0gbmV3IFlFbmNvZGVyKClcbiAgY29uc3QgbGF6eVN0cnVjdFdyaXRlciA9IG5ldyBMYXp5U3RydWN0V3JpdGVyKGVuY29kZXIpXG4gIGNvbnN0IGRlY29kZXIgPSBuZXcgWURlY29kZXIoZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpKVxuICBjb25zdCByZWFkZXIgPSBuZXcgTGF6eVN0cnVjdFJlYWRlcihkZWNvZGVyLCBmYWxzZSlcbiAgd2hpbGUgKHJlYWRlci5jdXJyKSB7XG4gICAgY29uc3QgY3VyciA9IHJlYWRlci5jdXJyXG4gICAgY29uc3QgY3VyckNsaWVudCA9IGN1cnIuaWQuY2xpZW50XG4gICAgY29uc3Qgc3ZDbG9jayA9IHN0YXRlLmdldChjdXJyQ2xpZW50KSB8fCAwXG4gICAgaWYgKHJlYWRlci5jdXJyLmNvbnN0cnVjdG9yID09PSBTa2lwKSB7XG4gICAgICAvLyB0aGUgZmlyc3Qgd3JpdHRlbiBzdHJ1Y3Qgc2hvdWxkbid0IGJlIGEgc2tpcFxuICAgICAgcmVhZGVyLm5leHQoKVxuICAgICAgY29udGludWVcbiAgICB9XG4gICAgaWYgKGN1cnIuaWQuY2xvY2sgKyBjdXJyLmxlbmd0aCA+IHN2Q2xvY2spIHtcbiAgICAgIHdyaXRlU3RydWN0VG9MYXp5U3RydWN0V3JpdGVyKGxhenlTdHJ1Y3RXcml0ZXIsIGN1cnIsIG1hdGgubWF4KHN2Q2xvY2sgLSBjdXJyLmlkLmNsb2NrLCAwKSlcbiAgICAgIHJlYWRlci5uZXh0KClcbiAgICAgIHdoaWxlIChyZWFkZXIuY3VyciAmJiByZWFkZXIuY3Vyci5pZC5jbGllbnQgPT09IGN1cnJDbGllbnQpIHtcbiAgICAgICAgd3JpdGVTdHJ1Y3RUb0xhenlTdHJ1Y3RXcml0ZXIobGF6eVN0cnVjdFdyaXRlciwgcmVhZGVyLmN1cnIsIDApXG4gICAgICAgIHJlYWRlci5uZXh0KClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcmVhZCB1bnRpbCBzb21ldGhpbmcgbmV3IGNvbWVzIHVwXG4gICAgICB3aGlsZSAocmVhZGVyLmN1cnIgJiYgcmVhZGVyLmN1cnIuaWQuY2xpZW50ID09PSBjdXJyQ2xpZW50ICYmIHJlYWRlci5jdXJyLmlkLmNsb2NrICsgcmVhZGVyLmN1cnIubGVuZ3RoIDw9IHN2Q2xvY2spIHtcbiAgICAgICAgcmVhZGVyLm5leHQoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBmaW5pc2hMYXp5U3RydWN0V3JpdGluZyhsYXp5U3RydWN0V3JpdGVyKVxuICAvLyB3cml0ZSBkc1xuICBjb25zdCBkcyA9IHJlYWREZWxldGVTZXQoZGVjb2RlcilcbiAgd3JpdGVEZWxldGVTZXQoZW5jb2RlciwgZHMpXG4gIHJldHVybiBlbmNvZGVyLnRvVWludDhBcnJheSgpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gc3ZcbiAqL1xuZXhwb3J0IGNvbnN0IGRpZmZVcGRhdGUgPSAodXBkYXRlLCBzdikgPT4gZGlmZlVwZGF0ZVYyKHVwZGF0ZSwgc3YsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRW5jb2RlclYxKVxuXG4vKipcbiAqIEBwYXJhbSB7TGF6eVN0cnVjdFdyaXRlcn0gbGF6eVdyaXRlclxuICovXG5jb25zdCBmbHVzaExhenlTdHJ1Y3RXcml0ZXIgPSBsYXp5V3JpdGVyID0+IHtcbiAgaWYgKGxhenlXcml0ZXIud3JpdHRlbiA+IDApIHtcbiAgICBsYXp5V3JpdGVyLmNsaWVudFN0cnVjdHMucHVzaCh7IHdyaXR0ZW46IGxhenlXcml0ZXIud3JpdHRlbiwgcmVzdEVuY29kZXI6IGVuY29kaW5nLnRvVWludDhBcnJheShsYXp5V3JpdGVyLmVuY29kZXIucmVzdEVuY29kZXIpIH0pXG4gICAgbGF6eVdyaXRlci5lbmNvZGVyLnJlc3RFbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgbGF6eVdyaXRlci53cml0dGVuID0gMFxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtMYXp5U3RydWN0V3JpdGVyfSBsYXp5V3JpdGVyXG4gKiBAcGFyYW0ge0l0ZW0gfCBHQ30gc3RydWN0XG4gKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gKi9cbmNvbnN0IHdyaXRlU3RydWN0VG9MYXp5U3RydWN0V3JpdGVyID0gKGxhenlXcml0ZXIsIHN0cnVjdCwgb2Zmc2V0KSA9PiB7XG4gIC8vIGZsdXNoIGN1cnIgaWYgd2Ugc3RhcnQgYW5vdGhlciBjbGllbnRcbiAgaWYgKGxhenlXcml0ZXIud3JpdHRlbiA+IDAgJiYgbGF6eVdyaXRlci5jdXJyQ2xpZW50ICE9PSBzdHJ1Y3QuaWQuY2xpZW50KSB7XG4gICAgZmx1c2hMYXp5U3RydWN0V3JpdGVyKGxhenlXcml0ZXIpXG4gIH1cbiAgaWYgKGxhenlXcml0ZXIud3JpdHRlbiA9PT0gMCkge1xuICAgIGxhenlXcml0ZXIuY3VyckNsaWVudCA9IHN0cnVjdC5pZC5jbGllbnRcbiAgICAvLyB3cml0ZSBuZXh0IGNsaWVudFxuICAgIGxhenlXcml0ZXIuZW5jb2Rlci53cml0ZUNsaWVudChzdHJ1Y3QuaWQuY2xpZW50KVxuICAgIC8vIHdyaXRlIHN0YXJ0Q2xvY2tcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQobGF6eVdyaXRlci5lbmNvZGVyLnJlc3RFbmNvZGVyLCBzdHJ1Y3QuaWQuY2xvY2sgKyBvZmZzZXQpXG4gIH1cbiAgc3RydWN0LndyaXRlKGxhenlXcml0ZXIuZW5jb2Rlciwgb2Zmc2V0KVxuICBsYXp5V3JpdGVyLndyaXR0ZW4rK1xufVxuLyoqXG4gKiBDYWxsIHRoaXMgZnVuY3Rpb24gd2hlbiB3ZSBjb2xsZWN0ZWQgYWxsIHBhcnRzIGFuZCB3YW50IHRvXG4gKiBwdXQgYWxsIHRoZSBwYXJ0cyB0b2dldGhlci4gQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCxcbiAqIHlvdSBjYW4gY29udGludWUgdXNpbmcgdGhlIFVwZGF0ZUVuY29kZXIuXG4gKlxuICogQHBhcmFtIHtMYXp5U3RydWN0V3JpdGVyfSBsYXp5V3JpdGVyXG4gKi9cbmNvbnN0IGZpbmlzaExhenlTdHJ1Y3RXcml0aW5nID0gKGxhenlXcml0ZXIpID0+IHtcbiAgZmx1c2hMYXp5U3RydWN0V3JpdGVyKGxhenlXcml0ZXIpXG5cbiAgLy8gdGhpcyBpcyBhIGZyZXNoIGVuY29kZXIgYmVjYXVzZSB3ZSBjYWxsZWQgZmx1c2hDdXJyXG4gIGNvbnN0IHJlc3RFbmNvZGVyID0gbGF6eVdyaXRlci5lbmNvZGVyLnJlc3RFbmNvZGVyXG5cbiAgLyoqXG4gICAqIE5vdyB3ZSBwdXQgYWxsIHRoZSBmcmFnbWVudHMgdG9nZXRoZXIuXG4gICAqIFRoaXMgd29ya3Mgc2ltaWxhcmx5IHRvIGB3cml0ZUNsaWVudHNTdHJ1Y3RzYFxuICAgKi9cblxuICAvLyB3cml0ZSAjIHN0YXRlcyB0aGF0IHdlcmUgdXBkYXRlZCAtIGkuZS4gdGhlIGNsaWVudHNcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KHJlc3RFbmNvZGVyLCBsYXp5V3JpdGVyLmNsaWVudFN0cnVjdHMubGVuZ3RoKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGF6eVdyaXRlci5jbGllbnRTdHJ1Y3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcGFydFN0cnVjdHMgPSBsYXp5V3JpdGVyLmNsaWVudFN0cnVjdHNbaV1cbiAgICAvKipcbiAgICAgKiBXb3JrcyBzaW1pbGFybHkgdG8gYHdyaXRlU3RydWN0c2BcbiAgICAgKi9cbiAgICAvLyB3cml0ZSAjIGVuY29kZWQgc3RydWN0c1xuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChyZXN0RW5jb2RlciwgcGFydFN0cnVjdHMud3JpdHRlbilcbiAgICAvLyB3cml0ZSB0aGUgcmVzdCBvZiB0aGUgZnJhZ21lbnRcbiAgICBlbmNvZGluZy53cml0ZVVpbnQ4QXJyYXkocmVzdEVuY29kZXIsIHBhcnRTdHJ1Y3RzLnJlc3RFbmNvZGVyKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oSXRlbXxHQ3xTa2lwKTpJdGVtfEdDfFNraXB9IGJsb2NrVHJhbnNmb3JtZXJcbiAqIEBwYXJhbSB7dHlwZW9mIFVwZGF0ZURlY29kZXJWMiB8IHR5cGVvZiBVcGRhdGVEZWNvZGVyVjF9IFlEZWNvZGVyXG4gKiBAcGFyYW0ge3R5cGVvZiBVcGRhdGVFbmNvZGVyVjIgfCB0eXBlb2YgVXBkYXRlRW5jb2RlclYxIH0gWUVuY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbnZlcnRVcGRhdGVGb3JtYXQgPSAodXBkYXRlLCBibG9ja1RyYW5zZm9ybWVyLCBZRGVjb2RlciwgWUVuY29kZXIpID0+IHtcbiAgY29uc3QgdXBkYXRlRGVjb2RlciA9IG5ldyBZRGVjb2RlcihkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSkpXG4gIGNvbnN0IGxhenlEZWNvZGVyID0gbmV3IExhenlTdHJ1Y3RSZWFkZXIodXBkYXRlRGVjb2RlciwgZmFsc2UpXG4gIGNvbnN0IHVwZGF0ZUVuY29kZXIgPSBuZXcgWUVuY29kZXIoKVxuICBjb25zdCBsYXp5V3JpdGVyID0gbmV3IExhenlTdHJ1Y3RXcml0ZXIodXBkYXRlRW5jb2RlcilcbiAgZm9yIChsZXQgY3VyciA9IGxhenlEZWNvZGVyLmN1cnI7IGN1cnIgIT09IG51bGw7IGN1cnIgPSBsYXp5RGVjb2Rlci5uZXh0KCkpIHtcbiAgICB3cml0ZVN0cnVjdFRvTGF6eVN0cnVjdFdyaXRlcihsYXp5V3JpdGVyLCBibG9ja1RyYW5zZm9ybWVyKGN1cnIpLCAwKVxuICB9XG4gIGZpbmlzaExhenlTdHJ1Y3RXcml0aW5nKGxhenlXcml0ZXIpXG4gIGNvbnN0IGRzID0gcmVhZERlbGV0ZVNldCh1cGRhdGVEZWNvZGVyKVxuICB3cml0ZURlbGV0ZVNldCh1cGRhdGVFbmNvZGVyLCBkcylcbiAgcmV0dXJuIHVwZGF0ZUVuY29kZXIudG9VaW50OEFycmF5KClcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBPYmZ1c2NhdG9yT3B0aW9uc1xuICogQHByb3BlcnR5IHtib29sZWFufSBbT2JmdXNjYXRvck9wdGlvbnMuZm9ybWF0dGluZz10cnVlXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbT2JmdXNjYXRvck9wdGlvbnMuc3ViZG9jcz10cnVlXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbT2JmdXNjYXRvck9wdGlvbnMueXhtbD10cnVlXSBXaGV0aGVyIHRvIG9iZnVzY2F0ZSBub2RlTmFtZSAvIGhvb2tOYW1lXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge09iZnVzY2F0b3JPcHRpb25zfSBvYmZ1c2NhdG9yXG4gKi9cbmNvbnN0IGNyZWF0ZU9iZnVzY2F0b3IgPSAoeyBmb3JtYXR0aW5nID0gdHJ1ZSwgc3ViZG9jcyA9IHRydWUsIHl4bWwgPSB0cnVlIH0gPSB7fSkgPT4ge1xuICBsZXQgaSA9IDBcbiAgY29uc3QgbWFwS2V5Q2FjaGUgPSBtYXAuY3JlYXRlKClcbiAgY29uc3Qgbm9kZU5hbWVDYWNoZSA9IG1hcC5jcmVhdGUoKVxuICBjb25zdCBmb3JtYXR0aW5nS2V5Q2FjaGUgPSBtYXAuY3JlYXRlKClcbiAgY29uc3QgZm9ybWF0dGluZ1ZhbHVlQ2FjaGUgPSBtYXAuY3JlYXRlKClcbiAgZm9ybWF0dGluZ1ZhbHVlQ2FjaGUuc2V0KG51bGwsIG51bGwpIC8vIGVuZCBvZiBhIGZvcm1hdHRpbmcgcmFuZ2Ugc2hvdWxkIGFsd2F5cyBiZSB0aGUgZW5kIG9mIGEgZm9ybWF0dGluZyByYW5nZVxuICAvKipcbiAgICogQHBhcmFtIHtJdGVtfEdDfFNraXB9IGJsb2NrXG4gICAqIEByZXR1cm4ge0l0ZW18R0N8U2tpcH1cbiAgICovXG4gIHJldHVybiBibG9jayA9PiB7XG4gICAgc3dpdGNoIChibG9jay5jb25zdHJ1Y3Rvcikge1xuICAgICAgY2FzZSBHQzpcbiAgICAgIGNhc2UgU2tpcDpcbiAgICAgICAgcmV0dXJuIGJsb2NrXG4gICAgICBjYXNlIEl0ZW06IHtcbiAgICAgICAgY29uc3QgaXRlbSA9IC8qKiBAdHlwZSB7SXRlbX0gKi8gKGJsb2NrKVxuICAgICAgICBjb25zdCBjb250ZW50ID0gaXRlbS5jb250ZW50XG4gICAgICAgIHN3aXRjaCAoY29udGVudC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgIGNhc2UgQ29udGVudERlbGV0ZWQ6XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgQ29udGVudFR5cGU6IHtcbiAgICAgICAgICAgIGlmICh5eG1sKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSAvKiogQHR5cGUge0NvbnRlbnRUeXBlfSAqLyAoY29udGVudCkudHlwZVxuICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIFlYbWxFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdHlwZS5ub2RlTmFtZSA9IG1hcC5zZXRJZlVuZGVmaW5lZChub2RlTmFtZUNhY2hlLCB0eXBlLm5vZGVOYW1lLCAoKSA9PiAnbm9kZS0nICsgaSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIFlYbWxIb29rKSB7XG4gICAgICAgICAgICAgICAgdHlwZS5ob29rTmFtZSA9IG1hcC5zZXRJZlVuZGVmaW5lZChub2RlTmFtZUNhY2hlLCB0eXBlLmhvb2tOYW1lLCAoKSA9PiAnaG9vay0nICsgaSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBDb250ZW50QW55OiB7XG4gICAgICAgICAgICBjb25zdCBjID0gLyoqIEB0eXBlIHtDb250ZW50QW55fSAqLyAoY29udGVudClcbiAgICAgICAgICAgIGMuYXJyID0gYy5hcnIubWFwKCgpID0+IGkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIENvbnRlbnRCaW5hcnk6IHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSAvKiogQHR5cGUge0NvbnRlbnRCaW5hcnl9ICovIChjb250ZW50KVxuICAgICAgICAgICAgYy5jb250ZW50ID0gbmV3IFVpbnQ4QXJyYXkoW2ldKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBDb250ZW50RG9jOiB7XG4gICAgICAgICAgICBjb25zdCBjID0gLyoqIEB0eXBlIHtDb250ZW50RG9jfSAqLyAoY29udGVudClcbiAgICAgICAgICAgIGlmIChzdWJkb2NzKSB7XG4gICAgICAgICAgICAgIGMub3B0cyA9IHt9XG4gICAgICAgICAgICAgIGMuZG9jLmd1aWQgPSBpICsgJydcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgQ29udGVudEVtYmVkOiB7XG4gICAgICAgICAgICBjb25zdCBjID0gLyoqIEB0eXBlIHtDb250ZW50RW1iZWR9ICovIChjb250ZW50KVxuICAgICAgICAgICAgYy5lbWJlZCA9IHt9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIENvbnRlbnRGb3JtYXQ6IHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjb250ZW50KVxuICAgICAgICAgICAgaWYgKGZvcm1hdHRpbmcpIHtcbiAgICAgICAgICAgICAgYy5rZXkgPSBtYXAuc2V0SWZVbmRlZmluZWQoZm9ybWF0dGluZ0tleUNhY2hlLCBjLmtleSwgKCkgPT4gaSArICcnKVxuICAgICAgICAgICAgICBjLnZhbHVlID0gbWFwLnNldElmVW5kZWZpbmVkKGZvcm1hdHRpbmdWYWx1ZUNhY2hlLCBjLnZhbHVlLCAoKSA9PiAoeyBpIH0pKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBDb250ZW50SlNPTjoge1xuICAgICAgICAgICAgY29uc3QgYyA9IC8qKiBAdHlwZSB7Q29udGVudEpTT059ICovIChjb250ZW50KVxuICAgICAgICAgICAgYy5hcnIgPSBjLmFyci5tYXAoKCkgPT4gaSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgQ29udGVudFN0cmluZzoge1xuICAgICAgICAgICAgY29uc3QgYyA9IC8qKiBAdHlwZSB7Q29udGVudFN0cmluZ30gKi8gKGNvbnRlbnQpXG4gICAgICAgICAgICBjLnN0ciA9IHN0cmluZy5yZXBlYXQoKGkgJSAxMCkgKyAnJywgYy5zdHIubGVuZ3RoKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIHVua25vd24gY29udGVudCB0eXBlXG4gICAgICAgICAgICBlcnJvci51bmV4cGVjdGVkQ2FzZSgpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW0ucGFyZW50U3ViKSB7XG4gICAgICAgICAgaXRlbS5wYXJlbnRTdWIgPSBtYXAuc2V0SWZVbmRlZmluZWQobWFwS2V5Q2FjaGUsIGl0ZW0ucGFyZW50U3ViLCAoKSA9PiBpICsgJycpXG4gICAgICAgIH1cbiAgICAgICAgaSsrXG4gICAgICAgIHJldHVybiBibG9ja1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gdW5rbm93biBibG9jay10eXBlXG4gICAgICAgIGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIG9iZnVzY2F0ZXMgdGhlIGNvbnRlbnQgb2YgYSBZanMgdXBkYXRlLiBUaGlzIGlzIHVzZWZ1bCB0byBzaGFyZVxuICogYnVnZ3kgWWpzIGRvY3VtZW50cyB3aGlsZSBzaWduaWZpY2FudGx5IGxpbWl0aW5nIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGFcbiAqIGRldmVsb3BlciBjYW4gb24gdGhlIHVzZXIuIE5vdGUgdGhhdCBpdCBtaWdodCBzdGlsbCBiZSBwb3NzaWJsZSB0byBkZWR1Y2VcbiAqIHNvbWUgaW5mb3JtYXRpb24gYnkgYW5hbHl6aW5nIHRoZSBcInN0cnVjdHVyZVwiIG9mIHRoZSBkb2N1bWVudCBvciBieSBhbmFseXppbmdcbiAqIHRoZSB0eXBpbmcgYmVoYXZpb3IgdXNpbmcgdGhlIENSRFQtcmVsYXRlZCBtZXRhZGF0YSB0aGF0IGlzIHN0aWxsIGtlcHQgZnVsbHlcbiAqIGludGFjdC5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICogQHBhcmFtIHtPYmZ1c2NhdG9yT3B0aW9uc30gW29wdHNdXG4gKi9cbmV4cG9ydCBjb25zdCBvYmZ1c2NhdGVVcGRhdGUgPSAodXBkYXRlLCBvcHRzKSA9PiBjb252ZXJ0VXBkYXRlRm9ybWF0KHVwZGF0ZSwgY3JlYXRlT2JmdXNjYXRvcihvcHRzKSwgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVFbmNvZGVyVjEpXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7T2JmdXNjYXRvck9wdGlvbnN9IFtvcHRzXVxuICovXG5leHBvcnQgY29uc3Qgb2JmdXNjYXRlVXBkYXRlVjIgPSAodXBkYXRlLCBvcHRzKSA9PiBjb252ZXJ0VXBkYXRlRm9ybWF0KHVwZGF0ZSwgY3JlYXRlT2JmdXNjYXRvcihvcHRzKSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjIpXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbnZlcnRVcGRhdGVGb3JtYXRWMVRvVjIgPSB1cGRhdGUgPT4gY29udmVydFVwZGF0ZUZvcm1hdCh1cGRhdGUsIGYuaWQsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKi9cbmV4cG9ydCBjb25zdCBjb252ZXJ0VXBkYXRlRm9ybWF0VjJUb1YxID0gdXBkYXRlID0+IGNvbnZlcnRVcGRhdGVGb3JtYXQodXBkYXRlLCBmLmlkLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSlcbiIsICJpbXBvcnQge1xuICBpc0RlbGV0ZWQsXG4gIEl0ZW0sIEFic3RyYWN0VHlwZSwgVHJhbnNhY3Rpb24sIEFic3RyYWN0U3RydWN0IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnbGliMC9zZXQnXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICdsaWIwL2FycmF5J1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcblxuY29uc3QgZXJyb3JDb21wdXRlQ2hhbmdlcyA9ICdZb3UgbXVzdCBub3QgY29tcHV0ZSBjaGFuZ2VzIGFmdGVyIHRoZSBldmVudC1oYW5kbGVyIGZpcmVkLidcblxuLyoqXG4gKiBAdGVtcGxhdGUge0Fic3RyYWN0VHlwZTxhbnk+fSBUXG4gKiBZRXZlbnQgZGVzY3JpYmVzIHRoZSBjaGFuZ2VzIG9uIGEgWVR5cGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBZRXZlbnQge1xuICAvKipcbiAgICogQHBhcmFtIHtUfSB0YXJnZXQgVGhlIGNoYW5nZWQgdHlwZS5cbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yICh0YXJnZXQsIHRyYW5zYWN0aW9uKSB7XG4gICAgLyoqXG4gICAgICogVGhlIHR5cGUgb24gd2hpY2ggdGhpcyBldmVudCB3YXMgY3JlYXRlZCBvbi5cbiAgICAgKiBAdHlwZSB7VH1cbiAgICAgKi9cbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldFxuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50IHRhcmdldCBvbiB3aGljaCB0aGUgb2JzZXJ2ZSBjYWxsYmFjayBpcyBjYWxsZWQuXG4gICAgICogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fVxuICAgICAqL1xuICAgIHRoaXMuY3VycmVudFRhcmdldCA9IHRhcmdldFxuICAgIC8qKlxuICAgICAqIFRoZSB0cmFuc2FjdGlvbiB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50LlxuICAgICAqIEB0eXBlIHtUcmFuc2FjdGlvbn1cbiAgICAgKi9cbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gdHJhbnNhY3Rpb25cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7T2JqZWN0fG51bGx9XG4gICAgICovXG4gICAgdGhpcy5fY2hhbmdlcyA9IG51bGxcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVsbCB8IE1hcDxzdHJpbmcsIHsgYWN0aW9uOiAnYWRkJyB8ICd1cGRhdGUnIHwgJ2RlbGV0ZScsIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkgfT59XG4gICAgICovXG4gICAgdGhpcy5fa2V5cyA9IG51bGxcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVsbCB8IEFycmF5PHsgaW5zZXJ0Pzogc3RyaW5nIHwgQXJyYXk8YW55PiB8IG9iamVjdCB8IEFic3RyYWN0VHlwZTxhbnk+LCByZXRhaW4/OiBudW1iZXIsIGRlbGV0ZT86IG51bWJlciwgYXR0cmlidXRlcz86IE9iamVjdDxzdHJpbmcsIGFueT4gfT59XG4gICAgICovXG4gICAgdGhpcy5fZGVsdGEgPSBudWxsXG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PHN0cmluZ3xudW1iZXI+fG51bGx9XG4gICAgICovXG4gICAgdGhpcy5fcGF0aCA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgcGF0aCBmcm9tIGB5YCB0byB0aGUgY2hhbmdlZCB0eXBlLlxuICAgKlxuICAgKiBAdG9kbyB2MTQgc2hvdWxkIHN0YW5kYXJkaXplIG9uIHBhdGg6IEFycmF5PHtwYXJlbnQsIGluZGV4fT4gYmVjYXVzZSB0aGF0IGlzIGVhc2llciB0byB3b3JrIHdpdGguXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgcHJvcGVydHkgaG9sZHM6XG4gICAqIEBleGFtcGxlXG4gICAqICAgbGV0IHR5cGUgPSB5XG4gICAqICAgZXZlbnQucGF0aC5mb3JFYWNoKGRpciA9PiB7XG4gICAqICAgICB0eXBlID0gdHlwZS5nZXQoZGlyKVxuICAgKiAgIH0pXG4gICAqICAgdHlwZSA9PT0gZXZlbnQudGFyZ2V0IC8vID0+IHRydWVcbiAgICovXG4gIGdldCBwYXRoICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGF0aCB8fCAodGhpcy5fcGF0aCA9IGdldFBhdGhUbyh0aGlzLmN1cnJlbnRUYXJnZXQsIHRoaXMudGFyZ2V0KSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHN0cnVjdCBpcyBkZWxldGVkIGJ5IHRoaXMgZXZlbnQuXG4gICAqXG4gICAqIEluIGNvbnRyYXN0IHRvIGNoYW5nZS5kZWxldGVkLCB0aGlzIG1ldGhvZCBhbHNvIHJldHVybnMgdHJ1ZSBpZiB0aGUgc3RydWN0IHdhcyBhZGRlZCBhbmQgdGhlbiBkZWxldGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge0Fic3RyYWN0U3RydWN0fSBzdHJ1Y3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGRlbGV0ZXMgKHN0cnVjdCkge1xuICAgIHJldHVybiBpc0RlbGV0ZWQodGhpcy50cmFuc2FjdGlvbi5kZWxldGVTZXQsIHN0cnVjdC5pZClcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7TWFwPHN0cmluZywgeyBhY3Rpb246ICdhZGQnIHwgJ3VwZGF0ZScgfCAnZGVsZXRlJywgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSB9Pn1cbiAgICovXG4gIGdldCBrZXlzICgpIHtcbiAgICBpZiAodGhpcy5fa2V5cyA9PT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMudHJhbnNhY3Rpb24uZG9jLl90cmFuc2FjdGlvbkNsZWFudXBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBlcnJvci5jcmVhdGUoZXJyb3JDb21wdXRlQ2hhbmdlcylcbiAgICAgIH1cbiAgICAgIGNvbnN0IGtleXMgPSBuZXcgTWFwKClcbiAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXMudGFyZ2V0XG4gICAgICBjb25zdCBjaGFuZ2VkID0gLyoqIEB0eXBlIFNldDxzdHJpbmd8bnVsbD4gKi8gKHRoaXMudHJhbnNhY3Rpb24uY2hhbmdlZC5nZXQodGFyZ2V0KSlcbiAgICAgIGNoYW5nZWQuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBpZiAoa2V5ICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgaXRlbSA9IC8qKiBAdHlwZSB7SXRlbX0gKi8gKHRhcmdldC5fbWFwLmdldChrZXkpKVxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEB0eXBlIHsnZGVsZXRlJyB8ICdhZGQnIHwgJ3VwZGF0ZSd9XG4gICAgICAgICAgICovXG4gICAgICAgICAgbGV0IGFjdGlvblxuICAgICAgICAgIGxldCBvbGRWYWx1ZVxuICAgICAgICAgIGlmICh0aGlzLmFkZHMoaXRlbSkpIHtcbiAgICAgICAgICAgIGxldCBwcmV2ID0gaXRlbS5sZWZ0XG4gICAgICAgICAgICB3aGlsZSAocHJldiAhPT0gbnVsbCAmJiB0aGlzLmFkZHMocHJldikpIHtcbiAgICAgICAgICAgICAgcHJldiA9IHByZXYubGVmdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZGVsZXRlcyhpdGVtKSkge1xuICAgICAgICAgICAgICBpZiAocHJldiAhPT0gbnVsbCAmJiB0aGlzLmRlbGV0ZXMocHJldikpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSAnZGVsZXRlJ1xuICAgICAgICAgICAgICAgIG9sZFZhbHVlID0gYXJyYXkubGFzdChwcmV2LmNvbnRlbnQuZ2V0Q29udGVudCgpKVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAocHJldiAhPT0gbnVsbCAmJiB0aGlzLmRlbGV0ZXMocHJldikpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSAndXBkYXRlJ1xuICAgICAgICAgICAgICAgIG9sZFZhbHVlID0gYXJyYXkubGFzdChwcmV2LmNvbnRlbnQuZ2V0Q29udGVudCgpKVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFjdGlvbiA9ICdhZGQnXG4gICAgICAgICAgICAgICAgb2xkVmFsdWUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWxldGVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgIGFjdGlvbiA9ICdkZWxldGUnXG4gICAgICAgICAgICAgIG9sZFZhbHVlID0gYXJyYXkubGFzdCgvKiogQHR5cGUge0l0ZW19ICovIGl0ZW0uY29udGVudC5nZXRDb250ZW50KCkpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gLy8gbm9wXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGtleXMuc2V0KGtleSwgeyBhY3Rpb24sIG9sZFZhbHVlIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLl9rZXlzID0ga2V5c1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fa2V5c1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgYSBjb21wdXRlZCBwcm9wZXJ0eS4gTm90ZSB0aGF0IHRoaXMgY2FuIG9ubHkgYmUgc2FmZWx5IGNvbXB1dGVkIGR1cmluZyB0aGVcbiAgICogZXZlbnQgY2FsbC4gQ29tcHV0aW5nIHRoaXMgcHJvcGVydHkgYWZ0ZXIgb3RoZXIgY2hhbmdlcyBoYXBwZW5lZCBtaWdodCByZXN1bHQgaW5cbiAgICogdW5leHBlY3RlZCBiZWhhdmlvciAoaW5jb3JyZWN0IGNvbXB1dGF0aW9uIG9mIGRlbHRhcykuIEEgc2FmZSB3YXkgdG8gY29sbGVjdCBjaGFuZ2VzXG4gICAqIGlzIHRvIHN0b3JlIHRoZSBgY2hhbmdlc2Agb3IgdGhlIGBkZWx0YWAgb2JqZWN0LiBBdm9pZCBzdG9yaW5nIHRoZSBgdHJhbnNhY3Rpb25gIG9iamVjdC5cbiAgICpcbiAgICogQHR5cGUge0FycmF5PHtpbnNlcnQ/OiBzdHJpbmcgfCBBcnJheTxhbnk+IHwgb2JqZWN0IHwgQWJzdHJhY3RUeXBlPGFueT4sIHJldGFpbj86IG51bWJlciwgZGVsZXRlPzogbnVtYmVyLCBhdHRyaWJ1dGVzPzogT2JqZWN0PHN0cmluZywgYW55Pn0+fVxuICAgKi9cbiAgZ2V0IGRlbHRhICgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VzLmRlbHRhXG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBzdHJ1Y3QgaXMgYWRkZWQgYnkgdGhpcyBldmVudC5cbiAgICpcbiAgICogSW4gY29udHJhc3QgdG8gY2hhbmdlLmRlbGV0ZWQsIHRoaXMgbWV0aG9kIGFsc28gcmV0dXJucyB0cnVlIGlmIHRoZSBzdHJ1Y3Qgd2FzIGFkZGVkIGFuZCB0aGVuIGRlbGV0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7QWJzdHJhY3RTdHJ1Y3R9IHN0cnVjdFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgYWRkcyAoc3RydWN0KSB7XG4gICAgcmV0dXJuIHN0cnVjdC5pZC5jbG9jayA+PSAodGhpcy50cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZS5nZXQoc3RydWN0LmlkLmNsaWVudCkgfHwgMClcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGlzIGEgY29tcHV0ZWQgcHJvcGVydHkuIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGJlIHNhZmVseSBjb21wdXRlZCBkdXJpbmcgdGhlXG4gICAqIGV2ZW50IGNhbGwuIENvbXB1dGluZyB0aGlzIHByb3BlcnR5IGFmdGVyIG90aGVyIGNoYW5nZXMgaGFwcGVuZWQgbWlnaHQgcmVzdWx0IGluXG4gICAqIHVuZXhwZWN0ZWQgYmVoYXZpb3IgKGluY29ycmVjdCBjb21wdXRhdGlvbiBvZiBkZWx0YXMpLiBBIHNhZmUgd2F5IHRvIGNvbGxlY3QgY2hhbmdlc1xuICAgKiBpcyB0byBzdG9yZSB0aGUgYGNoYW5nZXNgIG9yIHRoZSBgZGVsdGFgIG9iamVjdC4gQXZvaWQgc3RvcmluZyB0aGUgYHRyYW5zYWN0aW9uYCBvYmplY3QuXG4gICAqXG4gICAqIEB0eXBlIHt7YWRkZWQ6U2V0PEl0ZW0+LGRlbGV0ZWQ6U2V0PEl0ZW0+LGtleXM6TWFwPHN0cmluZyx7YWN0aW9uOidhZGQnfCd1cGRhdGUnfCdkZWxldGUnLG9sZFZhbHVlOmFueX0+LGRlbHRhOkFycmF5PHtpbnNlcnQ/OkFycmF5PGFueT58c3RyaW5nLCBkZWxldGU/Om51bWJlciwgcmV0YWluPzpudW1iZXJ9Pn19XG4gICAqL1xuICBnZXQgY2hhbmdlcyAoKSB7XG4gICAgbGV0IGNoYW5nZXMgPSB0aGlzLl9jaGFuZ2VzXG4gICAgaWYgKGNoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLnRyYW5zYWN0aW9uLmRvYy5fdHJhbnNhY3Rpb25DbGVhbnVwcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgZXJyb3IuY3JlYXRlKGVycm9yQ29tcHV0ZUNoYW5nZXMpXG4gICAgICB9XG4gICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnRhcmdldFxuICAgICAgY29uc3QgYWRkZWQgPSBzZXQuY3JlYXRlKClcbiAgICAgIGNvbnN0IGRlbGV0ZWQgPSBzZXQuY3JlYXRlKClcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge0FycmF5PHtpbnNlcnQ6QXJyYXk8YW55Pn18e2RlbGV0ZTpudW1iZXJ9fHtyZXRhaW46bnVtYmVyfT59XG4gICAgICAgKi9cbiAgICAgIGNvbnN0IGRlbHRhID0gW11cbiAgICAgIGNoYW5nZXMgPSB7XG4gICAgICAgIGFkZGVkLFxuICAgICAgICBkZWxldGVkLFxuICAgICAgICBkZWx0YSxcbiAgICAgICAga2V5czogdGhpcy5rZXlzXG4gICAgICB9XG4gICAgICBjb25zdCBjaGFuZ2VkID0gLyoqIEB0eXBlIFNldDxzdHJpbmd8bnVsbD4gKi8gKHRoaXMudHJhbnNhY3Rpb24uY2hhbmdlZC5nZXQodGFyZ2V0KSlcbiAgICAgIGlmIChjaGFuZ2VkLmhhcyhudWxsKSkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge2FueX1cbiAgICAgICAgICovXG4gICAgICAgIGxldCBsYXN0T3AgPSBudWxsXG4gICAgICAgIGNvbnN0IHBhY2tPcCA9ICgpID0+IHtcbiAgICAgICAgICBpZiAobGFzdE9wKSB7XG4gICAgICAgICAgICBkZWx0YS5wdXNoKGxhc3RPcClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaXRlbSA9IHRhcmdldC5fc3RhcnQ7IGl0ZW0gIT09IG51bGw7IGl0ZW0gPSBpdGVtLnJpZ2h0KSB7XG4gICAgICAgICAgaWYgKGl0ZW0uZGVsZXRlZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVsZXRlcyhpdGVtKSAmJiAhdGhpcy5hZGRzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgIGlmIChsYXN0T3AgPT09IG51bGwgfHwgbGFzdE9wLmRlbGV0ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGFja09wKClcbiAgICAgICAgICAgICAgICBsYXN0T3AgPSB7IGRlbGV0ZTogMCB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbGFzdE9wLmRlbGV0ZSArPSBpdGVtLmxlbmd0aFxuICAgICAgICAgICAgICBkZWxldGVkLmFkZChpdGVtKVxuICAgICAgICAgICAgfSAvLyBlbHNlIG5vcFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hZGRzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgIGlmIChsYXN0T3AgPT09IG51bGwgfHwgbGFzdE9wLmluc2VydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGFja09wKClcbiAgICAgICAgICAgICAgICBsYXN0T3AgPSB7IGluc2VydDogW10gfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxhc3RPcC5pbnNlcnQgPSBsYXN0T3AuaW5zZXJ0LmNvbmNhdChpdGVtLmNvbnRlbnQuZ2V0Q29udGVudCgpKVxuICAgICAgICAgICAgICBhZGRlZC5hZGQoaXRlbSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChsYXN0T3AgPT09IG51bGwgfHwgbGFzdE9wLnJldGFpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGFja09wKClcbiAgICAgICAgICAgICAgICBsYXN0T3AgPSB7IHJldGFpbjogMCB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbGFzdE9wLnJldGFpbiArPSBpdGVtLmxlbmd0aFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobGFzdE9wICE9PSBudWxsICYmIGxhc3RPcC5yZXRhaW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHBhY2tPcCgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2NoYW5nZXMgPSBjaGFuZ2VzXG4gICAgfVxuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKGNoYW5nZXMpXG4gIH1cbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBwYXRoIGZyb20gdGhpcyB0eXBlIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0LlxuICpcbiAqIEBleGFtcGxlXG4gKiAgIC8vIGBjaGlsZGAgc2hvdWxkIGJlIGFjY2Vzc2libGUgdmlhIGB0eXBlLmdldChwYXRoWzBdKS5nZXQocGF0aFsxXSkuLmBcbiAqICAgY29uc3QgcGF0aCA9IHR5cGUuZ2V0UGF0aFRvKGNoaWxkKVxuICogICAvLyBhc3N1bWluZyBgdHlwZSBpbnN0YW5jZW9mIFlBcnJheWBcbiAqICAgY29uc29sZS5sb2cocGF0aCkgLy8gbWlnaHQgbG9vayBsaWtlID0+IFsyLCAna2V5MSddXG4gKiAgIGNoaWxkID09PSB0eXBlLmdldChwYXRoWzBdKS5nZXQocGF0aFsxXSlcbiAqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IGNoaWxkIHRhcmdldFxuICogQHJldHVybiB7QXJyYXk8c3RyaW5nfG51bWJlcj59IFBhdGggdG8gdGhlIHRhcmdldFxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuY29uc3QgZ2V0UGF0aFRvID0gKHBhcmVudCwgY2hpbGQpID0+IHtcbiAgY29uc3QgcGF0aCA9IFtdXG4gIHdoaWxlIChjaGlsZC5faXRlbSAhPT0gbnVsbCAmJiBjaGlsZCAhPT0gcGFyZW50KSB7XG4gICAgaWYgKGNoaWxkLl9pdGVtLnBhcmVudFN1YiAhPT0gbnVsbCkge1xuICAgICAgLy8gcGFyZW50IGlzIG1hcC1pc2hcbiAgICAgIHBhdGgudW5zaGlmdChjaGlsZC5faXRlbS5wYXJlbnRTdWIpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHBhcmVudCBpcyBhcnJheS1pc2hcbiAgICAgIGxldCBpID0gMFxuICAgICAgbGV0IGMgPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAoY2hpbGQuX2l0ZW0ucGFyZW50KS5fc3RhcnRcbiAgICAgIHdoaWxlIChjICE9PSBjaGlsZC5faXRlbSAmJiBjICE9PSBudWxsKSB7XG4gICAgICAgIGlmICghYy5kZWxldGVkICYmIGMuY291bnRhYmxlKSB7XG4gICAgICAgICAgaSArPSBjLmxlbmd0aFxuICAgICAgICB9XG4gICAgICAgIGMgPSBjLnJpZ2h0XG4gICAgICB9XG4gICAgICBwYXRoLnVuc2hpZnQoaSlcbiAgICB9XG4gICAgY2hpbGQgPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAoY2hpbGQuX2l0ZW0ucGFyZW50KVxuICB9XG4gIHJldHVybiBwYXRoXG59XG4iLCAiLyoqXG4gKiBVdGlsaXR5IG1vZHVsZSB0byBjcmVhdGUgYW5kIG1hbmlwdWxhdGUgSXRlcmF0b3JzLlxuICpcbiAqIEBtb2R1bGUgaXRlcmF0b3JcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBULFJcbiAqIEBwYXJhbSB7SXRlcmF0b3I8VD59IGl0ZXJhdG9yXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFQpOlJ9IGZcbiAqIEByZXR1cm4ge0l0ZXJhYmxlSXRlcmF0b3I8Uj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXBJdGVyYXRvciA9IChpdGVyYXRvciwgZikgPT4gKHtcbiAgW1N5bWJvbC5pdGVyYXRvcl0gKCkge1xuICAgIHJldHVybiB0aGlzXG4gIH0sXG4gIC8vIEB0cy1pZ25vcmVcbiAgbmV4dCAoKSB7XG4gICAgY29uc3QgciA9IGl0ZXJhdG9yLm5leHQoKVxuICAgIHJldHVybiB7IHZhbHVlOiByLmRvbmUgPyB1bmRlZmluZWQgOiBmKHIudmFsdWUpLCBkb25lOiByLmRvbmUgfVxuICB9XG59KVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCk6SXRlcmF0b3JSZXN1bHQ8VD59IG5leHRcbiAqIEByZXR1cm4ge0l0ZXJhYmxlSXRlcmF0b3I8VD59XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVJdGVyYXRvciA9IG5leHQgPT4gKHtcbiAgLyoqXG4gICAqIEByZXR1cm4ge0l0ZXJhYmxlSXRlcmF0b3I8VD59XG4gICAqL1xuICBbU3ltYm9sLml0ZXJhdG9yXSAoKSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcbiAgLy8gQHRzLWlnbm9yZVxuICBuZXh0XG59KVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0l0ZXJhdG9yPFQ+fSBpdGVyYXRvclxuICogQHBhcmFtIHtmdW5jdGlvbihUKTpib29sZWFufSBmaWx0ZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGl0ZXJhdG9yRmlsdGVyID0gKGl0ZXJhdG9yLCBmaWx0ZXIpID0+IGNyZWF0ZUl0ZXJhdG9yKCgpID0+IHtcbiAgbGV0IHJlc1xuICBkbyB7XG4gICAgcmVzID0gaXRlcmF0b3IubmV4dCgpXG4gIH0gd2hpbGUgKCFyZXMuZG9uZSAmJiAhZmlsdGVyKHJlcy52YWx1ZSkpXG4gIHJldHVybiByZXNcbn0pXG5cbi8qKlxuICogQHRlbXBsYXRlIFQsTVxuICogQHBhcmFtIHtJdGVyYXRvcjxUPn0gaXRlcmF0b3JcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oVCk6TX0gZm1hcFxuICovXG5leHBvcnQgY29uc3QgaXRlcmF0b3JNYXAgPSAoaXRlcmF0b3IsIGZtYXApID0+IGNyZWF0ZUl0ZXJhdG9yKCgpID0+IHtcbiAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gaXRlcmF0b3IubmV4dCgpXG4gIHJldHVybiB7IGRvbmUsIHZhbHVlOiBkb25lID8gdW5kZWZpbmVkIDogZm1hcCh2YWx1ZSkgfVxufSlcbiIsICJpbXBvcnQge1xuICByZW1vdmVFdmVudEhhbmRsZXJMaXN0ZW5lcixcbiAgY2FsbEV2ZW50SGFuZGxlckxpc3RlbmVycyxcbiAgYWRkRXZlbnRIYW5kbGVyTGlzdGVuZXIsXG4gIGNyZWF0ZUV2ZW50SGFuZGxlcixcbiAgZ2V0U3RhdGUsXG4gIGlzVmlzaWJsZSxcbiAgQ29udGVudFR5cGUsXG4gIGNyZWF0ZUlELFxuICBDb250ZW50QW55LFxuICBDb250ZW50QmluYXJ5LFxuICBnZXRJdGVtQ2xlYW5TdGFydCxcbiAgQ29udGVudERvYywgWVRleHQsIFlBcnJheSwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIERvYywgU25hcHNob3QsIFRyYW5zYWN0aW9uLCBFdmVudEhhbmRsZXIsIFlFdmVudCwgSXRlbSwgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIG1hcCBmcm9tICdsaWIwL21hcCdcbmltcG9ydCAqIGFzIGl0ZXJhdG9yIGZyb20gJ2xpYjAvaXRlcmF0b3InXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgKiBhcyBsb2cgZnJvbSAnbGliMC9sb2dnaW5nJ1xuXG4vKipcbiAqIGh0dHBzOi8vZG9jcy55anMuZGV2L2dldHRpbmctc3RhcnRlZC93b3JraW5nLXdpdGgtc2hhcmVkLXR5cGVzI2NhdmVhdHNcbiAqL1xuZXhwb3J0IGNvbnN0IHdhcm5QcmVtYXR1cmVBY2Nlc3MgPSAoKSA9PiB7IGxvZy53YXJuKCdJbnZhbGlkIGFjY2VzczogQWRkIFlqcyB0eXBlIHRvIGEgZG9jdW1lbnQgYmVmb3JlIHJlYWRpbmcgZGF0YS4nKSB9XG5cbmNvbnN0IG1heFNlYXJjaE1hcmtlciA9IDgwXG5cbi8qKlxuICogQSB1bmlxdWUgdGltZXN0YW1wIHRoYXQgaWRlbnRpZmllcyBlYWNoIG1hcmtlci5cbiAqXG4gKiBUaW1lIGlzIHJlbGF0aXZlLC4uIHRoaXMgaXMgbW9yZSBsaWtlIGFuIGV2ZXItaW5jcmVhc2luZyBjbG9jay5cbiAqXG4gKiBAdHlwZSB7bnVtYmVyfVxuICovXG5sZXQgZ2xvYmFsU2VhcmNoTWFya2VyVGltZXN0YW1wID0gMFxuXG5leHBvcnQgY2xhc3MgQXJyYXlTZWFyY2hNYXJrZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtJdGVtfSBwXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgKi9cbiAgY29uc3RydWN0b3IgKHAsIGluZGV4KSB7XG4gICAgcC5tYXJrZXIgPSB0cnVlXG4gICAgdGhpcy5wID0gcFxuICAgIHRoaXMuaW5kZXggPSBpbmRleFxuICAgIHRoaXMudGltZXN0YW1wID0gZ2xvYmFsU2VhcmNoTWFya2VyVGltZXN0YW1wKytcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXlTZWFyY2hNYXJrZXJ9IG1hcmtlclxuICovXG5jb25zdCByZWZyZXNoTWFya2VyVGltZXN0YW1wID0gbWFya2VyID0+IHsgbWFya2VyLnRpbWVzdGFtcCA9IGdsb2JhbFNlYXJjaE1hcmtlclRpbWVzdGFtcCsrIH1cblxuLyoqXG4gKiBUaGlzIGlzIHJhdGhlciBjb21wbGV4IHNvIHRoaXMgZnVuY3Rpb24gaXMgdGhlIG9ubHkgdGhpbmcgdGhhdCBzaG91bGQgb3ZlcndyaXRlIGEgbWFya2VyXG4gKlxuICogQHBhcmFtIHtBcnJheVNlYXJjaE1hcmtlcn0gbWFya2VyXG4gKiBAcGFyYW0ge0l0ZW19IHBcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICovXG5jb25zdCBvdmVyd3JpdGVNYXJrZXIgPSAobWFya2VyLCBwLCBpbmRleCkgPT4ge1xuICBtYXJrZXIucC5tYXJrZXIgPSBmYWxzZVxuICBtYXJrZXIucCA9IHBcbiAgcC5tYXJrZXIgPSB0cnVlXG4gIG1hcmtlci5pbmRleCA9IGluZGV4XG4gIG1hcmtlci50aW1lc3RhbXAgPSBnbG9iYWxTZWFyY2hNYXJrZXJUaW1lc3RhbXArK1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8QXJyYXlTZWFyY2hNYXJrZXI+fSBzZWFyY2hNYXJrZXJcbiAqIEBwYXJhbSB7SXRlbX0gcFxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKi9cbmNvbnN0IG1hcmtQb3NpdGlvbiA9IChzZWFyY2hNYXJrZXIsIHAsIGluZGV4KSA9PiB7XG4gIGlmIChzZWFyY2hNYXJrZXIubGVuZ3RoID49IG1heFNlYXJjaE1hcmtlcikge1xuICAgIC8vIG92ZXJyaWRlIG9sZGVzdCBtYXJrZXIgKHdlIGRvbid0IHdhbnQgdG8gY3JlYXRlIG1vcmUgb2JqZWN0cylcbiAgICBjb25zdCBtYXJrZXIgPSBzZWFyY2hNYXJrZXIucmVkdWNlKChhLCBiKSA9PiBhLnRpbWVzdGFtcCA8IGIudGltZXN0YW1wID8gYSA6IGIpXG4gICAgb3ZlcndyaXRlTWFya2VyKG1hcmtlciwgcCwgaW5kZXgpXG4gICAgcmV0dXJuIG1hcmtlclxuICB9IGVsc2Uge1xuICAgIC8vIGNyZWF0ZSBuZXcgbWFya2VyXG4gICAgY29uc3QgcG0gPSBuZXcgQXJyYXlTZWFyY2hNYXJrZXIocCwgaW5kZXgpXG4gICAgc2VhcmNoTWFya2VyLnB1c2gocG0pXG4gICAgcmV0dXJuIHBtXG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2ggbWFya2VyIGhlbHAgdXMgdG8gZmluZCBwb3NpdGlvbnMgaW4gdGhlIGFzc29jaWF0aXZlIGFycmF5IGZhc3Rlci5cbiAqXG4gKiBUaGV5IHNwZWVkIHVwIHRoZSBwcm9jZXNzIG9mIGZpbmRpbmcgYSBwb3NpdGlvbiB3aXRob3V0IG11Y2ggYm9va2tlZXBpbmcuXG4gKlxuICogQSBtYXhpbXVtIG9mIGBtYXhTZWFyY2hNYXJrZXJgIG9iamVjdHMgYXJlIGNyZWF0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhbHdheXMgcmV0dXJucyBhIHJlZnJlc2hlZCBtYXJrZXIgKHVwZGF0ZWQgdGltZXN0YW1wKVxuICpcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHlhcnJheVxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKi9cbmV4cG9ydCBjb25zdCBmaW5kTWFya2VyID0gKHlhcnJheSwgaW5kZXgpID0+IHtcbiAgaWYgKHlhcnJheS5fc3RhcnQgPT09IG51bGwgfHwgaW5kZXggPT09IDAgfHwgeWFycmF5Ll9zZWFyY2hNYXJrZXIgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGNvbnN0IG1hcmtlciA9IHlhcnJheS5fc2VhcmNoTWFya2VyLmxlbmd0aCA9PT0gMCA/IG51bGwgOiB5YXJyYXkuX3NlYXJjaE1hcmtlci5yZWR1Y2UoKGEsIGIpID0+IG1hdGguYWJzKGluZGV4IC0gYS5pbmRleCkgPCBtYXRoLmFicyhpbmRleCAtIGIuaW5kZXgpID8gYSA6IGIpXG4gIGxldCBwID0geWFycmF5Ll9zdGFydFxuICBsZXQgcGluZGV4ID0gMFxuICBpZiAobWFya2VyICE9PSBudWxsKSB7XG4gICAgcCA9IG1hcmtlci5wXG4gICAgcGluZGV4ID0gbWFya2VyLmluZGV4XG4gICAgcmVmcmVzaE1hcmtlclRpbWVzdGFtcChtYXJrZXIpIC8vIHdlIHVzZWQgaXQsIHdlIG1pZ2h0IG5lZWQgdG8gdXNlIGl0IGFnYWluXG4gIH1cbiAgLy8gaXRlcmF0ZSB0byByaWdodCBpZiBwb3NzaWJsZVxuICB3aGlsZSAocC5yaWdodCAhPT0gbnVsbCAmJiBwaW5kZXggPCBpbmRleCkge1xuICAgIGlmICghcC5kZWxldGVkICYmIHAuY291bnRhYmxlKSB7XG4gICAgICBpZiAoaW5kZXggPCBwaW5kZXggKyBwLmxlbmd0aCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgcGluZGV4ICs9IHAubGVuZ3RoXG4gICAgfVxuICAgIHAgPSBwLnJpZ2h0XG4gIH1cbiAgLy8gaXRlcmF0ZSB0byBsZWZ0IGlmIG5lY2Vzc2FyeSAobWlnaHQgYmUgdGhhdCBwaW5kZXggPiBpbmRleClcbiAgd2hpbGUgKHAubGVmdCAhPT0gbnVsbCAmJiBwaW5kZXggPiBpbmRleCkge1xuICAgIHAgPSBwLmxlZnRcbiAgICBpZiAoIXAuZGVsZXRlZCAmJiBwLmNvdW50YWJsZSkge1xuICAgICAgcGluZGV4IC09IHAubGVuZ3RoXG4gICAgfVxuICB9XG4gIC8vIHdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgcCBjYW4ndCBiZSBtZXJnZWQgd2l0aCBsZWZ0LCBiZWNhdXNlIHRoYXQgd291bGQgc2NyZXcgdXAgZXZlcnl0aGluZ1xuICAvLyBpbiB0aGF0IGNhcyBqdXN0IHJldHVybiB3aGF0IHdlIGhhdmUgKGl0IGlzIG1vc3QgbGlrZWx5IHRoZSBiZXN0IG1hcmtlciBhbnl3YXkpXG4gIC8vIGl0ZXJhdGUgdG8gbGVmdCB1bnRpbCBwIGNhbid0IGJlIG1lcmdlZCB3aXRoIGxlZnRcbiAgd2hpbGUgKHAubGVmdCAhPT0gbnVsbCAmJiBwLmxlZnQuaWQuY2xpZW50ID09PSBwLmlkLmNsaWVudCAmJiBwLmxlZnQuaWQuY2xvY2sgKyBwLmxlZnQubGVuZ3RoID09PSBwLmlkLmNsb2NrKSB7XG4gICAgcCA9IHAubGVmdFxuICAgIGlmICghcC5kZWxldGVkICYmIHAuY291bnRhYmxlKSB7XG4gICAgICBwaW5kZXggLT0gcC5sZW5ndGhcbiAgICB9XG4gIH1cblxuICAvLyBAdG9kbyByZW1vdmUhXG4gIC8vIGFzc3VyZSBwb3NpdGlvblxuICAvLyB7XG4gIC8vICAgbGV0IHN0YXJ0ID0geWFycmF5Ll9zdGFydFxuICAvLyAgIGxldCBwb3MgPSAwXG4gIC8vICAgd2hpbGUgKHN0YXJ0ICE9PSBwKSB7XG4gIC8vICAgICBpZiAoIXN0YXJ0LmRlbGV0ZWQgJiYgc3RhcnQuY291bnRhYmxlKSB7XG4gIC8vICAgICAgIHBvcyArPSBzdGFydC5sZW5ndGhcbiAgLy8gICAgIH1cbiAgLy8gICAgIHN0YXJ0ID0gLyoqIEB0eXBlIHtJdGVtfSAqLyAoc3RhcnQucmlnaHQpXG4gIC8vICAgfVxuICAvLyAgIGlmIChwb3MgIT09IHBpbmRleCkge1xuICAvLyAgICAgZGVidWdnZXJcbiAgLy8gICAgIHRocm93IG5ldyBFcnJvcignR290Y2hhIHBvc2l0aW9uIGZhaWwhJylcbiAgLy8gICB9XG4gIC8vIH1cbiAgLy8gaWYgKG1hcmtlcikge1xuICAvLyAgIGlmICh3aW5kb3cubGVuZ3RoZXMgPT0gbnVsbCkge1xuICAvLyAgICAgd2luZG93Lmxlbmd0aGVzID0gW11cbiAgLy8gICAgIHdpbmRvdy5nZXRMZW5ndGhlcyA9ICgpID0+IHdpbmRvdy5sZW5ndGhlcy5zb3J0KChhLCBiKSA9PiBhIC0gYilcbiAgLy8gICB9XG4gIC8vICAgd2luZG93Lmxlbmd0aGVzLnB1c2gobWFya2VyLmluZGV4IC0gcGluZGV4KVxuICAvLyAgIGNvbnNvbGUubG9nKCdkaXN0YW5jZScsIG1hcmtlci5pbmRleCAtIHBpbmRleCwgJ2xlbicsIHAgJiYgcC5wYXJlbnQubGVuZ3RoKVxuICAvLyB9XG4gIGlmIChtYXJrZXIgIT09IG51bGwgJiYgbWF0aC5hYnMobWFya2VyLmluZGV4IC0gcGluZGV4KSA8IC8qKiBAdHlwZSB7WVRleHR8WUFycmF5PGFueT59ICovIChwLnBhcmVudCkubGVuZ3RoIC8gbWF4U2VhcmNoTWFya2VyKSB7XG4gICAgLy8gYWRqdXN0IGV4aXN0aW5nIG1hcmtlclxuICAgIG92ZXJ3cml0ZU1hcmtlcihtYXJrZXIsIHAsIHBpbmRleClcbiAgICByZXR1cm4gbWFya2VyXG4gIH0gZWxzZSB7XG4gICAgLy8gY3JlYXRlIG5ldyBtYXJrZXJcbiAgICByZXR1cm4gbWFya1Bvc2l0aW9uKHlhcnJheS5fc2VhcmNoTWFya2VyLCBwLCBwaW5kZXgpXG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgbWFya2VycyB3aGVuIGEgY2hhbmdlIGhhcHBlbmVkLlxuICpcbiAqIFRoaXMgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgZG9pbmcgYSBkZWxldGlvbiFcbiAqXG4gKiBAcGFyYW0ge0FycmF5PEFycmF5U2VhcmNoTWFya2VyPn0gc2VhcmNoTWFya2VyXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gSWYgaW5zZXJ0aW9uLCBsZW4gaXMgcG9zaXRpdmUuIElmIGRlbGV0aW9uLCBsZW4gaXMgbmVnYXRpdmUuXG4gKi9cbmV4cG9ydCBjb25zdCB1cGRhdGVNYXJrZXJDaGFuZ2VzID0gKHNlYXJjaE1hcmtlciwgaW5kZXgsIGxlbikgPT4ge1xuICBmb3IgKGxldCBpID0gc2VhcmNoTWFya2VyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3QgbSA9IHNlYXJjaE1hcmtlcltpXVxuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAgICAgKi9cbiAgICAgIGxldCBwID0gbS5wXG4gICAgICBwLm1hcmtlciA9IGZhbHNlXG4gICAgICAvLyBJZGVhbGx5IHdlIGp1c3Qgd2FudCB0byBkbyBhIHNpbXBsZSBwb3NpdGlvbiBjb21wYXJpc29uLCBidXQgdGhpcyB3aWxsIG9ubHkgd29yayBpZlxuICAgICAgLy8gc2VhcmNoIG1hcmtlcnMgZG9uJ3QgcG9pbnQgdG8gZGVsZXRlZCBpdGVtcyBmb3IgZm9ybWF0cy5cbiAgICAgIC8vIEl0ZXJhdGUgbWFya2VyIHRvIHByZXYgdW5kZWxldGVkIGNvdW50YWJsZSBwb3NpdGlvbiBzbyB3ZSBrbm93IHdoYXQgdG8gZG8gd2hlbiB1cGRhdGluZyBhIHBvc2l0aW9uXG4gICAgICB3aGlsZSAocCAmJiAocC5kZWxldGVkIHx8ICFwLmNvdW50YWJsZSkpIHtcbiAgICAgICAgcCA9IHAubGVmdFxuICAgICAgICBpZiAocCAmJiAhcC5kZWxldGVkICYmIHAuY291bnRhYmxlKSB7XG4gICAgICAgICAgLy8gYWRqdXN0IHBvc2l0aW9uLiB0aGUgbG9vcCBzaG91bGQgYnJlYWsgbm93XG4gICAgICAgICAgbS5pbmRleCAtPSBwLmxlbmd0aFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocCA9PT0gbnVsbCB8fCBwLm1hcmtlciA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyByZW1vdmUgc2VhcmNoIG1hcmtlciBpZiB1cGRhdGVkIHBvc2l0aW9uIGlzIG51bGwgb3IgaWYgcG9zaXRpb24gaXMgYWxyZWFkeSBtYXJrZWRcbiAgICAgICAgc2VhcmNoTWFya2VyLnNwbGljZShpLCAxKVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgbS5wID0gcFxuICAgICAgcC5tYXJrZXIgPSB0cnVlXG4gICAgfVxuICAgIGlmIChpbmRleCA8IG0uaW5kZXggfHwgKGxlbiA+IDAgJiYgaW5kZXggPT09IG0uaW5kZXgpKSB7IC8vIGEgc2ltcGxlIGluZGV4IDw9IG0uaW5kZXggY2hlY2sgd291bGQgYWN0dWFsbHkgc3VmZmljZVxuICAgICAgbS5pbmRleCA9IG1hdGgubWF4KGluZGV4LCBtLmluZGV4ICsgbGVuKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFjY3VtdWxhdGUgYWxsIChsaXN0KSBjaGlsZHJlbiBvZiBhIHR5cGUgYW5kIHJldHVybiB0aGVtIGFzIGFuIEFycmF5LlxuICpcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHRcbiAqIEByZXR1cm4ge0FycmF5PEl0ZW0+fVxuICovXG5leHBvcnQgY29uc3QgZ2V0VHlwZUNoaWxkcmVuID0gdCA9PiB7XG4gIHQuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICBsZXQgcyA9IHQuX3N0YXJ0XG4gIGNvbnN0IGFyciA9IFtdXG4gIHdoaWxlIChzKSB7XG4gICAgYXJyLnB1c2gocylcbiAgICBzID0gcy5yaWdodFxuICB9XG4gIHJldHVybiBhcnJcbn1cblxuLyoqXG4gKiBDYWxsIGV2ZW50IGxpc3RlbmVycyB3aXRoIGFuIGV2ZW50LiBUaGlzIHdpbGwgYWxzbyBhZGQgYW4gZXZlbnQgdG8gYWxsXG4gKiBwYXJlbnRzIChmb3IgYC5vYnNlcnZlRGVlcGAgaGFuZGxlcnMpLlxuICpcbiAqIEB0ZW1wbGF0ZSBFdmVudFR5cGVcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPEV2ZW50VHlwZT59IHR5cGVcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0V2ZW50VHlwZX0gZXZlbnRcbiAqL1xuZXhwb3J0IGNvbnN0IGNhbGxUeXBlT2JzZXJ2ZXJzID0gKHR5cGUsIHRyYW5zYWN0aW9uLCBldmVudCkgPT4ge1xuICBjb25zdCBjaGFuZ2VkVHlwZSA9IHR5cGVcbiAgY29uc3QgY2hhbmdlZFBhcmVudFR5cGVzID0gdHJhbnNhY3Rpb24uY2hhbmdlZFBhcmVudFR5cGVzXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIG1hcC5zZXRJZlVuZGVmaW5lZChjaGFuZ2VkUGFyZW50VHlwZXMsIHR5cGUsICgpID0+IFtdKS5wdXNoKGV2ZW50KVxuICAgIGlmICh0eXBlLl9pdGVtID09PSBudWxsKSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgICB0eXBlID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHR5cGUuX2l0ZW0ucGFyZW50KVxuICB9XG4gIGNhbGxFdmVudEhhbmRsZXJMaXN0ZW5lcnMoY2hhbmdlZFR5cGUuX2VILCBldmVudCwgdHJhbnNhY3Rpb24pXG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEV2ZW50VHlwZVxuICogQWJzdHJhY3QgWWpzIFR5cGUgY2xhc3NcbiAqL1xuZXhwb3J0IGNsYXNzIEFic3RyYWN0VHlwZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgICAqL1xuICAgIHRoaXMuX2l0ZW0gPSBudWxsXG4gICAgLyoqXG4gICAgICogQHR5cGUge01hcDxzdHJpbmcsSXRlbT59XG4gICAgICovXG4gICAgdGhpcy5fbWFwID0gbmV3IE1hcCgpXG4gICAgLyoqXG4gICAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLl9zdGFydCA9IG51bGxcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RG9jfG51bGx9XG4gICAgICovXG4gICAgdGhpcy5kb2MgPSBudWxsXG4gICAgdGhpcy5fbGVuZ3RoID0gMFxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXJzXG4gICAgICogQHR5cGUge0V2ZW50SGFuZGxlcjxFdmVudFR5cGUsVHJhbnNhY3Rpb24+fVxuICAgICAqL1xuICAgIHRoaXMuX2VIID0gY3JlYXRlRXZlbnRIYW5kbGVyKClcbiAgICAvKipcbiAgICAgKiBEZWVwIGV2ZW50IGhhbmRsZXJzXG4gICAgICogQHR5cGUge0V2ZW50SGFuZGxlcjxBcnJheTxZRXZlbnQ8YW55Pj4sVHJhbnNhY3Rpb24+fVxuICAgICAqL1xuICAgIHRoaXMuX2RFSCA9IGNyZWF0ZUV2ZW50SGFuZGxlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bGwgfCBBcnJheTxBcnJheVNlYXJjaE1hcmtlcj59XG4gICAgICovXG4gICAgdGhpcy5fc2VhcmNoTWFya2VyID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0Fic3RyYWN0VHlwZTxhbnk+fG51bGx9XG4gICAqL1xuICBnZXQgcGFyZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXRlbSA/IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0aGlzLl9pdGVtLnBhcmVudCkgOiBudWxsXG4gIH1cblxuICAvKipcbiAgICogSW50ZWdyYXRlIHRoaXMgdHlwZSBpbnRvIHRoZSBZanMgaW5zdGFuY2UuXG4gICAqXG4gICAqICogU2F2ZSB0aGlzIHN0cnVjdCBpbiB0aGUgb3NcbiAgICogKiBUaGlzIHR5cGUgaXMgc2VudCB0byBvdGhlciBjbGllbnRcbiAgICogKiBPYnNlcnZlciBmdW5jdGlvbnMgYXJlIGZpcmVkXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jfSB5IFRoZSBZanMgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtJdGVtfG51bGx9IGl0ZW1cbiAgICovXG4gIF9pbnRlZ3JhdGUgKHksIGl0ZW0pIHtcbiAgICB0aGlzLmRvYyA9IHlcbiAgICB0aGlzLl9pdGVtID0gaXRlbVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0Fic3RyYWN0VHlwZTxFdmVudFR5cGU+fVxuICAgKi9cbiAgX2NvcHkgKCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgY29weSBvZiB0aGlzIGRhdGEgdHlwZSB0aGF0IGNhbiBiZSBpbmNsdWRlZCBzb21ld2hlcmUgZWxzZS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoZSBjb250ZW50IGlzIG9ubHkgcmVhZGFibGUgX2FmdGVyXyBpdCBoYXMgYmVlbiBpbmNsdWRlZCBzb21ld2hlcmUgaW4gdGhlIFlkb2MuXG4gICAqXG4gICAqIEByZXR1cm4ge0Fic3RyYWN0VHlwZTxFdmVudFR5cGU+fVxuICAgKi9cbiAgY2xvbmUgKCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBfZW5jb2RlclxuICAgKi9cbiAgX3dyaXRlIChfZW5jb2RlcikgeyB9XG5cbiAgLyoqXG4gICAqIFRoZSBmaXJzdCBub24tZGVsZXRlZCBpdGVtXG4gICAqL1xuICBnZXQgX2ZpcnN0ICgpIHtcbiAgICBsZXQgbiA9IHRoaXMuX3N0YXJ0XG4gICAgd2hpbGUgKG4gIT09IG51bGwgJiYgbi5kZWxldGVkKSB7XG4gICAgICBuID0gbi5yaWdodFxuICAgIH1cbiAgICByZXR1cm4gblxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgWUV2ZW50IGFuZCBjYWxscyBhbGwgdHlwZSBvYnNlcnZlcnMuXG4gICAqIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgZWFjaCB0eXBlLlxuICAgKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge1NldDxudWxsfHN0cmluZz59IF9wYXJlbnRTdWJzIEtleXMgY2hhbmdlZCBvbiB0aGlzIHR5cGUuIGBudWxsYCBpZiBsaXN0IHdhcyBtb2RpZmllZC5cbiAgICovXG4gIF9jYWxsT2JzZXJ2ZXIgKHRyYW5zYWN0aW9uLCBfcGFyZW50U3Vicykge1xuICAgIGlmICghdHJhbnNhY3Rpb24ubG9jYWwgJiYgdGhpcy5fc2VhcmNoTWFya2VyKSB7XG4gICAgICB0aGlzLl9zZWFyY2hNYXJrZXIubGVuZ3RoID0gMFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPYnNlcnZlIGFsbCBldmVudHMgdGhhdCBhcmUgY3JlYXRlZCBvbiB0aGlzIHR5cGUuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oRXZlbnRUeXBlLCBUcmFuc2FjdGlvbik6dm9pZH0gZiBPYnNlcnZlciBmdW5jdGlvblxuICAgKi9cbiAgb2JzZXJ2ZSAoZikge1xuICAgIGFkZEV2ZW50SGFuZGxlckxpc3RlbmVyKHRoaXMuX2VILCBmKVxuICB9XG5cbiAgLyoqXG4gICAqIE9ic2VydmUgYWxsIGV2ZW50cyB0aGF0IGFyZSBjcmVhdGVkIGJ5IHRoaXMgdHlwZSBhbmQgaXRzIGNoaWxkcmVuLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKEFycmF5PFlFdmVudDxhbnk+PixUcmFuc2FjdGlvbik6dm9pZH0gZiBPYnNlcnZlciBmdW5jdGlvblxuICAgKi9cbiAgb2JzZXJ2ZURlZXAgKGYpIHtcbiAgICBhZGRFdmVudEhhbmRsZXJMaXN0ZW5lcih0aGlzLl9kRUgsIGYpXG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhbiBvYnNlcnZlciBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbihFdmVudFR5cGUsVHJhbnNhY3Rpb24pOnZvaWR9IGYgT2JzZXJ2ZXIgZnVuY3Rpb25cbiAgICovXG4gIHVub2JzZXJ2ZSAoZikge1xuICAgIHJlbW92ZUV2ZW50SGFuZGxlckxpc3RlbmVyKHRoaXMuX2VILCBmKVxuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYW4gb2JzZXJ2ZXIgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oQXJyYXk8WUV2ZW50PGFueT4+LFRyYW5zYWN0aW9uKTp2b2lkfSBmIE9ic2VydmVyIGZ1bmN0aW9uXG4gICAqL1xuICB1bm9ic2VydmVEZWVwIChmKSB7XG4gICAgcmVtb3ZlRXZlbnRIYW5kbGVyTGlzdGVuZXIodGhpcy5fZEVILCBmKVxuICB9XG5cbiAgLyoqXG4gICAqIEBhYnN0cmFjdFxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICB0b0pTT04gKCkge31cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSB0eXBlXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmRcbiAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RTbGljZSA9ICh0eXBlLCBzdGFydCwgZW5kKSA9PiB7XG4gIHR5cGUuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSB0eXBlLl9sZW5ndGggKyBzdGFydFxuICB9XG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kID0gdHlwZS5fbGVuZ3RoICsgZW5kXG4gIH1cbiAgbGV0IGxlbiA9IGVuZCAtIHN0YXJ0XG4gIGNvbnN0IGNzID0gW11cbiAgbGV0IG4gPSB0eXBlLl9zdGFydFxuICB3aGlsZSAobiAhPT0gbnVsbCAmJiBsZW4gPiAwKSB7XG4gICAgaWYgKG4uY291bnRhYmxlICYmICFuLmRlbGV0ZWQpIHtcbiAgICAgIGNvbnN0IGMgPSBuLmNvbnRlbnQuZ2V0Q29udGVudCgpXG4gICAgICBpZiAoYy5sZW5ndGggPD0gc3RhcnQpIHtcbiAgICAgICAgc3RhcnQgLT0gYy5sZW5ndGhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGMubGVuZ3RoICYmIGxlbiA+IDA7IGkrKykge1xuICAgICAgICAgIGNzLnB1c2goY1tpXSlcbiAgICAgICAgICBsZW4tLVxuICAgICAgICB9XG4gICAgICAgIHN0YXJ0ID0gMFxuICAgICAgfVxuICAgIH1cbiAgICBuID0gbi5yaWdodFxuICB9XG4gIHJldHVybiBjc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RUb0FycmF5ID0gdHlwZSA9PiB7XG4gIHR5cGUuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICBjb25zdCBjcyA9IFtdXG4gIGxldCBuID0gdHlwZS5fc3RhcnRcbiAgd2hpbGUgKG4gIT09IG51bGwpIHtcbiAgICBpZiAobi5jb3VudGFibGUgJiYgIW4uZGVsZXRlZCkge1xuICAgICAgY29uc3QgYyA9IG4uY29udGVudC5nZXRDb250ZW50KClcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjcy5wdXNoKGNbaV0pXG4gICAgICB9XG4gICAgfVxuICAgIG4gPSBuLnJpZ2h0XG4gIH1cbiAgcmV0dXJuIGNzXG59XG5cbi8qKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gdHlwZVxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RUb0FycmF5U25hcHNob3QgPSAodHlwZSwgc25hcHNob3QpID0+IHtcbiAgY29uc3QgY3MgPSBbXVxuICBsZXQgbiA9IHR5cGUuX3N0YXJ0XG4gIHdoaWxlIChuICE9PSBudWxsKSB7XG4gICAgaWYgKG4uY291bnRhYmxlICYmIGlzVmlzaWJsZShuLCBzbmFwc2hvdCkpIHtcbiAgICAgIGNvbnN0IGMgPSBuLmNvbnRlbnQuZ2V0Q29udGVudCgpXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3MucHVzaChjW2ldKVxuICAgICAgfVxuICAgIH1cbiAgICBuID0gbi5yaWdodFxuICB9XG4gIHJldHVybiBjc1xufVxuXG4vKipcbiAqIEV4ZWN1dGVzIGEgcHJvdmlkZWQgZnVuY3Rpb24gb24gb25jZSBvbiBldmVyeSBlbGVtZW50IG9mIHRoaXMgWUFycmF5LlxuICpcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LG51bWJlcixhbnkpOnZvaWR9IGYgQSBmdW5jdGlvbiB0byBleGVjdXRlIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhpcyBZQXJyYXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RGb3JFYWNoID0gKHR5cGUsIGYpID0+IHtcbiAgbGV0IGluZGV4ID0gMFxuICBsZXQgbiA9IHR5cGUuX3N0YXJ0XG4gIHR5cGUuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICB3aGlsZSAobiAhPT0gbnVsbCkge1xuICAgIGlmIChuLmNvdW50YWJsZSAmJiAhbi5kZWxldGVkKSB7XG4gICAgICBjb25zdCBjID0gbi5jb250ZW50LmdldENvbnRlbnQoKVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGYoY1tpXSwgaW5kZXgrKywgdHlwZSlcbiAgICAgIH1cbiAgICB9XG4gICAgbiA9IG4ucmlnaHRcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBDLFJcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oQyxudW1iZXIsQWJzdHJhY3RUeXBlPGFueT4pOlJ9IGZcbiAqIEByZXR1cm4ge0FycmF5PFI+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0TWFwID0gKHR5cGUsIGYpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgY29uc3QgcmVzdWx0ID0gW11cbiAgdHlwZUxpc3RGb3JFYWNoKHR5cGUsIChjLCBpKSA9PiB7XG4gICAgcmVzdWx0LnB1c2goZihjLCBpLCB0eXBlKSlcbiAgfSlcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEByZXR1cm4ge0l0ZXJhYmxlSXRlcmF0b3I8YW55Pn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTGlzdENyZWF0ZUl0ZXJhdG9yID0gdHlwZSA9PiB7XG4gIGxldCBuID0gdHlwZS5fc3RhcnRcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxhbnk+fG51bGx9XG4gICAqL1xuICBsZXQgY3VycmVudENvbnRlbnQgPSBudWxsXG4gIGxldCBjdXJyZW50Q29udGVudEluZGV4ID0gMFxuICByZXR1cm4ge1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcbiAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAvLyBmaW5kIHNvbWUgY29udGVudFxuICAgICAgaWYgKGN1cnJlbnRDb250ZW50ID09PSBudWxsKSB7XG4gICAgICAgIHdoaWxlIChuICE9PSBudWxsICYmIG4uZGVsZXRlZCkge1xuICAgICAgICAgIG4gPSBuLnJpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hlY2sgaWYgd2UgcmVhY2hlZCB0aGUgZW5kLCBubyBuZWVkIHRvIGNoZWNrIGN1cnJlbnRDb250ZW50LCBiZWNhdXNlIGl0IGRvZXMgbm90IGV4aXN0XG4gICAgICAgIGlmIChuID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRvbmU6IHRydWUsXG4gICAgICAgICAgICB2YWx1ZTogdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHdlIGZvdW5kIG4sIHNvIHdlIGNhbiBzZXQgY3VycmVudENvbnRlbnRcbiAgICAgICAgY3VycmVudENvbnRlbnQgPSBuLmNvbnRlbnQuZ2V0Q29udGVudCgpXG4gICAgICAgIGN1cnJlbnRDb250ZW50SW5kZXggPSAwXG4gICAgICAgIG4gPSBuLnJpZ2h0IC8vIHdlIHVzZWQgdGhlIGNvbnRlbnQgb2Ygbiwgbm93IGl0ZXJhdGUgdG8gbmV4dFxuICAgICAgfVxuICAgICAgY29uc3QgdmFsdWUgPSBjdXJyZW50Q29udGVudFtjdXJyZW50Q29udGVudEluZGV4KytdXG4gICAgICAvLyBjaGVjayBpZiB3ZSBuZWVkIHRvIGVtcHR5IGN1cnJlbnRDb250ZW50XG4gICAgICBpZiAoY3VycmVudENvbnRlbnQubGVuZ3RoIDw9IGN1cnJlbnRDb250ZW50SW5kZXgpIHtcbiAgICAgICAgY3VycmVudENvbnRlbnQgPSBudWxsXG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBkb25lOiBmYWxzZSxcbiAgICAgICAgdmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBhIHByb3ZpZGVkIGZ1bmN0aW9uIG9uIG9uY2Ugb24gZXZlcnkgZWxlbWVudCBvZiB0aGlzIFlBcnJheS5cbiAqIE9wZXJhdGVzIG9uIGEgc25hcHNob3R0ZWQgc3RhdGUgb2YgdGhlIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHR5cGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LG51bWJlcixBYnN0cmFjdFR5cGU8YW55Pik6dm9pZH0gZiBBIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgb24gZXZlcnkgZWxlbWVudCBvZiB0aGlzIFlBcnJheS5cbiAqIEBwYXJhbSB7U25hcHNob3R9IHNuYXBzaG90XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RGb3JFYWNoU25hcHNob3QgPSAodHlwZSwgZiwgc25hcHNob3QpID0+IHtcbiAgbGV0IGluZGV4ID0gMFxuICBsZXQgbiA9IHR5cGUuX3N0YXJ0XG4gIHdoaWxlIChuICE9PSBudWxsKSB7XG4gICAgaWYgKG4uY291bnRhYmxlICYmIGlzVmlzaWJsZShuLCBzbmFwc2hvdCkpIHtcbiAgICAgIGNvbnN0IGMgPSBuLmNvbnRlbnQuZ2V0Q29udGVudCgpXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZihjW2ldLCBpbmRleCsrLCB0eXBlKVxuICAgICAgfVxuICAgIH1cbiAgICBuID0gbi5yaWdodFxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gdHlwZVxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcmV0dXJuIHthbnl9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZUxpc3RHZXQgPSAodHlwZSwgaW5kZXgpID0+IHtcbiAgdHlwZS5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gIGNvbnN0IG1hcmtlciA9IGZpbmRNYXJrZXIodHlwZSwgaW5kZXgpXG4gIGxldCBuID0gdHlwZS5fc3RhcnRcbiAgaWYgKG1hcmtlciAhPT0gbnVsbCkge1xuICAgIG4gPSBtYXJrZXIucFxuICAgIGluZGV4IC09IG1hcmtlci5pbmRleFxuICB9XG4gIGZvciAoOyBuICE9PSBudWxsOyBuID0gbi5yaWdodCkge1xuICAgIGlmICghbi5kZWxldGVkICYmIG4uY291bnRhYmxlKSB7XG4gICAgICBpZiAoaW5kZXggPCBuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbi5jb250ZW50LmdldENvbnRlbnQoKVtpbmRleF1cbiAgICAgIH1cbiAgICAgIGluZGV4IC09IG4ubGVuZ3RoXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtJdGVtP30gcmVmZXJlbmNlSXRlbVxuICogQHBhcmFtIHtBcnJheTxPYmplY3Q8c3RyaW5nLGFueT58QXJyYXk8YW55Pnxib29sZWFufG51bWJlcnxudWxsfHN0cmluZ3xVaW50OEFycmF5Pn0gY29udGVudFxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3NBZnRlciA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCByZWZlcmVuY2VJdGVtLCBjb250ZW50KSA9PiB7XG4gIGxldCBsZWZ0ID0gcmVmZXJlbmNlSXRlbVxuICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgY29uc3Qgb3duQ2xpZW50SWQgPSBkb2MuY2xpZW50SURcbiAgY29uc3Qgc3RvcmUgPSBkb2Muc3RvcmVcbiAgY29uc3QgcmlnaHQgPSByZWZlcmVuY2VJdGVtID09PSBudWxsID8gcGFyZW50Ll9zdGFydCA6IHJlZmVyZW5jZUl0ZW0ucmlnaHRcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxPYmplY3R8QXJyYXk8YW55PnxudW1iZXJ8bnVsbD59XG4gICAqL1xuICBsZXQganNvbkNvbnRlbnQgPSBbXVxuICBjb25zdCBwYWNrSnNvbkNvbnRlbnQgPSAoKSA9PiB7XG4gICAgaWYgKGpzb25Db250ZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgIGxlZnQgPSBuZXcgSXRlbShjcmVhdGVJRChvd25DbGllbnRJZCwgZ2V0U3RhdGUoc3RvcmUsIG93bkNsaWVudElkKSksIGxlZnQsIGxlZnQgJiYgbGVmdC5sYXN0SWQsIHJpZ2h0LCByaWdodCAmJiByaWdodC5pZCwgcGFyZW50LCBudWxsLCBuZXcgQ29udGVudEFueShqc29uQ29udGVudCkpXG4gICAgICBsZWZ0LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgICAgIGpzb25Db250ZW50ID0gW11cbiAgICB9XG4gIH1cbiAgY29udGVudC5mb3JFYWNoKGMgPT4ge1xuICAgIGlmIChjID09PSBudWxsKSB7XG4gICAgICBqc29uQ29udGVudC5wdXNoKGMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAoYy5jb25zdHJ1Y3Rvcikge1xuICAgICAgICBjYXNlIE51bWJlcjpcbiAgICAgICAgY2FzZSBPYmplY3Q6XG4gICAgICAgIGNhc2UgQm9vbGVhbjpcbiAgICAgICAgY2FzZSBBcnJheTpcbiAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAganNvbkNvbnRlbnQucHVzaChjKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcGFja0pzb25Db250ZW50KClcbiAgICAgICAgICBzd2l0Y2ggKGMuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIGNhc2UgVWludDhBcnJheTpcbiAgICAgICAgICAgIGNhc2UgQXJyYXlCdWZmZXI6XG4gICAgICAgICAgICAgIGxlZnQgPSBuZXcgSXRlbShjcmVhdGVJRChvd25DbGllbnRJZCwgZ2V0U3RhdGUoc3RvcmUsIG93bkNsaWVudElkKSksIGxlZnQsIGxlZnQgJiYgbGVmdC5sYXN0SWQsIHJpZ2h0LCByaWdodCAmJiByaWdodC5pZCwgcGFyZW50LCBudWxsLCBuZXcgQ29udGVudEJpbmFyeShuZXcgVWludDhBcnJheSgvKiogQHR5cGUge1VpbnQ4QXJyYXl9ICovIChjKSkpKVxuICAgICAgICAgICAgICBsZWZ0LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgRG9jOlxuICAgICAgICAgICAgICBsZWZ0ID0gbmV3IEl0ZW0oY3JlYXRlSUQob3duQ2xpZW50SWQsIGdldFN0YXRlKHN0b3JlLCBvd25DbGllbnRJZCkpLCBsZWZ0LCBsZWZ0ICYmIGxlZnQubGFzdElkLCByaWdodCwgcmlnaHQgJiYgcmlnaHQuaWQsIHBhcmVudCwgbnVsbCwgbmV3IENvbnRlbnREb2MoLyoqIEB0eXBlIHtEb2N9ICovIChjKSkpXG4gICAgICAgICAgICAgIGxlZnQuaW50ZWdyYXRlKHRyYW5zYWN0aW9uLCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgaWYgKGMgaW5zdGFuY2VvZiBBYnN0cmFjdFR5cGUpIHtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbmV3IEl0ZW0oY3JlYXRlSUQob3duQ2xpZW50SWQsIGdldFN0YXRlKHN0b3JlLCBvd25DbGllbnRJZCkpLCBsZWZ0LCBsZWZ0ICYmIGxlZnQubGFzdElkLCByaWdodCwgcmlnaHQgJiYgcmlnaHQuaWQsIHBhcmVudCwgbnVsbCwgbmV3IENvbnRlbnRUeXBlKGMpKVxuICAgICAgICAgICAgICAgIGxlZnQuaW50ZWdyYXRlKHRyYW5zYWN0aW9uLCAwKVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBjb250ZW50IHR5cGUgaW4gaW5zZXJ0IG9wZXJhdGlvbicpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxuICBwYWNrSnNvbkNvbnRlbnQoKVxufVxuXG5jb25zdCBsZW5ndGhFeGNlZWRlZCA9ICgpID0+IGVycm9yLmNyZWF0ZSgnTGVuZ3RoIGV4Y2VlZGVkIScpXG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge0FycmF5PE9iamVjdDxzdHJpbmcsYW55PnxBcnJheTxhbnk+fG51bWJlcnxudWxsfHN0cmluZ3xVaW50OEFycmF5Pn0gY29udGVudFxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3MgPSAodHJhbnNhY3Rpb24sIHBhcmVudCwgaW5kZXgsIGNvbnRlbnQpID0+IHtcbiAgaWYgKGluZGV4ID4gcGFyZW50Ll9sZW5ndGgpIHtcbiAgICB0aHJvdyBsZW5ndGhFeGNlZWRlZCgpXG4gIH1cbiAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgaWYgKHBhcmVudC5fc2VhcmNoTWFya2VyKSB7XG4gICAgICB1cGRhdGVNYXJrZXJDaGFuZ2VzKHBhcmVudC5fc2VhcmNoTWFya2VyLCBpbmRleCwgY29udGVudC5sZW5ndGgpXG4gICAgfVxuICAgIHJldHVybiB0eXBlTGlzdEluc2VydEdlbmVyaWNzQWZ0ZXIodHJhbnNhY3Rpb24sIHBhcmVudCwgbnVsbCwgY29udGVudClcbiAgfVxuICBjb25zdCBzdGFydEluZGV4ID0gaW5kZXhcbiAgY29uc3QgbWFya2VyID0gZmluZE1hcmtlcihwYXJlbnQsIGluZGV4KVxuICBsZXQgbiA9IHBhcmVudC5fc3RhcnRcbiAgaWYgKG1hcmtlciAhPT0gbnVsbCkge1xuICAgIG4gPSBtYXJrZXIucFxuICAgIGluZGV4IC09IG1hcmtlci5pbmRleFxuICAgIC8vIHdlIG5lZWQgdG8gaXRlcmF0ZSBvbmUgdG8gdGhlIGxlZnQgc28gdGhhdCB0aGUgYWxnb3JpdGhtIHdvcmtzXG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAvLyBAdG9kbyByZWZhY3RvciB0aGlzIGFzIGl0IGFjdHVhbGx5IGRvZXNuJ3QgY29uc2lkZXIgZm9ybWF0c1xuICAgICAgbiA9IG4ucHJldiAvLyBpbXBvcnRhbnQhIGdldCB0aGUgbGVmdCB1bmRlbGV0ZWQgaXRlbSBzbyB0aGF0IHdlIGNhbiBhY3R1YWxseSBkZWNyZWFzZSBpbmRleFxuICAgICAgaW5kZXggKz0gKG4gJiYgbi5jb3VudGFibGUgJiYgIW4uZGVsZXRlZCkgPyBuLmxlbmd0aCA6IDBcbiAgICB9XG4gIH1cbiAgZm9yICg7IG4gIT09IG51bGw7IG4gPSBuLnJpZ2h0KSB7XG4gICAgaWYgKCFuLmRlbGV0ZWQgJiYgbi5jb3VudGFibGUpIHtcbiAgICAgIGlmIChpbmRleCA8PSBuLmxlbmd0aCkge1xuICAgICAgICBpZiAoaW5kZXggPCBuLmxlbmd0aCkge1xuICAgICAgICAgIC8vIGluc2VydCBpbi1iZXR3ZWVuXG4gICAgICAgICAgZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGNyZWF0ZUlEKG4uaWQuY2xpZW50LCBuLmlkLmNsb2NrICsgaW5kZXgpKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBpbmRleCAtPSBuLmxlbmd0aFxuICAgIH1cbiAgfVxuICBpZiAocGFyZW50Ll9zZWFyY2hNYXJrZXIpIHtcbiAgICB1cGRhdGVNYXJrZXJDaGFuZ2VzKHBhcmVudC5fc2VhcmNoTWFya2VyLCBzdGFydEluZGV4LCBjb250ZW50Lmxlbmd0aClcbiAgfVxuICByZXR1cm4gdHlwZUxpc3RJbnNlcnRHZW5lcmljc0FmdGVyKHRyYW5zYWN0aW9uLCBwYXJlbnQsIG4sIGNvbnRlbnQpXG59XG5cbi8qKlxuICogUHVzaGluZyBjb250ZW50IGlzIHNwZWNpYWwgYXMgd2UgZ2VuZXJhbGx5IHdhbnQgdG8gcHVzaCBhZnRlciB0aGUgbGFzdCBpdGVtLiBTbyB3ZSBkb24ndCBoYXZlIHRvIHVwZGF0ZVxuICogdGhlIHNlcmFjaCBtYXJrZXIuXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtBcnJheTxPYmplY3Q8c3RyaW5nLGFueT58QXJyYXk8YW55PnxudW1iZXJ8bnVsbHxzdHJpbmd8VWludDhBcnJheT59IGNvbnRlbnRcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTGlzdFB1c2hHZW5lcmljcyA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBjb250ZW50KSA9PiB7XG4gIC8vIFVzZSB0aGUgbWFya2VyIHdpdGggdGhlIGhpZ2hlc3QgaW5kZXggYW5kIGl0ZXJhdGUgdG8gdGhlIHJpZ2h0LlxuICBjb25zdCBtYXJrZXIgPSAocGFyZW50Ll9zZWFyY2hNYXJrZXIgfHwgW10pLnJlZHVjZSgobWF4TWFya2VyLCBjdXJyTWFya2VyKSA9PiBjdXJyTWFya2VyLmluZGV4ID4gbWF4TWFya2VyLmluZGV4ID8gY3Vyck1hcmtlciA6IG1heE1hcmtlciwgeyBpbmRleDogMCwgcDogcGFyZW50Ll9zdGFydCB9KVxuICBsZXQgbiA9IG1hcmtlci5wXG4gIGlmIChuKSB7XG4gICAgd2hpbGUgKG4ucmlnaHQpIHtcbiAgICAgIG4gPSBuLnJpZ2h0XG4gICAgfVxuICB9XG4gIHJldHVybiB0eXBlTGlzdEluc2VydEdlbmVyaWNzQWZ0ZXIodHJhbnNhY3Rpb24sIHBhcmVudCwgbiwgY29udGVudClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGhcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTGlzdERlbGV0ZSA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBpbmRleCwgbGVuZ3RoKSA9PiB7XG4gIGlmIChsZW5ndGggPT09IDApIHsgcmV0dXJuIH1cbiAgY29uc3Qgc3RhcnRJbmRleCA9IGluZGV4XG4gIGNvbnN0IHN0YXJ0TGVuZ3RoID0gbGVuZ3RoXG4gIGNvbnN0IG1hcmtlciA9IGZpbmRNYXJrZXIocGFyZW50LCBpbmRleClcbiAgbGV0IG4gPSBwYXJlbnQuX3N0YXJ0XG4gIGlmIChtYXJrZXIgIT09IG51bGwpIHtcbiAgICBuID0gbWFya2VyLnBcbiAgICBpbmRleCAtPSBtYXJrZXIuaW5kZXhcbiAgfVxuICAvLyBjb21wdXRlIHRoZSBmaXJzdCBpdGVtIHRvIGJlIGRlbGV0ZWRcbiAgZm9yICg7IG4gIT09IG51bGwgJiYgaW5kZXggPiAwOyBuID0gbi5yaWdodCkge1xuICAgIGlmICghbi5kZWxldGVkICYmIG4uY291bnRhYmxlKSB7XG4gICAgICBpZiAoaW5kZXggPCBuLmxlbmd0aCkge1xuICAgICAgICBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgY3JlYXRlSUQobi5pZC5jbGllbnQsIG4uaWQuY2xvY2sgKyBpbmRleCkpXG4gICAgICB9XG4gICAgICBpbmRleCAtPSBuLmxlbmd0aFxuICAgIH1cbiAgfVxuICAvLyBkZWxldGUgYWxsIGl0ZW1zIHVudGlsIGRvbmVcbiAgd2hpbGUgKGxlbmd0aCA+IDAgJiYgbiAhPT0gbnVsbCkge1xuICAgIGlmICghbi5kZWxldGVkKSB7XG4gICAgICBpZiAobGVuZ3RoIDwgbi5sZW5ndGgpIHtcbiAgICAgICAgZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGNyZWF0ZUlEKG4uaWQuY2xpZW50LCBuLmlkLmNsb2NrICsgbGVuZ3RoKSlcbiAgICAgIH1cbiAgICAgIG4uZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgbGVuZ3RoIC09IG4ubGVuZ3RoXG4gICAgfVxuICAgIG4gPSBuLnJpZ2h0XG4gIH1cbiAgaWYgKGxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBsZW5ndGhFeGNlZWRlZCgpXG4gIH1cbiAgaWYgKHBhcmVudC5fc2VhcmNoTWFya2VyKSB7XG4gICAgdXBkYXRlTWFya2VyQ2hhbmdlcyhwYXJlbnQuX3NlYXJjaE1hcmtlciwgc3RhcnRJbmRleCwgLXN0YXJ0TGVuZ3RoICsgbGVuZ3RoIC8qIGluIGNhc2Ugd2UgcmVtb3ZlIHRoZSBhYm92ZSBleGNlcHRpb24gKi8pXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZU1hcERlbGV0ZSA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBrZXkpID0+IHtcbiAgY29uc3QgYyA9IHBhcmVudC5fbWFwLmdldChrZXkpXG4gIGlmIChjICE9PSB1bmRlZmluZWQpIHtcbiAgICBjLmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7T2JqZWN0fG51bWJlcnxudWxsfEFycmF5PGFueT58c3RyaW5nfFVpbnQ4QXJyYXl8QWJzdHJhY3RUeXBlPGFueT59IHZhbHVlXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZU1hcFNldCA9ICh0cmFuc2FjdGlvbiwgcGFyZW50LCBrZXksIHZhbHVlKSA9PiB7XG4gIGNvbnN0IGxlZnQgPSBwYXJlbnQuX21hcC5nZXQoa2V5KSB8fCBudWxsXG4gIGNvbnN0IGRvYyA9IHRyYW5zYWN0aW9uLmRvY1xuICBjb25zdCBvd25DbGllbnRJZCA9IGRvYy5jbGllbnRJRFxuICBsZXQgY29udGVudFxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIGNvbnRlbnQgPSBuZXcgQ29udGVudEFueShbdmFsdWVdKVxuICB9IGVsc2Uge1xuICAgIHN3aXRjaCAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgIGNhc2UgTnVtYmVyOlxuICAgICAgY2FzZSBPYmplY3Q6XG4gICAgICBjYXNlIEJvb2xlYW46XG4gICAgICBjYXNlIEFycmF5OlxuICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgIGNvbnRlbnQgPSBuZXcgQ29udGVudEFueShbdmFsdWVdKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBVaW50OEFycmF5OlxuICAgICAgICBjb250ZW50ID0gbmV3IENvbnRlbnRCaW5hcnkoLyoqIEB0eXBlIHtVaW50OEFycmF5fSAqLyAodmFsdWUpKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBEb2M6XG4gICAgICAgIGNvbnRlbnQgPSBuZXcgQ29udGVudERvYygvKiogQHR5cGUge0RvY30gKi8gKHZhbHVlKSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFic3RyYWN0VHlwZSkge1xuICAgICAgICAgIGNvbnRlbnQgPSBuZXcgQ29udGVudFR5cGUodmFsdWUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIGNvbnRlbnQgdHlwZScpXG4gICAgICAgIH1cbiAgICB9XG4gIH1cbiAgbmV3IEl0ZW0oY3JlYXRlSUQob3duQ2xpZW50SWQsIGdldFN0YXRlKGRvYy5zdG9yZSwgb3duQ2xpZW50SWQpKSwgbGVmdCwgbGVmdCAmJiBsZWZ0Lmxhc3RJZCwgbnVsbCwgbnVsbCwgcGFyZW50LCBrZXksIGNvbnRlbnQpLmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsYW55PnxudW1iZXJ8bnVsbHxBcnJheTxhbnk+fHN0cmluZ3xVaW50OEFycmF5fEFic3RyYWN0VHlwZTxhbnk+fHVuZGVmaW5lZH1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTWFwR2V0ID0gKHBhcmVudCwga2V5KSA9PiB7XG4gIHBhcmVudC5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gIGNvbnN0IHZhbCA9IHBhcmVudC5fbWFwLmdldChrZXkpXG4gIHJldHVybiB2YWwgIT09IHVuZGVmaW5lZCAmJiAhdmFsLmRlbGV0ZWQgPyB2YWwuY29udGVudC5nZXRDb250ZW50KClbdmFsLmxlbmd0aCAtIDFdIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLE9iamVjdDxzdHJpbmcsYW55PnxudW1iZXJ8bnVsbHxBcnJheTxhbnk+fHN0cmluZ3xVaW50OEFycmF5fEFic3RyYWN0VHlwZTxhbnk+fHVuZGVmaW5lZD59XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgdHlwZU1hcEdldEFsbCA9IChwYXJlbnQpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAqL1xuICBjb25zdCByZXMgPSB7fVxuICBwYXJlbnQuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICBwYXJlbnQuX21hcC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgaWYgKCF2YWx1ZS5kZWxldGVkKSB7XG4gICAgICByZXNba2V5XSA9IHZhbHVlLmNvbnRlbnQuZ2V0Q29udGVudCgpW3ZhbHVlLmxlbmd0aCAtIDFdXG4gICAgfVxuICB9KVxuICByZXR1cm4gcmVzXG59XG5cbi8qKlxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVNYXBIYXMgPSAocGFyZW50LCBrZXkpID0+IHtcbiAgcGFyZW50LmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgY29uc3QgdmFsID0gcGFyZW50Ll9tYXAuZ2V0KGtleSlcbiAgcmV0dXJuIHZhbCAhPT0gdW5kZWZpbmVkICYmICF2YWwuZGVsZXRlZFxufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsYW55PnxudW1iZXJ8bnVsbHxBcnJheTxhbnk+fHN0cmluZ3xVaW50OEFycmF5fEFic3RyYWN0VHlwZTxhbnk+fHVuZGVmaW5lZH1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTWFwR2V0U25hcHNob3QgPSAocGFyZW50LCBrZXksIHNuYXBzaG90KSA9PiB7XG4gIGxldCB2ID0gcGFyZW50Ll9tYXAuZ2V0KGtleSkgfHwgbnVsbFxuICB3aGlsZSAodiAhPT0gbnVsbCAmJiAoIXNuYXBzaG90LnN2Lmhhcyh2LmlkLmNsaWVudCkgfHwgdi5pZC5jbG9jayA+PSAoc25hcHNob3Quc3YuZ2V0KHYuaWQuY2xpZW50KSB8fCAwKSkpIHtcbiAgICB2ID0gdi5sZWZ0XG4gIH1cbiAgcmV0dXJuIHYgIT09IG51bGwgJiYgaXNWaXNpYmxlKHYsIHNuYXBzaG90KSA/IHYuY29udGVudC5nZXRDb250ZW50KClbdi5sZW5ndGggLSAxXSA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtTbmFwc2hvdH0gc25hcHNob3RcbiAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsT2JqZWN0PHN0cmluZyxhbnk+fG51bWJlcnxudWxsfEFycmF5PGFueT58c3RyaW5nfFVpbnQ4QXJyYXl8QWJzdHJhY3RUeXBlPGFueT58dW5kZWZpbmVkPn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCB0eXBlTWFwR2V0QWxsU25hcHNob3QgPSAocGFyZW50LCBzbmFwc2hvdCkgPT4ge1xuICAvKipcbiAgICogQHR5cGUge09iamVjdDxzdHJpbmcsYW55Pn1cbiAgICovXG4gIGNvbnN0IHJlcyA9IHt9XG4gIHBhcmVudC5fbWFwLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgICAqL1xuICAgIGxldCB2ID0gdmFsdWVcbiAgICB3aGlsZSAodiAhPT0gbnVsbCAmJiAoIXNuYXBzaG90LnN2Lmhhcyh2LmlkLmNsaWVudCkgfHwgdi5pZC5jbG9jayA+PSAoc25hcHNob3Quc3YuZ2V0KHYuaWQuY2xpZW50KSB8fCAwKSkpIHtcbiAgICAgIHYgPSB2LmxlZnRcbiAgICB9XG4gICAgaWYgKHYgIT09IG51bGwgJiYgaXNWaXNpYmxlKHYsIHNuYXBzaG90KSkge1xuICAgICAgcmVzW2tleV0gPSB2LmNvbnRlbnQuZ2V0Q29udGVudCgpW3YubGVuZ3RoIC0gMV1cbiAgICB9XG4gIH0pXG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+ICYgeyBfbWFwOiBNYXA8c3RyaW5nLCBJdGVtPiB9fSB0eXBlXG4gKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPEFycmF5PGFueT4+fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZU1hcEl0ZXJhdG9yID0gdHlwZSA9PiB7XG4gIHR5cGUuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICByZXR1cm4gaXRlcmF0b3IuaXRlcmF0b3JGaWx0ZXIodHlwZS5fbWFwLmVudHJpZXMoKSwgLyoqIEBwYXJhbSB7YW55fSBlbnRyeSAqLyBlbnRyeSA9PiAhZW50cnlbMV0uZGVsZXRlZClcbn1cbiIsICIvKipcbiAqIEBtb2R1bGUgWUFycmF5XG4gKi9cblxuaW1wb3J0IHtcbiAgWUV2ZW50LFxuICBBYnN0cmFjdFR5cGUsXG4gIHR5cGVMaXN0R2V0LFxuICB0eXBlTGlzdFRvQXJyYXksXG4gIHR5cGVMaXN0Rm9yRWFjaCxcbiAgdHlwZUxpc3RDcmVhdGVJdGVyYXRvcixcbiAgdHlwZUxpc3RJbnNlcnRHZW5lcmljcyxcbiAgdHlwZUxpc3RQdXNoR2VuZXJpY3MsXG4gIHR5cGVMaXN0RGVsZXRlLFxuICB0eXBlTGlzdE1hcCxcbiAgWUFycmF5UmVmSUQsXG4gIGNhbGxUeXBlT2JzZXJ2ZXJzLFxuICB0cmFuc2FjdCxcbiAgd2FyblByZW1hdHVyZUFjY2VzcyxcbiAgQXJyYXlTZWFyY2hNYXJrZXIsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgRG9jLCBUcmFuc2FjdGlvbiwgSXRlbSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcbmltcG9ydCB7IHR5cGVMaXN0U2xpY2UgfSBmcm9tICcuL0Fic3RyYWN0VHlwZS5qcydcblxuLyoqXG4gKiBFdmVudCB0aGF0IGRlc2NyaWJlcyB0aGUgY2hhbmdlcyBvbiBhIFlBcnJheVxuICogQHRlbXBsYXRlIFRcbiAqIEBleHRlbmRzIFlFdmVudDxZQXJyYXk8VD4+XG4gKi9cbmV4cG9ydCBjbGFzcyBZQXJyYXlFdmVudCBleHRlbmRzIFlFdmVudCB7fVxuXG4vKipcbiAqIEEgc2hhcmVkIEFycmF5IGltcGxlbWVudGF0aW9uLlxuICogQHRlbXBsYXRlIFRcbiAqIEBleHRlbmRzIEFic3RyYWN0VHlwZTxZQXJyYXlFdmVudDxUPj5cbiAqIEBpbXBsZW1lbnRzIHtJdGVyYWJsZTxUPn1cbiAqL1xuZXhwb3J0IGNsYXNzIFlBcnJheSBleHRlbmRzIEFic3RyYWN0VHlwZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PGFueT4/fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fcHJlbGltQ29udGVudCA9IFtdXG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PEFycmF5U2VhcmNoTWFya2VyPn1cbiAgICAgKi9cbiAgICB0aGlzLl9zZWFyY2hNYXJrZXIgPSBbXVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIG5ldyBZQXJyYXkgY29udGFpbmluZyB0aGUgc3BlY2lmaWVkIGl0ZW1zLlxuICAgKiBAdGVtcGxhdGUge09iamVjdDxzdHJpbmcsYW55PnxBcnJheTxhbnk+fG51bWJlcnxudWxsfHN0cmluZ3xVaW50OEFycmF5fSBUXG4gICAqIEBwYXJhbSB7QXJyYXk8VD59IGl0ZW1zXG4gICAqIEByZXR1cm4ge1lBcnJheTxUPn1cbiAgICovXG4gIHN0YXRpYyBmcm9tIChpdGVtcykge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtZQXJyYXk8VD59XG4gICAgICovXG4gICAgY29uc3QgYSA9IG5ldyBZQXJyYXkoKVxuICAgIGEucHVzaChpdGVtcylcbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLyoqXG4gICAqIEludGVncmF0ZSB0aGlzIHR5cGUgaW50byB0aGUgWWpzIGluc3RhbmNlLlxuICAgKlxuICAgKiAqIFNhdmUgdGhpcyBzdHJ1Y3QgaW4gdGhlIG9zXG4gICAqICogVGhpcyB0eXBlIGlzIHNlbnQgdG8gb3RoZXIgY2xpZW50XG4gICAqICogT2JzZXJ2ZXIgZnVuY3Rpb25zIGFyZSBmaXJlZFxuICAgKlxuICAgKiBAcGFyYW0ge0RvY30geSBUaGUgWWpzIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICAgKi9cbiAgX2ludGVncmF0ZSAoeSwgaXRlbSkge1xuICAgIHN1cGVyLl9pbnRlZ3JhdGUoeSwgaXRlbSlcbiAgICB0aGlzLmluc2VydCgwLCAvKiogQHR5cGUge0FycmF5PGFueT59ICovICh0aGlzLl9wcmVsaW1Db250ZW50KSlcbiAgICB0aGlzLl9wcmVsaW1Db250ZW50ID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1lBcnJheTxUPn1cbiAgICovXG4gIF9jb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IFlBcnJheSgpXG4gIH1cblxuICAvKipcbiAgICogTWFrZXMgYSBjb3B5IG9mIHRoaXMgZGF0YSB0eXBlIHRoYXQgY2FuIGJlIGluY2x1ZGVkIHNvbWV3aGVyZSBlbHNlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIGNvbnRlbnQgaXMgb25seSByZWFkYWJsZSBfYWZ0ZXJfIGl0IGhhcyBiZWVuIGluY2x1ZGVkIHNvbWV3aGVyZSBpbiB0aGUgWWRvYy5cbiAgICpcbiAgICogQHJldHVybiB7WUFycmF5PFQ+fVxuICAgKi9cbiAgY2xvbmUgKCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtZQXJyYXk8VD59XG4gICAgICovXG4gICAgY29uc3QgYXJyID0gbmV3IFlBcnJheSgpXG4gICAgYXJyLmluc2VydCgwLCB0aGlzLnRvQXJyYXkoKS5tYXAoZWwgPT5cbiAgICAgIGVsIGluc3RhbmNlb2YgQWJzdHJhY3RUeXBlID8gLyoqIEB0eXBlIHt0eXBlb2YgZWx9ICovIChlbC5jbG9uZSgpKSA6IGVsXG4gICAgKSlcbiAgICByZXR1cm4gYXJyXG4gIH1cblxuICBnZXQgbGVuZ3RoICgpIHtcbiAgICB0aGlzLmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBZQXJyYXlFdmVudCBhbmQgY2FsbHMgb2JzZXJ2ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge1NldDxudWxsfHN0cmluZz59IHBhcmVudFN1YnMgS2V5cyBjaGFuZ2VkIG9uIHRoaXMgdHlwZS4gYG51bGxgIGlmIGxpc3Qgd2FzIG1vZGlmaWVkLlxuICAgKi9cbiAgX2NhbGxPYnNlcnZlciAodHJhbnNhY3Rpb24sIHBhcmVudFN1YnMpIHtcbiAgICBzdXBlci5fY2FsbE9ic2VydmVyKHRyYW5zYWN0aW9uLCBwYXJlbnRTdWJzKVxuICAgIGNhbGxUeXBlT2JzZXJ2ZXJzKHRoaXMsIHRyYW5zYWN0aW9uLCBuZXcgWUFycmF5RXZlbnQodGhpcywgdHJhbnNhY3Rpb24pKVxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydHMgbmV3IGNvbnRlbnQgYXQgYW4gaW5kZXguXG4gICAqXG4gICAqIEltcG9ydGFudDogVGhpcyBmdW5jdGlvbiBleHBlY3RzIGFuIGFycmF5IG9mIGNvbnRlbnQuIE5vdCBqdXN0IGEgY29udGVudFxuICAgKiBvYmplY3QuIFRoZSByZWFzb24gZm9yIHRoaXMgXCJ3ZWlyZG5lc3NcIiBpcyB0aGF0IGluc2VydGluZyBzZXZlcmFsIGVsZW1lbnRzXG4gICAqIGlzIHZlcnkgZWZmaWNpZW50IHdoZW4gaXQgaXMgZG9uZSBhcyBhIHNpbmdsZSBvcGVyYXRpb24uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAvLyBJbnNlcnQgY2hhcmFjdGVyICdhJyBhdCBwb3NpdGlvbiAwXG4gICAqICB5YXJyYXkuaW5zZXJ0KDAsIFsnYSddKVxuICAgKiAgLy8gSW5zZXJ0IG51bWJlcnMgMSwgMiBhdCBwb3NpdGlvbiAxXG4gICAqICB5YXJyYXkuaW5zZXJ0KDEsIFsxLCAyXSlcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCB0byBpbnNlcnQgY29udGVudCBhdC5cbiAgICogQHBhcmFtIHtBcnJheTxUPn0gY29udGVudCBUaGUgYXJyYXkgb2YgY29udGVudFxuICAgKi9cbiAgaW5zZXJ0IChpbmRleCwgY29udGVudCkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHlwZUxpc3RJbnNlcnRHZW5lcmljcyh0cmFuc2FjdGlvbiwgdGhpcywgaW5kZXgsIC8qKiBAdHlwZSB7YW55fSAqLyAoY29udGVudCkpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge0FycmF5PGFueT59ICovICh0aGlzLl9wcmVsaW1Db250ZW50KS5zcGxpY2UoaW5kZXgsIDAsIC4uLmNvbnRlbnQpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZHMgY29udGVudCB0byB0aGlzIFlBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxUPn0gY29udGVudCBBcnJheSBvZiBjb250ZW50IHRvIGFwcGVuZC5cbiAgICpcbiAgICogQHRvZG8gVXNlIHRoZSBmb2xsb3dpbmcgaW1wbGVtZW50YXRpb24gaW4gYWxsIHR5cGVzLlxuICAgKi9cbiAgcHVzaCAoY29udGVudCkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHlwZUxpc3RQdXNoR2VuZXJpY3ModHJhbnNhY3Rpb24sIHRoaXMsIC8qKiBAdHlwZSB7YW55fSAqLyAoY29udGVudCkpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge0FycmF5PGFueT59ICovICh0aGlzLl9wcmVsaW1Db250ZW50KS5wdXNoKC4uLmNvbnRlbnQpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBlbmRzIGNvbnRlbnQgdG8gdGhpcyBZQXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXk8VD59IGNvbnRlbnQgQXJyYXkgb2YgY29udGVudCB0byBwcmVwZW5kLlxuICAgKi9cbiAgdW5zaGlmdCAoY29udGVudCkge1xuICAgIHRoaXMuaW5zZXJ0KDAsIGNvbnRlbnQpXG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBlbGVtZW50cyBzdGFydGluZyBmcm9tIGFuIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggSW5kZXggYXQgd2hpY2ggdG8gc3RhcnQgZGVsZXRpbmcgZWxlbWVudHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIHJlbW92ZS4gRGVmYXVsdHMgdG8gMS5cbiAgICovXG4gIGRlbGV0ZSAoaW5kZXgsIGxlbmd0aCA9IDEpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHR5cGVMaXN0RGVsZXRlKHRyYW5zYWN0aW9uLCB0aGlzLCBpbmRleCwgbGVuZ3RoKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudCkuc3BsaWNlKGluZGV4LCBsZW5ndGgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGktdGggZWxlbWVudCBmcm9tIGEgWUFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHJldHVybiBmcm9tIHRoZSBZQXJyYXlcbiAgICogQHJldHVybiB7VH1cbiAgICovXG4gIGdldCAoaW5kZXgpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RHZXQodGhpcywgaW5kZXgpXG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyB0aGlzIFlBcnJheSB0byBhIEphdmFTY3JpcHQgQXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5PFQ+fVxuICAgKi9cbiAgdG9BcnJheSAoKSB7XG4gICAgcmV0dXJuIHR5cGVMaXN0VG9BcnJheSh0aGlzKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwb3J0aW9uIG9mIHRoaXMgWUFycmF5IGludG8gYSBKYXZhU2NyaXB0IEFycmF5IHNlbGVjdGVkXG4gICAqIGZyb20gc3RhcnQgdG8gZW5kIChlbmQgbm90IGluY2x1ZGVkKS5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydF1cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtlbmRdXG4gICAqIEByZXR1cm4ge0FycmF5PFQ+fVxuICAgKi9cbiAgc2xpY2UgKHN0YXJ0ID0gMCwgZW5kID0gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgdGhpcyBTaGFyZWQgVHlwZSB0byBhIEpTT04gb2JqZWN0LlxuICAgKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgdG9KU09OICgpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAoYyA9PiBjIGluc3RhbmNlb2YgQWJzdHJhY3RUeXBlID8gYy50b0pTT04oKSA6IGMpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBBcnJheSB3aXRoIHRoZSByZXN1bHQgb2YgY2FsbGluZyBhIHByb3ZpZGVkIGZ1bmN0aW9uIG9uIGV2ZXJ5XG4gICAqIGVsZW1lbnQgb2YgdGhpcyBZQXJyYXkuXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSBNXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oVCxudW1iZXIsWUFycmF5PFQ+KTpNfSBmIEZ1bmN0aW9uIHRoYXQgcHJvZHVjZXMgYW4gZWxlbWVudCBvZiB0aGUgbmV3IEFycmF5XG4gICAqIEByZXR1cm4ge0FycmF5PE0+fSBBIG5ldyBhcnJheSB3aXRoIGVhY2ggZWxlbWVudCBiZWluZyB0aGUgcmVzdWx0IG9mIHRoZVxuICAgKiAgICAgICAgICAgICAgICAgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICovXG4gIG1hcCAoZikge1xuICAgIHJldHVybiB0eXBlTGlzdE1hcCh0aGlzLCAvKiogQHR5cGUge2FueX0gKi8gKGYpKVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGEgcHJvdmlkZWQgZnVuY3Rpb24gb25jZSBvbiBldmVyeSBlbGVtZW50IG9mIHRoaXMgWUFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFQsbnVtYmVyLFlBcnJheTxUPik6dm9pZH0gZiBBIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgb24gZXZlcnkgZWxlbWVudCBvZiB0aGlzIFlBcnJheS5cbiAgICovXG4gIGZvckVhY2ggKGYpIHtcbiAgICB0eXBlTGlzdEZvckVhY2godGhpcywgZilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPFQ+fVxuICAgKi9cbiAgW1N5bWJvbC5pdGVyYXRvcl0gKCkge1xuICAgIHJldHVybiB0eXBlTGlzdENyZWF0ZUl0ZXJhdG9yKHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICovXG4gIF93cml0ZSAoZW5jb2Rlcikge1xuICAgIGVuY29kZXIud3JpdGVUeXBlUmVmKFlBcnJheVJlZklEKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IF9kZWNvZGVyXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFlBcnJheSA9IF9kZWNvZGVyID0+IG5ldyBZQXJyYXkoKVxuIiwgIi8qKlxuICogQG1vZHVsZSBZTWFwXG4gKi9cblxuaW1wb3J0IHtcbiAgWUV2ZW50LFxuICBBYnN0cmFjdFR5cGUsXG4gIHR5cGVNYXBEZWxldGUsXG4gIHR5cGVNYXBTZXQsXG4gIHR5cGVNYXBHZXQsXG4gIHR5cGVNYXBIYXMsXG4gIGNyZWF0ZU1hcEl0ZXJhdG9yLFxuICBZTWFwUmVmSUQsXG4gIGNhbGxUeXBlT2JzZXJ2ZXJzLFxuICB0cmFuc2FjdCxcbiAgd2FyblByZW1hdHVyZUFjY2VzcyxcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBEb2MsIFRyYW5zYWN0aW9uLCBJdGVtIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBpdGVyYXRvciBmcm9tICdsaWIwL2l0ZXJhdG9yJ1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAZXh0ZW5kcyBZRXZlbnQ8WU1hcDxUPj5cbiAqIEV2ZW50IHRoYXQgZGVzY3JpYmVzIHRoZSBjaGFuZ2VzIG9uIGEgWU1hcC5cbiAqL1xuZXhwb3J0IGNsYXNzIFlNYXBFdmVudCBleHRlbmRzIFlFdmVudCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1lNYXA8VD59IHltYXAgVGhlIFlBcnJheSB0aGF0IGNoYW5nZWQuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7U2V0PGFueT59IHN1YnMgVGhlIGtleXMgdGhhdCBjaGFuZ2VkLlxuICAgKi9cbiAgY29uc3RydWN0b3IgKHltYXAsIHRyYW5zYWN0aW9uLCBzdWJzKSB7XG4gICAgc3VwZXIoeW1hcCwgdHJhbnNhY3Rpb24pXG4gICAgdGhpcy5rZXlzQ2hhbmdlZCA9IHN1YnNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBNYXBUeXBlXG4gKiBBIHNoYXJlZCBNYXAgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQGV4dGVuZHMgQWJzdHJhY3RUeXBlPFlNYXBFdmVudDxNYXBUeXBlPj5cbiAqIEBpbXBsZW1lbnRzIHtJdGVyYWJsZTxbc3RyaW5nLCBNYXBUeXBlXT59XG4gKi9cbmV4cG9ydCBjbGFzcyBZTWFwIGV4dGVuZHMgQWJzdHJhY3RUeXBlIHtcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSB7SXRlcmFibGU8cmVhZG9ubHkgW3N0cmluZywgYW55XT49fSBlbnRyaWVzIC0gYW4gb3B0aW9uYWwgaXRlcmFibGUgdG8gaW5pdGlhbGl6ZSB0aGUgWU1hcFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGVudHJpZXMpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge01hcDxzdHJpbmcsYW55Pj99XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9wcmVsaW1Db250ZW50ID0gbnVsbFxuXG4gICAgaWYgKGVudHJpZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fcHJlbGltQ29udGVudCA9IG5ldyBNYXAoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9wcmVsaW1Db250ZW50ID0gbmV3IE1hcChlbnRyaWVzKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlZ3JhdGUgdGhpcyB0eXBlIGludG8gdGhlIFlqcyBpbnN0YW5jZS5cbiAgICpcbiAgICogKiBTYXZlIHRoaXMgc3RydWN0IGluIHRoZSBvc1xuICAgKiAqIFRoaXMgdHlwZSBpcyBzZW50IHRvIG90aGVyIGNsaWVudFxuICAgKiAqIE9ic2VydmVyIGZ1bmN0aW9ucyBhcmUgZmlyZWRcbiAgICpcbiAgICogQHBhcmFtIHtEb2N9IHkgVGhlIFlqcyBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIF9pbnRlZ3JhdGUgKHksIGl0ZW0pIHtcbiAgICBzdXBlci5faW50ZWdyYXRlKHksIGl0ZW0pXG4gICAgOy8qKiBAdHlwZSB7TWFwPHN0cmluZywgYW55Pn0gKi8gKHRoaXMuX3ByZWxpbUNvbnRlbnQpLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIHRoaXMuc2V0KGtleSwgdmFsdWUpXG4gICAgfSlcbiAgICB0aGlzLl9wcmVsaW1Db250ZW50ID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1lNYXA8TWFwVHlwZT59XG4gICAqL1xuICBfY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBZTWFwKClcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIGNvcHkgb2YgdGhpcyBkYXRhIHR5cGUgdGhhdCBjYW4gYmUgaW5jbHVkZWQgc29tZXdoZXJlIGVsc2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgY29udGVudCBpcyBvbmx5IHJlYWRhYmxlIF9hZnRlcl8gaXQgaGFzIGJlZW4gaW5jbHVkZWQgc29tZXdoZXJlIGluIHRoZSBZZG9jLlxuICAgKlxuICAgKiBAcmV0dXJuIHtZTWFwPE1hcFR5cGU+fVxuICAgKi9cbiAgY2xvbmUgKCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtZTWFwPE1hcFR5cGU+fVxuICAgICAqL1xuICAgIGNvbnN0IG1hcCA9IG5ldyBZTWFwKClcbiAgICB0aGlzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIG1hcC5zZXQoa2V5LCB2YWx1ZSBpbnN0YW5jZW9mIEFic3RyYWN0VHlwZSA/IC8qKiBAdHlwZSB7dHlwZW9mIHZhbHVlfSAqLyAodmFsdWUuY2xvbmUoKSkgOiB2YWx1ZSlcbiAgICB9KVxuICAgIHJldHVybiBtYXBcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFlNYXBFdmVudCBhbmQgY2FsbHMgb2JzZXJ2ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge1NldDxudWxsfHN0cmluZz59IHBhcmVudFN1YnMgS2V5cyBjaGFuZ2VkIG9uIHRoaXMgdHlwZS4gYG51bGxgIGlmIGxpc3Qgd2FzIG1vZGlmaWVkLlxuICAgKi9cbiAgX2NhbGxPYnNlcnZlciAodHJhbnNhY3Rpb24sIHBhcmVudFN1YnMpIHtcbiAgICBjYWxsVHlwZU9ic2VydmVycyh0aGlzLCB0cmFuc2FjdGlvbiwgbmV3IFlNYXBFdmVudCh0aGlzLCB0cmFuc2FjdGlvbiwgcGFyZW50U3VicykpXG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyB0aGlzIFNoYXJlZCBUeXBlIHRvIGEgSlNPTiBvYmplY3QuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsYW55Pn1cbiAgICovXG4gIHRvSlNPTiAoKSB7XG4gICAgdGhpcy5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gICAgLyoqXG4gICAgICogQHR5cGUge09iamVjdDxzdHJpbmcsTWFwVHlwZT59XG4gICAgICovXG4gICAgY29uc3QgbWFwID0ge31cbiAgICB0aGlzLl9tYXAuZm9yRWFjaCgoaXRlbSwga2V5KSA9PiB7XG4gICAgICBpZiAoIWl0ZW0uZGVsZXRlZCkge1xuICAgICAgICBjb25zdCB2ID0gaXRlbS5jb250ZW50LmdldENvbnRlbnQoKVtpdGVtLmxlbmd0aCAtIDFdXG4gICAgICAgIG1hcFtrZXldID0gdiBpbnN0YW5jZW9mIEFic3RyYWN0VHlwZSA/IHYudG9KU09OKCkgOiB2XG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gbWFwXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgWU1hcCAoY291bnQgb2Yga2V5L3ZhbHVlIHBhaXJzKVxuICAgKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgc2l6ZSAoKSB7XG4gICAgcmV0dXJuIFsuLi5jcmVhdGVNYXBJdGVyYXRvcih0aGlzKV0ubGVuZ3RoXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUga2V5cyBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBZTWFwIFR5cGUuXG4gICAqXG4gICAqIEByZXR1cm4ge0l0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPn1cbiAgICovXG4gIGtleXMgKCkge1xuICAgIHJldHVybiBpdGVyYXRvci5pdGVyYXRvck1hcChjcmVhdGVNYXBJdGVyYXRvcih0aGlzKSwgLyoqIEBwYXJhbSB7YW55fSB2ICovIHYgPT4gdlswXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZXMgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgWU1hcCBUeXBlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPE1hcFR5cGU+fVxuICAgKi9cbiAgdmFsdWVzICgpIHtcbiAgICByZXR1cm4gaXRlcmF0b3IuaXRlcmF0b3JNYXAoY3JlYXRlTWFwSXRlcmF0b3IodGhpcyksIC8qKiBAcGFyYW0ge2FueX0gdiAqLyB2ID0+IHZbMV0uY29udGVudC5nZXRDb250ZW50KClbdlsxXS5sZW5ndGggLSAxXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIEl0ZXJhdG9yIG9mIFtrZXksIHZhbHVlXSBwYWlyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPFtzdHJpbmcsIE1hcFR5cGVdPn1cbiAgICovXG4gIGVudHJpZXMgKCkge1xuICAgIHJldHVybiBpdGVyYXRvci5pdGVyYXRvck1hcChjcmVhdGVNYXBJdGVyYXRvcih0aGlzKSwgLyoqIEBwYXJhbSB7YW55fSB2ICovIHYgPT4gLyoqIEB0eXBlIHthbnl9ICovIChbdlswXSwgdlsxXS5jb250ZW50LmdldENvbnRlbnQoKVt2WzFdLmxlbmd0aCAtIDFdXSkpXG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYSBwcm92aWRlZCBmdW5jdGlvbiBvbiBvbmNlIG9uIGV2ZXJ5IGtleS12YWx1ZSBwYWlyLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE1hcFR5cGUsc3RyaW5nLFlNYXA8TWFwVHlwZT4pOnZvaWR9IGYgQSBmdW5jdGlvbiB0byBleGVjdXRlIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhpcyBZQXJyYXkuXG4gICAqL1xuICBmb3JFYWNoIChmKSB7XG4gICAgdGhpcy5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gICAgdGhpcy5fbWFwLmZvckVhY2goKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgaWYgKCFpdGVtLmRlbGV0ZWQpIHtcbiAgICAgICAgZihpdGVtLmNvbnRlbnQuZ2V0Q29udGVudCgpW2l0ZW0ubGVuZ3RoIC0gMV0sIGtleSwgdGhpcylcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gSXRlcmF0b3Igb2YgW2tleSwgdmFsdWVdIHBhaXJzXG4gICAqXG4gICAqIEByZXR1cm4ge0l0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgTWFwVHlwZV0+fVxuICAgKi9cbiAgW1N5bWJvbC5pdGVyYXRvcl0gKCkge1xuICAgIHJldHVybiB0aGlzLmVudHJpZXMoKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIHNwZWNpZmllZCBlbGVtZW50IGZyb20gdGhpcyBZTWFwLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVsZW1lbnQgdG8gcmVtb3ZlLlxuICAgKi9cbiAgZGVsZXRlIChrZXkpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHR5cGVNYXBEZWxldGUodHJhbnNhY3Rpb24sIHRoaXMsIGtleSlcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgYW55Pn0gKi8gKHRoaXMuX3ByZWxpbUNvbnRlbnQpLmRlbGV0ZShrZXkpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgb3IgdXBkYXRlcyBhbiBlbGVtZW50IHdpdGggYSBzcGVjaWZpZWQga2V5IGFuZCB2YWx1ZS5cbiAgICogQHRlbXBsYXRlIHtNYXBUeXBlfSBWQUxcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbGVtZW50IHRvIGFkZCB0byB0aGlzIFlNYXBcbiAgICogQHBhcmFtIHtWQUx9IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgZWxlbWVudCB0byBhZGRcbiAgICogQHJldHVybiB7VkFMfVxuICAgKi9cbiAgc2V0IChrZXksIHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTWFwU2V0KHRyYW5zYWN0aW9uLCB0aGlzLCBrZXksIC8qKiBAdHlwZSB7YW55fSAqLyAodmFsdWUpKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudCkuc2V0KGtleSwgdmFsdWUpXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzcGVjaWZpZWQgZWxlbWVudCBmcm9tIHRoaXMgWU1hcC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKiBAcmV0dXJuIHtNYXBUeXBlfHVuZGVmaW5lZH1cbiAgICovXG4gIGdldCAoa2V5KSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAodHlwZU1hcEdldCh0aGlzLCBrZXkpKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgc3BlY2lmaWVkIGtleSBleGlzdHMgb3Igbm90LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gdGVzdC5cbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGhhcyAoa2V5KSB7XG4gICAgcmV0dXJuIHR5cGVNYXBIYXModGhpcywga2V5KVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGVsZW1lbnRzIGZyb20gdGhpcyBZTWFwLlxuICAgKi9cbiAgY2xlYXIgKCkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChfdmFsdWUsIGtleSwgbWFwKSB7XG4gICAgICAgICAgdHlwZU1hcERlbGV0ZSh0cmFuc2FjdGlvbiwgbWFwLCBrZXkpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge01hcDxzdHJpbmcsIGFueT59ICovICh0aGlzLl9wcmVsaW1Db250ZW50KS5jbGVhcigpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqL1xuICBfd3JpdGUgKGVuY29kZXIpIHtcbiAgICBlbmNvZGVyLndyaXRlVHlwZVJlZihZTWFwUmVmSUQpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gX2RlY29kZXJcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkWU1hcCA9IF9kZWNvZGVyID0+IG5ldyBZTWFwKClcbiIsICIvKipcbiAqIEBtb2R1bGUgWVRleHRcbiAqL1xuXG5pbXBvcnQge1xuICBZRXZlbnQsXG4gIEFic3RyYWN0VHlwZSxcbiAgZ2V0SXRlbUNsZWFuU3RhcnQsXG4gIGdldFN0YXRlLFxuICBpc1Zpc2libGUsXG4gIGNyZWF0ZUlELFxuICBZVGV4dFJlZklELFxuICBjYWxsVHlwZU9ic2VydmVycyxcbiAgdHJhbnNhY3QsXG4gIENvbnRlbnRFbWJlZCxcbiAgR0MsXG4gIENvbnRlbnRGb3JtYXQsXG4gIENvbnRlbnRTdHJpbmcsXG4gIHNwbGl0U25hcHNob3RBZmZlY3RlZFN0cnVjdHMsXG4gIGl0ZXJhdGVEZWxldGVkU3RydWN0cyxcbiAgaXRlcmF0ZVN0cnVjdHMsXG4gIGZpbmRNYXJrZXIsXG4gIHR5cGVNYXBEZWxldGUsXG4gIHR5cGVNYXBTZXQsXG4gIHR5cGVNYXBHZXQsXG4gIHR5cGVNYXBHZXRBbGwsXG4gIHVwZGF0ZU1hcmtlckNoYW5nZXMsXG4gIENvbnRlbnRUeXBlLFxuICB3YXJuUHJlbWF0dXJlQWNjZXNzLFxuICBBcnJheVNlYXJjaE1hcmtlciwgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBJRCwgRG9jLCBJdGVtLCBTbmFwc2hvdCwgVHJhbnNhY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIG9iamVjdCBmcm9tICdsaWIwL29iamVjdCdcbmltcG9ydCAqIGFzIG1hcCBmcm9tICdsaWIwL21hcCdcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGFcbiAqIEBwYXJhbSB7YW55fSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBlcXVhbEF0dHJzID0gKGEsIGIpID0+IGEgPT09IGIgfHwgKHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYiA9PT0gJ29iamVjdCcgJiYgYSAmJiBiICYmIG9iamVjdC5lcXVhbEZsYXQoYSwgYikpXG5cbmV4cG9ydCBjbGFzcyBJdGVtVGV4dExpc3RQb3NpdGlvbiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0l0ZW18bnVsbH0gbGVmdFxuICAgKiBAcGFyYW0ge0l0ZW18bnVsbH0gcmlnaHRcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gICAqIEBwYXJhbSB7TWFwPHN0cmluZyxhbnk+fSBjdXJyZW50QXR0cmlidXRlc1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGxlZnQsIHJpZ2h0LCBpbmRleCwgY3VycmVudEF0dHJpYnV0ZXMpIHtcbiAgICB0aGlzLmxlZnQgPSBsZWZ0XG4gICAgdGhpcy5yaWdodCA9IHJpZ2h0XG4gICAgdGhpcy5pbmRleCA9IGluZGV4XG4gICAgdGhpcy5jdXJyZW50QXR0cmlidXRlcyA9IGN1cnJlbnRBdHRyaWJ1dGVzXG4gIH1cblxuICAvKipcbiAgICogT25seSBjYWxsIHRoaXMgaWYgeW91IGtub3cgdGhhdCB0aGlzLnJpZ2h0IGlzIGRlZmluZWRcbiAgICovXG4gIGZvcndhcmQgKCkge1xuICAgIGlmICh0aGlzLnJpZ2h0ID09PSBudWxsKSB7XG4gICAgICBlcnJvci51bmV4cGVjdGVkQ2FzZSgpXG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5yaWdodC5jb250ZW50LmNvbnN0cnVjdG9yKSB7XG4gICAgICBjYXNlIENvbnRlbnRGb3JtYXQ6XG4gICAgICAgIGlmICghdGhpcy5yaWdodC5kZWxldGVkKSB7XG4gICAgICAgICAgdXBkYXRlQ3VycmVudEF0dHJpYnV0ZXModGhpcy5jdXJyZW50QXR0cmlidXRlcywgLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAodGhpcy5yaWdodC5jb250ZW50KSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKCF0aGlzLnJpZ2h0LmRlbGV0ZWQpIHtcbiAgICAgICAgICB0aGlzLmluZGV4ICs9IHRoaXMucmlnaHQubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG4gICAgdGhpcy5sZWZ0ID0gdGhpcy5yaWdodFxuICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LnJpZ2h0XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtJdGVtVGV4dExpc3RQb3NpdGlvbn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gY291bnQgc3RlcHMgdG8gbW92ZSBmb3J3YXJkXG4gKiBAcmV0dXJuIHtJdGVtVGV4dExpc3RQb3NpdGlvbn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IGZpbmROZXh0UG9zaXRpb24gPSAodHJhbnNhY3Rpb24sIHBvcywgY291bnQpID0+IHtcbiAgd2hpbGUgKHBvcy5yaWdodCAhPT0gbnVsbCAmJiBjb3VudCA+IDApIHtcbiAgICBzd2l0Y2ggKHBvcy5yaWdodC5jb250ZW50LmNvbnN0cnVjdG9yKSB7XG4gICAgICBjYXNlIENvbnRlbnRGb3JtYXQ6XG4gICAgICAgIGlmICghcG9zLnJpZ2h0LmRlbGV0ZWQpIHtcbiAgICAgICAgICB1cGRhdGVDdXJyZW50QXR0cmlidXRlcyhwb3MuY3VycmVudEF0dHJpYnV0ZXMsIC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKHBvcy5yaWdodC5jb250ZW50KSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKCFwb3MucmlnaHQuZGVsZXRlZCkge1xuICAgICAgICAgIGlmIChjb3VudCA8IHBvcy5yaWdodC5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIHNwbGl0IHJpZ2h0XG4gICAgICAgICAgICBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgY3JlYXRlSUQocG9zLnJpZ2h0LmlkLmNsaWVudCwgcG9zLnJpZ2h0LmlkLmNsb2NrICsgY291bnQpKVxuICAgICAgICAgIH1cbiAgICAgICAgICBwb3MuaW5kZXggKz0gcG9zLnJpZ2h0Lmxlbmd0aFxuICAgICAgICAgIGNvdW50IC09IHBvcy5yaWdodC5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cbiAgICBwb3MubGVmdCA9IHBvcy5yaWdodFxuICAgIHBvcy5yaWdodCA9IHBvcy5yaWdodC5yaWdodFxuICAgIC8vIHBvcy5mb3J3YXJkKCkgLSB3ZSBkb24ndCBmb3J3YXJkIGJlY2F1c2UgdGhhdCB3b3VsZCBoYWx2ZSB0aGUgcGVyZm9ybWFuY2UgYmVjYXVzZSB3ZSBhbHJlYWR5IGRvIHRoZSBjaGVja3MgYWJvdmVcbiAgfVxuICByZXR1cm4gcG9zXG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge2Jvb2xlYW59IHVzZVNlYXJjaE1hcmtlclxuICogQHJldHVybiB7SXRlbVRleHRMaXN0UG9zaXRpb259XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCBmaW5kUG9zaXRpb24gPSAodHJhbnNhY3Rpb24sIHBhcmVudCwgaW5kZXgsIHVzZVNlYXJjaE1hcmtlcikgPT4ge1xuICBjb25zdCBjdXJyZW50QXR0cmlidXRlcyA9IG5ldyBNYXAoKVxuICBjb25zdCBtYXJrZXIgPSB1c2VTZWFyY2hNYXJrZXIgPyBmaW5kTWFya2VyKHBhcmVudCwgaW5kZXgpIDogbnVsbFxuICBpZiAobWFya2VyKSB7XG4gICAgY29uc3QgcG9zID0gbmV3IEl0ZW1UZXh0TGlzdFBvc2l0aW9uKG1hcmtlci5wLmxlZnQsIG1hcmtlci5wLCBtYXJrZXIuaW5kZXgsIGN1cnJlbnRBdHRyaWJ1dGVzKVxuICAgIHJldHVybiBmaW5kTmV4dFBvc2l0aW9uKHRyYW5zYWN0aW9uLCBwb3MsIGluZGV4IC0gbWFya2VyLmluZGV4KVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHBvcyA9IG5ldyBJdGVtVGV4dExpc3RQb3NpdGlvbihudWxsLCBwYXJlbnQuX3N0YXJ0LCAwLCBjdXJyZW50QXR0cmlidXRlcylcbiAgICByZXR1cm4gZmluZE5leHRQb3NpdGlvbih0cmFuc2FjdGlvbiwgcG9zLCBpbmRleClcbiAgfVxufVxuXG4vKipcbiAqIE5lZ2F0ZSBhcHBsaWVkIGZvcm1hdHNcbiAqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gcGFyZW50XG4gKiBAcGFyYW0ge0l0ZW1UZXh0TGlzdFBvc2l0aW9ufSBjdXJyUG9zXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsYW55Pn0gbmVnYXRlZEF0dHJpYnV0ZXNcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IGluc2VydE5lZ2F0ZWRBdHRyaWJ1dGVzID0gKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGN1cnJQb3MsIG5lZ2F0ZWRBdHRyaWJ1dGVzKSA9PiB7XG4gIC8vIGNoZWNrIGlmIHdlIHJlYWxseSBuZWVkIHRvIHJlbW92ZSBhdHRyaWJ1dGVzXG4gIHdoaWxlIChcbiAgICBjdXJyUG9zLnJpZ2h0ICE9PSBudWxsICYmIChcbiAgICAgIGN1cnJQb3MucmlnaHQuZGVsZXRlZCA9PT0gdHJ1ZSB8fCAoXG4gICAgICAgIGN1cnJQb3MucmlnaHQuY29udGVudC5jb25zdHJ1Y3RvciA9PT0gQ29udGVudEZvcm1hdCAmJlxuICAgICAgICBlcXVhbEF0dHJzKG5lZ2F0ZWRBdHRyaWJ1dGVzLmdldCgvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQpLmtleSksIC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKGN1cnJQb3MucmlnaHQuY29udGVudCkudmFsdWUpXG4gICAgICApXG4gICAgKVxuICApIHtcbiAgICBpZiAoIWN1cnJQb3MucmlnaHQuZGVsZXRlZCkge1xuICAgICAgbmVnYXRlZEF0dHJpYnV0ZXMuZGVsZXRlKC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKGN1cnJQb3MucmlnaHQuY29udGVudCkua2V5KVxuICAgIH1cbiAgICBjdXJyUG9zLmZvcndhcmQoKVxuICB9XG4gIGNvbnN0IGRvYyA9IHRyYW5zYWN0aW9uLmRvY1xuICBjb25zdCBvd25DbGllbnRJZCA9IGRvYy5jbGllbnRJRFxuICBuZWdhdGVkQXR0cmlidXRlcy5mb3JFYWNoKCh2YWwsIGtleSkgPT4ge1xuICAgIGNvbnN0IGxlZnQgPSBjdXJyUG9zLmxlZnRcbiAgICBjb25zdCByaWdodCA9IGN1cnJQb3MucmlnaHRcbiAgICBjb25zdCBuZXh0Rm9ybWF0ID0gbmV3IEl0ZW0oY3JlYXRlSUQob3duQ2xpZW50SWQsIGdldFN0YXRlKGRvYy5zdG9yZSwgb3duQ2xpZW50SWQpKSwgbGVmdCwgbGVmdCAmJiBsZWZ0Lmxhc3RJZCwgcmlnaHQsIHJpZ2h0ICYmIHJpZ2h0LmlkLCBwYXJlbnQsIG51bGwsIG5ldyBDb250ZW50Rm9ybWF0KGtleSwgdmFsKSlcbiAgICBuZXh0Rm9ybWF0LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgICBjdXJyUG9zLnJpZ2h0ID0gbmV4dEZvcm1hdFxuICAgIGN1cnJQb3MuZm9yd2FyZCgpXG4gIH0pXG59XG5cbi8qKlxuICogQHBhcmFtIHtNYXA8c3RyaW5nLGFueT59IGN1cnJlbnRBdHRyaWJ1dGVzXG4gKiBAcGFyYW0ge0NvbnRlbnRGb3JtYXR9IGZvcm1hdFxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuY29uc3QgdXBkYXRlQ3VycmVudEF0dHJpYnV0ZXMgPSAoY3VycmVudEF0dHJpYnV0ZXMsIGZvcm1hdCkgPT4ge1xuICBjb25zdCB7IGtleSwgdmFsdWUgfSA9IGZvcm1hdFxuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICBjdXJyZW50QXR0cmlidXRlcy5kZWxldGUoa2V5KVxuICB9IGVsc2Uge1xuICAgIGN1cnJlbnRBdHRyaWJ1dGVzLnNldChrZXksIHZhbHVlKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtJdGVtVGV4dExpc3RQb3NpdGlvbn0gY3VyclBvc1xuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IGF0dHJpYnV0ZXNcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IG1pbmltaXplQXR0cmlidXRlQ2hhbmdlcyA9IChjdXJyUG9zLCBhdHRyaWJ1dGVzKSA9PiB7XG4gIC8vIGdvIHJpZ2h0IHdoaWxlIGF0dHJpYnV0ZXNbcmlnaHQua2V5XSA9PT0gcmlnaHQudmFsdWUgKG9yIHJpZ2h0IGlzIGRlbGV0ZWQpXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgaWYgKGN1cnJQb3MucmlnaHQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrXG4gICAgfSBlbHNlIGlmIChjdXJyUG9zLnJpZ2h0LmRlbGV0ZWQgfHwgKGN1cnJQb3MucmlnaHQuY29udGVudC5jb25zdHJ1Y3RvciA9PT0gQ29udGVudEZvcm1hdCAmJiBlcXVhbEF0dHJzKGF0dHJpYnV0ZXNbKC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKGN1cnJQb3MucmlnaHQuY29udGVudCkpLmtleV0gPz8gbnVsbCwgLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAoY3VyclBvcy5yaWdodC5jb250ZW50KS52YWx1ZSkpKSB7XG4gICAgICAvL1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgICBjdXJyUG9zLmZvcndhcmQoKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT59IHBhcmVudFxuICogQHBhcmFtIHtJdGVtVGV4dExpc3RQb3NpdGlvbn0gY3VyclBvc1xuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IGF0dHJpYnV0ZXNcbiAqIEByZXR1cm4ge01hcDxzdHJpbmcsYW55Pn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKiovXG5jb25zdCBpbnNlcnRBdHRyaWJ1dGVzID0gKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGN1cnJQb3MsIGF0dHJpYnV0ZXMpID0+IHtcbiAgY29uc3QgZG9jID0gdHJhbnNhY3Rpb24uZG9jXG4gIGNvbnN0IG93bkNsaWVudElkID0gZG9jLmNsaWVudElEXG4gIGNvbnN0IG5lZ2F0ZWRBdHRyaWJ1dGVzID0gbmV3IE1hcCgpXG4gIC8vIGluc2VydCBmb3JtYXQtc3RhcnQgaXRlbXNcbiAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHZhbCA9IGF0dHJpYnV0ZXNba2V5XVxuICAgIGNvbnN0IGN1cnJlbnRWYWwgPSBjdXJyUG9zLmN1cnJlbnRBdHRyaWJ1dGVzLmdldChrZXkpID8/IG51bGxcbiAgICBpZiAoIWVxdWFsQXR0cnMoY3VycmVudFZhbCwgdmFsKSkge1xuICAgICAgLy8gc2F2ZSBuZWdhdGVkIGF0dHJpYnV0ZSAoc2V0IG51bGwgaWYgY3VycmVudFZhbCB1bmRlZmluZWQpXG4gICAgICBuZWdhdGVkQXR0cmlidXRlcy5zZXQoa2V5LCBjdXJyZW50VmFsKVxuICAgICAgY29uc3QgeyBsZWZ0LCByaWdodCB9ID0gY3VyclBvc1xuICAgICAgY3VyclBvcy5yaWdodCA9IG5ldyBJdGVtKGNyZWF0ZUlEKG93bkNsaWVudElkLCBnZXRTdGF0ZShkb2Muc3RvcmUsIG93bkNsaWVudElkKSksIGxlZnQsIGxlZnQgJiYgbGVmdC5sYXN0SWQsIHJpZ2h0LCByaWdodCAmJiByaWdodC5pZCwgcGFyZW50LCBudWxsLCBuZXcgQ29udGVudEZvcm1hdChrZXksIHZhbCkpXG4gICAgICBjdXJyUG9zLnJpZ2h0LmludGVncmF0ZSh0cmFuc2FjdGlvbiwgMClcbiAgICAgIGN1cnJQb3MuZm9yd2FyZCgpXG4gICAgfVxuICB9XG4gIHJldHVybiBuZWdhdGVkQXR0cmlidXRlc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7SXRlbVRleHRMaXN0UG9zaXRpb259IGN1cnJQb3NcbiAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdHxBYnN0cmFjdFR5cGU8YW55Pn0gdGV4dFxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IGF0dHJpYnV0ZXNcbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKiovXG5jb25zdCBpbnNlcnRUZXh0ID0gKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGN1cnJQb3MsIHRleHQsIGF0dHJpYnV0ZXMpID0+IHtcbiAgY3VyclBvcy5jdXJyZW50QXR0cmlidXRlcy5mb3JFYWNoKChfdmFsLCBrZXkpID0+IHtcbiAgICBpZiAoYXR0cmlidXRlc1trZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IG51bGxcbiAgICB9XG4gIH0pXG4gIGNvbnN0IGRvYyA9IHRyYW5zYWN0aW9uLmRvY1xuICBjb25zdCBvd25DbGllbnRJZCA9IGRvYy5jbGllbnRJRFxuICBtaW5pbWl6ZUF0dHJpYnV0ZUNoYW5nZXMoY3VyclBvcywgYXR0cmlidXRlcylcbiAgY29uc3QgbmVnYXRlZEF0dHJpYnV0ZXMgPSBpbnNlcnRBdHRyaWJ1dGVzKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGN1cnJQb3MsIGF0dHJpYnV0ZXMpXG4gIC8vIGluc2VydCBjb250ZW50XG4gIGNvbnN0IGNvbnRlbnQgPSB0ZXh0LmNvbnN0cnVjdG9yID09PSBTdHJpbmcgPyBuZXcgQ29udGVudFN0cmluZygvKiogQHR5cGUge3N0cmluZ30gKi8gKHRleHQpKSA6ICh0ZXh0IGluc3RhbmNlb2YgQWJzdHJhY3RUeXBlID8gbmV3IENvbnRlbnRUeXBlKHRleHQpIDogbmV3IENvbnRlbnRFbWJlZCh0ZXh0KSlcbiAgbGV0IHsgbGVmdCwgcmlnaHQsIGluZGV4IH0gPSBjdXJyUG9zXG4gIGlmIChwYXJlbnQuX3NlYXJjaE1hcmtlcikge1xuICAgIHVwZGF0ZU1hcmtlckNoYW5nZXMocGFyZW50Ll9zZWFyY2hNYXJrZXIsIGN1cnJQb3MuaW5kZXgsIGNvbnRlbnQuZ2V0TGVuZ3RoKCkpXG4gIH1cbiAgcmlnaHQgPSBuZXcgSXRlbShjcmVhdGVJRChvd25DbGllbnRJZCwgZ2V0U3RhdGUoZG9jLnN0b3JlLCBvd25DbGllbnRJZCkpLCBsZWZ0LCBsZWZ0ICYmIGxlZnQubGFzdElkLCByaWdodCwgcmlnaHQgJiYgcmlnaHQuaWQsIHBhcmVudCwgbnVsbCwgY29udGVudClcbiAgcmlnaHQuaW50ZWdyYXRlKHRyYW5zYWN0aW9uLCAwKVxuICBjdXJyUG9zLnJpZ2h0ID0gcmlnaHRcbiAgY3VyclBvcy5pbmRleCA9IGluZGV4XG4gIGN1cnJQb3MuZm9yd2FyZCgpXG4gIGluc2VydE5lZ2F0ZWRBdHRyaWJ1dGVzKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGN1cnJQb3MsIG5lZ2F0ZWRBdHRyaWJ1dGVzKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0Fic3RyYWN0VHlwZTxhbnk+fSBwYXJlbnRcbiAqIEBwYXJhbSB7SXRlbVRleHRMaXN0UG9zaXRpb259IGN1cnJQb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGhcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBhdHRyaWJ1dGVzXG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5jb25zdCBmb3JtYXRUZXh0ID0gKHRyYW5zYWN0aW9uLCBwYXJlbnQsIGN1cnJQb3MsIGxlbmd0aCwgYXR0cmlidXRlcykgPT4ge1xuICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgY29uc3Qgb3duQ2xpZW50SWQgPSBkb2MuY2xpZW50SURcbiAgbWluaW1pemVBdHRyaWJ1dGVDaGFuZ2VzKGN1cnJQb3MsIGF0dHJpYnV0ZXMpXG4gIGNvbnN0IG5lZ2F0ZWRBdHRyaWJ1dGVzID0gaW5zZXJ0QXR0cmlidXRlcyh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCBhdHRyaWJ1dGVzKVxuICAvLyBpdGVyYXRlIHVudGlsIGZpcnN0IG5vbi1mb3JtYXQgb3IgbnVsbCBpcyBmb3VuZFxuICAvLyBkZWxldGUgYWxsIGZvcm1hdHMgd2l0aCBhdHRyaWJ1dGVzW2Zvcm1hdC5rZXldICE9IG51bGxcbiAgLy8gYWxzbyBjaGVjayB0aGUgYXR0cmlidXRlcyBhZnRlciB0aGUgZmlyc3Qgbm9uLWZvcm1hdCBhcyB3ZSBkbyBub3Qgd2FudCB0byBpbnNlcnQgcmVkdW5kYW50IG5lZ2F0ZWQgYXR0cmlidXRlcyB0aGVyZVxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbGFiZWxzXG4gIGl0ZXJhdGlvbkxvb3A6IHdoaWxlIChcbiAgICBjdXJyUG9zLnJpZ2h0ICE9PSBudWxsICYmXG4gICAgKGxlbmd0aCA+IDAgfHxcbiAgICAgIChcbiAgICAgICAgbmVnYXRlZEF0dHJpYnV0ZXMuc2l6ZSA+IDAgJiZcbiAgICAgICAgKGN1cnJQb3MucmlnaHQuZGVsZXRlZCB8fCBjdXJyUG9zLnJpZ2h0LmNvbnRlbnQuY29uc3RydWN0b3IgPT09IENvbnRlbnRGb3JtYXQpXG4gICAgICApXG4gICAgKVxuICApIHtcbiAgICBpZiAoIWN1cnJQb3MucmlnaHQuZGVsZXRlZCkge1xuICAgICAgc3dpdGNoIChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgY2FzZSBDb250ZW50Rm9ybWF0OiB7XG4gICAgICAgICAgY29uc3QgeyBrZXksIHZhbHVlIH0gPSAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQpXG4gICAgICAgICAgY29uc3QgYXR0ciA9IGF0dHJpYnV0ZXNba2V5XVxuICAgICAgICAgIGlmIChhdHRyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChlcXVhbEF0dHJzKGF0dHIsIHZhbHVlKSkge1xuICAgICAgICAgICAgICBuZWdhdGVkQXR0cmlidXRlcy5kZWxldGUoa2V5KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIG5vIG5lZWQgdG8gZnVydGhlciBleHRlbmQgbmVnYXRlZEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbGFiZWxzXG4gICAgICAgICAgICAgICAgYnJlYWsgaXRlcmF0aW9uTG9vcFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG5lZ2F0ZWRBdHRyaWJ1dGVzLnNldChrZXksIHZhbHVlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VyclBvcy5yaWdodC5kZWxldGUodHJhbnNhY3Rpb24pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJQb3MuY3VycmVudEF0dHJpYnV0ZXMuc2V0KGtleSwgdmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAobGVuZ3RoIDwgY3VyclBvcy5yaWdodC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBjcmVhdGVJRChjdXJyUG9zLnJpZ2h0LmlkLmNsaWVudCwgY3VyclBvcy5yaWdodC5pZC5jbG9jayArIGxlbmd0aCkpXG4gICAgICAgICAgfVxuICAgICAgICAgIGxlbmd0aCAtPSBjdXJyUG9zLnJpZ2h0Lmxlbmd0aFxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGN1cnJQb3MuZm9yd2FyZCgpXG4gIH1cbiAgLy8gUXVpbGwganVzdCBhc3N1bWVzIHRoYXQgdGhlIGVkaXRvciBzdGFydHMgd2l0aCBhIG5ld2xpbmUgYW5kIHRoYXQgaXQgYWx3YXlzXG4gIC8vIGVuZHMgd2l0aCBhIG5ld2xpbmUuIFdlIG9ubHkgaW5zZXJ0IHRoYXQgbmV3bGluZSB3aGVuIGEgbmV3IG5ld2xpbmUgaXNcbiAgLy8gaW5zZXJ0ZWQgLSBpLmUgd2hlbiBsZW5ndGggaXMgYmlnZ2VyIHRoYW4gdHlwZS5sZW5ndGhcbiAgaWYgKGxlbmd0aCA+IDApIHtcbiAgICBsZXQgbmV3bGluZXMgPSAnJ1xuICAgIGZvciAoOyBsZW5ndGggPiAwOyBsZW5ndGgtLSkge1xuICAgICAgbmV3bGluZXMgKz0gJ1xcbidcbiAgICB9XG4gICAgY3VyclBvcy5yaWdodCA9IG5ldyBJdGVtKGNyZWF0ZUlEKG93bkNsaWVudElkLCBnZXRTdGF0ZShkb2Muc3RvcmUsIG93bkNsaWVudElkKSksIGN1cnJQb3MubGVmdCwgY3VyclBvcy5sZWZ0ICYmIGN1cnJQb3MubGVmdC5sYXN0SWQsIGN1cnJQb3MucmlnaHQsIGN1cnJQb3MucmlnaHQgJiYgY3VyclBvcy5yaWdodC5pZCwgcGFyZW50LCBudWxsLCBuZXcgQ29udGVudFN0cmluZyhuZXdsaW5lcykpXG4gICAgY3VyclBvcy5yaWdodC5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIDApXG4gICAgY3VyclBvcy5mb3J3YXJkKClcbiAgfVxuICBpbnNlcnROZWdhdGVkQXR0cmlidXRlcyh0cmFuc2FjdGlvbiwgcGFyZW50LCBjdXJyUG9zLCBuZWdhdGVkQXR0cmlidXRlcylcbn1cblxuLyoqXG4gKiBDYWxsIHRoaXMgZnVuY3Rpb24gYWZ0ZXIgc3RyaW5nIGNvbnRlbnQgaGFzIGJlZW4gZGVsZXRlZCBpbiBvcmRlciB0b1xuICogY2xlYW4gdXAgZm9ybWF0dGluZyBJdGVtcy5cbiAqXG4gKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICogQHBhcmFtIHtJdGVtfSBzdGFydFxuICogQHBhcmFtIHtJdGVtfG51bGx9IGN1cnIgZXhjbHVzaXZlIGVuZCwgYXV0b21hdGljYWxseSBpdGVyYXRlcyB0byB0aGUgbmV4dCBDb250ZW50IEl0ZW1cbiAqIEBwYXJhbSB7TWFwPHN0cmluZyxhbnk+fSBzdGFydEF0dHJpYnV0ZXNcbiAqIEBwYXJhbSB7TWFwPHN0cmluZyxhbnk+fSBjdXJyQXR0cmlidXRlc1xuICogQHJldHVybiB7bnVtYmVyfSBUaGUgYW1vdW50IG9mIGZvcm1hdHRpbmcgSXRlbXMgZGVsZXRlZC5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqL1xuY29uc3QgY2xlYW51cEZvcm1hdHRpbmdHYXAgPSAodHJhbnNhY3Rpb24sIHN0YXJ0LCBjdXJyLCBzdGFydEF0dHJpYnV0ZXMsIGN1cnJBdHRyaWJ1dGVzKSA9PiB7XG4gIC8qKlxuICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgKi9cbiAgbGV0IGVuZCA9IHN0YXJ0XG4gIC8qKlxuICAgKiBAdHlwZSB7TWFwPHN0cmluZyxDb250ZW50Rm9ybWF0Pn1cbiAgICovXG4gIGNvbnN0IGVuZEZvcm1hdHMgPSBtYXAuY3JlYXRlKClcbiAgd2hpbGUgKGVuZCAmJiAoIWVuZC5jb3VudGFibGUgfHwgZW5kLmRlbGV0ZWQpKSB7XG4gICAgaWYgKCFlbmQuZGVsZXRlZCAmJiBlbmQuY29udGVudC5jb25zdHJ1Y3RvciA9PT0gQ29udGVudEZvcm1hdCkge1xuICAgICAgY29uc3QgY2YgPSAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChlbmQuY29udGVudClcbiAgICAgIGVuZEZvcm1hdHMuc2V0KGNmLmtleSwgY2YpXG4gICAgfVxuICAgIGVuZCA9IGVuZC5yaWdodFxuICB9XG4gIGxldCBjbGVhbnVwcyA9IDBcbiAgbGV0IHJlYWNoZWRDdXJyID0gZmFsc2VcbiAgd2hpbGUgKHN0YXJ0ICE9PSBlbmQpIHtcbiAgICBpZiAoY3VyciA9PT0gc3RhcnQpIHtcbiAgICAgIHJlYWNoZWRDdXJyID0gdHJ1ZVxuICAgIH1cbiAgICBpZiAoIXN0YXJ0LmRlbGV0ZWQpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBzdGFydC5jb250ZW50XG4gICAgICBzd2l0Y2ggKGNvbnRlbnQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgY2FzZSBDb250ZW50Rm9ybWF0OiB7XG4gICAgICAgICAgY29uc3QgeyBrZXksIHZhbHVlIH0gPSAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChjb250ZW50KVxuICAgICAgICAgIGNvbnN0IHN0YXJ0QXR0clZhbHVlID0gc3RhcnRBdHRyaWJ1dGVzLmdldChrZXkpID8/IG51bGxcbiAgICAgICAgICBpZiAoZW5kRm9ybWF0cy5nZXQoa2V5KSAhPT0gY29udGVudCB8fCBzdGFydEF0dHJWYWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIEVpdGhlciB0aGlzIGZvcm1hdCBpcyBvdmVyd3JpdHRlbiBvciBpdCBpcyBub3QgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIGF0dHJpYnV0ZSBhbHJlYWR5IGV4aXN0ZWQuXG4gICAgICAgICAgICBzdGFydC5kZWxldGUodHJhbnNhY3Rpb24pXG4gICAgICAgICAgICBjbGVhbnVwcysrXG4gICAgICAgICAgICBpZiAoIXJlYWNoZWRDdXJyICYmIChjdXJyQXR0cmlidXRlcy5nZXQoa2V5KSA/PyBudWxsKSA9PT0gdmFsdWUgJiYgc3RhcnRBdHRyVmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgIGlmIChzdGFydEF0dHJWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJBdHRyaWJ1dGVzLmRlbGV0ZShrZXkpXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3VyckF0dHJpYnV0ZXMuc2V0KGtleSwgc3RhcnRBdHRyVmFsdWUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFyZWFjaGVkQ3VyciAmJiAhc3RhcnQuZGVsZXRlZCkge1xuICAgICAgICAgICAgdXBkYXRlQ3VycmVudEF0dHJpYnV0ZXMoY3VyckF0dHJpYnV0ZXMsIC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKGNvbnRlbnQpKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHN0YXJ0ID0gLyoqIEB0eXBlIHtJdGVtfSAqLyAoc3RhcnQucmlnaHQpXG4gIH1cbiAgcmV0dXJuIGNsZWFudXBzXG59XG5cbi8qKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7SXRlbSB8IG51bGx9IGl0ZW1cbiAqL1xuY29uc3QgY2xlYW51cENvbnRleHRsZXNzRm9ybWF0dGluZ0dhcCA9ICh0cmFuc2FjdGlvbiwgaXRlbSkgPT4ge1xuICAvLyBpdGVyYXRlIHVudGlsIGl0ZW0ucmlnaHQgaXMgbnVsbCBvciBjb250ZW50XG4gIHdoaWxlIChpdGVtICYmIGl0ZW0ucmlnaHQgJiYgKGl0ZW0ucmlnaHQuZGVsZXRlZCB8fCAhaXRlbS5yaWdodC5jb3VudGFibGUpKSB7XG4gICAgaXRlbSA9IGl0ZW0ucmlnaHRcbiAgfVxuICBjb25zdCBhdHRycyA9IG5ldyBTZXQoKVxuICAvLyBpdGVyYXRlIGJhY2sgdW50aWwgYSBjb250ZW50IGl0ZW0gaXMgZm91bmRcbiAgd2hpbGUgKGl0ZW0gJiYgKGl0ZW0uZGVsZXRlZCB8fCAhaXRlbS5jb3VudGFibGUpKSB7XG4gICAgaWYgKCFpdGVtLmRlbGV0ZWQgJiYgaXRlbS5jb250ZW50LmNvbnN0cnVjdG9yID09PSBDb250ZW50Rm9ybWF0KSB7XG4gICAgICBjb25zdCBrZXkgPSAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChpdGVtLmNvbnRlbnQpLmtleVxuICAgICAgaWYgKGF0dHJzLmhhcyhrZXkpKSB7XG4gICAgICAgIGl0ZW0uZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cnMuYWRkKGtleSlcbiAgICAgIH1cbiAgICB9XG4gICAgaXRlbSA9IGl0ZW0ubGVmdFxuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpcyBleHBlcmltZW50YWwgYW5kIHN1YmplY3QgdG8gY2hhbmdlIC8gYmUgcmVtb3ZlZC5cbiAqXG4gKiBJZGVhbGx5LCB3ZSBkb24ndCBuZWVkIHRoaXMgZnVuY3Rpb24gYXQgYWxsLiBGb3JtYXR0aW5nIGF0dHJpYnV0ZXMgc2hvdWxkIGJlIGNsZWFuZWQgdXBcbiAqIGF1dG9tYXRpY2FsbHkgYWZ0ZXIgZWFjaCBjaGFuZ2UuIFRoaXMgZnVuY3Rpb24gaXRlcmF0ZXMgdHdpY2Ugb3ZlciB0aGUgY29tcGxldGUgWVRleHQgdHlwZVxuICogYW5kIHJlbW92ZXMgdW5uZWNlc3NhcnkgZm9ybWF0dGluZyBhdHRyaWJ1dGVzLiBUaGlzIGlzIGFsc28gaGVscGZ1bCBmb3IgdGVzdGluZy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdvbid0IGJlIGV4cG9ydGVkIGFueW1vcmUgYXMgc29vbiBhcyB0aGVyZSBpcyBjb25maWRlbmNlIHRoYXQgdGhlIFlUZXh0IHR5cGUgd29ya3MgYXMgaW50ZW5kZWQuXG4gKlxuICogQHBhcmFtIHtZVGV4dH0gdHlwZVxuICogQHJldHVybiB7bnVtYmVyfSBIb3cgbWFueSBmb3JtYXR0aW5nIGF0dHJpYnV0ZXMgaGF2ZSBiZWVuIGNsZWFuZWQgdXAuXG4gKi9cbmV4cG9ydCBjb25zdCBjbGVhbnVwWVRleHRGb3JtYXR0aW5nID0gdHlwZSA9PiB7XG4gIGxldCByZXMgPSAwXG4gIHRyYW5zYWN0KC8qKiBAdHlwZSB7RG9jfSAqLyAodHlwZS5kb2MpLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgbGV0IHN0YXJ0ID0gLyoqIEB0eXBlIHtJdGVtfSAqLyAodHlwZS5fc3RhcnQpXG4gICAgbGV0IGVuZCA9IHR5cGUuX3N0YXJ0XG4gICAgbGV0IHN0YXJ0QXR0cmlidXRlcyA9IG1hcC5jcmVhdGUoKVxuICAgIGNvbnN0IGN1cnJlbnRBdHRyaWJ1dGVzID0gbWFwLmNvcHkoc3RhcnRBdHRyaWJ1dGVzKVxuICAgIHdoaWxlIChlbmQpIHtcbiAgICAgIGlmIChlbmQuZGVsZXRlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgc3dpdGNoIChlbmQuY29udGVudC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgIGNhc2UgQ29udGVudEZvcm1hdDpcbiAgICAgICAgICAgIHVwZGF0ZUN1cnJlbnRBdHRyaWJ1dGVzKGN1cnJlbnRBdHRyaWJ1dGVzLCAvKiogQHR5cGUge0NvbnRlbnRGb3JtYXR9ICovIChlbmQuY29udGVudCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXMgKz0gY2xlYW51cEZvcm1hdHRpbmdHYXAodHJhbnNhY3Rpb24sIHN0YXJ0LCBlbmQsIHN0YXJ0QXR0cmlidXRlcywgY3VycmVudEF0dHJpYnV0ZXMpXG4gICAgICAgICAgICBzdGFydEF0dHJpYnV0ZXMgPSBtYXAuY29weShjdXJyZW50QXR0cmlidXRlcylcbiAgICAgICAgICAgIHN0YXJ0ID0gZW5kXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbmQgPSBlbmQucmlnaHRcbiAgICB9XG4gIH0pXG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBUaGlzIHdpbGwgYmUgY2FsbGVkIGJ5IHRoZSB0cmFuc2N0aW9uIG9uY2UgdGhlIGV2ZW50IGhhbmRsZXJzIGFyZSBjYWxsZWQgdG8gcG90ZW50aWFsbHkgY2xlYW51cFxuICogZm9ybWF0dGluZyBhdHRyaWJ1dGVzLlxuICpcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjbGVhbnVwWVRleHRBZnRlclRyYW5zYWN0aW9uID0gdHJhbnNhY3Rpb24gPT4ge1xuICAvKipcbiAgICogQHR5cGUge1NldDxZVGV4dD59XG4gICAqL1xuICBjb25zdCBuZWVkRnVsbENsZWFudXAgPSBuZXcgU2V0KClcbiAgLy8gY2hlY2sgaWYgYW5vdGhlciBmb3JtYXR0aW5nIGl0ZW0gd2FzIGluc2VydGVkXG4gIGNvbnN0IGRvYyA9IHRyYW5zYWN0aW9uLmRvY1xuICBmb3IgKGNvbnN0IFtjbGllbnQsIGFmdGVyQ2xvY2tdIG9mIHRyYW5zYWN0aW9uLmFmdGVyU3RhdGUuZW50cmllcygpKSB7XG4gICAgY29uc3QgY2xvY2sgPSB0cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZS5nZXQoY2xpZW50KSB8fCAwXG4gICAgaWYgKGFmdGVyQ2xvY2sgPT09IGNsb2NrKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICBpdGVyYXRlU3RydWN0cyh0cmFuc2FjdGlvbiwgLyoqIEB0eXBlIHtBcnJheTxJdGVtfEdDPn0gKi8gKGRvYy5zdG9yZS5jbGllbnRzLmdldChjbGllbnQpKSwgY2xvY2ssIGFmdGVyQ2xvY2ssIGl0ZW0gPT4ge1xuICAgICAgaWYgKFxuICAgICAgICAhaXRlbS5kZWxldGVkICYmIC8qKiBAdHlwZSB7SXRlbX0gKi8gKGl0ZW0pLmNvbnRlbnQuY29uc3RydWN0b3IgPT09IENvbnRlbnRGb3JtYXQgJiYgaXRlbS5jb25zdHJ1Y3RvciAhPT0gR0NcbiAgICAgICkge1xuICAgICAgICBuZWVkRnVsbENsZWFudXAuYWRkKC8qKiBAdHlwZSB7YW55fSAqLyAoaXRlbSkucGFyZW50KVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgLy8gY2xlYW51cCBpbiBhIG5ldyB0cmFuc2FjdGlvblxuICB0cmFuc2FjdChkb2MsICh0KSA9PiB7XG4gICAgaXRlcmF0ZURlbGV0ZWRTdHJ1Y3RzKHRyYW5zYWN0aW9uLCB0cmFuc2FjdGlvbi5kZWxldGVTZXQsIGl0ZW0gPT4ge1xuICAgICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBHQyB8fCAhKC8qKiBAdHlwZSB7WVRleHR9ICovIChpdGVtLnBhcmVudCkuX2hhc0Zvcm1hdHRpbmcpIHx8IG5lZWRGdWxsQ2xlYW51cC5oYXMoLyoqIEB0eXBlIHtZVGV4dH0gKi8gKGl0ZW0ucGFyZW50KSkpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBjb25zdCBwYXJlbnQgPSAvKiogQHR5cGUge1lUZXh0fSAqLyAoaXRlbS5wYXJlbnQpXG4gICAgICBpZiAoaXRlbS5jb250ZW50LmNvbnN0cnVjdG9yID09PSBDb250ZW50Rm9ybWF0KSB7XG4gICAgICAgIG5lZWRGdWxsQ2xlYW51cC5hZGQocGFyZW50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgbm8gZm9ybWF0dGluZyBhdHRyaWJ1dGUgd2FzIGluc2VydGVkIG9yIGRlbGV0ZWQsIHdlIGNhbiBtYWtlIGR1ZSB3aXRoIGNvbnRleHRsZXNzXG4gICAgICAgIC8vIGZvcm1hdHRpbmcgY2xlYW51cHMuXG4gICAgICAgIC8vIENvbnRleHRsZXNzOiBpdCBpcyBub3QgbmVjZXNzYXJ5IHRvIGNvbXB1dGUgY3VycmVudEF0dHJpYnV0ZXMgZm9yIHRoZSBhZmZlY3RlZCBwb3NpdGlvbi5cbiAgICAgICAgY2xlYW51cENvbnRleHRsZXNzRm9ybWF0dGluZ0dhcCh0LCBpdGVtKVxuICAgICAgfVxuICAgIH0pXG4gICAgLy8gSWYgYSBmb3JtYXR0aW5nIGl0ZW0gd2FzIGluc2VydGVkLCB3ZSBzaW1wbHkgY2xlYW4gdGhlIHdob2xlIHR5cGUuXG4gICAgLy8gV2UgbmVlZCB0byBjb21wdXRlIGN1cnJlbnRBdHRyaWJ1dGVzIGZvciB0aGUgY3VycmVudCBwb3NpdGlvbiBhbnl3YXkuXG4gICAgZm9yIChjb25zdCB5VGV4dCBvZiBuZWVkRnVsbENsZWFudXApIHtcbiAgICAgIGNsZWFudXBZVGV4dEZvcm1hdHRpbmcoeVRleHQpXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge0l0ZW1UZXh0TGlzdFBvc2l0aW9ufSBjdXJyUG9zXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoXG4gKiBAcmV0dXJuIHtJdGVtVGV4dExpc3RQb3NpdGlvbn1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmNvbnN0IGRlbGV0ZVRleHQgPSAodHJhbnNhY3Rpb24sIGN1cnJQb3MsIGxlbmd0aCkgPT4ge1xuICBjb25zdCBzdGFydExlbmd0aCA9IGxlbmd0aFxuICBjb25zdCBzdGFydEF0dHJzID0gbWFwLmNvcHkoY3VyclBvcy5jdXJyZW50QXR0cmlidXRlcylcbiAgY29uc3Qgc3RhcnQgPSBjdXJyUG9zLnJpZ2h0XG4gIHdoaWxlIChsZW5ndGggPiAwICYmIGN1cnJQb3MucmlnaHQgIT09IG51bGwpIHtcbiAgICBpZiAoY3VyclBvcy5yaWdodC5kZWxldGVkID09PSBmYWxzZSkge1xuICAgICAgc3dpdGNoIChjdXJyUG9zLnJpZ2h0LmNvbnRlbnQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgY2FzZSBDb250ZW50VHlwZTpcbiAgICAgICAgY2FzZSBDb250ZW50RW1iZWQ6XG4gICAgICAgIGNhc2UgQ29udGVudFN0cmluZzpcbiAgICAgICAgICBpZiAobGVuZ3RoIDwgY3VyclBvcy5yaWdodC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBjcmVhdGVJRChjdXJyUG9zLnJpZ2h0LmlkLmNsaWVudCwgY3VyclBvcy5yaWdodC5pZC5jbG9jayArIGxlbmd0aCkpXG4gICAgICAgICAgfVxuICAgICAgICAgIGxlbmd0aCAtPSBjdXJyUG9zLnJpZ2h0Lmxlbmd0aFxuICAgICAgICAgIGN1cnJQb3MucmlnaHQuZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGN1cnJQb3MuZm9yd2FyZCgpXG4gIH1cbiAgaWYgKHN0YXJ0KSB7XG4gICAgY2xlYW51cEZvcm1hdHRpbmdHYXAodHJhbnNhY3Rpb24sIHN0YXJ0LCBjdXJyUG9zLnJpZ2h0LCBzdGFydEF0dHJzLCBjdXJyUG9zLmN1cnJlbnRBdHRyaWJ1dGVzKVxuICB9XG4gIGNvbnN0IHBhcmVudCA9IC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICgvKiogQHR5cGUge0l0ZW19ICovIChjdXJyUG9zLmxlZnQgfHwgY3VyclBvcy5yaWdodCkucGFyZW50KVxuICBpZiAocGFyZW50Ll9zZWFyY2hNYXJrZXIpIHtcbiAgICB1cGRhdGVNYXJrZXJDaGFuZ2VzKHBhcmVudC5fc2VhcmNoTWFya2VyLCBjdXJyUG9zLmluZGV4LCAtc3RhcnRMZW5ndGggKyBsZW5ndGgpXG4gIH1cbiAgcmV0dXJuIGN1cnJQb3Ncbn1cblxuLyoqXG4gKiBUaGUgUXVpbGwgRGVsdGEgZm9ybWF0IHJlcHJlc2VudHMgY2hhbmdlcyBvbiBhIHRleHQgZG9jdW1lbnQgd2l0aFxuICogZm9ybWF0dGluZyBpbmZvcm1hdGlvbi4gRm9yIG1vciBpbmZvcm1hdGlvbiB2aXNpdCB7QGxpbmsgaHR0cHM6Ly9xdWlsbGpzLmNvbS9kb2NzL2RlbHRhL3xRdWlsbCBEZWx0YX1cbiAqXG4gKiBAZXhhbXBsZVxuICogICB7XG4gKiAgICAgb3BzOiBbXG4gKiAgICAgICB7IGluc2VydDogJ0dhbmRhbGYnLCBhdHRyaWJ1dGVzOiB7IGJvbGQ6IHRydWUgfSB9LFxuICogICAgICAgeyBpbnNlcnQ6ICcgdGhlICcgfSxcbiAqICAgICAgIHsgaW5zZXJ0OiAnR3JleScsIGF0dHJpYnV0ZXM6IHsgY29sb3I6ICcjY2NjY2NjJyB9IH1cbiAqICAgICBdXG4gKiAgIH1cbiAqXG4gKi9cblxuLyoqXG4gICogQXR0cmlidXRlcyB0aGF0IGNhbiBiZSBhc3NpZ25lZCB0byBhIHNlbGVjdGlvbiBvZiB0ZXh0LlxuICAqXG4gICogQGV4YW1wbGVcbiAgKiAgIHtcbiAgKiAgICAgYm9sZDogdHJ1ZSxcbiAgKiAgICAgZm9udC1zaXplOiAnNDBweCdcbiAgKiAgIH1cbiAgKlxuICAqIEB0eXBlZGVmIHtPYmplY3R9IFRleHRBdHRyaWJ1dGVzXG4gICovXG5cbi8qKlxuICogQGV4dGVuZHMgWUV2ZW50PFlUZXh0PlxuICogRXZlbnQgdGhhdCBkZXNjcmliZXMgdGhlIGNoYW5nZXMgb24gYSBZVGV4dCB0eXBlLlxuICovXG5leHBvcnQgY2xhc3MgWVRleHRFdmVudCBleHRlbmRzIFlFdmVudCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1lUZXh0fSB5dGV4dFxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge1NldDxhbnk+fSBzdWJzIFRoZSBrZXlzIHRoYXQgY2hhbmdlZFxuICAgKi9cbiAgY29uc3RydWN0b3IgKHl0ZXh0LCB0cmFuc2FjdGlvbiwgc3Vicykge1xuICAgIHN1cGVyKHl0ZXh0LCB0cmFuc2FjdGlvbilcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBjaGlsZHJlbiBjaGFuZ2VkLlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5jaGlsZExpc3RDaGFuZ2VkID0gZmFsc2VcbiAgICAvKipcbiAgICAgKiBTZXQgb2YgYWxsIGNoYW5nZWQgYXR0cmlidXRlcy5cbiAgICAgKiBAdHlwZSB7U2V0PHN0cmluZz59XG4gICAgICovXG4gICAgdGhpcy5rZXlzQ2hhbmdlZCA9IG5ldyBTZXQoKVxuICAgIHN1YnMuZm9yRWFjaCgoc3ViKSA9PiB7XG4gICAgICBpZiAoc3ViID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuY2hpbGRMaXN0Q2hhbmdlZCA9IHRydWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMua2V5c0NoYW5nZWQuYWRkKHN1YilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlIHt7YWRkZWQ6U2V0PEl0ZW0+LGRlbGV0ZWQ6U2V0PEl0ZW0+LGtleXM6TWFwPHN0cmluZyx7YWN0aW9uOidhZGQnfCd1cGRhdGUnfCdkZWxldGUnLG9sZFZhbHVlOmFueX0+LGRlbHRhOkFycmF5PHtpbnNlcnQ/OkFycmF5PGFueT58c3RyaW5nLCBkZWxldGU/Om51bWJlciwgcmV0YWluPzpudW1iZXJ9Pn19XG4gICAqL1xuICBnZXQgY2hhbmdlcyAoKSB7XG4gICAgaWYgKHRoaXMuX2NoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge3thZGRlZDpTZXQ8SXRlbT4sZGVsZXRlZDpTZXQ8SXRlbT4sa2V5czpNYXA8c3RyaW5nLHthY3Rpb246J2FkZCd8J3VwZGF0ZSd8J2RlbGV0ZScsb2xkVmFsdWU6YW55fT4sZGVsdGE6QXJyYXk8e2luc2VydD86QXJyYXk8YW55PnxzdHJpbmd8QWJzdHJhY3RUeXBlPGFueT58b2JqZWN0LCBkZWxldGU/Om51bWJlciwgcmV0YWluPzpudW1iZXJ9Pn19XG4gICAgICAgKi9cbiAgICAgIGNvbnN0IGNoYW5nZXMgPSB7XG4gICAgICAgIGtleXM6IHRoaXMua2V5cyxcbiAgICAgICAgZGVsdGE6IHRoaXMuZGVsdGEsXG4gICAgICAgIGFkZGVkOiBuZXcgU2V0KCksXG4gICAgICAgIGRlbGV0ZWQ6IG5ldyBTZXQoKVxuICAgICAgfVxuICAgICAgdGhpcy5fY2hhbmdlcyA9IGNoYW5nZXNcbiAgICB9XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAodGhpcy5fY2hhbmdlcylcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlIHRoZSBjaGFuZ2VzIGluIHRoZSBkZWx0YSBmb3JtYXQuXG4gICAqIEEge0BsaW5rIGh0dHBzOi8vcXVpbGxqcy5jb20vZG9jcy9kZWx0YS98UXVpbGwgRGVsdGF9KSB0aGF0IHJlcHJlc2VudHMgdGhlIGNoYW5nZXMgb24gdGhlIGRvY3VtZW50LlxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXk8e2luc2VydD86c3RyaW5nfG9iamVjdHxBYnN0cmFjdFR5cGU8YW55PiwgZGVsZXRlPzpudW1iZXIsIHJldGFpbj86bnVtYmVyLCBhdHRyaWJ1dGVzPzogT2JqZWN0PHN0cmluZyxhbnk+fT59XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldCBkZWx0YSAoKSB7XG4gICAgaWYgKHRoaXMuX2RlbHRhID09PSBudWxsKSB7XG4gICAgICBjb25zdCB5ID0gLyoqIEB0eXBlIHtEb2N9ICovICh0aGlzLnRhcmdldC5kb2MpXG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHtBcnJheTx7aW5zZXJ0PzpzdHJpbmd8b2JqZWN0fEFic3RyYWN0VHlwZTxhbnk+LCBkZWxldGU/Om51bWJlciwgcmV0YWluPzpudW1iZXIsIGF0dHJpYnV0ZXM/OiBPYmplY3Q8c3RyaW5nLGFueT59Pn1cbiAgICAgICAqL1xuICAgICAgY29uc3QgZGVsdGEgPSBbXVxuICAgICAgdHJhbnNhY3QoeSwgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50QXR0cmlidXRlcyA9IG5ldyBNYXAoKSAvLyBzYXZlcyBhbGwgY3VycmVudCBhdHRyaWJ1dGVzIGZvciBpbnNlcnRcbiAgICAgICAgY29uc3Qgb2xkQXR0cmlidXRlcyA9IG5ldyBNYXAoKVxuICAgICAgICBsZXQgaXRlbSA9IHRoaXMudGFyZ2V0Ll9zdGFydFxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge3N0cmluZz99XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgYWN0aW9uID0gbnVsbFxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge09iamVjdDxzdHJpbmcsYW55Pn1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fSAvLyBjb3VudHMgYWRkZWQgb3IgcmVtb3ZlZCBuZXcgYXR0cmlidXRlcyBmb3IgcmV0YWluXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfG9iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGxldCBpbnNlcnQgPSAnJ1xuICAgICAgICBsZXQgcmV0YWluID0gMFxuICAgICAgICBsZXQgZGVsZXRlTGVuID0gMFxuICAgICAgICBjb25zdCBhZGRPcCA9ICgpID0+IHtcbiAgICAgICAgICBpZiAoYWN0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEB0eXBlIHthbnl9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxldCBvcCA9IG51bGxcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgICAgICAgICAgaWYgKGRlbGV0ZUxlbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgIG9wID0geyBkZWxldGU6IGRlbGV0ZUxlbiB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlbGV0ZUxlbiA9IDBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdpbnNlcnQnOlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5zZXJ0ID09PSAnb2JqZWN0JyB8fCBpbnNlcnQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgb3AgPSB7IGluc2VydCB9XG4gICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEF0dHJpYnV0ZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgb3AuYXR0cmlidXRlcyA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGVzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wLmF0dHJpYnV0ZXNba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbnNlcnQgPSAnJ1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ3JldGFpbic6XG4gICAgICAgICAgICAgICAgaWYgKHJldGFpbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgIG9wID0geyByZXRhaW4gfVxuICAgICAgICAgICAgICAgICAgaWYgKCFvYmplY3QuaXNFbXB0eShhdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgICAgICAgICBvcC5hdHRyaWJ1dGVzID0gb2JqZWN0LmFzc2lnbih7fSwgYXR0cmlidXRlcylcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0YWluID0gMFxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3ApIGRlbHRhLnB1c2gob3ApXG4gICAgICAgICAgICBhY3Rpb24gPSBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChpdGVtICE9PSBudWxsKSB7XG4gICAgICAgICAgc3dpdGNoIChpdGVtLmNvbnRlbnQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIGNhc2UgQ29udGVudFR5cGU6XG4gICAgICAgICAgICBjYXNlIENvbnRlbnRFbWJlZDpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuYWRkcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5kZWxldGVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgICBhY3Rpb24gPSAnaW5zZXJ0J1xuICAgICAgICAgICAgICAgICAgaW5zZXJ0ID0gaXRlbS5jb250ZW50LmdldENvbnRlbnQoKVswXVxuICAgICAgICAgICAgICAgICAgYWRkT3AoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRlbGV0ZXMoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uICE9PSAnZGVsZXRlJykge1xuICAgICAgICAgICAgICAgICAgYWRkT3AoKVxuICAgICAgICAgICAgICAgICAgYWN0aW9uID0gJ2RlbGV0ZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVsZXRlTGVuICs9IDFcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPT0gJ3JldGFpbicpIHtcbiAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICAgIGFjdGlvbiA9ICdyZXRhaW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldGFpbiArPSAxXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgQ29udGVudFN0cmluZzpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuYWRkcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5kZWxldGVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uICE9PSAnaW5zZXJ0Jykge1xuICAgICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9ICdpbnNlcnQnXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpbnNlcnQgKz0gLyoqIEB0eXBlIHtDb250ZW50U3RyaW5nfSAqLyAoaXRlbS5jb250ZW50KS5zdHJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5kZWxldGVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPT0gJ2RlbGV0ZScpIHtcbiAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICAgIGFjdGlvbiA9ICdkZWxldGUnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlbGV0ZUxlbiArPSBpdGVtLmxlbmd0aFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpdGVtLmRlbGV0ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uICE9PSAncmV0YWluJykge1xuICAgICAgICAgICAgICAgICAgYWRkT3AoKVxuICAgICAgICAgICAgICAgICAgYWN0aW9uID0gJ3JldGFpbidcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0YWluICs9IGl0ZW0ubGVuZ3RoXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgQ29udGVudEZvcm1hdDoge1xuICAgICAgICAgICAgICBjb25zdCB7IGtleSwgdmFsdWUgfSA9IC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKGl0ZW0uY29udGVudClcbiAgICAgICAgICAgICAgaWYgKHRoaXMuYWRkcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5kZWxldGVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBjdXJWYWwgPSBjdXJyZW50QXR0cmlidXRlcy5nZXQoa2V5KSA/PyBudWxsXG4gICAgICAgICAgICAgICAgICBpZiAoIWVxdWFsQXR0cnMoY3VyVmFsLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3JldGFpbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICBhZGRPcCgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVxdWFsQXR0cnModmFsdWUsIChvbGRBdHRyaWJ1dGVzLmdldChrZXkpID8/IG51bGwpKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBhdHRyaWJ1dGVzW2tleV1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRlbGV0ZXMoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICBvbGRBdHRyaWJ1dGVzLnNldChrZXksIHZhbHVlKVxuICAgICAgICAgICAgICAgIGNvbnN0IGN1clZhbCA9IGN1cnJlbnRBdHRyaWJ1dGVzLmdldChrZXkpID8/IG51bGxcbiAgICAgICAgICAgICAgICBpZiAoIWVxdWFsQXR0cnMoY3VyVmFsLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09ICdyZXRhaW4nKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IGN1clZhbFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlcy5zZXQoa2V5LCB2YWx1ZSlcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyID0gYXR0cmlidXRlc1trZXldXG4gICAgICAgICAgICAgICAgaWYgKGF0dHIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgaWYgKCFlcXVhbEF0dHJzKGF0dHIsIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uID09PSAncmV0YWluJykge1xuICAgICAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgYXR0cmlidXRlc1trZXldXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlc1trZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhdHRyICE9PSBudWxsKSB7IC8vIHRoaXMgd2lsbCBiZSBjbGVhbmVkIHVwIGF1dG9tYXRpY2FsbHkgYnkgdGhlIGNvbnRleHRsZXNzIGNsZWFudXAgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kZWxldGUodHJhbnNhY3Rpb24pXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2luc2VydCcpIHtcbiAgICAgICAgICAgICAgICAgIGFkZE9wKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdXBkYXRlQ3VycmVudEF0dHJpYnV0ZXMoY3VycmVudEF0dHJpYnV0ZXMsIC8qKiBAdHlwZSB7Q29udGVudEZvcm1hdH0gKi8gKGl0ZW0uY29udGVudCkpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaXRlbSA9IGl0ZW0ucmlnaHRcbiAgICAgICAgfVxuICAgICAgICBhZGRPcCgpXG4gICAgICAgIHdoaWxlIChkZWx0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc3QgbGFzdE9wID0gZGVsdGFbZGVsdGEubGVuZ3RoIC0gMV1cbiAgICAgICAgICBpZiAobGFzdE9wLnJldGFpbiAhPT0gdW5kZWZpbmVkICYmIGxhc3RPcC5hdHRyaWJ1dGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIHJldGFpbiBkZWx0YSdzIGlmIHRoZXkgZG9uJ3QgYXNzaWduIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgIGRlbHRhLnBvcCgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5fZGVsdGEgPSBkZWx0YVxuICAgIH1cbiAgICByZXR1cm4gLyoqIEB0eXBlIHthbnl9ICovICh0aGlzLl9kZWx0YSlcbiAgfVxufVxuXG4vKipcbiAqIFR5cGUgdGhhdCByZXByZXNlbnRzIHRleHQgd2l0aCBmb3JtYXR0aW5nIGluZm9ybWF0aW9uLlxuICpcbiAqIFRoaXMgdHlwZSByZXBsYWNlcyB5LXJpY2h0ZXh0IGFzIHRoaXMgaW1wbGVtZW50YXRpb24gaXMgYWJsZSB0byBoYW5kbGVcbiAqIGJsb2NrIGZvcm1hdHMgKGZvcm1hdCBpbmZvcm1hdGlvbiBvbiBhIHBhcmFncmFwaCksIGVtYmVkcyAoY29tcGxleCBlbGVtZW50c1xuICogbGlrZSBwaWN0dXJlcyBhbmQgdmlkZW9zKSwgYW5kIHRleHQgZm9ybWF0cyAoKipib2xkKiosICppdGFsaWMqKS5cbiAqXG4gKiBAZXh0ZW5kcyBBYnN0cmFjdFR5cGU8WVRleHRFdmVudD5cbiAqL1xuZXhwb3J0IGNsYXNzIFlUZXh0IGV4dGVuZHMgQWJzdHJhY3RUeXBlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbc3RyaW5nXSBUaGUgaW5pdGlhbCB2YWx1ZSBvZiB0aGUgWVRleHQuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RyaW5nKSB7XG4gICAgc3VwZXIoKVxuICAgIC8qKlxuICAgICAqIEFycmF5IG9mIHBlbmRpbmcgb3BlcmF0aW9ucyBvbiB0aGlzIHR5cGVcbiAgICAgKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24oKTp2b2lkPj99XG4gICAgICovXG4gICAgdGhpcy5fcGVuZGluZyA9IHN0cmluZyAhPT0gdW5kZWZpbmVkID8gWygpID0+IHRoaXMuaW5zZXJ0KDAsIHN0cmluZyldIDogW11cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8QXJyYXlTZWFyY2hNYXJrZXI+fG51bGx9XG4gICAgICovXG4gICAgdGhpcy5fc2VhcmNoTWFya2VyID0gW11cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoaXMgWVRleHQgY29udGFpbnMgZm9ybWF0dGluZyBhdHRyaWJ1dGVzLlxuICAgICAqIFRoaXMgZmxhZyBpcyB1cGRhdGVkIHdoZW4gYSBmb3JtYXR0aW5nIGl0ZW0gaXMgaW50ZWdyYXRlZCAoc2VlIENvbnRlbnRGb3JtYXQuaW50ZWdyYXRlKVxuICAgICAqL1xuICAgIHRoaXMuX2hhc0Zvcm1hdHRpbmcgPSBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBjaGFyYWN0ZXJzIG9mIHRoaXMgdGV4dCB0eXBlLlxuICAgKlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IGxlbmd0aCAoKSB7XG4gICAgdGhpcy5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gICAgcmV0dXJuIHRoaXMuX2xlbmd0aFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RG9jfSB5XG4gICAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICAgKi9cbiAgX2ludGVncmF0ZSAoeSwgaXRlbSkge1xuICAgIHN1cGVyLl9pbnRlZ3JhdGUoeSwgaXRlbSlcbiAgICB0cnkge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxmdW5jdGlvbj59ICovICh0aGlzLl9wZW5kaW5nKS5mb3JFYWNoKGYgPT4gZigpKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICB9XG4gICAgdGhpcy5fcGVuZGluZyA9IG51bGxcbiAgfVxuXG4gIF9jb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IFlUZXh0KClcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIGNvcHkgb2YgdGhpcyBkYXRhIHR5cGUgdGhhdCBjYW4gYmUgaW5jbHVkZWQgc29tZXdoZXJlIGVsc2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgY29udGVudCBpcyBvbmx5IHJlYWRhYmxlIF9hZnRlcl8gaXQgaGFzIGJlZW4gaW5jbHVkZWQgc29tZXdoZXJlIGluIHRoZSBZZG9jLlxuICAgKlxuICAgKiBAcmV0dXJuIHtZVGV4dH1cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICBjb25zdCB0ZXh0ID0gbmV3IFlUZXh0KClcbiAgICB0ZXh0LmFwcGx5RGVsdGEodGhpcy50b0RlbHRhKCkpXG4gICAgcmV0dXJuIHRleHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFlUZXh0RXZlbnQgYW5kIGNhbGxzIG9ic2VydmVycy5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTZXQ8bnVsbHxzdHJpbmc+fSBwYXJlbnRTdWJzIEtleXMgY2hhbmdlZCBvbiB0aGlzIHR5cGUuIGBudWxsYCBpZiBsaXN0IHdhcyBtb2RpZmllZC5cbiAgICovXG4gIF9jYWxsT2JzZXJ2ZXIgKHRyYW5zYWN0aW9uLCBwYXJlbnRTdWJzKSB7XG4gICAgc3VwZXIuX2NhbGxPYnNlcnZlcih0cmFuc2FjdGlvbiwgcGFyZW50U3VicylcbiAgICBjb25zdCBldmVudCA9IG5ldyBZVGV4dEV2ZW50KHRoaXMsIHRyYW5zYWN0aW9uLCBwYXJlbnRTdWJzKVxuICAgIGNhbGxUeXBlT2JzZXJ2ZXJzKHRoaXMsIHRyYW5zYWN0aW9uLCBldmVudClcbiAgICAvLyBJZiBhIHJlbW90ZSBjaGFuZ2UgaGFwcGVuZWQsIHdlIHRyeSB0byBjbGVhbnVwIHBvdGVudGlhbCBmb3JtYXR0aW5nIGR1cGxpY2F0ZXMuXG4gICAgaWYgKCF0cmFuc2FjdGlvbi5sb2NhbCAmJiB0aGlzLl9oYXNGb3JtYXR0aW5nKSB7XG4gICAgICB0cmFuc2FjdGlvbi5fbmVlZEZvcm1hdHRpbmdDbGVhbnVwID0gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB1bmZvcm1hdHRlZCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBZVGV4dCB0eXBlLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b1N0cmluZyAoKSB7XG4gICAgdGhpcy5kb2MgPz8gd2FyblByZW1hdHVyZUFjY2VzcygpXG4gICAgbGV0IHN0ciA9ICcnXG4gICAgLyoqXG4gICAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICAgKi9cbiAgICBsZXQgbiA9IHRoaXMuX3N0YXJ0XG4gICAgd2hpbGUgKG4gIT09IG51bGwpIHtcbiAgICAgIGlmICghbi5kZWxldGVkICYmIG4uY291bnRhYmxlICYmIG4uY29udGVudC5jb25zdHJ1Y3RvciA9PT0gQ29udGVudFN0cmluZykge1xuICAgICAgICBzdHIgKz0gLyoqIEB0eXBlIHtDb250ZW50U3RyaW5nfSAqLyAobi5jb250ZW50KS5zdHJcbiAgICAgIH1cbiAgICAgIG4gPSBuLnJpZ2h0XG4gICAgfVxuICAgIHJldHVybiBzdHJcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB1bmZvcm1hdHRlZCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBZVGV4dCB0eXBlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRvSlNPTiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IGEge0BsaW5rIERlbHRhfSBvbiB0aGlzIHNoYXJlZCBZVGV4dCB0eXBlLlxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gZGVsdGEgVGhlIGNoYW5nZXMgdG8gYXBwbHkgb24gdGhpcyBlbGVtZW50LlxuICAgKiBAcGFyYW0ge29iamVjdH0gIG9wdHNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5zYW5pdGl6ZV0gU2FuaXRpemUgaW5wdXQgZGVsdGEuIFJlbW92ZXMgZW5kaW5nIG5ld2xpbmVzIGlmIHNldCB0byB0cnVlLlxuICAgKlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBhcHBseURlbHRhIChkZWx0YSwgeyBzYW5pdGl6ZSA9IHRydWUgfSA9IHt9KSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICBjb25zdCBjdXJyUG9zID0gbmV3IEl0ZW1UZXh0TGlzdFBvc2l0aW9uKG51bGwsIHRoaXMuX3N0YXJ0LCAwLCBuZXcgTWFwKCkpXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVsdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvcCA9IGRlbHRhW2ldXG4gICAgICAgICAgaWYgKG9wLmluc2VydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBRdWlsbCBhc3N1bWVzIHRoYXQgdGhlIGNvbnRlbnQgc3RhcnRzIHdpdGggYW4gZW1wdHkgcGFyYWdyYXBoLlxuICAgICAgICAgICAgLy8gWWpzL1kuVGV4dCBhc3N1bWVzIHRoYXQgaXQgc3RhcnRzIGVtcHR5LiBXZSBhbHdheXMgaGlkZSB0aGF0XG4gICAgICAgICAgICAvLyB0aGVyZSBpcyBhIG5ld2xpbmUgYXQgdGhlIGVuZCBvZiB0aGUgY29udGVudC5cbiAgICAgICAgICAgIC8vIElmIHdlIG9taXQgdGhpcyBzdGVwLCBjbGllbnRzIHdpbGwgc2VlIGEgZGlmZmVyZW50IG51bWJlciBvZlxuICAgICAgICAgICAgLy8gcGFyYWdyYXBocywgYnV0IG5vdGhpbmcgYmFkIHdpbGwgaGFwcGVuLlxuICAgICAgICAgICAgY29uc3QgaW5zID0gKCFzYW5pdGl6ZSAmJiB0eXBlb2Ygb3AuaW5zZXJ0ID09PSAnc3RyaW5nJyAmJiBpID09PSBkZWx0YS5sZW5ndGggLSAxICYmIGN1cnJQb3MucmlnaHQgPT09IG51bGwgJiYgb3AuaW5zZXJ0LnNsaWNlKC0xKSA9PT0gJ1xcbicpID8gb3AuaW5zZXJ0LnNsaWNlKDAsIC0xKSA6IG9wLmluc2VydFxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnMgIT09ICdzdHJpbmcnIHx8IGlucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIGluc2VydFRleHQodHJhbnNhY3Rpb24sIHRoaXMsIGN1cnJQb3MsIGlucywgb3AuYXR0cmlidXRlcyB8fCB7fSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG9wLnJldGFpbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3JtYXRUZXh0KHRyYW5zYWN0aW9uLCB0aGlzLCBjdXJyUG9zLCBvcC5yZXRhaW4sIG9wLmF0dHJpYnV0ZXMgfHwge30pXG4gICAgICAgICAgfSBlbHNlIGlmIChvcC5kZWxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlVGV4dCh0cmFuc2FjdGlvbiwgY3VyclBvcywgb3AuZGVsZXRlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxmdW5jdGlvbj59ICovICh0aGlzLl9wZW5kaW5nKS5wdXNoKCgpID0+IHRoaXMuYXBwbHlEZWx0YShkZWx0YSkpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIERlbHRhIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgWVRleHQgdHlwZS5cbiAgICpcbiAgICogQHBhcmFtIHtTbmFwc2hvdH0gW3NuYXBzaG90XVxuICAgKiBAcGFyYW0ge1NuYXBzaG90fSBbcHJldlNuYXBzaG90XVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKCdyZW1vdmVkJyB8ICdhZGRlZCcsIElEKTphbnl9IFtjb21wdXRlWUNoYW5nZV1cbiAgICogQHJldHVybiB7YW55fSBUaGUgRGVsdGEgcmVwcmVzZW50YXRpb24gb2YgdGhpcyB0eXBlLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b0RlbHRhIChzbmFwc2hvdCwgcHJldlNuYXBzaG90LCBjb21wdXRlWUNoYW5nZSkge1xuICAgIHRoaXMuZG9jID8/IHdhcm5QcmVtYXR1cmVBY2Nlc3MoKVxuICAgIC8qKlxuICAgICAqIEB0eXBle0FycmF5PGFueT59XG4gICAgICovXG4gICAgY29uc3Qgb3BzID0gW11cbiAgICBjb25zdCBjdXJyZW50QXR0cmlidXRlcyA9IG5ldyBNYXAoKVxuICAgIGNvbnN0IGRvYyA9IC8qKiBAdHlwZSB7RG9jfSAqLyAodGhpcy5kb2MpXG4gICAgbGV0IHN0ciA9ICcnXG4gICAgbGV0IG4gPSB0aGlzLl9zdGFydFxuICAgIGZ1bmN0aW9uIHBhY2tTdHIgKCkge1xuICAgICAgaWYgKHN0ci5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIHBhY2sgc3RyIHdpdGggYXR0cmlidXRlcyB0byBvcHNcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge31cbiAgICAgICAgbGV0IGFkZEF0dHJpYnV0ZXMgPSBmYWxzZVxuICAgICAgICBjdXJyZW50QXR0cmlidXRlcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgYWRkQXR0cmlidXRlcyA9IHRydWVcbiAgICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWx1ZVxuICAgICAgICB9KVxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge09iamVjdDxzdHJpbmcsYW55Pn1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IG9wID0geyBpbnNlcnQ6IHN0ciB9XG4gICAgICAgIGlmIChhZGRBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgb3AuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXNcbiAgICAgICAgfVxuICAgICAgICBvcHMucHVzaChvcClcbiAgICAgICAgc3RyID0gJydcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgY29tcHV0ZURlbHRhID0gKCkgPT4ge1xuICAgICAgd2hpbGUgKG4gIT09IG51bGwpIHtcbiAgICAgICAgaWYgKGlzVmlzaWJsZShuLCBzbmFwc2hvdCkgfHwgKHByZXZTbmFwc2hvdCAhPT0gdW5kZWZpbmVkICYmIGlzVmlzaWJsZShuLCBwcmV2U25hcHNob3QpKSkge1xuICAgICAgICAgIHN3aXRjaCAobi5jb250ZW50LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjYXNlIENvbnRlbnRTdHJpbmc6IHtcbiAgICAgICAgICAgICAgY29uc3QgY3VyID0gY3VycmVudEF0dHJpYnV0ZXMuZ2V0KCd5Y2hhbmdlJylcbiAgICAgICAgICAgICAgaWYgKHNuYXBzaG90ICE9PSB1bmRlZmluZWQgJiYgIWlzVmlzaWJsZShuLCBzbmFwc2hvdCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VyID09PSB1bmRlZmluZWQgfHwgY3VyLnVzZXIgIT09IG4uaWQuY2xpZW50IHx8IGN1ci50eXBlICE9PSAncmVtb3ZlZCcpIHtcbiAgICAgICAgICAgICAgICAgIHBhY2tTdHIoKVxuICAgICAgICAgICAgICAgICAgY3VycmVudEF0dHJpYnV0ZXMuc2V0KCd5Y2hhbmdlJywgY29tcHV0ZVlDaGFuZ2UgPyBjb21wdXRlWUNoYW5nZSgncmVtb3ZlZCcsIG4uaWQpIDogeyB0eXBlOiAncmVtb3ZlZCcgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldlNuYXBzaG90ICE9PSB1bmRlZmluZWQgJiYgIWlzVmlzaWJsZShuLCBwcmV2U25hcHNob3QpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdW5kZWZpbmVkIHx8IGN1ci51c2VyICE9PSBuLmlkLmNsaWVudCB8fCBjdXIudHlwZSAhPT0gJ2FkZGVkJykge1xuICAgICAgICAgICAgICAgICAgcGFja1N0cigpXG4gICAgICAgICAgICAgICAgICBjdXJyZW50QXR0cmlidXRlcy5zZXQoJ3ljaGFuZ2UnLCBjb21wdXRlWUNoYW5nZSA/IGNvbXB1dGVZQ2hhbmdlKCdhZGRlZCcsIG4uaWQpIDogeyB0eXBlOiAnYWRkZWQnIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGFja1N0cigpXG4gICAgICAgICAgICAgICAgY3VycmVudEF0dHJpYnV0ZXMuZGVsZXRlKCd5Y2hhbmdlJylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdHIgKz0gLyoqIEB0eXBlIHtDb250ZW50U3RyaW5nfSAqLyAobi5jb250ZW50KS5zdHJcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgQ29udGVudFR5cGU6XG4gICAgICAgICAgICBjYXNlIENvbnRlbnRFbWJlZDoge1xuICAgICAgICAgICAgICBwYWNrU3RyKClcbiAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICBjb25zdCBvcCA9IHtcbiAgICAgICAgICAgICAgICBpbnNlcnQ6IG4uY29udGVudC5nZXRDb250ZW50KClbMF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoY3VycmVudEF0dHJpYnV0ZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRycyA9IC8qKiBAdHlwZSB7T2JqZWN0PHN0cmluZyxhbnk+fSAqLyAoe30pXG4gICAgICAgICAgICAgICAgb3AuYXR0cmlidXRlcyA9IGF0dHJzXG4gICAgICAgICAgICAgICAgY3VycmVudEF0dHJpYnV0ZXMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgYXR0cnNba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBvcHMucHVzaChvcClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgQ29udGVudEZvcm1hdDpcbiAgICAgICAgICAgICAgaWYgKGlzVmlzaWJsZShuLCBzbmFwc2hvdCkpIHtcbiAgICAgICAgICAgICAgICBwYWNrU3RyKClcbiAgICAgICAgICAgICAgICB1cGRhdGVDdXJyZW50QXR0cmlidXRlcyhjdXJyZW50QXR0cmlidXRlcywgLyoqIEB0eXBlIHtDb250ZW50Rm9ybWF0fSAqLyAobi5jb250ZW50KSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBuID0gbi5yaWdodFxuICAgICAgfVxuICAgICAgcGFja1N0cigpXG4gICAgfVxuICAgIGlmIChzbmFwc2hvdCB8fCBwcmV2U25hcHNob3QpIHtcbiAgICAgIC8vIHNuYXBzaG90cyBhcmUgbWVyZ2VkIGFnYWluIGFmdGVyIHRoZSB0cmFuc2FjdGlvbiwgc28gd2UgbmVlZCB0byBrZWVwIHRoZVxuICAgICAgLy8gdHJhbnNhY3Rpb24gYWxpdmUgdW50aWwgd2UgYXJlIGRvbmVcbiAgICAgIHRyYW5zYWN0KGRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICBpZiAoc25hcHNob3QpIHtcbiAgICAgICAgICBzcGxpdFNuYXBzaG90QWZmZWN0ZWRTdHJ1Y3RzKHRyYW5zYWN0aW9uLCBzbmFwc2hvdClcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldlNuYXBzaG90KSB7XG4gICAgICAgICAgc3BsaXRTbmFwc2hvdEFmZmVjdGVkU3RydWN0cyh0cmFuc2FjdGlvbiwgcHJldlNuYXBzaG90KVxuICAgICAgICB9XG4gICAgICAgIGNvbXB1dGVEZWx0YSgpXG4gICAgICB9LCAnY2xlYW51cCcpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXB1dGVEZWx0YSgpXG4gICAgfVxuICAgIHJldHVybiBvcHNcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgdGV4dCBhdCBhIGdpdmVuIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIHN0YXJ0IGluc2VydGluZy5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gaW5zZXJ0IGF0IHRoZSBzcGVjaWZpZWQgcG9zaXRpb24uXG4gICAqIEBwYXJhbSB7VGV4dEF0dHJpYnV0ZXN9IFthdHRyaWJ1dGVzXSBPcHRpb25hbGx5IGRlZmluZSBzb21lIGZvcm1hdHRpbmdcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvcm1hdGlvbiB0byBhcHBseSBvbiB0aGUgaW5zZXJ0ZWRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUZXh0LlxuICAgKiBAcHVibGljXG4gICAqL1xuICBpbnNlcnQgKGluZGV4LCB0ZXh0LCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHRleHQubGVuZ3RoIDw9IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCB5ID0gdGhpcy5kb2NcbiAgICBpZiAoeSAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QoeSwgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICBjb25zdCBwb3MgPSBmaW5kUG9zaXRpb24odHJhbnNhY3Rpb24sIHRoaXMsIGluZGV4LCAhYXR0cmlidXRlcylcbiAgICAgICAgaWYgKCFhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgYXR0cmlidXRlcyA9IHt9XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIHBvcy5jdXJyZW50QXR0cmlidXRlcy5mb3JFYWNoKCh2LCBrKSA9PiB7IGF0dHJpYnV0ZXNba10gPSB2IH0pXG4gICAgICAgIH1cbiAgICAgICAgaW5zZXJ0VGV4dCh0cmFuc2FjdGlvbiwgdGhpcywgcG9zLCB0ZXh0LCBhdHRyaWJ1dGVzKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxmdW5jdGlvbj59ICovICh0aGlzLl9wZW5kaW5nKS5wdXNoKCgpID0+IHRoaXMuaW5zZXJ0KGluZGV4LCB0ZXh0LCBhdHRyaWJ1dGVzKSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0cyBhbiBlbWJlZCBhdCBhIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggVGhlIGluZGV4IHRvIGluc2VydCB0aGUgZW1iZWQgYXQuXG4gICAqIEBwYXJhbSB7T2JqZWN0IHwgQWJzdHJhY3RUeXBlPGFueT59IGVtYmVkIFRoZSBPYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBlbWJlZC5cbiAgICogQHBhcmFtIHtUZXh0QXR0cmlidXRlc30gW2F0dHJpYnV0ZXNdIEF0dHJpYnV0ZSBpbmZvcm1hdGlvbiB0byBhcHBseSBvbiB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWJlZFxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBpbnNlcnRFbWJlZCAoaW5kZXgsIGVtYmVkLCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgeSA9IHRoaXMuZG9jXG4gICAgaWYgKHkgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHksIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgY29uc3QgcG9zID0gZmluZFBvc2l0aW9uKHRyYW5zYWN0aW9uLCB0aGlzLCBpbmRleCwgIWF0dHJpYnV0ZXMpXG4gICAgICAgIGluc2VydFRleHQodHJhbnNhY3Rpb24sIHRoaXMsIHBvcywgZW1iZWQsIGF0dHJpYnV0ZXMgfHwge30pXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge0FycmF5PGZ1bmN0aW9uPn0gKi8gKHRoaXMuX3BlbmRpbmcpLnB1c2goKCkgPT4gdGhpcy5pbnNlcnRFbWJlZChpbmRleCwgZW1iZWQsIGF0dHJpYnV0ZXMgfHwge30pKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIHRleHQgc3RhcnRpbmcgZnJvbSBhbiBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IEluZGV4IGF0IHdoaWNoIHRvIHN0YXJ0IGRlbGV0aW5nLlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyB0byByZW1vdmUuIERlZmF1bHRzIHRvIDEuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGRlbGV0ZSAoaW5kZXgsIGxlbmd0aCkge1xuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCB5ID0gdGhpcy5kb2NcbiAgICBpZiAoeSAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QoeSwgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICBkZWxldGVUZXh0KHRyYW5zYWN0aW9uLCBmaW5kUG9zaXRpb24odHJhbnNhY3Rpb24sIHRoaXMsIGluZGV4LCB0cnVlKSwgbGVuZ3RoKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtBcnJheTxmdW5jdGlvbj59ICovICh0aGlzLl9wZW5kaW5nKS5wdXNoKCgpID0+IHRoaXMuZGVsZXRlKGluZGV4LCBsZW5ndGgpKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25zIHByb3BlcnRpZXMgdG8gYSByYW5nZSBvZiB0ZXh0LlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggVGhlIHBvc2l0aW9uIHdoZXJlIHRvIHN0YXJ0IGZvcm1hdHRpbmcuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggVGhlIGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRvIGFzc2lnbiBwcm9wZXJ0aWVzIHRvLlxuICAgKiBAcGFyYW0ge1RleHRBdHRyaWJ1dGVzfSBhdHRyaWJ1dGVzIEF0dHJpYnV0ZSBpbmZvcm1hdGlvbiB0byBhcHBseSBvbiB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBmb3JtYXQgKGluZGV4LCBsZW5ndGgsIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgeSA9IHRoaXMuZG9jXG4gICAgaWYgKHkgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHksIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgY29uc3QgcG9zID0gZmluZFBvc2l0aW9uKHRyYW5zYWN0aW9uLCB0aGlzLCBpbmRleCwgZmFsc2UpXG4gICAgICAgIGlmIChwb3MucmlnaHQgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBmb3JtYXRUZXh0KHRyYW5zYWN0aW9uLCB0aGlzLCBwb3MsIGxlbmd0aCwgYXR0cmlidXRlcylcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24+fSAqLyAodGhpcy5fcGVuZGluZykucHVzaCgoKSA9PiB0aGlzLmZvcm1hdChpbmRleCwgbGVuZ3RoLCBhdHRyaWJ1dGVzKSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBhdHRyaWJ1dGUuXG4gICAqXG4gICAqIEBub3RlIFhtbC1UZXh0IG5vZGVzIGRvbid0IGhhdmUgYXR0cmlidXRlcy4gWW91IGNhbiB1c2UgdGhpcyBmZWF0dXJlIHRvIGFzc2lnbiBwcm9wZXJ0aWVzIHRvIGNvbXBsZXRlIHRleHQtYmxvY2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXR0cmlidXRlTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdGhhdCBpcyB0byBiZSByZW1vdmVkLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICByZW1vdmVBdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHR5cGVNYXBEZWxldGUodHJhbnNhY3Rpb24sIHRoaXMsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge0FycmF5PGZ1bmN0aW9uPn0gKi8gKHRoaXMuX3BlbmRpbmcpLnB1c2goKCkgPT4gdGhpcy5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgb3IgdXBkYXRlcyBhbiBhdHRyaWJ1dGUuXG4gICAqXG4gICAqIEBub3RlIFhtbC1UZXh0IG5vZGVzIGRvbid0IGhhdmUgYXR0cmlidXRlcy4gWW91IGNhbiB1c2UgdGhpcyBmZWF0dXJlIHRvIGFzc2lnbiBwcm9wZXJ0aWVzIHRvIGNvbXBsZXRlIHRleHQtYmxvY2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXR0cmlidXRlTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdGhhdCBpcyB0byBiZSBzZXQuXG4gICAqIEBwYXJhbSB7YW55fSBhdHRyaWJ1dGVWYWx1ZSBUaGUgYXR0cmlidXRlIHZhbHVlIHRoYXQgaXMgdG8gYmUgc2V0LlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBzZXRBdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTWFwU2V0KHRyYW5zYWN0aW9uLCB0aGlzLCBhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSlcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKiBAdHlwZSB7QXJyYXk8ZnVuY3Rpb24+fSAqLyAodGhpcy5fcGVuZGluZykucHVzaCgoKSA9PiB0aGlzLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSkpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXR0cmlidXRlIHZhbHVlIHRoYXQgYmVsb25ncyB0byB0aGUgYXR0cmlidXRlIG5hbWUuXG4gICAqXG4gICAqIEBub3RlIFhtbC1UZXh0IG5vZGVzIGRvbid0IGhhdmUgYXR0cmlidXRlcy4gWW91IGNhbiB1c2UgdGhpcyBmZWF0dXJlIHRvIGFzc2lnbiBwcm9wZXJ0aWVzIHRvIGNvbXBsZXRlIHRleHQtYmxvY2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXR0cmlidXRlTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdGhhdCBpZGVudGlmaWVzIHRoZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyaWVkIHZhbHVlLlxuICAgKiBAcmV0dXJuIHthbnl9IFRoZSBxdWVyaWVkIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZ2V0QXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAodHlwZU1hcEdldCh0aGlzLCBhdHRyaWJ1dGVOYW1lKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBpbiBhIEpTT04gT2JqZWN0LlxuICAgKlxuICAgKiBAbm90ZSBYbWwtVGV4dCBub2RlcyBkb24ndCBoYXZlIGF0dHJpYnV0ZXMuIFlvdSBjYW4gdXNlIHRoaXMgZmVhdHVyZSB0byBhc3NpZ24gcHJvcGVydGllcyB0byBjb21wbGV0ZSB0ZXh0LWJsb2Nrcy5cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0PHN0cmluZywgYW55Pn0gQSBKU09OIE9iamVjdCB0aGF0IGRlc2NyaWJlcyB0aGUgYXR0cmlidXRlcy5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZ2V0QXR0cmlidXRlcyAoKSB7XG4gICAgcmV0dXJuIHR5cGVNYXBHZXRBbGwodGhpcylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKi9cbiAgX3dyaXRlIChlbmNvZGVyKSB7XG4gICAgZW5jb2Rlci53cml0ZVR5cGVSZWYoWVRleHRSZWZJRClcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBfZGVjb2RlclxuICogQHJldHVybiB7WVRleHR9XG4gKlxuICogQHByaXZhdGVcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFlUZXh0ID0gX2RlY29kZXIgPT4gbmV3IFlUZXh0KClcbiIsICIvKipcbiAqIEBtb2R1bGUgWVhtbFxuICovXG5cbmltcG9ydCB7XG4gIFlYbWxFdmVudCxcbiAgWVhtbEVsZW1lbnQsXG4gIEFic3RyYWN0VHlwZSxcbiAgdHlwZUxpc3RNYXAsXG4gIHR5cGVMaXN0Rm9yRWFjaCxcbiAgdHlwZUxpc3RJbnNlcnRHZW5lcmljcyxcbiAgdHlwZUxpc3RJbnNlcnRHZW5lcmljc0FmdGVyLFxuICB0eXBlTGlzdERlbGV0ZSxcbiAgdHlwZUxpc3RUb0FycmF5LFxuICBZWG1sRnJhZ21lbnRSZWZJRCxcbiAgY2FsbFR5cGVPYnNlcnZlcnMsXG4gIHRyYW5zYWN0LFxuICB0eXBlTGlzdEdldCxcbiAgdHlwZUxpc3RTbGljZSxcbiAgd2FyblByZW1hdHVyZUFjY2VzcyxcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBEb2MsIENvbnRlbnRUeXBlLCBUcmFuc2FjdGlvbiwgSXRlbSwgWVhtbFRleHQsIFlYbWxIb29rIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnbGliMC9hcnJheSdcblxuLyoqXG4gKiBEZWZpbmUgdGhlIGVsZW1lbnRzIHRvIHdoaWNoIGEgc2V0IG9mIENTUyBxdWVyaWVzIGFwcGx5LlxuICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9DU1NfU2VsZWN0b3JzfENTU19TZWxlY3RvcnN9XG4gKlxuICogQGV4YW1wbGVcbiAqICAgcXVlcnkgPSAnLmNsYXNzU2VsZWN0b3InXG4gKiAgIHF1ZXJ5ID0gJ25vZGVTZWxlY3RvcidcbiAqICAgcXVlcnkgPSAnI2lkU2VsZWN0b3InXG4gKlxuICogQHR5cGVkZWYge3N0cmluZ30gQ1NTX1NlbGVjdG9yXG4gKi9cblxuLyoqXG4gKiBEb20gZmlsdGVyIGZ1bmN0aW9uLlxuICpcbiAqIEBjYWxsYmFjayBkb21GaWx0ZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgb2YgdGhlIGVsZW1lbnRcbiAqIEBwYXJhbSB7TWFwfSBhdHRyaWJ1dGVzIFRoZSBtYXAgb2YgYXR0cmlidXRlcy5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdG8gaW5jbHVkZSB0aGUgRG9tIG5vZGUgaW4gdGhlIFlYbWxFbGVtZW50LlxuICovXG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHN1YnNldCBvZiB0aGUgbm9kZXMgb2YgYSBZWG1sRWxlbWVudCAvIFlYbWxGcmFnbWVudCBhbmQgYVxuICogcG9zaXRpb24gd2l0aGluIHRoZW0uXG4gKlxuICogQ2FuIGJlIGNyZWF0ZWQgd2l0aCB7QGxpbmsgWVhtbEZyYWdtZW50I2NyZWF0ZVRyZWVXYWxrZXJ9XG4gKlxuICogQHB1YmxpY1xuICogQGltcGxlbWVudHMge0l0ZXJhYmxlPFlYbWxFbGVtZW50fFlYbWxUZXh0fFlYbWxFbGVtZW50fFlYbWxIb29rPn1cbiAqL1xuZXhwb3J0IGNsYXNzIFlYbWxUcmVlV2Fsa2VyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7WVhtbEZyYWdtZW50IHwgWVhtbEVsZW1lbnR9IHJvb3RcbiAgICogQHBhcmFtIHtmdW5jdGlvbihBYnN0cmFjdFR5cGU8YW55Pik6Ym9vbGVhbn0gW2ZdXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocm9vdCwgZiA9ICgpID0+IHRydWUpIHtcbiAgICB0aGlzLl9maWx0ZXIgPSBmXG4gICAgdGhpcy5fcm9vdCA9IHJvb3RcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SXRlbX1cbiAgICAgKi9cbiAgICB0aGlzLl9jdXJyZW50Tm9kZSA9IC8qKiBAdHlwZSB7SXRlbX0gKi8gKHJvb3QuX3N0YXJ0KVxuICAgIHRoaXMuX2ZpcnN0Q2FsbCA9IHRydWVcbiAgICByb290LmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbmV4dCBub2RlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtJdGVyYXRvclJlc3VsdDxZWG1sRWxlbWVudHxZWG1sVGV4dHxZWG1sSG9vaz59IFRoZSBuZXh0IG5vZGUuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIG5leHQgKCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAgICovXG4gICAgbGV0IG4gPSB0aGlzLl9jdXJyZW50Tm9kZVxuICAgIGxldCB0eXBlID0gbiAmJiBuLmNvbnRlbnQgJiYgLyoqIEB0eXBlIHthbnl9ICovIChuLmNvbnRlbnQpLnR5cGVcbiAgICBpZiAobiAhPT0gbnVsbCAmJiAoIXRoaXMuX2ZpcnN0Q2FsbCB8fCBuLmRlbGV0ZWQgfHwgIXRoaXMuX2ZpbHRlcih0eXBlKSkpIHsgLy8gaWYgZmlyc3QgY2FsbCwgd2UgY2hlY2sgaWYgd2UgY2FuIHVzZSB0aGUgZmlyc3QgaXRlbVxuICAgICAgZG8ge1xuICAgICAgICB0eXBlID0gLyoqIEB0eXBlIHthbnl9ICovIChuLmNvbnRlbnQpLnR5cGVcbiAgICAgICAgaWYgKCFuLmRlbGV0ZWQgJiYgKHR5cGUuY29uc3RydWN0b3IgPT09IFlYbWxFbGVtZW50IHx8IHR5cGUuY29uc3RydWN0b3IgPT09IFlYbWxGcmFnbWVudCkgJiYgdHlwZS5fc3RhcnQgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyB3YWxrIGRvd24gaW4gdGhlIHRyZWVcbiAgICAgICAgICBuID0gdHlwZS5fc3RhcnRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB3YWxrIHJpZ2h0IG9yIHVwIGluIHRoZSB0cmVlXG4gICAgICAgICAgd2hpbGUgKG4gIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChuLnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIG4gPSBuLnJpZ2h0XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG4ucGFyZW50ID09PSB0aGlzLl9yb290KSB7XG4gICAgICAgICAgICAgIG4gPSBudWxsXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKG4ucGFyZW50KS5faXRlbVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAobiAhPT0gbnVsbCAmJiAobi5kZWxldGVkIHx8ICF0aGlzLl9maWx0ZXIoLyoqIEB0eXBlIHtDb250ZW50VHlwZX0gKi8gKG4uY29udGVudCkudHlwZSkpKVxuICAgIH1cbiAgICB0aGlzLl9maXJzdENhbGwgPSBmYWxzZVxuICAgIGlmIChuID09PSBudWxsKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH1cbiAgICB9XG4gICAgdGhpcy5fY3VycmVudE5vZGUgPSBuXG4gICAgcmV0dXJuIHsgdmFsdWU6IC8qKiBAdHlwZSB7YW55fSAqLyAobi5jb250ZW50KS50eXBlLCBkb25lOiBmYWxzZSB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgbGlzdCBvZiB7QGxpbmsgWVhtbEVsZW1lbnR9LmFuZCB7QGxpbmsgWVhtbFRleHR9IHR5cGVzLlxuICogQSBZeG1sRnJhZ21lbnQgaXMgc2ltaWxhciB0byBhIHtAbGluayBZWG1sRWxlbWVudH0sIGJ1dCBpdCBkb2VzIG5vdCBoYXZlIGFcbiAqIG5vZGVOYW1lIGFuZCBpdCBkb2VzIG5vdCBoYXZlIGF0dHJpYnV0ZXMuIFRob3VnaCBpdCBjYW4gYmUgYm91bmQgdG8gYSBET01cbiAqIGVsZW1lbnQgLSBpbiB0aGlzIGNhc2UgdGhlIGF0dHJpYnV0ZXMgYW5kIHRoZSBub2RlTmFtZSBhcmUgbm90IHNoYXJlZC5cbiAqXG4gKiBAcHVibGljXG4gKiBAZXh0ZW5kcyBBYnN0cmFjdFR5cGU8WVhtbEV2ZW50PlxuICovXG5leHBvcnQgY2xhc3MgWVhtbEZyYWdtZW50IGV4dGVuZHMgQWJzdHJhY3RUeXBlIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8YW55PnxudWxsfVxuICAgICAqL1xuICAgIHRoaXMuX3ByZWxpbUNvbnRlbnQgPSBbXVxuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtZWG1sRWxlbWVudHxZWG1sVGV4dHxudWxsfVxuICAgKi9cbiAgZ2V0IGZpcnN0Q2hpbGQgKCkge1xuICAgIGNvbnN0IGZpcnN0ID0gdGhpcy5fZmlyc3RcbiAgICByZXR1cm4gZmlyc3QgPyBmaXJzdC5jb250ZW50LmdldENvbnRlbnQoKVswXSA6IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlZ3JhdGUgdGhpcyB0eXBlIGludG8gdGhlIFlqcyBpbnN0YW5jZS5cbiAgICpcbiAgICogKiBTYXZlIHRoaXMgc3RydWN0IGluIHRoZSBvc1xuICAgKiAqIFRoaXMgdHlwZSBpcyBzZW50IHRvIG90aGVyIGNsaWVudFxuICAgKiAqIE9ic2VydmVyIGZ1bmN0aW9ucyBhcmUgZmlyZWRcbiAgICpcbiAgICogQHBhcmFtIHtEb2N9IHkgVGhlIFlqcyBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIF9pbnRlZ3JhdGUgKHksIGl0ZW0pIHtcbiAgICBzdXBlci5faW50ZWdyYXRlKHksIGl0ZW0pXG4gICAgdGhpcy5pbnNlcnQoMCwgLyoqIEB0eXBlIHtBcnJheTxhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudCkpXG4gICAgdGhpcy5fcHJlbGltQ29udGVudCA9IG51bGxcbiAgfVxuXG4gIF9jb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IFlYbWxGcmFnbWVudCgpXG4gIH1cblxuICAvKipcbiAgICogTWFrZXMgYSBjb3B5IG9mIHRoaXMgZGF0YSB0eXBlIHRoYXQgY2FuIGJlIGluY2x1ZGVkIHNvbWV3aGVyZSBlbHNlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIGNvbnRlbnQgaXMgb25seSByZWFkYWJsZSBfYWZ0ZXJfIGl0IGhhcyBiZWVuIGluY2x1ZGVkIHNvbWV3aGVyZSBpbiB0aGUgWWRvYy5cbiAgICpcbiAgICogQHJldHVybiB7WVhtbEZyYWdtZW50fVxuICAgKi9cbiAgY2xvbmUgKCkge1xuICAgIGNvbnN0IGVsID0gbmV3IFlYbWxGcmFnbWVudCgpXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGVsLmluc2VydCgwLCB0aGlzLnRvQXJyYXkoKS5tYXAoaXRlbSA9PiBpdGVtIGluc3RhbmNlb2YgQWJzdHJhY3RUeXBlID8gaXRlbS5jbG9uZSgpIDogaXRlbSkpXG4gICAgcmV0dXJuIGVsXG4gIH1cblxuICBnZXQgbGVuZ3RoICgpIHtcbiAgICB0aGlzLmRvYyA/PyB3YXJuUHJlbWF0dXJlQWNjZXNzKClcbiAgICByZXR1cm4gdGhpcy5fcHJlbGltQ29udGVudCA9PT0gbnVsbCA/IHRoaXMuX2xlbmd0aCA6IHRoaXMuX3ByZWxpbUNvbnRlbnQubGVuZ3RoXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgc3VidHJlZSBvZiBjaGlsZE5vZGVzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBjb25zdCB3YWxrZXIgPSBlbGVtLmNyZWF0ZVRyZWVXYWxrZXIoZG9tID0+IGRvbS5ub2RlTmFtZSA9PT0gJ2RpdicpXG4gICAqIGZvciAobGV0IG5vZGUgaW4gd2Fsa2VyKSB7XG4gICAqICAgLy8gYG5vZGVgIGlzIGEgZGl2IG5vZGVcbiAgICogICBub3Aobm9kZSlcbiAgICogfVxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKEFic3RyYWN0VHlwZTxhbnk+KTpib29sZWFufSBmaWx0ZXIgRnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgb24gZWFjaCBjaGlsZCBlbGVtZW50IGFuZFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJucyBhIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBjaGlsZFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgaXMgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIHN1YnRyZWUuXG4gICAqIEByZXR1cm4ge1lYbWxUcmVlV2Fsa2VyfSBBIHN1YnRyZWUgYW5kIGEgcG9zaXRpb24gd2l0aGluIGl0LlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBjcmVhdGVUcmVlV2Fsa2VyIChmaWx0ZXIpIHtcbiAgICByZXR1cm4gbmV3IFlYbWxUcmVlV2Fsa2VyKHRoaXMsIGZpbHRlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBZWG1sRWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIHF1ZXJ5LlxuICAgKiBTaW1pbGFyIHRvIERPTSdzIHtAbGluayBxdWVyeVNlbGVjdG9yfS5cbiAgICpcbiAgICogUXVlcnkgc3VwcG9ydDpcbiAgICogICAtIHRhZ25hbWVcbiAgICogVE9ETzpcbiAgICogICAtIGlkXG4gICAqICAgLSBhdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIHtDU1NfU2VsZWN0b3J9IHF1ZXJ5IFRoZSBxdWVyeSBvbiB0aGUgY2hpbGRyZW4uXG4gICAqIEByZXR1cm4ge1lYbWxFbGVtZW50fFlYbWxUZXh0fFlYbWxIb29rfG51bGx9IFRoZSBmaXJzdCBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgcXVlcnkgb3IgbnVsbC5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgcXVlcnlTZWxlY3RvciAocXVlcnkpIHtcbiAgICBxdWVyeSA9IHF1ZXJ5LnRvVXBwZXJDYXNlKClcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgaXRlcmF0b3IgPSBuZXcgWVhtbFRyZWVXYWxrZXIodGhpcywgZWxlbWVudCA9PiBlbGVtZW50Lm5vZGVOYW1lICYmIGVsZW1lbnQubm9kZU5hbWUudG9VcHBlckNhc2UoKSA9PT0gcXVlcnkpXG4gICAgY29uc3QgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKVxuICAgIGlmIChuZXh0LmRvbmUpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXh0LnZhbHVlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYWxsIFlYbWxFbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBxdWVyeS5cbiAgICogU2ltaWxhciB0byBEb20ncyB7QGxpbmsgcXVlcnlTZWxlY3RvckFsbH0uXG4gICAqXG4gICAqIEB0b2RvIERvZXMgbm90IHlldCBzdXBwb3J0IGFsbCBxdWVyaWVzLiBDdXJyZW50bHkgb25seSBxdWVyeSBieSB0YWdOYW1lLlxuICAgKlxuICAgKiBAcGFyYW0ge0NTU19TZWxlY3Rvcn0gcXVlcnkgVGhlIHF1ZXJ5IG9uIHRoZSBjaGlsZHJlblxuICAgKiBAcmV0dXJuIHtBcnJheTxZWG1sRWxlbWVudHxZWG1sVGV4dHxZWG1sSG9va3xudWxsPn0gVGhlIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhpcyBxdWVyeS5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgcXVlcnlTZWxlY3RvckFsbCAocXVlcnkpIHtcbiAgICBxdWVyeSA9IHF1ZXJ5LnRvVXBwZXJDYXNlKClcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIGFycmF5LmZyb20obmV3IFlYbWxUcmVlV2Fsa2VyKHRoaXMsIGVsZW1lbnQgPT4gZWxlbWVudC5ub2RlTmFtZSAmJiBlbGVtZW50Lm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgPT09IHF1ZXJ5KSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFlYbWxFdmVudCBhbmQgY2FsbHMgb2JzZXJ2ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge1NldDxudWxsfHN0cmluZz59IHBhcmVudFN1YnMgS2V5cyBjaGFuZ2VkIG9uIHRoaXMgdHlwZS4gYG51bGxgIGlmIGxpc3Qgd2FzIG1vZGlmaWVkLlxuICAgKi9cbiAgX2NhbGxPYnNlcnZlciAodHJhbnNhY3Rpb24sIHBhcmVudFN1YnMpIHtcbiAgICBjYWxsVHlwZU9ic2VydmVycyh0aGlzLCB0cmFuc2FjdGlvbiwgbmV3IFlYbWxFdmVudCh0aGlzLCBwYXJlbnRTdWJzLCB0cmFuc2FjdGlvbikpXG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYWxsIHRoZSBjaGlsZHJlbiBvZiB0aGlzIFlYbWxGcmFnbWVudC5cbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGFsbCBjaGlsZHJlbi5cbiAgICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RNYXAodGhpcywgeG1sID0+IHhtbC50b1N0cmluZygpKS5qb2luKCcnKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvSlNPTiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBEb20gRWxlbWVudCB0aGF0IG1pcnJvcnMgdGhpcyBZWG1sRWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtEb2N1bWVudH0gW19kb2N1bWVudD1kb2N1bWVudF0gVGhlIGRvY3VtZW50IG9iamVjdCAoeW91IG11c3QgZGVmaW5lXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMgd2hlbiBjYWxsaW5nIHRoaXMgbWV0aG9kIGluXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVqcylcbiAgICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLCBhbnk+fSBbaG9va3M9e31dIE9wdGlvbmFsIHByb3BlcnR5IHRvIGN1c3RvbWl6ZSBob3cgaG9va3NcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmUgcHJlc2VudGVkIGluIHRoZSBET01cbiAgICogQHBhcmFtIHthbnl9IFtiaW5kaW5nXSBZb3Ugc2hvdWxkIG5vdCBzZXQgdGhpcyBwcm9wZXJ0eS4gVGhpcyBpc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VkIGlmIERvbUJpbmRpbmcgd2FudHMgdG8gY3JlYXRlIGFcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzb2NpYXRpb24gdG8gdGhlIGNyZWF0ZWQgRE9NIHR5cGUuXG4gICAqIEByZXR1cm4ge05vZGV9IFRoZSB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnR8RG9tIEVsZW1lbnR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRvRE9NIChfZG9jdW1lbnQgPSBkb2N1bWVudCwgaG9va3MgPSB7fSwgYmluZGluZykge1xuICAgIGNvbnN0IGZyYWdtZW50ID0gX2RvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgIGlmIChiaW5kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGJpbmRpbmcuX2NyZWF0ZUFzc29jaWF0aW9uKGZyYWdtZW50LCB0aGlzKVxuICAgIH1cbiAgICB0eXBlTGlzdEZvckVhY2godGhpcywgeG1sVHlwZSA9PiB7XG4gICAgICBmcmFnbWVudC5pbnNlcnRCZWZvcmUoeG1sVHlwZS50b0RPTShfZG9jdW1lbnQsIGhvb2tzLCBiaW5kaW5nKSwgbnVsbClcbiAgICB9KVxuICAgIHJldHVybiBmcmFnbWVudFxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydHMgbmV3IGNvbnRlbnQgYXQgYW4gaW5kZXguXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAvLyBJbnNlcnQgY2hhcmFjdGVyICdhJyBhdCBwb3NpdGlvbiAwXG4gICAqICB4bWwuaW5zZXJ0KDAsIFtuZXcgWS5YbWxUZXh0KCd0ZXh0JyldKVxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggVGhlIGluZGV4IHRvIGluc2VydCBjb250ZW50IGF0XG4gICAqIEBwYXJhbSB7QXJyYXk8WVhtbEVsZW1lbnR8WVhtbFRleHQ+fSBjb250ZW50IFRoZSBhcnJheSBvZiBjb250ZW50XG4gICAqL1xuICBpbnNlcnQgKGluZGV4LCBjb250ZW50KSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTGlzdEluc2VydEdlbmVyaWNzKHRyYW5zYWN0aW9uLCB0aGlzLCBpbmRleCwgY29udGVudClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEB0cy1pZ25vcmUgX3ByZWxpbUNvbnRlbnQgaXMgZGVmaW5lZCBiZWNhdXNlIHRoaXMgaXMgbm90IHlldCBpbnRlZ3JhdGVkXG4gICAgICB0aGlzLl9wcmVsaW1Db250ZW50LnNwbGljZShpbmRleCwgMCwgLi4uY29udGVudClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0cyBuZXcgY29udGVudCBhdCBhbiBpbmRleC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogIC8vIEluc2VydCBjaGFyYWN0ZXIgJ2EnIGF0IHBvc2l0aW9uIDBcbiAgICogIHhtbC5pbnNlcnQoMCwgW25ldyBZLlhtbFRleHQoJ3RleHQnKV0pXG4gICAqXG4gICAqIEBwYXJhbSB7bnVsbHxJdGVtfFlYbWxFbGVtZW50fFlYbWxUZXh0fSByZWYgVGhlIGluZGV4IHRvIGluc2VydCBjb250ZW50IGF0XG4gICAqIEBwYXJhbSB7QXJyYXk8WVhtbEVsZW1lbnR8WVhtbFRleHQ+fSBjb250ZW50IFRoZSBhcnJheSBvZiBjb250ZW50XG4gICAqL1xuICBpbnNlcnRBZnRlciAocmVmLCBjb250ZW50KSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICBjb25zdCByZWZJdGVtID0gKHJlZiAmJiByZWYgaW5zdGFuY2VvZiBBYnN0cmFjdFR5cGUpID8gcmVmLl9pdGVtIDogcmVmXG4gICAgICAgIHR5cGVMaXN0SW5zZXJ0R2VuZXJpY3NBZnRlcih0cmFuc2FjdGlvbiwgdGhpcywgcmVmSXRlbSwgY29udGVudClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHBjID0gLyoqIEB0eXBlIHtBcnJheTxhbnk+fSAqLyAodGhpcy5fcHJlbGltQ29udGVudClcbiAgICAgIGNvbnN0IGluZGV4ID0gcmVmID09PSBudWxsID8gMCA6IHBjLmZpbmRJbmRleChlbCA9PiBlbCA9PT0gcmVmKSArIDFcbiAgICAgIGlmIChpbmRleCA9PT0gMCAmJiByZWYgIT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgZXJyb3IuY3JlYXRlKCdSZWZlcmVuY2UgaXRlbSBub3QgZm91bmQnKVxuICAgICAgfVxuICAgICAgcGMuc3BsaWNlKGluZGV4LCAwLCAuLi5jb250ZW50KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGVsZW1lbnRzIHN0YXJ0aW5nIGZyb20gYW4gaW5kZXguXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBJbmRleCBhdCB3aGljaCB0byBzdGFydCBkZWxldGluZyBlbGVtZW50c1xuICAgKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD0xXSBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIHJlbW92ZS4gRGVmYXVsdHMgdG8gMS5cbiAgICovXG4gIGRlbGV0ZSAoaW5kZXgsIGxlbmd0aCA9IDEpIHtcbiAgICBpZiAodGhpcy5kb2MgIT09IG51bGwpIHtcbiAgICAgIHRyYW5zYWN0KHRoaXMuZG9jLCB0cmFuc2FjdGlvbiA9PiB7XG4gICAgICAgIHR5cGVMaXN0RGVsZXRlKHRyYW5zYWN0aW9uLCB0aGlzLCBpbmRleCwgbGVuZ3RoKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQHRzLWlnbm9yZSBfcHJlbGltQ29udGVudCBpcyBkZWZpbmVkIGJlY2F1c2UgdGhpcyBpcyBub3QgeWV0IGludGVncmF0ZWRcbiAgICAgIHRoaXMuX3ByZWxpbUNvbnRlbnQuc3BsaWNlKGluZGV4LCBsZW5ndGgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgdGhpcyBZQXJyYXkgdG8gYSBKYXZhU2NyaXB0IEFycmF5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtBcnJheTxZWG1sRWxlbWVudHxZWG1sVGV4dHxZWG1sSG9vaz59XG4gICAqL1xuICB0b0FycmF5ICgpIHtcbiAgICByZXR1cm4gdHlwZUxpc3RUb0FycmF5KHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kcyBjb250ZW50IHRvIHRoaXMgWUFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5PFlYbWxFbGVtZW50fFlYbWxUZXh0Pn0gY29udGVudCBBcnJheSBvZiBjb250ZW50IHRvIGFwcGVuZC5cbiAgICovXG4gIHB1c2ggKGNvbnRlbnQpIHtcbiAgICB0aGlzLmluc2VydCh0aGlzLmxlbmd0aCwgY29udGVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwZW5kcyBjb250ZW50IHRvIHRoaXMgWUFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5PFlYbWxFbGVtZW50fFlYbWxUZXh0Pn0gY29udGVudCBBcnJheSBvZiBjb250ZW50IHRvIHByZXBlbmQuXG4gICAqL1xuICB1bnNoaWZ0IChjb250ZW50KSB7XG4gICAgdGhpcy5pbnNlcnQoMCwgY29udGVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpLXRoIGVsZW1lbnQgZnJvbSBhIFlBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byByZXR1cm4gZnJvbSB0aGUgWUFycmF5XG4gICAqIEByZXR1cm4ge1lYbWxFbGVtZW50fFlYbWxUZXh0fVxuICAgKi9cbiAgZ2V0IChpbmRleCkge1xuICAgIHJldHVybiB0eXBlTGlzdEdldCh0aGlzLCBpbmRleClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcG9ydGlvbiBvZiB0aGlzIFlYbWxGcmFnbWVudCBpbnRvIGEgSmF2YVNjcmlwdCBBcnJheSBzZWxlY3RlZFxuICAgKiBmcm9tIHN0YXJ0IHRvIGVuZCAoZW5kIG5vdCBpbmNsdWRlZCkuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZW5kXVxuICAgKiBAcmV0dXJuIHtBcnJheTxZWG1sRWxlbWVudHxZWG1sVGV4dD59XG4gICAqL1xuICBzbGljZSAoc3RhcnQgPSAwLCBlbmQgPSB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiB0eXBlTGlzdFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYSBwcm92aWRlZCBmdW5jdGlvbiBvbiBvbmNlIG9uIGV2ZXJ5IGNoaWxkIGVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oWVhtbEVsZW1lbnR8WVhtbFRleHQsbnVtYmVyLCB0eXBlb2Ygc2VsZik6dm9pZH0gZiBBIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgb24gZXZlcnkgZWxlbWVudCBvZiB0aGlzIFlBcnJheS5cbiAgICovXG4gIGZvckVhY2ggKGYpIHtcbiAgICB0eXBlTGlzdEZvckVhY2godGhpcywgZilcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm0gdGhlIHByb3BlcnRpZXMgb2YgdGhpcyB0eXBlIHRvIGJpbmFyeSBhbmQgd3JpdGUgaXQgdG8gYW5cbiAgICogQmluYXJ5RW5jb2Rlci5cbiAgICpcbiAgICogVGhpcyBpcyBjYWxsZWQgd2hlbiB0aGlzIEl0ZW0gaXMgc2VudCB0byBhIHJlbW90ZSBwZWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlciBUaGUgZW5jb2RlciB0byB3cml0ZSBkYXRhIHRvLlxuICAgKi9cbiAgX3dyaXRlIChlbmNvZGVyKSB7XG4gICAgZW5jb2Rlci53cml0ZVR5cGVSZWYoWVhtbEZyYWdtZW50UmVmSUQpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gX2RlY29kZXJcbiAqIEByZXR1cm4ge1lYbWxGcmFnbWVudH1cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkWVhtbEZyYWdtZW50ID0gX2RlY29kZXIgPT4gbmV3IFlYbWxGcmFnbWVudCgpXG4iLCAiaW1wb3J0ICogYXMgb2JqZWN0IGZyb20gJ2xpYjAvb2JqZWN0J1xuXG5pbXBvcnQge1xuICBZWG1sRnJhZ21lbnQsXG4gIHRyYW5zYWN0LFxuICB0eXBlTWFwRGVsZXRlLFxuICB0eXBlTWFwSGFzLFxuICB0eXBlTWFwU2V0LFxuICB0eXBlTWFwR2V0LFxuICB0eXBlTWFwR2V0QWxsLFxuICB0eXBlTWFwR2V0QWxsU25hcHNob3QsXG4gIHR5cGVMaXN0Rm9yRWFjaCxcbiAgWVhtbEVsZW1lbnRSZWZJRCxcbiAgU25hcHNob3QsIFlYbWxUZXh0LCBDb250ZW50VHlwZSwgQWJzdHJhY3RUeXBlLCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIERvYywgSXRlbSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fG51bWJlcnxudWxsfEFycmF5PGFueT58c3RyaW5nfFVpbnQ4QXJyYXl8QWJzdHJhY3RUeXBlPGFueT59IFZhbHVlVHlwZXNcbiAqL1xuXG4vKipcbiAqIEFuIFlYbWxFbGVtZW50IGltaXRhdGVzIHRoZSBiZWhhdmlvciBvZiBhXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudHxEb20gRWxlbWVudFxuICpcbiAqICogQW4gWVhtbEVsZW1lbnQgaGFzIGF0dHJpYnV0ZXMgKGtleSB2YWx1ZSBwYWlycylcbiAqICogQW4gWVhtbEVsZW1lbnQgaGFzIGNoaWxkRWxlbWVudHMgdGhhdCBtdXN0IGluaGVyaXQgZnJvbSBZWG1sRWxlbWVudFxuICpcbiAqIEB0ZW1wbGF0ZSB7eyBba2V5OiBzdHJpbmddOiBWYWx1ZVR5cGVzIH19IFtLVj17IFtrZXk6IHN0cmluZ106IHN0cmluZyB9XVxuICovXG5leHBvcnQgY2xhc3MgWVhtbEVsZW1lbnQgZXh0ZW5kcyBZWG1sRnJhZ21lbnQge1xuICBjb25zdHJ1Y3RvciAobm9kZU5hbWUgPSAnVU5ERUZJTkVEJykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWVcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7TWFwPHN0cmluZywgYW55PnxudWxsfVxuICAgICAqL1xuICAgIHRoaXMuX3ByZWxpbUF0dHJzID0gbmV3IE1hcCgpXG4gIH1cblxuICAvKipcbiAgICogQHR5cGUge1lYbWxFbGVtZW50fFlYbWxUZXh0fG51bGx9XG4gICAqL1xuICBnZXQgbmV4dFNpYmxpbmcgKCkge1xuICAgIGNvbnN0IG4gPSB0aGlzLl9pdGVtID8gdGhpcy5faXRlbS5uZXh0IDogbnVsbFxuICAgIHJldHVybiBuID8gLyoqIEB0eXBlIHtZWG1sRWxlbWVudHxZWG1sVGV4dH0gKi8gKC8qKiBAdHlwZSB7Q29udGVudFR5cGV9ICovIChuLmNvbnRlbnQpLnR5cGUpIDogbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtZWG1sRWxlbWVudHxZWG1sVGV4dHxudWxsfVxuICAgKi9cbiAgZ2V0IHByZXZTaWJsaW5nICgpIHtcbiAgICBjb25zdCBuID0gdGhpcy5faXRlbSA/IHRoaXMuX2l0ZW0ucHJldiA6IG51bGxcbiAgICByZXR1cm4gbiA/IC8qKiBAdHlwZSB7WVhtbEVsZW1lbnR8WVhtbFRleHR9ICovICgvKiogQHR5cGUge0NvbnRlbnRUeXBlfSAqLyAobi5jb250ZW50KS50eXBlKSA6IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlZ3JhdGUgdGhpcyB0eXBlIGludG8gdGhlIFlqcyBpbnN0YW5jZS5cbiAgICpcbiAgICogKiBTYXZlIHRoaXMgc3RydWN0IGluIHRoZSBvc1xuICAgKiAqIFRoaXMgdHlwZSBpcyBzZW50IHRvIG90aGVyIGNsaWVudFxuICAgKiAqIE9ic2VydmVyIGZ1bmN0aW9ucyBhcmUgZmlyZWRcbiAgICpcbiAgICogQHBhcmFtIHtEb2N9IHkgVGhlIFlqcyBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIF9pbnRlZ3JhdGUgKHksIGl0ZW0pIHtcbiAgICBzdXBlci5faW50ZWdyYXRlKHksIGl0ZW0pXG4gICAgOygvKiogQHR5cGUge01hcDxzdHJpbmcsIGFueT59ICovICh0aGlzLl9wcmVsaW1BdHRycykpLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgfSlcbiAgICB0aGlzLl9wcmVsaW1BdHRycyA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIEl0ZW0gd2l0aCB0aGUgc2FtZSBlZmZlY3QgYXMgdGhpcyBJdGVtICh3aXRob3V0IHBvc2l0aW9uIGVmZmVjdClcbiAgICpcbiAgICogQHJldHVybiB7WVhtbEVsZW1lbnR9XG4gICAqL1xuICBfY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBZWG1sRWxlbWVudCh0aGlzLm5vZGVOYW1lKVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgY29weSBvZiB0aGlzIGRhdGEgdHlwZSB0aGF0IGNhbiBiZSBpbmNsdWRlZCBzb21ld2hlcmUgZWxzZS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoZSBjb250ZW50IGlzIG9ubHkgcmVhZGFibGUgX2FmdGVyXyBpdCBoYXMgYmVlbiBpbmNsdWRlZCBzb21ld2hlcmUgaW4gdGhlIFlkb2MuXG4gICAqXG4gICAqIEByZXR1cm4ge1lYbWxFbGVtZW50PEtWPn1cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7WVhtbEVsZW1lbnQ8S1Y+fVxuICAgICAqL1xuICAgIGNvbnN0IGVsID0gbmV3IFlYbWxFbGVtZW50KHRoaXMubm9kZU5hbWUpXG4gICAgY29uc3QgYXR0cnMgPSB0aGlzLmdldEF0dHJpYnV0ZXMoKVxuICAgIG9iamVjdC5mb3JFYWNoKGF0dHJzLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgICB9XG4gICAgfSlcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZWwuaW5zZXJ0KDAsIHRoaXMudG9BcnJheSgpLm1hcChpdGVtID0+IGl0ZW0gaW5zdGFuY2VvZiBBYnN0cmFjdFR5cGUgPyBpdGVtLmNsb25lKCkgOiBpdGVtKSlcbiAgICByZXR1cm4gZWxcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBYTUwgc2VyaWFsaXphdGlvbiBvZiB0aGlzIFlYbWxFbGVtZW50LlxuICAgKiBUaGUgYXR0cmlidXRlcyBhcmUgb3JkZXJlZCBieSBhdHRyaWJ1dGUtbmFtZSwgc28geW91IGNhbiBlYXNpbHkgdXNlIHRoaXNcbiAgICogbWV0aG9kIHRvIGNvbXBhcmUgWVhtbEVsZW1lbnRzXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHR5cGUuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICBjb25zdCBhdHRycyA9IHRoaXMuZ2V0QXR0cmlidXRlcygpXG4gICAgY29uc3Qgc3RyaW5nQnVpbGRlciA9IFtdXG4gICAgY29uc3Qga2V5cyA9IFtdXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cnMpIHtcbiAgICAgIGtleXMucHVzaChrZXkpXG4gICAgfVxuICAgIGtleXMuc29ydCgpXG4gICAgY29uc3Qga2V5c0xlbiA9IGtleXMubGVuZ3RoXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzTGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGtleSA9IGtleXNbaV1cbiAgICAgIHN0cmluZ0J1aWxkZXIucHVzaChrZXkgKyAnPVwiJyArIGF0dHJzW2tleV0gKyAnXCInKVxuICAgIH1cbiAgICBjb25zdCBub2RlTmFtZSA9IHRoaXMubm9kZU5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKVxuICAgIGNvbnN0IGF0dHJzU3RyaW5nID0gc3RyaW5nQnVpbGRlci5sZW5ndGggPiAwID8gJyAnICsgc3RyaW5nQnVpbGRlci5qb2luKCcgJykgOiAnJ1xuICAgIHJldHVybiBgPCR7bm9kZU5hbWV9JHthdHRyc1N0cmluZ30+JHtzdXBlci50b1N0cmluZygpfTwvJHtub2RlTmFtZX0+YFxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gYXR0cmlidXRlIGZyb20gdGhpcyBZWG1sRWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGF0dHJpYnV0ZU5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRoYXQgaXMgdG8gYmUgcmVtb3ZlZC5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgcmVtb3ZlQXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgaWYgKHRoaXMuZG9jICE9PSBudWxsKSB7XG4gICAgICB0cmFuc2FjdCh0aGlzLmRvYywgdHJhbnNhY3Rpb24gPT4ge1xuICAgICAgICB0eXBlTWFwRGVsZXRlKHRyYW5zYWN0aW9uLCB0aGlzLCBhdHRyaWJ1dGVOYW1lKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLGFueT59ICovICh0aGlzLl9wcmVsaW1BdHRycykuZGVsZXRlKGF0dHJpYnV0ZU5hbWUpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgb3IgdXBkYXRlcyBhbiBhdHRyaWJ1dGUuXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSB7a2V5b2YgS1YgJiBzdHJpbmd9IEtFWVxuICAgKlxuICAgKiBAcGFyYW0ge0tFWX0gYXR0cmlidXRlTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdGhhdCBpcyB0byBiZSBzZXQuXG4gICAqIEBwYXJhbSB7S1ZbS0VZXX0gYXR0cmlidXRlVmFsdWUgVGhlIGF0dHJpYnV0ZSB2YWx1ZSB0aGF0IGlzIHRvIGJlIHNldC5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgc2V0QXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSkge1xuICAgIGlmICh0aGlzLmRvYyAhPT0gbnVsbCkge1xuICAgICAgdHJhbnNhY3QodGhpcy5kb2MsIHRyYW5zYWN0aW9uID0+IHtcbiAgICAgICAgdHlwZU1hcFNldCh0cmFuc2FjdGlvbiwgdGhpcywgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiogQHR5cGUge01hcDxzdHJpbmcsIGFueT59ICovICh0aGlzLl9wcmVsaW1BdHRycykuc2V0KGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGF0dHJpYnV0ZSB2YWx1ZSB0aGF0IGJlbG9uZ3MgdG8gdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgKlxuICAgKiBAdGVtcGxhdGUge2tleW9mIEtWICYgc3RyaW5nfSBLRVlcbiAgICpcbiAgICogQHBhcmFtIHtLRVl9IGF0dHJpYnV0ZU5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRoYXQgaWRlbnRpZmllcyB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcmllZCB2YWx1ZS5cbiAgICogQHJldHVybiB7S1ZbS0VZXXx1bmRlZmluZWR9IFRoZSBxdWVyaWVkIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZ2V0QXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAodHlwZU1hcEdldCh0aGlzLCBhdHRyaWJ1dGVOYW1lKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgYW4gYXR0cmlidXRlIGV4aXN0c1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXR0cmlidXRlTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdG8gY2hlY2sgZm9yIGV4aXN0ZW5jZS5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gd2hldGhlciB0aGUgYXR0cmlidXRlIGV4aXN0cy5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgaGFzQXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAodHlwZU1hcEhhcyh0aGlzLCBhdHRyaWJ1dGVOYW1lKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBpbiBhIEpTT04gT2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge1NuYXBzaG90fSBbc25hcHNob3RdXG4gICAqIEByZXR1cm4ge3sgW0tleSBpbiBFeHRyYWN0PGtleW9mIEtWLHN0cmluZz5dPzogS1ZbS2V5XX19IEEgSlNPTiBPYmplY3QgdGhhdCBkZXNjcmliZXMgdGhlIGF0dHJpYnV0ZXMuXG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGdldEF0dHJpYnV0ZXMgKHNuYXBzaG90KSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAoc25hcHNob3QgPyB0eXBlTWFwR2V0QWxsU25hcHNob3QodGhpcywgc25hcHNob3QpIDogdHlwZU1hcEdldEFsbCh0aGlzKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgRG9tIEVsZW1lbnQgdGhhdCBtaXJyb3JzIHRoaXMgWVhtbEVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IFtfZG9jdW1lbnQ9ZG9jdW1lbnRdIFRoZSBkb2N1bWVudCBvYmplY3QgKHlvdSBtdXN0IGRlZmluZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIHdoZW4gY2FsbGluZyB0aGlzIG1ldGhvZCBpblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlanMpXG4gICAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZywgYW55Pn0gW2hvb2tzPXt9XSBPcHRpb25hbCBwcm9wZXJ0eSB0byBjdXN0b21pemUgaG93IGhvb2tzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlIHByZXNlbnRlZCBpbiB0aGUgRE9NXG4gICAqIEBwYXJhbSB7YW55fSBbYmluZGluZ10gWW91IHNob3VsZCBub3Qgc2V0IHRoaXMgcHJvcGVydHkuIFRoaXMgaXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCBpZiBEb21CaW5kaW5nIHdhbnRzIHRvIGNyZWF0ZSBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc29jaWF0aW9uIHRvIHRoZSBjcmVhdGVkIERPTSB0eXBlLlxuICAgKiBAcmV0dXJuIHtOb2RlfSBUaGUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50fERvbSBFbGVtZW50fVxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b0RPTSAoX2RvY3VtZW50ID0gZG9jdW1lbnQsIGhvb2tzID0ge30sIGJpbmRpbmcpIHtcbiAgICBjb25zdCBkb20gPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLm5vZGVOYW1lKVxuICAgIGNvbnN0IGF0dHJzID0gdGhpcy5nZXRBdHRyaWJ1dGVzKClcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRycykge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1trZXldXG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBkb20uc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgICB9XG4gICAgfVxuICAgIHR5cGVMaXN0Rm9yRWFjaCh0aGlzLCB5eG1sID0+IHtcbiAgICAgIGRvbS5hcHBlbmRDaGlsZCh5eG1sLnRvRE9NKF9kb2N1bWVudCwgaG9va3MsIGJpbmRpbmcpKVxuICAgIH0pXG4gICAgaWYgKGJpbmRpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYmluZGluZy5fY3JlYXRlQXNzb2NpYXRpb24oZG9tLCB0aGlzKVxuICAgIH1cbiAgICByZXR1cm4gZG9tXG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtIHRoZSBwcm9wZXJ0aWVzIG9mIHRoaXMgdHlwZSB0byBiaW5hcnkgYW5kIHdyaXRlIGl0IHRvIGFuXG4gICAqIEJpbmFyeUVuY29kZXIuXG4gICAqXG4gICAqIFRoaXMgaXMgY2FsbGVkIHdoZW4gdGhpcyBJdGVtIGlzIHNlbnQgdG8gYSByZW1vdGUgcGVlci5cbiAgICpcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXIgVGhlIGVuY29kZXIgdG8gd3JpdGUgZGF0YSB0by5cbiAgICovXG4gIF93cml0ZSAoZW5jb2Rlcikge1xuICAgIGVuY29kZXIud3JpdGVUeXBlUmVmKFlYbWxFbGVtZW50UmVmSUQpXG4gICAgZW5jb2Rlci53cml0ZUtleSh0aGlzLm5vZGVOYW1lKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1lYbWxFbGVtZW50fVxuICpcbiAqIEBmdW5jdGlvblxuICovXG5leHBvcnQgY29uc3QgcmVhZFlYbWxFbGVtZW50ID0gZGVjb2RlciA9PiBuZXcgWVhtbEVsZW1lbnQoZGVjb2Rlci5yZWFkS2V5KCkpXG4iLCAiaW1wb3J0IHtcbiAgWUV2ZW50LFxuICBZWG1sVGV4dCwgWVhtbEVsZW1lbnQsIFlYbWxGcmFnbWVudCwgVHJhbnNhY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbi8qKlxuICogQGV4dGVuZHMgWUV2ZW50PFlYbWxFbGVtZW50fFlYbWxUZXh0fFlYbWxGcmFnbWVudD5cbiAqIEFuIEV2ZW50IHRoYXQgZGVzY3JpYmVzIGNoYW5nZXMgb24gYSBZWG1sIEVsZW1lbnQgb3IgWXhtbCBGcmFnbWVudFxuICovXG5leHBvcnQgY2xhc3MgWVhtbEV2ZW50IGV4dGVuZHMgWUV2ZW50IHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7WVhtbEVsZW1lbnR8WVhtbFRleHR8WVhtbEZyYWdtZW50fSB0YXJnZXQgVGhlIHRhcmdldCBvbiB3aGljaCB0aGUgZXZlbnQgaXMgY3JlYXRlZC5cbiAgICogQHBhcmFtIHtTZXQ8c3RyaW5nfG51bGw+fSBzdWJzIFRoZSBzZXQgb2YgY2hhbmdlZCBhdHRyaWJ1dGVzLiBgbnVsbGAgaXMgaW5jbHVkZWQgaWYgdGhlXG4gICAqICAgICAgICAgICAgICAgICAgIGNoaWxkIGxpc3QgY2hhbmdlZC5cbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb24gVGhlIHRyYW5zYWN0aW9uIGluc3RhbmNlIHdpdGggd2ljaCB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlIHdhcyBjcmVhdGVkLlxuICAgKi9cbiAgY29uc3RydWN0b3IgKHRhcmdldCwgc3VicywgdHJhbnNhY3Rpb24pIHtcbiAgICBzdXBlcih0YXJnZXQsIHRyYW5zYWN0aW9uKVxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIGNoaWxkcmVuIGNoYW5nZWQuXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLmNoaWxkTGlzdENoYW5nZWQgPSBmYWxzZVxuICAgIC8qKlxuICAgICAqIFNldCBvZiBhbGwgY2hhbmdlZCBhdHRyaWJ1dGVzLlxuICAgICAqIEB0eXBlIHtTZXQ8c3RyaW5nPn1cbiAgICAgKi9cbiAgICB0aGlzLmF0dHJpYnV0ZXNDaGFuZ2VkID0gbmV3IFNldCgpXG4gICAgc3Vicy5mb3JFYWNoKChzdWIpID0+IHtcbiAgICAgIGlmIChzdWIgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5jaGlsZExpc3RDaGFuZ2VkID0gdHJ1ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzQ2hhbmdlZC5hZGQoc3ViKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbiIsICJpbXBvcnQge1xuICBZTWFwLFxuICBZWG1sSG9va1JlZklELFxuICBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbi8qKlxuICogWW91IGNhbiBtYW5hZ2UgYmluZGluZyB0byBhIGN1c3RvbSB0eXBlIHdpdGggWVhtbEhvb2suXG4gKlxuICogQGV4dGVuZHMge1lNYXA8YW55Pn1cbiAqL1xuZXhwb3J0IGNsYXNzIFlYbWxIb29rIGV4dGVuZHMgWU1hcCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaG9va05hbWUgbm9kZU5hbWUgb2YgdGhlIERvbSBOb2RlLlxuICAgKi9cbiAgY29uc3RydWN0b3IgKGhvb2tOYW1lKSB7XG4gICAgc3VwZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy5ob29rTmFtZSA9IGhvb2tOYW1lXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBJdGVtIHdpdGggdGhlIHNhbWUgZWZmZWN0IGFzIHRoaXMgSXRlbSAod2l0aG91dCBwb3NpdGlvbiBlZmZlY3QpXG4gICAqL1xuICBfY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBZWG1sSG9vayh0aGlzLmhvb2tOYW1lKVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgY29weSBvZiB0aGlzIGRhdGEgdHlwZSB0aGF0IGNhbiBiZSBpbmNsdWRlZCBzb21ld2hlcmUgZWxzZS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoZSBjb250ZW50IGlzIG9ubHkgcmVhZGFibGUgX2FmdGVyXyBpdCBoYXMgYmVlbiBpbmNsdWRlZCBzb21ld2hlcmUgaW4gdGhlIFlkb2MuXG4gICAqXG4gICAqIEByZXR1cm4ge1lYbWxIb29rfVxuICAgKi9cbiAgY2xvbmUgKCkge1xuICAgIGNvbnN0IGVsID0gbmV3IFlYbWxIb29rKHRoaXMuaG9va05hbWUpXG4gICAgdGhpcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBlbC5zZXQoa2V5LCB2YWx1ZSlcbiAgICB9KVxuICAgIHJldHVybiBlbFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBEb20gRWxlbWVudCB0aGF0IG1pcnJvcnMgdGhpcyBZWG1sRWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtEb2N1bWVudH0gW19kb2N1bWVudD1kb2N1bWVudF0gVGhlIGRvY3VtZW50IG9iamVjdCAoeW91IG11c3QgZGVmaW5lXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMgd2hlbiBjYWxsaW5nIHRoaXMgbWV0aG9kIGluXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVqcylcbiAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgYW55Pn0gW2hvb2tzXSBPcHRpb25hbCBwcm9wZXJ0eSB0byBjdXN0b21pemUgaG93IGhvb2tzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlIHByZXNlbnRlZCBpbiB0aGUgRE9NXG4gICAqIEBwYXJhbSB7YW55fSBbYmluZGluZ10gWW91IHNob3VsZCBub3Qgc2V0IHRoaXMgcHJvcGVydHkuIFRoaXMgaXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCBpZiBEb21CaW5kaW5nIHdhbnRzIHRvIGNyZWF0ZSBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc29jaWF0aW9uIHRvIHRoZSBjcmVhdGVkIERPTSB0eXBlXG4gICAqIEByZXR1cm4ge0VsZW1lbnR9IFRoZSB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnR8RG9tIEVsZW1lbnR9XG4gICAqXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRvRE9NIChfZG9jdW1lbnQgPSBkb2N1bWVudCwgaG9va3MgPSB7fSwgYmluZGluZykge1xuICAgIGNvbnN0IGhvb2sgPSBob29rc1t0aGlzLmhvb2tOYW1lXVxuICAgIGxldCBkb21cbiAgICBpZiAoaG9vayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkb20gPSBob29rLmNyZWF0ZURvbSh0aGlzKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMuaG9va05hbWUpXG4gICAgfVxuICAgIGRvbS5zZXRBdHRyaWJ1dGUoJ2RhdGEteWpzLWhvb2snLCB0aGlzLmhvb2tOYW1lKVxuICAgIGlmIChiaW5kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGJpbmRpbmcuX2NyZWF0ZUFzc29jaWF0aW9uKGRvbSwgdGhpcylcbiAgICB9XG4gICAgcmV0dXJuIGRvbVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybSB0aGUgcHJvcGVydGllcyBvZiB0aGlzIHR5cGUgdG8gYmluYXJ5IGFuZCB3cml0ZSBpdCB0byBhblxuICAgKiBCaW5hcnlFbmNvZGVyLlxuICAgKlxuICAgKiBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoaXMgSXRlbSBpcyBzZW50IHRvIGEgcmVtb3RlIHBlZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyIFRoZSBlbmNvZGVyIHRvIHdyaXRlIGRhdGEgdG8uXG4gICAqL1xuICBfd3JpdGUgKGVuY29kZXIpIHtcbiAgICBlbmNvZGVyLndyaXRlVHlwZVJlZihZWG1sSG9va1JlZklEKVxuICAgIGVuY29kZXIud3JpdGVLZXkodGhpcy5ob29rTmFtZSlcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtZWG1sSG9va31cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkWVhtbEhvb2sgPSBkZWNvZGVyID0+XG4gIG5ldyBZWG1sSG9vayhkZWNvZGVyLnJlYWRLZXkoKSlcbiIsICJpbXBvcnQge1xuICBZVGV4dCxcbiAgWVhtbFRleHRSZWZJRCxcbiAgQ29udGVudFR5cGUsIFlYbWxFbGVtZW50LCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG4vKipcbiAqIFJlcHJlc2VudHMgdGV4dCBpbiBhIERvbSBFbGVtZW50LiBJbiB0aGUgZnV0dXJlIHRoaXMgdHlwZSB3aWxsIGFsc28gaGFuZGxlXG4gKiBzaW1wbGUgZm9ybWF0dGluZyBpbmZvcm1hdGlvbiBsaWtlIGJvbGQgYW5kIGl0YWxpYy5cbiAqL1xuZXhwb3J0IGNsYXNzIFlYbWxUZXh0IGV4dGVuZHMgWVRleHQge1xuICAvKipcbiAgICogQHR5cGUge1lYbWxFbGVtZW50fFlYbWxUZXh0fG51bGx9XG4gICAqL1xuICBnZXQgbmV4dFNpYmxpbmcgKCkge1xuICAgIGNvbnN0IG4gPSB0aGlzLl9pdGVtID8gdGhpcy5faXRlbS5uZXh0IDogbnVsbFxuICAgIHJldHVybiBuID8gLyoqIEB0eXBlIHtZWG1sRWxlbWVudHxZWG1sVGV4dH0gKi8gKC8qKiBAdHlwZSB7Q29udGVudFR5cGV9ICovIChuLmNvbnRlbnQpLnR5cGUpIDogbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtZWG1sRWxlbWVudHxZWG1sVGV4dHxudWxsfVxuICAgKi9cbiAgZ2V0IHByZXZTaWJsaW5nICgpIHtcbiAgICBjb25zdCBuID0gdGhpcy5faXRlbSA/IHRoaXMuX2l0ZW0ucHJldiA6IG51bGxcbiAgICByZXR1cm4gbiA/IC8qKiBAdHlwZSB7WVhtbEVsZW1lbnR8WVhtbFRleHR9ICovICgvKiogQHR5cGUge0NvbnRlbnRUeXBlfSAqLyAobi5jb250ZW50KS50eXBlKSA6IG51bGxcbiAgfVxuXG4gIF9jb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IFlYbWxUZXh0KClcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIGNvcHkgb2YgdGhpcyBkYXRhIHR5cGUgdGhhdCBjYW4gYmUgaW5jbHVkZWQgc29tZXdoZXJlIGVsc2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgY29udGVudCBpcyBvbmx5IHJlYWRhYmxlIF9hZnRlcl8gaXQgaGFzIGJlZW4gaW5jbHVkZWQgc29tZXdoZXJlIGluIHRoZSBZZG9jLlxuICAgKlxuICAgKiBAcmV0dXJuIHtZWG1sVGV4dH1cbiAgICovXG4gIGNsb25lICgpIHtcbiAgICBjb25zdCB0ZXh0ID0gbmV3IFlYbWxUZXh0KClcbiAgICB0ZXh0LmFwcGx5RGVsdGEodGhpcy50b0RlbHRhKCkpXG4gICAgcmV0dXJuIHRleHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgRG9tIEVsZW1lbnQgdGhhdCBtaXJyb3JzIHRoaXMgWVhtbFRleHQuXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IFtfZG9jdW1lbnQ9ZG9jdW1lbnRdIFRoZSBkb2N1bWVudCBvYmplY3QgKHlvdSBtdXN0IGRlZmluZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIHdoZW4gY2FsbGluZyB0aGlzIG1ldGhvZCBpblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlanMpXG4gICAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZywgYW55Pn0gW2hvb2tzXSBPcHRpb25hbCBwcm9wZXJ0eSB0byBjdXN0b21pemUgaG93IGhvb2tzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlIHByZXNlbnRlZCBpbiB0aGUgRE9NXG4gICAqIEBwYXJhbSB7YW55fSBbYmluZGluZ10gWW91IHNob3VsZCBub3Qgc2V0IHRoaXMgcHJvcGVydHkuIFRoaXMgaXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCBpZiBEb21CaW5kaW5nIHdhbnRzIHRvIGNyZWF0ZSBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc29jaWF0aW9uIHRvIHRoZSBjcmVhdGVkIERPTSB0eXBlLlxuICAgKiBAcmV0dXJuIHtUZXh0fSBUaGUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50fERvbSBFbGVtZW50fVxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICB0b0RPTSAoX2RvY3VtZW50ID0gZG9jdW1lbnQsIGhvb2tzLCBiaW5kaW5nKSB7XG4gICAgY29uc3QgZG9tID0gX2RvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMudG9TdHJpbmcoKSlcbiAgICBpZiAoYmluZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBiaW5kaW5nLl9jcmVhdGVBc3NvY2lhdGlvbihkb20sIHRoaXMpXG4gICAgfVxuICAgIHJldHVybiBkb21cbiAgfVxuXG4gIHRvU3RyaW5nICgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIHRoaXMudG9EZWx0YSgpLm1hcChkZWx0YSA9PiB7XG4gICAgICBjb25zdCBuZXN0ZWROb2RlcyA9IFtdXG4gICAgICBmb3IgKGNvbnN0IG5vZGVOYW1lIGluIGRlbHRhLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgY29uc3QgYXR0cnMgPSBbXVxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBkZWx0YS5hdHRyaWJ1dGVzW25vZGVOYW1lXSkge1xuICAgICAgICAgIGF0dHJzLnB1c2goeyBrZXksIHZhbHVlOiBkZWx0YS5hdHRyaWJ1dGVzW25vZGVOYW1lXVtrZXldIH0pXG4gICAgICAgIH1cbiAgICAgICAgLy8gc29ydCBhdHRyaWJ1dGVzIHRvIGdldCBhIHVuaXF1ZSBvcmRlclxuICAgICAgICBhdHRycy5zb3J0KChhLCBiKSA9PiBhLmtleSA8IGIua2V5ID8gLTEgOiAxKVxuICAgICAgICBuZXN0ZWROb2Rlcy5wdXNoKHsgbm9kZU5hbWUsIGF0dHJzIH0pXG4gICAgICB9XG4gICAgICAvLyBzb3J0IG5vZGUgb3JkZXIgdG8gZ2V0IGEgdW5pcXVlIG9yZGVyXG4gICAgICBuZXN0ZWROb2Rlcy5zb3J0KChhLCBiKSA9PiBhLm5vZGVOYW1lIDwgYi5ub2RlTmFtZSA/IC0xIDogMSlcbiAgICAgIC8vIG5vdyBjb252ZXJ0IHRvIGRvbSBzdHJpbmdcbiAgICAgIGxldCBzdHIgPSAnJ1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXN0ZWROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBub2RlID0gbmVzdGVkTm9kZXNbaV1cbiAgICAgICAgc3RyICs9IGA8JHtub2RlLm5vZGVOYW1lfWBcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLmF0dHJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgYXR0ciA9IG5vZGUuYXR0cnNbal1cbiAgICAgICAgICBzdHIgKz0gYCAke2F0dHIua2V5fT1cIiR7YXR0ci52YWx1ZX1cImBcbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gJz4nXG4gICAgICB9XG4gICAgICBzdHIgKz0gZGVsdGEuaW5zZXJ0XG4gICAgICBmb3IgKGxldCBpID0gbmVzdGVkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgc3RyICs9IGA8LyR7bmVzdGVkTm9kZXNbaV0ubm9kZU5hbWV9PmBcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdHJcbiAgICB9KS5qb2luKCcnKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvSlNPTiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqL1xuICBfd3JpdGUgKGVuY29kZXIpIHtcbiAgICBlbmNvZGVyLndyaXRlVHlwZVJlZihZWG1sVGV4dFJlZklEKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1lYbWxUZXh0fVxuICpcbiAqIEBwcml2YXRlXG4gKiBAZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRZWG1sVGV4dCA9IGRlY29kZXIgPT4gbmV3IFlYbWxUZXh0KClcbiIsICJpbXBvcnQge1xuICBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgSUQsIFRyYW5zYWN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RTdHJ1Y3Qge1xuICAvKipcbiAgICogQHBhcmFtIHtJRH0gaWRcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGlkLCBsZW5ndGgpIHtcbiAgICB0aGlzLmlkID0gaWRcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aFxuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgZ2V0IGRlbGV0ZWQgKCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIE1lcmdlIHRoaXMgc3RydWN0IHdpdGggdGhlIGl0ZW0gdG8gdGhlIHJpZ2h0LlxuICAgKiBUaGlzIG1ldGhvZCBpcyBhbHJlYWR5IGFzc3VtaW5nIHRoYXQgYHRoaXMuaWQuY2xvY2sgKyB0aGlzLmxlbmd0aCA9PT0gdGhpcy5pZC5jbG9ja2AuXG4gICAqIEFsc28gdGhpcyBtZXRob2QgZG9lcyAqbm90KiByZW1vdmUgcmlnaHQgZnJvbSBTdHJ1Y3RTdG9yZSFcbiAgICogQHBhcmFtIHtBYnN0cmFjdFN0cnVjdH0gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gd2V0aGVyIHRoaXMgbWVyZ2VkIHdpdGggcmlnaHRcbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlciBUaGUgZW5jb2RlciB0byB3cml0ZSBkYXRhIHRvLlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBlbmNvZGluZ1JlZlxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCwgZW5jb2RpbmdSZWYpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBvZmZzZXQpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxufVxuIiwgImltcG9ydCB7XG4gIEFic3RyYWN0U3RydWN0LFxuICBhZGRTdHJ1Y3QsXG4gIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgU3RydWN0U3RvcmUsIFRyYW5zYWN0aW9uLCBJRCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuZXhwb3J0IGNvbnN0IHN0cnVjdEdDUmVmTnVtYmVyID0gMFxuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBHQyBleHRlbmRzIEFic3RyYWN0U3RydWN0IHtcbiAgZ2V0IGRlbGV0ZWQgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBkZWxldGUgKCkge31cblxuICAvKipcbiAgICogQHBhcmFtIHtHQ30gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3RvciAhPT0gcmlnaHQuY29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB0aGlzLmxlbmd0aCArPSByaWdodC5sZW5ndGhcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIG9mZnNldCkge1xuICAgIGlmIChvZmZzZXQgPiAwKSB7XG4gICAgICB0aGlzLmlkLmNsb2NrICs9IG9mZnNldFxuICAgICAgdGhpcy5sZW5ndGggLT0gb2Zmc2V0XG4gICAgfVxuICAgIGFkZFN0cnVjdCh0cmFuc2FjdGlvbi5kb2Muc3RvcmUsIHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCkge1xuICAgIGVuY29kZXIud3JpdGVJbmZvKHN0cnVjdEdDUmVmTnVtYmVyKVxuICAgIGVuY29kZXIud3JpdGVMZW4odGhpcy5sZW5ndGggLSBvZmZzZXQpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICogQHJldHVybiB7bnVsbCB8IG51bWJlcn1cbiAgICovXG4gIGdldE1pc3NpbmcgKHRyYW5zYWN0aW9uLCBzdG9yZSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbn1cbiIsICJpbXBvcnQge1xuICBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIFN0cnVjdFN0b3JlLCBJdGVtLCBUcmFuc2FjdGlvbiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcblxuZXhwb3J0IGNsYXNzIENvbnRlbnRCaW5hcnkge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSBjb250ZW50XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoY29udGVudCkge1xuICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGdldENvbnRlbnQgKCkge1xuICAgIHJldHVybiBbdGhpcy5jb250ZW50XVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0NvdW50YWJsZSAoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtDb250ZW50QmluYXJ5fVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZW50QmluYXJ5KHRoaXMuY29udGVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnRCaW5hcnl9XG4gICAqL1xuICBzcGxpY2UgKG9mZnNldCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29udGVudEJpbmFyeX0gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIGl0ZW0pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKi9cbiAgZGVsZXRlICh0cmFuc2FjdGlvbikge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqL1xuICBnYyAoc3RvcmUpIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgZW5jb2Rlci53cml0ZUJ1Zih0aGlzLmNvbnRlbnQpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICByZXR1cm4gM1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjIgfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtDb250ZW50QmluYXJ5fVxuICovXG5leHBvcnQgY29uc3QgcmVhZENvbnRlbnRCaW5hcnkgPSBkZWNvZGVyID0+IG5ldyBDb250ZW50QmluYXJ5KGRlY29kZXIucmVhZEJ1ZigpKVxuIiwgImltcG9ydCB7XG4gIGFkZFRvRGVsZXRlU2V0LFxuICBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIFN0cnVjdFN0b3JlLCBJdGVtLCBUcmFuc2FjdGlvbiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuZXhwb3J0IGNsYXNzIENvbnRlbnREZWxldGVkIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChsZW4pIHtcbiAgICB0aGlzLmxlbiA9IGxlblxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldExlbmd0aCAoKSB7XG4gICAgcmV0dXJuIHRoaXMubGVuXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGdldENvbnRlbnQgKCkge1xuICAgIHJldHVybiBbXVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0NvdW50YWJsZSAoKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Q29udGVudERlbGV0ZWR9XG4gICAqL1xuICBjb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IENvbnRlbnREZWxldGVkKHRoaXMubGVuKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICogQHJldHVybiB7Q29udGVudERlbGV0ZWR9XG4gICAqL1xuICBzcGxpY2UgKG9mZnNldCkge1xuICAgIGNvbnN0IHJpZ2h0ID0gbmV3IENvbnRlbnREZWxldGVkKHRoaXMubGVuIC0gb2Zmc2V0KVxuICAgIHRoaXMubGVuID0gb2Zmc2V0XG4gICAgcmV0dXJuIHJpZ2h0XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb250ZW50RGVsZXRlZH0gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICB0aGlzLmxlbiArPSByaWdodC5sZW5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICAgKi9cbiAgaW50ZWdyYXRlICh0cmFuc2FjdGlvbiwgaXRlbSkge1xuICAgIGFkZFRvRGVsZXRlU2V0KHRyYW5zYWN0aW9uLmRlbGV0ZVNldCwgaXRlbS5pZC5jbGllbnQsIGl0ZW0uaWQuY2xvY2ssIHRoaXMubGVuKVxuICAgIGl0ZW0ubWFya0RlbGV0ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqL1xuICBkZWxldGUgKHRyYW5zYWN0aW9uKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICovXG4gIGdjIChzdG9yZSkge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBlbmNvZGVyLndyaXRlTGVuKHRoaXMubGVuIC0gb2Zmc2V0KVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjIgfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtDb250ZW50RGVsZXRlZH1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDb250ZW50RGVsZXRlZCA9IGRlY29kZXIgPT4gbmV3IENvbnRlbnREZWxldGVkKGRlY29kZXIucmVhZExlbigpKVxuIiwgImltcG9ydCB7XG4gIERvYywgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBTdHJ1Y3RTdG9yZSwgVHJhbnNhY3Rpb24sIEl0ZW0gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGd1aWRcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZywgYW55Pn0gb3B0c1xuICovXG5jb25zdCBjcmVhdGVEb2NGcm9tT3B0cyA9IChndWlkLCBvcHRzKSA9PiBuZXcgRG9jKHsgZ3VpZCwgLi4ub3B0cywgc2hvdWxkTG9hZDogb3B0cy5zaG91bGRMb2FkIHx8IG9wdHMuYXV0b0xvYWQgfHwgZmFsc2UgfSlcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgQ29udGVudERvYyB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0RvY30gZG9jXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZG9jKSB7XG4gICAgaWYgKGRvYy5faXRlbSkge1xuICAgICAgY29uc29sZS5lcnJvcignVGhpcyBkb2N1bWVudCB3YXMgYWxyZWFkeSBpbnRlZ3JhdGVkIGFzIGEgc3ViLWRvY3VtZW50LiBZb3Ugc2hvdWxkIGNyZWF0ZSBhIHNlY29uZCBpbnN0YW5jZSBpbnN0ZWFkIHdpdGggdGhlIHNhbWUgZ3VpZC4nKVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RG9jfVxuICAgICAqL1xuICAgIHRoaXMuZG9jID0gZG9jXG4gICAgLyoqXG4gICAgICogQHR5cGUge2FueX1cbiAgICAgKi9cbiAgICBjb25zdCBvcHRzID0ge31cbiAgICB0aGlzLm9wdHMgPSBvcHRzXG4gICAgaWYgKCFkb2MuZ2MpIHtcbiAgICAgIG9wdHMuZ2MgPSBmYWxzZVxuICAgIH1cbiAgICBpZiAoZG9jLmF1dG9Mb2FkKSB7XG4gICAgICBvcHRzLmF1dG9Mb2FkID0gdHJ1ZVxuICAgIH1cbiAgICBpZiAoZG9jLm1ldGEgIT09IG51bGwpIHtcbiAgICAgIG9wdHMubWV0YSA9IGRvYy5tZXRhXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldExlbmd0aCAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgZ2V0Q29udGVudCAoKSB7XG4gICAgcmV0dXJuIFt0aGlzLmRvY11cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Q29udGVudERvY31cbiAgICovXG4gIGNvcHkgKCkge1xuICAgIHJldHVybiBuZXcgQ29udGVudERvYyhjcmVhdGVEb2NGcm9tT3B0cyh0aGlzLmRvYy5ndWlkLCB0aGlzLm9wdHMpKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICogQHJldHVybiB7Q29udGVudERvY31cbiAgICovXG4gIHNwbGljZSAob2Zmc2V0KSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb250ZW50RG9jfSByaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChyaWdodCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICAgKi9cbiAgaW50ZWdyYXRlICh0cmFuc2FjdGlvbiwgaXRlbSkge1xuICAgIC8vIHRoaXMgbmVlZHMgdG8gYmUgcmVmbGVjdGVkIGluIGRvYy5kZXN0cm95IGFzIHdlbGxcbiAgICB0aGlzLmRvYy5faXRlbSA9IGl0ZW1cbiAgICB0cmFuc2FjdGlvbi5zdWJkb2NzQWRkZWQuYWRkKHRoaXMuZG9jKVxuICAgIGlmICh0aGlzLmRvYy5zaG91bGRMb2FkKSB7XG4gICAgICB0cmFuc2FjdGlvbi5zdWJkb2NzTG9hZGVkLmFkZCh0aGlzLmRvYylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHtcbiAgICBpZiAodHJhbnNhY3Rpb24uc3ViZG9jc0FkZGVkLmhhcyh0aGlzLmRvYykpIHtcbiAgICAgIHRyYW5zYWN0aW9uLnN1YmRvY3NBZGRlZC5kZWxldGUodGhpcy5kb2MpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYW5zYWN0aW9uLnN1YmRvY3NSZW1vdmVkLmFkZCh0aGlzLmRvYylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICovXG4gIGdjIChzdG9yZSkgeyB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBlbmNvZGVyLndyaXRlU3RyaW5nKHRoaXMuZG9jLmd1aWQpXG4gICAgZW5jb2Rlci53cml0ZUFueSh0aGlzLm9wdHMpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICByZXR1cm4gOVxuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudERvY31cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDb250ZW50RG9jID0gZGVjb2RlciA9PiBuZXcgQ29udGVudERvYyhjcmVhdGVEb2NGcm9tT3B0cyhkZWNvZGVyLnJlYWRTdHJpbmcoKSwgZGVjb2Rlci5yZWFkQW55KCkpKVxuIiwgImltcG9ydCB7XG4gIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgU3RydWN0U3RvcmUsIEl0ZW0sIFRyYW5zYWN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBDb250ZW50RW1iZWQge1xuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IGVtYmVkXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZW1iZWQpIHtcbiAgICB0aGlzLmVtYmVkID0gZW1iZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7QXJyYXk8YW55Pn1cbiAgICovXG4gIGdldENvbnRlbnQgKCkge1xuICAgIHJldHVybiBbdGhpcy5lbWJlZF1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Q29udGVudEVtYmVkfVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZW50RW1iZWQodGhpcy5lbWJlZClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnRFbWJlZH1cbiAgICovXG4gIHNwbGljZSAob2Zmc2V0KSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb250ZW50RW1iZWR9IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBpdGVtKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICAgKi9cbiAgZ2MgKHN0b3JlKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCkge1xuICAgIGVuY29kZXIud3JpdGVKU09OKHRoaXMuZW1iZWQpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICByZXR1cm4gNVxuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudEVtYmVkfVxuICovXG5leHBvcnQgY29uc3QgcmVhZENvbnRlbnRFbWJlZCA9IGRlY29kZXIgPT4gbmV3IENvbnRlbnRFbWJlZChkZWNvZGVyLnJlYWRKU09OKCkpXG4iLCAiaW1wb3J0IHtcbiAgWVRleHQsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgSXRlbSwgU3RydWN0U3RvcmUsIFRyYW5zYWN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBDb250ZW50Rm9ybWF0IHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXMua2V5ID0ga2V5XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0TGVuZ3RoICgpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gICAqL1xuICBnZXRDb250ZW50ICgpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0NvbnRlbnRGb3JtYXR9XG4gICAqL1xuICBjb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IENvbnRlbnRGb3JtYXQodGhpcy5rZXksIHRoaXMudmFsdWUpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IF9vZmZzZXRcbiAgICogQHJldHVybiB7Q29udGVudEZvcm1hdH1cbiAgICovXG4gIHNwbGljZSAoX29mZnNldCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29udGVudEZvcm1hdH0gX3JpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKF9yaWdodCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IF90cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIGludGVncmF0ZSAoX3RyYW5zYWN0aW9uLCBpdGVtKSB7XG4gICAgLy8gQHRvZG8gc2VhcmNobWFya2VyIGFyZSBjdXJyZW50bHkgdW5zdXBwb3J0ZWQgZm9yIHJpY2ggdGV4dCBkb2N1bWVudHNcbiAgICBjb25zdCBwID0gLyoqIEB0eXBlIHtZVGV4dH0gKi8gKGl0ZW0ucGFyZW50KVxuICAgIHAuX3NlYXJjaE1hcmtlciA9IG51bGxcbiAgICBwLl9oYXNGb3JtYXR0aW5nID0gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqL1xuICBkZWxldGUgKHRyYW5zYWN0aW9uKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICovXG4gIGdjIChzdG9yZSkge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBlbmNvZGVyLndyaXRlS2V5KHRoaXMua2V5KVxuICAgIGVuY29kZXIud3JpdGVKU09OKHRoaXMudmFsdWUpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICByZXR1cm4gNlxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge0NvbnRlbnRGb3JtYXR9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkQ29udGVudEZvcm1hdCA9IGRlY29kZXIgPT4gbmV3IENvbnRlbnRGb3JtYXQoZGVjb2Rlci5yZWFkS2V5KCksIGRlY29kZXIucmVhZEpTT04oKSlcbiIsICJpbXBvcnQge1xuICBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIFRyYW5zYWN0aW9uLCBJdGVtLCBTdHJ1Y3RTdG9yZSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG59IGZyb20gJy4uL2ludGVybmFscy5qcydcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgQ29udGVudEpTT04ge1xuICAvKipcbiAgICogQHBhcmFtIHtBcnJheTxhbnk+fSBhcnJcbiAgICovXG4gIGNvbnN0cnVjdG9yIChhcnIpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8YW55Pn1cbiAgICAgKi9cbiAgICB0aGlzLmFyciA9IGFyclxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldExlbmd0aCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJyLmxlbmd0aFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gICAqL1xuICBnZXRDb250ZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcnJcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Q29udGVudEpTT059XG4gICAqL1xuICBjb3B5ICgpIHtcbiAgICByZXR1cm4gbmV3IENvbnRlbnRKU09OKHRoaXMuYXJyKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICogQHJldHVybiB7Q29udGVudEpTT059XG4gICAqL1xuICBzcGxpY2UgKG9mZnNldCkge1xuICAgIGNvbnN0IHJpZ2h0ID0gbmV3IENvbnRlbnRKU09OKHRoaXMuYXJyLnNsaWNlKG9mZnNldCkpXG4gICAgdGhpcy5hcnIgPSB0aGlzLmFyci5zbGljZSgwLCBvZmZzZXQpXG4gICAgcmV0dXJuIHJpZ2h0XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb250ZW50SlNPTn0gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICB0aGlzLmFyciA9IHRoaXMuYXJyLmNvbmNhdChyaWdodC5hcnIpXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIGl0ZW0pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKi9cbiAgZGVsZXRlICh0cmFuc2FjdGlvbikge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqL1xuICBnYyAoc3RvcmUpIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgY29uc3QgbGVuID0gdGhpcy5hcnIubGVuZ3RoXG4gICAgZW5jb2Rlci53cml0ZUxlbihsZW4gLSBvZmZzZXQpXG4gICAgZm9yIChsZXQgaSA9IG9mZnNldDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBjID0gdGhpcy5hcnJbaV1cbiAgICAgIGVuY29kZXIud3JpdGVTdHJpbmcoYyA9PT0gdW5kZWZpbmVkID8gJ3VuZGVmaW5lZCcgOiBKU09OLnN0cmluZ2lmeShjKSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICByZXR1cm4gMlxuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudEpTT059XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkQ29udGVudEpTT04gPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgbGVuID0gZGVjb2Rlci5yZWFkTGVuKClcbiAgY29uc3QgY3MgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgYyA9IGRlY29kZXIucmVhZFN0cmluZygpXG4gICAgaWYgKGMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjcy5wdXNoKHVuZGVmaW5lZClcbiAgICB9IGVsc2Uge1xuICAgICAgY3MucHVzaChKU09OLnBhcnNlKGMpKVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmV3IENvbnRlbnRKU09OKGNzKVxufVxuIiwgImltcG9ydCB7XG4gIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVHJhbnNhY3Rpb24sIEl0ZW0sIFN0cnVjdFN0b3JlIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuXG5pbXBvcnQgKiBhcyBlbnYgZnJvbSAnbGliMC9lbnZpcm9ubWVudCdcbmltcG9ydCAqIGFzIG9iamVjdCBmcm9tICdsaWIwL29iamVjdCdcblxuY29uc3QgaXNEZXZNb2RlID0gZW52LmdldFZhcmlhYmxlKCdub2RlX2VudicpID09PSAnZGV2ZWxvcG1lbnQnXG5cbmV4cG9ydCBjbGFzcyBDb250ZW50QW55IHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gYXJyXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoYXJyKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PGFueT59XG4gICAgICovXG4gICAgdGhpcy5hcnIgPSBhcnJcbiAgICBpc0Rldk1vZGUgJiYgb2JqZWN0LmRlZXBGcmVlemUoYXJyKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldExlbmd0aCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJyLmxlbmd0aFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0FycmF5PGFueT59XG4gICAqL1xuICBnZXRDb250ZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcnJcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNDb3VudGFibGUgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Q29udGVudEFueX1cbiAgICovXG4gIGNvcHkgKCkge1xuICAgIHJldHVybiBuZXcgQ29udGVudEFueSh0aGlzLmFycilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnRBbnl9XG4gICAqL1xuICBzcGxpY2UgKG9mZnNldCkge1xuICAgIGNvbnN0IHJpZ2h0ID0gbmV3IENvbnRlbnRBbnkodGhpcy5hcnIuc2xpY2Uob2Zmc2V0KSlcbiAgICB0aGlzLmFyciA9IHRoaXMuYXJyLnNsaWNlKDAsIG9mZnNldClcbiAgICByZXR1cm4gcmlnaHRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0NvbnRlbnRBbnl9IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgdGhpcy5hcnIgPSB0aGlzLmFyci5jb25jYXQocmlnaHQuYXJyKVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtJdGVtfSBpdGVtXG4gICAqL1xuICBpbnRlZ3JhdGUgKHRyYW5zYWN0aW9uLCBpdGVtKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAodHJhbnNhY3Rpb24pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICAgKi9cbiAgZ2MgKHN0b3JlKSB7fVxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCkge1xuICAgIGNvbnN0IGxlbiA9IHRoaXMuYXJyLmxlbmd0aFxuICAgIGVuY29kZXIud3JpdGVMZW4obGVuIC0gb2Zmc2V0KVxuICAgIGZvciAobGV0IGkgPSBvZmZzZXQ7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3QgYyA9IHRoaXMuYXJyW2ldXG4gICAgICBlbmNvZGVyLndyaXRlQW55KGMpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldFJlZiAoKSB7XG4gICAgcmV0dXJuIDhcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtDb250ZW50QW55fVxuICovXG5leHBvcnQgY29uc3QgcmVhZENvbnRlbnRBbnkgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgbGVuID0gZGVjb2Rlci5yZWFkTGVuKClcbiAgY29uc3QgY3MgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY3MucHVzaChkZWNvZGVyLnJlYWRBbnkoKSlcbiAgfVxuICByZXR1cm4gbmV3IENvbnRlbnRBbnkoY3MpXG59XG4iLCAiaW1wb3J0IHtcbiAgVXBkYXRlRGVjb2RlclYxLCBVcGRhdGVEZWNvZGVyVjIsIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBUcmFuc2FjdGlvbiwgSXRlbSwgU3RydWN0U3RvcmUgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRlbnRTdHJpbmcge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgKi9cbiAgY29uc3RydWN0b3IgKHN0cikge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy5zdHIgPSBzdHJcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRMZW5ndGggKCkge1xuICAgIHJldHVybiB0aGlzLnN0ci5sZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgZ2V0Q29udGVudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RyLnNwbGl0KCcnKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0NvdW50YWJsZSAoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtDb250ZW50U3RyaW5nfVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZW50U3RyaW5nKHRoaXMuc3RyKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICogQHJldHVybiB7Q29udGVudFN0cmluZ31cbiAgICovXG4gIHNwbGljZSAob2Zmc2V0KSB7XG4gICAgY29uc3QgcmlnaHQgPSBuZXcgQ29udGVudFN0cmluZyh0aGlzLnN0ci5zbGljZShvZmZzZXQpKVxuICAgIHRoaXMuc3RyID0gdGhpcy5zdHIuc2xpY2UoMCwgb2Zmc2V0KVxuXG4gICAgLy8gUHJldmVudCBlbmNvZGluZyBpbnZhbGlkIGRvY3VtZW50cyBiZWNhdXNlIG9mIHNwbGl0dGluZyBvZiBzdXJyb2dhdGUgcGFpcnM6IGh0dHBzOi8vZ2l0aHViLmNvbS95anMveWpzL2lzc3Vlcy8yNDhcbiAgICBjb25zdCBmaXJzdENoYXJDb2RlID0gdGhpcy5zdHIuY2hhckNvZGVBdChvZmZzZXQgLSAxKVxuICAgIGlmIChmaXJzdENoYXJDb2RlID49IDB4RDgwMCAmJiBmaXJzdENoYXJDb2RlIDw9IDB4REJGRikge1xuICAgICAgLy8gTGFzdCBjaGFyYWN0ZXIgb2YgdGhlIGxlZnQgc3BsaXQgaXMgdGhlIHN0YXJ0IG9mIGEgc3Vycm9nYXRlIHV0ZjE2L3VjczIgcGFpci5cbiAgICAgIC8vIFdlIGRvbid0IHN1cHBvcnQgc3BsaXR0aW5nIG9mIHN1cnJvZ2F0ZSBwYWlycyBiZWNhdXNlIHRoaXMgbWF5IGxlYWQgdG8gaW52YWxpZCBkb2N1bWVudHMuXG4gICAgICAvLyBSZXBsYWNlIHRoZSBpbnZhbGlkIGNoYXJhY3RlciB3aXRoIGEgdW5pY29kZSByZXBsYWNlbWVudCBjaGFyYWN0ZXIgKFx1RkZGRCAvIFUrRkZGRClcbiAgICAgIHRoaXMuc3RyID0gdGhpcy5zdHIuc2xpY2UoMCwgb2Zmc2V0IC0gMSkgKyAnXHVGRkZEJ1xuICAgICAgLy8gcmVwbGFjZSByaWdodCBhcyB3ZWxsXG4gICAgICByaWdodC5zdHIgPSAnXHVGRkZEJyArIHJpZ2h0LnN0ci5zbGljZSgxKVxuICAgIH1cbiAgICByZXR1cm4gcmlnaHRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0NvbnRlbnRTdHJpbmd9IHJpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKHJpZ2h0KSB7XG4gICAgdGhpcy5zdHIgKz0gcmlnaHQuc3RyXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW1cbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIGl0ZW0pIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKi9cbiAgZGVsZXRlICh0cmFuc2FjdGlvbikge31cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqL1xuICBnYyAoc3RvcmUpIHt9XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VwZGF0ZUVuY29kZXJWMSB8IFVwZGF0ZUVuY29kZXJWMn0gZW5jb2RlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoZW5jb2Rlciwgb2Zmc2V0KSB7XG4gICAgZW5jb2Rlci53cml0ZVN0cmluZyhvZmZzZXQgPT09IDAgPyB0aGlzLnN0ciA6IHRoaXMuc3RyLnNsaWNlKG9mZnNldCkpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0UmVmICgpIHtcbiAgICByZXR1cm4gNFxuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1VwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMn0gZGVjb2RlclxuICogQHJldHVybiB7Q29udGVudFN0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDb250ZW50U3RyaW5nID0gZGVjb2RlciA9PiBuZXcgQ29udGVudFN0cmluZyhkZWNvZGVyLnJlYWRTdHJpbmcoKSlcbiIsICJpbXBvcnQge1xuICByZWFkWUFycmF5LFxuICByZWFkWU1hcCxcbiAgcmVhZFlUZXh0LFxuICByZWFkWVhtbEVsZW1lbnQsXG4gIHJlYWRZWG1sRnJhZ21lbnQsXG4gIHJlYWRZWG1sSG9vayxcbiAgcmVhZFlYbWxUZXh0LFxuICBVcGRhdGVEZWNvZGVyVjEsIFVwZGF0ZURlY29kZXJWMiwgVXBkYXRlRW5jb2RlclYxLCBVcGRhdGVFbmNvZGVyVjIsIFN0cnVjdFN0b3JlLCBUcmFuc2FjdGlvbiwgSXRlbSwgWUV2ZW50LCBBYnN0cmFjdFR5cGUgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5cbi8qKlxuICogQHR5cGUge0FycmF5PGZ1bmN0aW9uKFVwZGF0ZURlY29kZXJWMSB8IFVwZGF0ZURlY29kZXJWMik6QWJzdHJhY3RUeXBlPGFueT4+fVxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IHR5cGVSZWZzID0gW1xuICByZWFkWUFycmF5LFxuICByZWFkWU1hcCxcbiAgcmVhZFlUZXh0LFxuICByZWFkWVhtbEVsZW1lbnQsXG4gIHJlYWRZWG1sRnJhZ21lbnQsXG4gIHJlYWRZWG1sSG9vayxcbiAgcmVhZFlYbWxUZXh0XG5dXG5cbmV4cG9ydCBjb25zdCBZQXJyYXlSZWZJRCA9IDBcbmV4cG9ydCBjb25zdCBZTWFwUmVmSUQgPSAxXG5leHBvcnQgY29uc3QgWVRleHRSZWZJRCA9IDJcbmV4cG9ydCBjb25zdCBZWG1sRWxlbWVudFJlZklEID0gM1xuZXhwb3J0IGNvbnN0IFlYbWxGcmFnbWVudFJlZklEID0gNFxuZXhwb3J0IGNvbnN0IFlYbWxIb29rUmVmSUQgPSA1XG5leHBvcnQgY29uc3QgWVhtbFRleHRSZWZJRCA9IDZcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgQ29udGVudFR5cGUge1xuICAvKipcbiAgICogQHBhcmFtIHtBYnN0cmFjdFR5cGU8YW55Pn0gdHlwZVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHR5cGUpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59XG4gICAgICovXG4gICAgdGhpcy50eXBlID0gdHlwZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldExlbmd0aCAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgZ2V0Q29udGVudCAoKSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGVdXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzQ291bnRhYmxlICgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0NvbnRlbnRUeXBlfVxuICAgKi9cbiAgY29weSAoKSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZW50VHlwZSh0aGlzLnR5cGUuX2NvcHkoKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEByZXR1cm4ge0NvbnRlbnRUeXBlfVxuICAgKi9cbiAgc3BsaWNlIChvZmZzZXQpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0NvbnRlbnRUeXBlfSByaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChyaWdodCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICAgKi9cbiAgaW50ZWdyYXRlICh0cmFuc2FjdGlvbiwgaXRlbSkge1xuICAgIHRoaXMudHlwZS5faW50ZWdyYXRlKHRyYW5zYWN0aW9uLmRvYywgaXRlbSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKi9cbiAgZGVsZXRlICh0cmFuc2FjdGlvbikge1xuICAgIGxldCBpdGVtID0gdGhpcy50eXBlLl9zdGFydFxuICAgIHdoaWxlIChpdGVtICE9PSBudWxsKSB7XG4gICAgICBpZiAoIWl0ZW0uZGVsZXRlZCkge1xuICAgICAgICBpdGVtLmRlbGV0ZSh0cmFuc2FjdGlvbilcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS5pZC5jbG9jayA8ICh0cmFuc2FjdGlvbi5iZWZvcmVTdGF0ZS5nZXQoaXRlbS5pZC5jbGllbnQpIHx8IDApKSB7XG4gICAgICAgIC8vIFRoaXMgd2lsbCBiZSBnYydkIGxhdGVyIGFuZCB3ZSB3YW50IHRvIG1lcmdlIGl0IGlmIHBvc3NpYmxlXG4gICAgICAgIC8vIFdlIHRyeSB0byBtZXJnZSBhbGwgZGVsZXRlZCBpdGVtcyBhZnRlciBlYWNoIHRyYW5zYWN0aW9uLFxuICAgICAgICAvLyBidXQgd2UgaGF2ZSBubyBrbm93bGVkZ2UgYWJvdXQgdGhhdCB0aGlzIG5lZWRzIHRvIGJlIG1lcmdlZFxuICAgICAgICAvLyBzaW5jZSBpdCBpcyBub3QgaW4gdHJhbnNhY3Rpb24uZHMuIEhlbmNlIHdlIGFkZCBpdCB0byB0cmFuc2FjdGlvbi5fbWVyZ2VTdHJ1Y3RzXG4gICAgICAgIHRyYW5zYWN0aW9uLl9tZXJnZVN0cnVjdHMucHVzaChpdGVtKVxuICAgICAgfVxuICAgICAgaXRlbSA9IGl0ZW0ucmlnaHRcbiAgICB9XG4gICAgdGhpcy50eXBlLl9tYXAuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGlmICghaXRlbS5kZWxldGVkKSB7XG4gICAgICAgIGl0ZW0uZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgfSBlbHNlIGlmIChpdGVtLmlkLmNsb2NrIDwgKHRyYW5zYWN0aW9uLmJlZm9yZVN0YXRlLmdldChpdGVtLmlkLmNsaWVudCkgfHwgMCkpIHtcbiAgICAgICAgLy8gc2FtZSBhcyBhYm92ZVxuICAgICAgICB0cmFuc2FjdGlvbi5fbWVyZ2VTdHJ1Y3RzLnB1c2goaXRlbSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHRyYW5zYWN0aW9uLmNoYW5nZWQuZGVsZXRlKHRoaXMudHlwZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cnVjdFN0b3JlfSBzdG9yZVxuICAgKi9cbiAgZ2MgKHN0b3JlKSB7XG4gICAgbGV0IGl0ZW0gPSB0aGlzLnR5cGUuX3N0YXJ0XG4gICAgd2hpbGUgKGl0ZW0gIT09IG51bGwpIHtcbiAgICAgIGl0ZW0uZ2Moc3RvcmUsIHRydWUpXG4gICAgICBpdGVtID0gaXRlbS5yaWdodFxuICAgIH1cbiAgICB0aGlzLnR5cGUuX3N0YXJ0ID0gbnVsbFxuICAgIHRoaXMudHlwZS5fbWFwLmZvckVhY2goLyoqIEBwYXJhbSB7SXRlbSB8IG51bGx9IGl0ZW0gKi8gKGl0ZW0pID0+IHtcbiAgICAgIHdoaWxlIChpdGVtICE9PSBudWxsKSB7XG4gICAgICAgIGl0ZW0uZ2Moc3RvcmUsIHRydWUpXG4gICAgICAgIGl0ZW0gPSBpdGVtLmxlZnRcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMudHlwZS5fbWFwID0gbmV3IE1hcCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IGVuY29kZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgd3JpdGUgKGVuY29kZXIsIG9mZnNldCkge1xuICAgIHRoaXMudHlwZS5fd3JpdGUoZW5jb2RlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRSZWYgKCkge1xuICAgIHJldHVybiA3XG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7VXBkYXRlRGVjb2RlclYxIHwgVXBkYXRlRGVjb2RlclYyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtDb250ZW50VHlwZX1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRDb250ZW50VHlwZSA9IGRlY29kZXIgPT4gbmV3IENvbnRlbnRUeXBlKHR5cGVSZWZzW2RlY29kZXIucmVhZFR5cGVSZWYoKV0oZGVjb2RlcikpXG4iLCAiaW1wb3J0IHtcbiAgR0MsXG4gIGdldFN0YXRlLFxuICBBYnN0cmFjdFN0cnVjdCxcbiAgcmVwbGFjZVN0cnVjdCxcbiAgYWRkU3RydWN0LFxuICBhZGRUb0RlbGV0ZVNldCxcbiAgZmluZFJvb3RUeXBlS2V5LFxuICBjb21wYXJlSURzLFxuICBnZXRJdGVtLFxuICBnZXRJdGVtQ2xlYW5FbmQsXG4gIGdldEl0ZW1DbGVhblN0YXJ0LFxuICByZWFkQ29udGVudERlbGV0ZWQsXG4gIHJlYWRDb250ZW50QmluYXJ5LFxuICByZWFkQ29udGVudEpTT04sXG4gIHJlYWRDb250ZW50QW55LFxuICByZWFkQ29udGVudFN0cmluZyxcbiAgcmVhZENvbnRlbnRFbWJlZCxcbiAgcmVhZENvbnRlbnREb2MsXG4gIGNyZWF0ZUlELFxuICByZWFkQ29udGVudEZvcm1hdCxcbiAgcmVhZENvbnRlbnRUeXBlLFxuICBhZGRDaGFuZ2VkVHlwZVRvVHJhbnNhY3Rpb24sXG4gIGlzRGVsZXRlZCxcbiAgU3RhY2tJdGVtLCBEZWxldGVTZXQsIFVwZGF0ZURlY29kZXJWMSwgVXBkYXRlRGVjb2RlclYyLCBVcGRhdGVFbmNvZGVyVjEsIFVwZGF0ZUVuY29kZXJWMiwgQ29udGVudFR5cGUsIENvbnRlbnREZWxldGVkLCBTdHJ1Y3RTdG9yZSwgSUQsIEFic3RyYWN0VHlwZSwgVHJhbnNhY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxufSBmcm9tICcuLi9pbnRlcm5hbHMuanMnXG5cbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5pbXBvcnQgKiBhcyBiaW5hcnkgZnJvbSAnbGliMC9iaW5hcnknXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICdsaWIwL2FycmF5J1xuXG4vKipcbiAqIEB0b2RvIFRoaXMgc2hvdWxkIHJldHVybiBzZXZlcmFsIGl0ZW1zXG4gKlxuICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAqIEBwYXJhbSB7SUR9IGlkXG4gKiBAcmV0dXJuIHt7aXRlbTpJdGVtLCBkaWZmOm51bWJlcn19XG4gKi9cbmV4cG9ydCBjb25zdCBmb2xsb3dSZWRvbmUgPSAoc3RvcmUsIGlkKSA9PiB7XG4gIC8qKlxuICAgKiBAdHlwZSB7SUR8bnVsbH1cbiAgICovXG4gIGxldCBuZXh0SUQgPSBpZFxuICBsZXQgZGlmZiA9IDBcbiAgbGV0IGl0ZW1cbiAgZG8ge1xuICAgIGlmIChkaWZmID4gMCkge1xuICAgICAgbmV4dElEID0gY3JlYXRlSUQobmV4dElELmNsaWVudCwgbmV4dElELmNsb2NrICsgZGlmZilcbiAgICB9XG4gICAgaXRlbSA9IGdldEl0ZW0oc3RvcmUsIG5leHRJRClcbiAgICBkaWZmID0gbmV4dElELmNsb2NrIC0gaXRlbS5pZC5jbG9ja1xuICAgIG5leHRJRCA9IGl0ZW0ucmVkb25lXG4gIH0gd2hpbGUgKG5leHRJRCAhPT0gbnVsbCAmJiBpdGVtIGluc3RhbmNlb2YgSXRlbSlcbiAgcmV0dXJuIHtcbiAgICBpdGVtLCBkaWZmXG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIHN1cmUgdGhhdCBuZWl0aGVyIGl0ZW0gbm9yIGFueSBvZiBpdHMgcGFyZW50cyBpcyBldmVyIGRlbGV0ZWQuXG4gKlxuICogVGhpcyBwcm9wZXJ0eSBkb2VzIG5vdCBwZXJzaXN0IHdoZW4gc3RvcmluZyBpdCBpbnRvIGEgZGF0YWJhc2Ugb3Igd2hlblxuICogc2VuZGluZyBpdCB0byBvdGhlciBwZWVyc1xuICpcbiAqIEBwYXJhbSB7SXRlbXxudWxsfSBpdGVtXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGtlZXBcbiAqL1xuZXhwb3J0IGNvbnN0IGtlZXBJdGVtID0gKGl0ZW0sIGtlZXApID0+IHtcbiAgd2hpbGUgKGl0ZW0gIT09IG51bGwgJiYgaXRlbS5rZWVwICE9PSBrZWVwKSB7XG4gICAgaXRlbS5rZWVwID0ga2VlcFxuICAgIGl0ZW0gPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAoaXRlbS5wYXJlbnQpLl9pdGVtXG4gIH1cbn1cblxuLyoqXG4gKiBTcGxpdCBsZWZ0SXRlbSBpbnRvIHR3byBpdGVtc1xuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7SXRlbX0gbGVmdEl0ZW1cbiAqIEBwYXJhbSB7bnVtYmVyfSBkaWZmXG4gKiBAcmV0dXJuIHtJdGVtfVxuICpcbiAqIEBmdW5jdGlvblxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IHNwbGl0SXRlbSA9ICh0cmFuc2FjdGlvbiwgbGVmdEl0ZW0sIGRpZmYpID0+IHtcbiAgLy8gY3JlYXRlIHJpZ2h0SXRlbVxuICBjb25zdCB7IGNsaWVudCwgY2xvY2sgfSA9IGxlZnRJdGVtLmlkXG4gIGNvbnN0IHJpZ2h0SXRlbSA9IG5ldyBJdGVtKFxuICAgIGNyZWF0ZUlEKGNsaWVudCwgY2xvY2sgKyBkaWZmKSxcbiAgICBsZWZ0SXRlbSxcbiAgICBjcmVhdGVJRChjbGllbnQsIGNsb2NrICsgZGlmZiAtIDEpLFxuICAgIGxlZnRJdGVtLnJpZ2h0LFxuICAgIGxlZnRJdGVtLnJpZ2h0T3JpZ2luLFxuICAgIGxlZnRJdGVtLnBhcmVudCxcbiAgICBsZWZ0SXRlbS5wYXJlbnRTdWIsXG4gICAgbGVmdEl0ZW0uY29udGVudC5zcGxpY2UoZGlmZilcbiAgKVxuICBpZiAobGVmdEl0ZW0uZGVsZXRlZCkge1xuICAgIHJpZ2h0SXRlbS5tYXJrRGVsZXRlZCgpXG4gIH1cbiAgaWYgKGxlZnRJdGVtLmtlZXApIHtcbiAgICByaWdodEl0ZW0ua2VlcCA9IHRydWVcbiAgfVxuICBpZiAobGVmdEl0ZW0ucmVkb25lICE9PSBudWxsKSB7XG4gICAgcmlnaHRJdGVtLnJlZG9uZSA9IGNyZWF0ZUlEKGxlZnRJdGVtLnJlZG9uZS5jbGllbnQsIGxlZnRJdGVtLnJlZG9uZS5jbG9jayArIGRpZmYpXG4gIH1cbiAgLy8gdXBkYXRlIGxlZnQgKGRvIG5vdCBzZXQgbGVmdEl0ZW0ucmlnaHRPcmlnaW4gYXMgaXQgd2lsbCBsZWFkIHRvIHByb2JsZW1zIHdoZW4gc3luY2luZylcbiAgbGVmdEl0ZW0ucmlnaHQgPSByaWdodEl0ZW1cbiAgLy8gdXBkYXRlIHJpZ2h0XG4gIGlmIChyaWdodEl0ZW0ucmlnaHQgIT09IG51bGwpIHtcbiAgICByaWdodEl0ZW0ucmlnaHQubGVmdCA9IHJpZ2h0SXRlbVxuICB9XG4gIC8vIHJpZ2h0IGlzIG1vcmUgc3BlY2lmaWMuXG4gIHRyYW5zYWN0aW9uLl9tZXJnZVN0cnVjdHMucHVzaChyaWdodEl0ZW0pXG4gIC8vIHVwZGF0ZSBwYXJlbnQuX21hcFxuICBpZiAocmlnaHRJdGVtLnBhcmVudFN1YiAhPT0gbnVsbCAmJiByaWdodEl0ZW0ucmlnaHQgPT09IG51bGwpIHtcbiAgICAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAocmlnaHRJdGVtLnBhcmVudCkuX21hcC5zZXQocmlnaHRJdGVtLnBhcmVudFN1YiwgcmlnaHRJdGVtKVxuICB9XG4gIGxlZnRJdGVtLmxlbmd0aCA9IGRpZmZcbiAgcmV0dXJuIHJpZ2h0SXRlbVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8U3RhY2tJdGVtPn0gc3RhY2tcbiAqIEBwYXJhbSB7SUR9IGlkXG4gKi9cbmNvbnN0IGlzRGVsZXRlZEJ5VW5kb1N0YWNrID0gKHN0YWNrLCBpZCkgPT4gYXJyYXkuc29tZShzdGFjaywgLyoqIEBwYXJhbSB7U3RhY2tJdGVtfSBzICovIHMgPT4gaXNEZWxldGVkKHMuZGVsZXRpb25zLCBpZCkpXG5cbi8qKlxuICogUmVkb2VzIHRoZSBlZmZlY3Qgb2YgdGhpcyBvcGVyYXRpb24uXG4gKlxuICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb24gVGhlIFlqcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7SXRlbX0gaXRlbVxuICogQHBhcmFtIHtTZXQ8SXRlbT59IHJlZG9pdGVtc1xuICogQHBhcmFtIHtEZWxldGVTZXR9IGl0ZW1zVG9EZWxldGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaWdub3JlUmVtb3RlTWFwQ2hhbmdlc1xuICogQHBhcmFtIHtpbXBvcnQoJy4uL3V0aWxzL1VuZG9NYW5hZ2VyLmpzJykuVW5kb01hbmFnZXJ9IHVtXG4gKlxuICogQHJldHVybiB7SXRlbXxudWxsfVxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCByZWRvSXRlbSA9ICh0cmFuc2FjdGlvbiwgaXRlbSwgcmVkb2l0ZW1zLCBpdGVtc1RvRGVsZXRlLCBpZ25vcmVSZW1vdGVNYXBDaGFuZ2VzLCB1bSkgPT4ge1xuICBjb25zdCBkb2MgPSB0cmFuc2FjdGlvbi5kb2NcbiAgY29uc3Qgc3RvcmUgPSBkb2Muc3RvcmVcbiAgY29uc3Qgb3duQ2xpZW50SUQgPSBkb2MuY2xpZW50SURcbiAgY29uc3QgcmVkb25lID0gaXRlbS5yZWRvbmVcbiAgaWYgKHJlZG9uZSAhPT0gbnVsbCkge1xuICAgIHJldHVybiBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgcmVkb25lKVxuICB9XG4gIGxldCBwYXJlbnRJdGVtID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKGl0ZW0ucGFyZW50KS5faXRlbVxuICAvKipcbiAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICovXG4gIGxldCBsZWZ0ID0gbnVsbFxuICAvKipcbiAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICovXG4gIGxldCByaWdodFxuICAvLyBtYWtlIHN1cmUgdGhhdCBwYXJlbnQgaXMgcmVkb25lXG4gIGlmIChwYXJlbnRJdGVtICE9PSBudWxsICYmIHBhcmVudEl0ZW0uZGVsZXRlZCA9PT0gdHJ1ZSkge1xuICAgIC8vIHRyeSB0byB1bmRvIHBhcmVudCBpZiBpdCB3aWxsIGJlIHVuZG9uZSBhbnl3YXlcbiAgICBpZiAocGFyZW50SXRlbS5yZWRvbmUgPT09IG51bGwgJiYgKCFyZWRvaXRlbXMuaGFzKHBhcmVudEl0ZW0pIHx8IHJlZG9JdGVtKHRyYW5zYWN0aW9uLCBwYXJlbnRJdGVtLCByZWRvaXRlbXMsIGl0ZW1zVG9EZWxldGUsIGlnbm9yZVJlbW90ZU1hcENoYW5nZXMsIHVtKSA9PT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIHdoaWxlIChwYXJlbnRJdGVtLnJlZG9uZSAhPT0gbnVsbCkge1xuICAgICAgcGFyZW50SXRlbSA9IGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCBwYXJlbnRJdGVtLnJlZG9uZSlcbiAgICB9XG4gIH1cbiAgY29uc3QgcGFyZW50VHlwZSA9IHBhcmVudEl0ZW0gPT09IG51bGwgPyAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAoaXRlbS5wYXJlbnQpIDogLyoqIEB0eXBlIHtDb250ZW50VHlwZX0gKi8gKHBhcmVudEl0ZW0uY29udGVudCkudHlwZVxuXG4gIGlmIChpdGVtLnBhcmVudFN1YiA9PT0gbnVsbCkge1xuICAgIC8vIElzIGFuIGFycmF5IGl0ZW0uIEluc2VydCBhdCB0aGUgb2xkIHBvc2l0aW9uXG4gICAgbGVmdCA9IGl0ZW0ubGVmdFxuICAgIHJpZ2h0ID0gaXRlbVxuICAgIC8vIGZpbmQgbmV4dCBjbG9uZWRfcmVkbyBpdGVtc1xuICAgIHdoaWxlIChsZWZ0ICE9PSBudWxsKSB7XG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAgICAgKi9cbiAgICAgIGxldCBsZWZ0VHJhY2UgPSBsZWZ0XG4gICAgICAvLyB0cmFjZSByZWRvbmUgdW50aWwgcGFyZW50IG1hdGNoZXNcbiAgICAgIHdoaWxlIChsZWZ0VHJhY2UgIT09IG51bGwgJiYgLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKGxlZnRUcmFjZS5wYXJlbnQpLl9pdGVtICE9PSBwYXJlbnRJdGVtKSB7XG4gICAgICAgIGxlZnRUcmFjZSA9IGxlZnRUcmFjZS5yZWRvbmUgPT09IG51bGwgPyBudWxsIDogZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIGxlZnRUcmFjZS5yZWRvbmUpXG4gICAgICB9XG4gICAgICBpZiAobGVmdFRyYWNlICE9PSBudWxsICYmIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChsZWZ0VHJhY2UucGFyZW50KS5faXRlbSA9PT0gcGFyZW50SXRlbSkge1xuICAgICAgICBsZWZ0ID0gbGVmdFRyYWNlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBsZWZ0ID0gbGVmdC5sZWZ0XG4gICAgfVxuICAgIHdoaWxlIChyaWdodCAhPT0gbnVsbCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAdHlwZSB7SXRlbXxudWxsfVxuICAgICAgICovXG4gICAgICBsZXQgcmlnaHRUcmFjZSA9IHJpZ2h0XG4gICAgICAvLyB0cmFjZSByZWRvbmUgdW50aWwgcGFyZW50IG1hdGNoZXNcbiAgICAgIHdoaWxlIChyaWdodFRyYWNlICE9PSBudWxsICYmIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChyaWdodFRyYWNlLnBhcmVudCkuX2l0ZW0gIT09IHBhcmVudEl0ZW0pIHtcbiAgICAgICAgcmlnaHRUcmFjZSA9IHJpZ2h0VHJhY2UucmVkb25lID09PSBudWxsID8gbnVsbCA6IGdldEl0ZW1DbGVhblN0YXJ0KHRyYW5zYWN0aW9uLCByaWdodFRyYWNlLnJlZG9uZSlcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodFRyYWNlICE9PSBudWxsICYmIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovIChyaWdodFRyYWNlLnBhcmVudCkuX2l0ZW0gPT09IHBhcmVudEl0ZW0pIHtcbiAgICAgICAgcmlnaHQgPSByaWdodFRyYWNlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICByaWdodCA9IHJpZ2h0LnJpZ2h0XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJpZ2h0ID0gbnVsbFxuICAgIGlmIChpdGVtLnJpZ2h0ICYmICFpZ25vcmVSZW1vdGVNYXBDaGFuZ2VzKSB7XG4gICAgICBsZWZ0ID0gaXRlbVxuICAgICAgLy8gSXRlcmF0ZSByaWdodCB3aGlsZSByaWdodCBpcyBpbiBpdGVtc1RvRGVsZXRlXG4gICAgICAvLyBJZiBpdCBpcyBpbnRlbmRlZCB0byBkZWxldGUgcmlnaHQgd2hpbGUgaXRlbSBpcyByZWRvbmUsIHdlIGNhbiBleHBlY3QgdGhhdCBpdGVtIHNob3VsZCByZXBsYWNlIHJpZ2h0LlxuICAgICAgd2hpbGUgKGxlZnQgIT09IG51bGwgJiYgbGVmdC5yaWdodCAhPT0gbnVsbCAmJiAobGVmdC5yaWdodC5yZWRvbmUgfHwgaXNEZWxldGVkKGl0ZW1zVG9EZWxldGUsIGxlZnQucmlnaHQuaWQpIHx8IGlzRGVsZXRlZEJ5VW5kb1N0YWNrKHVtLnVuZG9TdGFjaywgbGVmdC5yaWdodC5pZCkgfHwgaXNEZWxldGVkQnlVbmRvU3RhY2sodW0ucmVkb1N0YWNrLCBsZWZ0LnJpZ2h0LmlkKSkpIHtcbiAgICAgICAgbGVmdCA9IGxlZnQucmlnaHRcbiAgICAgICAgLy8gZm9sbG93IHJlZG9uZVxuICAgICAgICB3aGlsZSAobGVmdC5yZWRvbmUpIGxlZnQgPSBnZXRJdGVtQ2xlYW5TdGFydCh0cmFuc2FjdGlvbiwgbGVmdC5yZWRvbmUpXG4gICAgICB9XG4gICAgICBpZiAobGVmdCAmJiBsZWZ0LnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIEl0IGlzIG5vdCBwb3NzaWJsZSB0byByZWRvIHRoaXMgaXRlbSBiZWNhdXNlIGl0IGNvbmZsaWN0cyB3aXRoIGFcbiAgICAgICAgLy8gY2hhbmdlIGZyb20gYW5vdGhlciBjbGllbnRcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGVmdCA9IHBhcmVudFR5cGUuX21hcC5nZXQoaXRlbS5wYXJlbnRTdWIpIHx8IG51bGxcbiAgICB9XG4gIH1cbiAgY29uc3QgbmV4dENsb2NrID0gZ2V0U3RhdGUoc3RvcmUsIG93bkNsaWVudElEKVxuICBjb25zdCBuZXh0SWQgPSBjcmVhdGVJRChvd25DbGllbnRJRCwgbmV4dENsb2NrKVxuICBjb25zdCByZWRvbmVJdGVtID0gbmV3IEl0ZW0oXG4gICAgbmV4dElkLFxuICAgIGxlZnQsIGxlZnQgJiYgbGVmdC5sYXN0SWQsXG4gICAgcmlnaHQsIHJpZ2h0ICYmIHJpZ2h0LmlkLFxuICAgIHBhcmVudFR5cGUsXG4gICAgaXRlbS5wYXJlbnRTdWIsXG4gICAgaXRlbS5jb250ZW50LmNvcHkoKVxuICApXG4gIGl0ZW0ucmVkb25lID0gbmV4dElkXG4gIGtlZXBJdGVtKHJlZG9uZUl0ZW0sIHRydWUpXG4gIHJlZG9uZUl0ZW0uaW50ZWdyYXRlKHRyYW5zYWN0aW9uLCAwKVxuICByZXR1cm4gcmVkb25lSXRlbVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGNsYXNzIHRoYXQgcmVwcmVzZW50cyBhbnkgY29udGVudC5cbiAqL1xuZXhwb3J0IGNsYXNzIEl0ZW0gZXh0ZW5kcyBBYnN0cmFjdFN0cnVjdCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0lEfSBpZFxuICAgKiBAcGFyYW0ge0l0ZW0gfCBudWxsfSBsZWZ0XG4gICAqIEBwYXJhbSB7SUQgfCBudWxsfSBvcmlnaW5cbiAgICogQHBhcmFtIHtJdGVtIHwgbnVsbH0gcmlnaHRcbiAgICogQHBhcmFtIHtJRCB8IG51bGx9IHJpZ2h0T3JpZ2luXG4gICAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlPGFueT58SUR8bnVsbH0gcGFyZW50IElzIGEgdHlwZSBpZiBpbnRlZ3JhdGVkLCBpcyBudWxsIGlmIGl0IGlzIHBvc3NpYmxlIHRvIGNvcHkgcGFyZW50IGZyb20gbGVmdCBvciByaWdodCwgaXMgSUQgYmVmb3JlIGludGVncmF0aW9uIHRvIHNlYXJjaCBmb3IgaXQuXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVsbH0gcGFyZW50U3ViXG4gICAqIEBwYXJhbSB7QWJzdHJhY3RDb250ZW50fSBjb250ZW50XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoaWQsIGxlZnQsIG9yaWdpbiwgcmlnaHQsIHJpZ2h0T3JpZ2luLCBwYXJlbnQsIHBhcmVudFN1YiwgY29udGVudCkge1xuICAgIHN1cGVyKGlkLCBjb250ZW50LmdldExlbmd0aCgpKVxuICAgIC8qKlxuICAgICAqIFRoZSBpdGVtIHRoYXQgd2FzIG9yaWdpbmFsbHkgdG8gdGhlIGxlZnQgb2YgdGhpcyBpdGVtLlxuICAgICAqIEB0eXBlIHtJRCB8IG51bGx9XG4gICAgICovXG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW5cbiAgICAvKipcbiAgICAgKiBUaGUgaXRlbSB0aGF0IGlzIGN1cnJlbnRseSB0byB0aGUgbGVmdCBvZiB0aGlzIGl0ZW0uXG4gICAgICogQHR5cGUge0l0ZW0gfCBudWxsfVxuICAgICAqL1xuICAgIHRoaXMubGVmdCA9IGxlZnRcbiAgICAvKipcbiAgICAgKiBUaGUgaXRlbSB0aGF0IGlzIGN1cnJlbnRseSB0byB0aGUgcmlnaHQgb2YgdGhpcyBpdGVtLlxuICAgICAqIEB0eXBlIHtJdGVtIHwgbnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLnJpZ2h0ID0gcmlnaHRcbiAgICAvKipcbiAgICAgKiBUaGUgaXRlbSB0aGF0IHdhcyBvcmlnaW5hbGx5IHRvIHRoZSByaWdodCBvZiB0aGlzIGl0ZW0uXG4gICAgICogQHR5cGUge0lEIHwgbnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLnJpZ2h0T3JpZ2luID0gcmlnaHRPcmlnaW5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT58SUR8bnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudFxuICAgIC8qKlxuICAgICAqIElmIHRoZSBwYXJlbnQgcmVmZXJzIHRvIHRoaXMgaXRlbSB3aXRoIHNvbWUga2luZCBvZiBrZXkgKGUuZy4gWU1hcCwgdGhlXG4gICAgICoga2V5IGlzIHNwZWNpZmllZCBoZXJlLiBUaGUga2V5IGlzIHRoZW4gdXNlZCB0byByZWZlciB0byB0aGUgbGlzdCBpbiB3aGljaFxuICAgICAqIHRvIGluc2VydCB0aGlzIGl0ZW0uIElmIGBwYXJlbnRTdWIgPSBudWxsYCB0eXBlLl9zdGFydCBpcyB0aGUgbGlzdCBpblxuICAgICAqIHdoaWNoIHRvIGluc2VydCB0by4gT3RoZXJ3aXNlIGl0IGlzIGBwYXJlbnQuX21hcGAuXG4gICAgICogQHR5cGUge1N0cmluZyB8IG51bGx9XG4gICAgICovXG4gICAgdGhpcy5wYXJlbnRTdWIgPSBwYXJlbnRTdWJcbiAgICAvKipcbiAgICAgKiBJZiB0aGlzIHR5cGUncyBlZmZlY3QgaXMgcmVkb25lIHRoaXMgdHlwZSByZWZlcnMgdG8gdGhlIHR5cGUgdGhhdCB1bmRpZFxuICAgICAqIHRoaXMgb3BlcmF0aW9uLlxuICAgICAqIEB0eXBlIHtJRCB8IG51bGx9XG4gICAgICovXG4gICAgdGhpcy5yZWRvbmUgPSBudWxsXG4gICAgLyoqXG4gICAgICogQHR5cGUge0Fic3RyYWN0Q29udGVudH1cbiAgICAgKi9cbiAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG4gICAgLyoqXG4gICAgICogYml0MToga2VlcFxuICAgICAqIGJpdDI6IGNvdW50YWJsZVxuICAgICAqIGJpdDM6IGRlbGV0ZWRcbiAgICAgKiBiaXQ0OiBtYXJrIC0gbWFyayBub2RlIGFzIGZhc3Qtc2VhcmNoLW1hcmtlclxuICAgICAqIEB0eXBlIHtudW1iZXJ9IGJ5dGVcbiAgICAgKi9cbiAgICB0aGlzLmluZm8gPSB0aGlzLmNvbnRlbnQuaXNDb3VudGFibGUoKSA/IGJpbmFyeS5CSVQyIDogMFxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBtYXJrIHRoZSBpdGVtIGFzIGFuIGluZGV4ZWQgZmFzdC1zZWFyY2ggbWFya2VyXG4gICAqXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgc2V0IG1hcmtlciAoaXNNYXJrZWQpIHtcbiAgICBpZiAoKCh0aGlzLmluZm8gJiBiaW5hcnkuQklUNCkgPiAwKSAhPT0gaXNNYXJrZWQpIHtcbiAgICAgIHRoaXMuaW5mbyBePSBiaW5hcnkuQklUNFxuICAgIH1cbiAgfVxuXG4gIGdldCBtYXJrZXIgKCkge1xuICAgIHJldHVybiAodGhpcy5pbmZvICYgYmluYXJ5LkJJVDQpID4gMFxuICB9XG5cbiAgLyoqXG4gICAqIElmIHRydWUsIGRvIG5vdCBnYXJiYWdlIGNvbGxlY3QgdGhpcyBJdGVtLlxuICAgKi9cbiAgZ2V0IGtlZXAgKCkge1xuICAgIHJldHVybiAodGhpcy5pbmZvICYgYmluYXJ5LkJJVDEpID4gMFxuICB9XG5cbiAgc2V0IGtlZXAgKGRvS2VlcCkge1xuICAgIGlmICh0aGlzLmtlZXAgIT09IGRvS2VlcCkge1xuICAgICAgdGhpcy5pbmZvIF49IGJpbmFyeS5CSVQxXG4gICAgfVxuICB9XG5cbiAgZ2V0IGNvdW50YWJsZSAoKSB7XG4gICAgcmV0dXJuICh0aGlzLmluZm8gJiBiaW5hcnkuQklUMikgPiAwXG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGl0ZW0gd2FzIGRlbGV0ZWQgb3Igbm90LlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIGdldCBkZWxldGVkICgpIHtcbiAgICByZXR1cm4gKHRoaXMuaW5mbyAmIGJpbmFyeS5CSVQzKSA+IDBcbiAgfVxuXG4gIHNldCBkZWxldGVkIChkb0RlbGV0ZSkge1xuICAgIGlmICh0aGlzLmRlbGV0ZWQgIT09IGRvRGVsZXRlKSB7XG4gICAgICB0aGlzLmluZm8gXj0gYmluYXJ5LkJJVDNcbiAgICB9XG4gIH1cblxuICBtYXJrRGVsZXRlZCAoKSB7XG4gICAgdGhpcy5pbmZvIHw9IGJpbmFyeS5CSVQzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBjcmVhdG9yIGNsaWVudElEIG9mIHRoZSBtaXNzaW5nIG9wIG9yIGRlZmluZSBtaXNzaW5nIGl0ZW1zIGFuZCByZXR1cm4gbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICogQHJldHVybiB7bnVsbCB8IG51bWJlcn1cbiAgICovXG4gIGdldE1pc3NpbmcgKHRyYW5zYWN0aW9uLCBzdG9yZSkge1xuICAgIGlmICh0aGlzLm9yaWdpbiAmJiB0aGlzLm9yaWdpbi5jbGllbnQgIT09IHRoaXMuaWQuY2xpZW50ICYmIHRoaXMub3JpZ2luLmNsb2NrID49IGdldFN0YXRlKHN0b3JlLCB0aGlzLm9yaWdpbi5jbGllbnQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcmlnaW4uY2xpZW50XG4gICAgfVxuICAgIGlmICh0aGlzLnJpZ2h0T3JpZ2luICYmIHRoaXMucmlnaHRPcmlnaW4uY2xpZW50ICE9PSB0aGlzLmlkLmNsaWVudCAmJiB0aGlzLnJpZ2h0T3JpZ2luLmNsb2NrID49IGdldFN0YXRlKHN0b3JlLCB0aGlzLnJpZ2h0T3JpZ2luLmNsaWVudCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJpZ2h0T3JpZ2luLmNsaWVudFxuICAgIH1cbiAgICBpZiAodGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQuY29uc3RydWN0b3IgPT09IElEICYmIHRoaXMuaWQuY2xpZW50ICE9PSB0aGlzLnBhcmVudC5jbGllbnQgJiYgdGhpcy5wYXJlbnQuY2xvY2sgPj0gZ2V0U3RhdGUoc3RvcmUsIHRoaXMucGFyZW50LmNsaWVudCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcmVudC5jbGllbnRcbiAgICB9XG5cbiAgICAvLyBXZSBoYXZlIGFsbCBtaXNzaW5nIGlkcywgbm93IGZpbmQgdGhlIGl0ZW1zXG5cbiAgICBpZiAodGhpcy5vcmlnaW4pIHtcbiAgICAgIHRoaXMubGVmdCA9IGdldEl0ZW1DbGVhbkVuZCh0cmFuc2FjdGlvbiwgc3RvcmUsIHRoaXMub3JpZ2luKVxuICAgICAgdGhpcy5vcmlnaW4gPSB0aGlzLmxlZnQubGFzdElkXG4gICAgfVxuICAgIGlmICh0aGlzLnJpZ2h0T3JpZ2luKSB7XG4gICAgICB0aGlzLnJpZ2h0ID0gZ2V0SXRlbUNsZWFuU3RhcnQodHJhbnNhY3Rpb24sIHRoaXMucmlnaHRPcmlnaW4pXG4gICAgICB0aGlzLnJpZ2h0T3JpZ2luID0gdGhpcy5yaWdodC5pZFxuICAgIH1cbiAgICBpZiAoKHRoaXMubGVmdCAmJiB0aGlzLmxlZnQuY29uc3RydWN0b3IgPT09IEdDKSB8fCAodGhpcy5yaWdodCAmJiB0aGlzLnJpZ2h0LmNvbnN0cnVjdG9yID09PSBHQykpIHtcbiAgICAgIHRoaXMucGFyZW50ID0gbnVsbFxuICAgIH0gZWxzZSBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgICAvLyBvbmx5IHNldCBwYXJlbnQgaWYgdGhpcyBzaG91bGRuJ3QgYmUgZ2FyYmFnZSBjb2xsZWN0ZWRcbiAgICAgIGlmICh0aGlzLmxlZnQgJiYgdGhpcy5sZWZ0LmNvbnN0cnVjdG9yID09PSBJdGVtKSB7XG4gICAgICAgIHRoaXMucGFyZW50ID0gdGhpcy5sZWZ0LnBhcmVudFxuICAgICAgICB0aGlzLnBhcmVudFN1YiA9IHRoaXMubGVmdC5wYXJlbnRTdWJcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnJpZ2h0ICYmIHRoaXMucmlnaHQuY29uc3RydWN0b3IgPT09IEl0ZW0pIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSB0aGlzLnJpZ2h0LnBhcmVudFxuICAgICAgICB0aGlzLnBhcmVudFN1YiA9IHRoaXMucmlnaHQucGFyZW50U3ViXG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudC5jb25zdHJ1Y3RvciA9PT0gSUQpIHtcbiAgICAgIGNvbnN0IHBhcmVudEl0ZW0gPSBnZXRJdGVtKHN0b3JlLCB0aGlzLnBhcmVudClcbiAgICAgIGlmIChwYXJlbnRJdGVtLmNvbnN0cnVjdG9yID09PSBHQykge1xuICAgICAgICB0aGlzLnBhcmVudCA9IG51bGxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGFyZW50ID0gLyoqIEB0eXBlIHtDb250ZW50VHlwZX0gKi8gKHBhcmVudEl0ZW0uY29udGVudCkudHlwZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIGludGVncmF0ZSAodHJhbnNhY3Rpb24sIG9mZnNldCkge1xuICAgIGlmIChvZmZzZXQgPiAwKSB7XG4gICAgICB0aGlzLmlkLmNsb2NrICs9IG9mZnNldFxuICAgICAgdGhpcy5sZWZ0ID0gZ2V0SXRlbUNsZWFuRW5kKHRyYW5zYWN0aW9uLCB0cmFuc2FjdGlvbi5kb2Muc3RvcmUsIGNyZWF0ZUlEKHRoaXMuaWQuY2xpZW50LCB0aGlzLmlkLmNsb2NrIC0gMSkpXG4gICAgICB0aGlzLm9yaWdpbiA9IHRoaXMubGVmdC5sYXN0SWRcbiAgICAgIHRoaXMuY29udGVudCA9IHRoaXMuY29udGVudC5zcGxpY2Uob2Zmc2V0KVxuICAgICAgdGhpcy5sZW5ndGggLT0gb2Zmc2V0XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICBpZiAoKCF0aGlzLmxlZnQgJiYgKCF0aGlzLnJpZ2h0IHx8IHRoaXMucmlnaHQubGVmdCAhPT0gbnVsbCkpIHx8ICh0aGlzLmxlZnQgJiYgdGhpcy5sZWZ0LnJpZ2h0ICE9PSB0aGlzLnJpZ2h0KSkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge0l0ZW18bnVsbH1cbiAgICAgICAgICovXG4gICAgICAgIGxldCBsZWZ0ID0gdGhpcy5sZWZ0XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtJdGVtfG51bGx9XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgb1xuICAgICAgICAvLyBzZXQgbyB0byB0aGUgZmlyc3QgY29uZmxpY3RpbmcgaXRlbVxuICAgICAgICBpZiAobGVmdCAhPT0gbnVsbCkge1xuICAgICAgICAgIG8gPSBsZWZ0LnJpZ2h0XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wYXJlbnRTdWIgIT09IG51bGwpIHtcbiAgICAgICAgICBvID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5fbWFwLmdldCh0aGlzLnBhcmVudFN1YikgfHwgbnVsbFxuICAgICAgICAgIHdoaWxlIChvICE9PSBudWxsICYmIG8ubGVmdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbyA9IG8ubGVmdFxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5fc3RhcnRcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiB1c2Ugc29tZXRoaW5nIGxpa2UgRGVsZXRlU2V0IGhlcmUgKGEgdHJlZSBpbXBsZW1lbnRhdGlvbiB3b3VsZCBiZSBiZXN0KVxuICAgICAgICAvLyBAdG9kbyB1c2UgZ2xvYmFsIHNldCBkZWZpbml0aW9uc1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge1NldDxJdGVtPn1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGNvbmZsaWN0aW5nSXRlbXMgPSBuZXcgU2V0KClcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtTZXQ8SXRlbT59XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBpdGVtc0JlZm9yZU9yaWdpbiA9IG5ldyBTZXQoKVxuICAgICAgICAvLyBMZXQgYyBpbiBjb25mbGljdGluZ0l0ZW1zLCBiIGluIGl0ZW1zQmVmb3JlT3JpZ2luXG4gICAgICAgIC8vICoqKntvcmlnaW59YmJiYnt0aGlzfXtjLGJ9e2MsYn17b30qKipcbiAgICAgICAgLy8gTm90ZSB0aGF0IGNvbmZsaWN0aW5nSXRlbXMgaXMgYSBzdWJzZXQgb2YgaXRlbXNCZWZvcmVPcmlnaW5cbiAgICAgICAgd2hpbGUgKG8gIT09IG51bGwgJiYgbyAhPT0gdGhpcy5yaWdodCkge1xuICAgICAgICAgIGl0ZW1zQmVmb3JlT3JpZ2luLmFkZChvKVxuICAgICAgICAgIGNvbmZsaWN0aW5nSXRlbXMuYWRkKG8pXG4gICAgICAgICAgaWYgKGNvbXBhcmVJRHModGhpcy5vcmlnaW4sIG8ub3JpZ2luKSkge1xuICAgICAgICAgICAgLy8gY2FzZSAxXG4gICAgICAgICAgICBpZiAoby5pZC5jbGllbnQgPCB0aGlzLmlkLmNsaWVudCkge1xuICAgICAgICAgICAgICBsZWZ0ID0gb1xuICAgICAgICAgICAgICBjb25mbGljdGluZ0l0ZW1zLmNsZWFyKClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tcGFyZUlEcyh0aGlzLnJpZ2h0T3JpZ2luLCBvLnJpZ2h0T3JpZ2luKSkge1xuICAgICAgICAgICAgICAvLyB0aGlzIGFuZCBvIGFyZSBjb25mbGljdGluZyBhbmQgcG9pbnQgdG8gdGhlIHNhbWUgaW50ZWdyYXRpb24gcG9pbnRzLiBUaGUgaWQgZGVjaWRlcyB3aGljaCBpdGVtIGNvbWVzIGZpcnN0LlxuICAgICAgICAgICAgICAvLyBTaW5jZSB0aGlzIGlzIHRvIHRoZSBsZWZ0IG9mIG8sIHdlIGNhbiBicmVhayBoZXJlXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IC8vIGVsc2UsIG8gbWlnaHQgYmUgaW50ZWdyYXRlZCBiZWZvcmUgYW4gaXRlbSB0aGF0IHRoaXMgY29uZmxpY3RzIHdpdGguIElmIHNvLCB3ZSB3aWxsIGZpbmQgaXQgaW4gdGhlIG5leHQgaXRlcmF0aW9uc1xuICAgICAgICAgIH0gZWxzZSBpZiAoby5vcmlnaW4gIT09IG51bGwgJiYgaXRlbXNCZWZvcmVPcmlnaW4uaGFzKGdldEl0ZW0odHJhbnNhY3Rpb24uZG9jLnN0b3JlLCBvLm9yaWdpbikpKSB7IC8vIHVzZSBnZXRJdGVtIGluc3RlYWQgb2YgZ2V0SXRlbUNsZWFuRW5kIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCAvIG5lZWQgdG8gc3BsaXQgaXRlbXMuXG4gICAgICAgICAgICAvLyBjYXNlIDJcbiAgICAgICAgICAgIGlmICghY29uZmxpY3RpbmdJdGVtcy5oYXMoZ2V0SXRlbSh0cmFuc2FjdGlvbi5kb2Muc3RvcmUsIG8ub3JpZ2luKSkpIHtcbiAgICAgICAgICAgICAgbGVmdCA9IG9cbiAgICAgICAgICAgICAgY29uZmxpY3RpbmdJdGVtcy5jbGVhcigpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIG8gPSBvLnJpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdFxuICAgICAgfVxuICAgICAgLy8gcmVjb25uZWN0IGxlZnQvcmlnaHQgKyB1cGRhdGUgcGFyZW50IG1hcC9zdGFydCBpZiBuZWNlc3NhcnlcbiAgICAgIGlmICh0aGlzLmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLmxlZnQucmlnaHRcbiAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0XG4gICAgICAgIHRoaXMubGVmdC5yaWdodCA9IHRoaXNcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCByXG4gICAgICAgIGlmICh0aGlzLnBhcmVudFN1YiAhPT0gbnVsbCkge1xuICAgICAgICAgIHIgPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLl9tYXAuZ2V0KHRoaXMucGFyZW50U3ViKSB8fCBudWxsXG4gICAgICAgICAgd2hpbGUgKHIgIT09IG51bGwgJiYgci5sZWZ0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByID0gci5sZWZ0XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHIgPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLl9zdGFydFxuICAgICAgICAgIDsvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLl9zdGFydCA9IHRoaXNcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJpZ2h0ID0gclxuICAgICAgfVxuICAgICAgaWYgKHRoaXMucmlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5yaWdodC5sZWZ0ID0gdGhpc1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudFN1YiAhPT0gbnVsbCkge1xuICAgICAgICAvLyBzZXQgYXMgY3VycmVudCBwYXJlbnQgdmFsdWUgaWYgcmlnaHQgPT09IG51bGwgYW5kIHRoaXMgaXMgcGFyZW50U3ViXG4gICAgICAgIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0aGlzLnBhcmVudCkuX21hcC5zZXQodGhpcy5wYXJlbnRTdWIsIHRoaXMpXG4gICAgICAgIGlmICh0aGlzLmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyB0aGlzIGlzIHRoZSBjdXJyZW50IGF0dHJpYnV0ZSB2YWx1ZSBvZiBwYXJlbnQuIGRlbGV0ZSByaWdodFxuICAgICAgICAgIHRoaXMubGVmdC5kZWxldGUodHJhbnNhY3Rpb24pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGFkanVzdCBsZW5ndGggb2YgcGFyZW50XG4gICAgICBpZiAodGhpcy5wYXJlbnRTdWIgPT09IG51bGwgJiYgdGhpcy5jb3VudGFibGUgJiYgIXRoaXMuZGVsZXRlZCkge1xuICAgICAgICAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLl9sZW5ndGggKz0gdGhpcy5sZW5ndGhcbiAgICAgIH1cbiAgICAgIGFkZFN0cnVjdCh0cmFuc2FjdGlvbi5kb2Muc3RvcmUsIHRoaXMpXG4gICAgICB0aGlzLmNvbnRlbnQuaW50ZWdyYXRlKHRyYW5zYWN0aW9uLCB0aGlzKVxuICAgICAgLy8gYWRkIHBhcmVudCB0byB0cmFuc2FjdGlvbi5jaGFuZ2VkXG4gICAgICBhZGRDaGFuZ2VkVHlwZVRvVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0aGlzLnBhcmVudCksIHRoaXMucGFyZW50U3ViKVxuICAgICAgaWYgKCgvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpLl9pdGVtICE9PSBudWxsICYmIC8qKiBAdHlwZSB7QWJzdHJhY3RUeXBlPGFueT59ICovICh0aGlzLnBhcmVudCkuX2l0ZW0uZGVsZXRlZCkgfHwgKHRoaXMucGFyZW50U3ViICE9PSBudWxsICYmIHRoaXMucmlnaHQgIT09IG51bGwpKSB7XG4gICAgICAgIC8vIGRlbGV0ZSBpZiBwYXJlbnQgaXMgZGVsZXRlZCBvciBpZiB0aGlzIGlzIG5vdCB0aGUgY3VycmVudCBhdHRyaWJ1dGUgdmFsdWUgb2YgcGFyZW50XG4gICAgICAgIHRoaXMuZGVsZXRlKHRyYW5zYWN0aW9uKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBwYXJlbnQgaXMgbm90IGRlZmluZWQuIEludGVncmF0ZSBHQyBzdHJ1Y3QgaW5zdGVhZFxuICAgICAgbmV3IEdDKHRoaXMuaWQsIHRoaXMubGVuZ3RoKS5pbnRlZ3JhdGUodHJhbnNhY3Rpb24sIDApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG5leHQgbm9uLWRlbGV0ZWQgaXRlbVxuICAgKi9cbiAgZ2V0IG5leHQgKCkge1xuICAgIGxldCBuID0gdGhpcy5yaWdodFxuICAgIHdoaWxlIChuICE9PSBudWxsICYmIG4uZGVsZXRlZCkge1xuICAgICAgbiA9IG4ucmlnaHRcbiAgICB9XG4gICAgcmV0dXJuIG5cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwcmV2aW91cyBub24tZGVsZXRlZCBpdGVtXG4gICAqL1xuICBnZXQgcHJldiAoKSB7XG4gICAgbGV0IG4gPSB0aGlzLmxlZnRcbiAgICB3aGlsZSAobiAhPT0gbnVsbCAmJiBuLmRlbGV0ZWQpIHtcbiAgICAgIG4gPSBuLmxlZnRcbiAgICB9XG4gICAgcmV0dXJuIG5cbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgbGFzdCBjb250ZW50IGFkZHJlc3Mgb2YgdGhpcyBJdGVtLlxuICAgKi9cbiAgZ2V0IGxhc3RJZCAoKSB7XG4gICAgLy8gYWxsb2NhdGluZyBpZHMgaXMgcHJldHR5IGNvc3RseSBiZWNhdXNlIG9mIHRoZSBhbW91bnQgb2YgaWRzIGNyZWF0ZWQsIHNvIHdlIHRyeSB0byByZXVzZSB3aGVuZXZlciBwb3NzaWJsZVxuICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PT0gMSA/IHRoaXMuaWQgOiBjcmVhdGVJRCh0aGlzLmlkLmNsaWVudCwgdGhpcy5pZC5jbG9jayArIHRoaXMubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8qKlxuICAgKiBUcnkgdG8gbWVyZ2UgdHdvIGl0ZW1zXG4gICAqXG4gICAqIEBwYXJhbSB7SXRlbX0gcmlnaHRcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIG1lcmdlV2l0aCAocmlnaHQpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLmNvbnN0cnVjdG9yID09PSByaWdodC5jb25zdHJ1Y3RvciAmJlxuICAgICAgY29tcGFyZUlEcyhyaWdodC5vcmlnaW4sIHRoaXMubGFzdElkKSAmJlxuICAgICAgdGhpcy5yaWdodCA9PT0gcmlnaHQgJiZcbiAgICAgIGNvbXBhcmVJRHModGhpcy5yaWdodE9yaWdpbiwgcmlnaHQucmlnaHRPcmlnaW4pICYmXG4gICAgICB0aGlzLmlkLmNsaWVudCA9PT0gcmlnaHQuaWQuY2xpZW50ICYmXG4gICAgICB0aGlzLmlkLmNsb2NrICsgdGhpcy5sZW5ndGggPT09IHJpZ2h0LmlkLmNsb2NrICYmXG4gICAgICB0aGlzLmRlbGV0ZWQgPT09IHJpZ2h0LmRlbGV0ZWQgJiZcbiAgICAgIHRoaXMucmVkb25lID09PSBudWxsICYmXG4gICAgICByaWdodC5yZWRvbmUgPT09IG51bGwgJiZcbiAgICAgIHRoaXMuY29udGVudC5jb25zdHJ1Y3RvciA9PT0gcmlnaHQuY29udGVudC5jb25zdHJ1Y3RvciAmJlxuICAgICAgdGhpcy5jb250ZW50Lm1lcmdlV2l0aChyaWdodC5jb250ZW50KVxuICAgICkge1xuICAgICAgY29uc3Qgc2VhcmNoTWFya2VyID0gLyoqIEB0eXBlIHtBYnN0cmFjdFR5cGU8YW55Pn0gKi8gKHRoaXMucGFyZW50KS5fc2VhcmNoTWFya2VyXG4gICAgICBpZiAoc2VhcmNoTWFya2VyKSB7XG4gICAgICAgIHNlYXJjaE1hcmtlci5mb3JFYWNoKG1hcmtlciA9PiB7XG4gICAgICAgICAgaWYgKG1hcmtlci5wID09PSByaWdodCkge1xuICAgICAgICAgICAgLy8gcmlnaHQgaXMgZ29pbmcgdG8gYmUgXCJmb3Jnb3R0ZW5cIiBzbyB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbWFya2VyXG4gICAgICAgICAgICBtYXJrZXIucCA9IHRoaXNcbiAgICAgICAgICAgIC8vIGFkanVzdCBtYXJrZXIgaW5kZXhcbiAgICAgICAgICAgIGlmICghdGhpcy5kZWxldGVkICYmIHRoaXMuY291bnRhYmxlKSB7XG4gICAgICAgICAgICAgIG1hcmtlci5pbmRleCAtPSB0aGlzLmxlbmd0aFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodC5rZWVwKSB7XG4gICAgICAgIHRoaXMua2VlcCA9IHRydWVcbiAgICAgIH1cbiAgICAgIHRoaXMucmlnaHQgPSByaWdodC5yaWdodFxuICAgICAgaWYgKHRoaXMucmlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5yaWdodC5sZWZ0ID0gdGhpc1xuICAgICAgfVxuICAgICAgdGhpcy5sZW5ndGggKz0gcmlnaHQubGVuZ3RoXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrIHRoaXMgSXRlbSBhcyBkZWxldGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKi9cbiAgZGVsZXRlICh0cmFuc2FjdGlvbikge1xuICAgIGlmICghdGhpcy5kZWxldGVkKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpXG4gICAgICAvLyBhZGp1c3QgdGhlIGxlbmd0aCBvZiBwYXJlbnRcbiAgICAgIGlmICh0aGlzLmNvdW50YWJsZSAmJiB0aGlzLnBhcmVudFN1YiA9PT0gbnVsbCkge1xuICAgICAgICBwYXJlbnQuX2xlbmd0aCAtPSB0aGlzLmxlbmd0aFxuICAgICAgfVxuICAgICAgdGhpcy5tYXJrRGVsZXRlZCgpXG4gICAgICBhZGRUb0RlbGV0ZVNldCh0cmFuc2FjdGlvbi5kZWxldGVTZXQsIHRoaXMuaWQuY2xpZW50LCB0aGlzLmlkLmNsb2NrLCB0aGlzLmxlbmd0aClcbiAgICAgIGFkZENoYW5nZWRUeXBlVG9UcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgcGFyZW50LCB0aGlzLnBhcmVudFN1YilcbiAgICAgIHRoaXMuY29udGVudC5kZWxldGUodHJhbnNhY3Rpb24pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RydWN0U3RvcmV9IHN0b3JlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcGFyZW50R0NkXG4gICAqL1xuICBnYyAoc3RvcmUsIHBhcmVudEdDZCkge1xuICAgIGlmICghdGhpcy5kZWxldGVkKSB7XG4gICAgICB0aHJvdyBlcnJvci51bmV4cGVjdGVkQ2FzZSgpXG4gICAgfVxuICAgIHRoaXMuY29udGVudC5nYyhzdG9yZSlcbiAgICBpZiAocGFyZW50R0NkKSB7XG4gICAgICByZXBsYWNlU3RydWN0KHN0b3JlLCB0aGlzLCBuZXcgR0ModGhpcy5pZCwgdGhpcy5sZW5ndGgpKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbnRlbnQgPSBuZXcgQ29udGVudERlbGV0ZWQodGhpcy5sZW5ndGgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybSB0aGUgcHJvcGVydGllcyBvZiB0aGlzIHR5cGUgdG8gYmluYXJ5IGFuZCB3cml0ZSBpdCB0byBhblxuICAgKiBCaW5hcnlFbmNvZGVyLlxuICAgKlxuICAgKiBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoaXMgSXRlbSBpcyBzZW50IHRvIGEgcmVtb3RlIHBlZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyIFRoZSBlbmNvZGVyIHRvIHdyaXRlIGRhdGEgdG8uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBjb25zdCBvcmlnaW4gPSBvZmZzZXQgPiAwID8gY3JlYXRlSUQodGhpcy5pZC5jbGllbnQsIHRoaXMuaWQuY2xvY2sgKyBvZmZzZXQgLSAxKSA6IHRoaXMub3JpZ2luXG4gICAgY29uc3QgcmlnaHRPcmlnaW4gPSB0aGlzLnJpZ2h0T3JpZ2luXG4gICAgY29uc3QgcGFyZW50U3ViID0gdGhpcy5wYXJlbnRTdWJcbiAgICBjb25zdCBpbmZvID0gKHRoaXMuY29udGVudC5nZXRSZWYoKSAmIGJpbmFyeS5CSVRTNSkgfFxuICAgICAgKG9yaWdpbiA9PT0gbnVsbCA/IDAgOiBiaW5hcnkuQklUOCkgfCAvLyBvcmlnaW4gaXMgZGVmaW5lZFxuICAgICAgKHJpZ2h0T3JpZ2luID09PSBudWxsID8gMCA6IGJpbmFyeS5CSVQ3KSB8IC8vIHJpZ2h0IG9yaWdpbiBpcyBkZWZpbmVkXG4gICAgICAocGFyZW50U3ViID09PSBudWxsID8gMCA6IGJpbmFyeS5CSVQ2KSAvLyBwYXJlbnRTdWIgaXMgbm9uLW51bGxcbiAgICBlbmNvZGVyLndyaXRlSW5mbyhpbmZvKVxuICAgIGlmIChvcmlnaW4gIT09IG51bGwpIHtcbiAgICAgIGVuY29kZXIud3JpdGVMZWZ0SUQob3JpZ2luKVxuICAgIH1cbiAgICBpZiAocmlnaHRPcmlnaW4gIT09IG51bGwpIHtcbiAgICAgIGVuY29kZXIud3JpdGVSaWdodElEKHJpZ2h0T3JpZ2luKVxuICAgIH1cbiAgICBpZiAob3JpZ2luID09PSBudWxsICYmIHJpZ2h0T3JpZ2luID09PSBudWxsKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSAvKiogQHR5cGUge0Fic3RyYWN0VHlwZTxhbnk+fSAqLyAodGhpcy5wYXJlbnQpXG4gICAgICBpZiAocGFyZW50Ll9pdGVtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgcGFyZW50SXRlbSA9IHBhcmVudC5faXRlbVxuICAgICAgICBpZiAocGFyZW50SXRlbSA9PT0gbnVsbCkge1xuICAgICAgICAgIC8vIHBhcmVudCB0eXBlIG9uIHkuX21hcFxuICAgICAgICAgIC8vIGZpbmQgdGhlIGNvcnJlY3Qga2V5XG4gICAgICAgICAgY29uc3QgeWtleSA9IGZpbmRSb290VHlwZUtleShwYXJlbnQpXG4gICAgICAgICAgZW5jb2Rlci53cml0ZVBhcmVudEluZm8odHJ1ZSkgLy8gd3JpdGUgcGFyZW50WUtleVxuICAgICAgICAgIGVuY29kZXIud3JpdGVTdHJpbmcoeWtleSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbmNvZGVyLndyaXRlUGFyZW50SW5mbyhmYWxzZSkgLy8gd3JpdGUgcGFyZW50IGlkXG4gICAgICAgICAgZW5jb2Rlci53cml0ZUxlZnRJRChwYXJlbnRJdGVtLmlkKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBhcmVudC5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nKSB7IC8vIHRoaXMgZWRnZSBjYXNlIHdhcyBhZGRlZCBieSBkaWZmZXJlbnRpYWwgdXBkYXRlc1xuICAgICAgICBlbmNvZGVyLndyaXRlUGFyZW50SW5mbyh0cnVlKSAvLyB3cml0ZSBwYXJlbnRZS2V5XG4gICAgICAgIGVuY29kZXIud3JpdGVTdHJpbmcocGFyZW50KVxuICAgICAgfSBlbHNlIGlmIChwYXJlbnQuY29uc3RydWN0b3IgPT09IElEKSB7XG4gICAgICAgIGVuY29kZXIud3JpdGVQYXJlbnRJbmZvKGZhbHNlKSAvLyB3cml0ZSBwYXJlbnQgaWRcbiAgICAgICAgZW5jb2Rlci53cml0ZUxlZnRJRChwYXJlbnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvci51bmV4cGVjdGVkQ2FzZSgpXG4gICAgICB9XG4gICAgICBpZiAocGFyZW50U3ViICE9PSBudWxsKSB7XG4gICAgICAgIGVuY29kZXIud3JpdGVTdHJpbmcocGFyZW50U3ViKVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvbnRlbnQud3JpdGUoZW5jb2Rlciwgb2Zmc2V0KVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjJ9IGRlY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmZvXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkSXRlbUNvbnRlbnQgPSAoZGVjb2RlciwgaW5mbykgPT4gY29udGVudFJlZnNbaW5mbyAmIGJpbmFyeS5CSVRTNV0oZGVjb2RlcilcblxuLyoqXG4gKiBBIGxvb2t1cCBtYXAgZm9yIHJlYWRpbmcgSXRlbSBjb250ZW50LlxuICpcbiAqIEB0eXBlIHtBcnJheTxmdW5jdGlvbihVcGRhdGVEZWNvZGVyVjEgfCBVcGRhdGVEZWNvZGVyVjIpOkFic3RyYWN0Q29udGVudD59XG4gKi9cbmV4cG9ydCBjb25zdCBjb250ZW50UmVmcyA9IFtcbiAgKCkgPT4geyBlcnJvci51bmV4cGVjdGVkQ2FzZSgpIH0sIC8vIEdDIGlzIG5vdCBJdGVtQ29udGVudFxuICByZWFkQ29udGVudERlbGV0ZWQsIC8vIDFcbiAgcmVhZENvbnRlbnRKU09OLCAvLyAyXG4gIHJlYWRDb250ZW50QmluYXJ5LCAvLyAzXG4gIHJlYWRDb250ZW50U3RyaW5nLCAvLyA0XG4gIHJlYWRDb250ZW50RW1iZWQsIC8vIDVcbiAgcmVhZENvbnRlbnRGb3JtYXQsIC8vIDZcbiAgcmVhZENvbnRlbnRUeXBlLCAvLyA3XG4gIHJlYWRDb250ZW50QW55LCAvLyA4XG4gIHJlYWRDb250ZW50RG9jLCAvLyA5XG4gICgpID0+IHsgZXJyb3IudW5leHBlY3RlZENhc2UoKSB9IC8vIDEwIC0gU2tpcCBpcyBub3QgSXRlbUNvbnRlbnRcbl1cblxuLyoqXG4gKiBEbyBub3QgaW1wbGVtZW50IHRoaXMgY2xhc3MhXG4gKi9cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdENvbnRlbnQge1xuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0TGVuZ3RoICgpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgZ2V0Q29udGVudCAoKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogU2hvdWxkIHJldHVybiBmYWxzZSBpZiB0aGlzIEl0ZW0gaXMgc29tZSBraW5kIG9mIG1ldGEgaW5mb3JtYXRpb25cbiAgICogKGUuZy4gZm9ybWF0IGluZm9ybWF0aW9uKS5cbiAgICpcbiAgICogKiBXaGV0aGVyIHRoaXMgSXRlbSBzaG91bGQgYmUgYWRkcmVzc2FibGUgdmlhIGB5YXJyYXkuZ2V0KGkpYFxuICAgKiAqIFdoZXRoZXIgdGhpcyBJdGVtIHNob3VsZCBiZSBjb3VudGVkIHdoZW4gY29tcHV0aW5nIHlhcnJheS5sZW5ndGhcbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzQ291bnRhYmxlICgpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtBYnN0cmFjdENvbnRlbnR9XG4gICAqL1xuICBjb3B5ICgpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gX29mZnNldFxuICAgKiBAcmV0dXJuIHtBYnN0cmFjdENvbnRlbnR9XG4gICAqL1xuICBzcGxpY2UgKF9vZmZzZXQpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Fic3RyYWN0Q29udGVudH0gX3JpZ2h0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBtZXJnZVdpdGggKF9yaWdodCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IF90cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge0l0ZW19IF9pdGVtXG4gICAqL1xuICBpbnRlZ3JhdGUgKF90cmFuc2FjdGlvbiwgX2l0ZW0pIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSBfdHJhbnNhY3Rpb25cbiAgICovXG4gIGRlbGV0ZSAoX3RyYW5zYWN0aW9uKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gX3N0b3JlXG4gICAqL1xuICBnYyAoX3N0b3JlKSB7XG4gICAgdGhyb3cgZXJyb3IubWV0aG9kVW5pbXBsZW1lbnRlZCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtVcGRhdGVFbmNvZGVyVjEgfCBVcGRhdGVFbmNvZGVyVjJ9IF9lbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBfb2Zmc2V0XG4gICAqL1xuICB3cml0ZSAoX2VuY29kZXIsIF9vZmZzZXQpIHtcbiAgICB0aHJvdyBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXRSZWYgKCkge1xuICAgIHRocm93IGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG59XG4iLCAiaW1wb3J0IHtcbiAgQWJzdHJhY3RTdHJ1Y3QsXG4gIFVwZGF0ZUVuY29kZXJWMSwgVXBkYXRlRW5jb2RlclYyLCBTdHJ1Y3RTdG9yZSwgVHJhbnNhY3Rpb24sIElEIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn0gZnJvbSAnLi4vaW50ZXJuYWxzLmpzJ1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5cbmV4cG9ydCBjb25zdCBzdHJ1Y3RTa2lwUmVmTnVtYmVyID0gMTBcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgU2tpcCBleHRlbmRzIEFic3RyYWN0U3RydWN0IHtcbiAgZ2V0IGRlbGV0ZWQgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBkZWxldGUgKCkge31cblxuICAvKipcbiAgICogQHBhcmFtIHtTa2lwfSByaWdodFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgbWVyZ2VXaXRoIChyaWdodCkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yICE9PSByaWdodC5jb25zdHJ1Y3Rvcikge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHRoaXMubGVuZ3RoICs9IHJpZ2h0Lmxlbmd0aFxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKi9cbiAgaW50ZWdyYXRlICh0cmFuc2FjdGlvbiwgb2Zmc2V0KSB7XG4gICAgLy8gc2tpcCBzdHJ1Y3RzIGNhbm5vdCBiZSBpbnRlZ3JhdGVkXG4gICAgZXJyb3IudW5leHBlY3RlZENhc2UoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXBkYXRlRW5jb2RlclYxIHwgVXBkYXRlRW5jb2RlclYyfSBlbmNvZGVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICovXG4gIHdyaXRlIChlbmNvZGVyLCBvZmZzZXQpIHtcbiAgICBlbmNvZGVyLndyaXRlSW5mbyhzdHJ1Y3RTa2lwUmVmTnVtYmVyKVxuICAgIC8vIHdyaXRlIGFzIFZhclVpbnQgYmVjYXVzZSBTa2lwcyBjYW4ndCBtYWtlIHVzZSBvZiBwcmVkaWN0YWJsZSBsZW5ndGgtZW5jb2RpbmdcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2Rlci5yZXN0RW5jb2RlciwgdGhpcy5sZW5ndGggLSBvZmZzZXQpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtTdHJ1Y3RTdG9yZX0gc3RvcmVcbiAgICogQHJldHVybiB7bnVsbCB8IG51bWJlcn1cbiAgICovXG4gIGdldE1pc3NpbmcgKHRyYW5zYWN0aW9uLCBzdG9yZSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbn1cbiIsICIvKiogZXNsaW50LWVudiBicm93c2VyICovXG5cbmV4cG9ydCB7XG4gIERvYyxcbiAgVHJhbnNhY3Rpb24sXG4gIFlBcnJheSBhcyBBcnJheSxcbiAgWU1hcCBhcyBNYXAsXG4gIFlUZXh0IGFzIFRleHQsXG4gIFlYbWxUZXh0IGFzIFhtbFRleHQsXG4gIFlYbWxIb29rIGFzIFhtbEhvb2ssXG4gIFlYbWxFbGVtZW50IGFzIFhtbEVsZW1lbnQsXG4gIFlYbWxGcmFnbWVudCBhcyBYbWxGcmFnbWVudCxcbiAgWVhtbEV2ZW50LFxuICBZTWFwRXZlbnQsXG4gIFlBcnJheUV2ZW50LFxuICBZVGV4dEV2ZW50LFxuICBZRXZlbnQsXG4gIEl0ZW0sXG4gIEFic3RyYWN0U3RydWN0LFxuICBHQyxcbiAgU2tpcCxcbiAgQ29udGVudEJpbmFyeSxcbiAgQ29udGVudERlbGV0ZWQsXG4gIENvbnRlbnREb2MsXG4gIENvbnRlbnRFbWJlZCxcbiAgQ29udGVudEZvcm1hdCxcbiAgQ29udGVudEpTT04sXG4gIENvbnRlbnRBbnksXG4gIENvbnRlbnRTdHJpbmcsXG4gIENvbnRlbnRUeXBlLFxuICBBYnN0cmFjdFR5cGUsXG4gIGdldFR5cGVDaGlsZHJlbixcbiAgY3JlYXRlUmVsYXRpdmVQb3NpdGlvbkZyb21UeXBlSW5kZXgsXG4gIGNyZWF0ZVJlbGF0aXZlUG9zaXRpb25Gcm9tSlNPTixcbiAgY3JlYXRlQWJzb2x1dGVQb3NpdGlvbkZyb21SZWxhdGl2ZVBvc2l0aW9uLFxuICBjb21wYXJlUmVsYXRpdmVQb3NpdGlvbnMsXG4gIEFic29sdXRlUG9zaXRpb24sXG4gIFJlbGF0aXZlUG9zaXRpb24sXG4gIElELFxuICBjcmVhdGVJRCxcbiAgY29tcGFyZUlEcyxcbiAgZ2V0U3RhdGUsXG4gIFNuYXBzaG90LFxuICBjcmVhdGVTbmFwc2hvdCxcbiAgY3JlYXRlRGVsZXRlU2V0LFxuICBjcmVhdGVEZWxldGVTZXRGcm9tU3RydWN0U3RvcmUsXG4gIGNsZWFudXBZVGV4dEZvcm1hdHRpbmcsXG4gIHNuYXBzaG90LFxuICBlbXB0eVNuYXBzaG90LFxuICBmaW5kUm9vdFR5cGVLZXksXG4gIGZpbmRJbmRleFNTLFxuICBnZXRJdGVtLFxuICB0eXBlTGlzdFRvQXJyYXlTbmFwc2hvdCxcbiAgdHlwZU1hcEdldFNuYXBzaG90LFxuICB0eXBlTWFwR2V0QWxsU25hcHNob3QsXG4gIGNyZWF0ZURvY0Zyb21TbmFwc2hvdCxcbiAgaXRlcmF0ZURlbGV0ZWRTdHJ1Y3RzLFxuICBhcHBseVVwZGF0ZSxcbiAgYXBwbHlVcGRhdGVWMixcbiAgcmVhZFVwZGF0ZSxcbiAgcmVhZFVwZGF0ZVYyLFxuICBlbmNvZGVTdGF0ZUFzVXBkYXRlLFxuICBlbmNvZGVTdGF0ZUFzVXBkYXRlVjIsXG4gIGVuY29kZVN0YXRlVmVjdG9yLFxuICBVbmRvTWFuYWdlcixcbiAgZGVjb2RlU25hcHNob3QsXG4gIGVuY29kZVNuYXBzaG90LFxuICBkZWNvZGVTbmFwc2hvdFYyLFxuICBlbmNvZGVTbmFwc2hvdFYyLFxuICBkZWNvZGVTdGF0ZVZlY3RvcixcbiAgbG9nVXBkYXRlLFxuICBsb2dVcGRhdGVWMixcbiAgZGVjb2RlVXBkYXRlLFxuICBkZWNvZGVVcGRhdGVWMixcbiAgcmVsYXRpdmVQb3NpdGlvblRvSlNPTixcbiAgaXNEZWxldGVkLFxuICBpc1BhcmVudE9mLFxuICBlcXVhbFNuYXBzaG90cyxcbiAgUGVybWFuZW50VXNlckRhdGEsIC8vIEBUT0RPIGV4cGVyaW1lbnRhbFxuICB0cnlHYyxcbiAgdHJhbnNhY3QsXG4gIEFic3RyYWN0Q29ubmVjdG9yLFxuICBsb2dUeXBlLFxuICBtZXJnZVVwZGF0ZXMsXG4gIG1lcmdlVXBkYXRlc1YyLFxuICBwYXJzZVVwZGF0ZU1ldGEsXG4gIHBhcnNlVXBkYXRlTWV0YVYyLFxuICBlbmNvZGVTdGF0ZVZlY3RvckZyb21VcGRhdGUsXG4gIGVuY29kZVN0YXRlVmVjdG9yRnJvbVVwZGF0ZVYyLFxuICBlbmNvZGVSZWxhdGl2ZVBvc2l0aW9uLFxuICBkZWNvZGVSZWxhdGl2ZVBvc2l0aW9uLFxuICBkaWZmVXBkYXRlLFxuICBkaWZmVXBkYXRlVjIsXG4gIGNvbnZlcnRVcGRhdGVGb3JtYXRWMVRvVjIsXG4gIGNvbnZlcnRVcGRhdGVGb3JtYXRWMlRvVjEsXG4gIG9iZnVzY2F0ZVVwZGF0ZSxcbiAgb2JmdXNjYXRlVXBkYXRlVjIsXG4gIFVwZGF0ZUVuY29kZXJWMSxcbiAgVXBkYXRlRW5jb2RlclYyLFxuICBVcGRhdGVEZWNvZGVyVjEsXG4gIFVwZGF0ZURlY29kZXJWMixcbiAgZXF1YWxEZWxldGVTZXRzLFxuICBtZXJnZURlbGV0ZVNldHMsXG4gIHNuYXBzaG90Q29udGFpbnNVcGRhdGVcbn0gZnJvbSAnLi9pbnRlcm5hbHMuanMnXG5cbmNvbnN0IGdsbyA9IC8qKiBAdHlwZSB7YW55fSAqLyAodHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gID8gZ2xvYmFsVGhpc1xuICA6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgPyB3aW5kb3dcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHt9KVxuXG5jb25zdCBpbXBvcnRJZGVudGlmaWVyID0gJ19fICRZSlMkIF9fJ1xuXG5pZiAoZ2xvW2ltcG9ydElkZW50aWZpZXJdID09PSB0cnVlKSB7XG4gIC8qKlxuICAgKiBEZWFyIHJlYWRlciBvZiB0aGlzIG1lc3NhZ2UuIFBsZWFzZSB0YWtlIHRoaXMgc2VyaW91c2x5LlxuICAgKlxuICAgKiBJZiB5b3Ugc2VlIHRoaXMgbWVzc2FnZSwgbWFrZSBzdXJlIHRoYXQgeW91IG9ubHkgaW1wb3J0IG9uZSB2ZXJzaW9uIG9mIFlqcy4gSW4gbWFueSBjYXNlcyxcbiAgICogeW91ciBwYWNrYWdlIG1hbmFnZXIgaW5zdGFsbHMgdHdvIHZlcnNpb25zIG9mIFlqcyB0aGF0IGFyZSB1c2VkIGJ5IGRpZmZlcmVudCBwYWNrYWdlcyB3aXRoaW4geW91ciBwcm9qZWN0LlxuICAgKiBBbm90aGVyIHJlYXNvbiBmb3IgdGhpcyBtZXNzYWdlIGlzIHRoYXQgc29tZSBwYXJ0cyBvZiB5b3VyIHByb2plY3QgdXNlIHRoZSBjb21tb25qcyB2ZXJzaW9uIG9mIFlqc1xuICAgKiBhbmQgb3RoZXJzIHVzZSB0aGUgRWNtYVNjcmlwdCB2ZXJzaW9uIG9mIFlqcy5cbiAgICpcbiAgICogVGhpcyBvZnRlbiBsZWFkcyB0byBpc3N1ZXMgdGhhdCBhcmUgaGFyZCB0byBkZWJ1Zy4gV2Ugb2Z0ZW4gbmVlZCB0byBwZXJmb3JtIGNvbnN0cnVjdG9yIGNoZWNrcyxcbiAgICogZS5nLiBgc3RydWN0IGluc3RhbmNlb2YgR0NgLiBJZiB5b3UgaW1wb3J0ZWQgZGlmZmVyZW50IHZlcnNpb25zIG9mIFlqcywgaXQgaXMgaW1wb3NzaWJsZSBmb3IgdXMgdG9cbiAgICogZG8gdGhlIGNvbnN0cnVjdG9yIGNoZWNrcyBhbnltb3JlIC0gd2hpY2ggbWlnaHQgYnJlYWsgdGhlIENSRFQgYWxnb3JpdGhtLlxuICAgKlxuICAgKiBodHRwczovL2dpdGh1Yi5jb20veWpzL3lqcy9pc3N1ZXMvNDM4XG4gICAqL1xuICBjb25zb2xlLmVycm9yKCdZanMgd2FzIGFscmVhZHkgaW1wb3J0ZWQuIFRoaXMgYnJlYWtzIGNvbnN0cnVjdG9yIGNoZWNrcyBhbmQgd2lsbCBsZWFkIHRvIGlzc3VlcyEgLSBodHRwczovL2dpdGh1Yi5jb20veWpzL3lqcy9pc3N1ZXMvNDM4Jylcbn1cbmdsb1tpbXBvcnRJZGVudGlmaWVyXSA9IHRydWVcbiIsICJpbXBvcnQgKiBhcyBZIGZyb20gXCIuL2luZGV4XCJcblxudHlwZSBtYW5hZ2VkVHlwZSA9IFkuTWFwPGFueT4gfCBZLkFycmF5PGFueT4gfCBzdHJpbmcgfCBudW1iZXJcbnR5cGUgc3VwcG9ydGVkVHlwZSA9IG9iamVjdCB8IHN0cmluZyB8IG51bWJlclxuXG5leHBvcnQgZnVuY3Rpb24gZGVlcEVxdWFscyhtYW5hZ2VkOiBtYW5hZ2VkVHlwZSwgdGFyZ2V0OiBzdXBwb3J0ZWRUeXBlIHwgc3VwcG9ydGVkVHlwZVtdKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbWFuYWdlZFR5cGUgPSBkZXRlY3RNYW5hZ2VkVHlwZShtYW5hZ2VkKVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHRhcmdldFR5cGUgPSB0YXJnZXQuY29uc3RydWN0b3IubmFtZVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGFyZ2V0VHlwZSA9IFwidW5kZWZpbmVkXCJcbiAgICB9XG5cbiAgICBpZiAobWFuYWdlZFR5cGUgPT0gXCJZQXJyYXlcIiAmJiB0YXJnZXRUeXBlID09IFwiQXJyYXlcIikge1xuICAgICAgICBjb25zdCB0YXJnZXRBcnJheSA9ICh0YXJnZXQgYXMgQXJyYXk8YW55PilcbiAgICAgICAgY29uc3QgbWFuYWdlZEFycmF5ID0gKG1hbmFnZWQgYXMgWS5BcnJheTxhbnk+KVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG1hbmFnZWRBcnJheS5sZW5ndGggPT0gdGFyZ2V0QXJyYXkubGVuZ3RoICYmIHRhcmdldEFycmF5LmV2ZXJ5KCh0LCBpKSA9PiBkZWVwRXF1YWxzKG1hbmFnZWRBcnJheS5nZXQoaSksIHRhcmdldEFycmF5W2ldKSlcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH0gZWxzZSBpZiAobWFuYWdlZFR5cGUgPT0gXCJZTWFwXCIgJiYgdGFyZ2V0VHlwZSA9PSBcIk9iamVjdFwiKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldE1hcCA9ICh0YXJnZXQgYXMgUmVjb3JkPHN0cmluZywgYW55PilcbiAgICAgICAgY29uc3QgbWFuYWdlZE1hcCA9IChtYW5hZ2VkIGFzIFkuTWFwPGFueT4pXG5cbiAgICAgICAgbGV0IHRhcmdldEtleUNvdW50ID0gMFxuICAgICAgICBmb3IgKGxldCB0YXJnZXRLZXkgaW4gdGFyZ2V0TWFwKSB7XG4gICAgICAgICAgICB0YXJnZXRLZXlDb3VudCsrXG4gICAgICAgICAgICBpZiAoIWRlZXBFcXVhbHMobWFuYWdlZE1hcC5nZXQodGFyZ2V0S2V5KSwgdGFyZ2V0TWFwW3RhcmdldEtleV0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRhcmdldEtleUNvdW50ID09IEFycmF5LmZyb20obWFuYWdlZE1hcC5rZXlzKCkpLmxlbmd0aFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQgPT09IG1hbmFnZWRcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzeW5jcm9uaXplKFxuICAgIG1hbmFnZWRPYmo6IFkuTWFwPGFueT4gfCBZLkFycmF5PGFueT4sXG4gICAgdGFyZ2V0T2JqOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgYW55W10sXG4pOiBib29sZWFuIHtcblxuICAgIGxldCBjaGFuZ2VkID0gZmFsc2VcblxuICAgIGNvbnN0IG1hbmFnZWRUeXBlID0gZGV0ZWN0TWFuYWdlZFR5cGUobWFuYWdlZE9iailcblxuICAgIHN3aXRjaCAobWFuYWdlZFR5cGUpIHtcbiAgICAgICAgY2FzZSBcIllBcnJheVwiOlxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRhcmdldE9iaikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFN5bmMgZmFpbGVkLCAke3RhcmdldE9ian0gd2FzIG5vdCBhcnJheWApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1hbmFnZWRBcnJheSA9IG1hbmFnZWRPYmogYXMgWS5BcnJheTxhbnk+XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRBcnJheSA9IHRhcmdldE9iaiBhcyBhbnlbXVxuICAgICAgICAgICAgY29uc3Qgb3V0T2ZSYW5nZSA9IFN5bWJvbCgpXG5cbiAgICAgICAgICAgIGxldCBjdXJzb3IgPSAwXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IG1hdGNoID0gZmFsc2VcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRWYWx1ZSA9IHRhcmdldEFycmF5W2ldXG4gICAgICAgICAgICAgICAgY29uc3QgbGVuID0gKG1hbmFnZWRBcnJheS5sZW5ndGggPiB0YXJnZXRBcnJheS5sZW5ndGgpID8gIG1hbmFnZWRBcnJheS5sZW5ndGggOiB0YXJnZXRBcnJheS5sZW5ndGhcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gY3Vyc29yOyAhbWF0Y2ggJiYgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hbmFnZWRWYWx1ZSA9IChqIDwgbWFuYWdlZEFycmF5Lmxlbmd0aCkgPyBtYW5hZ2VkQXJyYXkuZ2V0KGopIDogb3V0T2ZSYW5nZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRWYWx1ZSA9IChpIDwgdGFyZ2V0QXJyYXkubGVuZ3RoKSA/IHRhcmdldEFycmF5W2ldIDogb3V0T2ZSYW5nZVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWVwRXF1YWxzKG1hbmFnZWRWYWx1ZSwgdGFyZ2V0VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gai0xOyB4ID49IGN1cnNvcjsgeC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkQXJyYXkuZGVsZXRlKHgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWxldGVkQ291bnQgPSBqIC0gY3Vyc29yXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IgPSBqKzEgLSBkZWxldGVkQ291bnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZFR5cGUgPSB0YXJnZXRWYWx1ZS5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkVHlwZSA9IFwidW5kZWZpbmVkXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYW5hZ2VkQ2hpbGQgPSAoY3Vyc29yIDwgbWFuYWdlZEFycmF5Lmxlbmd0aCkgPyBtYW5hZ2VkQXJyYXkuZ2V0KGN1cnNvcikgOiBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hbmFnZWRUeXBlID0gZGV0ZWN0TWFuYWdlZFR5cGUobWFuYWdlZENoaWxkKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBpZiB0aGV5J3JlIGNvbXBhdGlibGUgdHlwZXMgd2Ugc2hvdWxkIGdvIGRlZXBlclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGVyZSB3YXMgbm8gZXhhY3QgbWF0Y2ggaW4gdGhlIGxpc3QsIHNvIGFzc3VtZSB0aGUgaW1tZWRpYXRlbHkgbmV4dCBvYmplY3Qgc2hvdWxkIGJlIHRoZSBtYXRjaFxuICAgICAgICAgICAgICAgICAgICBpZiAoKG1hbmFnZWRUeXBlID09IFwiWU1hcFwiICYmIGNoaWxkVHlwZSA9PSBcIk9iamVjdFwiKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKG1hbmFnZWRUeXBlID09IFwiWUFycmF5XCIgJiYgY2hpbGRUeXBlID09IFwiQXJyYXlcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5bmNyb25pemUobWFuYWdlZENoaWxkLCB0YXJnZXRWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZWRBcnJheS5pbnNlcnQoY3Vyc29yLCBbc3luY0NoaWxkKHRhcmdldFZhbHVlKV0pXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjdXJzb3IrK1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChtYW5hZ2VkQXJyYXkubGVuZ3RoID4gdGFyZ2V0QXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgICAgICAgICAgICBtYW5hZ2VkQXJyYXkuZGVsZXRlKHRhcmdldEFycmF5Lmxlbmd0aClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBcIllNYXBcIjpcbiAgICAgICAgICAgIGlmICh0YXJnZXRPYmouY29uc3RydWN0b3IubmFtZSAhPT0gXCJPYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgU3luYyBmYWlsZWQsICR7dGFyZ2V0T2JqfSB3YXMgbm90IG9iamVjdGApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1hbmFnZWRNYXAgPSBtYW5hZ2VkT2JqIGFzIFkuTWFwPGFueT5cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE1hcCA9IHRhcmdldE9iaiBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+XG5cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIG1hbmFnZWRNYXAua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIHRhcmdldE9iaikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXRlbSdzIGJlZW4gcmVtb3ZlZCBmcm9tIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkTWFwLmRlbGV0ZShrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IG1hbmFnZWRDaGlsZCA9IG1hbmFnZWRNYXAuZ2V0KGtleSlcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRDaGlsZCA9IHRhcmdldE1hcFtrZXldXG5cbiAgICAgICAgICAgICAgICBjb25zdCBtYW5hZ2VkVHlwZSA9IGRldGVjdE1hbmFnZWRUeXBlKG1hbmFnZWRDaGlsZClcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZFR5cGUgPSB0YXJnZXRDaGlsZC5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZFR5cGUgPSBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKChtYW5hZ2VkVHlwZSA9PSBcIllNYXBcIiAmJiBjaGlsZFR5cGUgIT09IFwiT2JqZWN0XCIpIHx8XG4gICAgICAgICAgICAgICAgICAgIChtYW5hZ2VkVHlwZSA9PSBcIllBcnJheVwiICYmIGNoaWxkVHlwZSAhPT0gXCJBcnJheVwiKSB8fFxuICAgICAgICAgICAgICAgICAgICAoIVtcIllNYXBcIiwgXCJZQXJyYXlcIl0uaW5jbHVkZXMobWFuYWdlZFR5cGUpICYmIG1hbmFnZWRUeXBlICE9PSBjaGlsZFR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBoYXMgZnVuZGFtZW50YWxseSBjaGFuZ2VkLCBkZWxldGUgdGhlIGV4aXN0aW5nIHJlY29yZCBhbmQgcmVjcmVhdGUgaXQgaW4gc2Vjb25kIHBhc3NcbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZE1hcC5kZWxldGUoa2V5KVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWFuYWdlZFR5cGUgPT0gXCJZTWFwXCIgfHwgbWFuYWdlZFR5cGUgPT0gXCJZQXJyYXlcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGV5IG1hdGNoIGluIHR5cGVzLCBzbyBnbyBkZWVwZXJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRDaGFuZ2VkID0gc3luY3Jvbml6ZShtYW5hZ2VkQ2hpbGQsIHRhcmdldENoaWxkKVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkIHx8PSBjaGlsZENoYW5nZWRcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGV5IGFyZSBub3QgY29tcGxleCB0eXBlcyBzbyBqdXN0IGFzc2lnbiBpdCBpbnRvIHRoZSBtYXBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hbmFnZWRDaGlsZCAhPT0gdGFyZ2V0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZWRNYXAuc2V0KGtleSwgdGFyZ2V0Q2hpbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB0YXJnZXRNYXApIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1hbmFnZWRNYXAuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBzeW5jQ2hpbGQodGFyZ2V0TWFwW2tleV0pXG5cbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZE1hcC5zZXQoa2V5LCBjaGlsZClcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjYW4gb25seSBpdGVyYXRlIG92ZXIgWS5NYXAgYW5kIFkuQXJyYXksIGdvdCAke21hbmFnZWRPYmp9YClcbiAgICB9XG4gICAgcmV0dXJuIGNoYW5nZWRcbn1cblxuZnVuY3Rpb24gc3luY0NoaWxkKGNoaWxkOiBhbnkpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBjaGlsZFR5cGUgPSBjaGlsZC5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjaGlsZFR5cGUgPSBcInVuZGVmaW5lZFwiXG4gICAgfVxuXG4gICAgaWYgKGNoaWxkVHlwZSA9PSBcIkFycmF5XCIpIHtcbiAgICAgICAgY29uc3QgYXJyID0gbmV3IFkuQXJyYXkoKVxuXG4gICAgICAgIHN5bmNyb25pemUoYXJyLGNoaWxkKVxuICAgICAgICByZXR1cm4gYXJyXG4gICAgfSBlbHNlIGlmIChjaGlsZFR5cGUgPT0gXCJPYmplY3RcIikge1xuICAgICAgICBjb25zdCBtYXAgPSBuZXcgWS5NYXAoKVxuXG4gICAgICAgIHN5bmNyb25pemUobWFwLCBjaGlsZClcbiAgICAgICAgcmV0dXJuIG1hcFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjaGlsZFxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGV0ZWN0TWFuYWdlZFR5cGUobWFuYWdlZDogYW55KTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAobWFuYWdlZC5sZW5ndGggIT09IHVuZGVmaW5lZCAmJiBtYW5hZ2VkLmdldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJZQXJyYXlcIlxuICAgICAgICB9IGVsc2UgaWYgKG1hbmFnZWQua2V5cyAhPT0gdW5kZWZpbmVkICYmIG1hbmFnZWQuZ2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBcIllNYXBcIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1hbmFnZWQuY29uc3RydWN0b3IubmFtZVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gXCJ1bmRlZmluZWRcIlxuICAgIH1cbn0iLCAiLyoqXG4gKiAgYmFzZTY0LnRzXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBCU0QgMy1DbGF1c2UgTGljZW5zZS5cbiAqICAgIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqXG4gKiAgUmVmZXJlbmNlczpcbiAqICAgIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0XG4gKlxuICogQGF1dGhvciBEYW4gS29nYWkgKGh0dHBzOi8vZ2l0aHViLmNvbS9kYW5rb2dhaSlcbiAqL1xuY29uc3QgdmVyc2lvbiA9ICczLjcuNyc7XG4vKipcbiAqIEBkZXByZWNhdGVkIHVzZSBsb3dlcmNhc2UgYHZlcnNpb25gLlxuICovXG5jb25zdCBWRVJTSU9OID0gdmVyc2lvbjtcbmNvbnN0IF9oYXNCdWZmZXIgPSB0eXBlb2YgQnVmZmVyID09PSAnZnVuY3Rpb24nO1xuY29uc3QgX1REID0gdHlwZW9mIFRleHREZWNvZGVyID09PSAnZnVuY3Rpb24nID8gbmV3IFRleHREZWNvZGVyKCkgOiB1bmRlZmluZWQ7XG5jb25zdCBfVEUgPSB0eXBlb2YgVGV4dEVuY29kZXIgPT09ICdmdW5jdGlvbicgPyBuZXcgVGV4dEVuY29kZXIoKSA6IHVuZGVmaW5lZDtcbmNvbnN0IGI2NGNoID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89JztcbmNvbnN0IGI2NGNocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGI2NGNoKTtcbmNvbnN0IGI2NHRhYiA9ICgoYSkgPT4ge1xuICAgIGxldCB0YWIgPSB7fTtcbiAgICBhLmZvckVhY2goKGMsIGkpID0+IHRhYltjXSA9IGkpO1xuICAgIHJldHVybiB0YWI7XG59KShiNjRjaHMpO1xuY29uc3QgYjY0cmUgPSAvXig/OltBLVphLXpcXGQrXFwvXXs0fSkqPyg/OltBLVphLXpcXGQrXFwvXXsyfSg/Oj09KT98W0EtWmEtelxcZCtcXC9dezN9PT8pPyQvO1xuY29uc3QgX2Zyb21DQyA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYmluZChTdHJpbmcpO1xuY29uc3QgX1U4QWZyb20gPSB0eXBlb2YgVWludDhBcnJheS5mcm9tID09PSAnZnVuY3Rpb24nXG4gICAgPyBVaW50OEFycmF5LmZyb20uYmluZChVaW50OEFycmF5KVxuICAgIDogKGl0KSA9PiBuZXcgVWludDhBcnJheShBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpdCwgMCkpO1xuY29uc3QgX21rVXJpU2FmZSA9IChzcmMpID0+IHNyY1xuICAgIC5yZXBsYWNlKC89L2csICcnKS5yZXBsYWNlKC9bK1xcL10vZywgKG0wKSA9PiBtMCA9PSAnKycgPyAnLScgOiAnXycpO1xuY29uc3QgX3RpZHlCNjQgPSAocykgPT4gcy5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL10vZywgJycpO1xuLyoqXG4gKiBwb2x5ZmlsbCB2ZXJzaW9uIG9mIGBidG9hYFxuICovXG5jb25zdCBidG9hUG9seWZpbGwgPSAoYmluKSA9PiB7XG4gICAgLy8gY29uc29sZS5sb2coJ3BvbHlmaWxsZWQnKTtcbiAgICBsZXQgdTMyLCBjMCwgYzEsIGMyLCBhc2MgPSAnJztcbiAgICBjb25zdCBwYWQgPSBiaW4ubGVuZ3RoICUgMztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbi5sZW5ndGg7KSB7XG4gICAgICAgIGlmICgoYzAgPSBiaW4uY2hhckNvZGVBdChpKyspKSA+IDI1NSB8fFxuICAgICAgICAgICAgKGMxID0gYmluLmNoYXJDb2RlQXQoaSsrKSkgPiAyNTUgfHxcbiAgICAgICAgICAgIChjMiA9IGJpbi5jaGFyQ29kZUF0KGkrKykpID4gMjU1KVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBjaGFyYWN0ZXIgZm91bmQnKTtcbiAgICAgICAgdTMyID0gKGMwIDw8IDE2KSB8IChjMSA8PCA4KSB8IGMyO1xuICAgICAgICBhc2MgKz0gYjY0Y2hzW3UzMiA+PiAxOCAmIDYzXVxuICAgICAgICAgICAgKyBiNjRjaHNbdTMyID4+IDEyICYgNjNdXG4gICAgICAgICAgICArIGI2NGNoc1t1MzIgPj4gNiAmIDYzXVxuICAgICAgICAgICAgKyBiNjRjaHNbdTMyICYgNjNdO1xuICAgIH1cbiAgICByZXR1cm4gcGFkID8gYXNjLnNsaWNlKDAsIHBhZCAtIDMpICsgXCI9PT1cIi5zdWJzdHJpbmcocGFkKSA6IGFzYztcbn07XG4vKipcbiAqIGRvZXMgd2hhdCBgd2luZG93LmJ0b2FgIG9mIHdlYiBicm93c2VycyBkby5cbiAqIEBwYXJhbSB7U3RyaW5nfSBiaW4gYmluYXJ5IHN0cmluZ1xuICogQHJldHVybnMge3N0cmluZ30gQmFzZTY0LWVuY29kZWQgc3RyaW5nXG4gKi9cbmNvbnN0IF9idG9hID0gdHlwZW9mIGJ0b2EgPT09ICdmdW5jdGlvbicgPyAoYmluKSA9PiBidG9hKGJpbilcbiAgICA6IF9oYXNCdWZmZXIgPyAoYmluKSA9PiBCdWZmZXIuZnJvbShiaW4sICdiaW5hcnknKS50b1N0cmluZygnYmFzZTY0JylcbiAgICAgICAgOiBidG9hUG9seWZpbGw7XG5jb25zdCBfZnJvbVVpbnQ4QXJyYXkgPSBfaGFzQnVmZmVyXG4gICAgPyAodThhKSA9PiBCdWZmZXIuZnJvbSh1OGEpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgIDogKHU4YSkgPT4ge1xuICAgICAgICAvLyBjZi4gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTI3MTAwMDEvaG93LXRvLWNvbnZlcnQtdWludDgtYXJyYXktdG8tYmFzZTY0LWVuY29kZWQtc3RyaW5nLzEyNzEzMzI2IzEyNzEzMzI2XG4gICAgICAgIGNvbnN0IG1heGFyZ3MgPSAweDEwMDA7XG4gICAgICAgIGxldCBzdHJzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gdThhLmxlbmd0aDsgaSA8IGw7IGkgKz0gbWF4YXJncykge1xuICAgICAgICAgICAgc3Rycy5wdXNoKF9mcm9tQ0MuYXBwbHkobnVsbCwgdThhLnN1YmFycmF5KGksIGkgKyBtYXhhcmdzKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfYnRvYShzdHJzLmpvaW4oJycpKTtcbiAgICB9O1xuLyoqXG4gKiBjb252ZXJ0cyBhIFVpbnQ4QXJyYXkgdG8gYSBCYXNlNjQgc3RyaW5nLlxuICogQHBhcmFtIHtib29sZWFufSBbdXJsc2FmZV0gVVJMLWFuZC1maWxlbmFtZS1zYWZlIGEgbGEgUkZDNDY0OCBcdTAwQTc1XG4gKiBAcmV0dXJucyB7c3RyaW5nfSBCYXNlNjQgc3RyaW5nXG4gKi9cbmNvbnN0IGZyb21VaW50OEFycmF5ID0gKHU4YSwgdXJsc2FmZSA9IGZhbHNlKSA9PiB1cmxzYWZlID8gX21rVXJpU2FmZShfZnJvbVVpbnQ4QXJyYXkodThhKSkgOiBfZnJvbVVpbnQ4QXJyYXkodThhKTtcbi8vIFRoaXMgdHJpY2sgaXMgZm91bmQgYnJva2VuIGh0dHBzOi8vZ2l0aHViLmNvbS9kYW5rb2dhaS9qcy1iYXNlNjQvaXNzdWVzLzEzMFxuLy8gY29uc3QgdXRvYiA9IChzcmM6IHN0cmluZykgPT4gdW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHNyYykpO1xuLy8gcmV2ZXJ0aW5nIGdvb2Qgb2xkIGZhdGlvbmVkIHJlZ2V4cFxuY29uc3QgY2JfdXRvYiA9IChjKSA9PiB7XG4gICAgaWYgKGMubGVuZ3RoIDwgMikge1xuICAgICAgICB2YXIgY2MgPSBjLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgIHJldHVybiBjYyA8IDB4ODAgPyBjXG4gICAgICAgICAgICA6IGNjIDwgMHg4MDAgPyAoX2Zyb21DQygweGMwIHwgKGNjID4+PiA2KSlcbiAgICAgICAgICAgICAgICArIF9mcm9tQ0MoMHg4MCB8IChjYyAmIDB4M2YpKSlcbiAgICAgICAgICAgICAgICA6IChfZnJvbUNDKDB4ZTAgfCAoKGNjID4+PiAxMikgJiAweDBmKSlcbiAgICAgICAgICAgICAgICAgICAgKyBfZnJvbUNDKDB4ODAgfCAoKGNjID4+PiA2KSAmIDB4M2YpKVxuICAgICAgICAgICAgICAgICAgICArIF9mcm9tQ0MoMHg4MCB8IChjYyAmIDB4M2YpKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgY2MgPSAweDEwMDAwXG4gICAgICAgICAgICArIChjLmNoYXJDb2RlQXQoMCkgLSAweEQ4MDApICogMHg0MDBcbiAgICAgICAgICAgICsgKGMuY2hhckNvZGVBdCgxKSAtIDB4REMwMCk7XG4gICAgICAgIHJldHVybiAoX2Zyb21DQygweGYwIHwgKChjYyA+Pj4gMTgpICYgMHgwNykpXG4gICAgICAgICAgICArIF9mcm9tQ0MoMHg4MCB8ICgoY2MgPj4+IDEyKSAmIDB4M2YpKVxuICAgICAgICAgICAgKyBfZnJvbUNDKDB4ODAgfCAoKGNjID4+PiA2KSAmIDB4M2YpKVxuICAgICAgICAgICAgKyBfZnJvbUNDKDB4ODAgfCAoY2MgJiAweDNmKSkpO1xuICAgIH1cbn07XG5jb25zdCByZV91dG9iID0gL1tcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRkZdfFteXFx4MDAtXFx4N0ZdL2c7XG4vKipcbiAqIEBkZXByZWNhdGVkIHNob3VsZCBoYXZlIGJlZW4gaW50ZXJuYWwgdXNlIG9ubHkuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3JjIFVURi04IHN0cmluZ1xuICogQHJldHVybnMge3N0cmluZ30gVVRGLTE2IHN0cmluZ1xuICovXG5jb25zdCB1dG9iID0gKHUpID0+IHUucmVwbGFjZShyZV91dG9iLCBjYl91dG9iKTtcbi8vXG5jb25zdCBfZW5jb2RlID0gX2hhc0J1ZmZlclxuICAgID8gKHMpID0+IEJ1ZmZlci5mcm9tKHMsICd1dGY4JykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgOiBfVEVcbiAgICAgICAgPyAocykgPT4gX2Zyb21VaW50OEFycmF5KF9URS5lbmNvZGUocykpXG4gICAgICAgIDogKHMpID0+IF9idG9hKHV0b2IocykpO1xuLyoqXG4gKiBjb252ZXJ0cyBhIFVURi04LWVuY29kZWQgc3RyaW5nIHRvIGEgQmFzZTY0IHN0cmluZy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VybHNhZmVdIGlmIGB0cnVlYCBtYWtlIHRoZSByZXN1bHQgVVJMLXNhZmVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEJhc2U2NCBzdHJpbmdcbiAqL1xuY29uc3QgZW5jb2RlID0gKHNyYywgdXJsc2FmZSA9IGZhbHNlKSA9PiB1cmxzYWZlXG4gICAgPyBfbWtVcmlTYWZlKF9lbmNvZGUoc3JjKSlcbiAgICA6IF9lbmNvZGUoc3JjKTtcbi8qKlxuICogY29udmVydHMgYSBVVEYtOC1lbmNvZGVkIHN0cmluZyB0byBVUkwtc2FmZSBCYXNlNjQgUkZDNDY0OCBcdTAwQTc1LlxuICogQHJldHVybnMge3N0cmluZ30gQmFzZTY0IHN0cmluZ1xuICovXG5jb25zdCBlbmNvZGVVUkkgPSAoc3JjKSA9PiBlbmNvZGUoc3JjLCB0cnVlKTtcbi8vIFRoaXMgdHJpY2sgaXMgZm91bmQgYnJva2VuIGh0dHBzOi8vZ2l0aHViLmNvbS9kYW5rb2dhaS9qcy1iYXNlNjQvaXNzdWVzLzEzMFxuLy8gY29uc3QgYnRvdSA9IChzcmM6IHN0cmluZykgPT4gZGVjb2RlVVJJQ29tcG9uZW50KGVzY2FwZShzcmMpKTtcbi8vIHJldmVydGluZyBnb29kIG9sZCBmYXRpb25lZCByZWdleHBcbmNvbnN0IHJlX2J0b3UgPSAvW1xceEMwLVxceERGXVtcXHg4MC1cXHhCRl18W1xceEUwLVxceEVGXVtcXHg4MC1cXHhCRl17Mn18W1xceEYwLVxceEY3XVtcXHg4MC1cXHhCRl17M30vZztcbmNvbnN0IGNiX2J0b3UgPSAoY2NjYykgPT4ge1xuICAgIHN3aXRjaCAoY2NjYy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgdmFyIGNwID0gKCgweDA3ICYgY2NjYy5jaGFyQ29kZUF0KDApKSA8PCAxOClcbiAgICAgICAgICAgICAgICB8ICgoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgxKSkgPDwgMTIpXG4gICAgICAgICAgICAgICAgfCAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMikpIDw8IDYpXG4gICAgICAgICAgICAgICAgfCAoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgzKSksIG9mZnNldCA9IGNwIC0gMHgxMDAwMDtcbiAgICAgICAgICAgIHJldHVybiAoX2Zyb21DQygob2Zmc2V0ID4+PiAxMCkgKyAweEQ4MDApXG4gICAgICAgICAgICAgICAgKyBfZnJvbUNDKChvZmZzZXQgJiAweDNGRikgKyAweERDMDApKTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIF9mcm9tQ0MoKCgweDBmICYgY2NjYy5jaGFyQ29kZUF0KDApKSA8PCAxMilcbiAgICAgICAgICAgICAgICB8ICgoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgxKSkgPDwgNilcbiAgICAgICAgICAgICAgICB8ICgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDIpKSk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gX2Zyb21DQygoKDB4MWYgJiBjY2NjLmNoYXJDb2RlQXQoMCkpIDw8IDYpXG4gICAgICAgICAgICAgICAgfCAoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgxKSkpO1xuICAgIH1cbn07XG4vKipcbiAqIEBkZXByZWNhdGVkIHNob3VsZCBoYXZlIGJlZW4gaW50ZXJuYWwgdXNlIG9ubHkuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3JjIFVURi0xNiBzdHJpbmdcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFVURi04IHN0cmluZ1xuICovXG5jb25zdCBidG91ID0gKGIpID0+IGIucmVwbGFjZShyZV9idG91LCBjYl9idG91KTtcbi8qKlxuICogcG9seWZpbGwgdmVyc2lvbiBvZiBgYXRvYmBcbiAqL1xuY29uc3QgYXRvYlBvbHlmaWxsID0gKGFzYykgPT4ge1xuICAgIC8vIGNvbnNvbGUubG9nKCdwb2x5ZmlsbGVkJyk7XG4gICAgYXNjID0gYXNjLnJlcGxhY2UoL1xccysvZywgJycpO1xuICAgIGlmICghYjY0cmUudGVzdChhc2MpKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtYWxmb3JtZWQgYmFzZTY0LicpO1xuICAgIGFzYyArPSAnPT0nLnNsaWNlKDIgLSAoYXNjLmxlbmd0aCAmIDMpKTtcbiAgICBsZXQgdTI0LCBiaW4gPSAnJywgcjEsIHIyO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXNjLmxlbmd0aDspIHtcbiAgICAgICAgdTI0ID0gYjY0dGFiW2FzYy5jaGFyQXQoaSsrKV0gPDwgMThcbiAgICAgICAgICAgIHwgYjY0dGFiW2FzYy5jaGFyQXQoaSsrKV0gPDwgMTJcbiAgICAgICAgICAgIHwgKHIxID0gYjY0dGFiW2FzYy5jaGFyQXQoaSsrKV0pIDw8IDZcbiAgICAgICAgICAgIHwgKHIyID0gYjY0dGFiW2FzYy5jaGFyQXQoaSsrKV0pO1xuICAgICAgICBiaW4gKz0gcjEgPT09IDY0ID8gX2Zyb21DQyh1MjQgPj4gMTYgJiAyNTUpXG4gICAgICAgICAgICA6IHIyID09PSA2NCA/IF9mcm9tQ0ModTI0ID4+IDE2ICYgMjU1LCB1MjQgPj4gOCAmIDI1NSlcbiAgICAgICAgICAgICAgICA6IF9mcm9tQ0ModTI0ID4+IDE2ICYgMjU1LCB1MjQgPj4gOCAmIDI1NSwgdTI0ICYgMjU1KTtcbiAgICB9XG4gICAgcmV0dXJuIGJpbjtcbn07XG4vKipcbiAqIGRvZXMgd2hhdCBgd2luZG93LmF0b2JgIG9mIHdlYiBicm93c2VycyBkby5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhc2MgQmFzZTY0LWVuY29kZWQgc3RyaW5nXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBiaW5hcnkgc3RyaW5nXG4gKi9cbmNvbnN0IF9hdG9iID0gdHlwZW9mIGF0b2IgPT09ICdmdW5jdGlvbicgPyAoYXNjKSA9PiBhdG9iKF90aWR5QjY0KGFzYykpXG4gICAgOiBfaGFzQnVmZmVyID8gKGFzYykgPT4gQnVmZmVyLmZyb20oYXNjLCAnYmFzZTY0JykudG9TdHJpbmcoJ2JpbmFyeScpXG4gICAgICAgIDogYXRvYlBvbHlmaWxsO1xuLy9cbmNvbnN0IF90b1VpbnQ4QXJyYXkgPSBfaGFzQnVmZmVyXG4gICAgPyAoYSkgPT4gX1U4QWZyb20oQnVmZmVyLmZyb20oYSwgJ2Jhc2U2NCcpKVxuICAgIDogKGEpID0+IF9VOEFmcm9tKF9hdG9iKGEpLnNwbGl0KCcnKS5tYXAoYyA9PiBjLmNoYXJDb2RlQXQoMCkpKTtcbi8qKlxuICogY29udmVydHMgYSBCYXNlNjQgc3RyaW5nIHRvIGEgVWludDhBcnJheS5cbiAqL1xuY29uc3QgdG9VaW50OEFycmF5ID0gKGEpID0+IF90b1VpbnQ4QXJyYXkoX3VuVVJJKGEpKTtcbi8vXG5jb25zdCBfZGVjb2RlID0gX2hhc0J1ZmZlclxuICAgID8gKGEpID0+IEJ1ZmZlci5mcm9tKGEsICdiYXNlNjQnKS50b1N0cmluZygndXRmOCcpXG4gICAgOiBfVERcbiAgICAgICAgPyAoYSkgPT4gX1RELmRlY29kZShfdG9VaW50OEFycmF5KGEpKVxuICAgICAgICA6IChhKSA9PiBidG91KF9hdG9iKGEpKTtcbmNvbnN0IF91blVSSSA9IChhKSA9PiBfdGlkeUI2NChhLnJlcGxhY2UoL1stX10vZywgKG0wKSA9PiBtMCA9PSAnLScgPyAnKycgOiAnLycpKTtcbi8qKlxuICogY29udmVydHMgYSBCYXNlNjQgc3RyaW5nIHRvIGEgVVRGLTggc3RyaW5nLlxuICogQHBhcmFtIHtTdHJpbmd9IHNyYyBCYXNlNjQgc3RyaW5nLiAgQm90aCBub3JtYWwgYW5kIFVSTC1zYWZlIGFyZSBzdXBwb3J0ZWRcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFVURi04IHN0cmluZ1xuICovXG5jb25zdCBkZWNvZGUgPSAoc3JjKSA9PiBfZGVjb2RlKF91blVSSShzcmMpKTtcbi8qKlxuICogY2hlY2sgaWYgYSB2YWx1ZSBpcyBhIHZhbGlkIEJhc2U2NCBzdHJpbmdcbiAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgYSB2YWx1ZSB0byBjaGVja1xuICAqL1xuY29uc3QgaXNWYWxpZCA9IChzcmMpID0+IHtcbiAgICBpZiAodHlwZW9mIHNyYyAhPT0gJ3N0cmluZycpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzID0gc3JjLnJlcGxhY2UoL1xccysvZywgJycpLnJlcGxhY2UoLz17MCwyfSQvLCAnJyk7XG4gICAgcmV0dXJuICEvW15cXHMwLTlhLXpBLVpcXCsvXS8udGVzdChzKSB8fCAhL1teXFxzMC05YS16QS1aXFwtX10vLnRlc3Qocyk7XG59O1xuLy9cbmNvbnN0IF9ub0VudW0gPSAodikgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB2LCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH07XG59O1xuLyoqXG4gKiBleHRlbmQgU3RyaW5nLnByb3RvdHlwZSB3aXRoIHJlbGV2YW50IG1ldGhvZHNcbiAqL1xuY29uc3QgZXh0ZW5kU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IF9hZGQgPSAobmFtZSwgYm9keSkgPT4gT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmluZy5wcm90b3R5cGUsIG5hbWUsIF9ub0VudW0oYm9keSkpO1xuICAgIF9hZGQoJ2Zyb21CYXNlNjQnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBkZWNvZGUodGhpcyk7IH0pO1xuICAgIF9hZGQoJ3RvQmFzZTY0JywgZnVuY3Rpb24gKHVybHNhZmUpIHsgcmV0dXJuIGVuY29kZSh0aGlzLCB1cmxzYWZlKTsgfSk7XG4gICAgX2FkZCgndG9CYXNlNjRVUkknLCBmdW5jdGlvbiAoKSB7IHJldHVybiBlbmNvZGUodGhpcywgdHJ1ZSk7IH0pO1xuICAgIF9hZGQoJ3RvQmFzZTY0VVJMJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZW5jb2RlKHRoaXMsIHRydWUpOyB9KTtcbiAgICBfYWRkKCd0b1VpbnQ4QXJyYXknLCBmdW5jdGlvbiAoKSB7IHJldHVybiB0b1VpbnQ4QXJyYXkodGhpcyk7IH0pO1xufTtcbi8qKlxuICogZXh0ZW5kIFVpbnQ4QXJyYXkucHJvdG90eXBlIHdpdGggcmVsZXZhbnQgbWV0aG9kc1xuICovXG5jb25zdCBleHRlbmRVaW50OEFycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IF9hZGQgPSAobmFtZSwgYm9keSkgPT4gT2JqZWN0LmRlZmluZVByb3BlcnR5KFVpbnQ4QXJyYXkucHJvdG90eXBlLCBuYW1lLCBfbm9FbnVtKGJvZHkpKTtcbiAgICBfYWRkKCd0b0Jhc2U2NCcsIGZ1bmN0aW9uICh1cmxzYWZlKSB7IHJldHVybiBmcm9tVWludDhBcnJheSh0aGlzLCB1cmxzYWZlKTsgfSk7XG4gICAgX2FkZCgndG9CYXNlNjRVUkknLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmcm9tVWludDhBcnJheSh0aGlzLCB0cnVlKTsgfSk7XG4gICAgX2FkZCgndG9CYXNlNjRVUkwnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmcm9tVWludDhBcnJheSh0aGlzLCB0cnVlKTsgfSk7XG59O1xuLyoqXG4gKiBleHRlbmQgQnVpbHRpbiBwcm90b3R5cGVzIHdpdGggcmVsZXZhbnQgbWV0aG9kc1xuICovXG5jb25zdCBleHRlbmRCdWlsdGlucyA9ICgpID0+IHtcbiAgICBleHRlbmRTdHJpbmcoKTtcbiAgICBleHRlbmRVaW50OEFycmF5KCk7XG59O1xuY29uc3QgZ0Jhc2U2NCA9IHtcbiAgICB2ZXJzaW9uOiB2ZXJzaW9uLFxuICAgIFZFUlNJT046IFZFUlNJT04sXG4gICAgYXRvYjogX2F0b2IsXG4gICAgYXRvYlBvbHlmaWxsOiBhdG9iUG9seWZpbGwsXG4gICAgYnRvYTogX2J0b2EsXG4gICAgYnRvYVBvbHlmaWxsOiBidG9hUG9seWZpbGwsXG4gICAgZnJvbUJhc2U2NDogZGVjb2RlLFxuICAgIHRvQmFzZTY0OiBlbmNvZGUsXG4gICAgZW5jb2RlOiBlbmNvZGUsXG4gICAgZW5jb2RlVVJJOiBlbmNvZGVVUkksXG4gICAgZW5jb2RlVVJMOiBlbmNvZGVVUkksXG4gICAgdXRvYjogdXRvYixcbiAgICBidG91OiBidG91LFxuICAgIGRlY29kZTogZGVjb2RlLFxuICAgIGlzVmFsaWQ6IGlzVmFsaWQsXG4gICAgZnJvbVVpbnQ4QXJyYXk6IGZyb21VaW50OEFycmF5LFxuICAgIHRvVWludDhBcnJheTogdG9VaW50OEFycmF5LFxuICAgIGV4dGVuZFN0cmluZzogZXh0ZW5kU3RyaW5nLFxuICAgIGV4dGVuZFVpbnQ4QXJyYXk6IGV4dGVuZFVpbnQ4QXJyYXksXG4gICAgZXh0ZW5kQnVpbHRpbnM6IGV4dGVuZEJ1aWx0aW5zXG59O1xuLy8gbWFrZWNqczpDVVQgLy9cbmV4cG9ydCB7IHZlcnNpb24gfTtcbmV4cG9ydCB7IFZFUlNJT04gfTtcbmV4cG9ydCB7IF9hdG9iIGFzIGF0b2IgfTtcbmV4cG9ydCB7IGF0b2JQb2x5ZmlsbCB9O1xuZXhwb3J0IHsgX2J0b2EgYXMgYnRvYSB9O1xuZXhwb3J0IHsgYnRvYVBvbHlmaWxsIH07XG5leHBvcnQgeyBkZWNvZGUgYXMgZnJvbUJhc2U2NCB9O1xuZXhwb3J0IHsgZW5jb2RlIGFzIHRvQmFzZTY0IH07XG5leHBvcnQgeyB1dG9iIH07XG5leHBvcnQgeyBlbmNvZGUgfTtcbmV4cG9ydCB7IGVuY29kZVVSSSB9O1xuZXhwb3J0IHsgZW5jb2RlVVJJIGFzIGVuY29kZVVSTCB9O1xuZXhwb3J0IHsgYnRvdSB9O1xuZXhwb3J0IHsgZGVjb2RlIH07XG5leHBvcnQgeyBpc1ZhbGlkIH07XG5leHBvcnQgeyBmcm9tVWludDhBcnJheSB9O1xuZXhwb3J0IHsgdG9VaW50OEFycmF5IH07XG5leHBvcnQgeyBleHRlbmRTdHJpbmcgfTtcbmV4cG9ydCB7IGV4dGVuZFVpbnQ4QXJyYXkgfTtcbmV4cG9ydCB7IGV4dGVuZEJ1aWx0aW5zIH07XG4vLyBhbmQgZmluYWxseSxcbmV4cG9ydCB7IGdCYXNlNjQgYXMgQmFzZTY0IH07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQSx1QkFBQUE7QUFBQSxJQUFBLDJCQUFBQztBQUFBLElBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDY08sTUFBTSxTQUFTLE1BQU0sb0JBQUksSUFBSTtBQVU3QixNQUFNLE9BQU8sT0FBSztBQUN2QixV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QXNCRixNQUFLSSxZQUFXO0FBQ2xELFdBQU8sZUFBZSxHQUFHO0FBQUEsRUFDN0I7QUFFTyxNQUFNLGNBQWMsTUFBTTtBQUM3QixXQUFPLGVBQWlCLGtCQUFrQkosSUFBRyxDQUFDO0FBQUEsRUFDbEQ7QUFFTyxNQUFNLFdBQVcsTUFBTTtBQUMxQixRQUFJLFNBQVM7QUFDVCxhQUFPLEtBQUssVUFBVSxLQUFLLE9BQU8sQ0FBQztBQUFBLElBQ3ZDLE9BQU87QUFDSCxhQUFPLEtBQUssU0FBUztBQUFBLElBQ3pCO0FBQUEsRUFDSjtBQUlPLE1BQU0sU0FBUyxNQUFNO0FBQ3hCLFNBQUssT0FBTyxnQkFBZ0IsVUFBVTtBQUFBLEVBQzFDOyIsCiAgIm5hbWVzIjogWyJhcHBseVVwZGF0ZSIsICJlbmNvZGVTdGF0ZUFzVXBkYXRlIiwgIm1hcCIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImFyZ3MiLCAiaXNOYU4iLCAia2V5cyIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImlkIiwgImxlbmd0aCIsICJpIiwgImNyZWF0ZSIsICJjcmVhdGUiLCAiZG9jIiwgImFyZ3MiLCAiaWQiLCAiYW55IiwgImRvYyIsICJpIiwgImRvYyIsICJkb2MiLCAic25hcHNob3QiLCAiY3JlYXRlIiwgImlkIiwgImNyZWF0ZSIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImFyZ3MiLCAiY3JlYXRlIiwgImFyZ3MiLCAic3R5bGUiLCAiY3JlYXRlIiwgImRvYyIsICJjcmVhdGUiLCAic3RydWN0IiwgImRvYyIsICJpIiwgImhhc0NvbnRlbnQiLCAiaSIsICJjcmVhdGUiLCAia2V5cyIsICJkb2MiLCAiY3JlYXRlIiwgImxlbmd0aCIsICJzbmFwc2hvdCIsICJsZW5ndGgiLCAibWFwIiwgImRvYyIsICJpbnNlcnRUZXh0IiwgInRleHQiLCAibGVuZ3RoIiwgImluc2VydCIsICJzbmFwc2hvdCIsICJyb290IiwgImVsZW1lbnQiLCAiY3JlYXRlIiwgImxlbmd0aCIsICJrZXlzIiwgInNuYXBzaG90IiwgInRleHQiLCAiaWQiLCAibGVuZ3RoIiwgImRvYyIsICJpdGVtIiwgImlkIiwgInRhcmdldFZhbHVlIiwgIm1hbmFnZWRUeXBlIiwgIm1hcCIsICJ0b1VpbnQ4QXJyYXkiLCAiZG9jIiwgImFwcGx5VXBkYXRlIiwgInRvVWludDhBcnJheSIsICJlbmNvZGVTdGF0ZUFzVXBkYXRlIiwgInN0YXRlVmVjdG9yIl0KfQo=
