export const formatDateDDMMYY = (dateValue) => {
  if (!dateValue) return "-";

  const d = new Date(dateValue);
  if (isNaN(d)) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
};

export const formatTimeHHMM = (dateValue) => {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
