import {Node} from '@/common/nodes'
import {Tag} from '@/common/tags'
import {DateTimeFormatter, Instant, LocalDate, ZonedDateTime, ZoneId} from '@js-joda/core'

export function ObjectDebugInfo({ object }: { object: Node | Tag }) {
  const created = ZonedDateTime.ofInstant(Instant.ofEpochMilli(object.history.createdTime), ZoneId.systemDefault())
  const modified = ZonedDateTime.ofInstant(Instant.ofEpochMilli(object.history.lastModifiedTime), ZoneId.systemDefault())
  const format = (date: ZonedDateTime) => {
    const today = LocalDate.now()
    if (date.toLocalDate().equals(today)) {
      return date.toLocalTime().format(DateTimeFormatter.ofPattern('HH:mm'))
    } else {
      return date.toLocalDate().toString()
    }
  }
  return (
    <div className={'text-xs text-muted-foreground'}>
      Created: {format(created)} • Modified: {format(modified)} • ID: {object.id}
    </div>
  )
}
