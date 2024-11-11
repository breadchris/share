// node_modules/comlink/dist/esm/comlink.mjs
var proxyMarker = Symbol("Comlink.proxy");
var createEndpoint = Symbol("Comlink.endpoint");
var releaseProxy = Symbol("Comlink.releaseProxy");
var finalizer = Symbol("Comlink.finalizer");
var throwMarker = Symbol("Comlink.thrown");
var isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
var proxyTransferHandler = {
  canHandle: (val) => isObject(val) && val[proxyMarker],
  serialize(obj) {
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);
    return [port2, [port2]];
  },
  deserialize(port) {
    port.start();
    return wrap(port);
  }
};
var throwTransferHandler = {
  canHandle: (value) => isObject(value) && throwMarker in value,
  serialize({ value }) {
    let serialized;
    if (value instanceof Error) {
      serialized = {
        isError: true,
        value: {
          message: value.message,
          name: value.name,
          stack: value.stack
        }
      };
    } else {
      serialized = { isError: false, value };
    }
    return [serialized, []];
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(new Error(serialized.value.message), serialized.value);
    }
    throw serialized.value;
  }
};
var transferHandlers = /* @__PURE__ */ new Map([
  ["proxy", proxyTransferHandler],
  ["throw", throwTransferHandler]
]);
function isAllowedOrigin(allowedOrigins, origin) {
  for (const allowedOrigin of allowedOrigins) {
    if (origin === allowedOrigin || allowedOrigin === "*") {
      return true;
    }
    if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
      return true;
    }
  }
  return false;
}
function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
  ep.addEventListener("message", function callback(ev) {
    if (!ev || !ev.data) {
      return;
    }
    if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
      console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
      return;
    }
    const { id, type, path } = Object.assign({ path: [] }, ev.data);
    const argumentList = (ev.data.argumentList || []).map(fromWireValue);
    let returnValue;
    try {
      const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
      const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
      switch (type) {
        case "GET":
          {
            returnValue = rawValue;
          }
          break;
        case "SET":
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;
        case "APPLY":
          {
            returnValue = rawValue.apply(parent, argumentList);
          }
          break;
        case "CONSTRUCT":
          {
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;
        case "ENDPOINT":
          {
            const { port1, port2 } = new MessageChannel();
            expose(obj, port2);
            returnValue = transfer(port1, [port1]);
          }
          break;
        case "RELEASE":
          {
            returnValue = void 0;
          }
          break;
        default:
          return;
      }
    } catch (value) {
      returnValue = { value, [throwMarker]: 0 };
    }
    Promise.resolve(returnValue).catch((value) => {
      return { value, [throwMarker]: 0 };
    }).then((returnValue2) => {
      const [wireValue, transferables] = toWireValue(returnValue2);
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
      if (type === "RELEASE") {
        ep.removeEventListener("message", callback);
        closeEndPoint(ep);
        if (finalizer in obj && typeof obj[finalizer] === "function") {
          obj[finalizer]();
        }
      }
    }).catch((error) => {
      const [wireValue, transferables] = toWireValue({
        value: new TypeError("Unserializable return value"),
        [throwMarker]: 0
      });
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
    });
  });
  if (ep.start) {
    ep.start();
  }
}
function isMessagePort(endpoint) {
  return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
  if (isMessagePort(endpoint))
    endpoint.close();
}
function wrap(ep, target) {
  return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}
function releaseEndpoint(ep) {
  return requestResponseMessage(ep, {
    type: "RELEASE"
  }).then(() => {
    closeEndPoint(ep);
  });
}
var proxyCounter = /* @__PURE__ */ new WeakMap();
var proxyFinalizers = "FinalizationRegistry" in globalThis && new FinalizationRegistry((ep) => {
  const newCount = (proxyCounter.get(ep) || 0) - 1;
  proxyCounter.set(ep, newCount);
  if (newCount === 0) {
    releaseEndpoint(ep);
  }
});
function registerProxy(proxy2, ep) {
  const newCount = (proxyCounter.get(ep) || 0) + 1;
  proxyCounter.set(ep, newCount);
  if (proxyFinalizers) {
    proxyFinalizers.register(proxy2, ep, proxy2);
  }
}
function unregisterProxy(proxy2) {
  if (proxyFinalizers) {
    proxyFinalizers.unregister(proxy2);
  }
}
function createProxy(ep, path = [], target = function() {
}) {
  let isProxyReleased = false;
  const proxy2 = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === releaseProxy) {
        return () => {
          unregisterProxy(proxy2);
          releaseEndpoint(ep);
          isProxyReleased = true;
        };
      }
      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy2 };
        }
        const r = requestResponseMessage(ep, {
          type: "GET",
          path: path.map((p) => p.toString())
        }).then(fromWireValue);
        return r.then.bind(r);
      }
      return createProxy(ep, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);
      const [value, transferables] = toWireValue(rawValue);
      return requestResponseMessage(ep, {
        type: "SET",
        path: [...path, prop].map((p) => p.toString()),
        value
      }, transferables).then(fromWireValue);
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === createEndpoint) {
        return requestResponseMessage(ep, {
          type: "ENDPOINT"
        }).then(fromWireValue);
      }
      if (last === "bind") {
        return createProxy(ep, path.slice(0, -1));
      }
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: "APPLY",
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: "CONSTRUCT",
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    }
  });
  registerProxy(proxy2, ep);
  return proxy2;
}
function myFlat(arr) {
  return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
  const processed = argumentList.map(toWireValue);
  return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
var transferCache = /* @__PURE__ */ new WeakMap();
function transfer(obj, transfers) {
  transferCache.set(obj, transfers);
  return obj;
}
function proxy(obj) {
  return Object.assign(obj, { [proxyMarker]: true });
}
function toWireValue(value) {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const [serializedValue, transferables] = handler.serialize(value);
      return [
        {
          type: "HANDLER",
          name,
          value: serializedValue
        },
        transferables
      ];
    }
  }
  return [
    {
      type: "RAW",
      value
    },
    transferCache.get(value) || []
  ];
}
function fromWireValue(value) {
  switch (value.type) {
    case "HANDLER":
      return transferHandlers.get(value.name).deserialize(value.value);
    case "RAW":
      return value.value;
  }
}
function requestResponseMessage(ep, msg, transfers) {
  return new Promise((resolve) => {
    const id = generateUUID();
    ep.addEventListener("message", function l(ev) {
      if (!ev.data || !ev.data.id || ev.data.id !== id) {
        return;
      }
      ep.removeEventListener("message", l);
      resolve(ev.data);
    });
    if (ep.start) {
      ep.start();
    }
    ep.postMessage(Object.assign({ id }, msg), transfers);
  });
}
function generateUUID() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}

// wasmcode/lib/go/wasm_exec.js
(() => {
  const enosys = () => {
    const err = new Error("not implemented");
    err.code = "ENOSYS";
    return err;
  };
  if (!globalThis.fs) {
    let outputBuf = "";
    globalThis.fs = {
      constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 },
      // unused
      writeSync(fd, buf) {
        outputBuf += decoder.decode(buf);
        const nl = outputBuf.lastIndexOf("\n");
        if (nl != -1) {
          console.log(outputBuf.substring(0, nl));
          outputBuf = outputBuf.substring(nl + 1);
        }
        return buf.length;
      },
      write(fd, buf, offset, length, position, callback) {
        if (offset !== 0 || length !== buf.length || position !== null) {
          callback(enosys());
          return;
        }
        const n = this.writeSync(fd, buf);
        callback(null, n);
      },
      chmod(path, mode, callback) {
        callback(enosys());
      },
      chown(path, uid, gid, callback) {
        callback(enosys());
      },
      close(fd, callback) {
        callback(enosys());
      },
      fchmod(fd, mode, callback) {
        callback(enosys());
      },
      fchown(fd, uid, gid, callback) {
        callback(enosys());
      },
      fstat(fd, callback) {
        callback(enosys());
      },
      fsync(fd, callback) {
        callback(null);
      },
      ftruncate(fd, length, callback) {
        callback(enosys());
      },
      lchown(path, uid, gid, callback) {
        callback(enosys());
      },
      link(path, link, callback) {
        callback(enosys());
      },
      lstat(path, callback) {
        callback(enosys());
      },
      mkdir(path, perm, callback) {
        callback(enosys());
      },
      open(path, flags, mode, callback) {
        callback(enosys());
      },
      read(fd, buffer, offset, length, position, callback) {
        callback(enosys());
      },
      readdir(path, callback) {
        callback(enosys());
      },
      readlink(path, callback) {
        callback(enosys());
      },
      rename(from, to, callback) {
        callback(enosys());
      },
      rmdir(path, callback) {
        callback(enosys());
      },
      stat(path, callback) {
        callback(enosys());
      },
      symlink(path, link, callback) {
        callback(enosys());
      },
      truncate(path, length, callback) {
        callback(enosys());
      },
      unlink(path, callback) {
        callback(enosys());
      },
      utimes(path, atime, mtime, callback) {
        callback(enosys());
      }
    };
  }
  if (!globalThis.process) {
    globalThis.process = {
      getuid() {
        return -1;
      },
      getgid() {
        return -1;
      },
      geteuid() {
        return -1;
      },
      getegid() {
        return -1;
      },
      getgroups() {
        throw enosys();
      },
      pid: -1,
      ppid: -1,
      umask() {
        throw enosys();
      },
      cwd() {
        throw enosys();
      },
      chdir() {
        throw enosys();
      }
    };
  }
  if (!globalThis.crypto) {
    throw new Error("globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)");
  }
  if (!globalThis.performance) {
    throw new Error("globalThis.performance is not available, polyfill required (performance.now only)");
  }
  if (!globalThis.TextEncoder) {
    throw new Error("globalThis.TextEncoder is not available, polyfill required");
  }
  if (!globalThis.TextDecoder) {
    throw new Error("globalThis.TextDecoder is not available, polyfill required");
  }
  const encoder = new TextEncoder("utf-8");
  const decoder = new TextDecoder("utf-8");
  globalThis.Go = class {
    constructor() {
      this.argv = ["js"];
      this.env = {};
      this.exit = (code) => {
        if (code !== 0) {
          console.warn("exit code:", code);
        }
      };
      this._exitPromise = new Promise((resolve) => {
        this._resolveExitPromise = resolve;
      });
      this._pendingEvent = null;
      this._scheduledTimeouts = /* @__PURE__ */ new Map();
      this._nextCallbackTimeoutID = 1;
      const setInt64 = (addr, v) => {
        this.mem.setUint32(addr + 0, v, true);
        this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);
      };
      const setInt32 = (addr, v) => {
        this.mem.setUint32(addr + 0, v, true);
      };
      const getInt64 = (addr) => {
        const low = this.mem.getUint32(addr + 0, true);
        const high = this.mem.getInt32(addr + 4, true);
        return low + high * 4294967296;
      };
      const loadValue = (addr) => {
        const f = this.mem.getFloat64(addr, true);
        if (f === 0) {
          return void 0;
        }
        if (!isNaN(f)) {
          return f;
        }
        const id = this.mem.getUint32(addr, true);
        return this._values[id];
      };
      const storeValue = (addr, v) => {
        const nanHead = 2146959360;
        if (typeof v === "number" && v !== 0) {
          if (isNaN(v)) {
            this.mem.setUint32(addr + 4, nanHead, true);
            this.mem.setUint32(addr, 0, true);
            return;
          }
          this.mem.setFloat64(addr, v, true);
          return;
        }
        if (v === void 0) {
          this.mem.setFloat64(addr, 0, true);
          return;
        }
        let id = this._ids.get(v);
        if (id === void 0) {
          id = this._idPool.pop();
          if (id === void 0) {
            id = this._values.length;
          }
          this._values[id] = v;
          this._goRefCounts[id] = 0;
          this._ids.set(v, id);
        }
        this._goRefCounts[id]++;
        let typeFlag = 0;
        switch (typeof v) {
          case "object":
            if (v !== null) {
              typeFlag = 1;
            }
            break;
          case "string":
            typeFlag = 2;
            break;
          case "symbol":
            typeFlag = 3;
            break;
          case "function":
            typeFlag = 4;
            break;
        }
        this.mem.setUint32(addr + 4, nanHead | typeFlag, true);
        this.mem.setUint32(addr, id, true);
      };
      const loadSlice = (addr) => {
        const array = getInt64(addr + 0);
        const len = getInt64(addr + 8);
        return new Uint8Array(this._inst.exports.mem.buffer, array, len);
      };
      const loadSliceOfValues = (addr) => {
        const array = getInt64(addr + 0);
        const len = getInt64(addr + 8);
        const a = new Array(len);
        for (let i = 0; i < len; i++) {
          a[i] = loadValue(array + i * 8);
        }
        return a;
      };
      const loadString = (addr) => {
        const saddr = getInt64(addr + 0);
        const len = getInt64(addr + 8);
        return decoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
      };
      const timeOrigin = Date.now() - performance.now();
      this.importObject = {
        _gotest: {
          add: (a, b) => a + b
        },
        gojs: {
          // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
          // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
          // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
          // This changes the SP, thus we have to update the SP used by the imported function.
          // func wasmExit(code int32)
          "runtime.wasmExit": (sp) => {
            sp >>>= 0;
            const code = this.mem.getInt32(sp + 8, true);
            this.exited = true;
            delete this._inst;
            delete this._values;
            delete this._goRefCounts;
            delete this._ids;
            delete this._idPool;
            this.exit(code);
          },
          // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
          "runtime.wasmWrite": (sp) => {
            sp >>>= 0;
            const fd = getInt64(sp + 8);
            const p = getInt64(sp + 16);
            const n = this.mem.getInt32(sp + 24, true);
            fs.writeSync(fd, new Uint8Array(this._inst.exports.mem.buffer, p, n));
          },
          // func resetMemoryDataView()
          "runtime.resetMemoryDataView": (sp) => {
            sp >>>= 0;
            this.mem = new DataView(this._inst.exports.mem.buffer);
          },
          // func nanotime1() int64
          "runtime.nanotime1": (sp) => {
            sp >>>= 0;
            setInt64(sp + 8, (timeOrigin + performance.now()) * 1e6);
          },
          // func walltime() (sec int64, nsec int32)
          "runtime.walltime": (sp) => {
            sp >>>= 0;
            const msec = (/* @__PURE__ */ new Date()).getTime();
            setInt64(sp + 8, msec / 1e3);
            this.mem.setInt32(sp + 16, msec % 1e3 * 1e6, true);
          },
          // func scheduleTimeoutEvent(delay int64) int32
          "runtime.scheduleTimeoutEvent": (sp) => {
            sp >>>= 0;
            const id = this._nextCallbackTimeoutID;
            this._nextCallbackTimeoutID++;
            this._scheduledTimeouts.set(id, setTimeout(
              () => {
                this._resume();
                while (this._scheduledTimeouts.has(id)) {
                  console.warn("scheduleTimeoutEvent: missed timeout event");
                  this._resume();
                }
              },
              getInt64(sp + 8)
            ));
            this.mem.setInt32(sp + 16, id, true);
          },
          // func clearTimeoutEvent(id int32)
          "runtime.clearTimeoutEvent": (sp) => {
            sp >>>= 0;
            const id = this.mem.getInt32(sp + 8, true);
            clearTimeout(this._scheduledTimeouts.get(id));
            this._scheduledTimeouts.delete(id);
          },
          // func getRandomData(r []byte)
          "runtime.getRandomData": (sp) => {
            sp >>>= 0;
            crypto.getRandomValues(loadSlice(sp + 8));
          },
          // func finalizeRef(v ref)
          "syscall/js.finalizeRef": (sp) => {
            sp >>>= 0;
            const id = this.mem.getUint32(sp + 8, true);
            this._goRefCounts[id]--;
            if (this._goRefCounts[id] === 0) {
              const v = this._values[id];
              this._values[id] = null;
              this._ids.delete(v);
              this._idPool.push(id);
            }
          },
          // func stringVal(value string) ref
          "syscall/js.stringVal": (sp) => {
            sp >>>= 0;
            storeValue(sp + 24, loadString(sp + 8));
          },
          // func valueGet(v ref, p string) ref
          "syscall/js.valueGet": (sp) => {
            sp >>>= 0;
            const result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));
            sp = this._inst.exports.getsp() >>> 0;
            storeValue(sp + 32, result);
          },
          // func valueSet(v ref, p string, x ref)
          "syscall/js.valueSet": (sp) => {
            sp >>>= 0;
            Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));
          },
          // func valueDelete(v ref, p string)
          "syscall/js.valueDelete": (sp) => {
            sp >>>= 0;
            Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));
          },
          // func valueIndex(v ref, i int) ref
          "syscall/js.valueIndex": (sp) => {
            sp >>>= 0;
            storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));
          },
          // valueSetIndex(v ref, i int, x ref)
          "syscall/js.valueSetIndex": (sp) => {
            sp >>>= 0;
            Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));
          },
          // func valueCall(v ref, m string, args []ref) (ref, bool)
          "syscall/js.valueCall": (sp) => {
            sp >>>= 0;
            try {
              const v = loadValue(sp + 8);
              const m = Reflect.get(v, loadString(sp + 16));
              const args = loadSliceOfValues(sp + 32);
              const result = Reflect.apply(m, v, args);
              sp = this._inst.exports.getsp() >>> 0;
              storeValue(sp + 56, result);
              this.mem.setUint8(sp + 64, 1);
            } catch (err) {
              sp = this._inst.exports.getsp() >>> 0;
              storeValue(sp + 56, err);
              this.mem.setUint8(sp + 64, 0);
            }
          },
          // func valueInvoke(v ref, args []ref) (ref, bool)
          "syscall/js.valueInvoke": (sp) => {
            sp >>>= 0;
            try {
              const v = loadValue(sp + 8);
              const args = loadSliceOfValues(sp + 16);
              const result = Reflect.apply(v, void 0, args);
              sp = this._inst.exports.getsp() >>> 0;
              storeValue(sp + 40, result);
              this.mem.setUint8(sp + 48, 1);
            } catch (err) {
              sp = this._inst.exports.getsp() >>> 0;
              storeValue(sp + 40, err);
              this.mem.setUint8(sp + 48, 0);
            }
          },
          // func valueNew(v ref, args []ref) (ref, bool)
          "syscall/js.valueNew": (sp) => {
            sp >>>= 0;
            try {
              const v = loadValue(sp + 8);
              const args = loadSliceOfValues(sp + 16);
              const result = Reflect.construct(v, args);
              sp = this._inst.exports.getsp() >>> 0;
              storeValue(sp + 40, result);
              this.mem.setUint8(sp + 48, 1);
            } catch (err) {
              sp = this._inst.exports.getsp() >>> 0;
              storeValue(sp + 40, err);
              this.mem.setUint8(sp + 48, 0);
            }
          },
          // func valueLength(v ref) int
          "syscall/js.valueLength": (sp) => {
            sp >>>= 0;
            setInt64(sp + 16, parseInt(loadValue(sp + 8).length));
          },
          // valuePrepareString(v ref) (ref, int)
          "syscall/js.valuePrepareString": (sp) => {
            sp >>>= 0;
            const str = encoder.encode(String(loadValue(sp + 8)));
            storeValue(sp + 16, str);
            setInt64(sp + 24, str.length);
          },
          // valueLoadString(v ref, b []byte)
          "syscall/js.valueLoadString": (sp) => {
            sp >>>= 0;
            const str = loadValue(sp + 8);
            loadSlice(sp + 16).set(str);
          },
          // func valueInstanceOf(v ref, t ref) bool
          "syscall/js.valueInstanceOf": (sp) => {
            sp >>>= 0;
            this.mem.setUint8(sp + 24, loadValue(sp + 8) instanceof loadValue(sp + 16) ? 1 : 0);
          },
          // func copyBytesToGo(dst []byte, src ref) (int, bool)
          "syscall/js.copyBytesToGo": (sp) => {
            sp >>>= 0;
            const dst = loadSlice(sp + 8);
            const src = loadValue(sp + 32);
            if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
              this.mem.setUint8(sp + 48, 0);
              return;
            }
            const toCopy = src.subarray(0, dst.length);
            dst.set(toCopy);
            setInt64(sp + 40, toCopy.length);
            this.mem.setUint8(sp + 48, 1);
          },
          // func copyBytesToJS(dst ref, src []byte) (int, bool)
          "syscall/js.copyBytesToJS": (sp) => {
            sp >>>= 0;
            const dst = loadValue(sp + 8);
            const src = loadSlice(sp + 16);
            if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
              this.mem.setUint8(sp + 48, 0);
              return;
            }
            const toCopy = src.subarray(0, dst.length);
            dst.set(toCopy);
            setInt64(sp + 40, toCopy.length);
            this.mem.setUint8(sp + 48, 1);
          },
          "debug": (value) => {
            console.log(value);
          }
        }
      };
    }
    async run(instance) {
      if (!(instance instanceof WebAssembly.Instance)) {
        throw new Error("Go.run: WebAssembly.Instance expected");
      }
      this._inst = instance;
      this.mem = new DataView(this._inst.exports.mem.buffer);
      this._values = [
        // JS values that Go currently has references to, indexed by reference id
        NaN,
        0,
        null,
        true,
        false,
        globalThis,
        this
      ];
      this._goRefCounts = new Array(this._values.length).fill(Infinity);
      this._ids = /* @__PURE__ */ new Map([
        // mapping from JS values to reference ids
        [0, 1],
        [null, 2],
        [true, 3],
        [false, 4],
        [globalThis, 5],
        [this, 6]
      ]);
      this._idPool = [];
      this.exited = false;
      let offset = 4096;
      const strPtr = (str) => {
        const ptr = offset;
        const bytes = encoder.encode(str + "\0");
        new Uint8Array(this.mem.buffer, offset, bytes.length).set(bytes);
        offset += bytes.length;
        if (offset % 8 !== 0) {
          offset += 8 - offset % 8;
        }
        return ptr;
      };
      const argc = this.argv.length;
      const argvPtrs = [];
      this.argv.forEach((arg) => {
        argvPtrs.push(strPtr(arg));
      });
      argvPtrs.push(0);
      const keys = Object.keys(this.env).sort();
      keys.forEach((key) => {
        argvPtrs.push(strPtr(`${key}=${this.env[key]}`));
      });
      argvPtrs.push(0);
      const argv = offset;
      argvPtrs.forEach((ptr) => {
        this.mem.setUint32(offset, ptr, true);
        this.mem.setUint32(offset + 4, 0, true);
        offset += 8;
      });
      const wasmMinDataAddr = 4096 + 8192;
      if (offset >= wasmMinDataAddr) {
        throw new Error("total length of command line and environment variables exceeds limit");
      }
      this._inst.exports.run(argc, argv);
      if (this.exited) {
        this._resolveExitPromise();
      }
      await this._exitPromise;
    }
    _resume() {
      if (this.exited) {
        throw new Error("Go program has already exited");
      }
      this._inst.exports.resume();
      if (this.exited) {
        this._resolveExitPromise();
      }
    }
    _makeFuncWrapper(id) {
      const go = this;
      return function() {
        const event = { id, this: this, args: arguments };
        go._pendingEvent = event;
        go._resume();
        return event.result;
      };
    }
  };
})();

// wasmcode/lib/go/debug/utils.ts
var whitespaceChars = new Set(
  [
    "\n",
    "	",
    "\r",
    "\f",
    "\v",
    "\xA0",
    "\u1680",
    "\u2000",
    "\u200A",
    "\u2028",
    "\u2029",
    "\u202F",
    "\u205F",
    "\u3000",
    "\uFEFF"
  ].map((s) => s.charCodeAt(0))
);

// wasmcode/lib/go/debug/memory.ts
var WHITESPACE_PLACEHOLDER = "W".charCodeAt(0);
var ZERO_CHAR_PLACEHOLDER = "\u30FB".charCodeAt(0);

// wasmcode/lib/go/common.ts
var instantiateStreaming = async (resp, importObject) => {
  const r = resp instanceof Promise ? await resp : resp;
  if (r.status !== 200) {
    throw new Error(
      `Cannot instantiate WebAssembly streaming, invalid HTTP response: '${r.status} ${r.statusText}' (URL: ${r.url})`
    );
  }
  if ("instantiateStreaming" in WebAssembly) {
    return await WebAssembly.instantiateStreaming(r, importObject);
  }
  const source = await r.arrayBuffer();
  return await WebAssembly.instantiate(source, importObject);
};

// wasmcode/lib/go/types/common.ts
var alignAddr = (addr, alignment) => {
  const offset = alignment - addr % alignment;
  return addr + offset;
};

