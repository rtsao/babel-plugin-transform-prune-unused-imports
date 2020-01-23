import { one, two, three, four } from "some-pkg";

if (false && foo || bar) {
  one;
} else {
  two;
}

if (foo || bar && false) {
  three;
} else {
  four;
}
