"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var index_exports = {};
__export(index_exports, {
  useFind: () => useFind,
  useSubscribe: () => useSubscribe,
  useTracker: () => useTracker,
  withTracker: () => withTracker
});
module.exports = __toCommonJS(index_exports);
var import_react4 = __toESM(require("react"));
var import_meteor4 = __toESM(require("meteor/meteor"));

// useTracker.ts
var import_meteor = require("meteor/meteor");
var import_tracker = require("meteor/tracker");
var import_react = require("react");
function checkCursor(data) {
  let shouldWarn = false;
  if (Package.mongo && Package.mongo.Mongo && data && typeof data === "object") {
    if (data instanceof Package.mongo.Mongo.Cursor) {
      shouldWarn = true;
    } else if (Object.getPrototypeOf(data) === Object.prototype) {
      Object.keys(data).forEach((key) => {
        if (data[key] instanceof Package.mongo.Mongo.Cursor) {
          shouldWarn = true;
        }
      });
    }
  }
  if (shouldWarn) {
    console.warn(
      "Warning: your reactive function is returning a Mongo cursor. This value will not be reactive. You probably want to call `.fetch()` on the cursor before returning it."
    );
  }
}
var fur = (x) => x + 1;
var useForceUpdate = () => (0, import_react.useReducer)(fur, 0)[1];
var useTrackerNoDeps = (reactiveFn, skipUpdate = null) => {
  const { current: refs } = (0, import_react.useRef)({
    isMounted: false,
    trackerData: null
  });
  const forceUpdate = useForceUpdate();
  if (refs.computation) {
    refs.computation.stop();
    delete refs.computation;
  }
  import_tracker.Tracker.nonreactive(() => import_tracker.Tracker.autorun((c) => {
    refs.computation = c;
    const data = reactiveFn(c);
    if (c.firstRun) {
      refs.trackerData = data;
    } else if (!skipUpdate || !skipUpdate(refs.trackerData, data)) {
      forceUpdate();
    }
  }));
  if (!refs.isMounted) {
    import_meteor.Meteor.defer(() => {
      if (!refs.isMounted && refs.computation) {
        refs.computation.stop();
        delete refs.computation;
      }
    });
  }
  (0, import_react.useEffect)(() => {
    refs.isMounted = true;
    if (!refs.computation) {
      if (!skipUpdate) {
        forceUpdate();
      } else {
        import_tracker.Tracker.nonreactive(() => import_tracker.Tracker.autorun((c) => {
          const data = reactiveFn(c);
          refs.computation = c;
          if (!skipUpdate(refs.trackerData, data)) {
            forceUpdate();
          }
        }));
      }
    }
    return () => {
      refs.computation?.stop();
      delete refs.computation;
      refs.isMounted = false;
    };
  }, []);
  return refs.trackerData;
};
var useTrackerWithDeps = (reactiveFn, deps, skipUpdate = null) => {
  const forceUpdate = useForceUpdate();
  const { current: refs } = (0, import_react.useRef)({ reactiveFn });
  refs.reactiveFn = reactiveFn;
  (0, import_react.useMemo)(() => {
    const comp = import_tracker.Tracker.nonreactive(
      () => import_tracker.Tracker.autorun((c) => {
        const data = refs.reactiveFn();
        if (c.firstRun) {
          refs.data = data;
        } else if (!skipUpdate || !skipUpdate(refs.data, data)) {
          refs.data = data;
          forceUpdate();
        }
      })
    );
    if (refs.comp) refs.comp.stop();
    refs.comp = comp;
    import_meteor.Meteor.defer(() => {
      if (!refs.isMounted && refs.comp) {
        refs.comp.stop();
        delete refs.comp;
      }
    });
  }, deps);
  (0, import_react.useEffect)(() => {
    refs.isMounted = true;
    if (!refs.comp) {
      refs.comp = import_tracker.Tracker.nonreactive(
        () => import_tracker.Tracker.autorun((c) => {
          const data = refs.reactiveFn(c);
          if (!skipUpdate || !skipUpdate(refs.data, data)) {
            refs.data = data;
            forceUpdate();
          }
        })
      );
    }
    return () => {
      refs.comp?.stop();
      delete refs.comp;
      refs.isMounted = false;
    };
  }, deps);
  return refs.data;
};
function useTrackerClient(reactiveFn, deps = null, skipUpdate = null) {
  if (deps === null || deps === void 0 || !Array.isArray(deps)) {
    if (typeof deps === "function") {
      skipUpdate = deps;
    }
    return useTrackerNoDeps(reactiveFn, skipUpdate);
  } else {
    return useTrackerWithDeps(reactiveFn, deps, skipUpdate);
  }
}
var useTrackerServer = (reactiveFn) => {
  return import_tracker.Tracker.nonreactive(reactiveFn);
};
var _useTracker = import_meteor.Meteor.isServer ? useTrackerServer : useTrackerClient;
function useTrackerDev(reactiveFn, deps = void 0, skipUpdate = null) {
  function warn(expects, pos, arg, type) {
    console.warn(
      `Warning: useTracker expected a ${expects} in it's ${pos} argument (${arg}), but got type of \`${type}\`.`
    );
  }
  if (typeof reactiveFn !== "function") {
    warn("function", "1st", "reactiveFn", reactiveFn);
  }
  if (deps && skipUpdate && !Array.isArray(deps) && typeof skipUpdate === "function") {
    warn(
      "array & function",
      "2nd and 3rd",
      "deps, skipUpdate",
      `${typeof deps} & ${typeof skipUpdate}`
    );
  } else {
    if (deps && !Array.isArray(deps) && typeof deps !== "function") {
      warn("array or function", "2nd", "deps or skipUpdate", typeof deps);
    }
    if (skipUpdate && typeof skipUpdate !== "function") {
      warn("function", "3rd", "skipUpdate", typeof skipUpdate);
    }
  }
  const data = _useTracker(reactiveFn, deps, skipUpdate);
  checkCursor(data);
  return data;
}
var useTracker = import_meteor.Meteor.isDevelopment ? useTrackerDev : _useTracker;

