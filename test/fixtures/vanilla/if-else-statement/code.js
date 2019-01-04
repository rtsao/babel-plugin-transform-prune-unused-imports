import { unreachable, reachable } from "some-pkg";

if (false) {
  unreachable;
} else {
  reachable;
}

if (true) {
  reachable;
} else {
  unreachable;
}
