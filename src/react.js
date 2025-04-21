import {REACT_ELEMENT} from "./constants.js";
import {classComponentUpdate} from "./update.js";

function createElement(type, config, ...children) {
    let key = null;
    let ref = null;
    let props = {};

    // 处理 props
    if (config) {
        key = config.key || null;
        ref = config.ref || null;
        Reflect.deleteProperty(config, key);
        Reflect.deleteProperty(config, ref);
        props = config
    }

    // 处理 children
    if (children.length > 0) {
        if (children.length === 1) {
            props.children = children[0]
        } else {
            props.children = children
        }
    }

    return {
        $$typeof: REACT_ELEMENT,
        type,
        key,
        ref,
        props
    }
}

class Component {
    constructor(props) {
        this.props = props;
    }

    static isReactComponent = true;

    setState(partialState) {
        classComponentUpdate(this, partialState);
    }
}


export default {createElement, Component};
