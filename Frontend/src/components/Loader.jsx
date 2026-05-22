export default function Loader({ label = 'Loading' }) {
  return (
    <div className="loader">
      <span />
      <p>{label}</p>
    </div>
  );
}
