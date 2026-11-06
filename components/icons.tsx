// Lucide-style icons, 1.5px stroke
type P = { className?: string };
const base = (d: React.ReactNode, className = "h-5 w-5") => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{d}</svg>
);
export const SearchIcon = ({ className }: P) => base(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, className);
export const PinIcon = ({ className }: P) => base(<><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>, className);
export const BookmarkIcon = ({ className, filled }: P & { filled?: boolean }) => base(<path d="M6 3h12v18l-6-4-6 4V3Z" fill={filled ? "currentColor" : "none"} />, className);
export const ArrowIcon = ({ className }: P) => base(<path d="M5 12h14m-6-6 6 6-6 6" />, `flip-rtl ${className ?? "h-4 w-4"}`);
export const BackIcon = ({ className }: P) => base(<path d="M19 12H5m6 6-6-6 6-6" />, `flip-rtl ${className ?? "h-4 w-4"}`);
export const ExternalIcon = ({ className }: P) => base(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>, `flip-rtl ${className ?? "h-4 w-4"}`);
export const FlagIcon = ({ className }: P) => base(<path d="M5 21V4m0 0h11l-2 4 2 4H5" />, className);
export const BellIcon = ({ className }: P) => base(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></>, className);
export const ShieldIcon = ({ className }: P) => base(<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4" />, className);
export const MenuIcon = ({ className }: P) => base(<path d="M4 7h16M4 12h16M4 17h16" />, className);
export const SunMoonIcon = ({ className }: P) => base(<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />, className);
export const CheckIcon = ({ className }: P) => base(<path d="m5 12 4 4 10-10" />, className ?? "h-4 w-4");
export const UploadIcon = ({ className }: P) => base(<><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>, className);
export const FilterIcon = ({ className }: P) => base(<path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z" />, className);
// Brand marks are filled, not stroked
const brand = (d: string, className = "h-5 w-5") => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden><path d={d} /></svg>
);
export const FacebookIcon = ({ className }: P) => brand("M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z", className);
export const LinkedInIcon = ({ className }: P) => brand("M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z", className);
export const XIcon = ({ className }: P) => brand("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z", className);
export const ShareIcon =({ className }: P) => base(<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6m-7.6 6 7.6 3.6" /></>, className);
