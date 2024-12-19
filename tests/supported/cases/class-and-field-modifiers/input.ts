// Accessibility modifiers
class Animal {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public speak(): string {
    return `${this.name} makes a noise.`;
  }

  protected move(): void {
    console.log(`${this.name} is moving.`);
  }
}

// Abstract Classes
abstract class ShapeBase {
  abstract getArea(): number;
}

class Circle extends ShapeBase {
  radius: number;

  constructor(radius: number) {
    super();
    this.radius = radius;
  }
  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

// Overrides
class UniCircle extends Circle {
  override radius = 1;

  constructor(radius: number) {
    super(1);
  }
  override getArea(): number {
    return Math.PI;
  }
}
