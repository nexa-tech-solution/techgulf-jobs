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
export const ShareIcon = ({ className }: P) => base(<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6m-7.6 6 7.6 3.6" /></>, className);
