import { create } from 'zustand';

type ExperienceState = {
  /** Raw scroll progress 0..1 across the whole journey */
  progress: number;
  /** Whether the WebGL world is ready / preloader dismissed */
  ready: boolean;
  setProgress: (p: number) => void;
  setReady: (r: boolean) => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  progress: 0,
  ready: false,
  setProgress: (p) => set({ progress: p }),
  setReady: (r) => set({ ready: r }),
}));
