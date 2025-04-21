import {
    ClassComponent,
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText,
    Fragment,
    NoFlags,
    NoLanes
} from "./constants.js";

function FiberNode(tag, pendingProps, key) {
    // 基本属性
    this.tag = tag;
    this.pendingProps = pendingProps;
    this.key = key;
    this.type = null;
    this.ref = null;

    // 父子、兄弟关系
    this.return = null;
    this.child = null;
    this.sibling = null;

    // state,props,update
    this.memoizedState = null;
    this.memoizedProps = null;
    this.updateQueue = {
        pending: null,
    };

    // 各种标记
    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
    this.lanes = NoLanes;
    this.childLanes = NoLanes;

    // 其他
    this.index = 0;
    this.mode = null;
    this.stateNode = null;
    this.deletions = null;
    this.alternate = null;
}

function createFiber(tag, pendingProps, key) {
    return new FiberNode(tag, pendingProps, key)
}

// 创建元素节点
export function createFiberFromElement(element) {
    let tag = null;
    const {type, props, key} = element;
    if (typeof type === 'string') {
        tag = HostComponent
    } else if (typeof type === 'function') {
        if (type.isReactComponent) {
            tag = ClassComponent
        } else {
            tag = FunctionComponent
        }
    }

    const fiberNode = createFiber(tag, props, key)
    fiberNode.type = element.type;
    return fiberNode
}

// 创建一个文本节点
export function createFiberFromText(text) {
    return createFiber(HostText, text, null)
}

// 创建空节点
export function createFiberFromFragment(element) {
    return createFiber(Fragment, element)
}

// 创建

// 创建根节点
export function createHostRootFiber() {
    return createFiber(HostRoot, null, null)
}

// 创建工作节点
export function createWorkInProgress(current, pendingProps) {
    let workInProgress = current.alternate;

    if (workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key);
        workInProgress.stateNode = current.stateNode;
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps
    }

    workInProgress.type = current.type;
    workInProgress.child = current.child;
    workInProgress.updateQueue = current.updateQueue;

    workInProgress.lanes = current.lanes;
    workInProgress.childLanes = current.childLanes;
    return workInProgress;
}

















































































