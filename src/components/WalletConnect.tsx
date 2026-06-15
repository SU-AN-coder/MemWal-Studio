// MemWal Studio - Sui Wallet Connection
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Wallet } from "lucide-react";
import { shortId } from "../lib/domain/helpers";

export function WalletConnect() {
  const account = useCurrentAccount();

  if (account) {
    const addr = account.address;
    const display = addr.length > 12 ? shortId(addr, 6, 4) : addr;
    return (
      <div className="wallet connected">
        <Wallet size={16} />
        <span>{display}</span>
      </div>
    );
  }

  return (
    <ConnectButton
      className="walletConnectBtn"
      connectText="Connect Wallet"
    />
  );
}
