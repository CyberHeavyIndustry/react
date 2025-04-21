import {
    HookHasEffect,
    HookInsertion,
    HookLayout,
    HookPassive,
    NoLanes,
    Passive,
    SyncLane,
    Update
} from "./constants.js";
import {enqueueHookUpdate, scheduleUpdate} from "./update.js";

let currentlyRenderingFiber = null;
let currentHook = null;
let workInProgressHook = null;

function basicStateReducer(state, action) {
    return typeof action === 'function' ? action(state) : action;
}


// mount 阶段生成 hook
function mountWorkInProgressHook() {
    const hook = {
        memoizedState: null,
        queue: null,
        next: null,
    };

    if (workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
    } else {
        workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook;
}

// 更新阶段获取 hook
function updateWorkInProgressHook() {
    // 获取 currentHook
    if (currentHook === null) {
        const current = currentlyRenderingFiber.alternate;
        if (current !== null) {
            currentHook = current.memoizedState;
        } else {
            currentHook = null;
        }
    } else {
        currentHook = currentHook.next;
    }

    // 获取新 hook
    const newHook = {
        memoizedState: currentHook.memoizedState,
        queue: currentHook.queue,
        next: null,
    };

    if (workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
        workInProgressHook = workInProgressHook.next = newHook;
    }
    return workInProgressHook;
}


function mountState(initialState) {
    // 获取 hook
    const hook = mountWorkInProgressHook();
    if (typeof initialState === 'function') {
        initialState = initialState();
    }
    hook.memoizedState = initialState;
    const queue = {
        pending: null,
        dispatch: null
    };
    hook.queue = queue;
    const dispatch = queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
    return [hook.memoizedState, dispatch];
}

function updateReducer(reducer, initialState) {
    // 获取 hook
    const hook = updateWorkInProgressHook();
    let newState = hook.memoizedState;
    const last = hook.queue.pending;
    const first = last.next;
    let update = first;
    do {
        newState = reducer(newState, update.action);
        update = update.next;
    } while (update !== first);

    // 重置
    hook.queue.pending = null;
    hook.memoizedState = newState;
    return [hook.memoizedState, hook.queue.dispatch];
}


function dispatchSetState(fiber, queue, action) {
    // 生成变更
    const update = {
        lane: SyncLane,
        action,
    }
    // 挂载，入队
    const root = enqueueHookUpdate(fiber, queue, update);

    // 调度
    scheduleUpdate(root, update.lane)
}

export function useState(initialState) {
    if (currentlyRenderingFiber.alternate) {
        return updateReducer(basicStateReducer, initialState);
    }

    return mountState(initialState);
}


export function renderWithHooks(current, workInProgress) {
    // 重置变量
    currentlyRenderingFiber = workInProgress;
    currentHook = null;
    workInProgressHook = null;
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;

    // 生成新的 react element
    const children = workInProgress.type(workInProgress.pendingProps);

    // 重置变量
    currentlyRenderingFiber = null;
    return children;
}

// useEffect 相关-------------------------------------------------------------------------------------

// 生成 effect 并入队
function pushEffect(tag, create, destroy, deps) {
    const effect = {
        tag,
        create,
        destroy,
        deps,
        next: null,
    };

    if (!currentlyRenderingFiber.updateQueue) {
        effect.next = effect;
        currentlyRenderingFiber.updateQueue = {
            lastEffect: effect,
        }
    } else {
        const lastEffect = currentlyRenderingFiber.updateQueue.lastEffect;
        const firstEffect = lastEffect.next;
        lastEffect.next = effect;
        effect.next = firstEffect;
        currentlyRenderingFiber.updateQueue.lastEffect = effect;
    }
    return effect;
}

// mount 阶段运行的 hook
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        undefined,
        nextDeps,
    );
}

// 判断依赖数组是否发生变化
function areHookInputsEqual(
    nextDeps,
    prevDeps,
) {
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (Object.is(nextDeps[i], prevDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
}

// update 阶段运行的 hook
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy = undefined;

    if (currentHook) {
        const prevEffect = currentHook.memoizedState;
        destroy = prevEffect.destroy;
        if (nextDeps) {
            const prevDeps = prevEffect.deps;
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
                return;
            }
        }
    }

    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        destroy,
        nextDeps,
    );
}


// useEffect 入口
export function useEffect(create, deps) {
    if (currentlyRenderingFiber.alternate) {
        updateEffectImpl(Passive, HookPassive, create, deps);
        return;
    }
    mountEffectImpl(Passive, HookPassive, create, deps);
}

// useLayoutEffect 入口
export function useLayoutEffect(create, deps) {
    if (currentlyRenderingFiber.alternate) {
        updateEffectImpl(Update, HookLayout, create, deps)
        return;
    }
    mountEffectImpl(Update, HookLayout, create, deps);
}

// useInsertionEffect 入口
export function useInsertionEffect(create, deps) {
    if (currentlyRenderingFiber.alternate) {
        updateEffectImpl(Update, HookInsertion, create, deps)
        return;
    }
    mountEffectImpl(Update, HookInsertion, create, deps);
}

// useImperativeHandle 入口
export function useImperativeHandle(ref, create, deps) {
    if (currentlyRenderingFiber.alternate) {
        updateEffectImpl(Update, HookLayout, imperativeHandleEffect.bind(null, create, ref), deps)
        return;
    }
    mountEffectImpl(Update, HookLayout, imperativeHandleEffect.bind(null, create, ref), deps);
}

function imperativeHandleEffect(
    create,
    ref,
) {
    const refObject = ref;
    const inst = create();
    refObject.current = inst;
    return () => {
        refObject.current = null;
    };
}


