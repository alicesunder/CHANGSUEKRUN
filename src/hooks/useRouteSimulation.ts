import { useState, useEffect, useRef, useCallback } from 'react';
import { RouteId, Landmark } from '../types';
import { routesData } from '../data/eventData';
import { calculateHaversineDistance } from '../utils/geo';

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  progress: number; // 0 to 100
  currentKm: number;
  totalKm: number;
  currentCoord: [number, number];
  speedMultiplier: number;
  elapsedSeconds: number;
  estimatedPaceMinKm: number;
  currentLandmark: Landmark | null;
  passedLandmarks: string[];
}

export function useRouteSimulation(routeId: RouteId) {
  const currentRoute = routesData[routeId] || routesData['3km'];
  const coordinates = currentRoute.coordinates;
  const totalKm = currentRoute.distanceKm;

  // Pre-calculate cumulative distances for each segment
  const segmentDistancesRef = useRef<number[]>([]);
  const totalCalculatedKmRef = useRef<number>(totalKm);

  useEffect(() => {
    const coords = currentRoute.coordinates;
    const segs: number[] = [0];
    let sum = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const d = calculateHaversineDistance(
        coords[i][0],
        coords[i][1],
        coords[i + 1][0],
        coords[i + 1][1]
      );
      sum += d;
      segs.push(sum);
    }
    segmentDistancesRef.current = segs;
    totalCalculatedKmRef.current = sum > 0 ? sum : totalKm;
  }, [currentRoute, totalKm]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentKm, setCurrentKm] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentLandmark, setCurrentLandmark] = useState<Landmark | null>(null);
  const [passedLandmarks, setPassedLandmarks] = useState<string[]>([]);

  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const speedRef = useRef(1);
  speedRef.current = speedMultiplier;

  // Base simulation duration in seconds at 1x speed (e.g. 45 seconds to tour full route)
  const BASE_RUN_DURATION_SEC = 50;

  const currentCoord: [number, number] = (() => {
    if (coordinates.length === 0) return [12.6948, 99.9642];
    if (progressRef.current <= 0) return coordinates[0];
    if (progressRef.current >= 100) return coordinates[coordinates.length - 1];

    const targetKm = (progressRef.current / 100) * totalCalculatedKmRef.current;
    const segs = segmentDistancesRef.current;

    let segIndex = 0;
    for (let i = 0; i < segs.length - 1; i++) {
      if (targetKm >= segs[i] && targetKm <= segs[i + 1]) {
        segIndex = i;
        break;
      }
    }

    const startSegKm = segs[segIndex] || 0;
    const endSegKm = segs[segIndex + 1] || totalCalculatedKmRef.current;
    const segLength = endSegKm - startSegKm;
    const factor = segLength > 0 ? Math.min(Math.max((targetKm - startSegKm) / segLength, 0), 1) : 0;

    const p1 = coordinates[segIndex] || coordinates[0];
    const p2 = coordinates[segIndex + 1] || p1;

    // Linear interpolation between p1 and p2
    const lat = p1[0] + (p2[0] - p1[0]) * factor;
    const lng = p1[1] + (p2[1] - p1[1]) * factor;
    return [lat, lng];
  })();

  // Landmark proximity detection
  useEffect(() => {
    if (!isRunning) return;
    const currentDistance = (progress / 100) * totalKm;
    const landmarks = currentRoute.landmarks;

    // Find if we are near any landmark within ~0.35 km
    const matched = landmarks.find((lm) => {
      const diff = Math.abs(lm.distanceFromStartKm - currentDistance);
      return diff < 0.35;
    });

    if (matched) {
      setCurrentLandmark(matched);
      setPassedLandmarks((prev) => (prev.includes(matched.id) ? prev : [...prev, matched.id]));
    } else {
      // Clear after a brief delay so landmark card stays visible for a few seconds
      const timeout = setTimeout(() => {
        setCurrentLandmark((curr) => {
          if (curr && Math.abs(curr.distanceFromStartKm - currentDistance) > 0.6) {
            return null;
          }
          return curr;
        });
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [progress, isRunning, totalKm, currentRoute.landmarks]);

  // Animation Loop
  const loop = useCallback((time: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
    }
    const deltaMs = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Advance progress
    const deltaSeconds = deltaMs / 1000;
    const progressInc = (deltaSeconds / BASE_RUN_DURATION_SEC) * 100 * speedRef.current;

    progressRef.current = Math.min(progressRef.current + progressInc, 100);
    setProgress(progressRef.current);
    setCurrentKm(parseFloat(((progressRef.current / 100) * totalKm).toFixed(2)));
    setElapsedSeconds((prev) => prev + deltaSeconds);

    if (progressRef.current >= 100) {
      setIsRunning(false);
      setIsPaused(false);
      setIsComplete(true);
      animFrameIdRef.current = null;
      lastTimeRef.current = null;
      return;
    }

    animFrameIdRef.current = requestAnimationFrame(loop);
  }, [totalKm]);

  const start = useCallback(() => {
    if (isComplete || progressRef.current >= 100) {
      progressRef.current = 0;
      setProgress(0);
      setCurrentKm(0);
      setElapsedSeconds(0);
      setIsComplete(false);
      setPassedLandmarks([]);
      setCurrentLandmark(null);
    }
    setIsRunning(true);
    setIsPaused(false);
    lastTimeRef.current = null;
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = requestAnimationFrame(loop);
  }, [isComplete, loop]);

  const pause = useCallback(() => {
    setIsPaused(true);
    setIsRunning(false);
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    lastTimeRef.current = null;
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const restart = useCallback(() => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = null;
    lastTimeRef.current = null;
    progressRef.current = 0;
    setProgress(0);
    setCurrentKm(0);
    setElapsedSeconds(0);
    setIsComplete(false);
    setIsPaused(false);
    setIsRunning(true);
    setPassedLandmarks([]);
    setCurrentLandmark(null);
    animFrameIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const exit = useCallback(() => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = null;
    lastTimeRef.current = null;
    progressRef.current = 0;
    setProgress(0);
    setCurrentKm(0);
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    setCurrentLandmark(null);
    setPassedLandmarks([]);
  }, []);

  // Cleanup on unmount or route change
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [routeId]);

  return {
    isRunning,
    isPaused,
    isComplete,
    progress,
    currentKm,
    totalKm,
    currentCoord,
    speedMultiplier,
    setSpeedMultiplier,
    elapsedSeconds,
    estimatedPaceMinKm: 6.2, // Simulated realistic 6:12 min/km pace
    currentLandmark,
    passedLandmarks,
    start,
    pause,
    resume,
    restart,
    exit,
  };
}
