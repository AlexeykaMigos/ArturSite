import json
import redis
from typing import Optional, Any
from functools import wraps
from ..core.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST if hasattr(settings, 'REDIS_HOST') else 'localhost',
    port=settings.REDIS_PORT if hasattr(settings, 'REDIS_PORT') else 6379,
    db=0,
    decode_responses=True,
    socket_connect_timeout=0.5,
    socket_timeout=0.5,
)


def cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
    return ":".join(key_parts)


def cache_result(ttl: int = 3600):
    """Decorator to cache function results in Redis"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            try:
                cached = redis_client.get(key)
                if cached:
                    return json.loads(cached)
            except Exception:
                pass
            
            result = await func(*args, **kwargs)
            
            try:
                redis_client.setex(key, ttl, json.dumps(result, default=str))
            except Exception:
                pass
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """Invalidate all cache keys matching a pattern"""
    try:
        keys = redis_client.keys(f"*{pattern}*")
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass


def get_cached(key: str) -> Optional[Any]:
    """Get a value from cache"""
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass
    return None


def set_cached(key: str, value: Any, ttl: int = 3600):
    """Set a value in cache"""
    try:
        redis_client.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


def delete_cached(key: str):
    """Delete a value from cache"""
    try:
        redis_client.delete(key)
    except Exception:
        pass
