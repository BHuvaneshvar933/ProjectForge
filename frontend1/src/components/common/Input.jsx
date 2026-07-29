import './Input.css';

export default function Input({
  label,
  error,
  icon,
  className = "",
  ...props
}) {
  return (
    <div className="input">
      {label && (
        <label className="input__label">
          {label}
        </label>
      )}
      <div className="input__field-wrap">
        {icon && (
          <div className="input__icon">
            {icon}
          </div>
        )}
        <input
          className={`input__field ${icon ? 'input__field--with-icon' : ''} ${error ? 'input__field--error' : ''} ${className}`.trim()}
          {...props}
        />
      </div>
      {error && (
        <p className="input__error">
          {error}
        </p>
      )}
    </div>
  );
}