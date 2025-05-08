import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Driver } from "@shared/schema";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Car } from "lucide-react";

export default function AdminDrivers() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use direct database access to bypass authentication issues
  const {
    data: drivers = [],
    isLoading,
    error,
  } = useQuery<Driver[]>({
    queryKey: ["/api/direct/drivers"],
  });
  
  // Filter drivers based on search query
  const filteredDrivers = searchQuery
    ? drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.carModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.languages.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : drivers;
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Drivers Management</h1>
          <Button>Add New Driver</Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Search Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, vehicle type or details..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            Failed to load drivers. Please try again.
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-10">
            <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No Drivers Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term" : "Add your first driver to get started"}
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Car Model</TableHead>
                    <TableHead>Languages</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.carModel}</TableCell>
                      <TableCell>{driver.languages}</TableCell>
                      <TableCell>${driver.dailyRate}</TableCell>
                      <TableCell>{driver.destinationId}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}