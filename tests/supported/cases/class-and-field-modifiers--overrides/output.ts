class Circle extends ShapeBase {
  radius;

  constructor(radius) {
    super();
    this.radius = radius;
  }
  getArea() {
    return Math.PI * this.radius ** 2;
  }
}

// Overrides
class UniCircle extends Circle { radius = 1;

  constructor(radius) {
    super(1);
  } getArea() {
    return Math.PI;
  }
}
