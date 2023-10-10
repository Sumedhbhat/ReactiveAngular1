import {Component, OnDestroy} from '@angular/core';
import {
  NEVER,
  Subject,
  Subscription,
  merge,
  interval,
  Observable,
  combineLatest,
} from "rxjs";
import {
  map,
  mapTo,
  scan,
  startWith,
  switchMap,
  shareReplay,
  pluck,
  distinctUntilChanged,
} from "rxjs/operators";

interface CounterState {
  isTicking: boolean;
  count: number;
  countUp: boolean;
  tickSpeed: number;
  countDiff: number;
}

enum ElementIds {
  TimerDisplay = "timer-display",
  BtnStart = "btn-start",
  BtnPause = "btn-pause",
  BtnUp = "btn-up",
  BtnDown = "btn-down",
  BtnReset = "btn-reset",
  BtnSetTo = "btn-set-to",
  InputSetTo = "input-set-to",
  InputTickSpeed = "input-tick-speed",
  InputCountDiff = "input-count-diff",
}

@Component({
  selector: "app-counter",
  templateUrl: "./counter.component.html",
  styleUrls: ["./counter.component.scss"],
})
export class CounterComponent implements OnDestroy {
  elementIds = ElementIds;

  initialCounterState: CounterState = {
    isTicking: false,
    count: 0,
    countUp: true,
    tickSpeed: 200,
    countDiff: 1,
  };

  counterState: CounterState = {
    isTicking: false,
    count: 0,
    countUp: true,
    tickSpeed: 200,
    countDiff: 1,
  };

  btnStart: Subject<Event> = new Subject<Event>();
  btnPause: Subject<Event> = new Subject<Event>();
  btnSetTo: Subject<Event> = new Subject<Event>();
  inputSetTo: Subject<Event> = new Subject<Event>();
  inputCountDiff: Subject<Event> = new Subject<Event>();
  inputTickSpeed: Subject<Event> = new Subject<Event>();
  btnCountUp: Subject<Event> = new Subject<Event>();
  btnCountDown: Subject<Event> = new Subject<Event>();
  resetCounter: Subject<Event> = new Subject<Event>();
  commonObservable: Observable<CounterState> = new Observable<CounterState>();
  subscription: Subscription;
  count: number = 0;
  setTo: number = 0;

  constructor() {
    this.inputSetTo.subscribe((x) => {
      this.setTo = parseInt((x.target as HTMLInputElement).value);
    });
    /* Replace never with your code */
    this.commonObservable = merge(
      this.btnStart.pipe(
        mapTo({
          isTicking: true,
        })
      ),
      this.btnPause.pipe(
        mapTo({
          isTicking: false,
        })
      ),
      this.btnSetTo.pipe(
        mapTo({
          count: this.setTo,
        })
      ),
      this.inputCountDiff.pipe(
        map((x) => {
          return {
            countDiff: parseInt((x.target as HTMLInputElement).value),
          };
        })
      ),
      this.inputTickSpeed.pipe(
        map((x) => {
          console.log((x.target as HTMLInputElement).value);
          return {
            tickSpeed: parseInt((x.target as HTMLInputElement).value),
          };
        })
      ),
      this.resetCounter.pipe(mapTo(this.initialCounterState)),
      this.btnCountUp.pipe(mapTo({ countUp: true })),
      this.btnCountDown.pipe(mapTo({ countUp: false }))
    ).pipe(
      startWith(this.initialCounterState),
      scan((currentState: CounterState, changeValue): CounterState => {
        return { ...currentState, ...changeValue };
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const tickSpeed = this.commonObservable.pipe(
      pluck<CounterState, number>("tickSpeed"),
      distinctUntilChanged()
    );

    const isTickingCommand = this.commonObservable.pipe(
      pluck<CounterState, boolean>("isTicking"),
      distinctUntilChanged()
    );

    const countUp = this.commonObservable.pipe(
      pluck<CounterState, boolean>("countUp"),
      distinctUntilChanged()
    );

    this.subscription = combineLatest([isTickingCommand, tickSpeed, countUp])
      .pipe(
        switchMap(([isTicking, tickSpeed]) =>
          isTicking ? interval(tickSpeed) : NEVER
        )
      )
      .subscribe((_) => {
        this.counterState.count +=
          this.counterState.countDiff * (this.counterState.countUp ? 1 : -1);
      });

    this.subscription = this.commonObservable.subscribe((x) => {
      this.counterState = x;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getInputValue = (event: HTMLInputElement): number => {
    return parseInt(event["target"].value, 10);
  };
}
