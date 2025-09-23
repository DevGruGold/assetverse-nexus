import { WalletState } from "@/hooks/useWallet";
import XMRTBalance from "./XMRTBalance";
import { useState } from "react";

interface XMRTDashboardProps {
  wallet: WalletState;
  onRefreshXMRT: () => void;
}

const XMRTDashboard = ({ wallet, onRefreshXMRT }: XMRTDashboardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshXMRT();
    // Add a small delay to make the loading state more visible
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Balance Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <XMRTBalance 
          wallet={wallet} 
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* XMRT DAO Info Card - Replaces Faucet */}
        <div className="bg-card text-card-foreground rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-2">XMRT DAO Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="text-green-400">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Mining Pool:</span>
              <span className="text-blue-400">SupportXMR</span>
            </div>
            <div className="flex justify-between">
              <span>DAO Type:</span>
              <span className="text-purple-400">Decentralized</span>
            </div>
          </div>
        </div>
      </div>

      {/* DAO Features Section - Replaces Staking */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">DAO Features</h3>
        <div className="bg-card text-card-foreground rounded-lg border p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-400">Mining Integration</h4>
              <p className="text-sm text-muted-foreground">
                Real-time SupportXMR pool statistics and autonomous mining optimization
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-400">AI Governance</h4>
              <p className="text-sm text-muted-foreground">
                Eliza AI-powered decision making with 95%+ accuracy for DAO operations
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-400">Privacy First</h4>
              <p className="text-sm text-muted-foreground">
                Monero-based privacy-preserving transactions and anonymous voting
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-orange-400">Mobile Mining</h4>
              <p className="text-sm text-muted-foreground">
                Decentralized mobile mining ecosystem with cross-platform support
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XMRTDashboard;
