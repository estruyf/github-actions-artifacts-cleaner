import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Buildings, Download } from "@phosphor-icons/react";
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
    if (!selectedEnterprise) {
      toast.error("Please select an enterprise");
      return;
    }

    setIsRequesting(true);
    try {
      await onEnterpriseRequest(selectedEnterprise);
    } catch (error) {
      console.error("Error requesting enterprise data:", error);
      toast.error("Failed to load enterprise repositories");
    } finally {
      setIsRequesting(false);
    }
  };

  if (enterprises.length === 0 && !isLoading) {
    return null; // Don't show if user has no enterprises
  }

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
          Request access to view repositories from your enterprise organizations.
        </p>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Select value={selectedEnterprise} onValueChange={setSelectedEnterprise}>
              <SelectTrigger className="flex-1">
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
            
            <Button 
              onClick={handleRequest} 
              disabled={!selectedEnterprise || isRequesting}
            >
              <Download className={`h-4 w-4 mr-2 ${isRequesting ? 'animate-spin' : ''}`} />
              Request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}