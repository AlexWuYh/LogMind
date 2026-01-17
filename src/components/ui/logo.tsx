import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-primary", className)}
    >
      {/* 
        Concept: "Minimalist Infinity/Flow"
        A clean, continuous line forming an abstract shape that suggests
        infinite flow (logging) and connection (mind).
        It looks like an abstract "M" or a brain wave.
      */}
      <path 
        d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" 
        className="stroke-primary/20" 
        strokeWidth="1"
      />
      <path d="M7 12c0 2.8 2.2 5 5 5s5-2.2 5-5-2.2-5-5-5" />
      <path d="M12 7v5l3 3" />
      <circle cx="12" cy="12" r="1" className="fill-primary" stroke="none" />
    </svg>
  );
}
