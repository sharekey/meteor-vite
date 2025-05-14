// useFind.ts
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { useReducer, useMemo, useEffect, useRef } from "react";
import { Tracker } from "meteor/tracker";
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
  if (cursor !== null && cursor !== void 0 && !(cursor instanceof Mongo.Cursor) && !(cursor._mongo && cursor._cursorDescription)) {
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
  const cursor = useMemo(() => {
    const cursor2 = Tracker.nonreactive(factory);
    if (Meteor.isDevelopment) {
      checkCursor(cursor2);
    }
    return cursor2;
  }, deps);
  const [data, dispatch] = useReducer(
    useFindReducer,
    null,
    () => {
      if (!(cursor instanceof Mongo.Cursor)) {
        return [];
      }
      return fetchData(cursor);
    }
  );
  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) {
      if (!(cursor instanceof Mongo.Cursor)) {
        return;
      }
      const data2 = fetchData(cursor);
      dispatch({ type: "refresh", data: data2 });
    } else {
      didMount.current = true;
    }
    if (!(cursor instanceof Mongo.Cursor)) {
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
var useFindServer = (factory, deps) => Tracker.nonreactive(() => {
  const cursor = factory();
  if (Meteor.isDevelopment) checkCursor(cursor);
  return cursor?.fetch?.() ?? null;
});
var useFind = Meteor.isServer ? useFindServer : useFindClient;
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
var useFind_default = Meteor.isDevelopment ? useFindDev : useFind;

export {
  useFind
};
