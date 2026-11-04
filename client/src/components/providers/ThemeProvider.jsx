import React, { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext({
    theme: "light",
    setTheme: () => { },
    resolvedTheme: "light",
});
export function ThemeProvider({ children, defaultTheme = "light", }) {
    const [theme, setThemeState] = useState(defaultTheme);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem("campuscode_theme");
            if (savedTheme === "dark" || savedTheme === "light") {
                setThemeState(savedTheme);
                if (savedTheme === "dark") {
                    document.documentElement.classList.add("dark");
                }
                else {
                    document.documentElement.classList.remove("dark");
                }
            }
            else {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const initial = prefersDark ? "dark" : "light";
                setThemeState(initial);
                if (prefersDark) {
                    document.documentElement.classList.add("dark");
                }
                else {
                    document.documentElement.classList.remove("dark");
                }
            }
        }
        catch {
            // Fallback
        }
        setMounted(true);
    }, []);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem("campuscode_theme", newTheme);
            if (newTheme === "dark") {
                document.documentElement.classList.add("dark");
            }
            else {
                document.documentElement.classList.remove("dark");
            }
        }
        catch { }
    };
    return (<ThemeContext.Provider value={{
            theme: mounted ? theme : defaultTheme,
            setTheme,
            resolvedTheme: mounted ? theme : defaultTheme,
        }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    return useContext(ThemeContext);
}