// wasmcode/lib/go/types/spec.ts
var AbstractTypeSpec = class {
  _size = 0;
  _align = 1;
  _skip = 0;
  _name = "";
  /**
   * @param name Original type name.
   * @param size Type size.
   * @param align Type alignment.
   * @param skip Number of bytes to skip.
   */
  constructor(name, size, align = 1, skip = 0) {
    this._size = size;
    this._align = align;
    this._skip = skip;
    this._name = name;
  }
  setTypeDescriptor({ size, alignment, padding }) {
    this._size = size;
    this._align = alignment;
    this._skip = padding;
  }
  /**
   * Number of bytes reserved after value contents.
   * @returns {number}
   */
  get padding() {
    return this._skip;
  }
  /**
   * Returns value type size.
   * @returns {number}
   */
  get size() {
    return this._size;
  }
  /**
   * @type {string}
   */
  get name() {
    return this._name;
  }
  /**
   * Returns type alignment
   * @returns {number}
   */
  get alignment() {
    return this._align;
  }
  /**
   * Align pointer address
   * @param addr
   * @returns Aligned address
   */
  alignAddress(addr) {
    if (addr % this._align === 0) {
      return addr;
    }
    return alignAddr(addr, this._align);
  }
  /**
   * Decodes a value from DataView at passed address and returns a value.
   * Passed address should be aligned.
   *
   * Please consider `read()` for general-purpose use.
   *
   * @abstract
   * @param view Memory view
   * @param addr Address
   * @returns {*}
   */
  decode(view, addr) {
    throw new Error(`${this.constructor.name}.decode: not implemented`);
  }
  /**
   * Encodes and puts value to DataView at passed address.
   * Passed address should be aligned.
   *
   * Please consider `write()` for general-purpose use.
   *
   * @abstract
   * @param view Memory view
   * @param addr Address
   * @param {*} val
   */
  encode(view, addr, val) {
    throw new Error(`${this.constructor.name}.encode: not implemented`);
  }
  /**
   * Reads value at specified offset in memory and returns
   * a value with end offset address.
   *
   * Passed offset address will be aligned before read.
   *
   * @param view Memory
   * @param addr Stack pointer
   * @param buff Original memory buffer
   * @returns {ReadResult}
   */
  read(view, addr, buff) {
    const address = this.alignAddress(addr);
    const value = this.decode(view, address);
    return {
      value,
      address,
      endOffset: address + this.size + this.padding
    };
  }
  /**
   * Encodes and writes a value to DataView at specifying address.
   * Passed address will be aligned before write.
   *
   * @param view
   * @param addr
   * @param val
   * @param buff Original memory buffer
   * @returns {WriteResult}
   */
  write(view, addr, val, buff) {
    const address = this.alignAddress(addr);
    this.encode(view, address, val);
    return {
      address,
      endOffset: address + this.size + this.padding
    };
  }
};

// wasmcode/lib/go/types/basic/boolean.ts
var BooleanTypeSpec = class extends AbstractTypeSpec {
  constructor() {
    super("bool", 1, 1, 0);
  }
  decode(view, addr) {
    const val = view.getUint8(addr);
    return !!val;
  }
  encode(view, addr, data) {
    view.setUint8(addr, +data);
  }
};

// wasmcode/lib/go/types/basic/uint64.ts
var MAX_INT32 = 4294967296;
var UInt64TypeSpec = class extends AbstractTypeSpec {
  constructor(name) {
    super(name, 8, 8, 0);
  }
  decode(view, addr) {
    const low = view.getUint32(addr, true);
    const high = view.getInt32(addr + 4, true);
    return low + high * MAX_INT32;
  }
  encode(view, addr, val) {
    view.setUint32(addr, val, true);
    view.setUint32(addr + 4, Math.floor(val / MAX_INT32), true);
  }
};
var Int64TypeSpec = class extends AbstractTypeSpec {
  constructor(name) {
    super(name, 8, 8, 0);
  }
  decode(view, addr) {
    const low = view.getUint32(addr, true);
    const high = view.getInt32(addr + 4, true);
    return low + high * MAX_INT32;
  }
  encode(view, addr, val) {
    view.setUint32(addr, val, true);
    view.setUint32(addr + 4, Math.floor(val / MAX_INT32), true);
  }
};

// wasmcode/lib/go/types/basic/dataview.ts
var DataViewableTypeSpec = class extends AbstractTypeSpec {
  _readMethod;
  _writeMethod;
  constructor(name, size, align, skip, rwObj) {
    super(name, size, align, skip);
    this._readMethod = rwObj.read;
    this._writeMethod = rwObj.write;
  }
  decode(view, addr) {
    return this._readMethod.call(view, addr, true);
  }
  encode(view, addr, data) {
    this._writeMethod.call(view, addr, data, true);
  }
};

// wasmcode/lib/go/types/basic/index.ts
var Bool = new BooleanTypeSpec();
var Int = new UInt64TypeSpec("int");
var Int64 = new Int64TypeSpec("int64");
var Uint = new UInt64TypeSpec("uint");
var UintPtr = new UInt64TypeSpec("uintptr");
var Byte = new DataViewableTypeSpec("byte", 1, 1, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getUint8,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setUint8
});
var Uint8 = new DataViewableTypeSpec("uint8", 1, 1, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getUint8,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setUint8
});
var Int8 = new DataViewableTypeSpec("int8", 1, 1, 3, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getInt8,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setInt8
});
var Uint32 = new DataViewableTypeSpec("uint32", 4, 4, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getUint32,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setUint32
});
var Int32 = new DataViewableTypeSpec("int32", 4, 4, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getInt32,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setInt32
});
var Uint64 = new DataViewableTypeSpec("uint64", 8, 8, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getBigUint64,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setBigUint64
});
var Float32 = new DataViewableTypeSpec("float32", 4, 4, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getFloat32,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setFloat32
});
var Float64 = new DataViewableTypeSpec("float64", 8, 8, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getFloat64,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setFloat64
});

// wasmcode/lib/go/types/complex/struct.ts
var StructTypeSpec = class extends AbstractTypeSpec {
  _attributes;
  _firstAttr;
  /**
   *
   * @param name Struct name
   * @param {AttributeDescriptor[]} attrs attribute descriptors
   */
  constructor(name, attrs) {
    super(name, 0, 0, 0);
    if (attrs.length === 0) {
      throw new ReferenceError(`${this.constructor.name}: missing struct attributes`);
    }
    const [firstElem] = attrs;
    const totalSize = attrs.map(({ type }) => type.size + type.padding).reduce((total, size) => total + size, 0);
    this.setTypeDescriptor({
      size: totalSize,
      alignment: firstElem.type.alignment,
      padding: 0
    });
    this._attributes = attrs;
    this._firstAttr = firstElem.type;
  }
  get alignment() {
    return this._firstAttr.alignment;
  }
  alignAddress(addr) {
    return this._firstAttr.alignAddress(addr);
  }
  read(view, addr, buff) {
    const address = this._firstAttr.alignAddress(addr);
    let offset = address;
    const entries = [];
    for (const attr of this._attributes) {
      const { key, type } = attr;
      const fieldAddr = type.alignAddress(offset);
      const { value, endOffset } = type.read(view, fieldAddr, buff);
      entries.push([key, value]);
      offset = endOffset;
    }
    const structObj = Object.fromEntries(entries);
    return {
      address,
      endOffset: offset,
      value: this.valueFromStruct(buff, structObj)
    };
  }
  write(view, addr, val, buff) {
    const address = this._firstAttr.alignAddress(addr);
    let offset = address;
    if (typeof val !== "object") {
      throw new ReferenceError(
        `${this.constructor.name}.write: invalid value passed (${typeof val} ${val}). Value should be an object with attributes (${this._attributes.map((a) => a.key).join(", ")}) (struct ${this.name})`
      );
    }
    for (const attr of this._attributes) {
      const { key, type } = attr;
      if (!(key in val)) {
        throw new ReferenceError(
          `${this.constructor.name}.write: missing object property "${key}" (struct ${this.name})`
        );
      }
      const fieldAddr = type.alignAddress(offset);
      const { endOffset } = type.write(view, fieldAddr, val[key], buff);
      offset = endOffset;
    }
    return {
      address,
      endOffset: offset
    };
  }
  /**
   * Returns an original value from struct.
   *
   * This method can be overloaded to return an original value
   * pointed by an original struct.
   *
   * This is useful for obtaining an original slice or string contents
   * from `reflect.StringHeader` or `reflect.SliceHeader` structs.
   *
   * @param buff Raw memory buffer
   * @param structVal original struct value
   * @protected
   */
  valueFromStruct(buff, structVal) {
    return structVal;
  }
  encode(view, addr, val) {
    throw new Error(`${this.constructor.name}.encode: not supported, use write() instead`);
  }
  decode(view, addr) {
    throw new Error(`${this.constructor.name}.decode: not supported, use read() instead`);
  }
};
var Struct = (name, fields) => new StructTypeSpec(name, fields);

// wasmcode/lib/go/types/complex/array.ts
var ArrayTypeSpec = class extends AbstractTypeSpec {
  _elemType;
  _length = 0;
  /**
   * @param {AbstractTypeSpec} elemType Array item type
   * @param {number} length Array size
   */
  constructor(elemType, length) {
    super(`[${length}]${elemType.name}`, (elemType.size + elemType.padding) * length, elemType.alignment, 0);
    if (length < 0) {
      throw new Error(`${this.constructor.name}: array item count should be greater than zero`);
    }
    this._elemType = elemType;
    this._length = length;
  }
  /**
   * Returns array element type.
   * @returns {AbstractTypeSpec}
   */
  get elemType() {
    return this._elemType;
  }
  get length() {
    return this._length;
  }
  get alignment() {
    return this._elemType.alignment;
  }
  alignAddress(addr) {
    return this._elemType.alignAddress(addr);
  }
  read(view, addr, buff) {
    const address = this._elemType.alignAddress(addr);
    let offset = address;
    const entries = [];
    for (let i = 0; i < this._length; i++) {
      const elemAddr = this._elemType.alignAddress(offset);
      const { value, endOffset } = this._elemType.read(view, elemAddr, buff);
      entries.push(value);
      offset = endOffset;
    }
    return {
      address,
      endOffset: offset,
      value: entries
    };
  }
  write(view, addr, val, buff) {
    if (val.length !== this._length) {
      throw new Error(`${this.constructor.name}.write: array length should be ${this._length} (got: ${val.length})`);
    }
    const address = this._elemType.alignAddress(addr);
    let offset = address;
    for (let i = 0; i < this._length; i++) {
      const itemAddr = this._elemType.alignAddress(offset);
      const { endOffset } = this._elemType.write(view, itemAddr, val[i], buff);
      offset = endOffset;
    }
    return {
      address,
      endOffset: offset
    };
  }
  encode(view, addr, val) {
    throw new Error(`${this.constructor.name}.encode: not supported, use write() instead`);
  }
  decode(view, addr) {
    throw new Error(`${this.constructor.name}.decode: not supported, use read() instead`);
  }
};

// wasmcode/lib/go/types/refs/string.ts
var stringEncoder = new TextEncoder();
var stringDecoder = new TextDecoder("utf-8");
var stringStructDescriptor = [
  { key: "data", type: UintPtr },
  { key: "len", type: Int }
];
var GoStringTypeSpec = class extends StructTypeSpec {
  constructor() {
    super("string", stringStructDescriptor);
  }
  valueFromStruct(mem, structVal) {
    const { data, len } = structVal;
    if (!len) {
      return "";
    }
    return stringDecoder.decode(new DataView(mem, data, len));
  }
};
var GoStringType = new GoStringTypeSpec();
var StringHeaderType = new StructTypeSpec("reflect.StringHeader", stringStructDescriptor);

// wasmcode/lib/go/types/refs/slice.ts
var sliceHeaderAttrs = [
  { key: "data", type: UintPtr },
  { key: "len", type: Int },
  { key: "cap", type: Int }
];
var SliceHeaderType = new StructTypeSpec("reflect.SliceHeader", sliceHeaderAttrs);
var SliceTypeSpec = class extends StructTypeSpec {
  constructor(elemType) {
    super(`[]${elemType.name}`, sliceHeaderAttrs);
    this.elemType = elemType;
  }
  valueFromStruct(buff, header) {
    const { data, len } = header;
    if (!data || !len) {
      return [];
    }
    const t = new ArrayTypeSpec(this.elemType, len);
    const { value } = t.read(new DataView(buff), data, buff);
    return value;
  }
};
var SliceOf = (itemType) => new SliceTypeSpec(itemType);
var StringSlice = SliceOf(GoStringType);
var IntSlice = SliceOf(Int);
var Int32Slice = SliceOf(Int32);
var Int64Slice = SliceOf(Int64);
var UintSlice = SliceOf(Uint);
var Uint32Slice = SliceOf(Uint32);
var Uint64Slice = SliceOf(Uint64);
var UintPtrSlice = SliceOf(UintPtr);
var BoolSlice = SliceOf(Bool);

// wasmcode/lib/go/pkg/syscall/js/value.ts
var ValueType = Struct("syscall/js.Value", [
  { key: "ref", type: UintPtr },
  { key: "gcPtr", type: UintPtr }
]);
var FuncType = Struct("syscall/js.Func", [
  { key: "value", type: ValueType },
  { key: "id", type: Uint32 }
]);
var ValueSlice = SliceOf(ValueType);

// wasmcode/lib/go/pkg/syscall/js/ref.ts
var NAN_HEAD = 2146959360;
var getTypeFlag = (v) => {
  switch (typeof v) {
    case "object":
      return v === null ? 0 /* Empty */ : 1 /* Object */;
    case "string":
      return 2 /* String */;
    case "symbol":
      return 3 /* Symbol */;
    case "function":
      return 4 /* Function */;
    default:
      return 0 /* Empty */;
  }
};
var Ref = class _Ref {
  /**
   * Ref constructor
   * @param kind Reference source type, used to decode JS value from reference.
   * @param ref Reference ID
   * @param data Extra data for write on encode.
   */
  constructor(kind, ref = -1, data) {
    this.kind = kind;
    this.ref = ref;
    this.data = data;
  }
  /**
   * Returns a resolved JS value from ref.
   * @param values Values table
   */
  toValue(values) {
    switch (this.kind) {
      case 2 /* ID */:
        return values[this.ref];
      case 1 /* Value */:
        return this.ref;
      default:
        return void 0;
    }
  }
  /**
   * Creates a new writable Ref from value and ref ID.
   *
   * @param v Value
   * @param valId Ref ID
   */
  static fromValue(v, valId) {
    if (v instanceof _Ref) {
      throw new Error(`Ref.fromValue: value is already a Ref (${v.ref})`);
    }
    if (typeof v === "number" && v !== 0) {
      const kind = isNaN(v) ? 2 /* ID */ : 1 /* Value */;
      return new _Ref(kind, valId, isNaN(v) ? [0, NAN_HEAD] : [v]);
    }
    if (v === void 0) {
      return new _Ref(1 /* Value */, valId, [0]);
    }
    const typeFlag = getTypeFlag(v);
    const head = NAN_HEAD | typeFlag;
    return new _Ref(2 /* ID */, valId, [valId, head]);
  }
  /**
   * Reports whenever value should be referenced
   * by values table or can be stored as Ref value.
   *
   * Used by writer to decide if necessary to allocate
   * a new ref id or not.
   *
   * @param v
   */
  static isReferenceableValue(v) {
    if (typeof v === "number" && v !== 0) {
      return false;
    }
    return v !== void 0;
  }
};
var RefTypeSpec = class extends AbstractTypeSpec {
  constructor() {
    super("syscall.js/ref", 8, 8, 0);
  }
  decode(view, addr) {
    const value = view.getFloat64(addr, true);
    if (value === 0) {
      return new Ref(0 /* Invalid */);
    }
    if (!isNaN(value)) {
      return new Ref(1 /* Value */, value);
    }
    const id = view.getUint32(addr, true);
    return new Ref(2 /* ID */, id);
  }
  encode(view, addr, ref) {
    if (!ref.data?.length) {
      throw new Error(
        `${this.constructor.name}.encode: Ref value is not writable. Ref should be created using Ref.fromValue() method.`
      );
    }
    const [high, low] = ref.data;
    switch (ref.data.length) {
      case 1:
        view.setFloat64(addr, high, true);
        return;
      case 2:
        view.setUint32(addr, high, true);
        view.setUint32(addr + Uint32.size, low, true);
        return;
      default:
        throw new Error(`${this.constructor.name}.encode: invalid Ref data size: ${ref.data.length}`);
    }
  }
};
var RefType = new RefTypeSpec();
var RefSlice = SliceOf(RefType);

// wasmcode/analyzer/bootstrap.ts
var getWasmUrl = (name) => `/static/${name}@v1.wasm`;
var wrapModule = (mod) => {
  const wrapped = {
    // eslint-disable-next-line no-useless-call
    exit: () => mod.exit.call(mod)
  };
  Object.keys(mod).filter((k) => k !== "exit").forEach((fnName) => {
    wrapped[fnName] = async (...args) => await new Promise((resolve, reject) => {
      const cb = (rawResp) => {
        try {
          const resp = JSON.parse(rawResp);
          if (resp.error) {
            reject(new Error(`${fnName}: ${resp.error}`));
            return;
          }
          resolve(resp.result);
        } catch (ex) {
          console.error(`analyzer: "${fnName}" returned and error`, ex);
          reject(new Error(`${fnName}: ${ex}`));
        }
      };
      const newArgs = args.concat(cb);
      mod[fnName].apply(self, newArgs);
    });
  });
  return wrapped;
};
var startAnalyzer = async () => {
  const workerUrl = getWasmUrl("analyzer");
  const go = new globalThis.Go();
  go.argv = ["js", "onModuleInit"];
  const rsp = await fetch(workerUrl);
  if (!rsp.ok) {
    throw new Error(`Failed to fetch worker: ${rsp.status} ${rsp.statusText}`);
  }
  const { instance } = await instantiateStreaming(rsp, go.importObject);
  return await new Promise((resolve, reject) => {
    globalThis.onModuleInit = (goMod) => {
      console.log("analyzer: started");
      const wrapped = wrapModule(goMod);
      return resolve(wrapped);
    };
    go.run(instance).catch((err) => {
      reject(err);
    });
  });
};

