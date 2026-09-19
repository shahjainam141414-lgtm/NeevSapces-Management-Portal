export type TestimonialStatus = "active" | "inactive";

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  sort_order: number;
  status: TestimonialStatus;
  created_at?: string;
  updated_at?: string;
};

export function getTestimonialInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "N";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
