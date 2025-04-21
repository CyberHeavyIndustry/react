import {mergeLane, SyncLane} from "./constants.js";
import {scheduleSyncCallback} from "./seduleSyncCallback.js";
import renderSync from "./renderSync.js";


// 存储变更、标记变更
function enqueueUpdate(fiber, update) {
    // 链式存储
    const pending = fiber.updateQueue.pending;
    if (!pending) {
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update
    }
    fiber.updateQueue.pending = update;

    // 标记
    fiber.lanes = mergeLane(fiber.lanes, update.lane);

    // 向上遍历，直到顶部
    let node = fiber;
    let parent = fiber.return;
    while (parent) {
        parent.childLanes = mergeLane(parent.childLanes, update.lane)
        node = parent;
        parent = parent.return;
    }
    return node.stateNode;
}

// 调度
export function scheduleUpdate(root, lane) {

    // 全局记录待所有执行的变更
    root.pendingLanes |= lane;

    // 从当前的 pendingLanes 中挑选出最高优先级的变更用于渲染
    const nextLane = lane;

    // 是否已生成了待执行的渲染
    const existingCallbackPriority = root.callbackPriority;

    // 存在渲染任务，则这次变更，将在这次渲染任务中一并处理
    if (nextLane === existingCallbackPriority) {
        return;
    }

    // 生成一次渲染任务，并存储起来
    const newTask = renderSync.bind(null, root);
    scheduleSyncCallback(newTask);
    root.callbackPriority = lane;
}

// 类组件调用 setState
export function classComponentUpdate(instance, partialState) {
    // 生成一个变更
    const update = {
        payload: partialState,
        lane: SyncLane
    }

    // 挂载变更
    const fiber = instance._reactFiber;
    const root = enqueueUpdate(fiber, update);

    // 调度
    scheduleUpdate(root, update.lane)
}

// 入口更新
export function updateContainer(root, element) {
    // 生成一个变更
    const update = {
        payload: element,
        lane: SyncLane
    }

    // 挂载变更
    const fiber = root.current;
    const _root = enqueueUpdate(fiber, update);

    // 调度
    scheduleUpdate(_root, update.lane)
}

// 调用 hooks 更新入队
export function enqueueHookUpdate(fiber, queue, update) {
    // 链式存储
    const pending = queue.pending;
    if (!pending) {
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update
    }
    queue.pending = update;

    // 标记
    fiber.lanes = mergeLane(fiber.lanes, update.lane);

    let alternate = fiber.alternate;
    if (alternate !== null) {
        alternate.lanes = mergeLane(alternate.lanes, update.lane);
    }

    // 向上遍历，直到顶部
    let node = fiber;
    let parent = fiber.return;
    while (parent) {
        parent.childLanes = mergeLane(parent.childLanes, update.lane)
        let alternate = parent.alternate;
        if (alternate !== null) {
            alternate.childLanes = mergeLane(alternate.childLanes, update.lane);
        }

        node = parent;
        parent = parent.return;
    }
    return node.stateNode;
}
