import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Trophy, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { Badge as BadgeType } from "@shared/schema";

interface BadgeWithStudent extends BadgeType {
  student: {
    id: string;
    name: string;
    leetcodeUsername: string;
  };
}

interface BadgesPageData {
  allBadges: BadgeWithStudent[];
  badgeStats: {
    totalBadges: number;
    totalRecipients: number;
    mostPopularBadge: string;
    recentBadges: BadgeWithStudent[];
  };
}

function BadgeRow({ badge }: { badge: BadgeWithStudent }) {
  return (
    <div className="flex items-center p-4 border rounded-lg hover:bg-muted/60">
      <img src={badge.icon} alt={badge.name} className="w-12 h-12 object-contain mr-4" loading="lazy" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground">{badge.name}</h3>
          <Badge variant="outline">{badge.student.name}</Badge>
        </div>
      </div>
      <div className="text-right text-sm text-muted-foreground">
        {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'N/A'}
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBadgeName, setSelectedBadgeName] = useState<string>("all");

  const { data, isLoading } = useQuery<BadgesPageData>({
    queryKey: ['/api/badges/all'],
  });

  if (isLoading) {
    return (
      <div className="flex-1 py-6">
        <div className="page-container">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 py-6">
        <div className="page-container">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-8">🏅 LeetCode Badges</h1>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No badge data available</p>
          </div>
        </div>
      </div>
    );
  }

  const badgeNames = Array.from(new Set(data.allBadges.map(b => b.name))).sort();

  const filteredBadges = data.allBadges.filter(badge => {
    const matchesSearch = badge.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesName = selectedBadgeName === "all" || badge.name === selectedBadgeName;
    return matchesSearch && matchesName;
  });

  const groupedBadges = badgeNames.reduce((acc, name) => {
    acc[name] = data.allBadges.filter(badge => badge.name === name);
    return acc;
  }, {} as Record<string, BadgeWithStudent[]>);

  return (
    <div className="flex-1 py-6">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">🏅 LeetCode Badges</h1>
          <p className="text-muted-foreground">
            Badges earned directly on LeetCode, synced from each student's profile
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Badges</p>
                  <p className="text-2xl font-bold text-foreground">{data.badgeStats.totalBadges}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Badge Recipients</p>
                  <p className="text-2xl font-bold text-foreground">{data.badgeStats.totalRecipients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Most Popular</p>
                  <p className="text-lg font-bold text-foreground">
                    {data.badgeStats.mostPopularBadge || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="all-badges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-badges">All Badges</TabsTrigger>
            <TabsTrigger value="by-badge">By Badge</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="all-badges" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search students or badges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedBadgeName}
                onChange={(e) => setSelectedBadgeName(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Badges</option>
                {badgeNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* All Badges List */}
            <Card>
              <CardHeader>
                <CardTitle>All Badges ({filteredBadges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredBadges.map((badge) => (
                    <BadgeRow key={badge.id} badge={badge} />
                  ))}
                  {filteredBadges.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No badges found matching your criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-badge" className="space-y-6">
            {badgeNames.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No badges earned yet</p>
            )}
            {badgeNames.map((name) => {
              const badgesForName = groupedBadges[name] || [];
              const icon = badgesForName[0]?.icon;

              return (
                <Card key={name}>
                  <CardHeader>
                    <div className="flex items-center">
                      {icon && (
                        <img src={icon} alt={name} className="w-12 h-12 object-contain mr-4" loading="lazy" />
                      )}
                      <CardTitle>{name}</CardTitle>
                      <Badge variant="secondary" className="ml-auto">{badgesForName.length} earned</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badgesForName.map((badge) => (
                        <div key={badge.id} className="flex items-center p-3 border rounded-lg">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {badge.student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{badge.student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.badgeStats.recentBadges.map((badge) => (
                    <BadgeRow key={badge.id} badge={badge} />
                  ))}
                  {data.badgeStats.recentBadges.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent badges found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
