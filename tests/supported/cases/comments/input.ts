/**
 * This module implements a Person class
 */

/**
 * The Person class
 */
class Person {
  // Index signature
  [key: string]: any;

  name: string;// the name of the person

  /**
   * Takes the name as input
   * @param name
   */
  constructor(name: string) {
    // Save the name
    this.name = name;
  }

  /**
   * Returns the person greeting
   */
  getGreeting(): string {
    // TODO include age
    return `Hello, my name is ${this.name}`;
  }
}

/**
 * A global person
 */
export type { Name };

// Mixed
export { Person, type Age };
