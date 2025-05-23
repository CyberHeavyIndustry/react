export const REACT_ELEMENT = Symbol("react_element");

// fiber tag 类型
export const FunctionComponent = 0;
export const ClassComponent = 1;
export const HostRoot = 3;
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;

// 协调过程中产生的副作用 flag
export const NoFlags = /*                      */ 0b00000000000000000000000000; // 0
export const Placement = /*                    */ 0b00000000000000000000000010; // 2
export const Update = /*                       */ 0b00000000000000000000000100; // 4
export const ChildDeletion = /*                */ 0b00000000000000000000010000; // 16
export const Snapshot = /*                     */ 0b00000000000000010000000000; // 1024
export const Passive = /*                      */ 0b00000000000000100000000000; // 2048

export const NoHookEffect = /*   */ 0b0000;
export const HookHasEffect = /* */ 0b0001; // 1
export const HookInsertion = /*  */ 0b0010; // 2
export const HookLayout = /*    */ 0b0100; // 4
export const HookPassive = /*   */ 0b1000; // 8

// 渲染优先级 lane
export const NoLanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane = /*                        */ 0b0000000000000000000000000000000;
export const SyncLane = /*                       */ 0b0000000000000000000000000000001;

export function mergeLane(a, b) {
  return a | b;
}

export function includesSomeLane(a, b) {
  return (a & b) !== NoLane;
}
