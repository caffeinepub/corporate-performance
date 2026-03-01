import { type LucideIcon, Wrench } from "lucide-react";
import { motion } from "motion/react";

interface StubPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function StubPage({
  title,
  description,
  icon: Icon = Wrench,
}: StubPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex-1 flex flex-col"
    >
      {/* Page header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <h1 className="font-display text-xl font-bold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Coming soon content */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-sm text-center space-y-5">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "oklch(0.94 0.012 252)" }}
          >
            <Icon
              className="w-8 h-8"
              style={{ color: "oklch(0.52 0.065 258)" }}
              strokeWidth={1.5}
            />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              This feature is coming soon
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{title}</strong> is part of
              the next development phase. The backend foundation is fully
              operational and ready.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
            style={{
              background: "oklch(0.94 0.012 252)",
              color: "oklch(0.42 0.055 258)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "oklch(0.62 0.13 195)" }}
            />
            In development
          </div>
        </div>
      </div>
    </motion.div>
  );
}
