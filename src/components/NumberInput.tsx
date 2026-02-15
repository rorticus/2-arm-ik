import { useEffect, useState, type ReactNode } from "react";

type NumberInputProps = {
  label?: ReactNode;
  value: number;
  onChange: (value: number) => void;
};

export default function NumberInput({
  label,
  value,
  onChange,
}: NumberInputProps) {
  const [valueInput, setValueInput] = useState(value.toString());

  useEffect(() => {
    setValueInput(value.toString());
  }, [value]);

  return (
    <div className="flex flex-row items-center gap-1">
      {label && <div>{label}</div>}
      <input
        type="text"
        className="ml-4 p-2 rounded bg-white w-16"
        value={valueInput}
        onChange={(e) => {
          const newValue = e.target.value;
          setValueInput(newValue);
          const parsedValue = parseFloat(newValue);
          if (!isNaN(parsedValue)) {
            onChange(parsedValue);
          }
        }}
        onBlur={() => setValueInput(value.toString())}
      />
    </div>
  );
}
