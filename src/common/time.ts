import {Duration, LocalDateTime, ZonedDateTime, ZoneId} from '@js-joda/core'

/**
 * Formats the passed Duration according to the given style
 */
export function formatDuration(
  duration: Duration,
  format: (components: DurationComponents) => string = DurationFormat.clock,
): string {
  return format(breakdown(duration))
}

export const DurationFormat = {
  clock: (components: DurationComponents): string => {
    const { hours, minutes, seconds } = components
    const hoursString = hours.toString().padStart(2, '0')
    const minutesString = minutes.toString().padStart(2, '0')
    const secondsString = seconds.toString().padStart(2, '0')
    return [hoursString, minutesString, secondsString].join(':')
  },
  letters: (components: DurationComponents): string => {
    const { hours, minutes, seconds } = components
    return hours.toString() + 'h ' + minutes.toString() + 'm ' + seconds.toString() + 's'
  }
}

interface DurationComponents {
  hours: number
  minutes: number
  seconds: number
  millis: number
  nanos: number
}

/**
 * Breaks down the passed duration into components.
 *
 * @example
 * ```js
 * const duration = Duration.ofSeconds(8 + (5 * 60) + (2 * 60 * 60))
 * const {
 *   hours,   // = 2
 *   minutes, // = 5
 *   seconds, // = 8
 * } = breakdown(duration)
 *
 * // By comparison, the methods js-joda offers are often less useful:
 * const totalMinutes = duration.toHours()   // = 2
 * const totalMinutes = duration.toMinutes() // = 125
 * const totalSeconds = duration.seconds()   // = 7508
 * ```
 */
export function breakdown(duration: Duration): DurationComponents {
  Duration.ofSeconds(68)
  const hours = duration.toHours()
  const minutes = duration.toMinutes() % 60
  const seconds = duration.seconds() % 60
  const millis = Math.floor(duration.nano() / 1_000_000)
  const nanos = duration.nano() % 1_000_000
  return {
    hours,
    minutes,
    seconds,
    millis,
    nanos,
  }
}

export function epochMillis(input: string, zoneId: ZoneId = ZoneId.systemDefault()): number {
  return ZonedDateTime.of(LocalDateTime.parse(input), zoneId)
    .toInstant()
    .toEpochMilli()
}
