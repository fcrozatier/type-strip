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
