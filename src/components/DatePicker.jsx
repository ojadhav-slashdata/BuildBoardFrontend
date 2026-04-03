import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * Styled date picker that matches the BuildBoard design system.
 *
 * Props:
 *  - value: string (YYYY-MM-DD) or Date
 *  - onChange: (dateString: string) => void  — returns YYYY-MM-DD string
 *  - showTimeSelect: boolean — include time picker
 *  - placeholder: string
 *  - className: string — additional classes
 *  - minDate / maxDate: Date
 *  - ...rest passed to ReactDatePicker
 */
export default function DatePicker({
  value,
  onChange,
  showTimeSelect = false,
  placeholder = 'Select date',
  className = '',
  minDate,
  maxDate,
  ...rest
}) {
  // Parse string to Date
  const selected = value ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')) : null;

  const handleChange = (date) => {
    if (!date) { onChange(''); return; }
    if (showTimeSelect) {
      // Return ISO string for datetime
      const pad = (n) => String(n).padStart(2, '0');
      const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      onChange(iso);
    } else {
      // Return YYYY-MM-DD
      const pad = (n) => String(n).padStart(2, '0');
      onChange(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
    }
  };

  return (
    <ReactDatePicker
      selected={selected}
      onChange={handleChange}
      dateFormat={showTimeSelect ? 'MMM d, yyyy h:mm aa' : 'MMM d, yyyy'}
      showTimeSelect={showTimeSelect}
      timeIntervals={15}
      placeholderText={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      className={`bb-datepicker input-field w-full cursor-pointer ${className}`}
      calendarClassName="bb-calendar"
      popperClassName="bb-datepicker-popper"
      showPopperArrow={false}
      autoComplete="off"
      {...rest}
    />
  );
}

/**
 * Time-only picker. Returns HH:MM string.
 */
export function TimePicker({ value, onChange, placeholder = 'Select time', className = '', ...rest }) {
  // Parse HH:MM to a Date
  const selected = value
    ? (() => { const [h, m] = value.split(':'); const d = new Date(); d.setHours(+h, +m, 0, 0); return d; })()
    : null;

  const handleChange = (date) => {
    if (!date) { onChange(''); return; }
    const pad = (n) => String(n).padStart(2, '0');
    onChange(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
  };

  return (
    <ReactDatePicker
      selected={selected}
      onChange={handleChange}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={15}
      dateFormat="h:mm aa"
      placeholderText={placeholder}
      className={`bb-datepicker input-field w-full cursor-pointer ${className}`}
      calendarClassName="bb-calendar"
      popperClassName="bb-datepicker-popper"
      showPopperArrow={false}
      autoComplete="off"
      {...rest}
    />
  );
}
