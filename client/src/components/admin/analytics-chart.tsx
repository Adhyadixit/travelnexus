import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsChartProps {
  data: { date: string; revenue: number }[];
  className?: string;
}

export function AnalyticsChart({ data, className }: AnalyticsChartProps) {
  const [chartType, setChartType] = useState<string>("bar");
  const [timeRange, setTimeRange] = useState<string>("30days");
  
  // Function to filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    let filterDate = new Date();
    
    switch (timeRange) {
      case "7days":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        filterDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        filterDate.setDate(now.getDate() - 90);
        break;
      case "1year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        filterDate.setDate(now.getDate() - 30);
    }
    
    return data.filter(item => new Date(item.date) >= filterDate);
  };
  
  const filteredData = getFilteredData();
  
  // Calculate total revenue
  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
  
  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-primary">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>
            Total Revenue: {formatCurrency(totalRevenue)}
          </CardDescription>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="bar" value={chartType} onValueChange={setChartType}>
          <TabsList className="mb-4">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="area">Area</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bar" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="line" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="area" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
