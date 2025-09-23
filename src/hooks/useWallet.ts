import { useState, useEffect } from "react";

export interface WalletState {
  isConnected: boolean;
  address: string;
  balance: string;
  chainId: number;
  availableAccounts: string[];
  isSetupComplete: boolean;
  xmrtBalance: string;
  xmrtStakeInfo: {
    amount: string;
    timestamp: number;
    canUnstakeWithoutPenalty: boolean;
  };
}

const defaultWalletState: WalletState = {
  isConnected: false,
  address: "",
  balance: "0",
  chainId: 1,
  availableAccounts: [],
  isSetupComplete: false,
  xmrtBalance: "0",
  xmrtStakeInfo: {
    amount: "0",
    timestamp: 0,
    canUnstakeWithoutPenalty: true
  }
};

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>(defaultWalletState);

  // Placeholder methods that don't use Web3
  const connectWallet = async () => {
    console.log("Wallet connection disabled - Web3 features removed");
    return false;
  };

  const disconnectWallet = () => {
    setWallet(defaultWalletState);
  };

  const switchToSepolia = async () => {
    console.log("Network switching disabled - Web3 features removed");
    return false;
  };

  const refreshBalance = async () => {
    console.log("Balance refresh disabled - Web3 features removed");
  };

  const refreshXMRTBalance = async () => {
    console.log("XMRT balance refresh disabled - Web3 features removed");
  };

  const refreshStakeInfo = async () => {
    console.log("Stake info refresh disabled - Web3 features removed");
  };

  return {
    wallet,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    refreshBalance,
    refreshXMRTBalance,
    refreshStakeInfo
  };
};
