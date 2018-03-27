/**
 * This file is in here to avoid Compile Error regarding to rxjs
 * See here for more detail https://github.com/ReactiveX/rxjs/issues/3031
 * TODO: delete this file after rxjs has fixed the issue.
 */
import { Subscription } from 'rxjs/Subscription';
import { AsyncScheduler } from 'rxjs/scheduler/AsyncScheduler';
import { AsyncAction } from 'rxjs/scheduler/AsyncAction';

export declare class VirtualTimeScheduler extends AsyncScheduler {
  protected static frameTimeFactor: number;
  public maxFrames: number;
  public frame: number;
  public index: number;
  constructor(SchedulerAction?: typeof AsyncAction, maxFrames?: number);
  /**
   * Prompt the Scheduler to execute all of its queued actions, therefore
   * clearing its queue.
   * @return {void}
   */
  public flush(): void;
}
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
export declare class VirtualAction<T> extends AsyncAction<T> {
  public static sortActions<T>(
    a: VirtualAction<T>,
    b: VirtualAction<T>
  ): number;
  protected scheduler: VirtualTimeScheduler;
  protected work: (this: AsyncAction<T>, state?: T) => void;
  protected index: number;
  protected active: boolean;
  constructor(
    scheduler: VirtualTimeScheduler,
    work: (this: VirtualAction<T>, state?: T) => void,
    index?: number
  );
  public schedule(state?: T, delay?: number): Subscription;
  protected requestAsyncId(
    scheduler: VirtualTimeScheduler,
    id?: any,
    delay?: number
  ): any;
  protected recycleAsyncId(
    scheduler: VirtualTimeScheduler,
    id?: any,
    delay?: number
  ): any;
  protected _execute(state: T, delay: number): any;
}
