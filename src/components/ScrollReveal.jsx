import React, { useEffect, useRef, useState } from "react";

export default function ScrollReveal({ children, className = "", delay = 0, duration = 700, distance = "20px" }) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target); // Reveal only once
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -40px 0px", // Trigger slightly before entering viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        opacity: isIntersecting ? 1 : 0,
        transform: isIntersecting ? "none" : `translateY(${distance})`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
