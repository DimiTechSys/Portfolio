/**
 * URL de navigation depuis une notification (query `highlight` pour pulse sur la ligne).
 */
export function getNotificationTargetUrl(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '/notifications'

  if (metadata.domain === 'rental' && typeof metadata.rental_id === 'string') {
    return `/rentals?highlight=${encodeURIComponent(metadata.rental_id)}`
  }

  if (typeof metadata.task_id === 'string') {
    return `/tasks?highlight=${encodeURIComponent(metadata.task_id)}`
  }

  if (typeof metadata.shortage_id === 'string') {
    return `/shortages?highlight=${encodeURIComponent(metadata.shortage_id)}`
  }

  if (typeof metadata.leave_request_id === 'string') {
    return `/planning/requests?highlight=${encodeURIComponent(metadata.leave_request_id)}`
  }

  if (typeof metadata.target_url === 'string') {
    return metadata.target_url
  }

  return '/notifications'
}
