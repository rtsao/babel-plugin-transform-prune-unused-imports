import { reachable, unreachable } from "some-pkg";

if (false && foo && bar) {
  unreachable;
} else {
  reachable;
}

if (foo && false && bar) {
  unreachable;
} else {
  reachable;
}

if (foo && (false && bar)) {
  unreachable;
} else {
  reachable;
}