// wasmcode/analyzer/analyzer.worker.ts
var appendModelVersion = (markers, modelVersionId) => {
  if (!markers) {
    return null;
  }
  return markers.map((marker) => ({ ...marker, modelVersionId }));
};
var WorkerHandler = class {
  mod;
  initPromise = startAnalyzer();
  async getModule() {
    this.mod ??= await this.initPromise;
    return this.mod;
  }
  async runCode(r) {
    const mod = await this.getModule();
    try {
      return await mod.runCode(r);
    } catch (e) {
      return {
        output: "",
        error: e.toString()
      };
    }
  }
  async parseCode({ contents }) {
    const mod = await this.getModule();
    try {
      return await mod.parseCode(contents);
    } catch (e) {
      return {
        error: e.toString(),
        functions: []
      };
    }
  }
  async checkSyntaxErrors({ fileName, modelVersionId, contents }) {
    const mod = await this.getModule();
    const { markers } = await mod.analyzeCode(contents);
    return {
      fileName,
      modelVersionId,
      markers: appendModelVersion(markers, modelVersionId)
    };
  }
};
expose(new WorkerHandler());
export {
  WorkerHandler
};
/*! Bundled license information:

comlink/dist/esm/comlink.mjs:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: Apache-2.0
   *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NvbWxpbmsvc3JjL2NvbWxpbmsudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3dhc21fZXhlYy5qcyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vZGVidWcvdXRpbHMudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL2RlYnVnL21lbW9yeS50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vY29tbW9uLnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2xpYi9nby90eXBlcy9jb21tb24udHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL3NwZWMudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL2Jhc2ljL2Jvb2xlYW4udHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL2Jhc2ljL3VpbnQ2NC50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vdHlwZXMvYmFzaWMvZGF0YXZpZXcudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL2Jhc2ljL2luZGV4LnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2xpYi9nby90eXBlcy9jb21wbGV4L3N0cnVjdC50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vdHlwZXMvY29tcGxleC9hcnJheS50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vdHlwZXMvcmVmcy9zdHJpbmcudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL3JlZnMvc2xpY2UudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3BrZy9zeXNjYWxsL2pzL3ZhbHVlLnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2xpYi9nby9wa2cvc3lzY2FsbC9qcy9yZWYudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvYW5hbHl6ZXIvYm9vdHN0cmFwLnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2FuYWx5emVyL2FuYWx5emVyLndvcmtlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTkgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjBcbiAqL1xuXG5pbXBvcnQge1xuICBFbmRwb2ludCxcbiAgRXZlbnRTb3VyY2UsXG4gIE1lc3NhZ2UsXG4gIE1lc3NhZ2VUeXBlLFxuICBQb3N0TWVzc2FnZVdpdGhPcmlnaW4sXG4gIFdpcmVWYWx1ZSxcbiAgV2lyZVZhbHVlVHlwZSxcbn0gZnJvbSBcIi4vcHJvdG9jb2xcIjtcbmV4cG9ydCB0eXBlIHsgRW5kcG9pbnQgfTtcblxuZXhwb3J0IGNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKFwiQ29tbGluay5wcm94eVwiKTtcbmV4cG9ydCBjb25zdCBjcmVhdGVFbmRwb2ludCA9IFN5bWJvbChcIkNvbWxpbmsuZW5kcG9pbnRcIik7XG5leHBvcnQgY29uc3QgcmVsZWFzZVByb3h5ID0gU3ltYm9sKFwiQ29tbGluay5yZWxlYXNlUHJveHlcIik7XG5leHBvcnQgY29uc3QgZmluYWxpemVyID0gU3ltYm9sKFwiQ29tbGluay5maW5hbGl6ZXJcIik7XG5cbmNvbnN0IHRocm93TWFya2VyID0gU3ltYm9sKFwiQ29tbGluay50aHJvd25cIik7XG5cbi8qKlxuICogSW50ZXJmYWNlIG9mIHZhbHVlcyB0aGF0IHdlcmUgbWFya2VkIHRvIGJlIHByb3hpZWQgd2l0aCBgY29tbGluay5wcm94eSgpYC5cbiAqIENhbiBhbHNvIGJlIGltcGxlbWVudGVkIGJ5IGNsYXNzZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJveHlNYXJrZWQge1xuICBbcHJveHlNYXJrZXJdOiB0cnVlO1xufVxuXG4vKipcbiAqIFRha2VzIGEgdHlwZSBhbmQgd3JhcHMgaXQgaW4gYSBQcm9taXNlLCBpZiBpdCBub3QgYWxyZWFkeSBpcyBvbmUuXG4gKiBUaGlzIGlzIHRvIGF2b2lkIGBQcm9taXNlPFByb21pc2U8VD4+YC5cbiAqXG4gKiBUaGlzIGlzIHRoZSBpbnZlcnNlIG9mIGBVbnByb21pc2lmeTxUPmAuXG4gKi9cbnR5cGUgUHJvbWlzaWZ5PFQ+ID0gVCBleHRlbmRzIFByb21pc2U8dW5rbm93bj4gPyBUIDogUHJvbWlzZTxUPjtcbi8qKlxuICogVGFrZXMgYSB0eXBlIHRoYXQgbWF5IGJlIFByb21pc2UgYW5kIHVud3JhcHMgdGhlIFByb21pc2UgdHlwZS5cbiAqIElmIGBQYCBpcyBub3QgYSBQcm9taXNlLCBpdCByZXR1cm5zIGBQYC5cbiAqXG4gKiBUaGlzIGlzIHRoZSBpbnZlcnNlIG9mIGBQcm9taXNpZnk8VD5gLlxuICovXG50eXBlIFVucHJvbWlzaWZ5PFA+ID0gUCBleHRlbmRzIFByb21pc2U8aW5mZXIgVD4gPyBUIDogUDtcblxuLyoqXG4gKiBUYWtlcyB0aGUgcmF3IHR5cGUgb2YgYSByZW1vdGUgcHJvcGVydHkgYW5kIHJldHVybnMgdGhlIHR5cGUgdGhhdCBpcyB2aXNpYmxlIHRvIHRoZSBsb2NhbCB0aHJlYWQgb24gdGhlIHByb3h5LlxuICpcbiAqIE5vdGU6IFRoaXMgbmVlZHMgdG8gYmUgaXRzIG93biB0eXBlIGFsaWFzLCBvdGhlcndpc2UgaXQgd2lsbCBub3QgZGlzdHJpYnV0ZSBvdmVyIHVuaW9ucy5cbiAqIFNlZSBodHRwczovL3d3dy50eXBlc2NyaXB0bGFuZy5vcmcvZG9jcy9oYW5kYm9vay9hZHZhbmNlZC10eXBlcy5odG1sI2Rpc3RyaWJ1dGl2ZS1jb25kaXRpb25hbC10eXBlc1xuICovXG50eXBlIFJlbW90ZVByb3BlcnR5PFQ+ID1cbiAgLy8gSWYgdGhlIHZhbHVlIGlzIGEgbWV0aG9kLCBjb21saW5rIHdpbGwgcHJveHkgaXQgYXV0b21hdGljYWxseS5cbiAgLy8gT2JqZWN0cyBhcmUgb25seSBwcm94aWVkIGlmIHRoZXkgYXJlIG1hcmtlZCB0byBiZSBwcm94aWVkLlxuICAvLyBPdGhlcndpc2UsIHRoZSBwcm9wZXJ0eSBpcyBjb252ZXJ0ZWQgdG8gYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdGhlIGNsb25lZCB2YWx1ZS5cbiAgVCBleHRlbmRzIEZ1bmN0aW9uIHwgUHJveHlNYXJrZWQgPyBSZW1vdGU8VD4gOiBQcm9taXNpZnk8VD47XG5cbi8qKlxuICogVGFrZXMgdGhlIHJhdyB0eXBlIG9mIGEgcHJvcGVydHkgYXMgYSByZW1vdGUgdGhyZWFkIHdvdWxkIHNlZSBpdCB0aHJvdWdoIGEgcHJveHkgKGUuZy4gd2hlbiBwYXNzZWQgaW4gYXMgYSBmdW5jdGlvblxuICogYXJndW1lbnQpIGFuZCByZXR1cm5zIHRoZSB0eXBlIHRoYXQgdGhlIGxvY2FsIHRocmVhZCBoYXMgdG8gc3VwcGx5LlxuICpcbiAqIFRoaXMgaXMgdGhlIGludmVyc2Ugb2YgYFJlbW90ZVByb3BlcnR5PFQ+YC5cbiAqXG4gKiBOb3RlOiBUaGlzIG5lZWRzIHRvIGJlIGl0cyBvd24gdHlwZSBhbGlhcywgb3RoZXJ3aXNlIGl0IHdpbGwgbm90IGRpc3RyaWJ1dGUgb3ZlciB1bmlvbnMuIFNlZVxuICogaHR0cHM6Ly93d3cudHlwZXNjcmlwdGxhbmcub3JnL2RvY3MvaGFuZGJvb2svYWR2YW5jZWQtdHlwZXMuaHRtbCNkaXN0cmlidXRpdmUtY29uZGl0aW9uYWwtdHlwZXNcbiAqL1xudHlwZSBMb2NhbFByb3BlcnR5PFQ+ID0gVCBleHRlbmRzIEZ1bmN0aW9uIHwgUHJveHlNYXJrZWRcbiAgPyBMb2NhbDxUPlxuICA6IFVucHJvbWlzaWZ5PFQ+O1xuXG4vKipcbiAqIFByb3hpZXMgYFRgIGlmIGl0IGlzIGEgYFByb3h5TWFya2VkYCwgY2xvbmVzIGl0IG90aGVyd2lzZSAoYXMgaGFuZGxlZCBieSBzdHJ1Y3R1cmVkIGNsb25pbmcgYW5kIHRyYW5zZmVyIGhhbmRsZXJzKS5cbiAqL1xuZXhwb3J0IHR5cGUgUHJveHlPckNsb25lPFQ+ID0gVCBleHRlbmRzIFByb3h5TWFya2VkID8gUmVtb3RlPFQ+IDogVDtcbi8qKlxuICogSW52ZXJzZSBvZiBgUHJveHlPckNsb25lPFQ+YC5cbiAqL1xuZXhwb3J0IHR5cGUgVW5wcm94eU9yQ2xvbmU8VD4gPSBUIGV4dGVuZHMgUmVtb3RlT2JqZWN0PFByb3h5TWFya2VkPlxuICA/IExvY2FsPFQ+XG4gIDogVDtcblxuLyoqXG4gKiBUYWtlcyB0aGUgcmF3IHR5cGUgb2YgYSByZW1vdGUgb2JqZWN0IGluIHRoZSBvdGhlciB0aHJlYWQgYW5kIHJldHVybnMgdGhlIHR5cGUgYXMgaXQgaXMgdmlzaWJsZSB0byB0aGUgbG9jYWwgdGhyZWFkXG4gKiB3aGVuIHByb3hpZWQgd2l0aCBgQ29tbGluay5wcm94eSgpYC5cbiAqXG4gKiBUaGlzIGRvZXMgbm90IGhhbmRsZSBjYWxsIHNpZ25hdHVyZXMsIHdoaWNoIGlzIGhhbmRsZWQgYnkgdGhlIG1vcmUgZ2VuZXJhbCBgUmVtb3RlPFQ+YCB0eXBlLlxuICpcbiAqIEB0ZW1wbGF0ZSBUIFRoZSByYXcgdHlwZSBvZiBhIHJlbW90ZSBvYmplY3QgYXMgc2VlbiBpbiB0aGUgb3RoZXIgdGhyZWFkLlxuICovXG5leHBvcnQgdHlwZSBSZW1vdGVPYmplY3Q8VD4gPSB7IFtQIGluIGtleW9mIFRdOiBSZW1vdGVQcm9wZXJ0eTxUW1BdPiB9O1xuLyoqXG4gKiBUYWtlcyB0aGUgdHlwZSBvZiBhbiBvYmplY3QgYXMgYSByZW1vdGUgdGhyZWFkIHdvdWxkIHNlZSBpdCB0aHJvdWdoIGEgcHJveHkgKGUuZy4gd2hlbiBwYXNzZWQgaW4gYXMgYSBmdW5jdGlvblxuICogYXJndW1lbnQpIGFuZCByZXR1cm5zIHRoZSB0eXBlIHRoYXQgdGhlIGxvY2FsIHRocmVhZCBoYXMgdG8gc3VwcGx5LlxuICpcbiAqIFRoaXMgZG9lcyBub3QgaGFuZGxlIGNhbGwgc2lnbmF0dXJlcywgd2hpY2ggaXMgaGFuZGxlZCBieSB0aGUgbW9yZSBnZW5lcmFsIGBMb2NhbDxUPmAgdHlwZS5cbiAqXG4gKiBUaGlzIGlzIHRoZSBpbnZlcnNlIG9mIGBSZW1vdGVPYmplY3Q8VD5gLlxuICpcbiAqIEB0ZW1wbGF0ZSBUIFRoZSB0eXBlIG9mIGEgcHJveGllZCBvYmplY3QuXG4gKi9cbmV4cG9ydCB0eXBlIExvY2FsT2JqZWN0PFQ+ID0geyBbUCBpbiBrZXlvZiBUXTogTG9jYWxQcm9wZXJ0eTxUW1BdPiB9O1xuXG4vKipcbiAqIEFkZGl0aW9uYWwgc3BlY2lhbCBjb21saW5rIG1ldGhvZHMgYXZhaWxhYmxlIG9uIGVhY2ggcHJveHkgcmV0dXJuZWQgYnkgYENvbWxpbmsud3JhcCgpYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm94eU1ldGhvZHMge1xuICBbY3JlYXRlRW5kcG9pbnRdOiAoKSA9PiBQcm9taXNlPE1lc3NhZ2VQb3J0PjtcbiAgW3JlbGVhc2VQcm94eV06ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogVGFrZXMgdGhlIHJhdyB0eXBlIG9mIGEgcmVtb3RlIG9iamVjdCwgZnVuY3Rpb24gb3IgY2xhc3MgaW4gdGhlIG90aGVyIHRocmVhZCBhbmQgcmV0dXJucyB0aGUgdHlwZSBhcyBpdCBpcyB2aXNpYmxlIHRvXG4gKiB0aGUgbG9jYWwgdGhyZWFkIGZyb20gdGhlIHByb3h5IHJldHVybiB2YWx1ZSBvZiBgQ29tbGluay53cmFwKClgIG9yIGBDb21saW5rLnByb3h5KClgLlxuICovXG5leHBvcnQgdHlwZSBSZW1vdGU8VD4gPVxuICAvLyBIYW5kbGUgcHJvcGVydGllc1xuICBSZW1vdGVPYmplY3Q8VD4gJlxuICAgIC8vIEhhbmRsZSBjYWxsIHNpZ25hdHVyZSAoaWYgcHJlc2VudClcbiAgICAoVCBleHRlbmRzICguLi5hcmdzOiBpbmZlciBUQXJndW1lbnRzKSA9PiBpbmZlciBUUmV0dXJuXG4gICAgICA/IChcbiAgICAgICAgICAuLi5hcmdzOiB7IFtJIGluIGtleW9mIFRBcmd1bWVudHNdOiBVbnByb3h5T3JDbG9uZTxUQXJndW1lbnRzW0ldPiB9XG4gICAgICAgICkgPT4gUHJvbWlzaWZ5PFByb3h5T3JDbG9uZTxVbnByb21pc2lmeTxUUmV0dXJuPj4+XG4gICAgICA6IHVua25vd24pICZcbiAgICAvLyBIYW5kbGUgY29uc3RydWN0IHNpZ25hdHVyZSAoaWYgcHJlc2VudClcbiAgICAvLyBUaGUgcmV0dXJuIG9mIGNvbnN0cnVjdCBzaWduYXR1cmVzIGlzIGFsd2F5cyBwcm94aWVkICh3aGV0aGVyIG1hcmtlZCBvciBub3QpXG4gICAgKFQgZXh0ZW5kcyB7IG5ldyAoLi4uYXJnczogaW5mZXIgVEFyZ3VtZW50cyk6IGluZmVyIFRJbnN0YW5jZSB9XG4gICAgICA/IHtcbiAgICAgICAgICBuZXcgKFxuICAgICAgICAgICAgLi4uYXJnczoge1xuICAgICAgICAgICAgICBbSSBpbiBrZXlvZiBUQXJndW1lbnRzXTogVW5wcm94eU9yQ2xvbmU8VEFyZ3VtZW50c1tJXT47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTogUHJvbWlzaWZ5PFJlbW90ZTxUSW5zdGFuY2U+PjtcbiAgICAgICAgfVxuICAgICAgOiB1bmtub3duKSAmXG4gICAgLy8gSW5jbHVkZSBhZGRpdGlvbmFsIHNwZWNpYWwgY29tbGluayBtZXRob2RzIGF2YWlsYWJsZSBvbiB0aGUgcHJveHkuXG4gICAgUHJveHlNZXRob2RzO1xuXG4vKipcbiAqIEV4cHJlc3NlcyB0aGF0IGEgdHlwZSBjYW4gYmUgZWl0aGVyIGEgc3luYyBvciBhc3luYy5cbiAqL1xudHlwZSBNYXliZVByb21pc2U8VD4gPSBQcm9taXNlPFQ+IHwgVDtcblxuLyoqXG4gKiBUYWtlcyB0aGUgcmF3IHR5cGUgb2YgYSByZW1vdGUgb2JqZWN0LCBmdW5jdGlvbiBvciBjbGFzcyBhcyBhIHJlbW90ZSB0aHJlYWQgd291bGQgc2VlIGl0IHRocm91Z2ggYSBwcm94eSAoZS5nLiB3aGVuXG4gKiBwYXNzZWQgaW4gYXMgYSBmdW5jdGlvbiBhcmd1bWVudCkgYW5kIHJldHVybnMgdGhlIHR5cGUgdGhlIGxvY2FsIHRocmVhZCBoYXMgdG8gc3VwcGx5LlxuICpcbiAqIFRoaXMgaXMgdGhlIGludmVyc2Ugb2YgYFJlbW90ZTxUPmAuIEl0IHRha2VzIGEgYFJlbW90ZTxUPmAgYW5kIHJldHVybnMgaXRzIG9yaWdpbmFsIGlucHV0IGBUYC5cbiAqL1xuZXhwb3J0IHR5cGUgTG9jYWw8VD4gPVxuICAvLyBPbWl0IHRoZSBzcGVjaWFsIHByb3h5IG1ldGhvZHMgKHRoZXkgZG9uJ3QgbmVlZCB0byBiZSBzdXBwbGllZCwgY29tbGluayBhZGRzIHRoZW0pXG4gIE9taXQ8TG9jYWxPYmplY3Q8VD4sIGtleW9mIFByb3h5TWV0aG9kcz4gJlxuICAgIC8vIEhhbmRsZSBjYWxsIHNpZ25hdHVyZXMgKGlmIHByZXNlbnQpXG4gICAgKFQgZXh0ZW5kcyAoLi4uYXJnczogaW5mZXIgVEFyZ3VtZW50cykgPT4gaW5mZXIgVFJldHVyblxuICAgICAgPyAoXG4gICAgICAgICAgLi4uYXJnczogeyBbSSBpbiBrZXlvZiBUQXJndW1lbnRzXTogUHJveHlPckNsb25lPFRBcmd1bWVudHNbSV0+IH1cbiAgICAgICAgKSA9PiAvLyBUaGUgcmF3IGZ1bmN0aW9uIGNvdWxkIGVpdGhlciBiZSBzeW5jIG9yIGFzeW5jLCBidXQgaXMgYWx3YXlzIHByb3hpZWQgYXV0b21hdGljYWxseVxuICAgICAgICBNYXliZVByb21pc2U8VW5wcm94eU9yQ2xvbmU8VW5wcm9taXNpZnk8VFJldHVybj4+PlxuICAgICAgOiB1bmtub3duKSAmXG4gICAgLy8gSGFuZGxlIGNvbnN0cnVjdCBzaWduYXR1cmUgKGlmIHByZXNlbnQpXG4gICAgLy8gVGhlIHJldHVybiBvZiBjb25zdHJ1Y3Qgc2lnbmF0dXJlcyBpcyBhbHdheXMgcHJveGllZCAod2hldGhlciBtYXJrZWQgb3Igbm90KVxuICAgIChUIGV4dGVuZHMgeyBuZXcgKC4uLmFyZ3M6IGluZmVyIFRBcmd1bWVudHMpOiBpbmZlciBUSW5zdGFuY2UgfVxuICAgICAgPyB7XG4gICAgICAgICAgbmV3IChcbiAgICAgICAgICAgIC4uLmFyZ3M6IHtcbiAgICAgICAgICAgICAgW0kgaW4ga2V5b2YgVEFyZ3VtZW50c106IFByb3h5T3JDbG9uZTxUQXJndW1lbnRzW0ldPjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApOiAvLyBUaGUgcmF3IGNvbnN0cnVjdG9yIGNvdWxkIGVpdGhlciBiZSBzeW5jIG9yIGFzeW5jLCBidXQgaXMgYWx3YXlzIHByb3hpZWQgYXV0b21hdGljYWxseVxuICAgICAgICAgIE1heWJlUHJvbWlzZTxMb2NhbDxVbnByb21pc2lmeTxUSW5zdGFuY2U+Pj47XG4gICAgICAgIH1cbiAgICAgIDogdW5rbm93bik7XG5cbmNvbnN0IGlzT2JqZWN0ID0gKHZhbDogdW5rbm93bik6IHZhbCBpcyBvYmplY3QgPT5cbiAgKHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIgJiYgdmFsICE9PSBudWxsKSB8fCB0eXBlb2YgdmFsID09PSBcImZ1bmN0aW9uXCI7XG5cbi8qKlxuICogQ3VzdG9taXplcyB0aGUgc2VyaWFsaXphdGlvbiBvZiBjZXJ0YWluIHZhbHVlcyBhcyBkZXRlcm1pbmVkIGJ5IGBjYW5IYW5kbGUoKWAuXG4gKlxuICogQHRlbXBsYXRlIFQgVGhlIGlucHV0IHR5cGUgYmVpbmcgaGFuZGxlZCBieSB0aGlzIHRyYW5zZmVyIGhhbmRsZXIuXG4gKiBAdGVtcGxhdGUgUyBUaGUgc2VyaWFsaXplZCB0eXBlIHNlbnQgb3ZlciB0aGUgd2lyZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmFuc2ZlckhhbmRsZXI8VCwgUz4ge1xuICAvKipcbiAgICogR2V0cyBjYWxsZWQgZm9yIGV2ZXJ5IHZhbHVlIHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMgdHJhbnNmZXIgaGFuZGxlclxuICAgKiBzaG91bGQgc2VyaWFsaXplIHRoZSB2YWx1ZSwgd2hpY2ggaW5jbHVkZXMgY2hlY2tpbmcgdGhhdCBpdCBpcyBvZiB0aGUgcmlnaHRcbiAgICogdHlwZSAoYnV0IGNhbiBwZXJmb3JtIGNoZWNrcyBiZXlvbmQgdGhhdCBhcyB3ZWxsKS5cbiAgICovXG4gIGNhbkhhbmRsZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFQ7XG5cbiAgLyoqXG4gICAqIEdldHMgY2FsbGVkIHdpdGggdGhlIHZhbHVlIGlmIGBjYW5IYW5kbGUoKWAgcmV0dXJuZWQgYHRydWVgIHRvIHByb2R1Y2UgYVxuICAgKiB2YWx1ZSB0aGF0IGNhbiBiZSBzZW50IGluIGEgbWVzc2FnZSwgY29uc2lzdGluZyBvZiBzdHJ1Y3R1cmVkLWNsb25lYWJsZVxuICAgKiB2YWx1ZXMgYW5kL29yIHRyYW5zZmVycmFibGUgb2JqZWN0cy5cbiAgICovXG4gIHNlcmlhbGl6ZSh2YWx1ZTogVCk6IFtTLCBUcmFuc2ZlcmFibGVbXV07XG5cbiAgLyoqXG4gICAqIEdldHMgY2FsbGVkIHRvIGRlc2VyaWFsaXplIGFuIGluY29taW5nIHZhbHVlIHRoYXQgd2FzIHNlcmlhbGl6ZWQgaW4gdGhlXG4gICAqIG90aGVyIHRocmVhZCB3aXRoIHRoaXMgdHJhbnNmZXIgaGFuZGxlciAoa25vd24gdGhyb3VnaCB0aGUgbmFtZSBpdCB3YXNcbiAgICogcmVnaXN0ZXJlZCB1bmRlcikuXG4gICAqL1xuICBkZXNlcmlhbGl6ZSh2YWx1ZTogUyk6IFQ7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdHJhbnNmZXIgaGFuZGxlIHRvIGhhbmRsZSBvYmplY3RzIG1hcmtlZCB0byBwcm94eS5cbiAqL1xuY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXI6IFRyYW5zZmVySGFuZGxlcjxvYmplY3QsIE1lc3NhZ2VQb3J0PiA9IHtcbiAgY2FuSGFuZGxlOiAodmFsKTogdmFsIGlzIFByb3h5TWFya2VkID0+XG4gICAgaXNPYmplY3QodmFsKSAmJiAodmFsIGFzIFByb3h5TWFya2VkKVtwcm94eU1hcmtlcl0sXG4gIHNlcmlhbGl6ZShvYmopIHtcbiAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgZXhwb3NlKG9iaiwgcG9ydDEpO1xuICAgIHJldHVybiBbcG9ydDIsIFtwb3J0Ml1dO1xuICB9LFxuICBkZXNlcmlhbGl6ZShwb3J0KSB7XG4gICAgcG9ydC5zdGFydCgpO1xuICAgIHJldHVybiB3cmFwKHBvcnQpO1xuICB9LFxufTtcblxuaW50ZXJmYWNlIFRocm93blZhbHVlIHtcbiAgW3Rocm93TWFya2VyXTogdW5rbm93bjsgLy8ganVzdCBuZWVkcyB0byBiZSBwcmVzZW50XG4gIHZhbHVlOiB1bmtub3duO1xufVxudHlwZSBTZXJpYWxpemVkVGhyb3duVmFsdWUgPVxuICB8IHsgaXNFcnJvcjogdHJ1ZTsgdmFsdWU6IEVycm9yIH1cbiAgfCB7IGlzRXJyb3I6IGZhbHNlOyB2YWx1ZTogdW5rbm93biB9O1xuXG4vKipcbiAqIEludGVybmFsIHRyYW5zZmVyIGhhbmRsZXIgdG8gaGFuZGxlIHRocm93biBleGNlcHRpb25zLlxuICovXG5jb25zdCB0aHJvd1RyYW5zZmVySGFuZGxlcjogVHJhbnNmZXJIYW5kbGVyPFxuICBUaHJvd25WYWx1ZSxcbiAgU2VyaWFsaXplZFRocm93blZhbHVlXG4+ID0ge1xuICBjYW5IYW5kbGU6ICh2YWx1ZSk6IHZhbHVlIGlzIFRocm93blZhbHVlID0+XG4gICAgaXNPYmplY3QodmFsdWUpICYmIHRocm93TWFya2VyIGluIHZhbHVlLFxuICBzZXJpYWxpemUoeyB2YWx1ZSB9KSB7XG4gICAgbGV0IHNlcmlhbGl6ZWQ6IFNlcmlhbGl6ZWRUaHJvd25WYWx1ZTtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgc2VyaWFsaXplZCA9IHtcbiAgICAgICAgaXNFcnJvcjogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiB2YWx1ZS5tZXNzYWdlLFxuICAgICAgICAgIG5hbWU6IHZhbHVlLm5hbWUsXG4gICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07XG4gICAgfVxuICAgIHJldHVybiBbc2VyaWFsaXplZCwgW11dO1xuICB9LFxuICBkZXNlcmlhbGl6ZShzZXJpYWxpemVkKSB7XG4gICAgaWYgKHNlcmlhbGl6ZWQuaXNFcnJvcikge1xuICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgbmV3IEVycm9yKHNlcmlhbGl6ZWQudmFsdWUubWVzc2FnZSksXG4gICAgICAgIHNlcmlhbGl6ZWQudmFsdWVcbiAgICAgICk7XG4gICAgfVxuICAgIHRocm93IHNlcmlhbGl6ZWQudmFsdWU7XG4gIH0sXG59O1xuXG4vKipcbiAqIEFsbG93cyBjdXN0b21pemluZyB0aGUgc2VyaWFsaXphdGlvbiBvZiBjZXJ0YWluIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IHRyYW5zZmVySGFuZGxlcnMgPSBuZXcgTWFwPFxuICBzdHJpbmcsXG4gIFRyYW5zZmVySGFuZGxlcjx1bmtub3duLCB1bmtub3duPlxuPihbXG4gIFtcInByb3h5XCIsIHByb3h5VHJhbnNmZXJIYW5kbGVyXSxcbiAgW1widGhyb3dcIiwgdGhyb3dUcmFuc2ZlckhhbmRsZXJdLFxuXSk7XG5cbmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihcbiAgYWxsb3dlZE9yaWdpbnM6IChzdHJpbmcgfCBSZWdFeHApW10sXG4gIG9yaWdpbjogc3RyaW5nXG4pOiBib29sZWFuIHtcbiAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7XG4gICAgaWYgKG9yaWdpbiA9PT0gYWxsb3dlZE9yaWdpbiB8fCBhbGxvd2VkT3JpZ2luID09PSBcIipcIikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwb3NlKFxuICBvYmo6IGFueSxcbiAgZXA6IEVuZHBvaW50ID0gZ2xvYmFsVGhpcyBhcyBhbnksXG4gIGFsbG93ZWRPcmlnaW5zOiAoc3RyaW5nIHwgUmVnRXhwKVtdID0gW1wiKlwiXVxuKSB7XG4gIGVwLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2OiBNZXNzYWdlRXZlbnQpIHtcbiAgICBpZiAoIWV2IHx8ICFldi5kYXRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghaXNBbGxvd2VkT3JpZ2luKGFsbG93ZWRPcmlnaW5zLCBldi5vcmlnaW4pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgb3JpZ2luICcke2V2Lm9yaWdpbn0nIGZvciBjb21saW5rIHByb3h5YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHsgaWQsIHR5cGUsIHBhdGggfSA9IHtcbiAgICAgIHBhdGg6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgLi4uKGV2LmRhdGEgYXMgTWVzc2FnZSksXG4gICAgfTtcbiAgICBjb25zdCBhcmd1bWVudExpc3QgPSAoZXYuZGF0YS5hcmd1bWVudExpc3QgfHwgW10pLm1hcChmcm9tV2lyZVZhbHVlKTtcbiAgICBsZXQgcmV0dXJuVmFsdWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHBhdGguc2xpY2UoMCwgLTEpLnJlZHVjZSgob2JqLCBwcm9wKSA9PiBvYmpbcHJvcF0sIG9iaik7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHBhdGgucmVkdWNlKChvYmosIHByb3ApID0+IG9ialtwcm9wXSwgb2JqKTtcbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkdFVDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHJhd1ZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5TRVQ6XG4gICAgICAgICAge1xuICAgICAgICAgICAgcGFyZW50W3BhdGguc2xpY2UoLTEpWzBdXSA9IGZyb21XaXJlVmFsdWUoZXYuZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkFQUExZOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWUuYXBwbHkocGFyZW50LCBhcmd1bWVudExpc3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5DT05TVFJVQ1Q6XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBuZXcgcmF3VmFsdWUoLi4uYXJndW1lbnRMaXN0KTtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcHJveHkodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5FTkRQT0lOVDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgICAgICBleHBvc2Uob2JqLCBwb3J0Mik7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRyYW5zZmVyKHBvcnQxLCBbcG9ydDFdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUkVMRUFTRTpcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKHZhbHVlKSB7XG4gICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTtcbiAgICB9XG4gICAgUHJvbWlzZS5yZXNvbHZlKHJldHVyblZhbHVlKVxuICAgICAgLmNhdGNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICByZXR1cm4geyB2YWx1ZSwgW3Rocm93TWFya2VyXTogMCB9O1xuICAgICAgfSlcbiAgICAgIC50aGVuKChyZXR1cm5WYWx1ZSkgPT4ge1xuICAgICAgICBjb25zdCBbd2lyZVZhbHVlLCB0cmFuc2ZlcmFibGVzXSA9IHRvV2lyZVZhbHVlKHJldHVyblZhbHVlKTtcbiAgICAgICAgZXAucG9zdE1lc3NhZ2UoeyAuLi53aXJlVmFsdWUsIGlkIH0sIHRyYW5zZmVyYWJsZXMpO1xuICAgICAgICBpZiAodHlwZSA9PT0gTWVzc2FnZVR5cGUuUkVMRUFTRSkge1xuICAgICAgICAgIC8vIGRldGFjaCBhbmQgZGVhY3RpdmUgYWZ0ZXIgc2VuZGluZyByZWxlYXNlIHJlc3BvbnNlIGFib3ZlLlxuICAgICAgICAgIGVwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNhbGxiYWNrIGFzIGFueSk7XG4gICAgICAgICAgY2xvc2VFbmRQb2ludChlcCk7XG4gICAgICAgICAgaWYgKGZpbmFsaXplciBpbiBvYmogJiYgdHlwZW9mIG9ialtmaW5hbGl6ZXJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG9ialtmaW5hbGl6ZXJdKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAvLyBTZW5kIFNlcmlhbGl6YXRpb24gRXJyb3IgVG8gQ2FsbGVyXG4gICAgICAgIGNvbnN0IFt3aXJlVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUoe1xuICAgICAgICAgIHZhbHVlOiBuZXcgVHlwZUVycm9yKFwiVW5zZXJpYWxpemFibGUgcmV0dXJuIHZhbHVlXCIpLFxuICAgICAgICAgIFt0aHJvd01hcmtlcl06IDAsXG4gICAgICAgIH0pO1xuICAgICAgICBlcC5wb3N0TWVzc2FnZSh7IC4uLndpcmVWYWx1ZSwgaWQgfSwgdHJhbnNmZXJhYmxlcyk7XG4gICAgICB9KTtcbiAgfSBhcyBhbnkpO1xuICBpZiAoZXAuc3RhcnQpIHtcbiAgICBlcC5zdGFydCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQ6IEVuZHBvaW50KTogZW5kcG9pbnQgaXMgTWVzc2FnZVBvcnQge1xuICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gXCJNZXNzYWdlUG9ydFwiO1xufVxuXG5mdW5jdGlvbiBjbG9zZUVuZFBvaW50KGVuZHBvaW50OiBFbmRwb2ludCkge1xuICBpZiAoaXNNZXNzYWdlUG9ydChlbmRwb2ludCkpIGVuZHBvaW50LmNsb3NlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwPFQ+KGVwOiBFbmRwb2ludCwgdGFyZ2V0PzogYW55KTogUmVtb3RlPFQ+IHtcbiAgcmV0dXJuIGNyZWF0ZVByb3h5PFQ+KGVwLCBbXSwgdGFyZ2V0KSBhcyBhbnk7XG59XG5cbmZ1bmN0aW9uIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUmVsZWFzZWQ6IGJvb2xlYW4pIHtcbiAgaWYgKGlzUmVsZWFzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm94eSBoYXMgYmVlbiByZWxlYXNlZCBhbmQgaXMgbm90IHVzZWFibGVcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVsZWFzZUVuZHBvaW50KGVwOiBFbmRwb2ludCkge1xuICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwge1xuICAgIHR5cGU6IE1lc3NhZ2VUeXBlLlJFTEVBU0UsXG4gIH0pLnRoZW4oKCkgPT4ge1xuICAgIGNsb3NlRW5kUG9pbnQoZXApO1xuICB9KTtcbn1cblxuaW50ZXJmYWNlIEZpbmFsaXphdGlvblJlZ2lzdHJ5PFQ+IHtcbiAgbmV3IChjYjogKGhlbGRWYWx1ZTogVCkgPT4gdm9pZCk6IEZpbmFsaXphdGlvblJlZ2lzdHJ5PFQ+O1xuICByZWdpc3RlcihcbiAgICB3ZWFrSXRlbTogb2JqZWN0LFxuICAgIGhlbGRWYWx1ZTogVCxcbiAgICB1bnJlZ2lzdGVyVG9rZW4/OiBvYmplY3QgfCB1bmRlZmluZWRcbiAgKTogdm9pZDtcbiAgdW5yZWdpc3Rlcih1bnJlZ2lzdGVyVG9rZW46IG9iamVjdCk6IHZvaWQ7XG59XG5kZWNsYXJlIHZhciBGaW5hbGl6YXRpb25SZWdpc3RyeTogRmluYWxpemF0aW9uUmVnaXN0cnk8RW5kcG9pbnQ+O1xuXG5jb25zdCBwcm94eUNvdW50ZXIgPSBuZXcgV2Vha01hcDxFbmRwb2ludCwgbnVtYmVyPigpO1xuY29uc3QgcHJveHlGaW5hbGl6ZXJzID1cbiAgXCJGaW5hbGl6YXRpb25SZWdpc3RyeVwiIGluIGdsb2JhbFRoaXMgJiZcbiAgbmV3IEZpbmFsaXphdGlvblJlZ2lzdHJ5KChlcDogRW5kcG9pbnQpID0+IHtcbiAgICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7XG4gICAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpO1xuICAgIGlmIChuZXdDb3VudCA9PT0gMCkge1xuICAgICAgcmVsZWFzZUVuZHBvaW50KGVwKTtcbiAgICB9XG4gIH0pO1xuXG5mdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5OiBvYmplY3QsIGVwOiBFbmRwb2ludCkge1xuICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSArIDE7XG4gIHByb3h5Q291bnRlci5zZXQoZXAsIG5ld0NvdW50KTtcbiAgaWYgKHByb3h5RmluYWxpemVycykge1xuICAgIHByb3h5RmluYWxpemVycy5yZWdpc3Rlcihwcm94eSwgZXAsIHByb3h5KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1bnJlZ2lzdGVyUHJveHkocHJveHk6IG9iamVjdCkge1xuICBpZiAocHJveHlGaW5hbGl6ZXJzKSB7XG4gICAgcHJveHlGaW5hbGl6ZXJzLnVucmVnaXN0ZXIocHJveHkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb3h5PFQ+KFxuICBlcDogRW5kcG9pbnQsXG4gIHBhdGg6IChzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2wpW10gPSBbXSxcbiAgdGFyZ2V0OiBvYmplY3QgPSBmdW5jdGlvbiAoKSB7fVxuKTogUmVtb3RlPFQ+IHtcbiAgbGV0IGlzUHJveHlSZWxlYXNlZCA9IGZhbHNlO1xuICBjb25zdCBwcm94eSA9IG5ldyBQcm94eSh0YXJnZXQsIHtcbiAgICBnZXQoX3RhcmdldCwgcHJvcCkge1xuICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgIGlmIChwcm9wID09PSByZWxlYXNlUHJveHkpIHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkpO1xuICAgICAgICAgIHJlbGVhc2VFbmRwb2ludChlcCk7XG4gICAgICAgICAgaXNQcm94eVJlbGVhc2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChwcm9wID09PSBcInRoZW5cIikge1xuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4geyB0aGVuOiAoKSA9PiBwcm94eSB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHIgPSByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCB7XG4gICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuR0VULFxuICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxuICAgICAgICB9KS50aGVuKGZyb21XaXJlVmFsdWUpO1xuICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlUHJveHkoZXAsIFsuLi5wYXRoLCBwcm9wXSk7XG4gICAgfSxcbiAgICBzZXQoX3RhcmdldCwgcHJvcCwgcmF3VmFsdWUpIHtcbiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7XG4gICAgICAvLyBGSVhNRTogRVM2IFByb3h5IEhhbmRsZXIgYHNldGAgbWV0aG9kcyBhcmUgc3VwcG9zZWQgdG8gcmV0dXJuIGFcbiAgICAgIC8vIGJvb2xlYW4uIFRvIHNob3cgZ29vZCB3aWxsLCB3ZSByZXR1cm4gdHJ1ZSBhc3luY2hyb25vdXNseSBcdTAwQUZcXF8oXHUzMEM0KV8vXHUwMEFGXG4gICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpO1xuICAgICAgcmV0dXJuIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoXG4gICAgICAgIGVwLFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuU0VULFxuICAgICAgICAgIHBhdGg6IFsuLi5wYXRoLCBwcm9wXS5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZmVyYWJsZXNcbiAgICAgICkudGhlbihmcm9tV2lyZVZhbHVlKSBhcyBhbnk7XG4gICAgfSxcbiAgICBhcHBseShfdGFyZ2V0LCBfdGhpc0FyZywgcmF3QXJndW1lbnRMaXN0KSB7XG4gICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpO1xuICAgICAgY29uc3QgbGFzdCA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgICAgIGlmICgobGFzdCBhcyBhbnkpID09PSBjcmVhdGVFbmRwb2ludCkge1xuICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwge1xuICAgICAgICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkVORFBPSU5ULFxuICAgICAgICB9KS50aGVuKGZyb21XaXJlVmFsdWUpO1xuICAgICAgfVxuICAgICAgLy8gV2UganVzdCBwcmV0ZW5kIHRoYXQgYGJpbmQoKWAgZGlkblx1MjAxOXQgaGFwcGVuLlxuICAgICAgaWYgKGxhc3QgPT09IFwiYmluZFwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGF0aC5zbGljZSgwLCAtMSkpO1xuICAgICAgfVxuICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7XG4gICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShcbiAgICAgICAgZXAsXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiBNZXNzYWdlVHlwZS5BUFBMWSxcbiAgICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcbiAgICAgICAgICBhcmd1bWVudExpc3QsXG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZmVyYWJsZXNcbiAgICAgICkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICB9LFxuICAgIGNvbnN0cnVjdChfdGFyZ2V0LCByYXdBcmd1bWVudExpc3QpIHtcbiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7XG4gICAgICBjb25zdCBbYXJndW1lbnRMaXN0LCB0cmFuc2ZlcmFibGVzXSA9IHByb2Nlc3NBcmd1bWVudHMocmF3QXJndW1lbnRMaXN0KTtcbiAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKFxuICAgICAgICBlcCxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNPTlNUUlVDVCxcbiAgICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcbiAgICAgICAgICBhcmd1bWVudExpc3QsXG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZmVyYWJsZXNcbiAgICAgICkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICB9LFxuICB9KTtcbiAgcmVnaXN0ZXJQcm94eShwcm94eSwgZXApO1xuICByZXR1cm4gcHJveHkgYXMgYW55O1xufVxuXG5mdW5jdGlvbiBteUZsYXQ8VD4oYXJyOiAoVCB8IFRbXSlbXSk6IFRbXSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBhcnIpO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzQXJndW1lbnRzKGFyZ3VtZW50TGlzdDogYW55W10pOiBbV2lyZVZhbHVlW10sIFRyYW5zZmVyYWJsZVtdXSB7XG4gIGNvbnN0IHByb2Nlc3NlZCA9IGFyZ3VtZW50TGlzdC5tYXAodG9XaXJlVmFsdWUpO1xuICByZXR1cm4gW3Byb2Nlc3NlZC5tYXAoKHYpID0+IHZbMF0pLCBteUZsYXQocHJvY2Vzc2VkLm1hcCgodikgPT4gdlsxXSkpXTtcbn1cblxuY29uc3QgdHJhbnNmZXJDYWNoZSA9IG5ldyBXZWFrTWFwPGFueSwgVHJhbnNmZXJhYmxlW10+KCk7XG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmZXI8VD4ob2JqOiBULCB0cmFuc2ZlcnM6IFRyYW5zZmVyYWJsZVtdKTogVCB7XG4gIHRyYW5zZmVyQ2FjaGUuc2V0KG9iaiwgdHJhbnNmZXJzKTtcbiAgcmV0dXJuIG9iajtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3h5PFQgZXh0ZW5kcyB7fT4ob2JqOiBUKTogVCAmIFByb3h5TWFya2VkIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24ob2JqLCB7IFtwcm94eU1hcmtlcl06IHRydWUgfSkgYXMgYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2luZG93RW5kcG9pbnQoXG4gIHc6IFBvc3RNZXNzYWdlV2l0aE9yaWdpbixcbiAgY29udGV4dDogRXZlbnRTb3VyY2UgPSBnbG9iYWxUaGlzLFxuICB0YXJnZXRPcmlnaW4gPSBcIipcIlxuKTogRW5kcG9pbnQge1xuICByZXR1cm4ge1xuICAgIHBvc3RNZXNzYWdlOiAobXNnOiBhbnksIHRyYW5zZmVyYWJsZXM6IFRyYW5zZmVyYWJsZVtdKSA9PlxuICAgICAgdy5wb3N0TWVzc2FnZShtc2csIHRhcmdldE9yaWdpbiwgdHJhbnNmZXJhYmxlcyksXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogY29udGV4dC5hZGRFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogY29udGV4dC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHRvV2lyZVZhbHVlKHZhbHVlOiBhbnkpOiBbV2lyZVZhbHVlLCBUcmFuc2ZlcmFibGVbXV0ge1xuICBmb3IgKGNvbnN0IFtuYW1lLCBoYW5kbGVyXSBvZiB0cmFuc2ZlckhhbmRsZXJzKSB7XG4gICAgaWYgKGhhbmRsZXIuY2FuSGFuZGxlKHZhbHVlKSkge1xuICAgICAgY29uc3QgW3NlcmlhbGl6ZWRWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSBoYW5kbGVyLnNlcmlhbGl6ZSh2YWx1ZSk7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogV2lyZVZhbHVlVHlwZS5IQU5ETEVSLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgdmFsdWU6IHNlcmlhbGl6ZWRWYWx1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdHJhbnNmZXJhYmxlcyxcbiAgICAgIF07XG4gICAgfVxuICB9XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgdHlwZTogV2lyZVZhbHVlVHlwZS5SQVcsXG4gICAgICB2YWx1ZSxcbiAgICB9LFxuICAgIHRyYW5zZmVyQ2FjaGUuZ2V0KHZhbHVlKSB8fCBbXSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gZnJvbVdpcmVWYWx1ZSh2YWx1ZTogV2lyZVZhbHVlKTogYW55IHtcbiAgc3dpdGNoICh2YWx1ZS50eXBlKSB7XG4gICAgY2FzZSBXaXJlVmFsdWVUeXBlLkhBTkRMRVI6XG4gICAgICByZXR1cm4gdHJhbnNmZXJIYW5kbGVycy5nZXQodmFsdWUubmFtZSkhLmRlc2VyaWFsaXplKHZhbHVlLnZhbHVlKTtcbiAgICBjYXNlIFdpcmVWYWx1ZVR5cGUuUkFXOlxuICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoXG4gIGVwOiBFbmRwb2ludCxcbiAgbXNnOiBNZXNzYWdlLFxuICB0cmFuc2ZlcnM/OiBUcmFuc2ZlcmFibGVbXVxuKTogUHJvbWlzZTxXaXJlVmFsdWU+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY29uc3QgaWQgPSBnZW5lcmF0ZVVVSUQoKTtcbiAgICBlcC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBmdW5jdGlvbiBsKGV2OiBNZXNzYWdlRXZlbnQpIHtcbiAgICAgIGlmICghZXYuZGF0YSB8fCAhZXYuZGF0YS5pZCB8fCBldi5kYXRhLmlkICE9PSBpZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlcC5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBsIGFzIGFueSk7XG4gICAgICByZXNvbHZlKGV2LmRhdGEpO1xuICAgIH0gYXMgYW55KTtcbiAgICBpZiAoZXAuc3RhcnQpIHtcbiAgICAgIGVwLnN0YXJ0KCk7XG4gICAgfVxuICAgIGVwLnBvc3RNZXNzYWdlKHsgaWQsIC4uLm1zZyB9LCB0cmFuc2ZlcnMpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCk6IHN0cmluZyB7XG4gIHJldHVybiBuZXcgQXJyYXkoNClcbiAgICAuZmlsbCgwKVxuICAgIC5tYXAoKCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpLnRvU3RyaW5nKDE2KSlcbiAgICAuam9pbihcIi1cIik7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTggVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZVxuLy8gbGljZW5zZSB0aGF0IGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuXG5cInVzZSBzdHJpY3RcIjtcblxuKCgpID0+IHtcblx0Y29uc3QgZW5vc3lzID0gKCkgPT4ge1xuXHRcdGNvbnN0IGVyciA9IG5ldyBFcnJvcihcIm5vdCBpbXBsZW1lbnRlZFwiKTtcblx0XHRlcnIuY29kZSA9IFwiRU5PU1lTXCI7XG5cdFx0cmV0dXJuIGVycjtcblx0fTtcblxuXHRpZiAoIWdsb2JhbFRoaXMuZnMpIHtcblx0XHRsZXQgb3V0cHV0QnVmID0gXCJcIjtcblx0XHRnbG9iYWxUaGlzLmZzID0ge1xuXHRcdFx0Y29uc3RhbnRzOiB7IE9fV1JPTkxZOiAtMSwgT19SRFdSOiAtMSwgT19DUkVBVDogLTEsIE9fVFJVTkM6IC0xLCBPX0FQUEVORDogLTEsIE9fRVhDTDogLTEgfSwgLy8gdW51c2VkXG5cdFx0XHR3cml0ZVN5bmMoZmQsIGJ1Zikge1xuXHRcdFx0XHRvdXRwdXRCdWYgKz0gZGVjb2Rlci5kZWNvZGUoYnVmKTtcblx0XHRcdFx0Y29uc3QgbmwgPSBvdXRwdXRCdWYubGFzdEluZGV4T2YoXCJcXG5cIik7XG5cdFx0XHRcdGlmIChubCAhPSAtMSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKG91dHB1dEJ1Zi5zdWJzdHJpbmcoMCwgbmwpKTtcblx0XHRcdFx0XHRvdXRwdXRCdWYgPSBvdXRwdXRCdWYuc3Vic3RyaW5nKG5sICsgMSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGJ1Zi5sZW5ndGg7XG5cdFx0XHR9LFxuXHRcdFx0d3JpdGUoZmQsIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFjaykge1xuXHRcdFx0XHRpZiAob2Zmc2V0ICE9PSAwIHx8IGxlbmd0aCAhPT0gYnVmLmxlbmd0aCB8fCBwb3NpdGlvbiAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdGNhbGxiYWNrKGVub3N5cygpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgbiA9IHRoaXMud3JpdGVTeW5jKGZkLCBidWYpO1xuXHRcdFx0XHRjYWxsYmFjayhudWxsLCBuKTtcblx0XHRcdH0sXG5cdFx0XHRjaG1vZChwYXRoLCBtb2RlLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRjaG93bihwYXRoLCB1aWQsIGdpZCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0Y2xvc2UoZmQsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdGZjaG1vZChmZCwgbW9kZSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0ZmNob3duKGZkLCB1aWQsIGdpZCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0ZnN0YXQoZmQsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdGZzeW5jKGZkLCBjYWxsYmFjaykgeyBjYWxsYmFjayhudWxsKTsgfSxcblx0XHRcdGZ0cnVuY2F0ZShmZCwgbGVuZ3RoLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRsY2hvd24ocGF0aCwgdWlkLCBnaWQsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdGxpbmsocGF0aCwgbGluaywgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0bHN0YXQocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0bWtkaXIocGF0aCwgcGVybSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0b3BlbihwYXRoLCBmbGFncywgbW9kZSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0cmVhZChmZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdHJlYWRkaXIocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0cmVhZGxpbmsocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0cmVuYW1lKGZyb20sIHRvLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRybWRpcihwYXRoLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRzdGF0KHBhdGgsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdHN5bWxpbmsocGF0aCwgbGluaywgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0dHJ1bmNhdGUocGF0aCwgbGVuZ3RoLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHR1bmxpbmsocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0dXRpbWVzKHBhdGgsIGF0aW1lLCBtdGltZSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdH07XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMucHJvY2Vzcykge1xuXHRcdGdsb2JhbFRoaXMucHJvY2VzcyA9IHtcblx0XHRcdGdldHVpZCgpIHsgcmV0dXJuIC0xOyB9LFxuXHRcdFx0Z2V0Z2lkKCkgeyByZXR1cm4gLTE7IH0sXG5cdFx0XHRnZXRldWlkKCkgeyByZXR1cm4gLTE7IH0sXG5cdFx0XHRnZXRlZ2lkKCkgeyByZXR1cm4gLTE7IH0sXG5cdFx0XHRnZXRncm91cHMoKSB7IHRocm93IGVub3N5cygpOyB9LFxuXHRcdFx0cGlkOiAtMSxcblx0XHRcdHBwaWQ6IC0xLFxuXHRcdFx0dW1hc2soKSB7IHRocm93IGVub3N5cygpOyB9LFxuXHRcdFx0Y3dkKCkgeyB0aHJvdyBlbm9zeXMoKTsgfSxcblx0XHRcdGNoZGlyKCkgeyB0aHJvdyBlbm9zeXMoKTsgfSxcblx0XHR9XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMuY3J5cHRvKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiZ2xvYmFsVGhpcy5jcnlwdG8gaXMgbm90IGF2YWlsYWJsZSwgcG9seWZpbGwgcmVxdWlyZWQgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMgb25seSlcIik7XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMucGVyZm9ybWFuY2UpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJnbG9iYWxUaGlzLnBlcmZvcm1hbmNlIGlzIG5vdCBhdmFpbGFibGUsIHBvbHlmaWxsIHJlcXVpcmVkIChwZXJmb3JtYW5jZS5ub3cgb25seSlcIik7XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMuVGV4dEVuY29kZXIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJnbG9iYWxUaGlzLlRleHRFbmNvZGVyIGlzIG5vdCBhdmFpbGFibGUsIHBvbHlmaWxsIHJlcXVpcmVkXCIpO1xuXHR9XG5cblx0aWYgKCFnbG9iYWxUaGlzLlRleHREZWNvZGVyKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiZ2xvYmFsVGhpcy5UZXh0RGVjb2RlciBpcyBub3QgYXZhaWxhYmxlLCBwb2x5ZmlsbCByZXF1aXJlZFwiKTtcblx0fVxuXG5cdGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoXCJ1dGYtOFwiKTtcblx0Y29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcihcInV0Zi04XCIpO1xuXG5cdGdsb2JhbFRoaXMuR28gPSBjbGFzcyB7XG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHR0aGlzLmFyZ3YgPSBbXCJqc1wiXTtcblx0XHRcdHRoaXMuZW52ID0ge307XG5cdFx0XHR0aGlzLmV4aXQgPSAoY29kZSkgPT4ge1xuXHRcdFx0XHRpZiAoY29kZSAhPT0gMCkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihcImV4aXQgY29kZTpcIiwgY29kZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHR0aGlzLl9leGl0UHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRcdHRoaXMuX3Jlc29sdmVFeGl0UHJvbWlzZSA9IHJlc29sdmU7XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuX3BlbmRpbmdFdmVudCA9IG51bGw7XG5cdFx0XHR0aGlzLl9zY2hlZHVsZWRUaW1lb3V0cyA9IG5ldyBNYXAoKTtcblx0XHRcdHRoaXMuX25leHRDYWxsYmFja1RpbWVvdXRJRCA9IDE7XG5cblx0XHRcdGNvbnN0IHNldEludDY0ID0gKGFkZHIsIHYpID0+IHtcblx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDMyKGFkZHIgKyAwLCB2LCB0cnVlKTtcblx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDMyKGFkZHIgKyA0LCBNYXRoLmZsb29yKHYgLyA0Mjk0OTY3Mjk2KSwgdHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNldEludDMyID0gKGFkZHIsIHYpID0+IHtcblx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDMyKGFkZHIgKyAwLCB2LCB0cnVlKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZ2V0SW50NjQgPSAoYWRkcikgPT4ge1xuXHRcdFx0XHRjb25zdCBsb3cgPSB0aGlzLm1lbS5nZXRVaW50MzIoYWRkciArIDAsIHRydWUpO1xuXHRcdFx0XHRjb25zdCBoaWdoID0gdGhpcy5tZW0uZ2V0SW50MzIoYWRkciArIDQsIHRydWUpO1xuXHRcdFx0XHRyZXR1cm4gbG93ICsgaGlnaCAqIDQyOTQ5NjcyOTY7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGxvYWRWYWx1ZSA9IChhZGRyKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGYgPSB0aGlzLm1lbS5nZXRGbG9hdDY0KGFkZHIsIHRydWUpO1xuXHRcdFx0XHRpZiAoZiA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFpc05hTihmKSkge1xuXHRcdFx0XHRcdHJldHVybiBmO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLm1lbS5nZXRVaW50MzIoYWRkciwgdHJ1ZSk7XG5cdFx0XHRcdHJldHVybiB0aGlzLl92YWx1ZXNbaWRdO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdG9yZVZhbHVlID0gKGFkZHIsIHYpID0+IHtcblx0XHRcdFx0Y29uc3QgbmFuSGVhZCA9IDB4N0ZGODAwMDA7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiICYmIHYgIT09IDApIHtcblx0XHRcdFx0XHRpZiAoaXNOYU4odikpIHtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihhZGRyICsgNCwgbmFuSGVhZCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50MzIoYWRkciwgMCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMubWVtLnNldEZsb2F0NjQoYWRkciwgdiwgdHJ1ZSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHYgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHRoaXMubWVtLnNldEZsb2F0NjQoYWRkciwgMCwgdHJ1ZSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGlkID0gdGhpcy5faWRzLmdldCh2KTtcblx0XHRcdFx0aWYgKGlkID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRpZCA9IHRoaXMuX2lkUG9vbC5wb3AoKTtcblx0XHRcdFx0XHRpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0aWQgPSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLl92YWx1ZXNbaWRdID0gdjtcblx0XHRcdFx0XHR0aGlzLl9nb1JlZkNvdW50c1tpZF0gPSAwO1xuXHRcdFx0XHRcdHRoaXMuX2lkcy5zZXQodiwgaWQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuX2dvUmVmQ291bnRzW2lkXSsrO1xuXHRcdFx0XHRsZXQgdHlwZUZsYWcgPSAwO1xuXHRcdFx0XHRzd2l0Y2ggKHR5cGVvZiB2KSB7XG5cdFx0XHRcdFx0Y2FzZSBcIm9iamVjdFwiOlxuXHRcdFx0XHRcdFx0aWYgKHYgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0dHlwZUZsYWcgPSAxO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdFx0XHRcdFx0dHlwZUZsYWcgPSAyO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBcInN5bWJvbFwiOlxuXHRcdFx0XHRcdFx0dHlwZUZsYWcgPSAzO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XG5cdFx0XHRcdFx0XHR0eXBlRmxhZyA9IDQ7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50MzIoYWRkciArIDQsIG5hbkhlYWQgfCB0eXBlRmxhZywgdHJ1ZSk7XG5cdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihhZGRyLCBpZCwgdHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGxvYWRTbGljZSA9IChhZGRyKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGFycmF5ID0gZ2V0SW50NjQoYWRkciArIDApO1xuXHRcdFx0XHRjb25zdCBsZW4gPSBnZXRJbnQ2NChhZGRyICsgOCk7XG5cdFx0XHRcdHJldHVybiBuZXcgVWludDhBcnJheSh0aGlzLl9pbnN0LmV4cG9ydHMubWVtLmJ1ZmZlciwgYXJyYXksIGxlbik7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGxvYWRTbGljZU9mVmFsdWVzID0gKGFkZHIpID0+IHtcblx0XHRcdFx0Y29uc3QgYXJyYXkgPSBnZXRJbnQ2NChhZGRyICsgMCk7XG5cdFx0XHRcdGNvbnN0IGxlbiA9IGdldEludDY0KGFkZHIgKyA4KTtcblx0XHRcdFx0Y29uc3QgYSA9IG5ldyBBcnJheShsZW4pO1xuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0YVtpXSA9IGxvYWRWYWx1ZShhcnJheSArIGkgKiA4KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gYTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbG9hZFN0cmluZyA9IChhZGRyKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHNhZGRyID0gZ2V0SW50NjQoYWRkciArIDApO1xuXHRcdFx0XHRjb25zdCBsZW4gPSBnZXRJbnQ2NChhZGRyICsgOCk7XG5cdFx0XHRcdHJldHVybiBkZWNvZGVyLmRlY29kZShuZXcgRGF0YVZpZXcodGhpcy5faW5zdC5leHBvcnRzLm1lbS5idWZmZXIsIHNhZGRyLCBsZW4pKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdGltZU9yaWdpbiA9IERhdGUubm93KCkgLSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHRcdHRoaXMuaW1wb3J0T2JqZWN0ID0ge1xuXHRcdFx0XHRfZ290ZXN0OiB7XG5cdFx0XHRcdFx0YWRkOiAoYSwgYikgPT4gYSArIGIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGdvanM6IHtcblx0XHRcdFx0XHQvLyBHbydzIFNQIGRvZXMgbm90IGNoYW5nZSBhcyBsb25nIGFzIG5vIEdvIGNvZGUgaXMgcnVubmluZy4gU29tZSBvcGVyYXRpb25zIChlLmcuIGNhbGxzLCBnZXR0ZXJzIGFuZCBzZXR0ZXJzKVxuXHRcdFx0XHRcdC8vIG1heSBzeW5jaHJvbm91c2x5IHRyaWdnZXIgYSBHbyBldmVudCBoYW5kbGVyLiBUaGlzIG1ha2VzIEdvIGNvZGUgZ2V0IGV4ZWN1dGVkIGluIHRoZSBtaWRkbGUgb2YgdGhlIGltcG9ydGVkXG5cdFx0XHRcdFx0Ly8gZnVuY3Rpb24uIEEgZ29yb3V0aW5lIGNhbiBzd2l0Y2ggdG8gYSBuZXcgc3RhY2sgaWYgdGhlIGN1cnJlbnQgc3RhY2sgaXMgdG9vIHNtYWxsIChzZWUgbW9yZXN0YWNrIGZ1bmN0aW9uKS5cblx0XHRcdFx0XHQvLyBUaGlzIGNoYW5nZXMgdGhlIFNQLCB0aHVzIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBTUCB1c2VkIGJ5IHRoZSBpbXBvcnRlZCBmdW5jdGlvbi5cblxuXHRcdFx0XHRcdC8vIGZ1bmMgd2FzbUV4aXQoY29kZSBpbnQzMilcblx0XHRcdFx0XHRcInJ1bnRpbWUud2FzbUV4aXRcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBjb2RlID0gdGhpcy5tZW0uZ2V0SW50MzIoc3AgKyA4LCB0cnVlKTtcblx0XHRcdFx0XHRcdHRoaXMuZXhpdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9pbnN0O1xuXHRcdFx0XHRcdFx0ZGVsZXRlIHRoaXMuX3ZhbHVlcztcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9nb1JlZkNvdW50cztcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9pZHM7XG5cdFx0XHRcdFx0XHRkZWxldGUgdGhpcy5faWRQb29sO1xuXHRcdFx0XHRcdFx0dGhpcy5leGl0KGNvZGUpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHdhc21Xcml0ZShmZCB1aW50cHRyLCBwIHVuc2FmZS5Qb2ludGVyLCBuIGludDMyKVxuXHRcdFx0XHRcdFwicnVudGltZS53YXNtV3JpdGVcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBmZCA9IGdldEludDY0KHNwICsgOCk7XG5cdFx0XHRcdFx0XHRjb25zdCBwID0gZ2V0SW50NjQoc3AgKyAxNik7XG5cdFx0XHRcdFx0XHRjb25zdCBuID0gdGhpcy5tZW0uZ2V0SW50MzIoc3AgKyAyNCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRmcy53cml0ZVN5bmMoZmQsIG5ldyBVaW50OEFycmF5KHRoaXMuX2luc3QuZXhwb3J0cy5tZW0uYnVmZmVyLCBwLCBuKSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgcmVzZXRNZW1vcnlEYXRhVmlldygpXG5cdFx0XHRcdFx0XCJydW50aW1lLnJlc2V0TWVtb3J5RGF0YVZpZXdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbSA9IG5ldyBEYXRhVmlldyh0aGlzLl9pbnN0LmV4cG9ydHMubWVtLmJ1ZmZlcik7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgbmFub3RpbWUxKCkgaW50NjRcblx0XHRcdFx0XHRcInJ1bnRpbWUubmFub3RpbWUxXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0c2V0SW50NjQoc3AgKyA4LCAodGltZU9yaWdpbiArIHBlcmZvcm1hbmNlLm5vdygpKSAqIDEwMDAwMDApO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHdhbGx0aW1lKCkgKHNlYyBpbnQ2NCwgbnNlYyBpbnQzMilcblx0XHRcdFx0XHRcInJ1bnRpbWUud2FsbHRpbWVcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBtc2VjID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG5cdFx0XHRcdFx0XHRzZXRJbnQ2NChzcCArIDgsIG1zZWMgLyAxMDAwKTtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldEludDMyKHNwICsgMTYsIChtc2VjICUgMTAwMCkgKiAxMDAwMDAwLCB0cnVlKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBzY2hlZHVsZVRpbWVvdXRFdmVudChkZWxheSBpbnQ2NCkgaW50MzJcblx0XHRcdFx0XHRcInJ1bnRpbWUuc2NoZWR1bGVUaW1lb3V0RXZlbnRcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBpZCA9IHRoaXMuX25leHRDYWxsYmFja1RpbWVvdXRJRDtcblx0XHRcdFx0XHRcdHRoaXMuX25leHRDYWxsYmFja1RpbWVvdXRJRCsrO1xuXHRcdFx0XHRcdFx0dGhpcy5fc2NoZWR1bGVkVGltZW91dHMuc2V0KGlkLCBzZXRUaW1lb3V0KFxuXHRcdFx0XHRcdFx0XHQoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5fcmVzdW1lKCk7XG5cdFx0XHRcdFx0XHRcdFx0d2hpbGUgKHRoaXMuX3NjaGVkdWxlZFRpbWVvdXRzLmhhcyhpZCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdC8vIGZvciBzb21lIHJlYXNvbiBHbyBmYWlsZWQgdG8gcmVnaXN0ZXIgdGhlIHRpbWVvdXQgZXZlbnQsIGxvZyBhbmQgdHJ5IGFnYWluXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyAodGVtcG9yYXJ5IHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vaXNzdWVzLzI4OTc1KVxuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKFwic2NoZWR1bGVUaW1lb3V0RXZlbnQ6IG1pc3NlZCB0aW1lb3V0IGV2ZW50XCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fcmVzdW1lKCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRnZXRJbnQ2NChzcCArIDgpLFxuXHRcdFx0XHRcdFx0KSk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRJbnQzMihzcCArIDE2LCBpZCwgdHJ1ZSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgY2xlYXJUaW1lb3V0RXZlbnQoaWQgaW50MzIpXG5cdFx0XHRcdFx0XCJydW50aW1lLmNsZWFyVGltZW91dEV2ZW50XCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLm1lbS5nZXRJbnQzMihzcCArIDgsIHRydWUpO1xuXHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuX3NjaGVkdWxlZFRpbWVvdXRzLmdldChpZCkpO1xuXHRcdFx0XHRcdFx0dGhpcy5fc2NoZWR1bGVkVGltZW91dHMuZGVsZXRlKGlkKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBnZXRSYW5kb21EYXRhKHIgW11ieXRlKVxuXHRcdFx0XHRcdFwicnVudGltZS5nZXRSYW5kb21EYXRhXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y3J5cHRvLmdldFJhbmRvbVZhbHVlcyhsb2FkU2xpY2Uoc3AgKyA4KSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgZmluYWxpemVSZWYodiByZWYpXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLmZpbmFsaXplUmVmXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLm1lbS5nZXRVaW50MzIoc3AgKyA4LCB0cnVlKTtcblx0XHRcdFx0XHRcdHRoaXMuX2dvUmVmQ291bnRzW2lkXS0tO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuX2dvUmVmQ291bnRzW2lkXSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB2ID0gdGhpcy5fdmFsdWVzW2lkXTtcblx0XHRcdFx0XHRcdFx0dGhpcy5fdmFsdWVzW2lkXSA9IG51bGw7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2lkcy5kZWxldGUodik7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2lkUG9vbC5wdXNoKGlkKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBzdHJpbmdWYWwodmFsdWUgc3RyaW5nKSByZWZcblx0XHRcdFx0XHRcInN5c2NhbGwvanMuc3RyaW5nVmFsXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDI0LCBsb2FkU3RyaW5nKHNwICsgOCkpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHZhbHVlR2V0KHYgcmVmLCBwIHN0cmluZykgcmVmXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlR2V0XCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gUmVmbGVjdC5nZXQobG9hZFZhbHVlKHNwICsgOCksIGxvYWRTdHJpbmcoc3AgKyAxNikpO1xuXHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyAzMiwgcmVzdWx0KTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZVNldCh2IHJlZiwgcCBzdHJpbmcsIHggcmVmKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZVNldFwiOiAoc3ApID0+IHtcblx0XHRcdFx0XHRcdHNwID4+Pj0gMDtcblx0XHRcdFx0XHRcdFJlZmxlY3Quc2V0KGxvYWRWYWx1ZShzcCArIDgpLCBsb2FkU3RyaW5nKHNwICsgMTYpLCBsb2FkVmFsdWUoc3AgKyAzMikpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHZhbHVlRGVsZXRlKHYgcmVmLCBwIHN0cmluZylcblx0XHRcdFx0XHRcInN5c2NhbGwvanMudmFsdWVEZWxldGVcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGxvYWRWYWx1ZShzcCArIDgpLCBsb2FkU3RyaW5nKHNwICsgMTYpKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZUluZGV4KHYgcmVmLCBpIGludCkgcmVmXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlSW5kZXhcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRzdG9yZVZhbHVlKHNwICsgMjQsIFJlZmxlY3QuZ2V0KGxvYWRWYWx1ZShzcCArIDgpLCBnZXRJbnQ2NChzcCArIDE2KSkpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyB2YWx1ZVNldEluZGV4KHYgcmVmLCBpIGludCwgeCByZWYpXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlU2V0SW5kZXhcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRSZWZsZWN0LnNldChsb2FkVmFsdWUoc3AgKyA4KSwgZ2V0SW50NjQoc3AgKyAxNiksIGxvYWRWYWx1ZShzcCArIDI0KSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgdmFsdWVDYWxsKHYgcmVmLCBtIHN0cmluZywgYXJncyBbXXJlZikgKHJlZiwgYm9vbClcblx0XHRcdFx0XHRcInN5c2NhbGwvanMudmFsdWVDYWxsXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgdiA9IGxvYWRWYWx1ZShzcCArIDgpO1xuXHRcdFx0XHRcdFx0XHRjb25zdCBtID0gUmVmbGVjdC5nZXQodiwgbG9hZFN0cmluZyhzcCArIDE2KSk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGFyZ3MgPSBsb2FkU2xpY2VPZlZhbHVlcyhzcCArIDMyKTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gUmVmbGVjdC5hcHBseShtLCB2LCBhcmdzKTtcblx0XHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDU2LCByZXN1bHQpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDY0LCAxKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0XHRzcCA9IHRoaXMuX2luc3QuZXhwb3J0cy5nZXRzcCgpID4+PiAwOyAvLyBzZWUgY29tbWVudCBhYm92ZVxuXHRcdFx0XHRcdFx0XHRzdG9yZVZhbHVlKHNwICsgNTYsIGVycik7XG5cdFx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgNjQsIDApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHZhbHVlSW52b2tlKHYgcmVmLCBhcmdzIFtdcmVmKSAocmVmLCBib29sKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZUludm9rZVwiOiAoc3ApID0+IHtcblx0XHRcdFx0XHRcdHNwID4+Pj0gMDtcblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHYgPSBsb2FkVmFsdWUoc3AgKyA4KTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgYXJncyA9IGxvYWRTbGljZU9mVmFsdWVzKHNwICsgMTYpO1xuXHRcdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBSZWZsZWN0LmFwcGx5KHYsIHVuZGVmaW5lZCwgYXJncyk7XG5cdFx0XHRcdFx0XHRcdHNwID0gdGhpcy5faW5zdC5leHBvcnRzLmdldHNwKCkgPj4+IDA7IC8vIHNlZSBjb21tZW50IGFib3ZlXG5cdFx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyA0MCwgcmVzdWx0KTtcblx0XHRcdFx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDgoc3AgKyA0OCwgMSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDQwLCBlcnIpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAwKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZU5ldyh2IHJlZiwgYXJncyBbXXJlZikgKHJlZiwgYm9vbClcblx0XHRcdFx0XHRcInN5c2NhbGwvanMudmFsdWVOZXdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB2ID0gbG9hZFZhbHVlKHNwICsgOCk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGFyZ3MgPSBsb2FkU2xpY2VPZlZhbHVlcyhzcCArIDE2KTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QodiwgYXJncyk7XG5cdFx0XHRcdFx0XHRcdHNwID0gdGhpcy5faW5zdC5leHBvcnRzLmdldHNwKCkgPj4+IDA7IC8vIHNlZSBjb21tZW50IGFib3ZlXG5cdFx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyA0MCwgcmVzdWx0KTtcblx0XHRcdFx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDgoc3AgKyA0OCwgMSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDQwLCBlcnIpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAwKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZUxlbmd0aCh2IHJlZikgaW50XG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlTGVuZ3RoXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0c2V0SW50NjQoc3AgKyAxNiwgcGFyc2VJbnQobG9hZFZhbHVlKHNwICsgOCkubGVuZ3RoKSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIHZhbHVlUHJlcGFyZVN0cmluZyh2IHJlZikgKHJlZiwgaW50KVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZVByZXBhcmVTdHJpbmdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBzdHIgPSBlbmNvZGVyLmVuY29kZShTdHJpbmcobG9hZFZhbHVlKHNwICsgOCkpKTtcblx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyAxNiwgc3RyKTtcblx0XHRcdFx0XHRcdHNldEludDY0KHNwICsgMjQsIHN0ci5sZW5ndGgpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyB2YWx1ZUxvYWRTdHJpbmcodiByZWYsIGIgW11ieXRlKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZUxvYWRTdHJpbmdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBzdHIgPSBsb2FkVmFsdWUoc3AgKyA4KTtcblx0XHRcdFx0XHRcdGxvYWRTbGljZShzcCArIDE2KS5zZXQoc3RyKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZUluc3RhbmNlT2YodiByZWYsIHQgcmVmKSBib29sXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlSW5zdGFuY2VPZlwiOiAoc3ApID0+IHtcblx0XHRcdFx0XHRcdHNwID4+Pj0gMDtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgMjQsIChsb2FkVmFsdWUoc3AgKyA4KSBpbnN0YW5jZW9mIGxvYWRWYWx1ZShzcCArIDE2KSkgPyAxIDogMCk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgY29weUJ5dGVzVG9Hbyhkc3QgW11ieXRlLCBzcmMgcmVmKSAoaW50LCBib29sKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy5jb3B5Qnl0ZXNUb0dvXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgZHN0ID0gbG9hZFNsaWNlKHNwICsgOCk7XG5cdFx0XHRcdFx0XHRjb25zdCBzcmMgPSBsb2FkVmFsdWUoc3AgKyAzMik7XG5cdFx0XHRcdFx0XHRpZiAoIShzcmMgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8IHNyYyBpbnN0YW5jZW9mIFVpbnQ4Q2xhbXBlZEFycmF5KSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAwKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y29uc3QgdG9Db3B5ID0gc3JjLnN1YmFycmF5KDAsIGRzdC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0ZHN0LnNldCh0b0NvcHkpO1xuXHRcdFx0XHRcdFx0c2V0SW50NjQoc3AgKyA0MCwgdG9Db3B5Lmxlbmd0aCk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAxKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBjb3B5Qnl0ZXNUb0pTKGRzdCByZWYsIHNyYyBbXWJ5dGUpIChpbnQsIGJvb2wpXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLmNvcHlCeXRlc1RvSlNcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBkc3QgPSBsb2FkVmFsdWUoc3AgKyA4KTtcblx0XHRcdFx0XHRcdGNvbnN0IHNyYyA9IGxvYWRTbGljZShzcCArIDE2KTtcblx0XHRcdFx0XHRcdGlmICghKGRzdCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgZHN0IGluc3RhbmNlb2YgVWludDhDbGFtcGVkQXJyYXkpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgNDgsIDApO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCB0b0NvcHkgPSBzcmMuc3ViYXJyYXkoMCwgZHN0Lmxlbmd0aCk7XG5cdFx0XHRcdFx0XHRkc3Quc2V0KHRvQ29weSk7XG5cdFx0XHRcdFx0XHRzZXRJbnQ2NChzcCArIDQwLCB0b0NvcHkubGVuZ3RoKTtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgNDgsIDEpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHRcImRlYnVnXCI6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2codmFsdWUpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0YXN5bmMgcnVuKGluc3RhbmNlKSB7XG5cdFx0XHRpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIFdlYkFzc2VtYmx5Lkluc3RhbmNlKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJHby5ydW46IFdlYkFzc2VtYmx5Lkluc3RhbmNlIGV4cGVjdGVkXCIpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5faW5zdCA9IGluc3RhbmNlO1xuXHRcdFx0dGhpcy5tZW0gPSBuZXcgRGF0YVZpZXcodGhpcy5faW5zdC5leHBvcnRzLm1lbS5idWZmZXIpO1xuXHRcdFx0dGhpcy5fdmFsdWVzID0gWyAvLyBKUyB2YWx1ZXMgdGhhdCBHbyBjdXJyZW50bHkgaGFzIHJlZmVyZW5jZXMgdG8sIGluZGV4ZWQgYnkgcmVmZXJlbmNlIGlkXG5cdFx0XHRcdE5hTixcblx0XHRcdFx0MCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0ZmFsc2UsXG5cdFx0XHRcdGdsb2JhbFRoaXMsXG5cdFx0XHRcdHRoaXMsXG5cdFx0XHRdO1xuXHRcdFx0dGhpcy5fZ29SZWZDb3VudHMgPSBuZXcgQXJyYXkodGhpcy5fdmFsdWVzLmxlbmd0aCkuZmlsbChJbmZpbml0eSk7IC8vIG51bWJlciBvZiByZWZlcmVuY2VzIHRoYXQgR28gaGFzIHRvIGEgSlMgdmFsdWUsIGluZGV4ZWQgYnkgcmVmZXJlbmNlIGlkXG5cdFx0XHR0aGlzLl9pZHMgPSBuZXcgTWFwKFsgLy8gbWFwcGluZyBmcm9tIEpTIHZhbHVlcyB0byByZWZlcmVuY2UgaWRzXG5cdFx0XHRcdFswLCAxXSxcblx0XHRcdFx0W251bGwsIDJdLFxuXHRcdFx0XHRbdHJ1ZSwgM10sXG5cdFx0XHRcdFtmYWxzZSwgNF0sXG5cdFx0XHRcdFtnbG9iYWxUaGlzLCA1XSxcblx0XHRcdFx0W3RoaXMsIDZdLFxuXHRcdFx0XSk7XG5cdFx0XHR0aGlzLl9pZFBvb2wgPSBbXTsgICAvLyB1bnVzZWQgaWRzIHRoYXQgaGF2ZSBiZWVuIGdhcmJhZ2UgY29sbGVjdGVkXG5cdFx0XHR0aGlzLmV4aXRlZCA9IGZhbHNlOyAvLyB3aGV0aGVyIHRoZSBHbyBwcm9ncmFtIGhhcyBleGl0ZWRcblxuXHRcdFx0Ly8gUGFzcyBjb21tYW5kIGxpbmUgYXJndW1lbnRzIGFuZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgdG8gV2ViQXNzZW1ibHkgYnkgd3JpdGluZyB0aGVtIHRvIHRoZSBsaW5lYXIgbWVtb3J5LlxuXHRcdFx0bGV0IG9mZnNldCA9IDQwOTY7XG5cblx0XHRcdGNvbnN0IHN0clB0ciA9IChzdHIpID0+IHtcblx0XHRcdFx0Y29uc3QgcHRyID0gb2Zmc2V0O1xuXHRcdFx0XHRjb25zdCBieXRlcyA9IGVuY29kZXIuZW5jb2RlKHN0ciArIFwiXFwwXCIpO1xuXHRcdFx0XHRuZXcgVWludDhBcnJheSh0aGlzLm1lbS5idWZmZXIsIG9mZnNldCwgYnl0ZXMubGVuZ3RoKS5zZXQoYnl0ZXMpO1xuXHRcdFx0XHRvZmZzZXQgKz0gYnl0ZXMubGVuZ3RoO1xuXHRcdFx0XHRpZiAob2Zmc2V0ICUgOCAhPT0gMCkge1xuXHRcdFx0XHRcdG9mZnNldCArPSA4IC0gKG9mZnNldCAlIDgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBwdHI7XG5cdFx0XHR9O1xuXG5cdFx0XHRjb25zdCBhcmdjID0gdGhpcy5hcmd2Lmxlbmd0aDtcblxuXHRcdFx0Y29uc3QgYXJndlB0cnMgPSBbXTtcblx0XHRcdHRoaXMuYXJndi5mb3JFYWNoKChhcmcpID0+IHtcblx0XHRcdFx0YXJndlB0cnMucHVzaChzdHJQdHIoYXJnKSk7XG5cdFx0XHR9KTtcblx0XHRcdGFyZ3ZQdHJzLnB1c2goMCk7XG5cblx0XHRcdGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmVudikuc29ydCgpO1xuXHRcdFx0a2V5cy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdFx0YXJndlB0cnMucHVzaChzdHJQdHIoYCR7a2V5fT0ke3RoaXMuZW52W2tleV19YCkpO1xuXHRcdFx0fSk7XG5cdFx0XHRhcmd2UHRycy5wdXNoKDApO1xuXG5cdFx0XHRjb25zdCBhcmd2ID0gb2Zmc2V0O1xuXHRcdFx0YXJndlB0cnMuZm9yRWFjaCgocHRyKSA9PiB7XG5cdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihvZmZzZXQsIHB0ciwgdHJ1ZSk7XG5cdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihvZmZzZXQgKyA0LCAwLCB0cnVlKTtcblx0XHRcdFx0b2Zmc2V0ICs9IDg7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gVGhlIGxpbmtlciBndWFyYW50ZWVzIGdsb2JhbCBkYXRhIHN0YXJ0cyBmcm9tIGF0IGxlYXN0IHdhc21NaW5EYXRhQWRkci5cblx0XHRcdC8vIEtlZXAgaW4gc3luYyB3aXRoIGNtZC9saW5rL2ludGVybmFsL2xkL2RhdGEuZ286d2FzbU1pbkRhdGFBZGRyLlxuXHRcdFx0Y29uc3Qgd2FzbU1pbkRhdGFBZGRyID0gNDA5NiArIDgxOTI7XG5cdFx0XHRpZiAob2Zmc2V0ID49IHdhc21NaW5EYXRhQWRkcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJ0b3RhbCBsZW5ndGggb2YgY29tbWFuZCBsaW5lIGFuZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZXhjZWVkcyBsaW1pdFwiKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5faW5zdC5leHBvcnRzLnJ1bihhcmdjLCBhcmd2KTtcblx0XHRcdGlmICh0aGlzLmV4aXRlZCkge1xuXHRcdFx0XHR0aGlzLl9yZXNvbHZlRXhpdFByb21pc2UoKTtcblx0XHRcdH1cblx0XHRcdGF3YWl0IHRoaXMuX2V4aXRQcm9taXNlO1xuXHRcdH1cblxuXHRcdF9yZXN1bWUoKSB7XG5cdFx0XHRpZiAodGhpcy5leGl0ZWQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiR28gcHJvZ3JhbSBoYXMgYWxyZWFkeSBleGl0ZWRcIik7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9pbnN0LmV4cG9ydHMucmVzdW1lKCk7XG5cdFx0XHRpZiAodGhpcy5leGl0ZWQpIHtcblx0XHRcdFx0dGhpcy5fcmVzb2x2ZUV4aXRQcm9taXNlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0X21ha2VGdW5jV3JhcHBlcihpZCkge1xuXHRcdFx0Y29uc3QgZ28gPSB0aGlzO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Y29uc3QgZXZlbnQgPSB7IGlkOiBpZCwgdGhpczogdGhpcywgYXJnczogYXJndW1lbnRzIH07XG5cdFx0XHRcdGdvLl9wZW5kaW5nRXZlbnQgPSBldmVudDtcblx0XHRcdFx0Z28uX3Jlc3VtZSgpO1xuXHRcdFx0XHRyZXR1cm4gZXZlbnQucmVzdWx0O1xuXHRcdFx0fTtcblx0XHR9XG5cdH1cbn0pKCk7XG4iLCAiZXhwb3J0IGNvbnN0IHdoaXRlc3BhY2VDaGFycyA9IG5ldyBTZXQoXG4gIFtcbiAgICAnXFxuJyxcbiAgICAnXFx0JyxcbiAgICAnXFxyJyxcbiAgICAnXFxmJyxcbiAgICAnXFx2JyxcbiAgICAnXFx1MDBhMCcsXG4gICAgJ1xcdTE2ODAnLFxuICAgICdcXHUyMDAwJyxcbiAgICAnXFx1MjAwYScsXG4gICAgJ1xcdTIwMjgnLFxuICAgICdcXHUyMDI5JyxcbiAgICAnXFx1MjAyZicsXG4gICAgJ1xcdTIwNWYnLFxuICAgICdcXHUzMDAwJyxcbiAgICAnXFx1ZmVmZicsXG4gIF0ubWFwKChzKSA9PiBzLmNoYXJDb2RlQXQoMCkpLFxuKVxuXG5leHBvcnQgY29uc3QgcGFkID0gKHN0cjogc3RyaW5nLCBjb3VudDogbnVtYmVyLCBpc0xlZnQgPSBmYWxzZSwgY2hhciA9ICcgJykgPT4ge1xuICBpZiAoc3RyLmxlbmd0aCA+PSBjb3VudCkge1xuICAgIHJldHVybiBzdHJcbiAgfVxuXG4gIGNvbnN0IHBhZGRpbmcgPSBjaGFyLnJlcGVhdChjb3VudCAtIHN0ci5sZW5ndGgpXG4gIHJldHVybiBpc0xlZnQgPyBwYWRkaW5nICsgc3RyIDogc3RyICsgcGFkZGluZ1xufVxuXG5leHBvcnQgY29uc3QgcGFkUmlnaHQgPSAoc3RyOiBzdHJpbmcsIGNvdW50OiBudW1iZXIsIGNoYXIgPSAnICcpID0+IHBhZChzdHIsIGNvdW50LCBmYWxzZSwgY2hhcilcblxuZXhwb3J0IGNvbnN0IHBhZExlZnQgPSAoc3RyOiBzdHJpbmcsIGNvdW50OiBudW1iZXIsIGNoYXIgPSAnICcpID0+IHBhZChzdHIsIGNvdW50LCB0cnVlLCBjaGFyKVxuIiwgImltcG9ydCB7IHdoaXRlc3BhY2VDaGFycywgcGFkUmlnaHQgfSBmcm9tICcuL3V0aWxzJ1xuXG5jb25zdCBXSElURVNQQUNFX1BMQUNFSE9MREVSID0gJ1cnLmNoYXJDb2RlQXQoMClcbmNvbnN0IFpFUk9fQ0hBUl9QTEFDRUhPTERFUiA9ICdcdTMwRkInLmNoYXJDb2RlQXQoMClcbmNvbnN0IFJPV19TRVBBUkFUT1IgPSAnXHVGRjVDJ1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5SW5zcGVjdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBtZW06IFdlYkFzc2VtYmx5Lk1lbW9yeSkge31cblxuICAvKipcbiAgICogUmV0dXJucyBtZW1vcnkgaW5zcGVjdG9yIGZyb20gV2ViQXNzZW1ibHkgbW9kdWxlIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gaW5zdGFuY2UgTW9kdWxlIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUluc3RhbmNlKGluc3RhbmNlOiBXZWJBc3NlbWJseS5JbnN0YW5jZSkge1xuICAgIGNvbnN0IHsgbWVtIH0gPSBpbnN0YW5jZS5leHBvcnRzXG4gICAgaWYgKCFtZW0pIHtcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcignTWlzc2luZyBleHBvcnRlZCBzeW1ib2wgXCJidWZmZXJcIiBpbiBpbnN0YW5jZScpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBNZW1vcnlJbnNwZWN0b3IobWVtIGFzIFdlYkFzc2VtYmx5Lk1lbW9yeSlcbiAgfVxuXG4gIGR1bXAob2Zmc2V0OiBudW1iZXIsIGNvdW50OiBudW1iZXIsIGNvbENvdW50ID0gOCkge1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcodGhpcy5tZW0uYnVmZmVyKVxuXG4gICAgY291bnQgPSBjb3VudCA8IGNvbENvdW50ID8gY29sQ291bnQgOiBjb3VudFxuICAgIGxldCByb3dDb3VudCA9IE1hdGguZmxvb3IoY291bnQgLyBjb2xDb3VudClcbiAgICBpZiAoY291bnQgJSBjb2xDb3VudCA+IDApIHtcbiAgICAgIHJvd0NvdW50KytcbiAgICB9XG5cbiAgICBsZXQgbWF4QWRkckxlbiA9IDBcbiAgICBjb25zdCBsaW5lczogQXJyYXk8W3N0cmluZywgc3RyaW5nLCBzdHJpbmddPiA9IFtdXG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgcm93Q291bnQ7IHJvdysrKSB7XG4gICAgICBjb25zdCByb3dPZmZzZXQgPSBvZmZzZXQgKyByb3cgKiBjb2xDb3VudFxuICAgICAgY29uc3QgYnl0ZXM6IG51bWJlcltdID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29sQ291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBieXRlID0gdmlldy5nZXRVaW50OChyb3dPZmZzZXQgKyBpKVxuICAgICAgICBieXRlcy5wdXNoKGJ5dGUpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0ckFkZHIgPSByb3dPZmZzZXQudG9TdHJpbmcoMTYpXG4gICAgICBjb25zdCBoZXhCeXRlcyA9IGJ5dGVzLm1hcCgoYikgPT4gcGFkUmlnaHQoYi50b1N0cmluZygxNiksIDIsICcwJykpLmpvaW4oJyAnKVxuXG4gICAgICBjb25zdCBzdHJCeXRlcyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAgIC4uLmJ5dGVzXG4gICAgICAgICAgLm1hcCgoYikgPT4gKHdoaXRlc3BhY2VDaGFycy5oYXMoYikgPyBXSElURVNQQUNFX1BMQUNFSE9MREVSIDogYikpXG4gICAgICAgICAgLm1hcCgoYikgPT4gKGIgPT09IDAgPyBaRVJPX0NIQVJfUExBQ0VIT0xERVIgOiBiKSksXG4gICAgICApXG4gICAgICBsaW5lcy5wdXNoKFtzdHJBZGRyLCBoZXhCeXRlcywgc3RyQnl0ZXNdKVxuICAgICAgaWYgKG1heEFkZHJMZW4gPCBzdHJBZGRyLmxlbmd0aCkge1xuICAgICAgICBtYXhBZGRyTGVuID0gc3RyQWRkci5sZW5ndGhcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGluZXNcbiAgICAgIC5tYXAoKFthZGRyLCBieXRlcywgc3RyXSkgPT4gYCR7cGFkUmlnaHQoYWRkciwgbWF4QWRkckxlbil9ICR7Uk9XX1NFUEFSQVRPUn0gJHtieXRlc30gJHtST1dfU0VQQVJBVE9SfSAke3N0cn1gKVxuICAgICAgLmpvaW4oJ1xcbicpXG4gIH1cbn1cbiIsICJleHBvcnQgY29uc3QgdG9IZXggPSAodjogbnVtYmVyKSA9PiB2LnRvU3RyaW5nKDE2KVxuZXhwb3J0IGNvbnN0IGZyb21IZXggPSAodjogc3RyaW5nKSA9PiBwYXJzZUludCh2LCAxNilcblxuLyoqXG4gKiBGb3JtYXRzIG51bWJlciB0byBoZXggb3IgcGFyc2VzIG51bWJlciBmcm9tIGhleCBzdHJpbmcuXG4gKiBAcGFyYW0gdlxuICovXG5leHBvcnQgY29uc3QgaGV4ID0gKHY6IG51bWJlciB8IGJpZ2ludCB8IHN0cmluZykgPT4ge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiB0b0hleCh2KVxuICAgIGNhc2UgJ2JpZ2ludCc6XG4gICAgICByZXR1cm4gdG9IZXgoTnVtYmVyKHYpKVxuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gZnJvbUhleCh2KVxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGhleDogaW52YWxpZCBhcmd1bWVudCB0eXBlICR7dHlwZW9mIHZ9YClcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnT3B0aW9ucyB7XG4gIGRlYnVnPzogYm9vbGVhblxufVxuXG5leHBvcnQgY29uc3QgaW5zdGFudGlhdGVTdHJlYW1pbmcgPSBhc3luYyAocmVzcDogUmVzcG9uc2UgfCBQcm9taXNlTGlrZTxSZXNwb25zZT4sIGltcG9ydE9iamVjdCkgPT4ge1xuICBjb25zdCByOiBSZXNwb25zZSA9IHJlc3AgaW5zdGFuY2VvZiBQcm9taXNlID8gYXdhaXQgcmVzcCA6IHJlc3BcbiAgaWYgKHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQ2Fubm90IGluc3RhbnRpYXRlIFdlYkFzc2VtYmx5IHN0cmVhbWluZywgaW52YWxpZCBIVFRQIHJlc3BvbnNlOiAnICtcbiAgICAgICAgYCcke3Iuc3RhdHVzfSAke3Iuc3RhdHVzVGV4dH0nIChVUkw6ICR7ci51cmx9KWAsXG4gICAgKVxuICB9XG5cbiAgaWYgKCdpbnN0YW50aWF0ZVN0cmVhbWluZycgaW4gV2ViQXNzZW1ibHkpIHtcbiAgICByZXR1cm4gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmcociwgaW1wb3J0T2JqZWN0KVxuICB9XG5cbiAgY29uc3Qgc291cmNlID0gYXdhaXQgci5hcnJheUJ1ZmZlcigpXG4gIHJldHVybiBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShzb3VyY2UsIGltcG9ydE9iamVjdClcbn1cbiIsICIvKipcbiAqIEFsaWducyBtZW1vcnkgYWRkcmVzcyB1c2luZyBwcm92aWRlZCBhbGlnbm1lbnRcbiAqXG4gKiBAcGFyYW0gYWRkciBBZGRyZXNzXG4gKiBAcGFyYW0gYWxpZ25tZW50IEFsaWdubWVudFxuICovXG5leHBvcnQgY29uc3QgYWxpZ25BZGRyID0gKGFkZHI6IG51bWJlciwgYWxpZ25tZW50OiBudW1iZXIpID0+IHtcbiAgLy8gQ2FsY3VsYXRlIHRoZSBvZmZzZXQgcmVxdWlyZWQgdG8gYWxpZ24gdGhlIGFkZHJlc3NcbiAgY29uc3Qgb2Zmc2V0ID0gYWxpZ25tZW50IC0gKGFkZHIgJSBhbGlnbm1lbnQpXG5cbiAgLy8gQWRkIHRoZSBvZmZzZXQgdG8gdGhlIGFkZHJlc3MgdG8gYWxpZ24gaXRcbiAgcmV0dXJuIGFkZHIgKyBvZmZzZXRcbn1cbiIsICJpbXBvcnQge2FsaWduQWRkcn0gZnJvbSBcIi4vY29tbW9uXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JpdGVSZXN1bHQge1xuICBhZGRyZXNzOiBudW1iZXJcbiAgZW5kT2Zmc2V0OiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWFkUmVzdWx0PFQgPSBhbnk+IGV4dGVuZHMgV3JpdGVSZXN1bHQge1xuICB2YWx1ZTogVFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVEZXNjcmlwdG9yIHtcbiAgc2l6ZTogbnVtYmVyXG4gIGFsaWdubWVudDogbnVtYmVyXG4gIHBhZGRpbmc6IG51bWJlclxufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIHR5cGUgcmVhZCBhbmQgd3JpdGUgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQGFic3RyYWN0XG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBYnN0cmFjdFR5cGVTcGVjPFQgPSBhbnk+IHtcbiAgcHJpdmF0ZSBfc2l6ZSA9IDBcbiAgcHJpdmF0ZSBfYWxpZ24gPSAxXG4gIHByaXZhdGUgX3NraXAgPSAwXG4gIHByaXZhdGUgcmVhZG9ubHkgX25hbWU6IHN0cmluZyA9ICcnXG5cbiAgLyoqXG4gICAqIEBwYXJhbSBuYW1lIE9yaWdpbmFsIHR5cGUgbmFtZS5cbiAgICogQHBhcmFtIHNpemUgVHlwZSBzaXplLlxuICAgKiBAcGFyYW0gYWxpZ24gVHlwZSBhbGlnbm1lbnQuXG4gICAqIEBwYXJhbSBza2lwIE51bWJlciBvZiBieXRlcyB0byBza2lwLlxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2l6ZTogbnVtYmVyLCBhbGlnbiA9IDEsIHNraXAgPSAwKSB7XG4gICAgdGhpcy5fc2l6ZSA9IHNpemVcbiAgICB0aGlzLl9hbGlnbiA9IGFsaWduXG4gICAgdGhpcy5fc2tpcCA9IHNraXBcbiAgICB0aGlzLl9uYW1lID0gbmFtZVxuICB9XG5cbiAgcHJvdGVjdGVkIHNldFR5cGVEZXNjcmlwdG9yKHsgc2l6ZSwgYWxpZ25tZW50LCBwYWRkaW5nIH06IFR5cGVEZXNjcmlwdG9yKSB7XG4gICAgdGhpcy5fc2l6ZSA9IHNpemVcbiAgICB0aGlzLl9hbGlnbiA9IGFsaWdubWVudFxuICAgIHRoaXMuX3NraXAgPSBwYWRkaW5nXG4gIH1cblxuICAvKipcbiAgICogTnVtYmVyIG9mIGJ5dGVzIHJlc2VydmVkIGFmdGVyIHZhbHVlIGNvbnRlbnRzLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IHBhZGRpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NraXBcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHZhbHVlIHR5cGUgc2l6ZS5cbiAgICogQHJldHVybnMge251bWJlcn1cbiAgICovXG4gIGdldCBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLl9zaXplXG4gIH1cblxuICAvKipcbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0eXBlIGFsaWdubWVudFxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IGFsaWdubWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYWxpZ25cbiAgfVxuXG4gIC8qKlxuICAgKiBBbGlnbiBwb2ludGVyIGFkZHJlc3NcbiAgICogQHBhcmFtIGFkZHJcbiAgICogQHJldHVybnMgQWxpZ25lZCBhZGRyZXNzXG4gICAqL1xuICBhbGlnbkFkZHJlc3MoYWRkcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoYWRkciAlIHRoaXMuX2FsaWduID09PSAwKSB7XG4gICAgICAvLyBBZGRyZXNzIGlzIGFsaWduZWRcbiAgICAgIHJldHVybiBhZGRyXG4gICAgfVxuXG4gICAgcmV0dXJuIGFsaWduQWRkcihhZGRyLCB0aGlzLl9hbGlnbilcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgdmFsdWUgZnJvbSBEYXRhVmlldyBhdCBwYXNzZWQgYWRkcmVzcyBhbmQgcmV0dXJucyBhIHZhbHVlLlxuICAgKiBQYXNzZWQgYWRkcmVzcyBzaG91bGQgYmUgYWxpZ25lZC5cbiAgICpcbiAgICogUGxlYXNlIGNvbnNpZGVyIGByZWFkKClgIGZvciBnZW5lcmFsLXB1cnBvc2UgdXNlLlxuICAgKlxuICAgKiBAYWJzdHJhY3RcbiAgICogQHBhcmFtIHZpZXcgTWVtb3J5IHZpZXdcbiAgICogQHBhcmFtIGFkZHIgQWRkcmVzc1xuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIGRlY29kZSh2aWV3OiBEYXRhVmlldywgYWRkcjogbnVtYmVyKTogVCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX0uZGVjb2RlOiBub3QgaW1wbGVtZW50ZWRgKVxuICB9XG5cbiAgLyoqXG4gICAqIEVuY29kZXMgYW5kIHB1dHMgdmFsdWUgdG8gRGF0YVZpZXcgYXQgcGFzc2VkIGFkZHJlc3MuXG4gICAqIFBhc3NlZCBhZGRyZXNzIHNob3VsZCBiZSBhbGlnbmVkLlxuICAgKlxuICAgKiBQbGVhc2UgY29uc2lkZXIgYHdyaXRlKClgIGZvciBnZW5lcmFsLXB1cnBvc2UgdXNlLlxuICAgKlxuICAgKiBAYWJzdHJhY3RcbiAgICogQHBhcmFtIHZpZXcgTWVtb3J5IHZpZXdcbiAgICogQHBhcmFtIGFkZHIgQWRkcmVzc1xuICAgKiBAcGFyYW0geyp9IHZhbFxuICAgKi9cbiAgZW5jb2RlKHZpZXc6IERhdGFWaWV3LCBhZGRyOiBudW1iZXIsIHZhbDogVCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogbm90IGltcGxlbWVudGVkYClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyB2YWx1ZSBhdCBzcGVjaWZpZWQgb2Zmc2V0IGluIG1lbW9yeSBhbmQgcmV0dXJuc1xuICAgKiBhIHZhbHVlIHdpdGggZW5kIG9mZnNldCBhZGRyZXNzLlxuICAgKlxuICAgKiBQYXNzZWQgb2Zmc2V0IGFkZHJlc3Mgd2lsbCBiZSBhbGlnbmVkIGJlZm9yZSByZWFkLlxuICAgKlxuICAgKiBAcGFyYW0gdmlldyBNZW1vcnlcbiAgICogQHBhcmFtIGFkZHIgU3RhY2sgcG9pbnRlclxuICAgKiBAcGFyYW0gYnVmZiBPcmlnaW5hbCBtZW1vcnkgYnVmZmVyXG4gICAqIEByZXR1cm5zIHtSZWFkUmVzdWx0fVxuICAgKi9cbiAgcmVhZCh2aWV3OiBEYXRhVmlldywgYWRkcjogbnVtYmVyLCBidWZmOiBBcnJheUJ1ZmZlckxpa2UpOiBSZWFkUmVzdWx0PFQ+IHtcbiAgICBjb25zdCBhZGRyZXNzID0gdGhpcy5hbGlnbkFkZHJlc3MoYWRkcilcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZGVjb2RlKHZpZXcsIGFkZHJlc3MpXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlLFxuICAgICAgYWRkcmVzcyxcbiAgICAgIGVuZE9mZnNldDogYWRkcmVzcyArIHRoaXMuc2l6ZSArIHRoaXMucGFkZGluZyxcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5jb2RlcyBhbmQgd3JpdGVzIGEgdmFsdWUgdG8gRGF0YVZpZXcgYXQgc3BlY2lmeWluZyBhZGRyZXNzLlxuICAgKiBQYXNzZWQgYWRkcmVzcyB3aWxsIGJlIGFsaWduZWQgYmVmb3JlIHdyaXRlLlxuICAgKlxuICAgKiBAcGFyYW0gdmlld1xuICAgKiBAcGFyYW0gYWRkclxuICAgKiBAcGFyYW0gdmFsXG4gICAqIEBwYXJhbSBidWZmIE9yaWdpbmFsIG1lbW9yeSBidWZmZXJcbiAgICogQHJldHVybnMge1dyaXRlUmVzdWx0fVxuICAgKi9cbiAgd3JpdGUodmlldzogRGF0YVZpZXcsIGFkZHI6IG51bWJlciwgdmFsOiBULCBidWZmOiBBcnJheUJ1ZmZlckxpa2UpOiBXcml0ZVJlc3VsdCB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuYWxpZ25BZGRyZXNzKGFkZHIpXG4gICAgdGhpcy5lbmNvZGUodmlldywgYWRkcmVzcywgdmFsKVxuICAgIHJldHVybiB7XG4gICAgICBhZGRyZXNzLFxuICAgICAgZW5kT2Zmc2V0OiBhZGRyZXNzICsgdGhpcy5zaXplICsgdGhpcy5wYWRkaW5nLFxuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7QWJzdHJhY3RUeXBlU3BlY30gZnJvbSBcIi4uL3NwZWNcIjtcblxuZXhwb3J0IGNsYXNzIEJvb2xlYW5UeXBlU3BlYyBleHRlbmRzIEFic3RyYWN0VHlwZVNwZWMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignYm9vbCcsIDEsIDEsIDApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIGNvbnN0IHZhbCA9IHZpZXcuZ2V0VWludDgoYWRkcilcbiAgICByZXR1cm4gISF2YWxcbiAgfVxuXG4gIGVuY29kZSh2aWV3LCBhZGRyLCBkYXRhKSB7XG4gICAgdmlldy5zZXRVaW50OChhZGRyLCArZGF0YSlcbiAgfVxufVxuIiwgImltcG9ydCB7QWJzdHJhY3RUeXBlU3BlY30gZnJvbSBcIi4uL3NwZWNcIjtcblxuY29uc3QgTUFYX0lOVDMyID0gNDI5NDk2NzI5NlxuXG5leHBvcnQgY2xhc3MgVUludDY0VHlwZVNwZWMgZXh0ZW5kcyBBYnN0cmFjdFR5cGVTcGVjPGJvb2xlYW4+IHtcbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHN1cGVyKG5hbWUsIDgsIDgsIDApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIGNvbnN0IGxvdyA9IHZpZXcuZ2V0VWludDMyKGFkZHIsIHRydWUpXG4gICAgY29uc3QgaGlnaCA9IHZpZXcuZ2V0SW50MzIoYWRkciArIDQsIHRydWUpXG5cbiAgICByZXR1cm4gbG93ICsgaGlnaCAqIE1BWF9JTlQzMlxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHZpZXcuc2V0VWludDMyKGFkZHIsIHZhbCwgdHJ1ZSlcbiAgICB2aWV3LnNldFVpbnQzMihhZGRyICsgNCwgTWF0aC5mbG9vcih2YWwgLyBNQVhfSU5UMzIpLCB0cnVlKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnQ2NFR5cGVTcGVjIGV4dGVuZHMgQWJzdHJhY3RUeXBlU3BlYzxudW1iZXI+IHtcbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHN1cGVyKG5hbWUsIDgsIDgsIDApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIGNvbnN0IGxvdyA9IHZpZXcuZ2V0VWludDMyKGFkZHIsIHRydWUpXG4gICAgY29uc3QgaGlnaCA9IHZpZXcuZ2V0SW50MzIoYWRkciArIDQsIHRydWUpXG5cbiAgICByZXR1cm4gbG93ICsgaGlnaCAqIE1BWF9JTlQzMlxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHZpZXcuc2V0VWludDMyKGFkZHIsIHZhbCwgdHJ1ZSlcbiAgICB2aWV3LnNldFVpbnQzMihhZGRyICsgNCwgTWF0aC5mbG9vcih2YWwgLyBNQVhfSU5UMzIpLCB0cnVlKVxuICB9XG59XG4iLCAiaW1wb3J0IHtBYnN0cmFjdFR5cGVTcGVjfSBmcm9tIFwiLi4vc3BlY1wiO1xuXG5pbnRlcmZhY2UgRGF0YVZpZXdSZWFkZXI8VCA9IG51bWJlcj4ge1xuICBjYWxsOiAodGhpc0FyZzogRGF0YVZpZXcsIGFkZHJlc3M6IG51bWJlciwgbGVmdEVuZGlhbj86IGJvb2xlYW4pID0+IFRcbn1cblxuaW50ZXJmYWNlIERhdGFWaWV3V3JpdGVyPFQgPSBudW1iZXI+IHtcbiAgY2FsbDogKHRoaXNBcmc6IERhdGFWaWV3LCBhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBULCBsZWZ0RW5kaWFuPzogYm9vbGVhbikgPT4gVFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFWaWV3RGVzY3JpcHRvcjxUID0gbnVtYmVyPiB7XG4gIHJlYWQ6IERhdGFWaWV3UmVhZGVyPFQ+XG4gIHdyaXRlOiBEYXRhVmlld1dyaXRlcjxUPlxufVxuXG4vKipcbiAqIERhdGFWaWV3YWJsZVR5cGVTcGVjIGlzIGEgdHlwZSB3cmFwcGVyIGZvciBudW1lcmljIHZhbHVlcyB0aGF0IGNhbiBiZSByZWFkXG4gKiB1c2luZyByYXcgRGF0YVZpZXcgbWV0aG9kcy5cbiAqL1xuZXhwb3J0IGNsYXNzIERhdGFWaWV3YWJsZVR5cGVTcGVjPFQgPSBudW1iZXIgfCBiaWdpbnQ+IGV4dGVuZHMgQWJzdHJhY3RUeXBlU3BlYzxUPiB7XG4gIF9yZWFkTWV0aG9kOiBEYXRhVmlld1JlYWRlcjxUPlxuICBfd3JpdGVNZXRob2Q6IERhdGFWaWV3V3JpdGVyPFQ+XG5cbiAgY29uc3RydWN0b3IobmFtZSwgc2l6ZTogbnVtYmVyLCBhbGlnbjogbnVtYmVyLCBza2lwOiBudW1iZXIsIHJ3T2JqOiBEYXRhVmlld0Rlc2NyaXB0b3I8VD4pIHtcbiAgICBzdXBlcihuYW1lLCBzaXplLCBhbGlnbiwgc2tpcClcbiAgICB0aGlzLl9yZWFkTWV0aG9kID0gcndPYmoucmVhZFxuICAgIHRoaXMuX3dyaXRlTWV0aG9kID0gcndPYmoud3JpdGVcbiAgfVxuXG4gIGRlY29kZSh2aWV3LCBhZGRyKTogVCB7XG4gICAgcmV0dXJuIHRoaXMuX3JlYWRNZXRob2QuY2FsbCh2aWV3LCBhZGRyLCB0cnVlKVxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIGRhdGEpIHtcbiAgICB0aGlzLl93cml0ZU1ldGhvZC5jYWxsKHZpZXcsIGFkZHIsIGRhdGEsIHRydWUpXG4gIH1cbn1cbiIsICJcbi8vIENvbW1vbiB0eXBlIGFsaWFzZXNcbmltcG9ydCB7Qm9vbGVhblR5cGVTcGVjfSBmcm9tIFwiLi9ib29sZWFuXCI7XG5pbXBvcnQge0ludDY0VHlwZVNwZWMsIFVJbnQ2NFR5cGVTcGVjfSBmcm9tIFwiLi91aW50NjRcIjtcbmltcG9ydCB7RGF0YVZpZXdhYmxlVHlwZVNwZWN9IGZyb20gXCIuL2RhdGF2aWV3XCI7XG5cbmV4cG9ydCBjb25zdCBCb29sID0gbmV3IEJvb2xlYW5UeXBlU3BlYygpXG4vLyBGSVhNRTogZml4IFVJbnQgc3BlYyBkZWZpbml0aW9uc1xuZXhwb3J0IGNvbnN0IEludCA9IG5ldyBVSW50NjRUeXBlU3BlYygnaW50JylcbmV4cG9ydCBjb25zdCBJbnQ2NCA9IG5ldyBJbnQ2NFR5cGVTcGVjKCdpbnQ2NCcpXG5leHBvcnQgY29uc3QgVWludCA9IG5ldyBVSW50NjRUeXBlU3BlYygndWludCcpXG5leHBvcnQgY29uc3QgVWludFB0ciA9IG5ldyBVSW50NjRUeXBlU3BlYygndWludHB0cicpXG5leHBvcnQgY29uc3QgQnl0ZSA9IG5ldyBEYXRhVmlld2FibGVUeXBlU3BlYygnYnl0ZScsIDEsIDEsIDAsIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICByZWFkOiBEYXRhVmlldy5wcm90b3R5cGUuZ2V0VWludDgsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgd3JpdGU6IERhdGFWaWV3LnByb3RvdHlwZS5zZXRVaW50OCxcbn0pXG5cbi8vIEdvIHN0b3JlcyBpbnQ4IHdpdGggcGFkZGluZyBiZWNhdXNlIG1pbmltYWwgc3VwcG9ydGVkIGRhdGEgdHlwZSBieSBhc3NlbWJseSBpcyB1aW50MzIuXG5leHBvcnQgY29uc3QgVWludDggPSBuZXcgRGF0YVZpZXdhYmxlVHlwZVNwZWMoJ3VpbnQ4JywgMSwgMSwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRVaW50OCxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICB3cml0ZTogRGF0YVZpZXcucHJvdG90eXBlLnNldFVpbnQ4LFxufSlcblxuZXhwb3J0IGNvbnN0IEludDggPSBuZXcgRGF0YVZpZXdhYmxlVHlwZVNwZWMoJ2ludDgnLCAxLCAxLCAzLCB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgcmVhZDogRGF0YVZpZXcucHJvdG90eXBlLmdldEludDgsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgd3JpdGU6IERhdGFWaWV3LnByb3RvdHlwZS5zZXRJbnQ4LFxufSlcblxuZXhwb3J0IGNvbnN0IFVpbnQzMiA9IG5ldyBEYXRhVmlld2FibGVUeXBlU3BlYygndWludDMyJywgNCwgNCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRVaW50MzIsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgd3JpdGU6IERhdGFWaWV3LnByb3RvdHlwZS5zZXRVaW50MzIsXG59KVxuXG5leHBvcnQgY29uc3QgSW50MzIgPSBuZXcgRGF0YVZpZXdhYmxlVHlwZVNwZWMoJ2ludDMyJywgNCwgNCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRJbnQzMixcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICB3cml0ZTogRGF0YVZpZXcucHJvdG90eXBlLnNldEludDMyLFxufSlcblxuLy8gRklYTUU6IHJlcGxhY2UgQmlnSW50IGRlY29kaW5nIHdpdGggbWFudWFsXG5leHBvcnQgY29uc3QgVWludDY0ID0gbmV3IERhdGFWaWV3YWJsZVR5cGVTcGVjKCd1aW50NjQnLCA4LCA4LCAwLCB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgcmVhZDogRGF0YVZpZXcucHJvdG90eXBlLmdldEJpZ1VpbnQ2NCxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICB3cml0ZTogRGF0YVZpZXcucHJvdG90eXBlLnNldEJpZ1VpbnQ2NCxcbn0pXG5cbmV4cG9ydCBjb25zdCBGbG9hdDMyID0gbmV3IERhdGFWaWV3YWJsZVR5cGVTcGVjKCdmbG9hdDMyJywgNCwgNCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRGbG9hdDMyLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHdyaXRlOiBEYXRhVmlldy5wcm90b3R5cGUuc2V0RmxvYXQzMixcbn0pXG5cbmV4cG9ydCBjb25zdCBGbG9hdDY0ID0gbmV3IERhdGFWaWV3YWJsZVR5cGVTcGVjKCdmbG9hdDY0JywgOCwgOCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRGbG9hdDY0LFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHdyaXRlOiBEYXRhVmlldy5wcm90b3R5cGUuc2V0RmxvYXQ2NCxcbn0pXG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RUeXBlU3BlYyB9IGZyb20gJy4uL3NwZWMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQXR0cmlidXRlRGVzY3JpcHRvciB7XG4gIGtleTogc3RyaW5nXG4gIHR5cGU6IEFic3RyYWN0VHlwZVNwZWNcbn1cblxuZXhwb3J0IGNsYXNzIFN0cnVjdFR5cGVTcGVjPFQgPSBvYmplY3Q+IGV4dGVuZHMgQWJzdHJhY3RUeXBlU3BlYyB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJpYnV0ZXM6IEF0dHJpYnV0ZURlc2NyaXB0b3JbXVxuICBwcml2YXRlIHJlYWRvbmx5IF9maXJzdEF0dHI6IEFic3RyYWN0VHlwZVNwZWNcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIG5hbWUgU3RydWN0IG5hbWVcbiAgICogQHBhcmFtIHtBdHRyaWJ1dGVEZXNjcmlwdG9yW119IGF0dHJzIGF0dHJpYnV0ZSBkZXNjcmlwdG9yc1xuICAgKi9cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhdHRyczogQXR0cmlidXRlRGVzY3JpcHRvcltdKSB7XG4gICAgc3VwZXIobmFtZSwgMCwgMCwgMClcblxuICAgIGlmIChhdHRycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBtaXNzaW5nIHN0cnVjdCBhdHRyaWJ1dGVzYClcbiAgICB9XG5cbiAgICBjb25zdCBbZmlyc3RFbGVtXSA9IGF0dHJzXG4gICAgY29uc3QgdG90YWxTaXplID0gYXR0cnMubWFwKCh7IHR5cGUgfSkgPT4gdHlwZS5zaXplICsgdHlwZS5wYWRkaW5nKS5yZWR1Y2UoKHRvdGFsLCBzaXplKSA9PiB0b3RhbCArIHNpemUsIDApXG5cbiAgICB0aGlzLnNldFR5cGVEZXNjcmlwdG9yKHtcbiAgICAgIHNpemU6IHRvdGFsU2l6ZSxcbiAgICAgIGFsaWdubWVudDogZmlyc3RFbGVtLnR5cGUuYWxpZ25tZW50LFxuICAgICAgcGFkZGluZzogMCxcbiAgICB9KVxuXG4gICAgdGhpcy5fYXR0cmlidXRlcyA9IGF0dHJzXG4gICAgdGhpcy5fZmlyc3RBdHRyID0gZmlyc3RFbGVtLnR5cGVcbiAgfVxuXG4gIGdldCBhbGlnbm1lbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpcnN0QXR0ci5hbGlnbm1lbnRcbiAgfVxuXG4gIGFsaWduQWRkcmVzcyhhZGRyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpcnN0QXR0ci5hbGlnbkFkZHJlc3MoYWRkcilcbiAgfVxuXG4gIHJlYWQodmlldywgYWRkciwgYnVmZjogQXJyYXlCdWZmZXJMaWtlKSB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2ZpcnN0QXR0ci5hbGlnbkFkZHJlc3MoYWRkcilcbiAgICBsZXQgb2Zmc2V0ID0gYWRkcmVzc1xuXG4gICAgY29uc3QgZW50cmllczogQXJyYXk8W3N0cmluZywgYW55XT4gPSBbXVxuICAgIGZvciAoY29uc3QgYXR0ciBvZiB0aGlzLl9hdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCB7IGtleSwgdHlwZSB9ID0gYXR0clxuICAgICAgY29uc3QgZmllbGRBZGRyID0gdHlwZS5hbGlnbkFkZHJlc3Mob2Zmc2V0KVxuICAgICAgY29uc3QgeyB2YWx1ZSwgZW5kT2Zmc2V0IH0gPSB0eXBlLnJlYWQodmlldywgZmllbGRBZGRyLCBidWZmKVxuICAgICAgZW50cmllcy5wdXNoKFtrZXksIHZhbHVlXSlcbiAgICAgIG9mZnNldCA9IGVuZE9mZnNldFxuICAgIH1cblxuICAgIGNvbnN0IHN0cnVjdE9iaiA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzKSBhcyBUXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZHJlc3MsXG4gICAgICBlbmRPZmZzZXQ6IG9mZnNldCxcbiAgICAgIHZhbHVlOiB0aGlzLnZhbHVlRnJvbVN0cnVjdChidWZmLCBzdHJ1Y3RPYmopLFxuICAgIH1cbiAgfVxuXG4gIHdyaXRlKHZpZXcsIGFkZHIsIHZhbCwgYnVmZjogQXJyYXlCdWZmZXJMaWtlKSB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2ZpcnN0QXR0ci5hbGlnbkFkZHJlc3MoYWRkcilcbiAgICBsZXQgb2Zmc2V0ID0gYWRkcmVzc1xuICAgIGlmICh0eXBlb2YgdmFsICE9PSAnb2JqZWN0Jykge1xuICAgICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFxuICAgICAgICBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LndyaXRlOiBpbnZhbGlkIHZhbHVlIHBhc3NlZCAoJHt0eXBlb2YgdmFsfSAke3ZhbH0pLiBgICtcbiAgICAgICAgICBgVmFsdWUgc2hvdWxkIGJlIGFuIG9iamVjdCB3aXRoIGF0dHJpYnV0ZXMgKCR7dGhpcy5fYXR0cmlidXRlcy5tYXAoKGEpID0+IGEua2V5KS5qb2luKCcsICcpfSkgYCArXG4gICAgICAgICAgYChzdHJ1Y3QgJHt0aGlzLm5hbWV9KWAsXG4gICAgICApXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhdHRyIG9mIHRoaXMuX2F0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IHsga2V5LCB0eXBlIH0gPSBhdHRyXG4gICAgICBpZiAoIShrZXkgaW4gdmFsKSkge1xuICAgICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXG4gICAgICAgICAgYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfS53cml0ZTogbWlzc2luZyBvYmplY3QgcHJvcGVydHkgXCIke2tleX1cIiAoc3RydWN0ICR7dGhpcy5uYW1lfSlgLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkQWRkciA9IHR5cGUuYWxpZ25BZGRyZXNzKG9mZnNldClcbiAgICAgIGNvbnN0IHsgZW5kT2Zmc2V0IH0gPSB0eXBlLndyaXRlKHZpZXcsIGZpZWxkQWRkciwgdmFsW2tleV0sIGJ1ZmYpXG4gICAgICBvZmZzZXQgPSBlbmRPZmZzZXRcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWRkcmVzcyxcbiAgICAgIGVuZE9mZnNldDogb2Zmc2V0LFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG9yaWdpbmFsIHZhbHVlIGZyb20gc3RydWN0LlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBjYW4gYmUgb3ZlcmxvYWRlZCB0byByZXR1cm4gYW4gb3JpZ2luYWwgdmFsdWVcbiAgICogcG9pbnRlZCBieSBhbiBvcmlnaW5hbCBzdHJ1Y3QuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBvYnRhaW5pbmcgYW4gb3JpZ2luYWwgc2xpY2Ugb3Igc3RyaW5nIGNvbnRlbnRzXG4gICAqIGZyb20gYHJlZmxlY3QuU3RyaW5nSGVhZGVyYCBvciBgcmVmbGVjdC5TbGljZUhlYWRlcmAgc3RydWN0cy5cbiAgICpcbiAgICogQHBhcmFtIGJ1ZmYgUmF3IG1lbW9yeSBidWZmZXJcbiAgICogQHBhcmFtIHN0cnVjdFZhbCBvcmlnaW5hbCBzdHJ1Y3QgdmFsdWVcbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgcHJvdGVjdGVkIHZhbHVlRnJvbVN0cnVjdChidWZmOiBBcnJheUJ1ZmZlckxpa2UsIHN0cnVjdFZhbDogVCk6IGFueSB7XG4gICAgcmV0dXJuIHN0cnVjdFZhbFxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHdyaXRlKCkgaW5zdGVhZGApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmRlY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHJlYWQoKSBpbnN0ZWFkYClcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBuZXcgc3RydWN0IHR5cGVcbiAqIEBwYXJhbSBuYW1lIFN0cnVjdCB0eXBlIG5hbWVcbiAqIEBwYXJhbSBmaWVsZHMgQXJyYXkgb2YgZmllbGQgZGVmaW5pdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5leHBvcnQgY29uc3QgU3RydWN0ID0gPFQgPSBvYmplY3Q+KG5hbWU6IHN0cmluZywgZmllbGRzOiBBdHRyaWJ1dGVEZXNjcmlwdG9yW10pID0+IG5ldyBTdHJ1Y3RUeXBlU3BlYzxUPihuYW1lLCBmaWVsZHMpXG4iLCAiaW1wb3J0IHtBYnN0cmFjdFR5cGVTcGVjfSBmcm9tIFwiLi4vc3BlY1wiO1xuXG5leHBvcnQgY2xhc3MgQXJyYXlUeXBlU3BlYyBleHRlbmRzIEFic3RyYWN0VHlwZVNwZWMge1xuICBwcml2YXRlIHJlYWRvbmx5IF9lbGVtVHlwZTogQWJzdHJhY3RUeXBlU3BlY1xuICBwcml2YXRlIHJlYWRvbmx5IF9sZW5ndGggPSAwXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlU3BlY30gZWxlbVR5cGUgQXJyYXkgaXRlbSB0eXBlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggQXJyYXkgc2l6ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbVR5cGUsIGxlbmd0aCkge1xuICAgIHN1cGVyKGBbJHtsZW5ndGh9XSR7ZWxlbVR5cGUubmFtZX1gLCAoZWxlbVR5cGUuc2l6ZSArIGVsZW1UeXBlLnBhZGRpbmcpICogbGVuZ3RoLCBlbGVtVHlwZS5hbGlnbm1lbnQsIDApXG5cbiAgICBpZiAobGVuZ3RoIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IGFycmF5IGl0ZW0gY291bnQgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiB6ZXJvYClcbiAgICB9XG5cbiAgICB0aGlzLl9lbGVtVHlwZSA9IGVsZW1UeXBlXG4gICAgdGhpcy5fbGVuZ3RoID0gbGVuZ3RoXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhcnJheSBlbGVtZW50IHR5cGUuXG4gICAqIEByZXR1cm5zIHtBYnN0cmFjdFR5cGVTcGVjfVxuICAgKi9cbiAgZ2V0IGVsZW1UeXBlKCkge1xuICAgIHJldHVybiB0aGlzLl9lbGVtVHlwZVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoXG4gIH1cblxuICBnZXQgYWxpZ25tZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9lbGVtVHlwZS5hbGlnbm1lbnRcbiAgfVxuXG4gIGFsaWduQWRkcmVzcyhhZGRyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhhZGRyKVxuICB9XG5cbiAgcmVhZCh2aWV3LCBhZGRyLCBidWZmKSB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhhZGRyKVxuICAgIGxldCBvZmZzZXQgPSBhZGRyZXNzXG4gICAgY29uc3QgZW50cmllczogYW55W10gPSBbXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbUFkZHIgPSB0aGlzLl9lbGVtVHlwZS5hbGlnbkFkZHJlc3Mob2Zmc2V0KVxuICAgICAgY29uc3QgeyB2YWx1ZSwgZW5kT2Zmc2V0IH0gPSB0aGlzLl9lbGVtVHlwZS5yZWFkKHZpZXcsIGVsZW1BZGRyLCBidWZmKVxuICAgICAgZW50cmllcy5wdXNoKHZhbHVlKVxuICAgICAgb2Zmc2V0ID0gZW5kT2Zmc2V0XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZHJlc3MsXG4gICAgICBlbmRPZmZzZXQ6IG9mZnNldCxcbiAgICAgIHZhbHVlOiBlbnRyaWVzLFxuICAgIH1cbiAgfVxuXG4gIHdyaXRlKHZpZXcsIGFkZHIsIHZhbCwgYnVmZikge1xuICAgIGlmICh2YWwubGVuZ3RoICE9PSB0aGlzLl9sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LndyaXRlOiBhcnJheSBsZW5ndGggc2hvdWxkIGJlICR7dGhpcy5fbGVuZ3RofSAoZ290OiAke3ZhbC5sZW5ndGh9KWApXG4gICAgfVxuXG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhhZGRyKVxuICAgIGxldCBvZmZzZXQgPSBhZGRyZXNzXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2xlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtQWRkciA9IHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhvZmZzZXQpXG4gICAgICBjb25zdCB7IGVuZE9mZnNldCB9ID0gdGhpcy5fZWxlbVR5cGUud3JpdGUodmlldywgaXRlbUFkZHIsIHZhbFtpXSwgYnVmZilcbiAgICAgIG9mZnNldCA9IGVuZE9mZnNldFxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhZGRyZXNzLFxuICAgICAgZW5kT2Zmc2V0OiBvZmZzZXQsXG4gICAgfVxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHdyaXRlKCkgaW5zdGVhZGApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmRlY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHJlYWQoKSBpbnN0ZWFkYClcbiAgfVxufVxuIiwgImltcG9ydCB7IFVpbnRQdHIsIEludCB9IGZyb20gJy4uL2Jhc2ljJ1xuaW1wb3J0IHsgU3RydWN0VHlwZVNwZWMgfSBmcm9tICcuLi9jb21wbGV4J1xuXG5leHBvcnQgY29uc3Qgc3RyaW5nRW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpXG5leHBvcnQgY29uc3Qgc3RyaW5nRGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKVxuXG5jb25zdCBzdHJpbmdTdHJ1Y3REZXNjcmlwdG9yID0gW1xuICB7IGtleTogJ2RhdGEnLCB0eXBlOiBVaW50UHRyIH0sXG4gIHsga2V5OiAnbGVuJywgdHlwZTogSW50IH0sXG5dXG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RyaW5nSGVhZGVyIHtcbiAgZGF0YTogbnVtYmVyXG4gIGxlbjogbnVtYmVyXG59XG5cbmNsYXNzIEdvU3RyaW5nVHlwZVNwZWMgZXh0ZW5kcyBTdHJ1Y3RUeXBlU3BlYzxTdHJpbmdIZWFkZXI+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoJ3N0cmluZycsIHN0cmluZ1N0cnVjdERlc2NyaXB0b3IpXG4gIH1cblxuICBwcm90ZWN0ZWQgdmFsdWVGcm9tU3RydWN0KG1lbTogQXJyYXlCdWZmZXJMaWtlLCBzdHJ1Y3RWYWw6IFN0cmluZ0hlYWRlcikge1xuICAgIGNvbnN0IHsgZGF0YSwgbGVuIH0gPSBzdHJ1Y3RWYWxcbiAgICBpZiAoIWxlbikge1xuICAgICAgcmV0dXJuICcnXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZ0RlY29kZXIuZGVjb2RlKG5ldyBEYXRhVmlldyhtZW0sIGRhdGEsIGxlbikpXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IEdvU3RyaW5nVHlwZSA9IG5ldyBHb1N0cmluZ1R5cGVTcGVjKClcbmV4cG9ydCBjb25zdCBTdHJpbmdIZWFkZXJUeXBlID0gbmV3IFN0cnVjdFR5cGVTcGVjKCdyZWZsZWN0LlN0cmluZ0hlYWRlcicsIHN0cmluZ1N0cnVjdERlc2NyaXB0b3IpXG4iLCAiaW1wb3J0IHsgR29TdHJpbmdUeXBlIH0gZnJvbSAnLi9zdHJpbmcnXG5pbXBvcnQgeyB0eXBlIEFic3RyYWN0VHlwZVNwZWMgfSBmcm9tICcuLi9zcGVjJ1xuaW1wb3J0IHsgdHlwZSBBdHRyaWJ1dGVEZXNjcmlwdG9yLCBTdHJ1Y3RUeXBlU3BlYywgQXJyYXlUeXBlU3BlYyB9IGZyb20gJy4uL2NvbXBsZXgnXG5pbXBvcnQgeyBCb29sLCBJbnQsIEludDMyLCBJbnQ2NCwgVWludCwgVWludDMyLCBVaW50NjQsIFVpbnRQdHIgfSBmcm9tICcuLi9iYXNpYydcblxuY29uc3Qgc2xpY2VIZWFkZXJBdHRyczogQXR0cmlidXRlRGVzY3JpcHRvcltdID0gW1xuICB7IGtleTogJ2RhdGEnLCB0eXBlOiBVaW50UHRyIH0sXG4gIHsga2V5OiAnbGVuJywgdHlwZTogSW50IH0sXG4gIHsga2V5OiAnY2FwJywgdHlwZTogSW50IH0sXG5dXG5cbmV4cG9ydCBjb25zdCBTbGljZUhlYWRlclR5cGUgPSBuZXcgU3RydWN0VHlwZVNwZWMoJ3JlZmxlY3QuU2xpY2VIZWFkZXInLCBzbGljZUhlYWRlckF0dHJzKVxuXG4vKipcbiAqIFNsaWNlSGVhZGVyIHJlcHJlc2VudHMgYSBgcmVmbGVjdC5TbGljZUhlYWRlcmAgR28gc3RydWN0dXJlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNsaWNlSGVhZGVyIHtcbiAgLyoqXG4gICAqIEFycmF5IHBvaW50ZXJcbiAgICovXG4gIGRhdGE6IG51bWJlclxuXG4gIC8qKlxuICAgKiBTbGljZSBsZW5ndGhcbiAgICovXG4gIGxlbjogbnVtYmVyXG5cbiAgLyoqXG4gICAqIFNsaWNlIGNhcGFjaXR5XG4gICAqL1xuICBjYXA6IG51bWJlclxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBgW11UYCBHbyBzbGljZSBzdHJ1Y3QgcmVhZGVyLlxuICpcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgaXRlbXMgZHVyaW5nIGRlY29kZS5cbiAqL1xuY2xhc3MgU2xpY2VUeXBlU3BlYzxUID0gbnVtYmVyPiBleHRlbmRzIFN0cnVjdFR5cGVTcGVjPFNsaWNlSGVhZGVyPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZWxlbVR5cGU6IEFic3RyYWN0VHlwZVNwZWMpIHtcbiAgICBzdXBlcihgW10ke2VsZW1UeXBlLm5hbWV9YCwgc2xpY2VIZWFkZXJBdHRycylcbiAgfVxuXG4gIHByb3RlY3RlZCB2YWx1ZUZyb21TdHJ1Y3QoYnVmZjogQXJyYXlCdWZmZXJMaWtlLCBoZWFkZXI6IFNsaWNlSGVhZGVyKTogVFtdIHtcbiAgICBjb25zdCB7IGRhdGEsIGxlbiB9ID0gaGVhZGVyXG4gICAgaWYgKCFkYXRhIHx8ICFsZW4pIHtcbiAgICAgIHJldHVybiBbXSBhcyBUW11cbiAgICB9XG5cbiAgICBjb25zdCB0ID0gbmV3IEFycmF5VHlwZVNwZWModGhpcy5lbGVtVHlwZSwgbGVuKVxuICAgIGNvbnN0IHsgdmFsdWUgfSA9IHQucmVhZChuZXcgRGF0YVZpZXcoYnVmZiksIGRhdGEsIGJ1ZmYpXG4gICAgcmV0dXJuIHZhbHVlIGFzIFRbXVxuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIG5ldyBzbGljZSB0eXBlLlxuICogQHBhcmFtIGl0ZW1UeXBlIFNsaWNlIGl0ZW0gdHlwZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjb25zdCBTbGljZU9mID0gPFQgPSBudW1iZXI+KGl0ZW1UeXBlOiBBYnN0cmFjdFR5cGVTcGVjKSA9PiBuZXcgU2xpY2VUeXBlU3BlYzxUPihpdGVtVHlwZSlcblxuZXhwb3J0IGNvbnN0IFN0cmluZ1NsaWNlID0gU2xpY2VPZjxzdHJpbmc+KEdvU3RyaW5nVHlwZSlcbmV4cG9ydCBjb25zdCBJbnRTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihJbnQpXG5leHBvcnQgY29uc3QgSW50MzJTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihJbnQzMilcbmV4cG9ydCBjb25zdCBJbnQ2NFNsaWNlID0gU2xpY2VPZjxudW1iZXI+KEludDY0KVxuZXhwb3J0IGNvbnN0IFVpbnRTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihVaW50KVxuZXhwb3J0IGNvbnN0IFVpbnQzMlNsaWNlID0gU2xpY2VPZjxudW1iZXI+KFVpbnQzMilcbmV4cG9ydCBjb25zdCBVaW50NjRTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihVaW50NjQpXG5leHBvcnQgY29uc3QgVWludFB0clNsaWNlID0gU2xpY2VPZjxudW1iZXI+KFVpbnRQdHIpXG5leHBvcnQgY29uc3QgQm9vbFNsaWNlID0gU2xpY2VPZjxib29sZWFuPihCb29sKVxuIiwgImltcG9ydCB7IFNsaWNlT2YsIFN0cnVjdCwgVWludDMyLCBVaW50UHRyIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFsdWUge1xuICByZWY6IG51bWJlclxuICBnY1B0cjogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRnVuYyB7XG4gIHZhbHVlOiBWYWx1ZVxuICBpZDogbnVtYmVyXG59XG5cbi8qKlxuICogYHN5c2NhbGwvanMuVmFsdWVgIHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBWYWx1ZVR5cGUgPSBTdHJ1Y3QoJ3N5c2NhbGwvanMuVmFsdWUnLCBbXG4gIHsga2V5OiAncmVmJywgdHlwZTogVWludFB0ciB9LFxuICB7IGtleTogJ2djUHRyJywgdHlwZTogVWludFB0ciB9LFxuXSlcblxuLyoqXG4gKiBgc3lzY2FsbC9qcy5GdW5jYCB0eXBlLlxuICovXG5leHBvcnQgY29uc3QgRnVuY1R5cGUgPSBTdHJ1Y3QoJ3N5c2NhbGwvanMuRnVuYycsIFtcbiAgeyBrZXk6ICd2YWx1ZScsIHR5cGU6IFZhbHVlVHlwZSB9LFxuICB7IGtleTogJ2lkJywgdHlwZTogVWludDMyIH0sXG5dKVxuXG5leHBvcnQgY29uc3QgVmFsdWVTbGljZSA9IFNsaWNlT2Y8VmFsdWU+KFZhbHVlVHlwZSlcbiIsICJpbXBvcnQgeyBTbGljZU9mLCBVaW50MzIgfSBmcm9tICcuLi8uLi8uLi90eXBlcydcbmltcG9ydCB7IHR5cGUgSlNWYWx1ZXNUYWJsZSB9IGZyb20gJy4uLy4uLy4uL3dyYXBwZXIvaW50ZXJmYWNlJ1xuaW1wb3J0IHtBYnN0cmFjdFR5cGVTcGVjfSBmcm9tIFwiLi4vLi4vLi4vdHlwZXMvc3BlY1wiO1xuXG5leHBvcnQgY29uc3QgTkFOX0hFQUQgPSAweDdmZjgwMDAwXG5cbmVudW0gVHlwZUZsYWcge1xuICBFbXB0eSA9IDAsXG4gIE9iamVjdCA9IDEsXG4gIFN0cmluZyA9IDIsXG4gIFN5bWJvbCA9IDMsXG4gIEZ1bmN0aW9uID0gNCxcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGZ1bmN0aW9uIHR5cGUgZmxhZy5cbiAqIEBwYXJhbSB2XG4gKi9cbmNvbnN0IGdldFR5cGVGbGFnID0gKHY6IGFueSk6IFR5cGVGbGFnID0+IHtcbiAgc3dpdGNoICh0eXBlb2Ygdikge1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICByZXR1cm4gdiA9PT0gbnVsbCA/IFR5cGVGbGFnLkVtcHR5IDogVHlwZUZsYWcuT2JqZWN0XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiBUeXBlRmxhZy5TdHJpbmdcbiAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgcmV0dXJuIFR5cGVGbGFnLlN5bWJvbFxuICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgIHJldHVybiBUeXBlRmxhZy5GdW5jdGlvblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gVHlwZUZsYWcuRW1wdHlcbiAgfVxufVxuXG4vKipcbiAqIFJlZktpbmQgaXMgUmVmIHR5cGUuXG4gKi9cbmV4cG9ydCBlbnVtIFJlZktpbmQge1xuICAvKipcbiAgICogSW52YWxpZCByZWZcbiAgICovXG4gIEludmFsaWQsXG5cbiAgLyoqXG4gICAqIExpdGVyYWwgdmFsdWVcbiAgICovXG4gIFZhbHVlLFxuXG4gIC8qKlxuICAgKiBSZWZlcmVuY2UgdG8gdmFsdWVzIHRhYmxlXG4gICAqL1xuICBJRCxcbn1cblxuLyoqXG4gKiBSZWYgaXMgd3JhcHBlciB0eXBlIGFyb3VuZCBgc3lzY2FsbC9qcy5yZWZgIHZhbHVlLlxuICpcbiAqIGBqcy5yZWZgIGlzIGEgcG9pbnRlciB0byBKYXZhU2NyaXB0IHZhbHVlIHJlZ2lzdGVyZWRcbiAqIGluIEdvIHZhbHVlcyBtYXBwaW5nIHRhYmxlIChgR28uX3ZhbHVlc2ApLlxuICovXG5leHBvcnQgY2xhc3MgUmVmIHtcbiAgLyoqXG4gICAqIFJlZiBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ga2luZCBSZWZlcmVuY2Ugc291cmNlIHR5cGUsIHVzZWQgdG8gZGVjb2RlIEpTIHZhbHVlIGZyb20gcmVmZXJlbmNlLlxuICAgKiBAcGFyYW0gcmVmIFJlZmVyZW5jZSBJRFxuICAgKiBAcGFyYW0gZGF0YSBFeHRyYSBkYXRhIGZvciB3cml0ZSBvbiBlbmNvZGUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogUmVmS2luZCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOiBudW1iZXIgPSAtMSxcbiAgICBwdWJsaWMgcmVhZG9ubHkgZGF0YT86IG51bWJlcltdLFxuICApIHt9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZXNvbHZlZCBKUyB2YWx1ZSBmcm9tIHJlZi5cbiAgICogQHBhcmFtIHZhbHVlcyBWYWx1ZXMgdGFibGVcbiAgICovXG4gIHRvVmFsdWUodmFsdWVzOiBKU1ZhbHVlc1RhYmxlKSB7XG4gICAgc3dpdGNoICh0aGlzLmtpbmQpIHtcbiAgICAgIGNhc2UgUmVmS2luZC5JRDpcbiAgICAgICAgcmV0dXJuIHZhbHVlc1t0aGlzLnJlZl1cbiAgICAgIGNhc2UgUmVmS2luZC5WYWx1ZTpcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgd3JpdGFibGUgUmVmIGZyb20gdmFsdWUgYW5kIHJlZiBJRC5cbiAgICpcbiAgICogQHBhcmFtIHYgVmFsdWVcbiAgICogQHBhcmFtIHZhbElkIFJlZiBJRFxuICAgKi9cbiAgc3RhdGljIGZyb21WYWx1ZSh2OiBFeGNsdWRlPGFueSwgUmVmPiwgdmFsSWQ6IG51bWJlcikge1xuICAgIC8vIENvcGllZCBmcm9tIGBzdG9yZVZhbHVlYC5cbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWYuZnJvbVZhbHVlOiB2YWx1ZSBpcyBhbHJlYWR5IGEgUmVmICgke3YucmVmfSlgKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicgJiYgdiAhPT0gMCkge1xuICAgICAgLy8gU2VlOiBzdG9yZVZhbHVlIC0gd2FzbV9leGVjLmpzOjEyOVxuICAgICAgY29uc3Qga2luZCA9IGlzTmFOKHYpID8gUmVmS2luZC5JRCA6IFJlZktpbmQuVmFsdWVcbiAgICAgIHJldHVybiBuZXcgUmVmKGtpbmQsIHZhbElkLCBpc05hTih2KSA/IFswLCBOQU5fSEVBRF0gOiBbdl0pXG4gICAgfVxuXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG5ldyBSZWYoUmVmS2luZC5WYWx1ZSwgdmFsSWQsIFswXSlcbiAgICB9XG5cbiAgICBjb25zdCB0eXBlRmxhZyA9IGdldFR5cGVGbGFnKHYpXG4gICAgY29uc3QgaGVhZCA9IE5BTl9IRUFEIHwgdHlwZUZsYWdcbiAgICByZXR1cm4gbmV3IFJlZihSZWZLaW5kLklELCB2YWxJZCwgW3ZhbElkLCBoZWFkXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBvcnRzIHdoZW5ldmVyIHZhbHVlIHNob3VsZCBiZSByZWZlcmVuY2VkXG4gICAqIGJ5IHZhbHVlcyB0YWJsZSBvciBjYW4gYmUgc3RvcmVkIGFzIFJlZiB2YWx1ZS5cbiAgICpcbiAgICogVXNlZCBieSB3cml0ZXIgdG8gZGVjaWRlIGlmIG5lY2Vzc2FyeSB0byBhbGxvY2F0ZVxuICAgKiBhIG5ldyByZWYgaWQgb3Igbm90LlxuICAgKlxuICAgKiBAcGFyYW0gdlxuICAgKi9cbiAgc3RhdGljIGlzUmVmZXJlbmNlYWJsZVZhbHVlKHY6IEV4Y2x1ZGU8YW55LCBSZWY+KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSAnbnVtYmVyJyAmJiB2ICE9PSAwKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkXG4gIH1cbn1cblxuY2xhc3MgUmVmVHlwZVNwZWMgZXh0ZW5kcyBBYnN0cmFjdFR5cGVTcGVjPFJlZj4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignc3lzY2FsbC5qcy9yZWYnLCA4LCA4LCAwKVxuICB9XG5cbiAgZGVjb2RlKHZpZXcsIGFkZHIpOiBSZWYge1xuICAgIGNvbnN0IHZhbHVlID0gdmlldy5nZXRGbG9hdDY0KGFkZHIsIHRydWUpXG4gICAgaWYgKHZhbHVlID09PSAwKSB7XG4gICAgICByZXR1cm4gbmV3IFJlZihSZWZLaW5kLkludmFsaWQpXG4gICAgfVxuXG4gICAgaWYgKCFpc05hTih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBuZXcgUmVmKFJlZktpbmQuVmFsdWUsIHZhbHVlKVxuICAgIH1cblxuICAgIGNvbnN0IGlkID0gdmlldy5nZXRVaW50MzIoYWRkciwgdHJ1ZSlcbiAgICByZXR1cm4gbmV3IFJlZihSZWZLaW5kLklELCBpZClcbiAgfVxuXG4gIGVuY29kZSh2aWV3OiBEYXRhVmlldywgYWRkcjogbnVtYmVyLCByZWY6IFJlZikge1xuICAgIGlmICghcmVmLmRhdGE/Lmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogUmVmIHZhbHVlIGlzIG5vdCB3cml0YWJsZS4gYCArXG4gICAgICAgICAgYFJlZiBzaG91bGQgYmUgY3JlYXRlZCB1c2luZyBSZWYuZnJvbVZhbHVlKCkgbWV0aG9kLmAsXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gU2VlOiBzdG9yZVZhbHVlIC0gd2FzbV9leGVjLmpzOjE0MFxuICAgIGNvbnN0IFtoaWdoLCBsb3ddID0gcmVmLmRhdGFcbiAgICBzd2l0Y2ggKHJlZi5kYXRhLmxlbmd0aCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICB2aWV3LnNldEZsb2F0NjQoYWRkciwgaGlnaCwgdHJ1ZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICBjYXNlIDI6XG4gICAgICAgIHZpZXcuc2V0VWludDMyKGFkZHIsIGhpZ2gsIHRydWUpXG4gICAgICAgIHZpZXcuc2V0VWludDMyKGFkZHIgKyBVaW50MzIuc2l6ZSwgbG93LCB0cnVlKVxuICAgICAgICByZXR1cm5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogaW52YWxpZCBSZWYgZGF0YSBzaXplOiAke3JlZi5kYXRhLmxlbmd0aH1gKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgUmVmVHlwZSA9IG5ldyBSZWZUeXBlU3BlYygpXG5leHBvcnQgY29uc3QgUmVmU2xpY2UgPSBTbGljZU9mPFJlZj4oUmVmVHlwZSlcbiIsICJpbXBvcnQgdHlwZSAqIGFzIG1vbmFjbyBmcm9tICdtb25hY28tZWRpdG9yJ1xuaW1wb3J0ICcuLi9saWIvZ28vd2FzbV9leGVjLmpzJ1xuaW1wb3J0IHtpbnN0YW50aWF0ZVN0cmVhbWluZ30gZnJvbSBcIi4uL2xpYi9nb1wiO1xuXG4vLyBUT0RPIGJyZWFkY2hyaXMgc2hvdWxkIGJlIGRpc3RcbmV4cG9ydCBjb25zdCBnZXRXYXNtVXJsID0gKG5hbWUpID0+IGAvc3RhdGljLyR7bmFtZX1AdjEud2FzbWBcblxudHlwZSBKU09OQ2FsbGJhY2sgPSAocnNwOiBzdHJpbmcpID0+IHZvaWRcbnR5cGUgQ2FsbEFyZ3MgPSBbLi4uYW55W10sIEpTT05DYWxsYmFja11cblxuaW50ZXJmYWNlIEdvTW9kdWxlIHtcbiAgYW5hbHl6ZUNvZGU6IChjb2RlOiBzdHJpbmcsIGNiOiBKU09OQ2FsbGJhY2spID0+IHZvaWRcbiAgcnVuQ29kZTogKGNvZGU6IHN0cmluZywgY2I6IEpTT05DYWxsYmFjaykgPT4gdm9pZFxuICBleGl0OiAoKSA9PiB2b2lkXG59XG5cbmludGVyZmFjZSBBbmFseXplUmVzdWx0IHtcbiAgaGFzRXJyb3JzOiBib29sZWFuXG4gIG1hcmtlcnM6IG1vbmFjby5lZGl0b3IuSU1hcmtlckRhdGFbXSB8IG51bGxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZVJlcXVlc3Qge1xuICBjb250ZW50czogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VSZXNwb25zZSB7XG4gIGVycm9yOiBzdHJpbmdcbiAgZnVuY3Rpb25zOiBzdHJpbmdbXVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1blJlcXVlc3Qge1xuICBmdW5jOiBzdHJpbmdcbiAgY29kZTogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuUmVzcG9uc2Uge1xuICBvdXRwdXQ6IHN0cmluZ1xuICBlcnJvcjogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JhcHBlZEdvTW9kdWxlIHtcbiAgYW5hbHl6ZUNvZGU6IChjb2RlOiBzdHJpbmcpID0+IFByb21pc2U8QW5hbHl6ZVJlc3VsdD5cbiAgcnVuQ29kZTogKHI6IFJ1blJlcXVlc3QpID0+IFByb21pc2U8UnVuUmVzcG9uc2U+XG4gIHBhcnNlQ29kZTogKGNvZGU6IHN0cmluZykgPT4gUHJvbWlzZTxQYXJzZVJlc3BvbnNlPlxuICBleGl0OiAoKSA9PiBQcm9taXNlPHZvaWQ+XG59XG5cbmludGVyZmFjZSBHb1Jlc3BvbnNlPFQgPSBhbnk+IHtcbiAgZXJyb3I6IHN0cmluZ1xuICByZXN1bHQ6IFRcbn1cblxuY29uc3Qgd3JhcE1vZHVsZSA9IChtb2Q6IEdvTW9kdWxlKSA9PiB7XG4gIGNvbnN0IHdyYXBwZWQgPSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtY2FsbFxuICAgIGV4aXQ6ICgpID0+IG1vZC5leGl0LmNhbGwobW9kKSxcbiAgfVxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVuc2FmZS1hcmd1bWVudFxuICBPYmplY3Qua2V5cyhtb2QpXG4gICAgLmZpbHRlcigoaykgPT4gayAhPT0gJ2V4aXQnKVxuICAgIC5mb3JFYWNoKChmbk5hbWUpID0+IHtcbiAgICAgIHdyYXBwZWRbZm5OYW1lXSA9IGFzeW5jICguLi5hcmdzKSA9PlxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3QgY2IgPSAocmF3UmVzcCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzcDogR29SZXNwb25zZSA9IEpTT04ucGFyc2UocmF3UmVzcClcbiAgICAgICAgICAgICAgaWYgKHJlc3AuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGAke2ZuTmFtZX06ICR7cmVzcC5lcnJvcn1gKSlcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJlc29sdmUocmVzcC5yZXN1bHQpXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhbmFseXplcjogXCIke2ZuTmFtZX1cIiByZXR1cm5lZCBhbmQgZXJyb3JgLCBleClcbiAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgJHtmbk5hbWV9OiAke2V4fWApKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG5ld0FyZ3MgPSBhcmdzLmNvbmNhdChjYikgYXMgQ2FsbEFyZ3NcbiAgICAgICAgICBtb2RbZm5OYW1lXS5hcHBseShzZWxmLCBuZXdBcmdzKVxuICAgICAgICB9KVxuICAgIH0pXG4gIHJldHVybiB3cmFwcGVkIGFzIFdyYXBwZWRHb01vZHVsZVxufVxuXG5leHBvcnQgY29uc3Qgc3RhcnRBbmFseXplciA9IGFzeW5jICgpOiBQcm9taXNlPFdyYXBwZWRHb01vZHVsZT4gPT4ge1xuICBjb25zdCB3b3JrZXJVcmwgPSBnZXRXYXNtVXJsKCdhbmFseXplcicpXG4gIGNvbnN0IGdvID0gbmV3IGdsb2JhbFRoaXMuR28oKVxuXG4gIC8vIFBhc3MgdGhlIGVudHJ5cG9pbnQgdmlhIGFyZ3YuXG4gIGdvLmFyZ3YgPSBbJ2pzJywgJ29uTW9kdWxlSW5pdCddXG5cbiAgY29uc3QgcnNwID0gYXdhaXQgZmV0Y2god29ya2VyVXJsKVxuICBpZiAoIXJzcC5vaykge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIHdvcmtlcjogJHtyc3Auc3RhdHVzfSAke3JzcC5zdGF0dXNUZXh0fWApXG4gIH1cblxuICBjb25zdCB7IGluc3RhbmNlIH0gPSBhd2FpdCBpbnN0YW50aWF0ZVN0cmVhbWluZyhyc3AsIGdvLmltcG9ydE9iamVjdClcbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAvLyBIb29rIGNhbGxlZCBieSBHbyBwcm9ncmFtXG4gICAgZ2xvYmFsVGhpcy5vbk1vZHVsZUluaXQgPSAoZ29Nb2Q6IEdvTW9kdWxlKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnYW5hbHl6ZXI6IHN0YXJ0ZWQnKVxuICAgICAgY29uc3Qgd3JhcHBlZCA9IHdyYXBNb2R1bGUoZ29Nb2QpXG4gICAgICByZXR1cm4gcmVzb2x2ZSh3cmFwcGVkKVxuICAgIH1cblxuICAgIGdvLnJ1bihpbnN0YW5jZSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgIHJlamVjdChlcnIpXG4gICAgfSlcbiAgfSlcbn1cbiIsICJpbXBvcnQgKiBhcyBDb21saW5rIGZyb20gJ2NvbWxpbmsnXG5pbXBvcnQge3R5cGUgV3JhcHBlZEdvTW9kdWxlLCBzdGFydEFuYWx5emVyLCBSdW5SZXF1ZXN0LCBSdW5SZXNwb25zZSwgUGFyc2VSZXF1ZXN0LCBQYXJzZVJlc3BvbnNlfSBmcm9tICcuL2Jvb3RzdHJhcCdcbmltcG9ydCB0eXBlICogYXMgbW9uYWNvIGZyb20gJ21vbmFjby1lZGl0b3InXG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5hbHl6ZVJlcXVlc3Qge1xuICBmaWxlTmFtZTogc3RyaW5nXG4gIGNvbnRlbnRzOiBzdHJpbmdcbiAgbW9kZWxWZXJzaW9uSWQ6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5emVSZXNwb25zZSB7XG4gIGZpbGVOYW1lOiBzdHJpbmdcbiAgbW9kZWxWZXJzaW9uSWQ6IG51bWJlclxuICBtYXJrZXJzOiBtb25hY28uZWRpdG9yLklNYXJrZXJEYXRhW10gfCBudWxsXG59XG5cbi8vIFRPRE86IHJlZmFjdG9yIHRoaXMgdG9nZXRoZXIgd2l0aCB0aGUgR28gd29ya2VyIEFQSVxuXG5jb25zdCBhcHBlbmRNb2RlbFZlcnNpb24gPSAobWFya2VyczogQW5hbHl6ZVJlc3BvbnNlWydtYXJrZXJzJ10sIG1vZGVsVmVyc2lvbklkOiBudW1iZXIpID0+IHtcbiAgaWYgKCFtYXJrZXJzKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiBtYXJrZXJzLm1hcCgobWFya2VyKSA9PiAoeyAuLi5tYXJrZXIsIG1vZGVsVmVyc2lvbklkIH0pKVxufVxuXG5leHBvcnQgY2xhc3MgV29ya2VySGFuZGxlciB7XG4gIHByaXZhdGUgbW9kPzogV3JhcHBlZEdvTW9kdWxlXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdFByb21pc2UgPSBzdGFydEFuYWx5emVyKClcblxuICBwcml2YXRlIGFzeW5jIGdldE1vZHVsZSgpIHtcbiAgICB0aGlzLm1vZCA/Pz0gYXdhaXQgdGhpcy5pbml0UHJvbWlzZVxuICAgIHJldHVybiB0aGlzLm1vZFxuICB9XG5cbiAgYXN5bmMgcnVuQ29kZShyOiBSdW5SZXF1ZXN0KTogUHJvbWlzZTxSdW5SZXNwb25zZT4ge1xuICAgIGNvbnN0IG1vZCA9IGF3YWl0IHRoaXMuZ2V0TW9kdWxlKClcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgbW9kLnJ1bkNvZGUocilcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgb3V0cHV0OiAnJyxcbiAgICAgICAgICBlcnJvcjogZS50b1N0cmluZygpLFxuICAgICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcGFyc2VDb2RlKHsgY29udGVudHMgfTogUGFyc2VSZXF1ZXN0KTogUHJvbWlzZTxQYXJzZVJlc3BvbnNlPiB7XG4gICAgY29uc3QgbW9kID0gYXdhaXQgdGhpcy5nZXRNb2R1bGUoKVxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBtb2QucGFyc2VDb2RlKGNvbnRlbnRzKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlcnJvcjogZS50b1N0cmluZygpLFxuICAgICAgICAgIGZ1bmN0aW9uczogW10sXG4gICAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBjaGVja1N5bnRheEVycm9ycyh7IGZpbGVOYW1lLCBtb2RlbFZlcnNpb25JZCwgY29udGVudHMgfTogQW5hbHl6ZVJlcXVlc3QpOiBQcm9taXNlPEFuYWx5emVSZXNwb25zZT4ge1xuICAgIGNvbnN0IG1vZCA9IGF3YWl0IHRoaXMuZ2V0TW9kdWxlKClcbiAgICBjb25zdCB7IG1hcmtlcnMgfSA9IGF3YWl0IG1vZC5hbmFseXplQ29kZShjb250ZW50cylcbiAgICByZXR1cm4ge1xuICAgICAgZmlsZU5hbWUsXG4gICAgICBtb2RlbFZlcnNpb25JZCxcbiAgICAgIG1hcmtlcnM6IGFwcGVuZE1vZGVsVmVyc2lvbihtYXJrZXJzLCBtb2RlbFZlcnNpb25JZCksXG4gICAgfVxuICB9XG59XG5cbkNvbWxpbmsuZXhwb3NlKG5ldyBXb3JrZXJIYW5kbGVyKCkpXG4iXSwKICAibWFwcGluZ3MiOiAiO0lBaUJhLGNBQWMsT0FBTyxlQUFlO0lBQ3BDLGlCQUFpQixPQUFPLGtCQUFrQjtJQUMxQyxlQUFlLE9BQU8sc0JBQXNCO0lBQzVDLFlBQVksT0FBTyxtQkFBbUI7QUFFbkQsSUFBTSxjQUFjLE9BQU8sZ0JBQWdCO0FBdUozQyxJQUFNLFdBQVcsQ0FBQyxRQUNmLE9BQU8sUUFBUSxZQUFZLFFBQVEsUUFBUyxPQUFPLFFBQVE7QUFrQzlELElBQU0sdUJBQTZEO0VBQ2pFLFdBQVcsQ0FBQyxRQUNWLFNBQVMsR0FBRyxLQUFNLElBQW9CLFdBQVc7RUFDbkQsVUFBVSxLQUFH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
