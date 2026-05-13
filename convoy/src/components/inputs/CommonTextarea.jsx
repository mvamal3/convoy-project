import React from "react";
import { Label } from "@/components/ui/label";

const CommonTextarea = ({
  label,
  required = false,
  value,
  onChange,
  placeholder = "",
  maxLength,
  disabled = false,
  className = "",
  rows = 3,
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}

          {required && <span className="text-red-600"> *</span>}
        </Label>
      )}

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={rows}
        className={`
          w-full
          rounded-md
          border
          border-gray-300
          bg-white
          px-3
          py-2
          text-sm
          outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-500
          resize-vertical
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `}
      />
    </div>
  );
};

export default CommonTextarea;
