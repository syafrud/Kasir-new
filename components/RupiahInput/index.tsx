import React, { useState, useEffect, ChangeEvent } from "react";

interface RupiahInputProps {
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const RupiahInput: React.FC<RupiahInputProps> = ({
  value,
  onChange,
  name,
  placeholder,
  required = false,
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState<string>("");

  const formatToRupiah = (num: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const parseRupiahValue = (str: string): string => {
    return str.replace(/[^\d]/g, "");
  };

  useEffect(() => {
    if (value) {
      const numericValue = parseRupiahValue(value.toString());
      if (numericValue) {
        setDisplayValue(formatToRupiah(Number(numericValue)));
      } else {
        setDisplayValue("");
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseRupiahValue(e.target.value);

    // Update display value
    if (rawValue !== "") {
      setDisplayValue(formatToRupiah(Number(rawValue)));
    } else {
      setDisplayValue("");
    }

    // Create a new event with the raw numeric value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: rawValue, // Pass the raw numeric value
      },
    } as ChangeEvent<HTMLInputElement>;

    onChange(newEvent);
  };

  return (
    <input
      type="text"
      name={name}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleInputChange}
      required={required}
      className={className}
    />
  );
};

export default RupiahInput;
