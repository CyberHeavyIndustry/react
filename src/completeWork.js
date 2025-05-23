import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  mergeLane,
  NoFlags,
  NoLanes,
  Snapshot,
  Update,
} from "./constants";
import {
  appendChildren,
  createElement,
  diffProperties,
  setInitialProps,
} from "./dom";

// 传递副作用标记
function bubbleProperties(completedWork) {
  let newChildLanes = NoLanes;
  let subtreeFlags = NoFlags;

  let child = completedWork.child;
  while (child !== null) {
    newChildLanes = mergeLane(
      newChildLanes,
      mergeLane(child.lanes, child.childLanes),
    );
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags |= subtreeFlags;
  completedWork.childLanes = newChildLanes;
}

export default function completeWork(workInProgress) {
  const current = workInProgress.alternate;
  switch (workInProgress.tag) {
    case HostRoot:
      if (!current.child) {
        workInProgress.flags |= Snapshot;
      }
      break;
    case FunctionComponent:
    case ClassComponent:
    case Fragment:
      break;
    case HostComponent:
      // 更新
      if (current && workInProgress.stateNode) {
        // 未发生任何更新
        if (current.memoizedProps === workInProgress.pendingProps) {
          return;
        }
        // 发生了更新
        const updatePayload = diffProperties(
          current.memoizedProps,
          workInProgress.pendingProps,
        );
        workInProgress.updateQueue = updatePayload;
        // 如果收集到了更新，就给当前 fiber 打上标签，等待 commit 处理。
        if (updatePayload) {
          workInProgress.flags |= Update;
        }

        // 更新指向 双缓存
        workInProgress.stateNode.internalFiber = workInProgress;
        break;
      }
      // 新增
      const instance = createElement(workInProgress);
      appendChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      instance.internalFiber = workInProgress;
      setInitialProps(instance, workInProgress.pendingProps);
      break;
    case HostText:
      const newText = workInProgress.pendingProps;
      if (current && workInProgress.stateNode != null) {
        const oldText = current.memoizedProps;
        if (oldText !== newText) {
          workInProgress.flags |= Update;
        }
      } else {
        workInProgress.stateNode = document.createTextNode(
          workInProgress.pendingProps,
        );
      }
      break;
    default:
      return;
  }
  bubbleProperties(workInProgress);
}
