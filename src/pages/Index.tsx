import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet2, Shield, Users, Layers, ArrowRight, Sparkles } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import Dashboard from "@/components/Dashboard";
import MobileMoneroCalculator from "@/components/MobileMoneroCalculator";
import LiveMiningStats from "@/components/LiveMiningStats";
import UnifiedChat from "@/components/UnifiedChat";
import { Footer } from "@/components/Footer";
import DaoTabs from "@/components/DaoTabs";
import XMRTDashboard from "@/components/XMRTDashboard";
import { useState } from "react";
import { MobileNav } from "@/components/MobileNav";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { wallet, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState("members");
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <LanguageToggle />
      <MobileNav />
      
      {/* Hero Section - Data-First Design */}
      <section className="relative bg-gradient-to-b from-background to-secondary/30 border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative">
          
          {/* Compact Header */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              
              
              {/* Compact Title */}
              <div className="space-y-2">
                <h1 className="font-inter font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight tracking-tight animate-slide-in">
                  <span className="bg-gradient-to-r from-primary via-mining-info to-primary bg-clip-text text-transparent">
                    {t('hero.title')}
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg font-source text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in">
                  {t('hero.subtitle')}
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-muted-foreground/80 mt-3">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">{t('hero.tag.smartphone')}</span>
                  <span className="px-2 py-1 bg-mining-info/10 text-mining-info rounded-full">{t('hero.tag.ai')}</span>
                  <span className="px-2 py-1 bg-mining-active/10 text-mining-active rounded-full">{t('hero.tag.privacy')}</span>
                  <span className="px-2 py-1 bg-secondary/20 text-secondary-foreground rounded-full">{t('hero.tag.mesh')}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Live Data Dashboard - Featured Position */}
          <div className="max-w-6xl mx-auto mb-10 animate-fade-in">
            <div className="text-center mb-4">
              <h2 className="font-inter font-semibold text-xl sm:text-2xl text-foreground mb-1">
                {t('mining.title')}
              </h2>
              <p className="font-source text-muted-foreground text-sm">
                {t('mining.subtitle')}
              </p>
            </div>
            <LiveMiningStats />
          </div>

          {/* Integrated AI Chat Interface */}
          <div className="max-w-6xl mx-auto mb-10 animate-fade-in">
            <div className="text-center mb-4">
              <h2 className="font-inter font-semibold text-xl sm:text-2xl text-foreground mb-1">
                {t('ai.title')}
              </h2>
              <p className="font-source text-muted-foreground text-sm max-w-2xl mx-auto">
                {t('ai.subtitle')}
              </p>
            </div>
            
            <div className="bg-card/50 border border-border rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <UnifiedChat />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="max-w-5xl mx-auto text-center mb-8">
            <div className="bg-card/30 border border-border rounded-2xl p-6 shadow-lg animate-slide-in">
              <div className="space-y-4">
                <h3 className="font-inter font-semibold text-xl sm:text-2xl text-foreground">
                  {t('actions.title')}
                </h3>
                <p className="font-source text-muted-foreground text-sm max-w-2xl mx-auto">
                  {t('actions.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button 
                    size="lg"
                    className="font-source font-semibold bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group text-sm"
                    asChild
                  >
                    <a href="https://mobilemonero.com" target="_blank" rel="noopener noreferrer">
                      <Sparkles className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      {t('actions.start.mining')}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="font-source font-semibold px-6 py-3 rounded-lg transition-all duration-300 text-sm"
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <Wallet2 className="mr-2 h-4 w-4" />
                    {t('actions.join.dao')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mining Calculator */}
          <div className="max-w-6xl mx-auto mb-8 animate-fade-in">
            <div className="text-center mb-4">
              <h3 className="font-inter font-semibold text-xl sm:text-2xl text-foreground mb-1">
                {t('calculator.title')}
              </h3>
              <p className="font-source text-muted-foreground text-sm max-w-2xl mx-auto">
                {t('calculator.subtitle')}
              </p>
            </div>
            <MobileMoneroCalculator />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        {wallet.isConnected ? (
          <>
            <div className="mb-4 sm:mb-6">
              <DaoTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            {activeTab === "xmrt" ? (
              <XMRTDashboard wallet={wallet} onRefreshXMRT={() => console.log('XMRT refresh disabled')} />
            ) : (
              <Dashboard wallet={wallet} onSetupComplete={() => console.log('Setup disabled')} />
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
            <Card className="group bg-gradient-to-br from-card to-secondary border-border hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-in">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-foreground text-xl font-bold">{t('feature.mobile.title')}</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  {t('feature.mobile.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{t('feature.mobile.tag.arm')}</div>
                  <div className="px-3 py-1 bg-mining-info/10 text-mining-info rounded-full text-sm font-medium">{t('feature.mobile.tag.battery')}</div>
                  <div className="px-3 py-1 bg-mining-warning/10 text-mining-warning rounded-full text-sm font-medium">{t('feature.mobile.tag.thermal')}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-card to-secondary border-border hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-in">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-mining-active/10 group-hover:bg-mining-active/20 transition-colors">
                    <Users className="h-6 w-6 text-mining-active" />
                  </div>
                  <CardTitle className="text-foreground text-xl font-bold">{t('feature.dao.title')}</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  {t('feature.dao.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-medium">{t('feature.dao.executives')}</span>
                    <span className="text-primary font-bold bg-primary/10 px-2 py-1 rounded-full text-sm">{t('feature.dao.status.active')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-medium">{t('feature.dao.compute')}</span>
                    <span className="text-mining-active font-bold bg-mining-active/10 px-2 py-1 rounded-full text-sm">{t('feature.dao.status.certified')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-card to-secondary border-border hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-in md:col-span-2 xl:col-span-1">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-mining-info/10 group-hover:bg-mining-info/20 transition-colors">
                    <Shield className="h-6 w-6 text-mining-info" />
                  </div>
                  <CardTitle className="text-foreground text-xl font-bold">{t('feature.privacy.title')}</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  {t('feature.privacy.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-medium">{t('feature.privacy.mesh')}</span>
                    <span className="text-mining-active font-bold bg-mining-active/10 px-2 py-1 rounded-full text-sm">{t('feature.privacy.status.building')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-medium">{t('feature.privacy.privacy')}</span>
                    <span className="text-mining-warning font-bold bg-mining-warning/10 px-2 py-1 rounded-full text-sm">{t('feature.privacy.status.fundamental')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Chat Section */}
      <div className="w-full h-64 sm:h-80 lg:h-96 bg-secondary/50 border-t border-border backdrop-blur-sm">
        <iframe
          src="https://mobilemonero.chatango.com/"
          className="w-full h-full rounded-t-lg"
          style={{ border: "none" }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          title="XMRT Chat"
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;