import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
  style,
}: DisplayCardProps & { style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "border border-border/40 rounded-xl bg-muted/70 flex flex-col gap-2 transition-all duration-700 hover:border-border [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
      style={style}
    >
      <div>
        <span className={cn("relative flex size-6 items-center justify-center", iconClassName)}>
          {icon}
        </span>
        <span className={cn("text-base font-semibold", titleClassName)}>{title}</span>
      </div>
      <p className="text-base text-muted-foreground whitespace-nowrap">{description}</p>
      <p className="text-sm text-muted-foreground/50">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
  paddingX?: number;
  paddingY?: number;
  spacingX?: number;
  spacingY?: number;
}

export default function DisplayCards({ cards, paddingX = 24, paddingY = 24, spacingX = 80, spacingY = 48 }: DisplayCardsProps) {
  const defaultCards: DisplayCardProps[] = [
    { className: "[grid-area:stack]" },
    { className: "[grid-area:stack]" },
    { className: "[grid-area:stack]" },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center">
      {displayCards.map((cardProps, index) => {
        const isLast = index === displayCards.length - 1;
        const baseTransform = `translate(${index * spacingX}px, ${index * spacingY}px)`;
        return (
          <DisplayCard
            key={index}
            {...cardProps}
            className={cn(
              "[grid-area:stack] transition-all duration-700",
              !isLast && "before:absolute before:w-full before:outline-1 before:rounded-xl before:outline-border before:h-full before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
              cardProps.className
            )}
            style={{
              padding: `${paddingY}px ${paddingX}px`,
              transform: baseTransform,
            }}
          />
        );
      })}
    </div>
  );
}
