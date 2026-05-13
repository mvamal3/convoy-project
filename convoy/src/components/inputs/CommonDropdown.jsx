import React from "react";
import { Label } from "@/components/ui/label";

const CommonDropdown = ({
  label,
  required = false,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  className = "",
  disabled = false,
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}

          {required && <span className="text-red-600"> *</span>}
        </Label>
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
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
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-500
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        <option value="">{placeholder}</option>

        {options.map((option, index) => (
          <option key={option.value || index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CommonDropdown;
