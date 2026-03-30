import { Suspense, lazy, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative ${className || ""}`}>
      {/* Placeholder while loading */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <Suspense fallback={null}>
        <div
          className={`w-full h-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <Spline
            scene={scene}
            onLoad={() => setLoaded(true)}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Suspense>
    </div>
  );
}
