import {
  ChildDeletion,
  FunctionComponent,
  HookHasEffect,
  HookPassive,
  NoFlags,
  Passive,
} from "../constants";
import {
  commitHookEffectListMount,
  commitHookEffectListUnmount,
} from "./commitHook";

const PassiveMask = Passive | ChildDeletion;

let fiber = null;
let deleteFiber = null;

function commitUnmountForDelete(fiber) {
  switch (fiber.tag) {
    case FunctionComponent:
      commitHookEffectListUnmount(HookPassive, fiber);
      break;
  }
}

function deleteLoop() {
  while (deleteFiber) {
    const fiber = deleteFiber;
    commitUnmountForDelete(deleteFiber);
    const child = fiber.child;
    if (child) {
      deleteFiber = child;
    } else {
      while (deleteFiber) {
        const sibling = deleteFiber.sibling;
        if (sibling) {
          deleteFiber = sibling;
          break;
        }
        deleteFiber = deleteFiber.return;
      }
    }
  }
}

function commitPassiveUnmountOnFiber(fiber) {
  if (fiber.flags & Passive) {
    switch (fiber.tag) {
      case FunctionComponent:
        commitHookEffectListUnmount(HookPassive | HookHasEffect, fiber);
        break;
    }
  }
}

function commitPassiveMountOnFiber(fiber) {
  if (fiber.flags & Passive) {
    switch (fiber.tag) {
      case FunctionComponent:
        commitHookEffectListMount(HookPassive | HookHasEffect, fiber);
        break;
    }
  }
}

function unmountLoop() {
  while (fiber) {
    // 删除逻辑
    if ((fiber.flags & ChildDeletion) !== NoFlags && fiber.deletions) {
      for (let i = 0; i < fiber.deletions.length; i++) {
        deleteFiber = fiber.deletions[i];
        deleteLoop();
      }
    }

    // 当前子 fiber 存在 PassiveMask
    if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && fiber.child) {
      fiber = fiber.child;
    } else {
      // 执行副作用并上卷
      while (fiber) {
        commitPassiveUnmountOnFiber(fiber);
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

function mountLoop() {
  while (fiber) {
    if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && fiber.child) {
      fiber = fiber.child;
    } else {
      while (fiber) {
        commitPassiveMountOnFiber(fiber);
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

// 清理函数
function commitPassiveUnmountEffects(current) {
  fiber = current;
  unmountLoop();
}

// 新 create
function commitPassiveMountEffects(current) {
  fiber = current;
  mountLoop();
}

export default function flushPassiveEffects(root) {
  commitPassiveUnmountEffects(root.current);
  commitPassiveMountEffects(root.current);
}
