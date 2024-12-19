const identity = <T>(x: T): T => x;
const self = identity<number>(maybeNumbers[12]!);
