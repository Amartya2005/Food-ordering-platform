import { orderStatuses, statusPercent } from '../utils/format.js';

export default function OrderProgress({ status = 'Received' }) {
  const percent = statusPercent(status);

  return (
    <div className="order-progress">
      <div className="progress-header">
        <strong>{percent}% complete</strong>
        <span>{status}</span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="steps">
        {orderStatuses.map((step) => (
          <span key={step} className={orderStatuses.indexOf(step) <= orderStatuses.indexOf(status) ? 'done' : ''}>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
