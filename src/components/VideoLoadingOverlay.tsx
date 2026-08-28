"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface VideoLoadingOverlayProps {
  /** Source URL for the video relative to public directory */
  src?: string;
  /** Maximum fallback duration in milliseconds before fading out automatically */
  timeoutMs?: number;
}

const SESSION_KEY = "nysi_video_loader_played";

/** Helper to dispatch event when loader finishes or is skipped */
export function notifyLoaderFinished() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nysi:loaderFinished"));
  }
}

/**
 * Full-screen video loading overlay component.
 * Plays a video only on the initial website entry per browser session.
 * Locks body scroll, notifies subscribers when finished, and smoothly fades out.
 */
export function VideoLoadingOverlay({
  src = "/gallery/upscaled-video.mp4",
  timeoutMs = 12000,
}: VideoLoadingOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFinish = () => {
    setIsVisible(false);
  };

  // Check session storage on mount to ensure video plays only once per session
  useEffect(() => {
    try {
      const hasPlayed = sessionStorage.getItem(SESSION_KEY);
      if (!hasPlayed) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setIsVisible(true);
      } else {
        // Already played in this session; notify page components immediately
        notifyLoaderFinished();
      }
    } catch {
      // Fallback if sessionStorage is unavailable (e.g. strict privacy settings)
      setIsVisible(true);
    }
  }, []);

  // Ensure body scroll is locked while loading overlay is visible
  useEffect(() => {
    if (isVisible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVisible]);

  // Set video playback and safety timeout fallback only when overlay is visible
  useEffect(() => {
    if (!isVisible) return;

    // Safety fallback timer in case video stalls or fails to play
    timeoutRef.current = setTimeout(() => {
      handleFinish();
    }, timeoutMs);

    // Explicitly attempt playback for video element
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Video autoplay notice:", err);
        handleFinish();
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, timeoutMs]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.body.style.overflow = "";
        notifyLoaderFinished();
      }}
    >
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden select-none pointer-events-auto"
          style={{ width: "100vw", height: "100dvh" }}
          aria-label="Loading..."
          role="dialog"
          aria-modal="true"
        >
          <video
            ref={videoRef}
            src={src}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleFinish}
            onError={handleFinish}
            className="w-full h-full max-w-full max-h-full object-contain md:object-cover pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
