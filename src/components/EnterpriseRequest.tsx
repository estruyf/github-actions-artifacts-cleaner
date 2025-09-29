import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Buildings, Download, TextT } from "@phosphor-icons/react";
import { GitHubAPI } from "@/lib/github";
import { Enterprise } from "@/lib/types";
import { toast } from "sonner";

interface EnterpriseRequestProps {
  api: GitHubAPI;
  onEnterpriseRequest: (enterpriseSlug: string) => void;
}

export function EnterpriseRequest({ api, onEnterpriseRequest }: EnterpriseRequestProps) {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>("");
  const [manualEnterprise, setManualEnterprise] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    loadEnterprises();
  }, []);

  const loadEnterprises = async () => {
    setIsLoading(true);
    try {
      const userEnterprises = await api.getUserEnterprises();
      setEnterprises(userEnterprises);
    } catch (error) {
      console.error("Error loading enterprises:", error);
      toast.error("Failed to load enterprises");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async () => {
    const enterpriseSlug = activeTab === "select" ? selectedEnterprise : manualEnterprise.trim();
    
    if (!enterpriseSlug) {
      toast.error("Please provide an enterprise name");
      return;
    }

    setIsRequesting(true);
    try {
      await onEnterpriseRequest(enterpriseSlug);
    } catch (error) {
      console.error("Error requesting enterprise data:", error);
      toast.error("Failed to load enterprise repositories");
    } finally {
      setIsRequesting(false);
    }
  };

  // Show component even if no enterprises are found, to allow manual input
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Buildings className="h-5 w-5" />
          Enterprise Repositories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Access repositories from enterprise organizations by selecting from your available enterprises or entering the organization name directly.
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select" disabled={enterprises.length === 0 && !isLoading}>
              Select Enterprise
            </TabsTrigger>
            <TabsTrigger value="manual">
              <TextT className="h-4 w-4 mr-2" />
              Enter Manually
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="select" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : enterprises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Buildings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No enterprises found in your account</p>
                <p className="text-sm">Try entering an enterprise name manually</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="enterprise-select">Select from your enterprises:</Label>
                <Select value={selectedEnterprise} onValueChange={setSelectedEnterprise}>
                  <SelectTrigger id="enterprise-select">
                    <SelectValue placeholder="Select an enterprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {enterprises.map((enterprise) => (
                      <SelectItem key={enterprise.id} value={enterprise.slug}>
                        <div className="flex flex-col">
                          <span className="font-medium">{enterprise.name}</span>
                          {enterprise.description && (
                            <span className="text-xs text-muted-foreground">
                              {enterprise.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="enterprise-input">Enterprise name:</Label>
              <Input
                id="enterprise-input"
                placeholder="e.g., my-company"
                value={manualEnterprise}
                onChange={(e) => setManualEnterprise(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualEnterprise.trim()) {
                    handleRequest();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the enterprise organization name (not the display name)
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleRequest} 
            disabled={
              isRequesting || 
              (activeTab === "select" && !selectedEnterprise) ||
              (activeTab === "manual" && !manualEnterprise.trim())
            }
          >
            <Download className={`h-4 w-4 mr-2 ${isRequesting ? 'animate-spin' : ''}`} />
            {isRequesting ? 'Loading...' : 'Apply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}