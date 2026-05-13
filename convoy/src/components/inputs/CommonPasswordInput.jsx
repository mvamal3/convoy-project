import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const CommonPasswordInput = ({
  label,
  required = false,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-1">
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}

          {required && <span className="text-red-600"> *</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            h-11
            rounded-md
            border
            border-gray-300
            bg-white
            px-3
            pr-10
            text-sm
            outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
            focus-visible:border-blue-500
            ${className}
          `}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          disabled={disabled}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

export default CommonPasswordInput;
