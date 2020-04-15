import { unreachable } from "some-ignored-package";
import { also_unreachable } from "some-package";

if (false) {
  unreachable;
  also_unreachable;
}
