from collections import Counter
import re
from typing import List, Dict, Any

def analyze_thoughts(thoughts: List[str]) -> Dict[str, Any]:
    """
    Analyze a list of thoughts to extract insights
    """
    if not thoughts:
        return {
            "total_thoughts": 0,
            "common_words": [],
            "average_length": 0,
            "sentiment": "neutral"
        }
    
    # Basic text processing
    all_text = " ".join(thoughts).lower()
    words = re.findall(r'\b\w+\b', all_text)
    
    # Remove common stop words
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about", "like", "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "would", "should", "could", "ought", "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "i've", "you've", "we've", "they've", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't", "doesn't", "don't", "didn't", "won't", "wouldn't", "shan't", "shouldn't", "can't", "cannot", "couldn't", "mustn't", "let's", "that's", "who's", "what's", "here's", "there's", "when's", "where's", "why's", "how's"}
    filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
    
    # Get word frequency
    word_counts = Counter(filtered_words)
    common_words = word_counts.most_common(5)
    
    # Simple sentiment analysis
    positive_words = {"good", "great", "happy", "positive", "excellent", "wonderful", "amazing", "love", "enjoy", "nice", "fun", "peaceful", "calm", "relaxed"}
    negative_words = {"bad", "sad", "negative", "terrible", "awful", "horrible", "hate", "dislike", "angry", "upset", "stressed", "anxious", "worried", "tired"}
    
    positive_count = sum(1 for word in filtered_words if word in positive_words)
    negative_count = sum(1 for word in filtered_words if word in negative_words)
    
    if positive_count > negative_count:
        sentiment = "positive"
    elif negative_count > positive_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Calculate average thought length
    avg_length = sum(len(thought) for thought in thoughts) / len(thoughts)
    
    return {
        "total_thoughts": len(thoughts),
        "common_words": common_words,
        "average_length": round(avg_length, 1),
        "sentiment": sentiment
    }
