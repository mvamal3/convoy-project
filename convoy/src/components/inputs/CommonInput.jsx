import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
}) => {
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
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full
          h-11
          rounded-md
          border border-gray-300
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
