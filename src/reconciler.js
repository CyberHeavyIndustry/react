import {ChildDeletion, REACT_ELEMENT, HostText, Fragment, Placement} from "./constants.js";
import {createFiberFromText, createWorkInProgress, createFiberFromElement, createFiberFromFragment} from "./fiber.js";

let shouldTrackSideEffects = false;

// ---------- 基础功能封装

// 判断数组
function isElementArray(element) {
    return Array.isArray(element);
}

// 判断文本
function isText(element) {
    return typeof element === "string" || typeof element === "number";
}

// 判断元素
function isSingleElement(element) {
    return (
        typeof element === "object" &&
        element !== null &&
        element.$$typeof === REACT_ELEMENT
    );
}

// fiber ---> map
function mapChildren(currentChild) {
    const map = new Map();
    let child = currentChild;
    while (child !== null) {
        map.set(child.key || child.index, child);
        child = child.sibling;
    }
    return map;
}

// 删除---------------------------------------------------------------
// 删除单个元素
function deleteChild(returnFiber, child) {
    if (!shouldTrackSideEffects) {
        return;
    }
    if (returnFiber.deletions === null) {
        returnFiber.deletions = [child];
        returnFiber.flags |= ChildDeletion;
    } else {
        returnFiber.deletions.push(child);
    }
}

// 删除后续多个元素
function deleteRemainingChildren(returnFiber, currentChild) {
    if (!shouldTrackSideEffects) {
        return null;
    }
    let child = currentChild;
    while (child !== null) {
        deleteChild(returnFiber, child);
        child = currentChild.sibling;
    }
    return null;
}

// 新增----------------------------------------
function createChild(returnFiber, element) {
    // 文本
    if (isText(element)) {
        const fiber = createFiberFromText(element);
        fiber.return = returnFiber;
        return fiber;
    }
    // 单个
    if (isSingleElement(element)) {
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    // 多个
    if (isElementArray(element)) {
        const created = createFiberFromFragment(element);
        created.return = returnFiber;
        return created;
    }
    return null;
}

// 更新 --------------------------------------

// 复用当前 fiber
export function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
}

// 更新场景-获取文本节点
function updateTextNode(returnFiber, oldFiber, element) {
    // 复用
    if (oldFiber && oldFiber.tag === HostText) {
        const existing = useFiber(oldFiber, element);
        existing.return = returnFiber;
        return existing;
    }
    // 新增
    return createChild(returnFiber, element);
}

// 更新场景 -- fragment
function updateFragment(returnFiber, oldFiber, element) {
    // 复用
    if (oldFiber && oldFiber.tag === Fragment) {
        const existing = useFiber(oldFiber, element);
        existing.return = returnFiber;
        return existing;
    }
    // 新增
    return createChild(returnFiber, element);
}

// 更新场景 -- 单个元素节点
function updateElement(returnFiber, oldFiber, element) {
    // 复用
    if (oldFiber && oldFiber.type === element.type) {
        const existing = useFiber(oldFiber, element.props);
        existing.return = returnFiber;
        return existing;
    }
    // 新增
    return createChild(returnFiber, element);
}


// 汇总、更新插槽 --- 根据插槽的位置
function updateSlot(returnFiber, oldFiber, element) {

    // key值
    const oldKey = oldFiber !== null ? oldFiber.key : null;
    const newKey = element !== null ? element.key : null;
    if (oldKey !== newKey) {
        return null;
    }
    // 文本
    if (isText(element)) {
        return updateTextNode(returnFiber, oldFiber, element);
    }
    // 节点
    if (isSingleElement(element)) {
        return updateElement(returnFiber, oldFiber, element);
    }

    // 数组
    if (isElementArray(element)) {
        return updateFragment(returnFiber, oldFiber, element);
    }

    return null;
}

// 汇总、从 map 中更新
function updateFromMap(map, returnFiber, index, element) {
    // 文本
    if (isText(element)) {
        const matchedFiber = map.get(index) || null;
        return updateTextNode(returnFiber, matchedFiber, element);
    }
    // 节点
    if (isSingleElement(element)) {
        const matchedFiber = map.get(element.key || index) || null;
        return updateElement(returnFiber, matchedFiber, element);
    }

    // 数组
    if (isElementArray(element)) {
        const matchedFiber = map.get(index) || null;
        return updateFragment(returnFiber, matchedFiber, element);
    }
    return null;
}

// ——————————————————————————————————————————————————————
// ——————————————————————————————————————————————————————
// reconciler 新元素是单个文本元素
function reconcileTextNode(returnFiber, currentChildFiber, element) {
    // 复用
    if (currentChildFiber && currentChildFiber.tag === HostText) {
        deleteRemainingChildren(returnFiber, currentChildFiber.sibling);
        const existing = useFiber(currentChildFiber, element);
        existing.return = returnFiber;
        return existing;
    }

    // 清理
    deleteRemainingChildren(returnFiber, currentChildFiber);
    // 构建新元素
    const newFiber = createChild(returnFiber, element);
    // 打标签
    if (shouldTrackSideEffects) {
        newFiber.flags |= Placement;
    }
    return newFiber;
}

