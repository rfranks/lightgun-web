// lightgun-web/src/pages/_app.tsx  (or lightgun-web/pages/_app.tsx)
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
