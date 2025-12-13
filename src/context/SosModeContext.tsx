import React, { createContext, useContext, useState } from "react";

export type SosMode = "DEMO" | "LIVE";

const SosModeContext = createContext<{
  mode: SosMode;
  setMode: (mode: SosMode) => void;
}>({
  mode: "DEMO",
  setMode: () => {},
});

export const SosModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<SosMode>("DEMO");

  return (
    <SosModeContext.Provider value={{ mode, setMode }}>
      {children}
    </SosModeContext.Provider>
  );
};

export const useSosMode = () => useContext(SosModeContext);
