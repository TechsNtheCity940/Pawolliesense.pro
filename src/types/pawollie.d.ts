export {};

declare global {
  interface Window {
    pawollieInitDrawer?: () => void;
    pawollieInitIntakeForm?: () => void;
    pawollieInitServicePickButtons?: () => void;
    pawollieInitServicePreselectFromUrl?: () => void;
    pawollieInitPhotoBooth?: () => void;
    pawollieInitCommunityGame?: () => void;
  }
}
