export {};

declare global {
  interface Window {
    pawollieInitDrawer?: () => void;
    pawollieInitIntakeForm?: () => void;
    pawollieInitServicePickButtons?: () => void;
    pawollieInitServicePreselectFromUrl?: () => void;
    pawollieInitPhotoBooth?: () => void;
    pawollieInitCart?: () => void;
    pawollieInitStripeCheckout?: () => void;
    pawollieInitCommunityGame?: () => void;
  }
}
