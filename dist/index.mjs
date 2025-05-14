import {
  useFind
} from "./chunk-2YTKLEMT.mjs";

// index.js
import React2 from "react";
import { Meteor as Meteor3 } from "meteor/meteor";

// useTracker.ts
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { useReducer, useEffect, useRef, useMemo } from "react";
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
var useForceUpdate = () => useReducer(fur, 0)[1];
var useTrackerNoDeps = (reactiveFn, skipUpdate = null) => {
  const { current: refs } = useRef({
    isMounted: false,
    trackerData: null
  });
  const forceUpdate = useForceUpdate();
  if (refs.computation) {
    refs.computation.stop();
    delete refs.computation;
  }
  Tracker.nonreactive(() => Tracker.autorun((c) => {
    refs.computation = c;
    const data = reactiveFn(c);
    if (c.firstRun) {
      refs.trackerData = data;
    } else if (!skipUpdate || !skipUpdate(refs.trackerData, data)) {
      forceUpdate();
    }
  }));
  if (!refs.isMounted) {
    Meteor.defer(() => {
      if (!refs.isMounted && refs.computation) {
        refs.computation.stop();
        delete refs.computation;
      }
    });
  }
  useEffect(() => {
    refs.isMounted = true;
    if (!refs.computation) {
      if (!skipUpdate) {
        forceUpdate();
      } else {
        Tracker.nonreactive(() => Tracker.autorun((c) => {
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
  const { current: refs } = useRef({ reactiveFn });
  refs.reactiveFn = reactiveFn;
  useMemo(() => {
    const comp = Tracker.nonreactive(
      () => Tracker.autorun((c) => {
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
    Meteor.defer(() => {
      if (!refs.isMounted && refs.comp) {
        refs.comp.stop();
        delete refs.comp;
      }
    });
  }, deps);
  useEffect(() => {
    refs.isMounted = true;
    if (!refs.comp) {
      refs.comp = Tracker.nonreactive(
        () => Tracker.autorun((c) => {
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
  return Tracker.nonreactive(reactiveFn);
};
var _useTracker = Meteor.isServer ? useTrackerServer : useTrackerClient;
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
var useTracker = Meteor.isDevelopment ? useTrackerDev : _useTracker;

// withTracker.tsx
import React, { forwardRef, memo } from "react";
var withTracker = (options) => {
  return (Component) => {
    const getMeteorData = typeof options === "function" ? options : options.getMeteorData;
    const WithTracker = forwardRef((props, ref) => {
      const data = useTracker(
        () => getMeteorData(props) || {},
        options.skipUpdate
      );
      return (
        // @ts-ignore
        /* @__PURE__ */ React.createElement(Component, { ref, ...props, ...data })
      );
    });
    const { pure = true } = options;
    return pure ? memo(WithTracker) : WithTracker;
  };
};

// useSubscribe.ts
import { Meteor as Meteor2 } from "meteor/meteor";
var useSubscribeClient = (name, ...args) => {
  let updateOnReady = false;
  let subscription;
  const isReady = useTracker(() => {
    if (!name) return true;
    subscription = Meteor2.subscribe(name, ...args);
    return subscription.ready();
  }, () => !updateOnReady);
  return () => {
    updateOnReady = true;
    return !isReady;
  };
};
var useSubscribeServer = (name, ...args) => () => false;
var useSubscribe = Meteor2.isServer ? useSubscribeServer : useSubscribeClient;

// index.js
if (Meteor3.isDevelopment) {
  const v = React2.version.split(".");
  if (v[0] < 16 || v[0] == 16 && v[1] < 8) {
    console.warn("react-meteor-data 2.x requires React version >= 16.8.");
  }
}
export {
  useFind,
  useSubscribe,
  useTracker,
  withTracker
};
