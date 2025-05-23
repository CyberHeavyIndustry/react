import {
  ClassComponent,
  FunctionComponent,
  HookHasEffect,
  HookLayout,
  NoFlags,
  Update,
} from "../constants";
import { commitHookEffectListMount } from "./commitHook";

let fiber = null; // 当前的工作节点  fiber

const LayoutMask = Update;

function commitLayoutEffectOnFiber(fiber) {
  const flags = fiber.flags;
  if (flags & LayoutMask) {
    switch (fiber.tag) {
      case ClassComponent: {
        const current = fiber.alternate;
        const instance = fiber.stateNode;
        if (!current) {
          instance.componentDidMount();
        } else {
          instance.componentDidUpdate(
            current.memoizedProps,
            current.memoizedState,
            instance.__reactInternalSnapshotBeforeUpdate,
          );
        }
        break;
      }
      case FunctionComponent: {
        commitHookEffectListMount(HookLayout | HookHasEffect, fiber);
        break;
      }
    }
  }
}

function loop() {
  while (fiber) {
    // 当前子 fiber 存在 Snapshot 标记，继续下钻
    if ((fiber.subtreeFlags & LayoutMask) !== NoFlags && fiber.child) {
      fiber = fiber.child;
    } else {
      // 执行副作用并上卷
      while (fiber) {
        commitLayoutEffectOnFiber(fiber);
        // 处理兄弟节点
        if (fiber.sibling) {
          fiber = fiber.sibling;
          break;
        }
        // 上卷
        fiber = fiber.return;
      }
    }
  }
}

export default function commitLayoutEffects(finishedWork) {
  fiber = finishedWork;
  loop();
}
