import { unreachable } from "some-pkg";

function foo(unreachable) {
  unreachable;
}
if (false) {
  unreachable;
}
