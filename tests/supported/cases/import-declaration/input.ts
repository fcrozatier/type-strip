// Import Declaration
import type { Person } from "types";
// Named Import with type specifier
import { type Person } from "module";
// Namespace import
import type * as schema from "schema";
// Mixed
import { type Person, createPerson } from "module";
