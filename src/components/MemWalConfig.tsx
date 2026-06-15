// MemWal Studio - MemWal Configuration
// UI for entering MemWal SDK credentials and testing the connection

import { useState, useCallback } from "react";
import {
  Wifi,
  WifiOff,
  Key,
  User,
  Server,
  RefreshCw,
  Check,
} from "lucide-react";
import { MemWalStorageAdapter } from "../lib/storage/memwalStorageAdapter";

interface TestResult {
  ok: boolean;
  message: string;
  blobId?: string;
}

export function MemWalConfig() {
  const [privateKey, setPrivateKey] = useState(
    () => localStorage.getItem("MEMWAL_PRIVATE_KEY") ?? "",
  );
  const [accountId, setAccountId] = useState(
    () => localStorage.getItem("MEMWAL_ACCOUNT_ID") ?? "",
  );
  const [serverUrl, setServerUrl] = useState(
    () =>
      localStorage.getItem("MEMWAL_SERVER_URL") ?? "https://relayer.memwal.ai",
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    if (privateKey.trim()) {
      localStorage.setItem("MEMWAL_PRIVATE_KEY", privateKey.trim());
    } else {
      localStorage.removeItem("MEMWAL_PRIVATE_KEY");
    }
    if (accountId.trim()) {
      localStorage.setItem("MEMWAL_ACCOUNT_ID", accountId.trim());
    } else {
      localStorage.removeItem("MEMWAL_ACCOUNT_ID");
    }
    if (serverUrl.trim()) {
      localStorage.setItem("MEMWAL_SERVER_URL", serverUrl.trim());
    } else {
      localStorage.removeItem("MEMWAL_SERVER_URL");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setTestResult(null);
  }, [privateKey, accountId, serverUrl]);

  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);

    // Temporarily save to localStorage so the adapter can read it
    if (privateKey.trim()) {
      localStorage.setItem("MEMWAL_PRIVATE_KEY", privateKey.trim());
    }
    if (accountId.trim()) {
      localStorage.setItem("MEMWAL_ACCOUNT_ID", accountId.trim());
    }
    if (serverUrl.trim()) {
      localStorage.setItem("MEMWAL_SERVER_URL", serverUrl.trim());
    }

    try {
      const adapter = new MemWalStorageAdapter();
      const result = await adapter.testConnection();
      setTestResult(result);
    } catch (err) {
      setTestResult({
        ok: false,
        message: `Test error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    } finally {
      setTesting(false);
    }
  }, [privateKey, accountId, serverUrl]);

  const hasCredentials = privateKey.trim() && accountId.trim();

  return (
    <div className="memwalConfig">
      <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Key size={18} />
        MemWal Credentials
      </h3>
      <p className="configHint">
        Enter your MemWal private key and account ID to enable real
        decentralized storage. Find these in your{" "}
        <a
          href="https://relayer.memwal.ai"
          target="_blank"
          rel="noopener noreferrer"
        >
          MemWal dashboard
        </a>
        .
      </p>

      <div className="configField">
        <label htmlFor="memwal-key">
          <Key size={14} />
          Private Key
        </label>
        <input
          id="memwal-key"
          type="password"
          value={privateKey}
          onChange={(e) => {
            setPrivateKey(e.target.value);
            setSaved(false);
            setTestResult(null);
          }}
          placeholder="suipriv1..."
          autoComplete="off"
        />
      </div>

      <div className="configField">
        <label htmlFor="memwal-account">
          <User size={14} />
          Account ID
        </label>
        <input
          id="memwal-account"
          type="text"
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value);
            setSaved(false);
            setTestResult(null);
          }}
          placeholder="0x..."
          autoComplete="off"
        />
      </div>

      <div className="configField">
        <label htmlFor="memwal-server">
          <Server size={14} />
          Server URL
        </label>
        <input
          id="memwal-server"
          type="text"
          value={serverUrl}
          onChange={(e) => {
            setServerUrl(e.target.value);
            setSaved(false);
            setTestResult(null);
          }}
          placeholder="https://relayer.memwal.ai"
        />
      </div>

      <div className="configActions">
        <button
          className="primaryAction"
          onClick={handleSave}
          disabled={!hasCredentials}
          style={{ opacity: hasCredentials ? 1 : 0.5 }}
        >
          {saved ? (
            <>
              <Check size={16} /> Saved
            </>
          ) : (
            <>Save Credentials</>
          )}
        </button>

        <button
          className="secondaryAction"
          onClick={handleTestConnection}
          disabled={testing || !hasCredentials}
        >
          {testing ? (
            <>
              <RefreshCw size={16} className="spin" /> Testing...
            </>
          ) : (
            <>Test Connection</>
          )}
        </button>
      </div>

      {testResult && (
        <div className={`configResult ${testResult.ok ? "success" : "error"}`}>
          {testResult.ok ? (
            <Wifi
              size={16}
              style={{ color: "var(--color-success, #22c55e)" }}
            />
          ) : (
            <WifiOff
              size={16}
              style={{ color: "var(--color-error, #ef4444)" }}
            />
          )}
          <span>{testResult.message}</span>
          {testResult.blobId && (
            <code style={{ fontSize: "0.75rem", opacity: 0.7 }}>
              blob: {testResult.blobId.slice(0, 16)}...
            </code>
          )}
        </div>
      )}

      <details className="configDetails">
        <summary>How to get credentials</summary>
        <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
          <li>
            Visit{" "}
            <a
              href="https://relayer.memwal.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              relayer.memwal.ai
            </a>
          </li>
          <li>Connect your Sui wallet</li>
          <li>Generate an API key from the dashboard</li>
          <li>Copy your private key and account ID here</li>
          <li>Click "Test Connection" to verify</li>
        </ol>
      </details>
    </div>
  );
}
