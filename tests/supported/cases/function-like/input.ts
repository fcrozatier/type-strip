// Getters and Setters
class Person {
  private _name: string;

  constructor(name: string) {
      this._name = name;
  }

  get name(): string {
      console.log("Getting name...");
      return this._name;
  }

  set name(newName: string) {
      console.log(`Setting name to ${newName}...`);
      this._name = newName.trim();
  }
}
