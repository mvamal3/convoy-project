import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

const Captcha = ({ onChange, value = "" }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = `${API_BASE_URL}/api/auth`;
  console.log("baseurl", BASE_URL);
  const canvasRef = useRef(null);
  const [inputValue, setInputValue] = useState(value);

  // Draw captcha directly from backend text
  const drawCaptchaFromText = async () => {
    try {
      const response = await fetch(`${BASE_URL}/captcha?t=${Date.now()}`, {
        credentials: "include", // ✅ VERY IMPORTANT
      });

      const data = await response.json();

      if (data.text && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Blue background
        ctx.fillStyle = "#1e40af";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // White text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(data.text, canvas.width / 2, canvas.height / 2);

        // Store for validation
        sessionStorage.setItem("captchaText", data.text);
      }
    } catch (error) {
      console.error("Captcha error:", error);
      // Draw fallback
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#1e40af";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("123456", canvas.width / 2, canvas.height / 2);
      }
    }
  };

  useEffect(() => {
    // Initialize canvas size
    if (canvasRef.current) {
      canvasRef.current.width = 120;
      canvasRef.current.height = 40;
    }
    drawCaptchaFromText();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const val = e.target.value;
    // Allow only numbers
    const numbersOnly = val.replace(/\D/g, "");
    const limited = numbersOnly.slice(0, 6);

    // Update local state
    setInputValue(limited);

    // Notify parent
    if (onChange && typeof onChange === "function") {
      onChange(limited);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setInputValue("");
    if (onChange && typeof onChange === "function") {
      onChange("");
    }
    drawCaptchaFromText();
  };

  return (
    <div className="space-y-2">
      <Label>
        Captcha <span className="text-red-600">*</span>
      </Label>

      <div className="flex items-center gap-3">
        <div className="h-11 w-32 border rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            width={120}
            height={40}
            className="h-full w-full"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          className="h-11 w-11"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <Input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className="h-11"
            placeholder="Enter captcha"
            maxLength={6}
          />
        </div>
      </div>

      <div className="text-xs space-y-1">
        <p className="text-gray-500">Type the 6-digit number shown</p>
      </div>
    </div>
  );
};

export default Captcha;
