import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { MapPin, Calendar, Users, Car, User, ShieldCheck } from "lucide-react";

const TripPrintPreview = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const accessToken = localStorage.getItem("accessToken");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = `${API_BASE_URL}/api/auth`;
  console.log("baseurl", BASE_URL);

  useEffect(() => {
    const fetchTrip = async () => {
      const res = await fetch(`${BASE_URL}/get-trip-details-by-tId-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tId: tripId }),
      });

      const data = await res.json();
      console.log("trip details:", data);
      setTrip(data?.data || null);
    };

    if (tripId && accessToken) fetchTrip();
  }, [tripId, accessToken]);

  // ✅ Auto print
  useEffect(() => {
    if (trip) setTimeout(() => window.print(), 600);
  }, [trip]);

  if (!trip) return <p style={{ textAlign: "center" }}>Loading…</p>;

  const t = trip.trips || trip;
  const approveTrip = trip.approveTrip || null;
  const checkoutTrips = trip.checkoutTrips || [];
  console.log("checkout:", checkoutTrips);

  const hasApprove =
    approveTrip &&
    (approveTrip.approveby ||
      approveTrip.arrdate ||
      approveTrip.arrtime ||
      approveTrip.remarks);

  const hasCheckout =
    checkoutTrips.length > 0 &&
    (checkoutTrips[0].verifiedby ||
      checkoutTrips[0].checkoutdate ||
      checkoutTrips[0].checkouttime ||
      checkoutTrips[0].remarks);

  const getConvoyTime = (t) => {
    if (!t?.convey) return "-";

    // ✅ Special convoy → show actual_start_time
    if (t.convey.convey_time === "00:00:00") {
      return t.convey.actual_start_time || "-";
    }

    // ✅ Normal convoy
    return t.convey.convey_time || "-";
  };

  return (
    <div style={styles.page}>
      {/* ================= HEADER ================= */}
      <div style={styles.header}>
        <h2 style={styles.title}>CONVOY MANAGEMENT SYSTEM</h2>
        <h3 style={styles.subTitleStrong}>ANDAMAN & NICOBAR POLICE</h3>
        <p style={styles.subTitle}>Official Trip Summary</p>

        <div style={styles.tripBadge}>
          📄 Trip ID: <strong>{tripId}</strong>
        </div>
      </div>
      {/* ================= DETAILS + QR ================= */}
      <div style={styles.topGrid}>
        <table style={styles.infoTable}>
          <tbody>
            <Row
              label={
                <>
                  <MapPin size={14} /> Origin
                </>
              }
              value={t.originLocation?.location}
            />
            <Row
              label={
                <>
                  <MapPin size={14} /> Destination
                </>
              }
              value={t.destinationLocation?.location}
            />
            <Row
              label={
                <>
                  <Calendar size={14} /> Date
                </>
              }
              value={t.date}
            />
            <Row
              label={
                <>
                  <ShieldCheck size={14} /> Convoy
                </>
              }
              value={`${t.convey?.convey_name || "-"} (${getConvoyTime(t)})`}
            />
            <Row
              label={
                <>
                  <Car size={14} /> Vehicle No
                </>
              }
              value={t.vehicle?.vNum}
            />
            <Row
              label={
                <>
                  <User size={14} /> Driver
                </>
              }
              value={`${t.driver?.dFirstName} ${t.driver?.dLastName}`}
            />
            <Row
              label={
                <>
                  <Users size={14} /> Passengers
                </>
              }
              value={t.passengers?.length}
            />
          </tbody>
        </table>

        <div style={styles.qrCard}>
          <QRCodeCanvas value={`Trip ID: ${tripId}`} size={170} />
          <p style={styles.qrText}>🔍 Scan at checkpost for verification</p>
        </div>
      </div>
      {/* ================= APPROVE + CHECKOUT ================= */}
      {(hasApprove || hasCheckout) && (
        <>
          <div style={styles.sectionHeader}>🛂 Verification Summary</div>{" "}
          <div style={styles.rowGrid}>
            {/* ================= APPROVAL DETAILS ================= */}
            {hasApprove && (
              <div style={styles.col6}>
                <div style={styles.subCard}>
                  <div style={styles.subTitle}>✔️ Approved Details</div>
                  <table style={styles.compactTable}>
                    <tbody>
                      <Row
                        label="Convey"
                        value={`${t.convey?.convey_name || "-"} / ${getConvoyTime(t)}`}
                      />
                      <Row
                        label="Checkpoint"
                        value={t.originLocation?.location}
                      />
                      {(approveTrip.arrdate || approveTrip.arrtime) && (
                        <>
                          <Row
                            label="Action Date"
                            value={approveTrip.arrdate}
                          />
                          <Row
                            label="Action Time"
                            value={approveTrip.arrtime}
                          />
                        </>
                      )}
                      {approveTrip.remarks && (
                        <Row label="Remarks" value={approveTrip.remarks} />
                      )}
                      <Row label="Status" value="Approved" />
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= CHECKOUT DETAILS ================= */}
            {hasCheckout && (
              <div style={styles.col6}>
                <div style={styles.subCard}>
                  <div style={styles.subTitle}>🛂 Checkpoint Checkout</div>
                  <table style={styles.compactTable}>
                    <tbody>
                      <Row
                        label="Checkpoint"
                        value={t.destinationLocation?.location}
                      />
                      {(checkoutTrips[0].checkoutdate ||
                        checkoutTrips[0].checkouttime) && (
                        <>
                          <Row
                            label="Checkout Date"
                            value={checkoutTrips[0].checkoutdate}
                          />
                          <Row
                            label="Checkout Time"
                            value={checkoutTrips[0].checkouttime}
                          />
                        </>
                      )}
                      {checkoutTrips[0].remarks && (
                        <Row label="Remarks" value={checkoutTrips[0].remarks} />
                      )}
                      <Row
                        label="Status"
                        value={
                          checkoutTrips[0].status === 1
                            ? "✅ Checked OK"
                            : checkoutTrips[0].status === 2
                              ? "⚠️ Problem"
                              : "❌ Non-arrival"
                        }
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {/* ================= PASSENGERS ================= */}
      <div style={styles.sectionHeader}>👥 Passenger Details</div>{" "}
      <table style={styles.passengerTable}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Gender</th>
            <th style={styles.th}>Document</th>
          </tr>
        </thead>
        <tbody>
          {t.passengers?.map((p, i) => (
            <tr key={i}>
              <td style={styles.td}>{i + 1}</td>
              <td style={styles.td}>{p.passengerName}</td>
              <td style={styles.td}>{p.phoneNo}</td>
              <td style={styles.td}>{p.gender}</td>
              <td style={styles.td}>
                {p.docType} - {p.docId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* ================= DECLARATION ================= */}
      <div style={styles.declarationSection}>
        <div style={styles.declarationTitle}>📋 DECLARATION</div>
        <div style={styles.declarationContent}>
          <p style={styles.declarationItem}>
            • I hereby declare that the above details are correct and true to
            the best of my knowledge.
          </p>
          <p style={styles.declarationItem}>
            • I have apprised the passengers of the prosecution to be taken
            under PAT Regulation.
          </p>
          <p style={styles.declarationItem}>
            • In the event of any information found to be incorrect, fraudulent
            or untrue, I undertake that I am liable for criminal prosecution.
          </p>
          <p style={styles.declarationItem}>
            • I agree to abide by the governing rules and especially the PAT
            Regulations.
          </p>
        </div>
      </div>
      <style>
        {`
          @media print {
            body { margin: 0; }
            nav, aside, header, footer, button {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

/* ===== ROW ===== */
const Row = ({ label, value }) => (
  <tr>
    <td style={styles.label}>
      <span style={styles.labelFlex}>{label}</span>
    </td>
    <td style={styles.value}>{value || "-"}</td>
  </tr>
);

/* ===== STYLES ===== */
const styles = {
  page: {
    width: "210mm",
    minHeight: "297mm",
    padding: "10mm",
    fontFamily: "Arial",
    fontSize: "10px",
    background: "#fff",
    border: "2px solid #1e3a8a", // ✅ page border
    boxSizing: "border-box", // ✅ keeps border inside page size
    position: "relative",
  },
  header: {
    textAlign: "center",
    borderBottom: "2px solid #2563eb",
    marginBottom: "6px",
  },
  title: { margin: 0, color: "#1e40af", fontSize: "14px" },
  subTitle: { margin: "2px 0", fontSize: "10px" },
  tripId: {
    padding: "4px 10px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontWeight: "bold",
  },
  topGrid: { display: "flex", gap: "8px", marginBottom: "4px" },
  infoTable: {
    width: "65%",
    borderCollapse: "collapse",
    border: "1px solid #94a3b8", // ✅ outer table border
  },
  watermark: {
    position: "absolute",
    top: "45%",
    left: "20%",
    fontSize: "60px",
    color: "rgba(0,0,0,0.05)",
    transform: "rotate(-30deg)",
    pointerEvents: "none",
  },
  label: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1", // ✅ cell border
    padding: "4px 5px",
    fontWeight: "bold",
    fontSize: "9px",
  },
  value: { border: "1px solid #cbd5e1", padding: "4px 5px", fontSize: "9px" },
  qrCard: {
    width: "30%",
    border: "1px solid #cbd5e1",
    padding: "6px",
    textAlign: "center",
    background: "#f8fafc",
  },
  qrText: { fontSize: "8px", marginTop: "4px" },
  sectionHeader: {
    marginTop: "6px",
    marginBottom: "4px",
    padding: "4px 6px",
    background: "#eef2ff",
    borderLeft: "4px solid #6366f1",
    fontWeight: "bold",
    fontSize: "10px",
  },
  rowGrid: {
    display: "flex",
    gap: "6px",
    marginTop: "4px",
    marginBottom: "4px",
  },
  col6: { width: "50%" },
  subCard: {
    border: "1px solid #cbd5e1",
    padding: "4px",
    background: "#f8fafc",
    fontSize: "9px",
  },
  compactTable: { width: "100%", borderCollapse: "collapse" },
  passengerTable: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#6366f1",
    color: "#fff",
    padding: "3px 4px",
    border: "1px solid #c7d2fe",
    fontSize: "9px",
  },
  td: { border: "1px solid #e5e7eb", padding: "3px 4px", fontSize: "9px" },
  footer: { marginTop: "18px", fontSize: "11px" },
  footerNote: { fontSize: "10px", color: "#6b7280" },

  subTitleStrong: {
    margin: "2px 0",
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },

  tripBadge: {
    marginTop: "4px",
    display: "inline-block",
    padding: "3px 10px",
    border: "1px solid #2563eb",
    borderRadius: "4px",
    background: "#eff6ff",
    color: "#1e40af",
    fontWeight: "bold",
    fontSize: "9px",
  },

  labelFlex: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  declarationSection: {
    marginTop: "6px",
    border: "1px solid #cbd5e1",
    padding: "6px",
    background: "#fef3c7",
    borderRadius: "4px",
  },
  declarationTitle: {
    fontWeight: "bold",
    fontSize: "10px",
    marginBottom: "4px",
    color: "#92400e",
  },
  declarationContent: {
    fontSize: "8px",
    lineHeight: "1.3",
    color: "#78350f",
  },
  declarationItem: {
    margin: "2px 0",
    textAlign: "justify",
  },
};

export default TripPrintPreview;
