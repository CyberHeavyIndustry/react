import {HostComponent} from "./constants.js";
import {flush} from "./seduleSyncCallback.js";

const allEvents = [
    'click'
]

function accumulateListeners(reactName, fiber) {
    const listeners = [];
    let currentFiber = fiber;
    while (currentFiber) {
        if (currentFiber.tag === HostComponent && currentFiber.stateNode) {
            const listener = currentFiber.memoizedProps[reactName];
            if (listener) {
                listeners.push(listener)
            }
        }
        currentFiber = currentFiber.return;
    }
    return listeners;
}

class SyntheticEvent {
    constructor(event) {
        this.nativeEvent = event;
        Object.keys(event).forEach(key => {
            if (key === 'preventDefault') {
                this[key] = function () {

                }
            } else if (key === 'stopPropagation') {
                this[key] = function () {
                }
            } else {
                this[key] = event[key];
            }
        })
    }
}

function dispatchEvent(event) {
    const {type, target} = event;
    const reactName = 'on' + type[0].toUpperCase() + type.slice(1);
    // 收集函数
    const listeners = accumulateListeners(reactName, target.internalFiber)
    // 合成事件
    const syntheticEvent = new SyntheticEvent(event);
    // 执行
    listeners.forEach(listener => {
        listener(syntheticEvent);
    })
}

export default function listenToAllEvents(container) {
    allEvents.forEach(eventName => {
        container.addEventListener(eventName, (e) => {
            flush(() => dispatchEvent(e))
        }, false);
    })
}
