import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Loader2, DollarSign, Users, CheckCircle, Clock, XCircle } from "lucide-react";

type BookingStats = {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalSales: number;
};

type PopularDestination = {
  id: number;
  name: string;
  count: number;
};

type SalesData = {
  day: string;
  sales: number;
};

export default function AnalyticsSection() {
  const { data: bookingStats, isLoading: statsLoading } = useQuery<BookingStats>({
    queryKey: ["/api/admin/analytics/booking-stats"],
  });
  
  const { data: popularDestinations, isLoading: destinationsLoading } = useQuery<PopularDestination[]>({
    queryKey: ["/api/admin/analytics/popular-destinations"],
  });
  
  const { data: salesData, isLoading: salesLoading } = useQuery<SalesData[]>({
    queryKey: ["/api/admin/analytics/sales-data"],
  });

  const isLoading = statsLoading || destinationsLoading || salesLoading;

  // Prepare data for pie chart
  const prepareStatusData = () => {
    if (!bookingStats) return [];
    
    return [
      { name: "Confirmed", value: bookingStats.confirmedBookings, color: "#22C55E" },
      { name: "Pending", value: bookingStats.pendingBookings, color: "#F59E0B" },
      { name: "Cancelled", value: bookingStats.cancelledBookings, color: "#EF4444" },
    ];
  };

  const COLORS = ["#0891B2", "#F97316", "#8B5CF6", "#22C55E", "#EC4899"];

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Overview of your travel business performance and analytics.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${bookingStats?.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+10% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookingStats?.totalBookings}</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookingStats?.confirmedBookings}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((bookingStats?.confirmedBookings || 0) / (bookingStats?.totalBookings || 1) * 100)}% of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookingStats?.pendingBookings}</div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sales">Sales Overview</TabsTrigger>
              <TabsTrigger value="bookings">Booking Status</TabsTrigger>
              <TabsTrigger value="destinations">Popular Destinations</TabsTrigger>
            </TabsList>
            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Revenue</CardTitle>
                  <CardDescription>
                    Daily sales revenue over the past 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, "Sales"]}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString();
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#0891B2"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Distribution</CardTitle>
                  <CardDescription>
                    Overview of booking statuses
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [value, "Bookings"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="destinations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Destinations</CardTitle>
                  <CardDescription>
                    Top 5 most booked destinations
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={popularDestinations}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 50,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }} 
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Bookings"]} />
                      <Bar dataKey="count" name="Bookings">
                        {popularDestinations?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
