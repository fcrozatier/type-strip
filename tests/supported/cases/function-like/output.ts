const logger = (fn) => {
  // Function expression
  return function () {
    console.log("calling...");
    fn();
    console.log("done");
  };
};
// Getters and Setters
class Person {
  _name;
  constructor(name) {
    this._name = name;
  }
  get name() {
    console.log("Getting name...");
    return this._name;
  }
  set name(newName) {
    console.log(`Setting name to ${newName}...`);
    this._name = newName.trim();
  }
}
