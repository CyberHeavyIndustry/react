import { HostComponent, HostText } from "./constants.js";

export function createElement(workInProgress) {
  return document.createElement(workInProgress.type);
}

export function appendChildren(dom, workInProgress) {
  let childFiber = workInProgress.child;
  while (childFiber) {
    // 挂载或下钻
    if (childFiber.tag === HostComponent || childFiber.tag === HostText) {
      dom.appendChild(childFiber.stateNode);
    } else {
      childFiber = childFiber.child;
      continue;
    }

    // 回到根
    if (childFiber === workInProgress) {
      return;
    }

    // 如果没有兄弟节点，返回上级
    while (!childFiber.sibling) {
      if (childFiber.return === workInProgress) {
        return;
      }
      childFiber = childFiber.return;
    }

    // 遍历兄弟节点
    childFiber = childFiber.sibling;
  }
}

// 首次挂载
export function setInitialProps(dom, nextProps) {
  for (const [k, v] of Object.entries(nextProps)) {
    if (k === "style") {
      for (const [sk, sv] of Object.entries(v)) {
        dom.style[sk] = sv;
      }
      continue;
    }
    if (k === "children") {
      if (typeof v === "number" || typeof v === "string") {
        dom.textContent = v;
      }
      continue;
    }

    dom[k] = v;
  }
}

// 更新 diff
export function diffProperties(oldProps, newProps) {
  let updatePayload = [];
  let styleUpdates = {};

  // 遍历老 props，将需要删除的属性置空
  for (const [k, v] of Object.entries(oldProps)) {
    if (newProps[k]) {
      continue;
    }
    if (k === "style") {
      for (const [sk, sv] of Object.entries(v)) {
        styleUpdates[sk] = "";
      }
      continue;
    }
    if (k.startsWith("on") || k === "children") {
      continue;
    }
    updatePayload.push(k, null);
  }

  // 遍历新 props
  for (const [k, v] of Object.entries(newProps)) {
    const lastProp = oldProps ? oldProps[k] : undefined;
    if (v === lastProp) {
      continue;
    }

    if (k === "style") {
      if (lastProp) {
        // 两个对象的比较
        for (const [sk, sv] of Object.entries(lastProp)) {
          // 新 style 当中不存在
          if (!v[sk]) {
            styleUpdates[sk] = "";
          }
        }

        for (const [sk, sv] of Object.entries(v)) {
          if (sv !== lastProp[sk]) {
            styleUpdates[sk] = sv;
          }
        }
      } else {
        styleUpdates = v;
      }
      continue;
    }

    if (k === "children") {
      if (typeof v === "string" || typeof v === "number") {
        updatePayload.push(k, v);
      }
      continue;
    }

    if (k.startsWith("on")) {
      continue;
    }

    updatePayload.push(k, v);
  }

  if (Object.keys(styleUpdates).length > 0) {
    updatePayload.push("style", styleUpdates);
  }

  return updatePayload.length > 0 ? updatePayload : null;
}

// 清空根节点
export function clearContainer(container) {
  container.textContent = "";
}

// 移除子节点
export function removeChild(parentNode, childNode) {
  parentNode.removeChild(childNode);
}

// 插入节点
export function insertBefore(parent, child, before) {
  parent.insertBefore(child, before);
}

// 新增子节点
export function appendChild(parent, child) {
  parent.appendChild(child);
}
