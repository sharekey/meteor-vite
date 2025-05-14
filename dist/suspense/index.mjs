import {
  useFind
} from "../chunk-2YTKLEMT.mjs";

// suspense/index.js
import React from "react";
import { Meteor as Meteor4 } from "meteor/meteor";

// suspense/useFind.ts
import { Meteor } from "meteor/meteor";
import { useEffect } from "react";
import isEqual from "lodash.isequal";
import remove from "lodash.remove";
var cacheMap = /* @__PURE__ */ new Map();
var removeNullCaches = (cacheMap3) => {
  for (const cache of cacheMap3.values()) {
    remove(cache, (c) => c.counter === 0);
  }
};
var useFindSuspense = (collection, findArgs, deps = []) => {
  useEffect(() => {
    const cachedEntries2 = cacheMap.get(collection);
    const entry2 = cachedEntries2?.find((x) => isEqual(x.findArgs, findArgs));
    if (entry2) ++entry2.counter;
    removeNullCaches(cacheMap);
    return () => {
      setTimeout(() => {
        const cachedEntries3 = cacheMap.get(collection);
        const entry3 = cachedEntries3?.find((x) => isEqual(x.findArgs, findArgs));
        if (entry3) --entry3.counter;
        removeNullCaches(cacheMap);
      }, 0);
    };
  }, [findArgs, collection, ...deps]);
  if (findArgs === null) return null;
  const cachedEntries = cacheMap.get(collection);
  const cachedEntry = cachedEntries?.find((x) => isEqual(x.findArgs, findArgs));
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
var useFind2 = Meteor.isClient ? (collection, findArgs, deps) => useFind(() => findArgs && collection.find(...findArgs), deps) : useFindSuspense;
function useFindDev(collection, findArgs, deps = []) {
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
var useFind_default = Meteor.isDevelopment ? useFindDev : useFind2;

// suspense/useSubscribe.ts
import { useEffect as useEffect2 } from "react";

// meteor:ejson
var PackageStub = Package?.["ejson"] || {};
var EJSON = PackageStub.EJSON || globalThis.EJSON;

// suspense/useSubscribe.ts
import { Meteor as Meteor2 } from "meteor/meteor";
import isEqual2 from "lodash.isequal";
import remove2 from "lodash.remove";
var cachedSubscriptions = [];
var useSubscribeSuspenseClient = (name, ...params) => {
  const cachedSubscription = cachedSubscriptions.find((x) => x.name === name && isEqual2(x.params, params));
  useEffect2(() => () => {
    setTimeout(() => {
      const cachedSubscription2 = cachedSubscriptions.find((x) => x.name === name && isEqual2(x.params, params));
      if (cachedSubscription2) {
        cachedSubscription2.handle?.stop();
        remove2(
          cachedSubscriptions,
          (x) => x.name === cachedSubscription2.name && isEqual2(x.params, cachedSubscription2.params)
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
      const h = Meteor2.subscribe(name, ...params, {
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
var useSubscribeSuspense = Meteor2.isServer ? useSubscribeSuspenseServer : useSubscribeSuspenseClient;
var useSubscribe = useSubscribeSuspense;

// suspense/useTracker.ts
import isEqual3 from "lodash.isequal";
import { Tracker } from "meteor/tracker";
import { useEffect as useEffect3, useMemo, useReducer, useRef } from "react";
import { Meteor as Meteor3 } from "meteor/meteor";
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
var cacheMap2 = /* @__PURE__ */ new Map();
var fur = (x) => x + 1;
var useForceUpdate = () => useReducer(fur, 0)[1];
function resolveAsync(key, promise, deps = []) {
  const cached = cacheMap2.get(key);
  useEffect3(() => () => {
    setTimeout(() => {
      if (cached !== void 0 && isEqual3(cached.deps, deps)) cacheMap2.delete(key);
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
  const { current: refs } = useRef({
    isMounted: false,
    trackerData: null
  });
  const forceUpdate = useForceUpdate();
  if (refs.computation != null) {
    refs.computation.stop();
    delete refs.computation;
  }
  Tracker.nonreactive(() => Tracker.autorun(async (c) => {
    refs.computation = c;
    const data = Tracker.withComputation(c, async () => reactiveFn(c));
    if (c.firstRun) {
      refs.trackerData = data;
    } else if (!skipUpdate || !skipUpdate(await refs.trackerData, await data)) {
      forceUpdate();
    }
  }));
  if (!refs.isMounted) {
    Meteor3.defer(() => {
      if (!refs.isMounted && refs.computation != null) {
        refs.computation.stop();
        delete refs.computation;
      }
    });
  }
  useEffect3(() => {
    refs.isMounted = true;
    if (refs.computation == null) {
      if (!skipUpdate) {
        forceUpdate();
      } else {
        Tracker.nonreactive(() => Tracker.autorun(async (c) => {
          const data = Tracker.withComputation(c, async () => reactiveFn(c));
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
  const { current: refs } = useRef({ reactiveFn });
  refs.reactiveFn = reactiveFn;
  useMemo(() => {
    const comp = Tracker.nonreactive(
      () => Tracker.autorun(async (c) => {
        const data = Tracker.withComputation(c, async () => refs.reactiveFn(c));
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
    Meteor3.defer(() => {
      if (!refs.isMounted && refs.comp != null) {
        refs.comp.stop();
        delete refs.comp;
      }
    });
  }, deps);
  useEffect3(() => {
    refs.isMounted = true;
    if (refs.comp == null) {
      refs.comp = Tracker.nonreactive(
        () => Tracker.autorun(async (c) => {
          const data = Tracker.withComputation(c, async () => refs.reactiveFn());
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
  return resolveAsync(key, Tracker.nonreactive(reactiveFn));
};
var _useTracker = Meteor3.isServer ? useTrackerServer : useTrackerClient;
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
  checkCursor(data);
  return data;
}
var useTracker = Meteor3.isDevelopment ? useTrackerDev : _useTracker;

// suspense/index.js
if (Meteor4.isDevelopment) {
  const v = React.version.split(".");
  if (v[0] < 16 || v[0] == 16 && v[1] < 8) {
    console.warn("react-meteor-data 2.x requires React version >= 16.8.");
  }
}
export {
  useFind2 as useFind,
  useSubscribe,
  useTracker
};
