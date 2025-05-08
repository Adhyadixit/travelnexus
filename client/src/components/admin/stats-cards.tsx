import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Building, Car, Anchor, CalendarDays, BookOpen, TrendingUp } from "lucide-react";

interface StatValue {
  value: number;
  label: string;
  icon: React.ReactNode;
  change?: number;
}

interface StatCardProps {
  stat: StatValue;
}

function StatCard({ stat }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {stat.label}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          {stat.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
        {stat.change !== undefined && (
          <p className={`text-xs flex items-center ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stat.change >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
            )}
            {Math.abs(stat.change)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  counts: {
    users: number;
    destinations: number;
    packages: number;
    hotels: number;
    drivers: number;
    cruises: number;
    events: number;
    bookings: number;
  };
}

export function StatsCards({ counts }: StatsCardsProps) {
  const stats: StatValue[] = [
    {
      value: counts.users,
      label: "Total Users",
      icon: <Users className="w-4 h-4" />,
      change: 12
    },
    {
      value: counts.bookings,
      label: "Total Bookings",
      icon: <BookOpen className="w-4 h-4" />,
      change: 8
    },
    {
      value: counts.packages,
      label: "Travel Packages",
      icon: <Package className="w-4 h-4" />,
      change: 5
    },
    {
      value: counts.hotels,
      label: "Hotels",
      icon: <Building className="w-4 h-4" />,
      change: 3
    },
    {
      value: counts.drivers,
      label: "Drivers",
      icon: <Car className="w-4 h-4" />,
      change: -2
    },
    {
      value: counts.cruises,
      label: "Cruises",
      icon: <Anchor className="w-4 h-4" />,
      change: 15
    },
    {
      value: counts.events,
      label: "Events",
      icon: <CalendarDays className="w-4 h-4" />,
      change: 7
    },
    {
      value: counts.destinations,
      label: "Destinations",
      icon: <Users className="w-4 h-4" />,
      change: 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} />
      ))}
    </div>
  );
}
