import { unreachable } from "some-pkg";

if (process.env.NODE_ENV !== "production") {
  unreachable;
}