// withTracker.tsx
var import_react2 = __toESM(require("react"));
var withTracker = (options) => {
  return (Component) => {
    const getMeteorData = typeof options === "function" ? options : options.getMeteorData;
    const WithTracker = (0, import_react2.forwardRef)((props, ref) => {
      const data = useTracker(
        () => getMeteorData(props) || {},
        options.skipUpdate
      );
      return (
        // @ts-ignore
        /* @__PURE__ */ import_react2.default.createElement(Component, { ref, ...props, ...data })
      );
    });
    const { pure = true } = options;
    return pure ? (0, import_react2.memo)(WithTracker) : WithTracker;
  };
};

// useFind.ts
var import_meteor2 = require("meteor/meteor");
var import_mongo = require("meteor/mongo");
var import_react3 = require("react");
var import_tracker2 = require("meteor/tracker");
var useFindReducer = (data, action) => {
  switch (action.type) {
    case "refresh":
      return action.data;
    case "addedAt":
      return [
        ...data.slice(0, action.atIndex),
        action.document,
        ...data.slice(action.atIndex)
      ];
    case "changedAt":
      return [
        ...data.slice(0, action.atIndex),
        action.document,
        ...data.slice(action.atIndex + 1)
      ];
    case "removedAt":
      return [
        ...data.slice(0, action.atIndex),
        ...data.slice(action.atIndex + 1)
      ];
    case "movedTo":
      const doc = data[action.fromIndex];
      const copy = [
        ...data.slice(0, action.fromIndex),
        ...data.slice(action.fromIndex + 1)
      ];
      copy.splice(action.toIndex, 0, doc);
      return copy;
  }
};
var checkCursor2 = (cursor) => {
  if (cursor !== null && cursor !== void 0 && !(cursor instanceof import_mongo.Mongo.Cursor) && !(cursor._mongo && cursor._cursorDescription)) {
    console.warn(
      "Warning: useFind requires an instance of Mongo.Cursor. Make sure you do NOT call .fetch() on your cursor."
    );
  }
};
var fetchData = (cursor) => {
  const data = [];
  const observer = cursor.observe({
    addedAt(document, atIndex, before) {
      data.splice(atIndex, 0, document);
    }
  });
  observer.stop();
  return data;
};
var useFindClient = (factory, deps = []) => {
  const cursor = (0, import_react3.useMemo)(() => {
    const cursor2 = import_tracker2.Tracker.nonreactive(factory);
    if (import_meteor2.Meteor.isDevelopment) {
      checkCursor2(cursor2);
    }
    return cursor2;
  }, deps);
  const [data, dispatch] = (0, import_react3.useReducer)(
    useFindReducer,
    null,
    () => {
      if (!(cursor instanceof import_mongo.Mongo.Cursor)) {
        return [];
      }
      return fetchData(cursor);
    }
  );
  const didMount = (0, import_react3.useRef)(false);
  (0, import_react3.useEffect)(() => {
    if (didMount.current) {
      if (!(cursor instanceof import_mongo.Mongo.Cursor)) {
        return;
      }
      const data2 = fetchData(cursor);
      dispatch({ type: "refresh", data: data2 });
    } else {
      didMount.current = true;
    }
    if (!(cursor instanceof import_mongo.Mongo.Cursor)) {
      return;
    }
    const observer = cursor.observe({
      addedAt(document, atIndex, before) {
        dispatch({ type: "addedAt", document, atIndex });
      },
      changedAt(newDocument, oldDocument, atIndex) {
        dispatch({ type: "changedAt", document: newDocument, atIndex });
      },
      removedAt(oldDocument, atIndex) {
        dispatch({ type: "removedAt", atIndex });
      },
      movedTo(document, fromIndex, toIndex, before) {
        dispatch({ type: "movedTo", fromIndex, toIndex });
      },
      // @ts-ignore
      _suppress_initial: true
    });
    return () => {
      observer.stop();
    };
  }, [cursor]);
  return cursor ? data : cursor;
};
var useFindServer = (factory, deps) => import_tracker2.Tracker.nonreactive(() => {
  const cursor = factory();
  if (import_meteor2.Meteor.isDevelopment) checkCursor2(cursor);
  return cursor?.fetch?.() ?? null;
});
var useFind = import_meteor2.Meteor.isServer ? useFindServer : useFindClient;
function useFindDev(factory, deps = []) {
  function warn(expects, pos, arg, type) {
    console.warn(
      `Warning: useFind expected a ${expects} in it's ${pos} argument (${arg}), but got type of \`${type}\`.`
    );
  }
  if (typeof factory !== "function") {
    warn("function", "1st", "reactiveFn", factory);
  }
  if (!deps || !Array.isArray(deps)) {
    warn("array", "2nd", "deps", typeof deps);
  }
  return useFind(factory, deps);
}
var useFind_default = import_meteor2.Meteor.isDevelopment ? useFindDev : useFind;

// useSubscribe.ts
var import_meteor3 = require("meteor/meteor");
var useSubscribeClient = (name, ...args) => {
  let updateOnReady = false;
  let subscription;
  const isReady = useTracker(() => {
    if (!name) return true;
    subscription = import_meteor3.Meteor.subscribe(name, ...args);
    return subscription.ready();
  }, () => !updateOnReady);
  return () => {
    updateOnReady = true;
    return !isReady;
  };
};
var useSubscribeServer = (name, ...args) => () => false;
var useSubscribe = import_meteor3.Meteor.isServer ? useSubscribeServer : useSubscribeClient;

// index.js
if (import_meteor4.default.isDevelopment) {
  const v = import_react4.default.version.split(".");
  if (v[0] < 16 || v[0] == 16 && v[1] < 8) {
    console.warn("react-meteor-data 2.x requires React version >= 16.8.");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useFind,
  useSubscribe,
  useTracker,
  withTracker
});
