interface HasField {
  field: string;
}

export class C<T> extends Array<T> implements HasField {
  public field!: string;

  method<T>(this: HasField, a?: string): void {
    this.field = a as string;
  }
}
