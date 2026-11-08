import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as Atom from 'effect/reactivity/Atom';
import * as Schedule from 'effect/Schedule';
import * as Stream from 'effect/Stream';

export const minuteClockAtom = Atom.make(
    Clock.currentTimeMillis.pipe(Stream.fromEffect, Stream.repeat(Schedule.spaced(Duration.minutes(1))))
);
