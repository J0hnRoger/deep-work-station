export class Result<T, E> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly value?: T,
    private readonly error?: E
  ) {}

  static success<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  static failure<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  isOk(): boolean {
    return this.isSuccess;
  }

  isError(): boolean {
    return !this.isSuccess;
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from a failed result');
    }
    return this.value!;
  }

  getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot get error from a successful result');
    }
    return this.error!;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isSuccess) {
      return Result.success(fn(this.value!));
    }
    return Result.failure(this.error!);
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isSuccess) {
      return Result.success(this.value!);
    }
    return Result.failure(fn(this.error!));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess) {
      return fn(this.value!);
    }
    return Result.failure(this.error!);
  }

  match<U>(
    onSuccess: (value: T) => U,
    onError: (error: E) => U
  ): U {
    if (this.isSuccess) {
      return onSuccess(this.value!);
    }
    return onError(this.error!);
  }
}