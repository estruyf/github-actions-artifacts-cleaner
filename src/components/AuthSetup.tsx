import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, ArrowSquareOut, Eye, EyeSlash } from "@phosphor-icons/react";
import { useKV } from '@github/spark/hooks';

interface AuthSetupProps {
  onTokenSet: (token: string) => void;
}

export function AuthSetup({ onTokenSet }: AuthSetupProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedToken, setSavedToken] = useKV("github-pat", "");

  const validateToken = async (tokenToValidate: string) => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        setSavedToken(tokenToValidate);
        onTokenSet(tokenToValidate);
        return true;
      } else if (response.status === 401) {
        setError("Invalid token. Please check your Personal Access Token.");
        return false;
      } else {
        setError("Failed to validate token. Please try again.");
        return false;
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    
    await validateToken(token.trim());
  };

  const handleUseSavedToken = async () => {
    if (savedToken) {
      await validateToken(savedToken);
    }
  };

  const handleClearSavedToken = () => {
    setSavedToken("");
    setToken("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Key className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">GitHub Authentication</CardTitle>
          <CardDescription>
            Enter your GitHub Personal Access Token to access repository data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {savedToken && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>Saved token found</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseSavedToken}
                    disabled={isValidating}
                  >
                    Use Saved
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSavedToken}
                  >
                    Clear
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Personal Access Token</Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? "text" : "password"}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeSlash className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!token.trim() || isValidating}
            >
              {isValidating ? "Validating..." : "Connect to GitHub"}
            </Button>
          </form>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm">Required Permissions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• repo (to access repository information)</li>
              <li>• actions:read (to read Actions storage data)</li>
              <li>• actions:write (to delete artifacts)</li>
            </ul>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://github.com/settings/tokens/new?scopes=repo,actions:read,actions:write', '_blank')}
            >
              <ArrowSquareOut className="h-4 w-4 mr-2" />
              Create New Token
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}