class Document {
    print() {
        console.log("Printing document...");
    }
}
// Implementing multiple interfaces
class File {
    print() {
        console.log("Printing file...");
    }
    save() {
        console.log("Saving file...");
    }
}
class Vehicle {
    startEngine() {
        console.log("Engine started.");
    }
}
// Implementing and extending
class Car extends Vehicle {
    move() {
        console.log("Car is moving...");
    }
}
