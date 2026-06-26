"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface SecuritySettings {
  chapterProtection: boolean;
  devGuardMode: boolean;
  maintenanceMode: boolean;
  rightClickBlocker: boolean;
}

export default function SecuritySettingsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    chapterProtection: false,
    devGuardMode: false,
    maintenanceMode: false,
    rightClickBlocker: false,
  });

  useEffect(() => {
    // Check if user is admin
    if (user && userData && userData.role !== "admin") {
      toast.error("Admin access required");
      router.push("/");
      return;
    }

    // Fetch current settings
    fetchSecuritySettings();
  }, [user, userData, router]);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/security/settings");
      const data = await res.json();
      
      if (data.exists) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching security settings:", error);
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting: keyof SecuritySettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/security/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Security settings saved");
      } else {
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (error: any) {
      console.error("Error saving security settings:", error);
      toast.error(error.message || "Failed to save security settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1B1E] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
          <div className="animate-pulse flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="ml-3">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1B1E] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
        
        <div className="bg-[#25262b] rounded-lg p-6 mb-8 shadow-xl">
          <div className="mb-6">
            <div className="flex items-center justify-between py-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-medium">Chapter Protection</h3>
                <p className="text-gray-400 mt-1">Prevents users from downloading or scraping chapter images</p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.chapterProtection} 
                    onChange={() => handleSettingChange("chapterProtection")}
                  />
                  <div className={`w-11 h-6 bg-gray-700 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-medium">Dev Guard Mode</h3>
                <p className="text-gray-400 mt-1">Redirects users to Google.com when they open developer tools or F12</p>
                <p className="text-red-400 text-xs mt-1">⚠️ WARNING: May cause false positives. Use with caution!</p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.devGuardMode} 
                    onChange={() => handleSettingChange("devGuardMode")}
                  />
                  <div className={`w-11 h-6 bg-gray-700 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-medium">Maintenance Mode</h3>
                <p className="text-gray-400 mt-1">Displays a maintenance page to all users</p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.maintenanceMode} 
                    onChange={() => handleSettingChange("maintenanceMode")}
                  />
                  <div className={`w-11 h-6 bg-gray-700 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div>
                <h3 className="text-lg font-medium">Right Click Blocker</h3>
                <p className="text-gray-400 mt-1">Blocks right-click context menu across the entire site</p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.rightClickBlocker} 
                    onChange={() => handleSettingChange("rightClickBlocker")}
                  />
                  <div className={`w-11 h-6 bg-gray-700 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => fetchSecuritySettings()}
              disabled={loading || saving}
              className="px-4 py-2 mr-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Saving...
                </>
              ) : "Save Settings"}
            </button>
          </div>
        </div>
        
        <div className="bg-[#25262b] rounded-lg p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-4">About Security Settings</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <p><strong>Chapter Protection:</strong> When enabled, this feature makes it more difficult for users to download or scrape chapter images. It applies various protective measures like disabling right-click on images, preventing drag-and-drop, and converting images to canvas elements.</p>
            <p><strong>Dev Guard Mode:</strong> This feature redirects users to Google when they attempt to open browser developer tools (F12). This helps prevent casual users from inspecting and manipulating page elements. <span className="text-red-400">WARNING: May cause false positives on some browsers and devices. Test thoroughly before enabling in production.</span></p>
            <p><strong>Maintenance Mode:</strong> Enables site-wide maintenance mode, showing a maintenance page to all visitors.</p>
            <p><strong>Right Click Blocker:</strong> Disables right-click functionality across the entire site.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 