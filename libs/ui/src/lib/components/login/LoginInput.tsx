import { colors, typography } from '../../../design';

interface LoginInputProps {
  label: string;
  name: string;
  id: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  error?: boolean;
  errorMessage?: string;
}

export const LoginInput = ({
  label,
  name,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  errorMessage,
}: LoginInputProps) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={id}
      style={{ color: colors.gray[400], ...typography.body.BodyM }}
    >
      {label}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        color: colors.gray[500],
        backgroundColor: colors.gray[900],
        ...typography.body.BodyM,
      }}
      className={`w-full rounded-lg p-4 outline-none ring-1 ring-gray-700 focus:ring-orange-500 ${
        error ? 'ring-red-500' : ''
      }`}
    />
    {error && (
      <div className="flex items-center gap-1 mt-1">
        <span className="text-red-500">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <p
          className="text-red-500 text-sm"
          style={{ ...typography.body.BodyM }}
        >
          {errorMessage}
        </p>
      </div>
    )}
  </div>
);
