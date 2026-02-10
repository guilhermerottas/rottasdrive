import { ReactNode } from "react";
import { motion } from "framer-motion";
import MasonryCSS from "react-masonry-css";
import "./AnimatedMasonry.css";

interface AnimatedMasonryProps {
  children: ReactNode;
  breakpointCols?: {
    default: number;
    [key: number]: number;
  };
  columnClassName?: string;
  className?: string;
}

export function AnimatedMasonry({
  children,
  breakpointCols = {
    default: 6,
    1536: 6, // 2xl
    1280: 5, // xl
    1024: 4, // lg
    768: 3,  // md
    640: 2,  // sm
  },
  columnClassName = "masonry-grid_column",
  className = "masonry-grid",
}: AnimatedMasonryProps) {
  return (
    <MasonryCSS
      breakpointCols={breakpointCols}
      className={className}
      columnClassName={columnClassName}
    >
      {children}
    </MasonryCSS>
  );
}

interface MasonryItemProps {
  children: ReactNode;
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  animateFrom?: "bottom" | "top" | "left" | "right";
  delay?: number;
}

export function MasonryItem({
  children,
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  animateFrom = "bottom",
  delay = 0,
}: MasonryItemProps) {
  const getInitialPosition = () => {
    switch (animateFrom) {
      case "bottom":
        return { y: 50, opacity: 0 };
      case "top":
        return { y: -50, opacity: 0 };
      case "left":
        return { x: -50, opacity: 0 };
      case "right":
        return { x: 50, opacity: 0 };
      default:
        return { y: 50, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={{
        ...getInitialPosition(),
        filter: blurToFocus ? "blur(10px)" : "blur(0px)",
      }}
      animate={{
        y: 0,
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
      }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1], // power3.out equivalent
      }}
      whileHover={
        scaleOnHover
          ? {
              scale: hoverScale,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      className="masonry-item"
    >
      {children}
    </motion.div>
  );
}
