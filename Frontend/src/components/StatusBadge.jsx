import { statusClassName } from '../utils/format.js';

export default function StatusBadge({ status, verified }) {
  if (typeof verified === 'boolean') {
    return <span className={`badge ${verified ? 'success' : 'muted'}`}>{verified ? 'Verified' : 'Pending'}</span>;
  }

  const currentStatus = status || 'Received';

  return <span className={`badge status-${statusClassName(currentStatus)}`}>{currentStatus}</span>;
}
