import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { claimXMRTFaucet, canClaimFaucet } from "@/utils/contractUtils";
import { WalletState } from "@/hooks/useWallet";
import Web3 from "web3";

interface XMRTFaucetProps {
  wallet: WalletState;
  onClaimed: () => void;
}

const XMRTFaucet = ({ wallet, onClaimed }: XMRTFaucetProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const faucetStatus = canClaimFaucet(wallet.address);

  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.ceil(milliseconds / (60 * 60 * 1000));
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const handleClaimFaucet = async () => {
    if (!faucetStatus.canClaim) {
      toast({
        title: "Cooldown Active",
        description: `Please wait ${formatTimeRemaining(faucetStatus.remainingTime!)} before claiming again.`,
        variant: "destructive",
      });
      return;
    }

    if (wallet.chainId !== 11155111) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet to use the faucet.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const web3 = new Web3(window.ethereum);
      await claimXMRTFaucet(web3, wallet.address, wallet.chainId);
      
      toast({
        title: "Success!",
        description: "100 XMRT tokens have been sent to your wallet.",
      });
      
      onClaimed();
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim XMRT tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSepoliaNetwork = wallet.chainId === 11155111;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-400" />
            XMRT Faucet
            {faucetStatus.canClaim && isSepoliaNetwork && (
              <CheckCircle className="h-4 w-4 text-green-400" />
            )}
          </CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          Claim 100 XMRT tokens every 24 hours on Sepolia testnet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Network</span>
            <span className={isSepoliaNetwork ? "text-green-400" : "text-yellow-400"}>
              {isSepoliaNetwork ? "Sepolia ✓" : "Switch to Sepolia"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Claim Amount</span>
            <span className="text-blue-400">100 XMRT</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Status</span>
            <div className="flex items-center gap-2">
              {faucetStatus.canClaim ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-green-400">Ready to claim</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400">
                    {formatTimeRemaining(faucetStatus.remainingTime!)} cooldown
                  </span>
                </>
              )}
            </div>
          </div>

          {!isSepoliaNetwork && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Switch to Sepolia testnet to use the faucet</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleClaimFaucet}
            disabled={!faucetStatus.canClaim || !isSepoliaNetwork || isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isLoading ? (
              "Claiming..."
            ) : faucetStatus.canClaim && isSepoliaNetwork ? (
              "Claim 100 XMRT"
            ) : !isSepoliaNetwork ? (
              "Wrong Network"
            ) : (
              `Cooldown: ${formatTimeRemaining(faucetStatus.remainingTime!)}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default XMRTFaucet;