export function ErrorMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="error-message" role="alert">
      <span>We couldn't generate recipes. Please try again.</span>
      <button type="button" onClick={onRetry}>Retry</button>
    </div>
  );
}