// reconciler 新元素是单个元素节点
function reconcileSingleElement(returnFiber, currentChildFiber, element) {
    // 复用
    let child = currentChildFiber;
    while (child !== null) {
        if (child.key === element.key) {
            if (child.type === element.type) {
                // 清理
                deleteRemainingChildren(returnFiber, child.sibling);
                const existing = useFiber(child, element.props);
                existing.return = returnFiber;
                return existing;
            } else {
                deleteRemainingChildren(returnFiber, child);
                break;
            }
        } else {
            deleteChild(returnFiber, child);
        }
        child = child.sibling;
    }

    // 新的
    const newFiber = createChild(returnFiber, element);

    // 打标签
    if (shouldTrackSideEffects) {
        newFiber.flags |= Placement;
    }
    return newFiber
}

// 打标签
function placeChild(newFiber, lastPlacedIndex, newIdx) {
    newFiber.index = newIdx;
    if (!shouldTrackSideEffects) {
        return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current !== null) {
        const oldIndex = current.index;
        if (oldIndex < lastPlacedIndex) {
            newFiber.flags |= Placement;
            return lastPlacedIndex;
        } else {
            return oldIndex;
        }
    } else {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
    }
}


// 新元素是个 list
function reconcileChildArray(returnFiber, currentChild, newChild) {
    let result = null;
    let previousFiber = null;
    let oldFiber = currentChild;
    let nextOldFiber = null;
    let idx = 0;
    let lastPlacedIndex = 0;

    // 插槽遍历
    for (; oldFiber !== null && idx < newChild.length; idx++) {
        if (oldFiber.index > idx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
        } else {
            nextOldFiber = oldFiber.sibling;
        }
        const newFiber = updateSlot(returnFiber, oldFiber, newChild[idx]);
        if (newFiber === null) {
            if (oldFiber === null) {
                oldFiber = nextOldFiber;
            }
            break;
        }
        // 处理旧fiber，type 不同，此时为新增节点
        if (shouldTrackSideEffects) {
            if (oldFiber && newFiber.alternate === null) {
                deleteChild(returnFiber, oldFiber);
            }
        }
        // 打标签
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, idx);

        // 移动游标
        if (previousFiber === null) {
            result = newFiber;
        } else {
            previousFiber.sibling = newFiber;
        }
        previousFiber = newFiber;
        oldFiber = nextOldFiber;
    }

    // 出口1 -----------------------------  新遍历完成
    if (idx === newChild.length) {
        // 清理
        deleteRemainingChildren(returnFiber, oldFiber);
        return result;
    }
    // 出口2 -----------------------------  旧元素遍历完成/mount场景
    if (oldFiber === null) {
        for (; idx < newChild.length; idx++) {
            const newFiber = createChild(returnFiber, newChild[idx]);

            if (newFiber === null) {
                continue;
            }

            // 打标签
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, idx);

            // 更新指向
            if (previousFiber === null) {
                result = newFiber;
            } else {
                previousFiber.sibling = newFiber;
            }
            previousFiber = newFiber;
        }
        return result;
    }

    // 出口3 -----------------------------  根据 map 完成遍历
    const childrenMap = mapChildren(oldFiber);
    // 遍历新元素
    for (; idx < newChild.length; idx++) {
        // 创建新 fiber
        const newFiber = updateFromMap(
            childrenMap,
            returnFiber,
            idx,
            newChild[idx]
        );

        // element 为 null
        if (!newFiber) {
            continue;
        }

        // 清理
        if (newFiber.alternate !== null) {
            childrenMap.delete(newFiber.key || idx);
        }

        // 打标签
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, idx);

        // 更新指向
        if (previousFiber === null) {
            result = newFiber;
        } else {
            previousFiber.sibling = newFiber;
        }

        previousFiber = newFiber;
    }
    // 清理旧元素
    if (shouldTrackSideEffects) {
        childrenMap.forEach((child) => deleteChild(returnFiber, child));
    }
    return result;
}


export default function reconciler(current, workInProgress, element) {
    shouldTrackSideEffects = current ? true : false;

    let oldFiber = current ? current.child : null;

    if (typeof element === 'object' && element !== null) {
        if (isElementArray(element)) {
            return reconcileChildArray(workInProgress, oldFiber, element)
        }
        return reconcileSingleElement(workInProgress, oldFiber, element);
    }

    if (typeof element === 'string' || typeof element === 'number') {
        return reconcileTextNode(workInProgress, oldFiber, element);
    }

    deleteRemainingChildren(workInProgress, oldFiber);
    return null;
}
