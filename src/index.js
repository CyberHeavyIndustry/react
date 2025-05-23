import React from "./react.js";
import { createHostRootFiber } from "./fiber.js";
import listenToAllEvents from "./listenToAllEvents.js";
import { NoLane } from "./constants.js";
import { updateContainer } from "./update.js";
import { flush } from "./seduleSyncCallback.js";

// import App from "./demo/classLife";
// import App from "./demo/diff";
// import App from "./demo/propUpdate";
// import App from "./demo/layoutHook";
import App from "./demo/effect";

const root = {
  container: document.getElementById("root"),
  pendingLanes: NoLane, // 记录所有变更
  callbackPriority: NoLane, // 记录已有的待渲染任务
};

listenToAllEvents(root.container);

const hostRootFiber = createHostRootFiber();

root.current = hostRootFiber;
hostRootFiber.stateNode = root;

flush(() => {
  updateContainer(root, <App />);
});
