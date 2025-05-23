import { NoLanes } from "../constants";
import commitBeforeMutationEffects from "./commitBeforeMutationEffects";
import commitMutationEffects from "./commitMutationEffects";
import commitLayoutEffects from "./commitLayoutEffects";
import flushPassiveEffects from "./flushPassiveEffects";

export default function commitRoot(root) {
  const finishedWork = root.current.alternate;
  root.pendingLanes = NoLanes;
  root.callbackPriority = NoLanes;

  // 变更前
  commitBeforeMutationEffects(root, finishedWork);

  // 变更
  commitMutationEffects(finishedWork);

  root.current = finishedWork;

  // layout effect
  commitLayoutEffects(finishedWork);

  flushPassiveEffects(root);
}
