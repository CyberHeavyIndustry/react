import {
  ChildDeletion,
  FunctionComponent,
  HookHasEffect,
  HookInsertion,
  HookLayout,
  HostComponent,
  HostRoot,
  HostText,
  Placement,
  Update,
} from "../constants";
import { appendChild, insertBefore } from "../dom";
import {
  commitHookEffectListMount,
  commitHookEffectListUnmount,
} from "./commitHook";
import { commitDeletionEffects } from "./commitDeletionEffects";

export const MutationMask = Placement | Update | ChildDeletion;

// 新增、移动、更新 --------------------------------------------------------------------------
function recursivelyTraverseMutationEffects(fiber) {
  const deletions = fiber.deletions;
  if (deletions) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(fiber, childToDelete);
    }
  }

  if (fiber.subtreeFlags & MutationMask) {
    let child = fiber.child;
    while (child !== null) {
      commitMutationEffectsOnFiber(child);
      child = child.sibling;
    }
  }
}

// 寻找父节点
function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (parent.tag === HostComponent || parent.tag === HostRoot) {
      return parent;
    }
    parent = parent.return;
  }
}

// 寻找兄弟节点
function getHostSibling(fiber) {
  let node = fiber;
  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || node.return.tag === HostComponent) {
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.flags & Placement) {
        continue siblings;
      }
      if (node.child === null) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

function insertOrAppendPlacementNode(fiber, before, parent) {
  const isHost = fiber.tag === HostComponent || fiber.tag === HostText;
  if (isHost) {
    const stateNode = fiber.stateNode;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    const child = fiber.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function commitPlacement(fiber) {
  // 找到父节点
  let parent = getHostParentFiber(fiber);

  switch (parent.tag) {
    case HostComponent:
      {
        const parentNode = parent.stateNode;
        const before = getHostSibling(fiber);
        insertOrAppendPlacementNode(fiber, before, parentNode);
      }
      break;
    case HostRoot:
      {
        const parentNode = parent.stateNode.container;
        const before = getHostSibling(fiber);
        insertOrAppendPlacementNode(fiber, before, parentNode);
      }
      break;
    default:
      break;
  }
}

function commitReconciliationEffects(fiber) {
  if (fiber.flags & Placement) {
    commitPlacement(fiber);
    fiber.flags &= ~Placement;
  }
}

// 递归调用的主体
function commitMutationEffectsOnFiber(fiber) {
  recursivelyTraverseMutationEffects(fiber);
  commitReconciliationEffects(fiber);
  switch (fiber.tag) {
    case FunctionComponent:
      if (fiber.flags & Update) {
        commitHookEffectListUnmount(HookInsertion | HookHasEffect, fiber);
        commitHookEffectListMount(HookInsertion | HookHasEffect, fiber);
        commitHookEffectListUnmount(HookLayout | HookHasEffect, fiber);
      }
      break;
    case HostComponent:
      if (fiber.flags & Update) {
        // dom 属性更新
        const node = fiber.stateNode;
        const updatePayload = fiber.updateQueue;
        if (node && updatePayload) {
          fiber.updateQueue = null;
          for (let i = 0; i < updatePayload.length; i += 2) {
            const propKey = updatePayload[i];
            const propValue = updatePayload[i + 1];
            if (propKey === "style") {
              Object.entries(propValue).forEach(([key, value]) => {
                node.style[key] = value;
              });
            } else if (propKey === "children") {
              node.textContent = propValue;
            } else {
              node.setAttribute(propKey, propValue);
            }
          }
        }

        // 更新 dom 属性
      }
      break;
    case HostText:
      if (fiber.flags & Update) {
        const textInstance = fiber.stateNode;
        textInstance.nodeValue = fiber.memoizedProps;
      }
      break;
    default:
      break;
  }
}

export default function commitMutationEffects(fiber) {
  commitMutationEffectsOnFiber(fiber);
}
