import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Trophy, Users, TrendingUp } from "lucide-react";
import { BADGE_TYPES } from "@/lib/constants";
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

export default function BadgesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBadgeType, setSelectedBadgeType] = useState<string>("all");

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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-8">🏅 Badge System</h1>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No badge data available</p>
          </div>
        </div>
      </div>
    );
  }

  const badgeTypes = Object.keys(BADGE_TYPES) as Array<keyof typeof BADGE_TYPES>;
  
  const filteredBadges = data.allBadges.filter(badge => {
    const matchesSearch = badge.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedBadgeType === "all" || badge.badgeType === selectedBadgeType;
    return matchesSearch && matchesType;
  });

  const groupedBadges = badgeTypes.reduce((acc, badgeType) => {
    acc[badgeType] = data.allBadges.filter(badge => badge.badgeType === badgeType);
    return acc;
  }, {} as Record<string, BadgeWithStudent[]>);

  return (
    <div className="flex-1 py-6">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">🏅 Badge System</h1>
          <p className="text-muted-foreground">
            Auto-assigned badges recognizing student achievements and milestones
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
                    {BADGE_TYPES[data.badgeStats.mostPopularBadge as keyof typeof BADGE_TYPES]?.title || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badge Types Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Badge Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badgeTypes.map((badgeType) => {
                const badgeInfo = BADGE_TYPES[badgeType];
                const count = groupedBadges[badgeType]?.length || 0;
                
                return (
                  <div key={badgeType} className="flex items-center p-4 border rounded-lg hover:bg-muted/60">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 bg-gradient-to-br ${badgeInfo.gradient} text-white`}>
                      <span className="text-2xl">{badgeInfo.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{badgeInfo.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{badgeInfo.description}</p>
                      <Badge variant="secondary">{count} earned</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="all-badges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-badges">All Badges</TabsTrigger>
            <TabsTrigger value="by-type">By Type</TabsTrigger>
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
                value={selectedBadgeType}
                onChange={(e) => setSelectedBadgeType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Badge Types</option>
                {badgeTypes.map(badgeType => (
                  <option key={badgeType} value={badgeType}>
                    {BADGE_TYPES[badgeType].title}
                  </option>
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
                  {filteredBadges.map((badge) => {
                    const badgeInfo = BADGE_TYPES[badge.badgeType as keyof typeof BADGE_TYPES];
                    return (
                      <div key={badge.id} className="flex items-center p-4 border rounded-lg hover:bg-muted/60">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-gradient-to-br ${badgeInfo.gradient} text-white`}>
                          <span className="text-lg">{badgeInfo.emoji}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{badgeInfo.title}</h3>
                            <Badge variant="outline">{badge.student.name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{badgeInfo.description}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                  {filteredBadges.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No badges found matching your criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-type" className="space-y-6">
            {badgeTypes.map((badgeType) => {
              const badgeInfo = BADGE_TYPES[badgeType];
              const badges = groupedBadges[badgeType] || [];
              
              return (
                <Card key={badgeType}>
                  <CardHeader>
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-gradient-to-br ${badgeInfo.gradient} text-white`}>
                        <span className="text-lg">{badgeInfo.emoji}</span>
                      </div>
                      <div>
                        <CardTitle>{badgeInfo.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{badgeInfo.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto">{badges.length} earned</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {badges.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {badges.map((badge) => (
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
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No one has earned this badge yet</p>
                    )}
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
                  {data.badgeStats.recentBadges.map((badge) => {
                    const badgeInfo = BADGE_TYPES[badge.badgeType as keyof typeof BADGE_TYPES];
                    return (
                      <div key={badge.id} className="flex items-center p-4 border rounded-lg hover:bg-muted/60">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-gradient-to-br ${badgeInfo.gradient} text-white`}>
                          <span className="text-lg">{badgeInfo.emoji}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{badgeInfo.title}</h3>
                            <Badge variant="outline">{badge.student.name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{badgeInfo.description}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
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