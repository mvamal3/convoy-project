import * as XLSX from "xlsx";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

// public/sample/Passenger_Upload_Sample.xlsx carries this code on a very hidden sheet.
const FORMAT_SHEET = "FormatCheck";
const FORMAT_CODE = "CONVOY-PASSENGER-FORMAT-V1";

const COLUMNS = [
  "SlNo",
  "IsForeigner",
  "PassengerName",
  "FatherName",
  "Age",
  "Gender",
  "Phone",
  "Residence",
  "IsIslander",
  "DocumentType",
  "DocumentId",
  "PassportNo",
  "Nationality",
  "VisaNo",
  "LastStayInAndaman",
  "ValidationErrors",
  "ValidationErrors",
  "ValidationErrors",
];

// shortcut: browser-only check that can be bypassed (the API still validates each passenger), move it to the server if files are ever stored.
export const isOfficialFormat = (workbook) => {
  if (workbook.Sheets[FORMAT_SHEET]?.A1?.v !== FORMAT_CODE) return false;

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const [headers = []] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return headers.join("|") === COLUMNS.join("|");
};
