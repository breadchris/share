(() => {
  // node_modules/plain-draggable/node_modules/anim-event/anim-event.esm.js
  var MSPF = 1e3 / 60;
  var KEEP_LOOP = 500;
  var tasks = [];
  var requestAnim = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
    return setTimeout(callback, MSPF);
  };
  var cancelAnim = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(requestID2) {
    return clearTimeout(requestID2);
  };
  var lastFrameTime = Date.now();
  var requestID;
  function step() {
    var called, next;
    if (requestID) {
      cancelAnim.call(window, requestID);
      requestID = null;
    }
    tasks.forEach(function(task) {
      var event;
      if (event = task.event) {
        task.event = null;
        task.listener(event);
        called = true;
      }
    });
    if (called) {
      lastFrameTime = Date.now();
      next = true;
    } else if (Date.now() - lastFrameTime < KEEP_LOOP) {
      next = true;
    }
    if (next) {
      requestID = requestAnim.call(window, step);
    }
  }
  function indexOfTasks(listener) {
    var index = -1;
    tasks.some(function(task, i) {
      if (task.listener === listener) {
        index = i;
        return true;
      }
      return false;
    });
    return index;
  }
  var AnimEvent = {
    /**
     * @param {function} listener - An event listener.
     * @returns {(function|null)} A wrapped event listener.
     */
    add: function add(listener) {
      var task;
      if (indexOfTasks(listener) === -1) {
        tasks.push(task = {
          listener
        });
        return function(event) {
          task.event = event;
          if (!requestID) {
            step();
          }
        };
      }
      return null;
    },
    remove: function remove(listener) {
      var iRemove;
      if ((iRemove = indexOfTasks(listener)) > -1) {
        tasks.splice(iRemove, 1);
        if (!tasks.length && requestID) {
          cancelAnim.call(window, requestID);
          requestID = null;
        }
      }
    }
  };
  var anim_event_esm_default = AnimEvent;

  // node_modules/plain-draggable/node_modules/pointer-event/pointer-event.esm.js
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  var MOUSE_EMU_INTERVAL = 400;
  var CLICK_EMULATOR_ELEMENTS = [];
  var DBLCLICK_EMULATOR_ELEMENTS = [];
  var passiveSupported = false;
  try {
    window.addEventListener("test", null, Object.defineProperty({}, "passive", {
      get: function get() {
        passiveSupported = true;
      }
    }));
  } catch (error) {
  }
  function addEventListenerWithOptions(target, type, listener, options) {
    target.addEventListener(type, listener, passiveSupported ? options : options.capture);
  }
  function getPointsLength(p0, p1) {
    var lx = p0.x - p1.x, ly = p0.y - p1.y;
    return Math.sqrt(lx * lx + ly * ly);
  }
  function getTouchById(touches, id) {
    if (touches != null && id != null) {
      for (var i = 0; i < touches.length; i++) {
        if (touches[i].identifier === id) {
          return touches[i];
        }
      }
    }
    return null;
  }
  function hasXY(xy) {
    return xy && typeof xy.clientX === "number" && typeof xy.clientY === "number";
  }
  function dragstart(event) {
    event.preventDefault();
  }
  var PointerEvent = /* @__PURE__ */ function() {
    function PointerEvent2(options) {
      var _this = this;
      _classCallCheck(this, PointerEvent2);
      this.startHandlers = {};
      this.lastHandlerId = 0;
      this.curPointerClass = null;
      this.curTouchId = null;
      this.lastPointerXY = {
        clientX: 0,
        clientY: 0
      };
      this.lastTouchTime = 0;
      this.options = {
        // Default
        preventDefault: true,
        stopPropagation: true
      };
      if (options) {
        ["preventDefault", "stopPropagation"].forEach(function(option) {
          if (typeof options[option] === "boolean") {
            _this.options[option] = options[option];
          }
        });
      }
    }
    _createClass(PointerEvent2, [{
      key: "regStartHandler",
      value: function regStartHandler(startHandler) {
        var that = this;
        that.startHandlers[++that.lastHandlerId] = function(event) {
          var pointerClass = event.type === "mousedown" ? "mouse" : "touch", now = Date.now();
          var pointerXY, touchId;
          if (pointerClass === "touch") {
            that.lastTouchTime = now;
            pointerXY = event.changedTouches[0];
            touchId = event.changedTouches[0].identifier;
          } else {
            if (now - that.lastTouchTime < MOUSE_EMU_INTERVAL) {
              return;
            }
            pointerXY = event;
          }
          if (!hasXY(pointerXY)) {
            throw new Error("No clientX/clientY");
          }
          if (that.curPointerClass) {
            that.cancel();
          }
          if (startHandler.call(that, pointerXY)) {
            that.curPointerClass = pointerClass;
            that.curTouchId = pointerClass === "touch" ? touchId : null;
            that.lastPointerXY.clientX = pointerXY.clientX;
            that.lastPointerXY.clientY = pointerXY.clientY;
            if (that.options.preventDefault) {
              event.preventDefault();
            }
            if (that.options.stopPropagation) {
              event.stopPropagation();
            }
          }
        };
        return that.lastHandlerId;
      }
      /**
       * @param {number} handlerId - An ID which was returned by regStartHandler.
       * @returns {void}
       */
    }, {
      key: "unregStartHandler",
      value: function unregStartHandler(handlerId) {
        delete this.startHandlers[handlerId];
      }
      /**
       * @param {Element} element - A target element.
       * @param {number} handlerId - An ID which was returned by regStartHandler.
       * @returns {number} handlerId which was passed.
       */
    }, {
      key: "addStartHandler",
      value: function addStartHandler(element, handlerId) {
        if (!this.startHandlers[handlerId]) {
          throw new Error("Invalid handlerId: ".concat(handlerId));
        }
        addEventListenerWithOptions(element, "mousedown", this.startHandlers[handlerId], {
          capture: false,
          passive: false
        });
        addEventListenerWithOptions(element, "touchstart", this.startHandlers[handlerId], {
          capture: false,
          passive: false
        });
        addEventListenerWithOptions(element, "dragstart", dragstart, {
          capture: false,
          passive: false
        });
        return handlerId;
      }
      /**
       * @param {Element} element - A target element.
       * @param {number} handlerId - An ID which was returned by regStartHandler.
       * @returns {number} handlerId which was passed.
       */
    }, {
      key: "removeStartHandler",
      value: function removeStartHandler(element, handlerId) {
        if (!this.startHandlers[handlerId]) {
          throw new Error("Invalid handlerId: ".concat(handlerId));
        }
        element.removeEventListener("mousedown", this.startHandlers[handlerId], false);
        element.removeEventListener("touchstart", this.startHandlers[handlerId], false);
        element.removeEventListener("dragstart", dragstart, false);
        return handlerId;
      }
      /**
       * @param {Element} element - A target element.
       * @param {function} moveHandler - This is called with pointerXY when it moves.
       * @param {?boolean} rawEvent - Capture events without `requestAnimationFrame`.
       * @returns {void}
       */
    }, {
      key: "addMoveHandler",
      value: function addMoveHandler(element, moveHandler, rawEvent) {
        var that = this;
        function handler(event) {
          var pointerClass = event.type === "mousemove" ? "mouse" : "touch";
          if (pointerClass === "touch") {
            that.lastTouchTime = Date.now();
          }
          if (pointerClass === that.curPointerClass) {
            var pointerXY = pointerClass === "touch" ? getTouchById(event.changedTouches, that.curTouchId) : event;
            if (hasXY(pointerXY)) {
              if (pointerXY.clientX !== that.lastPointerXY.clientX || pointerXY.clientY !== that.lastPointerXY.clientY) {
                that.move(pointerXY);
              }
              if (that.options.preventDefault) {
                event.preventDefault();
              }
              if (that.options.stopPropagation) {
                event.stopPropagation();
              }
            }
          }
        }
        var wrappedHandler = rawEvent ? handler : anim_event_esm_default.add(handler);
        addEventListenerWithOptions(element, "mousemove", wrappedHandler, {
          capture: false,
          passive: false
        });
        addEventListenerWithOptions(element, "touchmove", wrappedHandler, {
          capture: false,
          passive: false
        });
        that.curMoveHandler = moveHandler;
      }
      /**
       * @param {{clientX, clientY}} [pointerXY] - This might be MouseEvent, Touch of TouchEvent or Object.
       * @returns {void}
       */
    }, {
      key: "move",
      value: function move2(pointerXY) {
        if (hasXY(pointerXY)) {
          this.lastPointerXY.clientX = pointerXY.clientX;
          this.lastPointerXY.clientY = pointerXY.clientY;
        }
        if (this.curMoveHandler) {
          this.curMoveHandler(this.lastPointerXY);
        }
      }
      /**
       * @param {Element} element - A target element.
       * @param {function} endHandler - This is called with pointerXY when it ends.
       * @returns {void}
       */
    }, {
      key: "addEndHandler",
      value: function addEndHandler(element, endHandler) {
        var that = this;
        function wrappedHandler(event) {
          var pointerClass = event.type === "mouseup" ? "mouse" : "touch";
          if (pointerClass === "touch") {
            that.lastTouchTime = Date.now();
          }
          if (pointerClass === that.curPointerClass) {
            var pointerXY = pointerClass === "touch" ? getTouchById(event.changedTouches, that.curTouchId) || // It might have been removed from `touches` even if it is not in `changedTouches`.
            (getTouchById(event.touches, that.curTouchId) ? null : {}) : (
              // `{}` means matching
              event
            );
            if (pointerXY) {
              that.end(pointerXY);
              if (that.options.preventDefault) {
                event.preventDefault();
              }
              if (that.options.stopPropagation) {
                event.stopPropagation();
              }
            }
          }
        }
        addEventListenerWithOptions(element, "mouseup", wrappedHandler, {
          capture: false,
          passive: false
        });
        addEventListenerWithOptions(element, "touchend", wrappedHandler, {
          capture: false,
          passive: false
        });
        that.curEndHandler = endHandler;
      }
      /**
       * @param {{clientX, clientY}} [pointerXY] - This might be MouseEvent, Touch of TouchEvent or Object.
       * @returns {void}
       */
    }, {
      key: "end",
      value: function end(pointerXY) {
        if (hasXY(pointerXY)) {
          this.lastPointerXY.clientX = pointerXY.clientX;
          this.lastPointerXY.clientY = pointerXY.clientY;
        }
        if (this.curEndHandler) {
          this.curEndHandler(this.lastPointerXY);
        }
        this.curPointerClass = this.curTouchId = null;
      }
      /**
       * @param {Element} element - A target element.
       * @param {function} cancelHandler - This is called when it cancels.
       * @returns {void}
       */
    }, {
      key: "addCancelHandler",
      value: function addCancelHandler(element, cancelHandler) {
        var that = this;
        function wrappedHandler(event) {
          that.lastTouchTime = Date.now();
          if (that.curPointerClass != null) {
            var pointerXY = getTouchById(event.changedTouches, that.curTouchId) || // It might have been removed from `touches` even if it is not in `changedTouches`.
            (getTouchById(event.touches, that.curTouchId) ? null : {});
            if (pointerXY) {
              that.cancel();
            }
          }
        }
        addEventListenerWithOptions(element, "touchcancel", wrappedHandler, {
          capture: false,
          passive: false
        });
        that.curCancelHandler = cancelHandler;
      }
      /**
       * @returns {void}
       */
    }, {
      key: "cancel",
      value: function cancel() {
        if (this.curCancelHandler) {
          this.curCancelHandler();
        }
        this.curPointerClass = this.curTouchId = null;
      }
    }], [{
      key: "addEventListenerWithOptions",
      get: function get() {
        return addEventListenerWithOptions;
      }
      /**
       * Emulate `click` event via `touchend` event.
       * @param {Element} element - Target element, listeners that call `event.preventDefault()` are attached later.
       * @param {?number} moveTolerance - Move tolerance.
       * @param {?number} timeTolerance - Time tolerance.
       * @returns {Element} The passed `element`.
       */
    }, {
      key: "initClickEmulator",
      value: function initClickEmulator(element, moveTolerance, timeTolerance) {
        if (CLICK_EMULATOR_ELEMENTS.includes(element)) {
          return element;
        }
        CLICK_EMULATOR_ELEMENTS.push(element);
        var DEFAULT_MOVE_TOLERANCE = 16, DEFAULT_TIME_TOLERANCE = 400;
        var startX, startY, touchId, startMs;
        if (moveTolerance == null) {
          moveTolerance = DEFAULT_MOVE_TOLERANCE;
        }
        if (timeTolerance == null) {
          timeTolerance = DEFAULT_TIME_TOLERANCE;
        }
        addEventListenerWithOptions(element, "touchstart", function(event) {
          var touch = event.changedTouches[0];
          startX = touch.clientX;
          startY = touch.clientY;
          touchId = touch.identifier;
          startMs = performance.now();
        }, {
          capture: false,
          passive: false
        });
        addEventListenerWithOptions(element, "touchend", function(event) {
          var touch = getTouchById(event.changedTouches, touchId);
          if (typeof startX === "number" && typeof startY === "number" && typeof startMs === "number" && touch && typeof touch.clientX === "number" && typeof touch.clientY === "number" && getPointsLength({
            x: startX,
            y: startY
          }, {
            x: touch.clientX,
            y: touch.clientY
          }) <= moveTolerance && performance.now() - startMs <= timeTolerance) {
            setTimeout(function() {
              var newEvent = new MouseEvent("click", {
                clientX: touch.clientX,
                clientY: touch.clientY
              });
              newEvent.emulated = true;
              element.dispatchEvent(newEvent);
            }, 0);
          }
          startX = startY = touchId = startMs = null;
        }, {
          capture: false,
          passive: false
        });
        addEventListenerWithOptions(element, "touchcancel", function() {
          startX = startY = touchId = startMs = null;
        }, {
          capture: false,
          passive: false
        });
        return element;
      }
      /**
       * Emulate `dblclick` event via `touchend` event.
       * @param {Element} element - Target element, listeners that call `event.preventDefault()` are attached later.
       * @param {?number} moveTolerance - Move tolerance.
       * @param {?number} timeTolerance - Time tolerance.
       * @returns {Element} The passed `element`.
       */
    }, {
      key: "initDblClickEmulator",
      value: function initDblClickEmulator(element, moveTolerance, timeTolerance) {
        if (DBLCLICK_EMULATOR_ELEMENTS.includes(element)) {
          return element;
        }
        DBLCLICK_EMULATOR_ELEMENTS.push(element);
        var DEFAULT_MOVE_TOLERANCE = 16, DEFAULT_TIME_TOLERANCE = 400;
        var startX, startY, startMs;
        if (moveTolerance == null) {
          moveTolerance = DEFAULT_MOVE_TOLERANCE;
        }
        if (timeTolerance == null) {
          timeTolerance = DEFAULT_TIME_TOLERANCE;
        }
        PointerEvent2.initClickEmulator(element, moveTolerance, timeTolerance);
        addEventListenerWithOptions(element, "click", function(event) {
          if (!event.emulated || // Ignore events that are not from `touchend`.
          typeof event.clientX !== "number" || typeof event.clientY !== "number") {
            return;
          }
          if (typeof startX === "number" && getPointsLength({
            x: startX,
            y: startY
          }, {
            x: event.clientX,
            y: event.clientY
          }) <= moveTolerance && performance.now() - startMs <= timeTolerance * 2) {
            setTimeout(function() {
              var newEvent = new MouseEvent("dblclick", {
                clientX: event.clientX,
                clientY: event.clientY
              });
              newEvent.emulated = true;
              element.dispatchEvent(newEvent);
            }, 0);
            startX = startY = startMs = null;
          } else {
            startX = event.clientX;
            startY = event.clientY;
            startMs = performance.now();
          }
        }, {
          capture: false,
          passive: false
        });
        return element;
      }
    }]);
    return PointerEvent2;
  }();
  var pointer_event_esm_default = PointerEvent;

  // node_modules/plain-draggable/node_modules/cssprefix/cssprefix.esm.js
  function ucf(text) {
    return text.substr(0, 1).toUpperCase() + text.substr(1);
  }
  var PREFIXES = ["webkit", "moz", "ms", "o"];
  var NAME_PREFIXES = PREFIXES.reduce(function(prefixes, prefix) {
    prefixes.push(prefix);
    prefixes.push(ucf(prefix));
    return prefixes;
  }, []);
  var VALUE_PREFIXES = PREFIXES.map(function(prefix) {
    return "-".concat(prefix, "-");
  });
  var getDeclaration = /* @__PURE__ */ function() {
    var declaration;
    return function() {
      return declaration = declaration || document.createElement("div").style;
    };
  }();
  var normalizeName = function() {
    var rePrefixedName = new RegExp("^(?:" + PREFIXES.join("|") + ")(.)", "i"), reUc = /[A-Z]/;
    return function(propName) {
      return (propName = (propName + "").replace(/\s/g, "").replace(/-([\da-z])/gi, function(str, p1) {
        return p1.toUpperCase();
      }).replace(rePrefixedName, function(str, p1) {
        return reUc.test(p1) ? p1.toLowerCase() : str;
      })).toLowerCase() === "float" ? "cssFloat" : propName;
    };
  }();
  var normalizeValue = function() {
    var rePrefixedValue = new RegExp("^(?:" + VALUE_PREFIXES.join("|") + ")", "i");
    return function(propValue) {
      return (propValue != null ? propValue + "" : "").replace(/\s/g, "").replace(rePrefixedValue, "");
    };
  }();
  var cssSupports = /* @__PURE__ */ function() {
    return (
      // return window.CSS && window.CSS.supports || ((propName, propValue) => {
      // `CSS.supports` doesn't find prefixed property.
      function(propName, propValue) {
        var declaration = getDeclaration();
        propName = propName.replace(/[A-Z]/g, function(str) {
          return "-".concat(str.toLowerCase());
        });
        declaration.setProperty(propName, propValue);
        return declaration[propName] != null && // Because getPropertyValue returns '' if it is unsupported
        declaration.getPropertyValue(propName) === propValue;
      }
    );
  }();
  var propNames = {};
  var propValues = {};
  function getName(propName) {
    propName = normalizeName(propName);
    if (propName && propNames[propName] == null) {
      var declaration = getDeclaration();
      if (declaration[propName] != null) {
        propNames[propName] = propName;
      } else {
        var ucfName = ucf(propName);
        if (!NAME_PREFIXES.some(function(prefix) {
          var prefixed = prefix + ucfName;
          if (declaration[prefixed] != null) {
            propNames[propName] = prefixed;
            return true;
          }
          return false;
        })) {
          propNames[propName] = false;
        }
      }
    }
    return propNames[propName] || void 0;
  }
  function getValue(propName, propValue) {
    var res;
    if (!(propName = getName(propName))) {
      return res;
    }
    propValues[propName] = propValues[propName] || {};
    (Array.isArray(propValue) ? propValue : [propValue]).some(function(propValue2) {
      propValue2 = normalizeValue(propValue2);
      if (propValues[propName][propValue2] != null) {
        if (propValues[propName][propValue2] !== false) {
          res = propValues[propName][propValue2];
          return true;
        }
        return false;
      }
      if (cssSupports(propName, propValue2)) {
        res = propValues[propName][propValue2] = propValue2;
        return true;
      }
      if (VALUE_PREFIXES.some(function(prefix) {
        var prefixed = prefix + propValue2;
        if (cssSupports(propName, prefixed)) {
          res = propValues[propName][propValue2] = prefixed;
          return true;
        }
        return false;
      })) {
        return true;
      }
      propValues[propName][propValue2] = false;
      return false;
    });
    return typeof res === "string" ? res : void 0;
  }
  var CSSPrefix = {
    getName,
    getValue
  };
  var cssprefix_esm_default = CSSPrefix;

  // node_modules/plain-draggable/node_modules/m-class-list/m-class-list.esm.js
  function normalize(token) {
    return (token + "").trim();
  }
  function applyList(list, element) {
    element.setAttribute("class", list.join(" "));
  }
  function _add(list, element, tokens) {
    if (tokens.filter(function(token) {
      if (!(token = normalize(token)) || list.indexOf(token) !== -1) {
        return false;
      }
      list.push(token);
      return true;
    }).length) {
      applyList(list, element);
    }
  }
  function _remove(list, element, tokens) {
    if (tokens.filter(function(token) {
      var i;
      if (!(token = normalize(token)) || (i = list.indexOf(token)) === -1) {
        return false;
      }
      list.splice(i, 1);
      return true;
    }).length) {
      applyList(list, element);
    }
  }
  function _toggle(list, element, token, force) {
    var i = list.indexOf(token = normalize(token));
    if (i !== -1) {
      if (force) {
        return true;
      }
      list.splice(i, 1);
      applyList(list, element);
      return false;
    }
    if (force === false) {
      return false;
    }
    list.push(token);
    applyList(list, element);
    return true;
  }
  function _replace(list, element, token, newToken) {
    var i;
    if (!(token = normalize(token)) || !(newToken = normalize(newToken)) || token === newToken || (i = list.indexOf(token)) === -1) {
      return;
    }
    list.splice(i, 1);
    if (list.indexOf(newToken) === -1) {
      list.push(newToken);
    }
    applyList(list, element);
  }
  function mClassList(element) {
    return !mClassList.ignoreNative && element.classList || function() {
      var list = (element.getAttribute("class") || "").trim().split(/\s+/).filter(function(token) {
        return !!token;
      }), ins = {
        length: list.length,
        item: function item(i) {
          return list[i];
        },
        contains: function contains(token) {
          return list.indexOf(normalize(token)) !== -1;
        },
        add: function add2() {
          _add(list, element, Array.prototype.slice.call(arguments));
          return mClassList.methodChain ? ins : void 0;
        },
        remove: function remove2() {
          _remove(list, element, Array.prototype.slice.call(arguments));
          return mClassList.methodChain ? ins : void 0;
        },
        toggle: function toggle(token, force) {
          return _toggle(list, element, token, force);
        },
        replace: function replace(token, newToken) {
          _replace(list, element, token, newToken);
          return mClassList.methodChain ? ins : void 0;
        }
      };
      return ins;
    }();
  }
  mClassList.methodChain = true;
  var m_class_list_esm_default = mClassList;

  // node_modules/plain-draggable/plain-draggable.esm.js
  function _classCallCheck2(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties2(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass2(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties2(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties2(Constructor, staticProps);
    return Constructor;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function _typeof2(obj2) {
        return typeof obj2;
      };
    } else {
      _typeof = function _typeof2(obj2) {
        return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
      };
    }
    return _typeof(obj);
  }
  m_class_list_esm_default.ignoreNative = true;
  var ZINDEX = 9e3;
  var SNAP_GRAVITY = 20;
  var SNAP_CORNER = "tl";
  var SNAP_SIDE = "both";
  var SNAP_EDGE = "both";
  var SNAP_BASE = "containment";
  var SNAP_ALL_CORNERS = ["tl", "tr", "bl", "br"];
  var SNAP_ALL_SIDES = ["start", "end"];
  var SNAP_ALL_EDGES = ["inside", "outside"];
  var AUTOSCROLL_SPEED = [40, 200, 1e3];
  var AUTOSCROLL_SENSITIVITY = [100, 40, 0];
  var IS_EDGE = "-ms-scroll-limit" in document.documentElement.style && "-ms-ime-align" in document.documentElement.style && !window.navigator.msPointerEnabled;
  var IS_TRIDENT = !IS_EDGE && !!document.uniqueID;
  var IS_GECKO = "MozAppearance" in document.documentElement.style;
  var IS_BLINK = !IS_EDGE && !IS_GECKO && // Edge has `window.chrome`, and future Gecko might have that.
  !!window.chrome && !!window.CSS;
  var IS_WEBKIT = !IS_EDGE && !IS_TRIDENT && !IS_GECKO && !IS_BLINK && // Some engines support `webkit-*` properties.
  !window.chrome && "WebkitAppearance" in document.documentElement.style;
  var isObject = function() {
    var toString = {}.toString, fnToString = {}.hasOwnProperty.toString, objFnString = fnToString.call(Object);
    return function(obj) {
      var proto, constr;
      return obj && toString.call(obj) === "[object Object]" && (!(proto = Object.getPrototypeOf(obj)) || (constr = proto.hasOwnProperty("constructor") && proto.constructor) && typeof constr === "function" && fnToString.call(constr) === objFnString);
    };
  }();
  var isFinite = Number.isFinite || function(value) {
    return typeof value === "number" && window.isFinite(value);
  };
  var insProps = {};
  var pointerOffset = {};
  var pointerEvent = new pointer_event_esm_default();
  var insId = 0;
  var activeProps;
  var hasMoved;
  var body;
  var cssValueDraggableCursor;
  var cssValueDraggingCursor;
  var cssOrgValueBodyCursor;
  var cssPropTransitionProperty;
  var cssPropTransform;
  var cssPropUserSelect;
  var cssOrgValueBodyUserSelect;
  var cssWantedValueDraggableCursor = IS_WEBKIT ? ["all-scroll", "move"] : ["grab", "all-scroll", "move"];
  var cssWantedValueDraggingCursor = IS_WEBKIT ? "move" : ["grabbing", "move"];
  var draggableClass = "plain-draggable";
  var draggingClass = "plain-draggable-dragging";
  var movingClass = "plain-draggable-moving";
  var scrollFrame = {};
  var MSPF2 = 1e3 / 60;
  var requestAnim2 = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
    return setTimeout(callback, MSPF2);
  };
  var cancelAnim2 = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(requestID2) {
    return clearTimeout(requestID2);
  };
  {
    let frameUpdate = function() {
      var now = Date.now();
      ["x", "y"].forEach(function(xy) {
        var moveArgs = curXyMoveArgs[xy];
        if (moveArgs) {
          var timeLen = now - moveArgs.lastFrameTime, absValue = curScrollXY(curElement, xy), curValue = moveArgs.lastValue != null && Math.abs(moveArgs.lastValue - absValue) < 10 ? moveArgs.lastValue : absValue;
          if (moveArgs.dir === -1 ? curValue > moveArgs.min : curValue < moveArgs.max) {
            var newValue = curValue + moveArgs.speed * timeLen * moveArgs.dir;
            if (newValue < moveArgs.min) {
              newValue = moveArgs.min;
            } else if (newValue > moveArgs.max) {
              newValue = moveArgs.max;
            }
            curScrollXY(curElement, xy, newValue);
            moveArgs.lastValue = newValue;
          }
          moveArgs.lastFrameTime = now;
        }
      });
    }, frame = function() {
      cancelAnim2.call(window, requestID2);
      frameUpdate();
      requestID2 = requestAnim2.call(window, frame);
    };
    curXyMoveArgs = {};
    scrollFrame.move = function(element, xyMoveArgs, scrollXY) {
      cancelAnim2.call(window, requestID2);
      frameUpdate();
      if (curElement === element) {
        if (xyMoveArgs.x && curXyMoveArgs.x) {
          xyMoveArgs.x.lastValue = curXyMoveArgs.x.lastValue;
        }
        if (xyMoveArgs.y && curXyMoveArgs.y) {
          xyMoveArgs.y.lastValue = curXyMoveArgs.y.lastValue;
        }
      }
      curElement = element;
      curXyMoveArgs = xyMoveArgs;
      curScrollXY = scrollXY;
      var now = Date.now();
      ["x", "y"].forEach(function(xy) {
        var moveArgs = curXyMoveArgs[xy];
        if (moveArgs) {
          moveArgs.lastFrameTime = now;
        }
      });
      requestID2 = requestAnim2.call(window, frame);
    };
    scrollFrame.stop = function() {
      cancelAnim2.call(window, requestID2);
      frameUpdate();
      curXyMoveArgs = {};
      curElement = null;
    };
  }
  var curXyMoveArgs;
  var curElement;
  var curScrollXY;
  var requestID2;
  function scrollXYWindow(element, xy, value) {
    if (value != null) {
      if (xy === "x") {
        element.scrollTo(value, element.pageYOffset);
      } else {
        element.scrollTo(element.pageXOffset, value);
      }
    }
    return xy === "x" ? element.pageXOffset : element.pageYOffset;
  }
  function scrollXYElement(element, xy, value) {
    var prop = xy === "x" ? "scrollLeft" : "scrollTop";
    if (value != null) {
      element[prop] = value;
    }
    return element[prop];
  }
  function getScrollable(element, isWindow, dontScroll) {
    var scrollable = {};
    var cmpStyleHtml, cmpStyleBody, cmpStyleElement;
    (function(target) {
      scrollable.clientWidth = target.clientWidth;
      scrollable.clientHeight = target.clientHeight;
    })(isWindow ? document.documentElement : element);
    var maxScrollLeft = 0, maxScrollTop = 0;
    if (!dontScroll) {
      var curScrollLeft, curScrollTop;
      if (isWindow) {
        curScrollLeft = scrollXYWindow(element, "x");
        curScrollTop = scrollXYWindow(element, "y");
        cmpStyleHtml = getComputedStyle(document.documentElement, "");
        cmpStyleBody = getComputedStyle(document.body, "");
        maxScrollLeft = scrollXYWindow(element, "x", document.documentElement.scrollWidth + scrollable.clientWidth + // Blink for Android bug, scroll* returns size of smaller body
        ["marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"].reduce(function(len, prop) {
          return len + (parseFloat(cmpStyleHtml[prop]) || 0) + (parseFloat(cmpStyleBody[prop]) || 0);
        }, 0));
        maxScrollTop = scrollXYWindow(element, "y", document.documentElement.scrollHeight + scrollable.clientHeight + ["marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"].reduce(function(len, prop) {
          return len + (parseFloat(cmpStyleHtml[prop]) || 0) + (parseFloat(cmpStyleBody[prop]) || 0);
        }, 0));
        scrollXYWindow(element, "x", curScrollLeft);
        scrollXYWindow(element, "y", curScrollTop);
      } else {
        curScrollLeft = scrollXYElement(element, "x");
        curScrollTop = scrollXYElement(element, "y");
        cmpStyleElement = getComputedStyle(element, "");
        maxScrollLeft = scrollXYElement(element, "x", element.scrollWidth + scrollable.clientWidth + // Blink for Android bug, scroll* returns size of smaller body
        ["marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"].reduce(function(len, prop) {
          return len + (parseFloat(cmpStyleElement[prop]) || 0);
        }, 0));
        maxScrollTop = scrollXYElement(element, "y", element.scrollHeight + scrollable.clientHeight + ["marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"].reduce(function(len, prop) {
          return len + (parseFloat(cmpStyleElement[prop]) || 0);
        }, 0));
        scrollXYElement(element, "x", curScrollLeft);
        scrollXYElement(element, "y", curScrollTop);
      }
    }
    scrollable.scrollWidth = scrollable.clientWidth + maxScrollLeft;
    scrollable.scrollHeight = scrollable.clientHeight + maxScrollTop;
    var rect;
    if (isWindow) {
      scrollable.clientX = scrollable.clientY = 0;
    } else {
      rect = element.getBoundingClientRect();
      if (!cmpStyleElement) {
        cmpStyleElement = getComputedStyle(element, "");
      }
      scrollable.clientX = rect.left + (parseFloat(cmpStyleElement.borderLeftWidth) || 0);
      scrollable.clientY = rect.top + (parseFloat(cmpStyleElement.borderTopWidth) || 0);
    }
    return scrollable;
  }
  function copyTree(obj) {
    return !obj ? obj : isObject(obj) ? Object.keys(obj).reduce(function(copyObj, key) {
      copyObj[key] = copyTree(obj[key]);
      return copyObj;
    }, {}) : Array.isArray(obj) ? obj.map(copyTree) : obj;
  }
  function hasChanged(a, b) {
    var typeA, keysA;
    return _typeof(a) !== _typeof(b) || (typeA = isObject(a) ? "obj" : Array.isArray(a) ? "array" : "") !== (isObject(b) ? "obj" : Array.isArray(b) ? "array" : "") || (typeA === "obj" ? hasChanged(keysA = Object.keys(a).sort(), Object.keys(b).sort()) || keysA.some(function(prop) {
      return hasChanged(a[prop], b[prop]);
    }) : typeA === "array" ? a.length !== b.length || a.some(function(aVal, i) {
      return hasChanged(aVal, b[i]);
    }) : a !== b);
  }
  function isElement(element) {
    return !!(element && element.nodeType === Node.ELEMENT_NODE && // element instanceof HTMLElement &&
    typeof element.getBoundingClientRect === "function" && !(element.compareDocumentPosition(document) & Node.DOCUMENT_POSITION_DISCONNECTED));
  }
  function validBBox(bBox) {
    if (!isObject(bBox)) {
      return null;
    }
    var value;
    if (isFinite(value = bBox.left) || isFinite(value = bBox.x)) {
      bBox.left = bBox.x = value;
    } else {
      return null;
    }
    if (isFinite(value = bBox.top) || isFinite(value = bBox.y)) {
      bBox.top = bBox.y = value;
    } else {
      return null;
    }
    if (isFinite(bBox.width) && bBox.width >= 0) {
      bBox.right = bBox.left + bBox.width;
    } else if (isFinite(bBox.right) && bBox.right >= bBox.left) {
      bBox.width = bBox.right - bBox.left;
    } else {
      return null;
    }
    if (isFinite(bBox.height) && bBox.height >= 0) {
      bBox.bottom = bBox.top + bBox.height;
    } else if (isFinite(bBox.bottom) && bBox.bottom >= bBox.top) {
      bBox.height = bBox.bottom - bBox.top;
    } else {
      return null;
    }
    return bBox;
  }
  function validPPValue(value) {
    function string2PPValue(inString) {
      var matches = /^(.+?)(%)?$/.exec(inString);
      var value2, isRatio;
      return matches && isFinite(value2 = parseFloat(matches[1])) ? {
        value: (isRatio = !!(matches[2] && value2)) ? value2 / 100 : value2,
        isRatio
      } : null;
    }
    return isFinite(value) ? {
      value,
      isRatio: false
    } : typeof value === "string" ? string2PPValue(value.replace(/\s/g, "")) : null;
  }
  function ppValue2OptionValue(ppValue) {
    return ppValue.isRatio ? "".concat(ppValue.value * 100, "%") : ppValue.value;
  }
  function resolvePPValue(ppValue, baseOrigin, baseSize) {
    return typeof ppValue === "number" ? ppValue : baseOrigin + ppValue.value * (ppValue.isRatio ? baseSize : 1);
  }
  function validPPBBox(bBox) {
    if (!isObject(bBox)) {
      return null;
    }
    var ppValue;
    if ((ppValue = validPPValue(bBox.left)) || (ppValue = validPPValue(bBox.x))) {
      bBox.left = bBox.x = ppValue;
    } else {
      return null;
    }
    if ((ppValue = validPPValue(bBox.top)) || (ppValue = validPPValue(bBox.y))) {
      bBox.top = bBox.y = ppValue;
    } else {
      return null;
    }
    if ((ppValue = validPPValue(bBox.width)) && ppValue.value >= 0) {
      bBox.width = ppValue;
      delete bBox.right;
    } else if (ppValue = validPPValue(bBox.right)) {
      bBox.right = ppValue;
      delete bBox.width;
    } else {
      return null;
    }
    if ((ppValue = validPPValue(bBox.height)) && ppValue.value >= 0) {
      bBox.height = ppValue;
      delete bBox.bottom;
    } else if (ppValue = validPPValue(bBox.bottom)) {
      bBox.bottom = ppValue;
      delete bBox.height;
    } else {
      return null;
    }
    return bBox;
  }
  function ppBBox2OptionObject(ppBBox) {
    return Object.keys(ppBBox).reduce(function(obj, prop) {
      obj[prop] = ppValue2OptionValue(ppBBox[prop]);
      return obj;
    }, {});
  }
  function resolvePPBBox(ppBBox, baseBBox) {
    var prop2Axis = {
      left: "x",
      right: "x",
      x: "x",
      width: "x",
      top: "y",
      bottom: "y",
      y: "y",
      height: "y"
    }, baseOriginXY = {
      x: baseBBox.left,
      y: baseBBox.top
    }, baseSizeXY = {
      x: baseBBox.width,
      y: baseBBox.height
    };
    return validBBox(Object.keys(ppBBox).reduce(function(bBox, prop) {
      bBox[prop] = resolvePPValue(ppBBox[prop], prop === "width" || prop === "height" ? 0 : baseOriginXY[prop2Axis[prop]], baseSizeXY[prop2Axis[prop]]);
      return bBox;
    }, {}));
  }
  function getBBox(element, getPaddingBox) {
    var rect = element.getBoundingClientRect(), bBox = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
    bBox.left += window.pageXOffset;
    bBox.top += window.pageYOffset;
    if (getPaddingBox) {
      var style = window.getComputedStyle(element, ""), borderTop = parseFloat(style.borderTopWidth) || 0, borderRight = parseFloat(style.borderRightWidth) || 0, borderBottom = parseFloat(style.borderBottomWidth) || 0, borderLeft = parseFloat(style.borderLeftWidth) || 0;
      bBox.left += borderLeft;
      bBox.top += borderTop;
      bBox.width -= borderLeft + borderRight;
      bBox.height -= borderTop + borderBottom;
    }
    return validBBox(bBox);
  }
  function initAnim(element, gpuTrigger) {
    var style = element.style;
    style.webkitTapHighlightColor = "transparent";
    var cssPropBoxShadow = cssprefix_esm_default.getName("boxShadow"), boxShadow = window.getComputedStyle(element, "")[cssPropBoxShadow];
    if (!boxShadow || boxShadow === "none") {
      style[cssPropBoxShadow] = "0 0 1px transparent";
    }
    if (gpuTrigger && cssPropTransform) {
      style[cssPropTransform] = "translateZ(0)";
    }
    return element;
  }
  function setDraggableCursor(element, orgCursor) {
    if (cssValueDraggableCursor == null) {
      if (cssWantedValueDraggableCursor !== false) {
        cssValueDraggableCursor = cssprefix_esm_default.getValue("cursor", cssWantedValueDraggableCursor);
      }
      if (cssValueDraggableCursor == null) {
        cssValueDraggableCursor = false;
      }
    }
    element.style.cursor = cssValueDraggableCursor === false ? orgCursor : cssValueDraggableCursor;
  }
  function setDraggingCursor(element) {
    if (cssValueDraggingCursor == null) {
      if (cssWantedValueDraggingCursor !== false) {
        cssValueDraggingCursor = cssprefix_esm_default.getValue("cursor", cssWantedValueDraggingCursor);
      }
      if (cssValueDraggingCursor == null) {
        cssValueDraggingCursor = false;
      }
    }
    if (cssValueDraggingCursor !== false) {
      element.style.cursor = cssValueDraggingCursor;
    }
  }
  function viewPoint2SvgPoint(props, clientX, clientY) {
    var svgPoint = props.svgPoint;
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    return svgPoint.matrixTransform(props.svgCtmElement.getScreenCTM().inverse());
  }
  function moveTranslate(props, position) {
    var elementBBox = props.elementBBox;
    if (position.left !== elementBBox.left || position.top !== elementBBox.top) {
      var offset = props.htmlOffset;
      props.elementStyle[cssPropTransform] = "translate(".concat(position.left + offset.left, "px, ").concat(position.top + offset.top, "px)");
      return true;
    }
    return false;
  }
  function moveLeftTop(props, position) {
    var elementBBox = props.elementBBox, elementStyle = props.elementStyle, offset = props.htmlOffset;
    var moved = false;
    if (position.left !== elementBBox.left) {
      elementStyle.left = position.left + offset.left + "px";
      moved = true;
    }
    if (position.top !== elementBBox.top) {
      elementStyle.top = position.top + offset.top + "px";
      moved = true;
    }
    return moved;
  }
  function moveSvg(props, position) {
    var elementBBox = props.elementBBox;
    if (position.left !== elementBBox.left || position.top !== elementBBox.top) {
      var offset = props.svgOffset, originBBox = props.svgOriginBBox, point = viewPoint2SvgPoint(props, position.left - window.pageXOffset, position.top - window.pageYOffset);
      props.svgTransform.setTranslate(point.x + offset.x - originBBox.x, point.y + offset.y - originBBox.y);
      return true;
    }
    return false;
  }
  function move(props, position, cbCheck) {
    var elementBBox = props.elementBBox;
    function fix() {
      if (props.minLeft >= props.maxLeft) {
        position.left = elementBBox.left;
      } else if (position.left < props.minLeft) {
        position.left = props.minLeft;
      } else if (position.left > props.maxLeft) {
        position.left = props.maxLeft;
      }
      if (props.minTop >= props.maxTop) {
        position.top = elementBBox.top;
      } else if (position.top < props.minTop) {
        position.top = props.minTop;
      } else if (position.top > props.maxTop) {
        position.top = props.maxTop;
      }
    }
    fix();
    if (cbCheck) {
      if (cbCheck(position) === false) {
        return false;
      }
      fix();
    }
    var moved = props.moveElm(props, position);
    if (moved) {
      props.elementBBox = validBBox({
        left: position.left,
        top: position.top,
        width: elementBBox.width,
        height: elementBBox.height
      });
    }
    return moved;
  }
  function initTranslate(props) {
    var element = props.element, elementStyle = props.elementStyle, curPosition = getBBox(element), RESTORE_PROPS = ["display", "marginTop", "marginBottom", "width", "height"];
    RESTORE_PROPS.unshift(cssPropTransform);
    var orgTransitionProperty = elementStyle[cssPropTransitionProperty];
    elementStyle[cssPropTransitionProperty] = "none";
    var fixPosition = getBBox(element);
    if (!props.orgStyle) {
      props.orgStyle = RESTORE_PROPS.reduce(function(orgStyle, prop) {
        orgStyle[prop] = elementStyle[prop] || "";
        return orgStyle;
      }, {});
      props.lastStyle = {};
    } else {
      RESTORE_PROPS.forEach(function(prop) {
        if (props.lastStyle[prop] == null || elementStyle[prop] === props.lastStyle[prop]) {
          elementStyle[prop] = props.orgStyle[prop];
        }
      });
    }
    var orgSize = getBBox(element), cmpStyle = window.getComputedStyle(element, "");
    if (cmpStyle.display === "inline") {
      elementStyle.display = "inline-block";
      ["Top", "Bottom"].forEach(function(dirProp) {
        var padding = parseFloat(cmpStyle["padding".concat(dirProp)]);
        elementStyle["margin".concat(dirProp)] = padding ? "-".concat(padding, "px") : "0";
      });
    }
    elementStyle[cssPropTransform] = "translate(0, 0)";
    var newBBox = getBBox(element);
    var offset = props.htmlOffset = {
      left: newBBox.left ? -newBBox.left : 0,
      top: newBBox.top ? -newBBox.top : 0
    };
    elementStyle[cssPropTransform] = "translate(".concat(curPosition.left + offset.left, "px, ").concat(curPosition.top + offset.top, "px)");
    ["width", "height"].forEach(function(prop) {
      if (newBBox[prop] !== orgSize[prop]) {
        elementStyle[prop] = orgSize[prop] + "px";
        newBBox = getBBox(element);
        if (newBBox[prop] !== orgSize[prop]) {
          elementStyle[prop] = orgSize[prop] - (newBBox[prop] - orgSize[prop]) + "px";
        }
      }
      props.lastStyle[prop] = elementStyle[prop];
    });
    element.offsetWidth;
    elementStyle[cssPropTransitionProperty] = orgTransitionProperty;
    if (fixPosition.left !== curPosition.left || fixPosition.top !== curPosition.top) {
      elementStyle[cssPropTransform] = "translate(".concat(fixPosition.left + offset.left, "px, ").concat(fixPosition.top + offset.top, "px)");
    }
    return fixPosition;
  }
  function initLeftTop(props) {
    var element = props.element, elementStyle = props.elementStyle, curPosition = getBBox(element), RESTORE_PROPS = ["position", "marginTop", "marginRight", "marginBottom", "marginLeft", "width", "height"];
    var orgTransitionProperty = elementStyle[cssPropTransitionProperty];
    elementStyle[cssPropTransitionProperty] = "none";
    var fixPosition = getBBox(element);
    if (!props.orgStyle) {
      props.orgStyle = RESTORE_PROPS.reduce(function(orgStyle, prop) {
        orgStyle[prop] = elementStyle[prop] || "";
        return orgStyle;
      }, {});
      props.lastStyle = {};
    } else {
      RESTORE_PROPS.forEach(function(prop) {
        if (props.lastStyle[prop] == null || elementStyle[prop] === props.lastStyle[prop]) {
          elementStyle[prop] = props.orgStyle[prop];
        }
      });
    }
    var orgSize = getBBox(element);
    elementStyle.position = "absolute";
    elementStyle.left = elementStyle.top = elementStyle.margin = "0";
    var newBBox = getBBox(element);
    var offset = props.htmlOffset = {
      left: newBBox.left ? -newBBox.left : 0,
      top: newBBox.top ? -newBBox.top : 0
    };
    elementStyle.left = curPosition.left + offset.left + "px";
    elementStyle.top = curPosition.top + offset.top + "px";
    ["width", "height"].forEach(function(prop) {
      if (newBBox[prop] !== orgSize[prop]) {
        elementStyle[prop] = orgSize[prop] + "px";
        newBBox = getBBox(element);
        if (newBBox[prop] !== orgSize[prop]) {
          elementStyle[prop] = orgSize[prop] - (newBBox[prop] - orgSize[prop]) + "px";
        }
      }
      props.lastStyle[prop] = elementStyle[prop];
    });
    element.offsetWidth;
    elementStyle[cssPropTransitionProperty] = orgTransitionProperty;
    if (fixPosition.left !== curPosition.left || fixPosition.top !== curPosition.top) {
      elementStyle.left = fixPosition.left + offset.left + "px";
      elementStyle.top = fixPosition.top + offset.top + "px";
    }
    return fixPosition;
  }
  function initSvg(props) {
    var element = props.element, svgTransform = props.svgTransform, curRect = element.getBoundingClientRect(), fixPosition = getBBox(element);
    svgTransform.setTranslate(0, 0);
    var originBBox = props.svgOriginBBox = element.getBBox(), newRect = element.getBoundingClientRect(), originPoint = viewPoint2SvgPoint(props, newRect.left, newRect.top), offset = props.svgOffset = {
      x: originBBox.x - originPoint.x,
      y: originBBox.y - originPoint.y
    }, curPoint = viewPoint2SvgPoint(props, curRect.left, curRect.top);
    svgTransform.setTranslate(curPoint.x + offset.x - originBBox.x, curPoint.y + offset.y - originBBox.y);
    return fixPosition;
  }
  function initBBox(props, eventType) {
    var docBBox = getBBox(document.documentElement), elementBBox = props.elementBBox = props.initElm(props), containmentBBox = props.containmentBBox = props.containmentIsBBox ? resolvePPBBox(props.options.containment, docBBox) || docBBox : getBBox(props.options.containment, true);
    props.minLeft = containmentBBox.left;
    props.maxLeft = containmentBBox.right - elementBBox.width;
    props.minTop = containmentBBox.top;
    props.maxTop = containmentBBox.bottom - elementBBox.height;
    move(props, {
      left: elementBBox.left,
      top: elementBBox.top
    });
    if (props.parsedSnapTargets) {
      var elementSizeXY = {
        x: elementBBox.width,
        y: elementBBox.height
      }, minXY = {
        x: props.minLeft,
        y: props.minTop
      }, maxXY = {
        x: props.maxLeft,
        y: props.maxTop
      }, prop2Axis = {
        left: "x",
        right: "x",
        x: "x",
        width: "x",
        xStart: "x",
        xEnd: "x",
        xStep: "x",
        top: "y",
        bottom: "y",
        y: "y",
        height: "y",
        yStart: "y",
        yEnd: "y",
        yStep: "y"
      }, snapTargets = props.parsedSnapTargets.reduce(function(snapTargets2, parsedSnapTarget) {
        var baseRect = parsedSnapTarget.base === "containment" ? containmentBBox : docBBox, baseOriginXY = {
          x: baseRect.left,
          y: baseRect.top
        }, baseSizeXY = {
          x: baseRect.width,
          y: baseRect.height
        };
        function addSnapTarget(targetXY) {
          if (targetXY.center == null) {
            targetXY.center = parsedSnapTarget.center;
          }
          if (targetXY.xGravity == null) {
            targetXY.xGravity = parsedSnapTarget.gravity;
          }
          if (targetXY.yGravity == null) {
            targetXY.yGravity = parsedSnapTarget.gravity;
          }
          if (targetXY.x != null && targetXY.y != null) {
            targetXY.x = resolvePPValue(targetXY.x, baseOriginXY.x, baseSizeXY.x);
            targetXY.y = resolvePPValue(targetXY.y, baseOriginXY.y, baseSizeXY.y);
            if (targetXY.center) {
              targetXY.x -= elementSizeXY.x / 2;
              targetXY.y -= elementSizeXY.y / 2;
              targetXY.corners = ["tl"];
            }
            (targetXY.corners || parsedSnapTarget.corners).forEach(function(corner) {
              var x = targetXY.x - (corner === "tr" || corner === "br" ? elementSizeXY.x : 0), y = targetXY.y - (corner === "bl" || corner === "br" ? elementSizeXY.y : 0);
              if (x >= minXY.x && x <= maxXY.x && y >= minXY.y && y <= maxXY.y) {
                var snapTarget = {
                  x,
                  y
                }, gravityXStart = x - targetXY.xGravity, gravityXEnd = x + targetXY.xGravity, gravityYStart = y - targetXY.yGravity, gravityYEnd = y + targetXY.yGravity;
                if (gravityXStart > minXY.x) {
                  snapTarget.gravityXStart = gravityXStart;
                }
                if (gravityXEnd < maxXY.x) {
                  snapTarget.gravityXEnd = gravityXEnd;
                }
                if (gravityYStart > minXY.y) {
                  snapTarget.gravityYStart = gravityYStart;
                }
                if (gravityYEnd < maxXY.y) {
                  snapTarget.gravityYEnd = gravityYEnd;
                }
                snapTargets2.push(snapTarget);
              }
            });
          } else {
            var specAxis = targetXY.x != null ? "x" : "y", rangeAxis = specAxis === "x" ? "y" : "x", startProp = "".concat(rangeAxis, "Start"), endProp = "".concat(rangeAxis, "End"), gravityProp = "".concat(specAxis, "Gravity"), specAxisL = specAxis.toUpperCase(), rangeAxisL = rangeAxis.toUpperCase(), gravitySpecStartProp = "gravity".concat(specAxisL, "Start"), gravitySpecEndProp = "gravity".concat(specAxisL, "End"), gravityRangeStartProp = "gravity".concat(rangeAxisL, "Start"), gravityRangeEndProp = "gravity".concat(rangeAxisL, "End");
            targetXY[specAxis] = resolvePPValue(targetXY[specAxis], baseOriginXY[specAxis], baseSizeXY[specAxis]);
            targetXY[startProp] = resolvePPValue(targetXY[startProp], baseOriginXY[rangeAxis], baseSizeXY[rangeAxis]);
            targetXY[endProp] = resolvePPValue(targetXY[endProp], baseOriginXY[rangeAxis], baseSizeXY[rangeAxis]) - elementSizeXY[rangeAxis];
            if (targetXY[startProp] > targetXY[endProp] || // Smaller than element size.
            targetXY[startProp] > maxXY[rangeAxis] || targetXY[endProp] < minXY[rangeAxis]) {
              return;
            }
            if (targetXY.center) {
              targetXY[specAxis] -= elementSizeXY[specAxis] / 2;
              targetXY.sides = ["start"];
            }
            (targetXY.sides || parsedSnapTarget.sides).forEach(function(side) {
              var xy = targetXY[specAxis] - (side === "end" ? elementSizeXY[specAxis] : 0);
              if (xy >= minXY[specAxis] && xy <= maxXY[specAxis]) {
                var snapTarget = {}, gravitySpecStart = xy - targetXY[gravityProp], gravitySpecEnd = xy + targetXY[gravityProp];
                snapTarget[specAxis] = xy;
                if (gravitySpecStart > minXY[specAxis]) {
                  snapTarget[gravitySpecStartProp] = gravitySpecStart;
                }
                if (gravitySpecEnd < maxXY[specAxis]) {
                  snapTarget[gravitySpecEndProp] = gravitySpecEnd;
                }
                if (targetXY[startProp] > minXY[rangeAxis]) {
                  snapTarget[gravityRangeStartProp] = targetXY[startProp];
                }
                if (targetXY[endProp] < maxXY[rangeAxis]) {
                  snapTarget[gravityRangeEndProp] = targetXY[endProp];
                }
                snapTargets2.push(snapTarget);
              }
            });
          }
        }
        var bBox;
        if ((bBox = parsedSnapTarget.element ? getBBox(parsedSnapTarget.element) : null) || // Element
        parsedSnapTarget.ppBBox) {
          if (parsedSnapTarget.ppBBox) {
            bBox = resolvePPBBox(parsedSnapTarget.ppBBox, baseRect);
          }
          if (bBox) {
            parsedSnapTarget.edges.forEach(function(edge) {
              var lengthenX = parsedSnapTarget.gravity, lengthenY = parsedSnapTarget.gravity;
              if (edge === "outside") {
                lengthenX += elementBBox.width;
                lengthenY += elementBBox.height;
              }
              var xStart = bBox.left - lengthenX, xEnd = bBox.right + lengthenX, yStart = bBox.top - lengthenY, yEnd = bBox.bottom + lengthenY;
              var side = edge === "inside" ? "start" : "end";
              addSnapTarget({
                xStart,
                xEnd,
                y: bBox.top,
                sides: [side],
                center: false
              });
              addSnapTarget({
                x: bBox.left,
                yStart,
                yEnd,
                sides: [side],
                center: false
              });
              side = edge === "inside" ? "end" : "start";
              addSnapTarget({
                xStart,
                xEnd,
                y: bBox.bottom,
                sides: [side],
                center: false
              });
              addSnapTarget({
                x: bBox.right,
                yStart,
                yEnd,
                sides: [side],
                center: false
              });
            });
          }
        } else {
          var expanded = [["x", "y", "xStart", "xEnd", "xStep", "yStart", "yEnd", "yStep"].reduce(function(targetXY, prop) {
            if (parsedSnapTarget[prop]) {
              targetXY[prop] = resolvePPValue(parsedSnapTarget[prop], prop === "xStep" || prop === "yStep" ? 0 : baseOriginXY[prop2Axis[prop]], baseSizeXY[prop2Axis[prop]]);
            }
            return targetXY;
          }, {})];
          ["x", "y"].forEach(function(axis) {
            var startProp = "".concat(axis, "Start"), endProp = "".concat(axis, "End"), stepProp = "".concat(axis, "Step"), gravityProp = "".concat(axis, "Gravity");
            expanded = expanded.reduce(function(expanded2, targetXY) {
              var start = targetXY[startProp], end = targetXY[endProp], step2 = targetXY[stepProp];
              if (start != null && end != null && start >= end) {
                return expanded2;
              }
              if (step2 != null) {
                if (step2 < 2) {
                  return expanded2;
                }
                var gravity = step2 / 2;
                gravity = parsedSnapTarget.gravity > gravity ? gravity : null;
                for (var curValue = start; curValue <= end; curValue += step2) {
                  var expandedXY = Object.keys(targetXY).reduce(function(expandedXY2, prop) {
                    if (prop !== startProp && prop !== endProp && prop !== stepProp) {
                      expandedXY2[prop] = targetXY[prop];
                    }
                    return expandedXY2;
                  }, {});
                  expandedXY[axis] = curValue;
                  expandedXY[gravityProp] = gravity;
                  expanded2.push(expandedXY);
                }
              } else {
                expanded2.push(targetXY);
              }
              return expanded2;
            }, []);
          });
          expanded.forEach(function(targetXY) {
            addSnapTarget(targetXY);
          });
        }
        return snapTargets2;
      }, []);
      props.snapTargets = snapTargets.length ? snapTargets : null;
    }
    var autoScroll = {}, autoScrollOptions = props.options.autoScroll;
    if (autoScrollOptions) {
      autoScroll.isWindow = autoScrollOptions.target === window;
      autoScroll.target = autoScrollOptions.target;
      var dontScroll = eventType === "scroll", scrollable = getScrollable(autoScrollOptions.target, autoScroll.isWindow, dontScroll), scrollableBBox = validBBox({
        left: scrollable.clientX,
        top: scrollable.clientY,
        width: scrollable.clientWidth,
        height: scrollable.clientHeight
      });
      if (!dontScroll) {
        autoScroll.scrollWidth = scrollable.scrollWidth;
        autoScroll.scrollHeight = scrollable.scrollHeight;
      } else if (props.autoScroll) {
        autoScroll.scrollWidth = props.autoScroll.scrollWidth;
        autoScroll.scrollHeight = props.autoScroll.scrollHeight;
      }
      [["X", "Width", "left", "right"], ["Y", "Height", "top", "bottom"]].forEach(function(axis) {
        var xy = axis[0], wh = axis[1], back = axis[2], forward = axis[3], maxAbs = (autoScroll["scroll".concat(wh)] || 0) - scrollable["client".concat(wh)], min = autoScrollOptions["min".concat(xy)] || 0;
        var max = isFinite(autoScrollOptions["max".concat(xy)]) ? autoScrollOptions["max".concat(xy)] : maxAbs;
        if (min < max && min < maxAbs) {
          if (max > maxAbs) {
            max = maxAbs;
          }
          var lines = [], elementSize = elementBBox[wh.toLowerCase()];
          for (var i = autoScrollOptions.sensitivity.length - 1; i >= 0; i--) {
            var sensitivity = autoScrollOptions.sensitivity[i], speed = autoScrollOptions.speed[i];
            lines.push({
              dir: -1,
              speed,
              position: scrollableBBox[back] + sensitivity
            });
            lines.push({
              dir: 1,
              speed,
              position: scrollableBBox[forward] - sensitivity - elementSize
            });
          }
          autoScroll[xy.toLowerCase()] = {
            min,
            max,
            lines
          };
        }
      });
    }
    props.autoScroll = autoScroll.x || autoScroll.y ? autoScroll : null;
  }
  function dragEnd(props) {
    scrollFrame.stop();
    setDraggableCursor(props.options.handle, props.orgCursor);
    body.style.cursor = cssOrgValueBodyCursor;
    if (props.options.zIndex !== false) {
      props.elementStyle.zIndex = props.orgZIndex;
    }
    if (cssPropUserSelect) {
      body.style[cssPropUserSelect] = cssOrgValueBodyUserSelect;
    }
    var classList = m_class_list_esm_default(props.element);
    if (movingClass) {
      classList.remove(movingClass);
    }
    if (draggingClass) {
      classList.remove(draggingClass);
    }
    activeProps = null;
    pointerEvent.cancel();
    if (props.onDragEnd) {
      props.onDragEnd({
        left: props.elementBBox.left,
        top: props.elementBBox.top
      });
    }
  }
  function dragStart(props, pointerXY) {
    if (props.disabled) {
      return false;
    }
    if (props.onDragStart && props.onDragStart(pointerXY) === false) {
      return false;
    }
    if (activeProps) {
      dragEnd(activeProps);
    }
    setDraggingCursor(props.options.handle);
    body.style.cursor = cssValueDraggingCursor || // If it is `false` or `''`
    window.getComputedStyle(props.options.handle, "").cursor;
    if (props.options.zIndex !== false) {
      props.elementStyle.zIndex = props.options.zIndex;
    }
    if (cssPropUserSelect) {
      body.style[cssPropUserSelect] = "none";
    }
    if (draggingClass) {
      m_class_list_esm_default(props.element).add(draggingClass);
    }
    activeProps = props;
    hasMoved = false;
    pointerOffset.left = props.elementBBox.left - (pointerXY.clientX + window.pageXOffset);
    pointerOffset.top = props.elementBBox.top - (pointerXY.clientY + window.pageYOffset);
    return true;
  }
  function _setOptions(props, newOptions) {
    var options = props.options;
    var needsInitBBox;
    if (newOptions.containment) {
      var bBox;
      if (isElement(newOptions.containment)) {
        if (newOptions.containment !== options.containment) {
          options.containment = newOptions.containment;
          props.containmentIsBBox = false;
          needsInitBBox = true;
        }
      } else if ((bBox = validPPBBox(copyTree(newOptions.containment))) && // bBox
      hasChanged(bBox, options.containment)) {
        options.containment = bBox;
        props.containmentIsBBox = true;
        needsInitBBox = true;
      }
    }
    function commonSnapOptions(options2, newOptions2) {
      function cleanString(inString) {
        return typeof inString === "string" ? inString.replace(/[, ]+/g, " ").trim().toLowerCase() : null;
      }
      if (isFinite(newOptions2.gravity) && newOptions2.gravity > 0) {
        options2.gravity = newOptions2.gravity;
      }
      var corner = cleanString(newOptions2.corner);
      if (corner) {
        if (corner !== "all") {
          var added = {}, corners = corner.split(/\s/).reduce(function(corners2, corner2) {
            corner2 = corner2.trim().replace(/^(.).*?-(.).*$/, "$1$2");
            if ((corner2 = corner2 === "tl" || corner2 === "lt" ? "tl" : corner2 === "tr" || corner2 === "rt" ? "tr" : corner2 === "bl" || corner2 === "lb" ? "bl" : corner2 === "br" || corner2 === "rb" ? "br" : null) && !added[corner2]) {
              corners2.push(corner2);
              added[corner2] = true;
            }
            return corners2;
          }, []), cornersLen = corners.length;
          corner = !cornersLen ? null : cornersLen === 4 ? "all" : corners.join(" ");
        }
        if (corner) {
          options2.corner = corner;
        }
      }
      var side = cleanString(newOptions2.side);
      if (side) {
        if (side === "start" || side === "end" || side === "both") {
          options2.side = side;
        } else if (side === "start end" || side === "end start") {
          options2.side = "both";
        }
      }
      if (typeof newOptions2.center === "boolean") {
        options2.center = newOptions2.center;
      }
      var edge = cleanString(newOptions2.edge);
      if (edge) {
        if (edge === "inside" || edge === "outside" || edge === "both") {
          options2.edge = edge;
        } else if (edge === "inside outside" || edge === "outside inside") {
          options2.edge = "both";
        }
      }
      var base = typeof newOptions2.base === "string" ? newOptions2.base.trim().toLowerCase() : null;
      if (base && (base === "containment" || base === "document")) {
        options2.base = base;
      }
      return options2;
    }
    if (newOptions.snap != null) {
      var newSnapOptions = isObject(newOptions.snap) && newOptions.snap.targets != null ? newOptions.snap : {
        targets: newOptions.snap
      }, snapTargetsOptions = [], snapOptions = commonSnapOptions({
        targets: snapTargetsOptions
      }, newSnapOptions);
      if (!snapOptions.gravity) {
        snapOptions.gravity = SNAP_GRAVITY;
      }
      if (!snapOptions.corner) {
        snapOptions.corner = SNAP_CORNER;
      }
      if (!snapOptions.side) {
        snapOptions.side = SNAP_SIDE;
      }
      if (typeof snapOptions.center !== "boolean") {
        snapOptions.center = false;
      }
      if (!snapOptions.edge) {
        snapOptions.edge = SNAP_EDGE;
      }
      if (!snapOptions.base) {
        snapOptions.base = SNAP_BASE;
      }
      var parsedSnapTargets = (Array.isArray(newSnapOptions.targets) ? newSnapOptions.targets : [newSnapOptions.targets]).reduce(function(parsedSnapTargets2, target) {
        if (target == null) {
          return parsedSnapTargets2;
        }
        var isElementPre = isElement(target), ppBBoxPre = validPPBBox(copyTree(target)), newSnapTargetOptions = isElementPre || ppBBoxPre ? {
          boundingBox: target
        } : (
          // Direct Element | PPBBox
          isObject(target) && target.start == null && target.end == null && target.step == null ? target : (
            // SnapTargetOptions
            {
              x: target,
              y: target
            }
          )
        ), expandedParsedSnapTargets = [], snapTargetOptions = {}, newOptionsBBox = newSnapTargetOptions.boundingBox;
        var ppBBox;
        if (isElementPre || isElement(newOptionsBBox)) {
          expandedParsedSnapTargets.push({
            element: newOptionsBBox
          });
          snapTargetOptions.boundingBox = newOptionsBBox;
        } else if (ppBBox = ppBBoxPre || validPPBBox(copyTree(newOptionsBBox))) {
          expandedParsedSnapTargets.push({
            ppBBox
          });
          snapTargetOptions.boundingBox = ppBBox2OptionObject(ppBBox);
        } else {
          var invalid;
          var parsedXY = ["x", "y"].reduce(function(parsedXY2, axis) {
            var newOptionsXY = newSnapTargetOptions[axis];
            var ppValue;
            if (ppValue = validPPValue(newOptionsXY)) {
              parsedXY2[axis] = ppValue;
              snapTargetOptions[axis] = ppValue2OptionValue(ppValue);
            } else {
              var start, end, step2;
              if (isObject(newOptionsXY)) {
                start = validPPValue(newOptionsXY.start);
                end = validPPValue(newOptionsXY.end);
                step2 = validPPValue(newOptionsXY.step);
                if (start && end && start.isRatio === end.isRatio && start.value >= end.value) {
                  invalid = true;
                }
              }
              start = parsedXY2["".concat(axis, "Start")] = start || {
                value: 0,
                isRatio: false
              };
              end = parsedXY2["".concat(axis, "End")] = end || {
                value: 1,
                isRatio: true
              };
              snapTargetOptions[axis] = {
                start: ppValue2OptionValue(start),
                end: ppValue2OptionValue(end)
              };
              if (step2) {
                if (step2.isRatio ? step2.value > 0 : step2.value >= 2) {
                  parsedXY2["".concat(axis, "Step")] = step2;
                  snapTargetOptions[axis].step = ppValue2OptionValue(step2);
                } else {
                  invalid = true;
                }
              }
            }
            return parsedXY2;
          }, {});
          if (invalid) {
            return parsedSnapTargets2;
          }
          if (parsedXY.xStart && !parsedXY.xStep && parsedXY.yStart && !parsedXY.yStep) {
            expandedParsedSnapTargets.push(
              {
                xStart: parsedXY.xStart,
                xEnd: parsedXY.xEnd,
                y: parsedXY.yStart
              },
              // Top
              {
                xStart: parsedXY.xStart,
                xEnd: parsedXY.xEnd,
                y: parsedXY.yEnd
              },
              // Bottom
              {
                x: parsedXY.xStart,
                yStart: parsedXY.yStart,
                yEnd: parsedXY.yEnd
              },
              // Left
              {
                x: parsedXY.xEnd,
                yStart: parsedXY.yStart,
                yEnd: parsedXY.yEnd
              }
              // Right
            );
          } else {
            expandedParsedSnapTargets.push(parsedXY);
          }
        }
        if (expandedParsedSnapTargets.length) {
          snapTargetsOptions.push(commonSnapOptions(snapTargetOptions, newSnapTargetOptions));
          var corner = snapTargetOptions.corner || snapOptions.corner, side = snapTargetOptions.side || snapOptions.side, edge = snapTargetOptions.edge || snapOptions.edge, commonOptions = {
            gravity: snapTargetOptions.gravity || snapOptions.gravity,
            base: snapTargetOptions.base || snapOptions.base,
            center: typeof snapTargetOptions.center === "boolean" ? snapTargetOptions.center : snapOptions.center,
            corners: corner === "all" ? SNAP_ALL_CORNERS : corner.split(" "),
            // Split
            sides: side === "both" ? SNAP_ALL_SIDES : [side],
            // Split
            edges: edge === "both" ? SNAP_ALL_EDGES : [edge]
            // Split
          };
          expandedParsedSnapTargets.forEach(function(parsedSnapTarget) {
            ["gravity", "corners", "sides", "center", "edges", "base"].forEach(function(option) {
              parsedSnapTarget[option] = commonOptions[option];
            });
            parsedSnapTargets2.push(parsedSnapTarget);
          });
        }
        return parsedSnapTargets2;
      }, []);
      if (parsedSnapTargets.length) {
        options.snap = snapOptions;
        if (hasChanged(parsedSnapTargets, props.parsedSnapTargets)) {
          props.parsedSnapTargets = parsedSnapTargets;
          needsInitBBox = true;
        }
      }
    } else if (newOptions.hasOwnProperty("snap") && props.parsedSnapTargets) {
      options.snap = props.parsedSnapTargets = props.snapTargets = void 0;
    }
    if (newOptions.autoScroll) {
      var newAutoScrollOptions = isObject(newOptions.autoScroll) ? newOptions.autoScroll : {
        target: newOptions.autoScroll === true ? window : newOptions.autoScroll
      }, autoScrollOptions = {};
      autoScrollOptions.target = isElement(newAutoScrollOptions.target) ? newAutoScrollOptions.target : window;
      autoScrollOptions.speed = [];
      (Array.isArray(newAutoScrollOptions.speed) ? newAutoScrollOptions.speed : [newAutoScrollOptions.speed]).every(function(speed, i) {
        if (i <= 2 && isFinite(speed)) {
          autoScrollOptions.speed[i] = speed;
          return true;
        }
        return false;
      });
      if (!autoScrollOptions.speed.length) {
        autoScrollOptions.speed = AUTOSCROLL_SPEED;
      }
      var newSensitivity = Array.isArray(newAutoScrollOptions.sensitivity) ? newAutoScrollOptions.sensitivity : [newAutoScrollOptions.sensitivity];
      autoScrollOptions.sensitivity = autoScrollOptions.speed.map(function(v, i) {
        return isFinite(newSensitivity[i]) ? newSensitivity[i] : AUTOSCROLL_SENSITIVITY[i];
      });
      ["X", "Y"].forEach(function(option) {
        var optionMin = "min".concat(option), optionMax = "max".concat(option);
        if (isFinite(newAutoScrollOptions[optionMin]) && newAutoScrollOptions[optionMin] >= 0) {
          autoScrollOptions[optionMin] = newAutoScrollOptions[optionMin];
        }
        if (isFinite(newAutoScrollOptions[optionMax]) && newAutoScrollOptions[optionMax] >= 0 && (!autoScrollOptions[optionMin] || newAutoScrollOptions[optionMax] >= autoScrollOptions[optionMin])) {
          autoScrollOptions[optionMax] = newAutoScrollOptions[optionMax];
        }
      });
      if (hasChanged(autoScrollOptions, options.autoScroll)) {
        options.autoScroll = autoScrollOptions;
        needsInitBBox = true;
      }
    } else if (newOptions.hasOwnProperty("autoScroll")) {
      if (options.autoScroll) {
        needsInitBBox = true;
      }
      options.autoScroll = void 0;
    }
    if (needsInitBBox) {
      initBBox(props);
    }
    if (isElement(newOptions.handle) && newOptions.handle !== options.handle) {
      if (options.handle) {
        options.handle.style.cursor = props.orgCursor;
        if (cssPropUserSelect) {
          options.handle.style[cssPropUserSelect] = props.orgUserSelect;
        }
        pointerEvent.removeStartHandler(options.handle, props.pointerEventHandlerId);
      }
      var handle = options.handle = newOptions.handle;
      props.orgCursor = handle.style.cursor;
      setDraggableCursor(handle, props.orgCursor);
      if (cssPropUserSelect) {
        props.orgUserSelect = handle.style[cssPropUserSelect];
        handle.style[cssPropUserSelect] = "none";
      }
      pointerEvent.addStartHandler(handle, props.pointerEventHandlerId);
    }
    if (isFinite(newOptions.zIndex) || newOptions.zIndex === false) {
      options.zIndex = newOptions.zIndex;
      if (props === activeProps) {
        props.elementStyle.zIndex = options.zIndex === false ? props.orgZIndex : options.zIndex;
      }
    }
    var position = {
      left: props.elementBBox.left,
      top: props.elementBBox.top
    };
    var needsMove;
    if (isFinite(newOptions.left) && newOptions.left !== position.left) {
      position.left = newOptions.left;
      needsMove = true;
    }
    if (isFinite(newOptions.top) && newOptions.top !== position.top) {
      position.top = newOptions.top;
      needsMove = true;
    }
    if (needsMove) {
      move(props, position);
    }
    ["onDrag", "onMove", "onDragStart", "onMoveStart", "onDragEnd"].forEach(function(option) {
      if (typeof newOptions[option] === "function") {
        options[option] = newOptions[option];
        props[option] = options[option].bind(props.ins);
      } else if (newOptions.hasOwnProperty(option) && newOptions[option] == null) {
        options[option] = props[option] = void 0;
      }
    });
  }
  var PlainDraggable = /* @__PURE__ */ function() {
    function PlainDraggable2(element, options) {
      _classCallCheck2(this, PlainDraggable2);
      var props = {
        ins: this,
        options: {
          // Initial options (not default)
          zIndex: ZINDEX
          // Initial state.
        },
        disabled: false
      };
      Object.defineProperty(this, "_id", {
        value: ++insId
      });
      props._id = this._id;
      insProps[this._id] = props;
      if (!isElement(element) || element === body) {
        throw new Error("This element is not accepted.");
      }
      if (!options) {
        options = {};
      } else if (!isObject(options)) {
        throw new Error("Invalid options.");
      }
      var gpuTrigger = true;
      var ownerSvg;
      if (element instanceof SVGElement && (ownerSvg = element.ownerSVGElement)) {
        if (!element.getBBox) {
          throw new Error("This element is not accepted. (SVGLocatable)");
        }
        if (!element.transform) {
          throw new Error("This element is not accepted. (SVGAnimatedTransformList)");
        }
        props.svgTransform = element.transform.baseVal.appendItem(ownerSvg.createSVGTransform());
        props.svgPoint = ownerSvg.createSVGPoint();
        var svgView = element.nearestViewportElement || element.viewportElement;
        props.svgCtmElement = !IS_GECKO ? svgView : svgView.appendChild(document.createElementNS(ownerSvg.namespaceURI, "rect"));
        gpuTrigger = false;
        props.initElm = initSvg;
        props.moveElm = moveSvg;
      } else {
        var cssPropWillChange = cssprefix_esm_default.getName("willChange");
        if (cssPropWillChange) {
          gpuTrigger = false;
        }
        if (!options.leftTop && cssPropTransform) {
          if (cssPropWillChange) {
            element.style[cssPropWillChange] = "transform";
          }
          props.initElm = initTranslate;
          props.moveElm = moveTranslate;
        } else {
          if (cssPropWillChange) {
            element.style[cssPropWillChange] = "left, top";
          }
          props.initElm = initLeftTop;
          props.moveElm = moveLeftTop;
        }
      }
      props.element = initAnim(element, gpuTrigger);
      props.elementStyle = element.style;
      props.orgZIndex = props.elementStyle.zIndex;
      if (draggableClass) {
        m_class_list_esm_default(element).add(draggableClass);
      }
      props.pointerEventHandlerId = pointerEvent.regStartHandler(function(pointerXY) {
        return dragStart(props, pointerXY);
      });
      if (!options.containment) {
        var parent;
        options.containment = (parent = element.parentNode) && isElement(parent) ? parent : body;
      }
      if (!options.handle) {
        options.handle = element;
      }
      _setOptions(props, options);
    }
    _createClass2(PlainDraggable2, [{
      key: "remove",
      value: function remove2() {
        var props = insProps[this._id];
        this.disabled = true;
        pointerEvent.unregStartHandler(pointerEvent.removeStartHandler(props.options.handle, props.pointerEventHandlerId));
        delete insProps[this._id];
      }
      /**
       * @param {Object} options - New options.
       * @returns {PlainDraggable} Current instance itself.
       */
    }, {
      key: "setOptions",
      value: function setOptions(options) {
        if (isObject(options)) {
          _setOptions(insProps[this._id], options);
        }
        return this;
      }
    }, {
      key: "position",
      value: function position() {
        initBBox(insProps[this._id]);
        return this;
      }
    }, {
      key: "disabled",
      get: function get() {
        return insProps[this._id].disabled;
      },
      set: function set(value) {
        var props = insProps[this._id];
        if ((value = !!value) !== props.disabled) {
          props.disabled = value;
          if (props.disabled) {
            if (props === activeProps) {
              dragEnd(props);
            }
            props.options.handle.style.cursor = props.orgCursor;
            if (cssPropUserSelect) {
              props.options.handle.style[cssPropUserSelect] = props.orgUserSelect;
            }
            if (draggableClass) {
              m_class_list_esm_default(props.element).remove(draggableClass);
            }
          } else {
            setDraggableCursor(props.options.handle, props.orgCursor);
            if (cssPropUserSelect) {
              props.options.handle.style[cssPropUserSelect] = "none";
            }
            if (draggableClass) {
              m_class_list_esm_default(props.element).add(draggableClass);
            }
          }
        }
      }
    }, {
      key: "element",
      get: function get() {
        return insProps[this._id].element;
      }
    }, {
      key: "rect",
      get: function get() {
        return copyTree(insProps[this._id].elementBBox);
      }
    }, {
      key: "left",
      get: function get() {
        return insProps[this._id].elementBBox.left;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          left: value
        });
      }
    }, {
      key: "top",
      get: function get() {
        return insProps[this._id].elementBBox.top;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          top: value
        });
      }
    }, {
      key: "containment",
      get: function get() {
        var props = insProps[this._id];
        return props.containmentIsBBox ? ppBBox2OptionObject(props.options.containment) : props.options.containment;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          containment: value
        });
      }
      // [SNAP]
    }, {
      key: "snap",
      get: function get() {
        return copyTree(insProps[this._id].options.snap);
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          snap: value
        });
      }
      // [/SNAP]
      // [AUTO-SCROLL]
    }, {
      key: "autoScroll",
      get: function get() {
        return copyTree(insProps[this._id].options.autoScroll);
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          autoScroll: value
        });
      }
      // [/AUTO-SCROLL]
    }, {
      key: "handle",
      get: function get() {
        return insProps[this._id].options.handle;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          handle: value
        });
      }
    }, {
      key: "zIndex",
      get: function get() {
        return insProps[this._id].options.zIndex;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          zIndex: value
        });
      }
    }, {
      key: "onDrag",
      get: function get() {
        return insProps[this._id].options.onDrag;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          onDrag: value
        });
      }
    }, {
      key: "onMove",
      get: function get() {
        return insProps[this._id].options.onMove;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          onMove: value
        });
      }
    }, {
      key: "onDragStart",
      get: function get() {
        return insProps[this._id].options.onDragStart;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          onDragStart: value
        });
      }
    }, {
      key: "onMoveStart",
      get: function get() {
        return insProps[this._id].options.onMoveStart;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          onMoveStart: value
        });
      }
    }, {
      key: "onDragEnd",
      get: function get() {
        return insProps[this._id].options.onDragEnd;
      },
      set: function set(value) {
        _setOptions(insProps[this._id], {
          onDragEnd: value
        });
      }
    }], [{
      key: "draggableCursor",
      get: function get() {
        return cssWantedValueDraggableCursor;
      },
      set: function set(value) {
        if (cssWantedValueDraggableCursor !== value) {
          cssWantedValueDraggableCursor = value;
          cssValueDraggableCursor = null;
          Object.keys(insProps).forEach(function(id) {
            var props = insProps[id];
            if (props.disabled || props === activeProps && cssValueDraggingCursor !== false) {
              return;
            }
            setDraggableCursor(props.options.handle, props.orgCursor);
            if (props === activeProps) {
              body.style.cursor = cssOrgValueBodyCursor;
              body.style.cursor = window.getComputedStyle(props.options.handle, "").cursor;
            }
          });
        }
      }
    }, {
      key: "draggingCursor",
      get: function get() {
        return cssWantedValueDraggingCursor;
      },
      set: function set(value) {
        if (cssWantedValueDraggingCursor !== value) {
          cssWantedValueDraggingCursor = value;
          cssValueDraggingCursor = null;
          if (activeProps) {
            setDraggingCursor(activeProps.options.handle);
            if (cssValueDraggingCursor === false) {
              setDraggableCursor(activeProps.options.handle, activeProps.orgCursor);
              body.style.cursor = cssOrgValueBodyCursor;
            }
            body.style.cursor = cssValueDraggingCursor || // If it is `false` or `''`
            window.getComputedStyle(activeProps.options.handle, "").cursor;
          }
        }
      }
    }, {
      key: "draggableClass",
      get: function get() {
        return draggableClass;
      },
      set: function set(value) {
        value = value ? value + "" : void 0;
        if (value !== draggableClass) {
          Object.keys(insProps).forEach(function(id) {
            var props = insProps[id];
            if (!props.disabled) {
              var classList = m_class_list_esm_default(props.element);
              if (draggableClass) {
                classList.remove(draggableClass);
              }
              if (value) {
                classList.add(value);
              }
            }
          });
          draggableClass = value;
        }
      }
    }, {
      key: "draggingClass",
      get: function get() {
        return draggingClass;
      },
      set: function set(value) {
        value = value ? value + "" : void 0;
        if (value !== draggingClass) {
          if (activeProps) {
            var classList = m_class_list_esm_default(activeProps.element);
            if (draggingClass) {
              classList.remove(draggingClass);
            }
            if (value) {
              classList.add(value);
            }
          }
          draggingClass = value;
        }
      }
    }, {
      key: "movingClass",
      get: function get() {
        return movingClass;
      },
      set: function set(value) {
        value = value ? value + "" : void 0;
        if (value !== movingClass) {
          if (activeProps && hasMoved) {
            var classList = m_class_list_esm_default(activeProps.element);
            if (movingClass) {
              classList.remove(movingClass);
            }
            if (value) {
              classList.add(value);
            }
          }
          movingClass = value;
        }
      }
    }]);
    return PlainDraggable2;
  }();
  pointerEvent.addMoveHandler(document, function(pointerXY) {
    if (!activeProps) {
      return;
    }
    var position = {
      left: pointerXY.clientX + window.pageXOffset + pointerOffset.left,
      top: pointerXY.clientY + window.pageYOffset + pointerOffset.top
    };
    if (move(
      activeProps,
      position,
      // [SNAP]
      activeProps.snapTargets ? function(position2) {
        var iLen = activeProps.snapTargets.length;
        var snappedX = false, snappedY = false, i;
        for (i = 0; i < iLen && (!snappedX || !snappedY); i++) {
          var snapTarget = activeProps.snapTargets[i];
          if ((snapTarget.gravityXStart == null || position2.left >= snapTarget.gravityXStart) && (snapTarget.gravityXEnd == null || position2.left <= snapTarget.gravityXEnd) && (snapTarget.gravityYStart == null || position2.top >= snapTarget.gravityYStart) && (snapTarget.gravityYEnd == null || position2.top <= snapTarget.gravityYEnd)) {
            if (!snappedX && snapTarget.x != null) {
              position2.left = snapTarget.x;
              snappedX = true;
              i = -1;
            }
            if (!snappedY && snapTarget.y != null) {
              position2.top = snapTarget.y;
              snappedY = true;
              i = -1;
            }
          }
        }
        position2.snapped = snappedX || snappedY;
        return activeProps.onDrag ? activeProps.onDrag(position2) : true;
      } : (
        // [/SNAP]
        activeProps.onDrag
      )
    )) {
      var xyMoveArgs = {}, autoScroll = activeProps.autoScroll;
      if (autoScroll) {
        var clientXY = {
          x: activeProps.elementBBox.left - window.pageXOffset,
          y: activeProps.elementBBox.top - window.pageYOffset
        };
        ["x", "y"].forEach(function(axis) {
          if (autoScroll[axis]) {
            var min = autoScroll[axis].min, max = autoScroll[axis].max;
            autoScroll[axis].lines.some(function(line) {
              if (line.dir === -1 ? clientXY[axis] <= line.position : clientXY[axis] >= line.position) {
                xyMoveArgs[axis] = {
                  dir: line.dir,
                  speed: line.speed / 1e3,
                  min,
                  max
                };
                return true;
              }
              return false;
            });
          }
        });
      }
      if (xyMoveArgs.x || xyMoveArgs.y) {
        scrollFrame.move(autoScroll.target, xyMoveArgs, autoScroll.isWindow ? scrollXYWindow : scrollXYElement);
        position.autoScroll = true;
      } else {
        scrollFrame.stop();
      }
      if (!hasMoved) {
        hasMoved = true;
        if (movingClass) {
          m_class_list_esm_default(activeProps.element).add(movingClass);
        }
        if (activeProps.onMoveStart) {
          activeProps.onMoveStart(position);
        }
      }
      if (activeProps.onMove) {
        activeProps.onMove(position);
      }
    }
  });
  {
    let endHandler = function() {
      if (activeProps) {
        dragEnd(activeProps);
      }
    };
    pointerEvent.addEndHandler(document, endHandler);
    pointerEvent.addCancelHandler(document, endHandler);
  }
  {
    let initDoc = function() {
      cssPropTransitionProperty = cssprefix_esm_default.getName("transitionProperty");
      cssPropTransform = cssprefix_esm_default.getName("transform");
      cssOrgValueBodyCursor = body.style.cursor;
      if (cssPropUserSelect = cssprefix_esm_default.getName("userSelect")) {
        cssOrgValueBodyUserSelect = body.style[cssPropUserSelect];
      }
      var LAZY_INIT_DELAY = 200;
      var initDoneItems = {}, lazyInitTimer;
      function checkInitBBox(props, eventType) {
        if (props.initElm) {
          initBBox(props, eventType);
        }
      }
      function initAll(eventType) {
        clearTimeout(lazyInitTimer);
        Object.keys(insProps).forEach(function(id) {
          if (!initDoneItems[id]) {
            checkInitBBox(insProps[id], eventType);
          }
        });
        initDoneItems = {};
      }
      var layoutChanging = false;
      var layoutChange = anim_event_esm_default.add(function(event) {
        if (layoutChanging) {
          return;
        }
        layoutChanging = true;
        if (activeProps) {
          checkInitBBox(activeProps, event.type);
          pointerEvent.move();
          initDoneItems[activeProps._id] = true;
        }
        clearTimeout(lazyInitTimer);
        lazyInitTimer = setTimeout(function() {
          initAll(event.type);
        }, LAZY_INIT_DELAY);
        layoutChanging = false;
      });
      window.addEventListener("resize", layoutChange, true);
      window.addEventListener("scroll", layoutChange, true);
    };
    if (body = document.body) {
      initDoc();
    } else {
      document.addEventListener("DOMContentLoaded", function() {
        body = document.body;
        initDoc();
      }, true);
    }
  }
  var plain_draggable_esm_default = PlainDraggable;

  // code/playground.ts
  window.addEventListener("load", function() {
    let elementCounter = 1;
    let startElement = null;
    let lines = [];
    const lineData = [];
    function createDraggable(element) {
      const draggable = new plain_draggable_esm_default(element, {
        onMove: function() {
        }
      });
      element.addEventListener("click", (event) => {
      });
    }
    function addDraggableElement(content, tag = "div", isImage = false) {
      const element = document.createElement(tag);
      element.className = "drag-drop w-fit";
      element.setAttribute("data-id", elementCounter++);
      element.style.position = "absolute";
      if (isImage) {
        element.src = content;
      } else {
        element.textContent = content;
      }
      document.getElementById("canvas").appendChild(element);
      createDraggable(element);
    }
    document.getElementById("add-text").addEventListener("click", () => {
      addDraggableElement("write something");
    });
    document.getElementById("add-image").addEventListener("click", () => {
      addDraggableElement("https://picsum.photos/200", "img", true);
    });
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("click", () => {
      if (startElement) {
        startElement.classList.remove("ring-2", "ring-blue-500");
        startElement = null;
      }
    });
    const container = canvas;
    container.addEventListener("paste", (event) => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;
      let contentAdded = false;
      for (const item of clipboardData.items) {
        if (item.kind === "string" && item.type === "text/html") {
          item.getAsString((html) => {
            console.log(html);
            const htmlDiv = document.createElement("div");
            htmlDiv.innerHTML = html;
            htmlDiv.style.border = "1px dashed blue";
            container.appendChild(htmlDiv);
            contentAdded = true;
          });
        }
      }
      if (!contentAdded) {
        const text = clipboardData.getData("text/plain");
        if (text) {
          const textDiv = document.createElement("div");
          textDiv.textContent = text;
          textDiv.style.border = "1px solid black";
          textDiv.style.padding = "5px";
          textDiv.style.backgroundColor = "#f9f9f9";
          container.appendChild(textDiv);
          contentAdded = true;
        }
      }
      if (!contentAdded) {
        const html = clipboardData.getData("text/html");
        if (html) {
          const htmlDiv = document.createElement("div");
          htmlDiv.innerHTML = html;
          htmlDiv.style.border = "1px dashed blue";
          container.appendChild(htmlDiv);
          contentAdded = true;
        }
      }
      if (!contentAdded) {
        alert("No supported content detected.");
      }
    });
    const dropZone = canvas;
    dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropZone.style.borderColor = "blue";
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "gray";
    });
    dropZone.addEventListener("drop", async (event) => {
      event.preventDefault();
      dropZone.style.borderColor = "gray";
      const dataTransfer = event.dataTransfer;
      if (!dataTransfer) return;
      const file = dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);
        console.log("Image URL (from file):", imageUrl);
        displayImage(imageUrl);
      } else {
        const url = await getDraggedImageUrl(dataTransfer.items);
        if (url) {
          console.log("Image URL (from browser):", url);
          displayImage(url);
        } else {
          alert("Please drop a valid image or an image URL.");
        }
      }
    });
    const getDraggedImageUrl = async (items) => {
      for (const item of items) {
        console.log(item);
        if (item.kind === "string" && item.type === "text/uri-list") {
          return new Promise((resolve) => {
            item.getAsString((url) => {
              resolve(url);
            });
          });
        }
      }
      return null;
    };
    const displayImage = (imageUrl) => {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      dropZone.textContent = "";
      dropZone.appendChild(img);
    };
  });
  function getHTML() {
    const canvas = document.getElementById("canvas");
    return canvas.innerHTML;
  }
  window.getHTML = getHTML;
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbm9kZV9tb2R1bGVzL3BsYWluLWRyYWdnYWJsZS9ub2RlX21vZHVsZXMvYW5pbS1ldmVudC9hbmltLWV2ZW50LmVzbS5qcyIsICIuLi9ub2RlX21vZHVsZXMvcGxhaW4tZHJhZ2dhYmxlL25vZGVfbW9kdWxlcy9wb2ludGVyLWV2ZW50L3BvaW50ZXItZXZlbnQuZXNtLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9wbGFpbi1kcmFnZ2FibGUvbm9kZV9tb2R1bGVzL2Nzc3ByZWZpeC9jc3NwcmVmaXguZXNtLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9wbGFpbi1kcmFnZ2FibGUvbm9kZV9tb2R1bGVzL20tY2xhc3MtbGlzdC9tLWNsYXNzLWxpc3QuZXNtLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9wbGFpbi1kcmFnZ2FibGUvcGxhaW4tZHJhZ2dhYmxlLmVzbS5qcyIsICIuLi9jb2RlL3BsYXlncm91bmQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICBET04nVCBNQU5VQUxMWSBFRElUIFRISVMgRklMRVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbi8qXG4gKiBBbmltRXZlbnRcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbnNla2kvYW5pbS1ldmVudFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAyMSBhbnNla2lcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xudmFyIE1TUEYgPSAxMDAwIC8gNjAsXG4gICAgLy8gbXMvZnJhbWUgKEZQUzogNjApXG5LRUVQX0xPT1AgPSA1MDAsXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gdGFza1xuICogQHByb3BlcnR5IHtFdmVudH0gZXZlbnRcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gKi9cblxuLyoqIEB0eXBlIHt0YXNrW119ICovXG50YXNrcyA9IFtdO1xuXG52YXIgcmVxdWVzdEFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHJldHVybiBzZXRUaW1lb3V0KGNhbGxiYWNrLCBNU1BGKTtcbn0sXG4gICAgY2FuY2VsQW5pbSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc0NhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uIChyZXF1ZXN0SUQpIHtcbiAgcmV0dXJuIGNsZWFyVGltZW91dChyZXF1ZXN0SUQpO1xufTtcblxudmFyIGxhc3RGcmFtZVRpbWUgPSBEYXRlLm5vdygpLFxuICAgIHJlcXVlc3RJRDtcblxuZnVuY3Rpb24gc3RlcCgpIHtcbiAgdmFyIGNhbGxlZCwgbmV4dDtcblxuICBpZiAocmVxdWVzdElEKSB7XG4gICAgY2FuY2VsQW5pbS5jYWxsKHdpbmRvdywgcmVxdWVzdElEKTtcbiAgICByZXF1ZXN0SUQgPSBudWxsO1xuICB9XG5cbiAgdGFza3MuZm9yRWFjaChmdW5jdGlvbiAodGFzaykge1xuICAgIHZhciBldmVudDtcblxuICAgIGlmIChldmVudCA9IHRhc2suZXZlbnQpIHtcbiAgICAgIHRhc2suZXZlbnQgPSBudWxsOyAvLyBDbGVhciBpdCBiZWZvcmUgYHRhc2subGlzdGVuZXIoKWAgYmVjYXVzZSB0aGF0IG1pZ2h0IGZpcmUgYW5vdGhlciBldmVudC5cblxuICAgICAgdGFzay5saXN0ZW5lcihldmVudCk7XG4gICAgICBjYWxsZWQgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKGNhbGxlZCkge1xuICAgIGxhc3RGcmFtZVRpbWUgPSBEYXRlLm5vdygpO1xuICAgIG5leHQgPSB0cnVlO1xuICB9IGVsc2UgaWYgKERhdGUubm93KCkgLSBsYXN0RnJhbWVUaW1lIDwgS0VFUF9MT09QKSB7XG4gICAgLy8gR28gb24gZm9yIGEgd2hpbGVcbiAgICBuZXh0ID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChuZXh0KSB7XG4gICAgcmVxdWVzdElEID0gcmVxdWVzdEFuaW0uY2FsbCh3aW5kb3csIHN0ZXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluZGV4T2ZUYXNrcyhsaXN0ZW5lcikge1xuICB2YXIgaW5kZXggPSAtMTtcbiAgdGFza3Muc29tZShmdW5jdGlvbiAodGFzaywgaSkge1xuICAgIGlmICh0YXNrLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgaW5kZXggPSBpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcbiAgcmV0dXJuIGluZGV4O1xufVxuXG52YXIgQW5pbUV2ZW50ID0ge1xuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXIgLSBBbiBldmVudCBsaXN0ZW5lci5cbiAgICogQHJldHVybnMgeyhmdW5jdGlvbnxudWxsKX0gQSB3cmFwcGVkIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgYWRkOiBmdW5jdGlvbiBhZGQobGlzdGVuZXIpIHtcbiAgICB2YXIgdGFzaztcblxuICAgIGlmIChpbmRleE9mVGFza3MobGlzdGVuZXIpID09PSAtMSkge1xuICAgICAgdGFza3MucHVzaCh0YXNrID0ge1xuICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXJcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0YXNrLmV2ZW50ID0gZXZlbnQ7XG5cbiAgICAgICAgaWYgKCFyZXF1ZXN0SUQpIHtcbiAgICAgICAgICBzdGVwKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKGxpc3RlbmVyKSB7XG4gICAgdmFyIGlSZW1vdmU7XG5cbiAgICBpZiAoKGlSZW1vdmUgPSBpbmRleE9mVGFza3MobGlzdGVuZXIpKSA+IC0xKSB7XG4gICAgICB0YXNrcy5zcGxpY2UoaVJlbW92ZSwgMSk7XG5cbiAgICAgIGlmICghdGFza3MubGVuZ3RoICYmIHJlcXVlc3RJRCkge1xuICAgICAgICBjYW5jZWxBbmltLmNhbGwod2luZG93LCByZXF1ZXN0SUQpO1xuICAgICAgICByZXF1ZXN0SUQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbmV4cG9ydCBkZWZhdWx0IEFuaW1FdmVudDsiLCAiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIERPTidUIE1BTlVBTExZIEVESVQgVEhJUyBGSUxFXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG4vKlxuICogUG9pbnRlckV2ZW50XG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5zZWtpL3BvaW50ZXItZXZlbnRcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjIgYW5zZWtpXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cbmltcG9ydCBBbmltRXZlbnQgZnJvbSAnYW5pbS1ldmVudCc7XG52YXIgTU9VU0VfRU1VX0lOVEVSVkFMID0gNDAwLFxuICAgIC8vIEF2b2lkIG1vdXNlIGV2ZW50cyBlbXVsYXRpb25cbkNMSUNLX0VNVUxBVE9SX0VMRU1FTlRTID0gW10sXG4gICAgREJMQ0xJQ0tfRU1VTEFUT1JfRUxFTUVOVFMgPSBbXTsgLy8gU3VwcG9ydCBvcHRpb25zIGZvciBhZGRFdmVudExpc3RlbmVyXG5cbnZhciBwYXNzaXZlU3VwcG9ydGVkID0gZmFsc2U7XG5cbnRyeSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0ZXN0JywgbnVsbCwgT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAncGFzc2l2ZScsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHBhc3NpdmVTdXBwb3J0ZWQgPSB0cnVlO1xuICAgIH1cbiAgfSkpO1xufSBjYXRjaCAoZXJyb3IpIHtcbiAgLyogaWdub3JlICovXG59XG4vKipcbiAqIGFkZEV2ZW50TGlzdGVuZXIgd2l0aCBzcGVjaWZpYyBvcHRpb24uXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEFuIGV2ZW50LXRhcmdldCBlbGVtZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBUaGUgZXZlbnQgdHlwZSB0byBsaXN0ZW4gZm9yLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXIgLSBUaGUgRXZlbnRMaXN0ZW5lci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gQW4gb3B0aW9ucyBvYmplY3QuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuXG5cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJXaXRoT3B0aW9ucyh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKSB7XG4gIC8vIFdoZW4gYHBhc3NpdmVgIGlzIG5vdCBzdXBwb3J0ZWQsIGNvbnNpZGVyIHRoYXQgdGhlIGB1c2VDYXB0dXJlYCBpcyBzdXBwb3J0ZWQgaW5zdGVhZCBvZlxuICAvLyBgb3B0aW9uc2AgKGkuZS4gb3B0aW9ucyBvdGhlciB0aGFuIHRoZSBgcGFzc2l2ZWAgYWxzbyBhcmUgbm90IHN1cHBvcnRlZCkuXG4gIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBwYXNzaXZlU3VwcG9ydGVkID8gb3B0aW9ucyA6IG9wdGlvbnMuY2FwdHVyZSk7XG59XG5cbmZ1bmN0aW9uIGdldFBvaW50c0xlbmd0aChwMCwgcDEpIHtcbiAgdmFyIGx4ID0gcDAueCAtIHAxLngsXG4gICAgICBseSA9IHAwLnkgLSBwMS55O1xuICByZXR1cm4gTWF0aC5zcXJ0KGx4ICogbHggKyBseSAqIGx5KTtcbn1cbi8qKlxuICogR2V0IFRvdWNoIGluc3RhbmNlIGluIGxpc3QuXG4gKiBAcGFyYW0ge1RvdWNoW119IHRvdWNoZXMgLSBBbiBBcnJheSBvciBUb3VjaExpc3QgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gaWQgLSBUb3VjaCNpZGVudGlmaWVyXG4gKiBAcmV0dXJucyB7KFRvdWNofG51bGwpfSAtIEEgZm91bmQgVG91Y2ggaW5zdGFuY2UuXG4gKi9cblxuXG5mdW5jdGlvbiBnZXRUb3VjaEJ5SWQodG91Y2hlcywgaWQpIHtcbiAgaWYgKHRvdWNoZXMgIT0gbnVsbCAmJiBpZCAhPSBudWxsKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodG91Y2hlc1tpXS5pZGVudGlmaWVyID09PSBpZCkge1xuICAgICAgICByZXR1cm4gdG91Y2hlc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IHh5IC0gU29tZXRoaW5nIHRoYXQgbWlnaHQgaGF2ZSBjbGllbnRYIGFuZCBjbGllbnRZLlxuICogQHJldHVybnMge2Jvb2xlYW59IC0gYHRydWVgIGlmIGl0IGhhcyB2YWxpZCBjbGllbnRYIGFuZCBjbGllbnRZLlxuICovXG5cblxuZnVuY3Rpb24gaGFzWFkoeHkpIHtcbiAgcmV0dXJuIHh5ICYmIHR5cGVvZiB4eS5jbGllbnRYID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgeHkuY2xpZW50WSA9PT0gJ251bWJlcic7XG59IC8vIEdlY2tvLCBUcmlkZW50IHBpY2sgZHJhZy1ldmVudCBvZiBzb21lIGVsZW1lbnRzIHN1Y2ggYXMgaW1nLCBhLCBldGMuXG5cblxuZnVuY3Rpb24gZHJhZ3N0YXJ0KGV2ZW50KSB7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59XG5cbnZhciBQb2ludGVyRXZlbnQgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ3JlYXRlIGEgYFBvaW50ZXJFdmVudGAgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAqL1xuICBmdW5jdGlvbiBQb2ludGVyRXZlbnQob3B0aW9ucykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUG9pbnRlckV2ZW50KTtcblxuICAgIHRoaXMuc3RhcnRIYW5kbGVycyA9IHt9O1xuICAgIHRoaXMubGFzdEhhbmRsZXJJZCA9IDA7XG4gICAgdGhpcy5jdXJQb2ludGVyQ2xhc3MgPSBudWxsO1xuICAgIHRoaXMuY3VyVG91Y2hJZCA9IG51bGw7XG4gICAgdGhpcy5sYXN0UG9pbnRlclhZID0ge1xuICAgICAgY2xpZW50WDogMCxcbiAgICAgIGNsaWVudFk6IDBcbiAgICB9O1xuICAgIHRoaXMubGFzdFRvdWNoVGltZSA9IDA7IC8vIE9wdGlvbnNcblxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC8vIERlZmF1bHRcbiAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlLFxuICAgICAgc3RvcFByb3BhZ2F0aW9uOiB0cnVlXG4gICAgfTtcblxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICBbJ3ByZXZlbnREZWZhdWx0JywgJ3N0b3BQcm9wYWdhdGlvbiddLmZvckVhY2goZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnNbb3B0aW9uXSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgX3RoaXMub3B0aW9uc1tvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHN0YXJ0SGFuZGxlciAtIFRoaXMgaXMgY2FsbGVkIHdpdGggcG9pbnRlclhZIHdoZW4gaXQgc3RhcnRzLiBUaGlzIHJldHVybnMgYm9vbGVhbi5cbiAgICogQHJldHVybnMge251bWJlcn0gaGFuZGxlcklkIHdoaWNoIGlzIHVzZWQgZm9yIGFkZGluZy9yZW1vdmluZyB0byBlbGVtZW50LlxuICAgKi9cblxuXG4gIF9jcmVhdGVDbGFzcyhQb2ludGVyRXZlbnQsIFt7XG4gICAga2V5OiBcInJlZ1N0YXJ0SGFuZGxlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWdTdGFydEhhbmRsZXIoc3RhcnRIYW5kbGVyKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgIHRoYXQuc3RhcnRIYW5kbGVyc1srK3RoYXQubGFzdEhhbmRsZXJJZF0gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHBvaW50ZXJDbGFzcyA9IGV2ZW50LnR5cGUgPT09ICdtb3VzZWRvd24nID8gJ21vdXNlJyA6ICd0b3VjaCcsXG4gICAgICAgICAgICBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgcG9pbnRlclhZLCB0b3VjaElkO1xuXG4gICAgICAgIGlmIChwb2ludGVyQ2xhc3MgPT09ICd0b3VjaCcpIHtcbiAgICAgICAgICB0aGF0Lmxhc3RUb3VjaFRpbWUgPSBub3c7IC8vIEF2b2lkIG1vdXNlIGV2ZW50cyBlbXVsYXRpb25cblxuICAgICAgICAgIHBvaW50ZXJYWSA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgICAgICAgIHRvdWNoSWQgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXS5pZGVudGlmaWVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEF2b2lkIG1vdXNlIGV2ZW50cyBlbXVsYXRpb25cbiAgICAgICAgICBpZiAobm93IC0gdGhhdC5sYXN0VG91Y2hUaW1lIDwgTU9VU0VfRU1VX0lOVEVSVkFMKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9pbnRlclhZID0gZXZlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhhc1hZKHBvaW50ZXJYWSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGNsaWVudFgvY2xpZW50WScpO1xuICAgICAgICB9IC8vIEl0IGlzIG5ldyBvbmUgZXZlbiBpZiB0aG9zZSBhcmUgJ21vdXNlJyBvciBJRCBpcyBzYW1lLCB0aGVuIGNhbmNlbCBjdXJyZW50IG9uZS5cblxuXG4gICAgICAgIGlmICh0aGF0LmN1clBvaW50ZXJDbGFzcykge1xuICAgICAgICAgIHRoYXQuY2FuY2VsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RhcnRIYW5kbGVyLmNhbGwodGhhdCwgcG9pbnRlclhZKSkge1xuICAgICAgICAgIHRoYXQuY3VyUG9pbnRlckNsYXNzID0gcG9pbnRlckNsYXNzO1xuICAgICAgICAgIHRoYXQuY3VyVG91Y2hJZCA9IHBvaW50ZXJDbGFzcyA9PT0gJ3RvdWNoJyA/IHRvdWNoSWQgOiBudWxsO1xuICAgICAgICAgIHRoYXQubGFzdFBvaW50ZXJYWS5jbGllbnRYID0gcG9pbnRlclhZLmNsaWVudFg7XG4gICAgICAgICAgdGhhdC5sYXN0UG9pbnRlclhZLmNsaWVudFkgPSBwb2ludGVyWFkuY2xpZW50WTtcblxuICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHRoYXQubGFzdEhhbmRsZXJJZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhhbmRsZXJJZCAtIEFuIElEIHdoaWNoIHdhcyByZXR1cm5lZCBieSByZWdTdGFydEhhbmRsZXIuXG4gICAgICogQHJldHVybnMge3ZvaWR9XG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJ1bnJlZ1N0YXJ0SGFuZGxlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1bnJlZ1N0YXJ0SGFuZGxlcihoYW5kbGVySWQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnN0YXJ0SGFuZGxlcnNbaGFuZGxlcklkXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IC0gQSB0YXJnZXQgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGFuZGxlcklkIC0gQW4gSUQgd2hpY2ggd2FzIHJldHVybmVkIGJ5IHJlZ1N0YXJ0SGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBoYW5kbGVySWQgd2hpY2ggd2FzIHBhc3NlZC5cbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcImFkZFN0YXJ0SGFuZGxlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRTdGFydEhhbmRsZXIoZWxlbWVudCwgaGFuZGxlcklkKSB7XG4gICAgICBpZiAoIXRoaXMuc3RhcnRIYW5kbGVyc1toYW5kbGVySWRdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaGFuZGxlcklkOiBcIi5jb25jYXQoaGFuZGxlcklkKSk7XG4gICAgICB9XG5cbiAgICAgIGFkZEV2ZW50TGlzdGVuZXJXaXRoT3B0aW9ucyhlbGVtZW50LCAnbW91c2Vkb3duJywgdGhpcy5zdGFydEhhbmRsZXJzW2hhbmRsZXJJZF0sIHtcbiAgICAgICAgY2FwdHVyZTogZmFsc2UsXG4gICAgICAgIHBhc3NpdmU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXJXaXRoT3B0aW9ucyhlbGVtZW50LCAndG91Y2hzdGFydCcsIHRoaXMuc3RhcnRIYW5kbGVyc1toYW5kbGVySWRdLCB7XG4gICAgICAgIGNhcHR1cmU6IGZhbHNlLFxuICAgICAgICBwYXNzaXZlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICBhZGRFdmVudExpc3RlbmVyV2l0aE9wdGlvbnMoZWxlbWVudCwgJ2RyYWdzdGFydCcsIGRyYWdzdGFydCwge1xuICAgICAgICBjYXB0dXJlOiBmYWxzZSxcbiAgICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGhhbmRsZXJJZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IC0gQSB0YXJnZXQgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGFuZGxlcklkIC0gQW4gSUQgd2hpY2ggd2FzIHJldHVybmVkIGJ5IHJlZ1N0YXJ0SGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBoYW5kbGVySWQgd2hpY2ggd2FzIHBhc3NlZC5cbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZVN0YXJ0SGFuZGxlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVTdGFydEhhbmRsZXIoZWxlbWVudCwgaGFuZGxlcklkKSB7XG4gICAgICBpZiAoIXRoaXMuc3RhcnRIYW5kbGVyc1toYW5kbGVySWRdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaGFuZGxlcklkOiBcIi5jb25jYXQoaGFuZGxlcklkKSk7XG4gICAgICB9XG5cbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5zdGFydEhhbmRsZXJzW2hhbmRsZXJJZF0sIGZhbHNlKTtcbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuc3RhcnRIYW5kbGVyc1toYW5kbGVySWRdLCBmYWxzZSk7XG4gICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIGRyYWdzdGFydCwgZmFsc2UpO1xuICAgICAgcmV0dXJuIGhhbmRsZXJJZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IC0gQSB0YXJnZXQgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtb3ZlSGFuZGxlciAtIFRoaXMgaXMgY2FsbGVkIHdpdGggcG9pbnRlclhZIHdoZW4gaXQgbW92ZXMuXG4gICAgICogQHBhcmFtIHs/Ym9vbGVhbn0gcmF3RXZlbnQgLSBDYXB0dXJlIGV2ZW50cyB3aXRob3V0IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLlxuICAgICAqIEByZXR1cm5zIHt2b2lkfVxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiYWRkTW92ZUhhbmRsZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkTW92ZUhhbmRsZXIoZWxlbWVudCwgbW92ZUhhbmRsZXIsIHJhd0V2ZW50KSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgICAgICAgdmFyIHBvaW50ZXJDbGFzcyA9IGV2ZW50LnR5cGUgPT09ICdtb3VzZW1vdmUnID8gJ21vdXNlJyA6ICd0b3VjaCc7IC8vIEF2b2lkIG1vdXNlIGV2ZW50cyBlbXVsYXRpb25cblxuICAgICAgICBpZiAocG9pbnRlckNsYXNzID09PSAndG91Y2gnKSB7XG4gICAgICAgICAgdGhhdC5sYXN0VG91Y2hUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb2ludGVyQ2xhc3MgPT09IHRoYXQuY3VyUG9pbnRlckNsYXNzKSB7XG4gICAgICAgICAgdmFyIHBvaW50ZXJYWSA9IHBvaW50ZXJDbGFzcyA9PT0gJ3RvdWNoJyA/IGdldFRvdWNoQnlJZChldmVudC5jaGFuZ2VkVG91Y2hlcywgdGhhdC5jdXJUb3VjaElkKSA6IGV2ZW50O1xuXG4gICAgICAgICAgaWYgKGhhc1hZKHBvaW50ZXJYWSkpIHtcbiAgICAgICAgICAgIGlmIChwb2ludGVyWFkuY2xpZW50WCAhPT0gdGhhdC5sYXN0UG9pbnRlclhZLmNsaWVudFggfHwgcG9pbnRlclhZLmNsaWVudFkgIT09IHRoYXQubGFzdFBvaW50ZXJYWS5jbGllbnRZKSB7XG4gICAgICAgICAgICAgIHRoYXQubW92ZShwb2ludGVyWFkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgd3JhcHBlZEhhbmRsZXIgPSByYXdFdmVudCA/IGhhbmRsZXIgOiBBbmltRXZlbnQuYWRkKGhhbmRsZXIpO1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcldpdGhPcHRpb25zKGVsZW1lbnQsICdtb3VzZW1vdmUnLCB3cmFwcGVkSGFuZGxlciwge1xuICAgICAgICBjYXB0dXJlOiBmYWxzZSxcbiAgICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcldpdGhPcHRpb25zKGVsZW1lbnQsICd0b3VjaG1vdmUnLCB3cmFwcGVkSGFuZGxlciwge1xuICAgICAgICBjYXB0dXJlOiBmYWxzZSxcbiAgICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgdGhhdC5jdXJNb3ZlSGFuZGxlciA9IG1vdmVIYW5kbGVyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3tjbGllbnRYLCBjbGllbnRZfX0gW3BvaW50ZXJYWV0gLSBUaGlzIG1pZ2h0IGJlIE1vdXNlRXZlbnQsIFRvdWNoIG9mIFRvdWNoRXZlbnQgb3IgT2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHt2b2lkfVxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwibW92ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlKHBvaW50ZXJYWSkge1xuICAgICAgaWYgKGhhc1hZKHBvaW50ZXJYWSkpIHtcbiAgICAgICAgdGhpcy5sYXN0UG9pbnRlclhZLmNsaWVudFggPSBwb2ludGVyWFkuY2xpZW50WDtcbiAgICAgICAgdGhpcy5sYXN0UG9pbnRlclhZLmNsaWVudFkgPSBwb2ludGVyWFkuY2xpZW50WTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY3VyTW92ZUhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5jdXJNb3ZlSGFuZGxlcih0aGlzLmxhc3RQb2ludGVyWFkpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgLSBBIHRhcmdldCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGVuZEhhbmRsZXIgLSBUaGlzIGlzIGNhbGxlZCB3aXRoIHBvaW50ZXJYWSB3aGVuIGl0IGVuZHMuXG4gICAgICogQHJldHVybnMge3ZvaWR9XG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJhZGRFbmRIYW5kbGVyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZEVuZEhhbmRsZXIoZWxlbWVudCwgZW5kSGFuZGxlcikge1xuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICBmdW5jdGlvbiB3cmFwcGVkSGFuZGxlcihldmVudCkge1xuICAgICAgICB2YXIgcG9pbnRlckNsYXNzID0gZXZlbnQudHlwZSA9PT0gJ21vdXNldXAnID8gJ21vdXNlJyA6ICd0b3VjaCc7IC8vIEF2b2lkIG1vdXNlIGV2ZW50cyBlbXVsYXRpb25cblxuICAgICAgICBpZiAocG9pbnRlckNsYXNzID09PSAndG91Y2gnKSB7XG4gICAgICAgICAgdGhhdC5sYXN0VG91Y2hUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb2ludGVyQ2xhc3MgPT09IHRoYXQuY3VyUG9pbnRlckNsYXNzKSB7XG4gICAgICAgICAgdmFyIHBvaW50ZXJYWSA9IHBvaW50ZXJDbGFzcyA9PT0gJ3RvdWNoJyA/IGdldFRvdWNoQnlJZChldmVudC5jaGFuZ2VkVG91Y2hlcywgdGhhdC5jdXJUb3VjaElkKSB8fCAoIC8vIEl0IG1pZ2h0IGhhdmUgYmVlbiByZW1vdmVkIGZyb20gYHRvdWNoZXNgIGV2ZW4gaWYgaXQgaXMgbm90IGluIGBjaGFuZ2VkVG91Y2hlc2AuXG4gICAgICAgICAgZ2V0VG91Y2hCeUlkKGV2ZW50LnRvdWNoZXMsIHRoYXQuY3VyVG91Y2hJZCkgPyBudWxsIDoge30pIDogLy8gYHt9YCBtZWFucyBtYXRjaGluZ1xuICAgICAgICAgIGV2ZW50O1xuXG4gICAgICAgICAgaWYgKHBvaW50ZXJYWSkge1xuICAgICAgICAgICAgdGhhdC5lbmQocG9pbnRlclhZKTtcblxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLnN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYWRkRXZlbnRMaXN0ZW5lcldpdGhPcHRpb25zKGVsZW1lbnQsICdtb3VzZXVwJywgd3JhcHBlZEhhbmRsZXIsIHtcbiAgICAgICAgY2FwdHVyZTogZmFsc2UsXG4gICAgICAgIHBhc3NpdmU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXJXaXRoT3B0aW9ucyhlbGVtZW50LCAndG91Y2hlbmQnLCB3cmFwcGVkSGFuZGxlciwge1xuICAgICAgICBjYXB0dXJlOiBmYWxzZSxcbiAgICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgdGhhdC5jdXJFbmRIYW5kbGVyID0gZW5kSGFuZGxlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHt7Y2xpZW50WCwgY2xpZW50WX19IFtwb2ludGVyWFldIC0gVGhpcyBtaWdodCBiZSBNb3VzZUV2ZW50LCBUb3VjaCBvZiBUb3VjaEV2ZW50IG9yIE9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcImVuZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBlbmQocG9pbnRlclhZKSB7XG4gICAgICBpZiAoaGFzWFkocG9pbnRlclhZKSkge1xuICAgICAgICB0aGlzLmxhc3RQb2ludGVyWFkuY2xpZW50WCA9IHBvaW50ZXJYWS5jbGllbnRYO1xuICAgICAgICB0aGlzLmxhc3RQb2ludGVyWFkuY2xpZW50WSA9IHBvaW50ZXJYWS5jbGllbnRZO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5jdXJFbmRIYW5kbGVyKSB7XG4gICAgICAgIHRoaXMuY3VyRW5kSGFuZGxlcih0aGlzLmxhc3RQb2ludGVyWFkpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmN1clBvaW50ZXJDbGFzcyA9IHRoaXMuY3VyVG91Y2hJZCA9IG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCAtIEEgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FuY2VsSGFuZGxlciAtIFRoaXMgaXMgY2FsbGVkIHdoZW4gaXQgY2FuY2Vscy5cbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcImFkZENhbmNlbEhhbmRsZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkQ2FuY2VsSGFuZGxlcihlbGVtZW50LCBjYW5jZWxIYW5kbGVyKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgIGZ1bmN0aW9uIHdyYXBwZWRIYW5kbGVyKGV2ZW50KSB7XG4gICAgICAgIC8qXG4gICAgICAgICAgTm93LCB0aGlzIGlzIGZpcmVkIGJ5IHRvdWNoY2FuY2VsIG9ubHksIGJ1dCBpdCBtaWdodCBiZSBmaXJlZCBldmVuIGlmIGN1clBvaW50ZXJDbGFzcyBpcyBtb3VzZS5cbiAgICAgICAgKi9cbiAgICAgICAgLy8gY29uc3QgcG9pbnRlckNsYXNzID0gJ3RvdWNoJztcbiAgICAgICAgdGhhdC5sYXN0VG91Y2hUaW1lID0gRGF0ZS5ub3coKTsgLy8gQXZvaWQgbW91c2UgZXZlbnRzIGVtdWxhdGlvblxuXG4gICAgICAgIGlmICh0aGF0LmN1clBvaW50ZXJDbGFzcyAhPSBudWxsKSB7XG4gICAgICAgICAgdmFyIHBvaW50ZXJYWSA9IGdldFRvdWNoQnlJZChldmVudC5jaGFuZ2VkVG91Y2hlcywgdGhhdC5jdXJUb3VjaElkKSB8fCAoIC8vIEl0IG1pZ2h0IGhhdmUgYmVlbiByZW1vdmVkIGZyb20gYHRvdWNoZXNgIGV2ZW4gaWYgaXQgaXMgbm90IGluIGBjaGFuZ2VkVG91Y2hlc2AuXG4gICAgICAgICAgZ2V0VG91Y2hCeUlkKGV2ZW50LnRvdWNoZXMsIHRoYXQuY3VyVG91Y2hJZCkgPyBudWxsIDoge30pOyAvLyBge31gIG1lYW5zIG1hdGNoaW5nXG5cbiAgICAgICAgICBpZiAocG9pbnRlclhZKSB7XG4gICAgICAgICAgICB0aGF0LmNhbmNlbCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhZGRFdmVudExpc3RlbmVyV2l0aE9wdGlvbnMoZWxlbWVudCwgJ3RvdWNoY2FuY2VsJywgd3JhcHBlZEhhbmRsZXIsIHtcbiAgICAgICAgY2FwdHVyZTogZmFsc2UsXG4gICAgICAgIHBhc3NpdmU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIHRoYXQuY3VyQ2FuY2VsSGFuZGxlciA9IGNhbmNlbEhhbmRsZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHt2b2lkfVxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiY2FuY2VsXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICAgIGlmICh0aGlzLmN1ckNhbmNlbEhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5jdXJDYW5jZWxIYW5kbGVyKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY3VyUG9pbnRlckNsYXNzID0gdGhpcy5jdXJUb3VjaElkID0gbnVsbDtcbiAgICB9XG4gIH1dLCBbe1xuICAgIGtleTogXCJhZGRFdmVudExpc3RlbmVyV2l0aE9wdGlvbnNcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBhZGRFdmVudExpc3RlbmVyV2l0aE9wdGlvbnM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVtdWxhdGUgYGNsaWNrYCBldmVudCB2aWEgYHRvdWNoZW5kYCBldmVudC5cbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudCwgbGlzdGVuZXJzIHRoYXQgY2FsbCBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgYXJlIGF0dGFjaGVkIGxhdGVyLlxuICAgICAqIEBwYXJhbSB7P251bWJlcn0gbW92ZVRvbGVyYW5jZSAtIE1vdmUgdG9sZXJhbmNlLlxuICAgICAqIEBwYXJhbSB7P251bWJlcn0gdGltZVRvbGVyYW5jZSAtIFRpbWUgdG9sZXJhbmNlLlxuICAgICAqIEByZXR1cm5zIHtFbGVtZW50fSBUaGUgcGFzc2VkIGBlbGVtZW50YC5cbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcImluaXRDbGlja0VtdWxhdG9yXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGluaXRDbGlja0VtdWxhdG9yKGVsZW1lbnQsIG1vdmVUb2xlcmFuY2UsIHRpbWVUb2xlcmFuY2UpIHtcbiAgICAgIGlmIChDTElDS19FTVVMQVRPUl9FTEVNRU5UUy5pbmNsdWRlcyhlbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgIH1cblxuICAgICAgQ0xJQ0tfRU1VTEFUT1JfRUxFTUVOVFMucHVzaChlbGVtZW50KTtcbiAgICAgIHZhciBERUZBVUxUX01PVkVfVE9MRVJBTkNFID0gMTYsXG4gICAgICAgICAgLy8gcHhcbiAgICAgIERFRkFVTFRfVElNRV9UT0xFUkFOQ0UgPSA0MDA7IC8vIG1zXG5cbiAgICAgIHZhciBzdGFydFgsIHN0YXJ0WSwgdG91Y2hJZCwgc3RhcnRNcztcblxuICAgICAgaWYgKG1vdmVUb2xlcmFuY2UgPT0gbnVsbCkge1xuICAgICAgICBtb3ZlVG9sZXJhbmNlID0gREVGQVVMVF9NT1ZFX1RPTEVSQU5DRTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRpbWVUb2xlcmFuY2UgPT0gbnVsbCkge1xuICAgICAgICB0aW1lVG9sZXJhbmNlID0gREVGQVVMVF9USU1FX1RPTEVSQU5DRTtcbiAgICAgIH1cblxuICAgICAgYWRkRXZlbnRMaXN0ZW5lcldpdGhPcHRpb25zKGVsZW1lbnQsICd0b3VjaHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgICAgICBzdGFydFggPSB0b3VjaC5jbGllbnRYO1xuICAgICAgICBzdGFydFkgPSB0b3VjaC5jbGllbnRZO1xuICAgICAgICB0b3VjaElkID0gdG91Y2guaWRlbnRpZmllcjtcbiAgICAgICAgc3RhcnRNcyA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgfSwge1xuICAgICAgICBjYXB0dXJlOiBmYWxzZSxcbiAgICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcldpdGhPcHRpb25zKGVsZW1lbnQsICd0b3VjaGVuZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgdG91Y2ggPSBnZXRUb3VjaEJ5SWQoZXZlbnQuY2hhbmdlZFRvdWNoZXMsIHRvdWNoSWQpO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygc3RhcnRYID09PSAnbnVtYmVyJyAmJiB0eXBlb2Ygc3RhcnRZID09PSAnbnVtYmVyJyAmJiB0eXBlb2Ygc3RhcnRNcyA9PT0gJ251bWJlcicgJiYgdG91Y2ggJiYgdHlwZW9mIHRvdWNoLmNsaWVudFggPT09ICdudW1iZXInICYmIHR5cGVvZiB0b3VjaC5jbGllbnRZID09PSAnbnVtYmVyJyAmJiBnZXRQb2ludHNMZW5ndGgoe1xuICAgICAgICAgIHg6IHN0YXJ0WCxcbiAgICAgICAgICB5OiBzdGFydFlcbiAgICAgICAgfSwge1xuICAgICAgICAgIHg6IHRvdWNoLmNsaWVudFgsXG4gICAgICAgICAgeTogdG91Y2guY2xpZW50WVxuICAgICAgICB9KSA8PSBtb3ZlVG9sZXJhbmNlICYmIHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRNcyA8PSB0aW1lVG9sZXJhbmNlKSB7XG4gICAgICAgICAgLy8gRklSRVxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG5ld0V2ZW50ID0gbmV3IE1vdXNlRXZlbnQoJ2NsaWNrJywge1xuICAgICAgICAgICAgICBjbGllbnRYOiB0b3VjaC5jbGllbnRYLFxuICAgICAgICAgICAgICBjbGllbnRZOiB0b3VjaC5jbGllbnRZXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ld0V2ZW50LmVtdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXdFdmVudCk7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGFydFggPSBzdGFydFkgPSB0b3VjaElkID0gc3RhcnRNcyA9IG51bGw7XG4gICAgICB9LCB7XG4gICAgICAgIGNhcHR1cmU6IGZhbHNlLFxuICAgICAgICBwYXNzaXZlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICBhZGRFdmVudExpc3RlbmVyV2l0aE9wdGlvbnMoZWxlbWVudCwgJ3RvdWNoY2FuY2VsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBzdGFydFggPSBzdGFydFkgPSB0b3VjaElkID0gc3RhcnRNcyA9IG51bGw7XG4gICAgICB9LCB7XG4gICAgICAgIGNhcHR1cmU6IGZhbHNlLFxuICAgICAgICBwYXNzaXZlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW11bGF0ZSBgZGJsY2xpY2tgIGV2ZW50IHZpYSBgdG91Y2hlbmRgIGV2ZW50LlxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50LCBsaXN0ZW5lcnMgdGhhdCBjYWxsIGBldmVudC5wcmV2ZW50RGVmYXVsdCgpYCBhcmUgYXR0YWNoZWQgbGF0ZXIuXG4gICAgICogQHBhcmFtIHs/bnVtYmVyfSBtb3ZlVG9sZXJhbmNlIC0gTW92ZSB0b2xlcmFuY2UuXG4gICAgICogQHBhcmFtIHs/bnVtYmVyfSB0aW1lVG9sZXJhbmNlIC0gVGltZSB0b2xlcmFuY2UuXG4gICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSBwYXNzZWQgYGVsZW1lbnRgLlxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiaW5pdERibENsaWNrRW11bGF0b3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdERibENsaWNrRW11bGF0b3IoZWxlbWVudCwgbW92ZVRvbGVyYW5jZSwgdGltZVRvbGVyYW5jZSkge1xuICAgICAgaWYgKERCTENMSUNLX0VNVUxBVE9SX0VMRU1FTlRTLmluY2x1ZGVzKGVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfVxuXG4gICAgICBEQkxDTElDS19FTVVMQVRPUl9FTEVNRU5UUy5wdXNoKGVsZW1lbnQpO1xuICAgICAgdmFyIERFRkFVTFRfTU9WRV9UT0xFUkFOQ0UgPSAxNixcbiAgICAgICAgICAvLyBweFxuICAgICAgREVGQVVMVF9USU1FX1RPTEVSQU5DRSA9IDQwMDsgLy8gbXNcblxuICAgICAgdmFyIHN0YXJ0WCwgc3RhcnRZLCBzdGFydE1zO1xuXG4gICAgICBpZiAobW92ZVRvbGVyYW5jZSA9PSBudWxsKSB7XG4gICAgICAgIG1vdmVUb2xlcmFuY2UgPSBERUZBVUxUX01PVkVfVE9MRVJBTkNFO1xuICAgICAgfVxuXG4gICAgICBpZiAodGltZVRvbGVyYW5jZSA9PSBudWxsKSB7XG4gICAgICAgIHRpbWVUb2xlcmFuY2UgPSBERUZBVUxUX1RJTUVfVE9MRVJBTkNFO1xuICAgICAgfVxuXG4gICAgICBQb2ludGVyRXZlbnQuaW5pdENsaWNrRW11bGF0b3IoZWxlbWVudCwgbW92ZVRvbGVyYW5jZSwgdGltZVRvbGVyYW5jZSk7XG4gICAgICBhZGRFdmVudExpc3RlbmVyV2l0aE9wdGlvbnMoZWxlbWVudCwgJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICghZXZlbnQuZW11bGF0ZWQgfHwgLy8gSWdub3JlIGV2ZW50cyB0aGF0IGFyZSBub3QgZnJvbSBgdG91Y2hlbmRgLlxuICAgICAgICB0eXBlb2YgZXZlbnQuY2xpZW50WCAhPT0gJ251bWJlcicgfHwgdHlwZW9mIGV2ZW50LmNsaWVudFkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzdGFydFggPT09ICdudW1iZXInICYmIGdldFBvaW50c0xlbmd0aCh7XG4gICAgICAgICAgeDogc3RhcnRYLFxuICAgICAgICAgIHk6IHN0YXJ0WVxuICAgICAgICB9LCB7XG4gICAgICAgICAgeDogZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICB5OiBldmVudC5jbGllbnRZXG4gICAgICAgIH0pIDw9IG1vdmVUb2xlcmFuY2UgJiYgcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydE1zIDw9IHRpbWVUb2xlcmFuY2UgKiAyKSB7XG4gICAgICAgICAgLy8gdXAgKHRvbGVyYW5jZSkgZG93biAodG9sZXJhbmNlKSB1cFxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gRklSRVxuICAgICAgICAgICAgdmFyIG5ld0V2ZW50ID0gbmV3IE1vdXNlRXZlbnQoJ2RibGNsaWNrJywge1xuICAgICAgICAgICAgICBjbGllbnRYOiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICBjbGllbnRZOiBldmVudC5jbGllbnRZXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ld0V2ZW50LmVtdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXdFdmVudCk7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgc3RhcnRYID0gc3RhcnRZID0gc3RhcnRNcyA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gMXN0XG4gICAgICAgICAgc3RhcnRYID0gZXZlbnQuY2xpZW50WDtcbiAgICAgICAgICBzdGFydFkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICAgIHN0YXJ0TXMgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBjYXB0dXJlOiBmYWxzZSxcbiAgICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFBvaW50ZXJFdmVudDtcbn0oKTtcblxuZXhwb3J0IGRlZmF1bHQgUG9pbnRlckV2ZW50OyIsICIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgRE9OJ1QgTUFOVUFMTFkgRURJVCBUSElTIEZJTEVcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG4vKlxuICogQ1NTUHJlZml4XG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5zZWtpL2Nzc3ByZWZpeFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAyMSBhbnNla2lcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuZnVuY3Rpb24gdWNmKHRleHQpIHtcbiAgcmV0dXJuIHRleHQuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnN1YnN0cigxKTtcbn1cblxudmFyIFBSRUZJWEVTID0gWyd3ZWJraXQnLCAnbW96JywgJ21zJywgJ28nXSxcbiAgICBOQU1FX1BSRUZJWEVTID0gUFJFRklYRVMucmVkdWNlKGZ1bmN0aW9uIChwcmVmaXhlcywgcHJlZml4KSB7XG4gIHByZWZpeGVzLnB1c2gocHJlZml4KTtcbiAgcHJlZml4ZXMucHVzaCh1Y2YocHJlZml4KSk7XG4gIHJldHVybiBwcmVmaXhlcztcbn0sIFtdKSxcbiAgICBWQUxVRV9QUkVGSVhFUyA9IFBSRUZJWEVTLm1hcChmdW5jdGlvbiAocHJlZml4KSB7XG4gIHJldHVybiBcIi1cIi5jb25jYXQocHJlZml4LCBcIi1cIik7XG59KSxcblxuLyoqXG4gKiBHZXQgc2FtcGxlIENTU1N0eWxlRGVjbGFyYXRpb24uXG4gKiBAcmV0dXJucyB7Q1NTU3R5bGVEZWNsYXJhdGlvbn1cbiAqL1xuZ2V0RGVjbGFyYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBkZWNsYXJhdGlvbjtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZGVjbGFyYXRpb24gPSBkZWNsYXJhdGlvbiB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKS5zdHlsZTtcbiAgfTtcbn0oKSxcblxuLyoqXG4gKiBOb3JtYWxpemUgbmFtZS5cbiAqIEBwYXJhbSB7fSBwcm9wTmFtZSAtIEEgbmFtZSB0aGF0IGlzIG5vcm1hbGl6ZWQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBIG5vcm1hbGl6ZWQgbmFtZS5cbiAqL1xubm9ybWFsaXplTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJlUHJlZml4ZWROYW1lID0gbmV3IFJlZ0V4cCgnXig/OicgKyBQUkVGSVhFUy5qb2luKCd8JykgKyAnKSguKScsICdpJyksXG4gICAgICByZVVjID0gL1tBLVpdLztcbiAgcmV0dXJuIGZ1bmN0aW9uIChwcm9wTmFtZSkge1xuICAgIHJldHVybiAocHJvcE5hbWUgPSAocHJvcE5hbWUgKyAnJykucmVwbGFjZSgvXFxzL2csICcnKS5yZXBsYWNlKC8tKFtcXGRhLXpdKS9naSwgZnVuY3Rpb24gKHN0ciwgcDEpIHtcbiAgICAgIHJldHVybiBwMS50b1VwcGVyQ2FzZSgpO1xuICAgIH0pIC8vIGNhbWVsQ2FzZVxuICAgIC8vICdtcycgYW5kICdNcycgYXJlIGZvdW5kIGJ5IHJlUHJlZml4ZWROYW1lICdpJyBvcHRpb25cbiAgICAucmVwbGFjZShyZVByZWZpeGVkTmFtZSwgZnVuY3Rpb24gKHN0ciwgcDEpIHtcbiAgICAgIHJldHVybiByZVVjLnRlc3QocDEpID8gcDEudG9Mb3dlckNhc2UoKSA6IHN0cjtcbiAgICB9KSAvLyBSZW1vdmUgcHJlZml4XG4gICAgKS50b0xvd2VyQ2FzZSgpID09PSAnZmxvYXQnID8gJ2Nzc0Zsb2F0JyA6IHByb3BOYW1lO1xuICB9OyAvLyBGb3Igb2xkIENTU09NXG59KCksXG5cbi8qKlxuICogTm9ybWFsaXplIHZhbHVlLlxuICogQHBhcmFtIHt9IHByb3BWYWx1ZSAtIEEgdmFsdWUgdGhhdCBpcyBub3JtYWxpemVkLlxuICogQHJldHVybnMge3N0cmluZ30gQSBub3JtYWxpemVkIHZhbHVlLlxuICovXG5ub3JtYWxpemVWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJlUHJlZml4ZWRWYWx1ZSA9IG5ldyBSZWdFeHAoJ14oPzonICsgVkFMVUVfUFJFRklYRVMuam9pbignfCcpICsgJyknLCAnaScpO1xuICByZXR1cm4gZnVuY3Rpb24gKHByb3BWYWx1ZSkge1xuICAgIHJldHVybiAocHJvcFZhbHVlICE9IG51bGwgPyBwcm9wVmFsdWUgKyAnJyA6ICcnKS5yZXBsYWNlKC9cXHMvZywgJycpLnJlcGxhY2UocmVQcmVmaXhlZFZhbHVlLCAnJyk7XG4gIH07XG59KCksXG5cbi8qKlxuICogUG9seWZpbGwgZm9yIGBDU1Muc3VwcG9ydHNgLlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BOYW1lIC0gQSBuYW1lLlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BWYWx1ZSAtIEEgdmFsdWUuXG4gKiAgICAgU2luY2UgYENTU1N0eWxlRGVjbGFyYXRpb24uc2V0UHJvcGVydHlgIG1pZ2h0IHJldHVybiB1bmV4cGVjdGVkIHJlc3VsdCxcbiAqICAgICB0aGUgYHByb3BWYWx1ZWAgc2hvdWxkIGJlIGNoZWNrZWQgYmVmb3JlIHRoZSBgY3NzU3VwcG9ydHNgIGlzIGNhbGxlZC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgZ2l2ZW4gcGFpciBpcyBhY2NlcHRlZC5cbiAqL1xuY3NzU3VwcG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoLy8gcmV0dXJuIHdpbmRvdy5DU1MgJiYgd2luZG93LkNTUy5zdXBwb3J0cyB8fCAoKHByb3BOYW1lLCBwcm9wVmFsdWUpID0+IHtcbiAgICAvLyBgQ1NTLnN1cHBvcnRzYCBkb2Vzbid0IGZpbmQgcHJlZml4ZWQgcHJvcGVydHkuXG4gICAgZnVuY3Rpb24gKHByb3BOYW1lLCBwcm9wVmFsdWUpIHtcbiAgICAgIHZhciBkZWNsYXJhdGlvbiA9IGdldERlY2xhcmF0aW9uKCk7IC8vIEluIHNvbWUgYnJvd3NlcnMsIGBkZWNsYXJhdGlvbltwcm9wXSA9IHZhbHVlYCB1cGRhdGVzIGFueSBwcm9wZXJ0eS5cblxuICAgICAgcHJvcE5hbWUgPSBwcm9wTmFtZS5yZXBsYWNlKC9bQS1aXS9nLCBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiBcIi1cIi5jb25jYXQoc3RyLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfSk7IC8vIGtlYmFiLWNhc2VcblxuICAgICAgZGVjbGFyYXRpb24uc2V0UHJvcGVydHkocHJvcE5hbWUsIHByb3BWYWx1ZSk7XG4gICAgICByZXR1cm4gZGVjbGFyYXRpb25bcHJvcE5hbWVdICE9IG51bGwgJiYgLy8gQmVjYXVzZSBnZXRQcm9wZXJ0eVZhbHVlIHJldHVybnMgJycgaWYgaXQgaXMgdW5zdXBwb3J0ZWRcbiAgICAgIGRlY2xhcmF0aW9uLmdldFByb3BlcnR5VmFsdWUocHJvcE5hbWUpID09PSBwcm9wVmFsdWU7XG4gICAgfVxuICApO1xufSgpLFxuICAgIC8vIENhY2hlXG5wcm9wTmFtZXMgPSB7fSxcbiAgICBwcm9wVmFsdWVzID0ge307XG5cbmZ1bmN0aW9uIGdldE5hbWUocHJvcE5hbWUpIHtcbiAgcHJvcE5hbWUgPSBub3JtYWxpemVOYW1lKHByb3BOYW1lKTtcblxuICBpZiAocHJvcE5hbWUgJiYgcHJvcE5hbWVzW3Byb3BOYW1lXSA9PSBudWxsKSB7XG4gICAgdmFyIGRlY2xhcmF0aW9uID0gZ2V0RGVjbGFyYXRpb24oKTtcblxuICAgIGlmIChkZWNsYXJhdGlvbltwcm9wTmFtZV0gIT0gbnVsbCkge1xuICAgICAgLy8gT3JpZ2luYWxcbiAgICAgIHByb3BOYW1lc1twcm9wTmFtZV0gPSBwcm9wTmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVHJ5IHdpdGggcHJlZml4ZXNcbiAgICAgIHZhciB1Y2ZOYW1lID0gdWNmKHByb3BOYW1lKTtcblxuICAgICAgaWYgKCFOQU1FX1BSRUZJWEVTLnNvbWUoZnVuY3Rpb24gKHByZWZpeCkge1xuICAgICAgICB2YXIgcHJlZml4ZWQgPSBwcmVmaXggKyB1Y2ZOYW1lO1xuXG4gICAgICAgIGlmIChkZWNsYXJhdGlvbltwcmVmaXhlZF0gIT0gbnVsbCkge1xuICAgICAgICAgIHByb3BOYW1lc1twcm9wTmFtZV0gPSBwcmVmaXhlZDtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pKSB7XG4gICAgICAgIHByb3BOYW1lc1twcm9wTmFtZV0gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJvcE5hbWVzW3Byb3BOYW1lXSB8fCB2b2lkIDA7XG59XG5cbmZ1bmN0aW9uIGdldFZhbHVlKHByb3BOYW1lLCBwcm9wVmFsdWUpIHtcbiAgdmFyIHJlcztcblxuICBpZiAoIShwcm9wTmFtZSA9IGdldE5hbWUocHJvcE5hbWUpKSkge1xuICAgIHJldHVybiByZXM7XG4gIH0gLy8gSW52YWxpZCBwcm9wZXJ0eVxuXG5cbiAgcHJvcFZhbHVlc1twcm9wTmFtZV0gPSBwcm9wVmFsdWVzW3Byb3BOYW1lXSB8fCB7fTtcbiAgKEFycmF5LmlzQXJyYXkocHJvcFZhbHVlKSA/IHByb3BWYWx1ZSA6IFtwcm9wVmFsdWVdKS5zb21lKGZ1bmN0aW9uIChwcm9wVmFsdWUpIHtcbiAgICBwcm9wVmFsdWUgPSBub3JtYWxpemVWYWx1ZShwcm9wVmFsdWUpO1xuXG4gICAgaWYgKHByb3BWYWx1ZXNbcHJvcE5hbWVdW3Byb3BWYWx1ZV0gIT0gbnVsbCkge1xuICAgICAgLy8gQ2FjaGVcbiAgICAgIGlmIChwcm9wVmFsdWVzW3Byb3BOYW1lXVtwcm9wVmFsdWVdICE9PSBmYWxzZSkge1xuICAgICAgICByZXMgPSBwcm9wVmFsdWVzW3Byb3BOYW1lXVtwcm9wVmFsdWVdO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBDb250aW51ZSB0byBuZXh0IHZhbHVlXG4gICAgfVxuXG4gICAgaWYgKGNzc1N1cHBvcnRzKHByb3BOYW1lLCBwcm9wVmFsdWUpKSB7XG4gICAgICAvLyBPcmlnaW5hbFxuICAgICAgcmVzID0gcHJvcFZhbHVlc1twcm9wTmFtZV1bcHJvcFZhbHVlXSA9IHByb3BWYWx1ZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChWQUxVRV9QUkVGSVhFUy5zb21lKGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgICAgIC8vIFRyeSB3aXRoIHByZWZpeGVzXG4gICAgICB2YXIgcHJlZml4ZWQgPSBwcmVmaXggKyBwcm9wVmFsdWU7XG5cbiAgICAgIGlmIChjc3NTdXBwb3J0cyhwcm9wTmFtZSwgcHJlZml4ZWQpKSB7XG4gICAgICAgIHJlcyA9IHByb3BWYWx1ZXNbcHJvcE5hbWVdW3Byb3BWYWx1ZV0gPSBwcmVmaXhlZDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJvcFZhbHVlc1twcm9wTmFtZV1bcHJvcFZhbHVlXSA9IGZhbHNlO1xuICAgIHJldHVybiBmYWxzZTsgLy8gQ29udGludWUgdG8gbmV4dCB2YWx1ZVxuICB9KTtcbiAgcmV0dXJuIHR5cGVvZiByZXMgPT09ICdzdHJpbmcnID8gcmVzIDogdm9pZCAwOyAvLyBJdCBtaWdodCBiZSBlbXB0eSBzdHJpbmcuXG59XG5cbnZhciBDU1NQcmVmaXggPSB7XG4gIGdldE5hbWU6IGdldE5hbWUsXG4gIGdldFZhbHVlOiBnZXRWYWx1ZVxufTtcbmV4cG9ydCBkZWZhdWx0IENTU1ByZWZpeDsiLCAiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIERPTidUIE1BTlVBTExZIEVESVQgVEhJUyBGSUxFXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuLypcbiAqIG1DbGFzc0xpc3RcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbnNla2kvbS1jbGFzcy1saXN0XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDIxIGFuc2VraVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemUodG9rZW4pIHtcbiAgcmV0dXJuICh0b2tlbiArICcnKS50cmltKCk7XG59IC8vIE5vdCBgfHxgXG5cblxuZnVuY3Rpb24gYXBwbHlMaXN0KGxpc3QsIGVsZW1lbnQpIHtcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgbGlzdC5qb2luKCcgJykpO1xufVxuXG5mdW5jdGlvbiBfYWRkKGxpc3QsIGVsZW1lbnQsIHRva2Vucykge1xuICBpZiAodG9rZW5zLmZpbHRlcihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoISh0b2tlbiA9IG5vcm1hbGl6ZSh0b2tlbikpIHx8IGxpc3QuaW5kZXhPZih0b2tlbikgIT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGlzdC5wdXNoKHRva2VuKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSkubGVuZ3RoKSB7XG4gICAgYXBwbHlMaXN0KGxpc3QsIGVsZW1lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9yZW1vdmUobGlzdCwgZWxlbWVudCwgdG9rZW5zKSB7XG4gIGlmICh0b2tlbnMuZmlsdGVyKGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHZhciBpO1xuXG4gICAgaWYgKCEodG9rZW4gPSBub3JtYWxpemUodG9rZW4pKSB8fCAoaSA9IGxpc3QuaW5kZXhPZih0b2tlbikpID09PSAtMSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIHJldHVybiB0cnVlO1xuICB9KS5sZW5ndGgpIHtcbiAgICBhcHBseUxpc3QobGlzdCwgZWxlbWVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3RvZ2dsZShsaXN0LCBlbGVtZW50LCB0b2tlbiwgZm9yY2UpIHtcbiAgdmFyIGkgPSBsaXN0LmluZGV4T2YodG9rZW4gPSBub3JtYWxpemUodG9rZW4pKTtcblxuICBpZiAoaSAhPT0gLTEpIHtcbiAgICBpZiAoZm9yY2UpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGFwcGx5TGlzdChsaXN0LCBlbGVtZW50KTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoZm9yY2UgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbGlzdC5wdXNoKHRva2VuKTtcbiAgYXBwbHlMaXN0KGxpc3QsIGVsZW1lbnQpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gX3JlcGxhY2UobGlzdCwgZWxlbWVudCwgdG9rZW4sIG5ld1Rva2VuKSB7XG4gIHZhciBpO1xuXG4gIGlmICghKHRva2VuID0gbm9ybWFsaXplKHRva2VuKSkgfHwgIShuZXdUb2tlbiA9IG5vcm1hbGl6ZShuZXdUb2tlbikpIHx8IHRva2VuID09PSBuZXdUb2tlbiB8fCAoaSA9IGxpc3QuaW5kZXhPZih0b2tlbikpID09PSAtMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxpc3Quc3BsaWNlKGksIDEpO1xuXG4gIGlmIChsaXN0LmluZGV4T2YobmV3VG9rZW4pID09PSAtMSkge1xuICAgIGxpc3QucHVzaChuZXdUb2tlbik7XG4gIH1cblxuICBhcHBseUxpc3QobGlzdCwgZWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIG1DbGFzc0xpc3QoZWxlbWVudCkge1xuICByZXR1cm4gIW1DbGFzc0xpc3QuaWdub3JlTmF0aXZlICYmIGVsZW1lbnQuY2xhc3NMaXN0IHx8IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGlzdCA9IChlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCAnJykudHJpbSgpLnNwbGl0KC9cXHMrLykuZmlsdGVyKGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgcmV0dXJuICEhdG9rZW47XG4gICAgfSksXG4gICAgICAgIGlucyA9IHtcbiAgICAgIGxlbmd0aDogbGlzdC5sZW5ndGgsXG4gICAgICBpdGVtOiBmdW5jdGlvbiBpdGVtKGkpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RbaV07XG4gICAgICB9LFxuICAgICAgY29udGFpbnM6IGZ1bmN0aW9uIGNvbnRhaW5zKHRva2VuKSB7XG4gICAgICAgIHJldHVybiBsaXN0LmluZGV4T2Yobm9ybWFsaXplKHRva2VuKSkgIT09IC0xO1xuICAgICAgfSxcbiAgICAgIGFkZDogZnVuY3Rpb24gYWRkKCkge1xuICAgICAgICBfYWRkKGxpc3QsIGVsZW1lbnQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuXG4gICAgICAgIHJldHVybiBtQ2xhc3NMaXN0Lm1ldGhvZENoYWluID8gaW5zIDogdm9pZCAwO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgICAgICBfcmVtb3ZlKGxpc3QsIGVsZW1lbnQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuXG4gICAgICAgIHJldHVybiBtQ2xhc3NMaXN0Lm1ldGhvZENoYWluID8gaW5zIDogdm9pZCAwO1xuICAgICAgfSxcbiAgICAgIHRvZ2dsZTogZnVuY3Rpb24gdG9nZ2xlKHRva2VuLCBmb3JjZSkge1xuICAgICAgICByZXR1cm4gX3RvZ2dsZShsaXN0LCBlbGVtZW50LCB0b2tlbiwgZm9yY2UpO1xuICAgICAgfSxcbiAgICAgIHJlcGxhY2U6IGZ1bmN0aW9uIHJlcGxhY2UodG9rZW4sIG5ld1Rva2VuKSB7XG4gICAgICAgIF9yZXBsYWNlKGxpc3QsIGVsZW1lbnQsIHRva2VuLCBuZXdUb2tlbik7XG5cbiAgICAgICAgcmV0dXJuIG1DbGFzc0xpc3QubWV0aG9kQ2hhaW4gPyBpbnMgOiB2b2lkIDA7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gaW5zO1xuICB9KCk7XG59XG5cbm1DbGFzc0xpc3QubWV0aG9kQ2hhaW4gPSB0cnVlO1xuZXhwb3J0IGRlZmF1bHQgbUNsYXNzTGlzdDsiLCAiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIERPTidUIE1BTlVBTExZIEVESVQgVEhJUyBGSUxFXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbi8qXG4gKiBQbGFpbkRyYWdnYWJsZVxuICogaHR0cHM6Ly9hbnNla2kuZ2l0aHViLmlvL3BsYWluLWRyYWdnYWJsZS9cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQgYW5zZWtpXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cbmltcG9ydCBQb2ludGVyRXZlbnQgZnJvbSAncG9pbnRlci1ldmVudCc7XG5pbXBvcnQgQ1NTUHJlZml4IGZyb20gJ2Nzc3ByZWZpeCc7XG5pbXBvcnQgQW5pbUV2ZW50IGZyb20gJ2FuaW0tZXZlbnQnO1xuaW1wb3J0IG1DbGFzc0xpc3QgZnJvbSAnbS1jbGFzcy1saXN0Jztcbm1DbGFzc0xpc3QuaWdub3JlTmF0aXZlID0gdHJ1ZTtcblxudmFyIFpJTkRFWCA9IDkwMDAsXG4gICAgLy8gW1NOQVBdXG5TTkFQX0dSQVZJVFkgPSAyMCxcbiAgICBTTkFQX0NPUk5FUiA9ICd0bCcsXG4gICAgU05BUF9TSURFID0gJ2JvdGgnLFxuICAgIFNOQVBfRURHRSA9ICdib3RoJyxcbiAgICBTTkFQX0JBU0UgPSAnY29udGFpbm1lbnQnLFxuICAgIFNOQVBfQUxMX0NPUk5FUlMgPSBbJ3RsJywgJ3RyJywgJ2JsJywgJ2JyJ10sXG4gICAgU05BUF9BTExfU0lERVMgPSBbJ3N0YXJ0JywgJ2VuZCddLFxuICAgIFNOQVBfQUxMX0VER0VTID0gWydpbnNpZGUnLCAnb3V0c2lkZSddLFxuICAgIC8vIFsvU05BUF1cbi8vIFtBVVRPLVNDUk9MTF1cbkFVVE9TQ1JPTExfU1BFRUQgPSBbNDAsIDIwMCwgMTAwMF0sXG4gICAgQVVUT1NDUk9MTF9TRU5TSVRJVklUWSA9IFsxMDAsIDQwLCAwXSxcbiAgICAvLyBbL0FVVE8tU0NST0xMXVxuSVNfRURHRSA9ICctbXMtc2Nyb2xsLWxpbWl0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUgJiYgJy1tcy1pbWUtYWxpZ24nIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSAmJiAhd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkLFxuICAgIElTX1RSSURFTlQgPSAhSVNfRURHRSAmJiAhIWRvY3VtZW50LnVuaXF1ZUlELFxuICAgIC8vIEZ1dHVyZSBFZGdlIG1pZ2h0IHN1cHBvcnQgYGRvY3VtZW50LnVuaXF1ZUlEYC5cbklTX0dFQ0tPID0gKCdNb3pBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpLFxuICAgIElTX0JMSU5LID0gIUlTX0VER0UgJiYgIUlTX0dFQ0tPICYmIC8vIEVkZ2UgaGFzIGB3aW5kb3cuY2hyb21lYCwgYW5kIGZ1dHVyZSBHZWNrbyBtaWdodCBoYXZlIHRoYXQuXG4hIXdpbmRvdy5jaHJvbWUgJiYgISF3aW5kb3cuQ1NTLFxuICAgIElTX1dFQktJVCA9ICFJU19FREdFICYmICFJU19UUklERU5UICYmICFJU19HRUNLTyAmJiAhSVNfQkxJTksgJiYgLy8gU29tZSBlbmdpbmVzIHN1cHBvcnQgYHdlYmtpdC0qYCBwcm9wZXJ0aWVzLlxuIXdpbmRvdy5jaHJvbWUgJiYgJ1dlYmtpdEFwcGVhcmFuY2UnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSxcbiAgICBpc09iamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmcsXG4gICAgICBmblRvU3RyaW5nID0ge30uaGFzT3duUHJvcGVydHkudG9TdHJpbmcsXG4gICAgICBvYmpGblN0cmluZyA9IGZuVG9TdHJpbmcuY2FsbChPYmplY3QpO1xuICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBwcm90bywgY29uc3RyO1xuICAgIHJldHVybiBvYmogJiYgdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBPYmplY3RdJyAmJiAoIShwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopKSB8fCAoY29uc3RyID0gcHJvdG8uaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiYgcHJvdG8uY29uc3RydWN0b3IpICYmIHR5cGVvZiBjb25zdHIgPT09ICdmdW5jdGlvbicgJiYgZm5Ub1N0cmluZy5jYWxsKGNvbnN0cikgPT09IG9iakZuU3RyaW5nKTtcbiAgfTtcbn0oKSxcbiAgICBpc0Zpbml0ZSA9IE51bWJlci5pc0Zpbml0ZSB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgd2luZG93LmlzRmluaXRlKHZhbHVlKTtcbn0sXG5cbi8qKiBAdHlwZSB7T2JqZWN0LjxfaWQ6IG51bWJlciwgcHJvcHM+fSAqL1xuaW5zUHJvcHMgPSB7fSxcbiAgICBwb2ludGVyT2Zmc2V0ID0ge30sXG4gICAgcG9pbnRlckV2ZW50ID0gbmV3IFBvaW50ZXJFdmVudCgpO1xuXG52YXIgaW5zSWQgPSAwLFxuICAgIGFjdGl2ZVByb3BzLFxuICAgIGhhc01vdmVkLFxuICAgIGJvZHksXG4gICAgLy8gQ1NTIHByb3BlcnR5L3ZhbHVlXG5jc3NWYWx1ZURyYWdnYWJsZUN1cnNvcixcbiAgICBjc3NWYWx1ZURyYWdnaW5nQ3Vyc29yLFxuICAgIGNzc09yZ1ZhbHVlQm9keUN1cnNvcixcbiAgICBjc3NQcm9wVHJhbnNpdGlvblByb3BlcnR5LFxuICAgIGNzc1Byb3BUcmFuc2Zvcm0sXG4gICAgY3NzUHJvcFVzZXJTZWxlY3QsXG4gICAgY3NzT3JnVmFsdWVCb2R5VXNlclNlbGVjdCxcbiAgICAvLyBUcnkgdG8gc2V0IGBjdXJzb3JgIHByb3BlcnR5LlxuY3NzV2FudGVkVmFsdWVEcmFnZ2FibGVDdXJzb3IgPSBJU19XRUJLSVQgPyBbJ2FsbC1zY3JvbGwnLCAnbW92ZSddIDogWydncmFiJywgJ2FsbC1zY3JvbGwnLCAnbW92ZSddLFxuICAgIGNzc1dhbnRlZFZhbHVlRHJhZ2dpbmdDdXJzb3IgPSBJU19XRUJLSVQgPyAnbW92ZScgOiBbJ2dyYWJiaW5nJywgJ21vdmUnXSxcbiAgICAvLyBjbGFzc1xuZHJhZ2dhYmxlQ2xhc3MgPSAncGxhaW4tZHJhZ2dhYmxlJyxcbiAgICBkcmFnZ2luZ0NsYXNzID0gJ3BsYWluLWRyYWdnYWJsZS1kcmFnZ2luZycsXG4gICAgbW92aW5nQ2xhc3MgPSAncGxhaW4tZHJhZ2dhYmxlLW1vdmluZyc7IC8vIFtBVVRPLVNDUk9MTF1cbi8vIFNjcm9sbCBBbmltYXRpb24gQ29udHJvbGxlclxuXG52YXIgc2Nyb2xsRnJhbWUgPSB7fSxcbiAgICBNU1BGID0gMTAwMCAvIDYwLFxuICAgIC8vIG1zL2ZyYW1lIChGUFM6IDYwKVxucmVxdWVzdEFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHJldHVybiBzZXRUaW1lb3V0KGNhbGxiYWNrLCBNU1BGKTtcbn0sXG4gICAgY2FuY2VsQW5pbSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc0NhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uIChyZXF1ZXN0SUQpIHtcbiAgcmV0dXJuIGNsZWFyVGltZW91dChyZXF1ZXN0SUQpO1xufTtcblxue1xuICAvKipcbiAgICogQHR5cGVkZWYge09iamVjdH0gTW92ZUFyZ3NcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IGRpciAtIFstMSB8IDFdIG1pbnVzIG9yIHBsdXMgdG8gcG9zaXRpb24gdmFsdWUuXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzcGVlZCAtIHB4L21zXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBtaW4gLSBNaW5pbXVtIHBvc2l0aW9uIHZhbHVlLlxuICAgKiBAcHJvcGVydHkge251bWJlcn0gbWF4IC0gTWF4aW11bSBwb3NpdGlvbiB2YWx1ZS5cbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFtsYXN0RnJhbWVUaW1lXSAtIFRpbWUgb2YgbGFzdCBmcmFtZS5cbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFtsYXN0VmFsdWVdIC0gU3RyaWN0IHZhbHVlIG9mIGxhc3QgZnJhbWUuXG4gICAqL1xuICB2YXIgY3VyWHlNb3ZlQXJncyA9IHt9LFxuICAgICAgY3VyRWxlbWVudCxcbiAgICAgIGN1clNjcm9sbFhZLFxuICAgICAgcmVxdWVzdElEO1xuXG4gIGZ1bmN0aW9uIGZyYW1lVXBkYXRlKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIFsneCcsICd5J10uZm9yRWFjaChmdW5jdGlvbiAoeHkpIHtcbiAgICAgIHZhciBtb3ZlQXJncyA9IGN1clh5TW92ZUFyZ3NbeHldO1xuXG4gICAgICBpZiAobW92ZUFyZ3MpIHtcbiAgICAgICAgdmFyIHRpbWVMZW4gPSBub3cgLSBtb3ZlQXJncy5sYXN0RnJhbWVUaW1lLFxuICAgICAgICAgICAgYWJzVmFsdWUgPSBjdXJTY3JvbGxYWShjdXJFbGVtZW50LCB4eSksXG4gICAgICAgICAgICBjdXJWYWx1ZSA9IG1vdmVBcmdzLmxhc3RWYWx1ZSAhPSBudWxsICYmIE1hdGguYWJzKG1vdmVBcmdzLmxhc3RWYWx1ZSAtIGFic1ZhbHVlKSA8IDEwIC8vIEl0IHdhcyBub3QgbW92ZWQgbWFudWFsbHlcbiAgICAgICAgPyBtb3ZlQXJncy5sYXN0VmFsdWUgOiBhYnNWYWx1ZTtcblxuICAgICAgICBpZiAobW92ZUFyZ3MuZGlyID09PSAtMSA/IGN1clZhbHVlID4gbW92ZUFyZ3MubWluIDogY3VyVmFsdWUgPCBtb3ZlQXJncy5tYXgpIHtcbiAgICAgICAgICB2YXIgbmV3VmFsdWUgPSBjdXJWYWx1ZSArIG1vdmVBcmdzLnNwZWVkICogdGltZUxlbiAqIG1vdmVBcmdzLmRpcjtcblxuICAgICAgICAgIGlmIChuZXdWYWx1ZSA8IG1vdmVBcmdzLm1pbikge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBtb3ZlQXJncy5taW47XG4gICAgICAgICAgfSBlbHNlIGlmIChuZXdWYWx1ZSA+IG1vdmVBcmdzLm1heCkge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBtb3ZlQXJncy5tYXg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VyU2Nyb2xsWFkoY3VyRWxlbWVudCwgeHksIG5ld1ZhbHVlKTtcbiAgICAgICAgICBtb3ZlQXJncy5sYXN0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdmVBcmdzLmxhc3RGcmFtZVRpbWUgPSBub3c7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBmcmFtZSgpIHtcbiAgICBjYW5jZWxBbmltLmNhbGwod2luZG93LCByZXF1ZXN0SUQpO1xuICAgIGZyYW1lVXBkYXRlKCk7XG4gICAgcmVxdWVzdElEID0gcmVxdWVzdEFuaW0uY2FsbCh3aW5kb3csIGZyYW1lKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IC0gQSB0YXJnZXQgZWxlbWVudC5cbiAgICogQHBhcmFtIHt7eDogP01vdmVBcmdzLCB5OiA/TW92ZUFyZ3N9fSB4eU1vdmVBcmdzIC0gTW92ZUFyZ3MgZm9yIHggYW5kIHlcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gc2Nyb2xsWFkgLSAoZWxlbWVudDogRWxlbWVudCwgeHk6IHN0cmluZywgdmFsdWU6IG51bWJlcikgPT4gbnVtYmVyXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cblxuXG4gIHNjcm9sbEZyYW1lLm1vdmUgPSBmdW5jdGlvbiAoZWxlbWVudCwgeHlNb3ZlQXJncywgc2Nyb2xsWFkpIHtcbiAgICBjYW5jZWxBbmltLmNhbGwod2luZG93LCByZXF1ZXN0SUQpO1xuICAgIGZyYW1lVXBkYXRlKCk7IC8vIFVwZGF0ZSBjdXJyZW50IGRhdGEgbm93IGJlY2F1c2UgaXQgbWlnaHQgYmUgbm90IGNvbnRpbnVhdGlvbi5cbiAgICAvLyBSZS11c2UgbGFzdFZhbHVlXG5cbiAgICBpZiAoY3VyRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgaWYgKHh5TW92ZUFyZ3MueCAmJiBjdXJYeU1vdmVBcmdzLngpIHtcbiAgICAgICAgeHlNb3ZlQXJncy54Lmxhc3RWYWx1ZSA9IGN1clh5TW92ZUFyZ3MueC5sYXN0VmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGlmICh4eU1vdmVBcmdzLnkgJiYgY3VyWHlNb3ZlQXJncy55KSB7XG4gICAgICAgIHh5TW92ZUFyZ3MueS5sYXN0VmFsdWUgPSBjdXJYeU1vdmVBcmdzLnkubGFzdFZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGN1ckVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGN1clh5TW92ZUFyZ3MgPSB4eU1vdmVBcmdzO1xuICAgIGN1clNjcm9sbFhZID0gc2Nyb2xsWFk7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgWyd4JywgJ3knXS5mb3JFYWNoKGZ1bmN0aW9uICh4eSkge1xuICAgICAgdmFyIG1vdmVBcmdzID0gY3VyWHlNb3ZlQXJnc1t4eV07XG5cbiAgICAgIGlmIChtb3ZlQXJncykge1xuICAgICAgICBtb3ZlQXJncy5sYXN0RnJhbWVUaW1lID0gbm93O1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcXVlc3RJRCA9IHJlcXVlc3RBbmltLmNhbGwod2luZG93LCBmcmFtZSk7XG4gIH07XG5cbiAgc2Nyb2xsRnJhbWUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjYW5jZWxBbmltLmNhbGwod2luZG93LCByZXF1ZXN0SUQpO1xuICAgIGZyYW1lVXBkYXRlKCk7XG4gICAgY3VyWHlNb3ZlQXJncyA9IHt9O1xuICAgIGN1ckVsZW1lbnQgPSBudWxsOyAvLyBSZW1vdmUgcmVmZXJlbmNlXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNjcm9sbFhZV2luZG93KGVsZW1lbnQsIHh5LCB2YWx1ZSkge1xuICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgIGlmICh4eSA9PT0gJ3gnKSB7XG4gICAgICBlbGVtZW50LnNjcm9sbFRvKHZhbHVlLCBlbGVtZW50LnBhZ2VZT2Zmc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5zY3JvbGxUbyhlbGVtZW50LnBhZ2VYT2Zmc2V0LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHh5ID09PSAneCcgPyBlbGVtZW50LnBhZ2VYT2Zmc2V0IDogZWxlbWVudC5wYWdlWU9mZnNldDtcbn1cblxuZnVuY3Rpb24gc2Nyb2xsWFlFbGVtZW50KGVsZW1lbnQsIHh5LCB2YWx1ZSkge1xuICB2YXIgcHJvcCA9IHh5ID09PSAneCcgPyAnc2Nyb2xsTGVmdCcgOiAnc2Nyb2xsVG9wJztcblxuICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgIGVsZW1lbnRbcHJvcF0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBlbGVtZW50W3Byb3BdO1xufVxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTY3JvbGxhYmxlXG4gKiBAcHJvcGVydHkge251bWJlcn0gY2xpZW50V2lkdGggLSB3aWR0aCBvZiBzY3JvbGxhYmxlIGFyZWEuXG4gKiBAcHJvcGVydHkge251bWJlcn0gY2xpZW50SGVpZ2h0IC0gaGVpZ2h0IG9mIHNjcm9sbGFibGUgYXJlYS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzY3JvbGxXaWR0aCAtIHdpZHRoIG9mIGlubmVyIGNvbnRlbnQuXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IG9mIGlubmVyIGNvbnRlbnQuXG4gKiBAcHJvcGVydHkge251bWJlcn0gY2xpZW50WCAtIFggb2Ygc2Nyb2xsYWJsZSBhcmVhLCBkb2N1bWVudCBjb29yZGluYXRlLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IGNsaWVudFkgLSBUIG9mIHNjcm9sbGFibGUgYXJlYSwgZG9jdW1lbnQgY29vcmRpbmF0ZS5cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCAtIEEgdGFyZ2V0IGVsZW1lbnQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1dpbmRvd10gLSBgdHJ1ZWAgaWYgZWxlbWVudCBpcyB3aW5kb3cuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtkb250U2Nyb2xsXSAtIGB0cnVlYCBtYWtlcyBpdCBza2lwIHNjcm9sbCB0aGF0IGdldHMgc2Nyb2xsV2lkdGgvSGVpZ2h0LlxuICogQHJldHVybnMge1Njcm9sbGFibGV9IEluZm9ybWF0aW9uIGZvciBzY3JvbGwuXG4gKi9cblxuXG5mdW5jdGlvbiBnZXRTY3JvbGxhYmxlKGVsZW1lbnQsIGlzV2luZG93LCBkb250U2Nyb2xsKSB7XG4gIHZhciBzY3JvbGxhYmxlID0ge307XG4gIHZhciBjbXBTdHlsZUh0bWwsIGNtcFN0eWxlQm9keSwgY21wU3R5bGVFbGVtZW50OyAvLyBjbGllbnRXaWR0aC9IZWlnaHRcblxuICAoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIHNjcm9sbGFibGUuY2xpZW50V2lkdGggPSB0YXJnZXQuY2xpZW50V2lkdGg7XG4gICAgc2Nyb2xsYWJsZS5jbGllbnRIZWlnaHQgPSB0YXJnZXQuY2xpZW50SGVpZ2h0O1xuICB9KShpc1dpbmRvdyA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IGVsZW1lbnQpOyAvLyBzY3JvbGxXaWR0aC9IZWlnaHRcblxuICAvKlxuICAgIEdlY2tvIGJ1ZywgYm90dG9tLXBhZGRpbmcgb2YgZWxlbWVudCBpcyByZWR1Y2VkLlxuICAgIEJsaW5rIGZvciBBbmRyb2lkIGJ1ZywgYm9yZGVycyBvZiA8aHRtbD4gaXMgcmVuZGVyZWQgYnV0IHRob3NlIGFyZSBub3QgYWRkZWQgdG8gc2Nyb2xsVy9ILlxuICAgIFRoZW4sIG1vdmUgaXQgdG8gbWF4IHNjcm9sbCBwb3NpdGlvbiAoc3VmZmljaWVudGx5IGxhcmdlciB2YWx1ZXMpIGZvcmNpYmx5LCBhbmQgZ2V0IHNjcm9sbCBwb3NpdGlvbi5cbiAgKi9cblxuXG4gIHZhciBtYXhTY3JvbGxMZWZ0ID0gMCxcbiAgICAgIG1heFNjcm9sbFRvcCA9IDA7XG5cbiAgaWYgKCFkb250U2Nyb2xsKSB7XG4gICAgdmFyIGN1clNjcm9sbExlZnQsIGN1clNjcm9sbFRvcDtcblxuICAgIGlmIChpc1dpbmRvdykge1xuICAgICAgY3VyU2Nyb2xsTGVmdCA9IHNjcm9sbFhZV2luZG93KGVsZW1lbnQsICd4Jyk7XG4gICAgICBjdXJTY3JvbGxUb3AgPSBzY3JvbGxYWVdpbmRvdyhlbGVtZW50LCAneScpO1xuICAgICAgY21wU3R5bGVIdG1sID0gZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICcnKTtcbiAgICAgIGNtcFN0eWxlQm9keSA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSwgJycpO1xuICAgICAgbWF4U2Nyb2xsTGVmdCA9IHNjcm9sbFhZV2luZG93KGVsZW1lbnQsICd4JywgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoICsgc2Nyb2xsYWJsZS5jbGllbnRXaWR0aCArIC8vIEJsaW5rIGZvciBBbmRyb2lkIGJ1Zywgc2Nyb2xsKiByZXR1cm5zIHNpemUgb2Ygc21hbGxlciBib2R5XG4gICAgICBbJ21hcmdpbkxlZnQnLCAnbWFyZ2luUmlnaHQnLCAnYm9yZGVyTGVmdFdpZHRoJywgJ2JvcmRlclJpZ2h0V2lkdGgnLCAncGFkZGluZ0xlZnQnLCAncGFkZGluZ1JpZ2h0J10ucmVkdWNlKGZ1bmN0aW9uIChsZW4sIHByb3ApIHtcbiAgICAgICAgcmV0dXJuIGxlbiArIChwYXJzZUZsb2F0KGNtcFN0eWxlSHRtbFtwcm9wXSkgfHwgMCkgKyAocGFyc2VGbG9hdChjbXBTdHlsZUJvZHlbcHJvcF0pIHx8IDApO1xuICAgICAgfSwgMCkpO1xuICAgICAgbWF4U2Nyb2xsVG9wID0gc2Nyb2xsWFlXaW5kb3coZWxlbWVudCwgJ3knLCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0ICsgc2Nyb2xsYWJsZS5jbGllbnRIZWlnaHQgKyBbJ21hcmdpblRvcCcsICdtYXJnaW5Cb3R0b20nLCAnYm9yZGVyVG9wV2lkdGgnLCAnYm9yZGVyQm90dG9tV2lkdGgnLCAncGFkZGluZ1RvcCcsICdwYWRkaW5nQm90dG9tJ10ucmVkdWNlKGZ1bmN0aW9uIChsZW4sIHByb3ApIHtcbiAgICAgICAgcmV0dXJuIGxlbiArIChwYXJzZUZsb2F0KGNtcFN0eWxlSHRtbFtwcm9wXSkgfHwgMCkgKyAocGFyc2VGbG9hdChjbXBTdHlsZUJvZHlbcHJvcF0pIHx8IDApO1xuICAgICAgfSwgMCkpO1xuICAgICAgc2Nyb2xsWFlXaW5kb3coZWxlbWVudCwgJ3gnLCBjdXJTY3JvbGxMZWZ0KTtcbiAgICAgIHNjcm9sbFhZV2luZG93KGVsZW1lbnQsICd5JywgY3VyU2Nyb2xsVG9wKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VyU2Nyb2xsTGVmdCA9IHNjcm9sbFhZRWxlbWVudChlbGVtZW50LCAneCcpO1xuICAgICAgY3VyU2Nyb2xsVG9wID0gc2Nyb2xsWFlFbGVtZW50KGVsZW1lbnQsICd5Jyk7XG4gICAgICBjbXBTdHlsZUVsZW1lbnQgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsICcnKTtcbiAgICAgIG1heFNjcm9sbExlZnQgPSBzY3JvbGxYWUVsZW1lbnQoZWxlbWVudCwgJ3gnLCBlbGVtZW50LnNjcm9sbFdpZHRoICsgc2Nyb2xsYWJsZS5jbGllbnRXaWR0aCArIC8vIEJsaW5rIGZvciBBbmRyb2lkIGJ1Zywgc2Nyb2xsKiByZXR1cm5zIHNpemUgb2Ygc21hbGxlciBib2R5XG4gICAgICBbJ21hcmdpbkxlZnQnLCAnbWFyZ2luUmlnaHQnLCAnYm9yZGVyTGVmdFdpZHRoJywgJ2JvcmRlclJpZ2h0V2lkdGgnLCAncGFkZGluZ0xlZnQnLCAncGFkZGluZ1JpZ2h0J10ucmVkdWNlKGZ1bmN0aW9uIChsZW4sIHByb3ApIHtcbiAgICAgICAgcmV0dXJuIGxlbiArIChwYXJzZUZsb2F0KGNtcFN0eWxlRWxlbWVudFtwcm9wXSkgfHwgMCk7XG4gICAgICB9LCAwKSk7XG4gICAgICBtYXhTY3JvbGxUb3AgPSBzY3JvbGxYWUVsZW1lbnQoZWxlbWVudCwgJ3knLCBlbGVtZW50LnNjcm9sbEhlaWdodCArIHNjcm9sbGFibGUuY2xpZW50SGVpZ2h0ICsgWydtYXJnaW5Ub3AnLCAnbWFyZ2luQm90dG9tJywgJ2JvcmRlclRvcFdpZHRoJywgJ2JvcmRlckJvdHRvbVdpZHRoJywgJ3BhZGRpbmdUb3AnLCAncGFkZGluZ0JvdHRvbSddLnJlZHVjZShmdW5jdGlvbiAobGVuLCBwcm9wKSB7XG4gICAgICAgIHJldHVybiBsZW4gKyAocGFyc2VGbG9hdChjbXBTdHlsZUVsZW1lbnRbcHJvcF0pIHx8IDApO1xuICAgICAgfSwgMCkpO1xuICAgICAgc2Nyb2xsWFlFbGVtZW50KGVsZW1lbnQsICd4JywgY3VyU2Nyb2xsTGVmdCk7XG4gICAgICBzY3JvbGxYWUVsZW1lbnQoZWxlbWVudCwgJ3knLCBjdXJTY3JvbGxUb3ApO1xuICAgIH1cbiAgfVxuXG4gIHNjcm9sbGFibGUuc2Nyb2xsV2lkdGggPSBzY3JvbGxhYmxlLmNsaWVudFdpZHRoICsgbWF4U2Nyb2xsTGVmdDtcbiAgc2Nyb2xsYWJsZS5zY3JvbGxIZWlnaHQgPSBzY3JvbGxhYmxlLmNsaWVudEhlaWdodCArIG1heFNjcm9sbFRvcDsgLy8gY2xpZW50WC9ZXG5cbiAgdmFyIHJlY3Q7XG5cbiAgaWYgKGlzV2luZG93KSB7XG4gICAgc2Nyb2xsYWJsZS5jbGllbnRYID0gc2Nyb2xsYWJsZS5jbGllbnRZID0gMDtcbiAgfSBlbHNlIHtcbiAgICAvLyBwYWRkaW5nLWJveFxuICAgIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgaWYgKCFjbXBTdHlsZUVsZW1lbnQpIHtcbiAgICAgIGNtcFN0eWxlRWxlbWVudCA9IGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCwgJycpO1xuICAgIH1cblxuICAgIHNjcm9sbGFibGUuY2xpZW50WCA9IHJlY3QubGVmdCArIChwYXJzZUZsb2F0KGNtcFN0eWxlRWxlbWVudC5ib3JkZXJMZWZ0V2lkdGgpIHx8IDApO1xuICAgIHNjcm9sbGFibGUuY2xpZW50WSA9IHJlY3QudG9wICsgKHBhcnNlRmxvYXQoY21wU3R5bGVFbGVtZW50LmJvcmRlclRvcFdpZHRoKSB8fCAwKTtcbiAgfVxuXG4gIHJldHVybiBzY3JvbGxhYmxlO1xufSAvLyBbL0FVVE8tU0NST0xMXVxuXG5cbmZ1bmN0aW9uIGNvcHlUcmVlKG9iaikge1xuICByZXR1cm4gIW9iaiA/IG9iaiA6IGlzT2JqZWN0KG9iaikgPyBPYmplY3Qua2V5cyhvYmopLnJlZHVjZShmdW5jdGlvbiAoY29weU9iaiwga2V5KSB7XG4gICAgY29weU9ialtrZXldID0gY29weVRyZWUob2JqW2tleV0pO1xuICAgIHJldHVybiBjb3B5T2JqO1xuICB9LCB7fSkgOiBBcnJheS5pc0FycmF5KG9iaikgPyBvYmoubWFwKGNvcHlUcmVlKSA6IG9iajtcbn1cblxuZnVuY3Rpb24gaGFzQ2hhbmdlZChhLCBiKSB7XG4gIHZhciB0eXBlQSwga2V5c0E7XG4gIHJldHVybiBfdHlwZW9mKGEpICE9PSBfdHlwZW9mKGIpIHx8ICh0eXBlQSA9IGlzT2JqZWN0KGEpID8gJ29iaicgOiBBcnJheS5pc0FycmF5KGEpID8gJ2FycmF5JyA6ICcnKSAhPT0gKGlzT2JqZWN0KGIpID8gJ29iaicgOiBBcnJheS5pc0FycmF5KGIpID8gJ2FycmF5JyA6ICcnKSB8fCAodHlwZUEgPT09ICdvYmonID8gaGFzQ2hhbmdlZChrZXlzQSA9IE9iamVjdC5rZXlzKGEpLnNvcnQoKSwgT2JqZWN0LmtleXMoYikuc29ydCgpKSB8fCBrZXlzQS5zb21lKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgcmV0dXJuIGhhc0NoYW5nZWQoYVtwcm9wXSwgYltwcm9wXSk7XG4gIH0pIDogdHlwZUEgPT09ICdhcnJheScgPyBhLmxlbmd0aCAhPT0gYi5sZW5ndGggfHwgYS5zb21lKGZ1bmN0aW9uIChhVmFsLCBpKSB7XG4gICAgcmV0dXJuIGhhc0NoYW5nZWQoYVZhbCwgYltpXSk7XG4gIH0pIDogYSAhPT0gYik7XG59XG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCAtIEEgdGFyZ2V0IGVsZW1lbnQuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGNvbm5lY3RlZCBlbGVtZW50LlxuICovXG5cblxuZnVuY3Rpb24gaXNFbGVtZW50KGVsZW1lbnQpIHtcbiAgcmV0dXJuICEhKGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgJiYgLy8gZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmXG4gIHR5cGVvZiBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCA9PT0gJ2Z1bmN0aW9uJyAmJiAhKGVsZW1lbnQuY29tcGFyZURvY3VtZW50UG9zaXRpb24oZG9jdW1lbnQpICYgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9ESVNDT05ORUNURUQpKTtcbn1cbi8qKlxuICogQW4gb2JqZWN0IHRoYXQgc2ltdWxhdGVzIGBET01SZWN0YCB0byBpbmRpY2F0ZSBhIGJvdW5kaW5nLWJveC5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IEJCb3hcbiAqIEBwcm9wZXJ0eSB7KG51bWJlcnxudWxsKX0gbGVmdCAtIGRvY3VtZW50IGNvb3JkaW5hdGVcbiAqIEBwcm9wZXJ0eSB7KG51bWJlcnxudWxsKX0gdG9wIC0gZG9jdW1lbnQgY29vcmRpbmF0ZVxuICogQHByb3BlcnR5IHsobnVtYmVyfG51bGwpfSByaWdodCAtIGRvY3VtZW50IGNvb3JkaW5hdGVcbiAqIEBwcm9wZXJ0eSB7KG51bWJlcnxudWxsKX0gYm90dG9tIC0gZG9jdW1lbnQgY29vcmRpbmF0ZVxuICogQHByb3BlcnR5IHsobnVtYmVyfG51bGwpfSB4IC0gU3Vic3RpdHV0ZXMgZm9yIGxlZnRcbiAqIEBwcm9wZXJ0eSB7KG51bWJlcnxudWxsKX0geSAtIFN1YnN0aXR1dGVzIGZvciB0b3BcbiAqIEBwcm9wZXJ0eSB7KG51bWJlcnxudWxsKX0gd2lkdGhcbiAqIEBwcm9wZXJ0eSB7KG51bWJlcnxudWxsKX0gaGVpZ2h0XG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gYkJveCAtIEEgdGFyZ2V0IG9iamVjdC5cbiAqIEByZXR1cm5zIHsoQkJveHxudWxsKX0gQSBub3JtYWxpemVkIGBCQm94YCwgb3IgbnVsbCBpZiBgYkJveGAgaXMgaW52YWxpZC5cbiAqL1xuXG5cbmZ1bmN0aW9uIHZhbGlkQkJveChiQm94KSB7XG4gIGlmICghaXNPYmplY3QoYkJveCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciB2YWx1ZTtcblxuICBpZiAoaXNGaW5pdGUodmFsdWUgPSBiQm94LmxlZnQpIHx8IGlzRmluaXRlKHZhbHVlID0gYkJveC54KSkge1xuICAgIGJCb3gubGVmdCA9IGJCb3gueCA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGlzRmluaXRlKHZhbHVlID0gYkJveC50b3ApIHx8IGlzRmluaXRlKHZhbHVlID0gYkJveC55KSkge1xuICAgIGJCb3gudG9wID0gYkJveC55ID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoaXNGaW5pdGUoYkJveC53aWR0aCkgJiYgYkJveC53aWR0aCA+PSAwKSB7XG4gICAgYkJveC5yaWdodCA9IGJCb3gubGVmdCArIGJCb3gud2lkdGg7XG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUoYkJveC5yaWdodCkgJiYgYkJveC5yaWdodCA+PSBiQm94LmxlZnQpIHtcbiAgICBiQm94LndpZHRoID0gYkJveC5yaWdodCAtIGJCb3gubGVmdDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChpc0Zpbml0ZShiQm94LmhlaWdodCkgJiYgYkJveC5oZWlnaHQgPj0gMCkge1xuICAgIGJCb3guYm90dG9tID0gYkJveC50b3AgKyBiQm94LmhlaWdodDtcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShiQm94LmJvdHRvbSkgJiYgYkJveC5ib3R0b20gPj0gYkJveC50b3ApIHtcbiAgICBiQm94LmhlaWdodCA9IGJCb3guYm90dG9tIC0gYkJveC50b3A7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gYkJveDtcbn1cbi8qKlxuICogQSB2YWx1ZSB0aGF0IGlzIFBpeGVscyBvciBSYXRpb1xuICogQHR5cGVkZWYge3t2YWx1ZTogbnVtYmVyLCBpc1JhdGlvOiBib29sZWFufX0gUFBWYWx1ZVxuICovXG5cblxuZnVuY3Rpb24gdmFsaWRQUFZhbHVlKHZhbHVlKSB7XG4gIC8vIEdldCBQUFZhbHVlIGZyb20gc3RyaW5nIChhbGwgYC9zYCB3ZXJlIGFscmVhZHkgcmVtb3ZlZClcbiAgZnVuY3Rpb24gc3RyaW5nMlBQVmFsdWUoaW5TdHJpbmcpIHtcbiAgICB2YXIgbWF0Y2hlcyA9IC9eKC4rPykoJSk/JC8uZXhlYyhpblN0cmluZyk7XG4gICAgdmFyIHZhbHVlLCBpc1JhdGlvO1xuICAgIHJldHVybiBtYXRjaGVzICYmIGlzRmluaXRlKHZhbHVlID0gcGFyc2VGbG9hdChtYXRjaGVzWzFdKSkgPyB7XG4gICAgICB2YWx1ZTogKGlzUmF0aW8gPSAhIShtYXRjaGVzWzJdICYmIHZhbHVlKSkgPyB2YWx1ZSAvIDEwMCA6IHZhbHVlLFxuICAgICAgaXNSYXRpbzogaXNSYXRpb1xuICAgIH0gOiBudWxsOyAvLyAwJSAtPiAwXG4gIH1cblxuICByZXR1cm4gaXNGaW5pdGUodmFsdWUpID8ge1xuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBpc1JhdGlvOiBmYWxzZVxuICB9IDogdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHN0cmluZzJQUFZhbHVlKHZhbHVlLnJlcGxhY2UoL1xccy9nLCAnJykpIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gcHBWYWx1ZTJPcHRpb25WYWx1ZShwcFZhbHVlKSB7XG4gIHJldHVybiBwcFZhbHVlLmlzUmF0aW8gPyBcIlwiLmNvbmNhdChwcFZhbHVlLnZhbHVlICogMTAwLCBcIiVcIikgOiBwcFZhbHVlLnZhbHVlO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlUFBWYWx1ZShwcFZhbHVlLCBiYXNlT3JpZ2luLCBiYXNlU2l6ZSkge1xuICByZXR1cm4gdHlwZW9mIHBwVmFsdWUgPT09ICdudW1iZXInID8gcHBWYWx1ZSA6IGJhc2VPcmlnaW4gKyBwcFZhbHVlLnZhbHVlICogKHBwVmFsdWUuaXNSYXRpbyA/IGJhc2VTaXplIDogMSk7XG59XG4vKipcbiAqIEFuIG9iamVjdCB0aGF0IHNpbXVsYXRlcyBCQm94IGJ1dCBwcm9wZXJ0aWVzIGFyZSBQUFZhbHVlLlxuICogQHR5cGVkZWYge09iamVjdH0gUFBCQm94XG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gYkJveCAtIEEgdGFyZ2V0IG9iamVjdC5cbiAqIEByZXR1cm5zIHsoUFBCQm94fG51bGwpfSBBIG5vcm1hbGl6ZWQgYFBQQkJveGAsIG9yIG51bGwgaWYgYGJCb3hgIGlzIGludmFsaWQuXG4gKi9cblxuXG5mdW5jdGlvbiB2YWxpZFBQQkJveChiQm94KSB7XG4gIGlmICghaXNPYmplY3QoYkJveCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBwcFZhbHVlO1xuXG4gIGlmICgocHBWYWx1ZSA9IHZhbGlkUFBWYWx1ZShiQm94LmxlZnQpKSB8fCAocHBWYWx1ZSA9IHZhbGlkUFBWYWx1ZShiQm94LngpKSkge1xuICAgIGJCb3gubGVmdCA9IGJCb3gueCA9IHBwVmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoKHBwVmFsdWUgPSB2YWxpZFBQVmFsdWUoYkJveC50b3ApKSB8fCAocHBWYWx1ZSA9IHZhbGlkUFBWYWx1ZShiQm94LnkpKSkge1xuICAgIGJCb3gudG9wID0gYkJveC55ID0gcHBWYWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmICgocHBWYWx1ZSA9IHZhbGlkUFBWYWx1ZShiQm94LndpZHRoKSkgJiYgcHBWYWx1ZS52YWx1ZSA+PSAwKSB7XG4gICAgYkJveC53aWR0aCA9IHBwVmFsdWU7XG4gICAgZGVsZXRlIGJCb3gucmlnaHQ7XG4gIH0gZWxzZSBpZiAocHBWYWx1ZSA9IHZhbGlkUFBWYWx1ZShiQm94LnJpZ2h0KSkge1xuICAgIGJCb3gucmlnaHQgPSBwcFZhbHVlO1xuICAgIGRlbGV0ZSBiQm94LndpZHRoO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKChwcFZhbHVlID0gdmFsaWRQUFZhbHVlKGJCb3guaGVpZ2h0KSkgJiYgcHBWYWx1ZS52YWx1ZSA+PSAwKSB7XG4gICAgYkJveC5oZWlnaHQgPSBwcFZhbHVlO1xuICAgIGRlbGV0ZSBiQm94LmJvdHRvbTtcbiAgfSBlbHNlIGlmIChwcFZhbHVlID0gdmFsaWRQUFZhbHVlKGJCb3guYm90dG9tKSkge1xuICAgIGJCb3guYm90dG9tID0gcHBWYWx1ZTtcbiAgICBkZWxldGUgYkJveC5oZWlnaHQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gYkJveDtcbn1cblxuZnVuY3Rpb24gcHBCQm94Mk9wdGlvbk9iamVjdChwcEJCb3gpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHBwQkJveCkucmVkdWNlKGZ1bmN0aW9uIChvYmosIHByb3ApIHtcbiAgICBvYmpbcHJvcF0gPSBwcFZhbHVlMk9wdGlvblZhbHVlKHBwQkJveFtwcm9wXSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfSwge30pO1xufSAvLyBQUEJCb3ggLT4gQkJveFxuXG5cbmZ1bmN0aW9uIHJlc29sdmVQUEJCb3gocHBCQm94LCBiYXNlQkJveCkge1xuICB2YXIgcHJvcDJBeGlzID0ge1xuICAgIGxlZnQ6ICd4JyxcbiAgICByaWdodDogJ3gnLFxuICAgIHg6ICd4JyxcbiAgICB3aWR0aDogJ3gnLFxuICAgIHRvcDogJ3knLFxuICAgIGJvdHRvbTogJ3knLFxuICAgIHk6ICd5JyxcbiAgICBoZWlnaHQ6ICd5J1xuICB9LFxuICAgICAgYmFzZU9yaWdpblhZID0ge1xuICAgIHg6IGJhc2VCQm94LmxlZnQsXG4gICAgeTogYmFzZUJCb3gudG9wXG4gIH0sXG4gICAgICBiYXNlU2l6ZVhZID0ge1xuICAgIHg6IGJhc2VCQm94LndpZHRoLFxuICAgIHk6IGJhc2VCQm94LmhlaWdodFxuICB9O1xuICByZXR1cm4gdmFsaWRCQm94KE9iamVjdC5rZXlzKHBwQkJveCkucmVkdWNlKGZ1bmN0aW9uIChiQm94LCBwcm9wKSB7XG4gICAgYkJveFtwcm9wXSA9IHJlc29sdmVQUFZhbHVlKHBwQkJveFtwcm9wXSwgcHJvcCA9PT0gJ3dpZHRoJyB8fCBwcm9wID09PSAnaGVpZ2h0JyA/IDAgOiBiYXNlT3JpZ2luWFlbcHJvcDJBeGlzW3Byb3BdXSwgYmFzZVNpemVYWVtwcm9wMkF4aXNbcHJvcF1dKTtcbiAgICByZXR1cm4gYkJveDtcbiAgfSwge30pKTtcbn1cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IC0gQSB0YXJnZXQgZWxlbWVudC5cbiAqIEBwYXJhbSB7P2Jvb2xlYW59IGdldFBhZGRpbmdCb3ggLSBHZXQgcGFkZGluZy1ib3ggaW5zdGVhZCBvZiBib3JkZXItYm94IGFzIGJvdW5kaW5nLWJveC5cbiAqIEByZXR1cm5zIHtCQm94fSBBIGJvdW5kaW5nLWJveCBvZiBgZWxlbWVudGAuXG4gKi9cblxuXG5mdW5jdGlvbiBnZXRCQm94KGVsZW1lbnQsIGdldFBhZGRpbmdCb3gpIHtcbiAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgYkJveCA9IHtcbiAgICBsZWZ0OiByZWN0LmxlZnQsXG4gICAgdG9wOiByZWN0LnRvcCxcbiAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gIH07XG4gIGJCb3gubGVmdCArPSB3aW5kb3cucGFnZVhPZmZzZXQ7XG4gIGJCb3gudG9wICs9IHdpbmRvdy5wYWdlWU9mZnNldDtcblxuICBpZiAoZ2V0UGFkZGluZ0JveCkge1xuICAgIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsICcnKSxcbiAgICAgICAgYm9yZGVyVG9wID0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgfHwgMCxcbiAgICAgICAgYm9yZGVyUmlnaHQgPSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclJpZ2h0V2lkdGgpIHx8IDAsXG4gICAgICAgIGJvcmRlckJvdHRvbSA9IHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyQm90dG9tV2lkdGgpIHx8IDAsXG4gICAgICAgIGJvcmRlckxlZnQgPSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckxlZnRXaWR0aCkgfHwgMDtcbiAgICBiQm94LmxlZnQgKz0gYm9yZGVyTGVmdDtcbiAgICBiQm94LnRvcCArPSBib3JkZXJUb3A7XG4gICAgYkJveC53aWR0aCAtPSBib3JkZXJMZWZ0ICsgYm9yZGVyUmlnaHQ7XG4gICAgYkJveC5oZWlnaHQgLT0gYm9yZGVyVG9wICsgYm9yZGVyQm90dG9tO1xuICB9XG5cbiAgcmV0dXJuIHZhbGlkQkJveChiQm94KTtcbn1cbi8qKlxuICogT3B0aW1pemUgYW4gZWxlbWVudCBmb3IgYW5pbWF0aW9uLlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IC0gQSB0YXJnZXQgZWxlbWVudC5cbiAqIEBwYXJhbSB7P2Jvb2xlYW59IGdwdVRyaWdnZXIgLSBJbml0aWFsaXplIGZvciBTVkdFbGVtZW50IGlmIGB0cnVlYC5cbiAqIEByZXR1cm5zIHtFbGVtZW50fSBBIHRhcmdldCBlbGVtZW50LlxuICovXG5cblxuZnVuY3Rpb24gaW5pdEFuaW0oZWxlbWVudCwgZ3B1VHJpZ2dlcikge1xuICB2YXIgc3R5bGUgPSBlbGVtZW50LnN0eWxlO1xuICBzdHlsZS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9ICd0cmFuc3BhcmVudCc7IC8vIE9ubHkgd2hlbiBpdCBoYXMgbm8gc2hhZG93XG5cbiAgdmFyIGNzc1Byb3BCb3hTaGFkb3cgPSBDU1NQcmVmaXguZ2V0TmFtZSgnYm94U2hhZG93JyksXG4gICAgICBib3hTaGFkb3cgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCAnJylbY3NzUHJvcEJveFNoYWRvd107XG5cbiAgaWYgKCFib3hTaGFkb3cgfHwgYm94U2hhZG93ID09PSAnbm9uZScpIHtcbiAgICBzdHlsZVtjc3NQcm9wQm94U2hhZG93XSA9ICcwIDAgMXB4IHRyYW5zcGFyZW50JztcbiAgfVxuXG4gIGlmIChncHVUcmlnZ2VyICYmIGNzc1Byb3BUcmFuc2Zvcm0pIHtcbiAgICBzdHlsZVtjc3NQcm9wVHJhbnNmb3JtXSA9ICd0cmFuc2xhdGVaKDApJztcbiAgfVxuXG4gIHJldHVybiBlbGVtZW50O1xufVxuXG5mdW5jdGlvbiBzZXREcmFnZ2FibGVDdXJzb3IoZWxlbWVudCwgb3JnQ3Vyc29yKSB7XG4gIGlmIChjc3NWYWx1ZURyYWdnYWJsZUN1cnNvciA9PSBudWxsKSB7XG4gICAgaWYgKGNzc1dhbnRlZFZhbHVlRHJhZ2dhYmxlQ3Vyc29yICE9PSBmYWxzZSkge1xuICAgICAgY3NzVmFsdWVEcmFnZ2FibGVDdXJzb3IgPSBDU1NQcmVmaXguZ2V0VmFsdWUoJ2N1cnNvcicsIGNzc1dhbnRlZFZhbHVlRHJhZ2dhYmxlQ3Vyc29yKTtcbiAgICB9IC8vIFRoZSB3YW50ZWQgdmFsdWUgd2FzIGRlbmllZCwgb3IgY2hhbmdpbmcgaXMgbm90IHdhbnRlZC5cblxuXG4gICAgaWYgKGNzc1ZhbHVlRHJhZ2dhYmxlQ3Vyc29yID09IG51bGwpIHtcbiAgICAgIGNzc1ZhbHVlRHJhZ2dhYmxlQ3Vyc29yID0gZmFsc2U7XG4gICAgfVxuICB9IC8vIFVwZGF0ZSBpdCB0byBjaGFuZ2UgYSBzdGF0ZSBldmVuIGlmIGNzc1ZhbHVlRHJhZ2dhYmxlQ3Vyc29yIGlzIGZhbHNlLlxuXG5cbiAgZWxlbWVudC5zdHlsZS5jdXJzb3IgPSBjc3NWYWx1ZURyYWdnYWJsZUN1cnNvciA9PT0gZmFsc2UgPyBvcmdDdXJzb3IgOiBjc3NWYWx1ZURyYWdnYWJsZUN1cnNvcjtcbn1cblxuZnVuY3Rpb24gc2V0RHJhZ2dpbmdDdXJzb3IoZWxlbWVudCkge1xuICBpZiAoY3NzVmFsdWVEcmFnZ2luZ0N1cnNvciA9PSBudWxsKSB7XG4gICAgaWYgKGNzc1dhbnRlZFZhbHVlRHJhZ2dpbmdDdXJzb3IgIT09IGZhbHNlKSB7XG4gICAgICBjc3NWYWx1ZURyYWdnaW5nQ3Vyc29yID0gQ1NTUHJlZml4LmdldFZhbHVlKCdjdXJzb3InLCBjc3NXYW50ZWRWYWx1ZURyYWdnaW5nQ3Vyc29yKTtcbiAgICB9IC8vIFRoZSB3YW50ZWQgdmFsdWUgd2FzIGRlbmllZCwgb3IgY2hhbmdpbmcgaXMgbm90IHdhbnRlZC5cblxuXG4gICAgaWYgKGNzc1ZhbHVlRHJhZ2dpbmdDdXJzb3IgPT0gbnVsbCkge1xuICAgICAgY3NzVmFsdWVEcmFnZ2luZ0N1cnNvciA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjc3NWYWx1ZURyYWdnaW5nQ3Vyc29yICE9PSBmYWxzZSkge1xuICAgIGVsZW1lbnQuc3R5bGUuY3Vyc29yID0gY3NzVmFsdWVEcmFnZ2luZ0N1cnNvcjtcbiAgfVxufSAvLyBbU1ZHXVxuXG4vKipcbiAqIEdldCBTVkcgY29vcmRpbmF0ZXMgZnJvbSB2aWV3cG9ydCBjb29yZGluYXRlcy5cbiAqIEBwYXJhbSB7cHJvcHN9IHByb3BzIC0gYHByb3BzYCBvZiBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBjbGllbnRYIC0gdmlld3BvcnQgWC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBjbGllbnRZIC0gdmlld3BvcnQgWS5cbiAqIEByZXR1cm5zIHtTVkdQb2ludH0gU1ZHIGNvb3JkaW5hdGVzLlxuICovXG5cblxuZnVuY3Rpb24gdmlld1BvaW50MlN2Z1BvaW50KHByb3BzLCBjbGllbnRYLCBjbGllbnRZKSB7XG4gIHZhciBzdmdQb2ludCA9IHByb3BzLnN2Z1BvaW50O1xuICBzdmdQb2ludC54ID0gY2xpZW50WDtcbiAgc3ZnUG9pbnQueSA9IGNsaWVudFk7XG4gIHJldHVybiBzdmdQb2ludC5tYXRyaXhUcmFuc2Zvcm0ocHJvcHMuc3ZnQ3RtRWxlbWVudC5nZXRTY3JlZW5DVE0oKS5pbnZlcnNlKCkpO1xufSAvLyBbL1NWR11cblxuLyoqXG4gKiBNb3ZlIGJ5IGB0cmFuc2xhdGVgLlxuICogQHBhcmFtIHtwcm9wc30gcHJvcHMgLSBgcHJvcHNgIG9mIGluc3RhbmNlLlxuICogQHBhcmFtIHt7bGVmdDogbnVtYmVyLCB0b3A6IG51bWJlcn19IHBvc2l0aW9uIC0gTmV3IHBvc2l0aW9uLlxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiBpdCB3YXMgbW92ZWQuXG4gKi9cblxuXG5mdW5jdGlvbiBtb3ZlVHJhbnNsYXRlKHByb3BzLCBwb3NpdGlvbikge1xuICB2YXIgZWxlbWVudEJCb3ggPSBwcm9wcy5lbGVtZW50QkJveDtcblxuICBpZiAocG9zaXRpb24ubGVmdCAhPT0gZWxlbWVudEJCb3gubGVmdCB8fCBwb3NpdGlvbi50b3AgIT09IGVsZW1lbnRCQm94LnRvcCkge1xuICAgIHZhciBvZmZzZXQgPSBwcm9wcy5odG1sT2Zmc2V0O1xuICAgIHByb3BzLmVsZW1lbnRTdHlsZVtjc3NQcm9wVHJhbnNmb3JtXSA9IFwidHJhbnNsYXRlKFwiLmNvbmNhdChwb3NpdGlvbi5sZWZ0ICsgb2Zmc2V0LmxlZnQsIFwicHgsIFwiKS5jb25jYXQocG9zaXRpb24udG9wICsgb2Zmc2V0LnRvcCwgXCJweClcIik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59IC8vIFtMRUZUVE9QXVxuXG4vKipcbiAqIE1vdmUgYnkgYGxlZnRgIGFuZCBgdG9wYC5cbiAqIEBwYXJhbSB7cHJvcHN9IHByb3BzIC0gYHByb3BzYCBvZiBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7e2xlZnQ6IG51bWJlciwgdG9wOiBudW1iZXJ9fSBwb3NpdGlvbiAtIE5ldyBwb3NpdGlvbi5cbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgaXQgd2FzIG1vdmVkLlxuICovXG5cblxuZnVuY3Rpb24gbW92ZUxlZnRUb3AocHJvcHMsIHBvc2l0aW9uKSB7XG4gIHZhciBlbGVtZW50QkJveCA9IHByb3BzLmVsZW1lbnRCQm94LFxuICAgICAgZWxlbWVudFN0eWxlID0gcHJvcHMuZWxlbWVudFN0eWxlLFxuICAgICAgb2Zmc2V0ID0gcHJvcHMuaHRtbE9mZnNldDtcbiAgdmFyIG1vdmVkID0gZmFsc2U7XG5cbiAgaWYgKHBvc2l0aW9uLmxlZnQgIT09IGVsZW1lbnRCQm94LmxlZnQpIHtcbiAgICBlbGVtZW50U3R5bGUubGVmdCA9IHBvc2l0aW9uLmxlZnQgKyBvZmZzZXQubGVmdCArICdweCc7XG4gICAgbW92ZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHBvc2l0aW9uLnRvcCAhPT0gZWxlbWVudEJCb3gudG9wKSB7XG4gICAgZWxlbWVudFN0eWxlLnRvcCA9IHBvc2l0aW9uLnRvcCArIG9mZnNldC50b3AgKyAncHgnO1xuICAgIG1vdmVkID0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBtb3ZlZDtcbn0gLy8gWy9MRUZUVE9QXVxuLy8gW1NWR11cblxuLyoqXG4gKiBNb3ZlIFNWR0VsZW1lbnQuXG4gKiBAcGFyYW0ge3Byb3BzfSBwcm9wcyAtIGBwcm9wc2Agb2YgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge3tsZWZ0OiBudW1iZXIsIHRvcDogbnVtYmVyfX0gcG9zaXRpb24gLSBOZXcgcG9zaXRpb24uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGl0IHdhcyBtb3ZlZC5cbiAqL1xuXG5cbmZ1bmN0aW9uIG1vdmVTdmcocHJvcHMsIHBvc2l0aW9uKSB7XG4gIHZhciBlbGVtZW50QkJveCA9IHByb3BzLmVsZW1lbnRCQm94O1xuXG4gIGlmIChwb3NpdGlvbi5sZWZ0ICE9PSBlbGVtZW50QkJveC5sZWZ0IHx8IHBvc2l0aW9uLnRvcCAhPT0gZWxlbWVudEJCb3gudG9wKSB7XG4gICAgdmFyIG9mZnNldCA9IHByb3BzLnN2Z09mZnNldCxcbiAgICAgICAgb3JpZ2luQkJveCA9IHByb3BzLnN2Z09yaWdpbkJCb3gsXG4gICAgICAgIHBvaW50ID0gdmlld1BvaW50MlN2Z1BvaW50KHByb3BzLCBwb3NpdGlvbi5sZWZ0IC0gd2luZG93LnBhZ2VYT2Zmc2V0LCBwb3NpdGlvbi50b3AgLSB3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgIHByb3BzLnN2Z1RyYW5zZm9ybS5zZXRUcmFuc2xhdGUocG9pbnQueCArIG9mZnNldC54IC0gb3JpZ2luQkJveC54LCBwb2ludC55ICsgb2Zmc2V0LnkgLSBvcmlnaW5CQm94LnkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufSAvLyBbL1NWR11cblxuLyoqXG4gKiBTZXQgYHByb3BzLmVsZW1lbnRgIHBvc2l0aW9uLlxuICogQHBhcmFtIHtwcm9wc30gcHJvcHMgLSBgcHJvcHNgIG9mIGluc3RhbmNlLlxuICogQHBhcmFtIHt7bGVmdDogbnVtYmVyLCB0b3A6IG51bWJlcn19IHBvc2l0aW9uIC0gTmV3IHBvc2l0aW9uLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2NiQ2hlY2tdIC0gQ2FsbGJhY2sgdGhhdCBpcyBjYWxsZWQgd2l0aCB2YWxpZCBwb3NpdGlvbiwgY2FuY2VsIG1vdmluZyBpZiBpdCByZXR1cm5zIGBmYWxzZWAuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGl0IHdhcyBtb3ZlZC5cbiAqL1xuXG5cbmZ1bmN0aW9uIG1vdmUocHJvcHMsIHBvc2l0aW9uLCBjYkNoZWNrKSB7XG4gIHZhciBlbGVtZW50QkJveCA9IHByb3BzLmVsZW1lbnRCQm94O1xuXG4gIGZ1bmN0aW9uIGZpeCgpIHtcbiAgICBpZiAocHJvcHMubWluTGVmdCA+PSBwcm9wcy5tYXhMZWZ0KSB7XG4gICAgICAvLyBEaXNhYmxlZFxuICAgICAgcG9zaXRpb24ubGVmdCA9IGVsZW1lbnRCQm94LmxlZnQ7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbi5sZWZ0IDwgcHJvcHMubWluTGVmdCkge1xuICAgICAgcG9zaXRpb24ubGVmdCA9IHByb3BzLm1pbkxlZnQ7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbi5sZWZ0ID4gcHJvcHMubWF4TGVmdCkge1xuICAgICAgcG9zaXRpb24ubGVmdCA9IHByb3BzLm1heExlZnQ7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzLm1pblRvcCA+PSBwcm9wcy5tYXhUb3ApIHtcbiAgICAgIC8vIERpc2FibGVkXG4gICAgICBwb3NpdGlvbi50b3AgPSBlbGVtZW50QkJveC50b3A7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbi50b3AgPCBwcm9wcy5taW5Ub3ApIHtcbiAgICAgIHBvc2l0aW9uLnRvcCA9IHByb3BzLm1pblRvcDtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uLnRvcCA+IHByb3BzLm1heFRvcCkge1xuICAgICAgcG9zaXRpb24udG9wID0gcHJvcHMubWF4VG9wO1xuICAgIH1cbiAgfVxuXG4gIGZpeCgpO1xuXG4gIGlmIChjYkNoZWNrKSB7XG4gICAgaWYgKGNiQ2hlY2socG9zaXRpb24pID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZpeCgpOyAvLyBBZ2FpblxuICB9XG5cbiAgdmFyIG1vdmVkID0gcHJvcHMubW92ZUVsbShwcm9wcywgcG9zaXRpb24pO1xuXG4gIGlmIChtb3ZlZCkge1xuICAgIC8vIFVwZGF0ZSBlbGVtZW50QkJveFxuICAgIHByb3BzLmVsZW1lbnRCQm94ID0gdmFsaWRCQm94KHtcbiAgICAgIGxlZnQ6IHBvc2l0aW9uLmxlZnQsXG4gICAgICB0b3A6IHBvc2l0aW9uLnRvcCxcbiAgICAgIHdpZHRoOiBlbGVtZW50QkJveC53aWR0aCxcbiAgICAgIGhlaWdodDogZWxlbWVudEJCb3guaGVpZ2h0XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gbW92ZWQ7XG59XG4vKipcbiAqIEluaXRpYWxpemUgSFRNTEVsZW1lbnQgZm9yIGB0cmFuc2xhdGVgLCBhbmQgZ2V0IGBvZmZzZXRgIHRoYXQgaXMgdXNlZCBieSBgbW92ZVRyYW5zbGF0ZWAuXG4gKiBAcGFyYW0ge3Byb3BzfSBwcm9wcyAtIGBwcm9wc2Agb2YgaW5zdGFuY2UuXG4gKiBAcmV0dXJucyB7QkJveH0gQ3VycmVudCBCQm94IHdpdGhvdXQgYW5pbWF0aW9uLCBpLmUuIGxlZnQvdG9wIHByb3BlcnRpZXMuXG4gKi9cblxuXG5mdW5jdGlvbiBpbml0VHJhbnNsYXRlKHByb3BzKSB7XG4gIHZhciBlbGVtZW50ID0gcHJvcHMuZWxlbWVudCxcbiAgICAgIGVsZW1lbnRTdHlsZSA9IHByb3BzLmVsZW1lbnRTdHlsZSxcbiAgICAgIGN1clBvc2l0aW9uID0gZ2V0QkJveChlbGVtZW50KSxcbiAgICAgIC8vIEdldCBCQm94IGJlZm9yZSBjaGFuZ2Ugc3R5bGUuXG4gIFJFU1RPUkVfUFJPUFMgPSBbJ2Rpc3BsYXknLCAnbWFyZ2luVG9wJywgJ21hcmdpbkJvdHRvbScsICd3aWR0aCcsICdoZWlnaHQnXTtcbiAgUkVTVE9SRV9QUk9QUy51bnNoaWZ0KGNzc1Byb3BUcmFuc2Zvcm0pOyAvLyBSZXNldCBgdHJhbnNpdGlvbi1wcm9wZXJ0eWAgZXZlcnkgdGltZSBiZWNhdXNlIGl0IG1pZ2h0IGJlIGNoYW5nZWQgZnJlcXVlbnRseS5cblxuICB2YXIgb3JnVHJhbnNpdGlvblByb3BlcnR5ID0gZWxlbWVudFN0eWxlW2Nzc1Byb3BUcmFuc2l0aW9uUHJvcGVydHldO1xuICBlbGVtZW50U3R5bGVbY3NzUHJvcFRyYW5zaXRpb25Qcm9wZXJ0eV0gPSAnbm9uZSc7IC8vIERpc2FibGUgYW5pbWF0aW9uXG5cbiAgdmFyIGZpeFBvc2l0aW9uID0gZ2V0QkJveChlbGVtZW50KTtcblxuICBpZiAoIXByb3BzLm9yZ1N0eWxlKSB7XG4gICAgcHJvcHMub3JnU3R5bGUgPSBSRVNUT1JFX1BST1BTLnJlZHVjZShmdW5jdGlvbiAob3JnU3R5bGUsIHByb3ApIHtcbiAgICAgIG9yZ1N0eWxlW3Byb3BdID0gZWxlbWVudFN0eWxlW3Byb3BdIHx8ICcnO1xuICAgICAgcmV0dXJuIG9yZ1N0eWxlO1xuICAgIH0sIHt9KTtcbiAgICBwcm9wcy5sYXN0U3R5bGUgPSB7fTtcbiAgfSBlbHNlIHtcbiAgICBSRVNUT1JFX1BST1BTLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIC8vIFNraXAgdGhpcyBpZiBpdCBzZWVtcyB1c2VyIGNoYW5nZWQgaXQuIChpdCBjYW4ndCBjaGVjayBwZXJmZWN0bHkuKVxuICAgICAgaWYgKHByb3BzLmxhc3RTdHlsZVtwcm9wXSA9PSBudWxsIHx8IGVsZW1lbnRTdHlsZVtwcm9wXSA9PT0gcHJvcHMubGFzdFN0eWxlW3Byb3BdKSB7XG4gICAgICAgIGVsZW1lbnRTdHlsZVtwcm9wXSA9IHByb3BzLm9yZ1N0eWxlW3Byb3BdO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdmFyIG9yZ1NpemUgPSBnZXRCQm94KGVsZW1lbnQpLFxuICAgICAgY21wU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCAnJyk7IC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3MtdHJhbnNmb3Jtcy0xLyN0cmFuc2Zvcm1hYmxlLWVsZW1lbnRcblxuICBpZiAoY21wU3R5bGUuZGlzcGxheSA9PT0gJ2lubGluZScpIHtcbiAgICBlbGVtZW50U3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xuICAgIFsnVG9wJywgJ0JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKGRpclByb3ApIHtcbiAgICAgIHZhciBwYWRkaW5nID0gcGFyc2VGbG9hdChjbXBTdHlsZVtcInBhZGRpbmdcIi5jb25jYXQoZGlyUHJvcCldKTsgLy8gcGFkZGluZ1RvcC9Cb3R0b20gbWFrZSBwYWRkaW5nIGJ1dCBkb24ndCBtYWtlIHNwYWNlIC0+IG5lZ2F0aXZlIG1hcmdpbiBpbiBpbmxpbmUtYmxvY2tcbiAgICAgIC8vIG1hcmdpblRvcC9Cb3R0b20gZG9uJ3Qgd29yayBpbiBpbmxpbmUgZWxlbWVudCAtPiBgMGAgaW4gaW5saW5lLWJsb2NrXG5cbiAgICAgIGVsZW1lbnRTdHlsZVtcIm1hcmdpblwiLmNvbmNhdChkaXJQcm9wKV0gPSBwYWRkaW5nID8gXCItXCIuY29uY2F0KHBhZGRpbmcsIFwicHhcIikgOiAnMCc7XG4gICAgfSk7XG4gIH1cblxuICBlbGVtZW50U3R5bGVbY3NzUHJvcFRyYW5zZm9ybV0gPSAndHJhbnNsYXRlKDAsIDApJzsgLy8gR2V0IGRvY3VtZW50IG9mZnNldC5cblxuICB2YXIgbmV3QkJveCA9IGdldEJCb3goZWxlbWVudCk7XG4gIHZhciBvZmZzZXQgPSBwcm9wcy5odG1sT2Zmc2V0ID0ge1xuICAgIGxlZnQ6IG5ld0JCb3gubGVmdCA/IC1uZXdCQm94LmxlZnQgOiAwLFxuICAgIHRvcDogbmV3QkJveC50b3AgPyAtbmV3QkJveC50b3AgOiAwXG4gIH07IC8vIGF2b2lkIGAtMGBcbiAgLy8gUmVzdG9yZSBwb3NpdGlvblxuXG4gIGVsZW1lbnRTdHlsZVtjc3NQcm9wVHJhbnNmb3JtXSA9IFwidHJhbnNsYXRlKFwiLmNvbmNhdChjdXJQb3NpdGlvbi5sZWZ0ICsgb2Zmc2V0LmxlZnQsIFwicHgsIFwiKS5jb25jYXQoY3VyUG9zaXRpb24udG9wICsgb2Zmc2V0LnRvcCwgXCJweClcIik7IC8vIFJlc3RvcmUgc2l6ZVxuXG4gIFsnd2lkdGgnLCAnaGVpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAocHJvcCkge1xuICAgIGlmIChuZXdCQm94W3Byb3BdICE9PSBvcmdTaXplW3Byb3BdKSB7XG4gICAgICAvLyBJZ25vcmUgYGJveC1zaXppbmdgXG4gICAgICBlbGVtZW50U3R5bGVbcHJvcF0gPSBvcmdTaXplW3Byb3BdICsgJ3B4JztcbiAgICAgIG5ld0JCb3ggPSBnZXRCQm94KGVsZW1lbnQpO1xuXG4gICAgICBpZiAobmV3QkJveFtwcm9wXSAhPT0gb3JnU2l6ZVtwcm9wXSkge1xuICAgICAgICAvLyBSZXRyeVxuICAgICAgICBlbGVtZW50U3R5bGVbcHJvcF0gPSBvcmdTaXplW3Byb3BdIC0gKG5ld0JCb3hbcHJvcF0gLSBvcmdTaXplW3Byb3BdKSArICdweCc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvcHMubGFzdFN0eWxlW3Byb3BdID0gZWxlbWVudFN0eWxlW3Byb3BdO1xuICB9KTsgLy8gUmVzdG9yZSBgdHJhbnNpdGlvbi1wcm9wZXJ0eWBcblxuICBlbGVtZW50Lm9mZnNldFdpZHRoO1xuICAvKiBmb3JjZSByZWZsb3cgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtZXhwcmVzc2lvbnNcblxuICBlbGVtZW50U3R5bGVbY3NzUHJvcFRyYW5zaXRpb25Qcm9wZXJ0eV0gPSBvcmdUcmFuc2l0aW9uUHJvcGVydHk7XG5cbiAgaWYgKGZpeFBvc2l0aW9uLmxlZnQgIT09IGN1clBvc2l0aW9uLmxlZnQgfHwgZml4UG9zaXRpb24udG9wICE9PSBjdXJQb3NpdGlvbi50b3ApIHtcbiAgICAvLyBJdCBzZWVtcyB0aGF0IGl0IGlzIG1vdmluZy5cbiAgICBlbGVtZW50U3R5bGVbY3NzUHJvcFRyYW5zZm9ybV0gPSBcInRyYW5zbGF0ZShcIi5jb25jYXQoZml4UG9zaXRpb24ubGVmdCArIG9mZnNldC5sZWZ0LCBcInB4LCBcIikuY29uY2F0KGZpeFBvc2l0aW9uLnRvcCArIG9mZnNldC50b3AsIFwicHgpXCIpO1xuICB9XG5cbiAgcmV0dXJuIGZpeFBvc2l0aW9uO1xufSAvLyBbTEVGVFRPUF1cblxuLyoqXG4gKiBJbml0aWFsaXplIEhUTUxFbGVtZW50IGZvciBgbGVmdGAgYW5kIGB0b3BgLCBhbmQgZ2V0IGBvZmZzZXRgIHRoYXQgaXMgdXNlZCBieSBgbW92ZUxlZnRUb3BgLlxuICogQHBhcmFtIHtwcm9wc30gcHJvcHMgLSBgcHJvcHNgIG9mIGluc3RhbmNlLlxuICogQHJldHVybnMge0JCb3h9IEN1cnJlbnQgQkJveCB3aXRob3V0IGFuaW1hdGlvbiwgaS5lLiBsZWZ0L3RvcCBwcm9wZXJ0aWVzLlxuICovXG5cblxuZnVuY3Rpb24gaW5pdExlZnRUb3AocHJvcHMpIHtcbiAgdmFyIGVsZW1lbnQgPSBwcm9wcy5lbGVtZW50LFxuICAgICAgZWxlbWVudFN0eWxlID0gcHJvcHMuZWxlbWVudFN0eWxlLFxuICAgICAgY3VyUG9zaXRpb24gPSBnZXRCQm94KGVsZW1lbnQpLFxuICAgICAgLy8gR2V0IEJCb3ggYmVmb3JlIGNoYW5nZSBzdHlsZS5cbiAgUkVTVE9SRV9QUk9QUyA9IFsncG9zaXRpb24nLCAnbWFyZ2luVG9wJywgJ21hcmdpblJpZ2h0JywgJ21hcmdpbkJvdHRvbScsICdtYXJnaW5MZWZ0JywgJ3dpZHRoJywgJ2hlaWdodCddOyAvLyBSZXNldCBgdHJhbnNpdGlvbi1wcm9wZXJ0eWAgZXZlcnkgdGltZSBiZWNhdXNlIGl0IG1pZ2h0IGJlIGNoYW5nZWQgZnJlcXVlbnRseS5cblxuICB2YXIgb3JnVHJhbnNpdGlvblByb3BlcnR5ID0gZWxlbWVudFN0eWxlW2Nzc1Byb3BUcmFuc2l0aW9uUHJvcGVydHldO1xuICBlbGVtZW50U3R5bGVbY3NzUHJvcFRyYW5zaXRpb25Qcm9wZXJ0eV0gPSAnbm9uZSc7IC8vIERpc2FibGUgYW5pbWF0aW9uXG5cbiAgdmFyIGZpeFBvc2l0aW9uID0gZ2V0QkJveChlbGVtZW50KTtcblxuICBpZiAoIXByb3BzLm9yZ1N0eWxlKSB7XG4gICAgcHJvcHMub3JnU3R5bGUgPSBSRVNUT1JFX1BST1BTLnJlZHVjZShmdW5jdGlvbiAob3JnU3R5bGUsIHByb3ApIHtcbiAgICAgIG9yZ1N0eWxlW3Byb3BdID0gZWxlbWVudFN0eWxlW3Byb3BdIHx8ICcnO1xuICAgICAgcmV0dXJuIG9yZ1N0eWxlO1xuICAgIH0sIHt9KTtcbiAgICBwcm9wcy5sYXN0U3R5bGUgPSB7fTtcbiAgfSBlbHNlIHtcbiAgICBSRVNUT1JFX1BST1BTLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIC8vIFNraXAgdGhpcyBpZiBpdCBzZWVtcyB1c2VyIGNoYW5nZWQgaXQuIChpdCBjYW4ndCBjaGVjayBwZXJmZWN0bHkuKVxuICAgICAgaWYgKHByb3BzLmxhc3RTdHlsZVtwcm9wXSA9PSBudWxsIHx8IGVsZW1lbnRTdHlsZVtwcm9wXSA9PT0gcHJvcHMubGFzdFN0eWxlW3Byb3BdKSB7XG4gICAgICAgIGVsZW1lbnRTdHlsZVtwcm9wXSA9IHByb3BzLm9yZ1N0eWxlW3Byb3BdO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdmFyIG9yZ1NpemUgPSBnZXRCQm94KGVsZW1lbnQpO1xuICBlbGVtZW50U3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBlbGVtZW50U3R5bGUubGVmdCA9IGVsZW1lbnRTdHlsZS50b3AgPSBlbGVtZW50U3R5bGUubWFyZ2luID0gJzAnOyAvLyBHZXQgZG9jdW1lbnQgb2Zmc2V0LlxuXG4gIHZhciBuZXdCQm94ID0gZ2V0QkJveChlbGVtZW50KTtcbiAgdmFyIG9mZnNldCA9IHByb3BzLmh0bWxPZmZzZXQgPSB7XG4gICAgbGVmdDogbmV3QkJveC5sZWZ0ID8gLW5ld0JCb3gubGVmdCA6IDAsXG4gICAgdG9wOiBuZXdCQm94LnRvcCA/IC1uZXdCQm94LnRvcCA6IDBcbiAgfTsgLy8gYXZvaWQgYC0wYFxuICAvLyBSZXN0b3JlIHBvc2l0aW9uXG5cbiAgZWxlbWVudFN0eWxlLmxlZnQgPSBjdXJQb3NpdGlvbi5sZWZ0ICsgb2Zmc2V0LmxlZnQgKyAncHgnO1xuICBlbGVtZW50U3R5bGUudG9wID0gY3VyUG9zaXRpb24udG9wICsgb2Zmc2V0LnRvcCArICdweCc7IC8vIFJlc3RvcmUgc2l6ZVxuXG4gIFsnd2lkdGgnLCAnaGVpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAocHJvcCkge1xuICAgIGlmIChuZXdCQm94W3Byb3BdICE9PSBvcmdTaXplW3Byb3BdKSB7XG4gICAgICAvLyBJZ25vcmUgYGJveC1zaXppbmdgXG4gICAgICBlbGVtZW50U3R5bGVbcHJvcF0gPSBvcmdTaXplW3Byb3BdICsgJ3B4JztcbiAgICAgIG5ld0JCb3ggPSBnZXRCQm94KGVsZW1lbnQpO1xuXG4gICAgICBpZiAobmV3QkJveFtwcm9wXSAhPT0gb3JnU2l6ZVtwcm9wXSkge1xuICAgICAgICAvLyBSZXRyeVxuICAgICAgICBlbGVtZW50U3R5bGVbcHJvcF0gPSBvcmdTaXplW3Byb3BdIC0gKG5ld0JCb3hbcHJvcF0gLSBvcmdTaXplW3Byb3BdKSArICdweCc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvcHMubGFzdFN0eWxlW3Byb3BdID0gZWxlbWVudFN0eWxlW3Byb3BdO1xuICB9KTsgLy8gUmVzdG9yZSBgdHJhbnNpdGlvbi1wcm9wZXJ0eWBcblxuICBlbGVtZW50Lm9mZnNldFdpZHRoO1xuICAvKiBmb3JjZSByZWZsb3cgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtZXhwcmVzc2lvbnNcblxuICBlbGVtZW50U3R5bGVbY3NzUHJvcFRyYW5zaXRpb25Qcm9wZXJ0eV0gPSBvcmdUcmFuc2l0aW9uUHJvcGVydHk7XG5cbiAgaWYgKGZpeFBvc2l0aW9uLmxlZnQgIT09IGN1clBvc2l0aW9uLmxlZnQgfHwgZml4UG9zaXRpb24udG9wICE9PSBjdXJQb3NpdGlvbi50b3ApIHtcbiAgICAvLyBJdCBzZWVtcyB0aGF0IGl0IGlzIG1vdmluZy5cbiAgICBlbGVtZW50U3R5bGUubGVmdCA9IGZpeFBvc2l0aW9uLmxlZnQgKyBvZmZzZXQubGVmdCArICdweCc7XG4gICAgZWxlbWVudFN0eWxlLnRvcCA9IGZpeFBvc2l0aW9uLnRvcCArIG9mZnNldC50b3AgKyAncHgnO1xuICB9XG5cbiAgcmV0dXJuIGZpeFBvc2l0aW9uO1xufSAvLyBbL0xFRlRUT1BdXG4vLyBbU1ZHXVxuXG4vKipcbiAqIEluaXRpYWxpemUgU1ZHRWxlbWVudCwgYW5kIGdldCBgb2Zmc2V0YCB0aGF0IGlzIHVzZWQgYnkgYG1vdmVTdmdgLlxuICogQHBhcmFtIHtwcm9wc30gcHJvcHMgLSBgcHJvcHNgIG9mIGluc3RhbmNlLlxuICogQHJldHVybnMge0JCb3h9IEN1cnJlbnQgQkJveCB3aXRob3V0IGFuaW1hdGlvbiwgaS5lLiBsZWZ0L3RvcCBwcm9wZXJ0aWVzLlxuICovXG5cblxuZnVuY3Rpb24gaW5pdFN2Zyhwcm9wcykge1xuICB2YXIgZWxlbWVudCA9IHByb3BzLmVsZW1lbnQsXG4gICAgICBzdmdUcmFuc2Zvcm0gPSBwcm9wcy5zdmdUcmFuc2Zvcm0sXG4gICAgICBjdXJSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIC8vIEdldCBSZWN0IGJlZm9yZSBjaGFuZ2UgcG9zaXRpb24uXG4gIGZpeFBvc2l0aW9uID0gZ2V0QkJveChlbGVtZW50KTtcbiAgc3ZnVHJhbnNmb3JtLnNldFRyYW5zbGF0ZSgwLCAwKTtcbiAgdmFyIG9yaWdpbkJCb3ggPSBwcm9wcy5zdmdPcmlnaW5CQm94ID0gZWxlbWVudC5nZXRCQm94KCksXG4gICAgICAvLyBUcnkgdG8gZ2V0IFNWRyBjb29yZGluYXRlcyBvZiBjdXJyZW50IHBvc2l0aW9uLlxuICBuZXdSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIG9yaWdpblBvaW50ID0gdmlld1BvaW50MlN2Z1BvaW50KHByb3BzLCBuZXdSZWN0LmxlZnQsIG5ld1JlY3QudG9wKSxcbiAgICAgIC8vIEdlY2tvIGJ1ZywgZ2V0U2NyZWVuQ1RNIHJldHVybnMgaW5jb3JyZWN0IENUTSwgYW5kIG9yaWdpblBvaW50IG1pZ2h0IG5vdCBiZSBjdXJyZW50IHBvc2l0aW9uLlxuICBvZmZzZXQgPSBwcm9wcy5zdmdPZmZzZXQgPSB7XG4gICAgeDogb3JpZ2luQkJveC54IC0gb3JpZ2luUG9pbnQueCxcbiAgICB5OiBvcmlnaW5CQm94LnkgLSBvcmlnaW5Qb2ludC55XG4gIH0sXG4gICAgICAvLyBSZXN0b3JlIHBvc2l0aW9uXG4gIGN1clBvaW50ID0gdmlld1BvaW50MlN2Z1BvaW50KHByb3BzLCBjdXJSZWN0LmxlZnQsIGN1clJlY3QudG9wKTtcbiAgc3ZnVHJhbnNmb3JtLnNldFRyYW5zbGF0ZShjdXJQb2ludC54ICsgb2Zmc2V0LnggLSBvcmlnaW5CQm94LngsIGN1clBvaW50LnkgKyBvZmZzZXQueSAtIG9yaWdpbkJCb3gueSk7XG4gIHJldHVybiBmaXhQb3NpdGlvbjtcbn0gLy8gWy9TVkddXG5cbi8qKlxuICogU2V0IGBlbGVtZW50QkJveGAsIGBjb250YWlubWVudEJCb3hgLCBgbWluL21heGBgTGVmdC9Ub3BgIGFuZCBgc25hcFRhcmdldHNgLlxuICogQHBhcmFtIHtwcm9wc30gcHJvcHMgLSBgcHJvcHNgIG9mIGluc3RhbmNlLlxuICogQHBhcmFtIHtzdHJpbmd9IFtldmVudFR5cGVdIC0gQSB0eXBlIG9mIGV2ZW50IHRoYXQga2lja2VkIHRoaXMgbWV0aG9kLlxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cblxuXG5mdW5jdGlvbiBpbml0QkJveChwcm9wcywgZXZlbnRUeXBlKSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgdmFyIGRvY0JCb3ggPSBnZXRCQm94KGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCksXG4gICAgICBlbGVtZW50QkJveCA9IHByb3BzLmVsZW1lbnRCQm94ID0gcHJvcHMuaW5pdEVsbShwcm9wcyksXG4gICAgICAvLyByZXNldCBvZmZzZXQgZXRjLlxuICBjb250YWlubWVudEJCb3ggPSBwcm9wcy5jb250YWlubWVudEJCb3ggPSBwcm9wcy5jb250YWlubWVudElzQkJveCA/IHJlc29sdmVQUEJCb3gocHJvcHMub3B0aW9ucy5jb250YWlubWVudCwgZG9jQkJveCkgfHwgZG9jQkJveCA6IGdldEJCb3gocHJvcHMub3B0aW9ucy5jb250YWlubWVudCwgdHJ1ZSk7XG4gIHByb3BzLm1pbkxlZnQgPSBjb250YWlubWVudEJCb3gubGVmdDtcbiAgcHJvcHMubWF4TGVmdCA9IGNvbnRhaW5tZW50QkJveC5yaWdodCAtIGVsZW1lbnRCQm94LndpZHRoO1xuICBwcm9wcy5taW5Ub3AgPSBjb250YWlubWVudEJCb3gudG9wO1xuICBwcm9wcy5tYXhUb3AgPSBjb250YWlubWVudEJCb3guYm90dG9tIC0gZWxlbWVudEJCb3guaGVpZ2h0OyAvLyBBZGp1c3QgcG9zaXRpb25cblxuICBtb3ZlKHByb3BzLCB7XG4gICAgbGVmdDogZWxlbWVudEJCb3gubGVmdCxcbiAgICB0b3A6IGVsZW1lbnRCQm94LnRvcFxuICB9KTsgLy8gW1NOQVBdXG4gIC8vIFNuYXAtdGFyZ2V0c1xuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBTbmFwVGFyZ2V0XG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbeF0gLSBBIGNvb3JkaW5hdGUgaXQgbW92ZXMgdG8uIEl0IGhhcyB4IG9yIHkgb3IgYm90aC5cbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFt5XVxuICAgKiBAcHJvcGVydHkge251bWJlcn0gW2dyYXZpdHlYU3RhcnRdIC0gR3Jhdml0eSB6b25lLiBJdCBoYXMgKlN0YXJ0IG9yICpFbmQgb3IgYm90aCwgYW5kICpYKiBvciAqWSogb3IgYm90aC5cbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFtncmF2aXR5WEVuZF1cbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFtncmF2aXR5WVN0YXJ0XVxuICAgKiBAcHJvcGVydHkge251bWJlcn0gW2dyYXZpdHlZRW5kXVxuICAgKi9cblxuICBpZiAocHJvcHMucGFyc2VkU25hcFRhcmdldHMpIHtcbiAgICB2YXIgZWxlbWVudFNpemVYWSA9IHtcbiAgICAgIHg6IGVsZW1lbnRCQm94LndpZHRoLFxuICAgICAgeTogZWxlbWVudEJCb3guaGVpZ2h0XG4gICAgfSxcbiAgICAgICAgbWluWFkgPSB7XG4gICAgICB4OiBwcm9wcy5taW5MZWZ0LFxuICAgICAgeTogcHJvcHMubWluVG9wXG4gICAgfSxcbiAgICAgICAgbWF4WFkgPSB7XG4gICAgICB4OiBwcm9wcy5tYXhMZWZ0LFxuICAgICAgeTogcHJvcHMubWF4VG9wXG4gICAgfSxcbiAgICAgICAgcHJvcDJBeGlzID0ge1xuICAgICAgbGVmdDogJ3gnLFxuICAgICAgcmlnaHQ6ICd4JyxcbiAgICAgIHg6ICd4JyxcbiAgICAgIHdpZHRoOiAneCcsXG4gICAgICB4U3RhcnQ6ICd4JyxcbiAgICAgIHhFbmQ6ICd4JyxcbiAgICAgIHhTdGVwOiAneCcsXG4gICAgICB0b3A6ICd5JyxcbiAgICAgIGJvdHRvbTogJ3knLFxuICAgICAgeTogJ3knLFxuICAgICAgaGVpZ2h0OiAneScsXG4gICAgICB5U3RhcnQ6ICd5JyxcbiAgICAgIHlFbmQ6ICd5JyxcbiAgICAgIHlTdGVwOiAneSdcbiAgICB9LFxuICAgICAgICBzbmFwVGFyZ2V0cyA9IHByb3BzLnBhcnNlZFNuYXBUYXJnZXRzLnJlZHVjZShmdW5jdGlvbiAoc25hcFRhcmdldHMsIHBhcnNlZFNuYXBUYXJnZXQpIHtcbiAgICAgIHZhciBiYXNlUmVjdCA9IHBhcnNlZFNuYXBUYXJnZXQuYmFzZSA9PT0gJ2NvbnRhaW5tZW50JyA/IGNvbnRhaW5tZW50QkJveCA6IGRvY0JCb3gsXG4gICAgICAgICAgYmFzZU9yaWdpblhZID0ge1xuICAgICAgICB4OiBiYXNlUmVjdC5sZWZ0LFxuICAgICAgICB5OiBiYXNlUmVjdC50b3BcbiAgICAgIH0sXG4gICAgICAgICAgYmFzZVNpemVYWSA9IHtcbiAgICAgICAgeDogYmFzZVJlY3Qud2lkdGgsXG4gICAgICAgIHk6IGJhc2VSZWN0LmhlaWdodFxuICAgICAgfTtcbiAgICAgIC8qKlxuICAgICAgICogQmFzaWNhbGx5LCBzaGFsbG93IGNvcHkgZnJvbSBwYXJzZWRTbmFwVGFyZ2V0LCBhbmQgaXQgY2FuIGhhdmUgcmVzb2x2ZWQgdmFsdWVzLlxuICAgICAgICogQHR5cGVkZWYge3t4OiAobnVtYmVyfFBQVmFsdWUpLCB5LCB4U3RhcnQsIHhFbmQsIHhTdGVwLCB5U3RhcnQsIHlFbmQsIHlTdGVwfX0gVGFyZ2V0WFlcbiAgICAgICAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IFtjb3JuZXJzXSAtIEFwcGxpZWQgdmFsdWUuXG4gICAgICAgKiBAcHJvcGVydHkge3N0cmluZ1tdfSBbc2lkZXNdXG4gICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IGNlbnRlclxuICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IFt4R3Jhdml0eV0gLSBPdmVycmlkZSBwYXJzZWRTbmFwVGFyZ2V0LmdyYXZpdHkuXG4gICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gW3lHcmF2aXR5XVxuICAgICAgICovXG4gICAgICAvLyBBZGQgc2luZ2xlIFBvaW50IG9yIExpbmUgKGkuZS4gdGFyZ2V0WFkgaGFzIG5vICpTdGVwKVxuXG4gICAgICBmdW5jdGlvbiBhZGRTbmFwVGFyZ2V0KHRhcmdldFhZKSB7XG4gICAgICAgIGlmICh0YXJnZXRYWS5jZW50ZXIgPT0gbnVsbCkge1xuICAgICAgICAgIHRhcmdldFhZLmNlbnRlciA9IHBhcnNlZFNuYXBUYXJnZXQuY2VudGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRhcmdldFhZLnhHcmF2aXR5ID09IG51bGwpIHtcbiAgICAgICAgICB0YXJnZXRYWS54R3Jhdml0eSA9IHBhcnNlZFNuYXBUYXJnZXQuZ3Jhdml0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0YXJnZXRYWS55R3Jhdml0eSA9PSBudWxsKSB7XG4gICAgICAgICAgdGFyZ2V0WFkueUdyYXZpdHkgPSBwYXJzZWRTbmFwVGFyZ2V0LmdyYXZpdHk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0WFkueCAhPSBudWxsICYmIHRhcmdldFhZLnkgIT0gbnVsbCkge1xuICAgICAgICAgIC8vIFBvaW50XG4gICAgICAgICAgdGFyZ2V0WFkueCA9IHJlc29sdmVQUFZhbHVlKHRhcmdldFhZLngsIGJhc2VPcmlnaW5YWS54LCBiYXNlU2l6ZVhZLngpO1xuICAgICAgICAgIHRhcmdldFhZLnkgPSByZXNvbHZlUFBWYWx1ZSh0YXJnZXRYWS55LCBiYXNlT3JpZ2luWFkueSwgYmFzZVNpemVYWS55KTtcblxuICAgICAgICAgIGlmICh0YXJnZXRYWS5jZW50ZXIpIHtcbiAgICAgICAgICAgIHRhcmdldFhZLnggLT0gZWxlbWVudFNpemVYWS54IC8gMjtcbiAgICAgICAgICAgIHRhcmdldFhZLnkgLT0gZWxlbWVudFNpemVYWS55IC8gMjtcbiAgICAgICAgICAgIHRhcmdldFhZLmNvcm5lcnMgPSBbJ3RsJ107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgKHRhcmdldFhZLmNvcm5lcnMgfHwgcGFyc2VkU25hcFRhcmdldC5jb3JuZXJzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb3JuZXIpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdGFyZ2V0WFkueCAtIChjb3JuZXIgPT09ICd0cicgfHwgY29ybmVyID09PSAnYnInID8gZWxlbWVudFNpemVYWS54IDogMCksXG4gICAgICAgICAgICAgICAgeSA9IHRhcmdldFhZLnkgLSAoY29ybmVyID09PSAnYmwnIHx8IGNvcm5lciA9PT0gJ2JyJyA/IGVsZW1lbnRTaXplWFkueSA6IDApO1xuXG4gICAgICAgICAgICBpZiAoeCA+PSBtaW5YWS54ICYmIHggPD0gbWF4WFkueCAmJiB5ID49IG1pblhZLnkgJiYgeSA8PSBtYXhYWS55KSB7XG4gICAgICAgICAgICAgIHZhciBzbmFwVGFyZ2V0ID0ge1xuICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICAgICAgeTogeVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgZ3Jhdml0eVhTdGFydCA9IHggLSB0YXJnZXRYWS54R3Jhdml0eSxcbiAgICAgICAgICAgICAgICAgIGdyYXZpdHlYRW5kID0geCArIHRhcmdldFhZLnhHcmF2aXR5LFxuICAgICAgICAgICAgICAgICAgZ3Jhdml0eVlTdGFydCA9IHkgLSB0YXJnZXRYWS55R3Jhdml0eSxcbiAgICAgICAgICAgICAgICAgIGdyYXZpdHlZRW5kID0geSArIHRhcmdldFhZLnlHcmF2aXR5O1xuXG4gICAgICAgICAgICAgIGlmIChncmF2aXR5WFN0YXJ0ID4gbWluWFkueCkge1xuICAgICAgICAgICAgICAgIHNuYXBUYXJnZXQuZ3Jhdml0eVhTdGFydCA9IGdyYXZpdHlYU3RhcnQ7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoZ3Jhdml0eVhFbmQgPCBtYXhYWS54KSB7XG4gICAgICAgICAgICAgICAgc25hcFRhcmdldC5ncmF2aXR5WEVuZCA9IGdyYXZpdHlYRW5kO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGdyYXZpdHlZU3RhcnQgPiBtaW5YWS55KSB7XG4gICAgICAgICAgICAgICAgc25hcFRhcmdldC5ncmF2aXR5WVN0YXJ0ID0gZ3Jhdml0eVlTdGFydDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChncmF2aXR5WUVuZCA8IG1heFhZLnkpIHtcbiAgICAgICAgICAgICAgICBzbmFwVGFyZ2V0LmdyYXZpdHlZRW5kID0gZ3Jhdml0eVlFbmQ7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBzbmFwVGFyZ2V0cy5wdXNoKHNuYXBUYXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIExpbmVcbiAgICAgICAgICB2YXIgc3BlY0F4aXMgPSB0YXJnZXRYWS54ICE9IG51bGwgPyAneCcgOiAneScsXG4gICAgICAgICAgICAgIHJhbmdlQXhpcyA9IHNwZWNBeGlzID09PSAneCcgPyAneScgOiAneCcsXG4gICAgICAgICAgICAgIHN0YXJ0UHJvcCA9IFwiXCIuY29uY2F0KHJhbmdlQXhpcywgXCJTdGFydFwiKSxcbiAgICAgICAgICAgICAgZW5kUHJvcCA9IFwiXCIuY29uY2F0KHJhbmdlQXhpcywgXCJFbmRcIiksXG4gICAgICAgICAgICAgIGdyYXZpdHlQcm9wID0gXCJcIi5jb25jYXQoc3BlY0F4aXMsIFwiR3Jhdml0eVwiKSxcbiAgICAgICAgICAgICAgc3BlY0F4aXNMID0gc3BlY0F4aXMudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgICAgcmFuZ2VBeGlzTCA9IHJhbmdlQXhpcy50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgICBncmF2aXR5U3BlY1N0YXJ0UHJvcCA9IFwiZ3Jhdml0eVwiLmNvbmNhdChzcGVjQXhpc0wsIFwiU3RhcnRcIiksXG4gICAgICAgICAgICAgIGdyYXZpdHlTcGVjRW5kUHJvcCA9IFwiZ3Jhdml0eVwiLmNvbmNhdChzcGVjQXhpc0wsIFwiRW5kXCIpLFxuICAgICAgICAgICAgICBncmF2aXR5UmFuZ2VTdGFydFByb3AgPSBcImdyYXZpdHlcIi5jb25jYXQocmFuZ2VBeGlzTCwgXCJTdGFydFwiKSxcbiAgICAgICAgICAgICAgZ3Jhdml0eVJhbmdlRW5kUHJvcCA9IFwiZ3Jhdml0eVwiLmNvbmNhdChyYW5nZUF4aXNMLCBcIkVuZFwiKTtcbiAgICAgICAgICB0YXJnZXRYWVtzcGVjQXhpc10gPSByZXNvbHZlUFBWYWx1ZSh0YXJnZXRYWVtzcGVjQXhpc10sIGJhc2VPcmlnaW5YWVtzcGVjQXhpc10sIGJhc2VTaXplWFlbc3BlY0F4aXNdKTtcbiAgICAgICAgICB0YXJnZXRYWVtzdGFydFByb3BdID0gcmVzb2x2ZVBQVmFsdWUodGFyZ2V0WFlbc3RhcnRQcm9wXSwgYmFzZU9yaWdpblhZW3JhbmdlQXhpc10sIGJhc2VTaXplWFlbcmFuZ2VBeGlzXSk7XG4gICAgICAgICAgdGFyZ2V0WFlbZW5kUHJvcF0gPSByZXNvbHZlUFBWYWx1ZSh0YXJnZXRYWVtlbmRQcm9wXSwgYmFzZU9yaWdpblhZW3JhbmdlQXhpc10sIGJhc2VTaXplWFlbcmFuZ2VBeGlzXSkgLSBlbGVtZW50U2l6ZVhZW3JhbmdlQXhpc107IC8vIFJlZHVjZSB0aGUgZW5kIG9mIHRoZSBsaW5lLlxuXG4gICAgICAgICAgaWYgKHRhcmdldFhZW3N0YXJ0UHJvcF0gPiB0YXJnZXRYWVtlbmRQcm9wXSB8fCAvLyBTbWFsbGVyIHRoYW4gZWxlbWVudCBzaXplLlxuICAgICAgICAgIHRhcmdldFhZW3N0YXJ0UHJvcF0gPiBtYXhYWVtyYW5nZUF4aXNdIHx8IHRhcmdldFhZW2VuZFByb3BdIDwgbWluWFlbcmFuZ2VBeGlzXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0YXJnZXRYWS5jZW50ZXIpIHtcbiAgICAgICAgICAgIHRhcmdldFhZW3NwZWNBeGlzXSAtPSBlbGVtZW50U2l6ZVhZW3NwZWNBeGlzXSAvIDI7XG4gICAgICAgICAgICB0YXJnZXRYWS5zaWRlcyA9IFsnc3RhcnQnXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAodGFyZ2V0WFkuc2lkZXMgfHwgcGFyc2VkU25hcFRhcmdldC5zaWRlcykuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgdmFyIHh5ID0gdGFyZ2V0WFlbc3BlY0F4aXNdIC0gKHNpZGUgPT09ICdlbmQnID8gZWxlbWVudFNpemVYWVtzcGVjQXhpc10gOiAwKTtcblxuICAgICAgICAgICAgaWYgKHh5ID49IG1pblhZW3NwZWNBeGlzXSAmJiB4eSA8PSBtYXhYWVtzcGVjQXhpc10pIHtcbiAgICAgICAgICAgICAgdmFyIHNuYXBUYXJnZXQgPSB7fSxcbiAgICAgICAgICAgICAgICAgIGdyYXZpdHlTcGVjU3RhcnQgPSB4eSAtIHRhcmdldFhZW2dyYXZpdHlQcm9wXSxcbiAgICAgICAgICAgICAgICAgIGdyYXZpdHlTcGVjRW5kID0geHkgKyB0YXJnZXRYWVtncmF2aXR5UHJvcF07XG4gICAgICAgICAgICAgIHNuYXBUYXJnZXRbc3BlY0F4aXNdID0geHk7XG5cbiAgICAgICAgICAgICAgaWYgKGdyYXZpdHlTcGVjU3RhcnQgPiBtaW5YWVtzcGVjQXhpc10pIHtcbiAgICAgICAgICAgICAgICBzbmFwVGFyZ2V0W2dyYXZpdHlTcGVjU3RhcnRQcm9wXSA9IGdyYXZpdHlTcGVjU3RhcnQ7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoZ3Jhdml0eVNwZWNFbmQgPCBtYXhYWVtzcGVjQXhpc10pIHtcbiAgICAgICAgICAgICAgICBzbmFwVGFyZ2V0W2dyYXZpdHlTcGVjRW5kUHJvcF0gPSBncmF2aXR5U3BlY0VuZDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh0YXJnZXRYWVtzdGFydFByb3BdID4gbWluWFlbcmFuZ2VBeGlzXSkge1xuICAgICAgICAgICAgICAgIHNuYXBUYXJnZXRbZ3Jhdml0eVJhbmdlU3RhcnRQcm9wXSA9IHRhcmdldFhZW3N0YXJ0UHJvcF07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAodGFyZ2V0WFlbZW5kUHJvcF0gPCBtYXhYWVtyYW5nZUF4aXNdKSB7XG4gICAgICAgICAgICAgICAgc25hcFRhcmdldFtncmF2aXR5UmFuZ2VFbmRQcm9wXSA9IHRhcmdldFhZW2VuZFByb3BdO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgc25hcFRhcmdldHMucHVzaChzbmFwVGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgYkJveDtcblxuICAgICAgaWYgKChiQm94ID0gcGFyc2VkU25hcFRhcmdldC5lbGVtZW50ID8gZ2V0QkJveChwYXJzZWRTbmFwVGFyZ2V0LmVsZW1lbnQpIDogbnVsbCkgfHwgLy8gRWxlbWVudFxuICAgICAgcGFyc2VkU25hcFRhcmdldC5wcEJCb3gpIHtcbiAgICAgICAgaWYgKHBhcnNlZFNuYXBUYXJnZXQucHBCQm94KSB7XG4gICAgICAgICAgYkJveCA9IHJlc29sdmVQUEJCb3gocGFyc2VkU25hcFRhcmdldC5wcEJCb3gsIGJhc2VSZWN0KTtcbiAgICAgICAgfSAvLyBCQm94XG5cblxuICAgICAgICBpZiAoYkJveCkge1xuICAgICAgICAgIC8vIERyb3AgaW52YWxpZCBCQm94LlxuICAgICAgICAgIC8vIEV4cGFuZCBpbnRvIDQgbGluZXMuXG4gICAgICAgICAgcGFyc2VkU25hcFRhcmdldC5lZGdlcy5mb3JFYWNoKGZ1bmN0aW9uIChlZGdlKSB7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoZW5YID0gcGFyc2VkU25hcFRhcmdldC5ncmF2aXR5LFxuICAgICAgICAgICAgICAgIGxlbmd0aGVuWSA9IHBhcnNlZFNuYXBUYXJnZXQuZ3Jhdml0eTtcblxuICAgICAgICAgICAgaWYgKGVkZ2UgPT09ICdvdXRzaWRlJykge1xuICAgICAgICAgICAgICAvLyBTbmFwIGl0IHdoZW4gYSBwYXJ0IG9mIHRoZSBlbGVtZW50IGlzIHBhcnQgb2YgdGhlIHJhbmdlLlxuICAgICAgICAgICAgICBsZW5ndGhlblggKz0gZWxlbWVudEJCb3gud2lkdGg7XG4gICAgICAgICAgICAgIGxlbmd0aGVuWSArPSBlbGVtZW50QkJveC5oZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB4U3RhcnQgPSBiQm94LmxlZnQgLSBsZW5ndGhlblgsXG4gICAgICAgICAgICAgICAgeEVuZCA9IGJCb3gucmlnaHQgKyBsZW5ndGhlblgsXG4gICAgICAgICAgICAgICAgeVN0YXJ0ID0gYkJveC50b3AgLSBsZW5ndGhlblksXG4gICAgICAgICAgICAgICAgeUVuZCA9IGJCb3guYm90dG9tICsgbGVuZ3RoZW5ZO1xuICAgICAgICAgICAgdmFyIHNpZGUgPSBlZGdlID09PSAnaW5zaWRlJyA/ICdzdGFydCcgOiAnZW5kJztcbiAgICAgICAgICAgIGFkZFNuYXBUYXJnZXQoe1xuICAgICAgICAgICAgICB4U3RhcnQ6IHhTdGFydCxcbiAgICAgICAgICAgICAgeEVuZDogeEVuZCxcbiAgICAgICAgICAgICAgeTogYkJveC50b3AsXG4gICAgICAgICAgICAgIHNpZGVzOiBbc2lkZV0sXG4gICAgICAgICAgICAgIGNlbnRlcjogZmFsc2VcbiAgICAgICAgICAgIH0pOyAvLyBUb3BcblxuICAgICAgICAgICAgYWRkU25hcFRhcmdldCh7XG4gICAgICAgICAgICAgIHg6IGJCb3gubGVmdCxcbiAgICAgICAgICAgICAgeVN0YXJ0OiB5U3RhcnQsXG4gICAgICAgICAgICAgIHlFbmQ6IHlFbmQsXG4gICAgICAgICAgICAgIHNpZGVzOiBbc2lkZV0sXG4gICAgICAgICAgICAgIGNlbnRlcjogZmFsc2VcbiAgICAgICAgICAgIH0pOyAvLyBMZWZ0XG5cbiAgICAgICAgICAgIHNpZGUgPSBlZGdlID09PSAnaW5zaWRlJyA/ICdlbmQnIDogJ3N0YXJ0JztcbiAgICAgICAgICAgIGFkZFNuYXBUYXJnZXQoe1xuICAgICAgICAgICAgICB4U3RhcnQ6IHhTdGFydCxcbiAgICAgICAgICAgICAgeEVuZDogeEVuZCxcbiAgICAgICAgICAgICAgeTogYkJveC5ib3R0b20sXG4gICAgICAgICAgICAgIHNpZGVzOiBbc2lkZV0sXG4gICAgICAgICAgICAgIGNlbnRlcjogZmFsc2VcbiAgICAgICAgICAgIH0pOyAvLyBCb3R0b21cblxuICAgICAgICAgICAgYWRkU25hcFRhcmdldCh7XG4gICAgICAgICAgICAgIHg6IGJCb3gucmlnaHQsXG4gICAgICAgICAgICAgIHlTdGFydDogeVN0YXJ0LFxuICAgICAgICAgICAgICB5RW5kOiB5RW5kLFxuICAgICAgICAgICAgICBzaWRlczogW3NpZGVdLFxuICAgICAgICAgICAgICBjZW50ZXI6IGZhbHNlXG4gICAgICAgICAgICB9KTsgLy8gUmlnaHRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGV4cGFuZGVkID0gW1sneCcsICd5JywgJ3hTdGFydCcsICd4RW5kJywgJ3hTdGVwJywgJ3lTdGFydCcsICd5RW5kJywgJ3lTdGVwJ10ucmVkdWNlKGZ1bmN0aW9uICh0YXJnZXRYWSwgcHJvcCkge1xuICAgICAgICAgIGlmIChwYXJzZWRTbmFwVGFyZ2V0W3Byb3BdKSB7XG4gICAgICAgICAgICB0YXJnZXRYWVtwcm9wXSA9IHJlc29sdmVQUFZhbHVlKHBhcnNlZFNuYXBUYXJnZXRbcHJvcF0sIHByb3AgPT09ICd4U3RlcCcgfHwgcHJvcCA9PT0gJ3lTdGVwJyA/IDAgOiBiYXNlT3JpZ2luWFlbcHJvcDJBeGlzW3Byb3BdXSwgYmFzZVNpemVYWVtwcm9wMkF4aXNbcHJvcF1dKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdGFyZ2V0WFk7XG4gICAgICAgIH0sIHt9KV07XG4gICAgICAgIFsneCcsICd5J10uZm9yRWFjaChmdW5jdGlvbiAoYXhpcykge1xuICAgICAgICAgIHZhciBzdGFydFByb3AgPSBcIlwiLmNvbmNhdChheGlzLCBcIlN0YXJ0XCIpLFxuICAgICAgICAgICAgICBlbmRQcm9wID0gXCJcIi5jb25jYXQoYXhpcywgXCJFbmRcIiksXG4gICAgICAgICAgICAgIHN0ZXBQcm9wID0gXCJcIi5jb25jYXQoYXhpcywgXCJTdGVwXCIpLFxuICAgICAgICAgICAgICBncmF2aXR5UHJvcCA9IFwiXCIuY29uY2F0KGF4aXMsIFwiR3Jhdml0eVwiKTtcbiAgICAgICAgICBleHBhbmRlZCA9IGV4cGFuZGVkLnJlZHVjZShmdW5jdGlvbiAoZXhwYW5kZWQsIHRhcmdldFhZKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnQgPSB0YXJnZXRYWVtzdGFydFByb3BdLFxuICAgICAgICAgICAgICAgIGVuZCA9IHRhcmdldFhZW2VuZFByb3BdLFxuICAgICAgICAgICAgICAgIHN0ZXAgPSB0YXJnZXRYWVtzdGVwUHJvcF07XG5cbiAgICAgICAgICAgIGlmIChzdGFydCAhPSBudWxsICYmIGVuZCAhPSBudWxsICYmIHN0YXJ0ID49IGVuZCkge1xuICAgICAgICAgICAgICByZXR1cm4gZXhwYW5kZWQ7XG4gICAgICAgICAgICB9IC8vIHN0YXJ0ID49IGVuZFxuXG5cbiAgICAgICAgICAgIGlmIChzdGVwICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgaWYgKHN0ZXAgPCAyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cGFuZGVkO1xuICAgICAgICAgICAgICB9IC8vIHN0ZXAgPj0gMnB4IC0+IEV4cGFuZCBieSBzdGVwXG5cblxuICAgICAgICAgICAgICB2YXIgZ3Jhdml0eSA9IHN0ZXAgLyAyOyAvLyBtYXhcblxuICAgICAgICAgICAgICBncmF2aXR5ID0gcGFyc2VkU25hcFRhcmdldC5ncmF2aXR5ID4gZ3Jhdml0eSA/IGdyYXZpdHkgOiBudWxsO1xuXG4gICAgICAgICAgICAgIGZvciAodmFyIGN1clZhbHVlID0gc3RhcnQ7IGN1clZhbHVlIDw9IGVuZDsgY3VyVmFsdWUgKz0gc3RlcCkge1xuICAgICAgICAgICAgICAgIHZhciBleHBhbmRlZFhZID0gT2JqZWN0LmtleXModGFyZ2V0WFkpLnJlZHVjZShmdW5jdGlvbiAoZXhwYW5kZWRYWSwgcHJvcCkge1xuICAgICAgICAgICAgICAgICAgaWYgKHByb3AgIT09IHN0YXJ0UHJvcCAmJiBwcm9wICE9PSBlbmRQcm9wICYmIHByb3AgIT09IHN0ZXBQcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkWFlbcHJvcF0gPSB0YXJnZXRYWVtwcm9wXTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4cGFuZGVkWFk7XG4gICAgICAgICAgICAgICAgfSwge30pO1xuICAgICAgICAgICAgICAgIGV4cGFuZGVkWFlbYXhpc10gPSBjdXJWYWx1ZTtcbiAgICAgICAgICAgICAgICBleHBhbmRlZFhZW2dyYXZpdHlQcm9wXSA9IGdyYXZpdHk7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWQucHVzaChleHBhbmRlZFhZKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZXhwYW5kZWQucHVzaCh0YXJnZXRYWSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBleHBhbmRlZDtcbiAgICAgICAgICB9LCBbXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBleHBhbmRlZC5mb3JFYWNoKGZ1bmN0aW9uICh0YXJnZXRYWSkge1xuICAgICAgICAgIGFkZFNuYXBUYXJnZXQodGFyZ2V0WFkpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNuYXBUYXJnZXRzO1xuICAgIH0sIFtdKTtcbiAgICBwcm9wcy5zbmFwVGFyZ2V0cyA9IHNuYXBUYXJnZXRzLmxlbmd0aCA/IHNuYXBUYXJnZXRzIDogbnVsbDtcbiAgfSAvLyBbL1NOQVBdXG4gIC8vIFtBVVRPLVNDUk9MTF1cblxuXG4gIHZhciBhdXRvU2Nyb2xsID0ge30sXG4gICAgICBhdXRvU2Nyb2xsT3B0aW9ucyA9IHByb3BzLm9wdGlvbnMuYXV0b1Njcm9sbDtcblxuICBpZiAoYXV0b1Njcm9sbE9wdGlvbnMpIHtcbiAgICBhdXRvU2Nyb2xsLmlzV2luZG93ID0gYXV0b1Njcm9sbE9wdGlvbnMudGFyZ2V0ID09PSB3aW5kb3c7XG4gICAgYXV0b1Njcm9sbC50YXJnZXQgPSBhdXRvU2Nyb2xsT3B0aW9ucy50YXJnZXQ7XG4gICAgdmFyIGRvbnRTY3JvbGwgPSBldmVudFR5cGUgPT09ICdzY3JvbGwnLFxuICAgICAgICAvLyBBdm9pZCBkdXBsaWNhdGVkIGNhbGxpbmdcbiAgICBzY3JvbGxhYmxlID0gZ2V0U2Nyb2xsYWJsZShhdXRvU2Nyb2xsT3B0aW9ucy50YXJnZXQsIGF1dG9TY3JvbGwuaXNXaW5kb3csIGRvbnRTY3JvbGwpLFxuICAgICAgICBzY3JvbGxhYmxlQkJveCA9IHZhbGlkQkJveCh7XG4gICAgICBsZWZ0OiBzY3JvbGxhYmxlLmNsaWVudFgsXG4gICAgICB0b3A6IHNjcm9sbGFibGUuY2xpZW50WSxcbiAgICAgIHdpZHRoOiBzY3JvbGxhYmxlLmNsaWVudFdpZHRoLFxuICAgICAgaGVpZ2h0OiBzY3JvbGxhYmxlLmNsaWVudEhlaWdodFxuICAgIH0pO1xuXG4gICAgaWYgKCFkb250U2Nyb2xsKSB7XG4gICAgICBhdXRvU2Nyb2xsLnNjcm9sbFdpZHRoID0gc2Nyb2xsYWJsZS5zY3JvbGxXaWR0aDtcbiAgICAgIGF1dG9TY3JvbGwuc2Nyb2xsSGVpZ2h0ID0gc2Nyb2xsYWJsZS5zY3JvbGxIZWlnaHQ7XG4gICAgfSBlbHNlIGlmIChwcm9wcy5hdXRvU2Nyb2xsKSB7XG4gICAgICBhdXRvU2Nyb2xsLnNjcm9sbFdpZHRoID0gcHJvcHMuYXV0b1Njcm9sbC5zY3JvbGxXaWR0aDtcbiAgICAgIGF1dG9TY3JvbGwuc2Nyb2xsSGVpZ2h0ID0gcHJvcHMuYXV0b1Njcm9sbC5zY3JvbGxIZWlnaHQ7XG4gICAgfVxuXG4gICAgW1snWCcsICdXaWR0aCcsICdsZWZ0JywgJ3JpZ2h0J10sIFsnWScsICdIZWlnaHQnLCAndG9wJywgJ2JvdHRvbSddXS5mb3JFYWNoKGZ1bmN0aW9uIChheGlzKSB7XG4gICAgICB2YXIgeHkgPSBheGlzWzBdLFxuICAgICAgICAgIHdoID0gYXhpc1sxXSxcbiAgICAgICAgICBiYWNrID0gYXhpc1syXSxcbiAgICAgICAgICBmb3J3YXJkID0gYXhpc1szXSxcbiAgICAgICAgICBtYXhBYnMgPSAoYXV0b1Njcm9sbFtcInNjcm9sbFwiLmNvbmNhdCh3aCldIHx8IDApIC0gc2Nyb2xsYWJsZVtcImNsaWVudFwiLmNvbmNhdCh3aCldLFxuICAgICAgICAgIG1pbiA9IGF1dG9TY3JvbGxPcHRpb25zW1wibWluXCIuY29uY2F0KHh5KV0gfHwgMDtcbiAgICAgIHZhciBtYXggPSBpc0Zpbml0ZShhdXRvU2Nyb2xsT3B0aW9uc1tcIm1heFwiLmNvbmNhdCh4eSldKSA/IGF1dG9TY3JvbGxPcHRpb25zW1wibWF4XCIuY29uY2F0KHh5KV0gOiBtYXhBYnM7XG5cbiAgICAgIGlmIChtaW4gPCBtYXggJiYgbWluIDwgbWF4QWJzKSB7XG4gICAgICAgIGlmIChtYXggPiBtYXhBYnMpIHtcbiAgICAgICAgICBtYXggPSBtYXhBYnM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGluZXMgPSBbXSxcbiAgICAgICAgICAgIGVsZW1lbnRTaXplID0gZWxlbWVudEJCb3hbd2gudG9Mb3dlckNhc2UoKV07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IGF1dG9TY3JvbGxPcHRpb25zLnNlbnNpdGl2aXR5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgLy8gbmVhciAtPiBmYXJcbiAgICAgICAgICB2YXIgc2Vuc2l0aXZpdHkgPSBhdXRvU2Nyb2xsT3B0aW9ucy5zZW5zaXRpdml0eVtpXSxcbiAgICAgICAgICAgICAgc3BlZWQgPSBhdXRvU2Nyb2xsT3B0aW9ucy5zcGVlZFtpXTsgLy8gYmFja1xuXG4gICAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICBkaXI6IC0xLFxuICAgICAgICAgICAgc3BlZWQ6IHNwZWVkLFxuICAgICAgICAgICAgcG9zaXRpb246IHNjcm9sbGFibGVCQm94W2JhY2tdICsgc2Vuc2l0aXZpdHlcbiAgICAgICAgICB9KTsgLy8gZm9yd2FyZFxuXG4gICAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICBkaXI6IDEsXG4gICAgICAgICAgICBzcGVlZDogc3BlZWQsXG4gICAgICAgICAgICBwb3NpdGlvbjogc2Nyb2xsYWJsZUJCb3hbZm9yd2FyZF0gLSBzZW5zaXRpdml0eSAtIGVsZW1lbnRTaXplXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhdXRvU2Nyb2xsW3h5LnRvTG93ZXJDYXNlKCldID0ge1xuICAgICAgICAgIG1pbjogbWluLFxuICAgICAgICAgIG1heDogbWF4LFxuICAgICAgICAgIGxpbmVzOiBsaW5lc1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJvcHMuYXV0b1Njcm9sbCA9IGF1dG9TY3JvbGwueCB8fCBhdXRvU2Nyb2xsLnkgPyBhdXRvU2Nyb2xsIDogbnVsbDsgLy8gWy9BVVRPLVNDUk9MTF1cbn1cbi8qKlxuICogQHBhcmFtIHtwcm9wc30gcHJvcHMgLSBgcHJvcHNgIG9mIGluc3RhbmNlLlxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cblxuXG5mdW5jdGlvbiBkcmFnRW5kKHByb3BzKSB7XG4gIHNjcm9sbEZyYW1lLnN0b3AoKTsgLy8gW0FVVE8tU0NST0xML11cblxuICBzZXREcmFnZ2FibGVDdXJzb3IocHJvcHMub3B0aW9ucy5oYW5kbGUsIHByb3BzLm9yZ0N1cnNvcik7XG4gIGJvZHkuc3R5bGUuY3Vyc29yID0gY3NzT3JnVmFsdWVCb2R5Q3Vyc29yO1xuXG4gIGlmIChwcm9wcy5vcHRpb25zLnpJbmRleCAhPT0gZmFsc2UpIHtcbiAgICBwcm9wcy5lbGVtZW50U3R5bGUuekluZGV4ID0gcHJvcHMub3JnWkluZGV4O1xuICB9XG5cbiAgaWYgKGNzc1Byb3BVc2VyU2VsZWN0KSB7XG4gICAgYm9keS5zdHlsZVtjc3NQcm9wVXNlclNlbGVjdF0gPSBjc3NPcmdWYWx1ZUJvZHlVc2VyU2VsZWN0O1xuICB9XG5cbiAgdmFyIGNsYXNzTGlzdCA9IG1DbGFzc0xpc3QocHJvcHMuZWxlbWVudCk7XG5cbiAgaWYgKG1vdmluZ0NsYXNzKSB7XG4gICAgY2xhc3NMaXN0LnJlbW92ZShtb3ZpbmdDbGFzcyk7XG4gIH1cblxuICBpZiAoZHJhZ2dpbmdDbGFzcykge1xuICAgIGNsYXNzTGlzdC5yZW1vdmUoZHJhZ2dpbmdDbGFzcyk7XG4gIH1cblxuICBhY3RpdmVQcm9wcyA9IG51bGw7XG4gIHBvaW50ZXJFdmVudC5jYW5jZWwoKTsgLy8gUmVzZXQgcG9pbnRlciAoYWN0aXZlUHJvcHMgbXVzdCBiZSBudWxsIGJlY2F1c2UgdGhpcyBjYWxscyBlbmRIYW5kbGVyKVxuXG4gIGlmIChwcm9wcy5vbkRyYWdFbmQpIHtcbiAgICBwcm9wcy5vbkRyYWdFbmQoe1xuICAgICAgbGVmdDogcHJvcHMuZWxlbWVudEJCb3gubGVmdCxcbiAgICAgIHRvcDogcHJvcHMuZWxlbWVudEJCb3gudG9wXG4gICAgfSk7XG4gIH1cbn1cbi8qKlxuICogQHBhcmFtIHtwcm9wc30gcHJvcHMgLSBgcHJvcHNgIG9mIGluc3RhbmNlLlxuICogQHBhcmFtIHt7Y2xpZW50WCwgY2xpZW50WX19IHBvaW50ZXJYWSAtIFRoaXMgbWlnaHQgYmUgTW91c2VFdmVudCwgVG91Y2ggb2YgVG91Y2hFdmVudCBvciBPYmplY3QuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGl0IHN0YXJ0ZWQuXG4gKi9cblxuXG5mdW5jdGlvbiBkcmFnU3RhcnQocHJvcHMsIHBvaW50ZXJYWSkge1xuICBpZiAocHJvcHMuZGlzYWJsZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAocHJvcHMub25EcmFnU3RhcnQgJiYgcHJvcHMub25EcmFnU3RhcnQocG9pbnRlclhZKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoYWN0aXZlUHJvcHMpIHtcbiAgICBkcmFnRW5kKGFjdGl2ZVByb3BzKTtcbiAgfSAvLyBhY3RpdmVJdGVtIGlzIG5vcm1hbGx5IG51bGwgYnkgcG9pbnRlckV2ZW50LmVuZC5cblxuXG4gIHNldERyYWdnaW5nQ3Vyc29yKHByb3BzLm9wdGlvbnMuaGFuZGxlKTtcbiAgYm9keS5zdHlsZS5jdXJzb3IgPSBjc3NWYWx1ZURyYWdnaW5nQ3Vyc29yIHx8IC8vIElmIGl0IGlzIGBmYWxzZWAgb3IgYCcnYFxuICB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShwcm9wcy5vcHRpb25zLmhhbmRsZSwgJycpLmN1cnNvcjtcblxuICBpZiAocHJvcHMub3B0aW9ucy56SW5kZXggIT09IGZhbHNlKSB7XG4gICAgcHJvcHMuZWxlbWVudFN0eWxlLnpJbmRleCA9IHByb3BzLm9wdGlvbnMuekluZGV4O1xuICB9XG5cbiAgaWYgKGNzc1Byb3BVc2VyU2VsZWN0KSB7XG4gICAgYm9keS5zdHlsZVtjc3NQcm9wVXNlclNlbGVjdF0gPSAnbm9uZSc7XG4gIH1cblxuICBpZiAoZHJhZ2dpbmdDbGFzcykge1xuICAgIG1DbGFzc0xpc3QocHJvcHMuZWxlbWVudCkuYWRkKGRyYWdnaW5nQ2xhc3MpO1xuICB9XG5cbiAgYWN0aXZlUHJvcHMgPSBwcm9wcztcbiAgaGFzTW92ZWQgPSBmYWxzZTtcbiAgcG9pbnRlck9mZnNldC5sZWZ0ID0gcHJvcHMuZWxlbWVudEJCb3gubGVmdCAtIChwb2ludGVyWFkuY2xpZW50WCArIHdpbmRvdy5wYWdlWE9mZnNldCk7XG4gIHBvaW50ZXJPZmZzZXQudG9wID0gcHJvcHMuZWxlbWVudEJCb3gudG9wIC0gKHBvaW50ZXJYWS5jbGllbnRZICsgd2luZG93LnBhZ2VZT2Zmc2V0KTtcbiAgcmV0dXJuIHRydWU7XG59XG4vKipcbiAqIEBwYXJhbSB7cHJvcHN9IHByb3BzIC0gYHByb3BzYCBvZiBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBuZXdPcHRpb25zIC0gTmV3IG9wdGlvbnMuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuXG5cbmZ1bmN0aW9uIF9zZXRPcHRpb25zKHByb3BzLCBuZXdPcHRpb25zKSB7XG4gIHZhciBvcHRpb25zID0gcHJvcHMub3B0aW9ucztcbiAgdmFyIG5lZWRzSW5pdEJCb3g7IC8vIGNvbnRhaW5tZW50XG5cbiAgaWYgKG5ld09wdGlvbnMuY29udGFpbm1lbnQpIHtcbiAgICB2YXIgYkJveDtcblxuICAgIGlmIChpc0VsZW1lbnQobmV3T3B0aW9ucy5jb250YWlubWVudCkpIHtcbiAgICAgIC8vIFNwZWNpZmljIGVsZW1lbnRcbiAgICAgIGlmIChuZXdPcHRpb25zLmNvbnRhaW5tZW50ICE9PSBvcHRpb25zLmNvbnRhaW5tZW50KSB7XG4gICAgICAgIG9wdGlvbnMuY29udGFpbm1lbnQgPSBuZXdPcHRpb25zLmNvbnRhaW5tZW50O1xuICAgICAgICBwcm9wcy5jb250YWlubWVudElzQkJveCA9IGZhbHNlO1xuICAgICAgICBuZWVkc0luaXRCQm94ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKChiQm94ID0gdmFsaWRQUEJCb3goY29weVRyZWUobmV3T3B0aW9ucy5jb250YWlubWVudCkpKSAmJiAvLyBiQm94XG4gICAgaGFzQ2hhbmdlZChiQm94LCBvcHRpb25zLmNvbnRhaW5tZW50KSkge1xuICAgICAgb3B0aW9ucy5jb250YWlubWVudCA9IGJCb3g7XG4gICAgICBwcm9wcy5jb250YWlubWVudElzQkJveCA9IHRydWU7XG4gICAgICBuZWVkc0luaXRCQm94ID0gdHJ1ZTtcbiAgICB9XG4gIH0gLy8gW1NOQVBdXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IFNuYXBPcHRpb25zXG4gICAqIEBwcm9wZXJ0eSB7U25hcFRhcmdldE9wdGlvbnNbXX0gdGFyZ2V0c1xuICAgKiBAcHJvcGVydHkge251bWJlcn0gW2dyYXZpdHldXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29ybmVyXVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW3NpZGVdXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2NlbnRlcl1cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtlZGdlXVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2Jhc2VdXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBTbmFwVGFyZ2V0T3B0aW9uc1xuICAgKiBAcHJvcGVydHkgeyhudW1iZXJ8c3RyaW5nKX0gW3hdIC0gcGl4ZWxzIHwgJzxuPiUnIHwge3N0YXJ0LCBlbmR9IHwge3N0ZXAsIHN0YXJ0LCBlbmR9XG4gICAqIEBwcm9wZXJ0eSB7KG51bWJlcnxzdHJpbmcpfSBbeV1cbiAgICogQHByb3BlcnR5IHsoRWxlbWVudHxPYmplY3QpfSBbYm91bmRpbmdCb3hdIC0gT2JqZWN0IGhhcyBwcm9wZXJ0aWVzIHRoYXQgYXJlIHN0cmluZyBvciBudW1iZXIgZnJvbSBQUEJCb3guXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbZ3Jhdml0eV1cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb3JuZXJdXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc2lkZV1cbiAgICogQHByb3BlcnR5IHtib29sZWFufSBbY2VudGVyXVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2VkZ2VdXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYmFzZV1cbiAgICovXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IFBhcnNlZFNuYXBUYXJnZXRcbiAgICogQHByb3BlcnR5IHtQUFZhbHVlfSBbeF0gLSAoaW5wdXQ6IHBpeGVscyB8ICc8bj4lJylcbiAgICogQHByb3BlcnR5IHtQUFZhbHVlfSBbeV1cbiAgICogQHByb3BlcnR5IHtQUFZhbHVlfSBbeFN0YXJ0XSAtIChpbnB1dDoge3N0YXJ0LCBlbmR9IHwge3N0ZXAsIHN0YXJ0LCBlbmR9KVxuICAgKiBAcHJvcGVydHkge1BQVmFsdWV9IFt4RW5kXVxuICAgKiBAcHJvcGVydHkge1BQVmFsdWV9IFt4U3RlcF0gLSAoaW5wdXQ6IHtzdGVwLCBzdGFydCwgZW5kfSlcbiAgICogQHByb3BlcnR5IHtQUFZhbHVlfSBbeVN0YXJ0XVxuICAgKiBAcHJvcGVydHkge1BQVmFsdWV9IFt5RW5kXVxuICAgKiBAcHJvcGVydHkge1BQVmFsdWV9IFt5U3RlcF1cbiAgICogQHByb3BlcnR5IHtFbGVtZW50fSBbZWxlbWVudF1cbiAgICogQHByb3BlcnR5IHtQUEJCb3h9IFtwcEJCb3hdXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBncmF2aXR5XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGNvcm5lcnNcbiAgICogQHByb3BlcnR5IHtzdHJpbmdbXX0gc2lkZXNcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBjZW50ZXJcbiAgICogQHByb3BlcnR5IHtzdHJpbmdbXX0gZWRnZXNcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGJhc2VcbiAgICovXG4gIC8vIE5vcm1hbGl6ZSBgZ3Jhdml0eWAsIGBjb3JuZXJgLCBgc2lkZWAsIGBjZW50ZXJgLCBgZWRnZWAsIGBiYXNlYFxuXG5cbiAgZnVuY3Rpb24gY29tbW9uU25hcE9wdGlvbnMob3B0aW9ucywgbmV3T3B0aW9ucykge1xuICAgIGZ1bmN0aW9uIGNsZWFuU3RyaW5nKGluU3RyaW5nKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIGluU3RyaW5nID09PSAnc3RyaW5nJyA/IGluU3RyaW5nLnJlcGxhY2UoL1ssIF0rL2csICcgJykudHJpbSgpLnRvTG93ZXJDYXNlKCkgOiBudWxsO1xuICAgIH0gLy8gZ3Jhdml0eVxuXG5cbiAgICBpZiAoaXNGaW5pdGUobmV3T3B0aW9ucy5ncmF2aXR5KSAmJiBuZXdPcHRpb25zLmdyYXZpdHkgPiAwKSB7XG4gICAgICBvcHRpb25zLmdyYXZpdHkgPSBuZXdPcHRpb25zLmdyYXZpdHk7XG4gICAgfSAvLyBjb3JuZXJcblxuXG4gICAgdmFyIGNvcm5lciA9IGNsZWFuU3RyaW5nKG5ld09wdGlvbnMuY29ybmVyKTtcblxuICAgIGlmIChjb3JuZXIpIHtcbiAgICAgIGlmIChjb3JuZXIgIT09ICdhbGwnKSB7XG4gICAgICAgIHZhciBhZGRlZCA9IHt9LFxuICAgICAgICAgICAgY29ybmVycyA9IGNvcm5lci5zcGxpdCgvXFxzLykucmVkdWNlKGZ1bmN0aW9uIChjb3JuZXJzLCBjb3JuZXIpIHtcbiAgICAgICAgICBjb3JuZXIgPSBjb3JuZXIudHJpbSgpLnJlcGxhY2UoL14oLikuKj8tKC4pLiokLywgJyQxJDInKTtcblxuICAgICAgICAgIGlmICgoY29ybmVyID0gY29ybmVyID09PSAndGwnIHx8IGNvcm5lciA9PT0gJ2x0JyA/ICd0bCcgOiBjb3JuZXIgPT09ICd0cicgfHwgY29ybmVyID09PSAncnQnID8gJ3RyJyA6IGNvcm5lciA9PT0gJ2JsJyB8fCBjb3JuZXIgPT09ICdsYicgPyAnYmwnIDogY29ybmVyID09PSAnYnInIHx8IGNvcm5lciA9PT0gJ3JiJyA/ICdicicgOiBudWxsKSAmJiAhYWRkZWRbY29ybmVyXSkge1xuICAgICAgICAgICAgY29ybmVycy5wdXNoKGNvcm5lcik7XG4gICAgICAgICAgICBhZGRlZFtjb3JuZXJdID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gY29ybmVycztcbiAgICAgICAgfSwgW10pLFxuICAgICAgICAgICAgY29ybmVyc0xlbiA9IGNvcm5lcnMubGVuZ3RoO1xuICAgICAgICBjb3JuZXIgPSAhY29ybmVyc0xlbiA/IG51bGwgOiBjb3JuZXJzTGVuID09PSA0ID8gJ2FsbCcgOiBjb3JuZXJzLmpvaW4oJyAnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvcm5lcikge1xuICAgICAgICBvcHRpb25zLmNvcm5lciA9IGNvcm5lcjtcbiAgICAgIH1cbiAgICB9IC8vIHNpZGVcblxuXG4gICAgdmFyIHNpZGUgPSBjbGVhblN0cmluZyhuZXdPcHRpb25zLnNpZGUpO1xuXG4gICAgaWYgKHNpZGUpIHtcbiAgICAgIGlmIChzaWRlID09PSAnc3RhcnQnIHx8IHNpZGUgPT09ICdlbmQnIHx8IHNpZGUgPT09ICdib3RoJykge1xuICAgICAgICBvcHRpb25zLnNpZGUgPSBzaWRlO1xuICAgICAgfSBlbHNlIGlmIChzaWRlID09PSAnc3RhcnQgZW5kJyB8fCBzaWRlID09PSAnZW5kIHN0YXJ0Jykge1xuICAgICAgICBvcHRpb25zLnNpZGUgPSAnYm90aCc7XG4gICAgICB9XG4gICAgfSAvLyBjZW50ZXJcblxuXG4gICAgaWYgKHR5cGVvZiBuZXdPcHRpb25zLmNlbnRlciA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBvcHRpb25zLmNlbnRlciA9IG5ld09wdGlvbnMuY2VudGVyO1xuICAgIH0gLy8gZWRnZVxuXG5cbiAgICB2YXIgZWRnZSA9IGNsZWFuU3RyaW5nKG5ld09wdGlvbnMuZWRnZSk7XG5cbiAgICBpZiAoZWRnZSkge1xuICAgICAgaWYgKGVkZ2UgPT09ICdpbnNpZGUnIHx8IGVkZ2UgPT09ICdvdXRzaWRlJyB8fCBlZGdlID09PSAnYm90aCcpIHtcbiAgICAgICAgb3B0aW9ucy5lZGdlID0gZWRnZTtcbiAgICAgIH0gZWxzZSBpZiAoZWRnZSA9PT0gJ2luc2lkZSBvdXRzaWRlJyB8fCBlZGdlID09PSAnb3V0c2lkZSBpbnNpZGUnKSB7XG4gICAgICAgIG9wdGlvbnMuZWRnZSA9ICdib3RoJztcbiAgICAgIH1cbiAgICB9IC8vIGJhc2VcblxuXG4gICAgdmFyIGJhc2UgPSB0eXBlb2YgbmV3T3B0aW9ucy5iYXNlID09PSAnc3RyaW5nJyA/IG5ld09wdGlvbnMuYmFzZS50cmltKCkudG9Mb3dlckNhc2UoKSA6IG51bGw7XG5cbiAgICBpZiAoYmFzZSAmJiAoYmFzZSA9PT0gJ2NvbnRhaW5tZW50JyB8fCBiYXNlID09PSAnZG9jdW1lbnQnKSkge1xuICAgICAgb3B0aW9ucy5iYXNlID0gYmFzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfSAvLyBzbmFwXG5cblxuICBpZiAobmV3T3B0aW9ucy5zbmFwICE9IG51bGwpIHtcbiAgICB2YXIgbmV3U25hcE9wdGlvbnMgPSBpc09iamVjdChuZXdPcHRpb25zLnNuYXApICYmIG5ld09wdGlvbnMuc25hcC50YXJnZXRzICE9IG51bGwgPyBuZXdPcHRpb25zLnNuYXAgOiB7XG4gICAgICB0YXJnZXRzOiBuZXdPcHRpb25zLnNuYXBcbiAgICB9LFxuICAgICAgICBzbmFwVGFyZ2V0c09wdGlvbnMgPSBbXSxcbiAgICAgICAgc25hcE9wdGlvbnMgPSBjb21tb25TbmFwT3B0aW9ucyh7XG4gICAgICB0YXJnZXRzOiBzbmFwVGFyZ2V0c09wdGlvbnNcbiAgICB9LCBuZXdTbmFwT3B0aW9ucyk7IC8vIFNldCBkZWZhdWx0IG9wdGlvbnMgaW50byB0b3AgbGV2ZWwuXG5cbiAgICBpZiAoIXNuYXBPcHRpb25zLmdyYXZpdHkpIHtcbiAgICAgIHNuYXBPcHRpb25zLmdyYXZpdHkgPSBTTkFQX0dSQVZJVFk7XG4gICAgfVxuXG4gICAgaWYgKCFzbmFwT3B0aW9ucy5jb3JuZXIpIHtcbiAgICAgIHNuYXBPcHRpb25zLmNvcm5lciA9IFNOQVBfQ09STkVSO1xuICAgIH1cblxuICAgIGlmICghc25hcE9wdGlvbnMuc2lkZSkge1xuICAgICAgc25hcE9wdGlvbnMuc2lkZSA9IFNOQVBfU0lERTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNuYXBPcHRpb25zLmNlbnRlciAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBzbmFwT3B0aW9ucy5jZW50ZXIgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXNuYXBPcHRpb25zLmVkZ2UpIHtcbiAgICAgIHNuYXBPcHRpb25zLmVkZ2UgPSBTTkFQX0VER0U7XG4gICAgfVxuXG4gICAgaWYgKCFzbmFwT3B0aW9ucy5iYXNlKSB7XG4gICAgICBzbmFwT3B0aW9ucy5iYXNlID0gU05BUF9CQVNFO1xuICAgIH1cblxuICAgIHZhciBwYXJzZWRTbmFwVGFyZ2V0cyA9IChBcnJheS5pc0FycmF5KG5ld1NuYXBPcHRpb25zLnRhcmdldHMpID8gbmV3U25hcE9wdGlvbnMudGFyZ2V0cyA6IFtuZXdTbmFwT3B0aW9ucy50YXJnZXRzXSkucmVkdWNlKGZ1bmN0aW9uIChwYXJzZWRTbmFwVGFyZ2V0cywgdGFyZ2V0KSB7XG4gICAgICBpZiAodGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlZFNuYXBUYXJnZXRzO1xuICAgICAgfVxuXG4gICAgICB2YXIgaXNFbGVtZW50UHJlID0gaXNFbGVtZW50KHRhcmdldCksXG4gICAgICAgICAgLy8gUHJlLWNoZWNrIGRpcmVjdCB2YWx1ZVxuICAgICAgcHBCQm94UHJlID0gdmFsaWRQUEJCb3goY29weVRyZWUodGFyZ2V0KSksXG4gICAgICAgICAgLy8gUHJlLWNoZWNrIGRpcmVjdCB2YWx1ZVxuICAgICAgbmV3U25hcFRhcmdldE9wdGlvbnMgPSBpc0VsZW1lbnRQcmUgfHwgcHBCQm94UHJlID8ge1xuICAgICAgICBib3VuZGluZ0JveDogdGFyZ2V0XG4gICAgICB9IDogLy8gRGlyZWN0IEVsZW1lbnQgfCBQUEJCb3hcbiAgICAgIGlzT2JqZWN0KHRhcmdldCkgJiYgdGFyZ2V0LnN0YXJ0ID09IG51bGwgJiYgdGFyZ2V0LmVuZCA9PSBudWxsICYmIHRhcmdldC5zdGVwID09IG51bGwgPyB0YXJnZXQgOiAvLyBTbmFwVGFyZ2V0T3B0aW9uc1xuICAgICAge1xuICAgICAgICB4OiB0YXJnZXQsXG4gICAgICAgIHk6IHRhcmdldFxuICAgICAgfSxcbiAgICAgICAgICAvLyBPdGhlcnMsIGl0IG1pZ2h0IGJlIHtzdGVwLCBzdGFydCwgZW5kfVxuICAgICAgZXhwYW5kZWRQYXJzZWRTbmFwVGFyZ2V0cyA9IFtdLFxuICAgICAgICAgIHNuYXBUYXJnZXRPcHRpb25zID0ge30sXG4gICAgICAgICAgbmV3T3B0aW9uc0JCb3ggPSBuZXdTbmFwVGFyZ2V0T3B0aW9ucy5ib3VuZGluZ0JveDtcbiAgICAgIHZhciBwcEJCb3g7XG5cbiAgICAgIGlmIChpc0VsZW1lbnRQcmUgfHwgaXNFbGVtZW50KG5ld09wdGlvbnNCQm94KSkge1xuICAgICAgICAvLyBFbGVtZW50XG4gICAgICAgIGV4cGFuZGVkUGFyc2VkU25hcFRhcmdldHMucHVzaCh7XG4gICAgICAgICAgZWxlbWVudDogbmV3T3B0aW9uc0JCb3hcbiAgICAgICAgfSk7XG4gICAgICAgIHNuYXBUYXJnZXRPcHRpb25zLmJvdW5kaW5nQm94ID0gbmV3T3B0aW9uc0JCb3g7XG4gICAgICB9IGVsc2UgaWYgKHBwQkJveCA9IHBwQkJveFByZSB8fCB2YWxpZFBQQkJveChjb3B5VHJlZShuZXdPcHRpb25zQkJveCkpKSB7XG4gICAgICAgIC8vIE9iamVjdCAtPiBQUEJCb3hcbiAgICAgICAgZXhwYW5kZWRQYXJzZWRTbmFwVGFyZ2V0cy5wdXNoKHtcbiAgICAgICAgICBwcEJCb3g6IHBwQkJveFxuICAgICAgICB9KTtcbiAgICAgICAgc25hcFRhcmdldE9wdGlvbnMuYm91bmRpbmdCb3ggPSBwcEJCb3gyT3B0aW9uT2JqZWN0KHBwQkJveCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaW52YWxpZDsgLy8gYHRydWVgIGlmIHZhbGlkIFBQVmFsdWUgd2FzIGdpdmVuIGJ1dCB0aGUgY29udGFpbmVkIHZhbHVlIGlzIGludmFsaWQuXG5cbiAgICAgICAgdmFyIHBhcnNlZFhZID0gWyd4JywgJ3knXS5yZWR1Y2UoZnVuY3Rpb24gKHBhcnNlZFhZLCBheGlzKSB7XG4gICAgICAgICAgdmFyIG5ld09wdGlvbnNYWSA9IG5ld1NuYXBUYXJnZXRPcHRpb25zW2F4aXNdO1xuICAgICAgICAgIHZhciBwcFZhbHVlO1xuXG4gICAgICAgICAgaWYgKHBwVmFsdWUgPSB2YWxpZFBQVmFsdWUobmV3T3B0aW9uc1hZKSkge1xuICAgICAgICAgICAgLy8gcGl4ZWxzIHwgJzxuPiUnXG4gICAgICAgICAgICBwYXJzZWRYWVtheGlzXSA9IHBwVmFsdWU7XG4gICAgICAgICAgICBzbmFwVGFyZ2V0T3B0aW9uc1theGlzXSA9IHBwVmFsdWUyT3B0aW9uVmFsdWUocHBWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHtzdGFydCwgZW5kfSB8IHtzdGVwLCBzdGFydCwgZW5kfVxuICAgICAgICAgICAgdmFyIHN0YXJ0LCBlbmQsIHN0ZXA7XG5cbiAgICAgICAgICAgIGlmIChpc09iamVjdChuZXdPcHRpb25zWFkpKSB7XG4gICAgICAgICAgICAgIHN0YXJ0ID0gdmFsaWRQUFZhbHVlKG5ld09wdGlvbnNYWS5zdGFydCk7XG4gICAgICAgICAgICAgIGVuZCA9IHZhbGlkUFBWYWx1ZShuZXdPcHRpb25zWFkuZW5kKTtcbiAgICAgICAgICAgICAgc3RlcCA9IHZhbGlkUFBWYWx1ZShuZXdPcHRpb25zWFkuc3RlcCk7XG5cbiAgICAgICAgICAgICAgaWYgKHN0YXJ0ICYmIGVuZCAmJiBzdGFydC5pc1JhdGlvID09PSBlbmQuaXNSYXRpbyAmJiBzdGFydC52YWx1ZSA+PSBlbmQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvLyBzdGFydCA+PSBlbmRcbiAgICAgICAgICAgICAgICBpbnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGFydCA9IHBhcnNlZFhZW1wiXCIuY29uY2F0KGF4aXMsIFwiU3RhcnRcIildID0gc3RhcnQgfHwge1xuICAgICAgICAgICAgICB2YWx1ZTogMCxcbiAgICAgICAgICAgICAgaXNSYXRpbzogZmFsc2VcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBlbmQgPSBwYXJzZWRYWVtcIlwiLmNvbmNhdChheGlzLCBcIkVuZFwiKV0gPSBlbmQgfHwge1xuICAgICAgICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgICAgICAgaXNSYXRpbzogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNuYXBUYXJnZXRPcHRpb25zW2F4aXNdID0ge1xuICAgICAgICAgICAgICBzdGFydDogcHBWYWx1ZTJPcHRpb25WYWx1ZShzdGFydCksXG4gICAgICAgICAgICAgIGVuZDogcHBWYWx1ZTJPcHRpb25WYWx1ZShlbmQpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoc3RlcCkge1xuICAgICAgICAgICAgICBpZiAoc3RlcC5pc1JhdGlvID8gc3RlcC52YWx1ZSA+IDAgOiBzdGVwLnZhbHVlID49IDIpIHtcbiAgICAgICAgICAgICAgICAvLyBzdGVwID4gMCUgfHwgc3RlcCA+PSAycHhcbiAgICAgICAgICAgICAgICBwYXJzZWRYWVtcIlwiLmNvbmNhdChheGlzLCBcIlN0ZXBcIildID0gc3RlcDtcbiAgICAgICAgICAgICAgICBzbmFwVGFyZ2V0T3B0aW9uc1theGlzXS5zdGVwID0gcHBWYWx1ZTJPcHRpb25WYWx1ZShzdGVwKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXJzZWRYWTtcbiAgICAgICAgfSwge30pO1xuXG4gICAgICAgIGlmIChpbnZhbGlkKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlZFNuYXBUYXJnZXRzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcnNlZFhZLnhTdGFydCAmJiAhcGFyc2VkWFkueFN0ZXAgJiYgcGFyc2VkWFkueVN0YXJ0ICYmICFwYXJzZWRYWS55U3RlcCkge1xuICAgICAgICAgIC8vIEV4cGFuZCBpbnRvIDQgbGluZXMuIFRoaXMgaXMgbm90IEJCb3gsIGFuZCBgZWRnZWAgaXMgaWdub3JlZC5cbiAgICAgICAgICBleHBhbmRlZFBhcnNlZFNuYXBUYXJnZXRzLnB1c2goe1xuICAgICAgICAgICAgeFN0YXJ0OiBwYXJzZWRYWS54U3RhcnQsXG4gICAgICAgICAgICB4RW5kOiBwYXJzZWRYWS54RW5kLFxuICAgICAgICAgICAgeTogcGFyc2VkWFkueVN0YXJ0XG4gICAgICAgICAgfSwgLy8gVG9wXG4gICAgICAgICAge1xuICAgICAgICAgICAgeFN0YXJ0OiBwYXJzZWRYWS54U3RhcnQsXG4gICAgICAgICAgICB4RW5kOiBwYXJzZWRYWS54RW5kLFxuICAgICAgICAgICAgeTogcGFyc2VkWFkueUVuZFxuICAgICAgICAgIH0sIC8vIEJvdHRvbVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHg6IHBhcnNlZFhZLnhTdGFydCxcbiAgICAgICAgICAgIHlTdGFydDogcGFyc2VkWFkueVN0YXJ0LFxuICAgICAgICAgICAgeUVuZDogcGFyc2VkWFkueUVuZFxuICAgICAgICAgIH0sIC8vIExlZnRcbiAgICAgICAgICB7XG4gICAgICAgICAgICB4OiBwYXJzZWRYWS54RW5kLFxuICAgICAgICAgICAgeVN0YXJ0OiBwYXJzZWRYWS55U3RhcnQsXG4gICAgICAgICAgICB5RW5kOiBwYXJzZWRYWS55RW5kXG4gICAgICAgICAgfSAvLyBSaWdodFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhwYW5kZWRQYXJzZWRTbmFwVGFyZ2V0cy5wdXNoKHBhcnNlZFhZKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZXhwYW5kZWRQYXJzZWRTbmFwVGFyZ2V0cy5sZW5ndGgpIHtcbiAgICAgICAgc25hcFRhcmdldHNPcHRpb25zLnB1c2goY29tbW9uU25hcE9wdGlvbnMoc25hcFRhcmdldE9wdGlvbnMsIG5ld1NuYXBUYXJnZXRPcHRpb25zKSk7IC8vIENvcHkgY29tbW9uIFNuYXBPcHRpb25zXG5cbiAgICAgICAgdmFyIGNvcm5lciA9IHNuYXBUYXJnZXRPcHRpb25zLmNvcm5lciB8fCBzbmFwT3B0aW9ucy5jb3JuZXIsXG4gICAgICAgICAgICBzaWRlID0gc25hcFRhcmdldE9wdGlvbnMuc2lkZSB8fCBzbmFwT3B0aW9ucy5zaWRlLFxuICAgICAgICAgICAgZWRnZSA9IHNuYXBUYXJnZXRPcHRpb25zLmVkZ2UgfHwgc25hcE9wdGlvbnMuZWRnZSxcbiAgICAgICAgICAgIGNvbW1vbk9wdGlvbnMgPSB7XG4gICAgICAgICAgZ3Jhdml0eTogc25hcFRhcmdldE9wdGlvbnMuZ3Jhdml0eSB8fCBzbmFwT3B0aW9ucy5ncmF2aXR5LFxuICAgICAgICAgIGJhc2U6IHNuYXBUYXJnZXRPcHRpb25zLmJhc2UgfHwgc25hcE9wdGlvbnMuYmFzZSxcbiAgICAgICAgICBjZW50ZXI6IHR5cGVvZiBzbmFwVGFyZ2V0T3B0aW9ucy5jZW50ZXIgPT09ICdib29sZWFuJyA/IHNuYXBUYXJnZXRPcHRpb25zLmNlbnRlciA6IHNuYXBPcHRpb25zLmNlbnRlcixcbiAgICAgICAgICBjb3JuZXJzOiBjb3JuZXIgPT09ICdhbGwnID8gU05BUF9BTExfQ09STkVSUyA6IGNvcm5lci5zcGxpdCgnICcpLFxuICAgICAgICAgIC8vIFNwbGl0XG4gICAgICAgICAgc2lkZXM6IHNpZGUgPT09ICdib3RoJyA/IFNOQVBfQUxMX1NJREVTIDogW3NpZGVdLFxuICAgICAgICAgIC8vIFNwbGl0XG4gICAgICAgICAgZWRnZXM6IGVkZ2UgPT09ICdib3RoJyA/IFNOQVBfQUxMX0VER0VTIDogW2VkZ2VdIC8vIFNwbGl0XG5cbiAgICAgICAgfTtcbiAgICAgICAgZXhwYW5kZWRQYXJzZWRTbmFwVGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJzZWRTbmFwVGFyZ2V0KSB7XG4gICAgICAgICAgLy8gU2V0IGNvbW1vbiBTbmFwT3B0aW9uc1xuICAgICAgICAgIFsnZ3Jhdml0eScsICdjb3JuZXJzJywgJ3NpZGVzJywgJ2NlbnRlcicsICdlZGdlcycsICdiYXNlJ10uZm9yRWFjaChmdW5jdGlvbiAob3B0aW9uKSB7XG4gICAgICAgICAgICBwYXJzZWRTbmFwVGFyZ2V0W29wdGlvbl0gPSBjb21tb25PcHRpb25zW29wdGlvbl07XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcGFyc2VkU25hcFRhcmdldHMucHVzaChwYXJzZWRTbmFwVGFyZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJzZWRTbmFwVGFyZ2V0cztcbiAgICB9LCBbXSk7XG5cbiAgICBpZiAocGFyc2VkU25hcFRhcmdldHMubGVuZ3RoKSB7XG4gICAgICBvcHRpb25zLnNuYXAgPSBzbmFwT3B0aW9uczsgLy8gVXBkYXRlIGFsd2F5c1xuXG4gICAgICBpZiAoaGFzQ2hhbmdlZChwYXJzZWRTbmFwVGFyZ2V0cywgcHJvcHMucGFyc2VkU25hcFRhcmdldHMpKSB7XG4gICAgICAgIHByb3BzLnBhcnNlZFNuYXBUYXJnZXRzID0gcGFyc2VkU25hcFRhcmdldHM7XG4gICAgICAgIG5lZWRzSW5pdEJCb3ggPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChuZXdPcHRpb25zLmhhc093blByb3BlcnR5KCdzbmFwJykgJiYgcHJvcHMucGFyc2VkU25hcFRhcmdldHMpIHtcbiAgICBvcHRpb25zLnNuYXAgPSBwcm9wcy5wYXJzZWRTbmFwVGFyZ2V0cyA9IHByb3BzLnNuYXBUYXJnZXRzID0gdm9pZCAwO1xuICB9IC8vIFsvU05BUF1cbiAgLy8gW0FVVE8tU0NST0xMXVxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBBdXRvU2Nyb2xsT3B0aW9uc1xuICAgKiBAcHJvcGVydHkgeyhFbGVtZW50fFdpbmRvdyl9IHRhcmdldFxuICAgKiBAcHJvcGVydHkge0FycmF5fSBzcGVlZFxuICAgKiBAcHJvcGVydHkge0FycmF5fSBzZW5zaXRpdml0eVxuICAgKiBAcHJvcGVydHkge251bWJlcn0gW21pblhdXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4WF1cbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFttaW5ZXVxuICAgKiBAcHJvcGVydHkge251bWJlcn0gW21heFldXG4gICAqL1xuICAvLyBhdXRvU2Nyb2xsXG5cblxuICBpZiAobmV3T3B0aW9ucy5hdXRvU2Nyb2xsKSB7XG4gICAgdmFyIG5ld0F1dG9TY3JvbGxPcHRpb25zID0gaXNPYmplY3QobmV3T3B0aW9ucy5hdXRvU2Nyb2xsKSA/IG5ld09wdGlvbnMuYXV0b1Njcm9sbCA6IHtcbiAgICAgIHRhcmdldDogbmV3T3B0aW9ucy5hdXRvU2Nyb2xsID09PSB0cnVlID8gd2luZG93IDogbmV3T3B0aW9ucy5hdXRvU2Nyb2xsXG4gICAgfSxcbiAgICAgICAgYXV0b1Njcm9sbE9wdGlvbnMgPSB7fTsgLy8gdGFyZ2V0XG5cbiAgICBhdXRvU2Nyb2xsT3B0aW9ucy50YXJnZXQgPSBpc0VsZW1lbnQobmV3QXV0b1Njcm9sbE9wdGlvbnMudGFyZ2V0KSA/IG5ld0F1dG9TY3JvbGxPcHRpb25zLnRhcmdldCA6IHdpbmRvdzsgLy8gc3BlZWRcblxuICAgIGF1dG9TY3JvbGxPcHRpb25zLnNwZWVkID0gW107XG4gICAgKEFycmF5LmlzQXJyYXkobmV3QXV0b1Njcm9sbE9wdGlvbnMuc3BlZWQpID8gbmV3QXV0b1Njcm9sbE9wdGlvbnMuc3BlZWQgOiBbbmV3QXV0b1Njcm9sbE9wdGlvbnMuc3BlZWRdKS5ldmVyeShmdW5jdGlvbiAoc3BlZWQsIGkpIHtcbiAgICAgIGlmIChpIDw9IDIgJiYgaXNGaW5pdGUoc3BlZWQpKSB7XG4gICAgICAgIGF1dG9TY3JvbGxPcHRpb25zLnNwZWVkW2ldID0gc3BlZWQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cbiAgICBpZiAoIWF1dG9TY3JvbGxPcHRpb25zLnNwZWVkLmxlbmd0aCkge1xuICAgICAgYXV0b1Njcm9sbE9wdGlvbnMuc3BlZWQgPSBBVVRPU0NST0xMX1NQRUVEO1xuICAgIH0gLy8gc2Vuc2l0aXZpdHlcblxuXG4gICAgdmFyIG5ld1NlbnNpdGl2aXR5ID0gQXJyYXkuaXNBcnJheShuZXdBdXRvU2Nyb2xsT3B0aW9ucy5zZW5zaXRpdml0eSkgPyBuZXdBdXRvU2Nyb2xsT3B0aW9ucy5zZW5zaXRpdml0eSA6IFtuZXdBdXRvU2Nyb2xsT3B0aW9ucy5zZW5zaXRpdml0eV07XG4gICAgYXV0b1Njcm9sbE9wdGlvbnMuc2Vuc2l0aXZpdHkgPSBhdXRvU2Nyb2xsT3B0aW9ucy5zcGVlZC5tYXAoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgIHJldHVybiBpc0Zpbml0ZShuZXdTZW5zaXRpdml0eVtpXSkgPyBuZXdTZW5zaXRpdml0eVtpXSA6IEFVVE9TQ1JPTExfU0VOU0lUSVZJVFlbaV07XG4gICAgfSk7IC8vIG1pbiosIG1heCpcblxuICAgIFsnWCcsICdZJ10uZm9yRWFjaChmdW5jdGlvbiAob3B0aW9uKSB7XG4gICAgICB2YXIgb3B0aW9uTWluID0gXCJtaW5cIi5jb25jYXQob3B0aW9uKSxcbiAgICAgICAgICBvcHRpb25NYXggPSBcIm1heFwiLmNvbmNhdChvcHRpb24pO1xuXG4gICAgICBpZiAoaXNGaW5pdGUobmV3QXV0b1Njcm9sbE9wdGlvbnNbb3B0aW9uTWluXSkgJiYgbmV3QXV0b1Njcm9sbE9wdGlvbnNbb3B0aW9uTWluXSA+PSAwKSB7XG4gICAgICAgIGF1dG9TY3JvbGxPcHRpb25zW29wdGlvbk1pbl0gPSBuZXdBdXRvU2Nyb2xsT3B0aW9uc1tvcHRpb25NaW5dO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNGaW5pdGUobmV3QXV0b1Njcm9sbE9wdGlvbnNbb3B0aW9uTWF4XSkgJiYgbmV3QXV0b1Njcm9sbE9wdGlvbnNbb3B0aW9uTWF4XSA+PSAwICYmICghYXV0b1Njcm9sbE9wdGlvbnNbb3B0aW9uTWluXSB8fCBuZXdBdXRvU2Nyb2xsT3B0aW9uc1tvcHRpb25NYXhdID49IGF1dG9TY3JvbGxPcHRpb25zW29wdGlvbk1pbl0pKSB7XG4gICAgICAgIGF1dG9TY3JvbGxPcHRpb25zW29wdGlvbk1heF0gPSBuZXdBdXRvU2Nyb2xsT3B0aW9uc1tvcHRpb25NYXhdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGhhc0NoYW5nZWQoYXV0b1Njcm9sbE9wdGlvbnMsIG9wdGlvbnMuYXV0b1Njcm9sbCkpIHtcbiAgICAgIG9wdGlvbnMuYXV0b1Njcm9sbCA9IGF1dG9TY3JvbGxPcHRpb25zO1xuICAgICAgbmVlZHNJbml0QkJveCA9IHRydWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKG5ld09wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2F1dG9TY3JvbGwnKSkge1xuICAgIGlmIChvcHRpb25zLmF1dG9TY3JvbGwpIHtcbiAgICAgIG5lZWRzSW5pdEJCb3ggPSB0cnVlO1xuICAgIH1cblxuICAgIG9wdGlvbnMuYXV0b1Njcm9sbCA9IHZvaWQgMDtcbiAgfSAvLyBbL0FVVE8tU0NST0xMXVxuXG5cbiAgaWYgKG5lZWRzSW5pdEJCb3gpIHtcbiAgICBpbml0QkJveChwcm9wcyk7XG4gIH0gLy8gaGFuZGxlXG5cblxuICBpZiAoaXNFbGVtZW50KG5ld09wdGlvbnMuaGFuZGxlKSAmJiBuZXdPcHRpb25zLmhhbmRsZSAhPT0gb3B0aW9ucy5oYW5kbGUpIHtcbiAgICBpZiAob3B0aW9ucy5oYW5kbGUpIHtcbiAgICAgIC8vIFJlc3RvcmVcbiAgICAgIG9wdGlvbnMuaGFuZGxlLnN0eWxlLmN1cnNvciA9IHByb3BzLm9yZ0N1cnNvcjtcblxuICAgICAgaWYgKGNzc1Byb3BVc2VyU2VsZWN0KSB7XG4gICAgICAgIG9wdGlvbnMuaGFuZGxlLnN0eWxlW2Nzc1Byb3BVc2VyU2VsZWN0XSA9IHByb3BzLm9yZ1VzZXJTZWxlY3Q7XG4gICAgICB9XG5cbiAgICAgIHBvaW50ZXJFdmVudC5yZW1vdmVTdGFydEhhbmRsZXIob3B0aW9ucy5oYW5kbGUsIHByb3BzLnBvaW50ZXJFdmVudEhhbmRsZXJJZCk7XG4gICAgfVxuXG4gICAgdmFyIGhhbmRsZSA9IG9wdGlvbnMuaGFuZGxlID0gbmV3T3B0aW9ucy5oYW5kbGU7XG4gICAgcHJvcHMub3JnQ3Vyc29yID0gaGFuZGxlLnN0eWxlLmN1cnNvcjtcbiAgICBzZXREcmFnZ2FibGVDdXJzb3IoaGFuZGxlLCBwcm9wcy5vcmdDdXJzb3IpO1xuXG4gICAgaWYgKGNzc1Byb3BVc2VyU2VsZWN0KSB7XG4gICAgICBwcm9wcy5vcmdVc2VyU2VsZWN0ID0gaGFuZGxlLnN0eWxlW2Nzc1Byb3BVc2VyU2VsZWN0XTtcbiAgICAgIGhhbmRsZS5zdHlsZVtjc3NQcm9wVXNlclNlbGVjdF0gPSAnbm9uZSc7XG4gICAgfVxuXG4gICAgcG9pbnRlckV2ZW50LmFkZFN0YXJ0SGFuZGxlcihoYW5kbGUsIHByb3BzLnBvaW50ZXJFdmVudEhhbmRsZXJJZCk7XG4gIH0gLy8gekluZGV4XG5cblxuICBpZiAoaXNGaW5pdGUobmV3T3B0aW9ucy56SW5kZXgpIHx8IG5ld09wdGlvbnMuekluZGV4ID09PSBmYWxzZSkge1xuICAgIG9wdGlvbnMuekluZGV4ID0gbmV3T3B0aW9ucy56SW5kZXg7XG5cbiAgICBpZiAocHJvcHMgPT09IGFjdGl2ZVByb3BzKSB7XG4gICAgICBwcm9wcy5lbGVtZW50U3R5bGUuekluZGV4ID0gb3B0aW9ucy56SW5kZXggPT09IGZhbHNlID8gcHJvcHMub3JnWkluZGV4IDogb3B0aW9ucy56SW5kZXg7XG4gICAgfVxuICB9IC8vIGxlZnQvdG9wXG5cblxuICB2YXIgcG9zaXRpb24gPSB7XG4gICAgbGVmdDogcHJvcHMuZWxlbWVudEJCb3gubGVmdCxcbiAgICB0b3A6IHByb3BzLmVsZW1lbnRCQm94LnRvcFxuICB9O1xuICB2YXIgbmVlZHNNb3ZlO1xuXG4gIGlmIChpc0Zpbml0ZShuZXdPcHRpb25zLmxlZnQpICYmIG5ld09wdGlvbnMubGVmdCAhPT0gcG9zaXRpb24ubGVmdCkge1xuICAgIHBvc2l0aW9uLmxlZnQgPSBuZXdPcHRpb25zLmxlZnQ7XG4gICAgbmVlZHNNb3ZlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChpc0Zpbml0ZShuZXdPcHRpb25zLnRvcCkgJiYgbmV3T3B0aW9ucy50b3AgIT09IHBvc2l0aW9uLnRvcCkge1xuICAgIHBvc2l0aW9uLnRvcCA9IG5ld09wdGlvbnMudG9wO1xuICAgIG5lZWRzTW92ZSA9IHRydWU7XG4gIH1cblxuICBpZiAobmVlZHNNb3ZlKSB7XG4gICAgbW92ZShwcm9wcywgcG9zaXRpb24pO1xuICB9IC8vIEV2ZW50IGxpc3RlbmVyc1xuXG5cbiAgWydvbkRyYWcnLCAnb25Nb3ZlJywgJ29uRHJhZ1N0YXJ0JywgJ29uTW92ZVN0YXJ0JywgJ29uRHJhZ0VuZCddLmZvckVhY2goZnVuY3Rpb24gKG9wdGlvbikge1xuICAgIGlmICh0eXBlb2YgbmV3T3B0aW9uc1tvcHRpb25dID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zW29wdGlvbl0gPSBuZXdPcHRpb25zW29wdGlvbl07XG4gICAgICBwcm9wc1tvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dLmJpbmQocHJvcHMuaW5zKTtcbiAgICB9IGVsc2UgaWYgKG5ld09wdGlvbnMuaGFzT3duUHJvcGVydHkob3B0aW9uKSAmJiBuZXdPcHRpb25zW29wdGlvbl0gPT0gbnVsbCkge1xuICAgICAgb3B0aW9uc1tvcHRpb25dID0gcHJvcHNbb3B0aW9uXSA9IHZvaWQgMDtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgUGxhaW5EcmFnZ2FibGUgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ3JlYXRlIGEgYFBsYWluRHJhZ2dhYmxlYCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zLlxuICAgKi9cbiAgZnVuY3Rpb24gUGxhaW5EcmFnZ2FibGUoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQbGFpbkRyYWdnYWJsZSk7XG5cbiAgICB2YXIgcHJvcHMgPSB7XG4gICAgICBpbnM6IHRoaXMsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIC8vIEluaXRpYWwgb3B0aW9ucyAobm90IGRlZmF1bHQpXG4gICAgICAgIHpJbmRleDogWklOREVYIC8vIEluaXRpYWwgc3RhdGUuXG5cbiAgICAgIH0sXG4gICAgICBkaXNhYmxlZDogZmFsc2VcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnX2lkJywge1xuICAgICAgdmFsdWU6ICsraW5zSWRcbiAgICB9KTtcbiAgICBwcm9wcy5faWQgPSB0aGlzLl9pZDtcbiAgICBpbnNQcm9wc1t0aGlzLl9pZF0gPSBwcm9wcztcblxuICAgIGlmICghaXNFbGVtZW50KGVsZW1lbnQpIHx8IGVsZW1lbnQgPT09IGJvZHkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBlbGVtZW50IGlzIG5vdCBhY2NlcHRlZC4nKTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9IGVsc2UgaWYgKCFpc09iamVjdChvcHRpb25zKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG9wdGlvbnMuJyk7XG4gICAgfVxuXG4gICAgdmFyIGdwdVRyaWdnZXIgPSB0cnVlOyAvLyBbU1ZHXVxuXG4gICAgdmFyIG93bmVyU3ZnOyAvLyBTVkdFbGVtZW50IHdoaWNoIGlzIG5vdCByb290IHZpZXdcblxuICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgU1ZHRWxlbWVudCAmJiAob3duZXJTdmcgPSBlbGVtZW50Lm93bmVyU1ZHRWxlbWVudCkpIHtcbiAgICAgIC8vIEl0IG1lYW5zIGBpbnN0YW5jZW9mIFNWR0xvY2F0YWJsZWAgKG1hbnkgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBTVkdMb2NhdGFibGUpXG4gICAgICBpZiAoIWVsZW1lbnQuZ2V0QkJveCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgZWxlbWVudCBpcyBub3QgYWNjZXB0ZWQuIChTVkdMb2NhdGFibGUpJyk7XG4gICAgICB9IC8vIFRyaWRlbnQgYW5kIEVkZ2UgYnVnLCBTVkdTVkdFbGVtZW50IGRvZXNuJ3QgaGF2ZSBTVkdBbmltYXRlZFRyYW5zZm9ybUxpc3Q/XG5cblxuICAgICAgaWYgKCFlbGVtZW50LnRyYW5zZm9ybSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgZWxlbWVudCBpcyBub3QgYWNjZXB0ZWQuIChTVkdBbmltYXRlZFRyYW5zZm9ybUxpc3QpJyk7XG4gICAgICB9IC8vIFRyaWRlbnQgYnVnLCByZXR1cm5lZCB2YWx1ZSBtdXN0IGJlIHVzZWQgKFRoYXQgaXMgbm90IGdpdmVuIHZhbHVlKS5cblxuXG4gICAgICBwcm9wcy5zdmdUcmFuc2Zvcm0gPSBlbGVtZW50LnRyYW5zZm9ybS5iYXNlVmFsLmFwcGVuZEl0ZW0ob3duZXJTdmcuY3JlYXRlU1ZHVHJhbnNmb3JtKCkpO1xuICAgICAgcHJvcHMuc3ZnUG9pbnQgPSBvd25lclN2Zy5jcmVhdGVTVkdQb2ludCgpOyAvLyBHZWNrbyBidWcsIHZpZXcuZ2V0U2NyZWVuQ1RNIHJldHVybnMgQ1RNIHdpdGggcm9vdCB2aWV3LlxuXG4gICAgICB2YXIgc3ZnVmlldyA9IGVsZW1lbnQubmVhcmVzdFZpZXdwb3J0RWxlbWVudCB8fCBlbGVtZW50LnZpZXdwb3J0RWxlbWVudDtcbiAgICAgIHByb3BzLnN2Z0N0bUVsZW1lbnQgPSAhSVNfR0VDS08gPyBzdmdWaWV3IDogc3ZnVmlldy5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMob3duZXJTdmcubmFtZXNwYWNlVVJJLCAncmVjdCcpKTtcbiAgICAgIGdwdVRyaWdnZXIgPSBmYWxzZTtcbiAgICAgIHByb3BzLmluaXRFbG0gPSBpbml0U3ZnO1xuICAgICAgcHJvcHMubW92ZUVsbSA9IG1vdmVTdmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFsvU1ZHXVxuXG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBpbmRlbnQgKi9cblxuICAgICAgLyogW1NWRy9dICovXG4gICAgICB2YXIgY3NzUHJvcFdpbGxDaGFuZ2UgPSBDU1NQcmVmaXguZ2V0TmFtZSgnd2lsbENoYW5nZScpO1xuXG4gICAgICBpZiAoY3NzUHJvcFdpbGxDaGFuZ2UpIHtcbiAgICAgICAgZ3B1VHJpZ2dlciA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnMubGVmdFRvcCAmJiBjc3NQcm9wVHJhbnNmb3JtKSB7XG4gICAgICAgIC8vIHRyYW5zbGF0ZVxuICAgICAgICBpZiAoY3NzUHJvcFdpbGxDaGFuZ2UpIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlW2Nzc1Byb3BXaWxsQ2hhbmdlXSA9ICd0cmFuc2Zvcm0nO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMuaW5pdEVsbSA9IGluaXRUcmFuc2xhdGU7XG4gICAgICAgIHByb3BzLm1vdmVFbG0gPSBtb3ZlVHJhbnNsYXRlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbGVmdCBhbmQgdG9wXG4gICAgICAgIC8vIFtMRUZUVE9QXVxuICAgICAgICBpZiAoY3NzUHJvcFdpbGxDaGFuZ2UpIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlW2Nzc1Byb3BXaWxsQ2hhbmdlXSA9ICdsZWZ0LCB0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMuaW5pdEVsbSA9IGluaXRMZWZ0VG9wO1xuICAgICAgICBwcm9wcy5tb3ZlRWxtID0gbW92ZUxlZnRUb3A7IC8vIFsvTEVGVFRPUF1cblxuICAgICAgICAvKiBbTEVGVFRPUC9dXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignYHRyYW5zZm9ybWAgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgICAgW0xFRlRUT1AvXSAqL1xuICAgICAgfVxuICAgICAgLyogZXNsaW50LWVuYWJsZSBpbmRlbnQgKi9cblxuICAgICAgLyogW1NWRy9dICovXG5cbiAgICB9IC8vIFtTVkcvXVxuXG5cbiAgICBwcm9wcy5lbGVtZW50ID0gaW5pdEFuaW0oZWxlbWVudCwgZ3B1VHJpZ2dlcik7XG4gICAgcHJvcHMuZWxlbWVudFN0eWxlID0gZWxlbWVudC5zdHlsZTtcbiAgICBwcm9wcy5vcmdaSW5kZXggPSBwcm9wcy5lbGVtZW50U3R5bGUuekluZGV4O1xuXG4gICAgaWYgKGRyYWdnYWJsZUNsYXNzKSB7XG4gICAgICBtQ2xhc3NMaXN0KGVsZW1lbnQpLmFkZChkcmFnZ2FibGVDbGFzcyk7XG4gICAgfVxuXG4gICAgcHJvcHMucG9pbnRlckV2ZW50SGFuZGxlcklkID0gcG9pbnRlckV2ZW50LnJlZ1N0YXJ0SGFuZGxlcihmdW5jdGlvbiAocG9pbnRlclhZKSB7XG4gICAgICByZXR1cm4gZHJhZ1N0YXJ0KHByb3BzLCBwb2ludGVyWFkpO1xuICAgIH0pOyAvLyBEZWZhdWx0IG9wdGlvbnNcblxuICAgIGlmICghb3B0aW9ucy5jb250YWlubWVudCkge1xuICAgICAgdmFyIHBhcmVudDtcbiAgICAgIG9wdGlvbnMuY29udGFpbm1lbnQgPSAocGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSAmJiBpc0VsZW1lbnQocGFyZW50KSA/IHBhcmVudCA6IGJvZHk7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmhhbmRsZSkge1xuICAgICAgb3B0aW9ucy5oYW5kbGUgPSBlbGVtZW50O1xuICAgIH1cblxuICAgIF9zZXRPcHRpb25zKHByb3BzLCBvcHRpb25zKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhQbGFpbkRyYWdnYWJsZSwgW3tcbiAgICBrZXk6IFwicmVtb3ZlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgIHZhciBwcm9wcyA9IGluc1Byb3BzW3RoaXMuX2lkXTtcbiAgICAgIHRoaXMuZGlzYWJsZWQgPSB0cnVlOyAvLyBUbyByZXN0b3JlIGVsZW1lbnQgYW5kIHJlc2V0IHBvaW50ZXJcblxuICAgICAgcG9pbnRlckV2ZW50LnVucmVnU3RhcnRIYW5kbGVyKHBvaW50ZXJFdmVudC5yZW1vdmVTdGFydEhhbmRsZXIocHJvcHMub3B0aW9ucy5oYW5kbGUsIHByb3BzLnBvaW50ZXJFdmVudEhhbmRsZXJJZCkpO1xuICAgICAgZGVsZXRlIGluc1Byb3BzW3RoaXMuX2lkXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBOZXcgb3B0aW9ucy5cbiAgICAgKiBAcmV0dXJucyB7UGxhaW5EcmFnZ2FibGV9IEN1cnJlbnQgaW5zdGFuY2UgaXRzZWxmLlxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwic2V0T3B0aW9uc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICAgIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICBfc2V0T3B0aW9ucyhpbnNQcm9wc1t0aGlzLl9pZF0sIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicG9zaXRpb25cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcG9zaXRpb24oKSB7XG4gICAgICBpbml0QkJveChpbnNQcm9wc1t0aGlzLl9pZF0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRpc2FibGVkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gaW5zUHJvcHNbdGhpcy5faWRdLmRpc2FibGVkO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIHZhciBwcm9wcyA9IGluc1Byb3BzW3RoaXMuX2lkXTtcblxuICAgICAgaWYgKCh2YWx1ZSA9ICEhdmFsdWUpICE9PSBwcm9wcy5kaXNhYmxlZCkge1xuICAgICAgICBwcm9wcy5kaXNhYmxlZCA9IHZhbHVlO1xuXG4gICAgICAgIGlmIChwcm9wcy5kaXNhYmxlZCkge1xuICAgICAgICAgIGlmIChwcm9wcyA9PT0gYWN0aXZlUHJvcHMpIHtcbiAgICAgICAgICAgIGRyYWdFbmQocHJvcHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHByb3BzLm9wdGlvbnMuaGFuZGxlLnN0eWxlLmN1cnNvciA9IHByb3BzLm9yZ0N1cnNvcjtcblxuICAgICAgICAgIGlmIChjc3NQcm9wVXNlclNlbGVjdCkge1xuICAgICAgICAgICAgcHJvcHMub3B0aW9ucy5oYW5kbGUuc3R5bGVbY3NzUHJvcFVzZXJTZWxlY3RdID0gcHJvcHMub3JnVXNlclNlbGVjdDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZHJhZ2dhYmxlQ2xhc3MpIHtcbiAgICAgICAgICAgIG1DbGFzc0xpc3QocHJvcHMuZWxlbWVudCkucmVtb3ZlKGRyYWdnYWJsZUNsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0RHJhZ2dhYmxlQ3Vyc29yKHByb3BzLm9wdGlvbnMuaGFuZGxlLCBwcm9wcy5vcmdDdXJzb3IpO1xuXG4gICAgICAgICAgaWYgKGNzc1Byb3BVc2VyU2VsZWN0KSB7XG4gICAgICAgICAgICBwcm9wcy5vcHRpb25zLmhhbmRsZS5zdHlsZVtjc3NQcm9wVXNlclNlbGVjdF0gPSAnbm9uZSc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRyYWdnYWJsZUNsYXNzKSB7XG4gICAgICAgICAgICBtQ2xhc3NMaXN0KHByb3BzLmVsZW1lbnQpLmFkZChkcmFnZ2FibGVDbGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImVsZW1lbnRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0uZWxlbWVudDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVjdFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIGNvcHlUcmVlKGluc1Byb3BzW3RoaXMuX2lkXS5lbGVtZW50QkJveCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImxlZnRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0uZWxlbWVudEJCb3gubGVmdDtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICBfc2V0T3B0aW9ucyhpbnNQcm9wc1t0aGlzLl9pZF0sIHtcbiAgICAgICAgbGVmdDogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ0b3BcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0uZWxlbWVudEJCb3gudG9wO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIF9zZXRPcHRpb25zKGluc1Byb3BzW3RoaXMuX2lkXSwge1xuICAgICAgICB0b3A6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY29udGFpbm1lbnRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHZhciBwcm9wcyA9IGluc1Byb3BzW3RoaXMuX2lkXTtcbiAgICAgIHJldHVybiBwcm9wcy5jb250YWlubWVudElzQkJveCA/IHBwQkJveDJPcHRpb25PYmplY3QocHJvcHMub3B0aW9ucy5jb250YWlubWVudCkgOiBwcm9wcy5vcHRpb25zLmNvbnRhaW5tZW50O1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIF9zZXRPcHRpb25zKGluc1Byb3BzW3RoaXMuX2lkXSwge1xuICAgICAgICBjb250YWlubWVudDogdmFsdWVcbiAgICAgIH0pO1xuICAgIH0gLy8gW1NOQVBdXG5cbiAgfSwge1xuICAgIGtleTogXCJzbmFwXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gY29weVRyZWUoaW5zUHJvcHNbdGhpcy5faWRdLm9wdGlvbnMuc25hcCk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX3NldE9wdGlvbnMoaW5zUHJvcHNbdGhpcy5faWRdLCB7XG4gICAgICAgIHNuYXA6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9IC8vIFsvU05BUF1cbiAgICAvLyBbQVVUTy1TQ1JPTExdXG5cbiAgfSwge1xuICAgIGtleTogXCJhdXRvU2Nyb2xsXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gY29weVRyZWUoaW5zUHJvcHNbdGhpcy5faWRdLm9wdGlvbnMuYXV0b1Njcm9sbCk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX3NldE9wdGlvbnMoaW5zUHJvcHNbdGhpcy5faWRdLCB7XG4gICAgICAgIGF1dG9TY3JvbGw6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9IC8vIFsvQVVUTy1TQ1JPTExdXG5cbiAgfSwge1xuICAgIGtleTogXCJoYW5kbGVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0ub3B0aW9ucy5oYW5kbGU7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX3NldE9wdGlvbnMoaW5zUHJvcHNbdGhpcy5faWRdLCB7XG4gICAgICAgIGhhbmRsZTogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ6SW5kZXhcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0ub3B0aW9ucy56SW5kZXg7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX3NldE9wdGlvbnMoaW5zUHJvcHNbdGhpcy5faWRdLCB7XG4gICAgICAgIHpJbmRleDogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvbkRyYWdcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0ub3B0aW9ucy5vbkRyYWc7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX3NldE9wdGlvbnMoaW5zUHJvcHNbdGhpcy5faWRdLCB7XG4gICAgICAgIG9uRHJhZzogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvbk1vdmVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0ub3B0aW9ucy5vbk1vdmU7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX3NldE9wdGlvbnMoaW5zUHJvcHNbdGhpcy5faWRdLCB7XG4gICAgICAgIG9uTW92ZTogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvbkRyYWdTdGFydFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIGluc1Byb3BzW3RoaXMuX2lkXS5vcHRpb25zLm9uRHJhZ1N0YXJ0O1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIF9zZXRPcHRpb25zKGluc1Byb3BzW3RoaXMuX2lkXSwge1xuICAgICAgICBvbkRyYWdTdGFydDogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvbk1vdmVTdGFydFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIGluc1Byb3BzW3RoaXMuX2lkXS5vcHRpb25zLm9uTW92ZVN0YXJ0O1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIF9zZXRPcHRpb25zKGluc1Byb3BzW3RoaXMuX2lkXSwge1xuICAgICAgICBvbk1vdmVTdGFydDogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvbkRyYWdFbmRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBpbnNQcm9wc1t0aGlzLl9pZF0ub3B0aW9ucy5vbkRyYWdFbmQ7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX3NldE9wdGlvbnMoaW5zUHJvcHNbdGhpcy5faWRdLCB7XG4gICAgICAgIG9uRHJhZ0VuZDogdmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0sIFt7XG4gICAga2V5OiBcImRyYWdnYWJsZUN1cnNvclwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIGNzc1dhbnRlZFZhbHVlRHJhZ2dhYmxlQ3Vyc29yO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIGlmIChjc3NXYW50ZWRWYWx1ZURyYWdnYWJsZUN1cnNvciAhPT0gdmFsdWUpIHtcbiAgICAgICAgY3NzV2FudGVkVmFsdWVEcmFnZ2FibGVDdXJzb3IgPSB2YWx1ZTtcbiAgICAgICAgY3NzVmFsdWVEcmFnZ2FibGVDdXJzb3IgPSBudWxsOyAvLyBSZXNldFxuXG4gICAgICAgIE9iamVjdC5rZXlzKGluc1Byb3BzKS5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgIHZhciBwcm9wcyA9IGluc1Byb3BzW2lkXTtcblxuICAgICAgICAgIGlmIChwcm9wcy5kaXNhYmxlZCB8fCBwcm9wcyA9PT0gYWN0aXZlUHJvcHMgJiYgY3NzVmFsdWVEcmFnZ2luZ0N1cnNvciAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXREcmFnZ2FibGVDdXJzb3IocHJvcHMub3B0aW9ucy5oYW5kbGUsIHByb3BzLm9yZ0N1cnNvcik7XG5cbiAgICAgICAgICBpZiAocHJvcHMgPT09IGFjdGl2ZVByb3BzKSB7XG4gICAgICAgICAgICAvLyBTaW5jZSBjc3NWYWx1ZURyYWdnaW5nQ3Vyc29yIGlzIGBmYWxzZWAsIGNvcHkgY3Vyc29yIGFnYWluLlxuICAgICAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSBjc3NPcmdWYWx1ZUJvZHlDdXJzb3I7XG4gICAgICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHByb3BzLm9wdGlvbnMuaGFuZGxlLCAnJykuY3Vyc29yO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRyYWdnaW5nQ3Vyc29yXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gY3NzV2FudGVkVmFsdWVEcmFnZ2luZ0N1cnNvcjtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICBpZiAoY3NzV2FudGVkVmFsdWVEcmFnZ2luZ0N1cnNvciAhPT0gdmFsdWUpIHtcbiAgICAgICAgY3NzV2FudGVkVmFsdWVEcmFnZ2luZ0N1cnNvciA9IHZhbHVlO1xuICAgICAgICBjc3NWYWx1ZURyYWdnaW5nQ3Vyc29yID0gbnVsbDsgLy8gUmVzZXRcblxuICAgICAgICBpZiAoYWN0aXZlUHJvcHMpIHtcbiAgICAgICAgICBzZXREcmFnZ2luZ0N1cnNvcihhY3RpdmVQcm9wcy5vcHRpb25zLmhhbmRsZSk7XG5cbiAgICAgICAgICBpZiAoY3NzVmFsdWVEcmFnZ2luZ0N1cnNvciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHNldERyYWdnYWJsZUN1cnNvcihhY3RpdmVQcm9wcy5vcHRpb25zLmhhbmRsZSwgYWN0aXZlUHJvcHMub3JnQ3Vyc29yKTsgLy8gZHJhZ2dhYmxlQ3Vyc29yXG5cbiAgICAgICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gY3NzT3JnVmFsdWVCb2R5Q3Vyc29yO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gY3NzVmFsdWVEcmFnZ2luZ0N1cnNvciB8fCAvLyBJZiBpdCBpcyBgZmFsc2VgIG9yIGAnJ2BcbiAgICAgICAgICB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShhY3RpdmVQcm9wcy5vcHRpb25zLmhhbmRsZSwgJycpLmN1cnNvcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJkcmFnZ2FibGVDbGFzc1wiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIGRyYWdnYWJsZUNsYXNzO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUgPyB2YWx1ZSArICcnIDogdm9pZCAwO1xuXG4gICAgICBpZiAodmFsdWUgIT09IGRyYWdnYWJsZUNsYXNzKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGluc1Byb3BzKS5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgIHZhciBwcm9wcyA9IGluc1Byb3BzW2lkXTtcblxuICAgICAgICAgIGlmICghcHJvcHMuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHZhciBjbGFzc0xpc3QgPSBtQ2xhc3NMaXN0KHByb3BzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAoZHJhZ2dhYmxlQ2xhc3MpIHtcbiAgICAgICAgICAgICAgY2xhc3NMaXN0LnJlbW92ZShkcmFnZ2FibGVDbGFzcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICBjbGFzc0xpc3QuYWRkKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkcmFnZ2FibGVDbGFzcyA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJkcmFnZ2luZ0NsYXNzXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gZHJhZ2dpbmdDbGFzcztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlID8gdmFsdWUgKyAnJyA6IHZvaWQgMDtcblxuICAgICAgaWYgKHZhbHVlICE9PSBkcmFnZ2luZ0NsYXNzKSB7XG4gICAgICAgIGlmIChhY3RpdmVQcm9wcykge1xuICAgICAgICAgIHZhciBjbGFzc0xpc3QgPSBtQ2xhc3NMaXN0KGFjdGl2ZVByb3BzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgaWYgKGRyYWdnaW5nQ2xhc3MpIHtcbiAgICAgICAgICAgIGNsYXNzTGlzdC5yZW1vdmUoZHJhZ2dpbmdDbGFzcyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBjbGFzc0xpc3QuYWRkKHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkcmFnZ2luZ0NsYXNzID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm1vdmluZ0NsYXNzXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gbW92aW5nQ2xhc3M7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZSA/IHZhbHVlICsgJycgOiB2b2lkIDA7XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gbW92aW5nQ2xhc3MpIHtcbiAgICAgICAgaWYgKGFjdGl2ZVByb3BzICYmIGhhc01vdmVkKSB7XG4gICAgICAgICAgdmFyIGNsYXNzTGlzdCA9IG1DbGFzc0xpc3QoYWN0aXZlUHJvcHMuZWxlbWVudCk7XG5cbiAgICAgICAgICBpZiAobW92aW5nQ2xhc3MpIHtcbiAgICAgICAgICAgIGNsYXNzTGlzdC5yZW1vdmUobW92aW5nQ2xhc3MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgY2xhc3NMaXN0LmFkZCh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbW92aW5nQ2xhc3MgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gUGxhaW5EcmFnZ2FibGU7XG59KCk7XG5cbnBvaW50ZXJFdmVudC5hZGRNb3ZlSGFuZGxlcihkb2N1bWVudCwgZnVuY3Rpb24gKHBvaW50ZXJYWSkge1xuICBpZiAoIWFjdGl2ZVByb3BzKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHBvc2l0aW9uID0ge1xuICAgIGxlZnQ6IHBvaW50ZXJYWS5jbGllbnRYICsgd2luZG93LnBhZ2VYT2Zmc2V0ICsgcG9pbnRlck9mZnNldC5sZWZ0LFxuICAgIHRvcDogcG9pbnRlclhZLmNsaWVudFkgKyB3aW5kb3cucGFnZVlPZmZzZXQgKyBwb2ludGVyT2Zmc2V0LnRvcFxuICB9O1xuXG4gIGlmIChtb3ZlKGFjdGl2ZVByb3BzLCBwb3NpdGlvbiwgLy8gW1NOQVBdXG4gIGFjdGl2ZVByb3BzLnNuYXBUYXJnZXRzID8gZnVuY3Rpb24gKHBvc2l0aW9uKSB7XG4gICAgLy8gU25hcFxuICAgIHZhciBpTGVuID0gYWN0aXZlUHJvcHMuc25hcFRhcmdldHMubGVuZ3RoO1xuICAgIHZhciBzbmFwcGVkWCA9IGZhbHNlLFxuICAgICAgICBzbmFwcGVkWSA9IGZhbHNlLFxuICAgICAgICBpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGlMZW4gJiYgKCFzbmFwcGVkWCB8fCAhc25hcHBlZFkpOyBpKyspIHtcbiAgICAgIHZhciBzbmFwVGFyZ2V0ID0gYWN0aXZlUHJvcHMuc25hcFRhcmdldHNbaV07XG5cbiAgICAgIGlmICgoc25hcFRhcmdldC5ncmF2aXR5WFN0YXJ0ID09IG51bGwgfHwgcG9zaXRpb24ubGVmdCA+PSBzbmFwVGFyZ2V0LmdyYXZpdHlYU3RhcnQpICYmIChzbmFwVGFyZ2V0LmdyYXZpdHlYRW5kID09IG51bGwgfHwgcG9zaXRpb24ubGVmdCA8PSBzbmFwVGFyZ2V0LmdyYXZpdHlYRW5kKSAmJiAoc25hcFRhcmdldC5ncmF2aXR5WVN0YXJ0ID09IG51bGwgfHwgcG9zaXRpb24udG9wID49IHNuYXBUYXJnZXQuZ3Jhdml0eVlTdGFydCkgJiYgKHNuYXBUYXJnZXQuZ3Jhdml0eVlFbmQgPT0gbnVsbCB8fCBwb3NpdGlvbi50b3AgPD0gc25hcFRhcmdldC5ncmF2aXR5WUVuZCkpIHtcbiAgICAgICAgaWYgKCFzbmFwcGVkWCAmJiBzbmFwVGFyZ2V0LnggIT0gbnVsbCkge1xuICAgICAgICAgIHBvc2l0aW9uLmxlZnQgPSBzbmFwVGFyZ2V0Lng7XG4gICAgICAgICAgc25hcHBlZFggPSB0cnVlO1xuICAgICAgICAgIGkgPSAtMTsgLy8gUmVzdGFydCBsb29wXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNuYXBwZWRZICYmIHNuYXBUYXJnZXQueSAhPSBudWxsKSB7XG4gICAgICAgICAgcG9zaXRpb24udG9wID0gc25hcFRhcmdldC55O1xuICAgICAgICAgIHNuYXBwZWRZID0gdHJ1ZTtcbiAgICAgICAgICBpID0gLTE7IC8vIFJlc3RhcnQgbG9vcFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcG9zaXRpb24uc25hcHBlZCA9IHNuYXBwZWRYIHx8IHNuYXBwZWRZO1xuICAgIHJldHVybiBhY3RpdmVQcm9wcy5vbkRyYWcgPyBhY3RpdmVQcm9wcy5vbkRyYWcocG9zaXRpb24pIDogdHJ1ZTtcbiAgfSA6IC8vIFsvU05BUF1cbiAgYWN0aXZlUHJvcHMub25EcmFnKSkge1xuICAgIC8vIFtBVVRPLVNDUk9MTF1cbiAgICB2YXIgeHlNb3ZlQXJncyA9IHt9LFxuICAgICAgICBhdXRvU2Nyb2xsID0gYWN0aXZlUHJvcHMuYXV0b1Njcm9sbDtcblxuICAgIGlmIChhdXRvU2Nyb2xsKSB7XG4gICAgICB2YXIgY2xpZW50WFkgPSB7XG4gICAgICAgIHg6IGFjdGl2ZVByb3BzLmVsZW1lbnRCQm94LmxlZnQgLSB3aW5kb3cucGFnZVhPZmZzZXQsXG4gICAgICAgIHk6IGFjdGl2ZVByb3BzLmVsZW1lbnRCQm94LnRvcCAtIHdpbmRvdy5wYWdlWU9mZnNldFxuICAgICAgfTtcbiAgICAgIFsneCcsICd5J10uZm9yRWFjaChmdW5jdGlvbiAoYXhpcykge1xuICAgICAgICBpZiAoYXV0b1Njcm9sbFtheGlzXSkge1xuICAgICAgICAgIHZhciBtaW4gPSBhdXRvU2Nyb2xsW2F4aXNdLm1pbixcbiAgICAgICAgICAgICAgbWF4ID0gYXV0b1Njcm9sbFtheGlzXS5tYXg7XG4gICAgICAgICAgYXV0b1Njcm9sbFtheGlzXS5saW5lcy5zb21lKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICBpZiAobGluZS5kaXIgPT09IC0xID8gY2xpZW50WFlbYXhpc10gPD0gbGluZS5wb3NpdGlvbiA6IGNsaWVudFhZW2F4aXNdID49IGxpbmUucG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgeHlNb3ZlQXJnc1theGlzXSA9IHtcbiAgICAgICAgICAgICAgICBkaXI6IGxpbmUuZGlyLFxuICAgICAgICAgICAgICAgIHNwZWVkOiBsaW5lLnNwZWVkIC8gMTAwMCxcbiAgICAgICAgICAgICAgICBtaW46IG1pbixcbiAgICAgICAgICAgICAgICBtYXg6IG1heFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoeHlNb3ZlQXJncy54IHx8IHh5TW92ZUFyZ3MueSkge1xuICAgICAgc2Nyb2xsRnJhbWUubW92ZShhdXRvU2Nyb2xsLnRhcmdldCwgeHlNb3ZlQXJncywgYXV0b1Njcm9sbC5pc1dpbmRvdyA/IHNjcm9sbFhZV2luZG93IDogc2Nyb2xsWFlFbGVtZW50KTtcbiAgICAgIHBvc2l0aW9uLmF1dG9TY3JvbGwgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY3JvbGxGcmFtZS5zdG9wKCk7XG4gICAgfSAvLyBbL0FVVE8tU0NST0xMXVxuXG5cbiAgICBpZiAoIWhhc01vdmVkKSB7XG4gICAgICBoYXNNb3ZlZCA9IHRydWU7XG5cbiAgICAgIGlmIChtb3ZpbmdDbGFzcykge1xuICAgICAgICBtQ2xhc3NMaXN0KGFjdGl2ZVByb3BzLmVsZW1lbnQpLmFkZChtb3ZpbmdDbGFzcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhY3RpdmVQcm9wcy5vbk1vdmVTdGFydCkge1xuICAgICAgICBhY3RpdmVQcm9wcy5vbk1vdmVTdGFydChwb3NpdGlvbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFjdGl2ZVByb3BzLm9uTW92ZSkge1xuICAgICAgYWN0aXZlUHJvcHMub25Nb3ZlKHBvc2l0aW9uKTtcbiAgICB9XG4gIH1cbn0pO1xue1xuICBmdW5jdGlvbiBlbmRIYW5kbGVyKCkge1xuICAgIGlmIChhY3RpdmVQcm9wcykge1xuICAgICAgZHJhZ0VuZChhY3RpdmVQcm9wcyk7XG4gICAgfVxuICB9XG5cbiAgcG9pbnRlckV2ZW50LmFkZEVuZEhhbmRsZXIoZG9jdW1lbnQsIGVuZEhhbmRsZXIpO1xuICBwb2ludGVyRXZlbnQuYWRkQ2FuY2VsSGFuZGxlcihkb2N1bWVudCwgZW5kSGFuZGxlcik7XG59XG57XG4gIGZ1bmN0aW9uIGluaXREb2MoKSB7XG4gICAgY3NzUHJvcFRyYW5zaXRpb25Qcm9wZXJ0eSA9IENTU1ByZWZpeC5nZXROYW1lKCd0cmFuc2l0aW9uUHJvcGVydHknKTtcbiAgICBjc3NQcm9wVHJhbnNmb3JtID0gQ1NTUHJlZml4LmdldE5hbWUoJ3RyYW5zZm9ybScpO1xuICAgIGNzc09yZ1ZhbHVlQm9keUN1cnNvciA9IGJvZHkuc3R5bGUuY3Vyc29yO1xuXG4gICAgaWYgKGNzc1Byb3BVc2VyU2VsZWN0ID0gQ1NTUHJlZml4LmdldE5hbWUoJ3VzZXJTZWxlY3QnKSkge1xuICAgICAgY3NzT3JnVmFsdWVCb2R5VXNlclNlbGVjdCA9IGJvZHkuc3R5bGVbY3NzUHJvcFVzZXJTZWxlY3RdO1xuICAgIH0gLy8gSW5pdCBhY3RpdmUgaXRlbSB3aGVuIGxheW91dCBpcyBjaGFuZ2VkLCBhbmQgaW5pdCBvdGhlcnMgbGF0ZXIuXG5cblxuICAgIHZhciBMQVpZX0lOSVRfREVMQVkgPSAyMDA7XG4gICAgdmFyIGluaXREb25lSXRlbXMgPSB7fSxcbiAgICAgICAgbGF6eUluaXRUaW1lcjtcblxuICAgIGZ1bmN0aW9uIGNoZWNrSW5pdEJCb3gocHJvcHMsIGV2ZW50VHlwZSkge1xuICAgICAgaWYgKHByb3BzLmluaXRFbG0pIHtcbiAgICAgICAgLy8gRWFzeSBjaGVja2luZyBmb3IgaW5zdGFuY2Ugd2l0aG91dCBlcnJvcnMuXG4gICAgICAgIGluaXRCQm94KHByb3BzLCBldmVudFR5cGUpO1xuICAgICAgfSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXN0eWxlXG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbml0QWxsKGV2ZW50VHlwZSkge1xuICAgICAgY2xlYXJUaW1lb3V0KGxhenlJbml0VGltZXIpO1xuICAgICAgT2JqZWN0LmtleXMoaW5zUHJvcHMpLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGlmICghaW5pdERvbmVJdGVtc1tpZF0pIHtcbiAgICAgICAgICBjaGVja0luaXRCQm94KGluc1Byb3BzW2lkXSwgZXZlbnRUeXBlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpbml0RG9uZUl0ZW1zID0ge307XG4gICAgfVxuXG4gICAgdmFyIGxheW91dENoYW5naW5nID0gZmFsc2U7IC8vIEdlY2tvIGJ1ZywgbXVsdGlwbGUgY2FsbGluZyBieSBgcmVzaXplYC5cblxuICAgIHZhciBsYXlvdXRDaGFuZ2UgPSBBbmltRXZlbnQuYWRkKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgaWYgKGxheW91dENoYW5naW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGF5b3V0Q2hhbmdpbmcgPSB0cnVlO1xuXG4gICAgICBpZiAoYWN0aXZlUHJvcHMpIHtcbiAgICAgICAgY2hlY2tJbml0QkJveChhY3RpdmVQcm9wcywgZXZlbnQudHlwZSk7XG4gICAgICAgIHBvaW50ZXJFdmVudC5tb3ZlKCk7XG4gICAgICAgIGluaXREb25lSXRlbXNbYWN0aXZlUHJvcHMuX2lkXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGNsZWFyVGltZW91dChsYXp5SW5pdFRpbWVyKTtcbiAgICAgIGxhenlJbml0VGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaW5pdEFsbChldmVudC50eXBlKTtcbiAgICAgIH0sIExBWllfSU5JVF9ERUxBWSk7XG4gICAgICBsYXlvdXRDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBsYXlvdXRDaGFuZ2UsIHRydWUpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBsYXlvdXRDaGFuZ2UsIHRydWUpO1xuICB9XG5cbiAgaWYgKGJvZHkgPSBkb2N1bWVudC5ib2R5KSB7XG4gICAgaW5pdERvYygpO1xuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgIGluaXREb2MoKTtcbiAgICB9LCB0cnVlKTtcbiAgfVxufVxuLyogW1NOQVAvXVxuUGxhaW5EcmFnZ2FibGUubGltaXQgPSB0cnVlO1xuW1NOQVAvXSAqL1xuXG5leHBvcnQgZGVmYXVsdCBQbGFpbkRyYWdnYWJsZTsiLCAiaW1wb3J0IFBsYWluRHJhZ2dhYmxlIGZyb20gXCJwbGFpbi1kcmFnZ2FibGVcIjtcbi8vIGltcG9ydCBMZWFkZXJMaW5lIGZyb20gXCJsZWFkZXItbGluZVwiO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24gKCkge1xuICAgIGxldCBlbGVtZW50Q291bnRlciA9IDE7XG4gICAgbGV0IHN0YXJ0RWxlbWVudCA9IG51bGw7IC8vIFRyYWNrIHRoZSBzdGFydGluZyBlbGVtZW50IGZvciB0aGUgbGVhZGVyIGxpbmVcbiAgICBsZXQgbGluZXMgPSBbXTsgLy8gQXJyYXkgdG8gc3RvcmUgYWxsIGNyZWF0ZWQgbGluZXNcblxuICAgIC8vIEZ1bmN0aW9uIHRvIHN0b3JlIGxpbmUgb2JqZWN0cyBhbmQgYXNzb2NpYXRlZCBzdGFydCBhbmQgZW5kIGVsZW1lbnRzXG4gICAgY29uc3QgbGluZURhdGEgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZURyYWdnYWJsZShlbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGRyYWdnYWJsZSA9IG5ldyBQbGFpbkRyYWdnYWJsZShlbGVtZW50LCB7XG4gICAgICAgICAgICBvbk1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgYW55IGxpbmVzIGNvbm5lY3RlZCB0byB0aGlzIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAvLyBsaW5lRGF0YS5mb3JFYWNoKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGlmIChkYXRhLnN0YXJ0ID09PSBlbGVtZW50IHx8IGRhdGEuZW5kID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBkYXRhLmxpbmUucG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBZGQgY2xpY2sgbGlzdGVuZXIgdG8gaGFuZGxlIGxlYWRlcmxpbmUgbG9naWNcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAvLyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgLy8gUHJldmVudCBjYW52YXMgY2xpY2sgZXZlbnQgZnJvbSBmaXJpbmdcbiAgICAgICAgICAgIC8vIGlmICghc3RhcnRFbGVtZW50KSB7XG4gICAgICAgICAgICAvLyAgICAgLy8gSWYgdGhlcmUncyBubyBzdGFydCwgc2V0IHRoaXMgYXMgdGhlIHN0YXJ0XG4gICAgICAgICAgICAvLyAgICAgc3RhcnRFbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgIC8vICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJyaW5nLTJcIiwgXCJyaW5nLWJsdWUtNTAwXCIpOyAvLyBBZGQgVGFpbHdpbmRDU1MgY2xhc3MgZm9yIGhpZ2hsaWdodGluZ1xuICAgICAgICAgICAgLy8gfSBlbHNlIGlmIChzdGFydEVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vICAgICAvLyBJZiBjbGlja2luZyB0aGUgc2FtZSBlbGVtZW50LCBjbGVhciB0aGUgc3RhcnRcbiAgICAgICAgICAgIC8vICAgICBzdGFydEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInJpbmctMlwiLCBcInJpbmctYmx1ZS01MDBcIik7XG4gICAgICAgICAgICAvLyAgICAgc3RhcnRFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgLy8gSWYgdGhlcmUncyBhbHJlYWR5IGEgc3RhcnQsIHNldCB0aGlzIGFzIHRoZSBlbmQgYW5kIGNyZWF0ZSBhIGxpbmVcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBlbmRFbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBsaW5lID0gbmV3IExlYWRlckxpbmUoc3RhcnRFbGVtZW50LCBlbmRFbGVtZW50KTtcbiAgICAgICAgICAgIC8vICAgICBsaW5lLnNldE9wdGlvbnMoe1xuICAgICAgICAgICAgLy8gICAgICAgICBlbmRQbHVnOiBcImhhbmRcIixcbiAgICAgICAgICAgIC8vICAgICB9KVxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhsaW5lKVxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICAgICAvLyBTdG9yZSB0aGUgbGluZSBhbmQgaXRzIGNvbm5lY3RlZCBlbGVtZW50c1xuICAgICAgICAgICAgLy8gICAgIGxpbmVEYXRhLnB1c2goeyBzdGFydDogc3RhcnRFbGVtZW50LCBlbmQ6IGVuZEVsZW1lbnQsIGxpbmUgfSk7XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gICAgIC8vIEFkZCBjbGljayBsaXN0ZW5lciBmb3IgcmVtb3ZpbmcgdGhlIGxpbmVcbiAgICAgICAgICAgIC8vICAgICBsaW5lLm1pZGRsZUxhYmVsID0gTGVhZGVyTGluZS5wYXRoTGFiZWwoXCJDbGljayB0byByZW1vdmVcIik7XG4gICAgICAgICAgICAvLyAgICAgbGluZS5wYXRoTGFiZWwgPSB7IGNvbG9yOiBcImJsYWNrXCIsIGZvbnRTaXplOiBcIjEycHhcIiB9O1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICAgICAvLyBsaW5lLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgLy8gICAgIC8vICAgICBsaW5lLnJlbW92ZSgpO1xuICAgICAgICAgICAgLy8gICAgIC8vICAgICBjb25zdCBpbmRleCA9IGxpbmVEYXRhLmZpbmRJbmRleCgoZGF0YSkgPT4gZGF0YS5saW5lID09PSBsaW5lKTtcbiAgICAgICAgICAgIC8vICAgICAvLyAgICAgaWYgKGluZGV4ID4gLTEpIGxpbmVEYXRhLnNwbGljZShpbmRleCwgMSk7IC8vIFJlbW92ZSBmcm9tIGxpbmVEYXRhIGFycmF5XG4gICAgICAgICAgICAvLyAgICAgLy8gfSk7XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gICAgIC8vIENsZWFyIHRoZSBzdGFydCBhbmQgcmVtb3ZlIGl0cyBUYWlsd2luZENTUyBjbGFzc1xuICAgICAgICAgICAgLy8gICAgIHN0YXJ0RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwicmluZy0yXCIsIFwicmluZy1ibHVlLTUwMFwiKTtcbiAgICAgICAgICAgIC8vICAgICBzdGFydEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGREcmFnZ2FibGVFbGVtZW50KGNvbnRlbnQsIHRhZyA9IFwiZGl2XCIsIGlzSW1hZ2UgPSBmYWxzZSkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IFwiZHJhZy1kcm9wIHctZml0XCI7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZGF0YS1pZFwiLCBlbGVtZW50Q291bnRlcisrKTtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjsgLy8gRW5zdXJlcyBQbGFpbkRyYWdnYWJsZSB3b3JrcyBwcm9wZXJseVxuXG4gICAgICAgIGlmIChpc0ltYWdlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnNyYyA9IGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICBjcmVhdGVEcmFnZ2FibGUoZWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGFkZGluZyB0ZXh0XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGQtdGV4dFwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBhZGREcmFnZ2FibGVFbGVtZW50KFwid3JpdGUgc29tZXRoaW5nXCIpO1xuICAgIH0pO1xuXG4gICAgLy8gSGFuZGxlIGFkZGluZyBpbWFnZXNcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkZC1pbWFnZVwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBhZGREcmFnZ2FibGVFbGVtZW50KFwiaHR0cHM6Ly9waWNzdW0ucGhvdG9zLzIwMFwiLCBcImltZ1wiLCB0cnVlKTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCBjbGljayBsaXN0ZW5lciB0byB0aGUgY2FudmFzIHRvIHJlc2V0IHRoZSBzdGFydCBlbGVtZW50XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChzdGFydEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHN0YXJ0RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwicmluZy0yXCIsIFwicmluZy1ibHVlLTUwMFwiKTtcbiAgICAgICAgICAgIHN0YXJ0RWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGNhbnZhcztcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgY2xpcGJvYXJkRGF0YSA9IGV2ZW50LmNsaXBib2FyZERhdGE7XG4gICAgICAgIGlmICghY2xpcGJvYXJkRGF0YSkgcmV0dXJuO1xuXG4gICAgICAgIGxldCBjb250ZW50QWRkZWQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgY2xpcGJvYXJkRGF0YS5pdGVtcykge1xuICAgICAgICAgICAgaWYgKGl0ZW0ua2luZCA9PT0gJ3N0cmluZycgJiYgaXRlbS50eXBlID09PSAndGV4dC9odG1sJykge1xuICAgICAgICAgICAgICAgIGl0ZW0uZ2V0QXNTdHJpbmcoKGh0bWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coaHRtbClcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaHRtbERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBodG1sRGl2LmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgICAgICAgICAgICAgIGh0bWxEaXYuc3R5bGUuYm9yZGVyID0gJzFweCBkYXNoZWQgYmx1ZSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChodG1sRGl2KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChpdGVtLmtpbmQgPT09ICdmaWxlJyAmJiBpdGVtLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBmaWxlID0gaXRlbS5nZXRBc0ZpbGUoKTtcbiAgICAgICAgICAgIC8vICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICAvLyBUT0RPIHVwbG9hZCBmaWxlXG4gICAgICAgICAgICAvLyAgICAgICAgIGNvbnN0IGltYWdlVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgICAgICAvLyAgICAgICAgIGltZy5zcmMgPSBpbWFnZVVybDtcbiAgICAgICAgICAgIC8vICAgICAgICAgaW1nLnN0eWxlLm1heFdpZHRoID0gJzEwMCUnO1xuICAgICAgICAgICAgLy8gICAgICAgICBpbWcuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCBibGFjayc7XG4gICAgICAgICAgICAvLyAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbWcpO1xuICAgICAgICAgICAgLy8gICAgICAgICBjcmVhdGVEcmFnZ2FibGUoaW1nKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgY29udGVudEFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbnRlbnRBZGRlZCkge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dC9wbGFpbicpO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgdGV4dERpdi50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICAgICAgdGV4dERpdi5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkIGJsYWNrJztcbiAgICAgICAgICAgICAgICB0ZXh0RGl2LnN0eWxlLnBhZGRpbmcgPSAnNXB4JztcbiAgICAgICAgICAgICAgICB0ZXh0RGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZjlmOWY5JztcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGV4dERpdik7XG4gICAgICAgICAgICAgICAgY29udGVudEFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29udGVudEFkZGVkKSB7XG4gICAgICAgICAgICBjb25zdCBodG1sID0gY2xpcGJvYXJkRGF0YS5nZXREYXRhKCd0ZXh0L2h0bWwnKTtcbiAgICAgICAgICAgIGlmIChodG1sKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaHRtbERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgIGh0bWxEaXYuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgICAgICAgICBodG1sRGl2LnN0eWxlLmJvcmRlciA9ICcxcHggZGFzaGVkIGJsdWUnO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChodG1sRGl2KTtcbiAgICAgICAgICAgICAgICBjb250ZW50QWRkZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb250ZW50QWRkZWQpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdObyBzdXBwb3J0ZWQgY29udGVudCBkZXRlY3RlZC4nKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgZHJvcFpvbmUgPSBjYW52YXM7XG4gICAgZHJvcFpvbmUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZHJvcFpvbmUuc3R5bGUuYm9yZGVyQ29sb3IgPSAnYmx1ZSc7XG4gICAgfSk7XG5cbiAgICBkcm9wWm9uZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCAoKSA9PiB7XG4gICAgICAgIGRyb3Bab25lLnN0eWxlLmJvcmRlckNvbG9yID0gJ2dyYXknO1xuICAgIH0pO1xuXG4gICAgZHJvcFpvbmUuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBkcm9wWm9uZS5zdHlsZS5ib3JkZXJDb2xvciA9ICdncmF5JztcblxuICAgICAgICBjb25zdCBkYXRhVHJhbnNmZXIgPSBldmVudC5kYXRhVHJhbnNmZXI7XG4gICAgICAgIGlmICghZGF0YVRyYW5zZmVyKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgZmlsZSA9IGRhdGFUcmFuc2Zlci5maWxlc1swXTtcbiAgICAgICAgaWYgKGZpbGUgJiYgZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgICAgICBjb25zdCBpbWFnZVVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW1hZ2UgVVJMIChmcm9tIGZpbGUpOicsIGltYWdlVXJsKTtcblxuICAgICAgICAgICAgZGlzcGxheUltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IGdldERyYWdnZWRJbWFnZVVybChkYXRhVHJhbnNmZXIuaXRlbXMpO1xuICAgICAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbWFnZSBVUkwgKGZyb20gYnJvd3Nlcik6JywgdXJsKTtcbiAgICAgICAgICAgICAgICBkaXNwbGF5SW1hZ2UodXJsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ1BsZWFzZSBkcm9wIGEgdmFsaWQgaW1hZ2Ugb3IgYW4gaW1hZ2UgVVJMLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXREcmFnZ2VkSW1hZ2VVcmwgPSBhc3luYyAoaXRlbXM6IERhdGFUcmFuc2Zlckl0ZW1MaXN0KTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbSlcbiAgICAgICAgICAgIGlmIChpdGVtLmtpbmQgPT09ICdzdHJpbmcnICYmIGl0ZW0udHlwZSA9PT0gJ3RleHQvdXJpLWxpc3QnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2V0QXNTdHJpbmcoKHVybCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1cmwpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgY29uc3QgZGlzcGxheUltYWdlID0gKGltYWdlVXJsOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgIGltZy5zcmMgPSBpbWFnZVVybDtcbiAgICAgICAgaW1nLnN0eWxlLm1heFdpZHRoID0gJzEwMCUnO1xuICAgICAgICBpbWcuc3R5bGUubWF4SGVpZ2h0ID0gJzEwMCUnO1xuICAgICAgICBkcm9wWm9uZS50ZXh0Q29udGVudCA9ICcnO1xuICAgICAgICBkcm9wWm9uZS5hcHBlbmRDaGlsZChpbWcpO1xuICAgIH07XG59KTtcblxuZnVuY3Rpb24gZ2V0SFRNTCgpIHtcbiAgICAvLyBjb25zdCBkZWZzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZWFkZXItbGluZS1kZWZzXCIpO1xuICAgIC8vIGNvbnN0IGxpbmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImxlYWRlci1saW5lXCIpO1xuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xuXG4gICAgLy8gY29tYmluZSBhbGwgdGhlIGVsZW1lbnRzIGludG8gYSBzaGFkb3cgZGl2XG4gICAgLy8gY29uc3Qgc2hhZG93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAvLyBzaGFkb3cuYXBwZW5kQ2hpbGQoZGVmcy5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgIC8vIHNoYWRvdy5hcHBlbmRDaGlsZChjYW52YXMuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gICAgIHNoYWRvdy5hcHBlbmRDaGlsZChsaW5lc1tpXS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgIC8vIH1cbiAgICAvLyByZXR1cm4gc2hhZG93LmlubmVySFRNTDtcbiAgICByZXR1cm4gY2FudmFzLmlubmVySFRNTDtcbn1cbndpbmRvdy5nZXRIVE1MID0gZ2V0SFRNTDsiXSwKICAibWFwcGluZ3MiOiAiOztBQVdBLE1BQUksT0FBTyxNQUFPO0FBQWxCLE1BRUEsWUFBWTtBQUZaLE1BV0EsUUFBUSxDQUFDO0FBRVQsTUFBSSxjQUFjLE9BQU8seUJBQXlCLE9BQU8sNEJBQTRCLE9BQU8sK0JBQStC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LFFBQVEsS0FBSyxLQUFLLFdBQVcsUUFBUSxHQUFHO0FBQ3hDLGNBQU0sV0FBVyxJQUFJLGdCQUFnQixJQUFJO0FBQ3pDLGdCQUFRLElBQUksMEJBQTBCLFFBQVE7QUFFOUMscUJBQWEsUUFBUTtBQUFBLE1BQ3pCLE9BQU87QUFDSCxjQUFNLE1BQU0sTUFBTSxtQkFBbUIsYUFBYSxLQUFLO0FBQ3ZELFlBQUksS0FBSztBQUNMLGtCQUFRLElBQUksNkJBQTZCLEdBQUc7QUFDNUMsdUJBQWEsR0FBRztBQUFBLFFBQ3BCLE9BQU87QUFDSCxnQkFBTSw0Q0FBNEM7QUFBQSxRQUN0RDtBQUFBLE1BQ0o7QUFBQSxJQUNKLENBQUM7QUFFRCxVQUFNLHFCQUFxQixPQUFPLFVBQXdEO0FBQ3RGLGlCQUFXLFFBQVEsT0FBTztBQUN0QixnQkFBUSxJQUFJLElBQUk7QUFDaEIsWUFBSSxLQUFLLFNBQVMsWUFBWSxLQUFLLFNBQVMsaUJBQWlCO0FBQ3pELGlCQUFPLElBQUksUUFBUSxDQUFDLFlBQVk7QUFDNUIsaUJBQUssWUFBWSxDQUFDLFFBQVE7QUFDdEIsc0JBQVEsR0FBRztBQUFBLFlBQ2YsQ0FBQztBQUFBLFVBQ0wsQ0FBQztBQUFBLFFBQ0w7QUFBQSxNQUNKO0FBQ0EsYUFBTztBQUFBLElBQ1g7QUFFQSxVQUFNLGVBQWUsQ0FBQyxhQUFxQjtBQUN2QyxZQUFNLE1BQU0sU0FBUyxjQUFjLEtBQUs7QUFDeEMsVUFBSSxNQUFNO0FBQ1YsVUFBSSxNQUFNLFdBQVc7QUFDckIsVUFBSSxNQUFNLFlBQVk7QUFDdEIsZUFBUyxjQUFjO0FBQ3ZCLGVBQVMsWUFBWSxHQUFHO0FBQUEsSUFDNUI7QUFBQSxFQUNKLENBQUM7QUFFRCxXQUFTLFVBQVU7QUFHZixVQUFNLFNBQVMsU0FBUyxlQUFlLFFBQVE7QUFVL0MsV0FBTyxPQUFPO0FBQUEsRUFDbEI7QUFDQSxTQUFPLFVBQVU7IiwKICAibmFtZXMiOiBbInJlcXVlc3RJRCIsICJQb2ludGVyRXZlbnQiLCAibW92ZSIsICJwcm9wVmFsdWUiLCAiYWRkIiwgInJlbW92ZSIsICJfY2xhc3NDYWxsQ2hlY2siLCAiX2RlZmluZVByb3BlcnRpZXMiLCAiX2NyZWF0ZUNsYXNzIiwgIl90eXBlb2YiLCAib2JqIiwgIk1TUEYiLCAicmVxdWVzdEFuaW0iLCAiY2FuY2VsQW5pbSIsICJyZXF1ZXN0SUQiLCAidmFsdWUiLCAic25hcFRhcmdldHMiLCAiZXhwYW5kZWQiLCAic3RlcCIsICJleHBhbmRlZFhZIiwgIm9wdGlvbnMiLCAibmV3T3B0aW9ucyIsICJjb3JuZXJzIiwgImNvcm5lciIsICJwYXJzZWRTbmFwVGFyZ2V0cyIsICJwYXJzZWRYWSIsICJQbGFpbkRyYWdnYWJsZSIsICJyZW1vdmUiLCAicG9zaXRpb24iXQp9Cg==
