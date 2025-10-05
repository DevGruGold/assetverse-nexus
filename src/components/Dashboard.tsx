import { WalletState } from "@/hooks/useWallet";
import { useState } from "react";
import AssetTypeSelector from "./AssetTypeSelector";
import WorkflowSteps from "./WorkflowSteps";
import { LocalLLMStatus } from "./LocalLLMStatus";

interface DashboardProps {
  wallet: WalletState;
  onSetupComplete: (selectedAccount: string) => void;
}

const Dashboard = ({ wallet, onSetupComplete }: DashboardProps) => {
  const [assetType, setAssetType] = useState<string>("");

  // Since Web3 functionality is removed, we skip wallet setup and show main interface
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Wallet Status Info - Simple display without WalletInfo component */}
      <div className="bg-card text-card-foreground rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">XMRT DAO Status</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Mode:</span> Web3-Free Operation</p>
          <p><span className="font-medium">Mining Integration:</span> Real-time SupportXMR Data</p>
          <p><span className="font-medium">Eliza AI:</span> Autonomous & Aware</p>
          <p className="text-muted-foreground">Wallet functionality has been replaced with enhanced mining focus</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <AssetTypeSelector assetType={assetType} onAssetTypeChange={setAssetType} />
        <LocalLLMStatus />
      </div>
      <WorkflowSteps assetType={assetType} />
    </div>
  );
};

export default Dashboard;
