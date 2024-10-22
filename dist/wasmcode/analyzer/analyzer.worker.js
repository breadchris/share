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
var getWasmUrl = (name) => `/dist/${name}@v1.wasm`;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NvbWxpbmsvc3JjL2NvbWxpbmsudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3dhc21fZXhlYy5qcyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vZGVidWcvdXRpbHMudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL2RlYnVnL21lbW9yeS50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vY29tbW9uLnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2xpYi9nby90eXBlcy9jb21tb24udHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL3NwZWMudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL2Jhc2ljL2Jvb2xlYW4udHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL2Jhc2ljL3VpbnQ2NC50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vdHlwZXMvYmFzaWMvZGF0YXZpZXcudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL2Jhc2ljL2luZGV4LnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2xpYi9nby90eXBlcy9jb21wbGV4L3N0cnVjdC50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vdHlwZXMvY29tcGxleC9hcnJheS50cyIsICIuLi8uLi8uLi93YXNtY29kZS9saWIvZ28vdHlwZXMvcmVmcy9zdHJpbmcudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3R5cGVzL3JlZnMvc2xpY2UudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvbGliL2dvL3BrZy9zeXNjYWxsL2pzL3ZhbHVlLnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2xpYi9nby9wa2cvc3lzY2FsbC9qcy9yZWYudHMiLCAiLi4vLi4vLi4vd2FzbWNvZGUvYW5hbHl6ZXIvYm9vdHN0cmFwLnRzIiwgIi4uLy4uLy4uL3dhc21jb2RlL2FuYWx5emVyL2FuYWx5emVyLndvcmtlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTkgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjBcbiAqL1xuXG5pbXBvcnQge1xuICBFbmRwb2ludCxcbiAgRXZlbnRTb3VyY2UsXG4gIE1lc3NhZ2UsXG4gIE1lc3NhZ2VUeXBlLFxuICBQb3N0TWVzc2FnZVdpdGhPcmlnaW4sXG4gIFdpcmVWYWx1ZSxcbiAgV2lyZVZhbHVlVHlwZSxcbn0gZnJvbSBcIi4vcHJvdG9jb2xcIjtcbmV4cG9ydCB0eXBlIHsgRW5kcG9pbnQgfTtcblxuZXhwb3J0IGNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKFwiQ29tbGluay5wcm94eVwiKTtcbmV4cG9ydCBjb25zdCBjcmVhdGVFbmRwb2ludCA9IFN5bWJvbChcIkNvbWxpbmsuZW5kcG9pbnRcIik7XG5leHBvcnQgY29uc3QgcmVsZWFzZVByb3h5ID0gU3ltYm9sKFwiQ29tbGluay5yZWxlYXNlUHJveHlcIik7XG5leHBvcnQgY29uc3QgZmluYWxpemVyID0gU3ltYm9sKFwiQ29tbGluay5maW5hbGl6ZXJcIik7XG5cbmNvbnN0IHRocm93TWFya2VyID0gU3ltYm9sKFwiQ29tbGluay50aHJvd25cIik7XG5cbi8qKlxuICogSW50ZXJmYWNlIG9mIHZhbHVlcyB0aGF0IHdlcmUgbWFya2VkIHRvIGJlIHByb3hpZWQgd2l0aCBgY29tbGluay5wcm94eSgpYC5cbiAqIENhbiBhbHNvIGJlIGltcGxlbWVudGVkIGJ5IGNsYXNzZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJveHlNYXJrZWQge1xuICBbcHJveHlNYXJrZXJdOiB0cnVlO1xufVxuXG4vKipcbiAqIFRha2VzIGEgdHlwZSBhbmQgd3JhcHMgaXQgaW4gYSBQcm9taXNlLCBpZiBpdCBub3QgYWxyZWFkeSBpcyBvbmUuXG4gKiBUaGlzIGlzIHRvIGF2b2lkIGBQcm9taXNlPFByb21pc2U8VD4+YC5cbiAqXG4gKiBUaGlzIGlzIHRoZSBpbnZlcnNlIG9mIGBVbnByb21pc2lmeTxUPmAuXG4gKi9cbnR5cGUgUHJvbWlzaWZ5PFQ+ID0gVCBleHRlbmRzIFByb21pc2U8dW5rbm93bj4gPyBUIDogUHJvbWlzZTxUPjtcbi8qKlxuICogVGFrZXMgYSB0eXBlIHRoYXQgbWF5IGJlIFByb21pc2UgYW5kIHVud3JhcHMgdGhlIFByb21pc2UgdHlwZS5cbiAqIElmIGBQYCBpcyBub3QgYSBQcm9taXNlLCBpdCByZXR1cm5zIGBQYC5cbiAqXG4gKiBUaGlzIGlzIHRoZSBpbnZlcnNlIG9mIGBQcm9taXNpZnk8VD5gLlxuICovXG50eXBlIFVucHJvbWlzaWZ5PFA+ID0gUCBleHRlbmRzIFByb21pc2U8aW5mZXIgVD4gPyBUIDogUDtcblxuLyoqXG4gKiBUYWtlcyB0aGUgcmF3IHR5cGUgb2YgYSByZW1vdGUgcHJvcGVydHkgYW5kIHJldHVybnMgdGhlIHR5cGUgdGhhdCBpcyB2aXNpYmxlIHRvIHRoZSBsb2NhbCB0aHJlYWQgb24gdGhlIHByb3h5LlxuICpcbiAqIE5vdGU6IFRoaXMgbmVlZHMgdG8gYmUgaXRzIG93biB0eXBlIGFsaWFzLCBvdGhlcndpc2UgaXQgd2lsbCBub3QgZGlzdHJpYnV0ZSBvdmVyIHVuaW9ucy5cbiAqIFNlZSBodHRwczovL3d3dy50eXBlc2NyaXB0bGFuZy5vcmcvZG9jcy9oYW5kYm9vay9hZHZhbmNlZC10eXBlcy5odG1sI2Rpc3RyaWJ1dGl2ZS1jb25kaXRpb25hbC10eXBlc1xuICovXG50eXBlIFJlbW90ZVByb3BlcnR5PFQ+ID1cbiAgLy8gSWYgdGhlIHZhbHVlIGlzIGEgbWV0aG9kLCBjb21saW5rIHdpbGwgcHJveHkgaXQgYXV0b21hdGljYWxseS5cbiAgLy8gT2JqZWN0cyBhcmUgb25seSBwcm94aWVkIGlmIHRoZXkgYXJlIG1hcmtlZCB0byBiZSBwcm94aWVkLlxuICAvLyBPdGhlcndpc2UsIHRoZSBwcm9wZXJ0eSBpcyBjb252ZXJ0ZWQgdG8gYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdGhlIGNsb25lZCB2YWx1ZS5cbiAgVCBleHRlbmRzIEZ1bmN0aW9uIHwgUHJveHlNYXJrZWQgPyBSZW1vdGU8VD4gOiBQcm9taXNpZnk8VD47XG5cbi8qKlxuICogVGFrZXMgdGhlIHJhdyB0eXBlIG9mIGEgcHJvcGVydHkgYXMgYSByZW1vdGUgdGhyZWFkIHdvdWxkIHNlZSBpdCB0aHJvdWdoIGEgcHJveHkgKGUuZy4gd2hlbiBwYXNzZWQgaW4gYXMgYSBmdW5jdGlvblxuICogYXJndW1lbnQpIGFuZCByZXR1cm5zIHRoZSB0eXBlIHRoYXQgdGhlIGxvY2FsIHRocmVhZCBoYXMgdG8gc3VwcGx5LlxuICpcbiAqIFRoaXMgaXMgdGhlIGludmVyc2Ugb2YgYFJlbW90ZVByb3BlcnR5PFQ+YC5cbiAqXG4gKiBOb3RlOiBUaGlzIG5lZWRzIHRvIGJlIGl0cyBvd24gdHlwZSBhbGlhcywgb3RoZXJ3aXNlIGl0IHdpbGwgbm90IGRpc3RyaWJ1dGUgb3ZlciB1bmlvbnMuIFNlZVxuICogaHR0cHM6Ly93d3cudHlwZXNjcmlwdGxhbmcub3JnL2RvY3MvaGFuZGJvb2svYWR2YW5jZWQtdHlwZXMuaHRtbCNkaXN0cmlidXRpdmUtY29uZGl0aW9uYWwtdHlwZXNcbiAqL1xudHlwZSBMb2NhbFByb3BlcnR5PFQ+ID0gVCBleHRlbmRzIEZ1bmN0aW9uIHwgUHJveHlNYXJrZWRcbiAgPyBMb2NhbDxUPlxuICA6IFVucHJvbWlzaWZ5PFQ+O1xuXG4vKipcbiAqIFByb3hpZXMgYFRgIGlmIGl0IGlzIGEgYFByb3h5TWFya2VkYCwgY2xvbmVzIGl0IG90aGVyd2lzZSAoYXMgaGFuZGxlZCBieSBzdHJ1Y3R1cmVkIGNsb25pbmcgYW5kIHRyYW5zZmVyIGhhbmRsZXJzKS5cbiAqL1xuZXhwb3J0IHR5cGUgUHJveHlPckNsb25lPFQ+ID0gVCBleHRlbmRzIFByb3h5TWFya2VkID8gUmVtb3RlPFQ+IDogVDtcbi8qKlxuICogSW52ZXJzZSBvZiBgUHJveHlPckNsb25lPFQ+YC5cbiAqL1xuZXhwb3J0IHR5cGUgVW5wcm94eU9yQ2xvbmU8VD4gPSBUIGV4dGVuZHMgUmVtb3RlT2JqZWN0PFByb3h5TWFya2VkPlxuICA/IExvY2FsPFQ+XG4gIDogVDtcblxuLyoqXG4gKiBUYWtlcyB0aGUgcmF3IHR5cGUgb2YgYSByZW1vdGUgb2JqZWN0IGluIHRoZSBvdGhlciB0aHJlYWQgYW5kIHJldHVybnMgdGhlIHR5cGUgYXMgaXQgaXMgdmlzaWJsZSB0byB0aGUgbG9jYWwgdGhyZWFkXG4gKiB3aGVuIHByb3hpZWQgd2l0aCBgQ29tbGluay5wcm94eSgpYC5cbiAqXG4gKiBUaGlzIGRvZXMgbm90IGhhbmRsZSBjYWxsIHNpZ25hdHVyZXMsIHdoaWNoIGlzIGhhbmRsZWQgYnkgdGhlIG1vcmUgZ2VuZXJhbCBgUmVtb3RlPFQ+YCB0eXBlLlxuICpcbiAqIEB0ZW1wbGF0ZSBUIFRoZSByYXcgdHlwZSBvZiBhIHJlbW90ZSBvYmplY3QgYXMgc2VlbiBpbiB0aGUgb3RoZXIgdGhyZWFkLlxuICovXG5leHBvcnQgdHlwZSBSZW1vdGVPYmplY3Q8VD4gPSB7IFtQIGluIGtleW9mIFRdOiBSZW1vdGVQcm9wZXJ0eTxUW1BdPiB9O1xuLyoqXG4gKiBUYWtlcyB0aGUgdHlwZSBvZiBhbiBvYmplY3QgYXMgYSByZW1vdGUgdGhyZWFkIHdvdWxkIHNlZSBpdCB0aHJvdWdoIGEgcHJveHkgKGUuZy4gd2hlbiBwYXNzZWQgaW4gYXMgYSBmdW5jdGlvblxuICogYXJndW1lbnQpIGFuZCByZXR1cm5zIHRoZSB0eXBlIHRoYXQgdGhlIGxvY2FsIHRocmVhZCBoYXMgdG8gc3VwcGx5LlxuICpcbiAqIFRoaXMgZG9lcyBub3QgaGFuZGxlIGNhbGwgc2lnbmF0dXJlcywgd2hpY2ggaXMgaGFuZGxlZCBieSB0aGUgbW9yZSBnZW5lcmFsIGBMb2NhbDxUPmAgdHlwZS5cbiAqXG4gKiBUaGlzIGlzIHRoZSBpbnZlcnNlIG9mIGBSZW1vdGVPYmplY3Q8VD5gLlxuICpcbiAqIEB0ZW1wbGF0ZSBUIFRoZSB0eXBlIG9mIGEgcHJveGllZCBvYmplY3QuXG4gKi9cbmV4cG9ydCB0eXBlIExvY2FsT2JqZWN0PFQ+ID0geyBbUCBpbiBrZXlvZiBUXTogTG9jYWxQcm9wZXJ0eTxUW1BdPiB9O1xuXG4vKipcbiAqIEFkZGl0aW9uYWwgc3BlY2lhbCBjb21saW5rIG1ldGhvZHMgYXZhaWxhYmxlIG9uIGVhY2ggcHJveHkgcmV0dXJuZWQgYnkgYENvbWxpbmsud3JhcCgpYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm94eU1ldGhvZHMge1xuICBbY3JlYXRlRW5kcG9pbnRdOiAoKSA9PiBQcm9taXNlPE1lc3NhZ2VQb3J0PjtcbiAgW3JlbGVhc2VQcm94eV06ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogVGFrZXMgdGhlIHJhdyB0eXBlIG9mIGEgcmVtb3RlIG9iamVjdCwgZnVuY3Rpb24gb3IgY2xhc3MgaW4gdGhlIG90aGVyIHRocmVhZCBhbmQgcmV0dXJucyB0aGUgdHlwZSBhcyBpdCBpcyB2aXNpYmxlIHRvXG4gKiB0aGUgbG9jYWwgdGhyZWFkIGZyb20gdGhlIHByb3h5IHJldHVybiB2YWx1ZSBvZiBgQ29tbGluay53cmFwKClgIG9yIGBDb21saW5rLnByb3h5KClgLlxuICovXG5leHBvcnQgdHlwZSBSZW1vdGU8VD4gPVxuICAvLyBIYW5kbGUgcHJvcGVydGllc1xuICBSZW1vdGVPYmplY3Q8VD4gJlxuICAgIC8vIEhhbmRsZSBjYWxsIHNpZ25hdHVyZSAoaWYgcHJlc2VudClcbiAgICAoVCBleHRlbmRzICguLi5hcmdzOiBpbmZlciBUQXJndW1lbnRzKSA9PiBpbmZlciBUUmV0dXJuXG4gICAgICA/IChcbiAgICAgICAgICAuLi5hcmdzOiB7IFtJIGluIGtleW9mIFRBcmd1bWVudHNdOiBVbnByb3h5T3JDbG9uZTxUQXJndW1lbnRzW0ldPiB9XG4gICAgICAgICkgPT4gUHJvbWlzaWZ5PFByb3h5T3JDbG9uZTxVbnByb21pc2lmeTxUUmV0dXJuPj4+XG4gICAgICA6IHVua25vd24pICZcbiAgICAvLyBIYW5kbGUgY29uc3RydWN0IHNpZ25hdHVyZSAoaWYgcHJlc2VudClcbiAgICAvLyBUaGUgcmV0dXJuIG9mIGNvbnN0cnVjdCBzaWduYXR1cmVzIGlzIGFsd2F5cyBwcm94aWVkICh3aGV0aGVyIG1hcmtlZCBvciBub3QpXG4gICAgKFQgZXh0ZW5kcyB7IG5ldyAoLi4uYXJnczogaW5mZXIgVEFyZ3VtZW50cyk6IGluZmVyIFRJbnN0YW5jZSB9XG4gICAgICA/IHtcbiAgICAgICAgICBuZXcgKFxuICAgICAgICAgICAgLi4uYXJnczoge1xuICAgICAgICAgICAgICBbSSBpbiBrZXlvZiBUQXJndW1lbnRzXTogVW5wcm94eU9yQ2xvbmU8VEFyZ3VtZW50c1tJXT47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTogUHJvbWlzaWZ5PFJlbW90ZTxUSW5zdGFuY2U+PjtcbiAgICAgICAgfVxuICAgICAgOiB1bmtub3duKSAmXG4gICAgLy8gSW5jbHVkZSBhZGRpdGlvbmFsIHNwZWNpYWwgY29tbGluayBtZXRob2RzIGF2YWlsYWJsZSBvbiB0aGUgcHJveHkuXG4gICAgUHJveHlNZXRob2RzO1xuXG4vKipcbiAqIEV4cHJlc3NlcyB0aGF0IGEgdHlwZSBjYW4gYmUgZWl0aGVyIGEgc3luYyBvciBhc3luYy5cbiAqL1xudHlwZSBNYXliZVByb21pc2U8VD4gPSBQcm9taXNlPFQ+IHwgVDtcblxuLyoqXG4gKiBUYWtlcyB0aGUgcmF3IHR5cGUgb2YgYSByZW1vdGUgb2JqZWN0LCBmdW5jdGlvbiBvciBjbGFzcyBhcyBhIHJlbW90ZSB0aHJlYWQgd291bGQgc2VlIGl0IHRocm91Z2ggYSBwcm94eSAoZS5nLiB3aGVuXG4gKiBwYXNzZWQgaW4gYXMgYSBmdW5jdGlvbiBhcmd1bWVudCkgYW5kIHJldHVybnMgdGhlIHR5cGUgdGhlIGxvY2FsIHRocmVhZCBoYXMgdG8gc3VwcGx5LlxuICpcbiAqIFRoaXMgaXMgdGhlIGludmVyc2Ugb2YgYFJlbW90ZTxUPmAuIEl0IHRha2VzIGEgYFJlbW90ZTxUPmAgYW5kIHJldHVybnMgaXRzIG9yaWdpbmFsIGlucHV0IGBUYC5cbiAqL1xuZXhwb3J0IHR5cGUgTG9jYWw8VD4gPVxuICAvLyBPbWl0IHRoZSBzcGVjaWFsIHByb3h5IG1ldGhvZHMgKHRoZXkgZG9uJ3QgbmVlZCB0byBiZSBzdXBwbGllZCwgY29tbGluayBhZGRzIHRoZW0pXG4gIE9taXQ8TG9jYWxPYmplY3Q8VD4sIGtleW9mIFByb3h5TWV0aG9kcz4gJlxuICAgIC8vIEhhbmRsZSBjYWxsIHNpZ25hdHVyZXMgKGlmIHByZXNlbnQpXG4gICAgKFQgZXh0ZW5kcyAoLi4uYXJnczogaW5mZXIgVEFyZ3VtZW50cykgPT4gaW5mZXIgVFJldHVyblxuICAgICAgPyAoXG4gICAgICAgICAgLi4uYXJnczogeyBbSSBpbiBrZXlvZiBUQXJndW1lbnRzXTogUHJveHlPckNsb25lPFRBcmd1bWVudHNbSV0+IH1cbiAgICAgICAgKSA9PiAvLyBUaGUgcmF3IGZ1bmN0aW9uIGNvdWxkIGVpdGhlciBiZSBzeW5jIG9yIGFzeW5jLCBidXQgaXMgYWx3YXlzIHByb3hpZWQgYXV0b21hdGljYWxseVxuICAgICAgICBNYXliZVByb21pc2U8VW5wcm94eU9yQ2xvbmU8VW5wcm9taXNpZnk8VFJldHVybj4+PlxuICAgICAgOiB1bmtub3duKSAmXG4gICAgLy8gSGFuZGxlIGNvbnN0cnVjdCBzaWduYXR1cmUgKGlmIHByZXNlbnQpXG4gICAgLy8gVGhlIHJldHVybiBvZiBjb25zdHJ1Y3Qgc2lnbmF0dXJlcyBpcyBhbHdheXMgcHJveGllZCAod2hldGhlciBtYXJrZWQgb3Igbm90KVxuICAgIChUIGV4dGVuZHMgeyBuZXcgKC4uLmFyZ3M6IGluZmVyIFRBcmd1bWVudHMpOiBpbmZlciBUSW5zdGFuY2UgfVxuICAgICAgPyB7XG4gICAgICAgICAgbmV3IChcbiAgICAgICAgICAgIC4uLmFyZ3M6IHtcbiAgICAgICAgICAgICAgW0kgaW4ga2V5b2YgVEFyZ3VtZW50c106IFByb3h5T3JDbG9uZTxUQXJndW1lbnRzW0ldPjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApOiAvLyBUaGUgcmF3IGNvbnN0cnVjdG9yIGNvdWxkIGVpdGhlciBiZSBzeW5jIG9yIGFzeW5jLCBidXQgaXMgYWx3YXlzIHByb3hpZWQgYXV0b21hdGljYWxseVxuICAgICAgICAgIE1heWJlUHJvbWlzZTxMb2NhbDxVbnByb21pc2lmeTxUSW5zdGFuY2U+Pj47XG4gICAgICAgIH1cbiAgICAgIDogdW5rbm93bik7XG5cbmNvbnN0IGlzT2JqZWN0ID0gKHZhbDogdW5rbm93bik6IHZhbCBpcyBvYmplY3QgPT5cbiAgKHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIgJiYgdmFsICE9PSBudWxsKSB8fCB0eXBlb2YgdmFsID09PSBcImZ1bmN0aW9uXCI7XG5cbi8qKlxuICogQ3VzdG9taXplcyB0aGUgc2VyaWFsaXphdGlvbiBvZiBjZXJ0YWluIHZhbHVlcyBhcyBkZXRlcm1pbmVkIGJ5IGBjYW5IYW5kbGUoKWAuXG4gKlxuICogQHRlbXBsYXRlIFQgVGhlIGlucHV0IHR5cGUgYmVpbmcgaGFuZGxlZCBieSB0aGlzIHRyYW5zZmVyIGhhbmRsZXIuXG4gKiBAdGVtcGxhdGUgUyBUaGUgc2VyaWFsaXplZCB0eXBlIHNlbnQgb3ZlciB0aGUgd2lyZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmFuc2ZlckhhbmRsZXI8VCwgUz4ge1xuICAvKipcbiAgICogR2V0cyBjYWxsZWQgZm9yIGV2ZXJ5IHZhbHVlIHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMgdHJhbnNmZXIgaGFuZGxlclxuICAgKiBzaG91bGQgc2VyaWFsaXplIHRoZSB2YWx1ZSwgd2hpY2ggaW5jbHVkZXMgY2hlY2tpbmcgdGhhdCBpdCBpcyBvZiB0aGUgcmlnaHRcbiAgICogdHlwZSAoYnV0IGNhbiBwZXJmb3JtIGNoZWNrcyBiZXlvbmQgdGhhdCBhcyB3ZWxsKS5cbiAgICovXG4gIGNhbkhhbmRsZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFQ7XG5cbiAgLyoqXG4gICAqIEdldHMgY2FsbGVkIHdpdGggdGhlIHZhbHVlIGlmIGBjYW5IYW5kbGUoKWAgcmV0dXJuZWQgYHRydWVgIHRvIHByb2R1Y2UgYVxuICAgKiB2YWx1ZSB0aGF0IGNhbiBiZSBzZW50IGluIGEgbWVzc2FnZSwgY29uc2lzdGluZyBvZiBzdHJ1Y3R1cmVkLWNsb25lYWJsZVxuICAgKiB2YWx1ZXMgYW5kL29yIHRyYW5zZmVycmFibGUgb2JqZWN0cy5cbiAgICovXG4gIHNlcmlhbGl6ZSh2YWx1ZTogVCk6IFtTLCBUcmFuc2ZlcmFibGVbXV07XG5cbiAgLyoqXG4gICAqIEdldHMgY2FsbGVkIHRvIGRlc2VyaWFsaXplIGFuIGluY29taW5nIHZhbHVlIHRoYXQgd2FzIHNlcmlhbGl6ZWQgaW4gdGhlXG4gICAqIG90aGVyIHRocmVhZCB3aXRoIHRoaXMgdHJhbnNmZXIgaGFuZGxlciAoa25vd24gdGhyb3VnaCB0aGUgbmFtZSBpdCB3YXNcbiAgICogcmVnaXN0ZXJlZCB1bmRlcikuXG4gICAqL1xuICBkZXNlcmlhbGl6ZSh2YWx1ZTogUyk6IFQ7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdHJhbnNmZXIgaGFuZGxlIHRvIGhhbmRsZSBvYmplY3RzIG1hcmtlZCB0byBwcm94eS5cbiAqL1xuY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXI6IFRyYW5zZmVySGFuZGxlcjxvYmplY3QsIE1lc3NhZ2VQb3J0PiA9IHtcbiAgY2FuSGFuZGxlOiAodmFsKTogdmFsIGlzIFByb3h5TWFya2VkID0+XG4gICAgaXNPYmplY3QodmFsKSAmJiAodmFsIGFzIFByb3h5TWFya2VkKVtwcm94eU1hcmtlcl0sXG4gIHNlcmlhbGl6ZShvYmopIHtcbiAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgZXhwb3NlKG9iaiwgcG9ydDEpO1xuICAgIHJldHVybiBbcG9ydDIsIFtwb3J0Ml1dO1xuICB9LFxuICBkZXNlcmlhbGl6ZShwb3J0KSB7XG4gICAgcG9ydC5zdGFydCgpO1xuICAgIHJldHVybiB3cmFwKHBvcnQpO1xuICB9LFxufTtcblxuaW50ZXJmYWNlIFRocm93blZhbHVlIHtcbiAgW3Rocm93TWFya2VyXTogdW5rbm93bjsgLy8ganVzdCBuZWVkcyB0byBiZSBwcmVzZW50XG4gIHZhbHVlOiB1bmtub3duO1xufVxudHlwZSBTZXJpYWxpemVkVGhyb3duVmFsdWUgPVxuICB8IHsgaXNFcnJvcjogdHJ1ZTsgdmFsdWU6IEVycm9yIH1cbiAgfCB7IGlzRXJyb3I6IGZhbHNlOyB2YWx1ZTogdW5rbm93biB9O1xuXG4vKipcbiAqIEludGVybmFsIHRyYW5zZmVyIGhhbmRsZXIgdG8gaGFuZGxlIHRocm93biBleGNlcHRpb25zLlxuICovXG5jb25zdCB0aHJvd1RyYW5zZmVySGFuZGxlcjogVHJhbnNmZXJIYW5kbGVyPFxuICBUaHJvd25WYWx1ZSxcbiAgU2VyaWFsaXplZFRocm93blZhbHVlXG4+ID0ge1xuICBjYW5IYW5kbGU6ICh2YWx1ZSk6IHZhbHVlIGlzIFRocm93blZhbHVlID0+XG4gICAgaXNPYmplY3QodmFsdWUpICYmIHRocm93TWFya2VyIGluIHZhbHVlLFxuICBzZXJpYWxpemUoeyB2YWx1ZSB9KSB7XG4gICAgbGV0IHNlcmlhbGl6ZWQ6IFNlcmlhbGl6ZWRUaHJvd25WYWx1ZTtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgc2VyaWFsaXplZCA9IHtcbiAgICAgICAgaXNFcnJvcjogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiB2YWx1ZS5tZXNzYWdlLFxuICAgICAgICAgIG5hbWU6IHZhbHVlLm5hbWUsXG4gICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07XG4gICAgfVxuICAgIHJldHVybiBbc2VyaWFsaXplZCwgW11dO1xuICB9LFxuICBkZXNlcmlhbGl6ZShzZXJpYWxpemVkKSB7XG4gICAgaWYgKHNlcmlhbGl6ZWQuaXNFcnJvcikge1xuICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgbmV3IEVycm9yKHNlcmlhbGl6ZWQudmFsdWUubWVzc2FnZSksXG4gICAgICAgIHNlcmlhbGl6ZWQudmFsdWVcbiAgICAgICk7XG4gICAgfVxuICAgIHRocm93IHNlcmlhbGl6ZWQudmFsdWU7XG4gIH0sXG59O1xuXG4vKipcbiAqIEFsbG93cyBjdXN0b21pemluZyB0aGUgc2VyaWFsaXphdGlvbiBvZiBjZXJ0YWluIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IHRyYW5zZmVySGFuZGxlcnMgPSBuZXcgTWFwPFxuICBzdHJpbmcsXG4gIFRyYW5zZmVySGFuZGxlcjx1bmtub3duLCB1bmtub3duPlxuPihbXG4gIFtcInByb3h5XCIsIHByb3h5VHJhbnNmZXJIYW5kbGVyXSxcbiAgW1widGhyb3dcIiwgdGhyb3dUcmFuc2ZlckhhbmRsZXJdLFxuXSk7XG5cbmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihcbiAgYWxsb3dlZE9yaWdpbnM6IChzdHJpbmcgfCBSZWdFeHApW10sXG4gIG9yaWdpbjogc3RyaW5nXG4pOiBib29sZWFuIHtcbiAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7XG4gICAgaWYgKG9yaWdpbiA9PT0gYWxsb3dlZE9yaWdpbiB8fCBhbGxvd2VkT3JpZ2luID09PSBcIipcIikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwb3NlKFxuICBvYmo6IGFueSxcbiAgZXA6IEVuZHBvaW50ID0gZ2xvYmFsVGhpcyBhcyBhbnksXG4gIGFsbG93ZWRPcmlnaW5zOiAoc3RyaW5nIHwgUmVnRXhwKVtdID0gW1wiKlwiXVxuKSB7XG4gIGVwLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2OiBNZXNzYWdlRXZlbnQpIHtcbiAgICBpZiAoIWV2IHx8ICFldi5kYXRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghaXNBbGxvd2VkT3JpZ2luKGFsbG93ZWRPcmlnaW5zLCBldi5vcmlnaW4pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgb3JpZ2luICcke2V2Lm9yaWdpbn0nIGZvciBjb21saW5rIHByb3h5YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHsgaWQsIHR5cGUsIHBhdGggfSA9IHtcbiAgICAgIHBhdGg6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgLi4uKGV2LmRhdGEgYXMgTWVzc2FnZSksXG4gICAgfTtcbiAgICBjb25zdCBhcmd1bWVudExpc3QgPSAoZXYuZGF0YS5hcmd1bWVudExpc3QgfHwgW10pLm1hcChmcm9tV2lyZVZhbHVlKTtcbiAgICBsZXQgcmV0dXJuVmFsdWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHBhdGguc2xpY2UoMCwgLTEpLnJlZHVjZSgob2JqLCBwcm9wKSA9PiBvYmpbcHJvcF0sIG9iaik7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHBhdGgucmVkdWNlKChvYmosIHByb3ApID0+IG9ialtwcm9wXSwgb2JqKTtcbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkdFVDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHJhd1ZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5TRVQ6XG4gICAgICAgICAge1xuICAgICAgICAgICAgcGFyZW50W3BhdGguc2xpY2UoLTEpWzBdXSA9IGZyb21XaXJlVmFsdWUoZXYuZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkFQUExZOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWUuYXBwbHkocGFyZW50LCBhcmd1bWVudExpc3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5DT05TVFJVQ1Q6XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBuZXcgcmF3VmFsdWUoLi4uYXJndW1lbnRMaXN0KTtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcHJveHkodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5FTkRQT0lOVDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgICAgICBleHBvc2Uob2JqLCBwb3J0Mik7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRyYW5zZmVyKHBvcnQxLCBbcG9ydDFdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUkVMRUFTRTpcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKHZhbHVlKSB7XG4gICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTtcbiAgICB9XG4gICAgUHJvbWlzZS5yZXNvbHZlKHJldHVyblZhbHVlKVxuICAgICAgLmNhdGNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICByZXR1cm4geyB2YWx1ZSwgW3Rocm93TWFya2VyXTogMCB9O1xuICAgICAgfSlcbiAgICAgIC50aGVuKChyZXR1cm5WYWx1ZSkgPT4ge1xuICAgICAgICBjb25zdCBbd2lyZVZhbHVlLCB0cmFuc2ZlcmFibGVzXSA9IHRvV2lyZVZhbHVlKHJldHVyblZhbHVlKTtcbiAgICAgICAgZXAucG9zdE1lc3NhZ2UoeyAuLi53aXJlVmFsdWUsIGlkIH0sIHRyYW5zZmVyYWJsZXMpO1xuICAgICAgICBpZiAodHlwZSA9PT0gTWVzc2FnZVR5cGUuUkVMRUFTRSkge1xuICAgICAgICAgIC8vIGRldGFjaCBhbmQgZGVhY3RpdmUgYWZ0ZXIgc2VuZGluZyByZWxlYXNlIHJlc3BvbnNlIGFib3ZlLlxuICAgICAgICAgIGVwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNhbGxiYWNrIGFzIGFueSk7XG4gICAgICAgICAgY2xvc2VFbmRQb2ludChlcCk7XG4gICAgICAgICAgaWYgKGZpbmFsaXplciBpbiBvYmogJiYgdHlwZW9mIG9ialtmaW5hbGl6ZXJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG9ialtmaW5hbGl6ZXJdKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAvLyBTZW5kIFNlcmlhbGl6YXRpb24gRXJyb3IgVG8gQ2FsbGVyXG4gICAgICAgIGNvbnN0IFt3aXJlVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUoe1xuICAgICAgICAgIHZhbHVlOiBuZXcgVHlwZUVycm9yKFwiVW5zZXJpYWxpemFibGUgcmV0dXJuIHZhbHVlXCIpLFxuICAgICAgICAgIFt0aHJvd01hcmtlcl06IDAsXG4gICAgICAgIH0pO1xuICAgICAgICBlcC5wb3N0TWVzc2FnZSh7IC4uLndpcmVWYWx1ZSwgaWQgfSwgdHJhbnNmZXJhYmxlcyk7XG4gICAgICB9KTtcbiAgfSBhcyBhbnkpO1xuICBpZiAoZXAuc3RhcnQpIHtcbiAgICBlcC5zdGFydCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQ6IEVuZHBvaW50KTogZW5kcG9pbnQgaXMgTWVzc2FnZVBvcnQge1xuICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gXCJNZXNzYWdlUG9ydFwiO1xufVxuXG5mdW5jdGlvbiBjbG9zZUVuZFBvaW50KGVuZHBvaW50OiBFbmRwb2ludCkge1xuICBpZiAoaXNNZXNzYWdlUG9ydChlbmRwb2ludCkpIGVuZHBvaW50LmNsb3NlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwPFQ+KGVwOiBFbmRwb2ludCwgdGFyZ2V0PzogYW55KTogUmVtb3RlPFQ+IHtcbiAgcmV0dXJuIGNyZWF0ZVByb3h5PFQ+KGVwLCBbXSwgdGFyZ2V0KSBhcyBhbnk7XG59XG5cbmZ1bmN0aW9uIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUmVsZWFzZWQ6IGJvb2xlYW4pIHtcbiAgaWYgKGlzUmVsZWFzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm94eSBoYXMgYmVlbiByZWxlYXNlZCBhbmQgaXMgbm90IHVzZWFibGVcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVsZWFzZUVuZHBvaW50KGVwOiBFbmRwb2ludCkge1xuICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwge1xuICAgIHR5cGU6IE1lc3NhZ2VUeXBlLlJFTEVBU0UsXG4gIH0pLnRoZW4oKCkgPT4ge1xuICAgIGNsb3NlRW5kUG9pbnQoZXApO1xuICB9KTtcbn1cblxuaW50ZXJmYWNlIEZpbmFsaXphdGlvblJlZ2lzdHJ5PFQ+IHtcbiAgbmV3IChjYjogKGhlbGRWYWx1ZTogVCkgPT4gdm9pZCk6IEZpbmFsaXphdGlvblJlZ2lzdHJ5PFQ+O1xuICByZWdpc3RlcihcbiAgICB3ZWFrSXRlbTogb2JqZWN0LFxuICAgIGhlbGRWYWx1ZTogVCxcbiAgICB1bnJlZ2lzdGVyVG9rZW4/OiBvYmplY3QgfCB1bmRlZmluZWRcbiAgKTogdm9pZDtcbiAgdW5yZWdpc3Rlcih1bnJlZ2lzdGVyVG9rZW46IG9iamVjdCk6IHZvaWQ7XG59XG5kZWNsYXJlIHZhciBGaW5hbGl6YXRpb25SZWdpc3RyeTogRmluYWxpemF0aW9uUmVnaXN0cnk8RW5kcG9pbnQ+O1xuXG5jb25zdCBwcm94eUNvdW50ZXIgPSBuZXcgV2Vha01hcDxFbmRwb2ludCwgbnVtYmVyPigpO1xuY29uc3QgcHJveHlGaW5hbGl6ZXJzID1cbiAgXCJGaW5hbGl6YXRpb25SZWdpc3RyeVwiIGluIGdsb2JhbFRoaXMgJiZcbiAgbmV3IEZpbmFsaXphdGlvblJlZ2lzdHJ5KChlcDogRW5kcG9pbnQpID0+IHtcbiAgICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7XG4gICAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpO1xuICAgIGlmIChuZXdDb3VudCA9PT0gMCkge1xuICAgICAgcmVsZWFzZUVuZHBvaW50KGVwKTtcbiAgICB9XG4gIH0pO1xuXG5mdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5OiBvYmplY3QsIGVwOiBFbmRwb2ludCkge1xuICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSArIDE7XG4gIHByb3h5Q291bnRlci5zZXQoZXAsIG5ld0NvdW50KTtcbiAgaWYgKHByb3h5RmluYWxpemVycykge1xuICAgIHByb3h5RmluYWxpemVycy5yZWdpc3Rlcihwcm94eSwgZXAsIHByb3h5KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1bnJlZ2lzdGVyUHJveHkocHJveHk6IG9iamVjdCkge1xuICBpZiAocHJveHlGaW5hbGl6ZXJzKSB7XG4gICAgcHJveHlGaW5hbGl6ZXJzLnVucmVnaXN0ZXIocHJveHkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb3h5PFQ+KFxuICBlcDogRW5kcG9pbnQsXG4gIHBhdGg6IChzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2wpW10gPSBbXSxcbiAgdGFyZ2V0OiBvYmplY3QgPSBmdW5jdGlvbiAoKSB7fVxuKTogUmVtb3RlPFQ+IHtcbiAgbGV0IGlzUHJveHlSZWxlYXNlZCA9IGZhbHNlO1xuICBjb25zdCBwcm94eSA9IG5ldyBQcm94eSh0YXJnZXQsIHtcbiAgICBnZXQoX3RhcmdldCwgcHJvcCkge1xuICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgIGlmIChwcm9wID09PSByZWxlYXNlUHJveHkpIHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkpO1xuICAgICAgICAgIHJlbGVhc2VFbmRwb2ludChlcCk7XG4gICAgICAgICAgaXNQcm94eVJlbGVhc2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChwcm9wID09PSBcInRoZW5cIikge1xuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4geyB0aGVuOiAoKSA9PiBwcm94eSB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHIgPSByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCB7XG4gICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuR0VULFxuICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxuICAgICAgICB9KS50aGVuKGZyb21XaXJlVmFsdWUpO1xuICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlUHJveHkoZXAsIFsuLi5wYXRoLCBwcm9wXSk7XG4gICAgfSxcbiAgICBzZXQoX3RhcmdldCwgcHJvcCwgcmF3VmFsdWUpIHtcbiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7XG4gICAgICAvLyBGSVhNRTogRVM2IFByb3h5IEhhbmRsZXIgYHNldGAgbWV0aG9kcyBhcmUgc3VwcG9zZWQgdG8gcmV0dXJuIGFcbiAgICAgIC8vIGJvb2xlYW4uIFRvIHNob3cgZ29vZCB3aWxsLCB3ZSByZXR1cm4gdHJ1ZSBhc3luY2hyb25vdXNseSBcdTAwQUZcXF8oXHUzMEM0KV8vXHUwMEFGXG4gICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpO1xuICAgICAgcmV0dXJuIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoXG4gICAgICAgIGVwLFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogTWVzc2FnZVR5cGUuU0VULFxuICAgICAgICAgIHBhdGg6IFsuLi5wYXRoLCBwcm9wXS5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZmVyYWJsZXNcbiAgICAgICkudGhlbihmcm9tV2lyZVZhbHVlKSBhcyBhbnk7XG4gICAgfSxcbiAgICBhcHBseShfdGFyZ2V0LCBfdGhpc0FyZywgcmF3QXJndW1lbnRMaXN0KSB7XG4gICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpO1xuICAgICAgY29uc3QgbGFzdCA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgICAgIGlmICgobGFzdCBhcyBhbnkpID09PSBjcmVhdGVFbmRwb2ludCkge1xuICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwge1xuICAgICAgICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkVORFBPSU5ULFxuICAgICAgICB9KS50aGVuKGZyb21XaXJlVmFsdWUpO1xuICAgICAgfVxuICAgICAgLy8gV2UganVzdCBwcmV0ZW5kIHRoYXQgYGJpbmQoKWAgZGlkblx1MjAxOXQgaGFwcGVuLlxuICAgICAgaWYgKGxhc3QgPT09IFwiYmluZFwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGF0aC5zbGljZSgwLCAtMSkpO1xuICAgICAgfVxuICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7XG4gICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShcbiAgICAgICAgZXAsXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiBNZXNzYWdlVHlwZS5BUFBMWSxcbiAgICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcbiAgICAgICAgICBhcmd1bWVudExpc3QsXG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZmVyYWJsZXNcbiAgICAgICkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICB9LFxuICAgIGNvbnN0cnVjdChfdGFyZ2V0LCByYXdBcmd1bWVudExpc3QpIHtcbiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7XG4gICAgICBjb25zdCBbYXJndW1lbnRMaXN0LCB0cmFuc2ZlcmFibGVzXSA9IHByb2Nlc3NBcmd1bWVudHMocmF3QXJndW1lbnRMaXN0KTtcbiAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKFxuICAgICAgICBlcCxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNPTlNUUlVDVCxcbiAgICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcbiAgICAgICAgICBhcmd1bWVudExpc3QsXG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZmVyYWJsZXNcbiAgICAgICkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICB9LFxuICB9KTtcbiAgcmVnaXN0ZXJQcm94eShwcm94eSwgZXApO1xuICByZXR1cm4gcHJveHkgYXMgYW55O1xufVxuXG5mdW5jdGlvbiBteUZsYXQ8VD4oYXJyOiAoVCB8IFRbXSlbXSk6IFRbXSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBhcnIpO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzQXJndW1lbnRzKGFyZ3VtZW50TGlzdDogYW55W10pOiBbV2lyZVZhbHVlW10sIFRyYW5zZmVyYWJsZVtdXSB7XG4gIGNvbnN0IHByb2Nlc3NlZCA9IGFyZ3VtZW50TGlzdC5tYXAodG9XaXJlVmFsdWUpO1xuICByZXR1cm4gW3Byb2Nlc3NlZC5tYXAoKHYpID0+IHZbMF0pLCBteUZsYXQocHJvY2Vzc2VkLm1hcCgodikgPT4gdlsxXSkpXTtcbn1cblxuY29uc3QgdHJhbnNmZXJDYWNoZSA9IG5ldyBXZWFrTWFwPGFueSwgVHJhbnNmZXJhYmxlW10+KCk7XG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmZXI8VD4ob2JqOiBULCB0cmFuc2ZlcnM6IFRyYW5zZmVyYWJsZVtdKTogVCB7XG4gIHRyYW5zZmVyQ2FjaGUuc2V0KG9iaiwgdHJhbnNmZXJzKTtcbiAgcmV0dXJuIG9iajtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3h5PFQgZXh0ZW5kcyB7fT4ob2JqOiBUKTogVCAmIFByb3h5TWFya2VkIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24ob2JqLCB7IFtwcm94eU1hcmtlcl06IHRydWUgfSkgYXMgYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2luZG93RW5kcG9pbnQoXG4gIHc6IFBvc3RNZXNzYWdlV2l0aE9yaWdpbixcbiAgY29udGV4dDogRXZlbnRTb3VyY2UgPSBnbG9iYWxUaGlzLFxuICB0YXJnZXRPcmlnaW4gPSBcIipcIlxuKTogRW5kcG9pbnQge1xuICByZXR1cm4ge1xuICAgIHBvc3RNZXNzYWdlOiAobXNnOiBhbnksIHRyYW5zZmVyYWJsZXM6IFRyYW5zZmVyYWJsZVtdKSA9PlxuICAgICAgdy5wb3N0TWVzc2FnZShtc2csIHRhcmdldE9yaWdpbiwgdHJhbnNmZXJhYmxlcyksXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogY29udGV4dC5hZGRFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogY29udGV4dC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHRvV2lyZVZhbHVlKHZhbHVlOiBhbnkpOiBbV2lyZVZhbHVlLCBUcmFuc2ZlcmFibGVbXV0ge1xuICBmb3IgKGNvbnN0IFtuYW1lLCBoYW5kbGVyXSBvZiB0cmFuc2ZlckhhbmRsZXJzKSB7XG4gICAgaWYgKGhhbmRsZXIuY2FuSGFuZGxlKHZhbHVlKSkge1xuICAgICAgY29uc3QgW3NlcmlhbGl6ZWRWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSBoYW5kbGVyLnNlcmlhbGl6ZSh2YWx1ZSk7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogV2lyZVZhbHVlVHlwZS5IQU5ETEVSLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgdmFsdWU6IHNlcmlhbGl6ZWRWYWx1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdHJhbnNmZXJhYmxlcyxcbiAgICAgIF07XG4gICAgfVxuICB9XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgdHlwZTogV2lyZVZhbHVlVHlwZS5SQVcsXG4gICAgICB2YWx1ZSxcbiAgICB9LFxuICAgIHRyYW5zZmVyQ2FjaGUuZ2V0KHZhbHVlKSB8fCBbXSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gZnJvbVdpcmVWYWx1ZSh2YWx1ZTogV2lyZVZhbHVlKTogYW55IHtcbiAgc3dpdGNoICh2YWx1ZS50eXBlKSB7XG4gICAgY2FzZSBXaXJlVmFsdWVUeXBlLkhBTkRMRVI6XG4gICAgICByZXR1cm4gdHJhbnNmZXJIYW5kbGVycy5nZXQodmFsdWUubmFtZSkhLmRlc2VyaWFsaXplKHZhbHVlLnZhbHVlKTtcbiAgICBjYXNlIFdpcmVWYWx1ZVR5cGUuUkFXOlxuICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoXG4gIGVwOiBFbmRwb2ludCxcbiAgbXNnOiBNZXNzYWdlLFxuICB0cmFuc2ZlcnM/OiBUcmFuc2ZlcmFibGVbXVxuKTogUHJvbWlzZTxXaXJlVmFsdWU+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY29uc3QgaWQgPSBnZW5lcmF0ZVVVSUQoKTtcbiAgICBlcC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBmdW5jdGlvbiBsKGV2OiBNZXNzYWdlRXZlbnQpIHtcbiAgICAgIGlmICghZXYuZGF0YSB8fCAhZXYuZGF0YS5pZCB8fCBldi5kYXRhLmlkICE9PSBpZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlcC5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBsIGFzIGFueSk7XG4gICAgICByZXNvbHZlKGV2LmRhdGEpO1xuICAgIH0gYXMgYW55KTtcbiAgICBpZiAoZXAuc3RhcnQpIHtcbiAgICAgIGVwLnN0YXJ0KCk7XG4gICAgfVxuICAgIGVwLnBvc3RNZXNzYWdlKHsgaWQsIC4uLm1zZyB9LCB0cmFuc2ZlcnMpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCk6IHN0cmluZyB7XG4gIHJldHVybiBuZXcgQXJyYXkoNClcbiAgICAuZmlsbCgwKVxuICAgIC5tYXAoKCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpLnRvU3RyaW5nKDE2KSlcbiAgICAuam9pbihcIi1cIik7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTggVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZVxuLy8gbGljZW5zZSB0aGF0IGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuXG5cInVzZSBzdHJpY3RcIjtcblxuKCgpID0+IHtcblx0Y29uc3QgZW5vc3lzID0gKCkgPT4ge1xuXHRcdGNvbnN0IGVyciA9IG5ldyBFcnJvcihcIm5vdCBpbXBsZW1lbnRlZFwiKTtcblx0XHRlcnIuY29kZSA9IFwiRU5PU1lTXCI7XG5cdFx0cmV0dXJuIGVycjtcblx0fTtcblxuXHRpZiAoIWdsb2JhbFRoaXMuZnMpIHtcblx0XHRsZXQgb3V0cHV0QnVmID0gXCJcIjtcblx0XHRnbG9iYWxUaGlzLmZzID0ge1xuXHRcdFx0Y29uc3RhbnRzOiB7IE9fV1JPTkxZOiAtMSwgT19SRFdSOiAtMSwgT19DUkVBVDogLTEsIE9fVFJVTkM6IC0xLCBPX0FQUEVORDogLTEsIE9fRVhDTDogLTEgfSwgLy8gdW51c2VkXG5cdFx0XHR3cml0ZVN5bmMoZmQsIGJ1Zikge1xuXHRcdFx0XHRvdXRwdXRCdWYgKz0gZGVjb2Rlci5kZWNvZGUoYnVmKTtcblx0XHRcdFx0Y29uc3QgbmwgPSBvdXRwdXRCdWYubGFzdEluZGV4T2YoXCJcXG5cIik7XG5cdFx0XHRcdGlmIChubCAhPSAtMSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKG91dHB1dEJ1Zi5zdWJzdHJpbmcoMCwgbmwpKTtcblx0XHRcdFx0XHRvdXRwdXRCdWYgPSBvdXRwdXRCdWYuc3Vic3RyaW5nKG5sICsgMSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGJ1Zi5sZW5ndGg7XG5cdFx0XHR9LFxuXHRcdFx0d3JpdGUoZmQsIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFjaykge1xuXHRcdFx0XHRpZiAob2Zmc2V0ICE9PSAwIHx8IGxlbmd0aCAhPT0gYnVmLmxlbmd0aCB8fCBwb3NpdGlvbiAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdGNhbGxiYWNrKGVub3N5cygpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgbiA9IHRoaXMud3JpdGVTeW5jKGZkLCBidWYpO1xuXHRcdFx0XHRjYWxsYmFjayhudWxsLCBuKTtcblx0XHRcdH0sXG5cdFx0XHRjaG1vZChwYXRoLCBtb2RlLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRjaG93bihwYXRoLCB1aWQsIGdpZCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0Y2xvc2UoZmQsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdGZjaG1vZChmZCwgbW9kZSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0ZmNob3duKGZkLCB1aWQsIGdpZCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0ZnN0YXQoZmQsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdGZzeW5jKGZkLCBjYWxsYmFjaykgeyBjYWxsYmFjayhudWxsKTsgfSxcblx0XHRcdGZ0cnVuY2F0ZShmZCwgbGVuZ3RoLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRsY2hvd24ocGF0aCwgdWlkLCBnaWQsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdGxpbmsocGF0aCwgbGluaywgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0bHN0YXQocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0bWtkaXIocGF0aCwgcGVybSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0b3BlbihwYXRoLCBmbGFncywgbW9kZSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0cmVhZChmZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdHJlYWRkaXIocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0cmVhZGxpbmsocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0cmVuYW1lKGZyb20sIHRvLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRybWRpcihwYXRoLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHRzdGF0KHBhdGgsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKGVub3N5cygpKTsgfSxcblx0XHRcdHN5bWxpbmsocGF0aCwgbGluaywgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0dHJ1bmNhdGUocGF0aCwgbGVuZ3RoLCBjYWxsYmFjaykgeyBjYWxsYmFjayhlbm9zeXMoKSk7IH0sXG5cdFx0XHR1bmxpbmsocGF0aCwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdFx0dXRpbWVzKHBhdGgsIGF0aW1lLCBtdGltZSwgY2FsbGJhY2spIHsgY2FsbGJhY2soZW5vc3lzKCkpOyB9LFxuXHRcdH07XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMucHJvY2Vzcykge1xuXHRcdGdsb2JhbFRoaXMucHJvY2VzcyA9IHtcblx0XHRcdGdldHVpZCgpIHsgcmV0dXJuIC0xOyB9LFxuXHRcdFx0Z2V0Z2lkKCkgeyByZXR1cm4gLTE7IH0sXG5cdFx0XHRnZXRldWlkKCkgeyByZXR1cm4gLTE7IH0sXG5cdFx0XHRnZXRlZ2lkKCkgeyByZXR1cm4gLTE7IH0sXG5cdFx0XHRnZXRncm91cHMoKSB7IHRocm93IGVub3N5cygpOyB9LFxuXHRcdFx0cGlkOiAtMSxcblx0XHRcdHBwaWQ6IC0xLFxuXHRcdFx0dW1hc2soKSB7IHRocm93IGVub3N5cygpOyB9LFxuXHRcdFx0Y3dkKCkgeyB0aHJvdyBlbm9zeXMoKTsgfSxcblx0XHRcdGNoZGlyKCkgeyB0aHJvdyBlbm9zeXMoKTsgfSxcblx0XHR9XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMuY3J5cHRvKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiZ2xvYmFsVGhpcy5jcnlwdG8gaXMgbm90IGF2YWlsYWJsZSwgcG9seWZpbGwgcmVxdWlyZWQgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMgb25seSlcIik7XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMucGVyZm9ybWFuY2UpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJnbG9iYWxUaGlzLnBlcmZvcm1hbmNlIGlzIG5vdCBhdmFpbGFibGUsIHBvbHlmaWxsIHJlcXVpcmVkIChwZXJmb3JtYW5jZS5ub3cgb25seSlcIik7XG5cdH1cblxuXHRpZiAoIWdsb2JhbFRoaXMuVGV4dEVuY29kZXIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJnbG9iYWxUaGlzLlRleHRFbmNvZGVyIGlzIG5vdCBhdmFpbGFibGUsIHBvbHlmaWxsIHJlcXVpcmVkXCIpO1xuXHR9XG5cblx0aWYgKCFnbG9iYWxUaGlzLlRleHREZWNvZGVyKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiZ2xvYmFsVGhpcy5UZXh0RGVjb2RlciBpcyBub3QgYXZhaWxhYmxlLCBwb2x5ZmlsbCByZXF1aXJlZFwiKTtcblx0fVxuXG5cdGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoXCJ1dGYtOFwiKTtcblx0Y29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcihcInV0Zi04XCIpO1xuXG5cdGdsb2JhbFRoaXMuR28gPSBjbGFzcyB7XG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHR0aGlzLmFyZ3YgPSBbXCJqc1wiXTtcblx0XHRcdHRoaXMuZW52ID0ge307XG5cdFx0XHR0aGlzLmV4aXQgPSAoY29kZSkgPT4ge1xuXHRcdFx0XHRpZiAoY29kZSAhPT0gMCkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihcImV4aXQgY29kZTpcIiwgY29kZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHR0aGlzLl9leGl0UHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRcdHRoaXMuX3Jlc29sdmVFeGl0UHJvbWlzZSA9IHJlc29sdmU7XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuX3BlbmRpbmdFdmVudCA9IG51bGw7XG5cdFx0XHR0aGlzLl9zY2hlZHVsZWRUaW1lb3V0cyA9IG5ldyBNYXAoKTtcblx0XHRcdHRoaXMuX25leHRDYWxsYmFja1RpbWVvdXRJRCA9IDE7XG5cblx0XHRcdGNvbnN0IHNldEludDY0ID0gKGFkZHIsIHYpID0+IHtcblx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDMyKGFkZHIgKyAwLCB2LCB0cnVlKTtcblx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDMyKGFkZHIgKyA0LCBNYXRoLmZsb29yKHYgLyA0Mjk0OTY3Mjk2KSwgdHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNldEludDMyID0gKGFkZHIsIHYpID0+IHtcblx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDMyKGFkZHIgKyAwLCB2LCB0cnVlKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZ2V0SW50NjQgPSAoYWRkcikgPT4ge1xuXHRcdFx0XHRjb25zdCBsb3cgPSB0aGlzLm1lbS5nZXRVaW50MzIoYWRkciArIDAsIHRydWUpO1xuXHRcdFx0XHRjb25zdCBoaWdoID0gdGhpcy5tZW0uZ2V0SW50MzIoYWRkciArIDQsIHRydWUpO1xuXHRcdFx0XHRyZXR1cm4gbG93ICsgaGlnaCAqIDQyOTQ5NjcyOTY7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGxvYWRWYWx1ZSA9IChhZGRyKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGYgPSB0aGlzLm1lbS5nZXRGbG9hdDY0KGFkZHIsIHRydWUpO1xuXHRcdFx0XHRpZiAoZiA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFpc05hTihmKSkge1xuXHRcdFx0XHRcdHJldHVybiBmO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLm1lbS5nZXRVaW50MzIoYWRkciwgdHJ1ZSk7XG5cdFx0XHRcdHJldHVybiB0aGlzLl92YWx1ZXNbaWRdO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdG9yZVZhbHVlID0gKGFkZHIsIHYpID0+IHtcblx0XHRcdFx0Y29uc3QgbmFuSGVhZCA9IDB4N0ZGODAwMDA7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiICYmIHYgIT09IDApIHtcblx0XHRcdFx0XHRpZiAoaXNOYU4odikpIHtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihhZGRyICsgNCwgbmFuSGVhZCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50MzIoYWRkciwgMCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMubWVtLnNldEZsb2F0NjQoYWRkciwgdiwgdHJ1ZSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHYgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHRoaXMubWVtLnNldEZsb2F0NjQoYWRkciwgMCwgdHJ1ZSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGlkID0gdGhpcy5faWRzLmdldCh2KTtcblx0XHRcdFx0aWYgKGlkID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRpZCA9IHRoaXMuX2lkUG9vbC5wb3AoKTtcblx0XHRcdFx0XHRpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0aWQgPSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLl92YWx1ZXNbaWRdID0gdjtcblx0XHRcdFx0XHR0aGlzLl9nb1JlZkNvdW50c1tpZF0gPSAwO1xuXHRcdFx0XHRcdHRoaXMuX2lkcy5zZXQodiwgaWQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuX2dvUmVmQ291bnRzW2lkXSsrO1xuXHRcdFx0XHRsZXQgdHlwZUZsYWcgPSAwO1xuXHRcdFx0XHRzd2l0Y2ggKHR5cGVvZiB2KSB7XG5cdFx0XHRcdFx0Y2FzZSBcIm9iamVjdFwiOlxuXHRcdFx0XHRcdFx0aWYgKHYgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0dHlwZUZsYWcgPSAxO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdFx0XHRcdFx0dHlwZUZsYWcgPSAyO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBcInN5bWJvbFwiOlxuXHRcdFx0XHRcdFx0dHlwZUZsYWcgPSAzO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XG5cdFx0XHRcdFx0XHR0eXBlRmxhZyA9IDQ7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50MzIoYWRkciArIDQsIG5hbkhlYWQgfCB0eXBlRmxhZywgdHJ1ZSk7XG5cdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihhZGRyLCBpZCwgdHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGxvYWRTbGljZSA9IChhZGRyKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGFycmF5ID0gZ2V0SW50NjQoYWRkciArIDApO1xuXHRcdFx0XHRjb25zdCBsZW4gPSBnZXRJbnQ2NChhZGRyICsgOCk7XG5cdFx0XHRcdHJldHVybiBuZXcgVWludDhBcnJheSh0aGlzLl9pbnN0LmV4cG9ydHMubWVtLmJ1ZmZlciwgYXJyYXksIGxlbik7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGxvYWRTbGljZU9mVmFsdWVzID0gKGFkZHIpID0+IHtcblx0XHRcdFx0Y29uc3QgYXJyYXkgPSBnZXRJbnQ2NChhZGRyICsgMCk7XG5cdFx0XHRcdGNvbnN0IGxlbiA9IGdldEludDY0KGFkZHIgKyA4KTtcblx0XHRcdFx0Y29uc3QgYSA9IG5ldyBBcnJheShsZW4pO1xuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0YVtpXSA9IGxvYWRWYWx1ZShhcnJheSArIGkgKiA4KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gYTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbG9hZFN0cmluZyA9IChhZGRyKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHNhZGRyID0gZ2V0SW50NjQoYWRkciArIDApO1xuXHRcdFx0XHRjb25zdCBsZW4gPSBnZXRJbnQ2NChhZGRyICsgOCk7XG5cdFx0XHRcdHJldHVybiBkZWNvZGVyLmRlY29kZShuZXcgRGF0YVZpZXcodGhpcy5faW5zdC5leHBvcnRzLm1lbS5idWZmZXIsIHNhZGRyLCBsZW4pKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdGltZU9yaWdpbiA9IERhdGUubm93KCkgLSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHRcdHRoaXMuaW1wb3J0T2JqZWN0ID0ge1xuXHRcdFx0XHRfZ290ZXN0OiB7XG5cdFx0XHRcdFx0YWRkOiAoYSwgYikgPT4gYSArIGIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGdvanM6IHtcblx0XHRcdFx0XHQvLyBHbydzIFNQIGRvZXMgbm90IGNoYW5nZSBhcyBsb25nIGFzIG5vIEdvIGNvZGUgaXMgcnVubmluZy4gU29tZSBvcGVyYXRpb25zIChlLmcuIGNhbGxzLCBnZXR0ZXJzIGFuZCBzZXR0ZXJzKVxuXHRcdFx0XHRcdC8vIG1heSBzeW5jaHJvbm91c2x5IHRyaWdnZXIgYSBHbyBldmVudCBoYW5kbGVyLiBUaGlzIG1ha2VzIEdvIGNvZGUgZ2V0IGV4ZWN1dGVkIGluIHRoZSBtaWRkbGUgb2YgdGhlIGltcG9ydGVkXG5cdFx0XHRcdFx0Ly8gZnVuY3Rpb24uIEEgZ29yb3V0aW5lIGNhbiBzd2l0Y2ggdG8gYSBuZXcgc3RhY2sgaWYgdGhlIGN1cnJlbnQgc3RhY2sgaXMgdG9vIHNtYWxsIChzZWUgbW9yZXN0YWNrIGZ1bmN0aW9uKS5cblx0XHRcdFx0XHQvLyBUaGlzIGNoYW5nZXMgdGhlIFNQLCB0aHVzIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBTUCB1c2VkIGJ5IHRoZSBpbXBvcnRlZCBmdW5jdGlvbi5cblxuXHRcdFx0XHRcdC8vIGZ1bmMgd2FzbUV4aXQoY29kZSBpbnQzMilcblx0XHRcdFx0XHRcInJ1bnRpbWUud2FzbUV4aXRcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBjb2RlID0gdGhpcy5tZW0uZ2V0SW50MzIoc3AgKyA4LCB0cnVlKTtcblx0XHRcdFx0XHRcdHRoaXMuZXhpdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9pbnN0O1xuXHRcdFx0XHRcdFx0ZGVsZXRlIHRoaXMuX3ZhbHVlcztcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9nb1JlZkNvdW50cztcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9pZHM7XG5cdFx0XHRcdFx0XHRkZWxldGUgdGhpcy5faWRQb29sO1xuXHRcdFx0XHRcdFx0dGhpcy5leGl0KGNvZGUpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHdhc21Xcml0ZShmZCB1aW50cHRyLCBwIHVuc2FmZS5Qb2ludGVyLCBuIGludDMyKVxuXHRcdFx0XHRcdFwicnVudGltZS53YXNtV3JpdGVcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBmZCA9IGdldEludDY0KHNwICsgOCk7XG5cdFx0XHRcdFx0XHRjb25zdCBwID0gZ2V0SW50NjQoc3AgKyAxNik7XG5cdFx0XHRcdFx0XHRjb25zdCBuID0gdGhpcy5tZW0uZ2V0SW50MzIoc3AgKyAyNCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRmcy53cml0ZVN5bmMoZmQsIG5ldyBVaW50OEFycmF5KHRoaXMuX2luc3QuZXhwb3J0cy5tZW0uYnVmZmVyLCBwLCBuKSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgcmVzZXRNZW1vcnlEYXRhVmlldygpXG5cdFx0XHRcdFx0XCJydW50aW1lLnJlc2V0TWVtb3J5RGF0YVZpZXdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbSA9IG5ldyBEYXRhVmlldyh0aGlzLl9pbnN0LmV4cG9ydHMubWVtLmJ1ZmZlcik7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgbmFub3RpbWUxKCkgaW50NjRcblx0XHRcdFx0XHRcInJ1bnRpbWUubmFub3RpbWUxXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0c2V0SW50NjQoc3AgKyA4LCAodGltZU9yaWdpbiArIHBlcmZvcm1hbmNlLm5vdygpKSAqIDEwMDAwMDApO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHdhbGx0aW1lKCkgKHNlYyBpbnQ2NCwgbnNlYyBpbnQzMilcblx0XHRcdFx0XHRcInJ1bnRpbWUud2FsbHRpbWVcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBtc2VjID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG5cdFx0XHRcdFx0XHRzZXRJbnQ2NChzcCArIDgsIG1zZWMgLyAxMDAwKTtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldEludDMyKHNwICsgMTYsIChtc2VjICUgMTAwMCkgKiAxMDAwMDAwLCB0cnVlKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBzY2hlZHVsZVRpbWVvdXRFdmVudChkZWxheSBpbnQ2NCkgaW50MzJcblx0XHRcdFx0XHRcInJ1bnRpbWUuc2NoZWR1bGVUaW1lb3V0RXZlbnRcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBpZCA9IHRoaXMuX25leHRDYWxsYmFja1RpbWVvdXRJRDtcblx0XHRcdFx0XHRcdHRoaXMuX25leHRDYWxsYmFja1RpbWVvdXRJRCsrO1xuXHRcdFx0XHRcdFx0dGhpcy5fc2NoZWR1bGVkVGltZW91dHMuc2V0KGlkLCBzZXRUaW1lb3V0KFxuXHRcdFx0XHRcdFx0XHQoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5fcmVzdW1lKCk7XG5cdFx0XHRcdFx0XHRcdFx0d2hpbGUgKHRoaXMuX3NjaGVkdWxlZFRpbWVvdXRzLmhhcyhpZCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdC8vIGZvciBzb21lIHJlYXNvbiBHbyBmYWlsZWQgdG8gcmVnaXN0ZXIgdGhlIHRpbWVvdXQgZXZlbnQsIGxvZyBhbmQgdHJ5IGFnYWluXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyAodGVtcG9yYXJ5IHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vaXNzdWVzLzI4OTc1KVxuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKFwic2NoZWR1bGVUaW1lb3V0RXZlbnQ6IG1pc3NlZCB0aW1lb3V0IGV2ZW50XCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fcmVzdW1lKCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRnZXRJbnQ2NChzcCArIDgpLFxuXHRcdFx0XHRcdFx0KSk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRJbnQzMihzcCArIDE2LCBpZCwgdHJ1ZSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgY2xlYXJUaW1lb3V0RXZlbnQoaWQgaW50MzIpXG5cdFx0XHRcdFx0XCJydW50aW1lLmNsZWFyVGltZW91dEV2ZW50XCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLm1lbS5nZXRJbnQzMihzcCArIDgsIHRydWUpO1xuXHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuX3NjaGVkdWxlZFRpbWVvdXRzLmdldChpZCkpO1xuXHRcdFx0XHRcdFx0dGhpcy5fc2NoZWR1bGVkVGltZW91dHMuZGVsZXRlKGlkKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBnZXRSYW5kb21EYXRhKHIgW11ieXRlKVxuXHRcdFx0XHRcdFwicnVudGltZS5nZXRSYW5kb21EYXRhXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y3J5cHRvLmdldFJhbmRvbVZhbHVlcyhsb2FkU2xpY2Uoc3AgKyA4KSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgZmluYWxpemVSZWYodiByZWYpXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLmZpbmFsaXplUmVmXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLm1lbS5nZXRVaW50MzIoc3AgKyA4LCB0cnVlKTtcblx0XHRcdFx0XHRcdHRoaXMuX2dvUmVmQ291bnRzW2lkXS0tO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuX2dvUmVmQ291bnRzW2lkXSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB2ID0gdGhpcy5fdmFsdWVzW2lkXTtcblx0XHRcdFx0XHRcdFx0dGhpcy5fdmFsdWVzW2lkXSA9IG51bGw7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2lkcy5kZWxldGUodik7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2lkUG9vbC5wdXNoKGlkKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBzdHJpbmdWYWwodmFsdWUgc3RyaW5nKSByZWZcblx0XHRcdFx0XHRcInN5c2NhbGwvanMuc3RyaW5nVmFsXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDI0LCBsb2FkU3RyaW5nKHNwICsgOCkpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHZhbHVlR2V0KHYgcmVmLCBwIHN0cmluZykgcmVmXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlR2V0XCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gUmVmbGVjdC5nZXQobG9hZFZhbHVlKHNwICsgOCksIGxvYWRTdHJpbmcoc3AgKyAxNikpO1xuXHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyAzMiwgcmVzdWx0KTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZVNldCh2IHJlZiwgcCBzdHJpbmcsIHggcmVmKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZVNldFwiOiAoc3ApID0+IHtcblx0XHRcdFx0XHRcdHNwID4+Pj0gMDtcblx0XHRcdFx0XHRcdFJlZmxlY3Quc2V0KGxvYWRWYWx1ZShzcCArIDgpLCBsb2FkU3RyaW5nKHNwICsgMTYpLCBsb2FkVmFsdWUoc3AgKyAzMikpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHZhbHVlRGVsZXRlKHYgcmVmLCBwIHN0cmluZylcblx0XHRcdFx0XHRcInN5c2NhbGwvanMudmFsdWVEZWxldGVcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGxvYWRWYWx1ZShzcCArIDgpLCBsb2FkU3RyaW5nKHNwICsgMTYpKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZUluZGV4KHYgcmVmLCBpIGludCkgcmVmXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlSW5kZXhcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRzdG9yZVZhbHVlKHNwICsgMjQsIFJlZmxlY3QuZ2V0KGxvYWRWYWx1ZShzcCArIDgpLCBnZXRJbnQ2NChzcCArIDE2KSkpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyB2YWx1ZVNldEluZGV4KHYgcmVmLCBpIGludCwgeCByZWYpXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlU2V0SW5kZXhcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRSZWZsZWN0LnNldChsb2FkVmFsdWUoc3AgKyA4KSwgZ2V0SW50NjQoc3AgKyAxNiksIGxvYWRWYWx1ZShzcCArIDI0KSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgdmFsdWVDYWxsKHYgcmVmLCBtIHN0cmluZywgYXJncyBbXXJlZikgKHJlZiwgYm9vbClcblx0XHRcdFx0XHRcInN5c2NhbGwvanMudmFsdWVDYWxsXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgdiA9IGxvYWRWYWx1ZShzcCArIDgpO1xuXHRcdFx0XHRcdFx0XHRjb25zdCBtID0gUmVmbGVjdC5nZXQodiwgbG9hZFN0cmluZyhzcCArIDE2KSk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGFyZ3MgPSBsb2FkU2xpY2VPZlZhbHVlcyhzcCArIDMyKTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gUmVmbGVjdC5hcHBseShtLCB2LCBhcmdzKTtcblx0XHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDU2LCByZXN1bHQpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDY0LCAxKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0XHRzcCA9IHRoaXMuX2luc3QuZXhwb3J0cy5nZXRzcCgpID4+PiAwOyAvLyBzZWUgY29tbWVudCBhYm92ZVxuXHRcdFx0XHRcdFx0XHRzdG9yZVZhbHVlKHNwICsgNTYsIGVycik7XG5cdFx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgNjQsIDApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyBmdW5jIHZhbHVlSW52b2tlKHYgcmVmLCBhcmdzIFtdcmVmKSAocmVmLCBib29sKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZUludm9rZVwiOiAoc3ApID0+IHtcblx0XHRcdFx0XHRcdHNwID4+Pj0gMDtcblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHYgPSBsb2FkVmFsdWUoc3AgKyA4KTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgYXJncyA9IGxvYWRTbGljZU9mVmFsdWVzKHNwICsgMTYpO1xuXHRcdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBSZWZsZWN0LmFwcGx5KHYsIHVuZGVmaW5lZCwgYXJncyk7XG5cdFx0XHRcdFx0XHRcdHNwID0gdGhpcy5faW5zdC5leHBvcnRzLmdldHNwKCkgPj4+IDA7IC8vIHNlZSBjb21tZW50IGFib3ZlXG5cdFx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyA0MCwgcmVzdWx0KTtcblx0XHRcdFx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDgoc3AgKyA0OCwgMSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDQwLCBlcnIpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAwKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZU5ldyh2IHJlZiwgYXJncyBbXXJlZikgKHJlZiwgYm9vbClcblx0XHRcdFx0XHRcInN5c2NhbGwvanMudmFsdWVOZXdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB2ID0gbG9hZFZhbHVlKHNwICsgOCk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGFyZ3MgPSBsb2FkU2xpY2VPZlZhbHVlcyhzcCArIDE2KTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QodiwgYXJncyk7XG5cdFx0XHRcdFx0XHRcdHNwID0gdGhpcy5faW5zdC5leHBvcnRzLmdldHNwKCkgPj4+IDA7IC8vIHNlZSBjb21tZW50IGFib3ZlXG5cdFx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyA0MCwgcmVzdWx0KTtcblx0XHRcdFx0XHRcdFx0dGhpcy5tZW0uc2V0VWludDgoc3AgKyA0OCwgMSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRcdFx0c3AgPSB0aGlzLl9pbnN0LmV4cG9ydHMuZ2V0c3AoKSA+Pj4gMDsgLy8gc2VlIGNvbW1lbnQgYWJvdmVcblx0XHRcdFx0XHRcdFx0c3RvcmVWYWx1ZShzcCArIDQwLCBlcnIpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAwKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZUxlbmd0aCh2IHJlZikgaW50XG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlTGVuZ3RoXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0c2V0SW50NjQoc3AgKyAxNiwgcGFyc2VJbnQobG9hZFZhbHVlKHNwICsgOCkubGVuZ3RoKSk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIHZhbHVlUHJlcGFyZVN0cmluZyh2IHJlZikgKHJlZiwgaW50KVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZVByZXBhcmVTdHJpbmdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBzdHIgPSBlbmNvZGVyLmVuY29kZShTdHJpbmcobG9hZFZhbHVlKHNwICsgOCkpKTtcblx0XHRcdFx0XHRcdHN0b3JlVmFsdWUoc3AgKyAxNiwgc3RyKTtcblx0XHRcdFx0XHRcdHNldEludDY0KHNwICsgMjQsIHN0ci5sZW5ndGgpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHQvLyB2YWx1ZUxvYWRTdHJpbmcodiByZWYsIGIgW11ieXRlKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy52YWx1ZUxvYWRTdHJpbmdcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBzdHIgPSBsb2FkVmFsdWUoc3AgKyA4KTtcblx0XHRcdFx0XHRcdGxvYWRTbGljZShzcCArIDE2KS5zZXQoc3RyKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyB2YWx1ZUluc3RhbmNlT2YodiByZWYsIHQgcmVmKSBib29sXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLnZhbHVlSW5zdGFuY2VPZlwiOiAoc3ApID0+IHtcblx0XHRcdFx0XHRcdHNwID4+Pj0gMDtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgMjQsIChsb2FkVmFsdWUoc3AgKyA4KSBpbnN0YW5jZW9mIGxvYWRWYWx1ZShzcCArIDE2KSkgPyAxIDogMCk7XG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vIGZ1bmMgY29weUJ5dGVzVG9Hbyhkc3QgW11ieXRlLCBzcmMgcmVmKSAoaW50LCBib29sKVxuXHRcdFx0XHRcdFwic3lzY2FsbC9qcy5jb3B5Qnl0ZXNUb0dvXCI6IChzcCkgPT4ge1xuXHRcdFx0XHRcdFx0c3AgPj4+PSAwO1xuXHRcdFx0XHRcdFx0Y29uc3QgZHN0ID0gbG9hZFNsaWNlKHNwICsgOCk7XG5cdFx0XHRcdFx0XHRjb25zdCBzcmMgPSBsb2FkVmFsdWUoc3AgKyAzMik7XG5cdFx0XHRcdFx0XHRpZiAoIShzcmMgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8IHNyYyBpbnN0YW5jZW9mIFVpbnQ4Q2xhbXBlZEFycmF5KSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAwKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y29uc3QgdG9Db3B5ID0gc3JjLnN1YmFycmF5KDAsIGRzdC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0ZHN0LnNldCh0b0NvcHkpO1xuXHRcdFx0XHRcdFx0c2V0SW50NjQoc3AgKyA0MCwgdG9Db3B5Lmxlbmd0aCk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbS5zZXRVaW50OChzcCArIDQ4LCAxKTtcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gZnVuYyBjb3B5Qnl0ZXNUb0pTKGRzdCByZWYsIHNyYyBbXWJ5dGUpIChpbnQsIGJvb2wpXG5cdFx0XHRcdFx0XCJzeXNjYWxsL2pzLmNvcHlCeXRlc1RvSlNcIjogKHNwKSA9PiB7XG5cdFx0XHRcdFx0XHRzcCA+Pj49IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBkc3QgPSBsb2FkVmFsdWUoc3AgKyA4KTtcblx0XHRcdFx0XHRcdGNvbnN0IHNyYyA9IGxvYWRTbGljZShzcCArIDE2KTtcblx0XHRcdFx0XHRcdGlmICghKGRzdCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgZHN0IGluc3RhbmNlb2YgVWludDhDbGFtcGVkQXJyYXkpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgNDgsIDApO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCB0b0NvcHkgPSBzcmMuc3ViYXJyYXkoMCwgZHN0Lmxlbmd0aCk7XG5cdFx0XHRcdFx0XHRkc3Quc2V0KHRvQ29weSk7XG5cdFx0XHRcdFx0XHRzZXRJbnQ2NChzcCArIDQwLCB0b0NvcHkubGVuZ3RoKTtcblx0XHRcdFx0XHRcdHRoaXMubWVtLnNldFVpbnQ4KHNwICsgNDgsIDEpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHRcImRlYnVnXCI6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2codmFsdWUpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0YXN5bmMgcnVuKGluc3RhbmNlKSB7XG5cdFx0XHRpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIFdlYkFzc2VtYmx5Lkluc3RhbmNlKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJHby5ydW46IFdlYkFzc2VtYmx5Lkluc3RhbmNlIGV4cGVjdGVkXCIpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5faW5zdCA9IGluc3RhbmNlO1xuXHRcdFx0dGhpcy5tZW0gPSBuZXcgRGF0YVZpZXcodGhpcy5faW5zdC5leHBvcnRzLm1lbS5idWZmZXIpO1xuXHRcdFx0dGhpcy5fdmFsdWVzID0gWyAvLyBKUyB2YWx1ZXMgdGhhdCBHbyBjdXJyZW50bHkgaGFzIHJlZmVyZW5jZXMgdG8sIGluZGV4ZWQgYnkgcmVmZXJlbmNlIGlkXG5cdFx0XHRcdE5hTixcblx0XHRcdFx0MCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0ZmFsc2UsXG5cdFx0XHRcdGdsb2JhbFRoaXMsXG5cdFx0XHRcdHRoaXMsXG5cdFx0XHRdO1xuXHRcdFx0dGhpcy5fZ29SZWZDb3VudHMgPSBuZXcgQXJyYXkodGhpcy5fdmFsdWVzLmxlbmd0aCkuZmlsbChJbmZpbml0eSk7IC8vIG51bWJlciBvZiByZWZlcmVuY2VzIHRoYXQgR28gaGFzIHRvIGEgSlMgdmFsdWUsIGluZGV4ZWQgYnkgcmVmZXJlbmNlIGlkXG5cdFx0XHR0aGlzLl9pZHMgPSBuZXcgTWFwKFsgLy8gbWFwcGluZyBmcm9tIEpTIHZhbHVlcyB0byByZWZlcmVuY2UgaWRzXG5cdFx0XHRcdFswLCAxXSxcblx0XHRcdFx0W251bGwsIDJdLFxuXHRcdFx0XHRbdHJ1ZSwgM10sXG5cdFx0XHRcdFtmYWxzZSwgNF0sXG5cdFx0XHRcdFtnbG9iYWxUaGlzLCA1XSxcblx0XHRcdFx0W3RoaXMsIDZdLFxuXHRcdFx0XSk7XG5cdFx0XHR0aGlzLl9pZFBvb2wgPSBbXTsgICAvLyB1bnVzZWQgaWRzIHRoYXQgaGF2ZSBiZWVuIGdhcmJhZ2UgY29sbGVjdGVkXG5cdFx0XHR0aGlzLmV4aXRlZCA9IGZhbHNlOyAvLyB3aGV0aGVyIHRoZSBHbyBwcm9ncmFtIGhhcyBleGl0ZWRcblxuXHRcdFx0Ly8gUGFzcyBjb21tYW5kIGxpbmUgYXJndW1lbnRzIGFuZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgdG8gV2ViQXNzZW1ibHkgYnkgd3JpdGluZyB0aGVtIHRvIHRoZSBsaW5lYXIgbWVtb3J5LlxuXHRcdFx0bGV0IG9mZnNldCA9IDQwOTY7XG5cblx0XHRcdGNvbnN0IHN0clB0ciA9IChzdHIpID0+IHtcblx0XHRcdFx0Y29uc3QgcHRyID0gb2Zmc2V0O1xuXHRcdFx0XHRjb25zdCBieXRlcyA9IGVuY29kZXIuZW5jb2RlKHN0ciArIFwiXFwwXCIpO1xuXHRcdFx0XHRuZXcgVWludDhBcnJheSh0aGlzLm1lbS5idWZmZXIsIG9mZnNldCwgYnl0ZXMubGVuZ3RoKS5zZXQoYnl0ZXMpO1xuXHRcdFx0XHRvZmZzZXQgKz0gYnl0ZXMubGVuZ3RoO1xuXHRcdFx0XHRpZiAob2Zmc2V0ICUgOCAhPT0gMCkge1xuXHRcdFx0XHRcdG9mZnNldCArPSA4IC0gKG9mZnNldCAlIDgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBwdHI7XG5cdFx0XHR9O1xuXG5cdFx0XHRjb25zdCBhcmdjID0gdGhpcy5hcmd2Lmxlbmd0aDtcblxuXHRcdFx0Y29uc3QgYXJndlB0cnMgPSBbXTtcblx0XHRcdHRoaXMuYXJndi5mb3JFYWNoKChhcmcpID0+IHtcblx0XHRcdFx0YXJndlB0cnMucHVzaChzdHJQdHIoYXJnKSk7XG5cdFx0XHR9KTtcblx0XHRcdGFyZ3ZQdHJzLnB1c2goMCk7XG5cblx0XHRcdGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmVudikuc29ydCgpO1xuXHRcdFx0a2V5cy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdFx0YXJndlB0cnMucHVzaChzdHJQdHIoYCR7a2V5fT0ke3RoaXMuZW52W2tleV19YCkpO1xuXHRcdFx0fSk7XG5cdFx0XHRhcmd2UHRycy5wdXNoKDApO1xuXG5cdFx0XHRjb25zdCBhcmd2ID0gb2Zmc2V0O1xuXHRcdFx0YXJndlB0cnMuZm9yRWFjaCgocHRyKSA9PiB7XG5cdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihvZmZzZXQsIHB0ciwgdHJ1ZSk7XG5cdFx0XHRcdHRoaXMubWVtLnNldFVpbnQzMihvZmZzZXQgKyA0LCAwLCB0cnVlKTtcblx0XHRcdFx0b2Zmc2V0ICs9IDg7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gVGhlIGxpbmtlciBndWFyYW50ZWVzIGdsb2JhbCBkYXRhIHN0YXJ0cyBmcm9tIGF0IGxlYXN0IHdhc21NaW5EYXRhQWRkci5cblx0XHRcdC8vIEtlZXAgaW4gc3luYyB3aXRoIGNtZC9saW5rL2ludGVybmFsL2xkL2RhdGEuZ286d2FzbU1pbkRhdGFBZGRyLlxuXHRcdFx0Y29uc3Qgd2FzbU1pbkRhdGFBZGRyID0gNDA5NiArIDgxOTI7XG5cdFx0XHRpZiAob2Zmc2V0ID49IHdhc21NaW5EYXRhQWRkcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJ0b3RhbCBsZW5ndGggb2YgY29tbWFuZCBsaW5lIGFuZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZXhjZWVkcyBsaW1pdFwiKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5faW5zdC5leHBvcnRzLnJ1bihhcmdjLCBhcmd2KTtcblx0XHRcdGlmICh0aGlzLmV4aXRlZCkge1xuXHRcdFx0XHR0aGlzLl9yZXNvbHZlRXhpdFByb21pc2UoKTtcblx0XHRcdH1cblx0XHRcdGF3YWl0IHRoaXMuX2V4aXRQcm9taXNlO1xuXHRcdH1cblxuXHRcdF9yZXN1bWUoKSB7XG5cdFx0XHRpZiAodGhpcy5leGl0ZWQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiR28gcHJvZ3JhbSBoYXMgYWxyZWFkeSBleGl0ZWRcIik7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9pbnN0LmV4cG9ydHMucmVzdW1lKCk7XG5cdFx0XHRpZiAodGhpcy5leGl0ZWQpIHtcblx0XHRcdFx0dGhpcy5fcmVzb2x2ZUV4aXRQcm9taXNlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0X21ha2VGdW5jV3JhcHBlcihpZCkge1xuXHRcdFx0Y29uc3QgZ28gPSB0aGlzO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Y29uc3QgZXZlbnQgPSB7IGlkOiBpZCwgdGhpczogdGhpcywgYXJnczogYXJndW1lbnRzIH07XG5cdFx0XHRcdGdvLl9wZW5kaW5nRXZlbnQgPSBldmVudDtcblx0XHRcdFx0Z28uX3Jlc3VtZSgpO1xuXHRcdFx0XHRyZXR1cm4gZXZlbnQucmVzdWx0O1xuXHRcdFx0fTtcblx0XHR9XG5cdH1cbn0pKCk7XG4iLCAiZXhwb3J0IGNvbnN0IHdoaXRlc3BhY2VDaGFycyA9IG5ldyBTZXQoXG4gIFtcbiAgICAnXFxuJyxcbiAgICAnXFx0JyxcbiAgICAnXFxyJyxcbiAgICAnXFxmJyxcbiAgICAnXFx2JyxcbiAgICAnXFx1MDBhMCcsXG4gICAgJ1xcdTE2ODAnLFxuICAgICdcXHUyMDAwJyxcbiAgICAnXFx1MjAwYScsXG4gICAgJ1xcdTIwMjgnLFxuICAgICdcXHUyMDI5JyxcbiAgICAnXFx1MjAyZicsXG4gICAgJ1xcdTIwNWYnLFxuICAgICdcXHUzMDAwJyxcbiAgICAnXFx1ZmVmZicsXG4gIF0ubWFwKChzKSA9PiBzLmNoYXJDb2RlQXQoMCkpLFxuKVxuXG5leHBvcnQgY29uc3QgcGFkID0gKHN0cjogc3RyaW5nLCBjb3VudDogbnVtYmVyLCBpc0xlZnQgPSBmYWxzZSwgY2hhciA9ICcgJykgPT4ge1xuICBpZiAoc3RyLmxlbmd0aCA+PSBjb3VudCkge1xuICAgIHJldHVybiBzdHJcbiAgfVxuXG4gIGNvbnN0IHBhZGRpbmcgPSBjaGFyLnJlcGVhdChjb3VudCAtIHN0ci5sZW5ndGgpXG4gIHJldHVybiBpc0xlZnQgPyBwYWRkaW5nICsgc3RyIDogc3RyICsgcGFkZGluZ1xufVxuXG5leHBvcnQgY29uc3QgcGFkUmlnaHQgPSAoc3RyOiBzdHJpbmcsIGNvdW50OiBudW1iZXIsIGNoYXIgPSAnICcpID0+IHBhZChzdHIsIGNvdW50LCBmYWxzZSwgY2hhcilcblxuZXhwb3J0IGNvbnN0IHBhZExlZnQgPSAoc3RyOiBzdHJpbmcsIGNvdW50OiBudW1iZXIsIGNoYXIgPSAnICcpID0+IHBhZChzdHIsIGNvdW50LCB0cnVlLCBjaGFyKVxuIiwgImltcG9ydCB7IHdoaXRlc3BhY2VDaGFycywgcGFkUmlnaHQgfSBmcm9tICcuL3V0aWxzJ1xuXG5jb25zdCBXSElURVNQQUNFX1BMQUNFSE9MREVSID0gJ1cnLmNoYXJDb2RlQXQoMClcbmNvbnN0IFpFUk9fQ0hBUl9QTEFDRUhPTERFUiA9ICdcdTMwRkInLmNoYXJDb2RlQXQoMClcbmNvbnN0IFJPV19TRVBBUkFUT1IgPSAnXHVGRjVDJ1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5SW5zcGVjdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBtZW06IFdlYkFzc2VtYmx5Lk1lbW9yeSkge31cblxuICAvKipcbiAgICogUmV0dXJucyBtZW1vcnkgaW5zcGVjdG9yIGZyb20gV2ViQXNzZW1ibHkgbW9kdWxlIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gaW5zdGFuY2UgTW9kdWxlIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUluc3RhbmNlKGluc3RhbmNlOiBXZWJBc3NlbWJseS5JbnN0YW5jZSkge1xuICAgIGNvbnN0IHsgbWVtIH0gPSBpbnN0YW5jZS5leHBvcnRzXG4gICAgaWYgKCFtZW0pIHtcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcignTWlzc2luZyBleHBvcnRlZCBzeW1ib2wgXCJidWZmZXJcIiBpbiBpbnN0YW5jZScpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBNZW1vcnlJbnNwZWN0b3IobWVtIGFzIFdlYkFzc2VtYmx5Lk1lbW9yeSlcbiAgfVxuXG4gIGR1bXAob2Zmc2V0OiBudW1iZXIsIGNvdW50OiBudW1iZXIsIGNvbENvdW50ID0gOCkge1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcodGhpcy5tZW0uYnVmZmVyKVxuXG4gICAgY291bnQgPSBjb3VudCA8IGNvbENvdW50ID8gY29sQ291bnQgOiBjb3VudFxuICAgIGxldCByb3dDb3VudCA9IE1hdGguZmxvb3IoY291bnQgLyBjb2xDb3VudClcbiAgICBpZiAoY291bnQgJSBjb2xDb3VudCA+IDApIHtcbiAgICAgIHJvd0NvdW50KytcbiAgICB9XG5cbiAgICBsZXQgbWF4QWRkckxlbiA9IDBcbiAgICBjb25zdCBsaW5lczogQXJyYXk8W3N0cmluZywgc3RyaW5nLCBzdHJpbmddPiA9IFtdXG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgcm93Q291bnQ7IHJvdysrKSB7XG4gICAgICBjb25zdCByb3dPZmZzZXQgPSBvZmZzZXQgKyByb3cgKiBjb2xDb3VudFxuICAgICAgY29uc3QgYnl0ZXM6IG51bWJlcltdID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29sQ291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBieXRlID0gdmlldy5nZXRVaW50OChyb3dPZmZzZXQgKyBpKVxuICAgICAgICBieXRlcy5wdXNoKGJ5dGUpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0ckFkZHIgPSByb3dPZmZzZXQudG9TdHJpbmcoMTYpXG4gICAgICBjb25zdCBoZXhCeXRlcyA9IGJ5dGVzLm1hcCgoYikgPT4gcGFkUmlnaHQoYi50b1N0cmluZygxNiksIDIsICcwJykpLmpvaW4oJyAnKVxuXG4gICAgICBjb25zdCBzdHJCeXRlcyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAgIC4uLmJ5dGVzXG4gICAgICAgICAgLm1hcCgoYikgPT4gKHdoaXRlc3BhY2VDaGFycy5oYXMoYikgPyBXSElURVNQQUNFX1BMQUNFSE9MREVSIDogYikpXG4gICAgICAgICAgLm1hcCgoYikgPT4gKGIgPT09IDAgPyBaRVJPX0NIQVJfUExBQ0VIT0xERVIgOiBiKSksXG4gICAgICApXG4gICAgICBsaW5lcy5wdXNoKFtzdHJBZGRyLCBoZXhCeXRlcywgc3RyQnl0ZXNdKVxuICAgICAgaWYgKG1heEFkZHJMZW4gPCBzdHJBZGRyLmxlbmd0aCkge1xuICAgICAgICBtYXhBZGRyTGVuID0gc3RyQWRkci5sZW5ndGhcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGluZXNcbiAgICAgIC5tYXAoKFthZGRyLCBieXRlcywgc3RyXSkgPT4gYCR7cGFkUmlnaHQoYWRkciwgbWF4QWRkckxlbil9ICR7Uk9XX1NFUEFSQVRPUn0gJHtieXRlc30gJHtST1dfU0VQQVJBVE9SfSAke3N0cn1gKVxuICAgICAgLmpvaW4oJ1xcbicpXG4gIH1cbn1cbiIsICJleHBvcnQgY29uc3QgdG9IZXggPSAodjogbnVtYmVyKSA9PiB2LnRvU3RyaW5nKDE2KVxuZXhwb3J0IGNvbnN0IGZyb21IZXggPSAodjogc3RyaW5nKSA9PiBwYXJzZUludCh2LCAxNilcblxuLyoqXG4gKiBGb3JtYXRzIG51bWJlciB0byBoZXggb3IgcGFyc2VzIG51bWJlciBmcm9tIGhleCBzdHJpbmcuXG4gKiBAcGFyYW0gdlxuICovXG5leHBvcnQgY29uc3QgaGV4ID0gKHY6IG51bWJlciB8IGJpZ2ludCB8IHN0cmluZykgPT4ge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiB0b0hleCh2KVxuICAgIGNhc2UgJ2JpZ2ludCc6XG4gICAgICByZXR1cm4gdG9IZXgoTnVtYmVyKHYpKVxuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gZnJvbUhleCh2KVxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGhleDogaW52YWxpZCBhcmd1bWVudCB0eXBlICR7dHlwZW9mIHZ9YClcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnT3B0aW9ucyB7XG4gIGRlYnVnPzogYm9vbGVhblxufVxuXG5leHBvcnQgY29uc3QgaW5zdGFudGlhdGVTdHJlYW1pbmcgPSBhc3luYyAocmVzcDogUmVzcG9uc2UgfCBQcm9taXNlTGlrZTxSZXNwb25zZT4sIGltcG9ydE9iamVjdCkgPT4ge1xuICBjb25zdCByOiBSZXNwb25zZSA9IHJlc3AgaW5zdGFuY2VvZiBQcm9taXNlID8gYXdhaXQgcmVzcCA6IHJlc3BcbiAgaWYgKHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQ2Fubm90IGluc3RhbnRpYXRlIFdlYkFzc2VtYmx5IHN0cmVhbWluZywgaW52YWxpZCBIVFRQIHJlc3BvbnNlOiAnICtcbiAgICAgICAgYCcke3Iuc3RhdHVzfSAke3Iuc3RhdHVzVGV4dH0nIChVUkw6ICR7ci51cmx9KWAsXG4gICAgKVxuICB9XG5cbiAgaWYgKCdpbnN0YW50aWF0ZVN0cmVhbWluZycgaW4gV2ViQXNzZW1ibHkpIHtcbiAgICByZXR1cm4gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmcociwgaW1wb3J0T2JqZWN0KVxuICB9XG5cbiAgY29uc3Qgc291cmNlID0gYXdhaXQgci5hcnJheUJ1ZmZlcigpXG4gIHJldHVybiBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShzb3VyY2UsIGltcG9ydE9iamVjdClcbn1cbiIsICIvKipcbiAqIEFsaWducyBtZW1vcnkgYWRkcmVzcyB1c2luZyBwcm92aWRlZCBhbGlnbm1lbnRcbiAqXG4gKiBAcGFyYW0gYWRkciBBZGRyZXNzXG4gKiBAcGFyYW0gYWxpZ25tZW50IEFsaWdubWVudFxuICovXG5leHBvcnQgY29uc3QgYWxpZ25BZGRyID0gKGFkZHI6IG51bWJlciwgYWxpZ25tZW50OiBudW1iZXIpID0+IHtcbiAgLy8gQ2FsY3VsYXRlIHRoZSBvZmZzZXQgcmVxdWlyZWQgdG8gYWxpZ24gdGhlIGFkZHJlc3NcbiAgY29uc3Qgb2Zmc2V0ID0gYWxpZ25tZW50IC0gKGFkZHIgJSBhbGlnbm1lbnQpXG5cbiAgLy8gQWRkIHRoZSBvZmZzZXQgdG8gdGhlIGFkZHJlc3MgdG8gYWxpZ24gaXRcbiAgcmV0dXJuIGFkZHIgKyBvZmZzZXRcbn1cbiIsICJpbXBvcnQge2FsaWduQWRkcn0gZnJvbSBcIi4vY29tbW9uXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JpdGVSZXN1bHQge1xuICBhZGRyZXNzOiBudW1iZXJcbiAgZW5kT2Zmc2V0OiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWFkUmVzdWx0PFQgPSBhbnk+IGV4dGVuZHMgV3JpdGVSZXN1bHQge1xuICB2YWx1ZTogVFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVEZXNjcmlwdG9yIHtcbiAgc2l6ZTogbnVtYmVyXG4gIGFsaWdubWVudDogbnVtYmVyXG4gIHBhZGRpbmc6IG51bWJlclxufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIHR5cGUgcmVhZCBhbmQgd3JpdGUgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQGFic3RyYWN0XG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBYnN0cmFjdFR5cGVTcGVjPFQgPSBhbnk+IHtcbiAgcHJpdmF0ZSBfc2l6ZSA9IDBcbiAgcHJpdmF0ZSBfYWxpZ24gPSAxXG4gIHByaXZhdGUgX3NraXAgPSAwXG4gIHByaXZhdGUgcmVhZG9ubHkgX25hbWU6IHN0cmluZyA9ICcnXG5cbiAgLyoqXG4gICAqIEBwYXJhbSBuYW1lIE9yaWdpbmFsIHR5cGUgbmFtZS5cbiAgICogQHBhcmFtIHNpemUgVHlwZSBzaXplLlxuICAgKiBAcGFyYW0gYWxpZ24gVHlwZSBhbGlnbm1lbnQuXG4gICAqIEBwYXJhbSBza2lwIE51bWJlciBvZiBieXRlcyB0byBza2lwLlxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2l6ZTogbnVtYmVyLCBhbGlnbiA9IDEsIHNraXAgPSAwKSB7XG4gICAgdGhpcy5fc2l6ZSA9IHNpemVcbiAgICB0aGlzLl9hbGlnbiA9IGFsaWduXG4gICAgdGhpcy5fc2tpcCA9IHNraXBcbiAgICB0aGlzLl9uYW1lID0gbmFtZVxuICB9XG5cbiAgcHJvdGVjdGVkIHNldFR5cGVEZXNjcmlwdG9yKHsgc2l6ZSwgYWxpZ25tZW50LCBwYWRkaW5nIH06IFR5cGVEZXNjcmlwdG9yKSB7XG4gICAgdGhpcy5fc2l6ZSA9IHNpemVcbiAgICB0aGlzLl9hbGlnbiA9IGFsaWdubWVudFxuICAgIHRoaXMuX3NraXAgPSBwYWRkaW5nXG4gIH1cblxuICAvKipcbiAgICogTnVtYmVyIG9mIGJ5dGVzIHJlc2VydmVkIGFmdGVyIHZhbHVlIGNvbnRlbnRzLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IHBhZGRpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NraXBcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHZhbHVlIHR5cGUgc2l6ZS5cbiAgICogQHJldHVybnMge251bWJlcn1cbiAgICovXG4gIGdldCBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLl9zaXplXG4gIH1cblxuICAvKipcbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0eXBlIGFsaWdubWVudFxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IGFsaWdubWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYWxpZ25cbiAgfVxuXG4gIC8qKlxuICAgKiBBbGlnbiBwb2ludGVyIGFkZHJlc3NcbiAgICogQHBhcmFtIGFkZHJcbiAgICogQHJldHVybnMgQWxpZ25lZCBhZGRyZXNzXG4gICAqL1xuICBhbGlnbkFkZHJlc3MoYWRkcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoYWRkciAlIHRoaXMuX2FsaWduID09PSAwKSB7XG4gICAgICAvLyBBZGRyZXNzIGlzIGFsaWduZWRcbiAgICAgIHJldHVybiBhZGRyXG4gICAgfVxuXG4gICAgcmV0dXJuIGFsaWduQWRkcihhZGRyLCB0aGlzLl9hbGlnbilcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgdmFsdWUgZnJvbSBEYXRhVmlldyBhdCBwYXNzZWQgYWRkcmVzcyBhbmQgcmV0dXJucyBhIHZhbHVlLlxuICAgKiBQYXNzZWQgYWRkcmVzcyBzaG91bGQgYmUgYWxpZ25lZC5cbiAgICpcbiAgICogUGxlYXNlIGNvbnNpZGVyIGByZWFkKClgIGZvciBnZW5lcmFsLXB1cnBvc2UgdXNlLlxuICAgKlxuICAgKiBAYWJzdHJhY3RcbiAgICogQHBhcmFtIHZpZXcgTWVtb3J5IHZpZXdcbiAgICogQHBhcmFtIGFkZHIgQWRkcmVzc1xuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIGRlY29kZSh2aWV3OiBEYXRhVmlldywgYWRkcjogbnVtYmVyKTogVCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX0uZGVjb2RlOiBub3QgaW1wbGVtZW50ZWRgKVxuICB9XG5cbiAgLyoqXG4gICAqIEVuY29kZXMgYW5kIHB1dHMgdmFsdWUgdG8gRGF0YVZpZXcgYXQgcGFzc2VkIGFkZHJlc3MuXG4gICAqIFBhc3NlZCBhZGRyZXNzIHNob3VsZCBiZSBhbGlnbmVkLlxuICAgKlxuICAgKiBQbGVhc2UgY29uc2lkZXIgYHdyaXRlKClgIGZvciBnZW5lcmFsLXB1cnBvc2UgdXNlLlxuICAgKlxuICAgKiBAYWJzdHJhY3RcbiAgICogQHBhcmFtIHZpZXcgTWVtb3J5IHZpZXdcbiAgICogQHBhcmFtIGFkZHIgQWRkcmVzc1xuICAgKiBAcGFyYW0geyp9IHZhbFxuICAgKi9cbiAgZW5jb2RlKHZpZXc6IERhdGFWaWV3LCBhZGRyOiBudW1iZXIsIHZhbDogVCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogbm90IGltcGxlbWVudGVkYClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyB2YWx1ZSBhdCBzcGVjaWZpZWQgb2Zmc2V0IGluIG1lbW9yeSBhbmQgcmV0dXJuc1xuICAgKiBhIHZhbHVlIHdpdGggZW5kIG9mZnNldCBhZGRyZXNzLlxuICAgKlxuICAgKiBQYXNzZWQgb2Zmc2V0IGFkZHJlc3Mgd2lsbCBiZSBhbGlnbmVkIGJlZm9yZSByZWFkLlxuICAgKlxuICAgKiBAcGFyYW0gdmlldyBNZW1vcnlcbiAgICogQHBhcmFtIGFkZHIgU3RhY2sgcG9pbnRlclxuICAgKiBAcGFyYW0gYnVmZiBPcmlnaW5hbCBtZW1vcnkgYnVmZmVyXG4gICAqIEByZXR1cm5zIHtSZWFkUmVzdWx0fVxuICAgKi9cbiAgcmVhZCh2aWV3OiBEYXRhVmlldywgYWRkcjogbnVtYmVyLCBidWZmOiBBcnJheUJ1ZmZlckxpa2UpOiBSZWFkUmVzdWx0PFQ+IHtcbiAgICBjb25zdCBhZGRyZXNzID0gdGhpcy5hbGlnbkFkZHJlc3MoYWRkcilcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZGVjb2RlKHZpZXcsIGFkZHJlc3MpXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlLFxuICAgICAgYWRkcmVzcyxcbiAgICAgIGVuZE9mZnNldDogYWRkcmVzcyArIHRoaXMuc2l6ZSArIHRoaXMucGFkZGluZyxcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5jb2RlcyBhbmQgd3JpdGVzIGEgdmFsdWUgdG8gRGF0YVZpZXcgYXQgc3BlY2lmeWluZyBhZGRyZXNzLlxuICAgKiBQYXNzZWQgYWRkcmVzcyB3aWxsIGJlIGFsaWduZWQgYmVmb3JlIHdyaXRlLlxuICAgKlxuICAgKiBAcGFyYW0gdmlld1xuICAgKiBAcGFyYW0gYWRkclxuICAgKiBAcGFyYW0gdmFsXG4gICAqIEBwYXJhbSBidWZmIE9yaWdpbmFsIG1lbW9yeSBidWZmZXJcbiAgICogQHJldHVybnMge1dyaXRlUmVzdWx0fVxuICAgKi9cbiAgd3JpdGUodmlldzogRGF0YVZpZXcsIGFkZHI6IG51bWJlciwgdmFsOiBULCBidWZmOiBBcnJheUJ1ZmZlckxpa2UpOiBXcml0ZVJlc3VsdCB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuYWxpZ25BZGRyZXNzKGFkZHIpXG4gICAgdGhpcy5lbmNvZGUodmlldywgYWRkcmVzcywgdmFsKVxuICAgIHJldHVybiB7XG4gICAgICBhZGRyZXNzLFxuICAgICAgZW5kT2Zmc2V0OiBhZGRyZXNzICsgdGhpcy5zaXplICsgdGhpcy5wYWRkaW5nLFxuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7QWJzdHJhY3RUeXBlU3BlY30gZnJvbSBcIi4uL3NwZWNcIjtcblxuZXhwb3J0IGNsYXNzIEJvb2xlYW5UeXBlU3BlYyBleHRlbmRzIEFic3RyYWN0VHlwZVNwZWMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignYm9vbCcsIDEsIDEsIDApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIGNvbnN0IHZhbCA9IHZpZXcuZ2V0VWludDgoYWRkcilcbiAgICByZXR1cm4gISF2YWxcbiAgfVxuXG4gIGVuY29kZSh2aWV3LCBhZGRyLCBkYXRhKSB7XG4gICAgdmlldy5zZXRVaW50OChhZGRyLCArZGF0YSlcbiAgfVxufVxuIiwgImltcG9ydCB7QWJzdHJhY3RUeXBlU3BlY30gZnJvbSBcIi4uL3NwZWNcIjtcblxuY29uc3QgTUFYX0lOVDMyID0gNDI5NDk2NzI5NlxuXG5leHBvcnQgY2xhc3MgVUludDY0VHlwZVNwZWMgZXh0ZW5kcyBBYnN0cmFjdFR5cGVTcGVjPGJvb2xlYW4+IHtcbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHN1cGVyKG5hbWUsIDgsIDgsIDApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIGNvbnN0IGxvdyA9IHZpZXcuZ2V0VWludDMyKGFkZHIsIHRydWUpXG4gICAgY29uc3QgaGlnaCA9IHZpZXcuZ2V0SW50MzIoYWRkciArIDQsIHRydWUpXG5cbiAgICByZXR1cm4gbG93ICsgaGlnaCAqIE1BWF9JTlQzMlxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHZpZXcuc2V0VWludDMyKGFkZHIsIHZhbCwgdHJ1ZSlcbiAgICB2aWV3LnNldFVpbnQzMihhZGRyICsgNCwgTWF0aC5mbG9vcih2YWwgLyBNQVhfSU5UMzIpLCB0cnVlKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnQ2NFR5cGVTcGVjIGV4dGVuZHMgQWJzdHJhY3RUeXBlU3BlYzxudW1iZXI+IHtcbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHN1cGVyKG5hbWUsIDgsIDgsIDApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIGNvbnN0IGxvdyA9IHZpZXcuZ2V0VWludDMyKGFkZHIsIHRydWUpXG4gICAgY29uc3QgaGlnaCA9IHZpZXcuZ2V0SW50MzIoYWRkciArIDQsIHRydWUpXG5cbiAgICByZXR1cm4gbG93ICsgaGlnaCAqIE1BWF9JTlQzMlxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHZpZXcuc2V0VWludDMyKGFkZHIsIHZhbCwgdHJ1ZSlcbiAgICB2aWV3LnNldFVpbnQzMihhZGRyICsgNCwgTWF0aC5mbG9vcih2YWwgLyBNQVhfSU5UMzIpLCB0cnVlKVxuICB9XG59XG4iLCAiaW1wb3J0IHtBYnN0cmFjdFR5cGVTcGVjfSBmcm9tIFwiLi4vc3BlY1wiO1xuXG5pbnRlcmZhY2UgRGF0YVZpZXdSZWFkZXI8VCA9IG51bWJlcj4ge1xuICBjYWxsOiAodGhpc0FyZzogRGF0YVZpZXcsIGFkZHJlc3M6IG51bWJlciwgbGVmdEVuZGlhbj86IGJvb2xlYW4pID0+IFRcbn1cblxuaW50ZXJmYWNlIERhdGFWaWV3V3JpdGVyPFQgPSBudW1iZXI+IHtcbiAgY2FsbDogKHRoaXNBcmc6IERhdGFWaWV3LCBhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBULCBsZWZ0RW5kaWFuPzogYm9vbGVhbikgPT4gVFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFWaWV3RGVzY3JpcHRvcjxUID0gbnVtYmVyPiB7XG4gIHJlYWQ6IERhdGFWaWV3UmVhZGVyPFQ+XG4gIHdyaXRlOiBEYXRhVmlld1dyaXRlcjxUPlxufVxuXG4vKipcbiAqIERhdGFWaWV3YWJsZVR5cGVTcGVjIGlzIGEgdHlwZSB3cmFwcGVyIGZvciBudW1lcmljIHZhbHVlcyB0aGF0IGNhbiBiZSByZWFkXG4gKiB1c2luZyByYXcgRGF0YVZpZXcgbWV0aG9kcy5cbiAqL1xuZXhwb3J0IGNsYXNzIERhdGFWaWV3YWJsZVR5cGVTcGVjPFQgPSBudW1iZXIgfCBiaWdpbnQ+IGV4dGVuZHMgQWJzdHJhY3RUeXBlU3BlYzxUPiB7XG4gIF9yZWFkTWV0aG9kOiBEYXRhVmlld1JlYWRlcjxUPlxuICBfd3JpdGVNZXRob2Q6IERhdGFWaWV3V3JpdGVyPFQ+XG5cbiAgY29uc3RydWN0b3IobmFtZSwgc2l6ZTogbnVtYmVyLCBhbGlnbjogbnVtYmVyLCBza2lwOiBudW1iZXIsIHJ3T2JqOiBEYXRhVmlld0Rlc2NyaXB0b3I8VD4pIHtcbiAgICBzdXBlcihuYW1lLCBzaXplLCBhbGlnbiwgc2tpcClcbiAgICB0aGlzLl9yZWFkTWV0aG9kID0gcndPYmoucmVhZFxuICAgIHRoaXMuX3dyaXRlTWV0aG9kID0gcndPYmoud3JpdGVcbiAgfVxuXG4gIGRlY29kZSh2aWV3LCBhZGRyKTogVCB7XG4gICAgcmV0dXJuIHRoaXMuX3JlYWRNZXRob2QuY2FsbCh2aWV3LCBhZGRyLCB0cnVlKVxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIGRhdGEpIHtcbiAgICB0aGlzLl93cml0ZU1ldGhvZC5jYWxsKHZpZXcsIGFkZHIsIGRhdGEsIHRydWUpXG4gIH1cbn1cbiIsICJcbi8vIENvbW1vbiB0eXBlIGFsaWFzZXNcbmltcG9ydCB7Qm9vbGVhblR5cGVTcGVjfSBmcm9tIFwiLi9ib29sZWFuXCI7XG5pbXBvcnQge0ludDY0VHlwZVNwZWMsIFVJbnQ2NFR5cGVTcGVjfSBmcm9tIFwiLi91aW50NjRcIjtcbmltcG9ydCB7RGF0YVZpZXdhYmxlVHlwZVNwZWN9IGZyb20gXCIuL2RhdGF2aWV3XCI7XG5cbmV4cG9ydCBjb25zdCBCb29sID0gbmV3IEJvb2xlYW5UeXBlU3BlYygpXG4vLyBGSVhNRTogZml4IFVJbnQgc3BlYyBkZWZpbml0aW9uc1xuZXhwb3J0IGNvbnN0IEludCA9IG5ldyBVSW50NjRUeXBlU3BlYygnaW50JylcbmV4cG9ydCBjb25zdCBJbnQ2NCA9IG5ldyBJbnQ2NFR5cGVTcGVjKCdpbnQ2NCcpXG5leHBvcnQgY29uc3QgVWludCA9IG5ldyBVSW50NjRUeXBlU3BlYygndWludCcpXG5leHBvcnQgY29uc3QgVWludFB0ciA9IG5ldyBVSW50NjRUeXBlU3BlYygndWludHB0cicpXG5leHBvcnQgY29uc3QgQnl0ZSA9IG5ldyBEYXRhVmlld2FibGVUeXBlU3BlYygnYnl0ZScsIDEsIDEsIDAsIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICByZWFkOiBEYXRhVmlldy5wcm90b3R5cGUuZ2V0VWludDgsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgd3JpdGU6IERhdGFWaWV3LnByb3RvdHlwZS5zZXRVaW50OCxcbn0pXG5cbi8vIEdvIHN0b3JlcyBpbnQ4IHdpdGggcGFkZGluZyBiZWNhdXNlIG1pbmltYWwgc3VwcG9ydGVkIGRhdGEgdHlwZSBieSBhc3NlbWJseSBpcyB1aW50MzIuXG5leHBvcnQgY29uc3QgVWludDggPSBuZXcgRGF0YVZpZXdhYmxlVHlwZVNwZWMoJ3VpbnQ4JywgMSwgMSwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRVaW50OCxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICB3cml0ZTogRGF0YVZpZXcucHJvdG90eXBlLnNldFVpbnQ4LFxufSlcblxuZXhwb3J0IGNvbnN0IEludDggPSBuZXcgRGF0YVZpZXdhYmxlVHlwZVNwZWMoJ2ludDgnLCAxLCAxLCAzLCB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgcmVhZDogRGF0YVZpZXcucHJvdG90eXBlLmdldEludDgsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgd3JpdGU6IERhdGFWaWV3LnByb3RvdHlwZS5zZXRJbnQ4LFxufSlcblxuZXhwb3J0IGNvbnN0IFVpbnQzMiA9IG5ldyBEYXRhVmlld2FibGVUeXBlU3BlYygndWludDMyJywgNCwgNCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRVaW50MzIsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgd3JpdGU6IERhdGFWaWV3LnByb3RvdHlwZS5zZXRVaW50MzIsXG59KVxuXG5leHBvcnQgY29uc3QgSW50MzIgPSBuZXcgRGF0YVZpZXdhYmxlVHlwZVNwZWMoJ2ludDMyJywgNCwgNCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRJbnQzMixcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICB3cml0ZTogRGF0YVZpZXcucHJvdG90eXBlLnNldEludDMyLFxufSlcblxuLy8gRklYTUU6IHJlcGxhY2UgQmlnSW50IGRlY29kaW5nIHdpdGggbWFudWFsXG5leHBvcnQgY29uc3QgVWludDY0ID0gbmV3IERhdGFWaWV3YWJsZVR5cGVTcGVjKCd1aW50NjQnLCA4LCA4LCAwLCB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2RcbiAgcmVhZDogRGF0YVZpZXcucHJvdG90eXBlLmdldEJpZ1VpbnQ2NCxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC91bmJvdW5kLW1ldGhvZFxuICB3cml0ZTogRGF0YVZpZXcucHJvdG90eXBlLnNldEJpZ1VpbnQ2NCxcbn0pXG5cbmV4cG9ydCBjb25zdCBGbG9hdDMyID0gbmV3IERhdGFWaWV3YWJsZVR5cGVTcGVjKCdmbG9hdDMyJywgNCwgNCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRGbG9hdDMyLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHdyaXRlOiBEYXRhVmlldy5wcm90b3R5cGUuc2V0RmxvYXQzMixcbn0pXG5cbmV4cG9ydCBjb25zdCBGbG9hdDY0ID0gbmV3IERhdGFWaWV3YWJsZVR5cGVTcGVjKCdmbG9hdDY0JywgOCwgOCwgMCwge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHJlYWQ6IERhdGFWaWV3LnByb3RvdHlwZS5nZXRGbG9hdDY0LFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3VuYm91bmQtbWV0aG9kXG4gIHdyaXRlOiBEYXRhVmlldy5wcm90b3R5cGUuc2V0RmxvYXQ2NCxcbn0pXG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RUeXBlU3BlYyB9IGZyb20gJy4uL3NwZWMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQXR0cmlidXRlRGVzY3JpcHRvciB7XG4gIGtleTogc3RyaW5nXG4gIHR5cGU6IEFic3RyYWN0VHlwZVNwZWNcbn1cblxuZXhwb3J0IGNsYXNzIFN0cnVjdFR5cGVTcGVjPFQgPSBvYmplY3Q+IGV4dGVuZHMgQWJzdHJhY3RUeXBlU3BlYyB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJpYnV0ZXM6IEF0dHJpYnV0ZURlc2NyaXB0b3JbXVxuICBwcml2YXRlIHJlYWRvbmx5IF9maXJzdEF0dHI6IEFic3RyYWN0VHlwZVNwZWNcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIG5hbWUgU3RydWN0IG5hbWVcbiAgICogQHBhcmFtIHtBdHRyaWJ1dGVEZXNjcmlwdG9yW119IGF0dHJzIGF0dHJpYnV0ZSBkZXNjcmlwdG9yc1xuICAgKi9cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhdHRyczogQXR0cmlidXRlRGVzY3JpcHRvcltdKSB7XG4gICAgc3VwZXIobmFtZSwgMCwgMCwgMClcblxuICAgIGlmIChhdHRycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBtaXNzaW5nIHN0cnVjdCBhdHRyaWJ1dGVzYClcbiAgICB9XG5cbiAgICBjb25zdCBbZmlyc3RFbGVtXSA9IGF0dHJzXG4gICAgY29uc3QgdG90YWxTaXplID0gYXR0cnMubWFwKCh7IHR5cGUgfSkgPT4gdHlwZS5zaXplICsgdHlwZS5wYWRkaW5nKS5yZWR1Y2UoKHRvdGFsLCBzaXplKSA9PiB0b3RhbCArIHNpemUsIDApXG5cbiAgICB0aGlzLnNldFR5cGVEZXNjcmlwdG9yKHtcbiAgICAgIHNpemU6IHRvdGFsU2l6ZSxcbiAgICAgIGFsaWdubWVudDogZmlyc3RFbGVtLnR5cGUuYWxpZ25tZW50LFxuICAgICAgcGFkZGluZzogMCxcbiAgICB9KVxuXG4gICAgdGhpcy5fYXR0cmlidXRlcyA9IGF0dHJzXG4gICAgdGhpcy5fZmlyc3RBdHRyID0gZmlyc3RFbGVtLnR5cGVcbiAgfVxuXG4gIGdldCBhbGlnbm1lbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpcnN0QXR0ci5hbGlnbm1lbnRcbiAgfVxuXG4gIGFsaWduQWRkcmVzcyhhZGRyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpcnN0QXR0ci5hbGlnbkFkZHJlc3MoYWRkcilcbiAgfVxuXG4gIHJlYWQodmlldywgYWRkciwgYnVmZjogQXJyYXlCdWZmZXJMaWtlKSB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2ZpcnN0QXR0ci5hbGlnbkFkZHJlc3MoYWRkcilcbiAgICBsZXQgb2Zmc2V0ID0gYWRkcmVzc1xuXG4gICAgY29uc3QgZW50cmllczogQXJyYXk8W3N0cmluZywgYW55XT4gPSBbXVxuICAgIGZvciAoY29uc3QgYXR0ciBvZiB0aGlzLl9hdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCB7IGtleSwgdHlwZSB9ID0gYXR0clxuICAgICAgY29uc3QgZmllbGRBZGRyID0gdHlwZS5hbGlnbkFkZHJlc3Mob2Zmc2V0KVxuICAgICAgY29uc3QgeyB2YWx1ZSwgZW5kT2Zmc2V0IH0gPSB0eXBlLnJlYWQodmlldywgZmllbGRBZGRyLCBidWZmKVxuICAgICAgZW50cmllcy5wdXNoKFtrZXksIHZhbHVlXSlcbiAgICAgIG9mZnNldCA9IGVuZE9mZnNldFxuICAgIH1cblxuICAgIGNvbnN0IHN0cnVjdE9iaiA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzKSBhcyBUXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZHJlc3MsXG4gICAgICBlbmRPZmZzZXQ6IG9mZnNldCxcbiAgICAgIHZhbHVlOiB0aGlzLnZhbHVlRnJvbVN0cnVjdChidWZmLCBzdHJ1Y3RPYmopLFxuICAgIH1cbiAgfVxuXG4gIHdyaXRlKHZpZXcsIGFkZHIsIHZhbCwgYnVmZjogQXJyYXlCdWZmZXJMaWtlKSB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2ZpcnN0QXR0ci5hbGlnbkFkZHJlc3MoYWRkcilcbiAgICBsZXQgb2Zmc2V0ID0gYWRkcmVzc1xuICAgIGlmICh0eXBlb2YgdmFsICE9PSAnb2JqZWN0Jykge1xuICAgICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFxuICAgICAgICBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LndyaXRlOiBpbnZhbGlkIHZhbHVlIHBhc3NlZCAoJHt0eXBlb2YgdmFsfSAke3ZhbH0pLiBgICtcbiAgICAgICAgICBgVmFsdWUgc2hvdWxkIGJlIGFuIG9iamVjdCB3aXRoIGF0dHJpYnV0ZXMgKCR7dGhpcy5fYXR0cmlidXRlcy5tYXAoKGEpID0+IGEua2V5KS5qb2luKCcsICcpfSkgYCArXG4gICAgICAgICAgYChzdHJ1Y3QgJHt0aGlzLm5hbWV9KWAsXG4gICAgICApXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhdHRyIG9mIHRoaXMuX2F0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IHsga2V5LCB0eXBlIH0gPSBhdHRyXG4gICAgICBpZiAoIShrZXkgaW4gdmFsKSkge1xuICAgICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXG4gICAgICAgICAgYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfS53cml0ZTogbWlzc2luZyBvYmplY3QgcHJvcGVydHkgXCIke2tleX1cIiAoc3RydWN0ICR7dGhpcy5uYW1lfSlgLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkQWRkciA9IHR5cGUuYWxpZ25BZGRyZXNzKG9mZnNldClcbiAgICAgIGNvbnN0IHsgZW5kT2Zmc2V0IH0gPSB0eXBlLndyaXRlKHZpZXcsIGZpZWxkQWRkciwgdmFsW2tleV0sIGJ1ZmYpXG4gICAgICBvZmZzZXQgPSBlbmRPZmZzZXRcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWRkcmVzcyxcbiAgICAgIGVuZE9mZnNldDogb2Zmc2V0LFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG9yaWdpbmFsIHZhbHVlIGZyb20gc3RydWN0LlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBjYW4gYmUgb3ZlcmxvYWRlZCB0byByZXR1cm4gYW4gb3JpZ2luYWwgdmFsdWVcbiAgICogcG9pbnRlZCBieSBhbiBvcmlnaW5hbCBzdHJ1Y3QuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBvYnRhaW5pbmcgYW4gb3JpZ2luYWwgc2xpY2Ugb3Igc3RyaW5nIGNvbnRlbnRzXG4gICAqIGZyb20gYHJlZmxlY3QuU3RyaW5nSGVhZGVyYCBvciBgcmVmbGVjdC5TbGljZUhlYWRlcmAgc3RydWN0cy5cbiAgICpcbiAgICogQHBhcmFtIGJ1ZmYgUmF3IG1lbW9yeSBidWZmZXJcbiAgICogQHBhcmFtIHN0cnVjdFZhbCBvcmlnaW5hbCBzdHJ1Y3QgdmFsdWVcbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgcHJvdGVjdGVkIHZhbHVlRnJvbVN0cnVjdChidWZmOiBBcnJheUJ1ZmZlckxpa2UsIHN0cnVjdFZhbDogVCk6IGFueSB7XG4gICAgcmV0dXJuIHN0cnVjdFZhbFxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHdyaXRlKCkgaW5zdGVhZGApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmRlY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHJlYWQoKSBpbnN0ZWFkYClcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBuZXcgc3RydWN0IHR5cGVcbiAqIEBwYXJhbSBuYW1lIFN0cnVjdCB0eXBlIG5hbWVcbiAqIEBwYXJhbSBmaWVsZHMgQXJyYXkgb2YgZmllbGQgZGVmaW5pdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5leHBvcnQgY29uc3QgU3RydWN0ID0gPFQgPSBvYmplY3Q+KG5hbWU6IHN0cmluZywgZmllbGRzOiBBdHRyaWJ1dGVEZXNjcmlwdG9yW10pID0+IG5ldyBTdHJ1Y3RUeXBlU3BlYzxUPihuYW1lLCBmaWVsZHMpXG4iLCAiaW1wb3J0IHtBYnN0cmFjdFR5cGVTcGVjfSBmcm9tIFwiLi4vc3BlY1wiO1xuXG5leHBvcnQgY2xhc3MgQXJyYXlUeXBlU3BlYyBleHRlbmRzIEFic3RyYWN0VHlwZVNwZWMge1xuICBwcml2YXRlIHJlYWRvbmx5IF9lbGVtVHlwZTogQWJzdHJhY3RUeXBlU3BlY1xuICBwcml2YXRlIHJlYWRvbmx5IF9sZW5ndGggPSAwXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QWJzdHJhY3RUeXBlU3BlY30gZWxlbVR5cGUgQXJyYXkgaXRlbSB0eXBlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggQXJyYXkgc2l6ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbVR5cGUsIGxlbmd0aCkge1xuICAgIHN1cGVyKGBbJHtsZW5ndGh9XSR7ZWxlbVR5cGUubmFtZX1gLCAoZWxlbVR5cGUuc2l6ZSArIGVsZW1UeXBlLnBhZGRpbmcpICogbGVuZ3RoLCBlbGVtVHlwZS5hbGlnbm1lbnQsIDApXG5cbiAgICBpZiAobGVuZ3RoIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IGFycmF5IGl0ZW0gY291bnQgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiB6ZXJvYClcbiAgICB9XG5cbiAgICB0aGlzLl9lbGVtVHlwZSA9IGVsZW1UeXBlXG4gICAgdGhpcy5fbGVuZ3RoID0gbGVuZ3RoXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhcnJheSBlbGVtZW50IHR5cGUuXG4gICAqIEByZXR1cm5zIHtBYnN0cmFjdFR5cGVTcGVjfVxuICAgKi9cbiAgZ2V0IGVsZW1UeXBlKCkge1xuICAgIHJldHVybiB0aGlzLl9lbGVtVHlwZVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoXG4gIH1cblxuICBnZXQgYWxpZ25tZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9lbGVtVHlwZS5hbGlnbm1lbnRcbiAgfVxuXG4gIGFsaWduQWRkcmVzcyhhZGRyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhhZGRyKVxuICB9XG5cbiAgcmVhZCh2aWV3LCBhZGRyLCBidWZmKSB7XG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhhZGRyKVxuICAgIGxldCBvZmZzZXQgPSBhZGRyZXNzXG4gICAgY29uc3QgZW50cmllczogYW55W10gPSBbXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbUFkZHIgPSB0aGlzLl9lbGVtVHlwZS5hbGlnbkFkZHJlc3Mob2Zmc2V0KVxuICAgICAgY29uc3QgeyB2YWx1ZSwgZW5kT2Zmc2V0IH0gPSB0aGlzLl9lbGVtVHlwZS5yZWFkKHZpZXcsIGVsZW1BZGRyLCBidWZmKVxuICAgICAgZW50cmllcy5wdXNoKHZhbHVlKVxuICAgICAgb2Zmc2V0ID0gZW5kT2Zmc2V0XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZHJlc3MsXG4gICAgICBlbmRPZmZzZXQ6IG9mZnNldCxcbiAgICAgIHZhbHVlOiBlbnRyaWVzLFxuICAgIH1cbiAgfVxuXG4gIHdyaXRlKHZpZXcsIGFkZHIsIHZhbCwgYnVmZikge1xuICAgIGlmICh2YWwubGVuZ3RoICE9PSB0aGlzLl9sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LndyaXRlOiBhcnJheSBsZW5ndGggc2hvdWxkIGJlICR7dGhpcy5fbGVuZ3RofSAoZ290OiAke3ZhbC5sZW5ndGh9KWApXG4gICAgfVxuXG4gICAgY29uc3QgYWRkcmVzcyA9IHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhhZGRyKVxuICAgIGxldCBvZmZzZXQgPSBhZGRyZXNzXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2xlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtQWRkciA9IHRoaXMuX2VsZW1UeXBlLmFsaWduQWRkcmVzcyhvZmZzZXQpXG4gICAgICBjb25zdCB7IGVuZE9mZnNldCB9ID0gdGhpcy5fZWxlbVR5cGUud3JpdGUodmlldywgaXRlbUFkZHIsIHZhbFtpXSwgYnVmZilcbiAgICAgIG9mZnNldCA9IGVuZE9mZnNldFxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhZGRyZXNzLFxuICAgICAgZW5kT2Zmc2V0OiBvZmZzZXQsXG4gICAgfVxuICB9XG5cbiAgZW5jb2RlKHZpZXcsIGFkZHIsIHZhbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHdyaXRlKCkgaW5zdGVhZGApXG4gIH1cblxuICBkZWNvZGUodmlldywgYWRkcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmRlY29kZTogbm90IHN1cHBvcnRlZCwgdXNlIHJlYWQoKSBpbnN0ZWFkYClcbiAgfVxufVxuIiwgImltcG9ydCB7IFVpbnRQdHIsIEludCB9IGZyb20gJy4uL2Jhc2ljJ1xuaW1wb3J0IHsgU3RydWN0VHlwZVNwZWMgfSBmcm9tICcuLi9jb21wbGV4J1xuXG5leHBvcnQgY29uc3Qgc3RyaW5nRW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpXG5leHBvcnQgY29uc3Qgc3RyaW5nRGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKVxuXG5jb25zdCBzdHJpbmdTdHJ1Y3REZXNjcmlwdG9yID0gW1xuICB7IGtleTogJ2RhdGEnLCB0eXBlOiBVaW50UHRyIH0sXG4gIHsga2V5OiAnbGVuJywgdHlwZTogSW50IH0sXG5dXG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RyaW5nSGVhZGVyIHtcbiAgZGF0YTogbnVtYmVyXG4gIGxlbjogbnVtYmVyXG59XG5cbmNsYXNzIEdvU3RyaW5nVHlwZVNwZWMgZXh0ZW5kcyBTdHJ1Y3RUeXBlU3BlYzxTdHJpbmdIZWFkZXI+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoJ3N0cmluZycsIHN0cmluZ1N0cnVjdERlc2NyaXB0b3IpXG4gIH1cblxuICBwcm90ZWN0ZWQgdmFsdWVGcm9tU3RydWN0KG1lbTogQXJyYXlCdWZmZXJMaWtlLCBzdHJ1Y3RWYWw6IFN0cmluZ0hlYWRlcikge1xuICAgIGNvbnN0IHsgZGF0YSwgbGVuIH0gPSBzdHJ1Y3RWYWxcbiAgICBpZiAoIWxlbikge1xuICAgICAgcmV0dXJuICcnXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZ0RlY29kZXIuZGVjb2RlKG5ldyBEYXRhVmlldyhtZW0sIGRhdGEsIGxlbikpXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IEdvU3RyaW5nVHlwZSA9IG5ldyBHb1N0cmluZ1R5cGVTcGVjKClcbmV4cG9ydCBjb25zdCBTdHJpbmdIZWFkZXJUeXBlID0gbmV3IFN0cnVjdFR5cGVTcGVjKCdyZWZsZWN0LlN0cmluZ0hlYWRlcicsIHN0cmluZ1N0cnVjdERlc2NyaXB0b3IpXG4iLCAiaW1wb3J0IHsgR29TdHJpbmdUeXBlIH0gZnJvbSAnLi9zdHJpbmcnXG5pbXBvcnQgeyB0eXBlIEFic3RyYWN0VHlwZVNwZWMgfSBmcm9tICcuLi9zcGVjJ1xuaW1wb3J0IHsgdHlwZSBBdHRyaWJ1dGVEZXNjcmlwdG9yLCBTdHJ1Y3RUeXBlU3BlYywgQXJyYXlUeXBlU3BlYyB9IGZyb20gJy4uL2NvbXBsZXgnXG5pbXBvcnQgeyBCb29sLCBJbnQsIEludDMyLCBJbnQ2NCwgVWludCwgVWludDMyLCBVaW50NjQsIFVpbnRQdHIgfSBmcm9tICcuLi9iYXNpYydcblxuY29uc3Qgc2xpY2VIZWFkZXJBdHRyczogQXR0cmlidXRlRGVzY3JpcHRvcltdID0gW1xuICB7IGtleTogJ2RhdGEnLCB0eXBlOiBVaW50UHRyIH0sXG4gIHsga2V5OiAnbGVuJywgdHlwZTogSW50IH0sXG4gIHsga2V5OiAnY2FwJywgdHlwZTogSW50IH0sXG5dXG5cbmV4cG9ydCBjb25zdCBTbGljZUhlYWRlclR5cGUgPSBuZXcgU3RydWN0VHlwZVNwZWMoJ3JlZmxlY3QuU2xpY2VIZWFkZXInLCBzbGljZUhlYWRlckF0dHJzKVxuXG4vKipcbiAqIFNsaWNlSGVhZGVyIHJlcHJlc2VudHMgYSBgcmVmbGVjdC5TbGljZUhlYWRlcmAgR28gc3RydWN0dXJlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNsaWNlSGVhZGVyIHtcbiAgLyoqXG4gICAqIEFycmF5IHBvaW50ZXJcbiAgICovXG4gIGRhdGE6IG51bWJlclxuXG4gIC8qKlxuICAgKiBTbGljZSBsZW5ndGhcbiAgICovXG4gIGxlbjogbnVtYmVyXG5cbiAgLyoqXG4gICAqIFNsaWNlIGNhcGFjaXR5XG4gICAqL1xuICBjYXA6IG51bWJlclxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBgW11UYCBHbyBzbGljZSBzdHJ1Y3QgcmVhZGVyLlxuICpcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgaXRlbXMgZHVyaW5nIGRlY29kZS5cbiAqL1xuY2xhc3MgU2xpY2VUeXBlU3BlYzxUID0gbnVtYmVyPiBleHRlbmRzIFN0cnVjdFR5cGVTcGVjPFNsaWNlSGVhZGVyPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZWxlbVR5cGU6IEFic3RyYWN0VHlwZVNwZWMpIHtcbiAgICBzdXBlcihgW10ke2VsZW1UeXBlLm5hbWV9YCwgc2xpY2VIZWFkZXJBdHRycylcbiAgfVxuXG4gIHByb3RlY3RlZCB2YWx1ZUZyb21TdHJ1Y3QoYnVmZjogQXJyYXlCdWZmZXJMaWtlLCBoZWFkZXI6IFNsaWNlSGVhZGVyKTogVFtdIHtcbiAgICBjb25zdCB7IGRhdGEsIGxlbiB9ID0gaGVhZGVyXG4gICAgaWYgKCFkYXRhIHx8ICFsZW4pIHtcbiAgICAgIHJldHVybiBbXSBhcyBUW11cbiAgICB9XG5cbiAgICBjb25zdCB0ID0gbmV3IEFycmF5VHlwZVNwZWModGhpcy5lbGVtVHlwZSwgbGVuKVxuICAgIGNvbnN0IHsgdmFsdWUgfSA9IHQucmVhZChuZXcgRGF0YVZpZXcoYnVmZiksIGRhdGEsIGJ1ZmYpXG4gICAgcmV0dXJuIHZhbHVlIGFzIFRbXVxuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIG5ldyBzbGljZSB0eXBlLlxuICogQHBhcmFtIGl0ZW1UeXBlIFNsaWNlIGl0ZW0gdHlwZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjb25zdCBTbGljZU9mID0gPFQgPSBudW1iZXI+KGl0ZW1UeXBlOiBBYnN0cmFjdFR5cGVTcGVjKSA9PiBuZXcgU2xpY2VUeXBlU3BlYzxUPihpdGVtVHlwZSlcblxuZXhwb3J0IGNvbnN0IFN0cmluZ1NsaWNlID0gU2xpY2VPZjxzdHJpbmc+KEdvU3RyaW5nVHlwZSlcbmV4cG9ydCBjb25zdCBJbnRTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihJbnQpXG5leHBvcnQgY29uc3QgSW50MzJTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihJbnQzMilcbmV4cG9ydCBjb25zdCBJbnQ2NFNsaWNlID0gU2xpY2VPZjxudW1iZXI+KEludDY0KVxuZXhwb3J0IGNvbnN0IFVpbnRTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihVaW50KVxuZXhwb3J0IGNvbnN0IFVpbnQzMlNsaWNlID0gU2xpY2VPZjxudW1iZXI+KFVpbnQzMilcbmV4cG9ydCBjb25zdCBVaW50NjRTbGljZSA9IFNsaWNlT2Y8bnVtYmVyPihVaW50NjQpXG5leHBvcnQgY29uc3QgVWludFB0clNsaWNlID0gU2xpY2VPZjxudW1iZXI+KFVpbnRQdHIpXG5leHBvcnQgY29uc3QgQm9vbFNsaWNlID0gU2xpY2VPZjxib29sZWFuPihCb29sKVxuIiwgImltcG9ydCB7IFNsaWNlT2YsIFN0cnVjdCwgVWludDMyLCBVaW50UHRyIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFsdWUge1xuICByZWY6IG51bWJlclxuICBnY1B0cjogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRnVuYyB7XG4gIHZhbHVlOiBWYWx1ZVxuICBpZDogbnVtYmVyXG59XG5cbi8qKlxuICogYHN5c2NhbGwvanMuVmFsdWVgIHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBWYWx1ZVR5cGUgPSBTdHJ1Y3QoJ3N5c2NhbGwvanMuVmFsdWUnLCBbXG4gIHsga2V5OiAncmVmJywgdHlwZTogVWludFB0ciB9LFxuICB7IGtleTogJ2djUHRyJywgdHlwZTogVWludFB0ciB9LFxuXSlcblxuLyoqXG4gKiBgc3lzY2FsbC9qcy5GdW5jYCB0eXBlLlxuICovXG5leHBvcnQgY29uc3QgRnVuY1R5cGUgPSBTdHJ1Y3QoJ3N5c2NhbGwvanMuRnVuYycsIFtcbiAgeyBrZXk6ICd2YWx1ZScsIHR5cGU6IFZhbHVlVHlwZSB9LFxuICB7IGtleTogJ2lkJywgdHlwZTogVWludDMyIH0sXG5dKVxuXG5leHBvcnQgY29uc3QgVmFsdWVTbGljZSA9IFNsaWNlT2Y8VmFsdWU+KFZhbHVlVHlwZSlcbiIsICJpbXBvcnQgeyBTbGljZU9mLCBVaW50MzIgfSBmcm9tICcuLi8uLi8uLi90eXBlcydcbmltcG9ydCB7IHR5cGUgSlNWYWx1ZXNUYWJsZSB9IGZyb20gJy4uLy4uLy4uL3dyYXBwZXIvaW50ZXJmYWNlJ1xuaW1wb3J0IHtBYnN0cmFjdFR5cGVTcGVjfSBmcm9tIFwiLi4vLi4vLi4vdHlwZXMvc3BlY1wiO1xuXG5leHBvcnQgY29uc3QgTkFOX0hFQUQgPSAweDdmZjgwMDAwXG5cbmVudW0gVHlwZUZsYWcge1xuICBFbXB0eSA9IDAsXG4gIE9iamVjdCA9IDEsXG4gIFN0cmluZyA9IDIsXG4gIFN5bWJvbCA9IDMsXG4gIEZ1bmN0aW9uID0gNCxcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGZ1bmN0aW9uIHR5cGUgZmxhZy5cbiAqIEBwYXJhbSB2XG4gKi9cbmNvbnN0IGdldFR5cGVGbGFnID0gKHY6IGFueSk6IFR5cGVGbGFnID0+IHtcbiAgc3dpdGNoICh0eXBlb2Ygdikge1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICByZXR1cm4gdiA9PT0gbnVsbCA/IFR5cGVGbGFnLkVtcHR5IDogVHlwZUZsYWcuT2JqZWN0XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiBUeXBlRmxhZy5TdHJpbmdcbiAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgcmV0dXJuIFR5cGVGbGFnLlN5bWJvbFxuICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgIHJldHVybiBUeXBlRmxhZy5GdW5jdGlvblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gVHlwZUZsYWcuRW1wdHlcbiAgfVxufVxuXG4vKipcbiAqIFJlZktpbmQgaXMgUmVmIHR5cGUuXG4gKi9cbmV4cG9ydCBlbnVtIFJlZktpbmQge1xuICAvKipcbiAgICogSW52YWxpZCByZWZcbiAgICovXG4gIEludmFsaWQsXG5cbiAgLyoqXG4gICAqIExpdGVyYWwgdmFsdWVcbiAgICovXG4gIFZhbHVlLFxuXG4gIC8qKlxuICAgKiBSZWZlcmVuY2UgdG8gdmFsdWVzIHRhYmxlXG4gICAqL1xuICBJRCxcbn1cblxuLyoqXG4gKiBSZWYgaXMgd3JhcHBlciB0eXBlIGFyb3VuZCBgc3lzY2FsbC9qcy5yZWZgIHZhbHVlLlxuICpcbiAqIGBqcy5yZWZgIGlzIGEgcG9pbnRlciB0byBKYXZhU2NyaXB0IHZhbHVlIHJlZ2lzdGVyZWRcbiAqIGluIEdvIHZhbHVlcyBtYXBwaW5nIHRhYmxlIChgR28uX3ZhbHVlc2ApLlxuICovXG5leHBvcnQgY2xhc3MgUmVmIHtcbiAgLyoqXG4gICAqIFJlZiBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ga2luZCBSZWZlcmVuY2Ugc291cmNlIHR5cGUsIHVzZWQgdG8gZGVjb2RlIEpTIHZhbHVlIGZyb20gcmVmZXJlbmNlLlxuICAgKiBAcGFyYW0gcmVmIFJlZmVyZW5jZSBJRFxuICAgKiBAcGFyYW0gZGF0YSBFeHRyYSBkYXRhIGZvciB3cml0ZSBvbiBlbmNvZGUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogUmVmS2luZCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOiBudW1iZXIgPSAtMSxcbiAgICBwdWJsaWMgcmVhZG9ubHkgZGF0YT86IG51bWJlcltdLFxuICApIHt9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZXNvbHZlZCBKUyB2YWx1ZSBmcm9tIHJlZi5cbiAgICogQHBhcmFtIHZhbHVlcyBWYWx1ZXMgdGFibGVcbiAgICovXG4gIHRvVmFsdWUodmFsdWVzOiBKU1ZhbHVlc1RhYmxlKSB7XG4gICAgc3dpdGNoICh0aGlzLmtpbmQpIHtcbiAgICAgIGNhc2UgUmVmS2luZC5JRDpcbiAgICAgICAgcmV0dXJuIHZhbHVlc1t0aGlzLnJlZl1cbiAgICAgIGNhc2UgUmVmS2luZC5WYWx1ZTpcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgd3JpdGFibGUgUmVmIGZyb20gdmFsdWUgYW5kIHJlZiBJRC5cbiAgICpcbiAgICogQHBhcmFtIHYgVmFsdWVcbiAgICogQHBhcmFtIHZhbElkIFJlZiBJRFxuICAgKi9cbiAgc3RhdGljIGZyb21WYWx1ZSh2OiBFeGNsdWRlPGFueSwgUmVmPiwgdmFsSWQ6IG51bWJlcikge1xuICAgIC8vIENvcGllZCBmcm9tIGBzdG9yZVZhbHVlYC5cbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWYuZnJvbVZhbHVlOiB2YWx1ZSBpcyBhbHJlYWR5IGEgUmVmICgke3YucmVmfSlgKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicgJiYgdiAhPT0gMCkge1xuICAgICAgLy8gU2VlOiBzdG9yZVZhbHVlIC0gd2FzbV9leGVjLmpzOjEyOVxuICAgICAgY29uc3Qga2luZCA9IGlzTmFOKHYpID8gUmVmS2luZC5JRCA6IFJlZktpbmQuVmFsdWVcbiAgICAgIHJldHVybiBuZXcgUmVmKGtpbmQsIHZhbElkLCBpc05hTih2KSA/IFswLCBOQU5fSEVBRF0gOiBbdl0pXG4gICAgfVxuXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG5ldyBSZWYoUmVmS2luZC5WYWx1ZSwgdmFsSWQsIFswXSlcbiAgICB9XG5cbiAgICBjb25zdCB0eXBlRmxhZyA9IGdldFR5cGVGbGFnKHYpXG4gICAgY29uc3QgaGVhZCA9IE5BTl9IRUFEIHwgdHlwZUZsYWdcbiAgICByZXR1cm4gbmV3IFJlZihSZWZLaW5kLklELCB2YWxJZCwgW3ZhbElkLCBoZWFkXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBvcnRzIHdoZW5ldmVyIHZhbHVlIHNob3VsZCBiZSByZWZlcmVuY2VkXG4gICAqIGJ5IHZhbHVlcyB0YWJsZSBvciBjYW4gYmUgc3RvcmVkIGFzIFJlZiB2YWx1ZS5cbiAgICpcbiAgICogVXNlZCBieSB3cml0ZXIgdG8gZGVjaWRlIGlmIG5lY2Vzc2FyeSB0byBhbGxvY2F0ZVxuICAgKiBhIG5ldyByZWYgaWQgb3Igbm90LlxuICAgKlxuICAgKiBAcGFyYW0gdlxuICAgKi9cbiAgc3RhdGljIGlzUmVmZXJlbmNlYWJsZVZhbHVlKHY6IEV4Y2x1ZGU8YW55LCBSZWY+KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSAnbnVtYmVyJyAmJiB2ICE9PSAwKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkXG4gIH1cbn1cblxuY2xhc3MgUmVmVHlwZVNwZWMgZXh0ZW5kcyBBYnN0cmFjdFR5cGVTcGVjPFJlZj4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignc3lzY2FsbC5qcy9yZWYnLCA4LCA4LCAwKVxuICB9XG5cbiAgZGVjb2RlKHZpZXcsIGFkZHIpOiBSZWYge1xuICAgIGNvbnN0IHZhbHVlID0gdmlldy5nZXRGbG9hdDY0KGFkZHIsIHRydWUpXG4gICAgaWYgKHZhbHVlID09PSAwKSB7XG4gICAgICByZXR1cm4gbmV3IFJlZihSZWZLaW5kLkludmFsaWQpXG4gICAgfVxuXG4gICAgaWYgKCFpc05hTih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBuZXcgUmVmKFJlZktpbmQuVmFsdWUsIHZhbHVlKVxuICAgIH1cblxuICAgIGNvbnN0IGlkID0gdmlldy5nZXRVaW50MzIoYWRkciwgdHJ1ZSlcbiAgICByZXR1cm4gbmV3IFJlZihSZWZLaW5kLklELCBpZClcbiAgfVxuXG4gIGVuY29kZSh2aWV3OiBEYXRhVmlldywgYWRkcjogbnVtYmVyLCByZWY6IFJlZikge1xuICAgIGlmICghcmVmLmRhdGE/Lmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogUmVmIHZhbHVlIGlzIG5vdCB3cml0YWJsZS4gYCArXG4gICAgICAgICAgYFJlZiBzaG91bGQgYmUgY3JlYXRlZCB1c2luZyBSZWYuZnJvbVZhbHVlKCkgbWV0aG9kLmAsXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gU2VlOiBzdG9yZVZhbHVlIC0gd2FzbV9leGVjLmpzOjE0MFxuICAgIGNvbnN0IFtoaWdoLCBsb3ddID0gcmVmLmRhdGFcbiAgICBzd2l0Y2ggKHJlZi5kYXRhLmxlbmd0aCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICB2aWV3LnNldEZsb2F0NjQoYWRkciwgaGlnaCwgdHJ1ZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICBjYXNlIDI6XG4gICAgICAgIHZpZXcuc2V0VWludDMyKGFkZHIsIGhpZ2gsIHRydWUpXG4gICAgICAgIHZpZXcuc2V0VWludDMyKGFkZHIgKyBVaW50MzIuc2l6ZSwgbG93LCB0cnVlKVxuICAgICAgICByZXR1cm5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9LmVuY29kZTogaW52YWxpZCBSZWYgZGF0YSBzaXplOiAke3JlZi5kYXRhLmxlbmd0aH1gKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgUmVmVHlwZSA9IG5ldyBSZWZUeXBlU3BlYygpXG5leHBvcnQgY29uc3QgUmVmU2xpY2UgPSBTbGljZU9mPFJlZj4oUmVmVHlwZSlcbiIsICJpbXBvcnQgdHlwZSAqIGFzIG1vbmFjbyBmcm9tICdtb25hY28tZWRpdG9yJ1xuaW1wb3J0ICcuLi9saWIvZ28vd2FzbV9leGVjLmpzJ1xuaW1wb3J0IHtpbnN0YW50aWF0ZVN0cmVhbWluZ30gZnJvbSBcIi4uL2xpYi9nb1wiO1xuXG5leHBvcnQgY29uc3QgZ2V0V2FzbVVybCA9IChuYW1lKSA9PiBgL2Rpc3QvJHtuYW1lfUB2MS53YXNtYFxuXG50eXBlIEpTT05DYWxsYmFjayA9IChyc3A6IHN0cmluZykgPT4gdm9pZFxudHlwZSBDYWxsQXJncyA9IFsuLi5hbnlbXSwgSlNPTkNhbGxiYWNrXVxuXG5pbnRlcmZhY2UgR29Nb2R1bGUge1xuICBhbmFseXplQ29kZTogKGNvZGU6IHN0cmluZywgY2I6IEpTT05DYWxsYmFjaykgPT4gdm9pZFxuICBydW5Db2RlOiAoY29kZTogc3RyaW5nLCBjYjogSlNPTkNhbGxiYWNrKSA9PiB2b2lkXG4gIGV4aXQ6ICgpID0+IHZvaWRcbn1cblxuaW50ZXJmYWNlIEFuYWx5emVSZXN1bHQge1xuICBoYXNFcnJvcnM6IGJvb2xlYW5cbiAgbWFya2VyczogbW9uYWNvLmVkaXRvci5JTWFya2VyRGF0YVtdIHwgbnVsbFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlUmVxdWVzdCB7XG4gIGNvbnRlbnRzOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZVJlc3BvbnNlIHtcbiAgZXJyb3I6IHN0cmluZ1xuICBmdW5jdGlvbnM6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuUmVxdWVzdCB7XG4gIGZ1bmM6IHN0cmluZ1xuICBjb2RlOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW5SZXNwb25zZSB7XG4gIG91dHB1dDogc3RyaW5nXG4gIGVycm9yOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBXcmFwcGVkR29Nb2R1bGUge1xuICBhbmFseXplQ29kZTogKGNvZGU6IHN0cmluZykgPT4gUHJvbWlzZTxBbmFseXplUmVzdWx0PlxuICBydW5Db2RlOiAocjogUnVuUmVxdWVzdCkgPT4gUHJvbWlzZTxSdW5SZXNwb25zZT5cbiAgcGFyc2VDb2RlOiAoY29kZTogc3RyaW5nKSA9PiBQcm9taXNlPFBhcnNlUmVzcG9uc2U+XG4gIGV4aXQ6ICgpID0+IFByb21pc2U8dm9pZD5cbn1cblxuaW50ZXJmYWNlIEdvUmVzcG9uc2U8VCA9IGFueT4ge1xuICBlcnJvcjogc3RyaW5nXG4gIHJlc3VsdDogVFxufVxuXG5jb25zdCB3cmFwTW9kdWxlID0gKG1vZDogR29Nb2R1bGUpID0+IHtcbiAgY29uc3Qgd3JhcHBlZCA9IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlbGVzcy1jYWxsXG4gICAgZXhpdDogKCkgPT4gbW9kLmV4aXQuY2FsbChtb2QpLFxuICB9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWFyZ3VtZW50XG4gIE9iamVjdC5rZXlzKG1vZClcbiAgICAuZmlsdGVyKChrKSA9PiBrICE9PSAnZXhpdCcpXG4gICAgLmZvckVhY2goKGZuTmFtZSkgPT4ge1xuICAgICAgd3JhcHBlZFtmbk5hbWVdID0gYXN5bmMgKC4uLmFyZ3MpID0+XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBjYiA9IChyYXdSZXNwKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCByZXNwOiBHb1Jlc3BvbnNlID0gSlNPTi5wYXJzZShyYXdSZXNwKVxuICAgICAgICAgICAgICBpZiAocmVzcC5lcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYCR7Zm5OYW1lfTogJHtyZXNwLmVycm9yfWApKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwLnJlc3VsdClcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFuYWx5emVyOiBcIiR7Zm5OYW1lfVwiIHJldHVybmVkIGFuZCBlcnJvcmAsIGV4KVxuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGAke2ZuTmFtZX06ICR7ZXh9YCkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbmV3QXJncyA9IGFyZ3MuY29uY2F0KGNiKSBhcyBDYWxsQXJnc1xuICAgICAgICAgIG1vZFtmbk5hbWVdLmFwcGx5KHNlbGYsIG5ld0FyZ3MpXG4gICAgICAgIH0pXG4gICAgfSlcbiAgcmV0dXJuIHdyYXBwZWQgYXMgV3JhcHBlZEdvTW9kdWxlXG59XG5cbmV4cG9ydCBjb25zdCBzdGFydEFuYWx5emVyID0gYXN5bmMgKCk6IFByb21pc2U8V3JhcHBlZEdvTW9kdWxlPiA9PiB7XG4gIGNvbnN0IHdvcmtlclVybCA9IGdldFdhc21VcmwoJ2FuYWx5emVyJylcbiAgY29uc3QgZ28gPSBuZXcgZ2xvYmFsVGhpcy5HbygpXG5cbiAgLy8gUGFzcyB0aGUgZW50cnlwb2ludCB2aWEgYXJndi5cbiAgZ28uYXJndiA9IFsnanMnLCAnb25Nb2R1bGVJbml0J11cblxuICBjb25zdCByc3AgPSBhd2FpdCBmZXRjaCh3b3JrZXJVcmwpXG4gIGlmICghcnNwLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggd29ya2VyOiAke3JzcC5zdGF0dXN9ICR7cnNwLnN0YXR1c1RleHR9YClcbiAgfVxuXG4gIGNvbnN0IHsgaW5zdGFuY2UgfSA9IGF3YWl0IGluc3RhbnRpYXRlU3RyZWFtaW5nKHJzcCwgZ28uaW1wb3J0T2JqZWN0KVxuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIC8vIEhvb2sgY2FsbGVkIGJ5IEdvIHByb2dyYW1cbiAgICBnbG9iYWxUaGlzLm9uTW9kdWxlSW5pdCA9IChnb01vZDogR29Nb2R1bGUpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdhbmFseXplcjogc3RhcnRlZCcpXG4gICAgICBjb25zdCB3cmFwcGVkID0gd3JhcE1vZHVsZShnb01vZClcbiAgICAgIHJldHVybiByZXNvbHZlKHdyYXBwZWQpXG4gICAgfVxuXG4gICAgZ28ucnVuKGluc3RhbmNlKS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgcmVqZWN0KGVycilcbiAgICB9KVxuICB9KVxufVxuIiwgImltcG9ydCAqIGFzIENvbWxpbmsgZnJvbSAnY29tbGluaydcbmltcG9ydCB7dHlwZSBXcmFwcGVkR29Nb2R1bGUsIHN0YXJ0QW5hbHl6ZXIsIFJ1blJlcXVlc3QsIFJ1blJlc3BvbnNlLCBQYXJzZVJlcXVlc3QsIFBhcnNlUmVzcG9uc2V9IGZyb20gJy4vYm9vdHN0cmFwJ1xuaW1wb3J0IHR5cGUgKiBhcyBtb25hY28gZnJvbSAnbW9uYWNvLWVkaXRvcidcblxuZXhwb3J0IGludGVyZmFjZSBBbmFseXplUmVxdWVzdCB7XG4gIGZpbGVOYW1lOiBzdHJpbmdcbiAgY29udGVudHM6IHN0cmluZ1xuICBtb2RlbFZlcnNpb25JZDogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5hbHl6ZVJlc3BvbnNlIHtcbiAgZmlsZU5hbWU6IHN0cmluZ1xuICBtb2RlbFZlcnNpb25JZDogbnVtYmVyXG4gIG1hcmtlcnM6IG1vbmFjby5lZGl0b3IuSU1hcmtlckRhdGFbXSB8IG51bGxcbn1cblxuLy8gVE9ETzogcmVmYWN0b3IgdGhpcyB0b2dldGhlciB3aXRoIHRoZSBHbyB3b3JrZXIgQVBJXG5cbmNvbnN0IGFwcGVuZE1vZGVsVmVyc2lvbiA9IChtYXJrZXJzOiBBbmFseXplUmVzcG9uc2VbJ21hcmtlcnMnXSwgbW9kZWxWZXJzaW9uSWQ6IG51bWJlcikgPT4ge1xuICBpZiAoIW1hcmtlcnMpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIG1hcmtlcnMubWFwKChtYXJrZXIpID0+ICh7IC4uLm1hcmtlciwgbW9kZWxWZXJzaW9uSWQgfSkpXG59XG5cbmV4cG9ydCBjbGFzcyBXb3JrZXJIYW5kbGVyIHtcbiAgcHJpdmF0ZSBtb2Q/OiBXcmFwcGVkR29Nb2R1bGVcbiAgcHJpdmF0ZSByZWFkb25seSBpbml0UHJvbWlzZSA9IHN0YXJ0QW5hbHl6ZXIoKVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0TW9kdWxlKCkge1xuICAgIHRoaXMubW9kID8/PSBhd2FpdCB0aGlzLmluaXRQcm9taXNlXG4gICAgcmV0dXJuIHRoaXMubW9kXG4gIH1cblxuICBhc3luYyBydW5Db2RlKHI6IFJ1blJlcXVlc3QpOiBQcm9taXNlPFJ1blJlc3BvbnNlPiB7XG4gICAgY29uc3QgbW9kID0gYXdhaXQgdGhpcy5nZXRNb2R1bGUoKVxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBtb2QucnVuQ29kZShyKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvdXRwdXQ6ICcnLFxuICAgICAgICAgIGVycm9yOiBlLnRvU3RyaW5nKCksXG4gICAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBwYXJzZUNvZGUoeyBjb250ZW50cyB9OiBQYXJzZVJlcXVlc3QpOiBQcm9taXNlPFBhcnNlUmVzcG9uc2U+IHtcbiAgICBjb25zdCBtb2QgPSBhd2FpdCB0aGlzLmdldE1vZHVsZSgpXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IG1vZC5wYXJzZUNvZGUoY29udGVudHMpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVycm9yOiBlLnRvU3RyaW5nKCksXG4gICAgICAgICAgZnVuY3Rpb25zOiBbXSxcbiAgICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNoZWNrU3ludGF4RXJyb3JzKHsgZmlsZU5hbWUsIG1vZGVsVmVyc2lvbklkLCBjb250ZW50cyB9OiBBbmFseXplUmVxdWVzdCk6IFByb21pc2U8QW5hbHl6ZVJlc3BvbnNlPiB7XG4gICAgY29uc3QgbW9kID0gYXdhaXQgdGhpcy5nZXRNb2R1bGUoKVxuICAgIGNvbnN0IHsgbWFya2VycyB9ID0gYXdhaXQgbW9kLmFuYWx5emVDb2RlKGNvbnRlbnRzKVxuICAgIHJldHVybiB7XG4gICAgICBmaWxlTmFtZSxcbiAgICAgIG1vZGVsVmVyc2lvbklkLFxuICAgICAgbWFya2VyczogYXBwZW5kTW9kZWxWZXJzaW9uKG1hcmtlcnMsIG1vZGVsVmVyc2lvbklkKSxcbiAgICB9XG4gIH1cbn1cblxuQ29tbGluay5leHBvc2UobmV3IFdvcmtlckhhbmRsZXIoKSlcbiJdLAogICJtYXBwaW5ncyI6ICI7SUFpQmEsY0FBYyxPQUFPLGVBQWU7SUFDcEMsaUJBQWlCLE9BQU8sa0JBQWtCO0lBQzFDLGVBQWUsT0FBTyxzQkFBc0I7SUFDNUMsWUFBWSxPQUFPLG1CQUFtQjtBQUVuRCxJQUFNLGNBQWMsT0FBTyxnQkFBZ0I7QUF1SjNDLElBQU0sV0FBVyxDQUFDLFFBQ2YsT0FBTyxRQUFRLFlBQVksUUFBUSxRQUFTLE9BQU8sUUFBUTtBQWtDOUQsSUFBTSx1QkFBNkQ7RUFDakUsV0FBVyxDQUFDLFFBQ1YsU0FBUyxHQUFHLEtBQU0sSUFBb0IsV0FBVztFQUNuRCxVQUFVLEtBQUc7QUFDWCxVQUFNLEVBQUUsT0FBTyxNQUFLLElBQUssSUFBSSxl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
