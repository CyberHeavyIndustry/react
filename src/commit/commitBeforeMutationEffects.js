import {ClassComponent, HostRoot, NoFlags, Snapshot} from "../constants";
import {clearContainer} from "../dom";

let fiber = null; // 当前的工作节点  fiber

function commitBeforeMutationEffectsOnFiber(fiber) {
    const flags = fiber.flags;
    if ((flags & Snapshot) !== NoFlags) {
        switch (fiber.tag) {
            case HostRoot:
                const root = fiber.stateNode;
                clearContainer(root.container);
                break;
            case ClassComponent: // 执行声明周期函数
                const current = fiber.alternate;
                const instance = fiber.stateNode;
                const snapshot = instance.getSnapshotBeforeUpdate(
                    current.memoizedProps, current.memoizedState
                );
                instance.__reactInternalSnapshotBeforeUpdate = snapshot;
                break;
            default:
                throw new Error('should not have side-effect');
        }
    }
}


function loop() {
    while (fiber) {
        // 当前子 fiber 存在 Snapshot 标记，继续下钻
        if ((fiber.subtreeFlags & Snapshot) !== NoFlags && fiber.child) {
            fiber = fiber.child;
        } else {
            // 执行副作用并上卷
            while (fiber) {
                commitBeforeMutationEffectsOnFiber(fiber);
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


export default function commitBeforeMutationEffects(root, finishedWork) {
    fiber = finishedWork;
    loop();
}
