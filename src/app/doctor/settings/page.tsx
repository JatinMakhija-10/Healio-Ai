"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import {
    User,
    Bell,
    Lock,
    Clock,
    Globe,
    Stethoscope,
    Upload,
    Save
} from "lucide-react";

export default function DoctorSettingsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your profile, clinic preferences, and security.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 mb-6 space-x-6">
                    <TabsTrigger
                        value="profile"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent px-0 pb-2"
                    >
                        Public Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="availability"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent px-0 pb-2"
                    >
                        Availability & Clinic
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent px-0 pb-2"
                    >
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent px-0 pb-2"
                    >
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* Profile Settings */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="grid md:grid-cols-12 gap-6">
                        {/* Profile Card */}
                        <Card className="md:col-span-8">
                            <CardHeader>
                                <CardTitle>Doctor Profile</CardTitle>
                                <CardDescription>This information will be displayed to patients on your booking page.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                                        <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl">
                                            {user?.user_metadata?.full_name?.[0] || "D"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Upload className="h-4 w-4" /> Change Photo
                                        </Button>
                                        <p className="text-xs text-slate-500">JPG, GIF or PNG. 1MB max.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" defaultValue={user?.user_metadata?.full_name?.split(' ')[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" defaultValue={user?.user_metadata?.full_name?.split(' ').slice(1).join(' ')} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="specialty">Specialty</Label>
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4 text-slate-400" />
                                        <Input id="specialty" defaultValue="Ayurvedic Practitioner" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">About</Label>
                                    <textarea
                                        id="bio"
                                        className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Tell patients about your experience and medical philosophy..."
                                    />
                                </div>

                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Contact Info */}
                        <Card className="md:col-span-4 h-fit">
                            <CardHeader>
                                <CardTitle>Contact Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" defaultValue={user?.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="+91 00000 00000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input id="website" placeholder="https://" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Manage how and when you want to be notified.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium text-slate-900">New Appointment Alerts</div>
                                    <div className="text-sm text-slate-500">Receive emails for new bookings</div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 bg-teal-600">
                                    <span className="translate-x-5 pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium text-slate-900">Patient Messages</div>
                                    <div className="text-sm text-slate-500">Receive notifications for new inbox messages</div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 bg-teal-600">
                                    <span className="translate-x-5 pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium text-slate-900">Appointment Reminders</div>
                                    <div className="text-sm text-slate-500">Get a reminder 15 minutes before calls</div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 bg-teal-600">
                                    <span className="translate-x-5 pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium text-slate-900">Marketing & Updates</div>
                                    <div className="text-sm text-slate-500">Receive Healio platform news and tips</div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 bg-slate-200">
                                    <span className="translate-x-0 pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out" />
                                </div>
                            </div>

                            <Button className="bg-teal-600 hover:bg-teal-700">Save Preferences</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Other tabs can be placeholders for now */}
                <TabsContent value="availability">
                    <Card>
                        <CardContent className="p-8 text-center text-slate-500">
                            Availability settings are managed in your linked Google Calendar for now.
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="security">
                    <Card>
                        <CardContent className="p-8 text-center text-slate-500">
                            Password and 2FA settings are managed by your identity provider.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
