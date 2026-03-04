import './Spinner.css';

export default function Spinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "spinner--sm",
    md: "spinner--md",
    lg: "spinner--lg"
  };

  return (
    <div className={`spinner ${sizes[size]} ${className}`.trim()} />
  );
}