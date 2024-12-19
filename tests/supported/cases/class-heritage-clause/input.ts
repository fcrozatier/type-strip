interface Printable {
  print(): void;
}

interface Savable {
  save(): void;
}

class Document implements Printable {
  print() {
      console.log("Printing document...");
  }
}

// Implementing multiple interfaces
class File implements Printable, Savable {
  print() {
      console.log("Printing file...");
  }

  save() {
      console.log("Saving file...");
  }
}

interface Movable {
  move(): void;
}

class Vehicle {
  startEngine() {
      console.log("Engine started.");
  }
}
// Implementing and extending
class Car extends Vehicle implements Movable {
  move() {
      console.log("Car is moving...");
  }
}
