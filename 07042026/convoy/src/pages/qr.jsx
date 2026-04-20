import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRScannerPage = () => {
  const [scannedText, setScannedText] = useState("");
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }

        // Prevent multiple starts
        if (scannerRef.current.getState() === "SCANNING") return;

        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (!isMounted) return;

            setScannedText(decodedText);

            // ✅ Stop safely
            try {
              if (
                scannerRef.current &&
                scannerRef.current.getState() === "SCANNING"
              ) {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
                scannerRef.current = null;
              }
            } catch {}

            // ✅ Build URL dynamically (IP / localhost / prod safe)
            const { protocol, host } = window.location;
            const approvalUrl = `${protocol}//${host}/approvals/ApproveTrip/${decodedText}`;

            window.location.href = approvalUrl;
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera start failed:", err);
        setScannerError(
          "Camera not accessible. Please use HTTPS or localhost."
        );
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-bold mb-4">Scan QR Code</h1>

      {scannerError && (
        <p className="text-center text-red-600 mb-2">{scannerError}</p>
      )}

      {scannedText && (
        <p className="text-center text-blue-600 mb-2">
          Scanned QR: <strong>{scannedText}</strong>
        </p>
      )}

      <div
        id="qr-reader"
        style={{ width: "300px", height: "300px" }}
        className="border rounded"
      />
    </div>
  );
};

export default QRScannerPage;
