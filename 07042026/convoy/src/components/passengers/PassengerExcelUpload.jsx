import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

export default function PassengerExcelUpload({ onData }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log("📄 Extracted Excel Data:", jsonData);

        // send data to parent component
        if (onData) onData(jsonData);
      } catch (error) {
        console.error("Excel parsing error:", error);
        alert("Invalid Excel format");
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Upload Passenger Excel
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => fileRef.current.click()}
        >
          <UploadCloud size={18} />
          Select Excel File
        </Button>

        <input
          type="file"
          accept=".xlsx, .xls"
          hidden
          ref={fileRef}
          onChange={handleFileUpload}
        />

        {fileName && (
          <p className="text-sm text-muted-foreground">
            Selected File: <strong>{fileName}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
