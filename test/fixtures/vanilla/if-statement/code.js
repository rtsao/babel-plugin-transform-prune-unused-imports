import { unreachable, reachable } from "some-pkg";

if (false) {
  unreachable;
}

if (true) {
  reachable;
}
