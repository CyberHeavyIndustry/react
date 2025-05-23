import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  includesSomeLane,
  NoLane,
  Snapshot,
  Update,
} from "./constants";
import { renderWithHooks } from "./hooks";
import reconciler from "./reconciler";
import { createWorkInProgress } from "./fiber";

// 复用子节点
function bailout(current, workInProgress) {
  let currentChild = current.child;
  if (currentChild === null) {
    return null;
  }

  let result = null;
  let prevChild = null;

  while (currentChild) {
    const newChild = createWorkInProgress(
      currentChild,
      currentChild.memoizedProps,
    );
    newChild.return = workInProgress;
    if (result === null) {
      result = newChild;
      workInProgress.child = result;
    } else {
      prevChild.sibling = newChild;
    }
    prevChild = newChild;
    currentChild = currentChild.sibling;
  }

  return result;
}

// begin Work 处理 class 组件
function updateClassComponent(current, workInProgress) {
  if (!current) {
    const instance = new workInProgress.type(workInProgress.pendingProps);
    instance._reactFiber = workInProgress;
    workInProgress.stateNode = instance;
    workInProgress.memoizedState = instance.state;

    if (typeof instance.componentDidMount === "function") {
      workInProgress.flags |= Update;
    }
    return instance.render();
  } else {
    const instance = workInProgress.stateNode;
    let newState = instance.state;
    const pendingState = current.updateQueue.pending;
    let next = pendingState.next;
    do {
      newState = { ...newState, ...next.payload };
      if (next === pendingState) {
        break;
      }
      next = next.next;
    } while (next);

    // 添加声明周期
    if (
      workInProgress.pendingProps !== current.memoizedProps ||
      newState !== current.memoizedState
    ) {
      if (typeof instance.componentDidUpdate === "function") {
        workInProgress.flags |= Update;
      }
      if (typeof instance.getSnapshotBeforeUpdate === "function") {
        workInProgress.flags |= Snapshot;
      }
    }
    instance.state = newState;
    workInProgress.memoizedState = newState;
    return instance.render();
  }
}

export default function beginWork(current, workInProgress, renderLanes) {
  if (current) {
    if (
      current.memoizedProps === workInProgress.pendingProps &&
      !includesSomeLane(workInProgress.lanes, renderLanes)
    ) {
      if (!includesSomeLane(workInProgress.childLanes, renderLanes)) {
        return null;
      }
      return bailout(current, workInProgress);
    }
  }

  let nextChildren = null;
  switch (workInProgress.tag) {
    case HostRoot:
      nextChildren = workInProgress.updateQueue.pending.payload;
      workInProgress.updateQueue.pending = null;
      break;
    case Fragment:
      nextChildren = workInProgress.pendingProps;
      break;
    case HostComponent:
      const children = workInProgress.pendingProps.children;
      nextChildren =
        typeof children === "string" || typeof children === "number"
          ? null
          : children;
      break;
    case HostText:
      nextChildren = null;
      break;
    case FunctionComponent:
      nextChildren = renderWithHooks(current, workInProgress);
      break;
    case ClassComponent:
      nextChildren = updateClassComponent(current, workInProgress);
      break;
    default:
      return;
  }

  // 重新构建子 fiber，清除自身标记
  workInProgress.lanes = NoLane;

  // React diff
  workInProgress.child = reconciler(current, workInProgress, nextChildren);
  return workInProgress.child;
}
