import csv 
from datetime import datetime
from geopy import distance

point1 = (34.052235, -118.243683)  # Los Angeles
point2 = (40.7128, -74.006) 

def distance_in_miles(point1, point2):
    return distance.distance(point1, point2).miles

if __name__ == "__main__":
    print(distance_in_miles(point1, point2))