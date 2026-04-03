import Select from 'react-select';

/**
 * Styled dropdown that matches the BuildBoard design system.
 *
 * Props:
 *  - value: string — the currently selected value
 *  - onChange: (value: string) => void
 *  - options: Array<{ value: string, label: string }> or Array<string>
 *  - placeholder: string
 *  - className: string
 *  - isSearchable: boolean (default false)
 *  - isClearable: boolean (default false)
 */
export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  isSearchable = false,
  isClearable = false,
  ...rest
}) {
  // Normalize options: accept strings or {value, label}
  const normalized = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  const selected = normalized.find(o => o.value === value) || null;

  return (
    <Select
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : '')}
      options={normalized}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isClearable={isClearable}
      className={className}
      classNamePrefix="bb-select"
      unstyled
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: 'var(--c-surface-container-low, #f0f4f7)',
          borderRadius: '0.75rem',
          padding: '0.55rem 1rem',
          fontSize: '0.875rem',
          border: 'none',
          boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 101, 146, 0.2)' : 'none',
          cursor: 'pointer',
          minHeight: '44px',
          transition: 'all 0.2s',
        }),
        valueContainer: (base) => ({
          ...base,
          padding: 0,
        }),
        singleValue: (base) => ({
          ...base,
          color: 'var(--c-on-surface, #2c3437)',
          fontWeight: 500,
        }),
        placeholder: (base) => ({
          ...base,
          color: '#94a3b8',
        }),
        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (base, state) => ({
          ...base,
          color: 'var(--c-on-surface-variant, #596064)',
          padding: 0,
          transition: 'transform 0.2s',
          transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: '#fff',
          borderRadius: '1rem',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          zIndex: 50,
          marginTop: '6px',
          animation: 'bbDropIn 0.15s ease-out',
        }),
        menuList: (base) => ({
          ...base,
          padding: '6px',
          maxHeight: '240px',
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? 'var(--c-primary, #006592)'
            : state.isFocused
              ? 'var(--c-surface-container-high, #e3e9ed)'
              : 'transparent',
          color: state.isSelected ? '#fff' : 'var(--c-on-surface, #2c3437)',
          borderRadius: '0.5rem',
          padding: '0.625rem 0.875rem',
          fontSize: '0.875rem',
          fontWeight: state.isSelected ? 600 : 400,
          cursor: 'pointer',
          transition: 'background-color 0.1s',
        }),
        clearIndicator: (base) => ({
          ...base,
          color: 'var(--c-on-surface-variant, #596064)',
          cursor: 'pointer',
          padding: '0 4px',
          '&:hover': { color: 'var(--c-error, #a83836)' },
        }),
        noOptionsMessage: (base) => ({
          ...base,
          color: '#94a3b8',
          fontSize: '0.875rem',
          padding: '0.75rem',
        }),
      }}
      {...rest}
    />
  );
}
