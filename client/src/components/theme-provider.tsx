import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

/**
 * App-wide theme provider. Uses the class strategy (`.dark` on <html>),
 * matching tailwind.config `darkMode: ["class"]` and the tokens in index.css.
 * The choice is persisted to localStorage by next-themes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
