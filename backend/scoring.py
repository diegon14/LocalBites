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

def _levenshtein(a: str, b: str) -> int:
    """Compute the Levenshtein (edit) distance between two strings."""
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    # Use two-row DP for memory efficiency
    prev = list(range(len(b) + 1))
    curr = [0] * (len(b) + 1)
    for i, ca in enumerate(a, 1):
        curr[0] = i
        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            curr[j] = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
        prev, curr = curr, prev
    return prev[len(b)]

def _fuzzy_match_score(query_token: str, candidate_tokens: set[str]) -> float:
    """
    Return a similarity score [0.0, 1.0] for the best match between a query
    token and a set of candidate tokens.
 
    Scoring tiers:
      1.0  — exact match
      0.85 — one edit away  (good for typos, e.g. "burgr" → "burger")
      0.6  — two edits away (allowed only for longer words, len >= 6)
      0.0  — no close match
    """
    if query_token in candidate_tokens:
        return 1.0
 
    best = 0.0
    qt_len = len(query_token)
    for ct in candidate_tokens:
        dist = _levenshtein(query_token, ct)
        if dist == 1:
            best = max(best, 0.85)
        elif dist == 2 and qt_len >= 6:
            best = max(best, 0.6)
        if best == 1.0:
            break  # can't do better
    return best

def calculate_text_match_score(restaurant: dict, query_tokens: list[str]) -> float:
    """
    Calculate score boost from text matching in name and cuisine.
    Returns a multiplier between 1.0 and 2.0
    """
    if not query_tokens:
        return 1.0
    
    name_tokens = set(tokenize(restaurant.get("name", "")))
    cuisine_tokens = set(tokenize(restaurant.get("cuisine", "")))
    
    name_score = 0.0
    cuisine_score = 0.0
    
    for qt in query_tokens:
        name_sim = _fuzzy_match_score(qt, name_tokens)
        cuisine_sim = _fuzzy_match_score(qt, cuisine_tokens)
        name_score += 0.5 * name_sim
        cuisine_score += 0.2 * cuisine_sim

    boost = 1.0 + min(name_score, 0.8) + min(cuisine_score, 0.3)
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