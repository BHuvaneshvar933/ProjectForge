import './Button.css';

function ButtonSpinner() {
  return (
    <svg className="btn__spinner" viewBox="0 0 24 24">
      <circle
        className="btn__spinner-track"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        className="btn__spinner-fill"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = ""
}) {
  const baseClasses = "btn";
  
  const variants = {
    primary: "btn--primary",
    secondary: "btn--secondary",
    outline: "btn--outline",
    danger: "btn--danger",
    ghost: "btn--ghost"
  };
  
  const sizes = {
    sm: "btn--sm",
    md: "btn--md",
    lg: "btn--lg"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'btn--full' : ''} ${disabled || loading ? 'btn--disabled' : ''} ${className}`.trim()}
    >
      {loading ? (
        <div className="btn__loading">
          <ButtonSpinner />
          <span className="btn__loading-text">Loading...</span>
        </div>
      ) : children}
    </button>
  );
}
