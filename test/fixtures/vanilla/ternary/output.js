import { reachable } from "some-pkg";
const foo = true ? reachable : unreachable;
const bar = false ? unreachable : reachable;
