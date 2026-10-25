export function convertAuditEventsToCsv(events: any[]): string {
  const headers = [
    'Event ID',
    'Sequence',
    'Timestamp (UTC)',
    'Organization ID',
    'Actor ID',
    'Actor Name',
    'Actor Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'Outcome',
    'IP Address',
    'Previous Hash',
    'Event Hash',
    'Metadata'
  ];

  const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) return '""';
    const stringVal = typeof field === 'object' ? JSON.stringify(field) : String(field);
    const escaped = stringVal.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = events.map(event => [
    escapeCsvField(event.id),
    escapeCsvField(event.sequenceNumber),
    escapeCsvField(new Date(event.timestamp).toISOString()),
    escapeCsvField(event.organizationId),
    escapeCsvField(event.actorId || 'SYSTEM'),
    escapeCsvField(event.actor?.fullName || 'N/A'),
    escapeCsvField(event.actor?.email || 'N/A'),
    escapeCsvField(event.action),
    escapeCsvField(event.resourceType),
    escapeCsvField(event.resourceId || 'N/A'),
    escapeCsvField(event.outcome),
    escapeCsvField(event.ipAddress || 'N/A'),
    escapeCsvField(event.previousHash),
    escapeCsvField(event.eventHash),
    escapeCsvField(event.metadata || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}
