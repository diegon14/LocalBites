import re

def calculate_price_score(restaurant_price: int, user_price_range: int) -> float:
    """
    Calculate score based on price range preference.
    Returns a multiplier between 0.5 and 1.5
    - Exact match or within range: 1.5x
    - Close to range (off by 1): 1.0x
    - Far from range: 0.5x
    """
    # no preferred price range
    if not user_price_range:
        return 1.0
    
    # If restaurant price is w
    if restaurant_price == user_price_range:
        return 1.5
    
    # off by one price range
    if restaurant_price + 1 == user_price_range or restaurant_price - 1 == user_price_range:
        return 1.0

    # far off price range
    return 0.5


def calculate_distance_score(distance_miles: float, max_distance_miles: int) -> float:
    """
    Calculate score based on distance.
    Returns a value between 0 and 1, with closer = higher score.
    """
    if not max_distance_miles or max_distance_miles <= 0:
        # If no max distance, normalize based on typical range (0-5 miles)
        normalized_distance = min(distance_miles / 5.0, 1.0)
    else:
        # Normalize based on max allowed distance
        normalized_distance = min(distance_miles / max_distance_miles, 1.0)
    
    return max(0, 1 - (normalized_distance ** 0.7))


def tokenize(text: str):
    """Lowercase, split into alphanumeric tokens."""
    if not text:
        return []
    return re.findall(r"[a-z0-9]+", text.lower())


def calculate_text_match_score(restaurant: dict, query_tokens: list[str]) -> float:
    """
    Calculate score boost from text matching in name and cuisine.
    Returns a multiplier between 1.0 and 2.0
    """
    if not query_tokens:
        return 1.0
    
    name_tokens = set(tokenize(restaurant.get("name", "")))
    cuisine_tokens = set(tokenize(restaurant.get("cuisine", "")))
    
    # Count matches in name and cuisine
    name_matches = sum(1 for t in query_tokens if t in name_tokens)
    cuisine_matches = sum(1 for t in query_tokens if t in cuisine_tokens)
    
    # Calculate boost (max 2.0x for strong matches)
    boost = 1.0
    if name_matches > 0:
        boost += min(0.5 * name_matches, 0.8)  # Up to 0.8x boost from name
    if cuisine_matches > 0:
        boost += min(0.2 * cuisine_matches, 0.3)  # Up to 0.3x boost from cuisine
    
    return min(boost, 2.0)

def calculate_cuisine_score(restaurant_cuisine: str, preferred_cuisine: str) -> float:
    """
    Calculate score boost for cuisine preference.
    Returns a multiplier between 1.0 and 1.5
    """
    if not preferred_cuisine:
        return 1.0
    
    restaurant_cuisine_lower = (restaurant_cuisine or "").lower()
    preferred_cuisine_lower = preferred_cuisine.strip().lower()
    
    # Exact match
    if preferred_cuisine_lower in restaurant_cuisine_lower:
        return 1.5
    elif any(word in restaurant_cuisine_lower for word in preferred_cuisine_lower.split()):
        return 1.2
    
    # no match
    return 1.0