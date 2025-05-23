import {
  ClassComponent,
  FunctionComponent,
  HookInsertion,
  HookLayout,
  HostComponent,
  NoHookEffect,
} from "../constants";
import { removeChild } from "../dom";

let hostParent = null;

function commitDeletionEffectsOnFiber(fiber) {
  switch (fiber.tag) {
    case FunctionComponent:
      // 执行 destroy
      const updateQueue = fiber.updateQueue;
      if (updateQueue && updateQueue.lastEffect) {
        const lastEffect = updateQueue.lastEffect;
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
          const { destroy, tag } = effect;
          if (destroy !== undefined) {
            if ((tag & HookInsertion) !== NoHookEffect) {
              destroy();
            } else if ((tag & HookLayout) !== NoHookEffect) {
              destroy();
            }
          }
          effect = effect.next;
        } while (effect !== firstEffect);
      }
      recursivelyTraverseDeletionEffects(fiber);
      break;
    case ClassComponent:
      const instance = fiber.stateNode;
      if (typeof instance.componentWillUnmount === "function") {
        instance.componentWillUnmount();
      }
      recursivelyTraverseDeletionEffects(fiber);
      break;
    case HostComponent:
    default:
      recursivelyTraverseDeletionEffects(fiber);
      break;
  }
}

function recursivelyTraverseDeletionEffects(fiber) {
  let child = fiber.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(child);
    child = child.sibling;
  }
}

// 删除 --------------------------------------------------------------------------
export function commitDeletionEffects(fiber, childToDelete) {
  let parent = fiber;
  while (parent) {
    if (parent.tag === HostComponent) {
      hostParent = parent.stateNode;
      break;
    }
    parent = parent.return;
  }
  let child = null;
  let childFiber = childToDelete;
  while (childFiber) {
    if (childFiber.tag === HostComponent) {
      child = childFiber.stateNode;
      break;
    }
    childFiber = childFiber.child;
  }

  commitDeletionEffectsOnFiber(childToDelete);
  removeChild(hostParent, child);
  hostParent = null;
}
