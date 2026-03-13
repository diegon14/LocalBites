from datetime import datetime
from zoneinfo import ZoneInfo

def is_open(current_time: datetime, hours_string: str) -> bool:
    """
    Check if a given datetime is within the opening hours specified in the string.
    Args:
        current_time: datetime object with timezone
        hours_string: String with format like "Mo-Fr 11:00-21:00; Sa 09:00-21:00"
    """
    
    # If no hours specified or empty string, assume it's open
    if not hours_string or hours_string.strip() == "":
        return True
    
    # Convert full day names to abbreviations if needed
    day_map = {
        "Mon": "Mo", "Tue": "Tu", "Wed": "We", "Thu": "Th", "Fri": "Fr", "Sat": "Sa", "Sun": "Su",
        "Monday": "Mo", "Tuesday": "Tu", "Wednesday": "We", "Thursday": "Th", "Friday": "Fr", "Saturday": "Sa", "Sunday": "Su"
    }
    
    # Get current day and convert to our format (Mo, Tu, etc.)
    current_day_full = current_time.strftime("%a")  # Returns Mon, Tue, etc.
    current_day = day_map.get(current_day_full, current_day_full[:2])  # Convert to Mo, Tu or take first 2 chars
    current_time_only = current_time.time()
    
    # Parse each rule (split by semicolon)
    for rule in hours_string.split(';'):
        rule = rule.strip()
        if not rule:
            continue
            t
        parts = rule.rsplit(' ', 1)
        if len(parts) != 2:
            continue
            
        days_part, time_part = parts
        
        # Split time part
        time_parts = time_part.split('-')
        if len(time_parts) != 2:
            continue
            
        start_time_str, end_time_str = time_parts
        
        try:
            # Parse times
            start_time = datetime.strptime(start_time_str.strip(), "%H:%M").time()
            end_time = datetime.strptime(end_time_str.strip(), "%H:%M").time()
        except ValueError:
            continue
        
        # Check if current day is in the days part
        if _day_matches(current_day, days_part):
            # Check if current time is within range
            if start_time <= current_time_only <= end_time:
                return True
    return False

def _day_matches(current_day: str, days_pattern: str) -> bool:
    """Check if current day matches a day pattern (e.g., 'Mo-Fr' or 'Sa')"""
    days_order = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    days_pattern = days_pattern.strip()
    
    try:
        if '-' in days_pattern:
            # Handle range like "Mo-Fr"
            start_day, end_day = days_pattern.split('-')
            start_day = start_day.strip()
            end_day = end_day.strip()
            
            start_idx = days_order.index(start_day)
            end_idx = days_order.index(end_day)
            current_idx = days_order.index(current_day)
            
            if start_idx <= end_idx:
                # Normal range (e.g., Mo-Fr)
                return start_idx <= current_idx <= end_idx
            else:
                # Range that wraps around week (e.g., Fr-Mo)
                return current_idx >= start_idx or current_idx <= end_idx
        else:
            # Handle single day like "Sa"
            return current_day == days_pattern.strip()
    except ValueError:
        return False