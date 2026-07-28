export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "connected", label: "Connected" },
  { value: "recall", label: "Recall" },
  { value: "not_reachable", label: "Not reachable" },
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]["value"];

const LEGACY_LABELS: Record<string, string> = {
  attempting: "New",
  recall_done: "Recall",
  closed: "Not reachable",
};

export function isEnquiryStatus(value: string): value is EnquiryStatus {
  return ENQUIRY_STATUSES.some((s) => s.value === value);
}

export function enquiryStatusLabel(status: string): string {
  return (
    ENQUIRY_STATUSES.find((s) => s.value === status)?.label ??
    LEGACY_LABELS[status] ??
    status
  );
}
