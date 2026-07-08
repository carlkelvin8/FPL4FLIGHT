export type FlightStatus = "scheduled" | "boarding" | "departed" | "arrived" | "delayed" | "cancelled";

export interface FlightSchedule {
  id: string;
  flightNumber: string;
  departure: { code: string; city: string; country: string; time: string };
  arrival: { code: string; city: string; country: string; time: string };
  date: string;
  aircraft: string;
  status: FlightStatus;
  gate?: string | undefined;
  pilotInCommand?: string | undefined;
  remarks?: string | undefined;
}

export const STATUS_CONFIG: Record<FlightStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Scheduled", color: "#4f46e5", bg: "#eef2ff" },
  boarding: { label: "Boarding", color: "#d97706", bg: "#fef3c7" },
  departed: { label: "Departed", color: "#16a34a", bg: "#f0fdf4" },
  arrived: { label: "Arrived", color: "#166534", bg: "#dcfce7" },
  delayed: { label: "Delayed", color: "#dc2626", bg: "#fef2f2" },
  cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2" },
};

export interface FlightFormData {
  flightNumber: string;
  depCode: string;
  depCity: string;
  depCountry: string;
  depTime: string;
  arrCode: string;
  arrCity: string;
  arrCountry: string;
  arrTime: string;
  date: string;
  aircraft: string;
  gate: string;
  pilotInCommand: string;
  remarks: string;
}
