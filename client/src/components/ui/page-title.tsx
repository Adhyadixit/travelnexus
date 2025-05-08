import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

export function PageTitle({ 
  title, 
  subtitle, 
  center = false,
  className 
}: PageTitleProps) {
  return (
    <div className={cn(
      "mb-6",
      center && "text-center",
      className
    )}>
      <h1 className="text-2xl md:text-3xl font-heading font-bold text-neutral-800">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-neutral-600">{subtitle}</p>
      )}
    </div>
  );
}

export default PageTitle;
