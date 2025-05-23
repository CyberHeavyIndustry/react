import { createWorkInProgress } from "./fiber.js";
import { NoLanes } from "./constants.js";

import commitRoot from "./commit";
import beginWork from "./beginWork";
import completeWork from "./completeWork";

let workInProgress = null;
let renderLanes = NoLanes;

function renderRootSync() {
  while (workInProgress) {
    const current = workInProgress.alternate;
    const next = beginWork(current, workInProgress, renderLanes);
    workInProgress.memoizedProps = workInProgress.pendingProps;
    if (next) {
      workInProgress = next;
    } else {
      do {
        completeWork(workInProgress);
        if (workInProgress.sibling) {
          workInProgress = workInProgress.sibling;
          break;
        } else {
          workInProgress = workInProgress.return;
        }
      } while (workInProgress);
    }
  }
}

function prepareFresh(root) {
  workInProgress = createWorkInProgress(root.current, null);
  renderLanes = root.pendingLanes;
}

export default function renderSync(root) {
  // 初始化
  prepareFresh(root);
  // render
  renderRootSync();
  // commit
  commitRoot(root);
}
