import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export const UserSecuritySettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [mfaSetup, setMfaSetup] = useState<MFASetup | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const setupMFA = async () => {
    try {
      setLoading(true);
      const response = await api.post('/auth/mfa/setup');
      setMfaSetup(response.data);
    } catch (error: any) {
      showMessage('error', error.response?.data?.error?.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const enableMFA = async () => {
    if (!mfaToken) {
      showMessage('error', 'Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/mfa/enable', { token: mfaToken });
      setBackupCodes(response.data.backupCodes);
      setShowBackupCodes(true);
      setMfaSetup(null);
      setMfaToken('');
      updateUser({ ...user!, mfaEnabled: true });
      showMessage('success', 'MFA enabled successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error?.message || 'Failed to enable MFA');
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    try {
      setLoading(true);
      await api.post('/auth/mfa/disable');
      updateUser({ ...user!, mfaEnabled: false });
      showMessage('success', 'MFA disabled successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error?.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const generateNewBackupCodes = async () => {
    try {
      setLoading(true);
      const response = await api.post('/auth/mfa/backup-codes');
      setBackupCodes(response.data.backupCodes);
      setShowBackupCodes(true);
      showMessage('success', 'New backup codes generated');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error?.message || 'Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', 'Password changed successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('success', 'Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voxlink-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {message.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Multi-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Multi-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={user?.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {user?.mfaEnabled ? (
                <Button variant="outline" onClick={disableMFA} disabled={loading}>
                  Disable
                </Button>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={setupMFA} disabled={loading}>
                      Enable MFA
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Setup Multi-Factor Authentication</DialogTitle>
                    </DialogHeader>
                    {mfaSetup && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-4">
                            Scan this QR code with your authenticator app
                          </p>
                          <img 
                            src={mfaSetup.qrCode} 
                            alt="MFA QR Code" 
                            className="mx-auto border rounded-lg"
                          />
                        </div>
                        <div>
                          <Label htmlFor="mfaToken">Verification Code</Label>
                          <Input
                            id="mfaToken"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value)}
                            maxLength={6}
                          />
                        </div>
                        <Button onClick={enableMFA} disabled={loading || !mfaToken} className="w-full">
                          Verify and Enable
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {user?.mfaEnabled && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backup Codes</p>
                  <p className="text-sm text-gray-600">
                    Generate new backup codes for account recovery
                  </p>
                </div>
                <Button variant="outline" onClick={generateNewBackupCodes} disabled={loading}>
                  Generate New Codes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={changePassword} disabled={loading}>
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Backup Codes Modal */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Save these backup codes in a secure location. Each code can only be used once.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span>{code}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button onClick={downloadBackupCodes} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};