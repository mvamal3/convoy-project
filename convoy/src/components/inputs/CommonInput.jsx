import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sanitizeInput = (value, validationType) => {
  switch (validationType) {

    case "name":
      return value.replace(/[^A-Za-z ]/g, "");

    case "alphanumeric":
      return value.replace(/[^A-Za-z0-9 ]/g, "");

    case "alphanumericNoSpace":
      return value.replace(/[^A-Za-z0-9]/g, "");

    case "number":
      return value.replace(/[^0-9]/g, "");

    case "email":
      return value.replace(/[^A-Za-z0-9@._-]/g, "");

    default:
      return value.replace(/[<>]/g, "");
  }
};

const CommonInput = ({
  label,
  required = false,
  type = "text",
  value,
  onChange,
  placeholder = "",
  maxLength,
  disabled = false,
  className = "",
  inputMode,
  pattern,
  validationType = "default",
}) => {

  const handleChange = (e) => {

    // Never sanitize passwords
    if (type === "password") {
      onChange(e);
      return;
    }

    const sanitizedValue = sanitizeInput(
      e.target.value,
      validationType
    );

    onChange({
      ...e,
      target: {
        ...e.target,
        value: sanitizedValue,
      },
    });
  };

  return (
    <div className="w-full space-y-1">
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </Label>
      )}

      <Input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        inputMode={inputMode}
        pattern={pattern}
        className={`
          w-full
          h-11
          rounded-md
          border
          border-gray-300
          bg-white
          px-3
          text-sm
          outline-none
          focus-visible:ring-2
          focus-visible:ring-blue-500
          focus-visible:border-blue-500
          ${className}
        `}
      />
    </div>
  );
};

export default CommonInput;