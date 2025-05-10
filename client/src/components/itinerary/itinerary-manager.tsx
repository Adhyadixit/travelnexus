import { useState, useEffect } from "react";
import { Trash2, PlusCircle, Edit, Save, X, Calendar, Info, MapPin, Coffee, Utensils, Hotel, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Type for a single activity in a day
interface DayActivity {
  id: string;
  name: string;
  description?: string;
  isOptional?: boolean;
  price?: number;
}

// Type for a single day in the itinerary
interface ItineraryDay {
  dayNumber: number;
  title: string;
  description?: string;
  hotel?: string;
  location?: string;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  activities: DayActivity[];
}

// Type for the entire itinerary structure
interface Itinerary {
  [key: string]: {
    title: string;
    description?: string;
    hotel?: string;
    location?: string;
    meals?: {
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
    };
    activities?: DayActivity[];
  };
}

interface ItineraryManagerProps {
  value: string;
  onChange: (value: string) => void;
  duration: number;
}

export function ItineraryManager({ value, onChange, duration }: ItineraryManagerProps) {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [tempDay, setTempDay] = useState<ItineraryDay | null>(null);
  
  // Initialize days from the value prop or create empty days based on duration
  useEffect(() => {
    if (value) {
      try {
        const parsedValue = JSON.parse(value) as Itinerary;
        const newDays: ItineraryDay[] = [];
        
        // Convert the object structure to our array structure
        for (let i = 1; i <= duration; i++) {
          const dayKey = `day${i}`;
          const dayData = parsedValue[dayKey];
          
          if (dayData) {
            newDays.push({
              dayNumber: i,
              title: dayData.title || `Day ${i}`,
              description: dayData.description || "",
              hotel: dayData.hotel || "",
              location: dayData.location || "",
              meals: dayData.meals || { breakfast: false, lunch: false, dinner: false },
              activities: dayData.activities || []
            });
          } else {
            // Create default day if not found
            newDays.push(createDefaultDay(i));
          }
        }
        
        setDays(newDays);
      } catch (error) {
        console.error("Error parsing itinerary JSON:", error);
        // If parsing fails, create default days
        initializeDefaultDays();
      }
    } else {
      // No value provided, initialize with defaults
      initializeDefaultDays();
    }
  }, [value, duration]);
  
  // Function to create a default day object
  const createDefaultDay = (dayNumber: number): ItineraryDay => {
    return {
      dayNumber,
      title: dayNumber === 1 
        ? "Arrival and Welcome" 
        : dayNumber === duration 
          ? "Departure Day" 
          : `Day ${dayNumber} Exploration`,
      description: dayNumber === 1 
        ? "Arrive at your destination, transfer to hotel, and enjoy a welcome dinner with your tour group." 
        : dayNumber === duration 
          ? "Enjoy breakfast at the hotel, check-out, and transfer to the airport for your departure."
          : "Explore local attractions with your guide and experience the local culture.",
      hotel: "",
      location: "",
      meals: { breakfast: dayNumber > 1, lunch: dayNumber !== duration, dinner: dayNumber === 1 },
      activities: []
    };
  };
  
  // Initialize default days
  const initializeDefaultDays = () => {
    const newDays: ItineraryDay[] = [];
    for (let i = 1; i <= duration; i++) {
      newDays.push(createDefaultDay(i));
    }
    setDays(newDays);
  };
  
  // Update the parent component when days change
  useEffect(() => {
    if (days.length > 0) {
      const itineraryObject: Itinerary = {};
      
      days.forEach(day => {
        itineraryObject[`day${day.dayNumber}`] = {
          title: day.title,
          description: day.description,
          hotel: day.hotel,
          location: day.location,
          meals: day.meals,
          activities: day.activities
        };
      });
      
      onChange(JSON.stringify(itineraryObject));
    }
  }, [days, onChange]);
  
  // Start editing a day
  const handleEditDay = (dayNumber: number) => {
    const day = days.find(d => d.dayNumber === dayNumber);
    if (day) {
      setTempDay({ ...day });
      setEditingDay(dayNumber);
    }
  };
  
  // Save the edited day
  const handleSaveDay = () => {
    if (tempDay) {
      setDays(days.map(day => 
        day.dayNumber === tempDay.dayNumber ? tempDay : day
      ));
      setEditingDay(null);
      setTempDay(null);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingDay(null);
    setTempDay(null);
  };
  
  // Add a new activity to a day
  const handleAddActivity = (dayNumber: number) => {
    if (editingDay === dayNumber && tempDay) {
      setTempDay({
        ...tempDay,
        activities: [
          ...tempDay.activities,
          { 
            id: `activity-${Date.now()}`, 
            name: "New Activity",
            description: "",
            isOptional: false
          }
        ]
      });
    }
  };
  
  // Remove an activity from a day
  const handleRemoveActivity = (dayNumber: number, activityId: string) => {
    if (editingDay === dayNumber && tempDay) {
      setTempDay({
        ...tempDay,
        activities: tempDay.activities.filter(activity => activity.id !== activityId)
      });
    }
  };
  
  // Update activity field
  const handleUpdateActivity = (dayNumber: number, activityId: string, field: keyof DayActivity, value: any) => {
    if (editingDay === dayNumber && tempDay) {
      setTempDay({
        ...tempDay,
        activities: tempDay.activities.map(activity => 
          activity.id === activityId 
            ? { ...activity, [field]: value } 
            : activity
        )
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {days.map((day) => (
          <AccordionItem key={day.dayNumber} value={`day-${day.dayNumber}`}>
            <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">Day {day.dayNumber}</Badge>
                {day.title}
                
                {/* Meal indicators */}
                <div className="flex ml-3 space-x-1">
                  {day.meals.breakfast && <Badge variant="secondary" className="px-1"><Coffee className="h-3 w-3" /></Badge>}
                  {day.meals.lunch && <Badge variant="secondary" className="px-1"><Utensils className="h-3 w-3" /></Badge>}
                  {day.meals.dinner && <Badge variant="secondary" className="px-1"><Utensils className="h-3 w-3" /></Badge>}
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-4">
              {editingDay === day.dayNumber ? (
                /* Edit mode */
                <Card className="border border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Edit Day {day.dayNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`day-title-${day.dayNumber}`}>Day Title</Label>
                        <Input
                          id={`day-title-${day.dayNumber}`}
                          value={tempDay?.title || ""}
                          onChange={(e) => tempDay && setTempDay({ ...tempDay, title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`day-hotel-${day.dayNumber}`}>Hotel</Label>
                        <Input
                          id={`day-hotel-${day.dayNumber}`}
                          value={tempDay?.hotel || ""}
                          onChange={(e) => tempDay && setTempDay({ ...tempDay, hotel: e.target.value })}
                          className="mt-1"
                          placeholder="Hotel name (optional)"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`day-location-${day.dayNumber}`}>Location</Label>
                      <Input
                        id={`day-location-${day.dayNumber}`}
                        value={tempDay?.location || ""}
                        onChange={(e) => tempDay && setTempDay({ ...tempDay, location: e.target.value })}
                        className="mt-1"
                        placeholder="City or location (optional)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`day-desc-${day.dayNumber}`}>Description</Label>
                      <Textarea
                        id={`day-desc-${day.dayNumber}`}
                        value={tempDay?.description || ""}
                        onChange={(e) => tempDay && setTempDay({ ...tempDay, description: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Included Meals</Label>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`breakfast-${day.dayNumber}`}
                            checked={tempDay?.meals.breakfast || false}
                            onCheckedChange={(checked) => 
                              tempDay && setTempDay({
                                ...tempDay,
                                meals: { ...tempDay.meals, breakfast: !!checked }
                              })
                            }
                          />
                          <Label htmlFor={`breakfast-${day.dayNumber}`}>Breakfast</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`lunch-${day.dayNumber}`}
                            checked={tempDay?.meals.lunch || false}
                            onCheckedChange={(checked) => 
                              tempDay && setTempDay({
                                ...tempDay,
                                meals: { ...tempDay.meals, lunch: !!checked }
                              })
                            }
                          />
                          <Label htmlFor={`lunch-${day.dayNumber}`}>Lunch</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`dinner-${day.dayNumber}`}
                            checked={tempDay?.meals.dinner || false}
                            onCheckedChange={(checked) => 
                              tempDay && setTempDay({
                                ...tempDay,
                                meals: { ...tempDay.meals, dinner: !!checked }
                              })
                            }
                          />
                          <Label htmlFor={`dinner-${day.dayNumber}`}>Dinner</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Activities</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAddActivity(day.dayNumber)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" /> Add Activity
                        </Button>
                      </div>
                      
                      {tempDay?.activities.map((activity, index) => (
                        <div key={activity.id} className="border p-3 rounded-md space-y-3 relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6"
                            onClick={() => handleRemoveActivity(day.dayNumber, activity.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          <div>
                            <Label htmlFor={`activity-name-${activity.id}`}>Activity Name</Label>
                            <Input
                              id={`activity-name-${activity.id}`}
                              value={activity.name}
                              onChange={(e) => handleUpdateActivity(day.dayNumber, activity.id, 'name', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`activity-desc-${activity.id}`}>Description</Label>
                            <Textarea
                              id={`activity-desc-${activity.id}`}
                              value={activity.description || ""}
                              onChange={(e) => handleUpdateActivity(day.dayNumber, activity.id, 'description', e.target.value)}
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`activity-optional-${activity.id}`}
                              checked={activity.isOptional || false}
                              onCheckedChange={(checked) => handleUpdateActivity(day.dayNumber, activity.id, 'isOptional', !!checked)}
                            />
                            <Label htmlFor={`activity-optional-${activity.id}`}>Optional Activity</Label>
                          </div>
                          
                          {activity.isOptional && (
                            <div>
                              <Label htmlFor={`activity-price-${activity.id}`}>Price</Label>
                              <Input
                                id={`activity-price-${activity.id}`}
                                type="number"
                                value={activity.price || ""}
                                onChange={(e) => handleUpdateActivity(day.dayNumber, activity.id, 'price', parseFloat(e.target.value))}
                                className="mt-1"
                                placeholder="Activity price"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={handleSaveDay}
                      >
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* View mode */
                <div className="py-2 space-y-4">
                  <div className="flex justify-between">
                    <p className="text-neutral-600">{day.description}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditDay(day.dayNumber)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </div>
                  
                  {day.location && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-neutral-500 mt-0.5 mr-2" />
                      <p className="text-neutral-600">{day.location}</p>
                    </div>
                  )}
                  
                  {day.hotel && (
                    <div className="flex items-start">
                      <Hotel className="h-4 w-4 text-neutral-500 mt-0.5 mr-2" />
                      <p className="text-neutral-600">{day.hotel}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Label className="mr-2">Meals included:</Label>
                    <div className="flex space-x-2">
                      <Badge variant={day.meals.breakfast ? "default" : "outline"}>Breakfast</Badge>
                      <Badge variant={day.meals.lunch ? "default" : "outline"}>Lunch</Badge>
                      <Badge variant={day.meals.dinner ? "default" : "outline"}>Dinner</Badge>
                    </div>
                  </div>
                  
                  {day.activities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Activities:</h4>
                      <ul className="space-y-3">
                        {day.activities.map((activity) => (
                          <li key={activity.id} className="flex items-start">
                            <Activity className="h-4 w-4 text-neutral-500 mt-0.5 mr-2" />
                            <div>
                              <p className="font-medium flex items-center">
                                {activity.name}
                                {activity.isOptional && (
                                  <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                                )}
                                {activity.isOptional && activity.price && (
                                  <span className="ml-2 text-sm text-neutral-500">
                                    (${activity.price.toFixed(2)})
                                  </span>
                                )}
                              </p>
                              {activity.description && (
                                <p className="text-sm text-neutral-600 mt-1">{activity.description}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}