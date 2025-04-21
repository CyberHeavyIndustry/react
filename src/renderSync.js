import {createFiberFromElement, createWorkInProgress} from "./fiber.js";
import {
    ClassComponent,
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText,
    Fragment,
    includesSomeLane,
    NoLane,
    NoLanes, mergeLane, NoFlags, Placement, Update, Passive,
} from "./constants.js";
import {appendChildren, createElement, diffProperties, setInitialProps} from "./dom.js";
import reconciler from "./reconciler.js";
import {renderWithHooks} from "./hooks.js";

let workInProgress = null;
let renderLanes = NoLanes;

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

// 复用子节点
function bailout(current, workInProgress) {
    let currentChild = current.child;
    if (currentChild === null) {
        return null;
    }

    let result = null;
    let prevChild = null;

    while (currentChild) {
        const newChild = createWorkInProgress(currentChild, currentChild.memoizedProps);
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

function beginWork(current, workInProgress) {
    if (current) {
        if (current.memoizedProps === workInProgress.pendingProps && !includesSomeLane(workInProgress.lanes, renderLanes)) {
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
            nextChildren = typeof children === 'string' || typeof children === 'number' ? null : children;
            break;
        case HostText:
            nextChildren = null;
            break;
        case FunctionComponent:
            nextChildren = renderWithHooks(current, workInProgress);
            break;
        case ClassComponent:
            if (!current) {
                const instance = new workInProgress.type(workInProgress.pendingProps);
                instance._reactFiber = workInProgress;
                workInProgress.stateNode = instance;
                nextChildren = instance.render();
            } else {
                const instance = workInProgress.stateNode;
                let newState = instance.state;
                const pendingState = current.updateQueue.pending;
                let next = pendingState.next;
                do {
                    newState = {...newState, ...next.payload};
                    if (next === pendingState) {
                        break;
                    }
                    next = next.next;
                } while (next)
                instance.state = newState;
                nextChildren = instance.render();
            }
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

function completeWork(workInProgress) {
    const current = workInProgress.alternate;
    switch (workInProgress.tag) {
        case HostRoot:
        case FunctionComponent:
        case ClassComponent:
        case Fragment:
            break;
        case HostComponent:
            // // 更新
            // if (current && workInProgress.stateNode) {
            //     // 未发生任何更新
            //     if (current.memoizedProps === workInProgress.pendingProps) {
            //         return;
            //     }
            //     // 发生了更新
            //     const updatePayload = diffProperties(current.memoizedProps, workInProgress.pendingProps);
            //     workInProgress.updateQueue = updatePayload;
            //     // 如果收集到了更新，就给当前 fiber 打上标签，等待 commit 处理。
            //     if (updatePayload) {
            //         workInProgress.flags |= Update;
            //     }
            //     break;
            // }
            // 新增
            const instance = createElement(workInProgress);
            appendChildren(instance, workInProgress);
            workInProgress.stateNode = instance;
            instance.internalFiber = workInProgress;
            setInitialProps(instance, workInProgress.pendingProps);
            break;
        case HostText:
            workInProgress.stateNode = document.createTextNode(workInProgress.pendingProps);
            break;

        default:
            return;
    }
    bubbleProperties(workInProgress)
}

function renderRootSync() {
    while (workInProgress) {
        const current = workInProgress.alternate;
        const next = beginWork(current, workInProgress);
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
            } while (workInProgress)
        }
    }
}

function commitRoot(root) {
    root.pendingLanes = NoLanes;
    root.callbackPriority = NoLanes;
    const container = root.container;
    const finishedWork = root.current.alternate;
    let childFiber = finishedWork.child;
    while (childFiber) {
        if (childFiber.tag === HostComponent && childFiber.stateNode) {
            if (container.childNodes[0]) {
                container.childNodes[0].remove();
            }
            container.appendChild(childFiber.stateNode);
            break;
        }
        childFiber.flags &= ~Placement;
        childFiber.flags &= ~Update;
        childFiber.flags &= ~Passive;
        childFiber = childFiber.child
    }
    root.current = finishedWork;
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

