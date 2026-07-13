"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/current-user";

export function SettingsPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure website settings, SEO, and integrations.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          <TabsTrigger value="general" className="flex-1 sm:flex-none">
            General
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex-1 sm:flex-none">
            SEO
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex-1 sm:flex-none">
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Website Settings</CardTitle>
                <CardDescription>
                  Logo, contact information, and social media links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" defaultValue="Neev Spaces" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+91 79 1234 5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="info@neevspaces.com" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Profile</CardTitle>
                <CardDescription>
                  View or update your full profile details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Name</Label>
                  <Input id="profile-name" defaultValue={currentUser.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input id="profile-email" defaultValue={currentUser.email} readOnly />
                </div>
                <Button asChild>
                  <Link href="/profile">Go to My Profile</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Defaults</CardTitle>
              <CardDescription>
                Default meta tags and Open Graph settings for the website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Default Meta Title</Label>
                <Input
                  id="meta-title"
                  defaultValue="Neev Spaces | Premium Real Estate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-desc">Default Meta Description</Label>
                <Input
                  id="meta-desc"
                  defaultValue="Discover luxury properties and premium projects across Ahmedabad."
                />
              </div>
              <Button>Save SEO Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cloudinary</CardTitle>
                <CardDescription>Image storage configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cloud-name">Cloud Name</Label>
                  <Input id="cloud-name" placeholder="your-cloud-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input id="api-key" type="password" placeholder="••••••••" />
                </div>
                <Button>Save Integration</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Google Analytics and tracking scripts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ga-id">Google Analytics ID</Label>
                  <Input id="ga-id" placeholder="G-XXXXXXXXXX" />
                </div>
                <Button>Save Analytics</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
