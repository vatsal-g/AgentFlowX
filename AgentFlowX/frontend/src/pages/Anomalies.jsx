import { useEffect, useState } from "react";
import { api } from "../api";

export default function Anomalies() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/anomalies")
      .then(res => {
        setData(res.data);
        setError("");
      })
      .catch(err => {
        const status = err.response?.status;

        if (status === 403) {
          setError("NO_ACCESS");
        } else if (status === 401) {
          setError("NOT_AUTHENTICATED");
        } else {
          setError("UNKNOWN");
        }
      });
  }, []);

  // NO ACCESS MESSAGE
  if (error === "NO_ACCESS") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-xl font-semibold text-red-400">
          Access Restricted
        </h2>
        <p className="text-slate-400 mt-2 max-w-md">
          Anomaly detection contains sensitive financial risk insights.
          Only authorized roles such as <b>Admin </b> or <b> Accountant </b>
          can access this feature.
        </p>
      </div>
    );
  }

  // NOT LOGGED IN
  if (error === "NOT_AUTHENTICATED") {
    return (
      <p className="text-red-400">
        Please log in again to continue.
      </p>
    );
  }

  // UNKNOWN ERROR
  if (error === "UNKNOWN") {
    return (
      <p className="text-red-400">
        Failed to load anomalies.
      </p>
    );
  }

  if (!data) return <p>Loading anomalies...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Anomaly Detection</h1>

      {data.analysis?.length === 0 && (
        <p className="text-slate-400">
          No anomalies detected. Your financial activity looks normal.
        </p>
      )}

      {data.analysis?.map((item, i) => (
        <div
          key={i}
          className="bg-slate-800 p-4 rounded mb-3"
        >
          <p className="text-red-400 font-semibold">
            ⚠ {item.reason}
          </p>
        </div>
      ))}
    </div>
  );
}
