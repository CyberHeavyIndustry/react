import React from './react.js';
import {createHostRootFiber} from "./fiber.js";
import listenToAllEvents from "./listenToAllEvents.js";
import {NoLane} from "./constants.js";
import {updateContainer} from "./update.js";
import {flush} from "./seduleSyncCallback.js";
import {useEffect, useLayoutEffect, useState} from "./hooks.js";


function App() {
    const [count, setCount] = useState(0);
    const [age, setAge] = useState(2);

    debugger

    useEffect(() => {
        console.log(333);
    }, [count])

    useLayoutEffect(() => {
        console.log(44)
    }, [])

    return (
        <div>
            <h1 onClick={() => {
                setCount(count + 1);
                setCount(count + 2);
                setAge(age + 3);
            }}>You pressed me {count} times</h1>
            <h2>Your age:{age}</h2>
        </div>
    )
}

const root = {
    container: document.getElementById('root'),
    pendingLanes: NoLane, // 记录所有变更
    callbackPriority: NoLane, // 记录已有的待渲染任务
}

listenToAllEvents(root.container);

const hostRootFiber = createHostRootFiber();

root.current = hostRootFiber
hostRootFiber.stateNode = root;


flush(() => {
    updateContainer(root, <App/>)
})

