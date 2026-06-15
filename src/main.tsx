import React from "react";
import { createRoot } from "react-dom/client";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { App } from "./App";
import "@mysten/dapp-kit/dist/index.css";
import "./styles.css";

const networks = {
  testnet: {
    url: "https://fullnode.testnet.sui.io:443",
    network: "testnet" as const,
  },
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider>
        <App />
      </WalletProvider>
    </SuiClientProvider>
  </React.StrictMode>,
);
