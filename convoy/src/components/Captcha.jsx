
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import CommonInput from "@/components/inputs/CommonInput";

const Captcha = ({ onChange, value = "", refreshTrigger }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = `${API_BASE_URL}/api/auth`;

  const [inputValue, setInputValue] = useState(value);
  const [captchaImage, setCaptchaImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState("");

  const imageUrlRef = useRef("");
  const previousRefreshTrigger = useRef(refreshTrigger);
  const requestIdRef = useRef(0);

  const drawCaptchaFromText = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCaptchaError("");

    try {
      const response = await fetch(
        `${BASE_URL}/captcha?t=${Date.now()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load CAPTCHA");
      }

      const imageBlob = await response.blob();

      if (!imageBlob.type.includes("image/")) {
        throw new Error("Invalid CAPTCHA image response");
      }

      const imageUrl = URL.createObjectURL(imageBlob);

      // Ignore stale responses from earlier requests.
      if (requestId !== requestIdRef.current) {
        URL.revokeObjectURL(imageUrl);
        return;
      }

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      imageUrlRef.current = imageUrl;
      setCaptchaImage(imageUrl);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        console.error("CAPTCHA loading failed:", error);
        setCaptchaError("Unable to load CAPTCHA. Please refresh.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [BASE_URL]);

  const handleRefresh = useCallback(() => {
    setInputValue("");
    onChange?.("");
    drawCaptchaFromText();
  }, [drawCaptchaFromText, onChange]);

  // Load the initial CAPTCHA.
  useEffect(() => {
    drawCaptchaFromText();

    return () => {
      // Invalidate pending requests on cleanup.
      requestIdRef.current++;

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = "";
      }
    };
  }, [drawCaptchaFromText]);

  // Refresh only when the parent's trigger actually changes.
  useEffect(() => {
    if (previousRefreshTrigger.current === refreshTrigger) {
      return;
    }

    previousRefreshTrigger.current = refreshTrigger;
    handleRefresh();
  }, [refreshTrigger, handleRefresh]);

  const handleChange = (e) => {
    const limited = e.target.value.replace(/\D/g, "").slice(0, 6);

    setInputValue(limited);
    onChange?.(limited);
  };

  return (
    <div className="space-y-2">
      <Label>
        Captcha <span className="text-red-600">*</span>
      </Label>

      <div className="flex items-center gap-3">
        <div className="h-11 w-32 border rounded-md overflow-hidden flex items-center justify-center bg-white">
          {captchaImage ? (
            <img
              src={captchaImage}
              alt="CAPTCHA verification image"
              className="h-full w-full"
            />
          ) : (
            <span className="text-xs text-gray-500">
              {loading ? "Loading..." : "CAPTCHA unavailable"}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={loading}
          className="h-11 w-11"
          aria-label="Refresh CAPTCHA"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <CommonInput
            value={inputValue}
            onChange={handleChange}
            placeholder="Enter captcha"
            maxLength={6}
            inputMode="numeric"
            className="h-11"
          />
        </div>
      </div>

      <div className="text-xs space-y-1">
        <p className="text-gray-500">
          Type the 6-digit number shown
        </p>

        {captchaError && (
          <p className="text-red-600">{captchaError}</p>
        )}
      </div>
    </div>
  );
};

export default Captcha;
