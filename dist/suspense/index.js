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

// suspense/index.js
var suspense_exports = {};
__export(suspense_exports, {
  useFind: () => useFind2,
  useSubscribe: () => useSubscribe,
  useTracker: () => useTracker
});
module.exports = __toCommonJS(suspense_exports);
var import_react5 = __toESM(require("react"));
var import_meteor5 = __toESM(require("meteor/meteor"));

// suspense/useFind.ts
var import_meteor2 = require("meteor/meteor");
var import_react2 = require("react");

// useFind.ts
var import_meteor = require("meteor/meteor");
var import_mongo = require("meteor/mongo");
var import_react = require("react");
var import_tracker = require("meteor/tracker");
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
var checkCursor = (cursor) => {
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
  const cursor = (0, import_react.useMemo)(() => {
    const cursor2 = import_tracker.Tracker.nonreactive(factory);
    if (import_meteor.Meteor.isDevelopment) {
      checkCursor(cursor2);
    }
    return cursor2;
  }, deps);
  const [data, dispatch] = (0, import_react.useReducer)(
    useFindReducer,
    null,
    () => {
      if (!(cursor instanceof import_mongo.Mongo.Cursor)) {
        return [];
      }
      return fetchData(cursor);
    }
  );
  const didMount = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
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
var useFindServer = (factory, deps) => import_tracker.Tracker.nonreactive(() => {
  const cursor = factory();
  if (import_meteor.Meteor.isDevelopment) checkCursor(cursor);
  return cursor?.fetch?.() ?? null;
});
var useFind = import_meteor.Meteor.isServer ? useFindServer : useFindClient;
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
var useFind_default = import_meteor.Meteor.isDevelopment ? useFindDev : useFind;

// suspense/useFind.ts
var import_lodash = __toESM(require("lodash.isequal"));
var import_lodash2 = __toESM(require("lodash.remove"));
var cacheMap = /* @__PURE__ */ new Map();
var removeNullCaches = (cacheMap3) => {
  for (const cache of cacheMap3.values()) {
    (0, import_lodash2.default)(cache, (c) => c.counter === 0);
  }
};
var useFindSuspense = (collection, findArgs, deps = []) => {
  (0, import_react2.useEffect)(() => {
    const cachedEntries2 = cacheMap.get(collection);
    const entry2 = cachedEntries2?.find((x) => (0, import_lodash.default)(x.findArgs, findArgs));
    if (entry2) ++entry2.counter;
    removeNullCaches(cacheMap);
    return () => {
      setTimeout(() => {
        const cachedEntries3 = cacheMap.get(collection);
        const entry3 = cachedEntries3?.find((x) => (0, import_lodash.default)(x.findArgs, findArgs));
        if (entry3) --entry3.counter;
        removeNullCaches(cacheMap);
      }, 0);
    };
  }, [findArgs, collection, ...deps]);
  if (findArgs === null) return null;
  const cachedEntries = cacheMap.get(collection);
  const cachedEntry = cachedEntries?.find((x) => (0, import_lodash.default)(x.findArgs, findArgs));
  if (cachedEntry != null) {
    if ("error" in cachedEntry) throw cachedEntry.error;
    if ("result" in cachedEntry) return cachedEntry.result;
    throw cachedEntry.promise;
  }
  const entry = {
    findArgs,
    promise: collection.find(...findArgs).fetchAsync().then(
      (result) => {
        entry.result = result;
      },
      (error) => {
        entry.error = error;
      }
    ),
    counter: 0
  };
  if (cachedEntries != null) cachedEntries.push(entry);
  else cacheMap.set(collection, [entry]);
  throw entry.promise;
};
var useFind2 = import_meteor2.Meteor.isClient ? (collection, findArgs, deps) => useFind(() => findArgs && collection.find(...findArgs), deps) : useFindSuspense;
function useFindDev2(collection, findArgs, deps = []) {
  function warn(expects, pos, arg, type) {
    console.warn(
      `Warning: useFind expected a ${expects} in it's ${pos} argument (${arg}), but got type of \`${type}\`.`
    );
  }
  if (typeof collection !== "object") {
    warn("Mongo Collection", "1st", "reactiveFn", collection);
  }
  return useFindSuspense(collection, findArgs, deps);
}
var useFind_default2 = import_meteor2.Meteor.isDevelopment ? useFindDev2 : useFind2;

// suspense/useSubscribe.ts
var import_react3 = require("react");

// meteor:ejson
var PackageStub = Package?.["ejson"] || {};
var EJSON = PackageStub.EJSON || globalThis.EJSON;

// suspense/useSubscribe.ts
var import_meteor3 = require("meteor/meteor");
var import_lodash3 = __toESM(require("lodash.isequal"));
var import_lodash4 = __toESM(require("lodash.remove"));
var cachedSubscriptions = [];
var useSubscribeSuspenseClient = (name, ...params) => {
  const cachedSubscription = cachedSubscriptions.find((x) => x.name === name && (0, import_lodash3.default)(x.params, params));
  (0, import_react3.useEffect)(() => () => {
    setTimeout(() => {
      const cachedSubscription2 = cachedSubscriptions.find((x) => x.name === name && (0, import_lodash3.default)(x.params, params));
      if (cachedSubscription2) {
        cachedSubscription2.handle?.stop();
        (0, import_lodash4.default)(
          cachedSubscriptions,
          (x) => x.name === cachedSubscription2.name && (0, import_lodash3.default)(x.params, cachedSubscription2.params)
        );
      }
    }, 0);
  }, [name, EJSON.stringify(params)]);
  if (cachedSubscription != null) {
    if ("error" in cachedSubscription) throw cachedSubscription.error;
    if ("result" in cachedSubscription) return cachedSubscription.result;
    throw cachedSubscription.promise;
  }
  const subscription = {
    name,
    params,
    promise: new Promise((resolve, reject) => {
      const h = import_meteor3.Meteor.subscribe(name, ...params, {
        onReady() {
          subscription.result = null;
          subscription.handle = h;
          resolve(h);
        },
        onStop(error) {
          subscription.error = error;
          subscription.handle = h;
          reject(error);
        }
      });
    })
  };
  cachedSubscriptions.push(subscription);
  throw subscription.promise;
};
var useSubscribeSuspenseServer = (name, ...args) => void 0;
var useSubscribeSuspense = import_meteor3.Meteor.isServer ? useSubscribeSuspenseServer : useSubscribeSuspenseClient;
var useSubscribe = useSubscribeSuspense;

// suspense/useTracker.ts
var import_lodash5 = __toESM(require("lodash.isequal"));
var import_tracker2 = require("meteor/tracker");
var import_react4 = require("react");
var import_meteor4 = require("meteor/meteor");
function checkCursor2(data) {
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
var cacheMap2 = /* @__PURE__ */ new Map();
var fur = (x) => x + 1;
var useForceUpdate = () => (0, import_react4.useReducer)(fur, 0)[1];
function resolveAsync(key, promise, deps = []) {
  const cached = cacheMap2.get(key);
  (0, import_react4.useEffect)(() => () => {
    setTimeout(() => {
      if (cached !== void 0 && (0, import_lodash5.default)(cached.deps, deps)) cacheMap2.delete(key);
    }, 0);
  }, [cached, key, ...deps]);
  if (promise === null) return null;
  if (cached !== void 0) {
    if ("error" in cached) throw cached.error;
    if ("result" in cached) {
      const result = cached.result;
      setTimeout(() => {
        cacheMap2.delete(key);
      }, 0);
      return result;
    }
    throw cached.promise;
  }
  const entry = {
    deps,
    promise: new Promise((resolve, reject) => {
      promise.then((result) => {
        entry.result = result;
        resolve(result);
      }).catch((error) => {
        entry.error = error;
        reject(error);
      });
    })
  };
  cacheMap2.set(key, entry);
  throw entry.promise;
}
function useTrackerNoDeps(key, reactiveFn, skipUpdate = null) {
  const { current: refs } = (0, import_react4.useRef)({
    isMounted: false,
    trackerData: null
  });
  const forceUpdate = useForceUpdate();
  if (refs.computation != null) {
    refs.computation.stop();
    delete refs.computation;
  }
  import_tracker2.Tracker.nonreactive(() => import_tracker2.Tracker.autorun(async (c) => {
    refs.computation = c;
    const data = import_tracker2.Tracker.withComputation(c, async () => reactiveFn(c));
    if (c.firstRun) {
      refs.trackerData = data;
    } else if (!skipUpdate || !skipUpdate(await refs.trackerData, await data)) {
      forceUpdate();
    }
  }));
  if (!refs.isMounted) {
    import_meteor4.Meteor.defer(() => {
      if (!refs.isMounted && refs.computation != null) {
        refs.computation.stop();
        delete refs.computation;
      }
    });
  }
  (0, import_react4.useEffect)(() => {
    refs.isMounted = true;
    if (refs.computation == null) {
      if (!skipUpdate) {
        forceUpdate();
      } else {
        import_tracker2.Tracker.nonreactive(() => import_tracker2.Tracker.autorun(async (c) => {
          const data = import_tracker2.Tracker.withComputation(c, async () => reactiveFn(c));
          refs.computation = c;
          if (!skipUpdate(await refs.trackerData, await data)) {
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
  return resolveAsync(key, refs.trackerData);
}
var useTrackerWithDeps = (key, reactiveFn, deps, skipUpdate = null) => {
  const forceUpdate = useForceUpdate();
  const { current: refs } = (0, import_react4.useRef)({ reactiveFn });
  refs.reactiveFn = reactiveFn;
  (0, import_react4.useMemo)(() => {
    const comp = import_tracker2.Tracker.nonreactive(
      () => import_tracker2.Tracker.autorun(async (c) => {
        const data = import_tracker2.Tracker.withComputation(c, async () => refs.reactiveFn(c));
        if (c.firstRun) {
          refs.data = data;
        } else if (!skipUpdate || !skipUpdate(await refs.data, await data)) {
          refs.data = data;
          forceUpdate();
        }
      })
    );
    if (refs.comp != null) refs.comp.stop();
    refs.comp = comp;
    import_meteor4.Meteor.defer(() => {
      if (!refs.isMounted && refs.comp != null) {
        refs.comp.stop();
        delete refs.comp;
      }
    });
  }, deps);
  (0, import_react4.useEffect)(() => {
    refs.isMounted = true;
    if (refs.comp == null) {
      refs.comp = import_tracker2.Tracker.nonreactive(
        () => import_tracker2.Tracker.autorun(async (c) => {
          const data = import_tracker2.Tracker.withComputation(c, async () => refs.reactiveFn());
          if (!skipUpdate || !skipUpdate(await refs.data, await data)) {
            refs.data = data;
            forceUpdate();
          }
        })
      );
    }
    return () => {
      refs.comp.stop();
      delete refs.comp;
      refs.isMounted = false;
    };
  }, deps);
  return resolveAsync(key, refs.data, deps);
};
function useTrackerClient(key, reactiveFn, deps = null, skipUpdate = null) {
  if (deps === null || deps === void 0 || !Array.isArray(deps)) {
    if (typeof deps === "function") {
      skipUpdate = deps;
    }
    return useTrackerNoDeps(key, reactiveFn, skipUpdate);
  } else {
    return useTrackerWithDeps(key, reactiveFn, deps, skipUpdate);
  }
}
var useTrackerServer = (key, reactiveFn) => {
  return resolveAsync(key, import_tracker2.Tracker.nonreactive(reactiveFn));
};
var _useTracker = import_meteor4.Meteor.isServer ? useTrackerServer : useTrackerClient;
function useTrackerDev(key, reactiveFn, deps = null, skipUpdate = null) {
  function warn(expects, pos, arg, type) {
    console.warn(
      `Warning: useTracker expected a ${expects} in it's ${pos} argument (${arg}), but got type of \`${type}\`.`
    );
  }
  if (typeof reactiveFn !== "function") {
    warn("function", "1st", "reactiveFn", reactiveFn);
  }
  if (deps != null && skipUpdate && !Array.isArray(deps) && typeof skipUpdate === "function") {
    warn(
      "array & function",
      "2nd and 3rd",
      "deps, skipUpdate",
      `${typeof deps} & ${typeof skipUpdate}`
    );
  } else {
    if (deps != null && !Array.isArray(deps) && typeof deps !== "function") {
      warn("array or function", "2nd", "deps or skipUpdate", typeof deps);
    }
    if (skipUpdate && typeof skipUpdate !== "function") {
      warn("function", "3rd", "skipUpdate", typeof skipUpdate);
    }
  }
  const data = _useTracker(key, reactiveFn, deps, skipUpdate);
  checkCursor2(data);
  return data;
}
var useTracker = import_meteor4.Meteor.isDevelopment ? useTrackerDev : _useTracker;

// suspense/index.js
if (import_meteor5.default.isDevelopment) {
  const v = import_react5.default.version.split(".");
  if (v[0] < 16 || v[0] == 16 && v[1] < 8) {
    console.warn("react-meteor-data 2.x requires React version >= 16.8.");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useFind,
  useSubscribe,
  useTracker
});
